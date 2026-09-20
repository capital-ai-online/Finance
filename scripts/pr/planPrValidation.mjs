#!/usr/bin/env node

/**
 * Deterministic PR validation plan derived from the changed-file set.
 *
 * This planner is intentionally provider-neutral. It decides the smallest safe
 * repository test scope plus advisory CodeQL / automated-code-review modes.
 * Human/CODEOWNER review and merge authority are never reduced by this file.
 *
 * Repository-wide execution profile contract:
 *   none    — no software-test execution is required for the proven scope.
 *   focused — execute only the deterministically impacted validation groups.
 *   full    — execute the complete fail-closed validation scope.
 * Exact-snapshot reuse is intentionally owned by ci.yml and is not a fourth
 * planner state: REUSE is valid only for an already successful identical
 * (workflow, PR, head SHA, base SHA) snapshot.
 *
 * A PR must execute the planner from its trusted base/main policy revision.
 * Unknown non-documentary paths fail closed to full tests/review and full
 * CodeQL scope. Pushes to main remain force-full.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  findRuntimeConsumedPaths,
  isDocsPath,
  normalizePath,
} from './runtimeConsumedArtifacts.mjs';

export { findRuntimeConsumedPaths, isDocsPath, normalizePath };

export function parseChangedFilesJson(value) {
  const parsed = JSON.parse(String(value ?? ''));
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
    throw new TypeError('CHANGED_FILES_JSON must be a JSON array of strings');
  }
  return parsed.map(normalizePath).filter(Boolean);
}

export function isTestPath(filePath) {
  const p = normalizePath(filePath);
  return p.startsWith('tests/')
    || /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p);
}

export function isVitestTestPath(filePath) {
  const p = normalizePath(filePath);
  return p.startsWith('tests/') && /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p);
}

export function isJavaScriptTypeScriptPath(filePath) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(normalizePath(filePath));
}

export function isPythonPath(filePath) {
  return /\.py$/.test(normalizePath(filePath));
}

export function isWorkflowPath(filePath) {
  return normalizePath(filePath).startsWith('.github/workflows/');
}

export function isDependencyPath(filePath) {
  const p = normalizePath(filePath);
  return p === 'package.json' || p === 'package-lock.json';
}

export function isFocusedNodeValidationPath(filePath) {
  const p = normalizePath(filePath);
  return p.startsWith('scripts/pr/')
    || p.startsWith('scripts/systemadmin/')
    || p === 'scripts/security/validateSecurityAssessment.mjs'
    || p === 'scripts/security/validateSecurityAssessment.test.mjs';
}

export function isHighRiskPath(filePath) {
  const p = normalizePath(filePath);
  return p === 'server.ts'
    || p.startsWith('server/')
    || p === 'Dockerfile'
    || p === '.dockerignore'
    || p === 'render.yaml'
    || p === 'render.yml'
    || p.startsWith('src/platform/Security/')
    || p.startsWith('src/platform/Auth')
    || p.startsWith('src/platform/Billing/')
    || p.startsWith('src/platform/Entitlement')
    || p.startsWith('scripts/security/')
    || /(^|\/)(auth|security|entitlement|billing)(\/|\.|-)/i.test(p);
}

export function isGlobalTestTrigger(filePath) {
  const p = normalizePath(filePath);
  return isDependencyPath(p)
    || p === 'vite.config.ts'
    || p === 'tsconfig.json'
    || p.startsWith('tsconfig.')
    || p === 'scripts/automation/runQualityExecution.ts'
    || p === 'scripts/pr/classifyPrScope.mjs'
    || p === 'scripts/pr/planPrValidation.mjs'
    || p === '.github/workflows/ci.yml'
    || p === '.github/workflows/selective-codeql.yml'
    || p === '.github/workflows/selective-copilot-code-review.yml'
    || p === '.github/workflows/oss-code-review.yml';
}

/**
 * Keep the validation planner aligned with classifyPrScope.mjs: documentary
 * artifacts are only safe for the no-test fast path when no executable/test/
 * workflow surface consumes the exact repository path.
 */


function inferCodeqlLanguages(files) {
  const languages = new Set();
  for (const file of files) {
    if (isWorkflowPath(file)) languages.add('actions');
    if (isJavaScriptTypeScriptPath(file) && !isTestPath(file)) languages.add('javascript-typescript');
    if (isPythonPath(file)) languages.add('python');
  }
  return [...languages].sort();
}

