import { createHash } from 'node:crypto';
import {
  DEFAULT_SCORING_MODELS,
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
} from './ScoringModelRegistry';
import type { ScoringModelDescriptor } from './contracts';
import {
  COMMODITY_RESEARCH_DQ_POLICY_VERSION,
  COMMODITY_RESEARCH_MODEL_CONTRACTS,
  type CommodityResearchModelContract,
  type CommodityResearchModelId,
} from './CommodityResearchModelContracts';
import {
  COMMODITY_CORRELATION_POLICY_VERSION,
  COMMODITY_WEIGHT_STABILITY_VERSION,
  COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
  assessCommodityWeightPromotionEvidence,
  type CommodityCandidateWeightProfile,
  type CommodityCandidateWeightValidation,
  type CommodityCorrelationReport,
  type CommodityWeightPromotionEvidenceAssessment,
  type CommodityWeightStabilityReport,
} from './CommodityModelValidation';
import {
  COMMODITY_BACKTEST_CONTRACT_VERSION,
  type CommodityBacktestResult,
} from './CommodityBacktestingContracts';
import {
  COMMODITY_HISTORICAL_VINTAGE_CONTRACT_VERSION,
} from './CommodityHistoricalVintage';

export const COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION =
  'commodity-model-descriptor/1.0.0' as const;
export const COMMODITY_PROVIDER_RESILIENCE_CONTRACT_VERSION =
  'commodity-provider-resilience/1.0.0' as const;
export const COMMODITY_STRESS_EVIDENCE_CONTRACT_VERSION =
  'commodity-model-stress-evidence/1.0.0' as const;
export const COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION =
  'commodity-model-promotion-package/1.0.0' as const;
export const COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION =
  'commodity-owner-promotion-decision/1.0.0' as const;

export type CommodityPromotionSupportedSource =
  | 'twelvedata'
  | 'eia'
  | 'usda-fas-psd'
  | 'cftc-cot'
  | 'usgs-mcs'
  | 'eu-crma'
  | 'governed-futures-curve-evidence'
  | 'governed-official-supply-evidence';

export interface CommodityModelCalibrationLineage {
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly datasetFingerprint: string;
  readonly normalizationContractVersion: string;
  readonly calibrationEvidenceId: string;
  readonly backtestRunId: string;
  readonly outOfSampleEvidenceId: string;
  readonly correlationEvidenceId: string;
  readonly sensitivityEvidenceId: string;
}

export interface CommodityImmutableModelDescriptor {
  readonly contractVersion: typeof COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION;
  readonly descriptorId: string;
  readonly descriptorVersion: string;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly featureContractVersion: string;
  readonly weightContractVersion: typeof COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION;
  readonly evidenceContractVersions: Readonly<{
    dq: typeof COMMODITY_RESEARCH_DQ_POLICY_VERSION;
    correlation: typeof COMMODITY_CORRELATION_POLICY_VERSION;
    weightStability: typeof COMMODITY_WEIGHT_STABILITY_VERSION;
    backtest: typeof COMMODITY_BACKTEST_CONTRACT_VERSION;
    historicalVintage: typeof COMMODITY_HISTORICAL_VINTAGE_CONTRACT_VERSION;
  }>;
  readonly weightProfileId: string;
  readonly weightProfileVersion: string;
  readonly effectiveWeightFingerprint: string;
  readonly supportedSources: readonly CommodityPromotionSupportedSource[];
  readonly validFrom: string;
  readonly validUntil: string | null;
  readonly createdAt: string;
  readonly lineage: CommodityModelCalibrationLineage;
  readonly lifecycle: 'challenger';
  readonly immutable: true;
  readonly runtimeExecutable: false;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly descriptorFingerprint: string;
}

export interface CommodityModelDescriptorValidation {
  readonly valid: boolean;
  readonly blockers: readonly string[];
  readonly descriptorFingerprint: string;
  readonly canonical: false;
  readonly scoreEligible: false;
  readonly runtimeExecutable: false;
}

export interface CommodityProviderResiliencePolicy {
  readonly policyId: string;
  readonly policyVersion: string;
  readonly minimumAvailabilityRate: number;
  readonly minimumFreshnessPassRate: number;
  readonly maximumErrorRate: number;
  readonly maximumCircuitOpenEvents: number;
  readonly maximumP95LatencyMs: number | null;
}

export interface CommodityProviderResilienceObservation {
  readonly providerId: CommodityPromotionSupportedSource;
  readonly required: boolean;
  readonly sampleCount: number;
  readonly availabilityRate: number;
  readonly freshnessPassRate: number;
  readonly errorRate: number;
  readonly circuitOpenEvents: number;
  readonly p95LatencyMs: number | null;
  readonly evidenceId: string;
}

