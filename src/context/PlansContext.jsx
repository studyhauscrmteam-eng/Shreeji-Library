import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLivePlans, fetchDirectPlans } from '../firebase';

const PlansContext = createContext();

// Map a backend plan doc to the website card shape.
// Only real backend fields are used (id, planName, price, duration, seatType, notes).
const mapBackendPlanToWebsite = (backendPlan, index, total) => {
  const priceNum = Number(backendPlan.price) || 0;
  const duration = (backendPlan.duration || '').trim();
  const seatType = (backendPlan.seatType || '').trim();
  const name = (backendPlan.planName || '').trim() || `Plan ${index + 1}`;
  const notes = (backendPlan.notes || '').trim();
  // Feature the most expensive plan (or the single plan) by default.
  const featured = total === 1 ? true : index === total - 1;

  const benefitsEn = [];
  const benefitsGu = [];
  if (duration) {
    benefitsEn.push(`${duration} membership validity`);
    benefitsGu.push(`${duration} મેમ્બરશિપ માન્યતા`);
  }
  if (seatType) {
    benefitsEn.push(`${seatType} reserved seat`);
    benefitsGu.push(`${seatType} રિઝર્વ્ડ સીટ`);
  }
  benefitsEn.push(`One-time payment of ₹${priceNum}`);
  benefitsGu.push(`₹${priceNum} એક વખતની ચુકવણી`);
  if (notes) {
    benefitsEn.push(notes);
    benefitsGu.push(notes);
  }
  // Pass through backend-provided benefit lists when present.
  if (Array.isArray(backendPlan.benefitsEn) && backendPlan.benefitsEn.length > 0) {
    benefitsEn.push(...backendPlan.benefitsEn);
  }
  if (Array.isArray(backendPlan.benefitsGu) && backendPlan.benefitsGu.length > 0) {
    benefitsGu.push(...backendPlan.benefitsGu);
  }

  return {
    id: backendPlan.id,
    nameEn: name,
    nameGu: name,
    taglineEn: [duration, seatType ? `${seatType} seat` : ''].filter(Boolean).join(' · '),
    taglineGu: [duration, seatType ? `${seatType} સીટ` : ''].filter(Boolean).join(' · '),
    price: String(priceNum),
    duration,
    seatType,
    status: backendPlan.status || 'Active',
    // Per-plan seat selection flag from the CRM. Missing flag = view-only.
    seatPreference: backendPlan.seatPreference === true,
    notes,
    featured,
    badgeEn: featured ? 'Recommended' : '',
    badgeGu: featured ? 'સૌથી વધુ પસંદગી' : '',
    benefitsEn,
    benefitsGu,
  };
};

export const PlansProvider = ({ children }) => {
  // No hardcoded plans: the list is always real backend data (or empty on error).
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Signature of the last applied list — silent refreshes skip setPlans when
  // data is unchanged so dropdowns/cards don't blink or re-animate.
  const lastSignatureRef = React.useRef('');

  const refreshPlans = useCallback(async (silent = false) => {
    // Silent background refreshes never touch `loading` (the dropdown only
    // shows "Loading…" when the list is empty AND loading is true).
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      // Backend first (local dev), direct Firestore when it fails or is
      // empty (static hosting has no /api — it would serve the homepage).
      let list = [];
      try {
        const backendPlans = await fetchLivePlans();
        if (Array.isArray(backendPlans) && backendPlans.length > 0) list = backendPlans;
      } catch {}
      if (list.length === 0) list = await fetchDirectPlans();
      const sorted = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      const mapped = sorted.map((p, i) => mapBackendPlanToWebsite(p, i, sorted.length));
      // The CRM `featured` flag is the ONLY source of the Recommended badge.
      // No flags anywhere = no badge anywhere (never auto-crown a plan).
      const isFlagged = (p) => p && (p.featured === true || p.featured === 'true');
      mapped.forEach((m, i) => { m.featured = isFlagged(sorted[i]); });
      const signature = JSON.stringify(mapped.map((p) => [p.id, p.nameEn, p.price, p.duration, p.seatType, p.status, p.notes, p.featured, p.seatPreference, p.badgeEn]));
      if (signature !== lastSignatureRef.current) {
        lastSignatureRef.current = signature;
        setPlans(mapped);
      }
      if (!silent) setError('');
    } catch (e) {
      // Never wipe a good list on a failed background poll — keep showing
      // cached plans instead of blinking to an error/empty state.
      if (!silent && lastSignatureRef.current === '') {
        setError(e.message || 'Could not load plans.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Load once on mount. A slow silent background sync (5 min) picks up
  // CRM plan changes without blinking the dropdown: it never sets `loading`
  // and never replaces the list when data is unchanged. No focus refetch —
  // tabbing back to the page used to flip the field into "Loading…".
  useEffect(() => {
    refreshPlans(false);
    const timer = setInterval(() => refreshPlans(true), 300000);
    return () => clearInterval(timer);
  }, [refreshPlans]);

  return (
    <PlansContext.Provider value={{ plans, loading, error, refreshPlans: () => refreshPlans(false) }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => useContext(PlansContext);
