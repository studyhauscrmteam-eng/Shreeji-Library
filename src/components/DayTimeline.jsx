import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function DayTimeline() {
  const { t } = useLanguage();

  const steps = [
    {
      num: 1,
      time: t('timeline.t1Time'),
      title: t('timeline.t1Title'),
      desc: t('timeline.t1Desc')
    },
    {
      num: 2,
      time: t('timeline.t2Time'),
      title: t('timeline.t2Title'),
      desc: t('timeline.t2Desc')
    },
    {
      num: 3,
      time: t('timeline.t3Time'),
      title: t('timeline.t3Title'),
      desc: t('timeline.t3Desc')
    },
    {
      num: 4,
      time: t('timeline.t4Time'),
      title: t('timeline.t4Title'),
      desc: t('timeline.t4Desc')
    },
    {
      num: 5,
      time: t('timeline.t5Time'),
      title: t('timeline.t5Title'),
      desc: t('timeline.t5Desc')
    }
  ];

  return (
    <section className="py-24 bg-white text-[#201E1F]">
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('timeline.badge')}</span>
            <div className="h-[1px] w-12 bg-[#F5E4E4]" />
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#201E1F]">
            {t('timeline.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('timeline.headingHighlight')}</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#201E1F]/70">
            {t('timeline.subtitle')}
          </p>
        </motion.div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Student Photo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5"
          >
            <div className="rounded-3xl overflow-hidden shadow-xl border border-[#F5E4E4] bg-[#FFF8F5] h-[480px] sm:h-[540px]">
              <img
                src="/central-study-hall-students.webp"
                alt="Students preparing together in the central study hall of ShreeJi Reading Library, Bhavnagar"
                loading="lazy"
                decoding="async"
                width="1280"
                height="964"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Right Column: Numbered Timeline List */}
          <div className="lg:col-span-7 relative">
            <div className="space-y-6 relative">
              
              {/* Connecting Vertical Line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-[#F5E4E4] -z-0" />

              {steps.map((step, index) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 relative z-10 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFF8F5] border-2 border-[#983132] text-[#983132] font-mono text-sm font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#983132] group-hover:text-white transition-colors duration-300">
                    {step.num}
                  </div>
                  <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] flex-1 hover:border-[#EB6A30]/50 transition-all shadow-sm">
                    <span className="text-[11px] font-bold text-[#EB6A30] uppercase tracking-wider block mb-1">
                      {step.time}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#201E1F]">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-[#201E1F]/70 mt-1 leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </motion.div>
              ))}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
