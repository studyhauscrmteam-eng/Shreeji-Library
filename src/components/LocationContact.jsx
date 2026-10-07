import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, ExternalLink, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LocationContact() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  return (
    <section id="contact" className="py-24 bg-[#FFF8F5] text-[#201E1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('contact.badge')}</span>
          <div className="h-[1px] w-12 bg-[#F5E4E4]" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-8"
          >
            <div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F] leading-tight">
                {t('contact.headingStart')}
                <span className="font-serif italic text-[#EB6A30]">{t('contact.headingHighlight')}</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#201E1F]/70">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="space-y-4">

              {/* Address Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#F5E4E4] shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#983132] text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#201E1F] text-base">{t('contact.addressLabel')}</h3>
                  <p className="text-sm text-[#201E1F]/80 mt-1">
                    {t('contact.addressVal')}
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://www.google.com/search?sca_esv=ac3607b23cf7e9a0&sxsrf=APpeQntzE3Txa1taL8sOiVsADw9bZwDHIg:1788501095902&kgmid=/g/11p_706vtb&q=Shreeji+Reading+Library&shem=dlvs1,epsd1,ltae,rimspwouoe&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5b7c2b0bc508eb50&utm_source=dlvs1,epsd1,ltae,rimspwouoe,sh/x/loc/uni/m1/1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#983132] hover:text-[#EB6A30] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{t('contact.getDirections')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#F5E4E4] shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EB6A30] text-white flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#201E1F] text-base">{t('contact.phoneLabel')}</h3>
                  <p className="text-lg font-bold text-[#983132] mt-0.5">
                    {t('contact.phoneVal')}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      href="tel:+916353321530"
                      className="inline-flex items-center gap-1.5 bg-[#983132] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#7f2728] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('contact.callNow')}</span>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#F5E4E4] shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#983132] text-white flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#201E1F] text-base">{t('contact.emailLabel')}</h3>
                  <p className="text-sm font-semibold text-[#EB6A30] mt-0.5">
                    {t('contact.emailVal')}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <a
                      href="mailto:parthbhai@shreejilibrary.com"
                      className="inline-flex items-center gap-1.5 bg-[#FFF8F5] text-[#983132] border border-[#F5E4E4] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#F5E4E4] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{t('contact.emailNow')}</span>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Timings Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#F5E4E4] shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EB6A30] to-[#983132] text-white flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#201E1F] text-base">{t('contact.timingLabel')}</h3>
                  <p className="text-sm text-[#201E1F]/80 mt-1">
                    {t('contact.timingVal')}
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Interactive Google Map Column */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-[#F5E4E4] bg-white h-[450px] relative group">
              <iframe
                title="ShreeJi Reading Library Location"
                src="https://maps.google.com/maps?q=Shreeji+Reading+Library+Bhavnagar&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-[#F5E4E4] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#201E1F]">ShreeJi Reading Library</p>
                  <p className="text-[11px] text-[#201E1F]/60">Air Conditioned • 24/7 Open</p>
                </div>
                <a 
                  href="https://www.google.com/search?sca_esv=ac3607b23cf7e9a0&sxsrf=APpeQntzE3Txa1taL8sOiVsADw9bZwDHIg:1788501095902&kgmid=/g/11p_706vtb&q=Shreeji+Reading+Library&shem=dlvs1,epsd1,ltae,rimspwouoe&shndl=30&source=sh/x/loc/uni/m1/1&kgs=5b7c2b0bc508eb50&utm_source=dlvs1,epsd1,ltae,rimspwouoe,sh/x/loc/uni/m1/1"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#983132] hover:bg-[#7f2728] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{isGu ? 'મેપ્સ જુઓ' : 'Directions'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
