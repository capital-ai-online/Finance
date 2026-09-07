import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isVerifiedScreeningPath,
  VERIFIED_SCREENING_PATH_PATTERNS,
} from '../../server/middleware/verifiedScreeningEntitlement';

function source(relativePath: string): string {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

describe('FIN-SEC-02 canonical verified-score/context/batch wiring', () => {
  const composition = source('server/routes/registerApplicationRoutes.ts');
  const compatibilityRoutes = source('server/routes/legacyScoringCompatibilityRoutes.ts');

  it('installs one shared path gate in the application route composition', () => {
    expect(composition).toContain("from '../middleware/verifiedScreeningEntitlement'");
    expect(composition).toContain('app.use(verifiedScreeningPathGate)');
    expect(composition.indexOf('app.use(verifiedScreeningPathGate)')).toBeLessThan(
      composition.indexOf('app.use(createLegacyScoringCompatibilityRouter())'),
    );
  });

  it('classifies productive verified-score/context/batch paths and rejects catalog/quote/research alternates', () => {
    expect(VERIFIED_SCREENING_PATH_PATTERNS.length).toBe(7);
    expect(isVerifiedScreeningPath('/api/registry/assets/verified-scores')).toBe(true);
    expect(isVerifiedScreeningPath('/api/registry/assets/AAPL/verified-context')).toBe(true);
    expect(isVerifiedScreeningPath('/api/registry/assets/BTC/verified-score')).toBe(true);
    expect(isVerifiedScreeningPath('/api/raw-materials/verified-score/CMD_GOLD_COMEX')).toBe(true);
    expect(isVerifiedScreeningPath('/api/crypto/list')).toBe(true);
    expect(isVerifiedScreeningPath('/api/crypto/score')).toBe(true);
    expect(isVerifiedScreeningPath('/api/crypto/top10')).toBe(true);

    expect(isVerifiedScreeningPath('/api/registry/assets')).toBe(false);
    expect(isVerifiedScreeningPath('/api/registry/assets/AAPL')).toBe(false);
    expect(isVerifiedScreeningPath('/api/registry/assets/AAPL/verified-quote')).toBe(false);
    expect(isVerifiedScreeningPath('/api/registry/macro/risk-regime')).toBe(false);
    expect(isVerifiedScreeningPath('/api/raw-materials/list')).toBe(false);
    expect(isVerifiedScreeningPath('/api/raw-materials/analyze')).toBe(false);
    expect(isVerifiedScreeningPath('/api/crypto/analyze')).toBe(false);
    expect(isVerifiedScreeningPath('/api/crypto-scoring/BTC')).toBe(false);
    expect(isVerifiedScreeningPath('/api/charts-scoring')).toBe(false);
  });

  it('keeps the legacy crypto-scoring compatibility path on the same quota authority without a second gate', () => {
    expect(compatibilityRoutes).toContain('enforceScreeningQuota');
    expect(compatibilityRoutes).toContain("router.get('/api/crypto-scoring/:symbol'");
    expect(compatibilityRoutes).toContain("router.post('/api/crypto-scoring/:symbol'");
    expect(isVerifiedScreeningPath('/api/crypto-scoring/ETH')).toBe(false);
  });
});
