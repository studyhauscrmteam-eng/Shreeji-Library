import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLivePlans } from '../firebase';

// Fallback shown only when the backend/CRM is unreachable.
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

const STANDARD_BENEFITS_EN = [
  'Personal reserved desk with power socket',
  'AC + High-Speed Wi-Fi + charging',
  'Personal locker access',
  'Purified RO drinking water',
  'Terrace refreshment lounge access',
  'Open all 7 days including holidays',
];

const STANDARD_BENEFITS_GU = [
  'પાવર સોકેટ સાથે વ્યક્તિગત રિઝર્વ્ડ ડેસ્ક',
  'AC + હાઇ-સ્પીડ Wi-Fi + ચાર્જિંગ',
  'સુરક્ષિત લોકર સુવિધા',
  'શુદ્ધ RO પીવાનું પાણી',
  'ટેરેસ રિફ્રેશમેન્ટ લાઉન્જ એક્સેસ',
  'રજાઓ સહિત અઠવાડિયાના ૭ દિવસ ખુલ્લું',
];

// Map a CRM `membershipPlans` doc to the website card shape.
const mapCrmPlanToWebsite = (crmPlan, index, total) => {
  const priceNum = Number(crmPlan.price) || 0;
  const duration = crmPlan.duration || '1 Month';
  const seatType = crmPlan.seatType || 'Fixed';
  const name = crmPlan.planName || `Plan ${index + 1}`;
  // Feature the most expensive plan (or the single plan) by default.
  const featured = total === 1 ? true : index === total - 1;
  return {
    id: crmPlan.id,
    crmId: crmPlan.id,
    nameEn: name,
    nameGu: name,
    taglineEn: `${duration} · ${seatType} seat`,
    taglineGu: `${duration} · ${seatType} સીટ`,
    price: String(priceNum),
    duration,
    seatType,
    crmStatus: crmPlan.status || 'Active',
    crmNotes: crmPlan.notes || '',
    featured,
    badgeEn: featured ? 'Recommended' : '',
    badgeGu: featured ? 'સૌથી વધુ પસંદગી' : '',
    // CRM plans don't carry marketing benefit lists, so show standard inclusions.
    benefitsEn: STANDARD_BENEFITS_EN,
    benefitsGu: STANDARD_BENEFITS_GU,
  };
};

const PlansContext = createContext();

export const PlansProvider = ({ children }) => {
  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('shreeji_live_plans_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultPlans;
  });

  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState('');

  // Single source of truth: CRM `membershipPlans` via GET /api/plans.
  const refreshPlans = useCallback(async () => {
    setSyncing(true);
    try {
      const crmPlans = await fetchLivePlans();
      if (Array.isArray(crmPlans) && crmPlans.length > 0) {
        const mapped = crmPlans.map((p, i) => mapCrmPlanToWebsite(p, i, crmPlans.length));
        setPlans(mapped);
        setLive(true);
        setSyncError('');
        setLastSyncedAt(new Date().toISOString());
        try {
          localStorage.setItem('shreeji_live_plans_cache', JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
      setSyncError('No active plans returned by CRM.');
      setLive(false);
      return null;
    } catch (e) {
      console.warn('Live plans sync failed, using cached fallback:', e.message);
      setSyncError(e.message || 'Could not reach backend.');
      setLive(false);
      return null;
    } finally {
      setSyncing(false);
    }
  }, []);

  // Load on mount + re-poll so CRM edits appear without redeploy.
  useEffect(() => {
    refreshPlans();
    const timer = setInterval(refreshPlans, 30000);
    const onFocus = () => refreshPlans();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshPlans]);

  // ---- Legacy local-edit API (kept so AdminModal doesn't crash).
  // Plans are now managed in the CRM; these only patch local state.
  const patchLocal = (updater) => {
    setPlans((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('shreeji_live_plans_cache', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const addBenefitPoint = async (planId, textEn, textGu = '') => {
    if (!textEn.trim()) return;
    patchLocal((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, benefitsEn: [...p.benefitsEn, textEn.trim()], benefitsGu: [...p.benefitsGu, textGu.trim() || textEn.trim()] }
          : p
      )
    );
  };

  const removeBenefitPoint = async (planId, index) => {
    patchLocal((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, benefitsEn: p.benefitsEn.filter((_, i) => i !== index), benefitsGu: p.benefitsGu.filter((_, i) => i !== index) }
          : p
      )
    );
  };

  const editBenefitPoint = async (planId, index, newTextEn, newTextGu = '') => {
    patchLocal((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const newEn = [...p.benefitsEn];
        const newGu = [...p.benefitsGu];
        newEn[index] = newTextEn.trim();
        newGu[index] = newTextGu.trim() || newTextEn.trim();
        return { ...p, benefitsEn: newEn, benefitsGu: newGu };
      })
    );
  };

  const updatePlan = async (planId, updates) => {
    patchLocal((prev) => prev.map((p) => (p.id === planId ? { ...p, ...updates } : p)));
  };

  const resetToDefaultPlans = async () => {
    await refreshPlans();
  };

  return (
    <PlansContext.Provider
      value={{
        plans,
        addBenefitPoint,
        removeBenefitPoint,
        editBenefitPoint,
        updatePlan,
        resetToDefaultPlans,
        refreshPlans,
        syncing,
        live,
        lastSyncedAt,
        syncError,
      }}
    >
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => useContext(PlansContext);
