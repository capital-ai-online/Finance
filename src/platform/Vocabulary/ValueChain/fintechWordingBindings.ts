import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import {
  FINTECH_VALUE_CHAIN_STAGE_IDS,
  type FintechValueChainWordingBinding,
  type FintechWordingBindingFinding,
} from './FintechWordingBinding';

export const fintechWordingBindings: FintechValueChainWordingBinding[] = [
  binding('VC-01-REQUEST-INTAKE', 'Request Intake', ['VOC-PRODUCT-0101'], ['valueChain.requestIntake.label']),
  binding('VC-02-IDENTITY-ACCESS', 'Identity / Access', ['VOC-IAM-0101'], ['valueChain.identityAccess.label']),
  binding('VC-03-ENTITLEMENT-USAGE', 'Entitlement / Usage Gate', ['VOC-BILLING-0101'], ['valueChain.entitlementUsage.label']),
  binding('VC-04-ASSET-UAI', 'Asset Discovery / Universal Asset Identity', ['VOC-ASSET-0101'], ['valueChain.assetIdentity.label']),
  binding('VC-05-ORCHESTRATION-RUNTIME-GUARD', 'Orchestration / Runtime Guard', ['VOC-ARCHITECTURE-0101'], ['valueChain.runtimeGuard.label']),
  binding('VC-06-EVIDENCE-ACQUISITION', 'Market-Data / Evidence Acquisition', ['VOC-ANALYTICS-0104'], ['valueChain.evidenceAcquisition.label']),
  binding('VC-07-DATA-VALIDATION-PROVENANCE', 'Data Validation / Provenance / DQ', ['VOC-ANALYTICS-0105'], ['valueChain.dataProvenance.label']),
  binding('VC-08-DISPLAY-RESEARCH', 'Verified Display / Research Lane', ['VOC-PRODUCT-0102'], ['valueChain.verifiedDisplay.label']),
  binding('VC-09-CLASSIFICATION-FEATURE-CONTRACT', 'Classification + Feature Contract', ['VOC-ANALYTICS-0106'], ['valueChain.classification.label']),
  binding('VC-10-SCORING-MODEL-REGISTRY', 'ScoringModelRegistry', ['VOC-ANALYTICS-0107'], ['valueChain.modelRegistry.label']),
  binding('VC-11-SCORING-DISPATCHER', 'ScoringDispatcher', ['VOC-ARCHITECTURE-0102'], ['valueChain.scoringDispatcher.label']),
  binding('VC-12-DOMAIN-EXECUTOR', 'Domain Executor Adapter', ['VOC-ARCHITECTURE-0103'], ['valueChain.domainExecutor.label']),
  binding('VC-13-CANONICAL-SCORE-LINEAGE', 'CanonicalScoreResult + execution lineage', ['VOC-ANALYTICS-0108'], ['valueChain.canonicalScore.label']),
  binding('VC-14-CONFIDENCE-DQ', 'Confidence / DQ Composite', ['VOC-ANALYTICS-0109'], ['valueChain.confidence.label']),
  binding('VC-15-RANKING-COMPARABILITY', 'Ranking comparability gate', ['VOC-ANALYTICS-0110'], ['valueChain.rankingComparability.label']),
  binding('VC-16-RANKING-ELIGIBILITY-SLO', 'Ranking / Eligibility / SLO', ['VOC-ANALYTICS-0111'], ['valueChain.rankingEligibility.label']),
  binding('VC-17-EVENT-TRACEABILITY-SUPERVISOR', 'EventMesh / Traceability / Supervisor', ['VOC-PLATFORM-0101'], ['valueChain.traceabilitySupervisor.label'], ['ESS-0011', 'ESS-0013']),
  binding('VC-18-DELIVERY-SURFACES', 'API / UI / Alerts / downstream evidence', ['VOC-PRODUCT-0103'], ['valueChain.deliverySurfaces.label']),
];

function binding(
  stageId: FintechValueChainWordingBinding['stageId'],
  stageName: string,
  conceptIds: string[],
  messageKeys: string[],
  extraAuthorityReferences: string[] = [],
): FintechValueChainWordingBinding {
  return {
    stageId,
    stageName,
    conceptIds,
    messageKeys,
    authorityReferences: ['SC-MD-SPT-0001', 'ESS-0017', ...extraAuthorityReferences],
    financialDecisionAuthority: false,
    mutationAuthority: false,
  };
}

export function validateFintechWordingBindings(
  vocabulary: IVocabularyRegistry,
  messages: UiMessageCatalog,
  bindings: readonly FintechValueChainWordingBinding[] = fintechWordingBindings,
): FintechWordingBindingFinding[] {
  const findings: FintechWordingBindingFinding[] = [];
  const seen = new Set<string>();

  for (const item of bindings) {
    if (seen.has(item.stageId)) {
      findings.push({ code: 'DUPLICATE_STAGE', stageId: item.stageId, message: `Duplicate stage binding: ${item.stageId}.` });
    }
    seen.add(item.stageId);

    if (item.financialDecisionAuthority !== false || item.mutationAuthority !== false) {
      findings.push({ code: 'AUTHORITY_BOUNDARY', stageId: item.stageId, message: 'Wording projection must remain non-authorizing and read-only.' });
    }

    for (const conceptId of item.conceptIds) {
      if (!vocabulary.getById(conceptId)) {
        findings.push({ code: 'UNKNOWN_CONCEPT', stageId: item.stageId, message: `Unknown Concept ID: ${conceptId}.` });
      }
    }

    for (const messageKey of item.messageKeys) {
      if (!messages.get(messageKey)) {
        findings.push({ code: 'UNKNOWN_MESSAGE', stageId: item.stageId, message: `Unknown Message Key: ${messageKey}.` });
      }
    }
  }

  for (const stageId of FINTECH_VALUE_CHAIN_STAGE_IDS) {
    if (!seen.has(stageId)) {
      findings.push({ code: 'MISSING_STAGE', stageId, message: `Missing wording projection for ${stageId}.` });
    }
  }

  return findings;
}
