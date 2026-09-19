import express from 'express';
import { randomUUID } from 'node:crypto';
import { fetchCryptoExtendedEvidence } from '../../src/services/cryptoExtendedEvidence';
import { resolveCryptoEvidenceIdentity } from '../../src/platform/MarketData/CryptoEvidenceIdentityRegistry';
import { resolveDuneSavedQueriesForSymbol } from '../../src/platform/MarketData/DuneSavedQueryRegistry';
import { assetRegistry } from '../../src/lib/assetRegistry';
import { buildUniversalAssetId } from '../../src/platform/Scoring/UniversalAssetAdapter';
import { buildAltcoinPatternResearchViewEnvelope } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchViewContract';
import { altcoinPatternResearchProjectionStore } from '../../src/platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchProjectionStore';

function normalizeSymbol(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const symbol = value.toUpperCase().trim();
  return /^[A-Z0-9.=-]{1,20}$/.test(symbol) ? symbol : null;
}

function requestCorrelationId(req: express.Request): string {
  const incoming = req.header('x-correlation-id');
  return incoming && incoming.trim() ? incoming.trim().slice(0, 128) : randomUUID();
}

/**
 * Read-only website projection of provider evidence.
 *
 * HTTP clients supply only an asset symbol. Contract/mint identities, DEX chain/address mappings,
 * Binance/Kraken Futures market symbols and Dune query contracts come exclusively from reviewed
 * server-side registries/configuration. This prevents users/models from redirecting provider reads
 * to arbitrary provider identities or query IDs.
 */
export const cryptoEvidenceRouter = express.Router();

cryptoEvidenceRouter.get('/pattern-research/:symbol', (req, res) => {
  const readCorrelationId = requestCorrelationId(req);
  res.setHeader('x-correlation-id', readCorrelationId);
  const symbol = normalizeSymbol(req.params.symbol);

  if (!symbol) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      scoreEligible: false,
      executionEligible: false,
      canonicalScoreImpact: 'NONE',
      reason: 'Ungültiges Krypto-Symbol.',
    });
  }

  const asset = assetRegistry.getAsset(symbol);
  if (!asset || asset.type !== 'crypto') {
    return res.status(404).json({
      status: 'NOT_AVAILABLE',
      symbol,
      scoreEligible: false,
      executionEligible: false,
      canonicalScoreImpact: 'NONE',
      reason: 'Krypto-Asset ist nicht im kanonischen Registry-Scope verfügbar.',
    });
  }

  const assetId = buildUniversalAssetId('crypto', symbol);
  const envelope = buildAltcoinPatternResearchViewEnvelope({
    assetId,
    symbol,
    readCorrelationId,
    lanes: altcoinPatternResearchProjectionStore.readLanes(assetId),
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.json(envelope);
});

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
    const duneQueries = resolveDuneSavedQueriesForSymbol(symbol, process.env).map((query) => ({
      queryId: query.queryId,
      expectedColumns: query.expectedColumns,
      mappings: query.mappings,
    }));
    const result = await fetchCryptoExtendedEvidence({
      symbol,
      goPlusIdentity: identity?.goPlusEvm,
      goPlusSolanaMintAddress: identity?.goPlusSolanaMintAddress,
      dexScreenerIdentity: identity?.dexScreener,
      binanceFuturesSymbol: identity?.binanceFuturesSymbol,
      krakenFuturesSymbol: identity?.krakenFuturesSymbol,
      dune: duneQueries,
      includeDefiLlama: true,
      includeNews: false,
    });
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=30');
    res.setHeader(
      'x-capital-ai-evidence-identity',
      identity || duneQueries.length > 0 ? 'governed' : 'partial-no-identity',
    );
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
