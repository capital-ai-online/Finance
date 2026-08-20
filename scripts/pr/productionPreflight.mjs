#!/usr/bin/env node

import fs from 'node:fs';
import {
  DEFAULT_PRODUCTION_HEALTH_URL,
  PRODUCTION_BASELINE_SCHEMA_VERSION,
  appendGithubOutput,
  compareSemver,
  computeProductionBaselineId,
  fail,
  git,
  gitSucceeds,
  writeJsonFile,
} from './lib.mjs';

const productionUrl = process.env.CAPITAL_AI_PRODUCTION_HEALTH_URL || DEFAULT_PRODUCTION_HEALTH_URL;
const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const outputPath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const repository = process.env.GITHUB_REPOSITORY || null;
const prNumber = String(process.env.PR_NUMBER || '');
const bootstrapPr75 = process.env.ALLOW_PR75_BOOTSTRAP === 'true' && prNumber === '75';

function ensureRef(ref) {
  if (!gitSucceeds(['rev-parse', '--verify', `${ref}^{commit}`])) {
    fail(`Git ref is unavailable: ${ref}. Fetch full history/current main before PR preflight.`);
  }
}

function ensureCommitAvailable(sha) {
  if (gitSucceeds(['cat-file', '-e', `${sha}^{commit}`])) return;
  try {
    git(['fetch', '--no-tags', 'origin', sha]);
  } catch {
    fail(`Production commit ${sha} is not available from the repository origin.`);
  }
  if (!gitSucceeds(['cat-file', '-e', `${sha}^{commit}`])) {
    fail(`Production commit ${sha} could not be resolved after fetch.`);
  }
}

