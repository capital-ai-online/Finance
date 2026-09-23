import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PRICING_MODEL_ARCHIVE_REFERENCE,
  PRICING_MODEL_STATE,
} from '../../src/features/billing/billingContract';

const subscriptions = readFileSync('src/features/billing/ui/Abonnements.tsx', 'utf8');
const landingNews = readFileSync('src/features/news/ui/LandingRealtimeAiNewsfeed.tsx', 'utf8');
const archive = readFileSync('docs/archive/billing/PRICING_MODEL_2026-08-23.md', 'utf8');

describe('temporary pricing archive and open component visibility', () => {
  it('marks the old pricing model archived and disabled', () => {
    expect(PRICING_MODEL_STATE).toBe('ARCHIVED_DISABLED');
    expect(PRICING_MODEL_ARCHIVE_REFERENCE).toBe('docs/archive/billing/PRICING_MODEL_2026-08-23.md');
    expect(archive).toContain('ARCHIVED / DISABLED');
    expect(archive).toContain('not an active offer');
  });

  it('removes active plan cards and checkout from the subscription presentation', () => {
    expect(subscriptions).toContain('Alle Komponenten sichtbar');
    expect(subscriptions).toContain('PUBLIC ALL COMPONENTS');
    expect(subscriptions).not.toContain("from './Checkout'");
    expect(subscriptions).not.toContain('SUBSCRIPTION_PRICES_EUR');
    expect(subscriptions).not.toContain('Checkout starten');
  });

  it('removes subscription-tier visibility messaging from the landing news capability', () => {
    expect(landingNews).toContain('Für alle sichtbar');
    expect(landingNews).not.toContain('NEWSFEED_ENABLED_TIERS');
    expect(landingNews).not.toContain('canUseFeature');
    expect(landingNews).not.toContain('Pro / Enterprise');
  });
});
