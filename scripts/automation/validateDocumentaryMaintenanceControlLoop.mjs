#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const CLAIM_PATH = '.ai/work-claims/DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20.json';
const EVIDENCE_PATH = 'docs/evidence/documentary/DOCUMENTARY_MAINTENANCE_MAIN_SYNC_2026-08-20.md';
const EXPECTED_AUTHORITY_ID = 'AUTH-ADR-DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20';
const EXPECTED_ADR_PATH = 'docs/adr/ADR-0097-documentary-maintenance-agent-control-loop.md';
const EXPECTED_DOCUMENTS = new Map([
  ['DOC-ADR-0097', EXPECTED_ADR_PATH],
  ['DOC-ARCH-DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20', 'docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md'],
  ['DOC-WP-DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20', 'docs/roadmaps/work-packages/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP_2026-08-20.md'],
]);
const REQUIRED_FILES = [
  CLAIM_PATH,
  EVIDENCE_PATH,
  EXPECTED_ADR_PATH,
  'docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md',
  'docs/architecture/QUALITY_CENTER_CORE_ORCHESTRATION.md',
  'docs/roadmaps/work-packages/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP_2026-08-20.md',
  'scripts/automation/runDocumentaryMaintenanceControlLoop.ts',
  'scripts/automation/validateDocumentaryMaintenanceControlLoop.mjs',
  'scripts/automation/validateRepositoryQuality.ts',
  'server/documentaryMaintenanceAiAdapter.ts',
  'src/platform/Compliance/PolicyGate.ts',
  'src/platform/Documentary/Agents/DocumentaryMaintenanceAgent.ts',
  'src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer.ts',
  'src/platform/Documentary/Observability/DocumentaryMaintenanceObservability.ts',
  'src/platform/Documentary/Orchestration/DocumentaryMaintenanceOrchestrator.ts',
  'src/platform/Governance/Contracts/RepositoryQualityEvidence.ts',
  'src/platform/Quality/manifest.json',
  'src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator.ts',
  'src/platform/Security/agentIam.ts',
  'src/platform/Supervisor/documentaryMaintenanceObservation.ts',
  'tests/unit/documentaryMaintenanceAgent.test.ts',
  'tests/unit/documentaryMaintenanceGitHost.test.ts',
  'tests/unit/documentaryMaintenanceObservability.test.ts',
  'tests/unit/documentaryMaintenanceOrchestrator.test.ts',
  'tests/unit/documentarySemanticFreshness.test.ts',
];

function fail(message) {
  throw new Error(`[DOCUMENTARY-MAINTENANCE-VALIDATION] ${message}`);
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function assertExactSet(label, actual, expected) {
  const left = sorted(actual);
  const right = sorted(expected);
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    const onlyActual = left.filter((item) => !right.includes(item));
    const onlyExpected = right.filter((item) => !left.includes(item));
    fail(`${label} mismatch; only actual=[${onlyActual.join(', ')}], only expected=[${onlyExpected.join(', ')}].`);
  }
}

for (const required of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(root, required))) fail(`required file missing: ${required}`);
}

const currentBranch = git(['branch', '--show-current']);
if (currentBranch === 'main' || !currentBranch.startsWith('agent/documentary-maintenance-')) {
  fail(`validation requires an isolated agent/documentary-maintenance-* branch; got ${currentBranch || '<detached>'}.`);
}

const originMainSha = git(['rev-parse', 'origin/main']).toLowerCase();
const mergeBase = git(['merge-base', 'origin/main', 'HEAD']).toLowerCase();
const claim = json(CLAIM_PATH);
if (claim.baseBranch !== 'main') fail('work claim baseBranch must be main.');
if (String(claim.baseSha ?? '').toLowerCase() !== originMainSha) {
  fail(`work claim baseSha must equal current origin/main (${originMainSha}).`);
}
if (mergeBase !== originMainSha) {
  fail(`branch is not synchronized with current main; merge-base=${mergeBase}, origin/main=${originMainSha}.`);
}
if (claim.status !== 'active' || claim.exclusive !== true) fail('work claim must remain active and exclusive before PR merge/closure.');

const changedFilesRaw = git(['diff', '--name-only', 'origin/main...HEAD']);
const changedFiles = changedFilesRaw ? changedFilesRaw.split(/\r?\n/).filter(Boolean) : [];
assertExactSet('work claim claimedPaths', claim.claimedPaths ?? [], changedFiles);

