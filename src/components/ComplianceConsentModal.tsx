import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Check, X, FileText, Lock } from 'lucide-react';

interface ComplianceConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  reportName?: string;
}

export function ComplianceConsentModal({
  isOpen,
  onClose,
  onConfirm,
  title = "DSGVO Compliance Einwilligung",
  reportName = "Datenbericht / Audit-Trail"
}: ComplianceConsentModalProps) {
  const [hasConsented, setHasConsented] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset states on mount/unmount
  useEffect(() => {
    if (isOpen) {
      setHasConsented(false);
      setShowError(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!hasConsented) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
        id="compliance-consent-backdrop"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-zinc-950 border border-white/10 p-6 rounded-2xl max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(176,38,255,0.15)] overflow-hidden"
        id="compliance-consent-modal"
      >
        {/* Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-aif-neon-purple via-indigo-500 to-aif-neon-cyan" />

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-aif-neon-purple/10 text-aif-neon-purple border border-aif-neon-purple/20">
              <ShieldAlert size={20} className="animate-pulse" />
            </span>
            <div>
              <h3 className="font-display font-black text-white text-sm tracking-wide uppercase">
                {title}
              </h3>
              <p className="text-[9px] text-aif-neon-cyan font-mono uppercase tracking-wider mt-0.5">
                Sicherheits-Audit-Vorschrift • Art. 32 DSGVO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
            id="close-consent-modal-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white/90">
              <FileText className="text-aif-neon-purple" size={14} />
              <span>Zweckgebundener Export:</span>
              <span className="text-aif-neon-cyan truncate max-w-[220px]" title={reportName}>{reportName}</span>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Sie fordern den Download von sensiblen, quantitativen Berichten oder internen Datensätzen an. Um die Vorschriften der **Datenschutz-Grundverordnung (DSGVO)** und die BaFin-Sicherheitsstandards einzuhalten, ist ein dokumentierter Nachweis über Ihre Pflicht zur Vertraulichkeit erforderlich.
            </p>

            <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span>Plattform-Version: Aktiv</span>
              <span>Integritäts-Status: Geprüft ✓</span>
            </div>
          </div>

          {/* Compliance Commitments Checklist */}
          <div className="space-y-2.5 text-[11px] text-white/70">
            <div className="flex items-start gap-2.5">
              <span className="text-aif-neon-purple mt-0.5 font-bold">•</span>
              <p>Keine unbefugte Weitergabe an Dritte oder unsichere Datenspeicher.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-aif-neon-purple mt-0.5 font-bold">•</span>
              <p>Strikte Zweckbindung im Rahmen Ihrer quantitativen Risiko-Analysen.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-aif-neon-purple mt-0.5 font-bold">•</span>
              <p>Verpflichtung zur DSGVO-konformen Behandlung aller exportierten Kennzahlen.</p>
            </div>
          </div>

          {/* The Consent Checkbox Section */}
          <div 
            onClick={() => {
              setHasConsented(!hasConsented);
              if (!hasConsented) setShowError(false);
            }}
            className={`border rounded-xl p-4 transition-all duration-300 cursor-pointer flex items-start gap-3 select-none ${
              hasConsented 
                ? 'bg-aif-neon-purple/5 border-aif-neon-purple text-white shadow-[0_0_15px_rgba(176,38,255,0.05)]' 
                : showError 
                  ? 'bg-rose-500/5 border-rose-500 text-rose-300' 
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80'
            }`}
            id="compliance-consent-checkbox-container"
          >
            {/* Custom Checkbox */}
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
              hasConsented 
                ? 'bg-aif-neon-purple border-aif-neon-purple text-white' 
                : showError 
                  ? 'border-rose-500' 
                  : 'border-white/30 hover:border-white/50'
            }`}>
              {hasConsented && <Check size={12} strokeWidth={3} />}
            </div>

            <div className="space-y-1">
              <p className="font-bold text-xs text-white">Compliance Einwilligung bestätigen</p>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Ich stimme der zweckgebundenen Datenverarbeitung gemäß DSGVO zu und erkläre mich bereit, die gesetzlichen Richtlinien zur Datensicherheit beim Umgang mit diesem Export uneingeschränkt einzuhalten.
              </p>
            </div>
          </div>

          {showError && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1.5 justify-center"
            >
              Bitte bestätigen Sie die Compliance-Einwilligung, um fortzufahren.
            </motion.p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-center"
              id="cancel-consent-btn"
            >
              Abbrechen
            </button>
            
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                hasConsented
                  ? 'bg-gradient-to-r from-aif-neon-purple to-indigo-600 text-white shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:brightness-110'
                  : 'bg-neutral-800 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
              id="confirm-consent-export-btn"
            >
              <Lock size={12} className={hasConsented ? "text-white" : "text-white/30"} />
              <span>Export freigeben</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ComplianceConsentWrapperProps {
  onConfirm: () => void;
  title?: string;
  reportName?: string;
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
}

export function ComplianceConsentWrapper({
  onConfirm,
  title,
  reportName,
  children
}: ComplianceConsentWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  // Clone child component to intercept the onClick trigger safely
  const childWithOnClick = React.cloneElement(children, {
    onClick: handleClick
  });

  return (
    <>
      {childWithOnClick}
      <AnimatePresence>
        {isOpen && (
          <ComplianceConsentModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onConfirm={onConfirm}
            title={title}
            reportName={reportName}
          />
        )}
      </AnimatePresence>
    </>
  );
}
