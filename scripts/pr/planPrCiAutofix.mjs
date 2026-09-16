#!/usr/bin/env node

import fs from 'node:fs';

const MAX_ATTEMPTS = 2;

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
  return parsed.map((entry) => String(entry)).filter(Boolean);
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

export function classifyFailure(failedSteps, failureLog = '') {
  const steps = failedSteps.map((step) => String(step).toLowerCase());
  const log = String(failureLog || '');
  const lowerLog = log.toLowerCase();

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

  const isTypeScript = steps.some((step) => step.includes('typescript prüfen'));
  const isTest = steps.some((step) =>
    step.includes('test-suite')
    || step.includes('vitest')
    || step.includes('validator-tests gezielt')
    || step.includes('validator gezielt'),
  );
  const isBuild = steps.some((step) =>
    step.includes('produktions-build erstellen')
    || step.includes('produktions-csp-auslieferung nach build prüfen'),
  );

  if (isTypeScript || isTest || isBuild) {
    return {
      eligible: true,
      engine: 'copilot',
      failure_class: isTest ? 'test' : isBuild ? 'build' : 'typescript',
      run_lint: true,
      run_tests: isTest,
      run_build: isBuild,
      run_readme_check: false,
      reason: 'bounded-code-failure-requires-agentic-patch',
    };
  }

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

  if (baseRef !== 'main') {
    return { eligible: false, engine: 'none', reason: 'base-is-not-main', failure_class: 'identity', attempt: count + 1 };
  }
  if (!headRef || headRef === 'main') {
    return { eligible: false, engine: 'none', reason: 'invalid-head-branch', failure_class: 'identity', attempt: count + 1 };
  }
  if (!repository || !headRepo || repository !== headRepo) {
    return { eligible: false, engine: 'none', reason: 'fork-or-foreign-head-repository', failure_class: 'identity', attempt: count + 1 };
  }
  if (count >= MAX_ATTEMPTS) {
    return { eligible: false, engine: 'none', reason: 'autofix-attempt-limit-reached', failure_class: 'loop-guard', attempt: count + 1 };
  }

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

  const failure = classifyFailure(failedSteps, failureLog);
  return {
    ...failure,
    attempt: count + 1,
  };
}

export function writeGithubOutput(plan) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(plan).map(([key, value]) => `${key}=${String(value)}`);
  const text = `${lines.join('\n')}\n`;
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
