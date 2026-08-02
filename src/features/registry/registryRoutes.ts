// Public registry is a catalog view; bootstrap numbers are never exposed as verified market data.

import express from 'express';
import { randomUUID } from 'crypto';
import { assetRegistry } from '../../lib/assetRegistry';
import {
  getAssetCatalogEntry,
  getAssetCatalogIntegrity,
  getAssetClassCounts,
  getAssetSearchCatalog,
} from '../../lib/assetSearchCatalog';
import type { AssetCatalogEntry } from '../../services/assetCatalogIntegrity';
import { checkAdminAccess } from '../../platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../../platform/Security/types';
import {
  generateTraditionalAssetInputs,
  TraditionalAssetScoringService,
} from '../../services/traditionalAssetScoring';
import {
  APPROVED_FRED_SERIES,
  fetchEcbEurReferenceFx,
  fetchFredSeries,
  type ApprovedFredSeriesId,
} from '../../services/macroRateEvidence';
import { buildMacroRiskRegime } from '../../services/macroRiskRegime';
import { buildCrossAssetRiskContext, type CrossAssetClass } from '../../services/crossAssetRiskContext';
import { fetchVerifiedTraditionalQuote } from '../../services/traditionalQuoteEvidence';
import { decorateScreeningBatchWithGovernance, type ScreeningBatchItem } from '../../services/screeningBatchGovernance';
import { getMarketDataProviderTelemetry } from '../../services/marketDataProviderRouter';
import { getScreeningSloSinkStatus, persistScreeningSloEvidence } from '../../services/screeningSloSink';
import { getAllIndexProviderMappings } from '../../services/indexProviderMapping';
import { buildIndexScoringInputsFromEvidence, getVerifiedIndexHistory } from '../../services/indexMarketEvidence';
import { getTwelveDataCommodityEvidence } from '../../services/commodityMarketEvidence';
import { scoreCommodityMarketEvidence } from '../../services/commodityEvidenceScoring';
import { resolveSovereignBondProviderMapping } from '../../services/sovereignBondProviderMapping';
import { getEodhdBondEvidence } from '../../services/eodhdBondEvidence';
import { scoreSovereignBenchmarkEvidence } from '../../services/sovereignBenchmarkEvidenceScoring';
import { logSystemEvent } from '../../../server/systemEvents';
import { ensureFundamentalsFresh, getCachedFundamentals } from '../../../server/stockFundamentals';

export interface AssetUpdatePayload {
  expectedReturn?: number;
  volatility?: number;
  drift?: number;
  price?: number;
  change24h?: number;
  marketCap?: number;
  isLocked?: boolean;
}

