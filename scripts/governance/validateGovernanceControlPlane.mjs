#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  isCurrentStateProjectionPath,
  validateAuthorityProjection,
  validateCurrentStateProjectionFreshness,
} from './controlPlaneFreshnessRules.mjs';

const root = process.cwd();
const errors = [];
const warnings = [];
const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

const abs = (...parts) => path.join(root, ...parts);
const exists = (filePath) => fs.existsSync(abs(filePath));
const read = (filePath) => fs.readFileSync(abs(filePath), 'utf8');
const json = (filePath) => JSON.parse(read(filePath));

function fail(code, message) {
  errors.push({ code, message });
}

function warn(code, message) {
  warnings.push({ code, message });
}

function runStructuralCore() {
  const corePath = abs('scripts/governance/controlPlaneStructuralValidatorCore.mjs');
  const result = spawnSync(process.execPath, [corePath], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    process.exit(Number.isInteger(result.status) ? result.status : 1);
  }
}

function git(args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 ? String(result.stdout ?? '').trim() : null;
}

function resolveCurrentMainSha() {
  for (const candidate of [
    process.env.CAPITAL_AI_CURRENT_MAIN_SHA,
    process.env.PR_BASE_SHA,
    process.env.BASE_SHA,
  ]) {
    const normalized = String(candidate ?? '').trim().toLowerCase();
    if (FULL_SHA_RE.test(normalized)) return normalized;
  }

  for (const ref of ['origin/main', 'main']) {
    const resolved = String(git(['rev-parse', '--verify', ref]) ?? '').toLowerCase();
    if (FULL_SHA_RE.test(resolved)) return resolved;
  }
  return null;
}

function authorityInput(filePath) {
  if (!exists(filePath)) return null;
  if (filePath.endsWith('.json')) {
    try {
      return { jsonValue: json(filePath), text: '' };
    } catch (error) {
      fail('AUTHORITY_TARGET_JSON_INVALID', `${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  return { text: read(filePath), jsonValue: null };
}

runStructuralCore();

const authorityRegistry = json('docs/governance/authority-registry.json');
const authorities = authorityRegistry.entries ?? [];
const authorityById = new Map(authorities.map((entry) => [entry.authorityId, entry]));

const controlPlaneAuthority = authorityById.get('AUTH-GOV-CONTROL-PLANE');
if (!controlPlaneAuthority) {
  fail('CONTROL_PLANE_AUTHORITY_UNRESOLVED', 'AUTH-GOV-CONTROL-PLANE is missing from the Authority Registry.');
} else {
  for (const filePath of [
    'src/platform/Governance/README.md',
    'src/platform/Governance/manifest.json',
    'docs/governance/control-plane/README.md',
  ]) {
    const input = authorityInput(filePath);
    if (!input) continue;
    for (const finding of validateAuthorityProjection({
      filePath,
      expectedAuthorityId: controlPlaneAuthority.authorityId,
      expectedVersion: controlPlaneAuthority.version,
      ...input,
      requireAuthorityId: true,
      requireVersion: true,
    })) {
      fail(finding.code, finding.message);
    }
  }
}

const currentMainSha = resolveCurrentMainSha();
if (!currentMainSha) {
  const message = 'Current main SHA could not be resolved from an explicit base SHA, origin/main or main; changed projection freshness cannot be proven.';
  if (process.env.GITHUB_ACTIONS === 'true') fail('CURRENT_MAIN_REF_UNAVAILABLE', message);
  else warn('CURRENT_MAIN_REF_UNAVAILABLE', message);
} else {
  const containsMain = git(['merge-base', '--is-ancestor', currentMainSha, 'HEAD']);
  if (containsMain === null) {
    fail('CURRENT_MAIN_NOT_CONTAINED', `Branch HEAD does not contain current main@${currentMainSha}; synchronize before governance validation.`);
  } else {
    const changedOutput = git(['diff', '--name-only', `${currentMainSha}...HEAD`]);
    if (changedOutput === null) {
      fail('CURRENT_STATE_PROJECTION_DIFF_UNAVAILABLE', `Changed-file set relative to main@${currentMainSha} could not be resolved.`);
    } else {
      const changedFiles = changedOutput.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
      for (const filePath of changedFiles.filter(isCurrentStateProjectionPath)) {
        if (!exists(filePath)) {
          fail('CURRENT_STATE_PROJECTION_MISSING', `${filePath}: changed current-state projection is missing from HEAD.`);
          continue;
        }
        for (const finding of validateCurrentStateProjectionFreshness({
          filePath,
          text: read(filePath),
          expectedMainSha: currentMainSha,
        })) {
          fail(finding.code, finding.message);
        }
      }
    }
  }
}

for (const item of warnings) console.warn(`WARN ${item.code}: ${item.message}`);
for (const item of errors) console.error(`ERROR ${item.code}: ${item.message}`);

if (errors.length > 0) {
  console.error(`Governance control-plane freshness/version validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Governance control-plane validation passed with ${warnings.length} freshness/version warning(s).`);
