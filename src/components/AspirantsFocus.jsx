import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AspirantsFocus() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  const exams = isGu ? [
    { title: 'UPSC સિવિલ સર્વિસીસ', desc: 'IAS, IPS, IFS અને રાજ્ય PSC પ્રિલિમ્સ-મેઇન્સ માટે શાંત ડેસ્ક' },
    { title: 'GPSC વર્ગ ૧ અને ૨', desc: 'ગુજરાત વહીવટી સેવા અને સ્પર્ધાત્મક પરીક્ષાઓની સંપૂર્ણ તૈયારી' },
    { title: 'CA ફાઇનલ અને ઇન્ટર', desc: 'ચાર્ટર્ડ એકાઉન્ટન્સી અને ઓડિટ રિવિઝન માટે સળંગ ૧૨+ કલાક એકાગ્રતા' },
    { title: 'NEET અને JEE ટોપર્સ', desc: 'ફિઝિક્સ, કેમિસ્ટ્રી અને બાયોલોજી મોક ટેસ્ટ માટે ડેડિકેટેડ સ્પેસ' },
    { title: 'SSC CGL અને બેંકિંગ', desc: 'હાઇ-સ્પીડ વાઇ-ફાઇ સાથે ઓનલાઇન મોક ટેસ્ટ પ્રેક્ટિસ ડેસ્ક' },
    { title: 'GATE, ESE અને PSU', desc: 'એન્જિનિયરિંગ ગ્રેજ્યુએટ્સ માટે ટેકનિકલ પ્રશ્નો ઉકેલવાનું શાંત વાતાવરણ' }
  ] : [
    { title: 'UPSC Civil Services', desc: 'IAS, IPS, IFS & State PSC Prelims & Mains study desks' },
    { title: 'GPSC Class 1 & 2', desc: 'State administrative competitive exam preparation' },
    { title: 'CA Final & Inter', desc: 'Silent environment for heavy accounting & tax audit revision' },
    { title: 'NEET & JEE Top Rankers', desc: 'Focused study zone for Physics, Chemistry & Biology marathons' },
    { title: 'SSC CGL & Banking', desc: 'Dedicated online mock test practice desks with fast Wi-Fi' },
    { title: 'GATE, ESE & PSUs', desc: 'Quiet atmosphere for technical engineering problem solving' }
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
  };

  return (
    <section className="py-20 bg-[#FFF8F5] text-[#201E1F] border-y border-[#F5E4E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-[#F5E4E4] text-[#983132] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Target className="w-4 h-4 text-[#EB6A30]" />
            <span>{t('aspirants.badge')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#201E1F]">
            {t('aspirants.headingStart')}
            <span className="font-serif italic text-[#983132]">{t('aspirants.headingHighlight')}</span>
          </h2>
          <p className="mt-3 text-base text-[#201E1F]/70">
            {isGu 
              ? 'ટોપ રેન્ક મેળવવા માટે રાત-દિવસ સમર્પિત સેંકડો તેજસ્વી વિદ્યાર્થીઓ સાથે અભ્યાસ કરો.' 
              : 'Join hundreds of committed aspirants aiming for top ranks in national and state level examinations.'}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {exams.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-white p-6 rounded-2xl border border-[#F5E4E4] shadow-sm hover:shadow-md hover:border-[#EB6A30]/50 transition-all flex items-start gap-4 group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#FFF0E8] text-[#EB6A30] flex items-center justify-center shrink-0 group-hover:bg-[#983132] group-hover:text-white transition-colors duration-300">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#201E1F]">{item.title}</h3>
                <p className="text-xs text-[#201E1F]/70 mt-1.5 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
