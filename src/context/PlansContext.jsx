import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchLivePlans } from '../firebase';

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

  const refreshPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const backendPlans = await fetchLivePlans();
      const list = Array.isArray(backendPlans) ? backendPlans : [];
      const sorted = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      setPlans(sorted.map((p, i) => mapBackendPlanToWebsite(p, i, sorted.length)));
    } catch (e) {
      setPlans([]);
      setError(e.message || 'Could not load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + silently re-poll so backend changes appear without redeploy.
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

  return (
    <PlansContext.Provider value={{ plans, loading, error, refreshPlans }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => useContext(PlansContext);
