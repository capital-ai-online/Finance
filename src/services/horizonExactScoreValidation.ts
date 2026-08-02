import type { HorizonValidationProviderResult } from './horizonValidationProvider';

export const HORIZON_EXACT_SCORE_VALIDATION_VERSION = 'horizon-exact-score-validation/1.0.0' as const;

export interface HorizonExactValidationSnapshot {
  symbol: string;
  assetClass: 'crypto' | 'stock' | 'forex' | 'index';
  snapshotDate: string;
  snapshotPrice: number;
  score: number;
  scoreBasis: string;
}

export interface HorizonExactValidationBucket {
  sampleSize: number;
  evaluated: number;
  skippedNoEvidence: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  hitRatePct: number | null;
  falsePositiveRatePct: number | null;
}

export interface HorizonExactScoreValidationResult {
  contractVersion: typeof HORIZON_EXACT_SCORE_VALIDATION_VERSION;
  horizonDays: number;
  threshold: number;
  status: 'READY' | 'INSUFFICIENT_EVIDENCE';
  overall: HorizonExactValidationBucket;
  providerEvidence: Array<{
    symbol: string;
    status: HorizonValidationProviderResult['status'];
    provider: string | null;
    evidenceId: string | null;
    targetAt: string | null;
    observedAt: string | null;
  }>;
  methodology: {
    horizonExact: true;
    currentRegistryPriceAllowed: false;
    interpolationAllowed: false;
    syntheticEvidenceAllowed: false;
  };
}

function pct(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : null;
}

export async function evaluateHorizonExactScoreValidation(input: {
  snapshots: HorizonExactValidationSnapshot[];
  horizonDays: number;
  threshold: number;
  resolveEvidence: (snapshot: HorizonExactValidationSnapshot, horizonDays: number) => Promise<HorizonValidationProviderResult>;
  minimumEvaluated?: number;
}): Promise<HorizonExactScoreValidationResult> {
  const minimumEvaluated = input.minimumEvaluated ?? 5;
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let evaluated = 0;
  let skippedNoEvidence = 0;
  const providerEvidence: HorizonExactScoreValidationResult['providerEvidence'] = [];

  for (const snapshot of input.snapshots) {
    if (!Number.isFinite(snapshot.snapshotPrice) || snapshot.snapshotPrice <= 0 || !Number.isFinite(snapshot.score)) {
      skippedNoEvidence += 1;
      continue;
    }

    const evidence = await input.resolveEvidence(snapshot, input.horizonDays);
    const selected = evidence.evidence.selected;
    providerEvidence.push({
      symbol: snapshot.symbol,
      status: evidence.status,
      provider: evidence.provider,
      evidenceId: selected?.evidenceId ?? null,
      targetAt: evidence.evidence.targetAt,
      observedAt: selected?.observedAt ?? null,
    });

    if (evidence.status !== 'READY' || !selected) {
      skippedNoEvidence += 1;
      continue;
    }

    const realizedReturnPct = ((selected.price - snapshot.snapshotPrice) / snapshot.snapshotPrice) * 100;
    const predictedPositive = snapshot.score >= input.threshold;
    const actualPositive = realizedReturnPct > 0;
    evaluated += 1;

    if (predictedPositive && actualPositive) tp += 1;
    else if (predictedPositive && !actualPositive) fp += 1;
    else if (!predictedPositive && actualPositive) fn += 1;
    else tn += 1;
  }

  const predictedPositiveCount = tp + fp;
  return {
    contractVersion: HORIZON_EXACT_SCORE_VALIDATION_VERSION,
    horizonDays: input.horizonDays,
    threshold: input.threshold,
    status: evaluated >= minimumEvaluated ? 'READY' : 'INSUFFICIENT_EVIDENCE',
    overall: {
      sampleSize: input.snapshots.length,
      evaluated,
      skippedNoEvidence,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      hitRatePct: pct(tp, predictedPositiveCount),
      falsePositiveRatePct: pct(fp, predictedPositiveCount),
    },
    providerEvidence,
    methodology: {
      horizonExact: true,
      currentRegistryPriceAllowed: false,
      interpolationAllowed: false,
      syntheticEvidenceAllowed: false,
    },
  };
}
