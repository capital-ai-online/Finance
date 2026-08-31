import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const adapterSource = fs.readFileSync(path.join(process.cwd(), 'server/routes/registerMarketDataAdapters.ts'), 'utf8');
const applicationRoutesSource = fs.readFileSync(path.join(process.cwd(), 'server/routes/registerApplicationRoutes.ts'), 'utf8');
const serverSource = fs.readFileSync(path.join(process.cwd(), 'server.application.ts'), 'utf8');

describe('market-data adapter composition contract', () => {
  it('mounts the canonical Alpha Vantage adapter under /api', () => {
    expect(adapterSource).toContain("app.use('/api', alphaVantageRouter)");
  });

  it('wires the market-data adapters into the actual production route composition', () => {
    expect(applicationRoutesSource).toContain("import { registerMarketDataAdapters } from './registerMarketDataAdapters'");
    expect(applicationRoutesSource).toContain('registerMarketDataAdapters(app)');
    expect(serverSource).toContain('registerApplicationRoutes(app, { ai, anthropic, openai })');
  });

  it('gives the canonical adapter precedence over the later inline compatibility residue', () => {
    const productionComposition = serverSource.indexOf('registerApplicationRoutes(app, { ai, anthropic, openai })');
    const legacyInlineRoute = serverSource.indexOf("app.get('/api/alpha-vantage-quote'");

    expect(productionComposition).toBeGreaterThanOrEqual(0);
    expect(legacyInlineRoute).toBeGreaterThan(productionComposition);
  });

  it('does not absorb provider implementation or scoring responsibilities', () => {
    expect(adapterSource).not.toContain('fetch(');
    expect(adapterSource).not.toContain('score');
    expect(adapterSource).not.toContain('validateRuntimeSecrets');
    expect(adapterSource).not.toContain('stripe');
  });
});
