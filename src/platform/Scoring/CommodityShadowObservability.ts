import { createHash } from 'node:crypto';
import { summarizeProviderRuntime, type ProviderRuntimeSummary } from '../MarketData/providerRuntimeObservability';
import { createTelemetryRecord, type TelemetryRecord } from '../Telemetry/contracts';
import {
  evaluateCommodityCategoryResearchSnapshot,
  type CommodityCategoryResearchEvaluation,
} from './CommodityCategoryResearchEvaluation';
import type { CommodityResearchFeatureSnapshot } from './CommodityResearchModelContracts';
import {
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
  scoringModelRegistry,
} from './ScoringModelRegistry';

export const COMMODITY_SHADOW_OBSERVABILITY_VERSION = 'commodity-shadow-observability/1.0.0' as const;
const SHADOW_LEDGER_LIMIT = 2_000;
const TELEMETRY_LEDGER_LIMIT = 1_000;
const RAW_SHA256_PATTERN = /^[0-9a-f]{64}$/;

export interface CommodityShadowProviderBinding {
  readonly providerId: string;
  readonly capability: string;
  /** Explicit governed feature binding. P3-A never infers provider ownership from symbols. */
  readonly featureKeys: readonly string[];
}

export interface CommodityShadowProviderView {
  readonly providerId: string;
  readonly capability: string;
  readonly runtime: ProviderRuntimeSummary;
  readonly featureCount: number;
  readonly freshFeatureCount: number;
  readonly freshnessPassRate: number;
  readonly featureCoverage: number;
}

export interface CommodityShadowChampionView {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly status: string;
  readonly score: number | null;
  readonly effectiveFeatureFingerprint?: string | null;
  readonly effectiveWeightFingerprint?: string | null;
}

export interface CommodityShadowDriftView {
  readonly previousObservationId: string | null;
  readonly statusChanged: boolean;
  readonly coverageDelta: number | null;
  readonly requiredCoverageDelta: number | null;
  readonly dataQualityDelta: number | null;
  readonly featureStatusChanges: number;
  readonly featureFingerprintChanged: boolean;
  readonly evidenceFingerprintChanged: boolean;
  readonly championScoreDelta: number | null;
  readonly championFeatureFingerprintChanged: boolean;
  readonly championWeightFingerprintChanged: boolean;
}

export interface CommodityShadowObservation {
  readonly version: typeof COMMODITY_SHADOW_OBSERVABILITY_VERSION;
  readonly observationId: string;
  readonly observationFingerprint: string;
  readonly observedAt: string;
  readonly assetId: string;
  readonly symbol: string;
  readonly domain: CommodityResearchFeatureSnapshot['domain'];
  readonly instrumentKind: CommodityResearchFeatureSnapshot['instrumentKind'];
  readonly modelId: string;
  readonly modelVersion: string;
  readonly modelRegistryVersion: string;
  readonly executorKey: string;
  readonly featureContractVersion: string;
  readonly evaluationStatus: CommodityCategoryResearchEvaluation['status'];
  readonly coverage: number;
  readonly requiredCoverage: number;
  readonly dataQualityScore: number;
  readonly validFeatureCount: number;
  readonly missingFeatureCount: number;
  readonly staleFeatureCount: number;
  readonly invalidFeatureCount: number;
  readonly effectiveFeatureFingerprint: string;
  readonly nonExecutableWeightFingerprint: string;
  readonly evidenceFingerprint: string;
  readonly evidenceCount: number;
  readonly challengerScoreStability: Readonly<{
    status: 'NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS';
    score: null;
    delta: null;
  }>;
  readonly champion: CommodityShadowChampionView | null;
  readonly providers: readonly CommodityShadowProviderView[];
  readonly drift: CommodityShadowDriftView;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly rankingEligible: false;
  readonly executionEligible: false;
  readonly registryMutationPerformed: false;
  readonly auditReference: 'ADR-0101/P3-A';
}

export type CommodityShadowTelemetrySink = (record: TelemetryRecord) => void;

