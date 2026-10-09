const express = require('express');
const cors = require('cors');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK — on Vercel the key must be provided via env:
// FIREBASE_SERVICE_ACCOUNT = JSON string of serviceAccountKey.json
let adminDb = null;
let adminAuth = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    console.log("🔥 Firebase Admin SDK initialized for Vercel (studyhaus-crm)");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
    console.log("🔥 Firebase Admin SDK initialized with default credentials");
  } else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not set on Vercel — API runs in degraded mode.");
  }
} catch (e) {
  console.error("Vercel Firebase Admin init error:", e.message);
}

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

const toSortableTime = (v) => {
  try {
    if (!v) return 0;
    if (typeof v === 'string') return new Date(v).getTime() || 0;
    if (v._seconds) return v._seconds * 1000;
    if (v.toDate) return v.toDate().getTime();
    return 0;
  } catch {
    return 0;
  }
};

async function getLivePlans() {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('membershipPlans').get();
  const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  plans.sort((a, b) => {
    const aActive = (a.status || 'Active') === 'Active' ? 0 : 1;
    const bActive = (b.status || 'Active') === 'Active' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return (Number(a.price) || 0) - (Number(b.price) || 0);
  });
  return plans;
}

// ================= Website lead (`visitors`, spec §2) =================
// Caps enforced by the deployed security rules on `visitors` create:
// visitorName<=120, phone 10..15, email<=160, message<=1000, purpose<=80,
// source must be 'Website' | 'Walk-in'.
const cap = (value, max) => String(value ?? '').slice(0, max);
const pad2 = (n) => String(n).padStart(2, '0');
const localDateStr = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const localTimeStr = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// Exactly the same field shape as the website's direct-SDK write
// (src/firebase.js -> submitWebsiteLead). NEVER uid / userId: a stale auth uid
// on a submission used to break portal logins permanently.
function buildVisitorLead({ name, phone, email = '', message = '', planId = '', planName = '' }) {
  const nowIso = new Date().toISOString();
  return {
    visitorName: cap(String(name || '').trim(), 120),
    phone,
    email: cap(String(email || '').trim().toLowerCase(), 160),
    message: cap(String(message || ''), 1000),
    purpose: 'Admission Inquiry',
    planId: cap(String(planId || '').trim(), 60),
    planName: cap(String(planName || '').trim(), 160),
    source: 'Website',
    leadStatus: 'New',
    status: 'Active',
    employeeName: '',
    employeeId: '',
    visitDate: localDateStr(),
    visitTime: localTimeStr(),
    termsAccepted: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// ONE transaction = claim `uniqueness/sub_<key>` + create the lead, so a
// retry / double-click can never produce two records. Admin SDK bypasses the
// security rules, so no anonymous session is needed here.
async function saveVisitorLead(lead, submissionKey) {
  const key = String(submissionKey || '').trim() ||
    `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const uniquenessRef = adminDb.collection('uniqueness').doc(`sub_${key}`);
  const visitorRef = adminDb.collection('visitors').doc();
  // ONE enquiry per phone / per email (owner's rule). Separate prefix from
  // the portal's `phone_`/`email_` index claims so neither can clobber the
  // other. Claim + lead are written in the same transaction.
  const phone = lead.phone || '';
  const email = lead.email || '';
  const phoneRef = phone ? adminDb.collection('uniqueness').doc(`req_lead_${phone}`) : null;
  const emailRef = email ? adminDb.collection('uniqueness').doc(`req_leadmail_${email}`) : null;
  return adminDb.runTransaction(async (tx) => {
    // All reads before all writes.
    const claim = await tx.get(uniquenessRef);
    const phoneSnap = phoneRef ? await tx.get(phoneRef) : null;
    const emailSnap = emailRef ? await tx.get(emailRef) : null;

    const prior = (phoneSnap && phoneSnap.exists && phoneSnap.data())
      || (emailSnap && emailSnap.exists && emailSnap.data())
      || null;
    if (prior) {
      const priorId = prior.visitorId ||
        (prior.docPath ? String(prior.docPath).split('/').pop() : '');
      return { id: priorId || '', deduped: true, duplicate: true };
    }

    if (claim.exists) {
      const existing = claim.data() || {};
      const existingId = existing.visitorId ||
        (existing.docPath ? String(existing.docPath).split('/').pop() : '');
      return { id: existingId || '', deduped: true, duplicate: false };
    }

    const stamp = {
      visitorId: visitorRef.id,
      docPath: visitorRef.path,
      uid: '',
      createdAt: FieldValue.serverTimestamp(),
    };
    tx.set(uniquenessRef, { kind: 'submission', visitorId: stamp.visitorId, docPath: stamp.docPath, createdAt: stamp.createdAt });
    if (phoneRef) tx.set(phoneRef, { kind: 'phone-index', ...stamp });
    if (emailRef) tx.set(emailRef, { kind: 'email', ...stamp });
    tx.set(visitorRef, {
      ...lead,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: visitorRef.id, deduped: false, duplicate: false };
  });
}

// Admin badge/toast for a new website lead (leads now surface under Visitors).
async function notifyNewLead(lead, leadId) {
  if (!adminDb) return;
  try {
    await adminDb.collection('notifications').add({
      type: 'new-visitor-lead',
      title: 'New website lead',
      body: `${lead.visitorName} (${lead.phone}) requested "${lead.planName}". Open Visitors → New leads.`,
      visitorId: leadId,
      admissionId: leadId, // legacy alias so older readers still resolve
      studentId: '',
      read: false,
      forRoles: ['Owner/Admin', 'Manager'],
      createdAt: new Date().toISOString(),
    });
  } catch {}
}

async function findAdmissionByPhoneOrEmail(identifier) {
  if (!adminDb || !identifier) return null;
  const clean = String(identifier).trim();
  const phone = normalizePhone(clean);
  const lower = clean.toLowerCase();
  const isMatch = (v) =>
    (phone && normalizePhone(v.phone || '') === phone) ||
    (v.email && String(v.email).toLowerCase() === lower);
  // Legacy admissions first (retired but still readable history)…
  const legacy = await adminDb.collection('admissions').get();
  for (const d of legacy.docs) {
    const v = d.data();
    if (isMatch(v)) return { id: d.id, ...v };
  }
  // …then the live website leads / walk-in visitors.
  const leads = await adminDb.collection('visitors').get();
  for (const d of leads.docs) {
    const v = d.data();
    if (isMatch(v)) return { id: d.id, ...v, name: v.name || v.visitorName || '' };
  }
  return null;
}

// Legacy alias — website never blocks duplicates (CRM blocks at approval).
async function findStudentByPhoneOrEmail(identifier) {
  return findAdmissionByPhoneOrEmail(identifier);
}

app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    library: 'ShreeJi Reading Library Vercel API',
    timestamp: new Date().toISOString(),
    firebase: adminDb ? 'connected' : 'not configured (set FIREBASE_SERVICE_ACCOUNT)',
  });
});

app.get('/api/plans', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Plans unavailable: backend not connected to CRM. Set FIREBASE_SERVICE_ACCOUNT in Vercel.' });
  try {
    const plans = await getLivePlans();
    const onlyActive = req.query.all !== '1';
    const filtered = onlyActive ? plans.filter((p) => (p.status || 'Active') === 'Active') : plans;
    res.json({ success: true, count: filtered.length, data: filtered, source: 'crm-live' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch live plans' });
  }
});

// Website leads (`visitors`, source "Website") — `admissions` is retired as a
// data store (spec §2); nothing new is ever written there.
app.get('/api/bookings', async (req, res) => {
  if (!adminDb) return res.json({ success: true, count: 0, data: [], source: 'not-configured' });
  try {
    const snapshot = await adminDb.collection('visitors').get();
    const all = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((v) => (v.source || 'Website') !== 'Walk-in');
    all.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
    res.json({ success: true, count: Math.min(all.length, 100), data: all.slice(0, 100), source: 'crm-live' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

app.get('/api/students/lookup', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Backend not connected to CRM.' });
  const { identifier } = req.query;
  if (!identifier) return res.status(400).json({ success: false, message: 'identifier query param required' });
  const found = await findAdmissionByPhoneOrEmail(identifier);
  if (!found) return res.status(404).json({ success: false, message: 'Student not found' });
  const { password, ...safe } = found;
  res.json({ success: true, data: safe });
});

app.post('/api/bookings', async (req, res) => {
  const { name, phone, email, plan, planId, planName, message, remarks, submissionKey } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
  }
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
  }
  if (!adminDb) {
    return res.status(503).json({ success: false, message: 'Booking service unavailable: backend not connected to CRM. Set FIREBASE_SERVICE_ACCOUNT in Vercel.' });
  }

  let resolvedPlanId = planId || '';
  let resolvedPlanName = planName || plan || 'Monthly - ₹1,000';
  try {
    const plans = await getLivePlans();
    let match = null;
    if (resolvedPlanId) match = plans.find((p) => p.id === resolvedPlanId);
    if (!match && resolvedPlanName) {
      const needle = String(resolvedPlanName).toLowerCase();
      match = plans.find((p) => String(p.planName || '').toLowerCase() === needle) || null;
    }
    if (match) {
      resolvedPlanId = match.id;
      resolvedPlanName = match.planName || resolvedPlanName;
    }
  } catch {}

  // `visitors` website lead (spec §2) + uniqueness/sub_ claim in one
  // transaction. NEVER `students`, NEVER `admissions`, NEVER a uid/userId.
  const lead = buildVisitorLead({
    name,
    phone: cleanPhone,
    email,
    message: remarks ?? message ?? '',
    planId: resolvedPlanId,
    planName: resolvedPlanName,
  });

  try {
    const saved = await saveVisitorLead(lead, submissionKey);
    if (!saved.deduped) await notifyNewLead(lead, saved.id);
    console.log(`[ShreeJi Vercel] Website lead -> visitors/${saved.id}: ${lead.visitorName} (${cleanPhone})`);
    res.status(201).json({
      success: true,
      duplicate: !!saved.duplicate,
      message: saved.duplicate
        ? 'We already have a request from this number — no second record was created. We will call you.'
        : 'Request received — pending admin approval. We will email you once approved.',
      booking: { id: saved.id, deduped: saved.deduped, duplicate: !!saved.duplicate, ...lead },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save booking. Please try again.' });
  }
});

app.post('/api/students', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Signup unavailable: backend not connected to CRM.' });
  const { name, phone, email, planId, planName, message, submissionKey } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
  // `visitors` website lead (spec §2) + uniqueness/sub_ claim in one
  // transaction. NEVER `students`, NEVER `admissions`, NEVER a uid/userId.
  const lead = buildVisitorLead({
    name,
    phone: cleanPhone,
    email,
    message: message || '',
    planId: planId || '',
    planName: planName || '',
  });
  try {
    const saved = await saveVisitorLead(lead, submissionKey);
    if (!saved.deduped) await notifyNewLead(lead, saved.id);
    console.log(`[ShreeJi Vercel] Website lead -> visitors/${saved.id}: ${lead.visitorName} (${cleanPhone})`);
    res.status(201).json({ success: true, data: { id: saved.id, deduped: saved.deduped, ...lead } });
  } catch {
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Backend not connected to CRM.' });
  const { id } = req.params;
  const { status, remarks } = req.body;
  try {
    const ref = adminDb.collection('visitors').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const updates = { updatedAt: new Date().toISOString() };
    if (typeof remarks === 'string') updates.remarks = remarks;
    if (status) {
      if (status === 'New' || status === 'Converted' || status === 'Closed') {
        // Website-lead lifecycle (spec §2)
        updates.leadStatus = status;
      } else {
        // Walk-in lifecycle (Active | Completed) + legacy approval words
        updates.status = status === 'Confirmed' || status === 'Approved' ? 'Active' : status;
        if (status === 'Active' || status === 'Confirmed' || status === 'Approved') {
          updates.leadStatus = 'Converted';
        } else if (status === 'Pending') {
          updates.leadStatus = 'New';
        }
      }
    }
    await ref.update(updates);
    const updated = await ref.get();
    res.json({ success: true, message: 'Booking updated in CRM.', booking: { id, ...updated.data() } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

app.get('/api/seat-availability', async (req, res) => {
  if (!adminDb) return res.json({ success: true, source: 'not-configured', totalSeats: 0, availableSeats: 0 });
  try {
    const snapshot = await adminDb.collection('seats').get();
    let total = 0;
    let occupied = 0;
    snapshot.forEach((d) => {
      total += 1;
      if ((d.data().status || '').toLowerCase() === 'occupied') occupied += 1;
    });
    res.json({ success: true, source: 'crm-live', totalSeats: total, availableSeats: total - occupied, occupiedSeats: occupied });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch seat availability' });
  }
});

// Export for Vercel
// ================= Staff-only gate =================
// Every destructive endpoint is Owner/Admin only. The token is a real Firebase
// ID token from the caller's own signed-in session, so forging it already
// means owning that account. Without this the purge route would let anyone on
// the internet erase a student.
async function requireOwnerAdmin(req, res) {
  if (!adminAuth || !adminDb) {
    res.status(503).json({ error: 'Backend not configured (service account missing).' });
    return null;
  }
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) { res.status(401).json({ error: 'Sign-in required.' }); return null; }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = snap.exists ? String(snap.data().role || '') : '';
    const isBootstrap = String(decoded.email || '').toLowerCase() === 'admin@studyhaus.com';
    if (role !== 'Owner/Admin' && !isBootstrap) {
      res.status(403).json({ error: 'Only Owner/Admin can perform this action.' });
      return null;
    }
    return decoded;
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return null;
  }
}

const pathId = (p) => String(p || '').split('/').pop();

// ================= Full student purge =================
// The Firebase CLIENT SDK can never delete an Auth user — which is exactly why
// a student removed from the admin portal could still sign in to the portal.
// This route is the only place that ends the credential. Auth dies FIRST so
// portal access is gone even if a later step fails, then every document,
// history row and uniqueness claim that named this person.
app.post('/api/students/purge', async (req, res) => {
  const caller = await requireOwnerAdmin(req, res);
  if (!caller) return;

  const studentId = String((req.body && req.body.studentId) || '').trim();
  if (!studentId) return res.status(400).json({ error: 'studentId is required.' });

  try {
    const snap = await adminDb.collection('students').doc(studentId).get();
    const data = snap.exists ? (snap.data() || {}) : {};

    const uid = String(data.uid || '').trim();
    const loginId = String(data.loginId || '').trim();
    const authEmail = String(data.authEmail || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const phone = normalizePhone(data.phone);

    const removed = { auth: false, docs: 0, history: 0, claims: 0, seat: false };

    // 1. Credential — this is what actually locks them out of the portal.
    const authTargets = new Set([uid, authEmail].filter(Boolean));
    if (!authTargets.size && loginId) {
      authTargets.add(loginId.includes('@') ? loginId : `${loginId}@student.shreejilibrary.com`);
    }
    for (const target of authTargets) {
      try {
        const user = target.includes('@')
          ? await adminAuth.getUserByEmail(target).catch(() => null)
          : await adminAuth.getUser(target).catch(() => null);
        if (user) { await adminAuth.deleteUser(user.uid); removed.auth = true; }
      } catch (_) { /* already gone */ }
    }

    // 2. Core documents (only counted when they actually existed).
    for (const col of ['students', 'users', 'studentDocuments', 'admissions']) {
      try {
        const ref = adminDb.collection(col).doc(studentId);
        if ((await ref.get()).exists) { await ref.delete(); removed.docs++; }
      } catch (_) { /* best-effort */ }
    }

    // 3. Everything else that carried this person's history.
    for (const col of ['payments', 'attendance', 'complaints', 'renewals', 'documents', 'notifications']) {
      try {
        const s = await adminDb.collection(col).where('studentId', '==', studentId).get();
        if (!s.empty) {
          const batch = adminDb.batch();
          s.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          removed.history += s.size;
        }
      } catch (_) { /* collection may be empty */ }
    }

    // 4. Free the seat so nobody inherits a ghost booking.
    try {
      const seatNo = String(data.seatNumber || data.seatAssigned || '').trim();
      if (seatNo) {
        const seats = await adminDb.collection('seats')
          .where('seatNumber', '==', seatNo)
          .get();
        for (const d of seats.docs) {
          const sd = d.data() || {};
          if (!sd.assignedStudentId || sd.assignedStudentId === studentId) {
            await d.ref.update({
              status: 'Available', assignedStudentId: null,
              assignedStudentName: null, planType: null,
              lastUpdated: FieldValue.serverTimestamp(),
            });
            removed.seat = true;
          }
        }
      }
    } catch (_) { /* seat release is best-effort */ }

    // 5. Uniqueness claims (phone_ / email_) — drop ONLY claims whose owners
    //    are all gone. A claim pointing at a living student belongs to someone
    //    else and must survive: that is how we never merge two people.
    const claimKeys = new Set();
    if (phone) claimKeys.add(`phone_${phone}`);
    if (loginId) {
      claimKeys.add(`phone_${normalizePhone(loginId) || loginId}`);
      claimKeys.add(`email_${loginId.toLowerCase()}`);
    }
    if (authEmail) claimKeys.add(`email_${authEmail.toLowerCase()}`);
    if (email) claimKeys.add(`email_${email}`);
    for (const key of claimKeys) {
      try {
        const ref = adminDb.collection('uniqueness').doc(key);
        const claim = await ref.get();
        if (!claim.exists) continue;
        const cd = claim.data() || {};
        const ownerIds = [
          ...(Array.isArray(cd.owners) ? cd.owners : []),
          cd.ownerPath || '', cd.uid || '',
        ].map(pathId).filter(Boolean);
        if (!ownerIds.length) continue;
        let allGone = true;
        for (const id of ownerIds) {
          if ((await adminDb.collection('students').doc(id).get()).exists) { allGone = false; break; }
        }
        if (allGone) { await ref.delete(); removed.claims++; }
      } catch (_) { /* keep claims we cannot reason about */ }
    }

    return res.status(200).json({ ok: true, removed });
  } catch (e) {
    console.error('purge failed:', e.message);
    return res.status(500).json({ error: e.message || 'Purge failed.' });
  }
});

module.exports = app;
