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
  '## 1. Arbeitsauftrag',
  '## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe',
  '## 3. Produktions-Baseline — maschinenverwaltete / beratende Evidence',
  '## 4. Scope / Multi-Agent-Koordination',
  '## 5. Änderungszusammenfassung',
  '## 6. Architektur- / Governance-Auswirkungen',
  '## 7. Sicherheitsprüfung',
  '### MCP- / LLM-Gateway-Änderungen',
  '## 8. Technische Validierungsevidence',
  '## 9. Risiko und Rollback',
  '## 10. Review-Bereitschaft',
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

if (!body.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich, sofern anwendbar:** Ja')) {
  fail('Canonical PR must explicitly retain the human/CODEOWNER approval requirement.');
}

console.log(`[PR-TEMPLATE] PR #${prNumber} uses the canonical German human-facing template and matches current work-claim/production baseline evidence.`);
