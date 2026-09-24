#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { appendGithubOutput } from './lib.mjs';
import { validateCurrentStateProjectionFreshness } from '../governance/controlPlaneFreshnessRules.mjs';

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;
const TARGET_RE = /^docs\/projects\/[^/]+\/(?:ROADMAP|TASK_REGISTER)\.md$/;

function fail(message) {
  throw new Error(`[current-state-baseline-detection] EVIDENCE_UNAVAILABLE: ${message}`);
}

function normalizePath(value) {
  return String(value ?? '').replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

export function detectCurrentStateProjectionBaselineFailures({
  worktree,
  changedFiles,
  expectedMainSha,
}) {
  const root = path.resolve(worktree || process.cwd());
  const expected = String(expectedMainSha ?? '').trim().toLowerCase();
  if (!FULL_SHA_RE.test(expected)) fail('EXPECTED_MAIN_SHA must be a full 40-character SHA.');
  if (!Array.isArray(changedFiles)) fail('changed-file evidence must be an array.');

  const candidates = [...new Set(changedFiles.map(normalizePath).filter((entry) => TARGET_RE.test(entry)))].sort();
  const targets = [];
  const findings = [];

  for (const candidate of candidates) {
    const absolute = path.resolve(root, candidate);
    if (!absolute.startsWith(root + path.sep)) fail(`candidate escapes worktree: ${candidate}`);
    if (!fs.existsSync(absolute)) fail(`candidate file is unavailable: ${candidate}`);
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`candidate must be a regular non-symlink file: ${candidate}`);

    const text = fs.readFileSync(absolute, 'utf8');
    const candidateFindings = validateCurrentStateProjectionFreshness({
      filePath: candidate,
      text,
      expectedMainSha: expected,
    }).filter((finding) =>
      finding.code === 'CURRENT_STATE_PROJECTION_BASELINE_MISSING'
      || finding.code === 'CURRENT_STATE_PROJECTION_BASELINE_STALE'
    );

    if (candidateFindings.length > 0) {
      targets.push(candidate);
      findings.push(...candidateFindings);
    }
  }

  return Object.freeze({
    candidates,
    targets,
    findings,
    eligible: targets.length > 0,
    reason: candidates.length === 0
      ? 'no-current-state-projection-candidate'
      : targets.length === 0
        ? 'no-reproducible-current-state-baseline-drift'
        : 'reproduced-current-state-baseline-drift',
  });
}

function main() {
  let changedFiles;
  try {
    changedFiles = JSON.parse(String(process.env.CHANGED_FILES_JSON ?? '[]'));
  } catch {
    fail('CHANGED_FILES_JSON is not valid JSON.');
  }

  const result = detectCurrentStateProjectionBaselineFailures({
    worktree: process.env.WORKTREE || process.cwd(),
    changedFiles,
    expectedMainSha: process.env.EXPECTED_MAIN_SHA,
  });

  appendGithubOutput({
    eligible: String(result.eligible),
    reason: result.reason,
    targets_json: JSON.stringify(result.targets),
    findings_json: JSON.stringify(result.findings),
  });

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('detectCurrentStateProjectionBaselineFailures.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
