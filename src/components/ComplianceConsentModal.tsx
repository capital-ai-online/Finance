import React, { useEffect, useState } from 'react';
import { Check, FileText, Lock, ShieldAlert, X } from 'lucide-react';

interface ComplianceConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  reportName?: string;
}

/**
 * Security acknowledgement before exporting potentially sensitive reports.
 *
 * ADR-0085: this interaction is deliberately NOT called GDPR consent. The export
 * itself must already have a lawful basis and authorization context; this modal
 * only reminds an authenticated user about confidentiality and intended use.
 */
export function ComplianceConsentModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Vertraulichkeitshinweis',
  reportName = 'Datenbericht / Audit-Trail',
}: ComplianceConsentModalProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAcknowledged(false);
      setShowError(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!hasAcknowledged) {
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
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
        id="compliance-consent-backdrop"
      />

      <div
        className="bg-zinc-950 border border-white/10 p-6 rounded-2xl max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(176,38,255,0.15)] overflow-hidden"
        id="compliance-consent-modal"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-aif-neon-purple via-indigo-500 to-aif-neon-cyan" />

        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-aif-neon-purple/10 text-aif-neon-purple border border-aif-neon-purple/20">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h3 className="font-display font-black text-white text-sm tracking-wide uppercase">{title}</h3>
              <p className="text-[9px] text-aif-neon-cyan font-mono uppercase tracking-wider mt-0.5">
                Export-Sicherheitskontrolle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
            id="close-consent-modal-btn"
            aria-label="Hinweis schließen"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white/90">
              <FileText className="text-aif-neon-purple" size={14} />
              <span>Export:</span>
              <span className="text-aif-neon-cyan truncate max-w-[260px]" title={reportName}>{reportName}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Der Export kann interne oder personenbezogene Informationen enthalten. Prüfen Sie Empfänger,
              Zweck und Speicherort vor einer Weitergabe. Diese Bestätigung ist ein Sicherheitshinweis und
              keine Einwilligung als Rechtsgrundlage für die zugrunde liegende Datenverarbeitung.
            </p>
          </div>

          <div className="space-y-2.5 text-[11px] text-white/70">
            <div className="flex items-start gap-2.5"><span className="text-aif-neon-purple mt-0.5 font-bold">•</span><p>Export nur an berechtigte Empfänger weitergeben.</p></div>
            <div className="flex items-start gap-2.5"><span className="text-aif-neon-purple mt-0.5 font-bold">•</span><p>Nur für den vorgesehenen und zulässigen Zweck verwenden.</p></div>
            <div className="flex items-start gap-2.5"><span className="text-aif-neon-purple mt-0.5 font-bold">•</span><p>Nach Zweckfortfall sicher löschen oder entsprechend der geltenden Aufbewahrungsregel behandeln.</p></div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHasAcknowledged((current) => !current);
              if (!hasAcknowledged) setShowError(false);
            }}
            className={`w-full text-left border rounded-xl p-4 transition-all duration-300 cursor-pointer flex items-start gap-3 select-none ${
              hasAcknowledged
                ? 'bg-aif-neon-purple/5 border-aif-neon-purple text-white'
                : showError
                  ? 'bg-rose-500/5 border-rose-500 text-rose-300'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80'
            }`}
            id="compliance-consent-checkbox-container"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
              hasAcknowledged ? 'bg-aif-neon-purple border-aif-neon-purple text-white' : showError ? 'border-rose-500' : 'border-white/30'
            }`}>
              {hasAcknowledged && <Check size={12} strokeWidth={3} />}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-xs text-white">Sicherheitshinweis zur Kenntnis genommen</p>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Ich habe den Hinweis zu vertraulicher und zweckgebundener Behandlung dieses Exports gelesen.
              </p>
            </div>
          </button>

          {showError && (
            <p className="text-rose-400 text-[10px] font-mono font-bold text-center">
              Bitte bestätigen Sie den Sicherheitshinweis, um den Export fortzusetzen.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              id="cancel-consent-btn"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasAcknowledged}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                hasAcknowledged
                  ? 'bg-gradient-to-r from-aif-neon-purple to-indigo-600 text-white hover:brightness-110 cursor-pointer'
                  : 'bg-neutral-800 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
              id="confirm-consent-export-btn"
            >
              <Lock size={12} />
              <span>Export fortsetzen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComplianceConsentWrapperProps {
  onConfirm: () => void;
  title?: string;
  reportName?: string;
  children: React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
}

export function ComplianceConsentWrapper({
  onConfirm,
  title,
  reportName,
  children,
}: ComplianceConsentWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  // React 19's cloneElement overloads infer `unknown` for polymorphic children here even
  // though the public wrapper contract only injects onClick. Keep the compatibility cast
  // local to this adapter instead of weakening the component's external prop type.
  const childWithOnClick = React.cloneElement(
    children as React.ReactElement<any>,
    { onClick: handleClick },
  );

  return (
    <>
      {childWithOnClick}
      {isOpen && (
        <ComplianceConsentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={onConfirm}
          title={title}
          reportName={reportName}
        />
      )}
    </>
  );
}
