#!/usr/bin/env node

/**
 * Machine classification of PR / push scope from changed file paths.
 * Source of truth for which expensive CI steps must run (fail-closed).
 *
 * Classes (aligned with .github/pull_request_template.md):
 *   D — documentation / .ai / markdown only
 *   C — application, tests, scripts, non-deploy config
 *   R — runtime / dependency / docker / deployment surface
 *
 * Production-scope invariant:
 *   Pull Requests never perform production mutation. Class R therefore keeps
 *   scoped integrity, dependency, lint, unit and static runtime/Docker checks,
 *   but does not build production artifacts, run predeploy preparation or build
 *   the production Docker image. The Human-merged push to main remains force-full
 *   and is the only path that performs the complete production build/attestation
 *   validation before the separately gated deployment job.
 *   Known non-production validation/tooling surfaces receive only their scoped
 *   validators. Unknown non-doc paths remain fail-closed as production-impacting.
 *
 * Highest class among changed paths wins. Unknown non-doc paths escalate to C.
 */

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export function normalizePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

export function isDocsPath(filePath) {
  const p = normalizePath(filePath);
  if (!p) return true;
  if (p.startsWith('docs/')) return true;
  if (p.startsWith('.ai/')) return true;
  if (p.endsWith('.md')) return true;
  return false;
}

export function isWorkflowPath(filePath) {
  const p = normalizePath(filePath);
  return p.startsWith('.github/workflows/');
}

/** Runtime / deploy / dependency surface → class R */
export function isRuntimeDeployPath(filePath) {
  const p = normalizePath(filePath);
  if (
    p === 'Dockerfile' ||
    p === '.dockerignore' ||
    p === 'package.json' ||
    p === 'package-lock.json' ||
    p === 'server.ts' ||
    p === 'render.yaml' ||
    p === 'render.yml'
  ) {
    return true;
  }
  if (p.startsWith('server/')) return true;
  if (p.startsWith('scripts/security/') && /docker|runtime/i.test(p)) return true;
  if (p === '.github/workflows/ci.yml') return true;
  if (p.startsWith('.github/workflows/') && /render|deploy/i.test(p)) return true;
  return false;
}

/** Dependency lock / package manifest → audit + build */
export function isDependencyManifest(filePath) {
  const p = normalizePath(filePath);
  return p === 'package.json' || p === 'package-lock.json';
}

/**
 * Paths that are deterministically validation/tooling-only and therefore do not
 * require a production artifact build by themselves. Runtime/deploy workflow
 * paths are intentionally excluded and continue to fail closed as class R.
 */
export function isKnownNonProductionValidationPath(filePath) {
  const p = normalizePath(filePath);
  if (isDocsPath(p)) return true;
  if (p.startsWith('tests/')) return true;
  if (p.startsWith('scripts/pr/')) return true;
  if (p.startsWith('scripts/governance/')) return true;
  if (p.startsWith('.github/') && !isRuntimeDeployPath(p)) return true;
  return false;
}

/**
 * @param {string[]} files
 * @param {{ forceFull?: boolean }} [options]
 */
