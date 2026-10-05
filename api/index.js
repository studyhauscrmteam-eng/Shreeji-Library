const express = require('express');
const cors = require('cors');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK — on Vercel the key must be provided via env:
// FIREBASE_SERVICE_ACCOUNT = JSON string of serviceAccountKey.json
let adminDb = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin SDK initialized for Vercel (studyhaus-crm)");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    adminDb = getFirestore(adminApp);
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

async function findAdmissionByPhoneOrEmail(identifier) {
  if (!adminDb || !identifier) return null;
  const clean = String(identifier).trim();
  const phone = normalizePhone(clean);
  const lower = clean.toLowerCase();
  const snapshot = await adminDb.collection('admissions').get();
  for (const d of snapshot.docs) {
    const v = d.data();
    if (phone && normalizePhone(v.phone || '') === phone) return { id: d.id, ...v };
    if (v.email && String(v.email).toLowerCase() === lower) return { id: d.id, ...v };
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

app.get('/api/bookings', async (req, res) => {
  if (!adminDb) return res.json({ success: true, count: 0, data: [], source: 'not-configured' });
  try {
    const snapshot = await adminDb.collection('admissions').get();
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  const { name, phone, email, plan, planId, planName, startDate, message, userId, uid, dob, gender, paymentMethod, transactionId, paymentDueDate, remarks, termsAccepted } = req.body;
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

  const nowIso = new Date().toISOString();
  // CRM `admissions` schema — NEVER `students`, NEVER Active/Approved,
  // NEVER seatNumber, no studentId. No duplicate blocking (CRM approves).
  const inquiry = {
    name: String(name).trim(),
    phone: cleanPhone,
    email: String(email || '').trim().toLowerCase(),
    dob: dob || '',
    gender: gender || '',
    parentPhone: '',
    college: '',
    course: '',
    address: '',
    planId: resolvedPlanId,
    planName: resolvedPlanName,
    seatNumber: '',
    paymentMethod: paymentMethod === 'Paid' ? 'Paid' : 'Pay Later',
    transactionId: String(transactionId || '').trim(),
    paymentDueDate: paymentDueDate || '',
    status: 'Pending',
    approvalStatus: 'Pending',
    role: 'Student',
    uid: uid || userId || null,
    termsAccepted: termsAccepted === true || termsAccepted === 'true' ? true : Boolean(uid || userId),
    source: 'Website',
    isStudentSubmission: true,
    remarks: remarks ?? message ?? '',
    startDate: startDate || nowIso.split('T')[0],
    userId: userId || uid || null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const admissionUid = uid || userId;
    let docId;
    if (admissionUid) {
      await adminDb.collection('admissions').doc(String(admissionUid)).set(inquiry, { merge: true });
      docId = String(admissionUid);
    } else {
      const docRef = await adminDb.collection('admissions').add(inquiry);
      docId = docRef.id;
    }
    try {
      await adminDb.collection('notifications').add({
        type: 'new-admission',
        title: 'New admission request',
        body: `${inquiry.name} (${cleanPhone}) requested "${resolvedPlanName}". Open Admissions → Pending approval.`,
        admissionId: docId,
        studentId: '',
        read: false,
        forRoles: ['Owner/Admin', 'Manager'],
        createdAt: new Date().toISOString(),
      });
    } catch {}
    console.log(`[ShreeJi Vercel] Website admission -> admissions/${docId}: ${inquiry.name} (${cleanPhone})`);
    res.status(201).json({ success: true, message: 'Request received — pending admin approval. We will email you once approved.', booking: { id: docId, ...inquiry } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save booking. Please try again.' });
  }
});

app.post('/api/students', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Signup unavailable: backend not connected to CRM.' });
  const { name, phone, email, planId, planName, uid, userId, dob, gender } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
  const nowIso = new Date().toISOString();
  const doc = {
    name: String(name).trim(), phone: cleanPhone, email: String(email || '').trim().toLowerCase(),
    dob: dob || '', gender: gender || '', parentPhone: '', college: '', course: '', address: '',
    planId: planId || '', planName: planName || '',
    seatNumber: '', paymentMethod: 'Pay Later', transactionId: '', paymentDueDate: '',
    status: 'Pending', approvalStatus: 'Pending',
    role: 'Student', uid: uid || userId || null, termsAccepted: true,
    source: 'Website', isStudentSubmission: true,
    remarks: '', createdAt: nowIso, updatedAt: nowIso,
  };
  try {
    const admissionUid = uid || userId;
    let id;
    if (admissionUid) {
      await adminDb.collection('admissions').doc(String(admissionUid)).set(doc, { merge: true });
      id = String(admissionUid);
    } else {
      const ref = await adminDb.collection('admissions').add(doc);
      id = ref.id;
    }
    try {
      await adminDb.collection('notifications').add({
        type: 'new-admission',
        title: 'New admission request',
        body: `${doc.name} (${cleanPhone}) requested "${doc.planName}". Open Admissions → Pending approval.`,
        admissionId: id,
        studentId: '',
        read: false,
        forRoles: ['Owner/Admin', 'Manager'],
        createdAt: new Date().toISOString(),
      });
    } catch {}
    res.status(201).json({ success: true, data: { id, ...doc } });
  } catch {
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Backend not connected to CRM.' });
  const { id } = req.params;
  const { status, remarks } = req.body;
  try {
    const ref = adminDb.collection('admissions').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const updates = { updatedAt: new Date().toISOString() };
    if (status) {
      updates.status = status;
      if (status === 'Active' || status === 'Confirmed' || status === 'Approved') {
        updates.status = 'Active';
        updates.approvalStatus = 'Approved';
      } else if (status === 'Pending') {
        updates.approvalStatus = 'Pending';
      } else if (status === 'Rejected') {
        updates.approvalStatus = 'Rejected';
      }
    }
    if (typeof remarks === 'string') updates.remarks = remarks;
    await ref.update(updates);
    const updated = await ref.get();
    res.json({ success: true, message: 'Booking updated in CRM.', booking: { id, ...updated.data() } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

// GET unread admin notifications (new admission requests, newest first)
app.get('/api/notifications', async (req, res) => {
  if (!adminDb) return res.json({ success: true, unreadCount: 0, data: [], source: 'not-configured' });
  try {
    const snapshot = await adminDb.collection('notifications').get();
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    all.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
    const unread = all.filter((n) => n.read === false);
    res.json({ success: true, unreadCount: unread.length, data: unread.slice(0, 20), source: 'crm-live' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// PATCH mark notifications as read (body: { ids: [...] } or empty = all unread)
app.patch('/api/notifications/read', async (req, res) => {
  if (!adminDb) return res.status(503).json({ success: false, message: 'Backend not connected to CRM.' });
  try {
    const { ids } = req.body || {};
    let refs;
    if (Array.isArray(ids) && ids.length > 0) {
      refs = ids.map((id) => adminDb.collection('notifications').doc(String(id)));
    } else {
      const snap = await adminDb.collection('notifications').where('read', '==', false).get();
      refs = snap.docs.map((d) => d.ref);
    }
    if (refs.length > 0) {
      const batch = adminDb.batch();
      refs.forEach((r) => batch.update(r, { read: true }));
      await batch.commit();
    }
    res.json({ success: true, marked: refs.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
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
module.exports = app;