function allCurrentRepositoryCodeqlLanguages() {
  return ['actions', 'javascript-typescript', 'python'];
}

function explain(primary, files) {
  return `${primary}; changed_files=${files.length}`;
}

/**
 * @param {string[]} files
 * @param {{ forceFull?: boolean, runtimeConsumedPaths?: string[] }} [options]
 */
export function planChangedFiles(files, options = {}) {
  const normalized = (files || []).map(normalizePath).filter(Boolean);

  if (options.forceFull) {
    return {
      validation_profile: 'full',
      vitest_mode: 'full',
      node_pr_tests: true,
      node_systemadmin_tests: true,
      node_security_assessment_tests: true,
      codeql_mode: 'full',
      codeql_languages: allCurrentRepositoryCodeqlLanguages().join(','),
      automated_code_review_mode: 'full',
      reason: 'main-push-or-explicit-force-full',
    };
  }

  const runtimeConsumed = new Set((options.runtimeConsumedPaths || []).map(normalizePath));
  const consumerEscalation = normalized.some((file) => runtimeConsumed.has(file));

  if ((normalized.length === 0 || normalized.every(isDocsPath)) && !consumerEscalation) {
    return {
      validation_profile: 'none',
      vitest_mode: 'none',
      node_pr_tests: false,
      node_systemadmin_tests: false,
      node_security_assessment_tests: false,
      codeql_mode: 'none',
      codeql_languages: '',
      automated_code_review_mode: 'none',
      reason: explain('documentation-only', normalized),
    };
  }

  // The scope classifier already escalates runtime-consumed documentary artifacts
  // to class C. Without the same signal here, CI could build/predeploy that class C
  // change while selecting zero unit tests. Until a narrower dependency mapping is
  // proven, fail closed to full validation for this uncommon boundary case.
  if (consumerEscalation) {
    return {
      validation_profile: 'full',
      vitest_mode: 'full',
      node_pr_tests: true,
      node_systemadmin_tests: true,
      node_security_assessment_tests: true,
      codeql_mode: 'full',
      codeql_languages: allCurrentRepositoryCodeqlLanguages().join(','),
      automated_code_review_mode: 'full',
      reason: explain('runtime-consumed-documentary-artifact', normalized),
    };
  }

  const nonDocs = normalized.filter((file) => !isDocsPath(file));
  const onlyTests = nonDocs.every(isTestPath);
  const onlyVitestTests = nonDocs.every(isVitestTestPath);
  const onlyFocusedNodeValidation = nonDocs.every(isFocusedNodeValidationPath);
  const onlyNonDeployWorkflow = nonDocs.every((file) => isWorkflowPath(file) && file !== '.github/workflows/ci.yml');
  const dependencyOnly = nonDocs.every(isDependencyPath);
  const hasHighRisk = nonDocs.some(isHighRiskPath);
  const hasGlobalTestTrigger = nonDocs.some(isGlobalTestTrigger);
  const hasWorkflow = nonDocs.some(isWorkflowPath);
  const hasAppSource = nonDocs.some((file) => file.startsWith('src/'));
  const hasVitestTests = nonDocs.some(isVitestTestPath);

  const knownSelective = nonDocs.every((file) =>
    isTestPath(file)
    || isFocusedNodeValidationPath(file)
    || isWorkflowPath(file)
    || file.startsWith('src/')
    || isDependencyPath(file)
    || isJavaScriptTypeScriptPath(file)
    || isPythonPath(file),
  );
  const hasUnknown = !knownSelective;

  const validationProfile = hasGlobalTestTrigger || hasHighRisk || hasUnknown
    ? 'full'
    : 'focused';

  let vitestMode = 'none';
  if (hasGlobalTestTrigger || hasHighRisk || hasUnknown) {
    vitestMode = 'full';
  } else if (onlyVitestTests || hasAppSource || hasVitestTests) {
    vitestMode = 'changed';
  } else if (!onlyFocusedNodeValidation && !onlyNonDeployWorkflow && !dependencyOnly) {
    // A known source/script path outside the narrow focused validators keeps a
    // conservative full-suite fallback until an explicit selector is defined.
    vitestMode = 'full';
  }

  const nodePrTests = nonDocs.some((file) => file.startsWith('scripts/pr/'));
  const nodeSystemadminTests = nonDocs.some((file) => file.startsWith('scripts/systemadmin/'));
  const nodeSecurityAssessmentTests = nonDocs.some((file) =>
    file === 'scripts/security/validateSecurityAssessment.mjs'
    || file === 'scripts/security/validateSecurityAssessment.test.mjs',
  );

  let codeqlMode = 'none';
  let codeqlLanguages = inferCodeqlLanguages(nonDocs);
  const sourceChangedForCodeql = nonDocs.some((file) =>
    !isTestPath(file)
    && !isDependencyPath(file)
    && (isJavaScriptTypeScriptPath(file) || isPythonPath(file) || isWorkflowPath(file)),
  );

  if (!dependencyOnly && !onlyTests && sourceChangedForCodeql) {
    codeqlMode = hasHighRisk || hasGlobalTestTrigger || hasUnknown ? 'full' : 'targeted';
  } else if (hasUnknown) {
    codeqlMode = 'full';
    codeqlLanguages = allCurrentRepositoryCodeqlLanguages();
  }

  if (codeqlMode === 'full' && codeqlLanguages.length === 0) {
    codeqlLanguages = allCurrentRepositoryCodeqlLanguages();
  }

  let automatedReviewMode = onlyTests ? 'none' : 'targeted';
  if (hasHighRisk || hasGlobalTestTrigger || hasWorkflow || hasUnknown) {
    automatedReviewMode = 'full';
  } else if (dependencyOnly) {
    automatedReviewMode = 'targeted';
  }

  return {
    validation_profile: validationProfile,
    vitest_mode: vitestMode,
    node_pr_tests: nodePrTests,
    node_systemadmin_tests: nodeSystemadminTests,
    node_security_assessment_tests: nodeSecurityAssessmentTests,
    codeql_mode: codeqlMode,
    codeql_languages: codeqlLanguages.join(','),
    automated_code_review_mode: automatedReviewMode,
    reason: explain(
      hasUnknown ? 'unknown-non-doc-fail-closed'
        : hasHighRisk ? 'high-risk-change'
          : hasGlobalTestTrigger ? 'global-test-trigger'
            : onlyTests ? 'test-only'
              : onlyFocusedNodeValidation ? 'focused-node-validation'
                : onlyNonDeployWorkflow ? 'workflow-only'
                  : dependencyOnly ? 'dependency-only'
                    : 'selective-source-change',
      normalized,
    ),
  };
}

