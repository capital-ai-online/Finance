import type { RepositoryQualityObservation } from '../../Governance/Contracts/RepositoryQualityEvidence';
import type { Chapter12ValidationReport } from '../../Validators/Chapter12ValidatorContract';
import type { MandatoryValidatorName } from '../../Validators/MandatoryValidatorCatalog';
import {
  executionRecord,
  type QualityExecutionEvidenceSnapshot,
  type QualityExecutionPhase,
} from '../Execution/QualityExecutionEvidence';
import type {
  QualityGateDefinition,
  QualityGateReport,
  QualityGateResult,
  QualityGateStatus,
} from '../Contracts/QualityCenterContract';

export const QUALITY_GATE_RUNNER_VERSION = 'quality-gate-runner/1.1.0' as const;

export interface QualityGateEvidence {
  chapter12Validation?: Chapter12ValidationReport | null;
  executionEvidence?: QualityExecutionEvidenceSnapshot | null;
}

export const QUALITY_GATE_DEFINITIONS: readonly QualityGateDefinition[] = Object.freeze([
  Object.freeze({
    id: 'GATE-1-CONTRACT',
    name: 'Contract-Konformität',
    requiredDomains: Object.freeze([]),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
  Object.freeze({
    id: 'GATE-2-ARCHITECTURE',
    name: 'Architektur-Konformität',
    requiredDomains: Object.freeze(['repository-conventions'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 2/4/6/8/15/18', 'ADR-0076']),
  }),
  Object.freeze({
    id: 'GATE-3-VERSION',
    name: 'Versionskonformität',
    requiredDomains: Object.freeze(['platform-version'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 9/12', 'ADR-0030', 'ADR-0096']),
  }),
  Object.freeze({
    id: 'GATE-4-DOCUMENTATION',
    name: 'Dokumentationsstatus',
    requiredDomains: Object.freeze(['documentation-hygiene', 'documentation-consistency'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12', 'ESS-0012', 'ADR-0014']),
  }),
  Object.freeze({
    id: 'GATE-5-TEST',
    name: 'Teststatus',
    requiredDomains: Object.freeze([]),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
  Object.freeze({
    id: 'GATE-6-SECURITY',
    name: 'Sicherheitsauswirkungen',
    requiredDomains: Object.freeze(['compliance'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 11/12', 'ESS-0006', 'ADR-0012']),
  }),
  Object.freeze({
    id: 'GATE-7-COMPLIANCE',
    name: 'Compliance-Auswirkungen',
    requiredDomains: Object.freeze(['compliance'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 11/12', 'ESS-0006', 'ADR-0012']),
  }),
  Object.freeze({
    id: 'GATE-8-BUILD',
    name: 'Build-Ergebnis',
    requiredDomains: Object.freeze([]),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
]);

const VALIDATORS_BY_GATE: Readonly<Record<QualityGateDefinition['id'], readonly MandatoryValidatorName[]>> = Object.freeze({
  'GATE-1-CONTRACT': Object.freeze([
    'InterfaceValidator', 'ManifestValidator', 'ComponentValidator', 'MetadataValidator',
  ]),
  'GATE-2-ARCHITECTURE': Object.freeze([
    'RepositoryStructureValidator', 'DirectoryResponsibilityValidator', 'NamingValidator', 'LayerValidator',
    'DependencyValidator', 'EventValidator', 'KnowledgeValidator', 'TwinValidator',
  ]),
  'GATE-3-VERSION': Object.freeze(['VersionValidator']),
  'GATE-4-DOCUMENTATION': Object.freeze(['DocumentationValidator']),
  'GATE-5-TEST': Object.freeze([]),
  'GATE-6-SECURITY': Object.freeze(['SecurityValidator']),
  'GATE-7-COMPLIANCE': Object.freeze(['ComplianceValidator']),
  'GATE-8-BUILD': Object.freeze([]),
});

const EXECUTION_PHASE_BY_GATE: Partial<Record<QualityGateDefinition['id'], QualityExecutionPhase>> = Object.freeze({
  'GATE-1-CONTRACT': 'contract',
  'GATE-5-TEST': 'test',
  'GATE-8-BUILD': 'build',
});

function legacyEvaluateGate(
  definition: QualityGateDefinition,
  observation: RepositoryQualityObservation,
): QualityGateResult {
  const checks = definition.requiredDomains
    .map((domain) => observation.checks.find((check) => check.domain === domain))
    .filter((check): check is NonNullable<typeof check> => Boolean(check));
  const blockingChecks = checks.filter((check) => check.blocking || check.status === 'FAIL');
  const unavailableChecks = checks.filter((check) => check.status === 'NOT_AVAILABLE');
  const hasMissingDomain = checks.length !== definition.requiredDomains.length;

  let status: QualityGateStatus;
  if (blockingChecks.length > 0) status = 'FAIL';
  else if (definition.requiredDomains.length === 0 || hasMissingDomain || unavailableChecks.length > 0) status = 'NOT_AVAILABLE';
  else status = 'PASS';

  return Object.freeze({
    id: definition.id,
    name: definition.name,
    status,
    blocking: status === 'FAIL',
    evidenceCoverage: status === 'NOT_AVAILABLE' ? 'partial' : 'complete',
    domains: Object.freeze([...definition.requiredDomains]),
    findingRuleIds: Object.freeze(checks.flatMap((check) => check.findings.map((finding) => finding.ruleId)).sort()),
    authorityRefs: Object.freeze([...definition.authorityRefs]),
  });
}

function evaluateGate(
  definition: QualityGateDefinition,
  observation: RepositoryQualityObservation,
  evidence: QualityGateEvidence,
): QualityGateResult {
  const chapter12 = evidence.chapter12Validation;
  const requiredValidators = VALIDATORS_BY_GATE[definition.id];
  const validatorResults = requiredValidators
    .map((name) => chapter12?.results.find((item) => item.validatorName === name) ?? null);
  const missingValidatorEvidence = requiredValidators.length > 0 && (!chapter12 || validatorResults.some((item) => item === null));
  const failedValidators = validatorResults.filter((item) => item?.status === 'FAIL');
  const unavailableValidators = validatorResults.filter((item) => item?.status === 'NOT_AVAILABLE');

  const domainChecks = definition.requiredDomains.map((domain) => observation.checks.find((check) => check.domain === domain) ?? null);
  const missingDomainEvidence = domainChecks.some((check) => check === null || check.status === 'NOT_AVAILABLE');
  const failedDomains = domainChecks.filter((check) => check && (check.status === 'FAIL' || check.blocking));

  const executionPhase = EXECUTION_PHASE_BY_GATE[definition.id];
  const execution = executionPhase ? executionRecord(evidence.executionEvidence ?? null, executionPhase) : null;
  const missingExecution = Boolean(executionPhase && !execution);
  const failedExecution = execution?.status === 'FAIL';

  let status: QualityGateStatus;
  if (failedValidators.length > 0 || failedDomains.length > 0 || failedExecution) status = 'FAIL';
  else if (missingValidatorEvidence || unavailableValidators.length > 0 || missingDomainEvidence || missingExecution) status = 'NOT_AVAILABLE';
  else status = 'PASS';

  const findingRuleIds = [
    ...validatorResults.flatMap((item) => item?.findings.map((finding) => finding.ruleId) ?? []),
    ...domainChecks.flatMap((check) => check?.findings.map((finding) => finding.ruleId) ?? []),
  ].sort();
  const authorityRefs = new Set<string>(definition.authorityRefs);
  for (const item of validatorResults) for (const ref of item?.evidenceRefs ?? []) authorityRefs.add(ref);
  if (execution) for (const ref of execution.evidenceRefs) authorityRefs.add(ref);
  if (executionPhase) authorityRefs.add('.quality/execution-evidence.json');

  return Object.freeze({
    id: definition.id,
    name: definition.name,
    status,
    blocking: status === 'FAIL',
    evidenceCoverage: status === 'NOT_AVAILABLE' ? 'partial' : 'complete',
    domains: Object.freeze([...definition.requiredDomains]),
    findingRuleIds: Object.freeze([...new Set(findingRuleIds)]),
    authorityRefs: Object.freeze([...authorityRefs]),
  });
}

export class QualityGateRunner {
  constructor(private readonly definitions: readonly QualityGateDefinition[] = QUALITY_GATE_DEFINITIONS) {}

  run(observation: RepositoryQualityObservation, evidence?: QualityGateEvidence): QualityGateReport {
    const gates = this.definitions.map((definition) => evidence
      ? evaluateGate(definition, observation, evidence)
      : legacyEvaluateGate(definition, observation));
    const overallStatus: QualityGateStatus = gates.some((gate) => gate.status === 'FAIL')
      ? 'FAIL'
      : gates.some((gate) => gate.status === 'NOT_AVAILABLE')
        ? 'NOT_AVAILABLE'
        : 'PASS';

    return Object.freeze({
      schemaVersion: 'quality-gate-report/1.0.0' as const,
      overallStatus,
      blocking: gates.some((gate) => gate.blocking),
      gates: Object.freeze(gates),
    });
  }
}
