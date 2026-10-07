import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { PlansProvider } from './context/PlansContext';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutPhilosophy from './components/AboutPhilosophy';
import PerfectReadingSpace from './components/PerfectReadingSpace';
import Features from './components/Features';
import MembershipPricing from './components/MembershipPricing';
import Facilities from './components/Facilities';
import GallerySection from './components/GallerySection';
import AspirantsFocus from './components/AspirantsFocus';
import DayTimeline from './components/DayTimeline';
import Testimonials from './components/Testimonials';
import FAQSection from './components/FAQSection';
import LocationContact from './components/LocationContact';
import BookingForm from './components/BookingForm';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';

function MainApp() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const scrollToBooking = () => {
    const el = document.getElementById('booking') || document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    scrollToBooking();
  };

  return (
    <div className="min-h-screen bg-white text-[#201E1F] selection:bg-[#EB6A30] selection:text-white relative overflow-x-hidden max-w-full w-full">

      {/* Skip to main content (keyboard / screen-reader only, visible on focus) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-white focus:text-[#983132] focus:px-4 focus:py-2 focus:rounded-full focus:font-bold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Preloader Animation */}
      <Preloader />

      {/* Navigation Header */}
      <Navbar 
        onOpenBooking={scrollToBooking} 
      />

      <main id="main-content">
      {/* Hero Section */}
      <Hero onOpenBooking={scrollToBooking} />

      {/* About / Philosophy Section */}
      <AboutPhilosophy />

      {/* Anatomy of Perfect Reading Space (Interactive Callout Cubicle Photo) */}
      <PerfectReadingSpace />

      {/* Why Us / Key Features Grid */}
      <Features />

      {/* Membership Pricing Section */}
      <MembershipPricing 
        onSelectPlan={handleSelectPlan} 
      />

      {/* Facilities Showcase Section */}
      <Facilities />

      {/* Photo Gallery Section with View More and Slideshow */}
      <GallerySection onOpenBooking={scrollToBooking} />

      {/* Target Aspirants Section */}
      <AspirantsFocus />

      {/* Daily Routine & Timeline */}
      <DayTimeline />

      {/* Member Testimonials */}
      <Testimonials />

      {/* FAQ Accordion */}
      <FAQSection />

      {/* Location & Contact Information */}
      <LocationContact />

      {/* Seat Booking Form */}
      <BookingForm 
        selectedPlan={selectedPlan} 
      />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Go To Top Button */}
      <ScrollToTop />

      {/* Cookie Consent Banner */}
      <CookieConsent />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <PlansProvider>
        <MainApp />
      </PlansProvider>
    </LanguageProvider>
  );
}