git(['diff', '--check', 'origin/main...HEAD']);

const mainSyncEvidence = read(EVIDENCE_PATH);
for (const marker of [
  originMainSha,
  currentBranch,
  'repository:quality:check',
  claim.claimId,
  'itself was not mutated',
]) {
  if (!mainSyncEvidence.includes(marker)) fail(`main-sync evidence is missing required marker: ${marker}.`);
}
if (!mainSyncEvidence.includes(String(claim.baseSha))) {
  fail('main-sync evidence and Work Claim are not bound to the same base SHA.');
}

const packageJson = json('package.json');
for (const [name, expected] of Object.entries({
  build: 'tsx scripts/security/verifyGoogleMarketingInvariants.ts && tsx scripts/automation/runQualityExecution.ts build scripts/automation/buildRuntimeReleaseManifest.ts',
  test: 'tsx scripts/automation/runQualityExecution.ts test',
  'repository:quality:check': 'tsx scripts/automation/validateRepositoryQuality.ts',
  'documentary:maintenance': 'tsx scripts/automation/runDocumentaryMaintenanceControlLoop.ts',
  'documentary:maintenance:validate': 'node scripts/automation/validateDocumentaryMaintenanceControlLoop.mjs',
})) {
  if (packageJson.scripts?.[name] !== expected) fail(`package.json script ${name} is missing or unexpected.`);
}
const expectedPrePr = 'npm run documentary:maintenance:test && npm run lint && npm run docs:hygiene:check && npm run governance:control-plane && npm run repository:quality:check && npm run documentary:maintenance:validate';
if (packageJson.scripts?.['documentary:maintenance:prepr'] !== expectedPrePr) {
  fail('documentary:maintenance:prepr must run the exact targeted test/type/hygiene/governance/repository-quality/closure sequence.');
}

const qualityArchitecture = read('docs/architecture/QUALITY_CENTER_CORE_ORCHESTRATION.md');
if (!qualityArchitecture.includes('read-only') || !qualityArchitecture.includes('Es autorisiert weder Merge noch Release, Deployment oder Produktionsmutation.')) {
  fail('current-main Quality Center authority boundary is missing or semantically unexpected.');
}
const qualityManifest = json('src/platform/Quality/manifest.json');
if (!(qualityManifest.contracts ?? []).includes('quality-center-contract/1.3.0')) {
  fail('current-main Quality Center contract 1.3.0 is missing.');
}
const validatorCoverage = qualityManifest.implementation?.mandatoryValidatorImplementationCoverage;
if (!validatorCoverage || validatorCoverage.total !== 16 || validatorCoverage.available !== 16 || validatorCoverage.notAvailable !== 0) {
  fail('current-main Quality Center mandatory-validator implementation coverage is not the expected 16/16 baseline.');
}
if (!String(qualityManifest.authorityBoundary ?? '').includes('cannot authorize merge')) {
  fail('current-main Quality Center must remain non-authorizing for merge.');
}

const agentIam = read('src/platform/Security/agentIam.ts');
for (const marker of ['AGENT_CAPABILITIES', 'AgentAuthorizationRequest', 'evaluateAgentAuthorization']) {
  if (!agentIam.includes(marker)) fail(`current-main Agent IAM contract marker missing: ${marker}.`);
}
const policyGate = read('src/platform/Compliance/PolicyGate.ts');
if (!policyGate.includes('evaluateAgentPolicy') || !policyGate.includes('evaluateAgentAuthorization(request)')) {
  fail('current-main PolicyGate no longer exposes the provider-neutral Agent IAM composition expected by Documentary.');
}

const adrRegistry = json('docs/adr/registry.json');
const adr0097 = (adrRegistry.migratedRecords ?? []).find((item) => item.displayId === 'ADR-0097');
if (!adr0097) fail('ADR-0097 is missing from docs/adr/registry.json.');
if (adr0097.authorityId !== EXPECTED_AUTHORITY_ID || adr0097.path !== EXPECTED_ADR_PATH) {
  fail('ADR-0097 registry identity/path does not match the maintenance authority.');
}
if (!['proposed', 'accepted', 'accepted-for-implementation'].includes(adr0097.lifecycle)) {
  fail(`ADR-0097 lifecycle is not an active reviewable lifecycle: ${adr0097.lifecycle}.`);
}

