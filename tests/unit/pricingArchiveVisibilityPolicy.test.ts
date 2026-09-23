import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('archived pricing and subscription-independent visibility', () => {
  it('declares the pricing lifecycle archived with checkout entrypoints disabled', () => {
    const policy = read('src/config/productAccessPolicy.ts');
    expect(policy).toContain("pricingLifecycle: 'archived_pending_replacement'");
    expect(policy).toContain('subscriptionVisibilityGating: false');
    expect(policy).toContain('checkoutEntryPointsEnabled: false');
  });

  it('does not render the previous pricing catalogue or upgrade actions', () => {
    const pricing = read('src/features/billing/ui/Abonnements.tsx');
    const header = read('src/app/dashboard/DashboardHeader.tsx');
    const home = read('src/app/dashboard/DashboardHome.tsx');
    const footer = read('src/app/dashboard/DashboardFooter.tsx');

    expect(pricing).toContain('Pricing-Modell archiviert');
    expect(pricing).not.toContain('<Checkout');
    expect(pricing).not.toContain('SUBSCRIPTION_PRICES_EUR');
    expect(header).not.toContain('Premium freischalten');
    expect(home).not.toContain('Abonnement Upgraden');
    expect(home).not.toContain("subscriptionTier === 'Free'");
    expect(footer).toContain('Pricing archiviert');
  });

  it('removes tier presentation gates from feature surfaces', () => {
    const exporter = read('src/components/ComplianceExporter.tsx');
    const pdfModal = read('src/components/PdfExportModal.tsx');
    const newsfeed = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
    const landingNewsfeed = read('src/features/news/ui/LandingRealtimeAiNewsfeed.tsx');
    const heatmap = read('src/components/HeatmapCreator.tsx');

    expect(exporter).not.toContain("subscriptionTier === 'Enterprise'");
    expect(exporter).toContain('setShowExportModal(true)');
    expect(pdfModal).not.toContain("create-checkout-session");
    expect(newsfeed).not.toContain('subscriptionTier:');
    expect(landingNewsfeed).not.toContain('canUseFeature');
    expect(landingNewsfeed).toContain('Für alle sichtbar');
    expect(heatmap).not.toContain('subscriptionTier');
  });

  it('keeps server security and cost authority outside the presentation policy', () => {
    const policy = read('src/config/productAccessPolicy.ts');
    const exporter = read('src/components/ComplianceExporter.tsx');
    const pdfModal = read('src/components/PdfExportModal.tsx');

    expect(policy).toContain('does not grant protected server capabilities');
    expect(exporter).toContain('PdfExportModal');
    expect(pdfModal).toContain("authFetch('/api/stripe/pdf-credits')");
    expect(pdfModal).toContain("authFetch('/api/stripe/consume-pdf-credit'");
  });
});
