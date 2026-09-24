#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const MERGE_CADENCE_CONTRACT_VERSION = 'merge-cadence-runtime/1.0.0';
export const VERSION_CONTRACT_PATH = 'docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json';

export function isMergeCadenceCliEntry(entryPath = process.argv[1] || '') {
  const normalized = String(entryPath || '').replace(/\\/g, '/');
  return normalized === 'mergeCadence.mjs' || normalized.endsWith('/mergeCadence.mjs');
}

function runGit(repoRoot, args, allowFailure = false) {
  const result = spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' });
  if (result.status !== 0) {
    if (allowFailure) return { ok: false, stdout: '', stderr: String(result.stderr || '') };
    throw new Error(String(result.stderr || result.stdout || 'git command failed').trim());
  }
  return { ok: true, stdout: String(result.stdout || '').trim(), stderr: '' };
}

function git(repoRoot, args, allowFailure = false) {
  return runGit(repoRoot, args, allowFailure).stdout;
}

function isAncestor(repoRoot, ancestor, descendant) {
  return runGit(repoRoot, ['merge-base', '--is-ancestor', ancestor, descendant], true).ok;
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(label + ' is not valid JSON: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function readJsonAtRef(repoRoot, ref, relativePath) {
  const raw = git(repoRoot, ['show', ref + ':' + relativePath], true);
  return raw ? parseJson(raw, relativePath + '@' + ref) : null;
}

export function nextPatchVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(String(version || '').trim());
  if (!match) throw new Error('Invalid SemVer version: ' + String(version));
  return [Number(match[1]), Number(match[2]), Number(match[3]) + 1].join('.');
}

export function isPullRequestMerge(subject, parents) {
  const parentCount = String(parents || '').trim().split(/\s+/).filter(Boolean).length;
  return parentCount >= 2 && /^Merge pull request #\d+ from /i.test(String(subject || '').trim());
}

export function pullRequestNumberFromMergeSubject(subject) {
  const match = /^Merge pull request #(\d+) from /i.exec(String(subject || '').trim());
  return match ? Number(match[1]) : null;
}

function resolveProductionPullRequestNumber(repoRoot, productionSha) {
  const normalized = String(productionSha || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(normalized)) return null;
  const subject = git(repoRoot, ['show', '-s', '--format=%s', normalized], true);
  return pullRequestNumberFromMergeSubject(subject);
}

export function isCadenceContractActive(contract) {
  return contract?.version === '1.1.0'
    && contract?.automaticMaterializationPolicy?.mode === 'MERGED_PR_CADENCE_PATCH'
    && contract?.automaticMaterializationPolicy?.mergeOrdinalBoundaries === 'POSITIVE_MULTIPLES_OF_10';
}

/**
 * @param {{
 *   active: boolean;
 *   mergeOrdinal: number;
 *   productionOrdinal?: number;
 *   productionRelation?: string;
 *   productionHealthy?: boolean | null;
 *   currentVersion: string;
 * }} input
 */
export function computeMergeCadence({
  active,
  mergeOrdinal,
  productionOrdinal = 0,
  productionRelation = 'UNKNOWN',
  productionHealthy = null,
  currentVersion,
}) {
  const ordinal = Number(mergeOrdinal);
  const prodOrdinal = Number(productionOrdinal || 0);
  if (!Number.isInteger(ordinal) || ordinal < 0) throw new Error('mergeOrdinal must be a non-negative integer.');
  if (!Number.isInteger(prodOrdinal) || prodOrdinal < 0) throw new Error('productionOrdinal must be a non-negative integer.');

  const nextPatch = nextPatchVersion(currentVersion);
  if (!active) {
    return {
      active: false,
      mode: 'LEGACY_PER_MERGE',
      mergeOrdinal: ordinal,
      productionOrdinal: prodOrdinal,
      productionRelation,
      deploymentBoundary: null,
      satisfiedDeploymentBoundary: null,
      deployDue: true,
      deployAllowed: true,
      deployProgress: null,
      deployRemaining: null,
      recoveryEligible: true,
      versionProgress: null,
      versionRemaining: null,
      nextVersionDue: false,
      nextPatchVersion: nextPatch,
    };
  }

  const deploymentBoundary = Math.floor(ordinal / 5) * 5;
  const satisfiedDeploymentBoundary = Math.floor(prodOrdinal / 5) * 5;
  const deployDue = deploymentBoundary > 0 && deploymentBoundary > satisfiedDeploymentBoundary;
  const deployProgress = deployDue ? 5 : Math.min(4, Math.max(0, ordinal - satisfiedDeploymentBoundary));
  const deployRemaining = deployDue ? 0 : 5 - deployProgress;
  const versionProgress = ordinal % 10;
  const versionRemaining = versionProgress === 0 ? 10 : 10 - versionProgress;
  const nextVersionDue = (ordinal + 1) % 10 === 0;
  const productionBroken = productionHealthy === false || productionRelation === 'DIVERGED';

  return {
    active: true,
    mode: 'CADENCE_5_10',
    mergeOrdinal: ordinal,
    productionOrdinal: prodOrdinal,
    productionRelation,
    deploymentBoundary,
    satisfiedDeploymentBoundary,
    deployDue,
    deployAllowed: deployDue,
    deployProgress,
    deployRemaining,
    recoveryEligible: productionBroken || deployDue,
    versionProgress,
    versionRemaining,
    nextVersionDue,
    nextPatchVersion: nextPatch,
  };
}

