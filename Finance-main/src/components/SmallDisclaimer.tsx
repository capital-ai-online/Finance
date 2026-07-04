/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Canonical small/disclaimer-style text component. Matches the style
 * originally used for the "Strict No-Demo-Data-Policy" line above the
 * Dashboard footer: text-[11px] font-mono uppercase tracking-widest,
 * white/60. Use this anywhere a small, muted, all-caps mono disclaimer
 * or meta line is needed, instead of ad-hoc text sizes/colors, so the
 * style stays consistent across the app.
 */

import React from 'react';

interface SmallDisclaimerProps {
  children: React.ReactNode;
  className?: string;
}

export function SmallDisclaimer({ children, className = '' }: SmallDisclaimerProps) {
  return (
    <p className={`text-[11px] font-mono text-white/60 uppercase tracking-widest ${className}`}>
      {children}
    </p>
  );
}
