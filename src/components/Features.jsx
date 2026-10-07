import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Snowflake, 
  Armchair, 
  Grid, 
  Wifi, 
  Plug, 
  VolumeX, 
  ShieldCheck, 
  Droplets, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Sun, 
  Clock, 
  Wallet, 
  Heart, 
  Lock, 
  Car,
  X,
  ExternalLink,
  Camera
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    { 
      icon: Snowflake, 
      title: isGu ? 'સંપૂર્ણ એર કંડિશન્ડ' : 'Fully Air Conditioned',
      image: '/mitsubishi-ac-cooling.webp',
      descEn: 'Mitsubishi Heavy Duty Jetflow AC maintains a constant 24°C temperature with zero humidity.',
      descGu: 'મિત્સુબિશી હેવી ડ્યુટી જેટફ્લો AC ૨૪°C તાપમાન સાથે ભેજરહિત અને અવાજરહિત ઠંડક આપે છે.'
    },
    { 
      icon: Armchair, 
      title: isGu ? 'આરામદાયક અર્ગોનોમિક ખુરશી' : 'Ergonomic Chairs',
      image: '/study-atmosphere-lighting.webp',
      descEn: 'Adjustable high-density lumbar support chairs engineered for 10–14 hours of continuous study.',
      descGu: 'કમરના ટેકા સાથે ૧૦ થી ૧૪ કલાક સળંગ આરામથી બેસી શકાય તેવી અર્ગોનોમિક ઓફિસ ચેર.'
    },
    { 
      icon: Grid, 
      title: isGu ? 'વિશાળ સ્ટડી ડેસ્ક' : 'Spacious Study Tables',
      image: '/study-cubicles-maps.webp',
      descEn: 'Partitioned wooden study desks with dedicated book racks, top shelves and study maps.',
      descGu: 'પુસ્તકો, નોટ્સ અને નકશા રાખવા માટે ઉપરના શેલ્ફ સાથેનું મોટું લાકડાનું ક્યુબિકલ ટેબલ.'
    },
    { 
      icon: Wifi, 
      title: isGu ? 'હાઇ-સ્પીડ ફાઇબર વાઇ-ફાઇ' : 'High-Speed Wi-Fi',
      image: '/wifi-zone-power-outlets.webp',
      descEn: 'Dual high-speed optical fiber network across all desks for video lectures and test series.',
      descGu: 'ઓનલાઇન વિડીયો લેક્ચર્સ અને મોક ટેસ્ટ માટે અવિરત સુપરફાસ્ટ ઓપ્ટિકલ ફાઇબર વાઇ-ફાઇ.'
    },
    { 
      icon: Plug, 
      title: isGu ? 'સ્વતંત્ર ચાર્જિંગ પોઇન્ટ્સ' : 'Individual Charging Points',
      image: '/wifi-zone-power-outlets.webp',
      descEn: 'Dedicated 230V socket & switchboard at every single study desk for laptop and tablet charging.',
      descGu: 'લેપટોપ, ટેબ્લેટ અને મોબાઇલ ચાર્જિંગ માટે દરેક ડેસ્ક પર સ્વતંત્ર 230V પાવર સ્વિચબોર્ડ.'
    },
    { 
      icon: VolumeX, 
      title: isGu ? 'સંપૂર્ણ સાયલન્ટ વાતાવરણ' : 'Silent Study Environment',
      image: '/hero-study-hall.webp',
      descEn: 'Strict pin-drop silence policy inside the central reading hall with zero interruptions.',
      descGu: 'અભ્યાસના તમામ કલાકો દરમિયાન સંપૂર્ણ પિન-ડ્રોપ શાંતિના નિયમનું ચુસ્ત પાલન.'
    },
    { 
      icon: ShieldCheck, 
      title: isGu ? '૨૪×૭ CCTV કેમેરા સુરક્ષા' : '24×7 CCTV Security',
      image: '/library-main-entrance.webp',
      descEn: 'Comprehensive 24x7 HD camera surveillance ensuring the safety of your laptop, books, and bags.',
      descGu: 'તમારા પુસ્તકો, લેપટોપ અને સામાનની સલામતી માટે ૨૪ કલાક હાઇ-ડેફિનેશન CCTV કેમેરા સર્વેલન્સ.'
    },
    { 
      icon: Droplets, 
      title: isGu ? 'શુદ્ધ ઠંડુ RO પીવાનું પાણી' : 'Purified Drinking Water',
      image: '/terrace-refreshment-lounge.webp',
      descEn: 'Filtered chilled and room-temperature RO drinking water available 24/7 with open tea break lounge.',
      descGu: 'ચોવીસેય કલાક શુદ્ધ, ફિલ્ટર કરેલ ઠંડુ અને નોર્મલ RO પીવાનું પાણી ઉપલબ્ધ.'
    },
    { 
      icon: Sparkles, 
      title: isGu ? 'સ્વચ્છ અને હાઇજેનિક વૉશરૂમ' : 'Clean Washrooms',
      image: '/terrace-refreshment-lounge.webp',
      descEn: 'Spotless, regularly sanitized and well-ventilated washrooms maintained daily.',
      descGu: 'નિયમિતપણે સેનિટાઇઝ થતા અને એકદમ સ્વચ્છ હાઇજેનિક વૉશરૂમ્સ.'
    },
    { 
      icon: RefreshCw, 
      title: isGu ? 'રોજિંદી સાફ-સફાઈ' : 'Daily Cleaning',
      image: '/study-hall-aisle.webp',
      descEn: 'Dedicated housekeeping staff ensuring dust-free desks, clean floors, and fresh atmosphere.',
      descGu: 'ડેસ્ક અને ફ્લોરિંગની રોજેરોજ સઘન સાફ-સફાઈ જેથી વાતાવરણ હંમેશા તાજગીસભર રહે.'
    },
    { 
      icon: Zap, 
      title: isGu ? '૧૦૦% પાવર બેકઅપ' : 'Power Backup',
      image: '/mitsubishi-ac-cooling.webp',
      descEn: 'Instant generator and inverter backup so your study flow and AC cooling never get interrupted.',
      descGu: 'વીજળી જાય ત્યારે તાત્કાલિક જનરેટર અને ઇન્વર્ટર બેકઅપથી અભ્યાસ અટકતો નથી.'
    },
    { 
      icon: Sun, 
      title: isGu ? 'કુદરતી રોશની અને વેન્ટિલેશન' : 'Natural Lighting',
      image: '/terrace-refreshment-lounge.webp',
      descEn: 'Spacious open terrace providing natural sunlight and fresh air for relaxing study breaks.',
      descGu: 'અભ્યાસના વિરામ દરમિયાન તાજી હવા અને કુદરતી રોશની માટે સુંદર ઓપન ટેરેસ.'
    },
    { 
      icon: Clock, 
      title: isGu ? 'અનુકૂળ સમયપત્રક' : 'Flexible Timings',
      image: '/hero-study-hall.webp',
      descEn: 'Open 17 hours daily (06:00 AM – 11:00 PM), 365 days a year including Sundays & holidays.',
      descGu: 'રવિવાર અને જાહેર રજાઓ સહિત દરરોજ સવારે ૦૬:૦૦ થી રાત્રે ૧૧:૦૦ સુધી ખુલ્લી રહે છે.'
    },
    { 
      icon: Wallet, 
      title: isGu ? 'કિફાયતી માસિક ફી' : 'Affordable Membership',
      image: '/study-cubicles-maps.webp',
      descEn: 'Simple, transparent monthly pricing starting from ₹700 with zero hidden charges.',
      descGu: 'કોઈપણ છુપા એડમિશન ચાર્જ વગર માત્ર ₹૭૦૦ થી શરૂ થતી કિફાયતી માસિક ફી.'
    },
    { 
      icon: Heart, 
      title: isGu ? 'વિદ્યાર્થી-મૈત્રીપૂર્ણ સંચાલન' : 'Friendly Management',
      image: '/reception-guidance-area.webp',
      descEn: 'Helpful and supportive library coordinators always available to assist students.',
      descGu: 'વિદ્યાર્થીઓની કોઈપણ મુશ્કેલી કે પ્રશ્નમાં તુરંત મદદરૂપ થતું સહાયક સંચાલન.'
    },
    { 
      icon: Lock, 
      title: isGu ? 'સુરક્ષિત લોકર સુવિધા' : 'Personal Secure Lockers',
      image: '/study-desks-overhead-shelf.webp',
      descEn: 'Personal lockers and top shelves to securely keep your heavy books and notes overnight.',
      descGu: 'તમારા સંદર્ભ પુસ્તકો અને સાહિત્ય રાત્રે સુરક્ષિત રાખવા માટે વ્યક્તિગત લોકર્સ.'
    },
    { 
      icon: Car, 
      title: isGu ? 'ટૂ-વ્હીલર પાર્કિંગ સુવિધા' : 'Parking Facility',
      image: '/library-main-entrance.webp',
      descEn: 'Dedicated, secure two-wheeler parking space directly outside the library building.',
      descGu: 'લાઇબ્રેરી બિલ્ડિંગના ગ્રાઉન્ડ ફ્લોર પર વાહનો માટે સુરક્ષિત પાર્કિંગ વ્યવસ્થા.'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <section id="features" className="py-24 bg-[#FFF8F5] text-[#201E1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('features.badge')}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#201E1F]">
            {t('features.headingStart')}
            <span className="font-serif italic text-[#EB6A30]">{t('features.headingHighlight')}</span>
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-[#201E1F]/70 font-normal">
            {isGu ? 'વાસ્તવિક ફોટો જોવા માટે કોઈપણ સુવિધા કાર્ડ પર ક્લિક કરો.' : 'Click on any facility below to see its authentic photo and details.'}
          </p>
        </motion.div>

        {/* 17 Features Interactive Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                onClick={() => setSelectedFeature(feature)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F5E4E4] hover:border-[#EB6A30] transition-all duration-300 flex flex-col items-center text-center justify-center min-h-[120px] sm:min-h-[130px] shadow-sm hover:shadow-lg hover:-translate-y-1 group cursor-pointer relative"
              >
                {/* Mini Camera Preview Indicator */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-[#EB6A30]" />
                </div>

                <div className="w-10 h-10 rounded-xl bg-[#FFF0E8] text-[#983132] flex items-center justify-center mb-3 group-hover:bg-[#983132] group-hover:text-white transition-colors duration-300">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-[#201E1F] leading-tight line-clamp-2">
                  {feature.title}
                </h3>
                <span className="text-[10px] text-[#EB6A30] font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isGu ? 'ફોટો જુઓ →' : 'View Photo →'}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

      </div>

      {/* INSTANT PHOTO PREVIEW MODAL */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#201E1F] border border-white/20 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full text-white relative flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-[#EB6A30] text-white p-2 rounded-full backdrop-blur-md transition-colors border border-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Photo */}
              <div className="relative h-[280px] sm:h-[360px] bg-black w-full overflow-hidden">
                <img
                  src={selectedFeature.image}
                  alt={selectedFeature.title + ' at ShreeJi Reading Library, Bhavnagar'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F] via-transparent to-black/20" />
                
                {/* Floating Facility Badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-xs font-bold text-[#EB6A30]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGu ? 'અસલ સુવિધા ફોટો' : 'AUTHENTIC FACILITY'}</span>
                </div>
              </div>

              {/* Caption & Description */}
              <div className="p-6 sm:p-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EB6A30] text-white flex items-center justify-center shrink-0">
                    <selectedFeature.icon className="w-4 h-4" />
                  </div>
                  <span>{selectedFeature.title}</span>
                </h3>

                <p className="text-sm text-white/80 leading-relaxed font-normal">
                  {isGu ? selectedFeature.descGu : selectedFeature.descEn}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
                  <span className="text-xs text-white/60">
                    {isGu ? 'શ્રીજી રીડિંગ લાઇબ્રેરી • ૧૦૦% શાંતિ અને સુવિધા' : 'ShreeJi Reading Library • 100% Quiet Study'}
                  </span>

                  <a
                    href="#gallery"
                    onClick={() => setSelectedFeature(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#EB6A30] hover:text-white transition-colors"
                  >
                    <span>{isGu ? 'ફોટો ગેલેરી જુઓ' : 'Explore All in Gallery'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
