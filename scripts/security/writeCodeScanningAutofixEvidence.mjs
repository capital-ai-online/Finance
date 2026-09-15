#!/usr/bin/env node
import fs from 'node:fs/promises';

const target = process.argv[2];
if (!target) throw new Error('Evidence target path required.');

const env = process.env;
const sha = (v) => /^[0-9a-f]{40}$/i.test(String(v || '')) ? String(v) : null;
const number = Number(env.ALERT_NUMBER || 0);

const evidence = {
  schema: 'capital-ai-controlled-autofix-decision/v1',
  run: {
    id: env.GITHUB_RUN_ID || null,
    attempt: env.GITHUB_RUN_ATTEMPT || null,
    repository: env.GITHUB_REPOSITORY || null,
    event: env.GITHUB_EVENT_NAME || null,
    ref: env.GITHUB_REF || null,
    workflow_sha: sha(env.GITHUB_SHA),
  },
  decision: env.DECISION || 'NO_DECISION',
  reason: env.REASON || 'not-evaluated',
  candidate: {
    created: env.CANDIDATE_CREATED === 'true',
    safe: env.CANDIDATE_SAFE === 'true',
    alert_number: Number.isInteger(number) && number > 0 ? number : null,
    base_sha: sha(env.BASE_SHA),
    branch: env.BRANCH || null,
    commit_sha: sha(env.COMMIT_SHA),
    languages: String(env.LANGUAGES || '').split(',').filter(Boolean).sort(),
  },
};
await fs.writeFile(target, JSON.stringify(evidence, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