interface VerifiedCatalogEvaluation {
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

function toPublicAssetView(asset: AssetCatalogEntry) {
  const legacy = assetRegistry.getAsset(asset.symbol);
  return {
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    subtype: asset.subtype,
    aliases: asset.aliases ?? [],
    origin: asset.origin,
    catalogSource: asset.catalogSource,
    instrumentKind: asset.instrumentKind,
    screeningContract: asset.screeningContract,
    evidenceScoringContract: asset.evidenceScoringContract ?? null,
    providerMappingContract: asset.providerMappingContract ?? null,
    applicationArea: legacy?.applicationArea,
    isLocked: legacy?.isLocked,
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
    reason: asset.origin === 'catalog-expansion'
      ? 'Catalog metadata only. A market value or score becomes READY only after the approved provider, mapping, evidence and provenance gates succeed.'
      : 'AssetRegistry bootstrap values have no field-level provider provenance and are not exposed as verified market observations.',
  };
}

function resolveCorrelationId(req: express.Request): string {
  const supplied = req.headers['x-correlation-id'];
  if (typeof supplied === 'string' && supplied.trim()) return supplied.trim().slice(0, 128);
  const requestId = (req as express.Request & { requestId?: string }).requestId;
  return requestId || randomUUID();
}

function latestObservedAt(payload: Record<string, unknown>): string | null {
  const provenance = Array.isArray(payload.provenance) ? payload.provenance as Array<Record<string, unknown>> : [];
  const timestamps = provenance
    .map(item => typeof item.observedAt === 'string' ? item.observedAt : null)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return timestamps[0] ?? null;
}

function canonicalEvidencePayload(input: {
  correlationId: string;
  symbol: string;
  assetType: 'commodity' | 'bond';
  result: ReturnType<typeof scoreCommodityMarketEvidence> | ReturnType<typeof scoreSovereignBenchmarkEvidence>;
  lineageExtra?: Record<string, unknown>;
}): VerifiedCatalogEvaluation {
  const canonical = input.result.canonical;
  const ready = canonical.status === 'READY';
  return {
    httpStatus: ready ? 200 : 422,
    payload: {
      correlationId: input.correlationId,
      symbol: input.symbol,
      assetType: input.assetType,
      status: canonical.status,
      score: canonical.final_score,
      score10: canonical.score,
      scoreSemantic: input.result.scoreSemantic,
      contractVersion: input.result.contractVersion,
      contractStatus: input.result.contractStatus,
      providers: input.result.providers,
      evidenceIds: input.result.evidenceIds,
      usedFactors: input.result.usedFactors,
      missingFactors: input.result.missingFactors,
      factors: input.result.factors,
      reasoning: input.result.reasoning,
      integrity: canonical.integrity,
      provenance: canonical.integrity.evidence,
      lineage: {
        correlationId: input.correlationId,
        assetId: input.symbol,
        assetClass: input.assetType,
        providers: input.result.providers,
        evidenceIds: input.result.evidenceIds,
        scoringVersion: input.result.contractVersion,
        generatedAt: new Date().toISOString(),
        ...input.lineageExtra,
      },
    },
  };
}

async function evaluateVerifiedCatalogSymbol(symbolInput: string, correlationId: string): Promise<VerifiedCatalogEvaluation> {
  const symbol = symbolInput.toUpperCase().trim();
  const asset = getAssetCatalogEntry(symbol);
  if (!asset) {
    return { httpStatus: 404, payload: { correlationId, symbol, status: 'ASSET_NOT_FOUND', score: null } };
  }

  try {
    if (asset.type === 'commodity') {
      const evidence = await getTwelveDataCommodityEvidence(symbol, 90);
      const result = scoreCommodityMarketEvidence(evidence);
      return canonicalEvidencePayload({
        correlationId,
        symbol,
        assetType: 'commodity',
        result,
        lineageExtra: {
          marketEvidenceVersion: evidence.version,
          providerSymbol: evidence.providerSymbol,
          providerName: evidence.providerName,
        },
      });
    }

    if (asset.type === 'bond') {
      const mapping = await resolveSovereignBondProviderMapping(symbol);
      if (!mapping) {
        return {
          httpStatus: 422,
          payload: {
            correlationId,
            symbol,
            assetType: 'bond',
            status: 'SCORE_NOT_COMPUTABLE',
            score: null,
            providers: [],
            evidenceIds: [],
            provenance: [],
            lineage: null,
            reason: 'Kein explizit freigegebenes oder durch den EODHD-GBOND-Katalog bestätigtes Sovereign-Benchmark-Mapping vorhanden. Einzelanleihen bleiben nach ADR-0022 gesperrt.',
          },
        };
      }
      const evidence = await getEodhdBondEvidence(mapping.providerSymbol, 90);
      const result = scoreSovereignBenchmarkEvidence(symbol, evidence);
      return canonicalEvidencePayload({
        correlationId,
        symbol,
        assetType: 'bond',
        result,
        lineageExtra: {
          providerMappingVersion: mapping.version,
          providerMappingMode: mapping.mappingMode,
          providerSymbol: mapping.providerSymbol,
          individualBondScoringEligible: false,
        },
      });
    }

    if (asset.type !== 'stock' && asset.type !== 'forex' && asset.type !== 'index') {
      return {
        httpStatus: 400,
        payload: {
          correlationId, symbol, assetType: asset.type, status: 'UNSUPPORTED_ASSET_CLASS', score: null,
          reason: 'Für diese Assetklasse ist kein freigegebener Evidence-Scoring-Contract aktiv.',
        },
      };
    }

    let inputs;
    if (asset.type === 'stock') {
      await ensureFundamentalsFresh(symbol);
      inputs = await generateTraditionalAssetInputs(symbol, 'stock', getCachedFundamentals(symbol));
    } else if (asset.type === 'forex') {
      inputs = await generateTraditionalAssetInputs(symbol, 'forex');
    } else {
      const evidence = await getVerifiedIndexHistory(symbol, 45);
      if (!evidence) {
        return {
          httpStatus: 422,
          payload: {
            correlationId,
            symbol,
            assetType: 'index',
            status: 'SCORE_NOT_COMPUTABLE',
            score: null,
            reason: 'Weder das freigegebene FMP-Mapping noch ein durch Provider-Metadaten verifiziertes Twelve-Data-Mapping lieferte ausreichende reale Index-Historie.',
            providers: [],
            evidenceIds: [],
            provenance: [],
            lineage: null,
          },
        };
      }
      inputs = buildIndexScoringInputsFromEvidence(evidence);
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
  res.json(getAssetSearchCatalog().map(toPublicAssetView));
});

registryRouter.get('/assets/catalog-integrity', (_req, res) => {
  const integrity = getAssetCatalogIntegrity();
  return res.status(integrity.status === 'READY' ? 200 : 503).json({
    ...integrity,
    counts: getAssetClassCounts(),
    marketDataPolicy: 'Catalog presence never implies verified price, score or screening eligibility.',
  });
});

registryRouter.get('/assets/index-provider-mappings', (_req, res) => {
  const mappings = getAllIndexProviderMappings();
  return res.json({
    contractVersion: 'index-provider-mapping/1.0.0',
    count: mappings.length,
    policy: 'FMP static mappings retain first priority; TwelveData candidates require runtime provider-identity verification before evidence is accepted.',
    mappings,
  });
});

registryRouter.get('/macro/fred/:seriesId', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const seriesId = req.params.seriesId.toUpperCase() as ApprovedFredSeriesId;
  if (!(seriesId in APPROVED_FRED_SERIES)) {
    return res.status(400).json({ correlationId, status: 'SERIES_NOT_APPROVED', seriesId, approvedSeries: Object.keys(APPROVED_FRED_SERIES) });
  }
  try {
    const evidence = await fetchFredSeries(seriesId);
    return res.json({ correlationId, status: 'READY', provider: evidence.provider, executionPriceEligible: false, evidenceIds: evidence.evidenceIds, evidence });
  } catch (error) {
    return res.status(503).json({ correlationId, status: 'SOURCE_UNAVAILABLE', provider: 'FRED', executionPriceEligible: false, evidenceIds: [], reason: error instanceof Error ? error.message : String(error) });
  }
});

registryRouter.get('/macro/ecb/fx/:currency', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  try {
    const evidence = await fetchEcbEurReferenceFx(req.params.currency);
    return res.json({ correlationId, status: 'READY', provider: evidence.provider, executionPriceEligible: false, evidenceIds: evidence.evidenceIds, evidence });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const status = reason.includes('not approved') ? 400 : 503;
    return res.status(status).json({ correlationId, status: status === 400 ? 'SERIES_NOT_APPROVED' : 'SOURCE_UNAVAILABLE', provider: 'ECB', executionPriceEligible: false, evidenceIds: [], reason });
  }
});

