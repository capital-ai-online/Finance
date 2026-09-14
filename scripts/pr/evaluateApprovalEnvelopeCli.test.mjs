import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  APPROVAL_STILL_VALID,
  BLOCKED,
  REAPPROVAL_REQUIRED,
  buildEffectiveChangeIdentity,
  createApprovalEnvelope,
} from './approvalEnvelope.mjs';
import {
  CREATE_CORRELATION_SCHEMA,
  OWNER_PR_CREATE_APPROVAL_PHRASE,
  evaluateCreateApprovalGate,
  loadCreateCorrelationEvidence,
  parseOwnerPrCreateApproval,
} from './evaluateApprovalEnvelopeCli.mjs';

const sha = (char) => char.repeat(40);

function identity(tag = 'v1', files = ['scripts/pr/evaluateApprovalEnvelopeCli.mjs']) {
  return buildEffectiveChangeIdentity({
    changedFiles: files,
    normalizedDiff: `diff:${tag}`,
    scopeBinding: { projectId: 'CAPITAL-AI-SEC', workItem: 'pr-create-gate' },
    titleBinding: '[CAPITAL-AI-SEC] [Grok] PR-Create-Pfad an Approval Envelope binden',
  });
}

function envelope() {
  const effectiveChangeIdentity = identity();
  return createApprovalEnvelope({
    projectId: 'CAPITAL-AI-SEC',
    projectFolder: 'docs/projects/security/',
    primaryPvc: 'PVC-05',
    primaryOwner: 'CAPITAL-AI-SEC',
    branchName: 'agent/security-pr-create-quickwins-20260914',
    roadmapItemOrExplicitOwnerScope: 'Owner-directed PR-create security quick wins',
    approvedScope: 'Wire existing Approval Envelope into trusted Draft-PR creation',
    approvedChangedFileSet: effectiveChangeIdentity.changedFiles,
    effectiveChangeIdentity,
    intendedPrTitle: '[CAPITAL-AI-SEC] [Grok] PR-Create-Pfad an Approval Envelope binden',
    approvalTimestampOrChatEvidence: 'chat:owner-pr-create-quickwins-2026-09-14',
    approvalBaseMainSha: sha('a'),
    approvalBranchHeadSha: sha('b'),
  });
}

function current(overrides = {}) {
  return {
    projectId: 'CAPITAL-AI-SEC',
    projectFolder: 'docs/projects/security/',
    primaryPvc: 'PVC-05',
    primaryOwner: 'CAPITAL-AI-SEC',
    branchName: 'agent/security-pr-create-quickwins-20260914',
    roadmapItemOrExplicitOwnerScope: 'Owner-directed PR-create security quick wins',
    approvedScope: 'Wire existing Approval Envelope into trusted Draft-PR creation',
    intendedPrTitle: '[CAPITAL-AI-SEC] [Grok] PR-Create-Pfad an Approval Envelope binden',
    changedFiles: ['scripts/pr/evaluateApprovalEnvelopeCli.mjs'],
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

test('exact Owner-Freigabe phrase is required before envelope evaluation', () => {
  assert.equal(parseOwnerPrCreateApproval(OWNER_PR_CREATE_APPROVAL_PHRASE), true);
  assert.equal(parseOwnerPrCreateApproval('PR Erstellung : Nicht freigegeben'), false);
  assert.equal(parseOwnerPrCreateApproval('approved'), false);
  assert.equal(parseOwnerPrCreateApproval(''), false);
});

test('missing Owner-Freigabe blocks create even when envelope invariants pass', () => {
  const result = evaluateCreateApprovalGate({
    envelopeInput: envelope(),
    ownerApproval: '',
    currentOverrides: current(),
  });
  assert.equal(result.state, BLOCKED);
});

test('valid Owner-Freigabe plus matching envelope permits create', () => {
  const result = evaluateCreateApprovalGate({
    envelopeInput: envelope(),
    ownerApproval: OWNER_PR_CREATE_APPROVAL_PHRASE,
    currentOverrides: current(),
  });
  assert.equal(result.state, APPROVAL_STILL_VALID);
});

test('payload change still requires reapproval after valid Owner-Freigabe', () => {
  const result = evaluateCreateApprovalGate({
    envelopeInput: envelope(),
    ownerApproval: OWNER_PR_CREATE_APPROVAL_PHRASE,
    currentOverrides: current({ effectiveChangeIdentity: identity('v2') }),
  });
  assert.equal(result.state, REAPPROVAL_REQUIRED);
});

test('unresolved open-writer correlation blocks create', () => {
  const result = evaluateCreateApprovalGate({
    envelopeInput: envelope(),
    ownerApproval: OWNER_PR_CREATE_APPROVAL_PHRASE,
    currentOverrides: current({ openWriterCorrelationPass: false }),
  });
  assert.equal(result.state, BLOCKED);
});

test('create-correlation evidence must exist and use the canonical schema', () => {
  const missingPath = path.join(os.tmpdir(), `missing-correlation-${Date.now()}.json`);
  assert.throws(() => loadCreateCorrelationEvidence(missingPath), /required/);

  const evidencePath = path.join(os.tmpdir(), `correlation-${Date.now()}.json`);
  fs.writeFileSync(evidencePath, JSON.stringify({ schemaVersion: 'wrong' }), 'utf8');
  assert.throws(() => loadCreateCorrelationEvidence(evidencePath), /schema/);

  fs.writeFileSync(
    evidencePath,
    JSON.stringify({
      schemaVersion: CREATE_CORRELATION_SCHEMA,
      correlationResult: 'PASS',
      authorityResolved: true,
      openWriterCorrelationPass: true,
      semanticCorrelationPass: true,
      namespaceCorrelationPass: true,
      securityCorrelationPass: true,
      validationStatus: 'PASS',
    }),
    'utf8',
  );
  const evidence = loadCreateCorrelationEvidence(evidencePath);
  assert.equal(evidence.correlationResult, 'PASS');
});
