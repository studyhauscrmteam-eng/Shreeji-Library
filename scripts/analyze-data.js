/**
 * Read-only analysis of a Firestore backup produced by backup-firestore.js.
 * Runs against the local JSON only - touches nothing in the cloud.
 *
 * Usage: node scripts/analyze-data.js [path-to-backup.json]
 */
const fs = require('fs');
const path = require('path');

function findBackup(explicit) {
  if (explicit) return path.resolve(explicit);
  const dir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(dir)) throw new Error('No backup/ directory. Run: node scripts/backup-firestore.js');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('firestore-') && f.endsWith('.json'));
  if (!files.length) throw new Error('No backup JSON found. Run: node scripts/backup-firestore.js');
  files.sort();
  return path.join(dir, files[files.length - 1]);
}

const file = findBackup(process.argv[2]);
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
const docs = backup.documents;

console.log(`Backup: ${path.basename(file)}`);
console.log(`Exported: ${backup.meta.exportedAt}  Documents: ${docs.length}`);
console.log('');

const byPath = new Map(docs.map((d) => [d.path, d]));
const inColl = (name) => docs.filter((d) => d.parent === name);
const val = (d, k) => (d.data ? d.data[k] : undefined);
const unwrap = (v) =>
  v && typeof v === 'object' && v.__type === 'timestamp' ? String(v.value) : v;
const str = (v) => {
  v = unwrap(v);
  return v === undefined || v === null ? '' : String(v).trim();
};
const normPhone = (p) => str(p).replace(/\D/g, '').replace(/^0/, '').replace(/^91(?=\d{10}$)/, '');
const normEmail = (e) => str(e).toLowerCase();

const line = (ch = '-') => console.log(ch.repeat(78));

/* ---------------- students ---------------- */
line('=');
console.log('STUDENTS');
line('=');
const students = inColl('students');
console.log(`total: ${students.length}`);

const looksUid = (s) => /^[A-Za-z0-9_-]{20,}$/.test(s);
const withUid = students.filter((s) => str(val(s, 'uid')));
const uidIsAuthUid = withUid.filter((s) => looksUid(str(val(s, 'uid'))));
const uidNotAuth = withUid.filter((s) => !looksUid(str(val(s, 'uid'))));
console.log(`  with uid field          : ${withUid.length}`);
console.log(`    ...uid looks like real auth uid : ${uidIsAuthUid.length}`);
console.log(`    ...uid is NOT an auth uid (bogus): ${uidNotAuth.length}`);
console.log(`  without uid field       : ${students.length - withUid.length}`);
if (uidNotAuth.length) {
  console.log('  bogus uid samples:');
  uidNotAuth.slice(0, 5).forEach((s) => console.log(`    ${s.path} -> uid=${val(s, 'uid')} name=${val(s, 'name')}`));
}

const authAccounts = new Set(inColl('users').map((d) => d.id));
console.log(`  users/ auth docs        : ${authAccounts.length} -> ${[...authAccounts].join(', ')}`);

// doc id vs uid agreement
const idMatchesUid = students.filter((s) => str(val(s, 'uid')) && s.id === str(val(s, 'uid')));
console.log(`  doc id === uid          : ${idMatchesUid.length}`);

// duplicates by phone
const byPhone = new Map();
students.forEach((s) => {
  const p = normPhone(val(s, 'phone'));
  if (!p) return;
  if (!byPhone.has(p)) byPhone.set(p, []);
  byPhone.get(p).push(s);
});
const dupPhones = [...byPhone.entries()].filter(([, v]) => v.length > 1);
console.log(`  unique normalized phones: ${byPhone.size}`);
console.log(`  PHONES WITH >1 STUDENT  : ${dupPhones.length}`);
dupPhones.forEach(([p, list]) => {
  console.log(`    phone ${p} -> ${list.length} docs`);
  list.forEach((s) => console.log(`       ${s.path.padEnd(26)} name=${str(val(s, 'name')).padEnd(20)} status=${val(s, 'status')} appr=${val(s, 'approvalStatus')} plan=${str(val(s, 'planName')).slice(0, 18)} seat=${val(s, 'seatNumber')} created=${str(val(s, 'createdAt')).slice(0, 24)}`));
});