export function listChangedFiles(baseRef, headRef) {
  const out = execFileSync('git', ['diff', '--name-only', `${baseRef}...${headRef}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (!out) return [];
  return out.split(/\r?\n/).map(normalizePath).filter(Boolean);
}

export function writeGithubOutput(plan) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(plan).map(([key, value]) => `${key}=${String(value)}`);
  const text = `${lines.join('\n')}\n`;
  if (outputPath) fs.appendFileSync(outputPath, text, 'utf8');
  return text;
}

function main() {
  const forceFull = process.env.EVENT_NAME === 'push'
    || process.env.CI_FORCE_FULL === 'true'
    || process.argv.includes('--force-full');

  let files = [];
  let runtimeConsumedPaths = [];
  if (!forceFull) {
    const base = process.env.PR_BASE_SHA || process.env.BASE_SHA || '';
    const head = process.env.PR_HEAD_SHA || process.env.HEAD_SHA || 'HEAD';
    if (base) {
      files = listChangedFiles(base, head);
    } else if (process.env.CHANGED_FILES_JSON) {
      files = parseChangedFilesJson(process.env.CHANGED_FILES_JSON);
    } else if (process.env.CHANGED_FILES) {
      // Backwards-compatible fallback for current callers that still provide
      // newline-delimited paths. Security-sensitive provider workflows use JSON.
      files = process.env.CHANGED_FILES.split(/\r?\n/).map(normalizePath).filter(Boolean);
    }
    runtimeConsumedPaths = findRuntimeConsumedPaths(files, head);
  }

  const plan = planChangedFiles(files, { forceFull, runtimeConsumedPaths });
  console.log(`[planPrValidation] profile=${plan.validation_profile} vitest=${plan.vitest_mode} codeql=${plan.codeql_mode} review=${plan.automated_code_review_mode} consumer_escalation=${runtimeConsumedPaths.length > 0} files=${forceFull ? '(force-full)' : files.length}`);
  if (runtimeConsumedPaths.length > 0) console.log(`[planPrValidation] runtime-consumed changed artifacts: ${runtimeConsumedPaths.join(', ')}`);
  console.log(JSON.stringify(plan, null, 2));
  writeGithubOutput(plan);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('planPrValidation.mjs')) {
  main();
}
