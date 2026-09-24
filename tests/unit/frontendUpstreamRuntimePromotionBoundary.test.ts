import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as {
  deferredSourceArtifacts?: Array<{ sourcePath: string; reason: string }>;
};

const contract = read('docs/frontend/FRONTEND_UPSTREAM_SOURCE_CONTRACT.md');
const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const marketSentiment = read('src/features/public/ui/runtime/MarketSentimentPresentation.tsx');
const legacyPriceAlert = read('src/components/PriceAlert.tsx');
const alertStore = read('src/lib/alertStore.ts');
const serverAlerts = read('server/alerts.ts');

describe('FRONTEND upstream runtime-promotion boundary', () => {
  it('defers upstream alert behavior until an owner-correct price-alert backend exists', () => {
    const deferred = new Map(
      (sourceLock.deferredSourceArtifacts ?? []).map((entry) => [entry.sourcePath, entry.reason]),
    );

    for (const sourcePath of [
      'src/components/PriceAlertsModal.tsx',
      'src/components/PriceAlertToast.tsx',
      'src/context/PriceAlertsContext.tsx',
      'src/utils/priceAlerts.ts',
    ]) {
      expect(deferred.has(sourcePath)).toBe(true);
    }

    expect(deferred.get('src/context/PriceAlertsContext.tsx')).toContain('localStorage');
    expect(deferred.get('src/context/PriceAlertsContext.tsx')).toContain('backend contract');
    expect(contract).toContain('FE-PRICE-ALERT-BACKEND-HANDOVER-20260924');
    expect(contract).toContain('price-threshold semantics distinct from score-threshold semantics');
  });

  it('keeps the productive landing free of upstream alert state, simulation and persistence', () => {
    expect(referenceApp).not.toContain('PriceAlertsProvider');
    expect(referenceApp).not.toContain('PriceAlertsContext');
    expect(referenceApp).not.toContain('PriceAlertsModal');
    expect(referenceApp).not.toContain('PriceAlertToast');
    expect(referenceApp).not.toContain('usePriceAlerts');
    expect(referenceApp).not.toContain('localStorage');
    expect(referenceApp).not.toContain('simulateSentimentShift');
  });

  it('keeps Market Sentiment on the FINTECH projection without synthetic browser scoring', () => {
    expect(marketSentiment).toContain('/api/news/sentiment-projection');
    expect(marketSentiment).toContain('market-sentiment-projection/1.0.0');
    expect(marketSentiment).toContain('sentiment-feature-contract/1.0.0');
    expect(marketSentiment).not.toContain('generate30DaySentimentHistory');
    expect(marketSentiment).not.toContain('simulateSentimentShift');
    expect(marketSentiment).not.toContain('Math.random');
    expect(marketSentiment).not.toContain('localStorage');
  });

  it('does not confuse the existing score-alert backend with a price-threshold contract', () => {
    expect(serverAlerts).toContain("const ALLOWED_CONDITIONS = ['score_above', 'score_below']");
    expect(serverAlerts).toContain('threshold muss eine Zahl zwischen 0 und 10 sein');
    expect(legacyPriceAlert).toContain('saveSessionAlerts');
    expect(alertStore).toContain('localStorage.setItem');
    expect(contract).toContain('must not be misused as a price-threshold API');
  });
});
