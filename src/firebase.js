import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  runTransaction
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
 *   POST /api/bookings -> creates a website lead (`visitors`, spec §2)
 *   GET  /api/bookings -> recent leads (staff Admin portal)
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

// ================= Website lead -> `visitors` (spec §2) =================
// Hard caps enforced by the deployed security rules on `visitors` create:
// visitorName<=120, phone 10..15, email<=160, message<=1000, purpose<=80,
// source must be 'Website' | 'Walk-in'. Truncate so a long paste can never
// fail the write.
const cap = (value, max) => String(value ?? '').slice(0, max);

// Website form submission -> ONE `visitors` lead, written inside a transaction
// that simultaneously claims `uniqueness/sub_<submissionKey>`. A double-click,
// a retry after a timeout, or a second tab reusing the same key can never
// create a second lead: if the claim already exists the transaction returns
// the original visitor id and writes nothing.
//
// NEVER writes `uid` / `userId`, NEVER touches `admissions` or `students`.
// The anonymous auth session only exists so `signedIn()` passes the rules —
// it is deliberately NOT stored on the document (that stale uid used to break
// portal logins, because students/{realUid} was never created).
export const submitWebsiteLead = async ({
  name,
  phone,
  email = '',
  message = '',
  planId = '',
  planName = '',
  submissionKey = '',
}) => {
  if (!db) throw new Error('Firebase is not configured. Please try again later.');

  const cleanName = cap(String(name || '').trim(), 120);
  const cleanPhone = normalizePhone10(phone);
  const cleanEmail = cap(String(email || '').trim().toLowerCase(), 160);
  const cleanMessage = cap(String(message || '').trim(), 1000);
  const cleanPlanId = cap(String(planId || '').trim(), 60);
  const cleanPlanName = cap(String(planName || '').trim(), 160);

  if (!cleanName) throw new Error('Please enter your full name.');
  if (!/^\d{10}$/.test(cleanPhone)) throw new Error('Please enter a valid 10-digit mobile number.');

  // Signed-in (anonymous counts) so visitors/uniqueness create passes signedIn().
  await ensureAnon();

  const key = String(submissionKey || '').trim() ||
    `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const uniquenessRef = doc(db, 'uniqueness', `sub_${key}`);
  const visitorsCol = collection(db, 'visitors');

  const now = new Date();
  const pad2 = (n) => String(n).padStart(2, '0');
  const lead = {
    visitorName: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    message: cleanMessage,
    purpose: 'Admission Inquiry',
    planId: cleanPlanId,
    planName: cleanPlanName,
    source: 'Website',
    leadStatus: 'New',
    status: 'Active',
    employeeName: '',
    employeeId: '',
    visitDate: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
    visitTime: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    termsAccepted: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return runTransaction(db, async (tx) => {
    const claim = await tx.get(uniquenessRef);
    if (claim.exists()) {
      const existing = claim.data() || {};
      return { id: existing.visitorId || '', deduped: true };
    }
    // Auto-id ref (addDoc equivalent) — created and written inside the same
    // transaction as the claim, so lead + claim always land together.
    const visitorRef = doc(visitorsCol);
    tx.set(uniquenessRef, {
      kind: 'submission',
      visitorId: visitorRef.id,
      docPath: visitorRef.path,
      createdAt: serverTimestamp(),
    });
    tx.set(visitorRef, lead);
    return { id: visitorRef.id, deduped: false };
  });
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
