// ARCH-AUDIT-0002 / P0 remediation: public registry responses are identity/catalog views,
// not a source of trusted financial observations. Bootstrap values in AssetRegistry are useful
// for local catalog/UI initialization but have no per-field provider provenance or observation
// timestamp. They therefore MUST NOT be exposed as verified market data.

import express from 'express';
import { assetRegistry, type RegistryAsset } from '../../lib/assetRegistry';
import { checkAdminAccess } from '../../platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../../platform/Security/types';
import { logSystemEvent } from '../../../server/systemEvents';

export interface AssetUpdatePayload {
  expectedReturn?: number;
  volatility?: number;
  drift?: number;
  price?: number;
  change24h?: number;
  marketCap?: number;
  isLocked?: boolean;
}

/** Filtert den Request-Body auf die zulaessigen, korrekt typisierten Felder. */
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
    // P0: no plausible bootstrap/default financial numbers leave this public catalog route.
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

export const registryRouter = express.Router();

registryRouter.get('/assets', (_req, res) => {
  res.json(assetRegistry.getAssets().map(toPublicAssetView));
});

registryRouter.get('/assets/:symbol', (req, res) => {
  const asset = assetRegistry.getAsset(req.params.symbol);
  if (!asset) {
    return res.status(404).json({ error: 'Asset nicht in der Registry gefunden.' });
  }
  res.json(toPublicAssetView(asset));
});

registryRouter.post('/assets/:symbol', express.json(), async (req, res) => {
  // ADR-0003.5/0008: Asset-Parameter-Aenderungen bleiben IAM-geschuetzt.
  const authz = await checkAdminAccess(req, 'registry:assets:update', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }

  const symbol = req.params.symbol;
  if (!assetRegistry.getAsset(symbol)) {
    return res.status(404).json({ error: 'Asset nicht in der Registry gefunden.' });
  }

  const payload = buildAssetUpdatePayload(req.body);
  assetRegistry.updateAsset(symbol, payload, true);

  logSystemEvent(
    'ORCHESTRATOR',
    'Asset Parameter Update',
    authz.actorLabel,
    `Updated parameters for ${symbol}: Price=${payload.price}, 24h Change=${payload.change24h}%, Volatility=${payload.volatility}, Drift=${payload.drift}, expectedReturn=${payload.expectedReturn}`,
    'SUCCESS'
  );

  // Even after an authenticated manual update the public response does not claim market-data
  // provenance. A future provider ingestion path must attach evidence before these fields can
  // be returned as READY.
  const updated = assetRegistry.getAsset(symbol)!;
  res.json({ success: true, asset: toPublicAssetView(updated) });
});
