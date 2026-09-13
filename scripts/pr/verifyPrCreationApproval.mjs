#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  APPROVAL_STILL_VALID,
  collectGitEffectiveChangeIdentity,
  evaluateApprovalEnvelope,
} from './approvalEnvelope.mjs';

function fail(message) {
  console.error(`[PR-APPROVAL] ${message}`);
  process.exit(1);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function readEnvelope() {
  const inline = process.env.PR_APPROVAL_ENVELOPE_JSON?.trim();
  if (inline) return JSON.parse(inline);

  const file = process.env.PR_APPROVAL_ENVELOPE_PATH?.trim();
  if (file) {
    if (!fs.existsSync(file)) fail(`Approval-Envelope-Datei nicht gefunden: ${file}`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  fail('Keine Approval-Envelope über PR_APPROVAL_ENVELOPE_JSON oder PR_APPROVAL_ENVELOPE_PATH bereitgestellt. PR-Erstellung bleibt fail-closed.');
}

const envelope = readEnvelope();
const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const branchName = process.env.PR_HEAD_BRANCH || git(['rev-parse', '--abbrev-ref', headRef]);
const currentMainSha = git(['rev-parse', baseRef]);
const currentBranchHeadSha = git(['rev-parse', headRef]);

const scopeBinding = {
  projectId: envelope.projectId,
  projectFolder: envelope.projectFolder,
  primaryPvc: envelope.primaryPvc,
  primaryOwner: envelope.primaryOwner,
  branchName,
  roadmapItemOrExplicitOwnerScope: envelope.roadmapItemOrExplicitOwnerScope,
  approvedScope: envelope.approvedScope,
};

const effectiveChangeIdentity = collectGitEffectiveChangeIdentity({
  baseRef,
  headRef,
  scopeBinding,
  titleBinding: envelope.intendedPrTitle,
});

const correlationPass = process.env.PR_FINAL_CORRELATION_RESULT === 'PASS';
const validationStatus = process.env.PR_VALIDATION_STATUS || 'UNRESOLVED';

const result = evaluateApprovalEnvelope(envelope, {
  projectId: envelope.projectId,
  projectFolder: envelope.projectFolder,
  primaryPvc: envelope.primaryPvc,
  primaryOwner: envelope.primaryOwner,
  branchName,
  roadmapItemOrExplicitOwnerScope: envelope.roadmapItemOrExplicitOwnerScope,
  approvedScope: envelope.approvedScope,
  intendedPrTitle: process.env.PR_INTENDED_TITLE,
  changedFiles: effectiveChangeIdentity.changedFiles,
  effectiveChangeIdentity,
  currentCorrelationMainSha: currentMainSha,
  currentBranchHeadSha,
  mergeAttempt: false,
  correlationResult: correlationPass ? 'PASS' : 'BLOCKED',
  authorityResolved: correlationPass,
  openWriterCorrelationPass: correlationPass,
  semanticCorrelationPass: correlationPass,
  namespaceCorrelationPass: correlationPass,
  securityCorrelationPass: correlationPass,
  validationStatus,
});

if (result.state !== APPROVAL_STILL_VALID) {
  fail(`${result.state}: ${result.reasons.join('; ')}`);
}

if (!process.env.PR_INTENDED_TITLE || envelope.intendedPrTitle !== process.env.PR_INTENDED_TITLE) {
  fail('Der gerenderte/angeforderte PR-Titel stimmt nicht mit der freigegebenen Approval-Envelope überein.');
}

console.log(`[PR-APPROVAL] ${APPROVAL_STILL_VALID}: Approval-Envelope und aktueller effektiver Change sind konsistent.`);
