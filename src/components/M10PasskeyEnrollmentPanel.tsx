import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { authFetch } from '../lib/authFetch';
import { isStepUpRequired } from '../lib/stepUp';
import { StepUpModal } from './StepUpModal';
import { M10PrAuthorizationShadowPanel } from './M10PrAuthorizationShadowPanel';

/**
 * M10 (ADR-0066, ESS-0022) Owner passkey console. Enrollment/revocation remains the Phase-3
 * Human identity operation; the nested Phase-6 panel performs a real, non-authoritative Shadow
 * assertion against a PR without dispatching CI.
 */
interface M10Credential {
  credentialId: string;
  counter: number;
  transports: string[];
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  aaguid: string;
  createdAt: string;
  revokedAt: string | null;
}

type PendingStepUp =
  | { kind: 'begin' }
  | { kind: 'complete'; challengeId: string; response: unknown };

export function M10PasskeyEnrollmentPanel() {
  const [credentials, setCredentials] = useState<M10Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingStepUp, setPendingStepUp] = useState<PendingStepUp | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ credentialId: string } | null>(null);

  const fetchCredentials = async () => {
    try {
      const res = await authFetch('/api/m10/credential-enrollment/credentials');
      if (!res.ok) return;
      const body = await res.json();
      setCredentials(body.credentials || []);
    } catch {
      // Read-only refresh - a failure here is not user-actionable beyond retrying.
    }
  };

  useEffect(() => {
    void fetchCredentials();
  }, []);

  const beginEnrollment = async (stepUpToken?: string) => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await authFetch('/api/m10/credential-enrollment/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(stepUpToken ? { 'x-step-up-token': stepUpToken } : {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (isStepUpRequired(res.status, body)) {
        setLoading(false);
        setPendingStepUp({ kind: 'begin' });
        return;
      }
      if (!res.ok) throw new Error(body.error || `Registrierung konnte nicht gestartet werden (HTTP ${res.status}).`);

      const options = body.options;
      const challengeId: string = options.challenge;

      let response;
      try {
        response = await startRegistration({ optionsJSON: options });
      } catch (webAuthnErr: any) {
        throw new Error(`WebAuthn-Zeremonie abgebrochen oder fehlgeschlagen: ${webAuthnErr?.message || webAuthnErr}`);
      }

      await completeEnrollment(challengeId, response);
    } catch (err: any) {
      setError(err?.message || 'Passkey-Registrierung fehlgeschlagen.');
      setLoading(false);
    }
  };

  const completeEnrollment = async (challengeId: string, response: unknown, stepUpToken?: string) => {
    setLoading(true);
    try {
      const res = await authFetch('/api/m10/credential-enrollment/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(stepUpToken ? { 'x-step-up-token': stepUpToken } : {}),
        },
        body: JSON.stringify({ challengeId, response }),
      });
      const body = await res.json().catch(() => ({}));
      if (isStepUpRequired(res.status, body)) {
        setLoading(false);
        setPendingStepUp({ kind: 'complete', challengeId, response });
        return;
      }
      if (!res.ok) throw new Error(body.error || `Registrierung konnte nicht abgeschlossen werden (HTTP ${res.status}).`);

      setStatus('Passkey erfolgreich registriert.');
      await fetchCredentials();
    } catch (err: any) {
      setError(err?.message || 'Passkey-Registrierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleStepUpSuccess = (stepUpToken: string) => {
    const pending = pendingStepUp;
    setPendingStepUp(null);
    if (!pending) return;
    if (pending.kind === 'begin') {
      void beginEnrollment(stepUpToken);
    } else {
      void completeEnrollment(pending.challengeId, pending.response, stepUpToken);
    }
  };

  const revokeCredential = async (credentialId: string, stepUpToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/m10/credential-enrollment/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(stepUpToken ? { 'x-step-up-token': stepUpToken } : {}),
        },
        body: JSON.stringify({ credentialId }),
      });
      const body = await res.json().catch(() => ({}));
      if (isStepUpRequired(res.status, body)) {
        setLoading(false);
        setRevokeTarget({ credentialId });
        return;
      }
      if (!res.ok) throw new Error(body.error || `Widerruf fehlgeschlagen (HTTP ${res.status}).`);
      setStatus('Passkey widerrufen.');
      await fetchCredentials();
    } catch (err: any) {
      setError(err?.message || 'Widerruf fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsWebAuthn()) {
    return (
      <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="text-rose-400 w-5 h-5" />
          <h3 className="text-sm font-bold font-display text-white uppercase tracking-wide">Passkey-Autorisierung (M10)</h3>
        </div>
        <p className="text-xs text-white/60">Dieser Browser unterstützt WebAuthn/Passkeys nicht.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <KeyRound className="text-aif-gold-DEFAULT w-5 h-5" />
        <h3 className="text-sm font-bold font-display text-white uppercase tracking-wide">Passkey-Autorisierung (M10)</h3>
      </div>
      <p className="text-xs text-white/60 leading-relaxed">
        Verwalte das Owner-Passkey-Credential und führe Phase-6-Shadow-Prüfungen durch. Registrierung
        und Widerruf erfordern weiterhin einen frischen TOTP-Step-Up; die Shadow-Prüfung verwendet
        anschließend den Passkey selbst und bleibt bis zum Controlled Cutover nicht autoritativ für CI.
      </p>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {status && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{status}</p>
      )}

      <button
        type="button"
        onClick={() => void beginEnrollment()}
        disabled={loading}
        className="px-4 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-dark disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
      >
        <ShieldCheck size={14} />
        {loading ? 'Wird verarbeitet…' : 'Passkey registrieren'}
      </button>

      <div className="space-y-2">
        {credentials.length === 0 && (
          <p className="text-xs text-white/40">Kein Passkey registriert.</p>
        )}
        {credentials.map((cred) => (
          <div
            key={cred.credentialId}
            className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-4 py-3"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-mono text-white/80">{cred.credentialId.slice(0, 16)}…</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">
                {cred.deviceType} · {cred.backedUp ? 'gesichert' : 'nicht gesichert'} · seit {new Date(cred.createdAt).toLocaleDateString('de-DE')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revokeCredential(cred.credentialId)}
              disabled={loading}
              className="text-rose-400 hover:text-rose-300 disabled:opacity-40 cursor-pointer"
              aria-label="Passkey widerrufen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <M10PrAuthorizationShadowPanel />

      {pendingStepUp && (
        <StepUpModal
          purpose={pendingStepUp.kind === 'begin' ? 'systemadmin:m10-passkey-enroll-begin' : 'systemadmin:m10-passkey-enroll-complete'}
          actionLabel="Passkey-Registrierung"
          onSuccess={handleStepUpSuccess}
          onCancel={() => setPendingStepUp(null)}
        />
      )}

      {revokeTarget && (
        <StepUpModal
          purpose="systemadmin:m10-passkey-enroll-revoke"
          actionLabel="Passkey-Widerruf"
          onSuccess={(token) => {
            const target = revokeTarget;
            setRevokeTarget(null);
            if (target) void revokeCredential(target.credentialId, token);
          }}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
