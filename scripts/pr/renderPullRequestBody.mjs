#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  appendGithubOutput,
  fail,
  git,
  listAddedClaimFiles,
  readJsonFile,
} from './lib.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const templatePath = process.env.PR_TEMPLATE_PATH || '.github/pull_request_template.md';
const outputPath = process.env.PR_BODY_OUTPUT || 'artifacts/pr/pull-request-body.md';

if (!fs.existsSync(templatePath)) fail(`PR template not found: ${templatePath}`);
if (!fs.existsSync(baselinePath)) fail(`Production baseline not found: ${baselinePath}`);

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length !== 1) fail(`Exactly one added work claim is required to render the PR body; found ${claims.length}.`);

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

const replacements = {
  WORK_ITEM: claim.workItem,
  CLAIM_ID: claim.claimId,
  CLAIM_FILE: claimPath,
  HEAD_BRANCH: headBranch,
  AGENT_PROVIDER: claim.agent?.provider || 'unknown',
  AGENT_MODEL: claim.agent?.model || 'unknown',
  AGENT_SURFACE: claim.agent?.executionSurface || 'unknown',
  PRODUCTION_VERSION: baseline.production?.version || 'legacy-unavailable',
  PRODUCTION_SHA: baseline.production?.commitSha || 'legacy-unavailable',
  PRODUCTION_BRANCH: baseline.production?.branch || 'legacy-unavailable',
  MAIN_SHA: baseline.main?.sha || 'unknown',
  HEAD_SHA: baseline.head?.sha || 'unknown',
  PROD_TO_MAIN_COMMITS: baseline.drift?.productionToMainCommits ?? 'unknown',
  MAIN_TO_HEAD_COMMITS: baseline.drift?.mainToHeadCommits ?? 'unknown',
  BASELINE_GENERATED_AT: baseline.generatedAt || new Date().toISOString(),
};

let body = template;
for (const [key, value] of Object.entries(replacements)) {
  body = body.split(`{{${key}}}`).join(String(value));
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR template still contains unresolved machine placeholders: ${[...new Set(unresolved)].join(', ')}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');

const title = `agent: ${String(claim.workItem).trim()}`.slice(0, 240);
appendGithubOutput({ pr_body_output: outputPath, pr_title: title, claim_id: claim.claimId, claim_file: claimPath });
console.log(`[PR-TEMPLATE] Rendered ${outputPath} from template v1.0.0 for ${claim.claimId}.`);
