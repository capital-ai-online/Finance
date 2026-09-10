import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  BOUNDED_SECURITY_REMEDIATION_CONTROL,
  PVC_OWNER,
  validateBoundedSecurityRemediation,
  validateSecurityAssessment,
} from './validateSecurityAssessment.mjs';

const DIMENSIONS = [
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
];

function dimension(state = 'NOT_TESTED', evidenceRefs = []) {
  return { state, evidenceRefs };
}

function pvcRow(pvc, state = 'NOT_TESTED') {
  const row = { pvc, primaryOwner: PVC_OWNER[pvc] };
  for (const name of DIMENSIONS) row[name] = dimension(state, state === 'PASS' ? [`evidence:${pvc}:${name}`] : []);
  return row;
}

function validAssessment() {
  return {
    schemaVersion: '1.0.0',
    assessmentId: 'SYNTHETIC-SEC-ASSESSMENT-001',
    authorization: {
      reference: 'SYNTHETIC-AUTHORIZATION-NON-PRODUCTION',
      status: 'AUTHORIZED',
      authorizedTargets: ['synthetic://capital-ai/security-assessment'],
      allowedTestClasses: ['web-blackbox'],
      productionInScope: false,
      prohibitedTechniques: ['destructive exploitation', 'credential theft', 'denial of service'],
    },
    target: {
      identifier: 'synthetic://capital-ai/security-assessment',
      environment: 'synthetic',
      snapshot: 'fixture@1',
      owner: 'CAPITAL-AI-SEC',
    },
    scope: {
      modes: ['web-blackbox'],
      assessmentOnly: true,
      notes: 'Synthetic contract fixture only. Does not authorize active testing.',
    },
    pvcAssessments: Object.keys(PVC_OWNER).map((pvc) => pvcRow(pvc)),
    findings: [],
    overallStatus: 'NOT_TESTED',
  };
}

function codes(value) {
  return new Set(validateSecurityAssessment(value).map((item) => item.code));
}

function boundedDecision(overrides = {}) {
  return {
    controlId: BOUNDED_SECURITY_REMEDIATION_CONTROL,
    primaryPurpose: 'SECURITY_REMEDIATION',
    confirmedSecurityFinding: true,
    boundedSlice: true,
    preservesDomainContracts: true,
    affectedPaths: ['server/security-example.ts'],
    changeClasses: ['input-validation'],
    changesBusinessSemantics: false,
    changesProductivePvcOwnership: false,
    changesForeignAuthority: false,
    protectedExternalMutationRequired: false,
    weakensSecurityGates: false,
    createsParallelControlPlane: false,
    ...overrides,
  };
}

function remediationFinding(overrides = {}) {
  return {
    findingId: 'SEC-SYNTH-REMEDIATION',
    title: 'Synthetic bounded remediation',
    severity: 'HIGH',
    state: 'REMEDIATION_REQUIRED',
    mode: 'web-blackbox',
    pvc: 'PVC-02',
    primaryOwner: 'CAPITAL-AI-OPS',
    authorizationRef: 'SYNTHETIC-AUTHORIZATION-NON-PRODUCTION',
    targetSnapshot: 'fixture@1',
    securityRequirements: ['synthetic security requirement'],
    expectedResult: 'deny unsafe input',
    observedResult: 'unsafe input accepted',
    evidenceRefs: ['evidence:synthetic'],
    reproduction: ['synthetic reproduction'],
    remediationRequirement: 'Apply the minimum sufficient Security remediation.',
    verificationRequirement: 'Run separate positive and negative Security re-tests.',
    routingStatus: 'SECURITY_BOUNDED',
    remediationDecision: boundedDecision(),
    ...overrides,
  };
}

function boundedCodes(decision) {
  return new Set(validateBoundedSecurityRemediation(decision, 'SEC-SYNTH').map((item) => item.code));
}