// duplicates by email
const byEmail = new Map();
students.forEach((s) => {
  const e = normEmail(val(s, 'email'));
  if (!e) return;
  if (!byEmail.has(e)) byEmail.set(e, []);
  byEmail.get(e).push(s);
});
const dupEmails = [...byEmail.entries()].filter(([, v]) => v.length > 1);
console.log(`  EMAILS WITH >1 STUDENT  : ${dupEmails.length}`);
dupEmails.forEach(([e, list]) => console.log(`    ${e} -> ${list.map((s) => s.path).join(', ')}`));

// statuses
const count = (arr, key) => {
  const m = {};
  arr.forEach((s) => {
    const k = str(val(s, key)) || '(missing)';
    m[k] = (m[k] || 0) + 1;
  });
  return m;
};
console.log(`  status        : ${JSON.stringify(count(students, 'status'))}`);
console.log(`  approvalStatus: ${JSON.stringify(count(students, 'approvalStatus'))}`);
console.log(`  role          : ${JSON.stringify(count(students, 'role'))}`);
console.log(`  has loginId   : ${students.filter((s) => str(val(s, 'loginId'))).length}`);
console.log(`  has password  : ${students.filter((s) => str(val(s, 'loginPassword'))).length}`);
console.log(`  has studentId : ${students.filter((s) => str(val(s, 'studentId'))).length}`);

// studentId duplicates
const bySid = new Map();
students.forEach((s) => {
  const k = str(val(s, 'studentId'));
  if (!k) return;
  if (!bySid.has(k)) bySid.set(k, []);
  bySid.get(k).push(s);
});
const dupSids = [...bySid.entries()].filter(([, v]) => v.length > 1);
console.log(`  DUPLICATE studentId (SH-xxxx): ${dupSids.length}`);
dupSids.forEach(([k, list]) => console.log(`    ${k} -> ${list.map((s) => s.path).join(', ')}`));

// seats referenced by students
const studentSeats = {};
students.forEach((s) => {
  const k = str(val(s, 'seatNumber'));
  if (k) studentSeats[k] = (studentSeats[k] || 0) + 1;
});
const dupStudentSeats = Object.entries(studentSeats).filter(([, c]) => c > 1);
console.log(`  SEAT CLAIMED BY >1 STUDENT: ${dupStudentSeats.length}`);
dupStudentSeats.forEach(([k, c]) => console.log(`    seat ${k} -> ${c} students`));

/* ---------------- admissions ---------------- */
line('');
line('=');
console.log('ADMISSIONS');
line('=');
const admissions = inColl('admissions');
console.log(`total: ${admissions.length}`);
admissions.forEach((a) => {
  console.log(`  ${a.path.padEnd(26)} name=${str(val(a, 'name')).padEnd(20)} phone=${str(val(a, 'phone')).padEnd(12)} uid=${str(val(a, 'uid')).slice(0, 24).padEnd(24)} status=${val(a, 'status')} src=${val(a, 'source')}`);
});
// do any admission ids already exist as students?
const admissionAlsoStudent = admissions.filter((a) => byPath.has(`students/${a.id}`));
console.log(`  admissions whose id also exists in students/: ${admissionAlsoStudent.length}`);

/* ---------------- seats ---------------- */
line('');
line('=');
console.log('SEATS');
line('=');
const seats = inColl('seats');
console.log(`total: ${seats.length}`);
const bySeatNum = new Map();
seats.forEach((s) => {
  const k = str(val(s, 'seatNumber')) || '(missing)';
  if (!bySeatNum.has(k)) bySeatNum.set(k, []);
  bySeatNum.get(k).push(s);
});
const dupSeats = [...bySeatNum.entries()].filter(([, v]) => v.length > 1);
console.log(`  DUPLICATE seat numbers: ${dupSeats.length}`);
dupSeats.forEach(([k, list]) => console.log(`    ${k} -> ${list.map((s) => s.path).join(', ')}`));
console.log(`  doc id !== seatNumber : ${seats.filter((s) => str(val(s, 'seatNumber')) && s.id !== str(val(s, 'seatNumber'))).length}`);
seats.filter((s) => str(val(s, 'seatNumber')) && s.id !== str(val(s, 'seatNumber')))
  .slice(0, 10)
  .forEach((s) => console.log(`    ${s.path} seatNumber=${val(s, 'seatNumber')}`));
console.log(`  status: ${JSON.stringify(count(seats, 'status'))}`);

