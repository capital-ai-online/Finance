// ARCH-AUDIT-0002 (H5, Kapitel 14.5): zweiter Schritt der Zerlegung von server.ts entlang
// der Fachdomaenen nach src/features/ (siehe src/features/news/newsRoutes.ts fuer den
// ersten Schritt und die Begruendung der Zielstruktur). Verhalten 1:1 aus server.ts
// uebernommen, keine funktionale Aenderung - lediglich buildAssetUpdatePayload() neu als
// eigenstaendige, testbare Funktion herausgezogen (war zuvor inline im Route-Handler).

import express from 'express';
import { assetRegistry } from '../../lib/assetRegistry';
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

/** Filtert den Request-Body auf die zulaessigen, korrekt typisierten Felder - unbekannte
 * oder falsch typisierte Werte werden stillschweigend ausgelassen statt geschrieben. */
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

export const registryRouter = express.Router();

registryRouter.get('/assets', (req, res) => {
  res.json(assetRegistry.getAssets());
});

registryRouter.get('/assets/:symbol', (req, res) => {
  const asset = assetRegistry.getAsset(req.params.symbol);
  if (!asset) {
    return res.status(404).json({ error: 'Asset nicht in der Registry gefunden.' });
  }
  res.json(asset);
});

registryRouter.post('/assets/:symbol', express.json(), async (req, res) => {
  // ADR-0003.5/0008: zuvor KEINE Zugriffsprüfung an dieser Stelle - jeder Aufrufer
  // konnte Asset-Parameter unauthentifiziert ändern. Jetzt über IAM abgesichert
  // (Master-Supervisor-/Orchestrator-Zone).
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

  res.json({ success: true, asset: assetRegistry.getAsset(symbol) });
});
