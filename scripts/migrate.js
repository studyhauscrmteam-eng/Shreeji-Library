/**
 * One-time migration to the canonical schema described in
 *   docs/FLOW-AND-DATA-SPEC.md
 *
 * SAFETY
 *   - Dry-run by default. NOTHING is written unless you pass --apply.
 *   - Never deletes a student record. Merges set `mergedInto` + `needsReview`.
 *   - Re-runnable (idempotent): every step skips work already done.
 *   - Take a backup first:  node scripts/backup-firestore.js
 *
 * USAGE
 *   node scripts/migrate.js                       # dry run
 *   node scripts/migrate.js --apply               # write changes
 *   node scripts/migrate.js --only=seats-rekey    # one step
 *   node scripts/migrate.js --apply --only=uniqueness-build
 *
 * STEPS
 *   seats-rekey        seats/{autoId}            -> seats/{seatNumber}
 *   docs-link          fix studentDocuments.studentId
 *   admissions-pending move pending admissions   -> students (approvalStatus Pending)
 *   students-id        fill missing studentId    (SH-xxxx)
 *   students-review    flag/merge exact duplicates (same name + same phone)
 *   plans-seatpref     make seatPreference an explicit boolean
 *   payments-normalize unify payment statuses, fix missing studentId
 *   uniqueness-build   rebuild the uniqueness/* claim index
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'server', 'serviceAccountKey.json');

/* ------------------------------------------------------------------ args */
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const onlyArg = argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',').map((s) => s.trim()) : null;

const ALL_STEPS = [
  'seats-rekey',
  'docs-link',
  'admissions-pending',
  'students-id',
  'students-review',
  'plans-seatpref',
  'payments-normalize',
  'uniqueness-build',
];

const enabled = (step) => (!ONLY || ONLY.includes(step));

/* -------------------------------------------------------------- helpers */
const changes = [];
let writeCount = 0;

function log(step, msg) {
  console.log(`  [${step}] ${msg}`);
}
function record(step, action, pathRef, detail) {
  changes.push({ step, action, path: pathRef, detail: detail || '' });
  writeCount++;
}
function str(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v.__type) return String(v.value);
  return String(v).trim();
}
function normPhone(p) {
  let d = str(p).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}
function normEmail(e) {
  return str(e).toLowerCase();
}
function normName(n) {
  return str(n).toLowerCase().replace(/\s+/g, ' ').trim();
}
function toMillis(v) {
  if (!v) return 0;
  if (typeof v === 'object' && v.toMillis) return v.toMillis();
  if (typeof v === 'object' && v.__type === 'timestamp') return Date.parse(v.value) || 0;
  if (typeof v === 'string') return Date.parse(v) || 0;
  return 0;
}
const looksLikeUid = (s) => /^[A-Za-z0-9_-]{20,}$/.test(s);

/* ------------------------------------------------------------------ boot */
function init() {
  if (!fs.existsSync(KEY_PATH)) throw new Error(`Missing ${KEY_PATH}`);
  const creds = require(KEY_PATH);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(creds), projectId: creds.project_id });
  }
  return { db: admin.firestore(), auth: admin.auth(), projectId: creds.project_id };
}

async function readAll(db) {
  const roots = await db.listCollections();
  const out = new Map();
  for (const root of roots) {
    let last = null;
    for (;;) {
      let q = root.orderBy('__name__').limit(400);
      if (last) q = q.startAfter(last);
      const s = await q.get();
      if (s.empty) break;
      s.docs.forEach((d) => out.set(d.ref.path, d));
      last = s.docs[s.docs.length - 1];
      if (s.docs.length < 400) break;
    }
  }
  return out;
}

