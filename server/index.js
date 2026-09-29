const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Firebase Admin SDK for server-side
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let adminDb = null;
try {
  // Check if we have service account credentials
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    const adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
    adminDb = getFirestore(adminApp);
    console.log("🔥 Firebase Admin SDK initialized for server");
  } else {
    console.warn("⚠️ serviceAccountKey.json not found. Using local file storage fallback.");
  }
} catch (e) {
  console.error("Firebase Admin init error:", e);
}

// In-Memory/Local File Storage Path for Fallback DB
const DATA_FILE = path.join(__dirname, 'bookings_store.json');

// Initialize local storage file if not exists
if (!fs.existsSync(DATA_FILE)) {
  const initialData = [
    {
      id: 'demo-1',
      name: 'Rohan Sharma',
      phone: '9876543210',
      email: 'rohan.s@gmail.com',
      plan: 'Full Day (12 Hrs)',
      startDate: '2026-08-15',
      message: 'Looking for a reserved window seat for GPSC prep.',
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      name: 'Priya Patel',
      phone: '9123456789',
      email: 'priya.patel@yahoo.com',
      plan: 'Half Day — Morning',
      startDate: '2026-08-12',
      message: 'Need silent zone seat with laptop charging point.',
      status: 'Pending',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read bookings from local file (fallback)
function getLocalBookings() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write bookings to local file (fallback)
function saveLocalBookings(bookings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
}

// Helper to get bookings - tries Firebase first, falls back to local
async function getBookings() {
  if (adminDb) {
    try {
      const snapshot = await adminDb.collection('bookings').orderBy('createdAt', 'desc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn("Firestore get bookings error, falling back to local:", e);
    }
  }
  return getLocalBookings();
}

// Helper to save booking - saves to both Firebase and local
async function saveBooking(booking) {
  let saved = false;
  if (adminDb) {
    try {
      const docRef = await adminDb.collection('bookings').add({
        ...booking,
        firestoreTimestamp: new Date()
      });
      booking.id = docRef.id;
      saved = true;
    } catch (e) {
      console.warn("Firestore save booking error:", e);
    }
  }
  // Always save to local as backup
  const bookings = getLocalBookings();
  bookings.unshift(booking);
  saveLocalBookings(bookings);
  return saved;
}

// Helper to update booking status
async function updateBookingStatus(id, status) {
  if (adminDb) {
    try {
      await adminDb.collection('bookings').doc(id).update({ status, updatedAt: new Date() });
    } catch (e) {
      console.warn("Firestore update booking error:", e);
    }
  }
  // Also update local
  const bookings = getLocalBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    bookings[index].status = status;
    saveLocalBookings(bookings);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', library: 'ShreeJi Reading Library API', timestamp: new Date() });
});

// GET all bookings (Admin)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await getBookings();
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// POST new booking request
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

  await saveBooking(newBooking);

  console.log(`[ShreeJi Library] New Booking Received: ${name} (${phone}) - Plan: ${plan}`);

  res.status(201).json({
    success: true,
    message: 'Booking request sent successfully! Our library coordinator will contact you shortly.',
    booking: newBooking
  });
});

// PATCH update booking status (Admin)
app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await updateBookingStatus(id, status);
    
    // Get updated booking
    const bookings = await getBookings();
    const updatedBooking = bookings.find(b => b.id === id);

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({ success: true, message: 'Booking updated.', booking: updatedBooking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

// GET seat availability status
app.get('/api/seat-availability', (req, res) => {
  res.json({
    success: true,
    totalSeats: 60,
    availableSeats: 14,
    shifts: {
      morning: { name: 'Morning Shift (6am-12pm)', total: 20, filled: 16, price: 700 },
      evening: { name: 'Evening Shift (12pm-6pm)', total: 20, filled: 15, price: 700 },
      night: { name: 'Night Owl (6pm-11pm)', total: 10, filled: 7, price: 800 },
      fullDay: { name: 'Full Day (6am-11pm)', total: 10, filled: 8, price: 1000 }
    }
  });
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