const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Firebase Admin SDK for server-side (bypasses Firestore security rules)
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let adminDb = null;
try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    const adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin SDK initialized for server (project: studyhaus-crm)");
  } else {
    console.warn("⚠️ serviceAccountKey.json not found. Using local file storage fallback.");
  }
} catch (e) {
  console.error("Firebase Admin init error:", e);
}

// ---- Local fallback store (only used when Firestore is unreachable) ----
const DATA_FILE = path.join(__dirname, 'bookings_store.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function getLocalBookings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
  } catch (e) {
    console.warn("Local store write failed:", e.message);
  }
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
    if (v.seconds) return v.seconds * 1000;
    if (v.toDate) return v.toDate().getTime();
    return 0;
  } catch {
    return 0;
  }
};

// ================= CRM-backed helpers (studyhaus-crm) =================

// Membership plans live in `membershipPlans` (managed through the CRM).
async function getLivePlans() {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('membershipPlans').get();
  const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Active plans first, sorted by price ascending
  plans.sort((a, b) => {
    const aActive = (a.status || 'Active') === 'Active' ? 0 : 1;
    const bActive = (b.status || 'Active') === 'Active' ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return (Number(a.price) || 0) - (Number(b.price) || 0);
  });
  return plans;
}

// Website inquiries are stored as `admissions` docs with status Pending so
// they appear in the CRM Admissions → Pending approval queue.
// NEVER write website submissions to `students` — admin approval creates it.
async function getRecentInquiries(limit = 50) {
  if (!adminDb) return getLocalBookings();
  const snapshot = await adminDb.collection('admissions').get();
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  all.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  return all.slice(0, limit);
}

async function findAdmissionByPhoneOrEmail(identifier) {
  if (!adminDb || !identifier) return null;
  const clean = String(identifier).trim();
  const phone = normalizePhone(clean);
  // Try phone match (both raw and normalized) then email match
  const snapshot = await adminDb.collection('admissions').get();
  const lower = clean.toLowerCase();
  for (const d of snapshot.docs) {
    const v = d.data();
    if (phone && (normalizePhone(v.phone || '') === phone)) return { id: d.id, ...v };
    if (v.email && String(v.email).toLowerCase() === lower) return { id: d.id, ...v };
  }
  return null;
}

// Legacy alias (website no longer checks duplicates — CRM blocks at approval).
async function findStudentByPhoneOrEmail(identifier) {
  return findAdmissionByPhoneOrEmail(identifier);
}

// ================= API Routes =================
app.get('/api/health', async (req, res) => {
  let plansCount = null;
  if (adminDb) {
    try {
      const snap = await adminDb.collection('membershipPlans').count().get();
      plansCount = snap.data().count;
    } catch {}
  }
  res.json({
    status: 'ok',
    library: 'ShreeJi Reading Library API',
    timestamp: new Date(),
    firebase: adminDb ? 'connected' : 'local-fallback',
    crmProject: 'studyhaus-crm',
    livePlans: plansCount,
  });
});

// GET live membership plans (CRM-managed). Frontend polls this.
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await getLivePlans();
    if (!adminDb) {
      return res.json({ success: true, count: 0, data: [], source: 'local-fallback', message: 'Firestore not connected' });
    }
    const onlyActive = req.query.all !== '1';
    const filtered = onlyActive ? plans.filter((p) => (p.status || 'Active') === 'Active') : plans;
    res.json({ success: true, count: filtered.length, data: filtered, source: 'crm-live' });
  } catch (err) {
    console.error('GET /api/plans failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch live plans' });
  }
});