registryRouter.get('/macro/risk-regime', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const evidence = await buildMacroRiskRegime();
  return res.status(evidence.status === 'READY' ? 200 : 422).json({ correlationId, ...evidence });
});

registryRouter.get('/macro/cross-asset/:assetClass', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const assetClass = req.params.assetClass.toLowerCase() as CrossAssetClass;
  const allowed: CrossAssetClass[] = ['stock', 'forex', 'index', 'crypto', 'bond'];
  if (!allowed.includes(assetClass)) {
    return res.status(400).json({ correlationId, status: 'UNSUPPORTED_ASSET_CLASS', supportedAssetClasses: allowed, scoreImpactEnabled: false, recommendationEligible: false });
  }
  const context = await buildCrossAssetRiskContext(assetClass);
  return res.status(context.status === 'READY' ? 200 : 422).json({ correlationId, ...context });
});

registryRouter.get('/assets/verified-scores', async (req, res) => {
  const rootCorrelationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', rootCorrelationId);
  const raw = typeof req.query.symbols === 'string' ? req.query.symbols : '';
  const symbols = [...new Set(raw.split(',').map(item => item.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  if (symbols.length === 0) {
    return res.status(400).json({ correlationId: rootCorrelationId, status: 'INVALID_REQUEST', reason: 'Query-Parameter symbols ist erforderlich, z. B. ?symbols=AAPL,EURUSD,GSPC,CMD_GOLD_COMEX,GB_US_10Y.', results: [] });
  }

  const evaluations = await Promise.all(symbols.map(symbol => evaluateVerifiedCatalogSymbol(symbol, `${rootCorrelationId}:${symbol}`)));
  const items: ScreeningBatchItem[] = evaluations.map(item => ({
    httpStatus: item.httpStatus,
    ...item.payload,
    correlationId: typeof item.payload.correlationId === 'string' ? item.payload.correlationId : rootCorrelationId,
    observedAt: latestObservedAt(item.payload),
  }));
  const governed = decorateScreeningBatchWithGovernance(items, getMarketDataProviderTelemetry());
  const persistence = await Promise.all(governed.results.map(async item => ({
    correlationId: item.correlationId,
    result: await persistScreeningSloEvidence(item.screeningSloEvidence),
  })));
  const persistenceByCorrelationId = new Map(persistence.map(entry => [entry.correlationId, entry.result]));
  const results = governed.results.map(item => ({
    ...item,
    sloPersistence: persistenceByCorrelationId.get(item.correlationId) ?? null,
  }));

  return res.json({
    correlationId: rootCorrelationId,
    status: 'BATCH_COMPLETE',
    requested: symbols.length,
    ready: evaluations.filter(item => item.httpStatus === 200).length,
    eligible: governed.eligible,
    eligibilityContractVersion: 'screening-eligibility/1.0.0',
    screeningOperationsContractVersion: governed.screeningOperationsContractVersion,
    screeningSloEvidenceContractVersion: governed.screeningSloEvidenceContractVersion,
    providerSlaState: governed.providerSlaState,
    sloSink: getScreeningSloSinkStatus(),
    results,
  });
});

registryRouter.get('/assets/:symbol/verified-context', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const symbol = req.params.symbol.toUpperCase().trim();
  const asset = getAssetCatalogEntry(symbol);
  if (!asset) return res.status(404).json({ correlationId, symbol, status: 'ASSET_NOT_FOUND' });

  const scoreResultPromise = evaluateVerifiedCatalogSymbol(symbol, `${correlationId}:score`);
  const macroPromise = asset.type === 'commodity'
    ? Promise.resolve(null)
    : (['stock', 'forex', 'index', 'bond'] as string[]).includes(asset.type)
      ? buildCrossAssetRiskContext(asset.type as CrossAssetClass)
      : Promise.resolve(null);
  const [scoreResult, macroContext] = await Promise.all([scoreResultPromise, macroPromise]);

  return res.status(scoreResult.httpStatus === 200 ? 200 : 422).json({
    correlationId,
    symbol,
    assetType: asset.type,
    status: scoreResult.httpStatus === 200 ? 'READY' : 'PARTIAL',
    scoreContext: scoreResult.payload,
    macroContext,
    integrationPolicy: {
      scoreImpactEnabled: false,
      recommendationEligible: false,
      rule: 'Kanonischer Evidence-Score und Macro Context bleiben getrennte Lineage-Verträge und werden nicht automatisch miteinander verrechnet.',
    },
  });
});

registryRouter.get('/assets/:symbol/verified-quote', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const symbol = req.params.symbol.toUpperCase().trim();
  const asset = getAssetCatalogEntry(symbol);
  if (!asset) return res.status(404).json({ correlationId, symbol, status: 'ASSET_NOT_FOUND' });
  if (asset.type !== 'stock' && asset.type !== 'forex' && asset.type !== 'index') {
    return res.status(400).json({
      correlationId,
      symbol,
      assetType: asset.type,
      status: 'UNSUPPORTED_ASSET_CLASS',
      price: null,
      alertEligible: false,
      reason: 'Commodity- und Sovereign-Benchmark-Contracts verwenden Research-/History-Evidence und stellen keinen Execution-Quote-Contract dar.',
    });
  }
  const quote = await fetchVerifiedTraditionalQuote(symbol, asset.type);
  return res.status(quote.status === 'READY' ? 200 : 422).json({ correlationId, ...quote });
});

registryRouter.get('/assets/:symbol', (req, res) => {
  const asset = getAssetCatalogEntry(req.params.symbol);
  if (!asset) return res.status(404).json({ error: 'Asset nicht im Asset-Katalog gefunden.' });
  res.json(toPublicAssetView(asset));
});

registryRouter.get('/assets/:symbol/verified-score', async (req, res) => {
  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);
  const result = await evaluateVerifiedCatalogSymbol(req.params.symbol, correlationId);
  return res.status(result.httpStatus).json(result.payload);
});

