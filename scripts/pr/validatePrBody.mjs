#!/usr/bin/env node

import fs from 'node:fs';
import {
  PR_TEMPLATE_MARKER,
  bodyHasGovernanceId,
  fail,
  githubJson,
  listAddedClaimFiles,
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

/**
 * Normalize section headings for matching: collapse whitespace, unify dash variants.
 * Agents/connectors often substitute ASCII hyphen for em-dash (U+2014) or en-dash (U+2013).
 */
function normalizeHeading(text) {
  return String(text || '')
    .replace(/[\u2014\u2013\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function bodyHasSection(bodyText, requiredHeading) {
  if (bodyText.includes(requiredHeading)) return true;
  const normalizedBody = normalizeHeading(bodyText);
  const normalizedRequired = normalizeHeading(requiredHeading);
  return normalizedBody.includes(normalizedRequired);
}

/**
 * Evidence token is present if the full value or (for 40-char SHAs) a stable 12-char prefix
 * appears in the body.
 */
function bodyHasEvidenceToken(bodyText, token) {
  const value = String(token || '').trim();
  if (!value) return true;
  if (bodyText.includes(value)) return true;
  // Accept short SHA form for full 40-char commit hashes (common in baseline tables).
  if (/^[0-9a-f]{40}$/i.test(value) && bodyText.includes(value.slice(0, 12))) return true;
  return false;
}

// 1) Kanonischer Template-Marker (sichtbar und/oder in Comment)
if (!body.includes(PR_TEMPLATE_MARKER)) {
  fail(`PR #${prNumber} verwendet nicht den Marker der kanonischen Vorlage: ${PR_TEMPLATE_MARKER}`);
}

// 2) Pflichtabschnitte (v1.4.0: Abschnitt 8 = Merge-Autorisierung vereinfacht)
// Dash-tolerant matching avoids false failures when agents use ASCII "-" instead of "—".
const requiredSections = [
  '## 1. Arbeitsauftrag',
  '## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe',
  '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
  '## 4. Umfang / Multi-Agent-Koordination',
  '## 5. Änderungszusammenfassung',
  '## 6. Architektur- / Governance-Auswirkungen',
  '## 7. Sicherheitsprüfung',
  '### Threat Model',
  '### Negative Tests',
  '### Rollback / Runbook',
  '## 8. Merge-Autorisierung (vereinfacht)',
  '## 9. PR-Checkklasse und auszuführende Checks',
  '## 10. Technische Validierungsnachweise',
  '## 11. Risiko und Rücksetzung',
  '## 12. Prüf- und Merge-Bereitschaft',
];

const missingSections = requiredSections.filter((heading) => !bodyHasSection(body, heading));
if (missingSections.length > 0) {
  fail(
    `PR #${prNumber} enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ${missingSections.join(', ')}`,
  );
}

// 3) Governance-IDs: Baseline only (Owner-Attestation-IDs retired 2026-08-16)
const requiredIds = [
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
];
const missingIds = requiredIds.filter((id) => !bodyHasGovernanceId(body, id));
if (missingIds.length > 0) {
  fail(
    `PR #${prNumber} fehlt mindestens eine maschinenlesbare Governance-ID (Comment oder sichtbare Form): ${missingIds.join(', ')}`,
  );
}

// 4) Keine unaufgelösten Platzhalter
const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) {
  fail(
    `PR #${prNumber} enthält nicht aufgelöste Vorlagenplatzhalter: ${[...new Set(unresolved)].join(', ')}`,
  );
}

// 5) Work-Claim: Agent-PRs höchstens einer; Human-PRs ohne neuen Claim sind zulässig.
// Durable evidence only: claimId + claim path.
// Production version/commitSha are intentionally NOT required in the body:
// they are only known after CI preflight runs, so agents cannot reliably put them
// at PR-creation time without placeholders that then fail the match.
// Production identity remains enforced by the preflight job + baseline markers.
// Head-/main-SHAs remain non-required (ephemeral on every push/rebase).
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
        `Erforderlich: Claim-ID und Claim-Pfad. ` +
        `Produktionsversion/-Commit und Head-/main-SHAs sind bewusst nicht mehr Body-pflichtig ` +
        `(Preflight + Baseline-Marker decken die Produktionsidentität ab; SHAs ändern sich bei jedem Push).`,
    );
  }
} else {
  console.log(
    `[PR-VORLAGE] PR #${prNumber}: kein neuer Work-Claim im Diff (Human-/UI-Pfad); Claim-Evidence-Pflicht entfällt.`,
  );
}

// 6) Explizite Human-/CODEOWNER-Merge-Freigabe bleibt im Contract
if (!body.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
  fail('Der kanonische PR muss die Human-/CODEOWNER-Freigabe ausdrücklich beibehalten.');
}

console.log(
  `[PR-VORLAGE] PR #${prNumber} entspricht dem kanonischen Vorlagenvertrag v1.4.2 ` +
    `(Abschnitte dash-tolerant, Marker, Freigabe; durable Claim-ID/Pfad only; ` +
    `production version/SHA und ephemere head/main-SHAs nicht body-pflichtig; Owner-Checkbox-Gate retired).`,
);
