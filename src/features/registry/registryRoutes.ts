// Public registry is a catalog view; bootstrap numbers are never exposed as verified market data.

import express from 'express';
import { randomUUID } from 'crypto';
import { assetRegistry, type RegistryAsset } from '../../lib/assetRegistry';
import { checkAdminAccess } from '../../platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../../platform/Security/types';
import {
  generateTraditionalAssetInputs,
  generateTraditionalAssetInputsFromCloses,
  TraditionalAssetScoringService,
} from '../../services/traditionalAssetScoring';
import {
  APPROVED_FRED_SERIES,
  fetchEcbEurReferenceFx,
  fetchFredSeries,
  type ApprovedFredSeriesId,
} from '../../services/macroRateEvidence';
import { logSystemEvent } from '../../../server/systemEvents';
import { ensureFundamentalsFresh, getCachedFundamentals } from '../../../server/stockFundamentals';
import { ensureIndexHistoryFresh, getCachedIndexHistory, INDEX_FMP_TICKERS } from '../../../server/fmpIndices';

export interface AssetUpdatePayload {
  expectedReturn?: number;
  volatility?: number;
  drift?: number;
  price?: number;
  change24h?: number;
  marketCap?: number;
  isLocked?: boolean;
}

interface VerifiedTraditionalEvaluation {
  httpStatus: number;
  payload: Record<string, unknown>;
}

export function buildAssetUpdatePayload(body: any): AssetUpdatePayload {
  return {
    expectedReturn: typeof body?.expectedReturn === 'number' ? body.expectedReturn : undefined,
    volatility: typeof body?.volatility === 'number' ? body.volatility : undefined,
    drift: typeof body?.drift === 'number' ? body.drift : undefined,
    price: typeof body?.price === 'number' ? body.price : undefined,
    change24h: typeof body?.change24h === 'number' ? body.change24h : undefined,
    marketCap: typeof body?.marketCap === 'number' ? body.marketCap : undefined,
    isLocked: typeof body?.isLocked === 'boolean' ? body.isLocked : undefined,
  };
}

function toPublicAssetView(asset: RegistryAsset) {
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    subtype: asset.subtype,
    applicationArea: asset.applicationArea,
    isLocked: asset.isLocked,
    marketDataStatus: 'DATA_UNAVAILABLE' as const,
    scoreStatus: 'SCORE_NOT_COMPUTABLE' as const,
    price: null,
    change24h: null,
    expectedReturn: null,
    volatility: null,
    risk: null,
    marketCap: null,
    volume24h: null,
    score: null,
    pattern: null,
    observedAt: null,
    providers: [],
    evidence: [],
    reason: 'AssetRegistry bootstrap values have no field-level provider provenance and are not exposed as verified market observations.',
  };
}

function resolveCorrelationId(req: express.Request): string {
  const supplied = req.headers['x-correlation-id'];
  if (typeof supplied === 'string' && supplied.trim()) return supplied.trim().slice(0, 128);
  const requestId = (req as express.Request & { requestId?: string }).requestId;
  return requestId || randomUUID();
}

async function evaluateVerifiedTraditionalSymbol(symbolInput: string, correlationId: string): Promise<VerifiedTraditionalEvaluation> {
  const symbol = symbolInput.toUpperCase().trim();
  const asset = assetRegistry.getAsset(symbol);
  if (!asset) {
    return { httpStatus: 404, payload: { correlationId, symbol, status: 'ASSET_NOT_FOUND', score: null } };
  }
  if (asset.type !== 'stock' && asset.type !== 'forex' && asset.type !== 'index') {
    return {
      httpStatus: 400,
      payload: {
        correlationId, symbol, assetType: asset.type, status: 'UNSUPPORTED_ASSET_CLASS', score: null,
        reason: 'Dieser verifizierte Pfad ist ausschließlich für Stock/Forex/Index vorgesehen.',
      },
    };
  }

  try {
    let inputs;
    if (asset.type === 'stock') {
      await ensureFundamentalsFresh(symbol);
      inputs = await generateTraditionalAssetInputs(symbol, 'stock', getCachedFundamentals(symbol));
    } else if (asset.type === 'forex') {
      inputs = await generateTraditionalAssetInputs(symbol, 'forex');
    } else {
      if (!INDEX_FMP_TICKERS[symbol]) {
        return {
          httpStatus: 422,
          payload: {
            correlationId, symbol, assetType: asset.type, status: 'SCORE_NOT_COMPUTABLE', score: null,
            reason: 'Keine verifizierte Index-Historienquelle für dieses Symbol registriert.',
            providers: [], evidenceIds: [], provenance: [], lineage: null,
          },
        };
      }
      await ensureIndexHistoryFresh(symbol);
      const points = getCachedIndexHistory(symbol);
      inputs = generateTraditionalAssetInputsFromCloses(symbol, 'index', points?.map(point => point.close) ?? []);
    }

    const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
    const providers = result.lineage?.providers ?? [];
    const evidenceIds = result.lineage?.evidenceIds ?? [];
    const correlatedLineage = result.lineage ? { ...result.lineage, correlationId } : null;

    if (result.usedFactors.length === 0 || result.provenance.length === 0) {
      return {
        httpStatus: 422,
        payload: {
          correlationId, symbol, assetType: asset.type, status: 'SCORE_NOT_COMPUTABLE', score: null,
          reason: 'Keine ausreichend belegten Scoring-Faktoren verfügbar.',
          providers, evidenceIds, missingFactors: result.missingFactors,
          provenance: result.provenance, lineage: correlatedLineage,
        },
      };
    }

    return {
      httpStatus: 200,
      payload: {
        correlationId, symbol, assetType: asset.type, status: 'READY', score: result.score,
        providers, evidenceIds, usedFactors: result.usedFactors, missingFactors: result.missingFactors,
        reasoning: result.reasoning, provenance: result.provenance, lineage: correlatedLineage,
      },
    };
  } catch (error) {
    return {
      httpStatus: 503,
      payload: {
        correlationId, symbol, assetType: asset.type, status: 'SCORE_NOT_COMPUTABLE', score: null,
        reason: error instanceof Error ? error.message : String(error),
        providers: [], evidenceIds: [], provenance: [], lineage: null,
      },
    };
  }
}

