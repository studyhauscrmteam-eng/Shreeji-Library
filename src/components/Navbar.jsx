import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.about'), href: '#about' },
    { name: t('nav.whyUs'), href: '#features' },
    { name: t('nav.cubicle'), href: '#reading-space' },
    { name: t('nav.membership'), href: '#plans' },
    { name: t('nav.facilities'), href: '#facilities' },
    { name: t('nav.gallery'), href: '#gallery' },
    { name: t('nav.faq'), href: '#faq' },
    { name: t('nav.contact'), href: '#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'glass-nav shadow-md py-3 border-b border-[#F5E4E4]' 
        : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
    }`}>
      {/* Full-width responsive container utilizing screen space */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo (Standalone, as logo image contains library name) */}
          <a href="#top" className="flex items-center group shrink-0">
            <div className={`transition-all duration-300 flex items-center justify-center ${
              scrolled 
                ? 'bg-transparent p-0 shadow-none border-0' 
                : 'bg-white px-3.5 py-1.5 rounded-xl shadow-md border border-white/20'
            }`}>
              <img 
                src="/assets/logo.jpg" 
                alt="ShreeJi Reading Library" 
                className="h-10 sm:h-12 w-auto object-contain rounded-md"
              />
            </div>
          </a>

          {/* Desktop Navigation Links (Evenly distributed center spacing) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 2xl:gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-all duration-200 relative group py-1 ${
                  scrolled 
                    ? 'text-[#201E1F]/90 hover:text-[#983132]' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#EB6A30] transition-all duration-300 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          {/* Action Controls (Right aligned) */}
          <div className="hidden md:flex items-center gap-3.5 shrink-0">
            
            {/* Language Switcher Pill */}
            <div className={`flex items-center p-1 rounded-full border transition-all ${
              scrolled 
                ? 'bg-[#FFF8F5] border-[#F5E4E4]' 
                : 'bg-black/40 border-white/25 backdrop-blur-md'
            }`}>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-[#983132] text-white shadow-sm'
                    : scrolled ? 'text-[#201E1F]/70 hover:text-[#201E1F]' : 'text-white/70 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('gu')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  language === 'gu'
                    ? 'bg-[#983132] text-white shadow-sm'
                    : scrolled ? 'text-[#201E1F]/70 hover:text-[#201E1F]' : 'text-white/70 hover:text-white'
                }`}
                title="ગુજરાતી"
              >
                ગુજરાતી
              </button>
            </div>

            {/* Primary Action Button (Book a Seat) */}
            <button
              onClick={onOpenBooking}
              className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 group ${
                scrolled
                  ? 'bg-[#983132] hover:bg-[#7f2728] text-white hover:shadow-[#983132]/20'
                  : 'bg-white hover:bg-white/90 text-[#201E1F]'
              }`}
            >
              <span>{t('nav.bookSeat')}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

          </div>

          {/* Mobile Menu & Language Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Main CTA Button */}
            <button
              onClick={onOpenBooking}
              className="bg-[#983132] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1"
            >
              <span>{t('nav.bookSeat')}</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Mobile Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-full border flex items-center gap-1 ${
                scrolled 
                  ? 'bg-[#FFF8F5] border-[#F5E4E4] text-[#983132]' 
                  : 'bg-black/40 border-white/20 text-white backdrop-blur-md'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#EB6A30]" />
              <span>{language === 'en' ? 'GU' : 'EN'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors ${
                scrolled 
                  ? 'text-[#201E1F] hover:bg-[#FFF8F5]' 
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#F5E4E4] px-4 pt-4 pb-6 space-y-4 shadow-xl text-[#201E1F]">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold py-2 px-3 rounded-lg hover:bg-[#FFF8F5] text-[#201E1F] hover:text-[#983132] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#F5E4E4] flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full bg-[#983132] hover:bg-[#7f2728] text-white font-semibold py-3 rounded-full text-sm transition-colors text-center shadow-md flex items-center justify-center gap-2"
            >
              <span>{t('nav.bookSeat')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
