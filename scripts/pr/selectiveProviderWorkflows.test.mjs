import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const CHECKOUT_ACTION_SHA = 'fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09';
const OLD_CHECKOUT_ACTION_SHA = '08c6903cd8c0fde910a37f88322edcfb5dd907a8';
const CODEQL_ACTION_SHA = 'b96794f015dfd88f77b49b1c93e0fa7110f94c63';
const GITHUB_SCRIPT_SHA = '3a2844b7e9c422d3c10d287c895573f7108da1b3';

test('selective CodeQL has no automatic PR/push/schedule fan-out', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-codeql.yml', 'utf8');

  assert.match(workflow, /\bon:\s*\n\s+workflow_dispatch\s*:/);
  assert.doesNotMatch(workflow, /^\s{2}pull_request\s*:/m);
  assert.doesNotMatch(workflow, /^\s{2}push\s*:/m);
  assert.doesNotMatch(workflow, /^\s{2}schedule\s*:/m);
  assert.match(workflow, /dynamic\/github-code-scanning\/codeql/);
  assert.match(workflow, /default_setup_active != 'true'/);
  assert.match(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(workflow, /CI_FORCE_FULL:\s*'true'/);
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.equal(
    workflow.match(new RegExp(`actions/checkout@${CHECKOUT_ACTION_SHA}`, 'g'))?.length,
    2,
  );
  assert.doesNotMatch(workflow, new RegExp(OLD_CHECKOUT_ACTION_SHA));
  assert.match(workflow, new RegExp(`github/codeql-action/init@${CODEQL_ACTION_SHA}`));
  assert.match(workflow, new RegExp(`github/codeql-action/analyze@${CODEQL_ACTION_SHA}`));
});

test('Copilot code review has no automatic workflow-run or PR fan-out', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');

  assert.match(workflow, /\bon:\s*\n\s+workflow_dispatch\s*:/);
  assert.match(workflow, /pr_number:/);
  assert.doesNotMatch(workflow, /^\s{2}workflow_run\s*:/m);
  assert.doesNotMatch(workflow, /^\s{2}pull_request\s*:/m);
  assert.doesNotMatch(workflow, /^\s{2}push\s*:/m);
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.doesNotMatch(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.doesNotMatch(workflow, /actions\/checkout@/);
  assert.match(workflow, /copilot-pull-request-reviewer\[bot\]/);
  assert.match(workflow, new RegExp(`actions/github-script@${GITHUB_SCRIPT_SHA}`));
});

test('manual Copilot workflow validates exact open same-repo main PR before write authority', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');

  assert.match(workflow, /permissions:\s*\{\}/);
  assert.match(workflow, /pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.match(workflow, /pr\.state !== 'open'/);
  assert.match(workflow, /pr\.base\.ref !== 'main'/);
  assert.match(workflow, /pr\.head\.repo\?\.full_name !== context\.payload\.repository\.full_name/);
  assert.match(workflow, /review\.commit_id === pr\.head\.sha/);
  assert.match(workflow, /github\.rest\.pulls\.requestReviewers/);
});

test('planner exposes repository-wide NONE FOCUSED FULL profiles and keeps provider controls self-protecting', async () => {
  const planner = await fs.readFile('scripts/pr/planPrValidation.mjs', 'utf8');

  assert.match(planner, /validation_profile:\s*'none'/);
  assert.match(planner, /validation_profile:\s*'full'/);
  assert.match(planner, /const validationProfile =/);
  assert.match(planner, /\? 'full'\s*:\s*'focused'/);
  assert.match(planner, /\.github\/workflows\/selective-codeql\.yml/);
  assert.match(planner, /\.github\/workflows\/selective-copilot-code-review\.yml/);
  assert.match(planner, /\.github\/workflows\/oss-code-review\.yml/);
  assert.match(planner, /Exact-snapshot reuse is intentionally owned by ci\.yml/);
});

test('trusted-base migration keeps JSON authoritative with a bounded legacy shadow', async () => {
  const planner = await fs.readFile('scripts/pr/planPrValidation.mjs', 'utf8');
  const jsonBranch = planner.indexOf('process.env.CHANGED_FILES_JSON');
  const legacyBranch = planner.indexOf('process.env.CHANGED_FILES)');

  assert.ok(jsonBranch >= 0, 'JSON changed-file input missing');
  assert.ok(legacyBranch > jsonBranch, 'legacy changed-file input must remain lower priority than JSON');
});
