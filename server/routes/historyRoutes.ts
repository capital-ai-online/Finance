import express from 'express';
import { randomUUID } from 'node:crypto';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { assetRegistry } from '../../src/lib/assetRegistry';
import { HistoryProviderRegistry } from '../../src/platform/MarketData/HistoryProviderRegistry';
import { MarketDataHistoryGateway } from '../../src/platform/MarketData/MarketDataHistoryGateway';
import { BinanceCryptoBarsProvider } from '../../src/platform/MarketData/providers/BinanceCryptoBarsProvider';
import type { MarketDataBarInterval } from '../../src/platform/MarketData/contracts';

const SUPPORTED_BAR_INTERVALS = new Set<MarketDataBarInterval>(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']);

function createCanonicalHistoryGateway(): MarketDataHistoryGateway {
  const registry = new HistoryProviderRegistry();
  registry.register(new BinanceCryptoBarsProvider());
  return new MarketDataHistoryGateway(registry);
}

const canonicalHistoryGateway = createCanonicalHistoryGateway();

/**
 * Canonical history boundary.
 *
 * `/api/market-data/history/:symbol` is the modern verified history/bars projection and executes
 * through MarketDataHistoryGateway. `/api/backtest-history` remains a compatibility consumer until
 * its scheduled frontend/backtest migration and is not used by the Enterprise Scorer 4h chart.
 */
export function createHistoryRouter(): express.Router {
  const router = express.Router();

  router.get('/api/market-data/history/:symbol', orchestrator.handle('Verified Market Bars'), async (req, res) => {
    const rawSymbol = String(req.params.symbol || '').toUpperCase().trim();
    const requestedInterval = String(req.query.interval || '1d') as MarketDataBarInterval;
    const requestedMaxPoints = Number.parseInt(String(req.query.maxPoints || '90'), 10);
    const asset = assetRegistry.getAsset(rawSymbol);

    if (!rawSymbol || !asset) {
      return res.status(404).json({ status: 'UNAVAILABLE', error: 'Asset is not registered.' });
    }
    if (asset.type !== 'crypto') {
      return res.status(422).json({
        status: 'UNAVAILABLE',
        symbol: rawSymbol,
        assetClass: asset.type,
        error: 'Verified intraday bars are currently enabled only for crypto assets.',
      });
    }
    if (!SUPPORTED_BAR_INTERVALS.has(requestedInterval)) {
      return res.status(400).json({ status: 'INVALID', error: 'Unsupported bar interval.' });
    }
    if (!Number.isInteger(requestedMaxPoints) || requestedMaxPoints < 2 || requestedMaxPoints > 500) {
      return res.status(400).json({ status: 'INVALID', error: 'maxPoints must be an integer between 2 and 500.' });
    }

    const correlationId = String(req.header('x-correlation-id') || randomUUID()).slice(0, 128);
    res.setHeader('x-correlation-id', correlationId);

    const result = await canonicalHistoryGateway.getHistory({
      symbol: rawSymbol,
      assetClass: 'crypto',
      correlationId,
      barInterval: requestedInterval,
      maxPoints: requestedMaxPoints,
      allowedProviderIds: ['binance-spot-bars'],
    });

    const status = result.history.qualityState === 'HISTORICAL' ? 200 : 422;
    return res.status(status).json({
      ...result.history,
      attemptedProviders: result.attemptedProviders,
    });
  });

  router.get('/api/backtest-history', orchestrator.handle('Backtest Download'), async (req, res) => {
    const { symbol, range } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required.' });
    }

    const rawSymbol = String(symbol).toUpperCase().trim();
    let limit = 365;
    if (range === '3Y' || range === '1095') limit = 365 * 3;
    else if (range === '5Y' || range === '1825') limit = 365 * 5;
    else {
      const parsedLimit = parseInt(String(range));
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    try {
      const history = await assetRegistry.getHistory(rawSymbol, limit);
      return res.json({ data: history.points, source: history.source });
    } catch (err: any) {
      console.error('[Backtest Error] Failed to get history from registry:', rawSymbol, err.message || err);
      return res.status(500).json({ error: 'Fehler beim Laden der historischen Daten aus der Asset-Registry.' });
    }
  });

  return router;
}
