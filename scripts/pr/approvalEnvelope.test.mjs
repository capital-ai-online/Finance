import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_STILL_VALID,
  BLOCKED,
  REAPPROVAL_REQUIRED,
  buildEffectiveChangeIdentity,
  createApprovalEnvelope,
  evaluateApprovalEnvelope,
} from './approvalEnvelope.mjs';

const sha = (char) => char.repeat(40);

function identity(tag = 'v1', files = ['AGENTS.md']) {
  return buildEffectiveChangeIdentity({
    changedFiles: files,
    normalizedDiff: `diff:${tag}`,
    scopeBinding: { projectId: 'CAPITAL-AI-GOV', workItem: 'approval-envelope' },
    titleBinding: '[CAPITAL-AI-GOV] [ChatGPT] PR-Approval-Envelope einführen',
  });
}

function envelope(overrides = {}) {
  const effectiveChangeIdentity = overrides.effectiveChangeIdentity ?? identity();
  return createApprovalEnvelope({
    projectId: 'CAPITAL-AI-GOV',
    projectFolder: 'docs/projects/governance/',
    primaryPvc: 'PVC-05',
    primaryOwner: 'CAPITAL-AI-GOV / Platform Director',
    branchName: 'agent/governance-pr-approval-envelope-20260907',
    roadmapItemOrExplicitOwnerScope: 'Owner-directed approval-envelope governance maintenance',
    approvedScope: 'Bound PR-create approval to bounded effective change rather than incidental SHA identity',
    approvedChangedFileSet: effectiveChangeIdentity.changedFiles,
    effectiveChangeIdentity,
    intendedPrTitle: '[CAPITAL-AI-GOV] [ChatGPT] PR-Approval-Envelope einführen',
    approvalTimestampOrChatEvidence: 'chat:owner-approval',
    approvalBaseMainSha: sha('a'),
    approvalBranchHeadSha: sha('b'),
    ...overrides,
  });
}

function current(overrides = {}) {
  return {
    projectId: 'CAPITAL-AI-GOV',
    projectFolder: 'docs/projects/governance/',
    primaryPvc: 'PVC-05',
    primaryOwner: 'CAPITAL-AI-GOV / Platform Director',
    branchName: 'agent/governance-pr-approval-envelope-20260907',
    roadmapItemOrExplicitOwnerScope: 'Owner-directed approval-envelope governance maintenance',
    approvedScope: 'Bound PR-create approval to bounded effective change rather than incidental SHA identity',
    intendedPrTitle: '[CAPITAL-AI-GOV] [ChatGPT] PR-Approval-Envelope einführen',
    changedFiles: ['AGENTS.md'],
    effectiveChangeIdentity: identity(),
    currentCorrelationMainSha: sha('c'),
    currentBranchHeadSha: sha('d'),
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

test('A01/A02: unrelated main SHA movement preserves approval after successful recorrelation', () => {
  assert.equal(evaluateApprovalEnvelope(envelope(), current()).state, APPROVAL_STILL_VALID);
});

test('A03: synchronization-only head movement preserves approval when payload identity is unchanged', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ currentBranchHeadSha: sha('e') }));
  assert.equal(result.state, APPROVAL_STILL_VALID);
});

test('A04: new implementation payload requires renewed approval', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ effectiveChangeIdentity: identity('v2') }));
  assert.equal(result.state, REAPPROVAL_REQUIRED);
});

test('A05: same-file overlap can preserve approval only with explicit material-equivalence proof and PASS correlation', () => {
  const result = evaluateApprovalEnvelope(
    envelope(),
    current({
      effectiveChangeIdentity: identity('rebased'),
      effectivePayloadEquivalent: true,
      changedFiles: ['AGENTS.md', 'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md'],
      materialChangedFileSetEquivalent: true,
    }),
  );
  assert.equal(result.state, APPROVAL_STILL_VALID);
});

test('A06: incompatible semantic correlation blocks creation', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ semanticCorrelationPass: false }));
  assert.equal(result.state, BLOCKED);
});

test('A07: conflict resolution changing payload requires renewed approval', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ conflictResolutionChangedPayload: true }));
  assert.equal(result.state, REAPPROVAL_REQUIRED);
});

test('A08: unresolved authority drift blocks approval reuse', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ authorityResolved: false }));
  assert.equal(result.state, BLOCKED);
});

test('A09: unresolved open-writer overlap blocks creation', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ openWriterCorrelationPass: false }));
  assert.equal(result.state, BLOCKED);
});

test('A10: failed validation blocks creation', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ validationStatus: 'FAIL' }));
  assert.equal(result.state, BLOCKED);
});

test('A11: unexplained fingerprint difference never silently survives', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ effectiveChangeIdentity: identity('unexpected') }));
  assert.equal(result.state, REAPPROVAL_REQUIRED);
});

test('A12: agent merge attempt is blocked even when all PR-create invariants pass', () => {
  const result = evaluateApprovalEnvelope(envelope(), current({ mergeAttempt: true }));
  assert.equal(result.state, BLOCKED);
});

test('material project, owner, PVC, scope or title changes require renewed approval', () => {
  for (const [key, value] of [
    ['projectId', 'CAPITAL-AI-OPS'],
    ['primaryOwner', 'CAPITAL-AI-OPS'],
    ['primaryPvc', 'PVC-02'],
    ['approvedScope', 'expanded scope'],
    ['intendedPrTitle', '[CAPITAL-AI-GOV] [ChatGPT] materially different title'],
  ]) {
    assert.equal(evaluateApprovalEnvelope(envelope(), current({ [key]: value })).state, REAPPROVAL_REQUIRED, key);
  }
});

test('SHA equality does not make unresolved correlation safe', () => {
  const approved = envelope();
  const result = evaluateApprovalEnvelope(approved, current({
    currentCorrelationMainSha: approved.approvalBaseMainSha,
    currentBranchHeadSha: approved.approvalBranchHeadSha,
    securityCorrelationPass: false,
  }));
  assert.equal(result.state, BLOCKED);
});

test('missing current main/head evidence blocks approval preservation', () => {
  assert.equal(evaluateApprovalEnvelope(envelope(), current({ currentCorrelationMainSha: undefined })).state, BLOCKED);
  assert.equal(evaluateApprovalEnvelope(envelope(), current({ currentBranchHeadSha: undefined })).state, BLOCKED);
});

test('approval envelope rejects malformed approval-base Git evidence', () => {
  assert.throws(() => envelope({ approvalBaseMainSha: 'not-a-sha' }), /40-char lowercase Git SHA/);
});
