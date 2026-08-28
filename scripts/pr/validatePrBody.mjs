#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_MARKER,
  PRODUCTION_BASELINE_END,
  PRODUCTION_BASELINE_START,
  bodyHasGovernanceId,
  extractBaselineGeneratedAt,
  extractProductionBaselineBlock,
  fail,
  githubJson,
  listAddedClaimFiles,
  readJsonFile,
  renderProductionBaselineBlock,
  validateProductionBaselineForPr,
} from './lib.mjs';
import {
  findMissingRequiredSections,
} from './prBodySectionContract.mjs';

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
const baseline = readJsonFile(baselinePath);

function bodyHasEvidenceToken(bodyText, token) {
  const value = String(token || '').trim();
  if (!value) return true;
  if (bodyText.includes(value)) return true;
  if (/^[0-9a-f]{40}$/i.test(value) && bodyText.includes(value.slice(0, 12))) return true;
  return false;
}

function occurrenceCount(text, needle) {
  if (!needle) return 0;
  return String(text || '').split(needle).length - 1;
}

if (!body.includes(PR_TEMPLATE_MARKER)) {
  fail(`PR #${prNumber} verwendet nicht den Marker der kanonischen Vorlage: ${PR_TEMPLATE_MARKER}`);
}

const missingSections = findMissingRequiredSections(body);
if (missingSections.length > 0) {
  fail(`PR #${prNumber} enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ${missingSections.join(', ')}`);
}

const requiredIds = [PRODUCTION_BASELINE_START, PRODUCTION_BASELINE_END];
const missingIds = requiredIds.filter((id) => !bodyHasGovernanceId(body, id));
if (missingIds.length > 0) {
  fail(`PR #${prNumber} fehlt mindestens eine maschinenlesbare Governance-ID: ${missingIds.join(', ')}`);
}

for (const id of requiredIds) {
  const commentMarker = `<!-- ${id} -->`;
  const visibleMarker = `\`${id}\``;
  if (occurrenceCount(body, commentMarker) !== 1 || occurrenceCount(body, visibleMarker) !== 1) {
    fail(
      `PR #${prNumber} muss ${id} genau einmal als HTML-Kommentar und genau einmal sichtbar enthalten. ` +
        `Duplizierte Baseline-Blöcke sind nicht zulässig.`,
    );
  }
}

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(`PR #${prNumber} enthält nicht aufgelöste Vorlagenplatzhalter: ${[...new Set(unresolved)].join(', ')}`);
}

// Atomare Produktions-Baseline: Der Body darf die Identitäten nicht selbst
// konstruieren. Alle produktions-, main- und head-bezogenen Felder müssen zu
// genau der Baseline-ID passen, die der aktuelle trusted-main Preflight erzeugt.
const baselineErrors = validateProductionBaselineForPr(baseline);
if (baselineErrors.length > 0) {
  fail(`Aktuelle CI-Baseline ist nicht valide: ${baselineErrors.join('; ')}`);
}

const bodyBaselineBlock = extractProductionBaselineBlock(body);
if (!bodyBaselineBlock) {
  fail(`PR #${prNumber} enthält keinen eindeutig abgegrenzten Produktions-Baseline-Block.`);
}

const bodyGeneratedAt = extractBaselineGeneratedAt(bodyBaselineBlock);
if (!bodyGeneratedAt || Number.isNaN(Date.parse(bodyGeneratedAt))) {
  fail(`PR #${prNumber} enthält keinen gültigen Zeitstempel für die Produktions-Baseline.`);
}

const expectedBaselineBlock = renderProductionBaselineBlock({
  ...baseline,
  generatedAt: bodyGeneratedAt,
});

const normalizeBlock = (value) => String(value || '').replace(/\r\n/g, '\n').trim();
if (normalizeBlock(bodyBaselineBlock) !== normalizeBlock(expectedBaselineBlock)) {
  fail(
    `PR #${prNumber} enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline. ` +
      `Erwartete aktuelle Baseline-ID: ${baseline.baselineId}. ` +
      `Automatic Production Baseline Reconciliation pending: Der trusted Baseline-Writer aktualisiert ` +
      `bei einem bereits offenen PR nach Abschluss dieses Governance-Laufs ausschließlich den ` +
      `kanonischen Block über productionPreflight.mjs -> updatePrProductionBaseline.mjs -> ` +
      `productionBaselineBody.mjs und bindet den einmaligen Governance-Re-Run an denselben ` +
      `PR-Head und main-Base. Für die initiale PR-Erzeugung bleibt ` +
      `productionPreflight.mjs -> renderPullRequestBody.mjs kanonisch. ` +
      `Manuelle Einzelwert-Korrekturen sind nicht zulässig.`,
  );
}

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length > 1) {
  fail(`Es wird höchstens ein neuer Work-Claim im PR-Diff erwartet; gefunden: ${claims.length}.`);
}

if (claims.length === 1) {
  const claimPath = claims[0];
  const claim = readJsonFile(claimPath);
  const durableTokens = [claim.claimId, claimPath].filter(Boolean).map(String);
  const missingEvidence = durableTokens.filter((value) => !bodyHasEvidenceToken(body, value));
  if (missingEvidence.length > 0) {
    fail(
      `PR #${prNumber} fehlt dauerhafte Claim-Nachweise im Body: ${missingEvidence.join(', ')}. ` +
        `Erforderlich: Claim-ID und Claim-Pfad.`,
    );
  }
} else {
  console.log(`[PR-VORLAGE] PR #${prNumber}: kein neuer Work-Claim im Diff; Claim-Evidence-Pflicht entfällt.`);
}

if (!body.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
  fail('Der kanonische PR muss die Human-/CODEOWNER-Freigabe ausdrücklich beibehalten.');
}

console.log(
  `[PR-VORLAGE] PR #${prNumber} entspricht Vorlagenvertrag v1.5.0; ` +
    `Baseline ${baseline.baselineId} bindet Production/main/head und Drift atomar an den aktuellen Preflight.`,
);
