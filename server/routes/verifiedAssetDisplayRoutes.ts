import express from 'express';
import { getVerifiedAssetDisplay } from '../../src/services/verifiedAssetDisplay';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';

export const verifiedAssetDisplayRouter = express.Router();

/**
 * Progressive display hydration only. No full-catalog batch endpoint is exposed here by design:
 * provider calls are scoped to the currently viewed asset to preserve provider quotas and avoid
 * the eager enrichment storm observed in production.
 */
verifiedAssetDisplayRouter.get('/assets/:symbol/verified-display', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`verified-asset-display:${ip}`, 30, 60_000)) {
    return res.status(429).json({
      contractVersion: 'verified-asset-display/1.0.0',
      status: 'RATE_LIMITED',
      symbol: req.params.symbol.toUpperCase().trim(),
      reason: 'Zu viele Marktwert-Aktualisierungen. Werte werden progressiv pro ausgewähltem Asset geladen.',
    });
  }

  try {
    const result = await getVerifiedAssetDisplay(req.params.symbol);
    if (!result) {
      return res.status(404).json({
        contractVersion: 'verified-asset-display/1.0.0',
        status: 'ASSET_NOT_FOUND',
        symbol: req.params.symbol.toUpperCase().trim(),
      });
    }
    // PARTIAL/SOURCE_UNAVAILABLE are valid evidence states, not transport failures. Keeping HTTP
    // 200 lets the UI render the field-level state without converting provider gaps into 5xx noise.
    return res.json(result);
  } catch (error) {
    return res.status(503).json({
      contractVersion: 'verified-asset-display/1.0.0',
      status: 'SOURCE_UNAVAILABLE',
      symbol: req.params.symbol.toUpperCase().trim(),
      reason: error instanceof Error ? error.message : String(error),
    });
  }
});