async function fetchProductionHealth() {
  let response;
  try {
    response = await fetch(productionUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    fail(`Production health request failed for ${productionUrl}: ${error?.message || error}`);
  }

  if (!response.ok) {
    fail(`Production health request returned HTTP ${response.status} for ${productionUrl}.`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    fail(`Production health response from ${productionUrl} is not valid JSON.`);
  }

  if (payload?.status !== 'ok') {
    fail(`Production health endpoint is not healthy: status=${String(payload?.status)}`);
  }

  const headerDeployment = {
    version: response.headers.get('x-capital-ai-version'),
    commitSha: response.headers.get('x-capital-ai-commit'),
    branch: response.headers.get('x-capital-ai-branch'),
    repoSlug: response.headers.get('x-capital-ai-repo'),
    provider: response.headers.get('x-capital-ai-provider'),
  };

  return {
    payload,
    deployment: payload?.deployment || headerDeployment,
  };
}

ensureRef(baseRef);
ensureRef(headRef);

const mainSha = git(['rev-parse', baseRef]);
const headSha = git(['rev-parse', headRef]);
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const branchVersion = String(packageJson.version || '');
const generatedAt = new Date().toISOString();

const branchContainsMain = (() => {
  try {
    git(['merge-base', '--is-ancestor', mainSha, headSha]);
    return true;
  } catch {
    return false;
  }
})();

if (!branchContainsMain) {
  fail(`PR head ${headSha} does not contain current main ${mainSha}. Rebase/recreate the branch from current main before creating or refreshing the PR baseline.`);
}

const productionResult = await fetchProductionHealth();
const productionHealth = productionResult.payload;
const deployment = productionResult.deployment;

if (!deployment?.commitSha || !/^[0-9a-f]{40}$/i.test(String(deployment.commitSha))) {
  if (!bootstrapPr75) {
    fail('Production /healthz does not expose a valid immutable deployment commit (x-capital-ai-commit / deployment.commitSha). ADR-0036 requires it before PR creation.');
  }

  const legacyBaseline = {
    schemaVersion: '1.0.0',
    generatedAt,
    productionUrl,
    bootstrap: true,
    bootstrapPr: 75,
    bootstrapReason: 'PR #75 introduces deployment identity headers; current production contract predates ADR-0036.',
    production: {
      status: productionHealth?.status || 'unknown',
      version: deployment?.version || 'legacy-unavailable',
      commitSha: 'legacy-unavailable',
      branch: deployment?.branch || 'legacy-unavailable',
      repoSlug: deployment?.repoSlug || 'legacy-unavailable',
      provider: deployment?.provider || 'legacy-unavailable',
    },
    main: { sha: mainSha },
    head: { sha: headSha, version: branchVersion },
    drift: {
      productionToMainCommits: 'legacy-unavailable',
      mainToHeadCommits: Number(git(['rev-list', '--count', `${mainSha}..${headSha}`])),
    },
    checks: {
      productionHealthy: true,
      branchContainsCurrentMain: true,
      immutableProductionIdentity: false,
    },
  };

  writeJsonFile(outputPath, legacyBaseline);
  appendGithubOutput({
    production_sha: 'legacy-unavailable',
    production_version: 'legacy-unavailable',
    production_branch: 'legacy-unavailable',
    main_sha: mainSha,
    head_sha: headSha,
    production_to_main_commits: 'legacy-unavailable',
    main_to_head_commits: legacyBaseline.drift.mainToHeadCommits,
    baseline_generated_at: generatedAt,
    baseline_output: outputPath,
    bootstrap: 'true',
  });

  console.warn('[PR-PREFLIGHT] Bootstrap exception used for PR #75 only.');
  process.exit(0);
}

const productionSha = String(deployment.commitSha).toLowerCase();
const productionVersion = String(deployment.version || '').trim();
const productionBranch = String(deployment.branch || '').trim();
const productionRepo = String(deployment.repoSlug || '').trim();

if (!productionVersion) {
  fail('Production /healthz does not expose deployment.version / x-capital-ai-version. PR baselines may not substitute an unavailable production version.');
}
if (!productionBranch) {
  fail('Production /healthz does not expose deployment.branch / x-capital-ai-branch. PR baselines may not infer the production branch.');
}
if (!productionRepo) {
  fail('Production /healthz does not expose deployment.repoSlug / x-capital-ai-repo. PR baselines require repository correlation.');
}
if (repository && productionRepo !== repository) {
  fail(`Production deployment belongs to ${productionRepo}, expected ${repository}.`);
}
if (productionBranch !== 'main') {
  fail(`Production reports branch ${productionBranch}; expected main.`);
}

ensureCommitAvailable(productionSha);

let productionIsAncestorOfMain = true;
try {
  git(['merge-base', '--is-ancestor', productionSha, mainSha]);
} catch {
  productionIsAncestorOfMain = false;
}

if (!productionIsAncestorOfMain) {
  fail(`Production commit ${productionSha} is not an ancestor of current main ${mainSha}. Production/main have diverged or the wrong deployment is live.`);
}

const productionToMainCommits = Number(git(['rev-list', '--count', `${productionSha}..${mainSha}`]));
const mainToHeadCommits = Number(git(['rev-list', '--count', `${mainSha}..${headSha}`]));
const versionOrder = compareSemver(branchVersion, productionVersion);
if (versionOrder === null) {
  fail(`Cannot compare repository version ${branchVersion} with production version ${productionVersion}. Expected semantic x.y.z versions.`);
}
if (versionOrder < 0) {
  fail(`Repository version ${branchVersion} is older than production version ${productionVersion}. Refusing a regression PR.`);
}

const baseline = {
  schemaVersion: PRODUCTION_BASELINE_SCHEMA_VERSION,
  generatedAt,
  productionUrl,
  bootstrap: false,
  production: {
    status: productionHealth.status,
    version: productionVersion,
    commitSha: productionSha,
    branch: productionBranch,
    repoSlug: productionRepo,
    provider: deployment.provider || null,
  },
  main: {
    sha: mainSha,
  },
  head: {
    sha: headSha,
    version: branchVersion,
  },
  drift: {
    productionToMainCommits,
    mainToHeadCommits,
    mainContainsUndeployedCommits: productionToMainCommits > 0,
  },
  checks: {
    productionHealthy: true,
    immutableProductionIdentity: true,
    productionRepoMatches: repository ? productionRepo === repository : true,
    productionBranchIsMain: productionBranch === 'main',
    productionIsAncestorOfMain,
    branchContainsCurrentMain: true,
    versionIsNotOlderThanProduction: true,
  },
};

baseline.baselineId = computeProductionBaselineId(baseline);

writeJsonFile(outputPath, baseline);
appendGithubOutput({
  baseline_id: baseline.baselineId,
  production_sha: productionSha,
  production_version: productionVersion,
  production_branch: productionBranch,
  main_sha: mainSha,
  head_sha: headSha,
  production_to_main_commits: productionToMainCommits,
  main_to_head_commits: mainToHeadCommits,
  baseline_generated_at: generatedAt,
  baseline_output: outputPath,
  bootstrap: 'false',
});

console.log(`[PR-PREFLIGHT] ${baseline.baselineId} | Production ${productionVersion}@${productionSha.slice(0, 12)} -> main ${mainSha.slice(0, 12)} (${productionToMainCommits} commit drift) -> head ${headSha.slice(0, 12)} (${mainToHeadCommits} PR commits).`);
