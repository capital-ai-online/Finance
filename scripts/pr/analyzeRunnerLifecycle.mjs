#!/usr/bin/env node
import fs from 'node:fs';

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms / 60000 : 0;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export function summarizePrLifecycle(entry) {
  const pr = entry?.pr || {};
  const runs = Array.isArray(entry?.runs) ? entry.runs : [];
  const successfulSnapshots = new Set();
  const heads = new Set();
  const workflowMinutes = new Map();

  let total = 0;
  let failed = 0;
  let cancelled = 0;
  let duplicate = 0;
  let preflightAvoidable = 0;
  let attempts = 0;

  for (const run of runs) {
    const head = String(run.head_sha || '');
    const base = String(run.base_sha || '');
    if (head) heads.add(head);
    attempts += Number(run.run_attempt || 1);

    const jobs = Array.isArray(run.jobs) ? run.jobs : [];
    const minutes = jobs.reduce((sum, job) => sum + minutesBetween(job.started_at, job.completed_at), 0);
    total += minutes;

    const workflow = String(run.workflow || run.name || 'unknown');
    workflowMinutes.set(workflow, (workflowMinutes.get(workflow) || 0) + minutes);

    const conclusion = String(run.conclusion || '').toLowerCase();
    if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'action_required') {
      failed += minutes;
    }
    if (conclusion === 'cancelled') cancelled += minutes;
    if (run.preflight_avoidable === true) preflightAvoidable += minutes;

    const snapshotKey = `${workflow}|${head}|${base}`;
    if (successfulSnapshots.has(snapshotKey)) duplicate += minutes;
    if (conclusion === 'success') successfulSnapshots.add(snapshotKey);
  }

  const top = [...workflowMinutes.entries()].sort((a, b) => b[1] - a[1])[0] || ['none', 0];
  const createdToMerge = minutesBetween(pr.created_at, pr.merged_at);
  const createdToFirstGreen = minutesBetween(pr.created_at, entry.first_green_at);

  return {
    pr_number: pr.number ?? null,
    pr_class: entry.pr_class || 'UNKNOWN',
    created_to_first_green_min: createdToFirstGreen || null,
    created_to_merge_min: createdToMerge || null,
    heads: heads.size,
    workflow_runs: runs.length,
    attempts,
    runner_minutes: total,
    failed_minutes: failed,
    cancelled_minutes: cancelled,
    duplicate_minutes: duplicate,
    waste_minutes: failed + cancelled + duplicate,
    waste_ratio: total > 0 ? (failed + cancelled + duplicate) / total : 0,
    preflight_avoidable_minutes: preflightAvoidable,
    top_cost_check: top[0],
    top_cost_check_minutes: top[1],
  };
}

export function summarizeLifecycleWindow(entries) {
  const rows = (entries || []).map(summarizePrLifecycle);
  const runner = rows.map((row) => row.runner_minutes);
  const merge = rows.map((row) => row.created_to_merge_min).filter((value) => value != null);
  const totalRunner = runner.reduce((a, b) => a + b, 0);
  const totalWaste = rows.reduce((sum, row) => sum + row.waste_minutes, 0);
  const byClass = {};

  for (const row of rows) {
    const key = row.pr_class;
    byClass[key] ||= { pr_count: 0, total_runner_min: 0 };
    byClass[key].pr_count += 1;
    byClass[key].total_runner_min += row.runner_minutes;
  }
  for (const value of Object.values(byClass)) {
    value.avg_runner_min = value.pr_count ? value.total_runner_min / value.pr_count : 0;
  }

  return {
    schema_version: '1.0.0',
    pr_count: rows.length,
    total_runner_min: totalRunner,
    avg_runner_min: rows.length ? totalRunner / rows.length : 0,
    p50_runner_min: percentile(runner, 0.50),
    p95_runner_min: percentile(runner, 0.95),
    avg_created_to_merge_min: merge.length ? merge.reduce((a, b) => a + b, 0) / merge.length : null,
    waste_minutes: totalWaste,
    waste_ratio: totalRunner > 0 ? totalWaste / totalRunner : 0,
    preflight_avoidable_minutes: rows.reduce((sum, row) => sum + row.preflight_avoidable_minutes, 0),
    by_class: byClass,
    rows,
  };
}

function main() {
  const input = process.argv[2] || process.env.PR_LIFECYCLE_LEDGER;
  if (!input) {
    throw new Error('Usage: node scripts/pr/analyzeRunnerLifecycle.mjs <ledger.json>');
  }
  const parsed = JSON.parse(fs.readFileSync(input, 'utf8'));
  const entries = Array.isArray(parsed) ? parsed : parsed.entries;
  if (!Array.isArray(entries)) throw new TypeError('Lifecycle ledger must be an array or { entries: [] }');
  process.stdout.write(`${JSON.stringify(summarizeLifecycleWindow(entries), null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('analyzeRunnerLifecycle.mjs')) {
  main();
}
