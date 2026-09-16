import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const tokens = JSON.parse(read('docs/frontend/design-tokens.json'));
const css = read('src/index.css');
const card = read('src/shared/ui/Card.tsx');
const button = read('src/shared/ui/Button.tsx');
const shell = read('src/app/AppShell.tsx');
const neural = read('src/shared/visuals/NeuralBackground.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const publicWorkbench = read('src/app/public/PublicAnalysisWorkbench.tsx');

describe('GOV-CHAT-079 16.08 appearance contract', () => {
  it('projects the Owner-approved visual values through the canonical token authority', () => {
    expect(tokens.color.background.value).toBe('#18181B');
    expect(tokens.color.border.value).toBe('rgba(255, 255, 255, 0.08)');
    expect(tokens.color.brand.primary.value).toBe('#F5C453');
    expect(tokens.color.decorative.cyan.value).toBe('#0DDDDD');
    expect(tokens.color.decorative.purple.value).toBe('#B026FF');
    expect(tokens.color.surface.glass.value).toBe('rgba(10, 10, 10, 0.40)');
    expect(tokens.font.sans.value).toContain('Poppins');
    expect(tokens.font.display.value).toContain('Montserrat');
    expect(tokens.font.mono.value).toContain('JetBrains Mono');
    expect(tokens.spacing.card.value).toBe('1.5rem');
    expect(tokens.spacing.section.value).toBe('2rem');
    expect(tokens.radius.xl.value).toBe('1rem');
    expect(tokens.accessibility.focusRing.color.value).toBe('#F5C453');
    expect(tokens.accessibility.minHitTarget.value).toBe('44px');
  });

  it('preserves current financial semantic colors instead of rolling them back with historical appearance', () => {
    expect(tokens.color.assetClass.crypto.value).toBe('#8D26FF');
    expect(tokens.color.assetClass.stock.value).toBe('#44DE88');
    expect(tokens.color.assetClass.index.value).toBe('#60A5FA');
    expect(tokens.color.assetClass.forex.value).toBe('#E879F9');
    expect(tokens.color.score.best.value).toBe('#44DE88');
    expect(tokens.color.score.worst.value).toBe('#F87171');
    expect(tokens.color.semantic.info.value).toBe('#22D3EE');
    expect(tokens.patterns.patternBadge.noPlaceholder).toBe(true);
  });

  it('projects the canonical values into the runtime theme and responsive glass primitives', () => {
    expect(css).toContain('--color-background: #18181B');
    expect(css).toContain('--color-brand-primary: #F5C453');
    expect(css).toContain('--color-decorative-cyan: #0DDDDD');
    expect(css).toContain('--color-decorative-purple: #B026FF');
    expect(css).toContain('--font-display: "Montserrat"');
    expect(css).toContain('--ui-glass-bg: rgba(10, 10, 10, 0.40)');
    expect(css).toContain('--ui-glass-border: rgba(255, 255, 255, 0.10)');
    expect(css).toContain('--ui-hit-min: 44px');
    expect(css).toContain('@media (max-width: 640px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('routes shared Card, Button and AppShell appearance through shared presentation primitives', () => {
    expect(card).toContain("className={clsx('ui-panel', elevated && 'ui-panel--elevated', className)}");
    expect(button).toContain("primary: 'ui-button-primary'");
    expect(button).toContain("secondary: 'ui-button-secondary'");
    expect(button).toContain("sm: 'min-h-11");
    expect(shell).toContain('app-shell-frame');
  });

  it('keeps the public landing token-driven while applying the Owner-directed fixed-BTC Universe surface', () => {
    expect(landing).toContain('bg-background');
    expect(landing).toContain('text-brand-primary');
    expect(landing).toContain('border-border');
    expect(landing).toContain('{preview}');
    expect(landing).toContain('BTC · Public Fixed');
    expect(landing).not.toContain('loadPreview');
    expect(landing).not.toContain('WorkbenchActivationState');
    expect(landing).not.toContain('IntersectionObserver');
    expect(publicWorkbench).toContain("const PUBLIC_FIXED_SYMBOL = 'BTC' as const");
    expect(publicWorkbench).toContain('selectedSymbol={PUBLIC_FIXED_SYMBOL}');
    expect(publicWorkbench).toContain("lg:grid-cols-[88px_minmax(0,1fr)]");
    expect(publicWorkbench).toContain("lg:grid-cols-[300px_minmax(0,1fr)]");
  });

  it('keeps the decorative neural layer non-interactive and separate from semantic asset colors', () => {
    expect(neural).toContain('pointer-events-none');
    expect(neural).toContain('var(--color-decorative-cyan)');
    expect(neural).toContain('var(--color-decorative-purple)');
    expect(neural).not.toContain('var(--color-asset-crypto)');
    expect(neural).not.toContain('var(--color-score-best)');
  });
});