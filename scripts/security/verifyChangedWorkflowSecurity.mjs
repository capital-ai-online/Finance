#!/usr/bin/env node

import fs from 'node:fs';
import { fail, git, tryGit, normalizeRepoPath } from '../pr/lib.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const DELETION_REVIEW_PATH = 'docs/security/WORKFLOW_DELETION_REVIEW.json';
const OWNER_APPROVAL_PHRASE = 'PR Erstellung : Freigegeben';
const USAGE_SCAN_ROOTS = [
  '.github/workflows',
  'scripts',
  'package.json',
  'src',
  'server',
  'tests',
  'AGENTS.md',
];
const FROZEN_WORKFLOW_PATHS = new Set([
  '.github/workflows/ci.yml',
  '.github/workflows/pr-governance.yml',
  '.github/workflows/capital-ai-ci-shadow.yml',
  '.github/workflows/pr-autofix-controller.yml',
  '.github/workflows/controlled-pr-ci-autofix.yml',
  '.github/workflows/current-state-baseline-autofix.yml',
  '.github/workflows/pr-production-baseline-refresh.yml',
  '.github/workflows/pr-production-baseline-post-merge-refresh.yml',
  '.github/workflows/post-merge-production-correlation.yml',
  '.github/workflows/ops-bb2e-workflow-run-trigger.yml',
]);

const FORBIDDEN_AUTOMATIC_EVENT =
  /^\s{0,2}(pull_request_target|pull_request|push|schedule|workflow_run|repository_dispatch|issue_comment|release|issues|check_run|check_suite|merge_group)\s*:/m;