const observations: CommodityShadowObservation[] = [];
const telemetryLedger: TelemetryRecord[] = [];
const shadowSnapshotStatusLedger = new Map<string, Readonly<Record<string, string>>>();

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function roundedDelta(current: number, previous: number): number {
  return Number((current - previous).toFixed(4));
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

function evidenceFingerprint(snapshot: CommodityResearchFeatureSnapshot): string {
  return sha256({
    contractVersion: snapshot.contractVersion,
    dqPolicyVersion: snapshot.dqPolicyVersion,
    features: [...snapshot.features]
      .sort((a, b) => a.featureKey.localeCompare(b.featureKey))
      .map(feature => ({
        featureKey: feature.featureKey,
        rawValue: feature.rawValue,
        unit: feature.unit,
        source: feature.source,
        observedAt: feature.observedAt,
        retrievedAt: feature.retrievedAt,
        evidenceId: feature.evidenceId,
        status: feature.status,
      })),
  });
}

function providerViews(
  snapshot: CommodityResearchFeatureSnapshot,
  bindings: readonly CommodityShadowProviderBinding[],
): CommodityShadowProviderView[] {
  const knownFeatureKeys = new Set(snapshot.features.map(feature => feature.featureKey));
  const seen = new Set<string>();
  return bindings.map(binding => {
    const providerId = binding.providerId.trim();
    const capability = binding.capability.trim();
    const bindingKey = `${providerId}:${capability}`;
    if (!providerId || !capability || binding.featureKeys.length === 0 || seen.has(bindingKey)) {
      throw new Error('COMMODITY_SHADOW_PROVIDER_BINDING_INVALID');
    }
    if (binding.featureKeys.some(featureKey => !knownFeatureKeys.has(featureKey))) {
      throw new Error('COMMODITY_SHADOW_PROVIDER_FEATURE_BINDING_UNKNOWN');
    }
    seen.add(bindingKey);
    const featureKeys = new Set(binding.featureKeys);
    const features = snapshot.features.filter(feature => featureKeys.has(feature.featureKey));
    const fresh = features.filter(feature => feature.status === 'VALID').length;
    const available = features.filter(feature => feature.status !== 'MISSING').length;
    return Object.freeze({
      providerId,
      capability,
      runtime: summarizeProviderRuntime(providerId, capability),
      featureCount: features.length,
      freshFeatureCount: fresh,
      freshnessPassRate: ratio(fresh, features.length),
      featureCoverage: ratio(available, features.length),
    });
  });
}

function validateChampionView(champion: CommodityShadowChampionView | null | undefined): CommodityShadowChampionView | null {
  if (!champion) return null;
  const descriptor = scoringModelRegistry.get(champion.modelId, champion.modelVersion);
  if (!descriptor
    || descriptor.lifecycle !== 'canonical'
    || descriptor.alias !== 'champion'
    || descriptor.scoreEligible === false
    || !descriptor.assetClasses.includes('commodity')) {
    throw new Error('COMMODITY_SHADOW_CHAMPION_BINDING_INVALID');
  }
  if (!champion.status.trim()) throw new Error('COMMODITY_SHADOW_CHAMPION_STATUS_REQUIRED');
  if (champion.score !== null && !Number.isFinite(champion.score)) {
    throw new Error('COMMODITY_SHADOW_CHAMPION_SCORE_INVALID');
  }
  for (const fingerprint of [champion.effectiveFeatureFingerprint, champion.effectiveWeightFingerprint]) {
    if (fingerprint !== undefined && fingerprint !== null && !RAW_SHA256_PATTERN.test(fingerprint)) {
      throw new Error('COMMODITY_SHADOW_CHAMPION_FINGERPRINT_INVALID');
    }
  }
  return Object.freeze({
    modelId: descriptor.modelId,
    modelVersion: descriptor.version,
    status: champion.status.trim(),
    score: champion.score,
    effectiveFeatureFingerprint: champion.effectiveFeatureFingerprint ?? null,
    effectiveWeightFingerprint: champion.effectiveWeightFingerprint ?? null,
  });
}

function featureStatusChanges(
  current: CommodityResearchFeatureSnapshot,
  previous: CommodityShadowObservation | null,
): number {
  if (!previous) return 0;
  const previousSnapshot = shadowSnapshotStatusLedger.get(previous.observationId);
  if (!previousSnapshot) return 0;
  const currentStatuses = Object.fromEntries(current.features.map(item => [item.featureKey, item.status]));
  const keys = new Set([...Object.keys(previousSnapshot), ...Object.keys(currentStatuses)]);
  return [...keys].filter(key => previousSnapshot[key] !== currentStatuses[key]).length;
}

function previousFor(assetId: string, modelId: string): CommodityShadowObservation | null {
  return [...observations].reverse().find(item => item.assetId === assetId && item.modelId === modelId) ?? null;
}

function defaultTelemetrySink(record: TelemetryRecord): void {
  telemetryLedger.push(record);
  if (telemetryLedger.length > TELEMETRY_LEDGER_LIMIT) telemetryLedger.shift();
}

/**
 * P3-A evaluates and records a governed challenger snapshot in parallel with, but outside of,
 * productive scoring/ranking authority. Caller-supplied evaluation state is intentionally not
 * accepted: the deterministic evaluator and registered challenger descriptor are re-read here.
 */
export function recordCommodityShadowObservation(input: Readonly<{
  snapshot: CommodityResearchFeatureSnapshot;
  providerBindings?: readonly CommodityShadowProviderBinding[];
  champion?: CommodityShadowChampionView | null;
  telemetrySink?: CommodityShadowTelemetrySink;
  environment?: string;
}>): CommodityShadowObservation {
  const { snapshot } = input;
  if (snapshot.assetId.trim() === '' || snapshot.symbol.trim() === '') throw new Error('COMMODITY_SHADOW_IDENTITY_REQUIRED');
  if (snapshot.canonical !== false || snapshot.scoreEligible !== false) throw new Error('COMMODITY_SHADOW_AUTHORITY_VIOLATION');

  const evaluation = evaluateCommodityCategoryResearchSnapshot(snapshot);
  if (evaluation.canonical !== false || evaluation.scoreEligible !== false || evaluation.executionEligible !== false) {
    throw new Error('COMMODITY_SHADOW_AUTHORITY_VIOLATION');
  }
  if (evaluation.researchCompositeScore !== null || evaluation.weightHypothesis.executable !== false) {
    throw new Error('COMMODITY_SHADOW_EXECUTABLE_SCORE_FORBIDDEN');
  }

  const descriptor = scoringModelRegistry.get(evaluation.modelId, evaluation.modelVersion);
  if (!descriptor
    || descriptor.lifecycle !== 'challenger'
    || descriptor.alias !== 'challenger'
    || descriptor.scoreEligible !== false
    || descriptor.evidencePolicy !== 'research-only'
    || descriptor.executorKey !== RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY
    || descriptor.featureContractVersion !== evaluation.featureContractVersion
    || !descriptor.instrumentKinds?.includes(snapshot.instrumentKind)) {
    throw new Error('COMMODITY_SHADOW_REGISTRY_BINDING_INVALID');
  }

  const previous = previousFor(snapshot.assetId, evaluation.modelId);
  const currentEvidenceFingerprint = evidenceFingerprint(snapshot);
  const canonicalChampion = validateChampionView(input.champion);
  const previousChampion = previous?.champion ?? null;
  const currentFeatureStatuses = Object.freeze(Object.fromEntries(snapshot.features.map(feature => [feature.featureKey, feature.status])));
  const statusChanges = featureStatusChanges(snapshot, previous);
  const observedAt = snapshot.capturedAt;
  const observationFingerprint = sha256({
    version: COMMODITY_SHADOW_OBSERVABILITY_VERSION,
    observedAt,
    assetId: snapshot.assetId,
    symbol: snapshot.symbol,
    modelId: evaluation.modelId,
    modelVersion: evaluation.modelVersion,
    modelRegistryVersion: descriptor.registryVersion,
    featureContractVersion: evaluation.featureContractVersion,
    evaluationStatus: evaluation.status,
    coverage: snapshot.coverage,
    requiredCoverage: snapshot.requiredCoverage,
    dataQualityScore: evaluation.dataQualityScore,
    effectiveFeatureFingerprint: evaluation.lineage.effectiveFeatureFingerprint,
    nonExecutableWeightFingerprint: evaluation.lineage.nonExecutableWeightFingerprint,
    evidenceFingerprint: currentEvidenceFingerprint,
    champion: canonicalChampion,
  });
  const observationId = `commodity-shadow:sha256:${observationFingerprint}`;

  const observation: CommodityShadowObservation = Object.freeze({
    version: COMMODITY_SHADOW_OBSERVABILITY_VERSION,
    observationId,
    observationFingerprint,
    observedAt,
    assetId: snapshot.assetId,
    symbol: snapshot.symbol,
    domain: snapshot.domain,
    instrumentKind: snapshot.instrumentKind,
    modelId: evaluation.modelId,
    modelVersion: evaluation.modelVersion,
    modelRegistryVersion: descriptor.registryVersion,
    executorKey: descriptor.executorKey,
    featureContractVersion: evaluation.featureContractVersion,
    evaluationStatus: evaluation.status,
    coverage: snapshot.coverage,
    requiredCoverage: snapshot.requiredCoverage,
    dataQualityScore: evaluation.dataQualityScore,
    validFeatureCount: evaluation.validFeatures.length,
    missingFeatureCount: evaluation.missingFeatures.length,
    staleFeatureCount: evaluation.staleFeatures.length,
    invalidFeatureCount: evaluation.invalidFeatures.length,
    effectiveFeatureFingerprint: evaluation.lineage.effectiveFeatureFingerprint,
    nonExecutableWeightFingerprint: evaluation.lineage.nonExecutableWeightFingerprint,
    evidenceFingerprint: currentEvidenceFingerprint,
    evidenceCount: snapshot.features.filter(feature => Boolean(feature.evidenceId)).length,
    challengerScoreStability: Object.freeze({
      status: 'NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS' as const,
      score: null,
      delta: null,
    }),
    champion: canonicalChampion,
    providers: Object.freeze(providerViews(snapshot, input.providerBindings ?? [])),
    drift: Object.freeze({
      previousObservationId: previous?.observationId ?? null,
      statusChanged: Boolean(previous && previous.evaluationStatus !== evaluation.status),
      coverageDelta: previous ? roundedDelta(snapshot.coverage, previous.coverage) : null,
      requiredCoverageDelta: previous ? roundedDelta(snapshot.requiredCoverage, previous.requiredCoverage) : null,
      dataQualityDelta: previous ? roundedDelta(evaluation.dataQualityScore, previous.dataQualityScore) : null,
      featureStatusChanges: statusChanges,
      featureFingerprintChanged: Boolean(previous && previous.effectiveFeatureFingerprint !== evaluation.lineage.effectiveFeatureFingerprint),
      evidenceFingerprintChanged: Boolean(previous && previous.evidenceFingerprint !== currentEvidenceFingerprint),
      championScoreDelta: previousChampion?.score !== null && previousChampion?.score !== undefined && canonicalChampion?.score !== null && canonicalChampion?.score !== undefined
        ? Number((canonicalChampion.score - previousChampion.score).toFixed(4))
        : null,
      championFeatureFingerprintChanged: Boolean(
        previousChampion?.effectiveFeatureFingerprint
        && canonicalChampion?.effectiveFeatureFingerprint
        && previousChampion.effectiveFeatureFingerprint !== canonicalChampion.effectiveFeatureFingerprint
      ),
      championWeightFingerprintChanged: Boolean(
        previousChampion?.effectiveWeightFingerprint
        && canonicalChampion?.effectiveWeightFingerprint
        && previousChampion.effectiveWeightFingerprint !== canonicalChampion.effectiveWeightFingerprint
      ),
    }),
    canonical: false,
    scoreEligible: false,
    rankingEligible: false,
    executionEligible: false,
    registryMutationPerformed: false,
    auditReference: 'ADR-0101/P3-A' as const,
  });

  observations.push(observation);
  shadowSnapshotStatusLedger.set(observationId, currentFeatureStatuses);
  if (observations.length > SHADOW_LEDGER_LIMIT) {
    const removed = observations.shift();
    if (removed) shadowSnapshotStatusLedger.delete(removed.observationId);
  }

  const telemetry = createTelemetryRecord({
    signal: 'metric',
    severity: evaluation.status === 'RESEARCH_READY' ? 'info' : 'warn',
    stage: 'scoring-analysis',
    eventName: 'commodity.shadow.observation.completed',
    outcome: evaluation.status === 'RESEARCH_READY' ? 'success' : 'degraded',
    assetClass: 'commodity',
    context: {
      service: 'commodity-shadow-observability',
      environment: input.environment?.trim() || process.env.NODE_ENV || 'unknown',
    },
    attributes: {
      modelId: evaluation.modelId,
      modelVersion: evaluation.modelVersion,
      modelRegistryVersion: descriptor.registryVersion,
      domain: snapshot.domain,
      evaluationStatus: evaluation.status,
      coverage: snapshot.coverage,
      requiredCoverage: snapshot.requiredCoverage,
      dataQualityScore: evaluation.dataQualityScore,
      featureFingerprint: evaluation.lineage.effectiveFeatureFingerprint,
      evidenceFingerprint: currentEvidenceFingerprint,
      providerCount: observation.providers.length,
      featureStatusChanges: observation.drift.featureStatusChanges,
      challengerScoreStatus: observation.challengerScoreStability.status,
      championModelId: observation.champion?.modelId ?? null,
      championModelVersion: observation.champion?.modelVersion ?? null,
    },
    auditReference: observation.auditReference,
  });
  (input.telemetrySink ?? defaultTelemetrySink)(telemetry);
  return observation;
}

export function getCommodityShadowObservations(filter: Readonly<{
  assetId?: string;
  modelId?: string;
}> = {}): CommodityShadowObservation[] {
  return observations
    .filter(item => (!filter.assetId || item.assetId === filter.assetId) && (!filter.modelId || item.modelId === filter.modelId))
    .map(item => ({ ...item, providers: item.providers.map(provider => ({ ...provider, runtime: { ...provider.runtime } })) }));
}

export function getCommodityShadowTelemetry(): TelemetryRecord[] {
  return telemetryLedger.map(record => ({
    ...record,
    context: { ...record.context },
    attributes: record.attributes ? { ...record.attributes } : undefined,
  }));
}

export function resetCommodityShadowObservability(): void {
  observations.length = 0;
  telemetryLedger.length = 0;
  shadowSnapshotStatusLedger.clear();
}
