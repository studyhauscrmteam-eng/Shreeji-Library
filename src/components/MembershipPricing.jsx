import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';

export default function MembershipPricing({ onSelectPlan }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { plans, loading, error, refreshPlans } = usePlans();

  const gridCols = plans.length <= 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <section id="plans" className="py-24 bg-[#FFF8F5] text-[#201E1F]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[1px] w-8 bg-[#983132]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('pricing.badge')}</span>
            <div className="h-[1px] w-8 bg-[#983132]" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F]">
            {t('pricing.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('pricing.headingHighlight')}</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#201E1F]/85 font-normal">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        {/* Loading skeleton (real backend data is on its way) */}
        {loading && plans.length === 0 && (
          <div className={`grid grid-cols-1 ${gridCols} gap-8 items-stretch`}>
            {[0, 1].map((i) => (
              <div key={i} className="rounded-3xl p-8 sm:p-10 bg-white border border-[#F5E4E4] shadow-sm animate-pulse">
                <div className="h-7 w-2/3 bg-[#F5E4E4] rounded-lg" />
                <div className="h-3 w-1/2 bg-[#F5E4E4] rounded mt-2" />
                <div className="h-12 w-1/3 bg-[#F5E4E4] rounded-xl mt-6" />
                <div className="mt-8 space-y-3">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-4 bg-[#FFF0E8] rounded" />
                  ))}
                </div>
                <div className="h-12 bg-[#F5E4E4] rounded-full mt-10" />
              </div>
            ))}
          </div>
        )}

        {/* Error state — no fallback plans, only real data */}
        {!loading && error && plans.length === 0 && (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-white border border-red-200 text-center shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-[#201E1F]">
              {isGu ? 'પ્લાન લોડ થઈ શક્યા નથી.' : 'Could not load plans.'}
            </p>
            <p className="text-xs text-[#201E1F]/60 mt-1">
              {isGu ? 'કૃપા કરીને તમારું ઇન્ટરનેટ તપાસો અને ફરી પ્રયાસ કરો.' : 'Please check your connection and try again.'}
            </p>
            <button
              onClick={refreshPlans}
              className="mt-4 inline-flex items-center gap-1.5 bg-[#983132] hover:bg-[#7f2728] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isGu ? 'ફરી પ્રયાસ કરો' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Pricing Cards Grid (real backend plans) */}
        {plans.length > 0 && (
          <div className={`grid grid-cols-1 ${gridCols} gap-8 items-stretch`}>
            {plans.map((plan, index) => {
              const planName = isGu ? plan.nameGu : plan.nameEn;
              const tagline = isGu ? plan.taglineGu : plan.taglineEn;
              const badge = isGu ? (plan.badgeGu || t('pricing.popular')) : (plan.badgeEn || 'Recommended');
              const benefitsList = isGu ? plan.benefitsGu : plan.benefitsEn;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                    plan.featured
                      ? 'bg-white border-2 border-[#EB6A30] shadow-xl md:-translate-y-2'
                      : 'bg-white border border-[#F5E4E4] shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.featured && (
                    <div className="absolute -top-3.5 right-8 bg-[#B94E18] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{badge}</span>
                    </div>
                  )}

                  <div>
                    {/* Plan Title & Tagline */}
                    <h3 className="text-2xl font-bold text-[#201E1F]">{planName}</h3>
                    {tagline && (
                      <p className="text-xs font-semibold text-[#983132] mt-1 uppercase tracking-wider">{tagline}</p>
                    )}

                    {/* Price Display */}
                    <div className="mt-6 flex items-baseline gap-1 flex-wrap">
                      <span className="text-2xl font-bold text-[#201E1F]">₹</span>
                      <span className="text-5xl font-extrabold text-[#201E1F] tracking-tight">{plan.price}</span>
                      {plan.duration && (
                        <span className="text-sm font-medium text-[#201E1F]/60 ml-1">/ {plan.duration}</span>
                      )}
                    </div>

                    {/* Benefits List */}
                    <ul className="mt-8 space-y-3.5">
                      {benefitsList.map((benefit, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3 text-sm text-[#201E1F]/80">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            plan.featured ? 'bg-[#FFF0E8] text-[#EB6A30]' : 'bg-[#F5E4E4] text-[#983132]'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-10">
                    <button
                      onClick={() => onSelectPlan(plan.id)}
                      className={`w-full py-4 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md ${
                        plan.featured
                          ? 'bg-[#B94E18] hover:bg-[#9E4213] text-white shadow-[#B94E18]/20'
                          : 'bg-[#FFF8F5] hover:bg-[#983132] text-[#983132] hover:text-white border border-[#F5E4E4]'
                      }`}
                    >
                      <span>{t('pricing.selectPlan')}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

        {/* Security & Guarantee Note */}
        <div className="mt-12 flex items-center justify-center text-center">
          <p className="text-xs sm:text-sm text-[#201E1F]/85 flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#983132]" />
            <span>{t('pricing.seatGuarantee')}</span>
          </p>
        </div>

      </div>
    </section>
  );
}
