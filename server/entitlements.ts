import express from 'express';
import { getAssetCatalogEntry } from '../src/lib/assetSearchCatalog';
import {
  SUBSCRIPTION_ENTITLEMENTS,
  getPlanEntitlements,
  type SubscriptionTier,
} from '../src/config/subscriptionEntitlements';
import { enforceBuffettValueCheckQuota } from './quota';

export const entitlementsRouter = express.Router();

entitlementsRouter.get('/plans', (_req, res) => {
  res.json({
    contractVersion: 'subscription-entitlements/1.0.0',
    plans: SUBSCRIPTION_ENTITLEMENTS,
    guest: {
      buffettValueCheck: 'denied',
      rule: 'Guest users have no Warren Buffett Value Check access.',
    },
  });
});

entitlementsRouter.post('/warren-buffett/authorize', express.json(), async (req, res) => {
  const symbol = String(req.body?.symbol || '').toUpperCase().trim();
  if (!symbol) {
    return res.status(400).json({
      allowed: false,
      reason: 'symbol-required',
      contractVersion: 'subscription-entitlements/1.0.0',
    });
  }

  const asset = getAssetCatalogEntry(symbol);
  if (!asset) {
    return res.status(404).json({
      allowed: false,
      symbol,
      reason: 'asset-not-found',
      contractVersion: 'subscription-entitlements/1.0.0',
    });
  }

  // ADR-0034 + ADR-0032 revalidation: Buffett is a stock-only domain consumer.
  // Reject an ineligible catalog asset before quota enforcement so invalid asset classes cannot
  // consume quota or reach downstream verified-display/provider hydration.
  if (asset.type !== 'stock') {
    return res.status(422).json({
      allowed: false,
      symbol,
      assetType: asset.type,
      reason: 'asset-not-eligible',
      contractVersion: 'subscription-entitlements/1.0.0',
      rule: 'Warren Buffett Value Check is available for stocks only.',
    });
  }

  const quota = await enforceBuffettValueCheckQuota(req, symbol);
  const plan = getPlanEntitlements(quota.tier);
  const unlimited = plan.buffettValueCheck === 'unlimited';

  if (!quota.allowed) {
    const status = quota.reason === 'authentication-required' ? 401 : quota.reason === 'quota-limit-reached' ? 429 : 403;
    return res.status(status).json({
      ...quota,
      symbol,
      assetType: asset.type,
      accessMode: unlimited ? 'full' : 'limited',
      contractVersion: 'subscription-entitlements/1.0.0',
      rule: quota.reason === 'authentication-required'
        ? 'Guest users have no Warren Buffett Value Check access.'
        : 'Free and Starter may authorize one asset per rolling 3-day window. Pro and Enterprise have full access.',
    });
  }

  return res.json({
    ...quota,
    symbol,
    assetType: asset.type,
    accessMode: unlimited ? 'full' : 'limited',
    contractVersion: 'subscription-entitlements/1.0.0',
    rule: unlimited
      ? 'Pro and Enterprise have full Warren Buffett Value Check access.'
      : 'Free and Starter may authorize one asset per rolling 3-day window; reopening the same authorized asset remains allowed.',
  });
});

export function publicPlanSummary(tier: SubscriptionTier) {
  const plan = SUBSCRIPTION_ENTITLEMENTS[tier];
  return {
    tier,
    monthlyPriceEur: plan.monthlyPriceEur,
    annualBilling: plan.annualBilling,
    devices: plan.devices,
    verifiedScreening: plan.verifiedScreening,
    backtest: plan.backtest,
    monteCarlo: plan.monteCarlo,
    fullAiAnalysis: plan.fullAiAnalysis,
    realtimeAiNewsfeed: plan.realtimeAiNewsfeed,
    buffettValueCheck: plan.buffettValueCheck,
    pdfComplianceExport: plan.pdfComplianceExport,
  };
}
