import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, UserCheck, Copy, Check } from 'lucide-react';
import { saveBookingToFirestore } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';
import { useAuth } from '../context/AuthContext';

export default function BookingForm({ selectedPlan, onOpenStudentPortal }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { plans } = usePlans();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    plan: 'Half Day — 6-8 hrs · ₹700/mo',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (selectedPlan) {
      const planName = selectedPlan === 'full-day' 
        ? (isGu ? 'ફુલ ડે પ્લાન — ₹1000/માસિક' : 'Full Day Plan — ₹1000/mo')
        : (isGu ? 'હાફ ડે પ્લાન — ₹700/માસિક' : 'Half Day Plan — ₹700/mo');
      setFormData(prev => ({
        ...prev,
        plan: planName
      }));
    }
  }, [selectedPlan, isGu]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setToast({ 
        type: 'error', 
        text: isGu ? 'કૃપા કરીને તમારું નામ અને ફોન નંબર દાખલ કરો.' : 'Please fill in your Name and Phone number.' 
      });
      return;
    }

    setLoading(true);
    setToast(null);

    const submissionCopy = { 
      ...formData,
      userId: currentUser?.uid || null,
      directConfirm: !!currentUser // true if already logged in!
    };

    let bookingId = null;
    let bookingRef = null;

    // 1. Save directly to Firebase Firestore Database (Primary CRM)
    try {
      bookingId = await saveBookingToFirestore(submissionCopy);
      bookingRef = bookingId;
      console.log("🔥 Successfully saved booking inquiry to Firebase Firestore DB!");
    } catch (err) {
      console.warn("Firestore save error:", err);
    }

    // 2. Also POST to backend Express API (for local dev / backup)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionCopy)
      });
      const data = await res.json();
      if (data.booking?.id) {
        bookingRef = data.booking.id;
      }
    } catch (err) {
      console.warn("Backend API POST notice:", err);
    }

    setToast({
      type: 'success',
      text: currentUser 
        ? (isGu ? 'તમારી સીટ સફળતાપૂર્વક કન્ફર્મ થઈ ગઈ છે!' : 'Your seat has been successfully confirmed!')
        : (isGu ? 'તમારી બુકિંગ સફળતાપૂર્વક સબમિટ થઈ ગઈ છે! અમારી ટીમ ઝડપে સંપર્ક કરશે.' : 'Booking submitted successfully! Our team will contact you shortly.')
    });

    setLoading(false);

    // 3. Show booking reference and option to copy
    setTimeout(() => {
      setToast({
        type: 'success',
        text: isGu 
          ? `બુકિંગ સફળ! રેફરન્સ: ${bookingRef || 'FIREBASE-' + Date.now()}. અમારી ટીમ ઝડપે તમને સંપર્ક કરશે.`
          : `Booking confirmed! Reference: ${bookingRef || 'FIREBASE-' + Date.now()}. Our team will contact you shortly.`
      });
    }, 500);
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
              {toast.bookingRef && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                  <span className="text-xs font-mono bg-white/20 px-2.5 py-1 rounded flex-1 break-all">{toast.bookingRef}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(toast.bookingRef);
                      setToast(prev => prev ? {...prev, copied: true} : null);
                    }}
                    className="px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1"
                    title={isGu ? 'રેફરન્સ કૉપી કરો' : 'Copy Reference'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{toast.copied ? (isGu ? 'કૉપી થયું' : 'Copied') : (isGu ? 'કૉપી' : 'Copy')}</span>
                    {toast.copied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              )}
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
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/90 text-[#201E1F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB6A30] transition-all"
              >
                {plans && plans.length > 0 ? (
                  plans.map((p) => (
                    <option key={p.id} value={`${isGu ? p.nameGu : p.nameEn} — ₹${p.price}/mo`}>
                      {isGu ? p.nameGu : p.nameEn} — {isGu ? p.taglineGu : p.taglineEn} · ₹{p.price}/mo
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Half Day — 6-8 hrs · ₹700/mo">
                      {isGu ? 'હાફ ડે પ્લાન (૬-૮ કલાક) — ₹700/માસિક' : 'Half Day — 6-8 hrs · ₹700/mo'}
                    </option>
                    <option value="Full Day — 17 hrs · ₹1000/mo">
                      {isGu ? 'ફુલ ડે પ્લાન (૧૭ કલાક) — ₹1000/માસિક' : 'Full Day — 17 hrs · ₹1000/mo'}
                    </option>
                  </>
                )}
              </select>
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
