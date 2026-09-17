import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(process.cwd(), 'server/routes/registerMarketDataAdapters.ts'), 'utf8');

describe('market-data adapter composition contract', () => {
  it('mounts the canonical Alpha Vantage adapter under /api', () => {
    expect(source).toContain("app.use('/api', alphaVantageRouter)");
  });

  it('does not absorb provider implementation or scoring responsibilities', () => {
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('score');
    expect(source).not.toContain('validateRuntimeSecrets');
    expect(source).not.toContain('stripe');
  });
});
