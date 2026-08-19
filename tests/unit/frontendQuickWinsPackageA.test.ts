import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const appPath = path.join(process.cwd(), 'src/App.tsx');
const marketScreenerPath = path.join(process.cwd(), 'src/components/MarketScreener.tsx');

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Frontend Quick Wins package A', () => {
  it('keeps Dashboard behind a React lazy/Suspense boundary instead of a static App import', () => {
    const app = readSource(appPath);

    expect(app).not.toContain("import { Dashboard } from './components/Dashboard';");
    expect(app).toContain("React.lazy(() =>");
    expect(app).toContain("import('./components/Dashboard')");
    expect(app).toContain('<React.Suspense');
    expect(app).toContain('Dashboard wird geladen…');
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
});
