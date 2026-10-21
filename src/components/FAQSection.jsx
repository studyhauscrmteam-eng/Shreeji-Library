import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContent } from '../context/SiteContentContext';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const { content } = useSiteContent() || {};

  // CRM-editable FAQs (Website → Homepage Content). Non-empty remote list
  // wins; otherwise the built-in translated set.
  const remoteFaqs = content && Array.isArray(content.faqs)
    ? content.faqs.filter((f) => f && (f.q || f.a)).map((f) => ({
        question: (isGu && f.qGu) ? f.qGu : (f.q || ''),
        answer: (isGu && f.aGu) ? f.aGu : (f.a || '')
      }))
    : [];

  const faqs = remoteFaqs.length > 0 ? remoteFaqs : [
    {
      question: t('faq.q1'),
      answer: t('faq.a1')
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2')
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3')
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4')
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5')
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white text-[#201E1F]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[1px] w-8 bg-[#983132]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('faq.badge')}</span>
            <div className="h-[1px] w-8 bg-[#983132]" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F]">
            {t('faq.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('faq.headingHighlight')}</span>
          </h2>

          <p className="mt-3 text-base sm:text-lg text-[#201E1F]/70">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-[#FFF8F5] border-[#EB6A30]/50 shadow-md' 
                    : 'bg-white border-[#F5E4E4] hover:border-[#983132]/30'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                      isOpen ? 'bg-[#EB6A30] text-white' : 'bg-[#FFF0E8] text-[#983132]'
                    }`}>
                      Q{index + 1}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-[#201E1F]">
                      {faq.question}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                    isOpen 
                      ? 'bg-white text-[#EB6A30] rotate-180 border-[#EB6A30]/30' 
                      : 'bg-[#FFF8F5] text-[#201E1F]/60 border-[#F5E4E4]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#201E1F]/80 leading-relaxed border-t border-[#F5E4E4]/60 font-normal">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
