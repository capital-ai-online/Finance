import { fetchFredSeries } from './macroRateEvidence';
import { buildMacroRiskRegime, type MacroRiskRegimeEvidence } from './macroRiskRegime';

export const CROSS_ASSET_RISK_CONTEXT_VERSION = 'cross-asset-risk-context/1.1.0';

export type CrossAssetClass = 'stock' | 'forex' | 'index' | 'crypto' | 'bond';
export type CrossAssetRiskContextStatus = 'READY' | 'EVIDENCE_INCOMPLETE' | 'STALE_EVIDENCE';
export type MacroSensitivity = 'LOW' | 'MEDIUM' | 'HIGH';
export type SupplementalMacroStatus = 'COMPLETE' | 'PARTIAL';

export interface CrossAssetRiskContext {
  contractVersion: typeof CROSS_ASSET_RISK_CONTEXT_VERSION;
  status: CrossAssetRiskContextStatus;
  supplementalStatus: SupplementalMacroStatus;
  assetClass: CrossAssetClass;
  macroRegime: MacroRiskRegimeEvidence['regime'];
  macroSensitivity: MacroSensitivity;
  asOf: string | null;
  treasury2y: number | null;
  treasury10y: number | null;
  spread10y2yBps: number | null;
  fedFundsRate: number | null;
  fedFundsAsOf: string | null;
  cpiIndex: number | null;
  cpiAsOf: string | null;
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
  supplemental: {
    fedFundsRate?: number | null;
    fedFundsAsOf?: string | null;
    fedFundsEvidenceId?: string | null;
    cpiIndex?: number | null;
    cpiAsOf?: string | null;
    cpiEvidenceId?: string | null;
  } = {},
): CrossAssetRiskContext {
  const status: CrossAssetRiskContextStatus = macro.status === 'READY'
    ? 'READY'
    : macro.status === 'STALE_EVIDENCE'
      ? 'STALE_EVIDENCE'
      : 'EVIDENCE_INCOMPLETE';
  const fedFundsReady = typeof supplemental.fedFundsRate === 'number' && Boolean(supplemental.fedFundsAsOf) && Boolean(supplemental.fedFundsEvidenceId);
  const cpiReady = typeof supplemental.cpiIndex === 'number' && Boolean(supplemental.cpiAsOf) && Boolean(supplemental.cpiEvidenceId);
  const supplementalStatus: SupplementalMacroStatus = fedFundsReady && cpiReady ? 'COMPLETE' : 'PARTIAL';
  const evidenceIds = [...macro.evidenceIds];
  if (supplemental.fedFundsEvidenceId) evidenceIds.push(supplemental.fedFundsEvidenceId);
  if (supplemental.cpiEvidenceId) evidenceIds.push(supplemental.cpiEvidenceId);

  return {
    contractVersion: CROSS_ASSET_RISK_CONTEXT_VERSION,
    status,
    supplementalStatus,
    assetClass,
    macroRegime: macro.regime,
    macroSensitivity: SENSITIVITY_BY_ASSET_CLASS[assetClass],
    asOf: macro.asOf,
    treasury2y: macro.treasury2y,
    treasury10y: macro.treasury10y,
    spread10y2yBps: macro.spread10y2yBps,
    fedFundsRate: fedFundsReady ? supplemental.fedFundsRate! : null,
    fedFundsAsOf: fedFundsReady ? supplemental.fedFundsAsOf! : null,
    cpiIndex: cpiReady ? supplemental.cpiIndex! : null,
    cpiAsOf: cpiReady ? supplemental.cpiAsOf! : null,
    providers: [...new Set([...macro.providers, ...(fedFundsReady || cpiReady ? ['FRED'] : [])])],
    evidenceIds: [...new Set(evidenceIds)],
    executionPriceEligible: false,
    scoreImpactEnabled: false,
    recommendationEligible: false,
    reason: status === 'READY'
      ? `Macro-Kontext für ${assetClass} aus versionierter FRED-Zinskurven-Evidence; Supplemental Macro Evidence: ${supplementalStatus}. Keine automatische Score-Gewichtung.`
      : `Macro-Kontext für ${assetClass} ist nicht vollständig aktuell; Asset-Score und Recommendation bleiben unbeeinflusst. ${macro.reason}`,
  };
}

/**
 * Cross-asset context boundary. It deliberately does not alter any asset score. FEDFUNDS and CPI
 * are supplemental evidence only; failure to retrieve them never creates fallback values and does
 * not upgrade an incomplete yield-curve regime to READY.
 */
export async function buildCrossAssetRiskContext(assetClass: CrossAssetClass): Promise<CrossAssetRiskContext> {
  const macro = await buildMacroRiskRegime();
  let supplemental: Parameters<typeof buildCrossAssetRiskContextFromMacro>[2] = {};
  try {
    const [fedFunds, cpi] = await Promise.all([
      fetchFredSeries('FEDFUNDS'),
      fetchFredSeries('CPIAUCSL'),
    ]);
    const fed = fedFunds.points.at(-1);
    const cpiPoint = cpi.points.at(-1);
    supplemental = {
      fedFundsRate: fed?.value ?? null,
      fedFundsAsOf: fed?.date ?? null,
      fedFundsEvidenceId: fed ? `macro:fred:FEDFUNDS:${fed.date}` : null,
      cpiIndex: cpiPoint?.value ?? null,
      cpiAsOf: cpiPoint?.date ?? null,
      cpiEvidenceId: cpiPoint ? `macro:fred:CPIAUCSL:${cpiPoint.date}` : null,
    };
  } catch {
    supplemental = {};
  }
  return buildCrossAssetRiskContextFromMacro(assetClass, macro, supplemental);
}
