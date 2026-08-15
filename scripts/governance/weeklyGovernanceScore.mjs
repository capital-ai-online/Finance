#!/usr/bin/env node
/**
 * Weekly executable Governance Score — subset of ESS-0012-CONTRACTS (57 GOV rules)
 * Advisory only — does not block merge.
 *
 * Usage:
 *   node scripts/governance/weeklyGovernanceScore.mjs
 *   node scripts/governance/weeklyGovernanceScore.mjs --json
 *   node scripts/governance/weeklyGovernanceScore.mjs --out docs/governance/scores/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const AS_JSON = args.includes('--json');
const outIdx = args.indexOf('--out');
const OUT_DIR = outIdx >= 0 ? path.resolve(REPO_ROOT, args[outIdx + 1] || 'docs/governance/scores') : null;

function runShadow() {
  const script = path.join(__dirname, 'shadowAdrMetadataValidator.mjs');
  const r = spawnSync(process.execPath, [script, '--json'], { encoding: 'utf8', cwd: REPO_ROOT });
  if (r.error) throw r.error;
  try {
    return JSON.parse(r.stdout || '{}');
  } catch {
    return { findings: [], countsBySeverity: { error: 0, warning: 0, info: 0 } };
  }
}

function checkPackageIdentity() {
  const pkgPath = path.join(REPO_ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) return { ok: false, message: 'package.json missing' };
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const ok = pkg.name === 'capital-ai' && typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version);
  return { ok, name: pkg.name, version: pkg.version, message: ok ? 'package identity capital-ai + semver OK' : `unexpected name/version: ${pkg.name}@${pkg.version}` };
}

function checkRegistryHints() {
  const hints = [
    'docs/adr/adr_history.json',
    '.ai/registry/ess-registry.json',
    '.github/pull_request_template.md',
    'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md',
  ];
  return hints.map((p) => ({ path: p, present: fs.existsSync(path.join(REPO_ROOT, p)) }));
}

function computeScore(shadow, pkg, registries) {
  let score = 100;
  const deductions = [];
  const err = shadow.countsBySeverity?.error ?? 0;
  const warn = shadow.countsBySeverity?.warning ?? 0;
  const info = shadow.countsBySeverity?.info ?? 0;
  if (err > 0) { const d = Math.min(40, err * 15); score -= d; deductions.push({ reason: `ADR duplicate/error findings (${err})`, points: d }); }
  if (warn > 0) { const d = Math.min(20, warn * 2); score -= d; deductions.push({ reason: `ADR metadata warnings (${warn})`, points: d }); }
  if (info > 0) { const d = Math.min(10, Math.floor(info / 5)); score -= d; deductions.push({ reason: `Missing Implementation-Status density (${info})`, points: d }); }
  if (!pkg.ok) { score -= 15; deductions.push({ reason: 'package identity', points: 15 }); }
  const missingReg = registries.filter((r) => !r.present);
  if (missingReg.length) { const d = missingReg.length * 5; score -= d; deductions.push({ reason: `missing governance anchors`, points: d }); }
  score = Math.max(0, Math.min(100, score));
  return { score, deductions };
}

function main() {
  const shadow = runShadow();
  const pkg = checkPackageIdentity();
  const registries = checkRegistryHints();
  const { score, deductions } = computeScore(shadow, pkg, registries);
  const report = {
    documentId: 'GOV-SCORE-WEEKLY',
    generatedAt: new Date().toISOString(),
    score,
    scale: '0-100 shadow subset (not full ESS-0012 Chapter-3)',
    thresholdNote: 'Full production gate (>=80) requires complete Governance Validator; this weekly score is advisory only.',
    components: { adrShadow: { activeAdrCount: shadow.activeAdrCount, duplicateNumberGroups: shadow.duplicateNumberGroups, findings: shadow.countsBySeverity }, packageIdentity: pkg, registryHints: registries },
    deductions,
    executableRulesCovered: ['GOV-ADR uniqueness (shadow)', 'GOV-ADR Status presence (shadow)', 'GOV-ADR Implementation-Status presence (shadow)', 'package identity (capital-ai)', 'core governance file presence'],
    notCoveredYet: ['GOV-KG / Digital Twin', 'component.yaml / CHANGELOG per component', 'full 57-rule ESS-0012 engine'],
  };
  if (OUT_DIR) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const day = report.generatedAt.slice(0, 10);
    const jsonPath = path.join(OUT_DIR, `governance-score-${day}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
    report.written = { jsonPath: path.relative(REPO_ROOT, jsonPath) };
  }
  if (AS_JSON) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else {
    console.log('=== Weekly Governance Score (executable subset) ===');
    console.log(`Score: ${score} / 100`);
    for (const d of deductions) console.log(`  -${d.points} ${d.reason}`);
    console.log(`ADR duplicates: ${shadow.duplicateNumberGroups} | package: ${pkg.ok ? 'OK' : 'FAIL'}`);
    console.log('Advisory only — does not block merge.');
  }
  process.exit(0);
}

main();
