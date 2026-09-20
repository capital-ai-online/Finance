import fs from 'node:fs';

export const PVC_OWNER = Object.freeze({
  'PVC-01': 'CAPITAL-AI-CLIENT',
  'PVC-02': 'CAPITAL-AI-OPS',
  'PVC-03': 'CAPITAL-AI-DOC',
  'PVC-04': 'CAPITAL-AI-OPS',
  'PVC-05': 'CAPITAL-AI-GOV',
  'PVC-06': 'CAPITAL-AI-OPS',
  'PVC-07': 'CAPITAL-AI-OPS',
  'PVC-08': 'CAPITAL-AI-OPS',
  'PVC-09': 'CAPITAL-AI-FINTECH',
  'PVC-10': 'CAPITAL-AI-FINTECH',
  'PVC-11': 'CAPITAL-AI-FINTECH',
  'PVC-12': 'CAPITAL-AI-FINTECH',
  'PVC-13': 'CAPITAL-AI-FINTECH',
  'PVC-14': 'CAPITAL-AI-FINTECH',
  'PVC-15': 'CAPITAL-AI-FINTECH',
  'PVC-16': 'CAPITAL-AI-FINTECH',
  'PVC-17': 'CAPITAL-AI-FINTECH',
  'PVC-18': 'CAPITAL-AI-OPS',
});

export const BOUNDED_SECURITY_REMEDIATION_CONTROL = 'CTRL-SEC-BOUNDED-REMEDIATION-001';

const REQUIRED_DIMENSIONS = Object.freeze([
  'blackboxResistance',
  'injectionResistance',
  'mobileResistance',
  'authenticationResistance',
  'authorizationResistance',
  'businessLogicAbuseResistance',
  'dataIntegrityUnderAttack',
  'boundaryBypassResistance',
  'detectionTraceability',
  'recoveryContainment',
  'evidenceQuality',
  'overallAdversarialMaturity',
]);

const NON_PASS_STATES = new Set(['NOT_TESTED', 'PARTIAL', 'FAIL']);
const FINDINGS_REQUIRING_EVIDENCE = new Set([
  'CONFIRMED_FINDING',
  'REMEDIATION_REQUIRED',
  'EVIDENCE_READY',
  'VERIFIED',
  'ACCEPTED_RISK',
]);

const SECURITY_REMEDIATION_CLASSES = new Set([
  'dependency-patch',
  'input-validation',
  'parser-hardening',
  'fail-closed-guard',
  'security-negative-tests',
  'auth-hardening',
  'secret-protection',
  'security-headers',
  'resource-limits',
  'supply-chain-hardening',
  'workflow-security',
  'runtime-security-config',
  'remove-unsafe-component',
  'security-evidence',
]);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function push(errors, code, detail) {
  errors.push({ code, detail });
}

