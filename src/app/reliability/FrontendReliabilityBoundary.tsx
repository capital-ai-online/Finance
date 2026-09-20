import React, { useEffect, useState } from 'react';
import {
  fetchWithBoundedFrontendRetry,
  readFrontendDeploymentIdentity,
  reconcileFrontendDeployment,
  type FrontendConnectivityState,
} from './frontendDegradedMode';

interface FrontendReliabilityBoundaryProps {
  children: React.ReactNode;
}

function statusMessage(state: FrontendConnectivityState): string | null {
  switch (state) {
    case 'OFFLINE':
      return 'Keine Netzwerkverbindung. Bereits geladene Bereiche bleiben verfügbar; neue Daten werden erst nach Wiederherstellung der Verbindung geladen.';
    case 'DEGRADED':
      return 'Die Verbindung zur Anwendung ist derzeit eingeschränkt. Sichere Lesezugriffe werden begrenzt erneut versucht.';
    case 'VERSION_SKEW':
      return 'Eine neue Anwendungsversion wurde erkannt. Die automatische Aktualisierung wurde bereits verwendet; bitte laden Sie die Seite bei Bedarf manuell neu.';
    default:
      return null;
  }
}

/**
 * Global presentation-only reliability boundary.
 *
 * It does not own auth, domain data or deployment authority. Probes are event
 * driven (mount, reconnect, focus, visible-tab) rather than interval polling.
 */
export function FrontendReliabilityBoundary({
  children,
}: FrontendReliabilityBoundaryProps) {
  const [state, setState] = useState<FrontendConnectivityState>('ONLINE');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return undefined;

    let disposed = false;
    let probeInFlight: Promise<void> | null = null;

    const probe = async () => {
      if (disposed) return;

      if (!navigator.onLine) {
        setState('OFFLINE');
        return;
      }

      if (probeInFlight) {
        await probeInFlight;
        return;
      }

      const execution = (async () => {
        try {
          const response = await fetchWithBoundedFrontendRetry('/healthz', {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
          }, {
            maxAttempts: 2,
            baseDelayMs: 250,
            maxDelayMs: 500,
            jitterRatio: 0.1,
          });

          if (disposed) return;
          if (!response.ok) {
            setState('DEGRADED');
            return;
          }

          const identity = readFrontendDeploymentIdentity(response.headers);
          if (!identity) {
            setState('DEGRADED');
            return;
          }

          const reconciliation = reconcileFrontendDeployment(window.sessionStorage, identity);
          if (reconciliation.state === 'VERSION_SKEW') {
            if (reconciliation.shouldReload) {
              window.location.reload();
              return;
            }
            setState('VERSION_SKEW');
            return;
          }

          setState('ONLINE');
        } catch {
          if (!disposed) setState(navigator.onLine ? 'DEGRADED' : 'OFFLINE');
        }
      })().finally(() => {
        probeInFlight = null;
      });

      probeInFlight = execution;
      await execution;
    };

    const handleOnline = () => { void probe(); };
    const handleOffline = () => setState('OFFLINE');
    const handleFocus = () => { void probe(); };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void probe();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    void probe();

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const message = statusMessage(state);

  return (
    <>
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-[100] border-b border-status-warning/30 bg-background/95 px-4 py-2 text-center text-xs font-semibold text-text-primary backdrop-blur"
          data-frontend-connectivity={state}
        >
          {message}
        </div>
      ) : null}
      {children}
    </>
  );
}
