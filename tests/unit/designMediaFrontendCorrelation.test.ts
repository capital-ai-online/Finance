import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const tokens = JSON.parse(read('docs/frontend/design-tokens.json')) as {
  patterns: {
    patternBadge: {
      renderWhenMissing: boolean;
      missingState: string;
      noPlaceholder: boolean;
      buySemanticToken: string;
      sellSemanticToken: string;
      neutralSemanticToken: string;
      strengths: string[];
    };
  };
};

const viteConfig = read('vite.config.ts');
const mediaRenderer = read('scripts/media/capital_ai_media.py');
const mediaPreview = read('src/features/social/ui/MediaStudio/MediaStudioPreview.tsx');
const rankingBoard = read('src/features/screening/ui/RankingBoard.tsx');
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

  it('keeps the active Media Studio preview on semantic web tokens', () => {
    expect(mediaPreview).toContain('border-brand-primary/25');
    expect(mediaPreview).toContain('var(--color-brand-primary)');
    expect(mediaPreview).toContain('var(--color-brand-cyan)');
    expect(mediaPreview).toContain('var(--color-brand-accent)');
    expect(mediaPreview).not.toContain('aif-gold-');
    expect(mediaPreview).not.toMatch(/rgba\(245,\s*196,\s*83/);
    expect(mediaPreview).not.toMatch(/rgba\(13,\s*221,\s*221/);
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

  it('uses score semantics for pattern direction styling', () => {
    expect(rankingBoard).toContain('text-score-best border-score-best/30 bg-score-best/10');
    expect(rankingBoard).toContain('text-score-worst border-score-worst/30 bg-score-worst/10');
    expect(favoritePatterns).toContain("bullish: { text: 'text-score-best'");
    expect(favoritePatterns).toContain("bearish: { text: 'text-score-worst'");
    expect(favoritePatterns).toContain("neutral: { text: 'text-score-warning'");
  });

  it('keeps profile exports scoped to authoritative client-visible data', () => {
    expect(profilePage).toContain("import { CAPITAL_AI_VERSION } from '../platform/Branding/runtimeBrand';");
    expect(profilePage).toContain('platform_version: CAPITAL_AI_VERSION');
    expect(profilePage).toContain("export_type: 'client_profile_snapshot'");
    expect(profilePage).toContain('Billing, authentication, session, audit and backtest data are not included');
    expect(profilePage).not.toContain('Version 0.7.0');
    expect(profilePage).not.toContain('requests_completed_estimate');
    expect(profilePage).not.toContain('device_fingerprint_secure');
    expect(profilePage).not.toContain('backtest_history_archive');
    expect(profilePage).not.toContain('aif_core_gdpr_export');
    expect(profilePage).not.toContain('aif-gold-');
    expect(profilePage).not.toContain('aif-neon-');
  });
});
