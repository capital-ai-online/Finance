#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_VERSION,
  detectPrTemplateVersion,
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
import {
  PR_DECISION_GATES,
  deriveDecisionStatus,
  extractDecisionGates,
  extractDecisionStatus,
} from './prDecisionState.mjs';

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

const templateVersion = detectPrTemplateVersion(body);
if (!templateVersion) {
  fail(
    `PR #${prNumber} verwendet keinen unterstützten PR-Vorlagenmarker. ` +
      `Aktuell kanonisch ist v${PR_TEMPLATE_VERSION}; v1.6.0 und v1.5.0 bleiben nur für bereits offene PRs kompatibel.`,
  );
}

const missingSections = findMissingRequiredSections(body);
if (missingSections.length > 0) {
  fail(`PR #${prNumber} enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ${missingSections.join(', ')}`);
}

if (templateVersion === PR_TEMPLATE_VERSION) {
  const decisionStatus = extractDecisionStatus(body);
  const decisionGates = extractDecisionGates(body);
  const missingDecisionGates = PR_DECISION_GATES
    .filter(({ key }) => !decisionGates[key])
    .map(({ label }) => label);
  if (!decisionStatus) {
    fail(`PR #${prNumber} enthält keinen gültigen automatisch ableitbaren Entscheidungsstatus der Vorlage v${PR_TEMPLATE_VERSION}.`);
  }
  if (missingDecisionGates.length > 0) {
    fail(`PR #${prNumber} fehlt kanonische Decision-Evidence: ${missingDecisionGates.join(', ')}.`);
  }

  const derivedDecisionStatus = deriveDecisionStatus(decisionGates);
  if (decisionStatus !== derivedDecisionStatus) {
    fail(
      `PR #${prNumber} behauptet Decision Status ${decisionStatus}, aber die sichtbaren Gate-Zustände ergeben ${derivedDecisionStatus}. ` +
        'Decision Status darf nicht manuell von der Evidence abweichen.',
    );
  }

  const visibleLevelTwoHeadings = body.match(/^## .+$/gm) || [];
  const expectedV17Headings = [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ];
  if (
    visibleLevelTwoHeadings.length !== expectedV17Headings.length ||
    !expectedV17Headings.every((heading, index) => visibleLevelTwoHeadings[index] === heading)
  ) {
    fail(
      `PR #${prNumber} muss in v${PR_TEMPLATE_VERSION} exakt drei sichtbare Hauptabschnitte besitzen: ` +
        expectedV17Headings.join(', '),
    );
  }
  if (!body.includes('<summary>Technische Details & Traceability</summary>')) {
    fail(`PR #${prNumber} muss technische Traceability in v${PR_TEMPLATE_VERSION} standardmäßig einklappen.`);
  }
  if (!body.includes('<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>')) {
    fail(`PR #${prNumber} muss die maschinenlesbare Baseline in v${PR_TEMPLATE_VERSION} standardmäßig einklappen.`);
  }

  const priority = body.match(/^- \*\*Priorität:\*\* (.+)$/m)?.[1]?.trim();
  const versionImpact = body.match(/^- \*\*Versionsimpact:\*\* (.+)$/m)?.[1]?.trim();
  const versionManagerCheck = body.match(/^- \*\*Version-Manager-Check:\*\* (.+)$/m)?.[1]?.trim();

  const allowedPriorities = new Set(['P0 🔴 Kritisch', 'P1 🟠 Hoch', 'P2 🟡 Normal', 'P3 🟢 Niedrig']);
  const allowedVersionImpacts = new Set(['NOT_EVALUATED ⚪', 'NONE ➖', 'PATCH 🩹', 'MINOR ✨', 'MAJOR 💥']);

  if (!allowedPriorities.has(priority)) {
    fail(`PR #${prNumber} enthält keine gültige Prioritätsbewertung (P0–P3) der Vorlage v${PR_TEMPLATE_VERSION}.`);
  }
  if (!allowedVersionImpacts.has(versionImpact)) {
    fail(`PR #${prNumber} enthält keinen gültigen Versionsimpact der Vorlage v${PR_TEMPLATE_VERSION}.`);
  }
  if (!versionManagerCheck) {
    fail(`PR #${prNumber} enthält keinen Version-Manager-Check-Status.`);
  }
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
      `Erzeuge den PR-Body erneut über productionPreflight.mjs -> renderPullRequestBody.mjs; ` +
      `manuelle Einzelwert-Korrekturen sind nicht zulässig.`,
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
if (templateVersion === PR_TEMPLATE_VERSION && !body.includes('| Owner-Aktion | Human/CODEOWNER Merge erforderlich |')) {
  fail('Die Human Decision Card muss die verbleibende Owner-Aktion ausdrücklich als Human/CODEOWNER Merge ausweisen.');
}

console.log(
  `[PR-VORLAGE] PR #${prNumber} entspricht unterstütztem Vorlagenvertrag v${templateVersion}; ` +
    `Baseline ${baseline.baselineId} bindet Production/main/head und Drift atomar an den aktuellen Preflight.`,
);
