import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Facilities() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  return (
    <section id="facilities" className="py-24 bg-[#FFF8F5] text-[#201E1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('facilities.badge')}</span>
            <div className="h-[1px] w-12 bg-[#F5E4E4]" />
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#201E1F]">
            {t('facilities.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('facilities.headingHighlight')}</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#201E1F]/70">
            {t('facilities.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-24">
          
          {/* Row 1: Real Hall Image Left, Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6"
            >
              <div className="rounded-3xl overflow-hidden shadow-xl border border-[#F5E4E4] bg-white h-[380px] sm:h-[420px]">
                <img
                  src="/main-study-hall-row.webp"
                  alt="Air-conditioned silent study hall rows with numbered cubicles at ShreeJi Library, Bhavnagar"
                  loading="lazy"
                  decoding="async"
                  width="1280"
                  height="986"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6 space-y-4"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">
                {isGu ? 'સાયલન્ટ સ્ટડી હોલ' : 'THE SILENT HALL'}
              </span>

              <h3 className="text-3xl sm:text-4xl font-bold text-[#201E1F] leading-tight">
                {t('facilities.c1Title')}
              </h3>

              <p className="text-base text-[#201E1F]/70 leading-relaxed font-normal">
                {t('facilities.c1Desc')}
              </p>

              <div className="pt-2 border-t border-[#F5E4E4] grid grid-cols-2 gap-4 text-xs font-bold text-[#983132] uppercase tracking-wider">
                <p>✓ {isGu ? 'મિત્સુબિશી AC કૂલિંગ' : 'Mitsubishi AC Cooling'}</p>
                <p>✓ {isGu ? 'અર્ગોનોમિક લમ્બર ખુરશી' : 'Ergonomic Lumbar Chairs'}</p>
                <p>✓ {isGu ? '૧૦૦% પાવર બેકઅપ' : '100% Power Backup'}</p>
                <p>✓ {isGu ? 'અનલિમિટેડ વાઇ-ફાઇ' : 'Unlimited Wi-Fi'}</p>
              </div>
            </motion.div>

          </div>

          {/* Row 2: Text Left, Real Cubicles Image Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6 space-y-4 order-2 lg:order-1"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#EB6A30]">
                {isGu ? 'ઓપન ટેરેસ લાઉન્જ અને શુદ્ધ પાણી' : 'TERRACE & RO WATER'}
              </span>

              <h3 className="text-3xl sm:text-4xl font-bold text-[#201E1F] leading-tight">
                {t('facilities.c2Title')}
              </h3>

              <p className="text-base text-[#201E1F]/70 leading-relaxed font-normal">
                {t('facilities.c2Desc')}
              </p>

              <div className="pt-2 border-t border-[#F5E4E4] grid grid-cols-2 gap-4 text-xs font-bold text-[#EB6A30] uppercase tracking-wider">
                <p>✓ {isGu ? 'ઓપન એર બ્રેક એરિયા' : 'Open Air Break Lounge'}</p>
                <p>✓ {isGu ? 'ઠંડુ RO ફિલ્ટર પાણી' : 'Purified Chilled Water'}</p>
                <p>✓ {isGu ? 'ચા-નાસ્તાની જગ્યા' : 'Tea & Snack Pantry'}</p>
                <p>✓ {isGu ? 'સ્વચ્છ હાઇજેનિક વૉશરૂમ' : 'Hygienic Washrooms'}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-6 order-1 lg:order-2"
            >
              <div className="rounded-3xl overflow-hidden shadow-xl border border-[#F5E4E4] bg-white h-[380px] sm:h-[420px]">
                <img
                  src="/study-cubicles-maps.webp"
                  alt="Individual study cubicles with India and Gujarat maps for UPSC and GPSC aspirants in Bhavnagar"
                  loading="lazy"
                  decoding="async"
                  width="1280"
                  height="945"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
