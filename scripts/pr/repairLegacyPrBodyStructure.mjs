#!/usr/bin/env node

import {
  PR_TEMPLATE_VERSION,
  appendGithubOutput,
  detectPrTemplateVersion,
  fail,
  githubJson,
  listAddedClaimFiles,
  readJsonFile,
} from './lib.mjs';
import {
  canonicalizeKnownSectionHeadings,
  findMissingRequiredSections,
} from './prBodySectionContract.mjs';

const SECTION_PROJECT = '## 2. 📦 Projekt & Scope';
const SECTION_ROADMAP = '## 4. 📌 Priorität & Roadmap';
const SECTION_VERSION = '## 5. 🔢 Version & PR-Klasse';
const SECTION_CHECK = '## 6. ✅ Prüfung & Merge';

const LEGACY_REPAIR_TARGET_VERSION = '1.6.0';
const LEGACY_REPAIR_TARGET_MARKER = `CAPITAL_AI_PR_TEMPLATE_VERSION: ${LEGACY_REPAIR_TARGET_VERSION}`;

export const LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS = Object.freeze([
  Object.freeze([
    SECTION_ROADMAP,
    SECTION_VERSION,
    SECTION_CHECK,
  ]),
  Object.freeze([
    SECTION_ROADMAP,
    SECTION_CHECK,
  ]),
  Object.freeze([
    SECTION_PROJECT,
    SECTION_ROADMAP,
    SECTION_VERSION,
    SECTION_CHECK,
  ]),
]);

function occurrenceCount(text, needle) {
  return String(text || '').split(needle).length - 1;
}

function sameOrderedValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function upgradeRepairedBodyToLegacyTarget(bodyText) {
  let body = String(bodyText || '');
  body = body.replace(/CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.5\.0/g, LEGACY_REPAIR_TARGET_MARKER);
  body = canonicalizeKnownSectionHeadings(body);

  if (!body.includes('- **Priorität:** ')) {
    body = body.replace(
      SECTION_ROADMAP,
      [
        SECTION_ROADMAP,
        '',
        '- **Priorität:** P2 🟡 Normal',
        '- **Warum diese Priorität:** Bestehender PR; keine P0/P1-Eskalation ist im vorhandenen Body belegt.',
      ].join('\n'),
    );
  }

  if (!body.includes('- **Versionsimpact:** ')) {
    body = body.replace(
      SECTION_VERSION,
      [
        SECTION_VERSION,
        '',
        '- **Versionsimpact:** NOT_EVALUATED ⚪',
        '- **Versionsbegründung:** Bestehender PR; keine deterministische Versionsevidence ist im Body belegt.',
        '- **Version-Manager-Check:** NOT_RUN — separate fokussierte PR-Check-Evidence erforderlich.',
      ].join('\n'),
    );
  }

  return body;
}

function quoteExistingBodyAsEvidence(bodyText) {
  return String(bodyText || '')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.length > 0 ? `> ${line}` : '>')
    .join('\n');
}

