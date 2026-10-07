import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  // 6 pages flip sequentially from right to left
  const pages = [0, 1, 2, 3, 4, 5];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-4 overflow-hidden select-none"
        >
          {/* Warm ambient glow */}
          <div className="absolute w-72 h-72 bg-[#FFF0E8] rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">

            {/* 3D Book with flipping pages */}
            <div className="mb-6" style={{ perspective: '800px' }}>
              <div 
                className="relative"
                style={{ 
                  width: '160px', 
                  height: '120px',
                  transformStyle: 'preserve-3d',
                  transform: 'scale(0.65)',
                }}
              >
                {/* Book shadow */}
                <div 
                  className="absolute rounded-full bg-[#983132]/15 blur-md"
                  style={{ bottom: '-8px', left: '10px', width: '140px', height: '10px' }}
                />

                {/* Left cover */}
                <div
                  className="absolute rounded-l-sm overflow-hidden"
                  style={{
                    left: 0, top: 0,
                    width: '78px', height: '120px',
                    background: 'linear-gradient(135deg, #983132, #7a2627)',
                    borderRadius: '4px 0 0 4px',
                    boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15)',
                  }}
                />

                {/* Right cover */}
                <div
                  className="absolute"
                  style={{
                    right: 0, top: 0,
                    width: '78px', height: '120px',
                    background: 'linear-gradient(225deg, #983132, #7a2627)',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.15)',
                  }}
                />

                {/* Left static page */}
                <div
                  className="absolute bg-white"
                  style={{
                    left: '4px', top: '4px',
                    width: '72px', height: '112px',
                    borderRadius: '2px 0 0 2px',
                  }}
                >
                  {/* Page lines */}
                  <div className="p-3 pt-4 space-y-2.5">
                    <div className="h-[2px] w-full bg-[#983132] rounded opacity-60" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-4/5 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-3/5 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-4/5 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-2/3 bg-[#c4b0ab] rounded opacity-50" />
                  </div>
                </div>

                {/* Right static page */}
                <div
                  className="absolute bg-white"
                  style={{
                    right: '4px', top: '4px',
                    width: '72px', height: '112px',
                    borderRadius: '0 2px 2px 0',
                  }}
                >
                  <div className="p-3 pt-4 space-y-2.5">
                    <div className="h-[2px] w-full bg-[#EB6A30] rounded opacity-60" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-3/4 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-4/5 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-full bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-2/3 bg-[#c4b0ab] rounded opacity-50" />
                    <div className="h-[1.5px] w-4/5 bg-[#c4b0ab] rounded opacity-50" />
                  </div>
                </div>

                {/* Spine line */}
                <div
                  className="absolute"
                  style={{
                    left: '79px', top: '2px',
                    width: '2px', height: '116px',
                    background: 'linear-gradient(to bottom, #5c191a, #7a2627, #5c191a)',
                  }}
                />

                {/* Bookmark ribbon */}
                <div
                  className="absolute"
                  style={{
                    left: '76px', bottom: '-12px',
                    width: '0', height: '0',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '14px solid #EB6A30',
                  }}
                />

                {/* Animated flipping pages */}
                {pages.map((pageIndex) => (
                  <motion.div
                    key={pageIndex}
                    className="absolute"
                    style={{
                      right: '4px', top: '4px',
                      width: '72px', height: '112px',
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      zIndex: 10 + pages.length - pageIndex,
                    }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: -180 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 + pageIndex * 0.32,
                      ease: [0.645, 0.045, 0.355, 1],
                    }}
                  >
                    {/* Front face (right-side page) */}
                    <div
                      className="absolute inset-0 bg-white rounded-r-sm"
                      style={{
                        backfaceVisibility: 'hidden',
                        boxShadow: '-1px 0 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div className="p-3 pt-4 space-y-2.5">
                        <div className="h-[2px] w-3/4 bg-[#EB6A30] rounded opacity-50" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-4/5 bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-3/5 bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-2/3 bg-[#d4c4be] rounded opacity-40" />
                      </div>
                    </div>

                    {/* Back face (left-side page when flipped) */}
                    <div
                      className="absolute inset-0 bg-[#faf6f3] rounded-l-sm"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        boxShadow: '1px 0 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div className="p-3 pt-4 space-y-2.5">
                        <div className="h-[2px] w-2/3 bg-[#983132] rounded opacity-50" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-3/4 bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-4/5 bg-[#d4c4be] rounded opacity-40" />
                        <div className="h-[1.5px] w-full bg-[#d4c4be] rounded opacity-40" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ShreeJi Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-sm border border-[#F5E4E4] flex items-center justify-center mb-3"
            >
              <img 
                src="/assets/logo.webp" 
                alt="ShreeJi Reading Library logo — silent study hall in Bhavnagar" 
                width="256"
                height="143"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </motion.div>

            {/* Brand Title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-xs font-bold uppercase tracking-widest text-[#983132] mb-1"
            >
              {t('preloader.title')}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-xs text-[#201E1F]/60 font-serif italic"
            >
              {t('preloader.subtitle')}
            </motion.p>

            {/* Progress Line */}
            <div className="w-36 h-[2px] bg-[#F5E4E4] rounded-full overflow-hidden mt-5">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-[#983132] via-[#EB6A30] to-[#EB6A30] rounded-full"
              />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