const authorityRegistry = json('docs/governance/authority-registry.json');
const authority = (authorityRegistry.entries ?? []).find((item) => item.authorityId === EXPECTED_AUTHORITY_ID);
if (!authority) fail('Documentary maintenance authority is missing from authority-registry.json.');
if (authority.path !== EXPECTED_ADR_PATH) fail('Documentary maintenance authority points to the wrong ADR path.');

const documentRegistry = json('docs/governance/document-registry.json');
for (const [documentId, documentPath] of EXPECTED_DOCUMENTS) {
  const entry = (documentRegistry.entries ?? []).find((item) => item.documentId === documentId);
  if (!entry) fail(`Document Registry entry missing: ${documentId}.`);
  if (entry.path !== documentPath) fail(`${documentId} path mismatch: ${entry.path}.`);
  if (!fs.existsSync(path.join(root, documentPath))) fail(`${documentId} target is missing: ${documentPath}.`);
}

const documentaryManifest = json('src/platform/Documentary/manifest.json');
if (documentaryManifest.version !== '1.12.0') fail(`Documentary component version must be 1.12.0, got ${documentaryManifest.version}.`);
for (const contract of [
  'Discovery/SemanticFreshnessAnalyzer.ts',
  'Agents/DocumentaryMaintenanceAgent.ts',
  'Orchestration/DocumentaryMaintenanceOrchestrator.ts',
  'Observability/DocumentaryMaintenanceObservability.ts',
]) {
  if (!(documentaryManifest.contracts ?? []).includes(contract)) fail(`Documentary manifest contract missing: ${contract}.`);
}
for (const testPath of [
  'tests/unit/documentaryMaintenanceAgent.test.ts',
  'tests/unit/documentaryMaintenanceGitHost.test.ts',
  'tests/unit/documentaryMaintenanceObservability.test.ts',
  'tests/unit/documentaryMaintenanceOrchestrator.test.ts',
  'tests/unit/documentarySemanticFreshness.test.ts',
]) {
  if (!(documentaryManifest.tests ?? []).includes(testPath)) fail(`Documentary manifest test missing: ${testPath}.`);
}
if (!(documentaryManifest.implementation?.implementedAreas ?? []).includes('Observability')) {
  fail('Documentary manifest must declare the implemented maintenance Observability slice.');
}

const host = read('scripts/automation/runDocumentaryMaintenanceControlLoop.ts');
for (const requiredMarker of [
  'sourceCommit must equal current main',
  'remote branch already exists; refusing to reuse mutable agent branch',
  "['push', 'origin', '--delete', branchName]",
  "['add', '--', ...changedPaths]",
  "'open-agent-draft-pr.yml'",
]) {
  if (!host.includes(requiredMarker)) fail(`Git host safety marker missing: ${requiredMarker}.`);
}
if (host.includes("['add', '-A']") || host.includes("['add', '.']") || host.includes('git add -A') || host.includes('git add .')) {
  fail('Git host contains a broad staging pattern.');
}

const agent = read('src/platform/Documentary/Agents/DocumentaryMaintenanceAgent.ts');
for (const marker of [
  'agent/documentary-maintenance-',
  "entry.lifecycle = 'generated'",
  'TOCTOU check failed before apply',
]) {
  if (!agent.includes(marker)) fail(`Maintenance Agent integrity marker missing: ${marker}.`);
}

const freshness = read('src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer.ts');
for (const protectedPrefix of ['docs/adr/', 'docs/archive/', 'docs/compliance/', 'docs/evidence/', 'docs/governance/', 'docs/security/', 'docs/release/']) {
  if (!freshness.includes(`'${protectedPrefix}'`)) fail(`protected review-only prefix missing: ${protectedPrefix}.`);
}

console.log('[DOCUMENTARY-MAINTENANCE-VALIDATION] PASS');
console.log(`[DOCUMENTARY-MAINTENANCE-VALIDATION] branch=${currentBranch}`);
console.log(`[DOCUMENTARY-MAINTENANCE-VALIDATION] main=${originMainSha}`);
console.log(`[DOCUMENTARY-MAINTENANCE-VALIDATION] changedFiles=${changedFiles.length}`);
