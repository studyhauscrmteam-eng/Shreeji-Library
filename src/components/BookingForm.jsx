import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { submitBookingViaAPI } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';
import { useAuth } from '../context/AuthContext';

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

export default function BookingForm({ selectedPlan, onOpenStudentPortal }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { plans, live, syncing } = usePlans();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    planId: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Default to the first live plan once plans arrive.
  useEffect(() => {
    if (plans && plans.length > 0) {
      setFormData((prev) => {
        if (prev.planId && plans.some((p) => p.id === prev.planId)) return prev;
        return { ...prev, planId: plans[0].id };
      });
    }
  }, [plans]);

  // Auto-fill logged in student details if available
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || currentUser.name || prev.name,
        phone: currentUser.phone || prev.phone,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  // A plan card ("Select this Plan") passes a plan id -> preselect it + scroll target.
  useEffect(() => {
    if (selectedPlan && plans && plans.length > 0) {
      const match =
        plans.find((p) => p.id === selectedPlan) ||
        plans.find((p) => p.crmId === selectedPlan);
      if (match) {
        setFormData((prev) => ({ ...prev, planId: match.id }));
      }
    }
  }, [selectedPlan, plans]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (!/^\d{10}$/.test(cleanPhone)) {
      setToast({
        type: 'error',
        text: isGu ? 'કૃપા કરીને સાચો ૧૦ અંકનો મોબાઇલ નંબર દાખલ કરો.' : 'Please enter a valid 10-digit mobile number.'
      });
      return;
    }

    setLoading(true);
    setToast(null);

    const submissionCopy = {
      name: formData.name.trim(),
      phone: cleanPhone,
      email: (formData.email || '').trim(),
      planId: selectedPlanObj?.crmId || selectedPlanObj?.id || formData.planId || '',
      planName: selectedPlanObj ? `${selectedPlanObj.nameEn} — ₹${selectedPlanObj.price}/mo` : '',
      plan: selectedPlanObj ? `${selectedPlanObj.nameEn} — ₹${selectedPlanObj.price}/mo` : '',
      message: formData.message || '',
      userId: currentUser?.uid || null,
      directConfirm: !!currentUser
    };

    try {
      // Single reliable path: backend API -> CRM `students` (status Pending).
      const booking = await submitBookingViaAPI(submissionCopy);
      const ref = booking?.id || `REQ-${Date.now()}`;
      setToast({
        type: 'success',
        text: isGu
          ? `બુકિંગ સફળ! રેફરન્સ: ${ref}. અમારી ટીમ ટૂંક સમયમાં સંપર્ક કરશે.${live ? '' : ' (નોટ: પ્લાન યાદી કેશમાંથી બતાવાઈ છે)'}`
          : `Booking confirmed! Reference: ${ref}. Our team will contact you shortly.`
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

          {/* Live CRM sync indicator */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold">
            {syncing ? (
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isGu ? 'લાઇવ પ્લાન સિંક થઈ રહ્યા છે…' : 'Syncing live plans from CRM…'}
              </span>
            ) : live ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isGu ? 'CRM સાથે લાઇવ કનેક્ટેડ — પ્લાન સીધા CRMમાંથી' : 'Live connected to CRM — plans load directly from backend'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                {isGu ? 'બેકએન્ડ ઉપલબ્ધ નથી — કેશ કરેલા પ્લાન બતાવાય છે' : 'Backend unreachable — showing cached plans'}
              </span>
            )}
          </div>

          {/* Logged in indicator banner */}
          {currentUser && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isGu ? `લોગિન છે: ${currentUser.displayName || 'વિદ્યાર્થી'} (સીટ સીધી કન્ફર્મ થશે)` : `Logged in as ${currentUser.displayName || 'Student'} (Seat will confirm instantly)`}
              </span>
            </div>
          )}
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
                maxLength={13}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
              />
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
              <select
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
              >
                {plans && plans.length > 0 ? (
                  plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isGu ? p.nameGu : p.nameEn} — {isGu ? p.taglineGu : p.taglineEn} · ₹{p.price}/mo
                    </option>
                  ))
                ) : (
                  <>
                    <option value="half-day">
                      {isGu ? 'હાફ ડે પ્લાન (૬-૮ કલાક) — ₹700/માસિક' : 'Half Day — 6-8 hrs · ₹700/mo'}
                    </option>
                    <option value="full-day">
                      {isGu ? 'ફુલ ડે પ્લાન (૧૭ કલાક) — ₹1000/માસિક' : 'Full Day — 17 hrs · ₹1000/mo'}
                    </option>
                  </>
                )}
              </select>
              {selectedPlanObj && (
                <p className="mt-1.5 text-[11px] text-white/60">
                  {isGu ? 'પસંદ કરેલ: ' : 'Selected: '}{isGu ? selectedPlanObj.nameGu : selectedPlanObj.nameEn} · ₹{selectedPlanObj.price}
                  {selectedPlanObj.duration ? ` · ${selectedPlanObj.duration}` : ''}
                </p>
              )}
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