export function validateBoundedSecurityRemediation(decision, findingId = '<unknown>') {
  const errors = [];
  const id = findingId;

  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
    push(errors, 'SECURITY_BOUNDED_DECISION_REQUIRED', `${id}: SECURITY_BOUNDED requires a remediationDecision object.`);
    return errors;
  }

  if (decision.controlId !== BOUNDED_SECURITY_REMEDIATION_CONTROL) {
    push(errors, 'SECURITY_BOUNDED_CONTROL_MISMATCH', `${id}: remediationDecision.controlId must equal ${BOUNDED_SECURITY_REMEDIATION_CONTROL}.`);
  }
  if (decision.primaryPurpose !== 'SECURITY_REMEDIATION') {
    push(errors, 'SECURITY_BOUNDED_PRIMARY_PURPOSE_REQUIRED', `${id}: primary purpose must be SECURITY_REMEDIATION, not feature or domain development.`);
  }
  if (decision.confirmedSecurityFinding !== true) {
    push(errors, 'SECURITY_BOUNDED_CONFIRMED_FINDING_REQUIRED', `${id}: bounded execution requires a confirmed Security finding.`);
  }
  if (decision.boundedSlice !== true) {
    push(errors, 'SECURITY_BOUNDED_SLICE_REQUIRED', `${id}: remediation must remain a bounded Security slice.`);
  }
  if (decision.preservesDomainContracts !== true) {
    push(errors, 'SECURITY_BOUNDED_DOMAIN_CONTRACT_PRESERVATION_REQUIRED', `${id}: existing Domain/Owner/ADR/ESS contracts must be preserved.`);
  }
  if (!nonEmptyArray(decision.affectedPaths)) {
    push(errors, 'SECURITY_BOUNDED_PATHS_REQUIRED', `${id}: affectedPaths must identify the bounded repository surface.`);
  }
  if (!nonEmptyArray(decision.changeClasses)) {
    push(errors, 'SECURITY_BOUNDED_CHANGE_CLASS_REQUIRED', `${id}: changeClasses must identify at least one Security remediation class.`);
  } else {
    for (const changeClass of decision.changeClasses) {
      if (!SECURITY_REMEDIATION_CLASSES.has(changeClass)) {
        push(errors, 'SECURITY_BOUNDED_CHANGE_CLASS_INVALID', `${id}: unsupported Security remediation class ${String(changeClass)}.`);
      }
    }
  }

  if (decision.changesBusinessSemantics === true) {
    push(errors, 'SECURITY_BOUNDED_BUSINESS_SEMANTICS_DENIED', `${id}: bounded Security authority cannot change business/product semantics.`);
  }
  if (decision.changesProductivePvcOwnership === true) {
    push(errors, 'SECURITY_BOUNDED_PVC_OWNERSHIP_DENIED', `${id}: remediation execution cannot transfer productive PVC ownership to Security.`);
  }
  if (decision.changesForeignAuthority === true) {
    push(errors, 'SECURITY_BOUNDED_FOREIGN_AUTHORITY_DENIED', `${id}: bounded Security authority cannot redefine foreign Domain/Architecture authority.`);
  }
  if (decision.protectedExternalMutationRequired === true) {
    push(errors, 'SECURITY_BOUNDED_PROTECTED_MUTATION_DENIED', `${id}: protected external mutation requires separate applicable authority.`);
  }
  if (decision.weakensSecurityGates === true) {
    push(errors, 'SECURITY_BOUNDED_GATE_WEAKENING_DENIED', `${id}: Security gates/findings/thresholds cannot be weakened or suppressed.`);
  }
  if (decision.createsParallelControlPlane === true) {
    push(errors, 'SECURITY_BOUNDED_PARALLEL_PLANE_DENIED', `${id}: no parallel Security/IAM/Audit/Release/Governance control plane may be created.`);
  }

  return errors;
}

