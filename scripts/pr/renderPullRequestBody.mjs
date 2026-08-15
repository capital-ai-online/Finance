#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  appendGithubOutput,
  fail,
  git,
  listAddedClaimFiles,
  readJsonFile,
  PR_TEMPLATE_VERSION,
} from './lib.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const templatePath = process.env.PR_TEMPLATE_PATH || '.github/pull_request_template.md';
const outputPath = process.env.PR_BODY_OUTPUT || 'artifacts/pr/pull-request-body.md';

if (!fs.existsSync(templatePath)) fail(`PR-Vorlage nicht gefunden: ${templatePath}`);
if (!fs.existsSync(baselinePath)) fail(`Produktions-Baseline nicht gefunden: ${baselinePath}`);

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length !== 1) fail(`Für die PR-Erzeugung ist genau ein neuer Work-Claim erforderlich; gefunden: ${claims.length}.`);

const claimPath = claims[0];
let claim;
if (headRef === 'HEAD') {
  claim = readJsonFile(claimPath);
} else {
  claim = JSON.parse(git(['show', `${headRef}:${claimPath}`]));
}

const baseline = readJsonFile(baselinePath);
const template = fs.readFileSync(templatePath, 'utf8');
const headBranch = process.env.PR_HEAD_BRANCH || (() => {
  const value = git(['rev-parse', '--abbrev-ref', headRef]);
  return value === 'HEAD' ? process.env.GITHUB_REF_NAME || 'detached-head' : value;
})();

// Sichtbare Pull-Request-Inhalte sind repositoryweit deutsch. Ein Agent kann optional
// workItemDE/titleDE liefern. Fehlt eine deutsche Fassung, wird kein englischer Work-Item-Text
// in die sichtbare PR-Oberfläche übernommen; die technische Detailquelle bleibt der Work-Claim.
const germanWorkItem = String(
  claim.workItemDE
  || claim.workItemDe
  || claim.titleDE
  || `Agenten-Arbeitsauftrag ${claim.claimId}`,
).trim();

const replacements = {
  WORK_ITEM: germanWorkItem,
  CLAIM_ID: claim.claimId,
  CLAIM_FILE: claimPath,
  HEAD_BRANCH: headBranch,
  AGENT_PROVIDER: claim.agent?.provider || 'unbekannt',
  AGENT_MODEL: claim.agent?.model || 'unbekannt',
  AGENT_SURFACE: claim.agent?.executionSurface || 'unbekannt',
  PRODUCTION_VERSION: baseline.production?.version || 'nicht-verfügbar',
  PRODUCTION_SHA: baseline.production?.commitSha || 'nicht-verfügbar',
  PRODUCTION_BRANCH: baseline.production?.branch || 'nicht-verfügbar',
  MAIN_SHA: baseline.main?.sha || 'unbekannt',
  HEAD_SHA: baseline.head?.sha || 'unbekannt',
  PROD_TO_MAIN_COMMITS: baseline.drift?.productionToMainCommits ?? 'unbekannt',
  MAIN_TO_HEAD_COMMITS: baseline.drift?.mainToHeadCommits ?? 'unbekannt',
  BASELINE_GENERATED_AT: baseline.generatedAt || new Date().toISOString(),
};

let body = template;
for (const [key, value] of Object.entries(replacements)) {
  body = body.split(`{{${key}}}`).join(String(value));
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR-Vorlage enthält noch nicht aufgelöste Platzhalter: ${[...new Set(unresolved)].join(', ')}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');

const title = `Agenten-Änderung: ${germanWorkItem}`.slice(0, 240);
appendGithubOutput({ pr_body_output: outputPath, pr_title: title, claim_id: claim.claimId, claim_file: claimPath });
console.log(`[PR-VORLAGE] ${outputPath} aus deutscher Vorlage v${PR_TEMPLATE_VERSION} für ${claim.claimId} erzeugt.`);
