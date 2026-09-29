const express = require('express');
const cors = require('cors');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK Configuration
let adminDb = null;
try {
  // Use service account from environment or file
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin SDK initialized for Vercel");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use default credentials if set
    const adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin SDK initialized with default credentials");
  }
} catch (e) {
  console.error("Vercel Firebase Admin init error:", e);
}

// Helper to get bookings from Firestore
async function getBookings() {
  if (!adminDb) {
    return [];
  }
  try {
    const snapshot = await adminDb.collection('bookings').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn("Vercel Firestore get bookings error:", e);
    return [];
  }
}

// Helper to save booking to Firestore
async function saveBooking(booking) {
  if (!adminDb) {
    return false;
  }
  try {
    const docRef = await adminDb.collection('bookings').add({
      ...booking,
      firestoreTimestamp: new Date()
    });
    return docRef.id;
  } catch (e) {
    console.warn("Vercel Firestore save booking error:", e);
    return false;
  }
}

// Helper to update booking status
async function updateBookingStatus(id, status) {
  if (!adminDb) {
    return false;
  }
  try {
    await adminDb.collection('bookings').doc(id).update({ status, updatedAt: new Date() });
    return true;
  } catch (e) {
    console.warn("Vercel Firestore update booking error:", e);
    return false;
  }
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    library: 'ShreeJi Reading Library Vercel API', 
    timestamp: new Date().toISOString(),
    firebase: adminDb ? 'connected' : 'not configured'
  });
});

app.post('/api/bookings', async (req, res) => {
  const { name, phone, email, plan, startDate, message, userId, directConfirm } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone number are required.' });
  }

  const newBooking = {
    id: 'BK-' + Date.now(),
    name,
    phone,
    email: email || '',
    plan: plan || 'Half Day (₹700/mo)',
    startDate: startDate || new Date().toISOString().split('T')[0],
    message: message || '',
    status: directConfirm ? 'Confirmed' : 'Pending',
    userId: userId || null,
    directConfirm: !!directConfirm,
    createdAt: new Date().toISOString()
  };

  const docId = await saveBooking(newBooking);
  if (docId) {
    newBooking.id = docId;
  }

  console.log(`[ShreeJi Library Vercel] New Booking: ${name} (${phone}) - Plan: ${plan}`);

  res.status(201).json({
    success: true,
    message: 'Booking request sent successfully!',
    booking: newBooking
  });
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await getBookings();
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await updateBookingStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Booking not found or update failed.' });
    }
    
    const bookings = await getBookings();
    const updatedBooking = bookings.find(b => b.id === id);

    res.json({ success: true, message: 'Booking updated.', booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

// Export for Vercel
module.exports = app;