#!/usr/bin/env node

import fs from 'node:fs';
import {
  findClaimConflicts,
  git,
  githubJson,
  githubPaginated,
  isClaimMetadataPath,
  listAddedClaimFiles,
  listChangedFiles,
  normalizeRepoPath,
  pathMatchesClaim,
  readJsonFile,
  validateClaimShape,
} from './lib.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const prNumber = process.env.PR_NUMBER ? Number(process.env.PR_NUMBER) : null;
const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';

if (!repository) throw new Error('GITHUB_REPOSITORY is required for the advisory overlap report.');
if (!token) throw new Error('GITHUB_TOKEN/GH_TOKEN is required for read-only PR inspection.');

function warn(message) {
  console.warn(`[PR-COORDINATION][ADVISORY] ${message}`);
}

function readClaimAtRef(claimPath) {
  if (headRef === 'HEAD') return readJsonFile(claimPath);
  const content = git(['show', `${headRef}:${claimPath}`]);
  return JSON.parse(content);
}

async function fetchPullFiles(number) {
  return githubPaginated(`/repos/${repository}/pulls/${number}/files`, token);
}

async function fetchClaimForOtherPr(pr) {
  const files = await fetchPullFiles(pr.number);
  const claimFiles = files
    .filter((file) => file.status === 'added')
    .map((file) => normalizeRepoPath(file.filename))
    .filter((file) => file.startsWith('.ai/work-claims/') && file.endsWith('.json'));

  if (claimFiles.length !== 1) {
    return { claim: null, claimPath: null, files, error: `expected one optional work claim, found ${claimFiles.length}` };
  }

  const claimPath = claimFiles[0];
  const encodedPath = claimPath.split('/').map(encodeURIComponent).join('/');
  const response = await githubJson(
    `https://api.github.com/repos/${repository}/contents/${encodedPath}?ref=${encodeURIComponent(pr.head.sha)}`,
    token,
  );

  if (!response || response.encoding !== 'base64' || !response.content) {
    return { claim: null, claimPath, files, error: 'claim content unavailable' };
  }

  const claim = JSON.parse(Buffer.from(response.content.replace(/\n/g, ''), 'base64').toString('utf8'));
  return { claim, claimPath, files, error: null };
}

const changedFiles = listChangedFiles(baseRef, headRef);
const addedClaimFiles = listAddedClaimFiles(baseRef, headRef);
let claim = null;
let claimPath = null;

if (addedClaimFiles.length > 1) {
  warn(`Multiple work claims found: ${addedClaimFiles.join(', ')}. Treat claim metadata as ambiguous.`);
} else if (addedClaimFiles.length === 1) {
  claimPath = addedClaimFiles[0];
  claim = readClaimAtRef(claimPath);
  const shapeErrors = validateClaimShape(claim, claimPath);
  if (shapeErrors.length > 0) {
    warn(`Work claim ${claimPath} is malformed: ${shapeErrors.join('; ')}`);
    claim = null;
  }
} else {
  warn('No work claim present. This is allowed under ADR-0039; overlap analysis will use changed files only.');
}

if (claim) {
  const mainSha = git(['rev-parse', baseRef]);
  if (String(claim.baseSha).toLowerCase() !== mainSha.toLowerCase()) {
    warn(`Work claim baseSha ${claim.baseSha} differs from current main ${mainSha}. Refresh evidence before merge/release if relevant.`);
  }

  const uncoveredFiles = changedFiles.filter((file) => {
    if (file === claimPath) return false;
    return !pathMatchesClaim(file, claim.claimedPaths);
  });
  if (uncoveredFiles.length > 0) {
    warn(`Changed files outside the advisory claim: ${uncoveredFiles.join(', ')}`);
  }

  if (fs.existsSync(baselinePath)) {
    const baseline = readJsonFile(baselinePath);
    if (!baseline.bootstrap) {
      const claimedProductionSha = String(claim.productionBaseline?.commitSha || '').toLowerCase();
      const actualProductionSha = String(baseline.production?.commitSha || '').toLowerCase();
      if (claimedProductionSha && actualProductionSha && claimedProductionSha !== actualProductionSha) {
        warn(`Claim production SHA ${claimedProductionSha} differs from current production evidence ${actualProductionSha}.`);
      }
    }
  }
}

const openPulls = await githubPaginated(`/repos/${repository}/pulls?state=open&base=main`, token);
const otherPulls = openPulls.filter((pr) => !prNumber || pr.number !== prNumber);
const warnings = [];
const currentChangedFiles = changedFiles.filter((file) => !isClaimMetadataPath(file));

for (const other of otherPulls) {
  const otherState = await fetchClaimForOtherPr(other);
  const otherChangedFiles = otherState.files
    .map((file) => normalizeRepoPath(file.filename))
    .filter((file) => !isClaimMetadataPath(file));
  const otherFileSet = new Set(otherChangedFiles);
  const directOverlap = currentChangedFiles.filter((file) => otherFileSet.has(file));

  if (directOverlap.length > 0) {
    warnings.push(`PR #${other.number} changes the same file(s): ${directOverlap.join(', ')}`);
  }

  if (otherState.error) {
    warnings.push(`PR #${other.number} has no usable optional work claim (${otherState.error}).`);
    continue;
  }

  if (claim) {
    const otherShapeErrors = validateClaimShape(otherState.claim, otherState.claimPath);
    if (otherShapeErrors.length > 0) {
      warnings.push(`PR #${other.number} has malformed optional claim metadata (${otherShapeErrors.join('; ')}).`);
      continue;
    }

    const claimConflicts = findClaimConflicts(claim.claimedPaths, otherState.claim.claimedPaths);
    if (claimConflicts.length > 0) {
      const formatted = claimConflicts
        .map(({ current, other: otherScope }) => `${current} <-> ${otherScope}`)
        .join('; ');
      warnings.push(`PR #${other.number} has overlapping advisory scope: ${formatted}`);
    }
  }
}

if (warnings.length > 0) {
  for (const message of warnings) warn(message);
  console.log('[PR-COORDINATION] Conflicts are advisory. Report them to the user before PR creation or merge; do not treat them as sandbox/build failures.');
} else {
  console.log('[PR-COORDINATION] No changed-file or advisory-claim overlap detected against current open PRs.');
}

console.log(`[PR-COORDINATION] ${changedFiles.length} changed file(s) inspected. No PR creation deadline applies.`);
