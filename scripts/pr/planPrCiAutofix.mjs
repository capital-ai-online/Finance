#!/usr/bin/env node

import fs from 'node:fs';

const MAX_ATTEMPTS = 2;
const AGENT_BRANCH_PREFIXES = ['agent/', 'claude/', 'gemini/', 'copilot/', 'ai/'];

export function normalizePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

export function parseStringArray(value, label) {
  const parsed = JSON.parse(String(value ?? ''));
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
    throw new TypeError(`${label} must be a JSON array of strings`);
  }
  return parsed.map(String).filter(Boolean);
}

export function isProtectedAutofixPath(filePath) {
  const p = normalizePath(filePath);
  if (!p) return true;

  return p === 'AGENTS.md'
    || p === 'package.json'
    || p === 'package-lock.json'
    || p === '.nvmrc'
    || p === 'Dockerfile'
    || p === '.dockerignore'
    || p === 'render.yaml'
    || p === 'render.yml'
    || p.startsWith('.github/')
    || p.startsWith('.ai/')
    || p.startsWith('docs/governance/')
    || p.startsWith('docs/adr/')
    || p.startsWith('docs/projects/')
    || p.startsWith('scripts/security/')
    || p.startsWith('scripts/governance/')
    || p.startsWith('scripts/pr/')
    || p.startsWith('server/')
    || p === 'server.ts'
    || p.startsWith('supabase/')
    || /(^|\/)(migrations?|secrets?|credentials?|iam|auth|security|billing|entitlements?)(\/|\.|-)/i.test(p)
    || p.startsWith('src/platform/Security/')
    || p.startsWith('src/platform/Auth')
    || p.startsWith('src/platform/Billing/')
    || p.startsWith('src/platform/Entitlement');
}

function heldFailure(failureClass) {
  return {
    eligible: false,
    engine: 'none',
    failure_class: failureClass,
    run_lint: false,
    run_tests: false,
    run_build: false,
    run_readme_check: false,
    reason: 'agentic-engine-not-materialized-for-this-failure-class',
  };
}

function codexCloudFailure(failureClass) {
  return {
    eligible: true,
    engine: 'codex-cloud',
    failure_class: failureClass,
    run_lint: true,
    run_tests: true,
    run_build: false,
    run_readme_check: false,
    reason: 'existing-codex-github-pr-task-eligible',
  };
}

export function classifyFailure(failedSteps, failureLog = '') {
  const steps = failedSteps.map((step) => String(step).toLowerCase());
  const lowerLog = String(failureLog || '').toLowerCase();

  if (lowerLog.includes('[readme-sync] readme projection drift detected. run: npm run readme:sync')) {
    return {
      eligible: true,
      engine: 'deterministic-readme',
      failure_class: 'generated-readme-drift',
      run_lint: false,
      run_tests: false,
      run_build: false,
      run_readme_check: true,
      reason: 'deterministic-readme-projection-drift',
    };
  }

  const blocked = [
    'produktionsabhängigkeiten prüfen',
    'docker-hardening prüfen',
    'produktions-docker-image bauen und prüfen',
    'provenance',
    'supply-chain',
    'deployment',
    'render-produktion',
    'repository-integrität prüfen',
  ];
  if (steps.some((step) => blocked.some((needle) => step.includes(needle)))) {
    return {
      eligible: false,
      engine: 'none',
      failure_class: 'protected-or-infrastructure',
      run_lint: false,
      run_tests: false,
      run_build: false,
      run_readme_check: false,
      reason: 'failed-step-is-protected-or-infrastructure-sensitive',
    };
  }

  if (steps.some((step) => step.includes('typescript prüfen'))) return codexCloudFailure('typescript');
  if (steps.some((step) => step.includes('test-suite') || step.includes('vitest') || step.includes('validator-tests gezielt') || step.includes('validator gezielt'))) return heldFailure('test');
  if (steps.some((step) => step.includes('produktions-build erstellen') || step.includes('produktions-csp-auslieferung nach build prüfen'))) return heldFailure('build');

  return {
    eligible: false,
    engine: 'none',
    failure_class: 'unknown',
    run_lint: false,
    run_tests: false,
    run_build: false,
    run_readme_check: false,
    reason: 'unrecognized-failure-class-fails-closed',
  };
}

export function planAutofix({
  changedFiles,
  failedSteps,
  failureLog = '',
  attempts = 0,
  baseRef = 'main',
  headRef = '',
  headRepo = '',
  repository = '',
}) {
  const normalized = changedFiles.map(normalizePath).filter(Boolean);
  const count = Number(attempts || 0);

  if (baseRef !== 'main') return { eligible: false, engine: 'none', reason: 'base-is-not-main', failure_class: 'identity', attempt: count + 1 };
  if (!headRef || headRef === 'main') return { eligible: false, engine: 'none', reason: 'invalid-head-branch', failure_class: 'identity', attempt: count + 1 };
  if (!AGENT_BRANCH_PREFIXES.some((prefix) => headRef.startsWith(prefix))) return { eligible: false, engine: 'none', reason: 'head-branch-is-not-agent-managed', failure_class: 'identity', attempt: count + 1 };
  if (!repository || !headRepo || repository !== headRepo) return { eligible: false, engine: 'none', reason: 'fork-or-foreign-head-repository', failure_class: 'identity', attempt: count + 1 };
  if (count >= MAX_ATTEMPTS) return { eligible: false, engine: 'none', reason: 'autofix-attempt-limit-reached', failure_class: 'loop-guard', attempt: count + 1 };

  const protectedFiles = normalized.filter(isProtectedAutofixPath);
  if (protectedFiles.length > 0) {
    return {
      eligible: false,
      engine: 'none',
      reason: `protected-pr-scope:${protectedFiles.join(',')}`,
      failure_class: 'protected-scope',
      attempt: count + 1,
    };
  }

  return {
    ...classifyFailure(failedSteps, failureLog),
    attempt: count + 1,
  };
}

export function writeGithubOutput(plan) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const text = `${Object.entries(plan).map(([key, value]) => `${key}=${String(value)}`).join('\n')}\n`;
  if (outputPath) fs.appendFileSync(outputPath, text, 'utf8');
  return text;
}

function main() {
  const changedFiles = parseStringArray(process.env.CHANGED_FILES_JSON || '[]', 'CHANGED_FILES_JSON');
  const failedSteps = parseStringArray(process.env.FAILED_STEPS_JSON || '[]', 'FAILED_STEPS_JSON');
  const failureLogPath = process.env.FAILURE_LOG_PATH || '';
  const failureLog = failureLogPath && fs.existsSync(failureLogPath)
    ? fs.readFileSync(failureLogPath, 'utf8')
    : '';

  const plan = planAutofix({
    changedFiles,
    failedSteps,
    failureLog,
    attempts: Number(process.env.AUTOFIX_ATTEMPTS || 0),
    baseRef: process.env.PR_BASE_REF || 'main',
    headRef: process.env.PR_HEAD_REF || '',
    headRepo: process.env.PR_HEAD_REPO || '',
    repository: process.env.REPOSITORY || '',
  });

  console.log(`[planPrCiAutofix] eligible=${plan.eligible} engine=${plan.engine} class=${plan.failure_class} attempt=${plan.attempt} reason=${plan.reason}`);
  writeGithubOutput(plan);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('planPrCiAutofix.mjs')) {
  main();
}
