#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  APPROVAL_STILL_VALID,
  BLOCKED,
  REAPPROVAL_REQUIRED,
  collectGitEffectiveChangeIdentity,
  createApprovalEnvelope,
  evaluateApprovalEnvelope,
} from './approvalEnvelope.mjs';
import { writeJsonFile } from './lib.mjs';

export const OWNER_PR_CREATE_APPROVAL_PHRASE = 'PR Erstellung : Freigegeben';
export const CREATE_CORRELATION_SCHEMA = 'capital-ai-pr-create-correlation/1.0.0';
export const DEFAULT_CORRELATION_MAX_AGE_MS = 5 * 60 * 1000;

function fail(message) {
  console.error(`[PR-APPROVAL][DENY] ${message}`);
  process.exit(1);
}

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function resolveEnvelope(input) {
  if (!input || typeof input !== 'object') throw new Error('Approval Envelope payload is missing');
  if (input.schemaVersion === 'capital-ai-pr-approval-envelope/1.0.0') return input;
  return createApprovalEnvelope(input);
}

function loadEnvelopeInput() {
  const inline = process.env.PR_APPROVAL_ENVELOPE_JSON?.trim() || process.env.APPROVAL_ENVELOPE_JSON?.trim();
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch (error) {
      throw new Error(`Approval Envelope JSON is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const filePath = process.env.PR_APPROVAL_ENVELOPE_PATH?.trim() || process.env.APPROVAL_ENVELOPE_PATH?.trim();
  if (!filePath) throw new Error('Approval Envelope evidence is missing');
  if (!fs.existsSync(filePath)) throw new Error(`Approval Envelope file not found: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCorrelationEvidence(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Final create-correlation evidence is required: ${filePath || '<missing path>'}`);
  }
  const evidence = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (evidence?.schemaVersion !== CREATE_CORRELATION_SCHEMA) {
    throw new Error(`Final create-correlation evidence schema must be ${CREATE_CORRELATION_SCHEMA}`);
  }
  return evidence;
}

function normalizeSha(value) {
  const sha = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function readLiveRefSha(repository, ref) {
  const output = execFileSync('gh', ['api', `repos/${repository}/git/ref/${ref}`, '--jq', '.object.sha'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  }).trim();
  const sha = normalizeSha(output);
  if (!sha) throw new Error(`Live GitHub ref ${ref} did not return a valid SHA`);
  return sha;
}

export function evaluatePrCreationApprovalGate({
  envelopeInput,
  ownerApproval,
  intendedPrTitle,
  current,
  correlationEvidence,
  liveMainSha,
  liveHeadSha,
  nowMs = Date.now(),
  correlationMaxAgeMs = DEFAULT_CORRELATION_MAX_AGE_MS,
}) {
  let envelope;
  try {
    envelope = resolveEnvelope(envelopeInput);
  } catch (error) {
    return { state: BLOCKED, reasons: [error instanceof Error ? error.message : String(error)] };
  }

  if (String(ownerApproval ?? '').trim() !== OWNER_PR_CREATE_APPROVAL_PHRASE) {
    return { state: BLOCKED, reasons: [`Owner-Freigabe missing or not exactly "${OWNER_PR_CREATE_APPROVAL_PHRASE}"`] };
  }

  if (!String(intendedPrTitle ?? '').trim()) {
    return { state: BLOCKED, reasons: ['actual rendered PR title is missing'] };
  }

  if (!correlationEvidence || correlationEvidence.schemaVersion !== CREATE_CORRELATION_SCHEMA) {
    return { state: BLOCKED, reasons: ['final create-correlation evidence is missing or malformed'] };
  }

  const generatedAtMs = Date.parse(String(correlationEvidence.generatedAt ?? ''));
  if (!Number.isFinite(generatedAtMs) || generatedAtMs > nowMs || nowMs - generatedAtMs > correlationMaxAgeMs) {
    return { state: BLOCKED, reasons: ['final create-correlation evidence is stale or has an invalid timestamp'] };
  }

  if (String(correlationEvidence.branchName ?? '') !== String(current.branchName ?? '')) {
    return { state: BLOCKED, reasons: ['final create-correlation evidence is bound to a different branch'] };
  }

  const currentMainSha = normalizeSha(current.currentCorrelationMainSha);
  const currentHeadSha = normalizeSha(current.currentBranchHeadSha);
  if (!currentMainSha || !currentHeadSha) {
    return { state: BLOCKED, reasons: ['current main/head SHA evidence is missing or invalid'] };
  }

  if (normalizeSha(liveMainSha) !== currentMainSha) {
    return { state: BLOCKED, reasons: ['live main SHA changed after the final local refresh'] };
  }
  if (normalizeSha(liveHeadSha) !== currentHeadSha) {
    return { state: BLOCKED, reasons: ['live branch head SHA differs from the locally verified branch head'] };
  }

  const evaluated = evaluateApprovalEnvelope(envelope, {
    ...current,
    intendedPrTitle: String(intendedPrTitle),
    correlationResult: correlationEvidence.correlationResult,
    authorityResolved: correlationEvidence.authorityResolved === true,
    openWriterCorrelationPass: correlationEvidence.openWriterCorrelationPass === true,
    semanticCorrelationPass: correlationEvidence.semanticCorrelationPass === true,
    namespaceCorrelationPass: correlationEvidence.namespaceCorrelationPass === true,
    securityCorrelationPass: correlationEvidence.securityCorrelationPass === true,
    validationStatus: correlationEvidence.validationStatus,
  });

  if (String(envelope.intendedPrTitle) !== String(intendedPrTitle)) {
    const reasons = new Set([...(evaluated.reasons ?? []), 'actual rendered PR title differs from the approved title']);
    return { state: REAPPROVAL_REQUIRED, reasons: [...reasons] };
  }

  return evaluated;
}

const isDirectCli = process.argv[1] && process.argv[1].endsWith('verifyPrCreationApproval.mjs');
if (isDirectCli) {
  let envelopeInput;
  let correlationEvidence;
  try {
    envelopeInput = loadEnvelopeInput();
    correlationEvidence = loadCorrelationEvidence(process.env.PR_CORRELATION_EVIDENCE_PATH);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const repository = String(process.env.GITHUB_REPOSITORY ?? '').trim();
  const branchName = String(process.env.PR_HEAD_BRANCH ?? '').trim();
  const intendedPrTitle = String(process.env.PR_INTENDED_TITLE ?? '').trim();
  if (!repository) fail('GITHUB_REPOSITORY is required for final live ref readback');
  if (!branchName) fail('PR_HEAD_BRANCH is required for final live branch-head readback');

  const baseRef = process.env.PR_BASE_REF || 'origin/main';
  const headRef = process.env.PR_HEAD_REF || 'HEAD';
  const currentMainSha = normalizeSha(git(['rev-parse', baseRef]));
  const currentBranchHeadSha = normalizeSha(git(['rev-parse', headRef]));
  if (!currentMainSha || !currentBranchHeadSha) fail('Local current main/head SHA evidence is invalid');

  let envelope;
  try {
    envelope = resolveEnvelope(envelopeInput);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const effectiveChangeIdentity = collectGitEffectiveChangeIdentity({
    cwd: process.cwd(),
    baseRef,
    headRef,
    scopeBinding: {
      projectId: envelope.projectId,
      projectFolder: envelope.projectFolder,
      primaryPvc: envelope.primaryPvc,
      primaryOwner: envelope.primaryOwner,
      branchName,
      roadmapItemOrExplicitOwnerScope: envelope.roadmapItemOrExplicitOwnerScope,
      approvedScope: envelope.approvedScope,
    },
    titleBinding: intendedPrTitle,
  });

  let liveMainSha;
  let liveHeadSha;
  try {
    liveMainSha = readLiveRefSha(repository, 'heads/main');
    liveHeadSha = readLiveRefSha(repository, `heads/${branchName}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const expectedMainSha = normalizeSha(process.env.PR_EXPECTED_CURRENT_MAIN_SHA);
  if (expectedMainSha && expectedMainSha !== liveMainSha) {
    fail(`BLOCKED: live main moved from expected ${expectedMainSha} to ${liveMainSha}`);
  }

  const result = evaluatePrCreationApprovalGate({
    envelopeInput: envelope,
    ownerApproval: process.env.OWNER_PR_CREATE_APPROVAL,
    intendedPrTitle,
    correlationEvidence,
    liveMainSha,
    liveHeadSha,
    current: {
      projectId: envelope.projectId,
      projectFolder: envelope.projectFolder,
      primaryPvc: envelope.primaryPvc,
      primaryOwner: envelope.primaryOwner,
      branchName,
      roadmapItemOrExplicitOwnerScope: envelope.roadmapItemOrExplicitOwnerScope,
      approvedScope: envelope.approvedScope,
      intendedPrTitle,
      changedFiles: effectiveChangeIdentity.changedFiles,
      effectiveChangeIdentity,
      currentCorrelationMainSha: currentMainSha,
      currentBranchHeadSha,
      mergeAttempt: false,
      materialChangedFileSetEquivalent: false,
      effectivePayloadEquivalent: false,
      conflictResolutionChangedPayload: false,
      materialDependencyChanged: false,
    },
  });

  const outputPath = process.env.PR_CREATE_GATE_OUTPUT || 'artifacts/pr/final-create-gate.json';
  writeJsonFile(outputPath, {
    schemaVersion: 'capital-ai-pr-create-gate/1.1.0',
    state: result.state,
    reasons: result.reasons ?? [],
    currentMainSha,
    currentBranchHeadSha,
    liveMainSha,
    liveHeadSha,
    mergeBase: effectiveChangeIdentity.mergeBase,
    effectiveDigest: effectiveChangeIdentity.effectiveDigest,
    intendedPrTitle,
    correlationEvidencePath: process.env.PR_CORRELATION_EVIDENCE_PATH,
    evaluatedAt: new Date().toISOString(),
  });

  if (result.state !== APPROVAL_STILL_VALID) {
    fail(`${result.state}: ${(result.reasons ?? []).join('; ') || 'approval envelope is not valid for PR creation'}`);
  }

  console.log(`[PR-APPROVAL] ${APPROVAL_STILL_VALID} | main=${liveMainSha.slice(0, 12)} head=${liveHeadSha.slice(0, 12)} | title=${intendedPrTitle}`);
}
