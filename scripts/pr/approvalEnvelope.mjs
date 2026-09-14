import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const APPROVAL_STILL_VALID = 'APPROVAL_STILL_VALID';
export const REAPPROVAL_REQUIRED = 'REAPPROVAL_REQUIRED';
export const BLOCKED = 'BLOCKED';

const SHA_RE = /^[0-9a-f]{40}$/;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function normalizeChangedFiles(files) {
  return [...new Set((files ?? []).map((file) => String(file).trim()).filter(Boolean))].sort();
}

export function digestScope(value) {
  return `sha256:${sha256(stableStringify(value))}`;
}

export function buildApprovalScopeBinding(input = {}) {
  return {
    projectId: input.projectId,
    projectFolder: input.projectFolder,
    primaryPvc: input.primaryPvc,
    primaryOwner: input.primaryOwner,
    branchName: input.branchName,
    roadmapItemOrExplicitOwnerScope: input.roadmapItemOrExplicitOwnerScope,
    approvedScope: input.approvedScope,
  };
}

export function buildEffectiveChangeIdentity({ changedFiles, normalizedDiff, scopeBinding, titleBinding = null }) {
  const files = normalizeChangedFiles(changedFiles);
  const diff = Buffer.isBuffer(normalizedDiff) ? normalizedDiff : Buffer.from(String(normalizedDiff ?? ''), 'utf8');
  const normalizedDiffSha256 = `sha256:${sha256(diff)}`;
  const scopeDigest = digestScope(scopeBinding ?? {});
  const titleDigest = titleBinding == null ? null : digestScope({ title: String(titleBinding) });
  const effectiveDigest = digestScope({
    changedFiles: files,
    normalizedDiffSha256,
    scopeDigest,
    titleDigest,
  });

  return {
    algorithm: 'capital-ai-effective-change/v1',
    changedFiles: files,
    normalizedDiffSha256,
    scopeDigest,
    titleDigest,
    effectiveDigest,
    safetyStatement: 'Identity evidence is not semantic safety proof; current-main, authority, open-writer, semantic and validation correlation remain mandatory.',
  };
}

