#!/usr/bin/env node

import {
  PR_TEMPLATE_MARKER,
  PR_TEMPLATE_VERSION,
  appendGithubOutput,
  detectPrTemplateVersion,
  fail,
  githubJson,
} from './lib.mjs';
import {
  canonicalizeKnownSectionHeadings,
  findMissingRequiredSections,
} from './prBodySectionContract.mjs';

const SECTION_PROJECT = '## 2. 📦 Projekt & Scope';
const SECTION_ROADMAP = '## 4. 📌 Priorität & Roadmap';
const SECTION_VERSION = '## 5. 🔢 Version & PR-Klasse';
const SECTION_CHECK = '## 6. ✅ Prüfung & Merge';

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

function upgradeRepairedBodyToCurrentTemplate(bodyText) {
  let body = String(bodyText || '');
  body = body.replace(/CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.5\.0/g, PR_TEMPLATE_MARKER);
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

export function repairLegacyPrBodyStructure(bodyText, { prClass = 'N/A' } = {}) {
  const body = String(bodyText || '');
  if (PR_TEMPLATE_VERSION !== '1.6.0') {
    throw new Error('Legacy repair requires review for a newer PR template contract.');
  }
  const missing = findMissingRequiredSections(body);

  if (missing.length === 0) {
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }
  if (!detectPrTemplateVersion(body)) {
    return { eligible: false, changed: false, reason: 'missing-supported-template-marker', body };
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
        ].join('\\n'),
      )
      .replace(/^## 6\. Merge-Abhängigkeiten\s*$/m, '### Merge-Abhängigkeiten');

    if (!repaired.includes('Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja')) {
      repaired = repaired.replace(
        /^- Kein Agent-Self-Merge, kein Auto-Merge\.?$/m,
        '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja\\n- Kein Agent-Self-Merge, kein Auto-Merge.',
      );
    }

    repaired = upgradeRepairedBodyToCurrentTemplate(repaired);
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

    repaired = upgradeRepairedBodyToCurrentTemplate(repaired);
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

  repaired = upgradeRepairedBodyToCurrentTemplate(repaired);
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
  const repair = repairLegacyPrBodyStructure(originalBody, { prClass });
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
