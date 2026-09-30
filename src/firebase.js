import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

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
    console.log("🔥 Firebase Auth & Firestore successfully initialized");
  } else {
    console.warn("⚠️ Firebase environment variables not found. Falling back to local auth mode.");
  }
} catch (e) {
  console.error("Firebase initialization error:", e);
}

/**
 * NOTE (CRM sync architecture):
 * Public Firestore security rules on studyhaus-crm deny unauthenticated
 * client reads/writes (permission-denied). So ALL website <-> CRM traffic
 * must go through our backend API (`/api/*`), which uses the Firebase
 * Admin SDK and bypasses those rules:
 *
 *   GET  /api/plans    -> live `membershipPlans` (CRM-managed)
 *   POST /api/bookings -> creates a Pending `students` doc visible in CRM
 *   GET  /api/bookings -> recent CRM `students` inquiries
 */

// Fetch live membership plans from the backend (single source of truth = CRM).
export const fetchLivePlans = async () => {
  const res = await fetch('/api/plans');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Plans request failed (${res.status})`);
  }
  return data.data || [];
};

// Submit a website inquiry through the backend so it lands in the CRM
// `students` collection with status Pending.
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

export {
  app,
  db,
  auth,
  isFirebaseReady,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where
};
