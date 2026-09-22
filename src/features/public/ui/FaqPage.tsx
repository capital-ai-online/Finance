import React from 'react';
import { LegalAndFaqPages } from './LegalAndFaqPages';

/** @deprecated Compatibility bridge. Canonical FAQ presentation is FRONTEND LegalAndFaqPages. */
export function FaqPage() {
  return <LegalAndFaqPages route="/faq" />;
}
