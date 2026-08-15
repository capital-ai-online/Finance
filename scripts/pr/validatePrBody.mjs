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

// 1) Kanonischer Template-Marker (sichtbar und/oder in Comment)
if (!body.includes(PR_TEMPLATE_MARKER)) {
  fail(`PR #${prNumber} verwendet nicht den Marker der kanonischen Vorlage: ${PR_TEMPLATE_MARKER}`);
}

// 2) Pflichtabschnitte
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
  '## 8. Human / Owner Review VOR technischer CI',
  '## 9. PR-Checkklasse und auszuführende Checks',
  '## 10. Technische Validierungsnachweise',
  '## 11. Risiko und Rücksetzung',
  '## 12. Prüf- und Merge-Bereitschaft',
];

const missingSections = requiredSections.filter((heading) => !body.includes(heading));
if (missingSections.length > 0) {
  fail(
    `PR #${prNumber} enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ${missingSections.join(', ')}`,
  );
}

// 3) Governance-IDs: HTML-Kommentar und/oder sichtbare Fallback-Zeile
const requiredIds = [
  'CAPITAL_AI_PRODUCTION_BASELINE_START',
  'CAPITAL_AI_PRODUCTION_BASELINE_END',
  'CAPITAL_AI_OWNER_DIFF_ATTESTATION',
  'CAPITAL_AI_OWNER_FILES_ATTESTATION',
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

// 5) Work-Claim: Agent-PRs höchstens einer; Human-PRs ohne neuen Claim sind zulässig (ADR-0039 advisory)
const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length > 1) {
  fail(`Es wird höchstens ein neuer Work-Claim im PR-Diff erwartet; gefunden: ${claims.length}.`);
}

if (claims.length === 1) {
  const claimPath = claims[0];
  const claim = readJsonFile(claimPath);
  const baseline = readJsonFile(baselinePath);

  const evidenceTokens = [
    claim.claimId,
    claimPath,
    baseline.main?.sha,
    baseline.head?.sha,
    baseline.production?.commitSha,
    baseline.production?.version,
  ].filter(Boolean).map(String);

  const missingEvidence = evidenceTokens.filter((value) => !body.includes(value));
  if (missingEvidence.length > 0) {
    fail(
      `PR #${prNumber} ist veraltet oder nicht maschinell gerendert; folgende Claim-/Baseline-Nachweise fehlen: ${missingEvidence.join(', ')}`,
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
  `[PR-VORLAGE] PR #${prNumber} entspricht dem kanonischen Vorlagenvertrag (Abschnitte, Marker, Freigabe).`,
);
