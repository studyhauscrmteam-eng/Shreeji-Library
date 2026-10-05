import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Testimonials() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  const reviews = isGu ? [
    {
      name: 'આરવ મહેતા',
      exam: 'GPSC વર્ગ-૧ રેન્ક ૧૪',
      initials: 'AM',
      bgColor: 'bg-[#983132]',
      text: 'શ્રીજી રીડિંગ લાઇબ્રેરીએ મને જે શાંતિ અને શિસ્ત આપી તે ઘરમાં ક્યારેય શક્ય ન હતી. ફિક્સ સીટ અને ૨૪°C એસીને લીધે દરરોજ ૧૦+ કલાક સળંગ અભ્યાસ કરી શકાયો.',
      stars: 5
    },
    {
      name: 'કાવ્યા શાહ',
      exam: 'CA ફાઇનલ ટોપ સ્કોરર',
      initials: 'KS',
      bgColor: 'bg-[#EB6A30]',
      text: 'અહીંના એકોસ્ટિક ક્યુબિકલ્સ અદ્ભુત છે. શૂન્ય અવાજ, આંખોને આરામદાયક LED લાઇટ, લેક્ચર્સ માટે ફાસ્ટ વાઇ-ફાઇ અને સુરક્ષિત લોકર. અભ્યાસ માટે સર્વશ્રેષ્ઠ જગ્યા!',
      stars: 5
    },
    {
      name: 'દીપક જોશી',
      exam: 'UPSC મેઇન્સ ક્વોલિફાઇડ',
      initials: 'DJ',
      bgColor: 'bg-[#201E1F]',
      text: 'રોજ સવારે આવીને પોતાની ફિક્સ સીટ પર બેસવાથી સમયનો એક પણ મિનિટ બગડતો નથી. સ્ટાફ ખૂબ સારો છે અને શાંતિનું ચુસ્ત પાલન કરાવે છે.',
      stars: 5
    },
    {
      name: 'અનન્યા શર્મા',
      exam: 'NEET AIR 340',
      initials: 'AS',
      bgColor: 'bg-[#983132]',
      text: 'શાંત વાતાવરણના કારણે હું ફોન કે અન્ય કોઈ ખલેલ વગર બાયોલોજીનો અભ્યાસ કરી શકી. ઓપન ટેરેસ પર ચા-નાસ્તાનો બ્રેક ખૂબ તાજગી આપે છે!',
      stars: 5
    },
    {
      name: 'રોહિત પટેલ',
      exam: 'JEE એડવાન્સ્ડ રેન્ક 512',
      initials: 'RP',
      bgColor: 'bg-[#EB6A30]',
      text: 'દરેક ડેસ્ક પર હાઇ સ્પીડ વાઇ-ફાઇ અને પાવર સોકેટ હોવાથી રોજના ૧૨ કલાક સુધી ઓનલાઇન લેક્ચર્સ અને ટેસ્ટ સીરીઝ સોલ્વ કરી શક્યો.',
      stars: 5
    },
    {
      name: 'પ્રિયાંશી વર્મા',
      exam: 'SSC CGL સિલેક્ટેડ',
      initials: 'PV',
      bgColor: 'bg-[#201E1F]',
      text: 'સ્વચ્છતા, CCTV સુરક્ષા, હાઇજેનિક વૉશરૂમ અને સપોર્ટિવ મેનેજમેન્ટ. સ્પર્ધાત્મક પરીક્ષાઓની તૈયારી માટે આ સાચું અભ્યાસ મંદિર છે.',
      stars: 5
    }
  ] : [
    {
      name: 'Aarav Mehta',
      exam: 'GPSC Class-1 Rank 14',
      initials: 'AM',
      bgColor: 'bg-[#983132]',
      text: 'ShreeJi Reading Library gave me the quiet discipline I could never find at home. Having a fixed assigned seat and continuous 24°C AC kept me in peak flow for 10+ hours every day.',
      stars: 5
    },
    {
      name: 'Kavya Shah',
      exam: 'CA Final Top Scorer',
      initials: 'KS',
      bgColor: 'bg-[#EB6A30]',
      text: 'The acoustic cubicles are incredible. Absolutely zero noise, dimmable desk lamp, fast dual fiber Wi-Fi for video lectures, and safe locker. Best reading space by far!',
      stars: 5
    },
    {
      name: 'Deepak Joshi',
      exam: 'UPSC Mains Qualified',
      initials: 'DJ',
      bgColor: 'bg-gradient-to-br from-[#EB6A30] to-[#983132]',
      text: 'Having my personal desk set up every morning meant I never wasted a single minute. The staff is polite and strictly maintains silence across all reading rooms.',
      stars: 5
    },
    {
      name: 'Ananya Sharma',
      exam: 'NEET AIR 340',
      initials: 'AS',
      bgColor: 'bg-[#983132]',
      text: 'The peaceful atmosphere allowed me to focus on biology marathons without any phone or noise distractions. The complimentary tea/coffee breaks are a great refresh!',
      stars: 5
    },
    {
      name: 'Rohit Patel',
      exam: 'JEE Advanced Rank 512',
      initials: 'RP',
      bgColor: 'bg-[#EB6A30]',
      text: 'Super high speed dual fiber Wi-Fi and power sockets at every desk. Solved physics problems for 12 hours straight every single day.',
      stars: 5
    },
    {
      name: 'Priyanshi Verma',
      exam: 'SSC CGL Selected',
      initials: 'PV',
      bgColor: 'bg-gradient-to-br from-[#EB6A30] to-[#983132]',
      text: 'Clean, highly secure with CCTV, clean washrooms, and very supportive management. Truly a sanctuary for competitive exam preparation.',
      stars: 5
    }
  ];

  // Duplicate list to create a seamless infinite horizontal loop
  const doubleReviews = [...reviews, ...reviews];

  return (
    <section className="py-24 bg-white text-[#201E1F] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('testimonials.badge')}</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#201E1F]">
            {t('testimonials.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('testimonials.headingHighlight')}</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#201E1F]/70">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

      </div>

      {/* Infinite Horizontal Marquee Track with CSS Pause on Hover */}
      <div className="relative w-full max-w-full overflow-hidden py-4">
        {/* Left and Right Fade Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-6">
          {doubleReviews.map((review, index) => (
            <div
              key={index}
              className="w-[320px] sm:w-[380px] bg-[#FFF8F5] p-6 sm:p-7 rounded-3xl border border-[#F5E4E4] shrink-0 shadow-sm hover:shadow-md hover:border-[#EB6A30]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* 5 Stars Rating & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#EB6A30]">
                    {[...Array(review.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#983132]/20" />
                </div>

                {/* Testimonial Quote Text */}
                <p className="text-sm text-[#201E1F]/80 leading-relaxed italic font-normal">
                  "{review.text}"
                </p>
              </div>

              {/* Author & Exam Details */}
              <div className="flex items-center gap-3.5 mt-6 pt-4 border-t border-[#F5E4E4]">
                {/* Stylized Initial Avatar */}
                <div className={`w-11 h-11 rounded-full ${review.bgColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm`}>
                  {review.initials}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#201E1F] flex items-center gap-1">
                    <span>{review.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                  </h4>
                  <p className="text-xs text-[#983132] font-semibold">{review.exam}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
