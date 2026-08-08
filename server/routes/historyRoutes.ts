import express from 'express';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { assetRegistry } from '../../src/lib/assetRegistry';

/**
 * Canonical history boundary for registry-backed backtest data.
 *
 * Alpha Vantage quote/history proxy logic remains in the compatibility module
 * for now and will move with the provider-adapter workstream. Keeping that
 * external-provider responsibility separate avoids mixing HTTP composition with
 * provider normalization and preserves the existing rate-limit/error semantics.
 */
export function createHistoryRouter(): express.Router {
  const router = express.Router();

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
      console.error(`[Backtest Error] Failed to get history for ${rawSymbol} from registry:`, err.message || err);
      return res.status(500).json({ error: 'Fehler beim Laden der historischen Daten aus der Asset-Registry.' });
    }
  });

  return router;
}
