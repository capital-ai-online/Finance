#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_MARKER,
  fail,
  githubJson,
  listAddedClaimFiles,
  readJsonFile,
} from './lib.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const prNumber = Number(process.env.PR_NUMBER || 0);
const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';

if (!repository) fail('GITHUB_REPOSITORY is required.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN is required.');
if (!prNumber) fail('PR_NUMBER is required for PR template validation.');
if (!fs.existsSync(baselinePath)) fail(`Production baseline is missing: ${baselinePath}`);

const pr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
const body = String(pr.body || '');

if (!body.includes(PR_TEMPLATE_MARKER)) {
  fail(`PR #${prNumber} does not use the canonical template marker: ${PR_TEMPLATE_MARKER}`);
}

const requiredSections = [
  '## 1. Work Item',
  '## 2. Agent / Principal Identity',
  '## 3. Production Baseline — machine managed',
  '## 4. Claimed Scope / Multi-Agent Isolation',
  '## 5. Change Summary',
  '## 6. Architecture / Governance Impact',
  '## 7. Security Review',
  '### MCP / LLM Gateway changes',
  '## 8. Validation Evidence',
  '## 9. Risk & Rollback',
  '## 10. Review Readiness',
];

const missingSections = requiredSections.filter((heading) => !body.includes(heading));
if (missingSections.length > 0) {
  fail(`PR #${prNumber} is missing required canonical template section(s): ${missingSections.join(', ')}`);
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR #${prNumber} contains unresolved template placeholders: ${[...new Set(unresolved)].join(', ')}`);
}

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length !== 1) fail(`Expected exactly one work claim in PR diff, found ${claims.length}.`);
const claimPath = claims[0];
const claim = readJsonFile(claimPath);
const baseline = readJsonFile(baselinePath);

const evidenceTokens = [
  claim.claimId,
  claimPath,
  baseline.main?.sha,
  baseline.head?.sha,
  baseline.production?.commitSha,
  baseline.production?.version,
].filter(Boolean).map(String);

const missingEvidence = evidenceTokens.filter((value) => !body.includes(value));
if (missingEvidence.length > 0) {
  fail(`PR #${prNumber} template is stale or not machine-rendered; missing claim/baseline evidence: ${missingEvidence.join(', ')}`);
}

if (!body.includes('Human/code-owner approval required:** Yes')) {
  fail('Canonical PR must explicitly retain human/code-owner approval requirement.');
}

console.log(`[PR-TEMPLATE] PR #${prNumber} uses canonical template v1.0.0 and matches current work-claim/production baseline evidence.`);
