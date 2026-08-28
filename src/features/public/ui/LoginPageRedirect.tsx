import React, { useEffect } from 'react';

/**
 * Compatibility bridge for legacy in-dashboard login actions.
 *
 * Login is a first-class route now; this component exists only while the legacy Dashboard
 * still models navigation through `activeView`.
 */
export function LoginPageRedirect() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }, []);

  return (
    <div className="flex min-h-40 items-center justify-center p-6 text-center">
      <a
        href="/login"
        className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT hover:underline"
      >
        Weiter zur Anmeldung
      </a>
    </div>
  );
}
