import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_STILL_VALID,
  BLOCKED,
  REAPPROVAL_REQUIRED,
  buildEffectiveChangeIdentity,
  createApprovalEnvelope,
} from './approvalEnvelope.mjs';
import {
  CREATE_CORRELATION_SCHEMA,
  evaluatePrCreationApprovalGate,
} from './verifyPrCreationApproval.mjs';

const sha = (char) => char.repeat(40);
const NOW = Date.parse('2026-09-14T19:00:00.000Z');
const BRANCH = 'agent/security-pr-governance-hardening-20260914';
const TITLE = '[CAPITAL-AI-SEC] [ChatGPT] PR-Governance und Render-Repository härten';
const FILES = [
  '.github/workflows/open-agent-draft-pr.yml',
  'render.yaml',
  'scripts/pr/verifyPrCreationApproval.mjs',
  'scripts/pr/verifyPrCreationApproval.test.mjs',
  'tests/unit/githubAgentDraftPrWorkflow.test.ts',
  'tests/unit/prGovernanceRunnerConsolidation.test.ts',
];

function identity(title = TITLE) {
  return buildEffectiveChangeIdentity({
    changedFiles: FILES,
    normalizedDiff: 'bounded-security-remediation',
    scopeBinding: {
      projectId: 'CAPITAL-AI-SEC',
      projectFolder: 'docs/projects/security/',
      primaryPvc: 'N/A — cross-cutting Security',
      primaryOwner: 'CAPITAL-AI-SEC',
      branchName: BRANCH,
      roadmapItemOrExplicitOwnerScope: 'SEC-PR-GOV-02 + SEC-RENDER-01-DECLARATIVE-FIX',
      approvedScope: 'Final PR-create Approval Envelope binding and declarative Render repository correction',
    },
    titleBinding: title,
  });
}

function envelope(overrides = {}) {
  const effectiveChangeIdentity = overrides.effectiveChangeIdentity ?? identity(overrides.intendedPrTitle ?? TITLE);
  return createApprovalEnvelope({
    projectId: 'CAPITAL-AI-SEC',
    projectFolder: 'docs/projects/security/',
    primaryPvc: 'N/A — cross-cutting Security',
    primaryOwner: 'CAPITAL-AI-SEC',
    branchName: BRANCH,
    roadmapItemOrExplicitOwnerScope: 'SEC-PR-GOV-02 + SEC-RENDER-01-DECLARATIVE-FIX',
    approvedScope: 'Final PR-create Approval Envelope binding and declarative Render repository correction',
    approvedChangedFileSet: effectiveChangeIdentity.changedFiles,
    effectiveChangeIdentity,
    intendedPrTitle: TITLE,
    approvalTimestampOrChatEvidence: 'chat:owner-approval',
    approvalBaseMainSha: sha('a'),
    approvalBranchHeadSha: sha('b'),
    ...overrides,
  });
}

function correlation(overrides = {}) {
  return {
    schemaVersion: CREATE_CORRELATION_SCHEMA,
    generatedAt: new Date(NOW - 1_000).toISOString(),
    branchName: BRANCH,
    correlationResult: 'PASS',
    authorityResolved: true,
    openWriterCorrelationPass: true,
    semanticCorrelationPass: true,
    namespaceCorrelationPass: true,
    securityCorrelationPass: true,
    validationStatus: 'PASS',
    ...overrides,
  };
}

function current(overrides = {}) {
  return {
    projectId: 'CAPITAL-AI-SEC',
    projectFolder: 'docs/projects/security/',
    primaryPvc: 'N/A — cross-cutting Security',
    primaryOwner: 'CAPITAL-AI-SEC',
    branchName: BRANCH,
    roadmapItemOrExplicitOwnerScope: 'SEC-PR-GOV-02 + SEC-RENDER-01-DECLARATIVE-FIX',
    approvedScope: 'Final PR-create Approval Envelope binding and declarative Render repository correction',
    intendedPrTitle: TITLE,
    changedFiles: FILES,
    effectiveChangeIdentity: identity(),
    currentCorrelationMainSha: sha('c'),
    currentBranchHeadSha: sha('d'),
    mergeAttempt: false,
    materialChangedFileSetEquivalent: false,
    effectivePayloadEquivalent: false,
    conflictResolutionChangedPayload: false,
    materialDependencyChanged: false,
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluatePrCreationApprovalGate({
    envelopeInput: envelope(),
    ownerApproval: 'PR Erstellung : Freigegeben',
    intendedPrTitle: TITLE,
    current: current(),
    correlationEvidence: correlation(),
    liveMainSha: sha('c'),
    liveHeadSha: sha('d'),
    nowMs: NOW,
    ...overrides,
  });
}

test('final gate permits only a fully bound APPROVAL_STILL_VALID create', () => {
  assert.equal(evaluate().state, APPROVAL_STILL_VALID);
});

test('missing Approval Envelope evidence fails closed', () => {
  assert.equal(evaluate({ envelopeInput: null }).state, BLOCKED);
});

test('stale final create-correlation evidence fails closed', () => {
  assert.equal(
    evaluate({ correlationEvidence: correlation({ generatedAt: new Date(NOW - 6 * 60 * 1000).toISOString() }) }).state,
    BLOCKED,
  );
});

test('correlation evidence for another branch fails closed', () => {
  assert.equal(
    evaluate({ correlationEvidence: correlation({ branchName: 'agent/security-other-20260914' }) }).state,
    BLOCKED,
  );
});

test('live main drift after local refresh fails closed', () => {
  assert.equal(evaluate({ liveMainSha: sha('e') }).state, BLOCKED);
});

test('live branch-head drift fails closed', () => {
  assert.equal(evaluate({ liveHeadSha: sha('e') }).state, BLOCKED);
});

test('actual rendered PR title differing from approval requires reapproval', () => {
  assert.equal(
    evaluate({ intendedPrTitle: '[CAPITAL-AI-SEC] [ChatGPT] anderer Titel' }).state,
    REAPPROVAL_REQUIRED,
  );
});

test('missing exact Owner phrase fails closed', () => {
  assert.equal(evaluate({ ownerApproval: '' }).state, BLOCKED);
});

test('failed validation evidence fails closed', () => {
  assert.equal(evaluate({ correlationEvidence: correlation({ validationStatus: 'NOT RUN' }) }).state, BLOCKED);
});
