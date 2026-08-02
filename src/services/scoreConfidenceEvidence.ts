import type { ScoreConfidenceCalibration } from './scoreConfidenceCalibration';

export const SCORE_CONFIDENCE_EVIDENCE_VERSION = 'score-confidence-evidence/1.0.0' as const;

export interface ScoreConfidenceEvidenceRecord {
  contractVersion: typeof SCORE_CONFIDENCE_EVIDENCE_VERSION;
  observedAt: string;
  horizonDays: number;
  threshold: number;
  scoreBasis: string;
  sampleSize: number;
  state: ScoreConfidenceCalibration['state'];
  confidencePct: number | null;
  methodology: ScoreConfidenceCalibration['methodology'];
  scoreImpactEnabled: false;
  recommendationImpactEnabled: false;
  executionProbability: false;
  reasons: string[];
}

const MAX_RECORDS = 100;
const records: ScoreConfidenceEvidenceRecord[] = [];

export function recordScoreConfidenceEvidence(input: {
  calibration: ScoreConfidenceCalibration;
  horizonDays: number;
  threshold: number;
  scoreBasis?: string;
  observedAt?: string;
}): ScoreConfidenceEvidenceRecord {
  const record: ScoreConfidenceEvidenceRecord = {
    contractVersion: SCORE_CONFIDENCE_EVIDENCE_VERSION,
    observedAt: input.observedAt ?? new Date().toISOString(),
    horizonDays: input.horizonDays,
    threshold: input.threshold,
    scoreBasis: input.scoreBasis ?? 'all',
    sampleSize: input.calibration.sampleSize,
    state: input.calibration.state,
    confidencePct: input.calibration.confidencePct,
    methodology: input.calibration.methodology,
    scoreImpactEnabled: false,
    recommendationImpactEnabled: false,
    executionProbability: false,
    reasons: [...input.calibration.reasons],
  };
  records.push(record);
  if (records.length > MAX_RECORDS) records.shift();
  return { ...record, reasons: [...record.reasons] };
}

export function getLatestScoreConfidenceEvidence(): ScoreConfidenceEvidenceRecord | null {
  const latest = records.at(-1);
  return latest ? { ...latest, reasons: [...latest.reasons] } : null;
}

export function getRecentScoreConfidenceEvidence(limit = 20): ScoreConfidenceEvidenceRecord[] {
  const bounded = Math.max(1, Math.min(MAX_RECORDS, limit));
  return records.slice(-bounded).reverse().map(record => ({ ...record, reasons: [...record.reasons] }));
}

export function resetScoreConfidenceEvidence(): void {
  records.length = 0;
}
