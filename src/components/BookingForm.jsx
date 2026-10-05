import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ChevronDown, Check } from 'lucide-react';
import { submitBookingViaAPI } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

// Strict 10-digit Indian mobile: exactly 10 digits, starting 6-9.
const isValidPhone10 = (phone) => /^[6-9]\d{9}$/.test(String(phone || ''));

// Sanitize phone keystrokes/paste to digits-only, max 10 digits.
// Tolerates "+91…" / "0…" pastes by keeping the last 10 digits.
const sanitizePhoneInput = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length > 10) {
    if (digits.startsWith('91') && digits.length <= 12) digits = digits.slice(-10);
    else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(-10);
    else digits = digits.slice(0, 10);
  }
  return digits.slice(0, 10);
};

export default function BookingForm({ selectedPlan }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { plans, loading: plansLoading, error: plansError, refreshPlans } = usePlans();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    planId: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const planDropdownRef = useRef(null);
  // The plan field only shows a loading state on the very first load.
  // Background plan syncs are silent, so the dropdown never blinks/reloads.
  const plansEmpty = !plans || plans.length === 0;
  const plansBusy = plansLoading && plansEmpty;

  // Default to the first plan once plans arrive.
  useEffect(() => {
    if (plans && plans.length > 0) {
      setFormData((prev) => {
        if (prev.planId && plans.some((p) => p.id === prev.planId)) return prev;
        return { ...prev, planId: plans[0].id };
      });
    }
  }, [plans]);

  // A plan card ("Select this Plan") passes a plan id -> preselect it + scroll target.
  useEffect(() => {
    if (selectedPlan && plans && plans.length > 0) {
      const match = plans.find((p) => p.id === selectedPlan);
      if (match) {
        setFormData((prev) => ({ ...prev, planId: match.id }));
      }
    }
  }, [selectedPlan, plans]);

  // Close the plan dropdown on outside click or Escape.
  useEffect(() => {
    if (!planDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (planDropdownRef.current && !planDropdownRef.current.contains(e.target)) {
        setPlanDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setPlanDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [planDropdownOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const clean = sanitizePhoneInput(value);
      setFormData((prev) => ({ ...prev, phone: clean }));
      // Live 10-digit feedback (only after the user typed something).
      if (clean.length > 0 && clean.length < 10) {
        setPhoneError(isGu ? 'मोबाइल नंबर १० अंक का होना चाहिए.' : 'Mobile number must be 10 digits.');
      } else if (clean.length === 10 && !isValidPhone10(clean)) {
        setPhoneError(isGu ? 'सही १० अंक का मोबाइल नंबर डालें (6-9 से शुरू).' : 'Enter a valid 10-digit mobile number (starts 6-9).');
      } else {
        setPhoneError('');
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedPlanObj = plans?.find((p) => p.id === formData.planId) || plans?.[0] || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(formData.phone);

    if (!formData.name.trim() || !cleanPhone) {
      setToast({
        type: 'error',
        text: isGu ? 'કૃપા કરીને તમારું નામ અને ફોન નંબર દાખલ કરો.' : 'Please fill in your Name and Phone number.'
      });
      return;
    }
    if (cleanPhone.length !== 10 || !isValidPhone10(cleanPhone)) {
      const msg = isGu ? 'કૃપા કરીને સાચો ૧૦ અંકનો મોબાઇલ નંબર દાખલ કરો (ફક્ત અંક, 6-9 થી શરૂ).' : 'Please enter a valid 10-digit mobile number (digits only, starts 6-9).';
      setPhoneError(isGu ? 'मोबाइल नंबर १० अंक का होना चाहिए.' : 'Mobile number must be 10 digits.');
      setToast({ type: 'error', text: msg });
      return;
    }
    setPhoneError('');

    if (!selectedPlanObj) {
      setToast({
        type: 'error',
        text: isGu ? 'પ્લાન લોડ થઈ રહ્યા છે. કૃપા કરીને થોડી રાહ જુઓ અને ફરી પ્રયાસ કરો.' : 'Plans are still loading. Please wait a moment and try again.'
      });
      return;
    }

    setLoading(true);
    setToast(null);

    const submissionCopy = {
      name: formData.name.trim(),
      phone: cleanPhone,
      email: (formData.email || '').trim(),
      planId: selectedPlanObj?.id || formData.planId || '',
      planName: selectedPlanObj ? `${selectedPlanObj.nameEn} — ₹${selectedPlanObj.price}/mo` : '',
      plan: selectedPlanObj ? `${selectedPlanObj.nameEn} — ₹${selectedPlanObj.price}/mo` : '',
      message: formData.message || ''
    };

    try {
      const booking = await submitBookingViaAPI(submissionCopy);
      const ref = booking?.id || `REQ-${Date.now()}`;
      setToast({
        type: 'success',
        text: isGu
          ? `વિનંતી મળી ગઈ છે — એડમિન મંજૂરી બાકી છે. Ref: ${ref}. મંજૂર થયે અમે તમને ઇમેઇલ કરીશું.`
          : `Request received — pending admin approval. Ref: ${ref}. We will email you once approved.`
      });
      setFormData((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      console.error('Booking submit failed:', err);
      setToast({
        type: 'error',
        text: err.message || (isGu ? 'બુકિંગ નિષ્ફળ ગઈ. કૃપા કરીને ફરી પ્રયાસ કરો.' : 'Booking failed. Please try again.')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-24 bg-[#201E1F] text-white relative overflow-hidden">

      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[350px] sm:h-[500px] bg-[#983132]/25 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#983132]/40 border border-[#EB6A30]/40 text-[#FFF0E8] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#EB6A30]" />
            <span>{t('booking.badge')}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            {t('booking.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('booking.headingHighlight')}</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#F5E4E4]/80 max-w-xl mx-auto">
            {t('booking.subtitle')}
          </p>
        </motion.div>

        {/* Toast Alert */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-8 p-4 rounded-2xl flex items-start gap-3 text-sm font-semibold transition-all ${
              toast.type === 'success' ? 'bg-[#983132] text-white border border-[#EB6A30]' : 'bg-red-900/80 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#EB6A30] shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <span>{toast.text}</span>
            </div>
          </motion.div>
        )}

        {/* Form Container */}
        <motion.form
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-white/15 shadow-2xl space-y-6"
        >

          {/* Row 1: Name and Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#F5E4E4] mb-2">
                {t('booking.fullName')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('booking.fullNamePlaceholder')}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#F5E4E4] mb-2">
                {t('booking.phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('booking.phonePlaceholder')}
                required
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                minLength={10}
                maxLength={10}
                autoComplete="tel-national"
                aria-invalid={phoneError ? 'true' : 'false'}
                className={`w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${phoneError ? 'focus:ring-red-500 ring-2 ring-red-400' : 'focus:ring-[#EB6A30]'}`}
              />
              {phoneError ? (
                <p className="mt-1.5 text-[11px] font-semibold text-red-300">{phoneError}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-white/40">
                  {formData.phone.length}/10 {isGu ? 'અંક' : 'digits'}
                </p>
              )}
            </div>

          </div>

          {/* Row 2: Email Address and Preferred Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#F5E4E4] mb-2">
                {isGu ? 'ઇમેઇલ એડ્રેસ' : 'EMAIL ADDRESS'}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#F5E4E4] mb-2">
                {t('booking.planSelect')}
              </label>
              <div ref={planDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPlanDropdownOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={planDropdownOpen}
                  disabled={plansBusy}
                  className={`w-full px-4 py-3.5 rounded-2xl bg-white text-[#201E1F] text-sm font-medium flex items-center justify-between gap-3 transition-all border-2 disabled:opacity-70 disabled:cursor-wait ${
                    planDropdownOpen ? 'border-[#EB6A30]' : 'border-transparent'
                  } focus:outline-none focus:border-[#EB6A30]`}
                >
                  {plansBusy ? (
                    <span className="text-gray-500">
                      {isGu ? 'પ્લાન લોડ થઈ રહ્યા છે…' : 'Loading plans…'}
                    </span>
                  ) : selectedPlanObj ? (
                    <span className="flex items-center justify-between gap-3 flex-1 min-w-0">
                      <span className="truncate font-semibold">
                        {isGu ? selectedPlanObj.nameGu : selectedPlanObj.nameEn}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-white bg-[#983132] px-2.5 py-1 rounded-full">
                        ₹{selectedPlanObj.price}{selectedPlanObj.duration ? ` · ${selectedPlanObj.duration}` : ''}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {isGu ? 'કોઈ પ્લાન ઉપલબ્ધ નથી' : 'No plans available'}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 shrink-0 text-[#983132] transition-transform duration-200 ${planDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {plansError && plans.length === 0 && (
                  <p className="mt-1.5 text-[11px] text-amber-300">
                    {isGu ? 'પ્લાન લોડ થઈ શક્યા નથી. ' : 'Could not load plans. '}
                    <button type="button" onClick={refreshPlans} className="underline font-bold hover:text-white">
                      {isGu ? 'ફરી પ્રયાસ કરો' : 'Retry'}
                    </button>
                  </p>
                )}

                <AnimatePresence>
                  {planDropdownOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      role="listbox"
                      className="absolute z-30 mt-2 w-full rounded-2xl bg-white text-[#201E1F] shadow-2xl border border-[#F5E4E4] overflow-hidden p-1.5"
                    >
                      {plans.map((p) => {
                        const isSelected = p.id === formData.planId;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, planId: p.id }));
                                setPlanDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors ${
                                isSelected ? 'bg-[#FFF0E8]' : 'hover:bg-[#FFF8F5]'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'border-[#EB6A30] bg-[#EB6A30] text-white' : 'border-gray-300 text-transparent'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-bold truncate">
                                  {isGu ? p.nameGu : p.nameEn}
                                </span>
                                <span className="block text-[11px] text-[#201E1F]/60 truncate">
                                  {isGu ? p.taglineGu : p.taglineEn}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-extrabold text-[#983132]">
                                ₹{p.price}{p.duration ? ` / ${p.duration}` : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Row 3: Message / Exam Goal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#F5E4E4] mb-2">
              {isGu ? 'મેસેજ / પરીક્ષા લક્ષ્ય (વૈકલ્પિક)' : 'MESSAGE / EXAM GOAL'}
            </label>
            <textarea
              name="message"
              rows="3"
              value={formData.message}
              onChange={handleChange}
              placeholder={isGu ? 'દા.ત. UPSC/GPSC પ્રીલિમ્સ તૈયારી, સવારની શિફ્ટ પસંદગી...' : 'e.g. UPSC Prelims prep, morning shift preferred...'}
              className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
            />
          </div>

          {/* Final Seat Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#EB6A30] hover:bg-[#d5571e] text-white font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('booking.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('booking.submitBtn')}</span>
                <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-white/50">
            🔒 {isGu ? 'તમારી સંપર્ક માહિતી ૧૦૦% સુરક્ષિત રાખવામાં આવે છે. ઝીરો સ્પામ.' : 'Your contact information is kept strictly private. Zero spam.'}
          </p>

        </motion.form>

      </div>
    </section>
  );
}