registryRouter.post('/assets/:symbol', express.json(), async (req, res) => {
  const authz = await checkAdminAccess(req, 'registry:assets:update', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  const symbol = req.params.symbol.toUpperCase().trim();
  const catalogAsset = getAssetCatalogEntry(symbol);
  if (!catalogAsset) return res.status(404).json({ error: 'Asset nicht im Asset-Katalog gefunden.' });
  if (!assetRegistry.getAsset(symbol)) {
    return res.status(409).json({
      error: 'CATALOG_ONLY_ASSET',
      reason: 'Katalog-only Assets besitzen keine vertrauenswürdigen Bootstrap-Marktdaten und dürfen nicht über den Legacy-Parameterpfad mit manuellen Finanzwerten angereichert werden.',
    });
  }
  const payload = buildAssetUpdatePayload(req.body);
  assetRegistry.updateAsset(symbol, payload, true);
  logSystemEvent('ORCHESTRATOR', 'Asset Parameter Update', authz.actorLabel, `Updated parameters for ${symbol}: Price=${payload.price}, 24h Change=${payload.change24h}%, Volatility=${payload.volatility}, Drift=${payload.drift}, expectedReturn=${payload.expectedReturn}`, 'SUCCESS');
  res.json({ success: true, asset: toPublicAssetView(catalogAsset) });
});
