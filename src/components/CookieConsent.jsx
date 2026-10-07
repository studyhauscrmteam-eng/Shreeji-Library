import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'shreeji_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[140] bg-[#201E1F] text-white rounded-3xl border border-white/15 shadow-2xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#983132] flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-[#EB6A30]" />
            </div>
            <div className="text-xs leading-relaxed text-white/85">
              <p className="font-bold text-white text-sm mb-1">We value your privacy</p>
              <p>
                We use cookies to improve your browsing experience and analyse site
                traffic. Read our{' '}
                <a href="/privacy.html" className="underline text-[#EB6A30] hover:text-white">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => choose('essential')}
              className="flex-1 py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={() => choose('all')}
              className="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#EB6A30] hover:bg-[#d5571e] transition-colors"
            >
              Accept All
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
