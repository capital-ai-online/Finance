import React from 'react';
import { LegalAndFaqPages } from '../features/public/ui/LegalAndFaqPages';

/** @deprecated Compatibility bridge. Canonical legal presentation is FRONTEND LegalAndFaqPages. */
export function ImpressumAgb({ initialTab = 'impressum' }: { initialTab?: 'impressum' | 'agb' }) {
  return <LegalAndFaqPages route={initialTab === 'agb' ? '/agb' : '/impressum'} />;
}
