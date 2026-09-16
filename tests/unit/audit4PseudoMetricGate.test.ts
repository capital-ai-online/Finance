import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('ARCH-AUDIT-0004 pseudo-metric regression gate', () => {
  it('keeps production score test events fail-closed', () => {
    const code = read('src/app/dashboard/Dashboard.tsx');
    expect(code).toContain('Synthetic score test events are disabled in production');
    expect(code).not.toContain('7.1 + Math.random() * 2.5');
    expect(code).not.toContain('1.2 + Math.random() * 1.5');
    expect(code).not.toContain('Liquidations-Welle drückt Score');
  });

  it('does not fabricate chart volume or fallback recommendations', () => {
    const code = read('src/components/Charts.tsx');
    expect(code).toContain('keine erfundene Trading-Volume-Evidence');
    expect(code).not.toContain('simulatedVol');
    expect(code).not.toContain('baseVol *');
    expect(code).not.toContain("score: activeSymbol === 'BTC' ? 8.5 : 6.2");
    expect(code).not.toContain("recommendation: activeSymbol === 'BTC'");
  });

  it('keeps previously remediated runtime and market displays evidence-backed', () => {
    const latency = read('src/components/SystemLatencyMonitor.tsx');
    const performance = read('src/components/PerformanceDashboard.tsx');
    const news = read('src/features/news/ui/Newsticker.tsx');

    expect(latency).not.toContain('Math.random');
    expect(performance).not.toContain('Math.random');
    expect(news).not.toContain('Math.random');
    expect(latency).toContain('/api/orchestrator/stats');
    expect(performance).toContain('/api/orchestrator/stats');
    expect(news).toContain('/verified-quote');
  });
});