test('Security Assessment skill uses only current project routing and advisory methodologies', () => {
  const skill = fs.readFileSync(new URL('../../.ai/skills/CAPITAL-AI-Security-Assessment.md', import.meta.url), 'utf8');

  assert.match(skill, /docs\/projects\/README\.md/);
  assert.match(skill, /docs\/projects\/PROJECT_VALUE_CHAIN\.md/);
  assert.match(skill, /ADVISORY_NON_AUTHORIZING/);
  assert.match(skill, /External assessment methodologies referenced by this skill are \*\*advisory\/non-authorizing\*\*/);
  assert.doesNotMatch(skill, /CROSS_PROJECT_HANDOFF_CONTRACT/);
  assert.doesNotMatch(skill, /NIST SP 800-115/);
});

test('synthetic assessment with all PVCs explicitly NOT_TESTED is valid and never PASS', () => {
  const assessment = validAssessment();
  assert.deepEqual(validateSecurityAssessment(assessment), []);
  assert.equal(assessment.overallStatus, 'NOT_TESTED');
});

test('duplicate PVC cannot satisfy the 18-stage contract', () => {
  const assessment = validAssessment();
  assessment.pvcAssessments[17] = structuredClone(assessment.pvcAssessments[0]);
  const result = codes(assessment);
  assert.ok(result.has('PVC_DUPLICATE'));
  assert.ok(result.has('PVC_MISSING'));
});

test('PVC primary owner mismatch fails closed', () => {
  const assessment = validAssessment();
  assessment.pvcAssessments[0].primaryOwner = 'CAPITAL-AI-OPS';
  assert.ok(codes(assessment).has('PVC_OWNER_MISMATCH'));
});

test('PASS dimension requires evidence', () => {
  const assessment = validAssessment();
  assessment.pvcAssessments[0].blackboxResistance = dimension('PASS', []);
  assert.ok(codes(assessment).has('PASS_EVIDENCE_REQUIRED'));
});

test('overall PASS cannot coexist with NOT_TESTED coverage', () => {
  const assessment = validAssessment();
  assessment.overallStatus = 'PASS';
  assert.ok(codes(assessment).has('OVERALL_PASS_INCOMPLETE'));
});

test('overall PASS requires AUTHORIZED status', () => {
  const assessment = validAssessment();
  for (const row of assessment.pvcAssessments) {
    for (const name of DIMENSIONS) row[name] = dimension('PASS', [`evidence:${row.pvc}:${name}`]);
  }
  assessment.authorization.status = 'EXPIRED';
  assessment.overallStatus = 'PASS';
  assert.ok(codes(assessment).has('PASS_REQUIRES_AUTHORIZATION'));
});

test('ACCEPTED_RISK requires non-empty Human/Owner authority reference', () => {
  const assessment = validAssessment();
  assessment.findings.push({
    findingId: 'SEC-SYNTH-001',
    title: 'Synthetic accepted risk guard',
    severity: 'LOW',
    state: 'ACCEPTED_RISK',
    mode: 'web-blackbox',
    pvc: 'PVC-01',
    primaryOwner: 'CAPITAL-AI-CLIENT',
    authorizationRef: assessment.authorization.reference,
    targetSnapshot: assessment.target.snapshot,
    securityRequirements: ['synthetic requirement'],
    expectedResult: 'deny',
    observedResult: 'allow',
    evidenceRefs: ['evidence:synthetic'],
    reproduction: ['synthetic reproduction'],
    verificationRequirement: 'Human/Owner decision must be independently recorded.',
    riskAcceptanceAuthorityRef: null,
  });
  assert.ok(codes(assessment).has('RISK_ACCEPTANCE_AUTHORITY_REQUIRED'));
});

test('VERIFIED requires independently identifiable verification evidence', () => {
  const assessment = validAssessment();
  assessment.findings.push({
    findingId: 'SEC-SYNTH-002',
    title: 'Synthetic verification guard',
    severity: 'LOW',
    state: 'VERIFIED',
    mode: 'web-blackbox',
    pvc: 'PVC-01',
    primaryOwner: 'CAPITAL-AI-CLIENT',
    authorizationRef: assessment.authorization.reference,
    targetSnapshot: assessment.target.snapshot,
    securityRequirements: ['synthetic requirement'],
    expectedResult: 'deny',
    observedResult: 'deny',
    evidenceRefs: ['evidence:implementation-only'],
    reproduction: ['synthetic re-test'],
    verificationRequirement: 'Independent Security re-test.',
  });
  assert.ok(codes(assessment).has('VERIFICATION_EVIDENCE_REQUIRED'));

  assessment.findings[0].evidenceRefs.push('verification:synthetic-independent-retest');
  assert.ok(!codes(assessment).has('VERIFICATION_EVIDENCE_REQUIRED'));
});

