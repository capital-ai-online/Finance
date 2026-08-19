import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const appPath = path.join(process.cwd(), 'src/App.tsx');
const marketScreenerPath = path.join(process.cwd(), 'src/components/MarketScreener.tsx');
const indexCssPath = path.join(process.cwd(), 'src/index.css');
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
const lazyViewFacades = [
  ['BacktestEngine', 'BacktestEngineImpl'],
  ['SentimentDashboard', 'SentimentDashboardImpl'],
  ['AdminPortal', 'AdminPortalImpl'],
] as const;

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Frontend Quick Wins package A', () => {
  it('keeps Dashboard behind a React lazy/Suspense boundary instead of a static App import', () => {
    const app = readSource(appPath);

    expect(app).not.toContain("import { Dashboard } from './components/Dashboard';");
    expect(app).toContain('React.lazy(() =>');
    expect(app).toContain("import('./components/Dashboard')");
    expect(app).toContain('<React.Suspense');
    expect(app).toContain('Dashboard wird geladen…');
  });

  it.each(lazyViewFacades)('keeps %s behind a native dynamic-import boundary', (publicName, implName) => {
    const facadePath = path.join(process.cwd(), `src/components/${publicName}.tsx`);
    const facade = readSource(facadePath);
    const implPath = path.join(process.cwd(), `src/components/${implName}.tsx`);

    expect(fs.existsSync(implPath)).toBe(true);
    expect(facade).toContain('React.lazy(async () =>');
    expect(facade).toContain(`import('./${implName}')`);
    expect(facade).toContain('<React.Suspense');
    expect(facade).toContain('role="status"');
    expect(facade).toContain('aria-live="polite"');
  });

  it('keeps heavy dependencies behind the secondary-view implementation boundaries', () => {
    const backtest = readSource(path.join(process.cwd(), 'src/components/BacktestEngineImpl.tsx'));
    const sentiment = readSource(path.join(process.cwd(), 'src/components/SentimentDashboardImpl.tsx'));
    const admin = readSource(path.join(process.cwd(), 'src/components/AdminPortalImpl.tsx'));

    expect(backtest).toContain("from 'jspdf'");
    expect(backtest).toContain("from 'recharts'");
    expect(sentiment).toContain("from 'recharts'");
    expect(admin).toContain("from './AdminPanel'");
  });

  it('does not reintroduce manual Rollup vendor chunking', () => {
    const viteConfig = readSource(viteConfigPath);

    expect(viteConfig).not.toContain('manualChunks');
  });

  it('uses the Phase-1 layout and 44px hit-target primitives in MarketScreener', () => {
    const screener = readSource(marketScreenerPath);

    expect(screener).toContain('<section className="ui-stack">');
    expect(screener).toContain('<div className="ui-panel">');
    expect(screener).toContain('className="ui-hit');
    expect(screener).toContain('id="market-screener-search"');
    expect(screener).toContain('className="sr-only"');
  });

  it('exposes one visually dominant scan action and an announced error state', () => {
    const screener = readSource(marketScreenerPath);

    expect(screener).toContain('bg-aif-gold-DEFAULT px-5 py-2.5');
    expect(screener).toContain("'Screening starten'");
    expect(screener).toContain('role="alert"');
    expect(screener).toContain('aus dem Screening entfernen');
  });

  it('enforces quieter neural layers and the 44px dashboard jump-target policy globally', () => {
    const css = readSource(indexCssPath);

    expect(css).toContain('nav[aria-label="Sprungnavigation Hauptseite"] > a');
    expect(css).toContain('min-height: var(--ui-hit-min);');
    expect(css).toContain('#root > div.min-h-screen > div.fixed.inset-0.z-0.pointer-events-none.opacity-50');
    expect(css).toContain('#root > main#main-content > div.absolute.inset-0.z-0.opacity-75');
    expect(css).toContain('opacity: 0.4;');
  });
});
