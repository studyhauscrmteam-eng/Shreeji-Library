const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Firebase Admin SDK for server-side (bypasses Firestore security rules)
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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

// ---- Local fallback store (read-only mirror, used when Firestore is down) ----
// NOTE: submissions are NEVER mirrored to this file any more — double counting.
// The file itself is kept untouched so existing history stays readable.
const DATA_FILE = path.join(__dirname, 'bookings_store.json');

function getLocalBookings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
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
  return adminDb.runTransaction(async (tx) => {
    const claim = await tx.get(uniquenessRef);
    if (claim.exists) {
      const existing = claim.data() || {};
      const existingId = existing.visitorId ||
        (existing.docPath ? String(existing.docPath).split('/').pop() : '');
      return { id: existingId || '', deduped: true };
    }
    tx.set(uniquenessRef, {
      kind: 'submission',
      visitorId: visitorRef.id,
      docPath: visitorRef.path,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(visitorRef, {
      ...lead,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { id: visitorRef.id, deduped: false };
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
  } catch (e) {
    console.warn('Notification write failed:', e.message);
  }
}

// Website inquiries are `visitors` leads (source "Website"). `admissions` is
// retired as a data store (spec §2) — it is only read here for legacy lookup.
// NEVER write website submissions to `students` or `admissions`.
async function getRecentInquiries(limit = 50) {
  if (!adminDb) return getLocalBookings();
  const snapshot = await adminDb.collection('visitors').get();
  const all = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((v) => (v.source || 'Website') !== 'Walk-in');
  all.sort((a, b) => toSortableTime(b.createdAt) - toSortableTime(a.createdAt));
  return all.slice(0, limit);
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

// GET inquiries (website leads in `visitors`, most recent first)
app.get('/api/bookings', async (req, res) => {
  try {
    const inquiries = await getRecentInquiries(100);
    res.json({ success: true, count: inquiries.length, data: inquiries, source: adminDb ? 'crm-live' : 'local-fallback' });
  } catch (err) {
    console.error('GET /api/bookings failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Student lookup for website login (searches CRM admissions + visitors)
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

// POST new booking / inquiry -> creates a `visitors` website lead (spec §2)
// inside a transaction that claims uniqueness/sub_<key>. Route path and
// response JSON shape are unchanged for legacy callers; only the collection
// changed. NEVER writes to `students` or `admissions` (both are retired as
// write targets), and NEVER stores a uid/userId on the lead.
app.post('/api/bookings', async (req, res) => {
  const { name, phone, email, plan, planId, planName, message, remarks, submissionKey } = req.body;

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

  // NOTE: no duplicate phone/email blocking from the website (contract §6) —
  // the uniqueness/sub_ claim below only stops the SAME submission retrying.

  if (!adminDb) {
    return res.status(503).json({ success: false, message: 'Booking service unavailable: backend not connected to CRM.' });
  }

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
    console.log(`[ShreeJi] Website lead -> visitors/${saved.id}: ${lead.visitorName} (${cleanPhone}) - ${resolvedPlanName}`);
    return res.status(201).json({
      success: true,
      message: 'Request received — pending admin approval. We will email you once approved.',
      booking: { id: saved.id, deduped: saved.deduped, ...lead },
    });
  } catch (e) {
    console.error('Firestore lead save failed:', e.message);
    return res.status(500).json({ success: false, message: 'Failed to save booking. Please try again.' });
  }
});

// Website signup -> creates a `visitors` website lead (spec §2), same field
// shape and uniqueness/sub_ claim as POST /api/bookings. NEVER writes
// `students` or `admissions`, NEVER stores a uid/userId. Route path and
// response JSON shape are unchanged for legacy callers.
app.post('/api/students', async (req, res) => {
  const { name, phone, email, planId, planName, message, submissionKey } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and Phone are required.' });
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
  if (!adminDb) return res.status(503).json({ success: false, message: 'Signup unavailable: backend not connected to CRM.' });
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
    console.log(`[ShreeJi] Website lead -> visitors/${saved.id}: ${lead.visitorName} (${cleanPhone})`);
    res.status(201).json({ success: true, data: { id: saved.id, deduped: saved.deduped, ...lead } });
  } catch (e) {
    console.error('Firestore lead save failed:', e.message);
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

// PATCH booking -> updates the `visitors` lead (admissions is retired as a
// write target). NEVER touches `students`.
app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!adminDb) {
    return res.status(503).json({ success: false, message: 'Backend not connected to CRM.' });
  }

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
    return res.json({ success: true, message: 'Booking updated in CRM.', booking: { id, ...updated.data() } });
  } catch (err) {
    console.error('PATCH booking failed:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
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
