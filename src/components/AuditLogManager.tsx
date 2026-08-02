import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuditLogManagerProps {
  currentUserEmail: string;
}

/**
 * ARCH-AUDIT-0004 / AUD4-F-002 (P0)
 *
 * The legacy component called non-existent `/api/admin/gdpr-audit*` endpoints and also exposed
 * a simulator that manufactured IP addresses and audit events. Until a real server-side GDPR
 * audit evidence contract exists, this surface is intentionally fail-closed.
 */
export function AuditLogManager({ currentUserEmail }: AuditLogManagerProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-amber-500/20 bg-black/40 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">GDPR Audit Evidence</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Dieses Modul ist vorübergehend deaktiviert, weil aktuell kein verifizierter serverseitiger
            GDPR-Audit-Contract für Stream, Verify und Log vorhanden ist. Es werden keine simulierten
            Auditereignisse, IP-Adressen oder Compliance-Nachweise erzeugt.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-[11px] text-white/55">
        <div className="flex items-center gap-2 font-mono text-emerald-300">
          <ShieldCheck size={14} />
          <span>FAIL-CLOSED · AUD4-F-002</span>
        </div>
        <div className="mt-2 space-y-1">
          <div>Operator: {currentUserEmail || 'authenticated-admin'}</div>
          <div>Persistierte simulierte Events: 0</div>
          <div>Freigabe erst nach serverseitigem Evidence-/Hash-Chain-/IAM-Contract und Regressionstests.</div>
        </div>
      </div>
    </section>
  );
}
