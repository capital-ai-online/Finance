import fs from 'node:fs';
import path from 'node:path';

export const FINTECH_VALUE_CHAIN_QUALITY_SCHEMA = 'fintech-value-chain-quality/1.0.0' as const;
export const FINTECH_VALUE_CHAIN_AUTHORITY = 'SC-MD-SPT-0001' as const;
export const FINTECH_VALUE_CHAIN_NON_AUTHORIZING_STATEMENT =
  'This projection is read-only structural/evidence validation. It does not change market data, identity, entitlements, classification, scoring, confidence, ranking, eligibility, provider routing, release or deployment decisions.' as const;

export type FintechValueChainStageStatus = 'CONNECTED' | 'NOT_AVAILABLE';

export interface FintechValueChainStageDefinition {
  id: string;
  name: string;
  runtimeArtifacts: readonly string[];
  evidenceArtifacts: readonly string[];
  authorityRefs: readonly string[];
}

export interface FintechValueChainStageResult extends FintechValueChainStageDefinition {
  status: FintechValueChainStageStatus;
  missingRuntimeArtifacts: readonly string[];
  missingEvidenceArtifacts: readonly string[];
}

export interface FintechValueChainHotPathIsolation {
  isolated: boolean;
  checkedArtifacts: readonly string[];
  directQualityImports: readonly string[];
}

export interface FintechValueChainQualityReport {
  schemaVersion: typeof FINTECH_VALUE_CHAIN_QUALITY_SCHEMA;
  checkedAt: string;
  authority: typeof FINTECH_VALUE_CHAIN_AUTHORITY;
  homogeneous: boolean;
  connectedStages: number;
  totalStages: number;
  stages: readonly FintechValueChainStageResult[];
  hotPathIsolation: FintechValueChainHotPathIsolation;
  nonAuthorizingStatement: typeof FINTECH_VALUE_CHAIN_NON_AUTHORIZING_STATEMENT;
}

/**
 * Read-only structural projection of SC-MD-SPT-0001 v1.1.0.
 *
 * The projection deliberately includes the request/IAM/entitlement/runtime stages and the
 * verified-display branch introduced by the 2026-08-20 ADR-0032 revalidation. Quality only checks
 * that the authoritative runtime/evidence artifacts exist; it does not authorize or execute them.
 */
