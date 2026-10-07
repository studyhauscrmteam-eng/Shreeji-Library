import React from 'react';
import { motion } from 'framer-motion';
import { VolumeX, Flame, ShieldCheck, Sparkles, Zap, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AboutPhilosophy() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  return (
    <section id="about" className="py-24 bg-white text-[#201E1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('about.badge')}</span>
          <div className="h-[1px] w-12 bg-[#F5E4E4]" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Main Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7 }}
              className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F] leading-tight"
            >
              {t('about.headingStart')}
              <span className="font-serif italic text-[#983132]">{t('about.headingHighlight')}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-lg text-[#201E1F]/80 leading-relaxed font-normal"
            >
              {t('about.p1')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-[#201E1F]/80 leading-relaxed font-normal"
            >
              {t('about.p2')}
            </motion.p>

            {/* 4 Feature Points Grid */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5E4E4] text-[#983132] flex items-center justify-center shrink-0">
                  <VolumeX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1F]">{t('about.point1Title')}</h3>
                  <p className="text-xs text-[#201E1F]/70 mt-1">{t('about.point1Desc')}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E8] text-[#EB6A30] flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1F]">{t('about.point2Title')}</h3>
                  <p className="text-xs text-[#201E1F]/70 mt-1">{t('about.point2Desc')}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5E4E4] text-[#983132] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1F]">{t('about.point3Title')}</h3>
                  <p className="text-xs text-[#201E1F]/70 mt-1">{t('about.point3Desc')}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E8] text-[#EB6A30] flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#201E1F]">{t('about.point4Title')}</h3>
                  <p className="text-xs text-[#201E1F]/70 mt-1">{t('about.point4Desc')}</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Image Showcase with Real Library Photo */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl overflow-hidden shadow-2xl border border-[#F5E4E4] relative group bg-[#FFF8F5]"
            >
              {/* Real Library Study Hall Photo with Students */}
              <div className="h-[480px] sm:h-[520px] overflow-hidden">
                <img
                  src="/central-study-hall-students.webp" 
                  alt="Students studying in the active silent study hall at ShreeJi Reading Library, Bhavnagar"
                  loading="lazy"
                  decoding="async"
                  width="1280"
                  height="964"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Photo Caption Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <div className="flex items-center gap-2 text-[#EB6A30] text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AUTHENTIC STUDY ENVIRONMENT</span>
                </div>
                <h3 className="text-lg font-bold">
                  {isGu ? 'વાસ્તવિક સાયલન્ટ સ્ટડી હોલ' : 'Main Silent Study Hall'}
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  {isGu ? 'UPSC, GPSC, CA, NEET અને GATE માટે સમર્પિત વિદ્યાર્થીઓનું વાતાવરણ.' : 'Real students preparing for UPSC, GPSC, CA, NEET & GATE in full concentration.'}
                </p>
              </div>
            </motion.div>

            {/* Accent Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6, type: 'spring', stiffness: 200 }}
              className="absolute -top-4 left-4 sm:-left-4 bg-[#983132] text-white p-4 rounded-2xl shadow-xl hidden sm:flex items-center gap-3"
            >
              <ShieldCheck className="w-6 h-6 text-[#EB6A30]" />
              <div>
                <p className="text-xs font-bold text-white/80">{t('about.reservedBadge')}</p>
                <p className="text-sm font-extrabold text-white">{t('about.fixedSeat')}</p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
