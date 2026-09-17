import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const tokens = JSON.parse(read('docs/frontend/design-tokens.json')) as {
  color: {
    brand: { primary: { value: string }; cyan: { value: string; deprecated?: boolean } };
    assetClass: {
      crypto: { value: string };
      forex: { value: string };
      commodity: { value: string };
      bond: { value: string; note?: string };
    };
    semantic: { info: { value: string } };
  };
  patterns: {
    patternBadge: {
      renderWhenMissing: boolean;
      missingState: string;
      noPlaceholder: boolean;
      buySemanticToken: string;
      sellSemanticToken: string;
      neutralSemanticToken: string;
      strengths: string[];
      intensity: {
        strong: { foreground: string; background: string; border: string };
        medium: { foreground: string; background: string; border: string };
        weak: { foreground: string; background: string; border: string };
      };
    };
  };
};

const viteConfig = read('vite.config.ts');
const webProjection = read('src/index.css');
const mediaRenderer = read('scripts/media/capital_ai_media.py');
const mediaPreview = read('src/features/social/ui/MediaStudio/MediaStudioPreview.tsx');
const mediaTemplates = read('src/platform/SocialMediaEngine/Editing/MediaStudioTemplates.ts');
const rankingBoard = read('src/features/screening/ui/RankingBoard.tsx');
const enterpriseScorer = read('src/features/crypto/ui/CryptoScoringEnterprise.tsx');
const marketScreener = read('src/components/MarketScreener.tsx');
const legacyScreener = read('src/components/Screener.tsx');
const newsfeed = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
const priceAlert = read('src/components/PriceAlert.tsx');
const watchlist = read('src/components/Watchlist.tsx');
const dashboard = read('src/components/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');
const favoritePatterns = read('src/components/FavoriteAssetPatternSlots.tsx');
const profilePage = read('src/components/ProfilePage.tsx');

describe('Designsystem / Media / PDF / Frontend correlation contract', () => {
  it('projects PDF and deterministic media from canonical brand roles', () => {
    expect(viteConfig).toContain("tokenString('color', 'brand', 'primary')");
    expect(viteConfig).toContain("tokenString('color', 'brand', 'cyan')");
    expect(viteConfig).toContain("tokenString('color', 'brand', 'accent')");
    expect(viteConfig).not.toMatch(/tokenString\('color',\s*'aif'/);
    expect(mediaRenderer).toContain('brand = color["brand"]');
    expect(mediaRenderer).not.toContain('color["aif"]');
  });

  it('keeps semantic Cyan separate from current Capital Gold branding', () => {
    expect(tokens.color.brand.primary.value).toBe('#F5C453');
    expect(tokens.color.brand.cyan.value).toBe(tokens.color.brand.primary.value);
    expect(tokens.color.brand.cyan.deprecated).toBe(true);
    expect(tokens.color.semantic.info.value).toBe('#22D3EE');
    expect(tokens.color.semantic.info.value).not.toBe(tokens.color.brand.primary.value);
  });

  it('materializes the productive Universe palette without activating Meteor Amber', () => {
    expect(tokens.color.assetClass.crypto.value).toBe('#8D26FF');
    expect(tokens.color.assetClass.forex.value).toBe('#E879F9');
    expect(tokens.color.assetClass.commodity.value).toBe('#F9BF21');
    expect(tokens.color.assetClass.bond.note).toContain('compatibility');
    expect(webProjection).toContain('--color-asset-crypto: #8D26FF;');
    expect(webProjection).toContain('--color-asset-forex: #E879F9;');
    expect(webProjection).toContain('--color-asset-commodity: #F9BF21;');
    expect(webProjection).not.toContain('--color-asset-commodity: #FF9F1C;');
  });

  it('keeps the active Media Studio preview token-bound', () => {
    expect(mediaPreview).toContain('border-brand-primary/25');
    expect(mediaPreview).toContain('var(--color-brand-primary)');
    expect(mediaPreview).toContain('var(--color-brand-accent)');
    expect(mediaPreview).not.toContain('var(--color-brand-cyan)');
    expect(mediaPreview).not.toContain('brand-cyan');
    expect(mediaPreview).not.toContain('aif-gold-');
  });

  it('keeps new Social Media templates versioned and role-explicit', () => {
    expect(mediaTemplates).toContain('brandTokenSource: MEDIA_PROJECT_BRAND_TOKEN_SOURCE');
    expect(mediaTemplates).toContain("templateVersion: '1.1.0'");
    expect(mediaTemplates).toContain('Cyan is reserved for semantic data visualization');
  });

  it('defines missing pattern evidence as omission, never a placeholder signal', () => {
    expect(tokens.patterns.patternBadge).toMatchObject({
      renderWhenMissing: false,
      missingState: 'omit',
      noPlaceholder: true,
      buySemanticToken: 'color.score.best',
      sellSemanticToken: 'color.score.worst',
      neutralSemanticToken: 'color.score.warning',
      strengths: ['strong', 'medium', 'weak'],
    });
    expect(rankingBoard).toContain("if (name === 'NO PATTERN' || !name) return null;");
    expect(favoritePatterns).toContain('if (patterns.length === 0) return null;');
  });

  it('keeps Bond compatibility identifiers out of productive selection surfaces', () => {
    expect(rankingBoard).toContain("type ProductiveAssetType = Exclude<AssetType, 'bond'>;");
    expect(rankingBoard).toContain("item.type !== 'bond'");
    expect(marketScreener).toContain("&& item.type !== 'bond'");
    expect(newsfeed).toContain("&& candidate.type !== 'bond'");
    expect(priceAlert).toContain("&& item.type !== 'bond'");
    expect(enterpriseScorer).toContain("registryAssets.filter((asset) => asset.type !== 'bond')");
    expect(watchlist).toContain("a?.type !== 'bond'");
    expect(legacyScreener).toContain("asset?.type !== 'bond'");
    expect(dashboard).not.toContain('Universe 5: Bonds');
    expect(dashboardNavigation).toContain("type UniverseId = 'equities' | 'index' | 'forex' | 'crypto' | 'commodity';");
    expect(dashboardNavigation).not.toContain("category: 'bond'");
  });

  it('keeps profile exports scoped to authoritative client-visible data', () => {
    expect(profilePage).toContain("import { CAPITAL_AI_VERSION } from '../platform/Branding/runtimeBrand';");
    expect(profilePage).toContain('platform_version: CAPITAL_AI_VERSION');
    expect(profilePage).toContain("export_type: 'client_profile_snapshot'");
    expect(profilePage).not.toContain('device_fingerprint_secure');
    expect(profilePage).not.toContain('backtest_history_archive');
  });
});