const DEFAULT_STAGES: readonly FintechValueChainStageDefinition[] = Object.freeze([
  Object.freeze({
    id: 'VC-01-REQUEST-INTAKE',
    name: 'Request Intake',
    runtimeArtifacts: Object.freeze(['server.application.ts']),
    evidenceArtifacts: Object.freeze(['tests/server/applicationRouteComposition.contract.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001']),
  }),
  Object.freeze({
    id: 'VC-02-IDENTITY-ACCESS',
    name: 'Identity / Access',
    runtimeArtifacts: Object.freeze(['src/platform/Security/authMiddleware.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/authMiddlewareAal2.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001']),
  }),
  Object.freeze({
    id: 'VC-03-ENTITLEMENT-USAGE',
    name: 'Entitlement / Usage Gate',
    runtimeArtifacts: Object.freeze(['server/entitlements.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/subscriptionEntitlements.test.ts', 'tests/unit/buffetValueCheck.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0034']),
  }),
  Object.freeze({
    id: 'VC-04-ASSET-UAI',
    name: 'Asset Discovery / Universal Asset Identity',
    runtimeArtifacts: Object.freeze(['src/features/registry/registryRoutes.ts', 'src/platform/Scoring/UniversalAssetAdapter.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/assetSearchCatalog.test.ts', 'tests/unit/registryRoutes.test.ts', 'tests/unit/classificationAdapter.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0032']),
  }),
  Object.freeze({
    id: 'VC-05-ORCHESTRATION-RUNTIME-GUARD',
    name: 'Orchestration / Runtime Guard',
    runtimeArtifacts: Object.freeze([
      'server/marketData/marketDataRuntimeFacade.ts',
      'server/marketData/createApplicationMarketDataRuntime.ts',
    ]),
    evidenceArtifacts: Object.freeze(['tests/unit/marketDataRuntimeFacade.test.ts', 'tests/unit/applicationMarketDataRuntime.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0083']),
  }),
  Object.freeze({
    id: 'VC-06-EVIDENCE-ACQUISITION',
    name: 'Market-Data / Evidence Acquisition',
    runtimeArtifacts: Object.freeze(['src/platform/MarketData/MarketDataGateway.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/marketDataGateway.test.ts', 'tests/unit/externalMarketDataAdapters.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0041']),
  }),
  Object.freeze({
    id: 'VC-07-DATA-VALIDATION-PROVENANCE',
    name: 'Data Validation / Provenance / DQ',
    runtimeArtifacts: Object.freeze(['src/platform/MarketData/CompositeDataQuality.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/compositeDataQuality.test.ts', 'tests/unit/marketDataConsensus.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0032', 'ADR-0041']),
  }),
  Object.freeze({
    id: 'VC-08-DISPLAY-RESEARCH',
    name: 'Verified Display / Research Lane',
    runtimeArtifacts: Object.freeze(['src/services/verifiedAssetDisplay.ts', 'src/components/BuffetValueCheck.tsx']),
    evidenceArtifacts: Object.freeze(['tests/unit/verifiedAssetDisplayContract.test.ts', 'tests/unit/buffetValueCheck.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0032', 'ADR-0034']),
  }),
  Object.freeze({
    id: 'VC-09-CLASSIFICATION-FEATURE-CONTRACT',
    name: 'Classification + Feature Contract',
    runtimeArtifacts: Object.freeze(['src/platform/Scoring/contracts.ts', 'src/orchestrator/cryptoOrchestrator.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/classificationAdapter.test.ts', 'tests/unit/bondFeatureContract.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-10-SCORING-MODEL-REGISTRY',
    name: 'ScoringModelRegistry',
    runtimeArtifacts: Object.freeze(['src/platform/Scoring/ScoringModelRegistry.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/scoringModelRegistry.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-11-SCORING-DISPATCHER',
    name: 'ScoringDispatcher',
    runtimeArtifacts: Object.freeze(['src/platform/Scoring/ScoringDispatcher.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/scoringDispatcher.test.ts', 'tests/unit/sc2GlobalSingleDispatcher.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-12-DOMAIN-EXECUTOR',
    name: 'Domain Executor Adapter',
    runtimeArtifacts: Object.freeze(['src/platform/Scoring/ScoringExecutorAdapters.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/scoringExecutorAdapters.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-13-CANONICAL-SCORE-LINEAGE',
    name: 'CanonicalScoreResult + execution lineage',
    runtimeArtifacts: Object.freeze(['src/platform/Scoring/contracts.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/scoringLineage.test.ts', 'tests/unit/scoringIntegrity.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-14-CONFIDENCE-DQ',
    name: 'Confidence / DQ Composite',
    runtimeArtifacts: Object.freeze(['src/platform/MarketData/CompositeDataQuality.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/scoreConfidenceEvidence.test.ts', 'tests/unit/scoreConfidenceCalibration.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ADR-0087']),
  }),
  Object.freeze({
    id: 'VC-15-RANKING-COMPARABILITY',
    name: 'Ranking comparability gate',
    runtimeArtifacts: Object.freeze(['src/platform/Ranking/contracts.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/crossAssetRanking.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001']),
  }),
  Object.freeze({
    id: 'VC-16-RANKING-ELIGIBILITY-SLO',
    name: 'Ranking / Eligibility / SLO',
    runtimeArtifacts: Object.freeze(['src/services/ranking.service.ts']),
    evidenceArtifacts: Object.freeze(['tests/unit/screeningEligibility.test.ts', 'tests/unit/screeningSloEvidence.test.ts']),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001']),
  }),
  Object.freeze({
    id: 'VC-17-EVENT-TRACEABILITY-SUPERVISOR',
    name: 'EventMesh / Traceability / Supervisor',
    runtimeArtifacts: Object.freeze([
      'src/platform/EventMesh/manifest.json',
      'src/platform/Traceability/manifest.json',
      'src/platform/Supervisor/manifest.json',
    ]),
    evidenceArtifacts: Object.freeze([
      'tests/unit/eventMeshReplayReliability.test.ts',
      'tests/unit/traceabilityValidator.test.ts',
      'tests/unit/supervisor.test.ts',
    ]),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001', 'ESS-0011', 'ESS-0013', 'ESS-0002']),
  }),
  Object.freeze({
    id: 'VC-18-DELIVERY-SURFACES',
    name: 'API / UI / Alerts / downstream evidence',
    runtimeArtifacts: Object.freeze(['server.application.ts']),
    evidenceArtifacts: Object.freeze([
      'tests/unit/frontendFinancialDataContract.test.ts',
      'tests/unit/alerts.test.ts',
      'tests/server/applicationRouteComposition.contract.test.ts',
    ]),
    authorityRefs: Object.freeze(['SC-MD-SPT-0001']),
  }),
]);

const HOT_PATH_ARTIFACTS = Object.freeze([
  'server/entitlements.ts',
  'server/marketData/marketDataRuntimeFacade.ts',
  'src/services/verifiedAssetDisplay.ts',
  'src/platform/MarketData/MarketDataGateway.ts',
  'src/platform/Scoring/ScoringDispatcher.ts',
  'src/platform/Scoring/ScoringExecutorAdapters.ts',
  'src/services/ranking.service.ts',
  'src/orchestrator/cryptoOrchestrator.ts',
  'server.application.ts',
]);

function exists(repoRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function containsDirectQualityImport(repoRoot: string, relativePath: string): boolean {
  const absolute = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolute)) return false;
  const source = fs.readFileSync(absolute, 'utf8');
  return /(?:from\s+['"][^'"]*platform\/Quality|from\s+['"][^'"]*\/Quality|require\(['"][^'"]*platform\/Quality)/.test(source);
}

export class FintechValueChainQualityProjection {
  constructor(private readonly stages: readonly FintechValueChainStageDefinition[] = DEFAULT_STAGES) {}

  project(repoRoot = process.cwd(), checkedAt = new Date().toISOString()): FintechValueChainQualityReport {
    const stages = this.stages.map((definition) => {
      const missingRuntimeArtifacts = definition.runtimeArtifacts.filter((artifact) => !exists(repoRoot, artifact));
      const missingEvidenceArtifacts = definition.evidenceArtifacts.filter((artifact) => !exists(repoRoot, artifact));
      const status: FintechValueChainStageStatus =
        missingRuntimeArtifacts.length === 0 && missingEvidenceArtifacts.length === 0 ? 'CONNECTED' : 'NOT_AVAILABLE';

      return Object.freeze({
        ...definition,
        status,
        missingRuntimeArtifacts: Object.freeze(missingRuntimeArtifacts),
        missingEvidenceArtifacts: Object.freeze(missingEvidenceArtifacts),
      });
    });

    const checkedArtifacts = HOT_PATH_ARTIFACTS.filter((artifact) => exists(repoRoot, artifact));
    const directQualityImports = checkedArtifacts.filter((artifact) => containsDirectQualityImport(repoRoot, artifact));
    const hotPathIsolation = Object.freeze({
      isolated: checkedArtifacts.length === HOT_PATH_ARTIFACTS.length && directQualityImports.length === 0,
      checkedArtifacts: Object.freeze([...checkedArtifacts]),
      directQualityImports: Object.freeze([...directQualityImports]),
    });
    const connectedStages = stages.filter((stage) => stage.status === 'CONNECTED').length;

    return Object.freeze({
      schemaVersion: FINTECH_VALUE_CHAIN_QUALITY_SCHEMA,
      checkedAt,
      authority: FINTECH_VALUE_CHAIN_AUTHORITY,
      homogeneous: connectedStages === stages.length && hotPathIsolation.isolated,
      connectedStages,
      totalStages: stages.length,
      stages: Object.freeze(stages),
      hotPathIsolation,
      nonAuthorizingStatement: FINTECH_VALUE_CHAIN_NON_AUTHORIZING_STATEMENT,
    });
  }
}
