import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSiteContent } from '../firebase';

const SiteContentContext = createContext();

/**
 * Homepage content edited in the CRM admin (Website → Homepage Content):
 * hero stats, boys-only badge, discipline cards, FAQs, testimonials.
 * `content` is null until the first successful fetch — components render
 * their built-in defaults meanwhile, so offline/misconfigured builds
 * look exactly as before.
 */
export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const lastSignatureRef = React.useRef('');

  const refreshContent = useCallback(async (silent = false) => {
    try {
      const c = await fetchSiteContent();
      if (!c) return;
      const signature = JSON.stringify(c);
      if (signature !== lastSignatureRef.current) {
        lastSignatureRef.current = signature;
        setContent(c);
      }
    } catch {
      // Keep defaults on failure — never blank the homepage.
    }
  }, []);

  useEffect(() => {
    refreshContent(false);
    const timer = setInterval(() => refreshContent(true), 300000);
    return () => clearInterval(timer);
  }, [refreshContent]);

  return (
    <SiteContentContext.Provider value={{ content, refreshContent: () => refreshContent(false) }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => useContext(SiteContentContext);