function loadDeletionReview() {
  if (!fs.existsSync(DELETION_REVIEW_PATH)) {
    return { error: `${DELETION_REVIEW_PATH} is missing` };
  }

  try {
    const review = JSON.parse(fs.readFileSync(DELETION_REVIEW_PATH, 'utf8'));
    if (review?.schemaVersion !== '1.1.0') {
      return { error: 'deletion review schemaVersion must be 1.1.0' };
    }
    if (review?.ownerApproval !== OWNER_APPROVAL_PHRASE) {
      return { error: `deletion review ownerApproval must be exactly "${OWNER_APPROVAL_PHRASE}"` };
    }
    if (!Array.isArray(review.allowedDeletions) || review.allowedDeletions.length === 0) {
      return { error: 'deletion review allowedDeletions must be a non-empty array' };
    }
    return { review };
  } catch (error) {
    return {
      error: `deletion review is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function workflowDisplayName(content) {
  const match = String(content || '').match(/^name:\s*(.+)$/m);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function parseGitGrepFiles(output) {
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const trimmed = line.trim();
    const shaSplit = trimmed.match(/^[0-9a-f]{7,40}:(.+)$/i);
    return normalizeRepoPath(shaSplit ? shaSplit[1] : trimmed);
  });
}

function collectLiveUsage(deletedPath, displayName) {
  const basename = deletedPath.split('/').pop();
  const needles = [...new Set([deletedPath, basename, displayName].filter(Boolean))];
  const hits = [];
  for (const needle of needles) {
    const output = tryGit(['grep', '-l', '-I', '-F', needle, headRef, '--', ...USAGE_SCAN_ROOTS]);
    for (const file of parseGitGrepFiles(output)) {
      if (file === deletedPath) continue;
      if (file === DELETION_REVIEW_PATH) continue;
      hits.push(`${file} references ${needle}`);
    }
  }
  return [...new Set(hits)];
}

function reviewedDeletionReasons(name, reviewBundle) {
  const reasons = [];
  if (FROZEN_WORKFLOW_PATHS.has(name)) {
    reasons.push('control-plane/frozen workflow cannot be deleted');
    return reasons;
  }
  if (reviewBundle.error) {
    reasons.push(reviewBundle.error);
    return reasons;
  }

  const entry = reviewBundle.review.allowedDeletions.find(
    (item) => normalizeRepoPath(item?.path || '') === name,
  );
  if (!entry) {
    reasons.push(`path is not listed in ${DELETION_REVIEW_PATH} allowedDeletions`);
    return reasons;
  }
  if (entry.unusedInRepo !== true) {
    reasons.push('allowedDeletion.unusedInRepo must be true after a repo usage scan');
  }

  const baseContent = tryGit(['show', `${baseRef}:${name}`]);
  if (!baseContent) {
    reasons.push('base revision of deleted workflow is unavailable for stub review');
    return reasons;
  }
  if (/\bpull_request_target\s*:/m.test(baseContent)) {
    reasons.push('base workflow used pull_request_target');
  }
  if (FORBIDDEN_AUTOMATIC_EVENT.test(baseContent)) {
    reasons.push('base workflow is not dispatch-only; live or automatic triggers mean the workflow is still in use');
  }
  if (/permissions\s*:\s*write-all/m.test(baseContent) || /:\s*write\b/m.test(baseContent)) {
    reasons.push('base workflow grants write permissions and is treated as still in use');
  }

  const usageHits = collectLiveUsage(name, workflowDisplayName(baseContent));
  if (usageHits.length > 0) {
    reasons.push(`still referenced in executable repo surfaces: ${usageHits.join(', ')}`);
  }
  return reasons;
}

const statusRaw = git(['diff', '--name-status', `${baseRef}...${headRef}`, '--', '.github/workflows']);
const statusLines = statusRaw ? statusRaw.split(/\r?\n/).filter(Boolean) : [];

const failures = [];
const workflowFiles = [];
const reviewBundle = loadDeletionReview();
let reviewedDeletions = 0;

for (const line of statusLines) {
  const [status, ...rest] = line.split('\t');
  const name = normalizeRepoPath(rest[rest.length - 1] || '');
  if (!/\.ya?ml$/i.test(name)) continue;

  if (status === 'D') {
    const reasons = reviewedDeletionReasons(name, reviewBundle);
    if (reasons.length > 0) {
      failures.push(
        `${name}: workflow file deletion requires unused-in-repo proof plus Human/Owner security review; ${reasons.join('; ')}`,
      );
    } else {
      reviewedDeletions += 1;
    }
    continue;
  }

  if (fs.existsSync(name)) workflowFiles.push(name);
}

for (const file of workflowFiles) {
  const content = fs.readFileSync(file, 'utf8');

  if (/\bpull_request_target\s*:/m.test(content)) {
    failures.push(`${file}: pull_request_target is forbidden for PR-controlled code; use pull_request with read-only permissions or a trusted default-branch workflow.`);
  }

  if (!/^permissions\s*:/m.test(content) && !/^\s+permissions\s*:/m.test(content)) {
    failures.push(`${file}: explicit minimum permissions are required.`);
  }

  if (/permissions\s*:\s*write-all/m.test(content)) {
    failures.push(`${file}: permissions: write-all is forbidden.`);
  }

  if (/persist-credentials\s*:\s*true/m.test(content)) {
    failures.push(`${file}: checkout persist-credentials:true is forbidden unless separately reviewed; default governance requires false.`);
  }

  const usesLines = [...content.matchAll(/^\s*-?\s*uses\s*:\s*([^\s#]+).*$/gm)].map((match) => match[1]);
  for (const value of usesLines) {
    if (value.startsWith('./')) continue;
    if (value.startsWith('docker://')) {
      if (!/@sha256:[0-9a-f]{64}$/i.test(value)) {
        failures.push(`${file}: container action ${value} is not pinned by sha256 digest.`);
      }
      continue;
    }

    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_./-]+@[0-9a-f]{40}$/i.test(value) &&
        !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[0-9a-f]{40}$/i.test(value)) {
      failures.push(`${file}: action ${value} must be pinned to an immutable full 40-character commit SHA.`);
    }
  }

  const isConcurrentEventWorkflow = /^\s{0,2}(push|pull_request|merge_group)\s*:/m.test(content);
  if (isConcurrentEventWorkflow && !/^concurrency\s*:/m.test(content)) {
    failures.push(`${file}: push/PR/merge-group workflow must define concurrency to prevent duplicate/racing runs.`);
  }
}

if (failures.length > 0) {
  fail(`Changed GitHub workflow security policy failed:\n- ${failures.join('\n- ')}`);
}

console.log(
  `[WORKFLOW-SECURITY] ${workflowFiles.length} changed workflow file(s) satisfy immutable-action, least-privilege and race-control baseline; ${reviewedDeletions} unused reviewed stub deletion(s) accepted.`,
);