// GET inquiries (CRM admissions, most recent first)
app.get('/api/bookings', async (req, res) => {
  try {
    const inquiries = await getRecentInquiries(100);
    res.json({ success: true, count: inquiries.length, data: inquiries, source: adminDb ? 'crm-live' : 'local-fallback' });
  } catch (err) {
    console.error('GET /api/bookings failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Student lookup for website login (searches CRM admissions by phone/email)
app.get('/api/students/lookup', async (req, res) => {
  try {
    const { identifier } = req.query;
    if (!identifier) return res.status(400).json({ success: false, message: 'identifier query param required' });
    const found = await findAdmissionByPhoneOrEmail(identifier);
    if (!found) return res.status(404).json({ success: false, message: 'Student not found' });
    // Never expose passwords to the website
    const { password, ...safe } = found;
    res.json({ success: true, data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lookup failed' });
  }
});

// POST new booking / inquiry -> creates a Pending ADMISSION visible in the CRM
// Admissions → Pending approval queue. NEVER writes to `students`.
// Contract: status "Pending", approvalStatus "Pending", seatNumber "", no
// studentId, no Active. No duplicate blocking here (CRM blocks at approval).
app.post('/api/bookings', async (req, res) => {
  const { name, phone, email, plan, planId, planName, startDate, message, userId, uid, dob, gender, paymentMethod, transactionId, paymentDueDate, remarks, termsAccepted, directConfirm } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
  }

  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
  }

  // Resolve plan name / id against live CRM plans when possible
  let resolvedPlanId = planId || '';
  let resolvedPlanName = planName || plan || '';
  try {
    if (adminDb && (resolvedPlanId || resolvedPlanName)) {
      const plans = await getLivePlans();
      let match = null;
      if (resolvedPlanId) match = plans.find((p) => p.id === resolvedPlanId);
      if (!match && resolvedPlanName) {
        const needle = String(resolvedPlanName).toLowerCase();
        match =
          plans.find((p) => String(p.planName || '').toLowerCase() === needle) ||
          plans.find((p) => needle.includes(String(p.planName || '').toLowerCase().split('₹')[0].trim().toLowerCase())) ||
          plans.find((p) => String(p.id).toLowerCase() === needle);
      }
      if (match) {
        resolvedPlanId = match.id;
        resolvedPlanName = match.planName || resolvedPlanName;
      }
    }
  } catch (e) {
    console.warn('Plan resolution notice:', e.message);
  }
  if (!resolvedPlanName) resolvedPlanName = 'Monthly - ₹1,000';

  // NOTE: no duplicate phone/email blocking from the website (contract §3) —
  // just submit as Pending; the CRM blocks duplicates at approval.

  const nowIso = new Date().toISOString();
  // Schema matches the CRM `admissions` collection so the request shows up in
  // Admissions → Pending approval (query where status == "Pending").
  // NEVER writes to `students`, NEVER Active/Approved, NEVER seatNumber.
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
    transactionId: (transactionId || '').trim(),
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

  // Save via Admin SDK (works even though public Firestore rules are locked)
  // to the `admissions` collection — NEVER `students`.
  if (adminDb) {
    try {
      let docId;
      const admissionUid = uid || userId;
      if (admissionUid) {
        // Doc ID must equal Auth uid: admissions/{uid}
        await adminDb.collection('admissions').doc(String(admissionUid)).set(inquiry, { merge: true });
        docId = String(admissionUid);
      } else {
        const docRef = await adminDb.collection('admissions').add(inquiry);
        docId = docRef.id;
      }
      console.log(`[ShreeJi] Website admission saved to CRM admissions/${docId}: ${inquiry.name} (${cleanPhone}) - ${resolvedPlanName}`);
      // Admin notification so it surfaces with count badge + toast in the CRM.
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
      } catch (e) {
        console.warn('Notification write failed:', e.message);
      }
      // Local backup
      const local = getLocalBookings();
      local.unshift({ id: docId, ...inquiry });
      saveLocalBookings(local.slice(0, 200));
      return res.status(201).json({
        success: true,
        message: 'Request received — pending admin approval. We will email you once approved.',
        booking: { id: docId, ...inquiry },
      });
    } catch (e) {
      console.error('Firestore admission save failed, using local fallback:', e.message);
    }
  }

  // Local fallback (dev without service account)
  const fallback = { id: 'BK-' + Date.now(), ...inquiry };
  const local = getLocalBookings();
  local.unshift(fallback);
  saveLocalBookings(local.slice(0, 200));
  return res.status(201).json({
    success: true,
    message: 'Booking request received (local mode). Connect Firestore for CRM sync.',
    booking: fallback,
    warning: 'Saved locally only — Firestore not connected.',
  });
});

// Website signup -> creates a Pending CRM ADMISSION (no seat assigned yet).
// NEVER writes to `students`. No duplicate blocking (CRM blocks at approval).
app.post('/api/students', async (req, res) => {
  const { name, phone, email, planId, planName, uid, userId, dob, gender } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
  const nowIso = new Date().toISOString();
  const doc = {
    name: String(name).trim(),
    phone: cleanPhone,
    email: String(email || '').trim().toLowerCase(),
    dob: dob || '',
    gender: gender || '',
    parentPhone: '',
    college: '',
    course: '',
    address: '',
    planId: planId || '',
    planName: planName || '',
    seatNumber: '',
    paymentMethod: 'Pay Later',
    transactionId: '',
    paymentDueDate: '',
    status: 'Pending',
    approvalStatus: 'Pending',
    role: 'Student',
    uid: uid || userId || null,
    termsAccepted: true,
    source: 'Website',
    isStudentSubmission: true,
    remarks: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  if (!adminDb) return res.status(503).json({ success: false, message: 'Signup unavailable: backend not connected to CRM.' });
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
    res.status(201).json({ success: true, data: { id, ...doc } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

// PATCH admission (Admin) — updates the CRM admissions doc. NEVER touches students.
app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (adminDb) {
    try {
      const ref = adminDb.collection('admissions').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Booking not found.' });
      const updates = { updatedAt: new Date().toISOString() };
      if (status) {
        updates.status = status;
        // Keep CRM approval workflow in sync
        if (status === 'Active' || status === 'Confirmed' || status === 'Approved') {
          updates.status = 'Active';
          updates.approvalStatus = 'Approved';
        } else if (status === 'Pending') {
          updates.approvalStatus = 'Pending';
        }
      }
      if (typeof remarks === 'string') updates.remarks = remarks;
      await ref.update(updates);
      const updated = await ref.get();
      return res.json({ success: true, message: 'Booking updated in CRM.', booking: { id, ...updated.data() } });
    } catch (err) {
      console.error('PATCH booking failed:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
  }

  const bookings = getLocalBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (status) bookings[index].status = status;
  saveLocalBookings(bookings);
  res.json({ success: true, message: 'Booking updated (local).', booking: bookings[index] });
});

// GET real seat availability from the CRM `seats` collection
app.get('/api/seat-availability', async (req, res) => {
  if (!adminDb) {
    return res.json({ success: true, source: 'fallback', totalSeats: 60, availableSeats: 14 });
  }
  try {
    const snapshot = await adminDb.collection('seats').get();
    let total = 0;
    let occupied = 0;
    snapshot.forEach((d) => {
      total += 1;
      const s = (d.data().status || '').toLowerCase();
      if (s === 'occupied') occupied += 1;
    });
    res.json({
      success: true,
      source: 'crm-live',
      totalSeats: total,
      availableSeats: total - occupied,
      occupiedSeats: occupied,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch seat availability' });
  }
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === '1234' || pin === 'shreeji2026') {
    return res.json({ success: true, token: 'admin-authorized-token-8899' });
  }
  res.status(401).json({ success: false, message: 'Invalid Admin Key' });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 ShreeJi Reading Library Express Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