export const registryRouter = express.Router();

registryRouter.get('/assets', (_req, res) => {
  res.json(assetRegistry.getAssets().map(toPublicAssetView));
});

/**
 * Macro/rate evidence boundary. These endpoints expose provenance-rich reference evidence only.
 * They are never execution-price endpoints and they do not create asset scores.
 */
registryRouter.get('/macro/fred/:seriesId', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const seriesId = req.params.seriesId.toUpperCase() as ApprovedFredSeriesId;
  if (!(seriesId in APPROVED_FRED_SERIES)) {
    return res.status(400).json({
      correlationId,
      status: 'SERIES_NOT_APPROVED',
      seriesId,
      approvedSeries: Object.keys(APPROVED_FRED_SERIES),
    });
  }
  try {
    const evidence = await fetchFredSeries(seriesId);
    return res.json({
      correlationId,
      status: 'READY',
      provider: evidence.provider,
      executionPriceEligible: false,
      evidenceIds: evidence.evidenceIds,
      evidence,
    });
  } catch (error) {
    return res.status(503).json({
      correlationId,
      status: 'SOURCE_UNAVAILABLE',
      provider: 'FRED',
      executionPriceEligible: false,
      evidenceIds: [],
      reason: error instanceof Error ? error.message : String(error),
    });
  }
});

registryRouter.get('/macro/ecb/fx/:currency', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  try {
    const evidence = await fetchEcbEurReferenceFx(req.params.currency);
    return res.json({
      correlationId,
      status: 'READY',
      provider: evidence.provider,
      executionPriceEligible: false,
      evidenceIds: evidence.evidenceIds,
      evidence,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const status = reason.includes('not approved') ? 400 : 503;
    return res.status(status).json({
      correlationId,
      status: status === 400 ? 'SERIES_NOT_APPROVED' : 'SOURCE_UNAVAILABLE',
      provider: 'ECB',
      executionPriceEligible: false,
      evidenceIds: [],
      reason,
    });
  }
});

/**
 * Batch boundary for watchlists/server-side screening clients. Every item gets its own child
 * correlation id and the exact same verified provenance/lineage rules as the single endpoint.
 */
registryRouter.get('/assets/verified-scores', async (req, res) => {
  const rootCorrelationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', rootCorrelationId);
  const raw = typeof req.query.symbols === 'string' ? req.query.symbols : '';
  const symbols = [...new Set(raw.split(',').map(item => item.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  if (symbols.length === 0) {
    return res.status(400).json({
      correlationId: rootCorrelationId,
      status: 'INVALID_REQUEST',
      reason: 'Query-Parameter symbols ist erforderlich, z. B. ?symbols=AAPL,EURUSD,GSPC.',
      results: [],
    });
  }

  const results = await Promise.all(symbols.map((symbol) =>
    evaluateVerifiedTraditionalSymbol(symbol, `${rootCorrelationId}:${symbol}`)
  ));
  return res.json({
    correlationId: rootCorrelationId,
    status: 'BATCH_COMPLETE',
    requested: symbols.length,
    ready: results.filter(item => item.httpStatus === 200).length,
    results: results.map(item => ({ httpStatus: item.httpStatus, ...item.payload })),
  });
});

registryRouter.get('/assets/:symbol', (req, res) => {
  const asset = assetRegistry.getAsset(req.params.symbol);
  if (!asset) return res.status(404).json({ error: 'Asset nicht in der Registry gefunden.' });
  res.json(toPublicAssetView(asset));
});

registryRouter.get('/assets/:symbol/verified-score', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const result = await evaluateVerifiedTraditionalSymbol(req.params.symbol, correlationId);
  return res.status(result.httpStatus).json(result.payload);
});

registryRouter.post('/assets/:symbol', express.json(), async (req, res) => {
  const authz = await checkAdminAccess(req, 'registry:assets:update', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }

  const symbol = req.params.symbol;
  if (!assetRegistry.getAsset(symbol)) return res.status(404).json({ error: 'Asset nicht in der Registry gefunden.' });

  const payload = buildAssetUpdatePayload(req.body);
  assetRegistry.updateAsset(symbol, payload, true);

  logSystemEvent(
    'ORCHESTRATOR',
    'Asset Parameter Update',
    authz.actorLabel,
    `Updated parameters for ${symbol}: Price=${payload.price}, 24h Change=${payload.change24h}%, Volatility=${payload.volatility}, Drift=${payload.drift}, expectedReturn=${payload.expectedReturn}`,
    'SUCCESS'
  );

  const updated = assetRegistry.getAsset(symbol)!;
  res.json({ success: true, asset: toPublicAssetView(updated) });
});
