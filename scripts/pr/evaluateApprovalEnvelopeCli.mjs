#!/usr/bin/env node

import fs from 'node:fs';
import {
  APPROVAL_STILL_VALID,
  BLOCKED,
  collectGitEffectiveChangeIdentity,
  createApprovalEnvelope,
  evaluateApprovalEnvelope,
} from './approvalEnvelope.mjs';
import { writeJsonFile } from './lib.mjs';

export const OWNER_PR_CREATE_APPROVAL_PHRASE = 'PR Erstellung : Freigegeben';
export const CREATE_CORRELATION_SCHEMA = 'capital-ai-pr-create-correlation/1.0.0';

function fail(message) {
  console.error(`[PR-APPROVAL][DENY] ${message}`);
  process.exit(1);
}

function readJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function envFlag(name) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return false;
  const normalized = String(raw).trim().toLowerCase();
  return ['true', '1', 'yes', 'pass'].includes(normalized);
}

export function parseOwnerPrCreateApproval(value) {
  return String(value ?? '').trim() === OWNER_PR_CREATE_APPROVAL_PHRASE;
}

export function resolveApprovalEnvelope(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Approval Envelope payload is missing');
  }
  if (input.schemaVersion === 'capital-ai-pr-approval-envelope/1.0.0') {
    return input;
  }
  return createApprovalEnvelope(input);
}

