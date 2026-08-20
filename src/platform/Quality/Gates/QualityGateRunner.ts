import type { RepositoryQualityObservation } from '../../Governance/Contracts/RepositoryQualityEvidence';
import type {
  QualityGateDefinition,
  QualityGateReport,
  QualityGateResult,
  QualityGateStatus,
} from '../Contracts/QualityCenterContract';

export const QUALITY_GATE_RUNNER_VERSION = 'quality-gate-runner/1.0.0' as const;

export const QUALITY_GATE_DEFINITIONS: readonly QualityGateDefinition[] = Object.freeze([
  Object.freeze({
    id: 'GATE-1-CONTRACT',
    name: 'Contract-Konformität',
    requiredDomains: Object.freeze([]),
    evidenceCoverage: 'unavailable' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
  Object.freeze({
    id: 'GATE-2-ARCHITECTURE',
    name: 'Architektur-Konformität',
    requiredDomains: Object.freeze(['repository-conventions'] as const),
    evidenceCoverage: 'partial' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12', 'ADR-0076']),
  }),
  Object.freeze({
    id: 'GATE-3-VERSION',
    name: 'Versionskonformität',
    requiredDomains: Object.freeze(['platform-version'] as const),
    evidenceCoverage: 'complete' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12', 'ADR-0030', 'ADR-0096']),
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
    evidenceCoverage: 'unavailable' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
  Object.freeze({
    id: 'GATE-6-SECURITY',
    name: 'Sicherheitsauswirkungen',
    requiredDomains: Object.freeze(['compliance'] as const),
    evidenceCoverage: 'partial' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 11', 'ESS-0006', 'ADR-0012']),
  }),
  Object.freeze({
    id: 'GATE-7-COMPLIANCE',
    name: 'Compliance-Auswirkungen',
    requiredDomains: Object.freeze(['compliance'] as const),
    evidenceCoverage: 'partial' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 11', 'ESS-0006', 'ADR-0012']),
  }),
  Object.freeze({
    id: 'GATE-8-BUILD',
    name: 'Build-Ergebnis',
    requiredDomains: Object.freeze([]),
    evidenceCoverage: 'unavailable' as const,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12']),
  }),
]);

function evaluateGate(
  definition: QualityGateDefinition,
  observation: RepositoryQualityObservation,
): QualityGateResult {
  const checks = definition.requiredDomains
    .map((domain) => observation.checks.find((check) => check.domain === domain))
    .filter((check): check is NonNullable<typeof check> => Boolean(check));

  const blockingChecks = checks.filter(
    (check) => check.blocking || check.status === 'FAIL' || check.status === 'NOT_AVAILABLE',
  );
  const hasMissingDomain = checks.length !== definition.requiredDomains.length;

  let status: QualityGateStatus;
  if (blockingChecks.length > 0) {
    status = 'FAIL';
  } else if (
    definition.evidenceCoverage !== 'complete' ||
    definition.requiredDomains.length === 0 ||
    hasMissingDomain
  ) {
    status = 'NOT_AVAILABLE';
  } else {
    status = 'PASS';
  }

  return Object.freeze({
    id: definition.id,
    name: definition.name,
    status,
    blocking: status === 'FAIL',
    evidenceCoverage: definition.evidenceCoverage,
    domains: Object.freeze([...definition.requiredDomains]),
    findingRuleIds: Object.freeze(
      checks.flatMap((check) => check.findings.map((finding) => finding.ruleId)).sort(),
    ),
    authorityRefs: Object.freeze([...definition.authorityRefs]),
  });
}

export class QualityGateRunner {
  constructor(private readonly definitions: readonly QualityGateDefinition[] = QUALITY_GATE_DEFINITIONS) {}

  run(observation: RepositoryQualityObservation): QualityGateReport {
    const gates = this.definitions.map((definition) => evaluateGate(definition, observation));
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
