/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { consumeAutomaticFrontendRecovery } from '../app/reliability/frontendRecovery';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// AUD2-F: React besitzt keine Error Boundary in dieser Codebasis (Audit ARCH-AUDIT-0002,
// Kapitel 4.9/13). Ohne sie leert ein einzelner Renderfehler in irgendeiner Komponente die
// gesamte Oberfläche zu einem weissen Bildschirm, statt einen Fehlerzustand anzuzeigen.
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unbehandelter Render-Fehler:', {
      name: error.name,
      componentStack: errorInfo.componentStack,
    });

    if (typeof window === 'undefined') return;

    const recovery = consumeAutomaticFrontendRecovery(
      window.sessionStorage,
      error,
      window.location.pathname,
    );

    if (recovery.shouldReload) {
      console.warn('[ErrorBoundary] Bounded stale-asset recovery reload', {
        fingerprint: recovery.fingerprint,
      });
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
          <div className="max-w-md w-full text-center space-y-5">
            <h1 className="text-lg font-bold font-display text-white uppercase tracking-widest">
              Unerwarteter Fehler
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Die Anwendung ist auf einen unerwarteten Fehler gestoßen. Ihre Daten sind davon
              nicht betroffen. Die Anwendung konnte den betroffenen Zustand nicht automatisch wiederherstellen. Ein erneutes Laden startet einen frischen Anwendungszustand.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-dark text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
