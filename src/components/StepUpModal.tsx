import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { verifyStepUp, StepUpError } from '../lib/stepUp';

interface StepUpModalProps {
  purpose: string;
  actionLabel: string;
  onSuccess: (stepUpToken: string) => void;
  onCancel: () => void;
}

/**
 * ADR-0003.5 / Audit ARCH-AUDIT-0002 (D9): wiederverwendbarer Step-Up-Dialog fuer kritische
 * Owner-Aktionen. Fragt einen 6-stelligen TOTP-Code ab, verifiziert ihn serverseitig
 * (src/lib/stepUp.ts) und liefert bei Erfolg das kurzlebige Step-Up-Token an den Aufrufer
 * zurueck, der damit die eigentliche Aktion (z.B. Versions-Bump) erneut auslöst.
 */
export function StepUpModal({ purpose, actionLabel, onSuccess, onCancel }: StepUpModalProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const token = await verifyStepUp(code.trim(), purpose);
      onSuccess(token);
    } catch (err) {
      setError(err instanceof StepUpError ? err.message : 'Step-Up-Verifikation fehlgeschlagen.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-aif-gold-DEFAULT w-5 h-5" />
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-wide">Step-Up erforderlich</h3>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white cursor-pointer" aria-label="Abbrechen">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed">
          <span className="font-bold text-white">{actionLabel}</span> erfordert einen frischen zweiten
          Faktor. Bitte gib den aktuellen 6-stelligen Code aus deiner Authenticator-App ein.
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-black/40 border border-white/10 rounded-xl py-3 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
          />

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="flex-1 px-4 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-dark disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              {verifying ? 'Prüfe…' : 'Bestätigen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
