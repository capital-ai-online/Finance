import assert from 'node:assert/strict';
import test from 'node:test';

import { PVC_OWNER, validateSecurityAssessment } from './validateSecurityAssessment.mjs';

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

test('foreign productive remediation must be REFERRED_NOT_EXECUTED', () => {
  const assessment = validAssessment();
  assessment.findings.push({
    findingId: 'SEC-SYNTH-003',
    title: 'Synthetic routing guard',
    severity: 'MEDIUM',
    state: 'REMEDIATION_REQUIRED',
    mode: 'web-blackbox',
    pvc: 'PVC-02',
    primaryOwner: 'CAPITAL-AI-OPS',
    authorizationRef: assessment.authorization.reference,
    targetSnapshot: assessment.target.snapshot,
    securityRequirements: ['synthetic requirement'],
    expectedResult: 'deny',
    observedResult: 'allow',
    evidenceRefs: ['evidence:synthetic'],
    reproduction: ['synthetic reproduction'],
    remediationRequirement: 'Target owner must remediate productive behavior.',
    verificationRequirement: 'Security independently re-tests returned evidence.',
    routingStatus: 'LOCAL_SECURITY_SCOPE',
  });
  assert.ok(codes(assessment).has('FOREIGN_REMEDIATION_ROUTING_REQUIRED'));
});
