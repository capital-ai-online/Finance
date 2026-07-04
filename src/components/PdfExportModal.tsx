import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileDown, 
  Check, 
  CreditCard, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void; // Callback to actually trigger the PDF download!
}

export function PdfExportModal({ isOpen, onClose, email, onSuccess }: PdfExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number>(3);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && email) {
      fetchCredits();
      checkStripeConfig();
    }
  }, [isOpen, email]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/stripe/pdf-credits?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Fehler beim Laden der Credits');
      const data = await res.json();
      setCredits(data.credits);
      setIsUnlimited(!!data.unlimited);
    } catch (err: any) {
      console.error(err);
      setError('Konnte PDF-Credits nicht vom Server abrufen.');
    } finally {
      setLoading(false);
    }
  };

  const checkStripeConfig = async () => {
    try {
      const res = await fetch('/api/stripe/config-status');
      if (res.ok) {
        const data = await res.json();
        if (!data.publishableKeyConfigured || data.publishableKey?.startsWith('pk_test_...')) {
          setDemoMode(true);
        }
      }
    } catch (e) {
      setDemoMode(true);
    }
  };

  const handleConsumeAndExport = async () => {
    if (isUnlimited) {
      onSuccess();
      onClose();
      return;
    }

    if (credits <= 0) {
      setError('Sie haben keine Credits mehr. Bitte laden Sie neue Credits auf.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stripe/consume-pdf-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Abziehen der Credits');
      }

      const data = await res.json();
      setCredits(data.credits);
      
      // Trigger actual PDF download!
      onSuccess();
      
      setSuccessMsg('Download erfolgreich gestartet! 1 Export-Credit abgezogen.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Verbindungsfehler beim Verarbeiten.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'EXPORT_PDF',
          email: email,
          successUrl: window.location.href,
          cancelUrl: window.location.href
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Sitzung.');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Keine Checkout-URL vom Server erhalten.');
      }
    } catch (err: any) {
      setError(err.message || 'Konnte Bezahlvorgang nicht starten.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stripe/add-pdf-credits-simulated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: 3 })
      });

      if (!res.ok) throw new Error('Fehler bei der Kaufsimulation');
      const data = await res.json();
      setCredits(data.credits);
      setSuccessMsg('Demo-Modus: 3 PDF Export-Credits erfolgreich hinzugefügt!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError('Konnte Demo-Kauf nicht simulieren.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-zinc-950 border border-white/10 p-6 rounded-2xl max-w-md w-full relative z-10 shadow-[0_0_40px_rgba(245,196,83,0.15)] overflow-hidden"
      >
        {/* Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT">
              <FileDown size={16} />
            </span>
            <h3 className="font-display font-extrabold text-white text-base">BaFin PDF-Export freigeben</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-xs text-white/60 leading-relaxed">
            Dieser Bericht ist Teil der exklusiven quantitativen Auswertungen von AIFinancial (Version 0.5.4).
          </p>

          {/* Credits Display */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Ihre verbleibenden PDF-Exporte</p>
              <p className="text-xl font-mono font-black text-white mt-1">
                {isUnlimited ? (
                  <span className="text-aif-gold-DEFAULT flex items-center gap-1.5 text-base">
                    <Sparkles size={16} /> Unbegrenzt
                  </span>
                ) : (
                  `${credits} ${credits === 1 ? 'Export' : 'Exporte'}`
                )}
              </p>
            </div>
            {isUnlimited && (
              <span className="px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT uppercase font-mono">
                Enterprise-Vorteil
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2 text-xs text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p className="leading-normal">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-start gap-2 text-xs text-emerald-400">
              <CheckCircle size={14} className="mt-0.5 shrink-0 animate-pulse" />
              <p className="leading-normal">{successMsg}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {isUnlimited || credits > 0 ? (
              <button
                disabled={loading}
                onClick={handleConsumeAndExport}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-aif-gold-DEFAULT hover:bg-amber-500 text-black shadow-[0_0_15px_rgba(245,196,83,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                <span>Bericht jetzt exportieren</span>
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleBuyCredits}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} />
                )}
                <span>3 PDF-Exporte freischalten (3 €)</span>
              </button>
            )}

            {/* Simulation Purchase Button for Sandbox Testing */}
            {demoMode && !isUnlimited && (
              <div className="border-t border-white/5 pt-3 mt-1.5 text-center">
                <span className="text-[10px] text-white/30 block mb-1.5">AISTUDIO PREVIEW / DEMO STAGE</span>
                <button
                  type="button"
                  onClick={handleSimulatePurchase}
                  className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-aif-gold-DEFAULT/30 hover:border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/5 text-aif-gold-DEFAULT flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap size={10} />
                  <span>Kauf simulieren (+3 Credits gratis)</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-center"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
