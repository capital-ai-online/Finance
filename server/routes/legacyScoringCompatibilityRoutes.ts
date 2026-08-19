import express from 'express';
import { dispatchCanonicalScore, type ScoringModelDescriptor } from '../../src/platform/Scoring';
import { enforceScreeningQuota } from '../quota';

const MEME_COIN_SYMBOLS = new Set(['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME']);

function isMemeCoin(symbol: string): boolean {
  return MEME_COIN_SYMBOLS.has(symbol.toUpperCase().trim());
}

function modelRegistryView(model: ScoringModelDescriptor) {
  return {
    registryVersion: model.registryVersion,
    modelId: model.modelId,
    version: model.version,
    alias: model.alias,
    lifecycle: model.lifecycle,
    executorKey: model.executorKey,
    featureContractVersion: model.featureContractVersion,
    resultContractVersion: model.resultContractVersion,
    evidencePolicy: model.evidencePolicy,
  };
}

async function respondWithCanonicalCryptoScore(
  req: express.Request,
  res: express.Response,
): Promise<express.Response> {
  const quota = await enforceScreeningQuota(req);
  if (!quota.allowed) {
    return res.status(429).json({
      error: 'Tägliches Screening-Limit erreicht. Upgrade auf PRO für unbegrenzte Screenings.',
      reason: quota.reason,
    });
  }

  const symbol = String(req.params.symbol || '').toUpperCase().trim();
  const meme = isMemeCoin(symbol);
  const dispatch = await dispatchCanonicalScore({
    symbol,
    assetClass: 'crypto',
    subtype: meme ? 'memecoin' : undefined,
    source: 'request',
  });

  if (dispatch.status !== 'DISPATCHED') {
    return res.status(422).json({
      symbol,
      isMemeCoin: meme,
      scoreBasis: 'unavailable',
      scoreEligible: false,
      assetId: dispatch.asset.assetId,
      modelRegistry: dispatch.model ? modelRegistryView(dispatch.model) : null,
      ...dispatch.canonical,
      reason: dispatch.reason,
    });
  }

  const { canonical, assessment, model, asset } = dispatch;
  if (canonical.status !== 'READY' || !assessment.analysis) {
    return res.status(422).json({
      symbol,
      isMemeCoin: meme,
      scoreBasis: 'unavailable',
      scoreEligible: false,
      assetId: asset.assetId,
      modelRegistry: modelRegistryView(model),
      inputs: assessment.inputs,
      result: null,
      provenance: assessment.fieldProvenance,
      providerState: assessment.providerState,
      ...canonical,
    });
  }

  return res.json({
    symbol,
    isMemeCoin: meme,
    scoreBasis: 'canonical-dispatcher',
    scoreEligible: true,
    assetId: asset.assetId,
    modelRegistry: modelRegistryView(model),
    inputs: assessment.inputs,
    result: assessment.analysis,
    provenance: assessment.fieldProvenance,
    providerState: assessment.providerState,
    ...canonical,
  });
}

/**
 * SC-2 Phase C3 compatibility boundary.
 *
 * All Crypto requests, including Meme-Crypto, terminate here and execute only through the
 * canonical ScoringDispatcher. The historical server.application.ts MemeCoinScoringService
 * handlers remain shadowed compatibility dead code until a later composition-root deletion pass.
 */
export function createLegacyScoringCompatibilityRouter(): express.Router {
  const router = express.Router();

  router.get('/api/crypto-scoring/:symbol', async (req, res) => {
    try {
      return await respondWithCanonicalCryptoScore(req, res);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Canonical scoring failed.' });
    }
  });

  router.post('/api/crypto-scoring/:symbol', express.json(), async (req, res) => {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    const customInputs = req.body && typeof req.body === 'object' ? req.body : {};
    if (Object.keys(customInputs).length > 0) {
      return res.status(422).json({
        symbol,
        status: 'CUSTOM_SCORING_INPUTS_DISABLED',
        scoreEligible: false,
        error: 'Caller-provided scoring inputs are not accepted by the canonical Crypto scoring path.',
        canonicalEndpoint: '/api/crypto/score',
      });
    }

    try {
      return await respondWithCanonicalCryptoScore(req, res);
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Canonical scoring failed.' });
    }
  });

  // Historical chart scoring is retained only as an explicit what-if visualization.
  // It is not model-registry-authorized, is never scoreEligible and must not feed ranking,
  // eligibility, snapshots or alerts. The legacy response key `score` is preserved for the
  // existing Charts UI, but its semantics are declared unambiguously as simulation-only.
  router.post('/api/charts-scoring', express.json(), (req, res) => {
    const { symbol, rsi, sma, ema } = req.body || {};
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required.' });
    }

    const rawSymbol = String(symbol).toUpperCase().trim();
    const rsiVal = typeof rsi === 'number' && Number.isFinite(rsi) ? rsi : 50;

    let rsiSignal = 'Neutral (Mittelmaß)';
    if (rsiVal > 70) rsiSignal = 'Überkauft (Bärisches Warnsignal)';
    else if (rsiVal < 30) rsiSignal = 'Überverkauft (Bullisches Akkumulationssignal)';

    let maSignal = 'Neutral';
    if (typeof ema === 'number' && typeof sma === 'number') {
      maSignal = ema > sma ? 'Golden Cross (Bullisch)' : 'Death Cross (Bärisch)';
    }

    const rsiFactor = (100 - rsiVal) / 100;
    let calculatedScore = 2.0 + rsiFactor * 6.0;
    if (typeof ema === 'number' && typeof sma === 'number') {
      calculatedScore += ema > sma ? 1.5 : -1.5;
    }
    const simulationScore = Math.max(1.0, Math.min(10.0, Number(calculatedScore.toFixed(1))));

    let recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' = 'HOLD';
    if (simulationScore >= 8.0) recommendation = 'STRONG BUY';
    else if (simulationScore >= 6.0) recommendation = 'BUY';
    else if (simulationScore >= 4.0) recommendation = 'HOLD';
    else if (simulationScore >= 2.5) recommendation = 'SELL';
    else recommendation = 'STRONG SELL';

    const summary = `Nicht-produktive Chart-Simulation für ${rawSymbol}. Der Wert ${simulationScore.toFixed(1)} basiert ausschließlich auf caller-seitigen RSI/SMA/EMA-Indikatoren und ist nicht für Ranking, Eligibility, Alerts oder persistente Score-Evidence zugelassen.`;

    res.setHeader('x-capital-ai-score-authority', 'simulation-only');
    return res.json({
      symbol: rawSymbol,
      mode: 'simulation-only',
      scoreEligible: false,
      productionScoring: false,
      scoreSemantics: 'NON_PRODUCTION_SIMULATION',
      score: simulationScore,
      simulationScore,
      recommendation,
      rsiSignal,
      maSignal,
      summary,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
