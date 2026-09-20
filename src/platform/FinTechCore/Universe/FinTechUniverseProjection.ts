import type { FinTechCoreModule } from '../CoreContracts';
import type {
  ScoringModelDescriptor,
  UniversalAssetClass,
} from '../../Scoring/contracts';
import { SCORABLE_ASSET_CLASSES } from '../../Scoring/contracts';
import {
  SUBCATEGORY_TARGET_AVAILABLE_ASSETS,
  TOP_LEVEL_MINIMUM_AVAILABLE_ASSETS,
  UNIVERSE_SLA_CONTRACT_VERSION,
} from '../../Scoring/UniverseSla';

export const FINTECH_UNIVERSE_ORCHESTRATION_PROJECTION_VERSION =
  'fintech-universe-orchestration-projection/1.0.0' as const;

export type FinTechUniverseAttachmentState =
  | 'WORKFLOW_AND_SCORING'
  | 'SCORING_ONLY'
  | 'RESEARCH_ONLY'
  | 'UNSUPPORTED';

export interface FinTechUniverseModelProjection {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly lifecycle: ScoringModelDescriptor['lifecycle'];
  readonly alias: ScoringModelDescriptor['alias'];
  readonly evidencePolicy: ScoringModelDescriptor['evidencePolicy'];
  readonly scoreEligible: boolean;
  readonly instrumentKinds: readonly string[];
}

export interface FinTechUniverseClassProjection {
  readonly assetClass: UniversalAssetClass;
  readonly attachmentState: FinTechUniverseAttachmentState;
  readonly workflowModules: readonly string[];
  readonly canonicalModels: readonly FinTechUniverseModelProjection[];
  readonly researchModels: readonly FinTechUniverseModelProjection[];
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
  readonly workflowAuthority: 'FINTECH_CORE_MODULE_REGISTRY_ONLY';
  readonly universeSla: {
    readonly contractVersion: typeof UNIVERSE_SLA_CONTRACT_VERSION;
    readonly topLevelTarget: typeof TOP_LEVEL_MINIMUM_AVAILABLE_ASSETS;
    readonly subcategoryTarget: typeof SUBCATEGORY_TARGET_AVAILABLE_ASSETS;
    readonly syntheticFillAllowed: false;
  };
}

export interface FinTechUniverseOrchestrationProjection {
  readonly contractVersion: typeof FINTECH_UNIVERSE_ORCHESTRATION_PROJECTION_VERSION;
  readonly classes: readonly FinTechUniverseClassProjection[];
  readonly authority: {
    readonly scoring: 'SCORING_DISPATCHER_ONLY';
    readonly workflow: 'FINTECH_CORE_MODULE_REGISTRY_ONLY';
    readonly universe: 'UNIVERSE_SLA_EVIDENCE_ADMISSION_ONLY';
  };
}

function modelProjection(model: ScoringModelDescriptor): FinTechUniverseModelProjection {
  return Object.freeze({
    modelId: model.modelId,
    modelVersion: model.version,
    lifecycle: model.lifecycle,
    alias: model.alias,
    evidencePolicy: model.evidencePolicy,
    scoreEligible: model.scoreEligible !== false,
    instrumentKinds: Object.freeze([...(model.instrumentKinds ?? [])]),
  });
}

function attachmentState(
  workflowModules: readonly string[],
  canonicalModels: readonly FinTechUniverseModelProjection[],
  researchModels: readonly FinTechUniverseModelProjection[],
): FinTechUniverseAttachmentState {
  if (workflowModules.length > 0 && canonicalModels.length > 0) return 'WORKFLOW_AND_SCORING';
  if (canonicalModels.length > 0) return 'SCORING_ONLY';
  if (researchModels.length > 0) return 'RESEARCH_ONLY';
  return 'UNSUPPORTED';
}

/**
 * Read-only cross-asset projection over the existing FinTechCore module topology and the existing
 * ScoringModelRegistry. It does not register modules/models, resolve providers, calculate scores,
 * admit assets, or create a second universe/routing authority.
 */
export function projectFinTechUniverseOrchestration(
  models: readonly ScoringModelDescriptor[],
  modules: readonly FinTechCoreModule[],
): FinTechUniverseOrchestrationProjection {
  const classes = SCORABLE_ASSET_CLASSES.map((assetClass) => {
    const workflowModules = modules
      .filter((module) => module.descriptor.supportedAssetClasses.includes(assetClass))
      .map((module) => module.descriptor.moduleId)
      .sort();

    const canonicalModels = models
      .filter((model) => (
        model.assetClasses.includes(assetClass)
        && model.lifecycle === 'canonical'
        && model.alias === 'champion'
        && model.scoreEligible !== false
      ))
      .map(modelProjection)
      .sort((left, right) => left.modelId.localeCompare(right.modelId));

    const researchModels = models
      .filter((model) => (
        model.assetClasses.includes(assetClass)
        && (model.lifecycle === 'challenger' || model.evidencePolicy === 'research-only')
      ))
      .map(modelProjection)
      .sort((left, right) => left.modelId.localeCompare(right.modelId));

    return Object.freeze({
      assetClass,
      attachmentState: attachmentState(workflowModules, canonicalModels, researchModels),
      workflowModules: Object.freeze(workflowModules),
      canonicalModels: Object.freeze(canonicalModels),
      researchModels: Object.freeze(researchModels),
      scoreAuthority: 'SCORING_DISPATCHER_ONLY' as const,
      workflowAuthority: 'FINTECH_CORE_MODULE_REGISTRY_ONLY' as const,
      universeSla: Object.freeze({
        contractVersion: UNIVERSE_SLA_CONTRACT_VERSION,
        topLevelTarget: TOP_LEVEL_MINIMUM_AVAILABLE_ASSETS,
        subcategoryTarget: SUBCATEGORY_TARGET_AVAILABLE_ASSETS,
        syntheticFillAllowed: false as const,
      }),
    });
  });

  return Object.freeze({
    contractVersion: FINTECH_UNIVERSE_ORCHESTRATION_PROJECTION_VERSION,
    classes: Object.freeze(classes),
    authority: Object.freeze({
      scoring: 'SCORING_DISPATCHER_ONLY' as const,
      workflow: 'FINTECH_CORE_MODULE_REGISTRY_ONLY' as const,
      universe: 'UNIVERSE_SLA_EVIDENCE_ADMISSION_ONLY' as const,
    }),
  });
}
