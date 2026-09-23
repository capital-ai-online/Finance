import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('owner-uploaded FRONTEND design refresh', () => {
  it('removes the Universe tab without deleting the existing /universe boundary', () => {
    const header = read('src/features/public/ui/frontend-port/components/Header.tsx');
    const boundary = read('src/app/universe/ui/UniversePathBoundary.tsx');

    expect(header).not.toContain('href="/universe"');
    expect(header).not.toContain('data-public-navigation="universe"');
    expect(boundary).toContain("export const UNIVERSE_PATH = '/universe' as const");
  });

  it('adopts recognizable asset logos without rendering source-fixture scoring', () => {
    const market = read('src/features/public/ui/frontend-port/components/MarketOverview.tsx');
    const assetLogo = read('src/features/public/ui/runtime/AssetLogo.tsx');

    expect(market).toContain("import { AssetLogo } from '../../runtime/AssetLogo'");
    expect(market).toContain('<AssetLogo asset={asset} size="sm" />');
    expect(market).toContain('data-local-scoring="disabled"');
    expect(market).not.toContain('asset.aiScore');
    expect(market).not.toContain('asset.aiRating');

    for (const identity of ['BTC', 'ETH', 'SOL', 'AAPL', 'MSFT', 'NVDA', 'DAX', 'GSPC', 'NDX']) {
      expect(assetLogo).toContain(`cleanSymbol === '${identity}'`);
    }
  });

  it('renders the new sentiment visual as a fail-closed FINTECH consumer', () => {
    const app = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
    const sentiment = read('src/features/public/ui/runtime/MarketSentimentPresentation.tsx');

    expect(app).toContain('<MarketSentimentPresentation');
    expect(sentiment).toContain('data-fintech-sentiment-consumer="crypto-sentiment-research/0.1.0"');
    expect(sentiment).toContain('data-local-scoring="disabled"');
    expect(sentiment).toContain("'NOT_COMPUTABLE'");
    expect(sentiment).not.toContain('CATEGORY_SENTIMENTS');
    expect(sentiment).not.toContain('generate30DaySentimentHistory');
    expect(sentiment).not.toContain('lastMonthScore');
    expect(sentiment).not.toContain('yesterdayScore');
  });

  it('keeps the Altcoin Pattern Trooper out of the landing composition for the deferred graphic integration', () => {
    const app = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
    const universe = read('src/app/universe/ui/UniversePortal.tsx');

    expect(app).not.toContain('CryptoPatternTrooper');
    expect(app).not.toContain('Altcoin Pattern Trooper');
    expect(universe).toContain('<CryptoPatternTrooperLive />');
  });

  it('records the uploaded archive as a presentation-only overlay rather than a new scoring authority', () => {
    const landing = read('src/features/public/ui/LandingPage.tsx');
    const sourceLock = JSON.parse(read('src/features/public/ui/frontend-port/source-lock.json')) as {
      ownerDesignOverlay?: {
        id: string;
        sha256: string;
        policy: string;
        authorityBoundary: string;
        deferredIntegration: string;
      };
      entries: Array<{ sourcePath: string; mode: string }>;
    };

    expect(landing).toContain('data-landing-design-overlay="owner-upload-2026-09-23-no-scoring"');
    expect(sourceLock.ownerDesignOverlay).toMatchObject({
      id: 'owner-upload-2026-09-23-no-scoring',
      sha256: 'a016e7874436ff17c16621269153923aae11fe1b4009e8a72d002d8af87fbca1',
      policy: 'PRESENTATION_ONLY_NO_LOCAL_SCORING',
    });
    expect(sourceLock.ownerDesignOverlay?.authorityBoundary).toContain('CAPITAL-AI-FINTECH');
    expect(sourceLock.ownerDesignOverlay?.deferredIntegration).toContain('Altcoin Pattern Trooper');

    const marketEntry = sourceLock.entries.find((entry) => entry.sourcePath === 'src/components/MarketOverview.tsx');
    expect(marketEntry?.mode).toBe('FINANCE_PRESENTATION_ADAPTER');
  });
});
