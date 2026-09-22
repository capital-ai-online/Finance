import React from 'react';
import { LegalAndFaqPages } from '../features/public/ui/LegalAndFaqPages';

/** @deprecated Compatibility bridge. Canonical legal presentation is FRONTEND LegalAndFaqPages. */
export function Datenschutz() {
  return <LegalAndFaqPages route="/datenschutz" />;
}
