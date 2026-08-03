#!/usr/bin/env node

import path from 'node:path';
import {
  fail,
  readJsonFile,
  validateClaimShape,
  writeJsonFile,
} from './lib.mjs';

function parseArgs(argv) {
  const result = { paths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--path') {
      if (!value) fail('--path requires a value');
      result.paths.push(value);
      i += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      if (!value || value.startsWith('--')) fail(`${arg} requires a value`);
      result[arg.slice(2)] = value;
      i += 1;
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const required = ['claim-id', 'work-item', 'provider', 'model', 'surface'];
for (const key of required) {
  if (!args[key]) fail(`Missing required argument --${key}`);
}
if (args.paths.length === 0) fail('At least one --path must be supplied.');

const baselinePath = args['baseline'] || process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const baseline = readJsonFile(baselinePath);
if (baseline.bootstrap) fail('New work claims cannot be created from a bootstrap/legacy production baseline.');

const safeId = String(args['claim-id']).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
if (!safeId) fail('claim-id does not contain a safe file identifier.');

const claimPath = path.posix.join('.ai/work-claims', `${safeId}.json`);
const claim = {
  schemaVersion: '1.0.0',
  claimId: args['claim-id'],
  status: 'active',
  exclusive: true,
  agent: {
    provider: args.provider,
    model: args.model,
    executionSurface: args.surface,
  },
  workItem: args['work-item'],
  startedAt: new Date().toISOString(),
  baseBranch: 'main',
  baseSha: baseline.main.sha,
  pullRequest: null,
  productionBaseline: {
    checkedAt: baseline.generatedAt,
    version: baseline.production.version,
    commitSha: baseline.production.commitSha,
    branch: baseline.production.branch,
    repoSlug: baseline.production.repoSlug,
  },
  claimedPaths: [...new Set(args.paths)],
  releaseCondition: 'Claim is released only when the associated Pull Request is merged or closed.',
};

const errors = validateClaimShape(claim, claimPath);
if (errors.length > 0) fail(`Generated claim is invalid:\n- ${errors.join('\n- ')}`);

writeJsonFile(claimPath, claim);
console.log(`[PR-CLAIM] Created ${claimPath}. Commit/push this claim before application edits and open the draft PR within 15 minutes.`);
