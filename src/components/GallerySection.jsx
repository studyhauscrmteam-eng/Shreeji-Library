import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Play, Pause, Grid, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const allGalleryPhotos = [
  {
    id: 1,
    src: '/library-main-entrance.webp',
    width: 1086,
    height: 1448,
    titleEn: 'Library Main Entrance Door',
    titleGu: 'લાઇબ્રેરી મુખ્ય પ્રવેશ દ્વાર',
    descEn: 'Welcoming entrance with ShreeJi logo, Bhagat Singh & Swami Vivekananda inspirational posters',
    descGu: 'શ્રીજી લોગો, ભગતસિંહ અને સ્વામી વિવેકાનંદના પ્રેરણાદાયી પોસ્ટરો સાથેનું સ્વાગત પ્રવેશદ્વાર',
    category: 'Entrance'
  },
  {
    id: 2,
    src: '/study-cubicles-maps.webp',
    width: 1280,
    height: 945,
    titleEn: 'Study Cubicles with Maps (#17 - #19)',
    titleGu: 'નકશા સાથે સ્ટડી ક્યુબિકલ્સ (#૧૭ - #૧૯)',
    descEn: 'Assigned cubicles equipped with India & Gujarat maps for UPSC, GPSC & competitive aspirants',
    descGu: 'UPSC, GPSC અને સ્પર્ધાત્મક પરીક્ષાર્થીઓ માટે ભારત અને ગુજરાતના નકશા સાથેના ક્યુબિકલ્સ',
    category: 'Cubicles'
  },
  {
    id: 3,
    src: '/mitsubishi-ac-cooling.webp',
    width: 1280,
    height: 964,
    titleEn: 'Mitsubishi Heavy Duty Jetflow AC',
    titleGu: 'મિત્સુબિશી હેવી ડ્યુટી જેટફ્લો AC',
    descEn: 'High-capacity 24°C climate-controlled air conditioning providing zero humidity comfort',
    descGu: '૨૪°C તાપમાન સાથે ભેજરહિત અને અવાજરહિત ઠંડક આપતી સેન્ટ્રલ એર કંડિશનિંગ સિસ્ટમ',
    category: 'Facilities'
  },
  {
    id: 4,
    src: '/acoustic-wall-panels.webp',
    width: 1280,
    height: 960,
    titleEn: 'Soundproof Acoustic Wall Panels (#65)',
    titleGu: 'સાઉન્ડપ્રૂફ એકોસ્ટિક વોલ પેનલ્સ (#૬૫)',
    descEn: 'Special sound-dampening foam panels engineered for pin-drop silence and high focus',
    descGu: 'સંપૂર્ણ શાંતિ અને એકાગ્રતા માટે સાઉન્ડ ડેમ્પનિંગ ફોમ પેનલ્સ સાથેનો શાંત ઝોન',
    category: 'Silence'
  },
  {
    id: 5,
    src: '/terrace-refreshment-lounge.webp',
    width: 1280,
    height: 1024,
    titleEn: 'Open Air Terrace Refreshment Lounge',
    titleGu: 'ઓપન ટેરેસ રિફ્રેશમેન્ટ લાઉન્જ',
    descEn: 'Spacious open terrace for study breaks, tea/coffee, snacks, and fresh air relaxation',
    descGu: 'અભ્યાસના વિરામ, ચા-નાસ્તો અને તાજી હવા ખાવા માટે સુંદર ખુલ્લી ટેરેસ સ્પેસ',
    category: 'Terrace'
  },
  {
    id: 6,
    src: '/main-study-hall-row.webp',
    width: 1280,
    height: 986,
    titleEn: 'Main Study Hall Row #1 to #33',
    titleGu: 'મુખ્ય સ્ટડી હોલ રો #૧ થી #૩૩',
    descEn: 'Spacious central aisle with individual numbered cubicles, ceiling fans, and bright lighting',
    descGu: 'વ્યક્તિગત નંબરવાળા ક્યુબિકલ્સ અને સ્વચ્છ વાતાવરણ સાથેનો મુખ્ય સેન્ટ્રલ પેસેજ',
    category: 'Study Hall'
  },
  {
    id: 7,
    src: '/central-study-hall-students.webp',
    width: 1280,
    height: 964,
    titleEn: 'Central Study Hall with Hardworking Students',
    titleGu: 'વિદ્યાર્થીઓ સાથે સેન્ટ્રલ રીડિંગ હોલ',
    descEn: 'Inspiring study environment where serious aspirants prepare together with peak discipline',
    descGu: 'સંપૂર્ણ શાંતિ અને શિસ્ત સાથે અભ્યાસ કરતા ગંભીર વિદ્યાર્થીઓનું પ્રેરણાદાયી વાતાવરણ',
    category: 'Study Hall'
  },
  {
    id: 8,
    src: '/single-study-cubicle-led.webp',
    width: 1125,
    height: 1398,
    titleEn: 'Single Study Cubicle with LED Task Light',
    titleGu: 'LED ટાસ્ક લાઇટ સાથે સિંગલ ક્યુબિકલ',
    descEn: 'Individual wooden desk with warm LED lamp, power socket, and ergonomic chair (#42)',
    descGu: 'ગરમ LED લેમ્પ, પાવર સોકેટ અને અર્ગોનોમિક ખુરશી સાથેનું પર્સનલ ડેસ્ક (#૪૨)',
    category: 'Cubicles'
  },
  {
    id: 9,
    src: '/study-hall-aisle.webp',
    width: 1280,
    height: 960,
    titleEn: 'Wide Study Hall Aisle & Clean Passageway',
    titleGu: 'પહોળો સ્ટડી હોલ પેસેજ',
    descEn: 'Clean, well-maintained passage ensuring students move freely without disturbance',
    descGu: 'ખલેલ પહોંચાડ્યા વિના સરળતાથી અવરજવર કરી શકાય તેવો સ્વચ્છ અને મોટો પેસેજ',
    category: 'Study Hall'
  },
  {
    id: 10,
    src: '/study-desks-overhead-shelf.webp',
    width: 1086,
    height: 1448,
    titleEn: 'Personal Study Desks with Overhead Shelf',
    titleGu: 'ઓવરહેડ શેલ્ફ સાથે પર્સનલ સ્ટડી ડેસ્ક',
    descEn: 'Heavy wooden shelves designed to store multiple bulky textbooks and study notes',
    descGu: 'ભારે પુસ્તકો અને રફ નોટ્સ સુરક્ષિત મૂકવા માટે ઉપરના ભાગે બનાવેલ શેલ્ફ',
    category: 'Cubicles'
  },
  {
    id: 11,
    src: '/study-atmosphere-lighting.webp',
    width: 1086,
    height: 1448,
    titleEn: 'Study Atmosphere & Ambient Lighting',
    titleGu: 'શાંત અભ્યાસ વાતાવરણ અને લાઇટિંગ',
    descEn: 'Balanced non-glare illumination designed for late-night and marathon study sessions',
    descGu: 'લાંબા અભ્યાસ માટે આંખોને થાક ન લાગે તેવી બેલેન્સ્ડ લાઇટિંગ વ્યવસ્થા',
    category: 'Study Hall'
  },
  {
    id: 12,
    src: '/wifi-zone-power-outlets.webp',
    width: 1086,
    height: 1448,
    titleEn: 'High-speed Wi-Fi Zone & Power Outlets',
    titleGu: 'હાઇ-સ્પીડ વાઇ-ફાઇ ઝોન અને પાવર આઉટલેટ્સ',
    descEn: 'Dedicated plug points at every single cubicle for uninterrupted digital learning',
    descGu: 'લેપટોપ અને ટેબ્લેટ પર ઓનલાઇન લેક્ચર્સ જોવા માટે દરેક ડેસ્ક પર સ્વતંત્ર પાવર સપ્લાય',
    category: 'Facilities'
  },
  {
    id: 13,
    src: '/reception-guidance-area.webp',
    width: 1280,
    height: 987,
    titleEn: 'Reception & Student Guidance Area',
    titleGu: 'રિસેપ્શન અને સ્ટુડન્ટ ગાઇડન્સ એરિયા',
    descEn: 'Help desk for new admissions, seat reservations, and student inquiries',
    descGu: 'નવા એડમિશન, સીટ એલોકેશન અને વિદ્યાર્થી સહાય માટેનો રિસેપ્શન ડેસ્ક',
    category: 'Entrance'
  },
  {
    id: 14,
    src: '/quiet-study-area.webp',
    width: 1280,
    height: 960,
    titleEn: 'Dedicated Quiet Study Area',
    titleGu: 'શાંત અભ્યાસ વિસ્તાર',
    descEn: 'Peaceful corner desks built for zero distraction revision and mock tests',
    descGu: 'ખાસ રિવિઝન અને મોક ટેસ્ટની પ્રેક્ટિસ માટે શાંત ખૂણામાં ગોઠવાયેલ ડેસ્ક',
    category: 'Cubicles'
  }
];

