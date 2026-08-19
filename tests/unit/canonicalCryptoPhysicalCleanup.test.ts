import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SC-2 Phase C2b physical Standard-Crypto legacy cleanup', () => {
  const serverSource = fs.readFileSync(path.join(process.cwd(), 'server.application.ts'), 'utf8');

  it('removes direct Standard-Crypto scoring engines and heuristic fallback from the composition root', () => {
    expect(serverSource).not.toContain("from './src/services/cryptoScoringService'");
    expect(serverSource).not.toContain("from './src/services/classification.service'");
    expect(serverSource).not.toContain("from './src/services/scoring.service'");
    expect(serverSource).not.toContain('generateCryptoScores(');
    expect(serverSource).not.toContain('calculateBaseScore(');
    expect(serverSource).not.toContain('calculateDefiScore(');
    expect(serverSource).not.toContain('resolveHeuristicCryptoScore(');
    expect(serverSource).not.toContain('hasFiniteScoreValues(');
  });

  it('keeps Standard-Crypto cold-start fallback behind the canonical dispatcher enrichment boundary', () => {
    expect(serverSource).toContain('isStandardCryptoMarketDataAsset(asset)');
    expect(serverSource).toContain('enrichStandardCryptoWithCanonicalScore(asset)');
    expect(serverSource).toContain('STANDARD_CRYPTO_REQUIRES_CANONICAL_DISPATCHER');
  });

  it('physically removes superseded chart scoring and Standard-Crypto legacy handler bodies', () => {
    expect(serverSource).not.toContain("app.post('/api/charts-scoring'");
    expect(serverSource).not.toContain('CryptoScoringService.generateCryptoInputs');
    expect(serverSource).not.toContain('CryptoScoringService.scoreCrypto');
    expect(serverSource).toContain("status: 'SCORING_BOUNDARY_VIOLATION'");
  });
});
