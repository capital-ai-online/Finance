#!/usr/bin/env node

import fs from 'node:fs';
import {
  MAX_PR_START_DELAY_MS,
  fail,
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
const bootstrapPr75 = process.env.ALLOW_PR75_BOOTSTRAP === 'true' && prNumber === 75;

if (!repository) fail('GITHUB_REPOSITORY is required for multi-agent overlap checks.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN is required for read-only PR overlap checks.');

function readClaimAtRef(claimPath) {
  if (headRef === 'HEAD') return readJsonFile(claimPath);
  const content = git(['show', `${headRef}:${claimPath}`]);
  return JSON.parse(content);
}

function currentMainSha() {
  return git(['rev-parse', baseRef]);
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
    return { claim: null, claimPath: null, files, error: `expected exactly one added work claim, found ${claimFiles.length}` };
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

const addedClaimFiles = listAddedClaimFiles(baseRef, headRef);
if (addedClaimFiles.length !== 1) {
  fail(`Exactly one new .ai/work-claims/*.json file is required per PR; found ${addedClaimFiles.length}: ${addedClaimFiles.join(', ') || '(none)'}`);
}

const claimPath = addedClaimFiles[0];
const claim = readClaimAtRef(claimPath);
const shapeErrors = validateClaimShape(claim, claimPath);
if (shapeErrors.length > 0) {
  fail(`Invalid work claim ${claimPath}:\n- ${shapeErrors.join('\n- ')}`);
}

const mainSha = currentMainSha();
if (String(claim.baseSha).toLowerCase() !== mainSha.toLowerCase()) {
  fail(`Work claim baseSha ${claim.baseSha} does not match current main ${mainSha}. Refresh/rebase from main and update the claim before continuing.`);
}

const changedFiles = listChangedFiles(baseRef, headRef);
const uncoveredFiles = changedFiles.filter((file) => {
  if (file === claimPath) return false;
  return !pathMatchesClaim(file, claim.claimedPaths);
});

if (uncoveredFiles.length > 0) {
  fail(`Changed files outside the exclusive work claim:\n- ${uncoveredFiles.join('\n- ')}\nExpand the claim before editing those paths, then rerun overlap checks.`);
}

if (fs.existsSync(baselinePath)) {
  const baseline = readJsonFile(baselinePath);
  if (baseline.bootstrap) {
    if (!bootstrapPr75) fail('A bootstrap production baseline is allowed only for foundational PR #75.');
  } else {
    const claimedProductionSha = String(claim.productionBaseline?.commitSha || '').toLowerCase();
    const actualProductionSha = String(baseline.production?.commitSha || '').toLowerCase();
    if (!/^[0-9a-f]{40}$/.test(claimedProductionSha)) {
      fail('Work claim productionBaseline.commitSha must contain the immutable production commit SHA.');
    }
    if (claimedProductionSha !== actualProductionSha) {
      fail(`Work claim production SHA ${claimedProductionSha} does not match current production preflight ${actualProductionSha}. Refresh the claim before PR creation/update.`);
    }
    if (claim.productionBaseline?.version && String(claim.productionBaseline.version) !== String(baseline.production?.version || '')) {
      fail(`Work claim production version ${claim.productionBaseline.version} does not match preflight ${baseline.production?.version}.`);
    }
  }
}

const openPulls = await githubPaginated(`/repos/${repository}/pulls?state=open&base=main`, token);
const otherPulls = openPulls.filter((pr) => !prNumber || pr.number !== prNumber);
const conflictMessages = [];

for (const other of otherPulls) {
  const otherState = await fetchClaimForOtherPr(other);
  const otherChangedFiles = otherState.files
    .map((file) => normalizeRepoPath(file.filename))
    .filter((file) => !isClaimMetadataPath(file));
  const currentChangedFiles = changedFiles.filter((file) => !isClaimMetadataPath(file));
  const otherFileSet = new Set(otherChangedFiles);
  const directOverlap = currentChangedFiles.filter((file) => otherFileSet.has(file));

  if (directOverlap.length > 0) {
    conflictMessages.push(`PR #${other.number} directly changes the same file(s): ${directOverlap.join(', ')}`);
  }

  if (otherState.error) {
    // An open agent PR without a valid claim is itself unsafe. Fail closed instead of assuming
    // that its scope is disjoint from the current agent.
    conflictMessages.push(`PR #${other.number} has no trustworthy exclusive claim (${otherState.error}).`);
    continue;
  }

  const otherShapeErrors = validateClaimShape(otherState.claim, otherState.claimPath);
  if (otherShapeErrors.length > 0) {
    conflictMessages.push(`PR #${other.number} has an invalid work claim (${otherShapeErrors.join('; ')}).`);
    continue;
  }

  const claimConflicts = findClaimConflicts(claim.claimedPaths, otherState.claim.claimedPaths);
  if (claimConflicts.length > 0) {
    const formatted = claimConflicts.map(({ current, other: otherScope }) => `${current} <-> ${otherScope}`).join('; ');
    conflictMessages.push(`PR #${other.number} owns overlapping claimed scope: ${formatted}`);
  }
}

if (conflictMessages.length > 0) {
  fail(`Multi-agent single-writer gate blocked this branch:\n- ${conflictMessages.join('\n- ')}\nClose/merge/supersede the older PR or rescope this claim before continuing.`);
}

if (prNumber) {
  const pr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
  const claimStartedAt = Date.parse(claim.startedAt);
  const prCreatedAt = Date.parse(pr.created_at);
  const startDelay = prCreatedAt - claimStartedAt;

  if (Number.isNaN(claimStartedAt) || Number.isNaN(prCreatedAt)) {
    fail('Cannot evaluate 15-minute PR SLA because claim/PR timestamps are invalid.');
  }

  if (startDelay < 0 && !bootstrapPr75) {
    fail(`PR was created before the declared claim startedAt (${claim.startedAt}); claim chronology is invalid.`);
  }

  if (startDelay > MAX_PR_START_DELAY_MS) {
    fail(`PR #${prNumber} was created ${Math.ceil(startDelay / 60_000)} minutes after work started. Maximum is 15 minutes. Close and restart from current main with a new claim.`);
  }

  if (claim.pullRequest != null && Number(claim.pullRequest) !== prNumber) {
    fail(`Work claim references PR #${claim.pullRequest}, but validation is running for PR #${prNumber}.`);
  }

  console.log(`[PR-CLAIM] PR #${prNumber} was opened ${(startDelay / 60_000).toFixed(1)} minutes after claim start.`);
}

console.log(`[PR-CLAIM] ${claim.claimId}: ${claim.claimedPaths.length} claimed scope(s), ${changedFiles.length} changed file(s), no active PR overlap.`);
