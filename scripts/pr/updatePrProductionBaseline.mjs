#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_MARKER,
  appendGithubOutput,
  fail,
  githubJson,
  readJsonFile,
  validateProductionBaselineForPr,
} from './lib.mjs';
import { replaceProductionBaselineBlock } from './productionBaselineBody.mjs';

const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const prNumber = Number(process.env.PR_NUMBER || 0);
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';

if (!repository || !repository.includes('/')) fail('GITHUB_REPOSITORY fehlt oder ist ungültig.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN fehlt.');
if (!prNumber) fail('PR_NUMBER ist für den Baseline-Auto-Refresh erforderlich.');
if (!fs.existsSync(baselinePath)) fail(`Produktions-Baseline fehlt: ${baselinePath}`);

const baseline = readJsonFile(baselinePath);
const baselineErrors = validateProductionBaselineForPr(baseline);
if (baselineErrors.length > 0) {
  fail(`Produktions-Baseline ist nicht aktualisierbar: ${baselineErrors.join('; ')}`);
}

function normalizeSha(value) {
  return String(value || '').trim().toLowerCase();
}

function skip(reason) {
  console.log(`[PR-BASELINE-REFRESH] SKIP PR #${prNumber}: ${reason}`);
  appendGithubOutput({ changed: 'false', skipped: 'true', skip_reason: reason, baseline_id: baseline.baselineId });
  process.exit(0);
}

async function fetchPr() {
  return githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
}

async function fetchCurrentMainSha() {
  const branch = await githubJson(`https://api.github.com/repos/${repository}/branches/main`, token);
  return normalizeSha(branch?.commit?.sha);
}

function validateMutablePrBoundary(pr) {
  if (pr?.state !== 'open') skip(`PR ist ${String(pr?.state || 'unbekannt')} statt open.`);
  if (pr?.base?.ref !== 'main') skip(`Base ist ${String(pr?.base?.ref || 'unbekannt')} statt main.`);
  if (pr?.head?.repo?.full_name !== repository) skip('Fork-/Cross-Repository-PR wird vom Write-Workflow nicht verändert.');

  const prHeadSha = normalizeSha(pr?.head?.sha);
  if (!/^[0-9a-f]{40}$/.test(prHeadSha)) {
    fail(`PR #${prNumber} liefert keinen gültigen immutable Head-SHA.`);
  }
  if (prHeadSha !== normalizeSha(baseline?.head?.sha)) {
    skip(`Head hat sich seit dem Preflight geändert (${prHeadSha.slice(0, 12)} != ${normalizeSha(baseline?.head?.sha).slice(0, 12)}).`);
  }

  const body = String(pr?.body || '');
  if (!body.includes(PR_TEMPLATE_MARKER)) {
    fail(`PR #${prNumber} verwendet nicht den kanonischen Vorlagenmarker ${PR_TEMPLATE_MARKER}; Auto-Refresh repariert keine nicht-kanonischen Bodies.`);
  }

  return body;
}

// First snapshot validates the authority boundary before any mutation is considered.
let pr = await fetchPr();
validateMutablePrBoundary(pr);

let currentMainSha = await fetchCurrentMainSha();
if (!/^[0-9a-f]{40}$/.test(currentMainSha)) {
  fail('Aktueller main-SHA konnte nicht unveränderlich aufgelöst werden.');
}
if (currentMainSha !== normalizeSha(baseline?.main?.sha)) {
  skip(`main hat sich seit dem Preflight geändert (${currentMainSha.slice(0, 12)} != ${normalizeSha(baseline?.main?.sha).slice(0, 12)}).`);
}

// Re-read immediately before PATCH so concurrent human edits that happened during the
// preflight are preserved. GitHub's PR body API has no body-level compare-and-swap token;
// this narrows the residual race window without weakening the fail-closed identity checks.
pr = await fetchPr();
const latestBody = validateMutablePrBoundary(pr);
currentMainSha = await fetchCurrentMainSha();
if (currentMainSha !== normalizeSha(baseline?.main?.sha)) {
  skip('main änderte sich unmittelbar vor dem PR-Body-Update; ein späterer Lauf übernimmt den neuen Stand.');
}

const update = replaceProductionBaselineBlock(latestBody, baseline);
if (!update.changed) {
  console.log(`[PR-BASELINE-REFRESH] PR #${prNumber} ist bereits auf ${baseline.baselineId}; kein Body-Write.`);
  appendGithubOutput({ changed: 'false', skipped: 'false', baseline_id: baseline.baselineId });
  process.exit(0);
}

const updatedPr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ body: update.body }),
});

if (!String(updatedPr?.body || '').includes(baseline.baselineId)) {
  fail(`PR #${prNumber} wurde geschrieben, bestätigt aber die erwartete Baseline-ID ${baseline.baselineId} nicht.`);
}

appendGithubOutput({ changed: 'true', skipped: 'false', baseline_id: baseline.baselineId });
console.log(`[PR-BASELINE-REFRESH] PR #${prNumber} atomar auf ${baseline.baselineId} aktualisiert; alle übrigen Body-Inhalte wurden beibehalten.`);
