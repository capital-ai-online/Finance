export const FINTECH_WORDING_PROJECTION_SCHEMA = 'fintech-value-chain-wording/1.0.0' as const;
export const FINTECH_WORDING_AUTHORITY = 'SC-MD-SPT-0001' as const;

export const FINTECH_VALUE_CHAIN_STAGE_IDS = [
  'VC-01-REQUEST-INTAKE',
  'VC-02-IDENTITY-ACCESS',
  'VC-03-ENTITLEMENT-USAGE',
  'VC-04-ASSET-UAI',
  'VC-05-ORCHESTRATION-RUNTIME-GUARD',
  'VC-06-EVIDENCE-ACQUISITION',
  'VC-07-DATA-VALIDATION-PROVENANCE',
  'VC-08-DISPLAY-RESEARCH',
  'VC-09-CLASSIFICATION-FEATURE-CONTRACT',
  'VC-10-SCORING-MODEL-REGISTRY',
  'VC-11-SCORING-DISPATCHER',
  'VC-12-DOMAIN-EXECUTOR',
  'VC-13-CANONICAL-SCORE-LINEAGE',
  'VC-14-CONFIDENCE-DQ',
  'VC-15-RANKING-COMPARABILITY',
  'VC-16-RANKING-ELIGIBILITY-SLO',
  'VC-17-EVENT-TRACEABILITY-SUPERVISOR',
  'VC-18-DELIVERY-SURFACES',
] as const;

export type FintechValueChainStageId = (typeof FINTECH_VALUE_CHAIN_STAGE_IDS)[number];

export interface FintechValueChainWordingBinding {
  stageId: FintechValueChainStageId;
  stageName: string;
  conceptIds: string[];
  messageKeys: string[];
  authorityReferences: string[];
  financialDecisionAuthority: false;
  mutationAuthority: false;
}

export interface FintechWordingBindingFinding {
  code: 'DUPLICATE_STAGE' | 'MISSING_STAGE' | 'UNKNOWN_CONCEPT' | 'UNKNOWN_MESSAGE' | 'AUTHORITY_BOUNDARY';
  stageId?: string;
  message: string;
}
