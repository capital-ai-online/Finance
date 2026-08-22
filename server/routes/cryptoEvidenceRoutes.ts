import express from 'express';
import { fetchCryptoExtendedEvidence } from '../../src/services/cryptoExtendedEvidence';
import { resolveCryptoEvidenceIdentity } from '../../src/platform/MarketData/CryptoEvidenceIdentityRegistry';

function normalizeSymbol(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const symbol = value.toUpperCase().trim();
  return /^[A-Z0-9.=-]{1,20}$/.test(symbol) ? symbol : null;
}

/**
 * Read-only website projection of provider evidence.
 *
 * HTTP clients supply only an asset symbol. Contract/mint identities, DEX chain/address mappings,
 * Binance/Kraken Futures market symbols and Dune queries come exclusively from the reviewed
 * server-side registry. This prevents users/models from redirecting provider reads to arbitrary
 * provider identities or query IDs.
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
    const identity = resolveCryptoEvidenceIdentity(symbol);
    const result = await fetchCryptoExtendedEvidence({
      symbol,
      goPlusIdentity: identity?.goPlusEvm,
      goPlusSolanaMintAddress: identity?.goPlusSolanaMintAddress,
      dexScreenerIdentity: identity?.dexScreener,
      binanceFuturesSymbol: identity?.binanceFuturesSymbol,
      krakenFuturesSymbol: identity?.krakenFuturesSymbol,
      dune: identity?.dune,
      includeDefiLlama: true,
      includeNews: false,
    });
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=30');
    res.setHeader('x-capital-ai-evidence-identity', identity ? 'governed' : 'partial-no-identity');
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