/* --------------------------------------------------------------- writing */
// Buffered batch writer so we never exceed the 500-op batch limit.
class Writer {
  constructor(db) {
    this.db = db;
    this.batch = db.batch();
    this.n = 0;
    this.applied = 0;
  }
  set(ref, data, opts) {
    this.batch.set(ref, data, opts);
    this.n++;
    if (this.n >= 450) return this.flush();
    return null;
  }
  update(ref, data) {
    this.batch.update(ref, data);
    this.n++;
    if (this.n >= 450) return this.flush();
    return null;
  }
  delete(ref) {
    this.batch.delete(ref);
    this.n++;
    if (this.n >= 450) return this.flush();
    return null;
  }
  async flush() {
    if (!this.n) return 0;
    const n = this.n;
    const pending = this.batch;   // commit the batch that actually holds the ops
    this.batch = this.db.batch();
    this.n = 0;
    if (APPLY) {
      await pending.commit();
      this.applied += n;
    }
    return n;
  }
}

/* ============================================================ STEP: seats-rekey */
async function stepSeatsRekey({ db, docs }, W) {
  console.log('\nSTEP seats-rekey  (seats/{autoId} -> seats/{seatNumber})');
  const seats = [...docs.values()].filter((d) => d.ref.parent.path === 'seats');
  const byNumber = new Map();
  for (const s of seats) {
    const num = str(s.data().seatNumber);
    if (!num) {
      log('seats-rekey', `SKIP ${s.ref.path} has no seatNumber`);
      continue;
    }
    const key = num.toUpperCase();
    if (!byNumber.has(key)) byNumber.set(key, []);
    byNumber.get(key).push(s);
  }

  let rekeyed = 0;
  let dupeSeen = 0;
  for (const [num, list] of byNumber) {
    // Prefer a doc already at the canonical id; otherwise the oldest.
    const canonical = list.find((d) => d.id === num)
      || list.slice().sort((a, b) => toMillis(a.data().lastUpdated) - toMillis(b.data().lastUpdated))[0];
    const rest = list.filter((d) => d.ref.path !== canonical.ref.path);

    // 1) The survivor is written to the canonical id FIRST, so any later
    //    update() on that same doc inside this batch is guaranteed to land.
    if (canonical.ref.path !== `seats/${num}`) {
      record('seats-rekey', 'MIGRATE', canonical.ref.path, `-> seats/${num}`);
      log('seats-rekey', `${canonical.ref.path} -> seats/${num}`);
      W.set(db.doc(`seats/${num}`), {
        ...canonical.data(),
        seatNumber: num,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      W.delete(canonical.ref);
      dupeSeen++;
    }

    // 2) Any duplicate doc for the same seat number is folded in, then retired.
    for (const s of rest) {
      const sdata = s.data();
      const cdata = canonical.data();
      if (str(cdata.assignedStudentId) === '' && str(sdata.assignedStudentId) !== '') {
        W.update(db.doc(`seats/${num}`), {
          status: sdata.status,
          assignedStudentId: sdata.assignedStudentId || '',
          assignedStudentName: sdata.assignedStudentName || '',
          planType: sdata.planType || '',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      record('seats-rekey', 'MERGE-DUP', s.ref.path, `folded into seats/${num}`);
      log('seats-rekey', `DUPLICATE ${s.ref.path} folded into seats/${num}`);
      W.delete(s.ref);
      dupeSeen++;
    }
    rekeyed++;
  }
  log('seats-rekey', `${rekeyed} distinct seat numbers, ${dupeSeen} doc(s) moved/folded`);
}

/* ============================================================ STEP: docs-link */
async function stepDocsLink({ docs }, W) {
  console.log('\nSTEP docs-link  (studentDocuments.studentId must equal the student doc id)');
  const studentIds = new Set([...docs.keys()].filter((p) => p.startsWith('students/')).map((p) => p.split('/')[1]));
  const sdocs = [...docs.values()].filter((d) => d.ref.parent.path === 'studentDocuments');
  let fixed = 0;
  for (const d of sdocs) {
    const cur = str(d.data().studentId);
    // Only fill in a blank pointer. If the field already names some student we
    // do NOT silently re-point identity documents (Aadhaar/selfie) — flag instead.
    if (cur) {
      if (studentIds.has(cur)) continue;
      record('docs-link', 'FLAG', d.ref.path, `studentId "${cur}" matches no student — NOT re-pointed`);
      log('docs-link', `REVIEW ${d.ref.path}: studentId "${cur}" matches no student. Left as-is for admin.`);
      continue;
    }
    if (studentIds.has(d.id)) {
      record('docs-link', 'FIX', d.ref.path, `studentId -> ${d.id}`);
      log('docs-link', `${d.ref.path}: studentId "" -> "${d.id}"`);
      W.update(d.ref, { studentId: d.id, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      fixed++;
    } else {
      record('docs-link', 'FLAG', d.ref.path, `orphan: no student ${d.id}`);
      log('docs-link', `ORPHAN ${d.ref.path} — no matching student. Left untouched for admin review.`);
    }
  }
  log('docs-link', `${fixed} linked, ${sdocs.length - fixed} untouched`);
}

/* ================================================ STEP: admissions-pending */
async function stepAdmissionsPending({ docs }, W) {
  console.log('\nSTEP admissions-pending  (retire `admissions` as a store; pending rows become students)');
  const admissions = [...docs.values()].filter((d) => d.ref.parent.path === 'admissions');
  let moved = 0;
  for (const a of admissions) {
    const data = a.data();
    const status = str(data.status);
    const appr = str(data.approvalStatus);
    if (status !== 'Pending' && appr !== 'Pending') continue; // history stays put

    // Already migrated?
    if (docs.has(`students/${a.id}`)) {
      W.update(a.ref, { migratedToStudents: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      record('admissions-pending', 'SKIP-ALREADY', a.ref.path, '');
      continue;
    }

    const payload = { ...data };
    // The website stamped an anonymous auth uid - it is NOT a usable login.
    if (looksLikeUid(str(payload.uid)) === false || str(payload.uid) === '') delete payload.uid;
    delete payload.userId;
    payload.role = 'Student';
    payload.status = 'Pending';
    payload.approvalStatus = 'Pending';
    payload.source = str(payload.source) || 'Website';
    payload.isStudentSubmission = true;
    payload.approvalMigratedFrom = a.ref.path;
    payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    record('admissions-pending', 'CONVERT', a.ref.path, `-> students/${a.id}`);
    log('admissions-pending', `${a.ref.path} (status=${status}) -> students/${a.id}`);
    const target = db_doc(`students/${a.id}`);
    W.set(target, payload);
    // Make later steps see this document as if it had been read from Firestore.
    docs.set(`students/${a.id}`, { ref: target, id: a.id, data: () => payload });
    W.update(a.ref, { migratedToStudents: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    moved++;
  }
  log('admissions-pending', `${moved} pending application(s) converted; rejected history untouched`);
}
const db_doc = (p) => admin.firestore().doc(p);

/* ============================================================ STEP: students-id */
async function stepStudentsId({ db, docs }, W) {
  console.log('\nSTEP students-id  (fill missing studentId SH-xxxx)');
  const students = [...docs.values()]
    .filter((d) => d.ref.parent.path === 'students')
    .filter((d) => !str(d.data().mergedInto));

  const existing = new Set();
  let maxNum = 0;
  for (const s of students) {
    const sid = str(s.data().studentId) || str(s.data().admissionNo);
    if (sid) {
      existing.add(sid);
      const m = sid.match(/(\d+)\s*$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    }
  }

  const counterRef = db.doc('counters/students');
  const counterSnap = await counterRef.get();
  let next = counterSnap.exists ? Number(counterSnap.data().next || 1) : 1;
  next = Math.max(next, maxNum + 1);

  const missing = students.filter((s) => !str(s.data().studentId) && !str(s.data().admissionNo));
  // oldest first so IDs follow join order
  missing.sort((a, b) => toMillis(a.data().createdAt) - toMillis(b.data().createdAt));

  log('students-id', `${missing.length} student(s) missing an ID; starting at SH-${String(next).padStart(4, '0')}`);
  for (const s of missing) {
    const sid = `SH-${String(next).padStart(4, '0')}`;
    record('students-id', 'ASSIGN', s.ref.path, sid);
    W.update(s.ref, {
      studentId: sid,
      admissionNo: str(s.data().admissionNo) || sid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    next++;
  }
  record('students-id', 'COUNTER', 'counters/students', String(next));
  W.update(counterRef, { next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  log('students-id', `counter -> ${next}`);
}

/* ========================================================== STEP: students-review */
async function stepStudentsReview({ docs }, W) {
  console.log('\nSTEP students-review  (flag/merge exact duplicates — NEVER deletes)');
  const students = [...docs.values()].filter((d) => d.ref.parent.path === 'students');

  // Exact duplicate = same normalized name AND same normalized phone.
  const groups = new Map();
  for (const s of students) {
    const d = s.data();
    if (str(d.mergedInto)) continue;
    const p = normPhone(d.phone);
    const n = normName(d.name);
    if (!p || !n) continue;
    const key = `${n}|${p}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  let merged = 0;
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    // Survivor = Active, then newest; everything else is retired, not deleted.
    const rank = (s) => {
      const st = str(s.data().status);
      if (st === 'Active') return 3;
      if (st === 'Pending') return 2;
      if (st === 'Old' || st === 'Inactive') return 1;
      return 0;
    };
    const sorted = list.slice().sort((a, b) => rank(b) - rank(a) || toMillis(b.data().createdAt) - toMillis(a.data().createdAt));
    const survivor = sorted[0];
    for (const loser of sorted.slice(1)) {
      record('students-review', 'MERGE', loser.ref.path, `mergedInto ${survivor.ref.path}`);
      log('students-review', `${loser.ref.path} ("${str(loser.data().name)}") -> mergedInto ${survivor.ref.path}`);
      W.update(loser.ref, {
        mergedInto: survivor.ref.path,
        needsReview: true,
        status: str(loser.data().status) === 'Active' ? 'Old' : str(loser.data().status),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      merged++;
    }
  }

  // Same phone but different person (real family members) -> flag only.
  const byPhone = new Map();
  for (const s of students) {
    const p = normPhone(s.data().phone);
    if (!p) continue;
    if (!byPhone.has(p)) byPhone.set(p, []);
    byPhone.get(p).push(s);
  }
  let flagged = 0;
  for (const [p, list] of byPhone) {
    if (list.length < 2) continue;
    const names = new Set(list.map((s) => normName(s.data().name)));
    if (names.size < 2) continue; // already handled as an exact dup
    for (const s of list) {
      if (str(s.data().mergedInto) || s.data().needsReview === true) continue;
      record('students-review', 'FLAG', s.ref.path, `shared phone ${p}, different names`);
      W.update(s.ref, { needsReview: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      flagged++;
    }
    log('students-review', `phone ${p}: ${list.length} different people share it — flagged for admin, NOT merged`);
  }
  log('students-review', `${merged} marked mergedInto, ${flagged} flagged needsReview, 0 deleted`);
}

/* =========================================================== STEP: plans-seatpref */
async function stepPlansSeatPref({ docs }, W) {
  console.log('\nSTEP plans-seatpref  (seatPreference must be an explicit boolean)');
  const plans = [...docs.values()].filter((d) => d.ref.parent.path === 'membershipPlans');
  let fixed = 0;
  for (const p of plans) {
    const v = p.data().seatPreference;
    if (v === true || v === false) continue;
    record('plans-seatpref', 'SET', p.ref.path, 'seatPreference=false');
    log('plans-seatpref', `${p.ref.path} "${str(p.data().planName)}" seatPreference ${String(v)} -> false`);
    W.update(p.ref, { seatPreference: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    fixed++;
  }
  log('plans-seatpref', `${fixed} plan(s) normalised (${plans.length - fixed} already explicit)`);
}

/* ====================================================== STEP: payments-normalize */
async function stepPaymentsNormalize({ docs }, W) {
  console.log('\nSTEP payments-normalize  (one status vocabulary, one owner per row)');
  const payments = [...docs.values()].filter((d) => d.ref.parent.path === 'payments');
  const studentIds = new Set([...docs.keys()].filter((p) => p.startsWith('students/')).map((p) => p.split('/')[1]));
  const STATUS_MAP = { Completed: 'approved', Approved: 'approved', Completed_Imported: 'approved', Pending: 'pending', Rejected: 'rejected' };
  let fixedStatus = 0;
  let flagged = 0;

  for (const p of payments) {
    const d = p.data();
    const upd = {};
    const st = str(d.status);
    if (STATUS_MAP[st]) {
      upd.status = STATUS_MAP[st];
      record('payments-normalize', 'STATUS', p.ref.path, `${st} -> ${STATUS_MAP[st]}`);
      fixedStatus++;
    }
    // Derive owner from the legacy doc id pattern pay_due_<phone> / pay_inc_<phone>
    if (!str(d.studentId)) {
      const m = p.id.match(/^(?:pay_due|pay_inc)_(\d{10})/);
      if (m) {
        const owner = [...studentIds].find((sid) => {
          const sdoc = docs.get(`students/${sid}`);
          return sdoc && normPhone(sdoc.data().phone) === m[1];
        });
        if (owner) {
          upd.studentId = owner;
          record('payments-normalize', 'LINK', p.ref.path, `studentId -> ${owner}`);
        } else {
          record('payments-normalize', 'FLAG', p.ref.path, `no student for phone ${m[1]}`);
          upd.needsReview = true;
          flagged++;
        }
      } else {
        record('payments-normalize', 'FLAG', p.ref.path, 'no studentId, id pattern unknown');
        upd.needsReview = true;
        flagged++;
      }
    }
    if (Object.keys(upd).length) {
      upd.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      W.update(p.ref, upd);
    }
  }
  log('payments-normalize', `${fixedStatus} status normalised, ${flagged} flagged, ${payments.length - fixedStatus} untouched`);
}

/* ====================================================== STEP: uniqueness-build */
async function stepUniquenessBuild({ docs }, W) {
  console.log('\nSTEP uniqueness-build  (rebuild uniqueness/* claims)');
  const students = [...docs.values()]
    .filter((d) => d.ref.parent.path === 'students')
    .filter((d) => !str(d.data().mergedInto));

  const seenEmail = new Map();
  const seenTxn = new Map();
  const phoneIndex = new Map();
  let emails = 0;
  let txns = 0;

  for (const s of students) {
    const d = s.data();

    // --- phone index (NOT a uniqueness block: families share one number) ---
    const ph = normPhone(d.phone);
    if (ph) {
      if (!phoneIndex.has(ph)) phoneIndex.set(ph, []);
      phoneIndex.get(ph).push(s.ref.path);
    }

    const e = normEmail(d.email);
    if (e) {
      if (seenEmail.has(e)) {
        // two people legitimately share an email? keep the first, flag the rest
        record('uniqueness-build', 'CONFLICT', `uniqueness/email_${e}`, `${s.ref.path} vs ${seenEmail.get(e)}`);
        log('uniqueness-build', `email ${e} used by ${seenEmail.get(e)} and ${s.ref.path} — flagged, not claimed`);
      } else {
        seenEmail.set(e, s.ref.path);
        W.set(db_doc(`uniqueness/email_${e}`), {
          kind: 'email',
          ownerPath: s.ref.path,
          uid: str(d.uid) || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        record('uniqueness-build', 'CLAIM', `uniqueness/email_${e}`, s.ref.path);
        emails++;
      }
    }
    const t = str(d.transactionId);
    // "rc-imp" is a bulk-import sentinel, not a real UPI reference.
    if (t && t !== 'rc-imp') {
      const key = t.toLowerCase();
      if (!seenTxn.has(key)) {
        seenTxn.set(key, s.ref.path);
        W.set(db_doc(`uniqueness/txn_${key}`), {
          kind: 'transactionId',
          ownerPath: s.ref.path,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        record('uniqueness-build', 'CLAIM', `uniqueness/txn_${key}`, s.ref.path);
        txns++;
      }
    }
  }

  // Payment-side transaction ids
  for (const p of [...docs.values()].filter((d) => d.ref.parent.path === 'payments')) {
    const t = str(p.data().transactionId);
    if (!t || t === 'rc-imp') continue;
    const key = t.toLowerCase();
    if (seenTxn.has(key)) continue;
    seenTxn.set(key, p.ref.path);
    W.set(db_doc(`uniqueness/txn_${key}`), {
      kind: 'transactionId',
      ownerPath: p.ref.path,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    record('uniqueness-build', 'CLAIM', `uniqueness/txn_${key}`, p.ref.path);
    txns++;
  }

  // Phone index: lets signup find an existing record for a returning student
  // and ADOPT it instead of creating a duplicate. Multiple owners are allowed.
  let phoneDocs = 0;
  for (const [ph, owners] of phoneIndex) {
    W.set(db_doc(`uniqueness/phone_${ph}`), {
      kind: 'phone-index',
      owners,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    record('uniqueness-build', 'INDEX', `uniqueness/phone_${ph}`, owners.join(', '));
    phoneDocs++;
  }

  log('uniqueness-build', `${emails} email claim(s), ${txns} transaction-id claim(s), ${phoneDocs} phone index entry(ies)`);
}

/* ------------------------------------------------------------------ main */
async function main() {
  const ctx = init();
  console.log(`Project : ${ctx.projectId}`);
  console.log(`Mode    : ${APPLY ? '*** APPLY — writing to Firestore ***' : 'DRY RUN (no writes). Re-run with --apply'}`);
  if (ONLY) console.log(`Steps   : ${ONLY.join(', ')}`);

  console.log('\nReading Firestore...');
  const docs = await readAll(ctx.db);
  console.log(`Loaded ${docs.size} documents.`);

  const W = new Writer(ctx.db);
  const ctx2 = { db: ctx.db, auth: ctx.auth, projectId: ctx.projectId, docs };

  if (enabled('seats-rekey')) await stepSeatsRekey(ctx2, W);
  if (enabled('docs-link')) await stepDocsLink(ctx2, W);
  if (enabled('admissions-pending')) await stepAdmissionsPending(ctx2, W);
  if (enabled('students-id')) await stepStudentsId(ctx2, W);
  if (enabled('students-review')) await stepStudentsReview(ctx2, W);
  if (enabled('plans-seatpref')) await stepPlansSeatPref(ctx2, W);
  if (enabled('payments-normalize')) await stepPaymentsNormalize(ctx2, W);
  if (enabled('uniqueness-build')) await stepUniquenessBuild(ctx2, W);

  const flushed = await W.flush();

  console.log('\n' + '='.repeat(70));
  console.log(`Planned changes : ${changes.length}`);
  if (APPLY) {
    console.log(`Committed ops   : ${W.applied}${flushed ? '' : ''}`);
    console.log('MODE            : APPLIED');
  } else {
    console.log('MODE            : DRY RUN — nothing was written');
    console.log('To write these changes run:  node scripts/migrate.js --apply');
  }
  console.log('='.repeat(70));

  // Summary by action type
  const byAction = {};
  changes.forEach((c) => { byAction[c.action] = (byAction[c.action] || 0) + 1; });
  console.log('\nBy action:');
  Object.keys(byAction).sort().forEach((k) => console.log(`  ${String(byAction[k]).padStart(5)}  ${k}`));

  // Write a change log next to the backups for auditability
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(__dirname, '..', 'backup', `migration-${APPLY ? 'APPLIED' : 'dryrun'}-${ts}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ applied: APPLY, at: new Date().toISOString(), changes }, null, 2), 'utf8');
  console.log(`\nChange log -> ${outFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('\nMIGRATION FAILED');
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  });