export function classifyChangedFiles(files, options = {}) {
  const integrity = true;

  if (options.forceFull) {
    return {
      class: 'R',
      production_impact: true,
      node: true,
      lint: true,
      unit: true,
      build: true,
      audit: true,
      predeploy: true,
      docker: true,
      docker_image: true,
      workflow_security: true,
      integrity,
      npm_advisory: true,
    };
  }

  const normalized = (files || []).map(normalizePath).filter(Boolean);

  if (normalized.length === 0) {
    return {
      class: 'D',
      production_impact: false,
      node: false,
      lint: false,
      unit: false,
      build: false,
      audit: false,
      predeploy: false,
      docker: false,
      docker_image: false,
      workflow_security: false,
      integrity,
      npm_advisory: false,
    };
  }

  let hasNonDocs = false;
  let hasRuntime = false;
  let hasWorkflow = false;
  let hasDependency = false;
  let hasAppOrTest = false;
  let hasScriptOnly = true;

  for (const file of normalized) {
    if (!isDocsPath(file)) hasNonDocs = true;
    if (isRuntimeDeployPath(file)) hasRuntime = true;
    if (isWorkflowPath(file)) hasWorkflow = true;
    if (isDependencyManifest(file)) hasDependency = true;

    const isScript =
      file.startsWith('scripts/') ||
      file.startsWith('.github/') ||
      isDocsPath(file);
    if (!isScript && !isDocsPath(file)) hasScriptOnly = false;

    if (
      file.startsWith('src/') ||
      file.startsWith('tests/') ||
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.js') ||
      file.endsWith('.mjs') ||
      file.endsWith('.cjs')
    ) {
      hasAppOrTest = true;
    }
  }

  if (!hasNonDocs) {
    return {
      class: 'D',
      production_impact: false,
      node: false,
      lint: false,
      unit: false,
      build: false,
      audit: false,
      predeploy: false,
      docker: false,
      docker_image: false,
      workflow_security: false,
      integrity,
      npm_advisory: false,
    };
  }

  const klass = hasRuntime ? 'R' : 'C';

  // Class C defaults fail closed: unknown non-doc changes may affect the production artifact.
  let productionImpact = true;
  let node = true;
  let lint = true;
  let unit = true;
  let build = true;
  let audit = hasDependency;
  let predeploy = true;
  let docker = hasRuntime;
  let docker_image = hasRuntime;
  const workflow_security = hasWorkflow;
  const npm_advisory = true;

  // Narrow C: only tests → test the scope, but do not rebuild production artifacts.
  const onlyTests = normalized.every(
    (f) => isDocsPath(f) || f.startsWith('tests/') || f.startsWith('.ai/'),
  );
  if (klass === 'C' && onlyTests) {
    productionImpact = false;
    build = false;
    predeploy = false;
    audit = false;
  }

  // Narrow C: deterministic non-production validation/tooling surface.
  const onlyNonProductionValidation = normalized.every(isKnownNonProductionValidationPath);
  if (klass === 'C' && onlyNonProductionValidation && !hasRuntime) {
    productionImpact = false;
    build = false;
    predeploy = false;
    audit = false;
    // Keep Node/Lint/Unit validation for tooling code; these are scoped technical
    // validators, not production artifact Build/CSP/Predeploy checks.
    unit = true;
    lint = true;
  }

  if (klass === 'R') {
    productionImpact = true;
    node = true;
    lint = true;
    unit = true;
    audit = true;
    docker = true;

    // Owner-directed PR cost control: class R describes a runtime-sensitive
    // repository change, not a production mutation. Keep the required
    // build-and-test check context and scoped technical verification, but defer
    // production artifact build/predeploy/image construction to the force-full
    // Human-merged main push.
    build = false;
    predeploy = false;
    docker_image = false;
  }

  return {
    class: klass,
    production_impact: productionImpact,
    node,
    lint,
    unit,
    build,
    audit,
    predeploy,
    docker,
    docker_image,
    workflow_security,
    integrity,
    npm_advisory,
    hasAppOrTest,
    hasScriptOnly,
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

export function writeGithubOutput(scope) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const lines = [
    `class=${scope.class}`,
    `production_impact=${scope.production_impact}`,
    `node=${scope.node}`,
    `lint=${scope.lint}`,
    `unit=${scope.unit}`,
    `build=${scope.build}`,
    `audit=${scope.audit}`,
    `predeploy=${scope.predeploy}`,
    `docker=${scope.docker}`,
    `docker_image=${scope.docker_image}`,
    `workflow_security=${scope.workflow_security}`,
    `integrity=${scope.integrity}`,
    `npm_advisory=${scope.npm_advisory}`,
    // Back-compat with previous ci.yml flags
    `full=${scope.node && scope.unit && scope.build}`,
  ];
  const text = `${lines.join('\n')}\n`;
  if (outputPath) {
    fs.appendFileSync(outputPath, text, 'utf8');
  }
  return text;
}

function main() {
  const forceFull =
    process.env.EVENT_NAME === 'push' ||
    process.env.CI_FORCE_FULL === 'true' ||
    process.argv.includes('--force-full');

  let files = [];
  if (!forceFull) {
    const base = process.env.PR_BASE_SHA || process.env.BASE_SHA || '';
    const head = process.env.PR_HEAD_SHA || process.env.HEAD_SHA || 'HEAD';
    if (base) {
      files = listChangedFiles(base, head);
    } else if (process.env.CHANGED_FILES) {
      files = process.env.CHANGED_FILES.split(/\r?\n/).map(normalizePath).filter(Boolean);
    }
  }

  const scope = classifyChangedFiles(files, { forceFull });
  console.log(`[classifyPrScope] class=${scope.class} production_impact=${scope.production_impact} files=${forceFull ? '(force-full)' : files.length}`);
  console.log(JSON.stringify(scope, null, 2));
  writeGithubOutput(scope);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('classifyPrScope.mjs')) {
  main();
}