test('REMEDIATION_REQUIRED accepts eligible SECURITY_BOUNDED execution without changing PVC owner', () => {
  const assessment = validAssessment();
  assessment.findings.push(remediationFinding());
  assert.deepEqual(validateSecurityAssessment(assessment), []);
  assert.equal(assessment.findings[0].primaryOwner, 'CAPITAL-AI-OPS');
});

test('REMEDIATION_REQUIRED accepts explicit OWNER_ROUTED handoff when bounded Security authority is not used', () => {
  const assessment = validAssessment();
  assessment.findings.push(remediationFinding({ routingStatus: 'OWNER_ROUTED', remediationDecision: undefined }));
  assert.deepEqual(validateSecurityAssessment(assessment), []);
});

test('REFERRED_NOT_EXECUTED remains accepted only as compatibility routing for an owner-routed remainder', () => {
  const assessment = validAssessment();
  assessment.findings.push(remediationFinding({ routingStatus: 'REFERRED_NOT_EXECUTED', remediationDecision: undefined }));
  assert.deepEqual(validateSecurityAssessment(assessment), []);
});

// PASS matrix required by CTRL-SEC-BOUNDED-REMEDIATION-001.
for (const [name, affectedPaths, changeClasses] of [
  ['vulnerable dependency patch', ['package.json', 'package-lock.json'], ['dependency-patch']],
  ['input validation', ['server/routes/input.ts'], ['input-validation']],
  ['mail upload URL parser hardening', ['server/mail/parser.ts'], ['parser-hardening']],
  ['fail-closed guard', ['server/auth/guard.ts'], ['fail-closed-guard']],
  ['Security negative tests', ['tests/security/parser-negative.test.ts'], ['security-negative-tests']],
  ['foreign-placed bounded remediation', ['server/domain-owned/handler.ts'], ['input-validation']],
]) {
  test(`PASS bounded Security remediation: ${name}`, () => {
    assert.deepEqual(validateBoundedSecurityRemediation(boundedDecision({ affectedPaths, changeClasses }), name), []);
  });
}

// DENY matrix required by CTRL-SEC-BOUNDED-REMEDIATION-001.
for (const [name, override, expectedCode] of [
  ['Security finding used for feature development', { primaryPurpose: 'FEATURE_DEVELOPMENT' }, 'SECURITY_BOUNDED_PRIMARY_PURPOSE_REQUIRED'],
  ['Security takes foreign productive PVC ownership', { changesProductivePvcOwnership: true }, 'SECURITY_BOUNDED_PVC_OWNERSHIP_DENIED'],
  ['Security changes foreign business or architecture authority', { changesForeignAuthority: true }, 'SECURITY_BOUNDED_FOREIGN_AUTHORITY_DENIED'],
  ['Security weakens Security gates', { weakensSecurityGates: true }, 'SECURITY_BOUNDED_GATE_WEAKENING_DENIED'],
  ['Security requires protected production IAM billing or secret mutation', { protectedExternalMutationRequired: true }, 'SECURITY_BOUNDED_PROTECTED_MUTATION_DENIED'],
  ['Security creates a parallel control plane', { createsParallelControlPlane: true }, 'SECURITY_BOUNDED_PARALLEL_PLANE_DENIED'],
  ['Security changes business/product semantics', { changesBusinessSemantics: true }, 'SECURITY_BOUNDED_BUSINESS_SEMANTICS_DENIED'],
]) {
  test(`DENY bounded Security remediation: ${name}`, () => {
    assert.ok(boundedCodes(boundedDecision(override)).has(expectedCode));
  });
}
