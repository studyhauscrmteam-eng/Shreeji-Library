import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, ChevronDown, Check, ExternalLink, ShieldCheck, FileText, X, Lock } from 'lucide-react';
import { submitWebsiteLead } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';

// Official Terms & Conditions in English & Gujarati (Matches terms.html exactly)
const TERMS_RULES = {
  en: [
    { title: "1. Non-Refundable & Non-Transferable Fees", desc: "All membership fees once paid are strictly non-refundable, non-transferable, and non-extendable under any circumstances except at management's sole discretion." },
    { title: "2. Seat Allocation & Reservation", desc: "Seat bookings are subject to document verification and library management approval. Seat numbers are allocated strictly based on selected plan availability." },
    { title: "3. Strict Study Hall Silence", desc: "Absolute pin-drop silence must be maintained in the study hall at all times. Group discussions, talking, and whispering are strictly prohibited." },
    { title: "4. Outside Footwear Prohibited", desc: "Outside footwear (shoes, sandals) is strictly prohibited inside the study hall. Members must keep their designated desk clean and organized." },
    { title: "5. Mobile Phone Discipline", desc: "Mobile phones must be kept on 100% silent mode (not even vibration). Attending phone calls inside the study area is strictly prohibited; use designated areas only." },
    { title: "6. Food & Beverages Restrictions", desc: "Eating meals, snacks, or outside food inside the reading hall is prohibited. Water bottles are allowed. Refreshments are permitted only in designated areas." },
    { title: "7. Personal Belongings Responsibility", desc: "Students are solely responsible for their personal belongings (laptops, books, chargers, cash). Management accepts no responsibility for lost or unattended items." },
    { title: "8. Care for Library Property & Facilities", desc: "Handle library assets, desks, chairs, AC units, and charging sockets with care. Any damage caused will be charged to the student and may result in immediate expulsion." },
    { title: "9. Document Verification & Admission Rights", desc: "Management reserves the right to verify identity documents (Aadhaar Card) and cancel admission without refund if the code of conduct is violated." },
    { title: "10. Governing Law & Jurisdiction", desc: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Bhavnagar, Gujarat." }
  ],
  gu: [
    { title: "૧. બિન-રિફંડેબલ અને અ-બદલીપાત્ર ફી", desc: "એકવાર ચૂકવેલ સભ્યપદ ફી કોઈપણ સંજોગોમાં પરત (Non-refundable), ટ્રાન્સફર (Non-transferable) કે મુદત વધારી (Non-extendable) શકાશે નહીં." },
    { title: "૨. સીટ ફાળવણી અને અનામત", desc: "સીટ બુકિંગ મેનેજમેન્ટની ચકાસણી અને મંજૂરીને આધીન છે. સીટ પસંદ કરેલ પ્લાનની ઉપલબ્ધતા મુજબ જ ફાળવવામાં આવશે." },
    { title: "૩. અભ્યાસ ખંડમાં સંપૂર્ણ શાંતિ", desc: "સ્ટડી હોલમાં હંમેશા સંપૂર્ણ શાંતિ જાળવવી ફરજિયાત છે. અંદરોઅંદર વાતચીત, ચર્ચા કે ધીમેથી બોલવાની પણ સખત મનાઈ છે." },
    { title: "૪. બહારના પગરખાં પર પ્રતિબંધ", desc: "અભ્યાસ ખંડની અંદર બહારના પગરખાં (બૂટ/ચંપલ) પહેરીને પ્રવેશવાની સખત મનાઈ છે. ડેસ્ક અને લાઈબ્રેરી પરિસર સ્વચ્છ રાખવું." },
    { title: "૫. મોબાઇલ ફોન અને કોલ્સ નિયમ", desc: "મોબાઇલ ફોન ૧૦૦% સાયલન્ટ મોડ પર રાખવો (વાઇબ્રેશન પણ નહીં). હોલની અંદર ફોન ઉપાડવાની સખત મનાઈ છે; કોલ માટે નિયત લોબી/બાલ્કનીનો જ ઉપયોગ કરવો." },
    { title: "૬. ખાનપાન પર પ્રતિબંધ", desc: "અભ્યાસ ખંડમાં નાસ્તો, જમવાનું કે બહારનો ખોરાક ખાવાની સખત મનાઈ છે. માત્ર પાણીની બોટલ રાખવાની છૂટ છે. નાસ્તા માટે ટેરેસ/રીફ્રેશમેન્ટ એરિયાનો ઉપયોગ કરવો." },
    { title: "૭. વ્યક્તિગત સામાનની સુરક્ષા", desc: "પોતાના લેપટોપ, પુસ્તકો, ચાર્જર અને અંગત સામાનની સંપૂર્ણ જવાબદારી વિદ્યાર્થીની પોતાની રહેશે. ચોરી કે નુકસાન માટે મેનેજમેન્ટ જવાબદાર રહેશે નહીં." },
    { title: "૮. મિલકત અને ઇલેક્ટ્રિકલ જાળવણી", desc: "ફર્નિચર, લાઇટ, પંખા, એસી અને ચાર્જિંગ પોઇન્ટ્સનો કાળજીપૂર્વક ઉપયોગ કરવો. કોઈપણ નુકસાન બદલ દંડ થશે અને સભ્યપદ રદ થઈ શકે છે." },
    { title: "૯. દસ્તાવેજ ચકાસણી અને અધિકાર", desc: "ઓળખ કાર્ડ (આધાર કાર્ડ) ની ચકાસણી કરવાનો અને ગેરવર્તણૂક જણાયે કોઈપણ રિફંડ વિના સભ્યપદ રદ કરવાનો અંતિમ અધિકાર મેનેજમેન્ટનો રહેશે." },
    { title: "૧૦. કાયદાકીય ક્ષેત્રાધિકાર", desc: "આ નિયમો ભારતના કાયદાઓ દ્વારા સંચાલિત છે. કોઈપણ વિવાદ ભાવનગર, ગુજરાતની સક્ષમ અદાલતોના અધિકારક્ષેત્ર હેઠળ રહેશે." }
  ]
};

// Student portal login — the success panel hands the visitor off to the portal
// where seat selection now lives (spec §6: website form has NO seat map).
// The main portal domain: DNS is live (DNS_MATCH) and the cert is issued, so
// this is the one true link. Override with VITE_STUDENT_PORTAL_URL if needed.
const portalUrl =
  import.meta.env.VITE_STUDENT_PORTAL_URL ||
  'https://student.shreejilibrary.co.in/login.html';

// One claim key per form mount: `uniqueness/sub_<key>` is claimed inside the
// submit transaction, so a double-click / retry can never create two leads.
const makeSubmissionKey = () =>
  `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

// Exactly 10 digits — nothing else. Deliberately NO first-digit rule: Indian
// mobiles begin 6/7/8/9 and a "starts 6-9" check rejected real customer
// numbers, so the only requirement is ten digits.
const isValidPhone10 = (phone) => /^\d{10}$/.test(String(phone || ''));

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
  // Regenerated on every "Submit another request" so each fresh form gets a
  // brand new uniqueness claim.
  const submissionKeyRef = useRef(makeSubmissionKey());
  // Set only after the lead write succeeded — swaps the form for the panel.
  const [success, setSuccess] = useState(null); // { refId } | null

  // Terms & Conditions state (Modal popup + bilingual + scroll-to-bottom compulsory unlock)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [termsLang, setTermsLang] = useState(language === 'gu' ? 'gu' : 'en');
  const modalTermsRef = useRef(null);

  const cleanPhone = normalizePhone(formData.phone);
  const isPhoneValid = isValidPhone10(cleanPhone);
  const isFormFilled = Boolean(formData.name.trim() && isPhoneValid && formData.planId);

  const handleOpenTerms = (e) => {
    if (e) e.preventDefault();
    if (!isFormFilled) {
      setToast({
        type: 'error',
        text: isGu
          ? 'નિયમો અને શરતો જોવા માટે કૃપા કરીને પહેલા તમારું પૂરું નામ અને ૧૦ અંકનો મોબાઈલ નંબર દાખલ કરો.'
          : 'Please enter your full name and 10-digit mobile number above before reviewing the Terms & Conditions.'
      });
      return;
    }
    setShowTermsModal(true);
  };

  useEffect(() => {
    setTermsLang(language === 'gu' ? 'gu' : 'en');
  }, [language]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTermsScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 25) {
      setHasScrolledTerms(true);
    }
  };

  const switchTermsLang = (lang) => {
    setTermsLang(lang);
    setTimeout(() => {
      if (modalTermsRef.current) {
        const el = modalTermsRef.current;
        if (el.scrollHeight <= el.clientHeight + 25) {
          setHasScrolledTerms(true);
        }
      }
    }, 60);
  };

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
        setPhoneError(isGu ? 'મોબાઇલ નંબર ૧૦ અંકનો હોવો જોઈએ.' : 'Mobile number must be 10 digits.');
      } else if (clean.length === 10 && !isValidPhone10(clean)) {
        setPhoneError(isGu ? 'સાચો ૧૦ અંકનો મોબાઇલ નંબર દાખલ કરો.' : 'Enter a valid 10-digit mobile number.');
      } else {
        setPhoneError('');
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedPlanObj = plans?.find((p) => p.id === formData.planId) || plans?.[0] || null;

  const handleReset = () => {
    submissionKeyRef.current = makeSubmissionKey();
    setSuccess(null);
    setToast(null);
    setPhoneError('');
    setTermsAccepted(false);
    setHasScrolledTerms(false);
    setFormData({ name: '', phone: '', email: '', planId: formData.planId, message: '' });
    setPlanDropdownOpen(false);
  };

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
      const msg = isGu ? 'કૃપા કરીને સાચો ૧૦ અંકનો મોબાઇલ નંબર દાખલ કરો (ફક્ત અંક).' : 'Please enter a valid 10-digit mobile number (digits only).';
      setPhoneError(isGu ? 'મોબાઇલ નંબર ૧૦ અંકનો હોવો જોઈએ.' : 'Mobile number must be 10 digits.');
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

    if (!termsAccepted) {
      if (formData.name.trim() && isValidPhone10(cleanPhone) && formData.planId) {
        setShowTermsModal(true);
      }
      setToast({
        type: 'error',
        text: isGu
          ? 'સીટ બુકિંગ કન્ફર્મ કરવા માટે કૃપા કરીને નિયમો અને શરતોનો સ્વીકાર કરો.'
          : 'Please review and accept the Terms & Conditions before confirming your seat booking.'
      });
      return;
    }

    setLoading(true);
    setToast(null);

    // Direct-SDK submit (static hosting — no /api fallback). Writes ONE
    // `visitors` lead inside a transaction that claims uniqueness/sub_<key>,
    // so one fill can never create twin records. Seat selection happens in
    // the student portal, not here (spec §6) — no uid/userId is ever sent.
    try {
      const lead = await submitWebsiteLead({
        name: formData.name.trim(),
        phone: cleanPhone,
        email: (formData.email || '').trim(),
        planId: selectedPlanObj?.id || formData.planId || '',
        planName: selectedPlanObj ? selectedPlanObj.nameEn : '',
        message: formData.message || '',
        submissionKey: submissionKeyRef.current,
        termsAccepted: true
      });
      const ref = lead?.id || `REQ-${Date.now()}`;
      // Clear every entered field so nothing lingers in the form after a
      // successful submit. planId is kept (it's a page-level selection) —
      // if it's ever empty, the default-plan effect restores plans[0].
      setFormData({ name: '', phone: '', email: '', planId: formData.planId, message: '' });
      setPhoneError('');
      setTermsAccepted(false);
      setHasScrolledTerms(false);
      setPlanDropdownOpen(false);
      // Only swap to the success panel once the write actually succeeded.
      setSuccess({ refId: ref, duplicate: lead?.duplicate === true });
    } catch (err) {
      console.error('Website lead submit failed:', err);
      // Keep every entered value — the visitor can just press submit again.
      setToast({
        type: 'error',
        text: err.message || (isGu ? 'વિનંતી નિષ્ફળ ગઈ. કૃપા કરીને ફરી પ્રયાસ કરો.' : 'Request failed. Please try again.')
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

        {/* Floating Toast Notification (Never disrupts form layout) */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed top-6 right-6 z-[100] max-w-md w-[calc(100vw-3rem)] pointer-events-auto"
            >
              <div
                className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-semibold shadow-2xl backdrop-blur-xl border ${
                  toast.type === 'success'
                    ? 'bg-[#1e1b18]/95 text-white border-[#EB6A30]'
                    : 'bg-[#201015]/95 text-white border-red-500/60'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#EB6A30] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                  <span>{toast.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-white/60 hover:text-white transition-colors p-0.5"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success panel — rendered inside the booking area once the lead
            write actually succeeded (replaces the form). */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-[#EB6A30]/50 shadow-2xl text-center space-y-6"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-[#983132]/70 border border-[#EB6A30]/70 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-[#EB6A30]" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
              {success.duplicate
                ? (isGu ? 'તમારા નંબરથી પહેલેથી વિનંતી છે — અમે ટૂંક સમયમાં કોલ કરીશું'
                        : 'We already have a request from this number — we’ll call you')
                : (isGu ? 'વિનંતી મળી ગઈ છે — એડમિન મંજૂરી બાકી છે' : 'Request received — pending admin approval')}
            </h3>

            {!success.duplicate && (
              <p className="text-sm text-[#F5E4E4]/85">
                {isGu ? 'રેફરન્સ ID:' : 'Reference ID:'}{' '}
                <span className="font-mono font-bold text-[#EB6A30]">{success.refId}</span>
              </p>
            )}

            <p className="text-sm text-[#F5E4E4]/70 max-w-xl mx-auto">
              {success.duplicate
                ? (isGu
                    ? 'અમને આ નંબરથી પહેલેથી વિનંતી મળી છે, તેથી બીજી નોંધણી કરવામાં આવી નથી. અમે ટૂંક સમયમાં તમને કોલ કરીશું.'
                    : 'No second record was created — we already have your details on file and will call you shortly.')
                : (isGu
                    ? 'અમે તમારી વિનંતી નોંધી લીધી છે અને મંજૂરી પછી ઇમેઇલ દ્વારા જાણ કરીશું. સીટ બુકિંગ પૂર્ણ કરવા માટે નીચેના બટનથી સ્ટુડન્ટ પોર્ટલ ખોલો.'
                    : 'We have logged your inquiry and will email you once it is approved. Open the student portal in a new tab to complete your seat booking.')}
            </p>

            <button
              type="button"
              onClick={() => {
                const handoffParams = new URLSearchParams();
                handoffParams.set('tab', 'signup');
                if (formData.name) handoffParams.set('name', formData.name.trim());
                if (formData.phone) handoffParams.set('phone', normalizePhone(formData.phone));
                if (formData.email) handoffParams.set('email', formData.email.trim());
                const handoffUrl = `${portalUrl}#${handoffParams.toString()}`;
                window.open(handoffUrl, '_blank');
              }}
              className="w-full py-4 rounded-full bg-[#B94E18] hover:bg-[#9E4213] text-white font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>{isGu ? 'તમારી સીટ બુકિંગ પૂર્ણ કરો →' : 'Complete your seat booking →'}</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold text-[#F5E4E4]/80 hover:text-white underline underline-offset-4 transition-colors"
            >
              {isGu ? 'બીજી વિનંતી મોકલો' : 'Submit another request'}
            </button>
          </motion.div>
        )}

        {/* Form Container */}
        {!success && (
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
                pattern="[0-9]{10}"
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
                        ₹{selectedPlanObj.price}{selectedPlanObj.duration ? ` · ${isGu ? (selectedPlanObj.durationGu || selectedPlanObj.duration) : selectedPlanObj.duration}` : ''}
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
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute z-30 mt-2 w-full rounded-2xl bg-white text-[#201E1F] shadow-2xl border border-[#F5E4E4] overflow-hidden"
                    >
                    <ul
                      role="listbox"
                      className="p-1.5 max-h-72 overflow-y-auto overscroll-contain plan-dropdown-scroll"
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
                                ₹{p.price}{p.duration ? ` / ${isGu ? (p.durationGu || p.duration) : p.duration}` : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    </motion.div>
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

          {/* Terms & Conditions Agreement Row (Only enabled once form details are filled) */}
          <div className={`rounded-2xl border p-4 transition-all backdrop-blur-md ${
            !isFormFilled
              ? 'bg-white/[0.03] border-white/10 opacity-70'
              : 'bg-white/5 border-white/15 hover:border-white/25'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="booking-terms-checkbox"
                disabled={!isFormFilled}
                checked={termsAccepted}
                onChange={(e) => {
                  if (!isFormFilled) {
                    handleOpenTerms(e);
                    return;
                  }
                  if (!hasScrolledTerms) {
                    setShowTermsModal(true);
                  } else {
                    setTermsAccepted(e.target.checked);
                  }
                }}
                className="mt-1 w-4 h-4 rounded text-[#EB6A30] accent-[#EB6A30] cursor-pointer disabled:cursor-not-allowed shrink-0"
              />
              <div className="text-xs sm:text-sm text-[#F5E4E4] leading-relaxed">
                <label
                  htmlFor={isFormFilled ? "booking-terms-checkbox" : undefined}
                  onClick={!isFormFilled ? handleOpenTerms : undefined}
                  className={`${isFormFilled ? 'cursor-pointer' : 'cursor-not-allowed'} select-none`}
                >
                  {isGu ? (
                    <>
                      મેં શ્રીજી રીડિંગ લાઇબ્રેરીના{' '}
                      <button
                        type="button"
                        onClick={handleOpenTerms}
                        className={`underline font-bold inline transition-colors ${
                          isFormFilled ? 'text-[#EB6A30] hover:text-[#f28555] cursor-pointer' : 'text-white/60 cursor-not-allowed'
                        }`}
                      >
                        નિયમો અને શરતો (Terms &amp; Conditions)
                      </button>{' '}
                      ધ્યાનપૂર્વક વાંચ્યા છે અને હું સંમત છું <span className="text-[#EB6A30] font-bold">*</span>
                    </>
                  ) : (
                    <>
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={handleOpenTerms}
                        className={`underline font-bold inline transition-colors ${
                          isFormFilled ? 'text-[#EB6A30] hover:text-[#f28555] cursor-pointer' : 'text-white/60 cursor-not-allowed'
                        }`}
                      >
                        Terms &amp; Conditions
                      </button>{' '}
                      of Shreeji Reading Library <span className="text-[#EB6A30] font-bold">*</span>
                    </>
                  )}
                </label>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[11px] font-medium ${
                    termsAccepted
                      ? 'text-emerald-400'
                      : !isFormFilled
                        ? 'text-white/50'
                        : 'text-amber-300'
                  }`}>
                    {termsAccepted
                      ? (isGu ? '✓ નિયમો વાંચીને સ્વીકારવામાં આવ્યા છે' : '✓ Terms reviewed and accepted')
                      : !isFormFilled
                        ? (isGu ? '(નિયમો જોવા માટે ઉપર તમારું નામ અને મોબાઈલ નંબર પૂર્ણ કરો *)' : '(Complete required form details above to unlock agreement *)')
                        : (isGu ? '(સંમતિ આપવા માટે નિયમો ધ્યાનપૂર્વક વાંચવા જરૂરી છે *)' : '(Please review and accept the Terms & Conditions *)')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Review Dialog */}
          <AnimatePresence>
            {showTermsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full max-w-2xl bg-[#201E1F] border border-[#EB6A30]/50 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#EB6A30] shrink-0" />
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                          {termsLang === 'gu' ? 'નિયમો અને શરતો' : 'Terms & Conditions'}
                        </h3>
                        <span className="text-[11px] text-white/60">
                          {termsLang === 'gu' ? 'શ્રીજી રીડિંગ લાઇબ્રેરી · ભાવનગર' : 'Shreeji Reading Library · Bhavnagar'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bilingual Switcher */}
                      <div className="inline-flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
                        <button
                          type="button"
                          onClick={() => switchTermsLang('en')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            termsLang === 'en'
                              ? 'bg-[#EB6A30] text-white shadow-sm'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          ENG
                        </button>
                        <button
                          type="button"
                          onClick={() => switchTermsLang('gu')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            termsLang === 'gu'
                              ? 'bg-[#EB6A30] text-white shadow-sm'
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          ગુજ
                        </button>
                      </div>

                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(false)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all ml-1"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Compulsory Reading Notice Banner */}
                  <div className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 border-b ${
                    hasScrolledTerms
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                  }`}>
                    {hasScrolledTerms ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                    )}
                    <span>
                      {hasScrolledTerms
                        ? (termsLang === 'gu'
                            ? 'તમે સંપૂર્ણ નિયમો વાંચી લીધા છે. હવે તમે સંમતિ આપી શકો છો.'
                            : 'You have reviewed the complete terms. You may now accept below.')
                        : (termsLang === 'gu'
                            ? 'સંમતિ આપવા માટે કૃપા કરીને સંપૂર્ણ નિયમો નીચે સુધી વાંચો *'
                            : 'Please scroll through and review the complete terms to enable acceptance *')}
                    </span>
                  </div>

                  {/* Scrollable Terms Content */}
                  <div
                    ref={modalTermsRef}
                    onScroll={handleTermsScroll}
                    className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm text-[#F5E4E4] leading-relaxed overscroll-contain"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#EB6A30 rgba(255,255,255,0.1)' }}
                  >
                    {TERMS_RULES[termsLang].map((rule, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <div className="font-bold text-[#EB6A30] text-xs sm:text-sm">
                          {rule.title}
                        </div>
                        <div className="text-white/85 text-xs sm:text-xs leading-relaxed">
                          {rule.desc}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 text-center text-[11px] font-semibold text-white/40 border-t border-white/10">
                      {termsLang === 'gu'
                        ? '— તમામ નિયમો અને શરતો સમાપ્ત —'
                        : '— End of Shreeji Reading Library Terms & Conditions —'}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(false)}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs sm:text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {termsLang === 'gu' ? 'બંધ કરો' : 'Close'}
                    </button>

                    <button
                      type="button"
                      disabled={!hasScrolledTerms}
                      onClick={() => {
                        setTermsAccepted(true);
                        setShowTermsModal(false);
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#EB6A30] hover:bg-[#d55822] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {termsLang === 'gu'
                          ? 'હું નિયમો સ્વીકારું છું'
                          : 'I Accept the Terms'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#B94E18] hover:bg-[#9E4213] text-white font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
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

          <p className="text-[11px] text-center text-white/50 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-white/60" />
            <span>{isGu ? 'તમારી સંપર્ક માહિતી સુરક્ષિત રાખવામાં આવે છે. ઝીરો સ્પામ.' : 'Your contact information is kept strictly private. Zero spam.'}</span>
          </p>

        </motion.form>
        )}

      </div>
    </section>
  );
}