function bootstrapMarkerlessBody(bodyText, { prClass, durableClaimEvidence = [] }) {
  const body = String(bodyText || '').trim();
  if (!body) return { eligible: false, changed: false, reason: 'empty-markerless-body', body };
  if (!['D', 'C', 'R'].includes(String(prClass))) {
    throw new Error('Trusted PR class must be one of D/C/R before markerless template bootstrap.');
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(body)) {
    return { eligible: false, changed: false, reason: 'markerless-body-has-unresolved-placeholders', body };
  }
  if (/CAPITAL_AI_PRODUCTION_BASELINE_(?:START|END)/.test(body)) {
    return { eligible: false, changed: false, reason: 'markerless-body-has-baseline-markers', body };
  }

  const evidence = [...new Set(durableClaimEvidence.map((value) => String(value || '').trim()).filter(Boolean))];
  const repaired = [
    '<!-- ' + LEGACY_REPAIR_TARGET_MARKER + ' -->',
    '`' + LEGACY_REPAIR_TARGET_MARKER + '`',
    '# CAPITAL-AI Pull Request',
    '',
    `> **P2 🟡 Normal · NOT_EVALUATED ⚪ · PR-Klasse ${prClass}**`,
    '> Bestehender PR-Body wurde deterministisch in den kanonischen v1.6-Rahmen überführt; fachlicher Inhalt bleibt als Evidence erhalten.',
    '',
    '## 1. 🎯 Kurzüberblick',
    '',
    '- **Warum:** PR-Governance hat einen markerlosen bestehenden PR-Body erkannt.',
    '- **Ziel / Exit Gate:** Kanonischen v1.6-Metadatenrahmen herstellen, ohne fachliche Aussagen des bestehenden Bodys neu zu bewerten.',
    '',
    SECTION_PROJECT,
    '',
    '- **Projekt / Owner / PVC:** aus bestehendem PR-Inhalt und Repository-Evidence; Autofix erzeugt keine neue Ownership-Aussage.',
    ...evidence.map((value) => `- **Dauerhafte Claim-Evidence:** ${value}`),
    '',
    '## 3. 🛠️ Umsetzung',
    '',
    '### Vorheriger PR-Body — unveränderte Evidence',
    '',
    quoteExistingBodyAsEvidence(body),
    '',
    SECTION_ROADMAP,
    '',
    '- **Priorität:** P2 🟡 Normal',
    '- **Warum diese Priorität:** Konservativer Autofix-Default; keine P0/P1-Eskalation wird aus markerlosem Freitext erfunden.',
    '- **Roadmap / Work Package:** N/A — bestehender PR; Autofix erzeugt keine neue Task-Autorität.',
    '',
    SECTION_VERSION,
    '',
    '- **Versionsimpact:** NOT_EVALUATED ⚪',
    '- **Versionsbegründung:** Markerloser Alt-Body liefert keine deterministische Versionsevidence.',
    '- **Version-Manager-Check:** NOT_RUN — repositoryseitige Checks liefern die technische Evidence; keine separate Start-Freigabe erforderlich.',
    `- **PR-Klasse:** ${prClass}`,
    '- **Klassenbegründung:** Von trusted-main classifyPrScope übernommen.',
    '- **Erforderliche Checks:** gemäß trusted-main PR-Klasse.',
    '',
    SECTION_CHECK,
    '',
    '- **Main synchronisiert:** durch exact-head/base Specialist-Grenze gebunden.',
    '- **Changed-File-/Semantic-Overlap:** wird außerhalb dieses Body-Autofix weiterhin fail-closed korreliert.',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '- **Agent-Self-Merge / Auto-Merge:** Nein',
    '',
    '## 7. Maschinenlesbare Baseline',
    '',
  ].join('\n');

  if (detectPrTemplateVersion(repaired) !== LEGACY_REPAIR_TARGET_VERSION) {
    throw new Error('Markerless template bootstrap did not converge to v1.6.');
  }
  const missingAfter = findMissingRequiredSections(repaired);
  if (missingAfter.length > 0) {
    throw new Error('Markerless template bootstrap left missing sections: ' + missingAfter.join(', '));
  }
  return { eligible: true, changed: true, reason: 'markerless-body-bootstrapped-to-v1.6', body: repaired };
}
export function repairLegacyPrBodyStructure(bodyText, { prClass = 'N/A', durableClaimEvidence = [] } = {}) {
  const body = String(bodyText || '');
  const detectedVersion = detectPrTemplateVersion(body);

  // v1.7 is the canonical Human Decision contract and is owned by the normal
  // renderer/validator path. Legacy repair must never rewrite a valid current
  // contract or manufacture Decision Evidence.
  if (detectedVersion === PR_TEMPLATE_VERSION) {
    return { eligible: false, changed: false, reason: 'current-v1.7-owned-by-canonical-renderer', body };
  }

  const missing = findMissingRequiredSections(
    body,
    detectedVersion || LEGACY_REPAIR_TARGET_VERSION,
  );
  const canonicalMergeGate = '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja';
  const currentNonCanonicalMergeGate = '- **Human-/CODEOWNER-Merge erforderlich:** Ja';

  if (missing.length === 0) {
    // A structurally complete body without a supported marker is a deterministic
    // metadata-drift case. Preserve all existing content and only prepend the
    // canonical v1.6.0 marker pair; later baseline refresh remains specialist-owned.
    if (!detectPrTemplateVersion(body)) {
      const repaired = [
        '<!-- ' + LEGACY_REPAIR_TARGET_MARKER + ' -->',
        '`' + LEGACY_REPAIR_TARGET_MARKER + '`',
        body,
      ].join('\n');
      if (detectPrTemplateVersion(repaired) !== LEGACY_REPAIR_TARGET_VERSION) {
        throw new Error('Missing-marker repair did not converge to the current template version.');
      }
      return {
        eligible: true,
        changed: true,
        reason: 'missing-template-marker-upgraded-to-v1.6',
        body: repaired,
      };
    }
    if (
      detectPrTemplateVersion(body) &&
      !body.includes(canonicalMergeGate) &&
      body.includes(currentNonCanonicalMergeGate)
    ) {
      const repaired = body.replace(currentNonCanonicalMergeGate, canonicalMergeGate);
      if (repaired === body) {
        throw new Error('Current-template merge-gate repair did not change the PR body.');
      }
      if (!repaired.includes(canonicalMergeGate)) {
        throw new Error('Current-template merge-gate repair did not converge.');
      }
      return {
        eligible: true,
        changed: true,
        reason: 'current-template-merge-gate-normalized',
        body: repaired,
      };
    }
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }
  if (!detectPrTemplateVersion(body)) {
    return bootstrapMarkerlessBody(body, { prClass, durableClaimEvidence });
  }
  const fullLegacyMissing = sameOrderedValues(
    missing,
    LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS[0],
  );
  const partialLegacyMissing = sameOrderedValues(
    missing,
    LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS[1],
  );
  const projectOwnerLegacyMissing = sameOrderedValues(
    missing,
    LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS[2],
  );
  if (!fullLegacyMissing && !partialLegacyMissing && !projectOwnerLegacyMissing) {
    return {
      eligible: false,
      changed: false,
      reason: 'unsupported-missing-sections:' + missing.join(','),
      body,
    };
  }
  if (!['D', 'C', 'R'].includes(String(prClass))) {
    throw new Error('Trusted PR class must be one of D/C/R before template repair.');
  }

  const baselineStartBefore = occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_START');
  const baselineEndBefore = occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_END');

  const currentV16SecurityBoundaryShape =
    fullLegacyMissing &&
    detectPrTemplateVersion(body) === LEGACY_REPAIR_TARGET_VERSION &&
    [...body.matchAll(/^## 4\. 🔐 Security Boundary\s*$/gm)].length === 1 &&
    [...body.matchAll(/^## 5\. ✅ Prüfung & Merge\s*$/gm)].length === 1 &&
    [...body.matchAll(/^## 6\. 🔢 Version\s*$/gm)].length === 1;

  const currentV16SecurityBoundaryLikeHeading =
    detectPrTemplateVersion(body) === LEGACY_REPAIR_TARGET_VERSION &&
    /^## 4\. 🔐 Security Boundar.*$/m.test(body);

  const currentV16GenericMissingSectionsShape =
    fullLegacyMissing &&
    detectPrTemplateVersion(body) === LEGACY_REPAIR_TARGET_VERSION &&
    occurrenceCount(body, '## 7. Maschinenlesbare Baseline') === 1 &&
    !currentV16SecurityBoundaryLikeHeading;

  if (currentV16SecurityBoundaryShape) {
    const malformedBlock = body.match(
      /^## 4\. 🔐 Security Boundary\s*\n([\s\S]*?)^## 5\. ✅ Prüfung & Merge\s*\n([\s\S]*?)^## 6\. 🔢 Version\s*\n([\s\S]*?)(?=^## 7\. Maschinenlesbare Baseline\s*$)/m,
    );
    if (!malformedBlock) {
      return { eligible: false, changed: false, reason: 'unsupported-current-v1.6-security-shape', body };
    }

    const securityBoundary = String(malformedBlock[1] || '').trim();
    const checkBody = String(malformedBlock[2] || '').trim();
    let versionBody = String(malformedBlock[3] || '').trim();
    if (!securityBoundary || !checkBody || !versionBody) {
      return { eligible: false, changed: false, reason: 'incomplete-current-v1.6-security-shape', body };
    }

    const priority =
      body.match(/^> \*\*(P[0-3] (?:🔴 Kritisch|🟠 Hoch|🟡 Normal|🟢 Niedrig)) ·/m)?.[1] ||
      'P2 🟡 Normal';
    if (!/^- \*\*Version-Manager-Check:\*\*/m.test(versionBody)) {
      versionBody +=
        '\n- **Version-Manager-Check:** NOT_RUN — separate fokussierte PR-Check-Evidence erforderlich.';
    }

    const replacement = [
      '### 🔐 Security Boundary',
      '',
      securityBoundary,
      '',
      SECTION_ROADMAP,
      '',
      '- **Priorität:** ' + priority,
      '- **Warum diese Priorität:** Aus der bestehenden PR-Prioritätszeile übernommen; der Autofix bewertet die Priorität nicht neu.',
      '- **Roadmap / Work Package:** N/A — deterministische Reparatur eines bestehenden PR-Bodys; keine Roadmap-Autorität wird erzeugt.',
      '',
      SECTION_VERSION,
      '',
      versionBody,
      '',
      SECTION_CHECK,
      '',
      checkBody,
      '',
    ].join('\n');
    let repaired = body.replace(malformedBlock[0], () => replacement);

    repaired = upgradeRepairedBodyToLegacyTarget(repaired);
    const missingAfter = findMissingRequiredSections(repaired);
    if (missingAfter.length > 0) {
      throw new Error('Current v1.6 security-boundary repair did not converge: ' + missingAfter.join(', '));
    }
    if (!repaired.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
      throw new Error('Current v1.6 security-boundary repair did not preserve the Human/CODEOWNER merge gate.');
    }
    if (
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !== baselineStartBefore ||
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !== baselineEndBefore
    ) {
      throw new Error('Current v1.6 security-boundary repair changed production-baseline marker cardinality.');
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'current-v1.6-security-boundary-shape-repaired',
      body: repaired,
    };
  }

  if (currentV16GenericMissingSectionsShape) {
    const baselineHeading = '## 7. Maschinenlesbare Baseline';
    const baselineIndex = body.indexOf(baselineHeading);
    if (baselineIndex < 0) {
      return { eligible: false, changed: false, reason: 'current-v1.6-baseline-heading-missing', body };
    }

    const prefix = body.slice(0, baselineIndex);
    const baselineAndAfter = body.slice(baselineIndex);
    const demotedPrefix = prefix.replace(
      /^## ([456])\. (.+)$/gm,
      (_match, _number, title) => '### ' + String(title).trim(),
    );

    const priority =
      body.match(/^> \*\*(P[0-3] (?:🔴 Kritisch|🟠 Hoch|🟡 Normal|🟢 Niedrig)) ·/m)?.[1] ||
      'P2 🟡 Normal';
    const versionImpact =
      body.match(/^> \*\*P[0-3] (?:🔴 Kritisch|🟠 Hoch|🟡 Normal|🟢 Niedrig) · (NOT_EVALUATED ⚪|NONE ➖|PATCH 🩹|MINOR ✨|MAJOR 💥) ·/m)?.[1] ||
      'NOT_EVALUATED ⚪';
    const existingPrClass =
      body.match(/^> \*\*P[0-3] (?:🔴 Kritisch|🟠 Hoch|🟡 Normal|🟢 Niedrig) · (?:NOT_EVALUATED ⚪|NONE ➖|PATCH 🩹|MINOR ✨|MAJOR 💥) · PR-Klasse ([DCRM])\*\*/m)?.[1] ||
      prClass;

    const canonicalSections = [
      SECTION_ROADMAP,
      '',
      '- **Priorität:** ' + priority,
      '- **Warum diese Priorität:** Aus der bestehenden v1.6-Prioritätszeile übernommen; der Autofix bewertet die Priorität nicht neu.',
      '- **Roadmap / Work Package:** N/A — deterministische Reparatur eines bestehenden PR-Bodys; keine neue Task-Autorität wird erzeugt.',
      '',
      SECTION_VERSION,
      '',
      '- **Versionsimpact:** ' + versionImpact,
      '- **Versionsbegründung:** Aus dem bestehenden v1.6-Banner übernommen; der Autofix bewertet den Versionsimpact nicht neu.',
      '- **Version-Manager-Check:** NOT_RUN — repositoryseitige Checks liefern die technische Evidence.',
      '- **PR-Klasse:** ' + existingPrClass,
      '- **Klassenbegründung:** Bestehende PR-Klassenangabe wird erhalten; trusted-main Scope-Klassifikation für den Reparaturpfad: ' + prClass + '.',
      '- **Erforderliche Checks:** gemäß trusted-main PR-Scope und Repository-Policy.',
      '',
      SECTION_CHECK,
      '',
      '- **Main synchronisiert:** durch exact-head/base Specialist-Grenze gebunden.',
      '- **Changed-File-/Semantic-Overlap:** wird außerhalb dieses Body-Autofix weiterhin fail-closed korreliert.',
      canonicalMergeGate,
      '- **Agent-Self-Merge / Auto-Merge:** Nein',
      '',
    ].join('\n');

    let repaired = demotedPrefix + canonicalSections + baselineAndAfter;
    repaired = upgradeRepairedBodyToLegacyTarget(repaired);

    const missingAfter = findMissingRequiredSections(repaired);
    if (missingAfter.length > 0) {
      throw new Error('Current v1.6 generic missing-section repair did not converge: ' + missingAfter.join(', '));
    }
    if (!repaired.includes(canonicalMergeGate)) {
      throw new Error('Current v1.6 generic missing-section repair did not preserve the Human/CODEOWNER merge gate.');
    }
    if (
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !== baselineStartBefore ||
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !== baselineEndBefore
    ) {
      throw new Error('Current v1.6 generic missing-section repair changed production-baseline marker cardinality.');
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'current-v1.6-generic-missing-sections-repaired',
      body: repaired,
    };
  }

  if (projectOwnerLegacyMissing) {
    const projectOwnerMatches = [...body.matchAll(/^## 2\. Projekt-\/Owner-Zuordnung\s*$/gm)];
    const zeroCostMatches = [...body.matchAll(/^## 4\. Zero-Cost-Invariante\s*$/gm)];
    const validationMatches = [...body.matchAll(/^## 5\. Validierung\s*$/gm)];
    const dependencyMatches = [...body.matchAll(/^## 6\. Merge-Abhängigkeiten\s*$/gm)];
    if (
      projectOwnerMatches.length !== 1 ||
      zeroCostMatches.length !== 1 ||
      validationMatches.length !== 1 ||
      dependencyMatches.length !== 1
    ) {
      return { eligible: false, changed: false, reason: 'unsupported-project-owner-legacy-shape', body };
    }

    let repaired = body
      .replace(/^## 2\. Projekt-\/Owner-Zuordnung\s*$/m, SECTION_PROJECT)
      .replace(/^## 4\. Zero-Cost-Invariante\s*$/m, SECTION_ROADMAP + '\n\n### Zero-Cost-Invariante')
      .replace(
        /^## 5\. Validierung\s*$/m,
        [
          SECTION_VERSION,
          '',
          '- **Klasse:** ' + prClass,
          '- **Begründung:** Trusted-main classifyPrScope.mjs für den exakt gebundenen PR-Head/Base-Snapshot.',
          '- **Erforderliche Checks:** gemäß ermittelter PR-Klasse und Repository-Policy; NOT_RUN, skipped, missing, stale oder failed sind kein PASS.',
          '',
          SECTION_CHECK,
          '',
          '### Validierung',
        ].join('\n'),
      )
      .replace(/^## 6\. Merge-Abhängigkeiten\s*$/m, '### Merge-Abhängigkeiten');

    if (!repaired.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
      repaired = repaired.replace(
        /^- Kein Agent-Self-Merge, kein Auto-Merge\.?$/m,
        '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja\n- Kein Agent-Self-Merge, kein Auto-Merge.',
      );
    }

    repaired = upgradeRepairedBodyToLegacyTarget(repaired);
    const missingAfter = findMissingRequiredSections(repaired);
    if (missingAfter.length > 0) {
      throw new Error('Project/Owner legacy template repair did not converge: ' + missingAfter.join(', '));
    }
    if (!repaired.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
      throw new Error('Project/Owner legacy template repair did not preserve the Human/CODEOWNER merge gate.');
    }
    if (
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !== baselineStartBefore ||
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !== baselineEndBefore
    ) {
      throw new Error('Project/Owner legacy template repair changed production-baseline marker cardinality.');
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'legacy-to-v1.6-project-owner-structure-repaired',
      body: repaired,
    };
  }

  if (partialLegacyMissing) {
    const workPackageMatches = [...body.matchAll(/^## 4\. Work Package \/ Exit Gate\s*$/gm)];
    const prClassMatches = [...body.matchAll(/^## 5\. PR-Klasse\s*$/gm)];
    const correlationMatches = [...body.matchAll(/^## 6\. Aktuelle Korrelation\s*$/gm)];
    if (
      workPackageMatches.length !== 1 ||
      prClassMatches.length !== 1 ||
      correlationMatches.length !== 1
    ) {
      return { eligible: false, changed: false, reason: 'unsupported-partial-legacy-shape', body };
    }

    let repaired = body
      .replace(/^## 4\. Work Package \/ Exit Gate\s*$/m, SECTION_ROADMAP)
      .replace(/^## 6\. Aktuelle Korrelation\s*$/m, SECTION_CHECK);

    repaired = repaired.replace(
      /^- \*\*Human\/CODEOWNER Merge:\*\* erforderlich; kein Agent-Self-Merge\/Auto-Merge\.?$/m,
      '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja\n- **Agent-Self-Merge/Auto-Merge:** Nein.',
    );
    repaired = repaired.replace(
      /^- \*\*Human\/CODEOWNER Merge erforderlich:\*\* Ja\.?$/m,
      '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    );

    repaired = upgradeRepairedBodyToLegacyTarget(repaired);
    const missingAfter = findMissingRequiredSections(repaired);
    if (missingAfter.length > 0) {
      throw new Error('Partial legacy template repair did not converge: ' + missingAfter.join(', '));
    }
    if (!repaired.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
      throw new Error('Partial legacy template repair did not preserve the Human/CODEOWNER merge gate.');
    }
    if (
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !== baselineStartBefore ||
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !== baselineEndBefore
    ) {
      throw new Error('Partial legacy template repair changed production-baseline marker cardinality.');
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'legacy-to-v1.6-partial-structure-repaired',
      body: repaired,
    };
  }

  const exitGateMatches = [...body.matchAll(/^## 4\. Exit Gate\s*$/gm)];
  const legacyCheckMatches = [...body.matchAll(/^## 5\. Prüfung\s*$/gm)];
  const boundaryMatches = [...body.matchAll(/^## 6\.(?: Abgrenzung| Offene Grenze)\s*$/gm)];
  if (exitGateMatches.length !== 1 || legacyCheckMatches.length !== 1 || boundaryMatches.length !== 1) {
    return { eligible: false, changed: false, reason: 'unsupported-legacy-shape', body };
  }

  const exitGateSection = body.match(/^## 4\. Exit Gate\s*\n([\s\S]*?)(?=^## 5\. Prüfung\s*$)/m);
  if (!exitGateSection) {
    return { eligible: false, changed: false, reason: 'legacy-exit-gate-not-isolated', body };
  }
  const exitGateBody = String(exitGateSection[1] || '').trim();
  if (!exitGateBody) {
    return { eligible: false, changed: false, reason: 'legacy-exit-gate-empty', body };
  }

  let repaired = body.replace(
    /^## 4\. Exit Gate\s*\n([\s\S]*?)(?=^## 5\. Prüfung\s*$)/m,
    [
      SECTION_ROADMAP,
      '',
      '- **Roadmap / Work Package:** N/A — bestehender PR; deterministische Template-v1.6.0-Strukturmigration',
      '- **Ziel / Exit Gate:**',
      '',
      exitGateBody,
      '',
    ].join('\n'),
  );

  repaired = repaired.replace(
    /^## 5\. Prüfung\s*$/m,
    [
      SECTION_VERSION,
      '',
      '- **Klasse:** ' + prClass,
      '- **Begründung:** Trusted-main classifyPrScope.mjs für den exakt gebundenen PR-Head/Base-Snapshot.',
      '- **Erforderliche Checks:** gemäß ermittelter PR-Klasse und Repository-Policy; NOT_RUN, skipped, missing, stale oder failed sind kein PASS.',
      '',
      SECTION_CHECK,
    ].join('\n'),
  );

  repaired = repaired.replace(
    /^## 6\.(?: Abgrenzung| Offene Grenze)\s*$/m,
    '### Abgrenzung',
  );
  repaired = repaired.replace(
    /^- \*\*Human\/CODEOWNER Merge erforderlich:\*\* Ja\.?$/m,
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
  );

  repaired = upgradeRepairedBodyToLegacyTarget(repaired);
  const missingAfter = findMissingRequiredSections(repaired);
  if (missingAfter.length > 0) {
    throw new Error('Legacy template repair did not converge: ' + missingAfter.join(', '));
  }
  if (
    occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !== baselineStartBefore ||
    occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !== baselineEndBefore
  ) {
    throw new Error('Legacy template repair changed production-baseline marker cardinality.');
  }

  return { eligible: true, changed: repaired !== body, reason: 'legacy-to-v1.6-structure-repaired', body: repaired };
}

function normalizeSha(value) {
  return String(value || '').trim().toLowerCase();
}

async function main() {
  const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const prNumber = Number(process.env.PR_NUMBER || 0);
  const expectedHeadSha = normalizeSha(process.env.EXPECTED_HEAD_SHA);
  const expectedMainSha = normalizeSha(process.env.EXPECTED_MAIN_SHA);
  const prClass = String(process.env.PR_CHECK_CLASS || '').trim();

  if (!repository || !repository.includes('/')) fail('GITHUB_REPOSITORY fehlt oder ist ungültig.');
  if (!token) fail('GITHUB_TOKEN/GH_TOKEN fehlt.');
  if (!Number.isInteger(prNumber) || prNumber <= 0) fail('PR_NUMBER ist für den Template-Fix erforderlich.');
  if (!/^[0-9a-f]{40}$/.test(expectedHeadSha)) fail('EXPECTED_HEAD_SHA ist ungültig.');
  if (!/^[0-9a-f]{40}$/.test(expectedMainSha)) fail('EXPECTED_MAIN_SHA ist ungültig.');

  const fetchPr = () => githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token);
  const fetchMain = () => githubJson('https://api.github.com/repos/' + repository + '/branches/main', token);

  const validateBoundary = (livePr, liveMain) => {
    if (livePr?.state !== 'open') return 'pr-not-open';
    if (livePr?.base?.ref !== 'main') return 'base-not-main';
    if (livePr?.head?.repo?.full_name !== repository) return 'cross-repository-pr';
    if (normalizeSha(livePr?.head?.sha) !== expectedHeadSha) return 'head-drift';
    if (normalizeSha(livePr?.base?.sha) !== expectedMainSha) return 'base-drift';
    if (normalizeSha(liveMain?.commit?.sha) !== expectedMainSha) return 'main-drift';
    return '';
  };

  let livePr = await fetchPr();
  let liveMain = await fetchMain();
  let boundaryError = validateBoundary(livePr, liveMain);
  if (boundaryError) {
    console.log('[PR-TEMPLATE-REPAIR] skipped: ' + boundaryError);
    appendGithubOutput({ changed: 'false', eligible: 'false', reason: boundaryError });
    return;
  }

  const originalBody = String(livePr.body || '');
  const baseRef = process.env.PR_BASE_REF || 'origin/main';
  const headRef = process.env.PR_HEAD_REF || 'HEAD';
  const claimFiles = listAddedClaimFiles(baseRef, headRef);
  if (claimFiles.length > 1) fail(`Markerless PR repair erwartet höchstens einen neuen Work-Claim; gefunden: ${claimFiles.length}.`);
  const durableClaimEvidence = [];
  if (claimFiles.length === 1) {
    const claimPath = claimFiles[0];
    const claim = readJsonFile(claimPath);
    if (claim?.claimId) durableClaimEvidence.push(String(claim.claimId));
    durableClaimEvidence.push(claimPath);
  }
  const repair = repairLegacyPrBodyStructure(originalBody, { prClass, durableClaimEvidence });
  if (!repair.eligible || !repair.changed) {
    console.log('[PR-TEMPLATE-REPAIR] no write: ' + repair.reason);
    appendGithubOutput({ changed: 'false', eligible: repair.eligible ? 'true' : 'false', reason: repair.reason });
    return;
  }

  livePr = await fetchPr();
  liveMain = await fetchMain();
  boundaryError = validateBoundary(livePr, liveMain);
  if (boundaryError) {
    console.log('[PR-TEMPLATE-REPAIR] skipped before PATCH: ' + boundaryError);
    appendGithubOutput({ changed: 'false', eligible: 'false', reason: boundaryError });
    return;
  }
  if (String(livePr.body || '') !== originalBody) {
    console.log('[PR-TEMPLATE-REPAIR] skipped: concurrent-body-edit');
    appendGithubOutput({ changed: 'false', eligible: 'false', reason: 'concurrent-body-edit' });
    return;
  }

  const updated = await githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: repair.body }),
  });

  const remaining = findMissingRequiredSections(String(updated?.body || ''));
  if (remaining.length > 0) fail('PR-Body write did not converge: ' + remaining.join(', '));
  if (normalizeSha(updated?.head?.sha) !== expectedHeadSha) fail('PR head drifted during template repair.');

  appendGithubOutput({ changed: 'true', eligible: 'true', reason: repair.reason });
  console.log('[PR-TEMPLATE-REPAIR] PR #' + prNumber + ' deterministically repaired for exact head ' + expectedHeadSha.slice(0, 12) + '.');
}

if (process.argv[1]?.endsWith('repairLegacyPrBodyStructure.mjs')) {
  main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
}