export function loadCreateCorrelationEvidence(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Create-correlation evidence file is required: ${filePath || '<missing path>'}`);
  }
  const evidence = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (evidence?.schemaVersion !== CREATE_CORRELATION_SCHEMA) {
    throw new Error(`Create-correlation evidence schema must be ${CREATE_CORRELATION_SCHEMA}`);
  }
  return evidence;
}

export function resolveCreateGateCurrent(envelope, overrides = {}) {
  return {
    projectId: overrides.projectId ?? envelope.projectId,
    projectFolder: overrides.projectFolder ?? envelope.projectFolder,
    primaryPvc: overrides.primaryPvc ?? envelope.primaryPvc,
    primaryOwner: overrides.primaryOwner ?? envelope.primaryOwner,
    branchName: overrides.branchName ?? envelope.branchName,
    roadmapItemOrExplicitOwnerScope:
      overrides.roadmapItemOrExplicitOwnerScope ?? envelope.roadmapItemOrExplicitOwnerScope,
    approvedScope: overrides.approvedScope ?? envelope.approvedScope,
    intendedPrTitle: overrides.intendedPrTitle ?? envelope.intendedPrTitle,
    changedFiles: overrides.changedFiles ?? envelope.approvedChangedFileSet,
    effectiveChangeIdentity: overrides.effectiveChangeIdentity ?? envelope.approvedEffectiveChangeIdentity,
    currentCorrelationMainSha: overrides.currentCorrelationMainSha,
    currentBranchHeadSha: overrides.currentBranchHeadSha,
    correlationResult: overrides.correlationResult ?? 'UNRESOLVED',
    authorityResolved: overrides.authorityResolved === true,
    openWriterCorrelationPass: overrides.openWriterCorrelationPass === true,
    semanticCorrelationPass: overrides.semanticCorrelationPass === true,
    namespaceCorrelationPass: overrides.namespaceCorrelationPass === true,
    securityCorrelationPass: overrides.securityCorrelationPass === true,
    validationStatus: overrides.validationStatus ?? 'UNRESOLVED',
    mergeAttempt: overrides.mergeAttempt === true,
    materialChangedFileSetEquivalent: overrides.materialChangedFileSetEquivalent === true,
    effectivePayloadEquivalent: overrides.effectivePayloadEquivalent === true,
    conflictResolutionChangedPayload: overrides.conflictResolutionChangedPayload === true,
    materialDependencyChanged: overrides.materialDependencyChanged === true,
  };
}

export function evaluateCreateApprovalGate({ envelopeInput, ownerApproval, currentOverrides = {} }) {
  if (!parseOwnerPrCreateApproval(ownerApproval)) {
    return {
      state: BLOCKED,
      reasons: ['Owner-Freigabe missing or not exactly "PR Erstellung : Freigegeben"'],
    };
  }
  const envelope = resolveApprovalEnvelope(envelopeInput);
  return evaluateApprovalEnvelope(envelope, resolveCreateGateCurrent(envelope, currentOverrides));
}

function loadEnvelopeInput() {
  const path = process.env.APPROVAL_ENVELOPE_PATH;
  if (path) {
    if (!fs.existsSync(path)) fail(`Approval Envelope file not found: ${path}`);
    return readJson(fs.readFileSync(path, 'utf8'), path);
  }
  const raw = process.env.APPROVAL_ENVELOPE_JSON;
  if (!raw || !String(raw).trim()) {
    fail('APPROVAL_ENVELOPE_JSON or APPROVAL_ENVELOPE_PATH is required before Draft-PR creation');
  }
  return readJson(raw, 'APPROVAL_ENVELOPE_JSON');
}

function requiredSha(name, value) {
  const sha = String(value || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) fail(`${name} must be a 40-character Git SHA`);
  return sha;
}

function compactIdentity(gitIdentity) {
  if (!gitIdentity) return undefined;
  return {
    algorithm: gitIdentity.algorithm,
    changedFiles: gitIdentity.changedFiles,
    normalizedDiffSha256: gitIdentity.normalizedDiffSha256,
    scopeDigest: gitIdentity.scopeDigest,
    titleDigest: gitIdentity.titleDigest,
    effectiveDigest: gitIdentity.effectiveDigest,
    safetyStatement: gitIdentity.safetyStatement,
  };
}

function correlationOverridesFromEvidence(evidence) {
  return {
    correlationResult: evidence.correlationResult,
    authorityResolved: evidence.authorityResolved === true,
    openWriterCorrelationPass: evidence.openWriterCorrelationPass === true,
    semanticCorrelationPass: evidence.semanticCorrelationPass === true,
    namespaceCorrelationPass: evidence.namespaceCorrelationPass === true,
    securityCorrelationPass: evidence.securityCorrelationPass === true,
    validationStatus: evidence.validationStatus,
  };
}

const isDirectCli = process.argv[1] && process.argv[1].endsWith('evaluateApprovalEnvelopeCli.mjs');
if (isDirectCli) {
  const envelopeInput = loadEnvelopeInput();
  const evidencePath = process.env.PR_CORRELATION_EVIDENCE_PATH;
  if (!evidencePath) {
    fail('PR_CORRELATION_EVIDENCE_PATH is required; correlation PASS may not be supplied as a workflow literal');
  }
  let evidence;
  try {
    evidence = loadCreateCorrelationEvidence(evidencePath);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const computeGitIdentity = process.env.PR_COMPUTE_GIT_IDENTITY !== 'false';
  const gitIdentity = computeGitIdentity
    ? collectGitEffectiveChangeIdentity({
        cwd: process.cwd(),
        baseRef: process.env.PR_BASE_REF || 'origin/main',
        headRef: process.env.PR_HEAD_REF || 'HEAD',
        scopeBinding: {
          projectId: envelopeInput.projectId,
          approvedScope: envelopeInput.approvedScope,
          branchName: process.env.PR_HEAD_BRANCH || envelopeInput.branchName,
        },
        titleBinding: process.env.PR_INTENDED_TITLE || envelopeInput.intendedPrTitle,
      })
    : null;

  const mainSha = requiredSha('PR_CURRENT_MAIN_SHA', process.env.PR_CURRENT_MAIN_SHA);
  const headSha = requiredSha('PR_CURRENT_HEAD_SHA', process.env.PR_CURRENT_HEAD_SHA);

  const result = evaluateCreateApprovalGate({
    envelopeInput,
    ownerApproval: process.env.OWNER_PR_CREATE_APPROVAL,
    currentOverrides: {
      projectId: process.env.PR_PROJECT_ID,
      projectFolder: process.env.PR_PROJECT_FOLDER,
      primaryPvc: process.env.PR_AFFECTED_PVC,
      primaryOwner: process.env.PR_PRIMARY_OWNER,
      branchName: process.env.PR_HEAD_BRANCH,
      roadmapItemOrExplicitOwnerScope: process.env.PR_ROADMAP_SCOPE,
      approvedScope: process.env.PR_APPROVED_SCOPE,
      intendedPrTitle: process.env.PR_INTENDED_TITLE,
      changedFiles: gitIdentity?.changedFiles,
      effectiveChangeIdentity: compactIdentity(gitIdentity),
      currentCorrelationMainSha: mainSha,
      currentBranchHeadSha: headSha,
      ...correlationOverridesFromEvidence(evidence),
      materialChangedFileSetEquivalent: envFlag('PR_FILESET_EQUIVALENT'),
      effectivePayloadEquivalent: envFlag('PR_PAYLOAD_EQUIVALENT'),
    },
  });

  const outputPath = process.env.PR_CREATE_GATE_OUTPUT || 'artifacts/pr/create-gate.json';
  writeJsonFile(outputPath, {
    schemaVersion: 'capital-ai-pr-create-gate/1.0.0',
    state: result.state,
    reasons: result.reasons ?? [],
    mainSha,
    headSha,
    correlationEvidencePath: evidencePath,
    correlationResult: evidence.correlationResult,
    evaluatedAt: new Date().toISOString(),
  });

  if (result.state !== APPROVAL_STILL_VALID) {
    fail(`${result.state}: ${(result.reasons || []).join('; ') || 'approval envelope is not valid for PR creation'}`);
  }

  console.log(`[PR-APPROVAL] ${APPROVAL_STILL_VALID} | main=${mainSha.slice(0, 12)} head=${headSha.slice(0, 12)} evidence=${evidencePath}`);
}
