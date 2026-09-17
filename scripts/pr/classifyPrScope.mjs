#!/usr/bin/env node

/**
 * Machine classification of PR / push scope from changed file paths.
 * Source of truth for which expensive CI steps must run (fail-closed).
 *
 * Classes (aligned with .github/pull_request_template.md):
 *   D — documentation / .ai / markdown only with no runtime consumer
 *   C — application, tests, scripts, runtime-consumed docs/contracts, non-deploy config
 *   R — runtime / dependency / docker / deployment surface
 *
 * A file extension or directory never proves docs-only safety. If a changed/deleted
 * documentation or .ai artifact is referenced by source, server, scripts, tests or workflows,
 * the change escalates to class C so TypeScript/tests/build cannot be skipped accidentally.
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
  ) return true;
  if (p.startsWith('server/')) return true;
  if (p.startsWith('scripts/security/') && /docker|runtime/i.test(p)) return true;
  if (p === '.github/workflows/ci.yml') return true;
  if (p.startsWith('.github/workflows/') && /render|deploy/i.test(p)) return true;
  return false;
}

export function isDependencyManifest(filePath) {
  const p = normalizePath(filePath);
  return p === 'package.json' || p === 'package-lock.json';
}

export function isKnownNonProductionValidationPath(filePath) {
  const p = normalizePath(filePath);
  if (isDocsPath(p)) return true;
  if (p.startsWith('tests/')) return true;
  if (p.startsWith('scripts/pr/')) return true;
  if (p.startsWith('scripts/governance/')) return true;
  if (p.startsWith('.github/') && !isRuntimeDeployPath(p)) return true;
  return false;
}

export function findRuntimeConsumedPaths(files, headRef = 'HEAD') {
  const roots = ['src', 'server', 'scripts', '.github/workflows', 'tests'];
  const consumed = [];

  for (const rawFile of files || []) {
    const file = normalizePath(rawFile);
    if (!file || !isDocsPath(file)) continue;
    try {
      const out = execFileSync(
        'git',
        ['grep', '-F', '-l', '-e', file, headRef, '--', ...roots],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      ).trim();
      if (out) consumed.push(file);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 1) continue;
      throw error;
    }
  }

  return Array.from(new Set(consumed));
}

/** @param {string[]} files @param {{ forceFull?: boolean, runtimeConsumedPaths?: string[] }} [options] */
export function classifyChangedFiles(files, options = {}) {
  const integrity = true;

  if (options.forceFull) {
    return {
      class: 'R', production_impact: true, node: true, lint: true, unit: true,
      build: true, audit: true, predeploy: true, docker: true, docker_image: true,
      workflow_security: true, integrity, npm_advisory: true, consumer_escalation: false,
    };
  }

  const normalized = (files || []).map(normalizePath).filter(Boolean);
  const runtimeConsumed = new Set((options.runtimeConsumedPaths || []).map(normalizePath));
  const consumerEscalation = normalized.some((file) => runtimeConsumed.has(file));

  if (normalized.length === 0) {
    return {
      class: 'D', production_impact: false, node: false, lint: false, unit: false,
      build: false, audit: false, predeploy: false, docker: false, docker_image: false,
      workflow_security: false, integrity, npm_advisory: false, consumer_escalation: false,
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

    const isScript = file.startsWith('scripts/') || file.startsWith('.github/') || isDocsPath(file);
    if (!isScript && !isDocsPath(file)) hasScriptOnly = false;
    if (
      file.startsWith('src/') || file.startsWith('tests/') || file.endsWith('.ts') ||
      file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')
    ) hasAppOrTest = true;
  }

  if (!hasNonDocs && !consumerEscalation) {
    return {
      class: 'D', production_impact: false, node: false, lint: false, unit: false,
      build: false, audit: false, predeploy: false, docker: false, docker_image: false,
      workflow_security: false, integrity, npm_advisory: false, consumer_escalation: false,
    };
  }

  const klass = hasRuntime ? 'R' : 'C';
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

  const onlyTests = normalized.every((f) => isDocsPath(f) || f.startsWith('tests/') || f.startsWith('.ai/'));
  if (klass === 'C' && onlyTests && !consumerEscalation) {
    productionImpact = false;
    build = false;
    predeploy = false;
    audit = false;
  }

  const onlyNonProductionValidation = normalized.every(isKnownNonProductionValidationPath);
  if (klass === 'C' && onlyNonProductionValidation && !hasRuntime && !consumerEscalation) {
    productionImpact = false;
    build = false;
    predeploy = false;
    audit = false;
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
    consumer_escalation: consumerEscalation,
  };
}

export function listChangedFiles(baseRef, headRef) {
  const out = execFileSync('git', ['diff', '--name-only', `${baseRef}...${headRef}`], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
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
    `consumer_escalation=${scope.consumer_escalation === true}`,
    `full=${scope.node && scope.unit && scope.build}`,
  ];
  const text = `${lines.join('\n')}\n`;
  if (outputPath) fs.appendFileSync(outputPath, text, 'utf8');
  return text;
}

function main() {
  const forceFull = process.env.EVENT_NAME === 'push' || process.env.CI_FORCE_FULL === 'true' || process.argv.includes('--force-full');

  let files = [];
  let runtimeConsumedPaths = [];
  if (!forceFull) {
    const base = process.env.PR_BASE_SHA || process.env.BASE_SHA || '';
    const head = process.env.PR_HEAD_SHA || process.env.HEAD_SHA || 'HEAD';
    if (base) files = listChangedFiles(base, head);
    else if (process.env.CHANGED_FILES) files = process.env.CHANGED_FILES.split(/\r?\n/).map(normalizePath).filter(Boolean);
    runtimeConsumedPaths = findRuntimeConsumedPaths(files, head);
  }

  const scope = classifyChangedFiles(files, { forceFull, runtimeConsumedPaths });
  console.log(`[classifyPrScope] class=${scope.class} production_impact=${scope.production_impact} consumer_escalation=${scope.consumer_escalation} files=${forceFull ? '(force-full)' : files.length}`);
  if (runtimeConsumedPaths.length > 0) console.log(`[classifyPrScope] runtime-consumed changed artifacts: ${runtimeConsumedPaths.join(', ')}`);
  console.log(JSON.stringify(scope, null, 2));
  writeGithubOutput(scope);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('classifyPrScope.mjs')) main();
