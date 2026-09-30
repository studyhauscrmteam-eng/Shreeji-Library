import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ShieldCheck, ArrowRight, Settings, Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../context/PlansContext';

export default function MembershipPricing({ onSelectPlan, onOpenAdmin }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { plans, live, syncing, syncError, refreshPlans, lastSyncedAt } = usePlans();

  const gridCols = plans.length <= 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3';

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

          <p className="mt-4 text-base sm:text-lg text-[#201E1F]/70 font-normal">
            {t('pricing.subtitle')}
          </p>

          {/* Live CRM sync status */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold">
            {syncing ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isGu ? 'CRMમાંથી લાઇવ પ્લાન લોડ થઈ રહ્યા છે…' : 'Loading live plans from CRM…'}
              </span>
            ) : live ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isGu
                  ? `લાઇવ CRM પ્લાન${lastSyncedAt ? ' • હમણાં જ સિંક થયા' : ''}`
                  : `Live CRM plans${lastSyncedAt ? ' • just synced' : ''}`}
                <button onClick={refreshPlans} className="ml-1 underline hover:no-underline flex items-center gap-1" title="Refresh">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                {isGu ? 'બેકએન્ડ ઉપલબ્ધ નથી — કેશ બતાવાય છે' : 'Backend unreachable — showing cached plans'}
                {syncError ? ` (${syncError.slice(0, 60)})` : ''}
                <button onClick={refreshPlans} className="ml-1 underline hover:no-underline flex items-center gap-1" title="Retry">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </span>
            )}
          </div>
        </motion.div>

        {/* Dynamic Pricing Cards Grid */}
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
                  <div className="absolute -top-3.5 right-8 bg-[#EB6A30] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </div>
                )}

                <div>
                  {/* Plan Title & Tagline */}
                  <h3 className="text-2xl font-bold text-[#201E1F]">{planName}</h3>
                  <p className="text-xs font-semibold text-[#983132] mt-1 uppercase tracking-wider">{tagline}</p>

                  {/* Price Display */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#201E1F]">₹</span>
                    <span className="text-5xl font-extrabold text-[#201E1F] tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-[#201E1F]/60 ml-1">{t('pricing.perMonth')}</span>
                  </div>

                  {/* Dynamic Benefits / Points List */}
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
                        ? 'bg-[#EB6A30] hover:bg-[#d5571e] text-white shadow-[#EB6A30]/20'
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

        {/* Security & Guarantee Note + Staff Quick Manage */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-xs sm:text-sm text-[#201E1F]/60 flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#983132]" />
            <span>{t('pricing.seatGuarantee')}</span>
          </p>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-xs text-[#983132] hover:underline flex items-center gap-1 font-semibold"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isGu ? 'પ્લાન CRMમાં મેનેજ થાય છે' : 'Plans are managed in CRM'}</span>
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
