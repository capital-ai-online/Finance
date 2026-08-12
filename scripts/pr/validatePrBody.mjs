#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_MARKER,
  classifyPullRequestScope,
  fail,
  githubJson,
  listAddedClaimFiles,
  listChangedFiles,
  readJsonFile,
} from './lib.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const prNumber = Number(process.env.PR_NUMBER || 0);
const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
if (!repository) fail('GITHUB_REPOSITORY fehlt.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN fehlt.');
if (!prNumber) fail('PR_NUMBER ist für die PR-Vorlagenprüfung erforderlich.');
if (!fs.existsSync(baselinePath)) fail(`Produktions-Baseline fehlt: ${baselinePath}`);

const pr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
const body = String(pr.body || '');
if (!body.includes(PR_TEMPLATE_MARKER)) {
  fail(`PR #${prNumber} verwendet nicht den Marker der kanonischen Vorlage: ${PR_TEMPLATE_MARKER}`);
}

const requiredSections = [
  '## 1. Kurz erklärt',
  '## 2. Automatisch erkannte Prüfungen',
  '## 3. Nachvollziehbarkeit',
  '## 4. Sicherheit und Rückweg',
  '## 5. Human / Owner Review VOR technischer CI',
  '## 6. Automatisch synchronisierte Nachweise',
  '## 7. Was kann man aus diesem PR lernen?',
  '## 8. Merge-Bereitschaft',
];
const missingSections = requiredSections.filter((heading) => !body.includes(heading));
if (missingSections.length > 0) {
  fail(`PR #${prNumber} enthält nicht alle Pflichtabschnitte der kanonischen Lernvorlage: ${missingSections.join(', ')}`);
}

const requiredMarkers = [
  'CAPITAL_AI_AUTO_CLASSIFICATION_START',
  'CAPITAL_AI_AUTO_CLASSIFICATION_END',
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  'CAPITAL_AI_MACHINE_EVIDENCE_START',
  'CAPITAL_AI_MACHINE_EVIDENCE_END',
  'CAPITAL_AI_MACHINE_MERGE_START',
  'CAPITAL_AI_MACHINE_MERGE_END',
  'CAPITAL_AI_SYNC_HEAD_SHA',
];
for (const marker of requiredMarkers) {
  if (!body.includes(marker)) fail(`PR #${prNumber} enthält den Pflichtmarker ${marker} nicht.`);
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR #${prNumber} enthält nicht aufgelöste Vorlagenplatzhalter: ${[...new Set(unresolved)].join(', ')}`);
}

const humanLabels = [
  'Human/Owner: vollständigen PR-Diff geprüft.',
  'Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.',
];
for (const statement of humanLabels) {
  if (!body.includes(statement)) fail(`PR #${prNumber} enthält die kanonische Owner-Attestation nicht: ${statement}`);
}

const machinePatterns = [
  /<!-- CAPITAL_AI_MACHINE_EVIDENCE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_EVIDENCE_END -->/g,
  /<!-- CAPITAL_AI_MACHINE_MERGE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_MERGE_END -->/g,
];
let bodyWithoutMachine = body;
for (const pattern of machinePatterns) bodyWithoutMachine = bodyWithoutMachine.replace(pattern, '');
const manualCheckboxes = [...bodyWithoutMachine.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/gm)].map((match) => match[1].trim());
if (manualCheckboxes.length !== 2 || humanLabels.some((label) => !manualCheckboxes.includes(label))) {
  fail(`PR #${prNumber} darf außerhalb maschinenverwalteter Blöcke exakt zwei manuelle Checkboxen besitzen: die beiden Human/Owner-Attestations.`);
}

for (const pattern of machinePatterns) {
  const match = body.match(new RegExp(pattern.source));
  if (!match) continue;
  const machineCheckboxes = [...match[0].matchAll(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/gm)].map((item) => item[1].trim());
  if (machineCheckboxes.length === 0) fail(`PR #${prNumber} enthält einen leeren maschinenverwalteten Checkbox-Block.`);
  if (machineCheckboxes.some((label) => !label.startsWith('🤖'))) {
    fail(`PR #${prNumber} enthält eine nicht als 🤖 gekennzeichnete Checkbox in einem maschinenverwalteten Block.`);
  }
}

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length > 1) fail(`Es ist höchstens ein Work-Claim im PR-Diff zulässig; gefunden: ${claims.length}.`);
const claimPath = claims[0] || null;
const claim = claimPath ? readJsonFile(claimPath) : null;
const baseline = readJsonFile(baselinePath);
const changedFiles = listChangedFiles(baseRef, headRef);
const classification = classifyPullRequestScope(changedFiles, {
  externalMutation: claim?.externalMutation || 'NONE',
  executionProfile: claim?.executionProfile || '',
});
const classNames = {
  D: 'D — Dokumentation',
  C: 'C — Anwendung/Test/Konfiguration',
  R: 'R — Runtime/CI/Dependency/Deployment',
  M: 'M — externe Produktionsänderung',
};

const syncHeadMatch = body.match(/<!--\s*CAPITAL_AI_SYNC_HEAD_SHA:\s*([0-9a-f]{40})\s*-->/i);
if (!syncHeadMatch || syncHeadMatch[1].toLowerCase() !== String(pr.head?.sha || '').toLowerCase()) {
  fail(`PR #${prNumber} ist nicht auf den aktuellen Head ${pr.head?.sha || 'unknown'} synchronisiert.`);
}

const requiredEvidence = [
  `Repository-Scope:** ${classNames[classification.repositoryClass]}`,
  `Wirksame Checkklasse:** ${classNames[classification.checkClass]}`,
  `Execution Profile:** ${classification.executionProfile}`,
  `Externe Produktionsmutation:** ${classification.externalMutation}`,
  baseline.main?.sha,
  baseline.head?.sha,
  ...(claim ? [baseline.production?.commitSha, baseline.production?.version, claim.claimId, claimPath] : []),
].filter(Boolean).map(String);
const missingEvidence = requiredEvidence.filter((value) => !body.includes(value));
if (missingEvidence.length > 0) {
  fail(`PR #${prNumber} ist veraltet oder falsch klassifiziert; folgende maschinelle Evidence fehlt: ${missingEvidence.join(', ')}`);
}
for (const area of classification.featureAreas) {
  if (!body.includes(area)) fail(`PR #${prNumber} erklärt den automatisch erkannten Feature-Bereich nicht: ${area}`);
}
for (const check of classification.requiredChecks) {
  if (!body.includes(check)) fail(`PR #${prNumber} listet den erforderlichen Check nicht: ${check}`);
}
if (!body.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
  fail('Der kanonische PR muss die Human-/CODEOWNER-Freigabe ausdrücklich beibehalten.');
}

console.log(`[PR-VORLAGE] PR #${prNumber} nutzt die Lernvorlage, Klasse ${classification.checkClass}, Profil ${classification.executionProfile}; exakt zwei Human-Checkboxen bleiben manuell, technische Checkboxen sind maschinenverwaltet.`);
