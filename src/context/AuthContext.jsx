import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
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
} from '../firebase';

const AuthContext = createContext();

// Pre-configured Admin Credentials
const ADMIN_CREDENTIALS = {
  ids: ['admin', 'admin@shreejilibrary.com', 'shreejiadmin@gmail.com', 'admin@shreeji.com'],
  passwords: ['1234', 'admin123', 'shreeji2026', 'admin@123', 'admin@shreeji2026']
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shreeji_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let role = 'student';
        let profileData = {};

        // 1. Check if email matches admin patterns
        if (ADMIN_CREDENTIALS.ids.includes(fbUser.email?.toLowerCase())) {
          role = 'admin';
        }

        // 2. Fetch role & custom claims from Firestore if available
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role) role = data.role;
              profileData = data;
            }
          } catch (e) {
            console.warn("Could not fetch user profile from Firestore:", e);
          }
        }

        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || profileData.name || (role === 'admin' ? 'Library Administrator' : 'Student'),
          role: role,
          seatNumber: profileData.seatNumber || null,
          hasActiveBooking: !!profileData.seatNumber,
          studentId: profileData.studentId || `SJ-2026-${Math.floor(100 + Math.random() * 900)}`,
          phone: profileData.phone || '',
          plan: profileData.plan || null,
          ...profileData
        };

        setCurrentUser(userData);
        try {
          localStorage.setItem('shreeji_auth_user', JSON.stringify(userData));
        } catch {}
      } else {
        const local = localStorage.getItem('shreeji_auth_user');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.isLocalMaster || parsed.uid) {
              setCurrentUser(parsed);
              setLoading(false);
              return;
            }
          } catch {}
        }
        setCurrentUser(null);
        try {
          localStorage.removeItem('shreeji_auth_user');
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to normalize phone number to 10 digits
  const normalizePhone = (phone) => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Handle +91 or 91 prefix
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return digits;
  };

  // Check uniqueness of Phone and Email across Firestore and Local Cache
  const checkUniquePhoneAndEmail = async (phone, email) => {
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email?.trim()?.toLowerCase();

    // 1. Check Local storage records
    try {
      const localUsers = JSON.parse(localStorage.getItem('shreeji_registered_students') || '[]');
      if (cleanPhone) {
        const phoneExists = localUsers.some(u => u.phone === cleanPhone);
        if (phoneExists) {
          throw new Error("An account with this Mobile Number already exists. Please login instead.");
        }
      }
      if (cleanEmail) {
        const emailExists = localUsers.some(u => u.email && u.email.toLowerCase() === cleanEmail);
        if (emailExists) {
          throw new Error("An account with this Email Address already exists. Please login instead.");
        }
      }
    } catch (e) {
      if (e.message.includes("already exists")) throw e;
    }

    // 2. Check Firestore Database records
    if (db) {
      try {
        if (cleanPhone) {
          const qPhone = query(collection(db, 'users'), where('phone', '==', cleanPhone));
          const phoneSnap = await getDocs(qPhone);
          if (!phoneSnap.empty) {
            throw new Error("An account with this Mobile Number already exists. Please login instead.");
          }
        }

        if (cleanEmail) {
          const qEmail = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const emailSnap = await getDocs(qEmail);
          if (!emailSnap.empty) {
            throw new Error("An account with this Email Address already exists. Please login instead.");
          }
        }
      } catch (err) {
        if (err.message.includes("already exists")) throw err;
        console.warn("Firestore uniqueness check notice:", err);
      }
    }
  };

  // 1. Unified Login: Automatically determines Admin vs Student from ID and Password
  const login = async (emailOrId, password) => {
    setLoading(true);

    const cleanInput = emailOrId.trim();
    const cleanPass = password.trim();

    // Check backend Master Admin Credentials
    const isAdminId = ADMIN_CREDENTIALS.ids.some(id => id.toLowerCase() === cleanInput.toLowerCase());
    const isAdminPass = ADMIN_CREDENTIALS.passwords.includes(cleanPass);

    if (isAdminId && isAdminPass) {
      const adminUser = {
        uid: 'master-admin-01',
        email: 'admin@shreejilibrary.com',
        displayName: 'Library Chief Administrator',
        role: 'admin',
        isLocalMaster: true
      };
      setCurrentUser(adminUser);
      localStorage.setItem('shreeji_auth_user', JSON.stringify(adminUser));
      setLoading(false);
      return { success: true, user: adminUser, role: 'admin' };
    }

    // Normalize phone for lookup
    const normalizedPhone = normalizePhone(cleanInput);
    
    // Check if user is registered in Firestore database
    if (db) {
      try {
        // Try exact match first, then normalized phone
        const qPhone = query(collection(db, 'users'), where('phone', '==', cleanInput));
        const qPhoneNorm = normalizedPhone !== cleanInput ? query(collection(db, 'users'), where('phone', '==', normalizedPhone)) : null;
        const qEmail = query(collection(db, 'users'), where('email', '==', cleanInput.toLowerCase()));
        
        const queries = [getDocs(qPhone), getDocs(qEmail)];
        if (qPhoneNorm) queries.splice(1, 0, getDocs(qPhoneNorm));
        
        const results = await Promise.all(queries);
        const phoneSnap = results[0];
        const phoneNormSnap = qPhoneNorm ? results[1] : null;
        const emailSnap = qPhoneNorm ? results[2] : results[1];
        
        const matchedDoc = !phoneSnap.empty ? phoneSnap.docs[0] : 
                           (phoneNormSnap && !phoneNormSnap.empty ? phoneNormSnap.docs[0] : 
                           (!emailSnap.empty ? emailSnap.docs[0] : null));

        if (matchedDoc) {
          const uData = matchedDoc.data();
          if (uData.password && uData.password !== cleanPass) {
            setLoading(false);
            throw new Error("Incorrect password. Please try again.");
          }

          const loggedInUser = {
            uid: matchedDoc.id,
            ...uData,
            hasActiveBooking: !!uData.seatNumber,
            role: uData.role || 'student'
          };

          setCurrentUser(loggedInUser);
          localStorage.setItem('shreeji_auth_user', JSON.stringify(loggedInUser));
          setLoading(false);
          return { success: true, user: loggedInUser, role: loggedInUser.role };
        }
      } catch (err) {
        if (err.message.includes("password")) throw err;
      }
    }

    // Check Local Storage registered students fallback
    try {
      const localUsers = JSON.parse(localStorage.getItem('shreeji_registered_students') || '[]');
      const matched = localUsers.find(u => 
        u.phone === cleanInput || 
        u.phone === normalizedPhone ||
        (u.email && u.email.toLowerCase() === cleanInput.toLowerCase())
      );
      if (matched) {
        if (matched.password && matched.password !== cleanPass) {
          setLoading(false);
          throw new Error("Incorrect password. Please try again.");
        }
        const loggedInUser = {
          ...matched,
          hasActiveBooking: !!matched.seatNumber
        };
        setCurrentUser(loggedInUser);
        localStorage.setItem('shreeji_auth_user', JSON.stringify(loggedInUser));
        setLoading(false);
        return { success: true, user: loggedInUser, role: 'student' };
      }
    } catch (err) {
      if (err.message.includes("password")) throw err;
    }

    // Standard Firebase Authentication
    if (auth) {
      try {
        let emailToAuth = cleanInput;
        const normalizedPhoneForAuth = normalizePhone(cleanInput);
        if (/^\d{10}$/.test(normalizedPhoneForAuth)) {
          emailToAuth = `${normalizedPhoneForAuth}@student.shreejilibrary.com`;
        }

        const userCredential = await signInWithEmailAndPassword(auth, emailToAuth, password);
        const fbUser = userCredential.user;

        let role = 'student';
        if (ADMIN_CREDENTIALS.ids.includes(emailToAuth.toLowerCase())) {
          role = 'admin';
        }

        const userData = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || (role === 'admin' ? 'Administrator' : 'Student'),
          hasActiveBooking: false,
          role
        };

        setCurrentUser(userData);
        localStorage.setItem('shreeji_auth_user', JSON.stringify(userData));
        setLoading(false);
        return { success: true, user: userData, role };
      } catch (err) {
        setLoading(false);
        throw new Error("Invalid login credentials. Please check your Phone/Email and password.");
      }
    } else {
      setLoading(false);
      throw new Error("Invalid login credentials.");
    }
  };

  // 2. Sign Up Function: Registers student account (Seat is assigned only upon booking reservation!)
  const signup = async ({ name, email, phone, password, role = 'student', seatNumber = null, plan = null }) => {
    setLoading(true);

    const cleanPhone = normalizePhone(phone?.trim());
    const cleanEmail = email?.trim();
    const cleanPass = password?.trim() || 'shreeji123';

    // Validate phone is 10 digits
    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      setLoading(false);
      throw new Error("Please enter a valid 10-digit mobile number.");
    }

    // 1. Enforce Phone & Email Uniqueness
    await checkUniquePhoneAndEmail(cleanPhone, cleanEmail);

    const generatedId = `SJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    let emailToUse = cleanEmail;
    if (!emailToUse && cleanPhone) {
      emailToUse = `${cleanPhone}@student.shreejilibrary.com`;
    }

    let createdUid = `user-${Date.now()}`;

    // 2. Attempt Firebase Authentication
    if (auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, cleanPass);
        const fbUser = userCredential.user;
        createdUid = fbUser.uid;
        await updateProfile(fbUser, { displayName: name });
      } catch (fbErr) {
        console.warn("Firebase Auth fallback notice:", fbErr.code || fbErr.message);
        if (fbErr.code === 'auth/email-already-in-use') {
          setLoading(false);
          throw new Error("An account with this Email or Phone is already registered. Please log in.");
        }
      }
    }

    // 3. Save User Profile (Notice: seatNumber is only assigned when a seat is actually booked!)
    const profileData = {
      uid: createdUid,
      name: name.trim(),
      email: cleanEmail || '',
      phone: cleanPhone,
      password: cleanPass,
      seatNumber: seatNumber || null,
      hasActiveBooking: !!seatNumber,
      plan: plan || null,
      studentId: generatedId,
      role: role,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', createdUid), profileData);
      } catch (e) {
        console.warn("Firestore user save warning:", e);
      }
    }

    // 4. Save to Local storage cache
    try {
      const existing = JSON.parse(localStorage.getItem('shreeji_registered_students') || '[]');
      existing.push(profileData);
      localStorage.setItem('shreeji_registered_students', JSON.stringify(existing));
    } catch {}

    setCurrentUser(profileData);
    localStorage.setItem('shreeji_auth_user', JSON.stringify(profileData));
    setLoading(false);
    return { success: true, user: profileData, role };
  };

  // 4. Update seat allocation for user when they book
  const assignSeatToUser = (seatNumber, plan) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      seatNumber,
      plan,
      hasActiveBooking: true
    };
    setCurrentUser(updated);
    localStorage.setItem('shreeji_auth_user', JSON.stringify(updated));
    if (db && currentUser.uid) {
      try {
        setDoc(doc(db, 'users', currentUser.uid), { seatNumber, plan, hasActiveBooking: true }, { merge: true });
      } catch {}
    }
  };

  // 5. Logout
  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch {}
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('shreeji_auth_user');
    } catch {}
  };

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      isStudent,
      loading,
      login,
      signup,
      assignSeatToUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
