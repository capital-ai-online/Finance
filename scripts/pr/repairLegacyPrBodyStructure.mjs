#!/usr/bin/env node

import {
  PR_TEMPLATE_MARKER,
  appendGithubOutput,
  fail,
  githubJson,
} from './lib.mjs';
import { findMissingRequiredSections } from './prBodySectionContract.mjs';

export const LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS = Object.freeze([
  Object.freeze([
    '## 4. Roadmap',
    '## 5. PR-Klasse',
    '## 6. Prüfung',
  ]),
  Object.freeze([
    '## 4. Roadmap',
    '## 6. Prüfung',
  ]),
]);

function occurrenceCount(text, needle) {
  return String(text || '').split(needle).length - 1;
}

function sameOrderedValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function repairLegacyPrBodyStructure(bodyText, { prClass = 'N/A' } = {}) {
  const body = String(bodyText || '');
  const missing = findMissingRequiredSections(body);

  if (missing.length === 0) {
    return { eligible: false, changed: false, reason: 'already-canonical', body };
  }
  if (!body.includes(PR_TEMPLATE_MARKER)) {
    return { eligible: false, changed: false, reason: 'missing-canonical-template-marker', body };
  }
  const fullLegacyMissing = sameOrderedValues(
    missing,
    LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS[0],
  );
  const partialLegacyMissing = sameOrderedValues(
    missing,
    LEGACY_TEMPLATE_MISSING_SECTION_PATTERNS[1],
  );
  if (!fullLegacyMissing && !partialLegacyMissing) {
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
      .replace(/^## 4\. Work Package \/ Exit Gate\s*$/m, '## 4. Roadmap')
      .replace(/^## 6\. Aktuelle Korrelation\s*$/m, '## 6. Prüfung');

    repaired = repaired.replace(
      /^- \*\*Human\/CODEOWNER Merge:\*\* erforderlich; kein Agent-Self-Merge\/Auto-Merge\.?$/m,
      '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja\n- **Agent-Self-Merge/Auto-Merge:** Nein.',
    );
    repaired = repaired.replace(
      /^- \*\*Human\/CODEOWNER Merge erforderlich:\*\* Ja\.?$/m,
      '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    );

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
      reason: 'legacy-v1.5-partial-structure-repaired',
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
      '## 4. Roadmap',
      '',
      '- **Roadmap / Work Package:** N/A — bestehender PR; deterministische Template-v1.5.0-Strukturmigration',
      '- **Ziel / Exit Gate:**',
      '',
      exitGateBody,
      '',
    ].join('\n'),
  );

  repaired = repaired.replace(
    /^## 5\. Prüfung\s*$/m,
    [
      '## 5. PR-Klasse',
      '',
      '- **Klasse:** ' + prClass,
      '- **Begründung:** Trusted-main classifyPrScope.mjs für den exakt gebundenen PR-Head/Base-Snapshot.',
      '- **Erforderliche Checks:** gemäß ermittelter PR-Klasse und Repository-Policy; NOT_RUN, skipped, missing, stale oder failed sind kein PASS.',
      '',
      '## 6. Prüfung',
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

  return { eligible: true, changed: repaired !== body, reason: 'legacy-v1.5-structure-repaired', body: repaired };
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
