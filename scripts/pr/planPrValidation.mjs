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
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  classifyChangedFiles,
  isOperationsReleaseControlPath,
  isOrdinaryOperationsToolingPath,
} from './classifyPrScope.mjs';
import {
  findRuntimeConsumedPaths,
  findRuntimeConsumerFiles,
  isDocsPath,
  normalizePath,
} from './runtimeConsumedArtifacts.mjs';

export { findRuntimeConsumedPaths, findRuntimeConsumerFiles, isDocsPath, normalizePath };

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

export function isOssQualityPrFastPath(filePath) {
  const p = normalizePath(filePath);
  return p.startsWith('src/')
    || p.startsWith('server/')
    || p === 'server.ts'
    || p.startsWith('scripts/')
    || p.startsWith('tests/')
    || p === 'package.json'
    || p === 'package-lock.json'
    || p === 'knip.json'
    || p === '.jscpd.json'
    || p === '.github/workflows/oss-quality-assurance.yml'
    || p === '.github/workflows/oss-quality-deep-assurance.yml';
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
    || isOperationsReleaseControlPath(p)
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
 * @param {{
 *   forceFull?: boolean,
 *   runtimeConsumedPaths?: string[],
 *   runtimeConsumerFiles?: Record<string, string[]>,
 * }} [options]
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
      direct_vitest_tests_json: '[]',
      reason: 'main-push-or-explicit-force-full',
    };
  }

  const runtimeConsumed = new Set((options.runtimeConsumedPaths || []).map(normalizePath));
  const consumerEscalation = normalized.some((file) => runtimeConsumed.has(file));
  const runtimeConsumerFiles = Object.values(options.runtimeConsumerFiles || {})
    .flat()
    .map(normalizePath)
    .filter(Boolean);
  const directVitestTests = Array.from(new Set(runtimeConsumerFiles.filter(isVitestTestPath))).sort();
  const consumerNodePrTests = runtimeConsumerFiles.some((file) => file.startsWith('scripts/pr/') && isTestPath(file));
  const consumerNodeSystemadminTests = runtimeConsumerFiles.some((file) => file.startsWith('scripts/systemadmin/') && isTestPath(file));
  const consumerSecurityAssessmentTests = runtimeConsumerFiles.some((file) =>
    file === 'scripts/security/validateSecurityAssessment.test.mjs',
  );
  const coveredConsumerTests = runtimeConsumerFiles.every((file) =>
    isVitestTestPath(file)
    || (file.startsWith('scripts/pr/') && isTestPath(file))
    || (file.startsWith('scripts/systemadmin/') && isTestPath(file))
    || file === 'scripts/security/validateSecurityAssessment.test.mjs',
  );
  const consumerTestOnly = consumerEscalation
    && runtimeConsumerFiles.length > 0
    && runtimeConsumerFiles.every(isTestPath)
    && coveredConsumerTests;

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
      direct_vitest_tests_json: '[]',
      reason: explain('documentation-only', normalized),
    };
  }

  // Documentary artifacts that are consumed only by known test files are
  // validation inputs, not production runtime inputs. Run exactly those direct
  // consumers plus Vitest's changed graph instead of escalating the whole suite.
  if (consumerEscalation && consumerTestOnly) {
    return {
      validation_profile: 'focused',
      vitest_mode: directVitestTests.length > 0 ? 'changed' : 'none',
      node_pr_tests: consumerNodePrTests,
      node_systemadmin_tests: consumerNodeSystemadminTests,
      node_security_assessment_tests: consumerSecurityAssessmentTests,
      codeql_mode: 'none',
      codeql_languages: '',
      automated_code_review_mode: 'none',
      direct_vitest_tests_json: JSON.stringify(directVitestTests),
      reason: explain('test-consumed-documentary-artifact', normalized),
    };
  }

  // Any documentary artifact consumed by runtime, workflow or an unhandled test
  // surface remains fail-closed FULL.
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
      direct_vitest_tests_json: '[]',
      reason: explain('runtime-consumed-documentary-artifact', normalized),
    };
  }

  const nonDocs = normalized.filter((file) => !isDocsPath(file));
  const onlyTests = nonDocs.every(isTestPath);
  const onlyVitestTests = nonDocs.every(isVitestTestPath);
  const onlyFocusedNodeValidation = nonDocs.every(isFocusedNodeValidationPath);
  const onlyNonDeployWorkflow = nonDocs.every((file) => isWorkflowPath(file) && file !== '.github/workflows/ci.yml');
  const onlyOrdinaryOperationsTooling = nonDocs.length > 0
    && nonDocs.every((file) => isOrdinaryOperationsToolingPath(file) || isTestPath(file));
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
  } else if (onlyVitestTests || hasAppSource || hasVitestTests || onlyOrdinaryOperationsTooling) {
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
    direct_vitest_tests_json: '[]',
    reason: explain(
      hasUnknown ? 'unknown-non-doc-fail-closed'
        : hasHighRisk ? 'high-risk-change'
          : hasGlobalTestTrigger ? 'global-test-trigger'
            : onlyTests ? 'test-only'
              : onlyFocusedNodeValidation ? 'focused-node-validation'
                : onlyNonDeployWorkflow ? 'workflow-only'
                  : dependencyOnly ? 'dependency-only'
                    : onlyOrdinaryOperationsTooling ? 'ordinary-operations-tooling'
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


export const REQUIRED_EXACT_HEAD_CONTEXTS = Object.freeze([
  'GitGuardian Security Checks',
  'Hardened image / HIGH+CRITICAL CVE gate',
  'PR Governance (Kosten / Workflow / Vorlage)',
  'build-and-test',
]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertSha(name, value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(normalized)) {
    throw new TypeError(`${name} must be a full 40-character git SHA`);
  }
  return normalized;
}

function normalizePreflightResults(results = {}) {
  const allowed = new Set(['PASS', 'FAIL', 'NOT_RUN']);
  const normalized = {};
  for (const [key, value] of Object.entries(results || {})) {
    const status = String(value || '').trim().toUpperCase();
    if (!allowed.has(status)) throw new TypeError(`Invalid preflight result for ${key}: ${value}`);
    normalized[key] = status;
  }
  return normalized;
}

function selectedTests(plan, baseSha) {
  const selected = [];
  if (plan.vitest_mode === 'full') selected.push('npm test');
  if (plan.vitest_mode === 'changed') selected.push(`npx vitest run --changed ${baseSha} --passWithNoTests`);
  const directVitestTests = JSON.parse(String(plan.direct_vitest_tests_json || '[]'));
  if (directVitestTests.length > 0) {
    selected.push(`npx vitest run ${directVitestTests.join(' ')} --passWithNoTests`);
  }
  if (plan.node_pr_tests && plan.vitest_mode !== 'full') selected.push('node --test scripts/pr/*.test.mjs');
  if (plan.node_systemadmin_tests && plan.vitest_mode !== 'full') selected.push('node --test scripts/systemadmin/*.test.mjs');
  if (plan.node_security_assessment_tests && plan.vitest_mode !== 'full') {
    selected.push('node --test scripts/security/validateSecurityAssessment.test.mjs');
  }
  return selected;
}

/**
 * Build machine-readable ChatGPT preflight evidence without inventing PASS.
 * Results default to NOT_RUN and must be supplied only after the command/tool
 * actually executed in the pre-PR environment.
 */
export function buildPreflightEvidence({
  baseSha,
  headSha,
  treeSha,
  files = [],
  runtimeConsumedPaths = [],
  runtimeConsumerFiles = {},
  forceFull = false,
  toolVersions = {},
  results = {},
  branchContainsCurrentMain = null,
} = {}) {
  const normalizedBase = assertSha('baseSha', baseSha);
  const normalizedHead = assertSha('headSha', headSha);
  const normalizedTree = assertSha('treeSha', treeSha);
  const normalizedFiles = (files || []).map(normalizePath).filter(Boolean);
  const normalizedResults = normalizePreflightResults(results);
  const scope = classifyChangedFiles(normalizedFiles, { forceFull, runtimeConsumedPaths, runtimeConsumerFiles });
  const plan = planChangedFiles(normalizedFiles, { forceFull, runtimeConsumedPaths, runtimeConsumerFiles });

  const prFastRelevant = normalizedFiles.some(isOssQualityPrFastPath);
  const qualitySelection = {
    gitleaks: prFastRelevant,
    osv: prFastRelevant,
    knip: false,
    jscpd: false,
    zizmor: scope.workflow_security === true,
  };

  const plannedChecks = {
    lint: scope.lint === true,
    vitest: scope.unit === true && plan.vitest_mode !== 'none',
    node_pr_tests: plan.node_pr_tests === true && plan.vitest_mode !== 'full',
    node_systemadmin_tests: plan.node_systemadmin_tests === true && plan.vitest_mode !== 'full',
    node_security_assessment_tests: plan.node_security_assessment_tests === true && plan.vitest_mode !== 'full',
    build: scope.build === true,
    dependency_audit: scope.audit === true,
    workflow_security: scope.workflow_security === true,
    ...qualitySelection,
  };

  const checks = Object.fromEntries(
    Object.entries(plannedChecks).map(([name, planned]) => [
      name,
      {
        planned,
        applicability: planned ? 'PLANNED' : 'NOT_APPLICABLE',
        result: normalizedResults[name] || 'NOT_RUN',
      },
    ]),
  );

  const plannedResults = Object.values(checks)
    .filter((check) => check.planned)
    .map((check) => check.result);
  const anyPlannedFailure = plannedResults.includes('FAIL');
  const allPlannedPass = plannedResults.every((result) => result === 'PASS');
  const prePrState = branchContainsCurrentMain === false || anyPlannedFailure
    ? 'BLOCKED'
    : branchContainsCurrentMain === true && allPlannedPass
      ? 'READY_FOR_GITHUB_VALIDATION'
      : 'EVIDENCE_PENDING';

  const evidence = {
    schema_version: '1.0.0',
    evidence_type: 'CHATGPT_PREFLIGHT',
    base_sha: normalizedBase,
    head_sha: normalizedHead,
    tree_sha: normalizedTree,
    pr_class: scope.class,
    production_impact: scope.production_impact === true,
    changed_paths: normalizedFiles,
    runtime_consumer_files: runtimeConsumerFiles,
    validation_profile: String(plan.validation_profile || '').toUpperCase(),
    selected_tests: selectedTests(plan, normalizedBase),
    required_exact_head_contexts: REQUIRED_EXACT_HEAD_CONTEXTS,
    required_context_note: 'Required-context names are merge-safety expectations; live ruleset readback remains authoritative.',
    pre_pr_mergeability: {
      state: prePrState,
      branch_contains_current_main: branchContainsCurrentMain,
      note: 'Advisory ChatGPT preflight only. GitHub mergeability and exact-head Required Checks remain authoritative after PR creation.',
    },
    quality_profiles: {
      pr_fast: prFastRelevant ? 'PLANNED' : 'NOT_APPLICABLE',
      deep_baseline: 'SCHEDULED_NOT_PR',
    },
    tool_versions: Object.fromEntries(
      Object.entries(toolVersions || {}).map(([key, value]) => [key, String(value)]),
    ),
    checks,
    planner: {
      vitest_mode: plan.vitest_mode,
      codeql_mode: plan.codeql_mode,
      codeql_languages: plan.codeql_languages,
      automated_code_review_mode: plan.automated_code_review_mode,
      reason: plan.reason,
    },
  };

  const fingerprint = createHash('sha256').update(canonicalJson(evidence)).digest('hex');
  return { ...evidence, evidence_fingerprint: `sha256:${fingerprint}` };
}

function main() {
  const forceFull = process.env.EVENT_NAME === 'push'
    || process.env.CI_FORCE_FULL === 'true'
    || process.argv.includes('--force-full');

  let files = [];
  let runtimeConsumedPaths = [];
  let runtimeConsumerFiles = {};
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
    runtimeConsumerFiles = findRuntimeConsumerFiles(files, head);
    runtimeConsumedPaths = Object.keys(runtimeConsumerFiles).sort();
  }

  const plan = planChangedFiles(files, { forceFull, runtimeConsumedPaths, runtimeConsumerFiles });
  console.log(`[planPrValidation] profile=${plan.validation_profile} vitest=${plan.vitest_mode} codeql=${plan.codeql_mode} review=${plan.automated_code_review_mode} consumer_escalation=${runtimeConsumedPaths.length > 0} files=${forceFull ? '(force-full)' : files.length}`);
  if (runtimeConsumedPaths.length > 0) console.log(`[planPrValidation] runtime-consumed changed artifacts: ${runtimeConsumedPaths.join(', ')}`);
  console.log(JSON.stringify(plan, null, 2));
  writeGithubOutput(plan);

  if (process.argv.includes('--preflight-evidence')) {
    const baseSha = process.env.PR_BASE_SHA || process.env.BASE_SHA || '';
    const headSha = process.env.PR_HEAD_SHA || process.env.HEAD_SHA || 'HEAD';
    const resolvedHead = execFileSync('git', ['rev-parse', headSha], { encoding: 'utf8' }).trim();
    const treeSha = execFileSync('git', ['rev-parse', `${resolvedHead}^{tree}`], { encoding: 'utf8' }).trim();
    const results = process.env.PREFLIGHT_RESULTS_JSON ? JSON.parse(process.env.PREFLIGHT_RESULTS_JSON) : {};
    let branchContainsCurrentMain = false;
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', baseSha, resolvedHead], { stdio: 'ignore' });
      branchContainsCurrentMain = true;
    } catch {
      branchContainsCurrentMain = false;
    }
    const evidence = buildPreflightEvidence({
      baseSha,
      headSha: resolvedHead,
      treeSha,
      files,
      runtimeConsumedPaths,
      runtimeConsumerFiles,
      forceFull,
      toolVersions: { node: process.version },
      results,
      branchContainsCurrentMain,
    });
    const rendered = `${JSON.stringify(evidence, null, 2)}\\n`;
    if (process.env.PREFLIGHT_OUTPUT) fs.writeFileSync(process.env.PREFLIGHT_OUTPUT, rendered, 'utf8');
    console.log('PREFLIGHT_EVIDENCE_START');
    console.log(rendered.trimEnd());
    console.log('PREFLIGHT_EVIDENCE_END');
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('planPrValidation.mjs')) {
  main();
}