// seats referenced but nonexistent
const missingSeatDocs = Object.keys(studentSeats).filter((k) => !bySeatNum.has(k));
console.log(`  students seated on a seat doc that does not exist: ${missingSeatDocs.length}`);
if (missingSeatDocs.length) console.log(`    -> ${missingSeatDocs.join(', ')}`);

/* ---------------- membershipPlans ---------------- */
line('');
line('=');
console.log('MEMBERSHIP PLANS');
line('=');
const plans = inColl('membershipPlans');
console.log(`total: ${plans.length}`);
plans.forEach((p) => console.log(`  ${p.id.padEnd(26)} ${str(val(p, 'planName')).padEnd(24)} price=${String(val(p, 'price')).padEnd(6)} seatPref=${val(p, 'seatPreference')} status=${val(p, 'status')}`));
const byPlanName = new Map();
plans.forEach((p) => {
  const k = normEmail(val(p, 'planName'));
  if (!k) return;
  if (!byPlanName.has(k)) byPlanName.set(k, []);
  byPlanName.get(k).push(p);
});
const dupPlans = [...byPlanName.entries()].filter(([, v]) => v.length > 1);
console.log(`  DUPLICATE plan names: ${dupPlans.length}`);
dupPlans.forEach(([k, list]) => console.log(`    ${k} -> ${list.map((p) => p.id).join(', ')}`));

/* ---------------- payments ---------------- */
line('');
line('=');
console.log('PAYMENTS');
line('=');
const payments = inColl('payments');
console.log(`total: ${payments.length}`);
console.log(`  status: ${JSON.stringify(count(payments, 'status'))}`);
const byTxn = new Map();
payments.forEach((p) => {
  const k = normEmail(val(p, 'transactionId'));
  if (!k) return;
  if (!byTxn.has(k)) byTxn.set(k, []);
  byTxn.get(k).push(p);
});
const dupTxn = [...byTxn.entries()].filter(([, v]) => v.length > 1);
console.log(`  DUPLICATE transactionIds: ${dupTxn.length}`);
dupTxn.forEach(([k, list]) => console.log(`    ${k} -> ${list.map((p) => p.path).join(', ')}`));
const payNoStudent = payments.filter((p) => !str(val(p, 'studentId')));
console.log(`  payments with no studentId: ${payNoStudent.length}`);
const payStudentMissing = payments.filter((p) => str(val(p, 'studentId')) && !byPath.has(`students/${str(val(p, 'studentId'))}`));
console.log(`  payments pointing at a non-existent student doc: ${payStudentMissing.length}`);
payStudentMissing.slice(0, 10).forEach((p) => console.log(`    ${p.path} studentId=${val(p, 'studentId')}`));

/* ---------------- studentDocuments ---------------- */
line('');
line('=');
console.log('STUDENT DOCUMENTS');
line('=');
const sdocs = inColl('studentDocuments');
console.log(`total: ${sdocs.length}`);
sdocs.forEach((d) => {
  const keys = Object.keys(d.data || {});
  const sizes = keys.map((k) => `${k}=${Math.round(String(d.data[k] || '').length / 1024)}KB`);
  console.log(`  ${d.path}  ${sizes.join(' ')}`);
});

/* ---------------- users / settings / counters ---------------- */
line('');
line('=');
console.log('OTHER');
line('=');
console.log('users:');
inColl('users').forEach((u) => console.log(`  ${u.path} role=${val(u, 'role')} status=${val(u, 'status')} email=${val(u, 'email')}`));
console.log('settings:');
inColl('settings').forEach((s) => console.log(`  ${s.path} keys=${Object.keys(s.data || {}).join(',')}`));
console.log('counters:');
inColl('counters').forEach((s) => console.log(`  ${s.path} ${JSON.stringify(s.data)}`));

// attendance / complaints / renewals / documents cross-refs
['attendance', 'complaints', 'renewals', 'documents'].forEach((name) => {
  const list = inColl(name);
  if (!list.length) return;
  const orphan = list.filter((d) => {
    const sid = str(val(d, 'studentId'));
    return !sid || !byPath.has(`students/${sid}`);
  });
  console.log(`${name}: total=${list.length} orphaned(studentId not in students)=${orphan.length}`);
});

console.log('');
console.log('ANALYSIS DONE (read-only)');
