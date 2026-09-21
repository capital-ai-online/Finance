import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const readTypeScriptTree = (relativeDir: string): string => {
  const root = path.join(process.cwd(), relativeDir);
  const visit = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return visit(absolute);
      if (!/\.tsx?$/.test(entry.name)) return [];
      return [fs.readFileSync(absolute, 'utf8')];
    });

  return visit(root).join('\n');
};

const tokens = JSON.parse(read('docs/frontend/design-tokens.json'));
const css = read('src/index.css');
const portCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const card = read('src/shared/ui/Card.tsx');
const button = read('src/shared/ui/Button.tsx');
const shell = read('src/app/AppShell.tsx');
const neural = read('src/shared/visuals/NeuralBackground.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const port = readTypeScriptTree('src/features/public/ui/frontend-port');

describe('GOV-CHAT-079 / LF-01 appearance contract', () => {
  it('preserves canonical application design tokens outside the scoped landing port', () => {
    expect(tokens.color.background.value).toBe('#18181B');
    expect(tokens.color.border.value).toBe('rgba(255, 255, 255, 0.08)');
    expect(tokens.color.brand.primary.value).toBe('#F5C453');
    expect(tokens.color.decorative.cyan.value).toBe('#0DDDDD');
    expect(tokens.color.decorative.purple.value).toBe('#B026FF');
    expect(tokens.color.surface.glass.value).toBe('rgba(10, 10, 10, 0.40)');
    expect(tokens.font.sans.value).toContain('Poppins');
    expect(tokens.font.display.value).toContain('Montserrat');
    expect(tokens.font.mono.value).toContain('JetBrains Mono');
    expect(tokens.accessibility.minHitTarget.value).toBe('44px');

    expect(css).toContain('--color-background: #18181B');
    expect(css).toContain('--color-brand-primary: #F5C453');
  });

  it('keeps current financial semantic colors unchanged', () => {
    expect(tokens.color.assetClass.crypto.value).toBe('#8D26FF');
    expect(tokens.color.assetClass.stock.value).toBe('#44DE88');
    expect(tokens.color.assetClass.index.value).toBe('#60A5FA');
    expect(tokens.color.assetClass.forex.value).toBe('#E879F9');
    expect(tokens.color.score.best.value).toBe('#44DE88');
    expect(tokens.color.score.worst.value).toBe('#F87171');
    expect(tokens.color.semantic.info.value).toBe('#22D3EE');
  });

  it('keeps shared presentation primitives unchanged', () => {
    expect(card).toContain("className={clsx('ui-panel', elevated && 'ui-panel--elevated', className)}");
    expect(button).toContain("primary: 'ui-button-primary'");
    expect(button).toContain("secondary: 'ui-button-secondary'");
    expect(shell).toContain('app-shell-frame');
  });

  it('ports the Owner-selected FRONTEND composition into the canonical public landing', () => {
    expect(landing).toContain('ReferenceApp');
    expect(landing).toContain('frontend-reference-design-port');
    expect(landing).toContain("import './frontend-port/frontend-port.css'");

    expect(landing).toContain('data-landing-design-repository="SvenKulessa/FRONTEND"');
    expect(landing).toContain('data-landing-design-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"');
    expect(port).toContain('<Header');
    expect(port).toContain('<Hero');
    expect(port).toContain('<KeyPillars');
    expect(port).toContain('<MarketOverview');
    expect(port).toContain('<CoreModules');
    expect(port).toContain('<Footer');
    expect(port).toContain('<StatusBar');
    expect(port).toContain('<AnalysisModal');
    expect(port).toContain('<ProductTourModal');
    expect(port).toContain('<AssetDetailModal');
    expect(port).toContain('<ModuleDetailModal');
    expect(port).toContain('<AllMarketsModal');
  });

  it('keeps the characteristic reference visual hierarchy and assets', () => {
    expect(port).toContain('Marktdaten');
    expect(port).toContain('verstehen.');
    expect(port).toContain('Chancen besser');
    expect(port).toContain('Globale Märkte im Überblick');
    expect(port).toContain('Enterprise Scorer');
    expect(port).toContain('Buffett Value Check');
    expect(port).toContain('Vocabulary');
    expect(port).toContain('GLOBALE INTELLIGENZ. EINE BESSERE ZUKUNFT.');
    expect(port).toContain("glowing_earth_nodes_1789997454893.jpg");
    expect(port).toContain("capital_ai_brand_emblem_1789997857835.jpg");

    expect(fs.existsSync(path.join(process.cwd(), 'src/features/public/ui/frontend-port/assets/images/capital_ai_brand_emblem_1789997857835.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/features/public/ui/frontend-port/assets/images/capital_ai_full_logo_1789997869885.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/features/public/ui/frontend-port/assets/images/glowing_earth_nodes_1789997454893.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'src/features/public/ui/frontend-port/assets/images/capital_ai_wide_banner_1789999064950.jpg'))).toBe(true);
  });

  it('scopes source-specific presentation rules instead of replacing app-wide tokens', () => {
    expect(portCss).toContain('.capital-ai-frontend-port');
    expect(portCss).toContain("'Plus Jakarta Sans'");
    expect(portCss).toContain('.no-scrollbar');
    expect(portCss).toContain('capitalAiFrontendPortPulseSlow');
    expect(portCss).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps productive runtime outside the pinned visual snapshot', () => {
    expect(landing).toContain('data-landing-design-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"');
    expect(port).not.toContain('fetch(');
    expect(port).not.toContain('/api/');
    expect(port).not.toContain('supabase');
  });

  it('keeps the decorative neural layer non-interactive and separate from semantic asset colors', () => {
    expect(neural).toContain('pointer-events-none');
    expect(neural).toContain('var(--color-decorative-cyan)');
    expect(neural).toContain('var(--color-decorative-purple)');
    expect(neural).not.toContain('var(--color-asset-crypto)');
    expect(neural).not.toContain('var(--color-score-best)');
  });
});