export interface CommodityProviderResilienceReport {
  readonly contractVersion: typeof COMMODITY_PROVIDER_RESILIENCE_CONTRACT_VERSION;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly policy: CommodityProviderResiliencePolicy;
  readonly observations: readonly CommodityProviderResilienceObservation[];
  readonly blockers: readonly string[];
  readonly evidenceComplete: boolean;
  readonly evidenceId: string;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityStressPolicy {
  readonly policyId: string;
  readonly policyVersion: string;
  readonly requiredScenarioIds: readonly string[];
  readonly minimumRankInformationCoefficient: number | null;
  readonly maximumAbsoluteDrawdown: number | null;
  readonly maximumTurnover: number | null;
}

export interface CommodityStressScenarioResult {
  readonly scenarioId: string;
  readonly regime: string;
  readonly outOfSampleEvidenceId: string;
  readonly leakageFree: boolean;
  readonly rankInformationCoefficient: number | null;
  readonly maxDrawdown: number | null;
  readonly turnover: number | null;
  readonly evidenceId: string;
}

export interface CommodityStressEvidenceReport {
  readonly contractVersion: typeof COMMODITY_STRESS_EVIDENCE_CONTRACT_VERSION;
  readonly modelId: CommodityResearchModelId;
  readonly modelVersion: '0.1.0';
  readonly policy: CommodityStressPolicy;
  readonly scenarios: readonly CommodityStressScenarioResult[];
  readonly blockers: readonly string[];
  readonly evidenceComplete: boolean;
  readonly evidenceId: string;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityChampionChallengerDiff {
  readonly currentChampion: Readonly<{
    modelId: string;
    version: string;
    featureContractVersion: string;
    resultContractVersion: string;
    executorKey: string;
  }>;
  readonly challenger: Readonly<{
    modelId: CommodityResearchModelId;
    version: '0.1.0';
    featureContractVersion: string;
    executorKey: string;
  }>;
  readonly changedDimensions: readonly string[];
  readonly rollbackTarget: Readonly<{
    modelId: string;
    version: string;
  }>;
}

export interface CommodityPromotionReviewPackage {
  readonly contractVersion: typeof COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly createdAt: string;
  readonly descriptor: CommodityImmutableModelDescriptor;
  readonly descriptorValidation: CommodityModelDescriptorValidation;
  readonly weightEvidence: CommodityWeightPromotionEvidenceAssessment;
  readonly providerResilience: CommodityProviderResilienceReport;
  readonly stressEvidence: CommodityStressEvidenceReport;
  readonly backtestResult: CommodityBacktestResult;
  readonly championChallengerDiff: CommodityChampionChallengerDiff | null;
  readonly blockers: readonly string[];
  readonly readyForOwnerReview: boolean;
  readonly packageFingerprint: string;
  readonly ownerDecisionRequired: true;
  readonly registryMutationPerformed: false;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityOwnerPromotionDecisionEvidence {
  readonly contractVersion: typeof COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION;
  readonly packageFingerprint: string;
  readonly decision: 'APPROVE' | 'REJECT';
  readonly principalType: 'HUMAN_OWNER';
  readonly principalId: string;
  readonly decidedAt: string;
  readonly evidenceId: string;
  readonly explicit: true;
}

export interface CommodityOwnerPromotionDecisionAssessment {
  readonly contractVersion: typeof COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION;
  readonly valid: boolean;
  readonly approvedForControlledPromotion: boolean;
  readonly blockers: readonly string[];
  readonly packageFingerprint: string;
  readonly registryMutationPerformed: false;
  readonly canonical: false;
  readonly scoreEligible: false;
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isSemver(value: string): boolean {
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.trim());
}

function finiteRatio(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function modelForId(modelId: CommodityResearchModelId): CommodityResearchModelContract {
  const model = COMMODITY_RESEARCH_MODEL_CONTRACTS.find(item => item.modelId === modelId);
  if (!model) throw new Error(`COMMODITY_RESEARCH_MODEL_NOT_FOUND:${modelId}`);
  return model;
}

function registryChallenger(modelId: CommodityResearchModelId): ScoringModelDescriptor | null {
  return DEFAULT_SCORING_MODELS.find(model => model.modelId === modelId && model.lifecycle === 'challenger') ?? null;
}

function currentCommodityChampion(): ScoringModelDescriptor | null {
  const candidates = DEFAULT_SCORING_MODELS
    .filter(model => model.assetClasses.includes('commodity')
      && model.lifecycle === 'canonical'
      && model.alias === 'champion'
      && model.scoreEligible !== false)
    .sort((left, right) => right.priority - left.priority || left.modelId.localeCompare(right.modelId));
  return candidates[0] ?? null;
}

function canonicalDescriptorIdentity(input: Omit<CommodityImmutableModelDescriptor, 'descriptorFingerprint'>): unknown {
  return {
    contractVersion: input.contractVersion,
    descriptorId: input.descriptorId,
    descriptorVersion: input.descriptorVersion,
    modelId: input.modelId,
    modelVersion: input.modelVersion,
    featureContractVersion: input.featureContractVersion,
    weightContractVersion: input.weightContractVersion,
    evidenceContractVersions: input.evidenceContractVersions,
    weightProfileId: input.weightProfileId,
    weightProfileVersion: input.weightProfileVersion,
    effectiveWeightFingerprint: input.effectiveWeightFingerprint,
    supportedSources: [...input.supportedSources].sort(),
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    createdAt: input.createdAt,
    lineage: input.lineage,
    lifecycle: input.lifecycle,
    immutable: input.immutable,
    runtimeExecutable: input.runtimeExecutable,
    canonical: input.canonical,
    scoreEligible: input.scoreEligible,
  };
}

export function buildCommodityImmutableModelDescriptor(input: {
  readonly descriptorId: string;
  readonly descriptorVersion: string;
  readonly modelId: CommodityResearchModelId;
  readonly weightProfile: CommodityCandidateWeightProfile;
  readonly weightValidation: CommodityCandidateWeightValidation;
  readonly supportedSources: readonly CommodityPromotionSupportedSource[];
  readonly validFrom: string;
  readonly validUntil?: string | null;
  readonly createdAt: string;
  readonly lineage: CommodityModelCalibrationLineage;
}): CommodityImmutableModelDescriptor {
  const model = modelForId(input.modelId);
  const descriptorBase = {
    contractVersion: COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION,
    descriptorId: input.descriptorId.trim(),
    descriptorVersion: input.descriptorVersion.trim(),
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    featureContractVersion: model.featureContractVersion,
    weightContractVersion: COMMODITY_WEIGHT_VALIDATION_CONTRACT_VERSION,
    evidenceContractVersions: Object.freeze({
      dq: COMMODITY_RESEARCH_DQ_POLICY_VERSION,
      correlation: COMMODITY_CORRELATION_POLICY_VERSION,
      weightStability: COMMODITY_WEIGHT_STABILITY_VERSION,
      backtest: COMMODITY_BACKTEST_CONTRACT_VERSION,
      historicalVintage: COMMODITY_HISTORICAL_VINTAGE_CONTRACT_VERSION,
    }),
    weightProfileId: input.weightProfile.profileId,
    weightProfileVersion: input.weightProfile.profileVersion,
    effectiveWeightFingerprint: input.weightValidation.factorWeightFingerprint ?? '',
    supportedSources: Object.freeze([...new Set(input.supportedSources)].sort()) as readonly CommodityPromotionSupportedSource[],
    validFrom: input.validFrom,
    validUntil: input.validUntil ?? null,
    createdAt: input.createdAt,
    lineage: Object.freeze({ ...input.lineage }),
    lifecycle: 'challenger' as const,
    immutable: true as const,
    runtimeExecutable: false as const,
    canonical: false as const,
    scoreEligible: false as const,
  };
  const descriptorFingerprint = `sha256:${sha256(canonicalDescriptorIdentity(descriptorBase))}`;
  return Object.freeze({ ...descriptorBase, descriptorFingerprint });
}

export function validateCommodityImmutableModelDescriptor(
  descriptor: CommodityImmutableModelDescriptor,
): CommodityModelDescriptorValidation {
  const blockers: string[] = [];
  const model = modelForId(descriptor.modelId);
  const challenger = registryChallenger(descriptor.modelId);

  if (descriptor.contractVersion !== COMMODITY_MODEL_DESCRIPTOR_CONTRACT_VERSION) blockers.push('MODEL_DESCRIPTOR_CONTRACT_VERSION_MISMATCH');
  if (!descriptor.descriptorId.trim()) blockers.push('MODEL_DESCRIPTOR_ID_REQUIRED');
  if (!isSemver(descriptor.descriptorVersion)) blockers.push('MODEL_DESCRIPTOR_VERSION_INVALID');
  if (descriptor.modelVersion !== model.modelVersion) blockers.push('MODEL_DESCRIPTOR_MODEL_VERSION_MISMATCH');
  if (descriptor.featureContractVersion !== model.featureContractVersion) blockers.push('MODEL_DESCRIPTOR_FEATURE_CONTRACT_MISMATCH');
  if (!isSemver(descriptor.weightProfileVersion)) blockers.push('MODEL_DESCRIPTOR_WEIGHT_PROFILE_VERSION_INVALID');
  if (!descriptor.weightProfileId.trim()) blockers.push('MODEL_DESCRIPTOR_WEIGHT_PROFILE_ID_REQUIRED');
  if (!/^sha256:[0-9a-f]{64}$/i.test(descriptor.effectiveWeightFingerprint)) blockers.push('MODEL_DESCRIPTOR_WEIGHT_FINGERPRINT_INVALID');
  if (descriptor.supportedSources.length === 0) blockers.push('MODEL_DESCRIPTOR_SUPPORTED_SOURCE_REQUIRED');
  if (new Set(descriptor.supportedSources).size !== descriptor.supportedSources.length) blockers.push('MODEL_DESCRIPTOR_SUPPORTED_SOURCE_DUPLICATE');
  if (!isTimestamp(descriptor.validFrom) || !isTimestamp(descriptor.createdAt)) blockers.push('MODEL_DESCRIPTOR_TIMESTAMP_INVALID');
  if (descriptor.validUntil !== null) {
    if (!isTimestamp(descriptor.validUntil)) blockers.push('MODEL_DESCRIPTOR_VALID_UNTIL_INVALID');
    else if (isTimestamp(descriptor.validFrom) && Date.parse(descriptor.validUntil) <= Date.parse(descriptor.validFrom)) blockers.push('MODEL_DESCRIPTOR_VALIDITY_RANGE_INVALID');
  }
  if (descriptor.lifecycle !== 'challenger' || descriptor.runtimeExecutable !== false || descriptor.canonical !== false || descriptor.scoreEligible !== false || descriptor.immutable !== true) {
    blockers.push('MODEL_DESCRIPTOR_MUST_REMAIN_NON_EXECUTABLE_CHALLENGER');
  }
  if (!challenger) blockers.push('MODEL_DESCRIPTOR_REGISTRY_CHALLENGER_MISSING');
  else {
    if (challenger.version !== descriptor.modelVersion) blockers.push('MODEL_DESCRIPTOR_REGISTRY_VERSION_MISMATCH');
    if (challenger.featureContractVersion !== descriptor.featureContractVersion) blockers.push('MODEL_DESCRIPTOR_REGISTRY_FEATURE_CONTRACT_MISMATCH');
    if (challenger.executorKey !== RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY) blockers.push('MODEL_DESCRIPTOR_REGISTRY_EXECUTOR_NOT_RESEARCH_ONLY');
    if (challenger.scoreEligible !== false) blockers.push('MODEL_DESCRIPTOR_REGISTRY_CHALLENGER_SCORE_ELIGIBLE');
  }

  const lineageEntries = Object.entries(descriptor.lineage);
  for (const [key, value] of lineageEntries) {
    if (!String(value ?? '').trim()) blockers.push(`MODEL_DESCRIPTOR_LINEAGE_REQUIRED:${key}`);
  }
  if (!/^sha256:[0-9a-f]{64}$/i.test(descriptor.lineage.datasetFingerprint)) blockers.push('MODEL_DESCRIPTOR_DATASET_FINGERPRINT_INVALID');

  const expectedFingerprint = `sha256:${sha256(canonicalDescriptorIdentity({
    ...descriptor,
    descriptorFingerprint: undefined,
  } as unknown as Omit<CommodityImmutableModelDescriptor, 'descriptorFingerprint'>))}`;
  if (descriptor.descriptorFingerprint !== expectedFingerprint) blockers.push('MODEL_DESCRIPTOR_FINGERPRINT_MISMATCH');

  return Object.freeze({
    valid: blockers.length === 0,
    blockers: Object.freeze(blockers),
    descriptorFingerprint: descriptor.descriptorFingerprint,
    canonical: false,
    scoreEligible: false,
    runtimeExecutable: false,
  });
}

export function buildCommodityProviderResilienceReport(input: {
  readonly modelId: CommodityResearchModelId;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly policy: CommodityProviderResiliencePolicy;
  readonly observations: readonly CommodityProviderResilienceObservation[];
}): CommodityProviderResilienceReport {
  const model = modelForId(input.modelId);
  const blockers: string[] = [];
  const policy = input.policy;

  if (!policy.policyId.trim() || !isSemver(policy.policyVersion)) blockers.push('PROVIDER_RESILIENCE_POLICY_INVALID');
  if (!finiteRatio(policy.minimumAvailabilityRate)) blockers.push('PROVIDER_RESILIENCE_AVAILABILITY_THRESHOLD_INVALID');
  if (!finiteRatio(policy.minimumFreshnessPassRate)) blockers.push('PROVIDER_RESILIENCE_FRESHNESS_THRESHOLD_INVALID');
  if (!finiteRatio(policy.maximumErrorRate)) blockers.push('PROVIDER_RESILIENCE_ERROR_THRESHOLD_INVALID');
  if (!Number.isInteger(policy.maximumCircuitOpenEvents) || policy.maximumCircuitOpenEvents < 0) blockers.push('PROVIDER_RESILIENCE_CIRCUIT_THRESHOLD_INVALID');
  if (policy.maximumP95LatencyMs !== null && (!Number.isFinite(policy.maximumP95LatencyMs) || policy.maximumP95LatencyMs <= 0)) blockers.push('PROVIDER_RESILIENCE_LATENCY_THRESHOLD_INVALID');
  if (!isTimestamp(input.windowStart) || !isTimestamp(input.windowEnd) || Date.parse(input.windowStart) >= Date.parse(input.windowEnd)) blockers.push('PROVIDER_RESILIENCE_WINDOW_INVALID');
  if (input.observations.length === 0) blockers.push('PROVIDER_RESILIENCE_OBSERVATION_REQUIRED');

  const seen = new Set<string>();
  for (const observation of input.observations) {
    if (seen.has(observation.providerId)) blockers.push(`PROVIDER_RESILIENCE_DUPLICATE_PROVIDER:${observation.providerId}`);
    seen.add(observation.providerId);
    if (!Number.isInteger(observation.sampleCount) || observation.sampleCount < 1) blockers.push(`PROVIDER_RESILIENCE_SAMPLE_COUNT_INVALID:${observation.providerId}`);
    if (!finiteRatio(observation.availabilityRate)) blockers.push(`PROVIDER_RESILIENCE_AVAILABILITY_INVALID:${observation.providerId}`);
    if (!finiteRatio(observation.freshnessPassRate)) blockers.push(`PROVIDER_RESILIENCE_FRESHNESS_INVALID:${observation.providerId}`);
    if (!finiteRatio(observation.errorRate)) blockers.push(`PROVIDER_RESILIENCE_ERROR_RATE_INVALID:${observation.providerId}`);
    if (!Number.isInteger(observation.circuitOpenEvents) || observation.circuitOpenEvents < 0) blockers.push(`PROVIDER_RESILIENCE_CIRCUIT_EVENTS_INVALID:${observation.providerId}`);
    if (observation.p95LatencyMs !== null && (!Number.isFinite(observation.p95LatencyMs) || observation.p95LatencyMs < 0)) blockers.push(`PROVIDER_RESILIENCE_LATENCY_INVALID:${observation.providerId}`);
    if (!observation.evidenceId.trim()) blockers.push(`PROVIDER_RESILIENCE_EVIDENCE_REQUIRED:${observation.providerId}`);
    if (observation.required) {
      if (observation.availabilityRate < policy.minimumAvailabilityRate) blockers.push(`PROVIDER_RESILIENCE_AVAILABILITY_BELOW_POLICY:${observation.providerId}`);
      if (observation.freshnessPassRate < policy.minimumFreshnessPassRate) blockers.push(`PROVIDER_RESILIENCE_FRESHNESS_BELOW_POLICY:${observation.providerId}`);
      if (observation.errorRate > policy.maximumErrorRate) blockers.push(`PROVIDER_RESILIENCE_ERROR_ABOVE_POLICY:${observation.providerId}`);
      if (observation.circuitOpenEvents > policy.maximumCircuitOpenEvents) blockers.push(`PROVIDER_RESILIENCE_CIRCUIT_ABOVE_POLICY:${observation.providerId}`);
      if (policy.maximumP95LatencyMs !== null && observation.p95LatencyMs !== null && observation.p95LatencyMs > policy.maximumP95LatencyMs) blockers.push(`PROVIDER_RESILIENCE_LATENCY_ABOVE_POLICY:${observation.providerId}`);
    }
  }

  const evidenceId = `commodity-provider-resilience:${sha256({
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    policy,
    observations: [...input.observations].sort((a, b) => a.providerId.localeCompare(b.providerId)),
  })}`;

  return Object.freeze({
    contractVersion: COMMODITY_PROVIDER_RESILIENCE_CONTRACT_VERSION,
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    policy: Object.freeze({ ...policy }),
    observations: Object.freeze(input.observations.map(item => Object.freeze({ ...item }))),
    blockers: Object.freeze(blockers),
    evidenceComplete: blockers.length === 0 && input.observations.some(item => item.required),
    evidenceId,
    canonical: false,
    scoreEligible: false,
  });
}

export function buildCommodityStressEvidenceReport(input: {
  readonly modelId: CommodityResearchModelId;
  readonly policy: CommodityStressPolicy;
  readonly scenarios: readonly CommodityStressScenarioResult[];
}): CommodityStressEvidenceReport {
  const model = modelForId(input.modelId);
  const blockers: string[] = [];
  const policy = input.policy;

  if (!policy.policyId.trim() || !isSemver(policy.policyVersion)) blockers.push('STRESS_POLICY_INVALID');
  if (policy.requiredScenarioIds.length === 0) blockers.push('STRESS_REQUIRED_SCENARIO_REQUIRED');
  if (new Set(policy.requiredScenarioIds).size !== policy.requiredScenarioIds.length) blockers.push('STRESS_REQUIRED_SCENARIO_DUPLICATE');
  if (policy.minimumRankInformationCoefficient !== null && (!Number.isFinite(policy.minimumRankInformationCoefficient) || policy.minimumRankInformationCoefficient < -1 || policy.minimumRankInformationCoefficient > 1)) blockers.push('STRESS_RANK_IC_THRESHOLD_INVALID');
  if (policy.maximumAbsoluteDrawdown !== null && (!Number.isFinite(policy.maximumAbsoluteDrawdown) || policy.maximumAbsoluteDrawdown < 0 || policy.maximumAbsoluteDrawdown > 1)) blockers.push('STRESS_DRAWDOWN_THRESHOLD_INVALID');
  if (policy.maximumTurnover !== null && (!Number.isFinite(policy.maximumTurnover) || policy.maximumTurnover < 0)) blockers.push('STRESS_TURNOVER_THRESHOLD_INVALID');

  const byScenario = new Map<string, CommodityStressScenarioResult>();
  for (const scenario of input.scenarios) {
    if (!scenario.scenarioId.trim()) blockers.push('STRESS_SCENARIO_ID_REQUIRED');
    if (byScenario.has(scenario.scenarioId)) blockers.push(`STRESS_SCENARIO_DUPLICATE:${scenario.scenarioId}`);
    byScenario.set(scenario.scenarioId, scenario);
    if (!scenario.regime.trim()) blockers.push(`STRESS_REGIME_REQUIRED:${scenario.scenarioId}`);
    if (!scenario.outOfSampleEvidenceId.trim()) blockers.push(`STRESS_OOS_EVIDENCE_REQUIRED:${scenario.scenarioId}`);
    if (!scenario.evidenceId.trim()) blockers.push(`STRESS_EVIDENCE_REQUIRED:${scenario.scenarioId}`);
    if (!scenario.leakageFree) blockers.push(`STRESS_LEAKAGE_BLOCKER:${scenario.scenarioId}`);
    if (scenario.rankInformationCoefficient !== null && (!Number.isFinite(scenario.rankInformationCoefficient) || scenario.rankInformationCoefficient < -1 || scenario.rankInformationCoefficient > 1)) blockers.push(`STRESS_RANK_IC_INVALID:${scenario.scenarioId}`);
    if (scenario.maxDrawdown !== null && (!Number.isFinite(scenario.maxDrawdown) || scenario.maxDrawdown > 0 || scenario.maxDrawdown < -1)) blockers.push(`STRESS_DRAWDOWN_INVALID:${scenario.scenarioId}`);
    if (scenario.turnover !== null && (!Number.isFinite(scenario.turnover) || scenario.turnover < 0)) blockers.push(`STRESS_TURNOVER_INVALID:${scenario.scenarioId}`);
  }

  for (const scenarioId of policy.requiredScenarioIds) {
    const scenario = byScenario.get(scenarioId);
    if (!scenario) {
      blockers.push(`STRESS_REQUIRED_SCENARIO_MISSING:${scenarioId}`);
      continue;
    }
    if (policy.minimumRankInformationCoefficient !== null
      && (scenario.rankInformationCoefficient === null || scenario.rankInformationCoefficient < policy.minimumRankInformationCoefficient)) {
      blockers.push(`STRESS_RANK_IC_BELOW_POLICY:${scenarioId}`);
    }
    if (policy.maximumAbsoluteDrawdown !== null
      && (scenario.maxDrawdown === null || Math.abs(scenario.maxDrawdown) > policy.maximumAbsoluteDrawdown)) {
      blockers.push(`STRESS_DRAWDOWN_ABOVE_POLICY:${scenarioId}`);
    }
    if (policy.maximumTurnover !== null
      && (scenario.turnover === null || scenario.turnover > policy.maximumTurnover)) {
      blockers.push(`STRESS_TURNOVER_ABOVE_POLICY:${scenarioId}`);
    }
  }

  const evidenceId = `commodity-stress:${sha256({
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    policy,
    scenarios: [...input.scenarios].sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)),
  })}`;

  return Object.freeze({
    contractVersion: COMMODITY_STRESS_EVIDENCE_CONTRACT_VERSION,
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    policy: Object.freeze({ ...policy, requiredScenarioIds: Object.freeze([...policy.requiredScenarioIds]) }),
    scenarios: Object.freeze(input.scenarios.map(item => Object.freeze({ ...item }))),
    blockers: Object.freeze(blockers),
    evidenceComplete: blockers.length === 0,
    evidenceId,
    canonical: false,
    scoreEligible: false,
  });
}

function buildChampionChallengerDiff(descriptor: CommodityImmutableModelDescriptor): CommodityChampionChallengerDiff | null {
  const champion = currentCommodityChampion();
  const challenger = registryChallenger(descriptor.modelId);
  if (!champion || !challenger) return null;
  const changedDimensions = [
    champion.modelId !== challenger.modelId ? 'modelId' : null,
    champion.version !== challenger.version ? 'modelVersion' : null,
    champion.featureContractVersion !== challenger.featureContractVersion ? 'featureContractVersion' : null,
    champion.resultContractVersion !== challenger.resultContractVersion ? 'resultContractVersion' : null,
    champion.executorKey !== challenger.executorKey ? 'executorKey' : null,
    champion.evidencePolicy !== challenger.evidencePolicy ? 'evidencePolicy' : null,
  ].filter((value): value is string => value !== null);

  return Object.freeze({
    currentChampion: Object.freeze({
      modelId: champion.modelId,
      version: champion.version,
      featureContractVersion: champion.featureContractVersion,
      resultContractVersion: champion.resultContractVersion,
      executorKey: champion.executorKey,
    }),
    challenger: Object.freeze({
      modelId: descriptor.modelId,
      version: descriptor.modelVersion,
      featureContractVersion: descriptor.featureContractVersion,
      executorKey: challenger.executorKey,
    }),
    changedDimensions: Object.freeze(changedDimensions),
    rollbackTarget: Object.freeze({ modelId: champion.modelId, version: champion.version }),
  });
}

export function buildCommodityPromotionReviewPackage(input: {
  readonly packageId: string;
  readonly packageVersion: string;
  readonly createdAt: string;
  readonly descriptor: CommodityImmutableModelDescriptor;
  readonly weightValidation: CommodityCandidateWeightValidation;
  readonly correlationReport: CommodityCorrelationReport | null;
  readonly stabilityReport: CommodityWeightStabilityReport | null;
  readonly backtestResult: CommodityBacktestResult | null;
  readonly providerResilience: CommodityProviderResilienceReport;
  readonly stressEvidence: CommodityStressEvidenceReport;
}): CommodityPromotionReviewPackage {
  const blockers: string[] = [];
  const descriptorValidation = validateCommodityImmutableModelDescriptor(input.descriptor);
  if (!input.packageId.trim()) blockers.push('PROMOTION_PACKAGE_ID_REQUIRED');
  if (!isSemver(input.packageVersion)) blockers.push('PROMOTION_PACKAGE_VERSION_INVALID');
  if (!isTimestamp(input.createdAt)) blockers.push('PROMOTION_PACKAGE_CREATED_AT_INVALID');
  if (!descriptorValidation.valid) blockers.push(...descriptorValidation.blockers.map(item => `DESCRIPTOR:${item}`));

  const weightEvidence = assessCommodityWeightPromotionEvidence({
    weightValidation: input.weightValidation,
    correlationReport: input.correlationReport,
    stabilityReport: input.stabilityReport,
    backtestResult: input.backtestResult,
  });
  if (!weightEvidence.readyForOwnerReview) blockers.push(...weightEvidence.blockers.map(item => `WEIGHT_EVIDENCE:${item}`));
  if (!input.providerResilience.evidenceComplete) blockers.push(...input.providerResilience.blockers.map(item => `PROVIDER_RESILIENCE:${item}`));
  if (!input.stressEvidence.evidenceComplete) blockers.push(...input.stressEvidence.blockers.map(item => `STRESS_EVIDENCE:${item}`));
  if (!input.backtestResult) blockers.push('BACKTEST_RESULT_REQUIRED');
  else {
    if (input.backtestResult.request.modelId !== input.descriptor.modelId) blockers.push('BACKTEST_MODEL_ID_MISMATCH');
    if (input.backtestResult.request.modelVersion !== input.descriptor.modelVersion) blockers.push('BACKTEST_MODEL_VERSION_MISMATCH');
    if (input.backtestResult.runId !== input.descriptor.lineage.backtestRunId) blockers.push('BACKTEST_RUN_LINEAGE_MISMATCH');
    if (input.backtestResult.outOfSampleEvidenceId !== input.descriptor.lineage.outOfSampleEvidenceId) blockers.push('BACKTEST_OOS_LINEAGE_MISMATCH');
    if (input.backtestResult.correlationEvidenceId !== input.descriptor.lineage.correlationEvidenceId) blockers.push('BACKTEST_CORRELATION_LINEAGE_MISMATCH');
    if (input.backtestResult.sensitivityEvidenceId !== input.descriptor.lineage.sensitivityEvidenceId) blockers.push('BACKTEST_SENSITIVITY_LINEAGE_MISMATCH');
  }
  if (input.providerResilience.modelId !== input.descriptor.modelId) blockers.push('PROVIDER_RESILIENCE_MODEL_MISMATCH');
  if (input.stressEvidence.modelId !== input.descriptor.modelId) blockers.push('STRESS_EVIDENCE_MODEL_MISMATCH');

  const requiredSources = new Set(input.descriptor.supportedSources);
  const resilienceSources = new Set(input.providerResilience.observations.filter(item => item.required).map(item => item.providerId));
  for (const source of requiredSources) {
    if (!resilienceSources.has(source)) blockers.push(`PROVIDER_RESILIENCE_REQUIRED_SOURCE_MISSING:${source}`);
  }

  const diff = buildChampionChallengerDiff(input.descriptor);
  if (!diff) blockers.push('CHAMPION_CHALLENGER_DIFF_UNAVAILABLE');
  else if (diff.rollbackTarget.modelId !== 'commodity-evidence-scoring') blockers.push('ROLLBACK_TARGET_NOT_CURRENT_COMMODITY_CHAMPION');

  const packageIdentity = {
    contractVersion: COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION,
    packageId: input.packageId.trim(),
    packageVersion: input.packageVersion.trim(),
    createdAt: input.createdAt,
    descriptorFingerprint: input.descriptor.descriptorFingerprint,
    weightFingerprint: input.descriptor.effectiveWeightFingerprint,
    backtestRunId: input.backtestResult?.runId ?? null,
    oosEvidenceId: input.backtestResult?.outOfSampleEvidenceId ?? null,
    correlationEvidenceId: input.backtestResult?.correlationEvidenceId ?? null,
    sensitivityEvidenceId: input.backtestResult?.sensitivityEvidenceId ?? null,
    providerResilienceEvidenceId: input.providerResilience.evidenceId,
    stressEvidenceId: input.stressEvidence.evidenceId,
    currentChampion: diff?.currentChampion ?? null,
    rollbackTarget: diff?.rollbackTarget ?? null,
    blockers: [...blockers].sort(),
  };
  const packageFingerprint = `sha256:${sha256(packageIdentity)}`;

  return Object.freeze({
    contractVersion: COMMODITY_PROMOTION_PACKAGE_CONTRACT_VERSION,
    packageId: input.packageId.trim(),
    packageVersion: input.packageVersion.trim(),
    createdAt: input.createdAt,
    descriptor: input.descriptor,
    descriptorValidation,
    weightEvidence,
    providerResilience: input.providerResilience,
    stressEvidence: input.stressEvidence,
    backtestResult: input.backtestResult ?? ({
      contractVersion: COMMODITY_BACKTEST_CONTRACT_VERSION,
      runId: 'missing',
    } as CommodityBacktestResult),
    championChallengerDiff: diff,
    blockers: Object.freeze(blockers),
    readyForOwnerReview: blockers.length === 0,
    packageFingerprint,
    ownerDecisionRequired: true,
    registryMutationPerformed: false,
    canonical: false,
    scoreEligible: false,
  });
}

/**
 * Validates explicit Human/Owner decision evidence against the exact review-package fingerprint.
 * This function still does not mutate ScoringModelRegistry or ScoringDispatcher. Controlled
 * promotion remains a separate Human-gated repository change on a fresh branch.
 */
export function assessCommodityOwnerPromotionDecision(
  reviewPackage: CommodityPromotionReviewPackage,
  decision: CommodityOwnerPromotionDecisionEvidence,
): CommodityOwnerPromotionDecisionAssessment {
  const blockers: string[] = [];
  if (decision.contractVersion !== COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION) blockers.push('OWNER_DECISION_CONTRACT_VERSION_MISMATCH');
  if (!reviewPackage.readyForOwnerReview) blockers.push('PROMOTION_PACKAGE_NOT_READY_FOR_OWNER_REVIEW');
  if (decision.packageFingerprint !== reviewPackage.packageFingerprint) blockers.push('OWNER_DECISION_PACKAGE_FINGERPRINT_MISMATCH');
  if (decision.principalType !== 'HUMAN_OWNER') blockers.push('OWNER_DECISION_PRINCIPAL_TYPE_INVALID');
  if (!decision.principalId.trim()) blockers.push('OWNER_DECISION_PRINCIPAL_REQUIRED');
  if (!isTimestamp(decision.decidedAt)) blockers.push('OWNER_DECISION_TIMESTAMP_INVALID');
  if (!decision.evidenceId.trim()) blockers.push('OWNER_DECISION_EVIDENCE_REQUIRED');
  if (decision.explicit !== true) blockers.push('OWNER_DECISION_MUST_BE_EXPLICIT');

  return Object.freeze({
    contractVersion: COMMODITY_OWNER_PROMOTION_DECISION_CONTRACT_VERSION,
    valid: blockers.length === 0,
    approvedForControlledPromotion: blockers.length === 0 && decision.decision === 'APPROVE',
    blockers: Object.freeze(blockers),
    packageFingerprint: reviewPackage.packageFingerprint,
    registryMutationPerformed: false,
    canonical: false,
    scoreEligible: false,
  });
}
