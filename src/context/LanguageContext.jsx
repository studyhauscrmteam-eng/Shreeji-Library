import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Navbar
    nav: {
      about: 'About',
      whyUs: 'Why Us',
      cubicle: 'Cubicle Setup',
      membership: 'Membership',
      facilities: 'Facilities',
      gallery: 'Gallery',
      faq: 'FAQ',
      contact: 'Contact',
      bookSeat: 'Final Seat',
      language: 'Language',
    },
    // Hero
    hero: {
      badge: 'Now accepting new student intake',
      titleStart: 'Bhavnagar\u2019s perfect study environment for ',
      titleHighlight: 'maximum focus.',
      subtitle: 'Escape distractions and study in a calm, air-conditioned, professionally managed reading space designed for serious students.',
      bookSeatBtn: 'Final Seat',
      exploreCubicleBtn: 'Explore Cubicle Setup',
      statStudents: 'STUDENTS',
      statHours: 'HOURS DAILY',
      statRating: 'GOOGLE RATING',
      scroll: 'SCROLL',
    },
    // About Philosophy
    about: {
      badge: '01 — OUR PHILOSOPHY',
      headingStart: 'Built for deep work, ',
      headingHighlight: 'not casual browsing.',
      p1: 'ShreeJi Reading Library is purpose-built for aspirants preparing for competitive exams like UPSC, GPSC, CA, NEET, JEE, GATE, and university degrees.',
      p2: 'Unlike crowded cafes or noisy home environments, our quiet reading hall provides an immersive focus zone where discipline is contagious and hours pass with peak productivity.',
      point1Title: 'Absolute Silence Discipline',
      point1Desc: 'Strict pin-drop silence policy enforced throughout all study hours.',
      point2Title: 'Uninterrupted Power & Cooling',
      point2Desc: 'Heavy-duty Mitsubishi ACs and 100% power backup support.',
      point3Title: 'Ergonomic Desk & Chair',
      point3Desc: 'Designed for 10-14 hours of continuous posture-friendly studying.',
      point4Title: 'Inspiring Aspirant Community',
      point4Desc: 'Surround yourself with dedicated, hard-working students aiming for excellence.',
      reservedBadge: 'RESERVED DESKS',
      fixedSeat: 'Fixed Seat Guarantee',
    },
    // Perfect Reading Space
    cubicle: {
      badge: 'THE PERFECT CUBICLE',
      headingStart: 'Anatomy of the ',
      headingHighlight: 'perfect reading space.',
      subtitle: 'Hover or tap any feature card to highlight its position on the real cubicle photo.',
      pinLight: 'Light',
      pinPower: 'Power',
      pinTable: 'Table',
      pinChair: 'Chair',
      f1Title: 'LED Task Light',
      f1Desc: 'Individual overhead warm light illumination designed for zero eye strain during long study sessions.',
      f2Title: 'Power Point & Socket',
      f2Desc: 'Individual 230V socket & switchboard at every desk for laptop, tablet & phone charging.',
      f3Title: 'Spacious Study Table',
      f3Desc: 'Wide wooden cubicle table with top shelf storage for all your textbooks, notebooks, and study material.',
      f4Title: 'Ergonomic Chair',
      f4Desc: 'Adjustable black lumbar support office chair engineered for 10-14 hours of continuous posture-friendly sitting.',
    },
    // Features / Why Us
    features: {
      badge: '02 — WHY SHREEJI LIBRARY',
      headingStart: 'Everything you need to ',
      headingHighlight: 'excel in exams.',
      subtitle: 'We take care of every comfort and technical detail so you can focus 100% on your studies.',
      f1Title: 'Personal Study Cubicles',
      f1Desc: 'Partitioned wooden desks with dedicated book racks, personal power sockets & reading lamps.',
      f2Title: 'High-Speed Optical Wi-Fi',
      f2Desc: 'Seamless high-speed internet across all corners for online lectures, test series, and PDFs.',
      f3Title: 'Mitsubishi Inverter ACs',
      f3Desc: 'Continuous climate-controlled cooling at 24°C with fresh air circulation and zero humidity.',
      f4Title: '24x7 CCTV & Security',
      f4Desc: 'Comprehensive surveillance ensuring the complete safety of your books, laptop, and belongings.',
      f5Title: 'RO Water & Beverage Pantry',
      f5Desc: 'Clean purified chilled RO drinking water with open tea/coffee break terrace area.',
      f6Title: 'Personal Secure Lockers',
      f6Desc: 'Dedicated secure lockers to keep your heavy reference books and study materials safe overnight.',
    },
    // Membership Pricing
    pricing: {
      badge: '03 — MEMBERSHIP PLANS',
      headingStart: 'Simple, transparent ',
      headingHighlight: 'monthly plans in Bhavnagar.',
      subtitle: 'Choose a study schedule that fits your routine. All plans include full amenities.',
      planFullDay: 'Full Day Plan',
      planFullDayDesc: 'Complete 17-hour access from early morning to night for dedicated preparation.',
      planHalfDayMorning: 'Morning Half Day',
      planHalfDayMorningDesc: 'Early bird access for productive morning study routines.',
      planHalfDayEvening: 'Evening Half Day',
      planHalfDayEveningDesc: 'After-college or work shift ideal for night aspirants.',
      popular: 'MOST POPULAR',
      perMonth: '/ month',
      hours: 'Hours:',
      amenitiesIncluded: 'All amenities included',
      selectPlan: 'Select this Plan',
      seatGuarantee: 'No hidden admission fees • Instant desk allocation • Free trial visit',
    },
    // Facilities Showcase
    facilities: {
      badge: '04 — WORLD CLASS AMENITIES',
      headingStart: 'Designed around ',
      headingHighlight: 'student comfort.',
      subtitle: 'Every corner of ShreeJi Reading Library is crafted to eliminate fatigue and maximize study endurance.',
      c1Title: 'Quiet Study Hall',
      c1Desc: 'A spacious, well-lit hall with wide wooden cubicles, non-glare LED illumination, and acoustic insulation.',
      c2Title: 'Terrace Refreshment Zone',
      c2Desc: 'Open-air green terrace area to take refreshing breaks, discuss with peers, and enjoy tea or snacks.',
      c3Title: 'Purified RO Water Station',
      c3Desc: 'Freshly filtered chilled and normal drinking water available round the clock.',
      c4Title: 'Individual Power Sockets',
      c4Desc: 'Every single desk has independent 230V plug points for laptops, tablets, and phones.',
    },
    // Gallery Section
    gallery: {
      badge: '05 — REAL GALLERY',
      headingStart: 'A look inside ',
      headingHighlight: 'our library.',
      subtitle: '100% authentic photos of ShreeJi Reading Library facilities and study environment.',
      viewMore: 'View All Photos (14 Photos)',
      viewLess: 'Show Curated Grid',
      startSlideshow: 'Start Slideshow',
      pauseSlideshow: 'Pause Slideshow',
      prevPhoto: 'Previous',
      nextPhoto: 'Next',
      close: 'Close',
      photoCount: 'Photo',
      of: 'of',
      bookSeatCTA: 'Ready to experience it in person? Book your seat today.',
    },
    // Aspirants Focus
    aspirants: {
      badge: 'WHO STUDIES HERE',
      headingStart: 'Built for aspirants of ',
      headingHighlight: 'every discipline.',
      upscTitle: 'Civil Services',
      upscDesc: 'UPSC CSE, GPSC Class 1-2, Police Sub-Inspector, Talati & State competitive exams.',
      caTitle: 'CA / CS / CMA',
      caDesc: 'Chartered Accountancy Foundation, Inter & Final aspirants needing 12+ hours daily focus.',
      neetTitle: 'NEET & JEE',
      neetDesc: 'Medical & Engineering entrance exam students practicing daily mock tests.',
      gateTitle: 'GATE & Tech Exams',
      gateDesc: 'Engineering graduates preparing for PSU exams and master degree entrance.',
    },
    // Day Timeline
    timeline: {
      badge: 'A TYPICAL DAY',
      headingStart: 'A rhythm you can ',
      headingHighlight: 'rely on.',
      subtitle: 'Consistency builds toppers. Here is how serious students make the most of every hour at ShreeJi Library.',
      t1Time: '06:00 AM – 09:00 AM',
      t1Title: 'Early Morning Fresh Start',
      t1Desc: 'Library doors open. Calm ambient lighting, fresh cool air, and peak mental clarity for memorization.',
      t2Time: '09:00 AM – 01:00 PM',
      t2Title: 'High-Focus Deep Work Block',
      t2Desc: 'Peak silent hours. Tackle your toughest concepts, problem sets, and revision papers.',
      t3Time: '01:00 PM – 02:00 PM',
      t3Title: 'Lunch & Fresh Air Terrace Break',
      t3Desc: 'Step out to the terrace refreshment lounge for lunch, tea, and mental relaxation.',
      t4Time: '02:00 PM – 06:00 PM',
      t4Title: 'Afternoon Mock Tests & Problem Solving',
      t4Desc: 'Mitsubishi AC keeps the temperature steady at 24°C to prevent afternoon lethargy.',
      t5Time: '06:00 PM – 11:00 PM',
      t5Title: 'Evening Revision & Daily Wrap-Up',
      t5Desc: 'Consolidate today’s learnings, write notes, and plan tomorrow’s syllabus goals before heading home.',
    },
    // Testimonials
    testimonials: {
      badge: '06 — SUCCESS STORIES',
      headingStart: 'Loved by hundreds of ',
      headingHighlight: 'successful students.',
      subtitle: 'Read genuine reviews from aspirants who achieved their dream career milestones studying at ShreeJi Library.',
    },
    // FAQ
    faq: {
      badge: '07 — FREQUENTLY ASKED QUESTIONS',
      headingStart: 'Got questions? ',
      headingHighlight: 'We have answers.',
      subtitle: 'Everything you need to know before joining ShreeJi Reading Library.',
      q1: 'What are the library operating hours?',
      a1: 'ShreeJi Reading Library is open every day from 06:00 AM to 11:00 PM (17 hours daily), including Sundays and public holidays.',
      q2: 'Will I get a fixed reserved desk?',
      a2: 'Yes! When you enroll in our Full Day or Monthly plans, you are assigned your own personal numbered cubicle with dedicated locker, shelf, and power socket.',
      q3: 'Can I take a free trial before enrolling?',
      a3: 'Absolutely. You are welcome to visit our library during operational hours and study for a trial session before selecting a membership plan.',
      q4: 'Is high-speed Wi-Fi included in the fee?',
      a4: 'Yes, unlimited high-speed optical fiber Wi-Fi is complimentary with all membership plans for lectures, test series, and PDFs.',
      q5: 'Are there separate facilities for meals and phone calls?',
      a5: 'Yes, we have an open terrace refreshment lounge specifically for having lunch, tea breaks, and attending urgent phone calls without disturbing the silent study hall.',
    },
    // Location & Contact
    contact: {
      badge: '08 — FIND US',
      headingStart: 'Convenient Bhavnagar location, ',
      headingHighlight: 'peaceful atmosphere.',
      subtitle: 'Centrally located with easy access via city bus, metro, and two-wheeler parking.',
      addressLabel: 'LIBRARY ADDRESS',
      addressVal: 'ShreeJi Reading Library, Near City Center, Main Road, Bhavnagar, Gujarat',
      phoneLabel: 'PHONE NUMBER',
      phoneVal: '+91 63533 21530',
      emailLabel: 'EMAIL ADDRESS',
      emailVal: 'parthbhai@shreejilibrary.com',
      timingLabel: 'TIMINGS',
      timingVal: 'Monday – Sunday: 24/7 Open (24 Hours · 365 Days)',
      callNow: 'Call Now',
      whatsappNow: 'WhatsApp Inquiry',
      emailNow: 'Email Us',
      getDirections: 'Get Google Maps Directions',
    },
    // Booking Form
    booking: {
      badge: 'ONLINE RESERVATION',
      headingStart: 'Reserve your ',
      headingHighlight: 'study seat today.',
      subtitle: 'Fill out the simple form below. Our library manager will confirm your seat allocation within 1 hour.',
      fullName: 'Full Name *',
      fullNamePlaceholder: 'Enter your full name',
      phone: 'Phone Number *',
      phonePlaceholder: 'e.g. 6353321530',
      exam: 'Target Exam / Course *',
      examPlaceholder: 'e.g. UPSC, GPSC, CA Inter, NEET, GATE',
      planSelect: 'Select Membership Plan *',
      shiftSelect: 'Preferred Study Shift *',
      slotFullDay: '24/7 Full Access (24 Hours Open)',
      slotMorning: 'Morning Shift (06:00 AM – 02:00 PM)',
      slotEvening: 'Evening Shift (02:00 PM – 11:00 PM)',
      startDate: 'Expected Joining Date *',
      submitBtn: 'Final Seat',
      submitting: 'Reserving Your Desk...',
      successTitle: 'Seat Reserved Successfully!',
      successDesc: 'Thank you! We have received your booking request. Our team will contact you via WhatsApp / Phone shortly.',
      bookAnother: 'Book Another Seat',
    },
    // Footer
    footer: {
      tagline: 'A premier air-conditioned reading library engineered for serious students and competitive exam aspirants.',
      quickLinks: 'Quick Links',
      contactInfo: 'Contact Information',
      copyright: '© 2026 ShreeJi Reading Library. All rights reserved. Designed for student excellence.',
    },
    // Preloader
    preloader: {
      title: 'SHREEJI READING LIBRARY',
      subtitle: 'Opening your sanctuary for maximum focus',
    },
  },
  gu: {
    // Navbar
    nav: {
      about: 'અમારા વિશે',
      whyUs: 'વિશેષતાઓ',
      cubicle: 'ક્યુબિકલ સેટઅપ',
      membership: 'મેમ્બરશિપ',
      facilities: 'સુવિધાઓ',
      gallery: 'ગેલેરી',
      faq: 'પ્રશ્નોત્તરી (FAQ)',
      contact: 'સંપર્ક',
      bookSeat: 'સીટ બુક કરો',
      language: 'ભાષા',
    },
    // Hero
    hero: {
      badge: 'નવા વિદ્યાર્થીઓ માટે એડમિશન શરૂ છે',
      titleStart: 'ભાવનગરમાં સંપૂર્ણ એકાગ્રતા માટે તમારું ',
      titleHighlight: 'આદર્શ અભ્યાસ કેન્દ્ર.',
      subtitle: 'ઘરની ખલેલ અને અવાજથી દૂર, શાંત, સંપૂર્ણ એર-કંડિશન્ડ અને ગંભીર વિદ્યાર્થીઓ માટે ખાસ ડિઝાઇન કરાયેલ રીડિંગ લાઇબ્રેરી.',
      bookSeatBtn: 'સીટ બુક કરો',
      exploreCubicleBtn: 'ક્યુબિકલ સેટઅપ જુઓ',
      statStudents: 'વિદ્યાર્થીઓ',
      statHours: 'કલાક દરરોજ',
      statRating: 'ગૂગલ રેટિંગ',
      scroll: 'સ્ક્રોલ કરો',
    },
    // About Philosophy
    about: {
      badge: '01 — અમારી વિચારધારા',
      headingStart: 'ગહન અભ્યાસ માટે નિર્મિત, ',
      headingHighlight: 'માત્ર બેસવા માટે નહીં.',
      p1: 'શ્રીજી રીડિંગ લાઇબ્રેરી ખાસ કરીને UPSC, GPSC, CA, NEET, JEE, GATE અને યુનિવર્સિટી પરીક્ષાઓની તૈયારી કરતા વિદ્યાર્થીઓ માટે બનાવવામાં આવી છે.',
      p2: 'ભીડભાડવાળી જગ્યાઓ કે ઘરના ઘોંઘાટથી વિપરીત, અમારો શાંત રીડિંગ હોલ તમને એવું વાતાવરણ આપે છે જ્યાં દરેક વિદ્યાર્થી મહેનત કરે છે અને તમારો સમય સંપૂર્ણપણે સાર્થક બને છે.',
      point1Title: 'સંપૂર્ણ પિન-ડ્રોપ શાંતિ',
      point1Desc: 'અભ્યાસના તમામ કલાકો દરમિયાન સંપૂર્ણ શાંતિના નિયમનું ચુસ્ત પાલન.',
      point2Title: 'અવિરત પાવર અને કૂલિંગ',
      point2Desc: 'મિત્સુબિશી હેવી-ડ્યુટી AC અને ૧૦૦% પાવર બેકઅપ સપોર્ટ.',
      point3Title: 'આરામદાયક ડેસ્ક અને ખુરશી',
      point3Desc: 'દરરોજ ૧૦ થી ૧૪ કલાક સળંગ આરામદાયક બેસવા માટે અર્ગોનોમિક ડિઝાઇન.',
      point4Title: 'પ્રેરણાદાયી વિદ્યાર્થી સમુદાય',
      point4Desc: 'સફળતા મેળવવા માટે રાત-દિવસ મહેનત કરતા તેજસ્વી વિદ્યાર્થીઓની વચ્ચે રહો.',
      reservedBadge: 'રિઝર્વ્ડ ડેસ્ક',
      fixedSeat: 'ફિક્સ સીટ ગેરંટી',
    },
    // Perfect Reading Space
    cubicle: {
      badge: 'ધ પરફેક્ટ ક્યુબિકલ',
      headingStart: 'સંપૂર્ણ અભ્યાસ ડેસ્કની ',
      headingHighlight: 'ખાસ વિશેષતાઓ.',
      subtitle: 'ડેસ્કની સાચી સ્થિતિ જોવા માટે કોઈપણ ફીચર કાર્ડ પર ક્લિક અથવા હોવર કરો.',
      pinLight: 'લાઇટ',
      pinPower: 'પાવર',
      pinTable: 'ટેબલ',
      pinChair: 'ખુરશી',
      f1Title: 'LED ટાસ્ક લાઇટ',
      f1Desc: 'આંખોને થાક ન લાગે તેવી ગરમ રોશની આપતી પ્રત્યેક ડેસ્ક માટે સ્વતંત્ર LED લાઇટ.',
      f2Title: 'પર્સનલ પાવર પોઇન્ટ',
      f2Desc: 'લેપટોપ, ટેબ્લેટ અને મોબાઇલ ચાર્જિંગ માટે દરેક ડેસ્ક પર સ્વતંત્ર 230V સ્વિચબોર્ડ.',
      f3Title: 'વિશાળ સ્ટડી ટેબલ',
      f3Desc: 'પુસ્તકો, નોટ્સ અને સ્ટેશનરી રાખવા માટે ઉપરના શેલ્ફ સાથેનું મોટું લાકડાનું ટેબલ.',
      f4Title: 'અર્ગોનોમિક મેશ ચેર',
      f4Desc: 'કમરના ટેકા સાથે ૧૦-૧૪ કલાક આરામથી બેસી શકાય તેવી એડજસ્ટેબલ ઓફિસ ચેર.',
    },
    // Features / Why Us
    features: {
      badge: '02 — શા માટે શ્રીજી લાઇબ્રેરી?',
      headingStart: 'પરીક્ષામાં શ્રેષ્ઠ પરિણામ માટે ',
      headingHighlight: 'જરૂરી તમામ સુવિધાઓ.',
      subtitle: 'અમે તમામ સુવિધાઓ અને ટેકનિકલ વ્યવસ્થાનું ધ્યાન રાખીએ છીએ જેથી તમે માત્ર અભ્યાસ પર ધ્યાન કેન્દ્રિત કરી શકો.',
      f1Title: 'વ્યક્તિગત સ્ટડી ક્યુબિકલ્સ',
      f1Desc: 'પાર્ટિશનવાળા લાકડાના ડેસ્ક, પુસ્તક રેક, પર્સનલ પાવર સોકેટ અને રીડિંગ લેમ્પ.',
      f2Title: 'હાઇ-સ્પીડ ઓપ્ટિકલ વાઇ-ફાઇ',
      f2Desc: 'ઓનલાઇન લેક્ચર્સ, ટેસ્ટ સીરીઝ અને PDF માટે સુપરફાસ્ટ ઇન્ટરનેટ કનેક્ટિવિટી.',
      f3Title: 'મિત્સુબિશી ઇન્વર્ટર AC',
      f3Desc: '૨૪°C પર તાજી હવાનું પરિભ્રમણ અને ભેજ રહિત ઠંડક આપતું આધુનિક એસી વાતાવરણ.',
      f4Title: '૨૪x૭ CCTV અને સુરક્ષા',
      f4Desc: 'તમારા પુસ્તકો, લેપટોપ અને સામાનની સલામતી માટે ૨૪ કલાક કેમેરા સર્વેલન્સ.',
      f5Title: 'RO શુદ્ધ પીવાનું પાણી અને પેન્ટ્રી',
      f5Desc: 'શુદ્ધ ઠંડુ ફિલ્ટર કરેલ RO પાણી અને ખુલ્લી ટેરેસ પર ચા/કોફી બ્રેક એરિયા.',
      f6Title: 'પર્સનલ લોકર્સની સુવિધા',
      f6Desc: 'તમારા ભારે સંદર્ભ પુસ્તકો અને સાહિત્ય રાત્રે સુરક્ષિત રાખવા માટે વ્યક્તિગત લોકર્સ.',
    },
    // Membership Pricing
    pricing: {
      badge: '03 — મેમ્બરશિપ પ્લાન્સ',
      headingStart: 'સરળ અને પારદર્શક ',
      headingHighlight: 'માસિક પ્લાન્સ.',
      subtitle: 'તમારા સમયપત્રક મુજબ અનુકૂળ પ્લાન પસંદ કરો. તમામ પ્લાનમાં તમામ સુવિધાઓ સામેલ છે.',
      planFullDay: 'ફુલ ડે પ્લાન',
      planFullDayDesc: 'સવારથી રાત સુધી ૧૭ કલાક સંપૂર્ણ એકાગ્રતા સાથે અભ્યાસ માટે શ્રેષ્ઠ.',
      planHalfDayMorning: 'મોર્નિંગ હાફ ડે',
      planHalfDayMorningDesc: 'વહેલી સવારે શાંતિથી અભ્યાસ કરવા માંગતા વિદ્યાર્થીઓ માટે.',
      planHalfDayEvening: 'ઇવનિંગ હાફ ડે',
      planHalfDayEveningDesc: 'કોલેજ કે જોબ પછી સાંજથી રાત સુધી અભ્યાસ કરવા માટે.',
      popular: 'સૌથી વધુ પસંદગી',
      perMonth: '/ મહિને',
      hours: 'સમય:',
      amenitiesIncluded: 'તમામ સુવિધાઓ સામેલ છે',
      selectPlan: 'આ પ્લાન પસંદ કરો',
      seatGuarantee: 'કોઈ છુપો એડમિશન ચાર્જ નથી • તાત્કાલિક ડેસ્ક ફાળવણી • ફ્રી ડેમો વિઝિટ',
    },
    // Facilities Showcase
    facilities: {
      badge: '04 — ઉચ્ચ ગુણવત્તાવાળી સુવિધાઓ',
      headingStart: 'વિદ્યાર્થીઓની સુવિધા મુજબ ',
      headingHighlight: 'તૈયાર કરાયેલ સ્પેસ.',
      subtitle: 'શ્રીજી લાઇબ્રેરીનો દરેક ખૂણો થાક દૂર કરવા અને અભ્યાસની ક્ષમતા વધારવા માટે ડિઝાઇન કરેલ છે.',
      c1Title: 'સાયલન્ટ સ્ટડી હોલ',
      c1Desc: 'મોટા લાકડાના ક્યુબિકલ્સ, આંખોને આરામદાયક LED લાઇટિંગ અને સાઉન્ડપ્રૂફિંગ સાથેનો વિશાળ હોલ.',
      c2Title: 'ટેરેસ રિફ્રેશમેન્ટ ઝોન',
      c2Desc: 'તાજી હવા ખાવા, મિત્રો સાથે ચર્ચા કરવા અને ચા-નાસ્તો કરવા માટે સુંદર ઓપન ટેરેસ.',
      c3Title: 'શુદ્ધ RO વોટર સ્ટેશન',
      c3Desc: 'પીવા માટે ચોવીસેય કલાક શુદ્ધ, ફિલ્ટર કરેલ ઠંડુ અને નોર્મલ RO પાણી ઉપલબ્ધ.',
      c4Title: 'વ્યક્તિગત પાવર સોકેટ્સ',
      c4Desc: 'દરેક ડેસ્ક પર લેપટોપ, ટેબ્લેટ અને મોબાઇલ ચાર્જ કરવા માટે સ્વતંત્ર પ્લગ પોઇન્ટ.',
    },
    // Gallery Section
    gallery: {
      badge: '05 — અસલ ફોટો ગેલેરી',
      headingStart: 'અમારી લાઇબ્રેરીની ',
      headingHighlight: 'વાસ્તવિક ઝાંખી.',
      subtitle: 'શ્રીજી રીડિંગ લાઇબ્રેરીના વાતાવરણ અને સુવિધાઓના ૧૦૦% અસલ ફોટા.',
      viewMore: 'તમામ ફોટા જુઓ (૧૪ ફોટા)',
      viewLess: 'ઓછા ફોટા જુઓ',
      startSlideshow: 'સ્લાઇડશો શરૂ કરો',
      pauseSlideshow: 'સ્લાઇડશો રોકો',
      prevPhoto: 'પાછળ',
      nextPhoto: 'આગળ',
      close: 'બંધ કરો',
      photoCount: 'ફોટો',
      of: '/',
      bookSeatCTA: 'શું તમે રૂબરૂ અનુભવ કરવા માંગો છો? આજે જ તમારી સીટ બુક કરો.',
    },
    // Aspirants Focus
    aspirants: {
      badge: 'અહીં કોણ અભ્યાસ કરે છે?',
      headingStart: 'દરેક ક્ષેત્રના ગંભીર ',
      headingHighlight: 'વિદ્યાર્થીઓ માટે.',
      upscTitle: 'સિવિલ સર્વિસીસ',
      upscDesc: 'UPSC CSE, GPSC વર્ગ ૧-૨, પોલીસ સબ-ઇન્સ્પેક્ટર, તલાટી અને સ્પર્ધાત્મક પરીક્ષાઓ.',
      caTitle: 'CA / CS / CMA',
      caDesc: 'દરરોજ ૧૨+ કલાક એકાગ્રતા સાથે તૈયારી કરતા ચાર્ટર્ડ એકાઉન્ટન્સીના વિદ્યાર્થીઓ.',
      neetTitle: 'NEET અને JEE',
      neetDesc: 'મેડિકલ અને એન્જિનિયરિંગ પ્રવેશ પરીક્ષાઓ માટે રોજેરોજ મોક ટેસ્ટ આપતા વિદ્યાર્થીઓ.',
      gateTitle: 'GATE અને ટેકનિકલ પરીક્ષાઓ',
      gateDesc: 'PSU અને માસ્ટર ડિગ્રી પ્રવેશ માટે તૈયારી કરતા એન્જિનિયરિંગ સ્નાતકો.',
    },
    // Day Timeline
    timeline: {
      badge: 'એક આદર્શ દિવસ',
      headingStart: 'એક વિશ્વસનીય ',
      headingHighlight: 'અભ્યાસ દિનચર્યા.',
      subtitle: 'નિયમિતતા જ ટોપર્સ બનાવે છે. જાણો શ્રીજી લાઇબ્રેરીમાં વિદ્યાર્થીઓ કેવી રીતે સમયનો શ્રેષ્ઠ ઉપયોગ કરે છે.',
      t1Time: 'સવારે ૦૬:૦૦ – ૦૯:૦૦',
      t1Title: 'વહેલી સવારે તાજગીસભર શરૂઆત',
      t1Desc: 'લાઇબ્રેરીના દરવાજા ખૂલે છે. શાંત વાતાવરણ, તાજી હવા અને યાદશક્તિ માટે સર્વશ્રેષ્ઠ સમય.',
      t2Time: 'સવારે ૦૯:૦૦ – બપોરે ૦૧:૦૦',
      t2Title: 'હાઇ-ફોકસ ડીપ વર્ક બ્લોક',
      t2Desc: 'સંપૂર્ણ શાંતિના કલાકો. અઘરા વિષયો, દાખલાઓ અને રિવિઝન પેપર્સ પૂર્ણ કરવાનો સમય.',
      t3Time: 'બપોરે ૦૧:૦૦ – ૦૨:૦૦',
      t3Title: 'લંચ અને ટેરેસ રિફ્રેશમેન્ટ બ્રેક',
      t3Desc: 'ઓપન ટેરેસ પર લંચ, ચા અને માનસિક આરામ માટે થોડો સમય બહાર આવો.',
      t4Time: 'બપોરે ૦૨:૦૦ – સાંજે ૦૬:૦૦',
      t4Title: 'બપોરની મોક ટેસ્ટ અને પ્રશ્ન સોલ્વિંગ',
      t4Desc: 'મિત્સુબિશી એસી ૨૪°C તાપમાન જાળવી રાખે છે જેથી બપોરે આળસ કે થાક ન લાગે.',
      t5Time: 'સાંજે ૦૬:૦૦ – રાત્રે ૧૧:૦૦',
      t5Title: 'સાંજનું રિવિઝન અને દૈનિક સમાપન',
      t5Desc: 'આજના દિવસનું રિવિઝન કરો, નોટ્સ બનાવો અને આવતીકાલના લક્ષ્યાંકો નક્કી કરી ઘરે જાઓ.',
    },
    // Testimonials
    testimonials: {
      badge: '06 — સફળતાની વાતો',
      headingStart: 'સેંકડો સફળ વિદ્યાર્થીઓનો ',
      headingHighlight: 'વિશ્વાસ.',
      subtitle: 'શ્રીજી લાઇબ્રેરીમાં અભ્યાસ કરીને પોતાની કારકિર્દીનું લક્ષ્ય હાંસલ કરનાર વિદ્યાર્થીઓના અભિપ્રાયો વાંચો.',
    },
    // FAQ
    faq: {
      badge: '07 — વારંવાર પૂછાતા પ્રશ્નો',
      headingStart: 'તમારા પ્રશ્નો, ',
      headingHighlight: 'અમારા જવાબો.',
      subtitle: 'શ્રીજી રીડિંગ લાઇબ્રેરીમાં જોડાતા પહેલા જાણવા જેવી તમામ બાબતો.',
      q1: 'લાઇબ્રેરીનો સમય શું છે?',
      a1: 'શ્રીજી રીડિંગ લાઇબ્રેરી રવિવાર અને જાહેર રજાઓ સહિત દરરોજ સવારે ૦૬:૦૦ થી રાત્રે ૧૧:૦૦ (રોજના ૧૭ કલાક) ખુલ્લી રહે છે.',
      q2: 'શું મને ફિક્સ રિઝર્વ્ડ ડેસ્ક મળશે?',
      a2: 'હા! જ્યારે તમે ફુલ ડે અથવા મંથલી પ્લાન લો છો ત્યારે તમને પર્સનલ નંબરવાળું ક્યુબિકલ, લોકર અને પાવર સોકેટ ફાળવવામાં આવે છે.',
      q3: 'શું એડમિશન પહેલાં ફ્રી ટ્રાયલ મળી શકે?',
      a3: 'ચોક્કસ! તમે લાઇબ્રેરીના સમય દરમિયાન આવીને વાતાવરણ જોઈ શકો છો અને ટ્રાયલ સેશન લઈ શકો છો.',
      q4: 'શું ફીમાં હાઇ-સ્પીડ વાઇ-ફાઇ સામેલ છે?',
      a4: 'હા, ઓનલાઇન ક્લાસ અને લેક્ચર્સ માટે તમામ પ્લાન સાથે અનલિમિટેડ હાઇ-સ્પીડ ઓપ્ટિકલ ફાઇબર વાઇ-ફાઇ મફત મળે છે.',
      q5: 'શું જમવા અને ફોન પર વાત કરવા માટે અલગ જગ્યા છે?',
      a5: 'હા, સાયલન્ટ રીડિંગ હોલને ખલેલ પહોંચાડ્યા વિના જમવા, ચા પીવા અને જરૂરી ફોન કોલ્સ માટે અમારી પાસે ઓપન ટેરેસ લાઉન્જ છે.',
    },
    // Location & Contact
    contact: {
      badge: '08 — અમારું સરનામું',
      headingStart: 'અનુકૂળ લોકેશન, ',
      headingHighlight: 'શાંત વાતાવરણ.',
      subtitle: 'સિટી બસ, મેટ્રો અને ટૂ-વ્હીલર પાર્કિંગની સુવિધા સાથે કેન્દ્રિય સ્થળ પર આવેલ.',
      addressLabel: 'લાઇબ્રેરીનું સરનામું',
      addressVal: 'શ્રીજી રીડિંગ લાઇબ્રેરી, સિટી સેન્ટર નજીક, મેઇન રોડ, ભાવનગર, ગુજરાત',
      phoneLabel: 'ફોન નંબર',
      phoneVal: '+91 63533 21530',
      emailLabel: 'ઇમેઇલ',
      emailVal: 'parthbhai@shreejilibrary.com',
      timingLabel: 'સમય',
      timingVal: 'સોમવાર – રવિવાર: ૨૪/૭ ખુલ્લું (રોજના ૨૪ કલાક · ૩૬૫ દિવસ)',
      callNow: 'કોલ કરો',
      whatsappNow: 'વોટ્સએપ પૂછપરછ',
      emailNow: 'ઇમેઇલ કરો',
      getDirections: 'ગૂગલ મેપ્સ પર રસ્તો જુઓ',
    },
    // Booking Form
    booking: {
      badge: 'ઓનલાઇન સીટ બુકિંગ',
      headingStart: 'આજે જ તમારી ',
      headingHighlight: 'સ્ટડી સીટ બુક કરો.',
      subtitle: 'નીચેનું સરળ ફોર્મ ભરો. અમારા લાઇબ્રેરી મેનેજર ૧ કલાકમાં તમને સીટ ફાળવણીની પુષ્ટિ કરશે.',
      fullName: 'પૂરું નામ *',
      fullNamePlaceholder: 'તમારું પૂરું નામ લખો',
      phone: 'મોબાઇલ નંબર *',
      phonePlaceholder: 'દા.ત. 6353321530',
      exam: 'પરીક્ષા / કોર્સનું નામ *',
      examPlaceholder: 'દા.ત. UPSC, GPSC, CA Inter, NEET, GATE',
      planSelect: 'મેમ્બરશિપ પ્લાન પસંદ કરો *',
      shiftSelect: 'પસંદગીનો સમય / શિફ્ટ *',
      slotFullDay: '૨૪/૭ ફુલ એક્સેસ (૨૪ કલાક ખુલ્લું)',
      slotMorning: 'મોર્નિંગ શિફ્ટ (સવારે ૦૬:૦૦ – બપોરે ૦૨:૦૦)',
      slotEvening: 'ઇવનિંગ શિફ્ટ (બપોરે ૦૨:૦૦ – રાત્રે ૧૧:૦૦)',
      startDate: 'જોડાવાની અપેક્ષિત તારીખ *',
      submitBtn: 'ફાઇનલ સીટ (Final Seat)',
      submitting: 'સીટ રિઝર્વ થઈ રહી છે...',
      successTitle: 'સીટ સફળતાપૂર્વક રિઝર્વ થઈ ગઈ!',
      successDesc: 'આભાર! તમારી બુકિંગ વિનંતી મળી ગઈ છે. અમારી ટીમ ટૂંક સમયમાં તમારો વોટ્સએપ/ફોન પર સંપર્ક કરશે.',
      bookAnother: 'બીજી સીટ બુક કરો',
    },
    // Footer
    footer: {
      tagline: 'ગંભીર વિદ્યાર્થીઓ અને સ્પર્ધાત્મક પરીક્ષાઓની તૈયારી માટે સંપૂર્ણ એર-કંડિશન્ડ પ્રીમિયમ રીડિંગ લાઇબ્રેરી.',
      quickLinks: 'ઝડપી લિંક્સ',
      contactInfo: 'સંપર્ક માહિતી',
      copyright: '© 2026 શ્રીજી રીડિંગ લાઇબ્રેરી. સર્વાધિકાર સુરક્ષિત. વિદ્યાર્થીઓની સફળતા માટે સમર્પિત.',
    },
    // Preloader
    preloader: {
      title: 'શ્રીજી રીડિંગ લાઇબ્રેરી',
      subtitle: 'તમારા અભ્યાસ માટેનું શાંત વાતાવરણ ખુલી રહ્યું છે',
    },
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('shreeji_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('shreeji_lang', lang);
    } catch (e) {
      console.error(e);
    }
    try {
      document.documentElement.lang = lang === 'gu' ? 'gu' : 'en';
    } catch {}
  };

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[language] || translations.en;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
