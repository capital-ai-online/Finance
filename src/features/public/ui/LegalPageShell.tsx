import type { ReactNode } from 'react';
import { LegalAndFaqPages, type LegalRoute } from './LegalAndFaqPages';

interface LegalPageShellProps {
  activeRoute: LegalRoute;
  children?: ReactNode;
}

/**
 * @deprecated Compatibility bridge.
 * The former Finance-authored shell is retired; all legal routes render through
 * the FRONTEND LegalAndFaqPages presentation adapter.
 */
export function LegalPageShell({ activeRoute }: LegalPageShellProps) {
  return <LegalAndFaqPages route={activeRoute} />;
}
