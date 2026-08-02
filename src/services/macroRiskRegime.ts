import { fetchFredSeries, type MacroEvidenceSeries } from './macroRateEvidence';

export const MACRO_RISK_REGIME_CONTRACT_VERSION = '1.0.0';

export type MacroRiskRegimeStatus = 'READY' | 'EVIDENCE_INCOMPLETE';
export type MacroRiskRegime = 'INVERTED_CURVE' | 'NORMAL_CURVE' | 'FLAT_CURVE' | 'UNKNOWN';

export interface MacroRiskRegimeEvidence {
  contractVersion: typeof MACRO_RISK_REGIME_CONTRACT_VERSION;
  status: MacroRiskRegimeStatus;
  regime: MacroRiskRegime;
  asOf: string | null;
  treasury2y: number | null;
  treasury10y: number | null;
  spread10y2yBps: number | null;
  providers: string[];
  evidenceIds: string[];
  sourceSeries: string[];
  executionPriceEligible: false;
  reason: string;
}

function latestCommonObservation(a: MacroEvidenceSeries, b: MacroEvidenceSeries): { date: string; a: number; b: number } | null {
  const bByDate = new Map(b.points.map(point => [point.date, point.value]));
  for (let i = a.points.length - 1; i >= 0; i -= 1) {
    const point = a.points[i];
    const other = bByDate.get(point.date);
    if (other !== undefined) return { date: point.date, a: point.value, b: other };
  }
  return null;
}

/**
 * Versioned cross-asset macro evidence contract. This is context/evidence only: it does not
 * produce a tradable price, investment recommendation or asset score. The curve regime is emitted
 * only when DGS2 and DGS10 have an observation for the same date; otherwise it fails closed.
 */
export async function buildMacroRiskRegime(): Promise<MacroRiskRegimeEvidence> {
  try {
    const [twoYear, tenYear] = await Promise.all([
      fetchFredSeries('DGS2'),
      fetchFredSeries('DGS10'),
    ]);
    const common = latestCommonObservation(twoYear, tenYear);
    if (!common) {
      return {
        contractVersion: MACRO_RISK_REGIME_CONTRACT_VERSION,
        status: 'EVIDENCE_INCOMPLETE',
        regime: 'UNKNOWN',
        asOf: null,
        treasury2y: null,
        treasury10y: null,
        spread10y2yBps: null,
        providers: ['FRED'],
        evidenceIds: [],
        sourceSeries: ['DGS2', 'DGS10'],
        executionPriceEligible: false,
        reason: 'DGS2 und DGS10 besitzen keinen gemeinsamen Beobachtungstag im abgerufenen Evidence-Fenster.',
      };
    }

    const spreadBps = Number(((common.b - common.a) * 100).toFixed(2));
    const regime: MacroRiskRegime = spreadBps < -10
      ? 'INVERTED_CURVE'
      : spreadBps > 10
        ? 'NORMAL_CURVE'
        : 'FLAT_CURVE';
    const evidenceIds = [
      `macro:fred:DGS2:${common.date}`,
      `macro:fred:DGS10:${common.date}`,
    ];

    return {
      contractVersion: MACRO_RISK_REGIME_CONTRACT_VERSION,
      status: 'READY',
      regime,
      asOf: common.date,
      treasury2y: common.a,
      treasury10y: common.b,
      spread10y2yBps: spreadBps,
      providers: ['FRED'],
      evidenceIds,
      sourceSeries: ['DGS2', 'DGS10'],
      executionPriceEligible: false,
      reason: 'Regime basiert ausschließlich auf gleichdatierten FRED DGS2/DGS10 Treasury-Rate-Evidence.',
    };
  } catch (error) {
    return {
      contractVersion: MACRO_RISK_REGIME_CONTRACT_VERSION,
      status: 'EVIDENCE_INCOMPLETE',
      regime: 'UNKNOWN',
      asOf: null,
      treasury2y: null,
      treasury10y: null,
      spread10y2yBps: null,
      providers: ['FRED'],
      evidenceIds: [],
      sourceSeries: ['DGS2', 'DGS10'],
      executionPriceEligible: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
