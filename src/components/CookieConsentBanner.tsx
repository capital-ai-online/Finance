import React, { useEffect, useState } from 'react';
import { Cookie, Check, X } from 'lucide-react';
import { getStoredConsent, setStoredConsent, onReopenCookieBanner } from '../services/cookieConsent';
import { loadGoogleAnalytics, unloadGoogleAnalytics } from '../services/googleAnalytics';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === 'accepted') {
      loadGoogleAnalytics();
    } else if (stored === 'declined') {
      unloadGoogleAnalytics();
    } else {
      setVisible(true);
    }

    return onReopenCookieBanner(() => setVisible(true));
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setStoredConsent('accepted');
    loadGoogleAnalytics();
    setVisible(false);
  };

  const handleDecline = () => {
    setStoredConsent('declined');
    unloadGoogleAnalytics();
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 flex justify-center pointer-events-none">
      <div className="w-full max-w-2xl bg-[#0d0e12]/95 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
        <Cookie className="text-aif-gold-DEFAULT shrink-0 hidden sm:block" size={28} />
        <div className="flex-1 space-y-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Cookie-Einwilligung</h3>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Wir nutzen Google Analytics (Google LLC, USA) ausschließlich mit Ihrer Einwilligung, um
            die Nutzung des Portals statistisch auszuwerten. Details dazu in unserer{' '}
            <a href="/datenschutz" className="text-aif-gold-DEFAULT hover:underline font-bold">
              Datenschutzerklärung
            </a>
            , wo Sie Ihre Entscheidung jederzeit widerrufen können.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X size={14} /> Ablehnen
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Check size={14} /> Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
