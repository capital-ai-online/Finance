import React from 'react';
import { Archive, ShieldOff } from 'lucide-react';

/**
 * Historical M10 status surface. The former enrollment and PR-authorization controls were
 * permanently retired on 2026-09-01 and intentionally expose no WebAuthn or authorization API.
 */
export function M10PasskeyEnrollmentPanel() {
  return (
    <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <Archive className="text-white/60 w-5 h-5" />
        <h3 className="text-sm font-bold font-display text-white uppercase tracking-wide">M10 Passkey — archiviert</h3>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
        <ShieldOff className="mt-0.5 h-4 w-4 text-white/50" />
        <div className="space-y-2">
          <p className="text-xs text-white/70 leading-relaxed">
            M10 Passkey-Authentifizierung und <code>AUTHORIZE_PR_CI</code> sind dauerhaft deaktiviert und archiviert.
            Diese Ansicht ist rein historisch und enthält keine Registrierungs-, Widerrufs- oder Autorisierungsaktion.
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide">
            Retirement: 2026-09-01 · Authority: AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION
          </p>
        </div>
      </div>
    </div>
  );
}
