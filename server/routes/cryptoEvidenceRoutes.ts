import express from 'express';
import { fetchCryptoExtendedEvidence } from '../../src/services/cryptoExtendedEvidence';

function normalizeSymbol(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const symbol = value.toUpperCase().trim();
  return /^[A-Z0-9.=-]{1,20}$/.test(symbol) ? symbol : null;
}

/**
 * Read-only website projection of provider evidence.
 *
 * The route deliberately accepts only an asset symbol. Contract addresses, protocol identifiers
 * and Dune queries are NOT accepted from HTTP clients; those must come from trusted server-side
 * registries/configuration so a user or model cannot redirect provider evidence to an arbitrary
 * identity/query.
 */
export const cryptoEvidenceRouter = express.Router();

cryptoEvidenceRouter.get('/:symbol', async (req, res) => {
  const symbol = normalizeSymbol(req.params.symbol);
  if (!symbol) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      scoreEligible: false,
      executionEligible: false,
      reason: 'Ungültiges Krypto-Symbol.',
    });
  }

  try {
    const result = await fetchCryptoExtendedEvidence({
      symbol,
      includeDefiLlama: true,
      includeUnlocks: true,
      includeNews: false,
    });
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=30');
    return res.json(result);
  } catch (error) {
    return res.status(503).json({
      status: 'NOT_AVAILABLE',
      symbol,
      scoreEligible: false,
      executionEligible: false,
      authority: 'EVIDENCE_ONLY',
      reason: error instanceof Error ? error.message : String(error),
    });
  }
});
