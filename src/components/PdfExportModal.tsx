import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  FileDown,
  Check,
  CreditCard,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { ComplianceConsentWrapper } from './ComplianceConsentModal';
import { authFetch } from '../lib/authFetch';
import { runPdfExportFlow } from '../lib/pdfExportFlow';
import { CAPITAL_AI_VERSION } from '../platform/Branding/runtimeBrand';

interface PdfExportModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

type PdfExportModalProps = PdfExportModalBaseProps & (
  | {
      onPrepare: () => Promise<() => void>;
      onSuccess?: never;
    }
  | {
      /**
       * Compatibility adapter for existing non-compliance exporters. New credit-sensitive
       * call sites must use onPrepare so generation can finish before the ledger mutation.
       */
      onSuccess: () => void | Promise<void>;
      onPrepare?: never;
    }
);

export function PdfExportModal({ isOpen, onClose, email, onPrepare, onSuccess }: PdfExportModalProps) {
  const [loading, setLoading] = useState(false);
  // Fail closed until the authenticated server ledger confirms a balance.
  const [credits, setCredits] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const prepareExport = onPrepare ?? (async () => async () => {
    await onSuccess!();
  });

  useEffect(() => {
    if (isOpen && email) {
      void fetchCredits();
    }
  }, [isOpen, email]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/stripe/pdf-credits');
      if (!res.ok) throw new Error('Fehler beim Laden der Credits');
      const data = await res.json();
      const unlimited = data?.unlimited === true;
      const nextCredits = Number(data?.credits);
      if (!unlimited && (!Number.isInteger(nextCredits) || nextCredits < 0)) {
        throw new Error('Ungültiger PDF-Credit-Stand vom Server.');
      }
      setCredits(unlimited ? 0 : nextCredits);
      setIsUnlimited(unlimited);
    } catch (err: any) {
      console.error(err);
      setCredits(0);
      setIsUnlimited(false);
      setError('Konnte PDF-Credits nicht vom Server abrufen. Export bleibt gesperrt.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumeAndExport = async () => {
    if (!isUnlimited && credits <= 0) {
      setError('Sie haben keine verifizierten Export-Credits. Bitte laden Sie den Credit-Stand neu oder erwerben Sie weitere Exporte.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const consumption = await runPdfExportFlow({
        unlimited: isUnlimited,
        prepareExport,
        consumeCredit: async () => {
          const res = await authFetch('/api/stripe/consume-pdf-credit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || 'Fehler beim Abziehen der Credits');
          }
          return data as { credits: number };
        },
      });

      if (consumption) {
        setCredits(consumption.credits);
        setSuccessMsg('Download erfolgreich gestartet. 1 Export-Credit wurde serverseitig abgezogen.');
      } else {
        setSuccessMsg('Download erfolgreich gestartet. Enterprise-Export bleibt unbegrenzt.');
      }

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
          email,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-background border border-border p-6 rounded-2xl max-w-md w-full relative z-10 overflow-hidden"
        style={{ boxShadow: '0 0 40px color-mix(in srgb, var(--color-brand-primary) 15%, transparent)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-primary via-brand-primary to-brand-accent" />

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
              <FileDown size={16} />
            </span>
            <h3 className="font-display font-extrabold text-text-primary text-base">PDF-Export freigeben</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface/60 hover:brightness-110 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="PDF-Export schließen"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Dieser Bericht wird mit dem CAPITAL-AI PDF-Export der Runtime-Version {CAPITAL_AI_VERSION} erzeugt. Credit-Stand und Abbuchung werden ausschließlich serverseitig verifiziert.
          </p>

          <div className="bg-surface/60 border border-border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-mono tracking-wider">Verifizierte PDF-Exporte</p>
              <p className="text-xl font-mono font-black text-text-primary mt-1">
                {isUnlimited ? (
                  <span className="text-brand-primary flex items-center gap-1.5 text-base">
                    <Sparkles size={16} /> Unbegrenzt
                  </span>
                ) : (
                  `${credits} ${credits === 1 ? 'Export' : 'Exporte'}`
                )}
              </p>
            </div>
            {isUnlimited && (
              <span className="px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest bg-brand-primary/15 text-brand-primary uppercase font-mono">
                Enterprise-Vorteil
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-score-worst/10 border border-score-worst/25 rounded-xl flex items-start gap-2 text-xs text-score-worst">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p className="leading-normal">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-score-best/10 border border-score-best/25 rounded-xl flex items-start gap-2 text-xs text-score-best">
              <CheckCircle size={14} className="mt-0.5 shrink-0 animate-pulse" />
              <p className="leading-normal">{successMsg}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            {isUnlimited || credits > 0 ? (
              <ComplianceConsentWrapper onConfirm={handleConsumeAndExport} reportName="CAPITAL-AI PDF-Export">
                <button
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-brand-primary hover:brightness-110 text-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  style={{ boxShadow: '0 0 15px color-mix(in srgb, var(--color-brand-primary) 25%, transparent)' }}
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Bericht jetzt exportieren</span>
                </button>
              </ComplianceConsentWrapper>
            ) : (
              <button
                disabled={loading}
                onClick={handleBuyCredits}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-text-primary text-background hover:brightness-95 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} />
                )}
                <span>3 PDF-Exporte freischalten</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all cursor-pointer text-center"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
