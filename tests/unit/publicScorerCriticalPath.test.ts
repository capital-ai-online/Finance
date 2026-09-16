import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/features/crypto/ui/PublicCryptoScoringPreview.tsx'),
  'utf8',
);

describe('public Enterprise Scorer critical path', () => {
  it('keeps the heavy canonical scorer out of the landing first-paint module graph', () => {
    expect(source).toContain("import type { CryptoScoringEnterpriseProps } from './CryptoScoringEnterprise'");
    expect(source).toContain('const CanonicalCryptoScoringEnterprise = lazy(() =>');
    expect(source).toContain("import('./CryptoScoringEnterprise')");
    expect(source).not.toMatch(/import\s*\{[\s\S]*CryptoScoringEnterprise as CanonicalCryptoScoringEnterprise[\s\S]*\}\s*from '\.\/CryptoScoringEnterprise'/);
  });

  it('advances automatically after first paint without a timer or user activation gate', () => {
    expect(source).toContain('window.requestAnimationFrame(() => {');
    expect(source).toContain('startTransition(() => setScorerReady(true));');
    expect(source).toContain('window.cancelAnimationFrame(frameId)');
    expect(source).not.toContain('setTimeout(');
    expect(source).not.toContain('IntersectionObserver');
    expect(source).not.toContain('Analyse-Workbench starten');
  });

  it('preserves the canonical public-preview scorer and a lightweight suspense shell', () => {
    expect(source).toContain('<EnterpriseScorerPresentationProvider mode="public-preview">');
    expect(source).toContain('<Suspense fallback={shell}>');
    expect(source).toContain('<CanonicalCryptoScoringEnterprise {...props} />');
    expect(source).toContain('data-testid="public-scorer-first-paint-shell"');
  });
});