export default function GallerySection({ onOpenBooking }) {
  const { language, t } = useLanguage();
  const isGu = language === 'gu';

  const [showAll, setShowAll] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play Slideshow Timer (reduced to fast 1.8s interval)
  useEffect(() => {
    let timer;
    if (isPlaying && currentIndex !== null) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allGalleryPhotos.length);
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex]);

  // Keyboard Navigation for Slideshow
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentIndex === null) return;
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % allGalleryPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + allGalleryPhotos.length) % allGalleryPhotos.length);
      } else if (e.key === 'Escape') {
        setCurrentIndex(null);
        setIsPlaying(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const openSlideshow = (index = 0) => {
    setCurrentIndex(index);
  };

  const closeSlideshow = () => {
    setCurrentIndex(null);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allGalleryPhotos.length) % allGalleryPhotos.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allGalleryPhotos.length);
  };

  const currentPhoto = currentIndex !== null ? allGalleryPhotos[currentIndex] : null;

  return (
    <section id="gallery" className="py-24 bg-white text-[#201E1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Slideshow Launch CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#983132]">{t('gallery.badge')}</span>
              <div className="h-[1px] w-12 bg-[#F5E4E4]" />
            </div>

            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#201E1F]">
              {t('gallery.headingStart')}
              <span className="font-serif italic text-[#EB6A30]">{t('gallery.headingHighlight')}</span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#201E1F]/70 max-w-2xl">
              {t('gallery.subtitle')}
            </p>
          </motion.div>

          {/* Action Buttons: Slideshow & View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                openSlideshow(0);
                setIsPlaying(true);
              }}
              className="bg-[#FFF0E8] hover:bg-[#ffe5d6] text-[#A84815] font-semibold text-sm px-5 py-3 rounded-full transition-all flex items-center gap-2 border border-[#EB6A30]/30 shadow-sm"
            >
              <Play className="w-4 h-4 fill-[#EB6A30]" />
              <span>{t('gallery.startSlideshow')}</span>
            </button>

            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="bg-white hover:bg-[#FFF8F5] text-[#201E1F] font-semibold text-sm px-5 py-3 rounded-full transition-all flex items-center gap-2 border border-[#F5E4E4] shadow-sm"
            >
              <Grid className="w-4 h-4 text-[#983132]" />
              <span>{showAll ? t('gallery.viewLess') : t('gallery.viewMore')}</span>
            </button>
          </div>
        </div>

        {/* 1. CURATED BENTO GRID (Default 6 Photos) */}
        {!showAll && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            
            {/* Column 1: Library Main Entrance Door (Tall Card) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              onClick={() => openSlideshow(0)}
              className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[520px] bg-[#FFF8F5]"
            >
              <img
                src={allGalleryPhotos[0].src}
                alt={(isGu ? allGalleryPhotos[0].titleGu : allGalleryPhotos[0].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                width="1086"
                height="1448"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-1">
                  {allGalleryPhotos[0].category}
                </span>
                <span className="text-white text-base font-bold flex items-center justify-between gap-2">
                  <span>{isGu ? allGalleryPhotos[0].titleGu : allGalleryPhotos[0].titleEn}</span>
                  <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                </span>
                <p className="text-xs text-white/70 mt-1 line-clamp-2">
                  {isGu ? allGalleryPhotos[0].descGu : allGalleryPhotos[0].descEn}
                </p>
              </div>
              <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                #1
              </div>
            </motion.div>

            {/* Column 2: Stacked 2 Cards */}
            <div className="flex flex-col gap-4">
              {/* Photo 2: Cubicles with Maps */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => openSlideshow(1)}
                className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[252px] bg-[#FFF8F5]"
              >
                <img
                  src={allGalleryPhotos[1].src}
                  alt={(isGu ? allGalleryPhotos[1].titleGu : allGalleryPhotos[1].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                  width="1280"
                  height="945"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-0.5">
                    {allGalleryPhotos[1].category}
                  </span>
                  <span className="text-white text-sm font-bold flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{isGu ? allGalleryPhotos[1].titleGu : allGalleryPhotos[1].titleEn}</span>
                    <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                  </span>
                </div>
                <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                  #2
                </div>
              </motion.div>

              {/* Photo 3: Mitsubishi AC */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onClick={() => openSlideshow(2)}
                className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[252px] bg-[#FFF8F5]"
              >
                <img
                  src={allGalleryPhotos[2].src}
                  alt={(isGu ? allGalleryPhotos[2].titleGu : allGalleryPhotos[2].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                  width="1280"
                  height="964"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-0.5">
                    {allGalleryPhotos[2].category}
                  </span>
                  <span className="text-white text-sm font-bold flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{isGu ? allGalleryPhotos[2].titleGu : allGalleryPhotos[2].titleEn}</span>
                    <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                  </span>
                </div>
                <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                  #3
                </div>
              </motion.div>
            </div>

            {/* Column 3: Stacked 2 Cards */}
            <div className="flex flex-col gap-4">
              {/* Photo 4: Soundproof Zone */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.15 }}
                onClick={() => openSlideshow(3)}
                className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[252px] bg-[#FFF8F5]"
              >
                <img
                  src={allGalleryPhotos[3].src}
                  alt={(isGu ? allGalleryPhotos[3].titleGu : allGalleryPhotos[3].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                  width="1280"
                  height="960"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-0.5">
                    {allGalleryPhotos[3].category}
                  </span>
                  <span className="text-white text-sm font-bold flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{isGu ? allGalleryPhotos[3].titleGu : allGalleryPhotos[3].titleEn}</span>
                    <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                  </span>
                </div>
                <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                  #4
                </div>
              </motion.div>

              {/* Photo 5: Terrace Lounge */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: 0.25 }}
                onClick={() => openSlideshow(4)}
                className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[252px] bg-[#FFF8F5]"
              >
                <img
                  src={allGalleryPhotos[4].src}
                  alt={(isGu ? allGalleryPhotos[4].titleGu : allGalleryPhotos[4].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                  width="1280"
                  height="1024"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-0.5">
                    {allGalleryPhotos[4].category}
                  </span>
                  <span className="text-white text-sm font-bold flex items-center justify-between gap-2">
                    <span className="line-clamp-1">{isGu ? allGalleryPhotos[4].titleGu : allGalleryPhotos[4].titleEn}</span>
                    <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                  </span>
                </div>
                <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                  #5
                </div>
              </motion.div>
            </div>

            {/* Column 4: Long Central Study Hall Aisle (Tall Card) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onClick={() => openSlideshow(5)}
              className="group relative rounded-3xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[520px] bg-[#FFF8F5]"
            >
              <img
                src={allGalleryPhotos[5].src}
                alt={(isGu ? allGalleryPhotos[5].titleGu : allGalleryPhotos[5].titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                width="1280"
                height="986"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/85 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#EB6A30] mb-1">
                  {allGalleryPhotos[5].category}
                </span>
                <span className="text-white text-base font-bold flex items-center justify-between gap-2">
                  <span>{isGu ? allGalleryPhotos[5].titleGu : allGalleryPhotos[5].titleEn}</span>
                  <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                </span>
                <p className="text-xs text-white/70 mt-1 line-clamp-2">
                  {isGu ? allGalleryPhotos[5].descGu : allGalleryPhotos[5].descEn}
                </p>
              </div>
              <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity border border-white/10">
                #6
              </div>
            </motion.div>

          </div>
        )}

        {/* 2. EXPANDED UNIFORM GRID (All 14 Photos) */}
        {showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {allGalleryPhotos.map((photo, index) => {
              const title = isGu ? photo.titleGu : photo.titleEn;
              const desc = isGu ? photo.descGu : photo.descEn;

              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  onClick={() => openSlideshow(index)}
                  className="group relative rounded-2xl overflow-hidden shadow-sm border border-[#F5E4E4] cursor-pointer h-[260px] bg-[#FFF8F5]"
                >
                  <img
                    src={photo.src}
                    alt={title + ' at ShreeJi Reading Library, Bhavnagar'}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#201E1F]/90 via-[#201E1F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#EB6A30] mb-0.5">
                      {photo.category}
                    </span>
                    <span className="text-white text-sm font-bold flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{title}</span>
                      <Maximize2 className="w-4 h-4 text-[#EB6A30] shrink-0" />
                    </span>
                    <p className="text-[11px] text-white/70 mt-1 line-clamp-2">
                      {desc}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10">
                    #{photo.id}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* View All Toggle Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-[#FFF8F5] border border-[#F5E4E4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#983132] text-white flex items-center justify-center shrink-0 shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#201E1F]">
                {isGu ? '૧૪ વાસ્તવિક હાઇ-ક્વોલિટી ફોટા ઉપલબ્ધ છે' : '14 Authentic High-Quality Library Photos Available'}
              </p>
              <p className="text-xs text-[#201E1F]/85">
                {isGu ? 'બધા ફોટા જોવા અથવા સ્લાઇડશો મોડ શરૂ કરવા માટે ક્લિક કરો' : 'Browse through all cubicles, AC halls, acoustic zones, and terrace lounge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full sm:w-auto bg-[#983132] hover:bg-[#7f2728] text-white font-semibold text-sm px-6 py-3 rounded-full transition-all shadow-md text-center"
            >
              {showAll ? (isGu ? 'ઓછા ફોટા જુઓ' : 'Show Curated View (6)') : (isGu ? 'બધા ૧૪ ફોટા જુઓ' : 'View All 14 Photos')}
            </button>
          </div>
        </div>

      </div>

      {/* FULLSCREEN SLIDESHOW / LIGHTBOX MODAL */}
      <AnimatePresence>
        {currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-20">
              {/* Photo Counter Badge */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs sm:text-sm font-mono">
                <span className="text-[#EB6A30] font-bold">#{currentPhoto.id}</span>
                <span className="text-white/40">/</span>
                <span>{allGalleryPhotos.length}</span>
                <span className="hidden sm:inline text-white/50 border-l border-white/20 pl-3 uppercase tracking-wider text-xs font-sans">
                  {currentPhoto.category}
                </span>
              </div>

              {/* Controls: AutoPlay & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all border ${
                    isPlaying 
                      ? 'bg-[#EB6A30] text-white border-[#EB6A30]' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{t('gallery.pauseSlideshow')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('gallery.startSlideshow')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={closeSlideshow}
                  className="bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-full transition-colors border border-white/10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Stage: Image & Arrow Navigators */}
            <div className="relative flex-1 flex items-center justify-center my-4 w-full max-w-6xl mx-auto">
              {/* Previous Button */}
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 z-30 bg-black/50 hover:bg-[#EB6A30] text-white p-3 sm:p-4 rounded-full backdrop-blur-md transition-all border border-white/15 hover:scale-110 shadow-2xl"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Main Image with Animated Transition */}
              <div className="relative w-full h-[55vh] sm:h-[65vh] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentPhoto.id}
                    src={currentPhoto.src}
                    alt={(isGu ? currentPhoto.titleGu : currentPhoto.titleEn) + ' at ShreeJi Reading Library, Bhavnagar'}
                    width={currentPhoto.width}
                    height={currentPhoto.height}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                </AnimatePresence>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 z-30 bg-black/50 hover:bg-[#EB6A30] text-white p-3 sm:p-4 rounded-full backdrop-blur-md transition-all border border-white/15 hover:scale-110 shadow-2xl"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Caption & Thumbnail Carousel */}
            <div className="w-full max-w-6xl mx-auto z-20 space-y-3">
              {/* Photo Title & Description */}
              <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {isGu ? currentPhoto.titleGu : currentPhoto.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 max-w-2xl mx-auto">
                  {isGu ? currentPhoto.descGu : currentPhoto.descEn}
                </p>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
                {allGalleryPhotos.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === currentIndex 
                        ? 'border-[#EB6A30] scale-105 shadow-lg' 
                        : 'border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={item.src} alt={isGu ? item.titleGu : item.titleEn} width={item.width} height={item.height} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
