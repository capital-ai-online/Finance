import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('ADR-0014 phase 3.2 domain boundaries', () => {
  it('keeps documentation extraction read-only under R-002', () => {
    const source = read('server/routes/documentationRoutes.ts');
    expect(source).toContain("router.get('/api/docs-file'");
    expect(source).not.toContain("router.post('/api/docs-file'");
    expect(source).not.toContain('writeFileSync');
    expect(source).not.toContain('mkdirSync');
  });

  it('preserves registry-backed backtest history semantics', () => {
    const source = read('server/routes/historyRoutes.ts');
    expect(source).toContain("router.get('/api/backtest-history'");
    expect(source).toContain("orchestrator.handle('Backtest Download')");
    expect(source).toContain('assetRegistry.getHistory(rawSymbol, limit)');
    expect(source).toContain("range === '3Y'");
    expect(source).toContain("range === '5Y'");
    expect(source).toContain('source: history.source');
  });

  it('records the remaining compatibility write gap until a dedicated retirement change', () => {
    const compatibility = read('server.application.ts');
    expect(compatibility).toContain("app.post('/api/docs-file'");
    expect(compatibility).toContain('fs.writeFileSync');
  });
});
