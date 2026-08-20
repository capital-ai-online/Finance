#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  appendGithubOutput,
  fail,
  git,
  listAddedClaimFiles,
  readJsonFile,
  renderProductionBaselineBlock,
  PR_TEMPLATE_VERSION,
} from './lib.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const templatePath = process.env.PR_TEMPLATE_PATH || '.github/pull_request_template.md';
const outputPath = process.env.PR_BODY_OUTPUT || 'artifacts/pr/pull-request-body.md';
const allowClaimless = process.env.PR_ALLOW_CLAIMLESS === 'true';

if (!fs.existsSync(templatePath)) fail(`PR-Vorlage nicht gefunden: ${templatePath}`);
if (!fs.existsSync(baselinePath)) fail(`Produktions-Baseline nicht gefunden: ${baselinePath}`);

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length > 1) {
  fail(`Für die PR-Erzeugung ist höchstens ein neuer Work-Claim zulässig; gefunden: ${claims.length}.`);
}
if (claims.length === 0 && !allowClaimless) {
  fail('Für den Agenten-PR-Pfad ist genau ein neuer Work-Claim erforderlich. Claimlose Human/API/Connector-Pfade müssen PR_ALLOW_CLAIMLESS=true explizit setzen.');
}

let claimPath = 'N/A (kein neuer Work-Claim im Diff)';
let claim;
if (claims.length === 1) {
  claimPath = claims[0];
  claim = headRef === 'HEAD'
    ? readJsonFile(claimPath)
    : JSON.parse(git(['show', `${headRef}:${claimPath}`]));
} else {
  claim = {
    claimId: 'N/A (kein neuer Work-Claim im Diff)',
    workItemDE: process.env.PR_WORK_ITEM_DE || process.env.PR_TITLE || 'Autorisierter Human/API/Connector-Änderungsantrag',
    agent: {
      provider: process.env.PR_AGENT_PROVIDER || 'N/A (Human/API/Connector-Pfad)',
      model: process.env.PR_AGENT_MODEL || 'N/A',
      executionSurface: process.env.PR_AGENT_SURFACE || 'GitHub API/UI/Connector',
    },
  };
}

const baseline = readJsonFile(baselinePath);
const productionBaselineBlock = renderProductionBaselineBlock(baseline);
const template = fs.readFileSync(templatePath, 'utf8');
const headBranch = process.env.PR_HEAD_BRANCH || (() => {
  const value = git(['rev-parse', '--abbrev-ref', headRef]);
  return value === 'HEAD' ? process.env.GITHUB_REF_NAME || 'detached-head' : value;
})();

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
  PRODUCTION_BASELINE_BLOCK: productionBaselineBlock,
};

let body = template;
for (const [key, value] of Object.entries(replacements)) {
  body = body.split(`{{${key}}}`).join(String(value));
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR-Vorlage enthält noch nicht aufgelöste Vorlagenplatzhalter: ${[...new Set(unresolved)].join(', ')}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');

const title = `Agenten-Änderung: ${germanWorkItem}`.slice(0, 240);
appendGithubOutput({
  pr_body_output: outputPath,
  pr_title: title,
  claim_id: claim.claimId,
  claim_file: claimPath,
  baseline_id: baseline.baselineId,
});
console.log(`[PR-VORLAGE] ${outputPath} aus deutscher Vorlage v${PR_TEMPLATE_VERSION} mit atomarer Baseline ${baseline.baselineId} erzeugt.`);
