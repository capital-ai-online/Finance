import { fetchFredSeries, type MacroEvidenceSeries } from './macroRateEvidence';

export const MACRO_RISK_REGIME_CONTRACT_VERSION = '1.1.0';

export type MacroRiskRegimeStatus = 'READY' | 'EVIDENCE_INCOMPLETE' | 'STALE_EVIDENCE';
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

function observationAgeMs(date: string, nowMs: number): number {
  const observed = Date.parse(`${date}T23:59:59.999Z`);
  return Number.isFinite(observed) ? Math.max(0, nowMs - observed) : Number.POSITIVE_INFINITY;
}

/**
 * Versioned cross-asset macro evidence contract. This is context/evidence only: it does not
 * produce a tradable price, investment recommendation or asset score. The curve regime is emitted
 * only when DGS2 and DGS10 have an observation for the same sufficiently fresh date; otherwise it
 * fails closed.
 */
export async function buildMacroRiskRegime(options: {
  nowMs?: number;
  maxObservationAgeMs?: number;
} = {}): Promise<MacroRiskRegimeEvidence> {
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

    const nowMs = options.nowMs ?? Date.now();
    const maxObservationAgeMs = options.maxObservationAgeMs ?? 7 * 24 * 60 * 60 * 1000;
    const evidenceIds = [
      `macro:fred:DGS2:${common.date}`,
      `macro:fred:DGS10:${common.date}`,
    ];
    if (observationAgeMs(common.date, nowMs) > maxObservationAgeMs) {
      return {
        contractVersion: MACRO_RISK_REGIME_CONTRACT_VERSION,
        status: 'STALE_EVIDENCE',
        regime: 'UNKNOWN',
        asOf: common.date,
        treasury2y: common.a,
        treasury10y: common.b,
        spread10y2yBps: null,
        providers: ['FRED'],
        evidenceIds,
        sourceSeries: ['DGS2', 'DGS10'],
        executionPriceEligible: false,
        reason: `Gemeinsame DGS2/DGS10-Evidence vom ${common.date} überschreitet das zulässige Freshness-Fenster.`,
      };
    }

    const spreadBps = Number(((common.b - common.a) * 100).toFixed(2));
    const regime: MacroRiskRegime = spreadBps < -10
      ? 'INVERTED_CURVE'
      : spreadBps > 10
        ? 'NORMAL_CURVE'
        : 'FLAT_CURVE';

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
      reason: 'Regime basiert ausschließlich auf gleichdatierten, frischen FRED DGS2/DGS10 Treasury-Rate-Evidence.',
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
