import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app = null;
let db = null;
let auth = null;
let isFirebaseReady = false;

try {
  if (firebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseReady = true;
    console.log("🔥 Firebase Firestore successfully initialized");
  } else {
    console.warn("⚠️ Firebase environment variables not found. Falling back to local auth mode.");
  }
} catch (e) {
  console.error("Firebase initialization error:", e);
}

/**
 * NOTE (backend API architecture):
 * The website talks to our backend API (`/api/*`), which uses the Firebase
 * Admin SDK and bypasses locked public Firestore security rules:
 *
 *   GET  /api/plans    -> membership plans (single source of truth)
 *   POST /api/bookings -> creates a Pending inquiry
 *   GET  /api/bookings -> recent inquiries (staff Admin portal)
 */

// Fetch membership plans from the backend (single source of truth).
export const fetchLivePlans = async () => {
  const res = await fetch('/api/plans');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Plans request failed (${res.status})`);
  }
  return data.data || [];
};

// Submit a website inquiry through the backend API.
export const submitBookingViaAPI = async (bookingData) => {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Booking request failed (${res.status})`);
  }
  return data.booking;
};

// Legacy name kept for compatibility — now routes via the backend API
// (direct Firestore writes fail with permission-denied under locked rules).
export const saveBookingToFirestore = async (bookingData) => {
  const booking = await submitBookingViaAPI(bookingData);
  return booking?.id || booking?.booking?.id || `API-${Date.now()}`;
};

// ================= Direct-SDK seat flow (static hosting, no server) =================
// Anonymous sign-in (invisible, no UI). Single-flight so concurrent callers
// share one session. Requires the Anonymous provider enabled in the console.
let anonPromise = null;
export const ensureAnon = () => {
  if (!auth) return Promise.reject(new Error('Firebase Auth is not configured.'));
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!anonPromise) {
    anonPromise = signInAnonymously(auth).then((cred) => cred.user).catch((e) => {
      anonPromise = null;
      throw e;
    });
  }
  return anonPromise;
};

const mapSeatDoc = (d) => {
  const v = d.data() || {};
  return {
    id: d.id,
    seatNumber: v.seatNumber,
    status: v.status || 'Available',
    floor: v.floor || 'Ground Floor',
  };
};

// Live seats subscription. Calls onData(seats) on every snapshot,
// onError(err) on failure. Ensures an anonymous session first.
export const listenSeats = (onData, onError) => {
  if (!db) {
    if (onError) onError(new Error('Firebase is not configured.'));
    return () => {};
  }
  ensureAnon().catch(() => {});
  return onSnapshot(
    collection(db, 'seats'),
    (snap) => onData(snap.docs.map(mapSeatDoc)),
    (err) => {
      console.warn('Seats subscription failed:', err?.message || err);
      if (onError) onError(err);
    }
  );
};

// Direct plans read (static hosting — no /api). Same shape as the backend:
// raw membershipPlans docs [{ id, ...data }], mapping happens in PlansContext.
export const fetchDirectPlans = async () => {
  if (!db) throw new Error('Firebase is not configured.');
  await ensureAnon();
  const snap = await getDocs(collection(db, 'membershipPlans'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Canonical CRM seat format: A01–A68, B01–B40 (uppercase letter + digits).
// Accepts DB-exact ("A01") and layout ("A1") spellings for checking, but the
// raw DB value is always what gets sent.
export const isCanonicalSeat = (seatNumber) => {
  const m = String(seatNumber || '').trim().toUpperCase().match(/^([AB])(\d{1,3})$/);
  if (!m) return false;
  const n = Number(m[2]);
  if (m[1] === 'A') return n >= 1 && n <= 68;
  return n >= 1 && n <= 40;
};

const normalizePhone10 = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

// Direct-SDK admission write: ONE addDoc to admissions (Pending/Pending) +
// ONE admin notification. seatNumber/seatId travel ONLY when the chosen plan
// allows selection (seatSelectable === true); otherwise both go out empty and
// the backend strips them anyway. NEVER writes to students.
export const submitAdmissionDirect = async ({
  name,
  phone,
  email,
  planId,
  planName,
  message = '',
  seatNumber = '',
  seatId = '',
  seatSelectable = false,
}) => {
  if (!db || !auth) throw new Error('Firebase is not configured. Please try again later.');

  const cleanName = String(name || '').trim();
  const cleanPhone = normalizePhone10(phone);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPlanId = String(planId || '').trim();
  const cleanPlanName = String(planName || '').trim();

  if (!cleanName) throw new Error('Please enter your full name.');
  if (!/^\d{10}$/.test(cleanPhone)) throw new Error('Please enter a valid 10-digit mobile number.');
  if (!cleanPlanId || !cleanPlanName) throw new Error('Please select a membership plan.');

  let sendSeatNumber = '';
  let sendSeatId = '';
  if (seatSelectable && seatNumber) {
    if (!isCanonicalSeat(seatNumber)) {
      throw new Error('Selected seat is invalid. Please pick your seat again from the map.');
    }
    sendSeatNumber = String(seatNumber).trim().toUpperCase();
    sendSeatId = String(seatId || '').trim();
  }

  await ensureAnon();
  const uid = auth.currentUser ? auth.currentUser.uid : null;
  const nowIso = new Date().toISOString();

  const payload = {
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    dob: '',
    gender: '',
    parentPhone: '',
    college: '',
    course: '',
    address: '',
    planId: cleanPlanId,
    planName: cleanPlanName,
    seatNumber: sendSeatNumber,
    seatId: sendSeatId,
    paymentMethod: 'Pay Later',
    transactionId: '',
    paymentDueDate: '',
    status: 'Pending',
    approvalStatus: 'Pending',
    role: 'Student',
    uid,
    termsAccepted: true,
    source: 'Website',
    isStudentSubmission: true,
    remarks: String(message || ''),
    startDate: nowIso.split('T')[0],
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'admissions'), payload);

  try {
    await addDoc(collection(db, 'notifications'), {
      type: 'new-admission',
      title: 'New admission request',
      body: `${cleanName} (${cleanPhone}) requested "${cleanPlanName}". Open Admissions → Pending approval.`,
      admissionId: ref.id,
      studentId: '',
      read: false,
      forRoles: ['Owner/Admin', 'Manager'],
      createdAt: serverTimestamp(),
    });
  } catch (notifyErr) {
    console.warn('Admission saved but notification write failed:', notifyErr?.message || notifyErr);
  }

  return { id: ref.id };
};

export {
  app,
  db,
  auth,
  isFirebaseReady,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where
};