function findCadenceEpoch(repoRoot, ref) {
  const raw = git(repoRoot, ['log', '--first-parent', '--reverse', '--format=%H', ref, '--', VERSION_CONTRACT_PATH], true);
  const candidates = raw.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  for (const sha of candidates) {
    const contract = readJsonAtRef(repoRoot, sha, VERSION_CONTRACT_PATH);
    if (isCadenceContractActive(contract)) return sha;
  }
  return null;
}

function countPullRequestMerges(repoRoot, base, head) {
  if (base === head) return 0;
  const raw = git(repoRoot, ['log', '--first-parent', '--merges', '--format=%P%x09%s', base + '..' + head], true);
  if (!raw) return 0;
  return raw.split(/\r?\n/).filter(Boolean).filter((line) => {
    const tab = line.indexOf('\t');
    const parents = tab >= 0 ? line.slice(0, tab) : '';
    const subject = tab >= 0 ? line.slice(tab + 1) : line;
    return isPullRequestMerge(subject, parents);
  }).length;
}

function resolveProductionOrdinal(repoRoot, epochSha, currentSha, productionSha) {
  const normalized = String(productionSha || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(normalized)) return { ordinal: 0, relation: 'UNKNOWN' };
  if (normalized === currentSha) {
    return { ordinal: countPullRequestMerges(repoRoot, epochSha, currentSha), relation: 'CURRENT_MAIN' };
  }
  if (isAncestor(repoRoot, normalized, epochSha)) return { ordinal: 0, relation: 'PRE_EPOCH' };
  if (isAncestor(repoRoot, epochSha, normalized) && isAncestor(repoRoot, normalized, currentSha)) {
    return { ordinal: countPullRequestMerges(repoRoot, epochSha, normalized), relation: 'ANCESTOR' };
  }
  return { ordinal: 0, relation: 'DIVERGED' };
}

/**
 * @param {{
 *   repoRoot?: string;
 *   ref?: string;
 *   productionSha?: string;
 *   productionHealthy?: boolean | null;
 * }} input
 */
export function resolveMergeCadence({
  repoRoot = process.cwd(),
  ref = 'HEAD',
  productionSha = '',
  productionHealthy = null,
} = {}) {
  const root = path.resolve(repoRoot);
  const resolvedRef = git(root, ['rev-parse', ref]).toLowerCase();
  const contract = readJsonAtRef(root, resolvedRef, VERSION_CONTRACT_PATH);
  const packageJson = readJsonAtRef(root, resolvedRef, 'package.json');
  const currentVersion = String(packageJson?.version || '');
  const productionPullRequestNumber = resolveProductionPullRequestNumber(root, productionSha);
  const active = isCadenceContractActive(contract);

  if (!active) {
    return {
      contractVersion: MERGE_CADENCE_CONTRACT_VERSION,
      ref: resolvedRef,
      epochSha: null,
      currentVersion,
      productionPullRequestNumber,
      ...computeMergeCadence({
        active: false,
        mergeOrdinal: 0,
        productionOrdinal: 0,
        productionRelation: 'LEGACY',
        productionHealthy,
        currentVersion,
      }),
    };
  }

  const epochSha = findCadenceEpoch(root, resolvedRef);
  if (!epochSha) throw new Error('Cadence contract is active but cadenceEpoch cannot be resolved from first-parent history.');
  const mergeOrdinal = countPullRequestMerges(root, epochSha, resolvedRef);
  const production = resolveProductionOrdinal(root, epochSha, resolvedRef, productionSha);

  return {
    contractVersion: MERGE_CADENCE_CONTRACT_VERSION,
    ref: resolvedRef,
    epochSha,
    currentVersion,
    productionPullRequestNumber,
    ...computeMergeCadence({
      active: true,
      mergeOrdinal,
      productionOrdinal: production.ordinal,
      productionRelation: production.relation,
      productionHealthy,
      currentVersion,
    }),
  };
}

function arg(name, fallback = '') {
  const prefix = '--' + name + '=';
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function boolArg(name) {
  const value = arg(name, '');
  if (!value) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('--' + name + ' must be true or false');
}

function writeGithubOutput(result) {
  const target = String(process.env.GITHUB_OUTPUT || '').trim();
  if (!target) return;
  const values = {
    cadence_active: result.active ? 'true' : 'false',
    cadence_mode: result.mode,
    cadence_epoch_sha: result.epochSha || '',
    merge_ordinal: result.mergeOrdinal,
    production_ordinal: result.productionOrdinal,
    production_relation: result.productionRelation,
    production_pr_number: result.productionPullRequestNumber ?? '',
    deployment_boundary: result.deploymentBoundary ?? '',
    satisfied_deployment_boundary: result.satisfiedDeploymentBoundary ?? '',
    deploy_due: result.deployDue ? 'true' : 'false',
    deploy_allowed: result.deployAllowed ? 'true' : 'false',
    deploy_progress: result.deployProgress ?? '',
    deploy_remaining: result.deployRemaining ?? '',
    recovery_eligible: result.recoveryEligible ? 'true' : 'false',
    version_progress: result.versionProgress ?? '',
    version_remaining: result.versionRemaining ?? '',
    next_version_due: result.nextVersionDue ? 'true' : 'false',
    current_version: result.currentVersion,
    next_patch_version: result.nextPatchVersion,
  };
  fs.appendFileSync(target, Object.entries(values).map(([key, value]) => key + '=' + String(value) + '\n').join(''));
}

if (isMergeCadenceCliEntry()) {
  try {
    const result = resolveMergeCadence({
      repoRoot: arg('repo-root', process.cwd()),
      ref: arg('ref', 'HEAD'),
      productionSha: arg('production-sha', ''),
      productionHealthy: boolArg('production-healthy'),
    });
    writeGithubOutput(result);
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    console.error('[merge-cadence] FAIL-CLOSED: ' + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
