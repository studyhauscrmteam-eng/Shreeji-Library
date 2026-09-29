import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';

const defaultPlans = [
  {
    id: 'half-day',
    nameEn: 'Half Day Plan',
    nameGu: 'હાફ ડે પ્લાન',
    taglineEn: '6–8 hours daily',
    taglineGu: 'રોજના ૬-૮ કલાક',
    price: '700',
    featured: false,
    badgeEn: '',
    badgeGu: '',
    benefitsEn: [
      'Choice of morning / evening shift',
      'Personal desk allocation',
      'AC + High-Speed Wi-Fi + charging',
      'Personal locker access',
      'Purified RO drinking water',
      'Weekend access included',
    ],
    benefitsGu: [
      'સવાર અથવા સાંજની શિફ્ટની પસંદગી',
      'વ્યક્તિગત ડેસ્ક ફાળવણી',
      'AC + હાઇ-સ્પીડ Wi-Fi + ચાર્જિંગ',
      'સુરક્ષિત લોકર સુવિધા',
      'શુદ્ધ RO પીવાનું પાણી',
      'રવિવાર સહિત ઉપલબ્ધ',
    ]
  },
  {
    id: 'full-day',
    nameEn: 'Full Day Plan',
    nameGu: 'ફુલ ડે પ્લાન',
    taglineEn: '17 hours daily (6 AM – 11 PM)',
    taglineGu: 'રોજના ૧૭ કલાક (સવારે ૬ થી રાત્રે ૧૧)',
    price: '1000',
    featured: true,
    badgeEn: 'Recommended',
    badgeGu: 'સૌથી વધુ પસંદગી',
    benefitsEn: [
      'Full 17-hour access: 6:00 AM – 11:00 PM',
      '100% Guaranteed fixed reserved seat',
      'Personal dedicated locker facility',
      'AC + High-Speed Wi-Fi + switchboard',
      'Open terrace refreshment lounge access',
      'Purified chilled RO drinking water',
      'Open all 7 days including public holidays',
    ],
    benefitsGu: [
      'સવારે ૬:૦૦ થી રાત્રે ૧૧:૦૦ સુધી અમર્યાદિત સમય',
      '૧૦૦% કન્ફર્મ ફિક્સ રિઝર્વ્ડ સીટ',
      'પર્સનલ ડેડિકેટેડ લોકર સુવિધા',
      'AC + હાઇ-સ્પીડ Wi-Fi + સ્વિચબોર્ડ',
      'ઓપન ટેરેસ રિફ્રેશમેન્ટ લાઉન્જ એક્સેસ',
      'શુદ્ધ RO ઠંડુ પીવાનું પાણી',
      'તમામ રજાઓ અને રવિવારે પણ ચાલુ',
    ]
  }
];

const PlansContext = createContext();

export const PlansProvider = ({ children }) => {
  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('shreeji_subscription_plans');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return defaultPlans;
  });

  const [syncing, setSyncing] = useState(false);

  // Load plans from Firebase on init
  useEffect(() => {
    const loadPlansFromFirestore = async () => {
      if (!db) return;
      try {
        setSyncing(true);
        const snapshot = await getDocs(collection(db, 'subscription_plans'));
        if (!snapshot.empty) {
          const firestorePlans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          // Merge with localStorage, preferring Firestore if newer
          const localSaved = localStorage.getItem('shreeji_subscription_plans');
          const localPlans = localSaved ? JSON.parse(localSaved) : defaultPlans;
          
          // Use Firestore as source of truth if it has data
          const mergedPlans = firestorePlans.length > 0 ? firestorePlans : localPlans;
          setPlans(mergedPlans);
          localStorage.setItem('shreeji_subscription_plans', JSON.stringify(mergedPlans));
        }
      } catch (e) {
        console.warn("Could not load plans from Firestore:", e);
      } finally {
        setSyncing(false);
      }
    };
    loadPlansFromFirestore();
  }, []);

  // Save to both localStorage and Firestore
  const savePlans = async (newPlans) => {
    setPlans(newPlans);
    try {
      localStorage.setItem('shreeji_subscription_plans', JSON.stringify(newPlans));
    } catch (e) {
      console.error(e);
    }
    
    // Also persist to Firebase for CRM sync
    if (db) {
      try {
        setSyncing(true);
        for (const plan of newPlans) {
          const { id, ...planData } = plan;
          await setDoc(doc(db, 'subscription_plans', id), {
            ...planData,
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Firestore plans sync warning:", e);
      } finally {
        setSyncing(false);
      }
    }
  };

  // 1. Add a new benefit point to a specific plan
  const addBenefitPoint = async (planId, textEn, textGu = '') => {
    if (!textEn.trim()) return;
    const updated = plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          benefitsEn: [...p.benefitsEn, textEn.trim()],
          benefitsGu: [...p.benefitsGu, (textGu.trim() || textEn.trim())]
        };
      }
      return p;
    });
    await savePlans(updated);
  };

  // 2. Remove a benefit point by index
  const removeBenefitPoint = async (planId, index) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        const newEn = p.benefitsEn.filter((_, idx) => idx !== index);
        const newGu = p.benefitsGu.filter((_, idx) => idx !== index);
        return {
          ...p,
          benefitsEn: newEn,
          benefitsGu: newGu
        };
      }
      return p;
    });
    await savePlans(updated);
  };

  // 3. Edit an existing benefit point
  const editBenefitPoint = async (planId, index, newTextEn, newTextGu = '') => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        const newEn = [...p.benefitsEn];
        const newGu = [...p.benefitsGu];
        newEn[index] = newTextEn.trim();
        newGu[index] = (newTextGu.trim() || newTextEn.trim());
        return {
          ...p,
          benefitsEn: newEn,
          benefitsGu: newGu
        };
      }
      return p;
    });
    await savePlans(updated);
  };

  // 4. Update plan details (Price, Taglines, Featured)
  const updatePlan = async (planId, updates) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        return { ...p, ...updates };
      }
      return p;
    });
    await savePlans(updated);
  };

  // 5. Reset to default initial plans
  const resetToDefaultPlans = async () => {
    await savePlans(defaultPlans);
  };

  return (
    <PlansContext.Provider value={{
      plans,
      addBenefitPoint,
      removeBenefitPoint,
      editBenefitPoint,
      updatePlan,
      resetToDefaultPlans,
      syncing
    }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => useContext(PlansContext);
