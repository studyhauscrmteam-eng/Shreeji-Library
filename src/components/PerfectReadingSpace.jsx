import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Plug, Grid, Armchair, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PerfectReadingSpace() {
  const [activeId, setActiveId] = useState(null);
  const { t } = useLanguage();

  const features = [
    {
      id: 'light',
      num: '1',
      pinLabel: t('cubicle.pinLight'),
      title: t('cubicle.f1Title'),
      desc: t('cubicle.f1Desc'),
      icon: Sun,
      bgColor: 'bg-[#FFF0E8]',
      textColor: 'text-[#EB6A30]',
      pinBg: 'bg-[#EB6A30]',
      pinPos: { top: '11.5%', left: '48%' }
    },
    {
      id: 'power',
      num: '2',
      pinLabel: t('cubicle.pinPower'),
      title: t('cubicle.f2Title'),
      desc: t('cubicle.f2Desc'),
      icon: Plug,
      bgColor: 'bg-[#F5E4E4]',
      textColor: 'text-[#983132]',
      pinBg: 'bg-[#983132]',
      pinPos: { top: '19%', left: '68%' }
    },
    {
      id: 'table',
      num: '3',
      pinLabel: t('cubicle.pinTable'),
      title: t('cubicle.f3Title'),
      desc: t('cubicle.f3Desc'),
      icon: Grid,
      bgColor: 'bg-[#FFF0E8]',
      textColor: 'text-[#EB6A30]',
      pinBg: 'bg-[#EB6A30]',
      pinPos: { top: '52%', left: '46%' }
    },
    {
      id: 'chair',
      num: '4',
      pinLabel: t('cubicle.pinChair'),
      title: t('cubicle.f4Title'),
      desc: t('cubicle.f4Desc'),
      icon: Armchair,
      bgColor: 'bg-[#F5E4E4]',
      textColor: 'text-[#983132]',
      pinBg: 'bg-[#983132]',
      pinPos: { top: '78%', left: '48%' }
    }
  ];

  return (
    <section id="reading-space" className="py-20 sm:py-24 bg-[#FFF8F5] text-[#201E1F] overflow-hidden max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[1px] w-8 bg-[#983132]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('cubicle.badge')}</span>
            <div className="h-[1px] w-8 bg-[#983132]" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F]">
            {t('cubicle.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('cubicle.headingHighlight')}</span>
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-[#201E1F]/70 font-normal">
            {t('cubicle.subtitle')}
          </p>
        </motion.div>

        {/* Clean 2-Column Layout for Desktop & Laptop Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Side: Real Cubicle Photo with Interactive Target Pins */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-[#F5E4E4] shadow-2xl bg-white">
              
              {/* Main Photo */}
              <img 
                src="/WhatsApp Image 2026-08-16 at 12.58.48 PM (1).jpeg" 
                alt="ShreeJi Reading Library Cubicle Setup" 
                className="w-full h-[420px] sm:h-[550px] lg:h-[620px] object-cover"
              />

              {/* Gradient Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/40 via-transparent to-[#201E1F]/10 pointer-events-none" />

              {/* Glowing Pins Positioned Directly Over Physical Items with Exact Labels */}
              {features.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{ top: item.pinPos.top, left: item.pinPos.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                    onMouseEnter={() => setActiveId(item.id)}
                    onMouseLeave={() => setActiveId(null)}
                    onClick={() => setActiveId(activeId === item.id ? null : item.id)}
                  >
                    <span className={`animate-ping absolute inline-flex h-9 w-9 rounded-full ${item.pinBg} opacity-75`} />
                    <div className={`relative px-3 py-1.5 rounded-full shadow-xl border-2 border-white text-white text-xs font-bold transition-all duration-300 ${
                      isActive ? 'scale-125 ring-4 ring-white/60' : 'group-hover:scale-110'
                    } ${item.pinBg} flex items-center gap-1.5`}>
                      <span>{item.pinLabel}</span>
                      {isActive && <Sparkles className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                );
              })}

            </div>
          </motion.div>

          {/* Right Side: Sleek Feature Cards List */}
          <div className="lg:col-span-5 space-y-4">
            {features.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setActiveId(item.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => setActiveId(activeId === item.id ? null : item.id)}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-4 ${
                    isActive 
                      ? 'bg-white border-[#EB6A30] shadow-lg translate-x-1 ring-2 ring-[#EB6A30]/20' 
                      : 'bg-white/80 border-[#F5E4E4] hover:border-[#EB6A30]/50 hover:bg-white shadow-sm'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${item.bgColor} ${item.textColor} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base sm:text-lg text-[#201E1F] flex items-center gap-2">
                        <span className="text-[#983132] font-mono text-sm font-bold">{item.num}.</span>
                        <span>{item.title}</span>
                      </h3>
                      {isActive ? (
                        <CheckCircle2 className="w-5 h-5 text-[#EB6A30]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[#201E1F]/70 mt-1.5 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
