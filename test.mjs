import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkOoZLga4CY67UjWp8hwmGj9yjJoop88I",
  authDomain: "studyhaus-crm.firebaseapp.com",
  projectId: "studyhaus-crm",
  storageBucket: "studyhaus-crm.firebasestorage.app",
  messagingSenderId: "1008571854677",
  appId: "1:1008571854677:web:8f8e42ce3b0ffddddfc9dc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCrm() {
  // NOTE: public client reads are denied by Firestore security rules
  // (permission-denied is EXPECTED). The website must use GET /api/plans
  // and POST /api/bookings instead — see server/index.js.
  for (const name of ["membershipPlans", "students"]) {
    try {
      const snap = await getDocs(collection(db, name));
      console.log(`${name}: ${snap.size} docs (client-readable)`);
    } catch (e) {
      console.log(`${name}: client read denied (${e.code}) — use backend API instead.`);
    }
  }
  try {
    const res = await fetch("http://localhost:5000/api/health");
    console.log("backend /api/health:", await res.text());
  } catch (e) {
    console.log("backend not running on :5000 — start with: node server/index.js");
  }
  process.exit(0);
}

checkCrm().catch(console.error);
