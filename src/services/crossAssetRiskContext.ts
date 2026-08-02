import { buildMacroRiskRegime, type MacroRiskRegimeEvidence } from './macroRiskRegime';

export const CROSS_ASSET_RISK_CONTEXT_VERSION = 'cross-asset-risk-context/1.0.0';

export type CrossAssetClass = 'stock' | 'forex' | 'index' | 'crypto' | 'bond';
export type CrossAssetRiskContextStatus = 'READY' | 'EVIDENCE_INCOMPLETE' | 'STALE_EVIDENCE';
export type MacroSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CrossAssetRiskContext {
  contractVersion: typeof CROSS_ASSET_RISK_CONTEXT_VERSION;
  status: CrossAssetRiskContextStatus;
  assetClass: CrossAssetClass;
  macroRegime: MacroRiskRegimeEvidence['regime'];
  macroSensitivity: MacroSensitivity;
  asOf: string | null;
  treasury2y: number | null;
  treasury10y: number | null;
  spread10y2yBps: number | null;
  providers: string[];
  evidenceIds: string[];
  executionPriceEligible: false;
  scoreImpactEnabled: false;
  recommendationEligible: false;
  reason: string;
}

const SENSITIVITY_BY_ASSET_CLASS: Record<CrossAssetClass, MacroSensitivity> = {
  stock: 'MEDIUM',
  forex: 'HIGH',
  index: 'MEDIUM',
  crypto: 'MEDIUM',
  bond: 'HIGH',
};

export function buildCrossAssetRiskContextFromMacro(
  assetClass: CrossAssetClass,
  macro: MacroRiskRegimeEvidence,
): CrossAssetRiskContext {
  const status: CrossAssetRiskContextStatus = macro.status === 'READY'
    ? 'READY'
    : macro.status === 'STALE_EVIDENCE'
      ? 'STALE_EVIDENCE'
      : 'EVIDENCE_INCOMPLETE';

  return {
    contractVersion: CROSS_ASSET_RISK_CONTEXT_VERSION,
    status,
    assetClass,
    macroRegime: macro.regime,
    macroSensitivity: SENSITIVITY_BY_ASSET_CLASS[assetClass],
    asOf: macro.asOf,
    treasury2y: macro.treasury2y,
    treasury10y: macro.treasury10y,
    spread10y2yBps: macro.spread10y2yBps,
    providers: [...macro.providers],
    evidenceIds: [...macro.evidenceIds],
    executionPriceEligible: false,
    scoreImpactEnabled: false,
    recommendationEligible: false,
    reason: status === 'READY'
      ? `Macro-Kontext für ${assetClass} aus versionierter FRED-Zinskurven-Evidence; keine automatische Score-Gewichtung.`
      : `Macro-Kontext für ${assetClass} ist nicht vollständig aktuell; Asset-Score und Recommendation bleiben unbeeinflusst. ${macro.reason}`,
  };
}

/**
 * Cross-asset context boundary. It deliberately does not alter any asset score. A future scoring
 * integration requires a separate reviewed feature/scoring contract and regression calibration.
 */
export async function buildCrossAssetRiskContext(assetClass: CrossAssetClass): Promise<CrossAssetRiskContext> {
  const macro = await buildMacroRiskRegime();
  return buildCrossAssetRiskContextFromMacro(assetClass, macro);
}
