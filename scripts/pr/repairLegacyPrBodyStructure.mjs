#!/usr/bin/env node

import {
  PR_TEMPLATE_VERSION,
  appendGithubOutput,
  detectPrTemplateVersion,
  extractProductionBaselineBlock,
  fail,
  githubJson,
  gitSucceeds,
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

const CURRENT_V18_PRIORITIES = Object.freeze([
  'P0 🔴 Kritisch',
  'P1 🟠 Hoch',
  'P2 🟡 Normal',
  'P3 🟢 Niedrig',
]);
const CURRENT_V18_VERSION_IMPACTS = Object.freeze([
  'NOT_EVALUATED ⚪',
  'NONE ➖',
  'PATCH 🩹',
  'MINOR ✨',
  'MAJOR 💥',
]);
const CURRENT_V18_TECHNICAL_SUMMARY = '<summary>Technische Details & Traceability</summary>';
const CURRENT_V18_HUMAN_MERGE_GATE_DEFAULT =
  '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja';
const CURRENT_V18_HUMAN_MERGE_GATE_VALUES = new Set([
  'Ja',
  'Nein — GitHub Auto-Merge Safety Contract',
]);

function inspectCurrentV18HumanMergeGate(bodyText) {
  const body = String(bodyText || '');
  const matches = [
    ...body.matchAll(
      /^- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* (.+)$/gm,
    ),
  ];
  if (matches.length === 0) return { state: 'missing', value: '' };
  if (matches.length !== 1) return { state: 'ambiguous', value: '' };
  const value = String(matches[0][1] || '').trim();
  return CURRENT_V18_HUMAN_MERGE_GATE_VALUES.has(value)
    ? { state: 'valid', value }
    : { state: 'invalid', value };
}
const CURRENT_V18_VERSION_MANAGER_DEFAULT =
  '- **Version-Manager-Check:** NOT_RUN — repositoryseitige Checks liefern die technische Evidence; keine fehlende Prüfung wird als PASS dargestellt.';

function parseCurrentDecisionBanner(bodyText) {
  const body = String(bodyText || '');
  const match = body.match(
    /^> (P[0-3] (?:🔴 Kritisch|🟠 Hoch|🟡 Normal|🟢 Niedrig)) · PR-Klasse ([DCR]) · (NOT_EVALUATED ⚪|NONE ➖|PATCH 🩹|MINOR ✨|MAJOR 💥)\s*$/m,
  );
  if (!match) return null;
  return { priority: match[1], prClass: match[2], versionImpact: match[3] };
}

function repairCurrentDecisionRequiredMetadata(
  bodyText,
  { prClass = 'N/A', durableClaimEvidence = [] } = {},
) {
  const body = String(bodyText || '');
  const priority = body.match(/^- \*\*Priorität:\*\* (.+)$/m)?.[1]?.trim() || null;
  const versionImpact = body.match(/^- \*\*Versionsimpact:\*\* (.+)$/m)?.[1]?.trim() || null;
  const versionManager = body.match(/^- \*\*Version-Manager-Check:\*\* (.+)$/m)?.[1]?.trim() || null;
  const technicalPrClass = body.match(/^- \*\*PR-Klasse:\*\* ([DCR])\s*$/m)?.[1] || null;
  const humanMergeGate = inspectCurrentV18HumanMergeGate(body);
  const missingDurableEvidence = [...new Set(
    durableClaimEvidence.map((value) => String(value || '').trim()).filter(Boolean),
  )].filter((value) => !body.includes(value));

  if (humanMergeGate.state === 'invalid' || humanMergeGate.state === 'ambiguous') {
    return { eligible: false, changed: false, reason: 'current-v1.8-human-merge-gate-conflict', body };
  }

  const needsRepair =
    !priority ||
    !versionImpact ||
    !versionManager ||
    humanMergeGate.state === 'missing' ||
    (!technicalPrClass && ['D', 'C', 'R'].includes(String(prClass))) ||
    missingDurableEvidence.length > 0;

  if (!needsRepair) {
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }

  if (priority && !CURRENT_V18_PRIORITIES.includes(priority)) {
    return { eligible: false, changed: false, reason: 'current-v1.8-priority-metadata-conflict', body };
  }
  if (versionImpact && !CURRENT_V18_VERSION_IMPACTS.includes(versionImpact)) {
    return { eligible: false, changed: false, reason: 'current-v1.8-version-impact-metadata-conflict', body };
  }

  const banner = parseCurrentDecisionBanner(body);
  if ((!priority || !versionImpact) && !banner) {
    return { eligible: false, changed: false, reason: 'current-v1.8-required-metadata-unresolved', body };
  }
  if (banner && priority && banner.priority !== priority) {
    return { eligible: false, changed: false, reason: 'current-v1.8-priority-metadata-conflict', body };
  }
  if (banner && versionImpact && banner.versionImpact !== versionImpact) {
    return { eligible: false, changed: false, reason: 'current-v1.8-version-impact-metadata-conflict', body };
  }
  if (
    banner &&
    ['D', 'C', 'R'].includes(String(prClass)) &&
    banner.prClass !== String(prClass)
  ) {
    return { eligible: false, changed: false, reason: 'current-v1.8-pr-class-metadata-conflict', body };
  }
  if (
    technicalPrClass &&
    ['D', 'C', 'R'].includes(String(prClass)) &&
    technicalPrClass !== String(prClass)
  ) {
    return { eligible: false, changed: false, reason: 'current-v1.8-pr-class-metadata-conflict', body };
  }

  const summaryIndex = body.indexOf(CURRENT_V18_TECHNICAL_SUMMARY);
  const detailsStart = summaryIndex >= 0 ? body.lastIndexOf('<details>', summaryIndex) : -1;
  const detailsEnd = summaryIndex >= 0 ? body.indexOf('</details>', summaryIndex) : -1;
  if (summaryIndex < 0 || detailsStart < 0 || detailsEnd < 0 || !(detailsStart < summaryIndex && summaryIndex < detailsEnd)) {
    return { eligible: false, changed: false, reason: 'current-v1.8-technical-details-unresolved', body };
  }

  const additions = [];
  if (!priority) additions.push('- **Priorität:** ' + banner.priority);
  if (!versionImpact) additions.push('- **Versionsimpact:** ' + banner.versionImpact);
  if (!versionManager) additions.push(CURRENT_V18_VERSION_MANAGER_DEFAULT);
  if (!technicalPrClass && ['D', 'C', 'R'].includes(String(prClass))) {
    additions.push('- **PR-Klasse:** ' + String(prClass));
  }
  if (humanMergeGate.state === 'missing') additions.push(CURRENT_V18_HUMAN_MERGE_GATE_DEFAULT);
  for (const value of missingDurableEvidence) {
    additions.push('- **Dauerhafte Claim-Evidence:** ' + value);
  }
  if (additions.length === 0) {
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }

  const beforeEnd = body.slice(0, detailsEnd).trimEnd();
  const afterEnd = body.slice(detailsEnd);
  const repaired = beforeEnd + '\n' + additions.join('\n') + '\n' + afterEnd;

  const repairedPriority = repaired.match(/^- \*\*Priorität:\*\* (.+)$/m)?.[1]?.trim();
  const repairedVersionImpact = repaired.match(/^- \*\*Versionsimpact:\*\* (.+)$/m)?.[1]?.trim();
  if (!CURRENT_V18_PRIORITIES.includes(repairedPriority)) {
    throw new Error('Current v1.8 metadata repair did not converge to a canonical priority.');
  }
  if (!CURRENT_V18_VERSION_IMPACTS.includes(repairedVersionImpact)) {
    throw new Error('Current v1.8 metadata repair did not converge to a canonical version impact.');
  }
  if (!/^- \*\*Version-Manager-Check:\*\* .+$/m.test(repaired)) {
    throw new Error('Current v1.8 metadata repair did not materialize Version-Manager-Check.');
  }
  if (inspectCurrentV18HumanMergeGate(repaired).state !== 'valid') {
    throw new Error('Current v1.8 metadata repair did not preserve one canonical Human/CODEOWNER merge gate.');
  }
  if (missingDurableEvidence.some((value) => !repaired.includes(value))) {
    throw new Error('Current v1.8 metadata repair did not materialize durable claim evidence.');
  }

  return {
    eligible: true,
    changed: repaired !== body,
    reason: 'current-v1.8-required-metadata-repaired',
    body: repaired,
  };
}

function repairCurrentDecisionBodyStructure(bodyText, { prClass = 'N/A', durableClaimEvidence = [] } = {}) {
  const body = String(bodyText || '');
  const expectedHeadings = [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ];
  const visibleHeadings = body.match(/^## .+$/gm) || [];
  const placeholder = '{{PRODUCTION_BASELINE_BLOCK}}';
  const legacyHeading = '## 7. Maschinenlesbare Baseline';
  const baselineBlock = extractProductionBaselineBlock(body);

  const canonical =
    visibleHeadings.length === expectedHeadings.length &&
    expectedHeadings.every((heading, index) => visibleHeadings[index] === heading) &&
    occurrenceCount(body, placeholder) === 0 &&
    occurrenceCount(body, legacyHeading) === 0 &&
    Boolean(baselineBlock) &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 1;

  if (canonical) {
    let repaired = body;
    let priorityTokenNormalized = false;

    if (/^> P0-HIGHEST 🔴 Kritisch ·/m.test(repaired)) {
      repaired = repaired.replace(/^> P0-HIGHEST 🔴 Kritisch ·/m, '> P0 🔴 Kritisch ·');
      priorityTokenNormalized = true;
    }
    if (/^- \*\*Priorität:\*\* P0-HIGHEST 🔴 Kritisch\s*$/m.test(repaired)) {
      repaired = repaired.replace(
        /^- \*\*Priorität:\*\* P0-HIGHEST 🔴 Kritisch\s*$/m,
        '- **Priorität:** P0 🔴 Kritisch',
      );
      priorityTokenNormalized = true;
    }
    if (
      /^> P0-HIGHEST 🔴 Kritisch ·/m.test(repaired) ||
      /^- \*\*Priorität:\*\* P0-HIGHEST 🔴 Kritisch\s*$/m.test(repaired)
    ) {
      throw new Error('Current v1.8 priority-token repair did not converge.');
    }

    const metadataRepair = repairCurrentDecisionRequiredMetadata(repaired, {
      prClass,
      durableClaimEvidence,
    });
    if (metadataRepair.changed) return metadataRepair;
    if (!metadataRepair.eligible && metadataRepair.reason !== 'already-canonical') return metadataRepair;
    if (priorityTokenNormalized) {
      return {
        eligible: true,
        changed: true,
        reason: 'current-v1.8-priority-token-normalized',
        body: repaired,
      };
    }

    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }

  const machineBaselineSummary = '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>';
  const hybridNotRunSentinel =
    'NOT_RUN — wird durch die kanonische PR-Evidence-Automation gegen Exact Head erzeugt.';
  const exactMarkerFreeBaselineSentinelShape =
    visibleHeadings.length === expectedHeadings.length &&
    expectedHeadings.every((heading, index) => visibleHeadings[index] === heading) &&
    occurrenceCount(body, placeholder) === 0 &&
    occurrenceCount(body, legacyHeading) === 0 &&
    !baselineBlock &&
    occurrenceCount(body, machineBaselineSummary) === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 0 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 0;

  if (exactMarkerFreeBaselineSentinelShape) {
    const summaryIndex = body.indexOf(machineBaselineSummary);
    const detailsStart = summaryIndex >= 0 ? body.lastIndexOf('<details>', summaryIndex) : -1;
    const detailsEnd = summaryIndex >= 0 ? body.indexOf('</details>', summaryIndex) : -1;
    if (
      summaryIndex < 0 ||
      detailsStart < 0 ||
      detailsEnd < 0 ||
      !(detailsStart < summaryIndex && summaryIndex < detailsEnd)
    ) {
      return { eligible: false, changed: false, reason: 'current-v1.8-marker-free-baseline-boundary-unresolved', body };
    }

    const managedContentStart = summaryIndex + machineBaselineSummary.length;
    const managedContent = body.slice(managedContentStart, detailsEnd).trim();
    if (managedContent !== hybridNotRunSentinel) {
      return { eligible: false, changed: false, reason: 'current-v1.8-marker-free-baseline-content-unresolved', body };
    }

    const metadataRepair = repairCurrentDecisionRequiredMetadata(body, {
      prClass,
      durableClaimEvidence,
    });
    if (metadataRepair.changed) return metadataRepair;
    if (!metadataRepair.eligible && metadataRepair.reason !== 'already-canonical') return metadataRepair;

    // Structure is canonical; the existing production-baseline specialist owns
    // the marker-free sentinel -> atomic baseline transition.
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }

  const exactHybridLegacyBaselineShape =
    visibleHeadings.length === 4 &&
    expectedHeadings.every((heading, index) => visibleHeadings[index] === heading) &&
    visibleHeadings[3] === legacyHeading &&
    occurrenceCount(body, placeholder) === 0 &&
    occurrenceCount(body, legacyHeading) === 1 &&
    Boolean(baselineBlock) &&
    occurrenceCount(body, machineBaselineSummary) === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 1;

  if (exactHybridLegacyBaselineShape) {
    const legacyIndex = body.indexOf('\n' + legacyHeading);
    if (legacyIndex < 0) {
      return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-heading-not-isolated', body };
    }

    const prefix = body.slice(0, legacyIndex).trimEnd();
    const legacyTail = body.slice(legacyIndex + 1).trim();
    const expectedLegacyTail = [legacyHeading, '', baselineBlock.trim()].join('\n').trim();
    if (legacyTail !== expectedLegacyTail) {
      return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-tail-has-extra-content', body };
    }

    const summaryIndex = prefix.indexOf(machineBaselineSummary);
    const detailsStart = summaryIndex >= 0 ? prefix.lastIndexOf('<details>', summaryIndex) : -1;
    const detailsEnd = summaryIndex >= 0 ? prefix.indexOf('</details>', summaryIndex) : -1;
    if (
      summaryIndex < 0 ||
      detailsStart < 0 ||
      detailsEnd < 0 ||
      !(detailsStart < summaryIndex && summaryIndex < detailsEnd)
    ) {
      return { eligible: false, changed: false, reason: 'current-v1.8-machine-baseline-details-unresolved', body };
    }

    const managedContentStart = summaryIndex + machineBaselineSummary.length;
    const managedContent = prefix.slice(managedContentStart, detailsEnd).trim();
    if (managedContent !== hybridNotRunSentinel) {
      return { eligible: false, changed: false, reason: 'current-v1.8-hybrid-baseline-content-unresolved', body };
    }

    const repaired =
      prefix.slice(0, managedContentStart).trimEnd() +
      '\n\n' +
      baselineBlock.trim() +
      '\n\n' +
      prefix.slice(detailsEnd).trimStart() +
      '\n';

    const repairedHeadings = repaired.match(/^## .+$/gm) || [];
    if (
      repairedHeadings.length !== expectedHeadings.length ||
      !expectedHeadings.every((heading, index) => repairedHeadings[index] === heading)
    ) {
      throw new Error('Current v1.8 hybrid baseline repair did not converge to exactly three visible main sections.');
    }
    if (occurrenceCount(repaired, placeholder) !== 0 || occurrenceCount(repaired, legacyHeading) !== 0) {
      throw new Error('Current v1.8 hybrid baseline repair left legacy structure behind.');
    }
    if (
      occurrenceCount(repaired, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') !== 1 ||
      occurrenceCount(repaired, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') !== 1
    ) {
      throw new Error('Current v1.8 hybrid baseline repair did not converge to one canonical baseline block.');
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'current-v1.8-hybrid-baseline-section-repaired',
      body: repaired,
    };
  }

  const exactLegacyBaselineOnlyShape =
    visibleHeadings.length === 4 &&
    expectedHeadings.every((heading, index) => visibleHeadings[index] === heading) &&
    visibleHeadings[3] === legacyHeading &&
    occurrenceCount(body, placeholder) === 0 &&
    occurrenceCount(body, legacyHeading) === 1 &&
    Boolean(baselineBlock) &&
    occurrenceCount(body, machineBaselineSummary) === 0 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 1;

  if (exactLegacyBaselineOnlyShape) {
    const legacyIndex = body.indexOf('\n' + legacyHeading);
    if (legacyIndex < 0) {
      return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-heading-not-isolated', body };
    }

    const prefix = body.slice(0, legacyIndex).trimEnd();
    const legacyTail = body.slice(legacyIndex + 1).trim();
    const expectedLegacyTail = [legacyHeading, '', baselineBlock.trim()].join('\n').trim();
    if (legacyTail !== expectedLegacyTail) {
      return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-tail-has-extra-content', body };
    }

    const repaired = [
      prefix,
      '',
      '<details>',
      machineBaselineSummary,
      '',
      baselineBlock.trim(),
      '',
      '</details>',
      '',
    ].join('\n');

    const repairedHeadings = repaired.match(/^## .+$/gm) || [];
    if (
      repairedHeadings.length !== expectedHeadings.length ||
      !expectedHeadings.every((heading, index) => repairedHeadings[index] === heading)
    ) {
      throw new Error('Current v1.8 baseline-only repair did not converge to exactly three visible main sections.');
    }
    if (occurrenceCount(repaired, placeholder) !== 0 || occurrenceCount(repaired, legacyHeading) !== 0) {
      throw new Error('Current v1.8 baseline-only repair left legacy structure behind.');
    }
    if (
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !==
        occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_START') ||
      occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !==
        occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_END')
    ) {
      throw new Error('Current v1.8 baseline-only repair changed baseline marker cardinality.');
    }
    const missingAfter = findMissingRequiredSections(repaired, PR_TEMPLATE_VERSION);
    if (missingAfter.length > 0) {
      throw new Error('Current v1.8 baseline-only repair left missing sections: ' + missingAfter.join(', '));
    }

    return {
      eligible: true,
      changed: repaired !== body,
      reason: 'current-v1.8-legacy-baseline-only-section-repaired',
      body: repaired,
    };
  }

  const exactLegacyBaselineShape =
    visibleHeadings.length === 4 &&
    expectedHeadings.every((heading, index) => visibleHeadings[index] === heading) &&
    visibleHeadings[3] === legacyHeading &&
    occurrenceCount(body, placeholder) === 1 &&
    occurrenceCount(body, legacyHeading) === 1 &&
    Boolean(baselineBlock) &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 1 &&
    occurrenceCount(body, '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 1;

  if (!exactLegacyBaselineShape) {
    return { eligible: false, changed: false, reason: 'current-v1.8-unsupported-shape', body };
  }

  const legacyIndex = body.indexOf('\n' + legacyHeading);
  if (legacyIndex < 0) {
    return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-heading-not-isolated', body };
  }

  const prefix = body.slice(0, legacyIndex);
  const legacyTail = body.slice(legacyIndex + 1).trim();
  const expectedLegacyTail = [legacyHeading, '', baselineBlock.trim()].join('\n').trim();
  if (legacyTail !== expectedLegacyTail) {
    return { eligible: false, changed: false, reason: 'current-v1.8-legacy-baseline-tail-has-extra-content', body };
  }

  const summary = '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>';
  const summaryIndex = prefix.indexOf(summary);
  const placeholderIndex = prefix.indexOf(placeholder);
  const detailsEndIndex = prefix.indexOf('</details>', placeholderIndex);
  if (
    summaryIndex < 0 ||
    placeholderIndex < 0 ||
    detailsEndIndex < 0 ||
    !(summaryIndex < placeholderIndex && placeholderIndex < detailsEndIndex)
  ) {
    return { eligible: false, changed: false, reason: 'current-v1.8-baseline-placeholder-not-in-machine-details', body };
  }

  const repaired = prefix.replace(placeholder, baselineBlock.trim()).trimEnd() + '\n';
  const repairedHeadings = repaired.match(/^## .+$/gm) || [];
  if (
    repairedHeadings.length !== expectedHeadings.length ||
    !expectedHeadings.every((heading, index) => repairedHeadings[index] === heading)
  ) {
    throw new Error('Current v1.8 legacy-baseline repair did not converge to exactly three visible main sections.');
  }
  if (occurrenceCount(repaired, placeholder) !== 0 || occurrenceCount(repaired, legacyHeading) !== 0) {
    throw new Error('Current v1.8 legacy-baseline repair left legacy structure behind.');
  }
  if (
    occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_START') !==
      occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_START') ||
    occurrenceCount(repaired, 'CAPITAL_AI_PRODUCTION_BASELINE_END') !==
      occurrenceCount(body, 'CAPITAL_AI_PRODUCTION_BASELINE_END')
  ) {
    throw new Error('Current v1.8 legacy-baseline repair changed baseline marker cardinality.');
  }
  const missingAfter = findMissingRequiredSections(repaired, PR_TEMPLATE_VERSION);
  if (missingAfter.length > 0) {
    throw new Error('Current v1.8 legacy-baseline repair left missing sections: ' + missingAfter.join(', '));
  }

  return {
    eligible: true,
    changed: repaired !== body,
    reason: 'current-v1.8-legacy-baseline-section-repaired',
    body: repaired,
  };
}

export function repairLegacyPrBodyStructure(bodyText, { prClass = 'N/A', durableClaimEvidence = [] } = {}) {
  const body = String(bodyText || '');
  const detectedVersion = detectPrTemplateVersion(body);

  // v1.8 is the canonical Human Decision + Live Dashboard contract. The only mutable current-version
  // shape is the exact post-migration artifact where a rendered baseline remained in a
  // legacy level-two section while the canonical machine-details block still held the
  // renderer placeholder. Live Dashboard drift remains owned by the Decision Reconciler.
  if (detectedVersion === PR_TEMPLATE_VERSION) {
    return repairCurrentDecisionBodyStructure(body, { prClass, durableClaimEvidence });
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

export function validatePrMutationBoundary({
  livePr,
  liveMain,
  repository,
  expectedHeadSha,
  expectedMainSha,
  mainIsAncestorOfHead,
}) {
  if (livePr?.state !== 'open') return 'pr-not-open';
  if (livePr?.base?.ref !== 'main') return 'base-not-main';
  if (livePr?.head?.repo?.full_name !== repository) return 'cross-repository-pr';
  if (normalizeSha(livePr?.head?.sha) !== normalizeSha(expectedHeadSha)) return 'head-drift';
  if (normalizeSha(liveMain?.commit?.sha) !== normalizeSha(expectedMainSha)) return 'main-drift';
  if (mainIsAncestorOfHead !== true) return 'main-not-ancestor-of-head';
  return '';
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

  const validateBoundary = (livePr, liveMain) => validatePrMutationBoundary({
    livePr,
    liveMain,
    repository,
    expectedHeadSha,
    expectedMainSha,
    mainIsAncestorOfHead: gitSucceeds([
      'merge-base',
      '--is-ancestor',
      expectedMainSha,
      expectedHeadSha,
    ]),
  });

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