export function validateSecurityAssessment(assessment) {
  const errors = [];

  if (!assessment || typeof assessment !== 'object' || Array.isArray(assessment)) {
    return [{ code: 'ASSESSMENT_OBJECT_REQUIRED', detail: 'Assessment must be a JSON object.' }];
  }

  if (assessment.schemaVersion !== '1.0.0') {
    push(errors, 'SCHEMA_VERSION_INVALID', 'schemaVersion must equal 1.0.0.');
  }

  const authorization = assessment.authorization ?? {};
  const target = assessment.target ?? {};
  const scope = assessment.scope ?? {};

  if (!nonEmptyString(authorization.reference)) {
    push(errors, 'AUTHORIZATION_REFERENCE_REQUIRED', 'authorization.reference must be non-empty.');
  }
  if (!Array.isArray(authorization.authorizedTargets) || authorization.authorizedTargets.length === 0) {
    push(errors, 'AUTHORIZED_TARGETS_REQUIRED', 'authorization.authorizedTargets must contain at least one explicit target.');
  }
  if (!Array.isArray(authorization.allowedTestClasses) || authorization.allowedTestClasses.length === 0) {
    push(errors, 'ALLOWED_TEST_CLASSES_REQUIRED', 'authorization.allowedTestClasses must contain at least one explicit class.');
  }
  if (!nonEmptyString(target.identifier)) {
    push(errors, 'TARGET_IDENTIFIER_REQUIRED', 'target.identifier must be non-empty.');
  }
  if (!nonEmptyString(target.owner)) {
    push(errors, 'TARGET_OWNER_REQUIRED', 'target.owner must be explicit for routing and authorization correlation.');
  }
  if (!authorization.authorizedTargets?.includes(target.identifier)) {
    push(errors, 'TARGET_OUTSIDE_AUTHORIZATION', 'target.identifier must be present in authorization.authorizedTargets.');
  }
  if (scope.assessmentOnly !== true) {
    push(errors, 'ASSESSMENT_ONLY_REQUIRED', 'Security Assessment remains assessment-only; repository remediation authority is evaluated separately per finding.');
  }
  if (Array.isArray(scope.modes)) {
    for (const mode of scope.modes) {
      if (!authorization.allowedTestClasses?.includes(mode)) {
        push(errors, 'MODE_OUTSIDE_AUTHORIZATION', `Assessment mode ${mode} is not explicitly authorized.`);
      }
    }
  } else {
    push(errors, 'ASSESSMENT_MODES_REQUIRED', 'scope.modes must be an array.');
  }

  const pvcAssessments = Array.isArray(assessment.pvcAssessments) ? assessment.pvcAssessments : [];
  const seen = new Map();
  for (const row of pvcAssessments) {
    const pvc = row?.pvc;
    if (!Object.hasOwn(PVC_OWNER, pvc)) {
      push(errors, 'PVC_UNKNOWN', `Unknown or missing PVC: ${String(pvc)}`);
      continue;
    }
    seen.set(pvc, (seen.get(pvc) ?? 0) + 1);
    if (row.primaryOwner !== PVC_OWNER[pvc]) {
      push(errors, 'PVC_OWNER_MISMATCH', `${pvc} must route to ${PVC_OWNER[pvc]}, not ${String(row.primaryOwner)}.`);
    }

    for (const dimensionName of REQUIRED_DIMENSIONS) {
      const dimension = row[dimensionName];
      if (!dimension || typeof dimension !== 'object') {
        push(errors, 'DIMENSION_REQUIRED', `${pvc}.${dimensionName} is required.`);
        continue;
      }
      if (dimension.state === 'PASS' && !nonEmptyArray(dimension.evidenceRefs)) {
        push(errors, 'PASS_EVIDENCE_REQUIRED', `${pvc}.${dimensionName} cannot PASS without evidenceRefs.`);
      }
      if (dimension.state === 'NOT_APPLICABLE' && !nonEmptyString(dimension.reason)) {
        push(errors, 'NOT_APPLICABLE_REASON_REQUIRED', `${pvc}.${dimensionName} requires an applicability reason.`);
      }
    }
  }

  for (const pvc of Object.keys(PVC_OWNER)) {
    const count = seen.get(pvc) ?? 0;
    if (count === 0) push(errors, 'PVC_MISSING', `${pvc} is missing from pvcAssessments.`);
    if (count > 1) push(errors, 'PVC_DUPLICATE', `${pvc} occurs ${count} times; exactly one entry is required.`);
  }
  if (pvcAssessments.length !== 18) {
    push(errors, 'PVC_CARDINALITY_INVALID', `pvcAssessments must contain exactly 18 entries, found ${pvcAssessments.length}.`);
  }

  const findings = Array.isArray(assessment.findings) ? assessment.findings : [];
  for (const finding of findings) {
    const id = nonEmptyString(finding?.findingId) ? finding.findingId : '<unknown>';
    if (Object.hasOwn(PVC_OWNER, finding?.pvc) && finding.primaryOwner !== PVC_OWNER[finding.pvc]) {
      push(errors, 'FINDING_OWNER_MISMATCH', `${id}: ${finding.pvc} must remain owned by ${PVC_OWNER[finding.pvc]}, not ${String(finding.primaryOwner)}.`);
    }
    if (finding.authorizationRef !== authorization.reference) {
      push(errors, 'FINDING_AUTHORIZATION_MISMATCH', `${id}: authorizationRef must match the assessment authorization reference.`);
    }
    if (finding.targetSnapshot !== target.snapshot) {
      push(errors, 'FINDING_SNAPSHOT_MISMATCH', `${id}: targetSnapshot must match assessment target.snapshot.`);
    }
    if (FINDINGS_REQUIRING_EVIDENCE.has(finding.state)) {
      if (!nonEmptyArray(finding.evidenceRefs)) push(errors, 'FINDING_EVIDENCE_REQUIRED', `${id}: ${finding.state} requires evidenceRefs.`);
      if (!nonEmptyArray(finding.reproduction)) push(errors, 'FINDING_REPRODUCTION_REQUIRED', `${id}: ${finding.state} requires reproduction steps.`);
    }
    if (finding.state === 'REMEDIATION_REQUIRED') {
      if (!['SECURITY_BOUNDED', 'OWNER_ROUTED', 'REFERRED_NOT_EXECUTED'].includes(finding.routingStatus)) {
        push(errors, 'REMEDIATION_ROUTING_REQUIRED', `${id}: remediation routingStatus must be SECURITY_BOUNDED or OWNER_ROUTED; REFERRED_NOT_EXECUTED remains accepted as the compatibility marker for an owner-routed remainder.`);
      }
      if (finding.routingStatus === 'SECURITY_BOUNDED') {
        errors.push(...validateBoundedSecurityRemediation(finding.remediationDecision, id));
      }
    }
    if (finding.state === 'VERIFIED') {
      const verificationRefs = Array.isArray(finding.evidenceRefs)
        ? finding.evidenceRefs.filter((ref) => typeof ref === 'string' && ref.startsWith('verification:'))
        : [];
      if (verificationRefs.length === 0) {
        push(errors, 'VERIFICATION_EVIDENCE_REQUIRED', `${id}: VERIFIED requires at least one evidenceRefs entry prefixed with verification:.`);
      }
      if (!nonEmptyString(finding.verificationRequirement)) {
        push(errors, 'VERIFICATION_REQUIREMENT_REQUIRED', `${id}: VERIFIED requires a non-empty verificationRequirement.`);
      }
    }
    if (finding.state === 'ACCEPTED_RISK' && !nonEmptyString(finding.riskAcceptanceAuthorityRef)) {
      push(errors, 'RISK_ACCEPTANCE_AUTHORITY_REQUIRED', `${id}: ACCEPTED_RISK requires a non-empty Human/Owner authority reference.`);
    }
  }

  if (assessment.overallStatus === 'PASS') {
    if (authorization.status !== 'AUTHORIZED') {
      push(errors, 'PASS_REQUIRES_AUTHORIZATION', 'overallStatus PASS requires authorization.status AUTHORIZED.');
    }
    for (const row of pvcAssessments) {
      for (const dimensionName of REQUIRED_DIMENSIONS) {
        const state = row?.[dimensionName]?.state;
        if (NON_PASS_STATES.has(state) || !state) {
          push(errors, 'OVERALL_PASS_INCOMPLETE', `overallStatus PASS is incompatible with ${row?.pvc}.${dimensionName}=${String(state)}.`);
        }
      }
    }
    for (const finding of findings) {
      if (['CANDIDATE_FINDING', 'CONFIRMED_FINDING', 'REMEDIATION_REQUIRED', 'EVIDENCE_READY', 'ACCEPTED_RISK'].includes(finding?.state)) {
        push(errors, 'OVERALL_PASS_OPEN_FINDING', `overallStatus PASS is incompatible with finding ${finding?.findingId ?? '<unknown>'} in ${finding.state}.`);
      }
    }
  }

  return errors;
}

export function assertSecurityAssessment(assessment) {
  const errors = validateSecurityAssessment(assessment);
  if (errors.length > 0) {
    const rendered = errors.map((item) => `${item.code}: ${item.detail}`).join('\n');
    throw new Error(`SECURITY_ASSESSMENT_INVALID\n${rendered}`);
  }
  return assessment;
}

function main(argv) {
  const filePath = argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/security/validateSecurityAssessment.mjs <assessment.json>');
    process.exitCode = 2;
    return;
  }
  const assessment = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const errors = validateSecurityAssessment(assessment);
  if (errors.length > 0) {
    for (const error of errors) console.error(`${error.code}: ${error.detail}`);
    process.exitCode = 1;
    return;
  }
  console.log(`SECURITY_ASSESSMENT_VALID ${assessment.assessmentId ?? filePath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv);