export function collectGitEffectiveChangeIdentity({
  cwd = process.cwd(),
  baseRef = 'main',
  headRef = 'HEAD',
  scopeBinding,
  titleBinding = null,
} = {}) {
  const run = (args, options = {}) => execFileSync('git', args, {
    cwd,
    encoding: options.encoding ?? 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const mergeBase = run(['merge-base', baseRef, headRef]).trim();
  const changedFilesRaw = run(['diff', '--name-only', '-z', mergeBase, headRef, '--']);
  const changedFiles = changedFilesRaw.split('\0').filter(Boolean);
  const normalizedDiff = execFileSync(
    'git',
    ['diff', '--no-color', '--no-ext-diff', '--full-index', '--binary', mergeBase, headRef, '--'],
    { cwd, encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] },
  );

  return {
    mergeBase,
    ...buildEffectiveChangeIdentity({ changedFiles, normalizedDiff, scopeBinding, titleBinding }),
  };
}

const REQUIRED_BINDINGS = [
  'projectId',
  'projectFolder',
  'primaryPvc',
  'primaryOwner',
  'branchName',
  'roadmapItemOrExplicitOwnerScope',
  'approvedScope',
  'intendedPrTitle',
  'approvalTimestampOrChatEvidence',
  'approvalBaseMainSha',
  'approvalBranchHeadSha',
];

export function createApprovalEnvelope(input) {
  for (const key of REQUIRED_BINDINGS) {
    if (input?.[key] == null || String(input[key]).trim() === '') {
      throw new Error(`Approval Envelope requires ${key}`);
    }
  }
  for (const key of ['approvalBaseMainSha', 'approvalBranchHeadSha']) {
    if (!SHA_RE.test(String(input[key]))) throw new Error(`Approval Envelope requires a 40-char lowercase Git SHA for ${key}`);
  }
  if (!input.effectiveChangeIdentity?.effectiveDigest) {
    throw new Error('Approval Envelope requires effectiveChangeIdentity.effectiveDigest');
  }

  return Object.freeze({
    schemaVersion: 'capital-ai-pr-approval-envelope/1.0.0',
    projectId: input.projectId,
    projectFolder: input.projectFolder,
    primaryPvc: input.primaryPvc,
    primaryOwner: input.primaryOwner,
    branchName: input.branchName,
    roadmapItemOrExplicitOwnerScope: input.roadmapItemOrExplicitOwnerScope,
    approvedScope: input.approvedScope,
    approvedChangedFileSet: normalizeChangedFiles(input.approvedChangedFileSet ?? input.effectiveChangeIdentity.changedFiles),
    approvedEffectiveChangeIdentity: input.effectiveChangeIdentity,
    intendedPrTitle: input.intendedPrTitle,
    approvalTimestampOrChatEvidence: input.approvalTimestampOrChatEvidence,
    approvalBaseMainSha: input.approvalBaseMainSha,
    approvalBranchHeadSha: input.approvalBranchHeadSha,
  });
}

function sameScalar(envelope, current, key) {
  return String(envelope[key]) === String(current[key]);
}

function sameFiles(left, right) {
  return stableStringify(normalizeChangedFiles(left)) === stableStringify(normalizeChangedFiles(right));
}

export function evaluateApprovalEnvelope(envelope, current) {
  const blockedReasons = [];
  if (!envelope?.approvalTimestampOrChatEvidence) blockedReasons.push('approval evidence is missing or ambiguous');
  if (!SHA_RE.test(String(current.currentCorrelationMainSha ?? ''))) blockedReasons.push('current main SHA evidence is missing or invalid');
  if (!SHA_RE.test(String(current.currentBranchHeadSha ?? ''))) blockedReasons.push('current branch-head SHA evidence is missing or invalid');
  if (current.mergeAttempt === true) blockedReasons.push('Human/CODEOWNER-only merge boundary');
  if (current.correlationResult !== 'PASS') blockedReasons.push('final current-main correlation is not PASS');
  if (current.authorityResolved !== true) blockedReasons.push('applicable authority is unresolved or conflicting');
  if (current.openWriterCorrelationPass !== true) blockedReasons.push('open-writer correlation is unresolved or conflicting');
  if (current.semanticCorrelationPass !== true) blockedReasons.push('semantic correlation is unresolved or conflicting');
  if (current.namespaceCorrelationPass !== true) blockedReasons.push('namespace correlation is unresolved or conflicting');
  if (current.securityCorrelationPass !== true) blockedReasons.push('security correlation is unresolved or conflicting');
  if (!['PASS', 'NOT_REQUIRED'].includes(current.validationStatus)) {
    blockedReasons.push(`validation status is ${current.validationStatus ?? 'UNRESOLVED'}`);
  }

  if (blockedReasons.length > 0) {
    return { state: BLOCKED, reasons: blockedReasons };
  }

  const reapprovalReasons = [];
  for (const key of [
    'projectId',
    'projectFolder',
    'primaryPvc',
    'primaryOwner',
    'branchName',
    'roadmapItemOrExplicitOwnerScope',
    'approvedScope',
    'intendedPrTitle',
  ]) {
    if (!sameScalar(envelope, current, key)) reapprovalReasons.push(`${key} changed`);
  }

  if (
    !sameFiles(envelope.approvedChangedFileSet, current.changedFiles) &&
    current.materialChangedFileSetEquivalent !== true
  ) {
    reapprovalReasons.push('material changed-file set changed');
  }
  if (current.conflictResolutionChangedPayload === true) {
    reapprovalReasons.push('conflict resolution changed approved payload');
  }
  if (current.materialDependencyChanged === true) {
    reapprovalReasons.push('material semantic dependency changed');
  }

  const identityChanged =
    envelope.approvedEffectiveChangeIdentity.effectiveDigest !== current.effectiveChangeIdentity?.effectiveDigest;
  if (identityChanged && current.effectivePayloadEquivalent !== true) {
    reapprovalReasons.push('effective change identity changed without proven payload equivalence');
  }

  if (reapprovalReasons.length > 0) {
    return { state: REAPPROVAL_REQUIRED, reasons: reapprovalReasons };
  }

  return {
    state: APPROVAL_STILL_VALID,
    reasons: [
      'approved bounded change invariants remain valid',
      'current-main/open-writer/authority/semantic/security correlation is PASS',
      identityChanged
        ? 'effective identity changed but material payload equivalence was independently proven'
        : 'effective change identity remains equal',
      'SHA movement is retained as evidence only and was not used as an approval invariant',
    ],
    evidence: {
      approvalBaseMainSha: envelope.approvalBaseMainSha,
      approvalBranchHeadSha: envelope.approvalBranchHeadSha,
      currentCorrelationMainSha: current.currentCorrelationMainSha,
      currentBranchHeadSha: current.currentBranchHeadSha,
    },
  };
}
