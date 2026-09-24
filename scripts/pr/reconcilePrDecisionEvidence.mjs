#!/usr/bin/env node

import fs from 'node:fs';
import { resolveMergeCadence } from '../operations/mergeCadence.mjs';
import {
  PR_TEMPLATE_MARKER,
  PR_TEMPLATE_VERSION,
  appendGithubOutput,
  detectPrTemplateVersion,
  fail,
  githubJson,
  readJsonFile,
  validateProductionBaselineForPr,
} from './lib.mjs';
import { replaceProductionBaselineBlock } from './productionBaselineBody.mjs';
import { repairLegacyPrBodyStructure } from './repairLegacyPrBodyStructure.mjs';
import {
  PR_DECISION_GATES,
  decisionEvidenceRows,
  deriveDecisionStatus,
  deriveVersionCadenceEvidence,
  extractDecisionGates,
  extractDecisionStatus,
  formatDecisionGateState,
  nextVerifiableDecisionStep,
  summarizeDecisionBlockers,
  summarizeDecisionEvidence,
  summarizeLiveDecisionSync,
} from './prDecisionState.mjs';
import {
  AUTO_MERGE_ELIGIBLE,
  HUMAN_MERGE_REQUIRED,
  autoMergeEvidenceMatches,
  classifyAutoMergeEligibility,
  governanceCheckFreshAfterDeclaration,
  parseAutoMergeEvidence,
  reconcileAutoMergeProjection,
  requiredCheckEvidence,
  requiredCheckFingerprint,
  resolveAutoMergeMethod,
} from './prAutoMergeSafety.mjs';

const SECURITY_CONTEXT_PATTERN = /(gitguardian|hardened image|security|cve|vulnerab|license compliance)/i;
const GOVERNANCE_CONTEXT = 'PR Governance (Kosten / Workflow / Vorlage)';
const LICENSE_CONTEXT = 'License compliance check';

export function normalizeSha(value) {
  return String(value || '').trim().toLowerCase();
}

export function prepareLeadingPrBody(bodyText, baseline, { prClass = 'N/A' } = {}) {
  const original = String(bodyText || '');
  const baselineErrors = validateProductionBaselineForPr(baseline);
  if (baselineErrors.length > 0) {
    return {
      eligible: false,
      changed: false,
      reason: 'production-baseline-invalid',
      body: original,
      structureChanged: false,
      baselineChanged: false,
    };
  }

  const structural = repairLegacyPrBodyStructure(original, { prClass });
  const structureAccepted =
    structural.changed === true ||
    structural.reason === 'already-canonical';

  if (!structureAccepted) {
    return {
      eligible: false,
      changed: false,
      reason: structural.reason,
      body: original,
      structureChanged: false,
      baselineChanged: false,
    };
  }

  const structuredBody = structural.changed ? structural.body : original;
  const baselineProjection = replaceProductionBaselineBlock(structuredBody, baseline);
  return {
    eligible: true,
    changed: structural.changed || baselineProjection.changed,
    reason:
      structural.changed && baselineProjection.changed
        ? 'structure-and-production-baseline-reconciled'
        : structural.changed
          ? structural.reason
          : baselineProjection.changed
            ? 'production-baseline-reconciled'
            : 'already-canonical',
    body: baselineProjection.body,
    structureChanged: structural.changed === true,
    baselineChanged: baselineProjection.changed === true,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compactCell(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
}

export function rulesetAppliesToMain(ruleset) {
  if (!ruleset || ruleset.enforcement !== 'active' || ruleset.target !== 'branch') return false;
  const include = ruleset.conditions?.ref_name?.include || [];
  const exclude = ruleset.conditions?.ref_name?.exclude || [];
  const mainIncluded = include.includes('~DEFAULT_BRANCH') || include.includes('refs/heads/main');
  const mainExcluded = exclude.includes('~DEFAULT_BRANCH') || exclude.includes('refs/heads/main');
  return mainIncluded && !mainExcluded;
}

export function collectDecisionPolicy(rulesets) {
  const requiredChecks = new Map();
  let licenseCompliance = false;

  for (const ruleset of rulesets || []) {
    if (!rulesetAppliesToMain(ruleset)) continue;
    for (const rule of ruleset.rules || []) {
      if (rule.type === 'required_status_checks') {
        for (const check of rule.parameters?.required_status_checks || []) {
          const context = String(check?.context || '').trim();
          if (!context) continue;
          const integrationId = Number.isInteger(check?.integration_id) ? check.integration_id : null;
          const key = `${context}::${integrationId ?? '*'}`;
          requiredChecks.set(key, { context, integrationId });
        }
      }
      if (rule.type === 'license_compliance_scanning') licenseCompliance = true;
    }
  }

  return {
    requiredChecks: [...requiredChecks.values()].sort((a, b) => a.context.localeCompare(b.context)),
    licenseCompliance,
  };
}

export function latestMatchingCheck(requirement, checkRuns) {
  const matches = (checkRuns || []).filter((run) => {
    if (String(run?.name || '') !== requirement.context) return false;
    if (requirement.integrationId == null) return true;
    return Number(run?.app?.id) === requirement.integrationId;
  });
  matches.sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
  return matches[0] || null;
}

export function decisionStateForCheck(run) {
  if (!run) return 'PENDING';
  if (run.status !== 'completed') return 'PENDING';
  if (run.conclusion === 'success') return 'PASS';
  if (['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure', 'stale'].includes(run.conclusion)) {
    return 'BLOCKED';
  }
  // AGENTS.md: skipped / neutral / not-applicable evidence is never represented as PASS.
  return 'PENDING';
}

export function gateForRequirements(requirements, checkRuns) {
  if (!Array.isArray(requirements) || requirements.length === 0) return 'PENDING';
  const states = requirements.map((requirement) =>
    decisionStateForCheck(latestMatchingCheck(requirement, checkRuns)),
  );
  if (states.includes('BLOCKED')) return 'BLOCKED';
  if (states.every((state) => state === 'PASS')) return 'PASS';
  return 'PENDING';
}

export function securityRequirements(policy) {
  const required = (policy?.requiredChecks || []).filter((check) =>
    SECURITY_CONTEXT_PATTERN.test(check.context),
  );
  if (policy?.licenseCompliance) {
    required.push({ context: LICENSE_CONTEXT, integrationId: null });
  }
  const seen = new Set();
  return required.filter((check) => {
    const key = `${check.context}::${check.integrationId ?? '*'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trustedProductionBaselineMatches({
  baseline,
  baselineId,
  repository,
  productionSha,
  expectedMain,
  expectedHead,
  productionDrift,
}) {
  if (!baseline || validateProductionBaselineForPr(baseline).length > 0) return false;
  if (!baselineId || baselineId !== String(baseline.baselineId || '')) return false;
  if (baseline?.checks?.productionRepoMatches !== true) return false;
  if (repository && String(baseline?.production?.repoSlug || '') !== repository) return false;

  return normalizeSha(baseline?.production?.commitSha) === productionSha &&
    normalizeSha(baseline?.main?.sha) === expectedMain &&
    normalizeSha(baseline?.head?.sha) === expectedHead &&
    String(baseline?.production?.branch || '') === 'main' &&
    String(baseline?.drift?.productionToMainCommits) === productionDrift;
}

function cadenceAllowsQueuedProduction(cadence, expectedMain) {
  if (!cadence || cadence.active !== true) return false;
  if (normalizeSha(cadence.ref) !== expectedMain) return false;
  if (!['ANCESTOR', 'PRE_EPOCH'].includes(String(cadence.productionRelation || ''))) return false;

  return cadence.deployDue === false &&
    cadence.recoveryEligible === false &&
    Number(cadence.deployRemaining) > 0;
}

export function evaluateProductionBaseline(
  bodyText,
  mainSha,
  headSha,
  { productionBaseline = null, cadence = null, repository = '' } = {},
) {
  const body = String(bodyText || '');
  const markerStart = '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->';
  const markerEnd = '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->';
  const count = (needle) => body.split(needle).length - 1;

  if (count(markerStart) === 0 && count(markerEnd) === 0) return 'PENDING';
  if (count(markerStart) !== 1 || count(markerEnd) !== 1) return 'BLOCKED';

  const readSha = (label) => body.match(
    new RegExp('^- \\*\\*' + escapeRegex(label) + ':\\*\\* \\`([0-9a-fA-F]{40})\\`\\s*$', 'm'),
  )?.[1]?.toLowerCase() || null;
  const readText = (label) => body.match(
    new RegExp('^- \\*\\*' + escapeRegex(label) + ':\\*\\* \\`([^\\`\\n]+)\\`\\s*$', 'm'),
  )?.[1]?.trim() || null;

  const baselineId = readText('Baseline-ID');
  const productionSha = readSha('Produktions-Commit');
  const baselineMainSha = readSha('Aktueller main-Commit');
  const baselineHeadSha = readSha('PR-Head-Commit');
  const productionBranch = readText('Produktions-Branch');
  const productionDrift = body.match(
    /^- \*\*Abweichung Produktion → main:\*\* \`(\d+)\` Commit\(s\)\s*$/m,
  )?.[1] ?? null;

  if (!productionSha || !baselineMainSha || !baselineHeadSha || !productionBranch || productionDrift == null) {
    return 'PENDING';
  }

  const expectedMain = normalizeSha(mainSha);
  const expectedHead = normalizeSha(headSha);
  const bodyIdentityMatches =
    baselineMainSha === expectedMain &&
    baselineHeadSha === expectedHead &&
    productionBranch === 'main';

  if (!bodyIdentityMatches) return 'BLOCKED';

  if (productionBaseline && !trustedProductionBaselineMatches({
    baseline: productionBaseline,
    baselineId,
    repository,
    productionSha,
    expectedMain,
    expectedHead,
    productionDrift,
  })) {
    return 'BLOCKED';
  }

  if (productionSha === expectedMain) {
    return productionDrift === '0' ? 'PASS' : 'BLOCKED';
  }

  if (!productionBaseline || Number(productionDrift) <= 0) return 'BLOCKED';
  return cadenceAllowsQueuedProduction(cadence, expectedMain) ? 'PASS' : 'BLOCKED';
}

export function findExactOverlap(targetFiles, peerPulls) {
  const target = new Set((targetFiles || []).map(String));
  const conflicts = [];
  for (const peer of peerPulls || []) {
    const overlap = (peer.files || []).filter((file) => target.has(String(file))).sort();
    if (overlap.length > 0) conflicts.push({ number: peer.number, files: overlap });
  }
  return conflicts.sort((a, b) => Number(a.number) - Number(b.number));
}

function replaceRow(body, label, value) {
  const expression = new RegExp('^\\|\\s*' + escapeRegex(label) + '\\s*\\|.*\\|$', 'm');
  if (!expression.test(body)) return null;
  return body.replace(expression, `| ${label} | ${compactCell(value)} |`);
}

function removeDuplicateCadencePresentation(bodyText) {
  const original = String(bodyText || '');
  const summaryPattern =
    /^> 📦 \*\*package\.json:\*\*[^\n]*🚀 \*\*Render Production:\*\*[^\n]*⏳ \*\*Auto-Deploy:\*\*[^\n]*$/gm;
  const summaryMatches = [...original.matchAll(summaryPattern)];
  if (summaryMatches.length > 1) return null;

  let body = summaryMatches.length === 1 ? original.replace(summaryPattern, '') : original;
  const heading = '### 🚀 Production & Cadence';
  const headingCount = body.split(heading).length - 1;
  if (headingCount > 1) return null;
  if (headingCount === 0) return body;

  const decisionTableHeader = '| Frage | Ergebnis |';
  const sectionStart = body.indexOf(heading);
  const decisionTableIndex = body.indexOf(decisionTableHeader, sectionStart + heading.length);
  if (sectionStart < 0 || decisionTableIndex < 0) return null;

  const candidateLines = body
    .slice(sectionStart, decisionTableIndex)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const expectedLabels = [
    'CURRENT_MAIN',
    'Live Production',
    'Render Production PR',
    'Deploy-Cadence',
    'Nächstes Deploy-Ziel',
    'Plattformversion',
    'Version-Cadence',
    'Nächstes PATCH-Ziel',
  ];
  if (
    candidateLines.length !== 3 + expectedLabels.length ||
    candidateLines[0] !== heading ||
    candidateLines[1] !== '| Production-Signal | Zustand |' ||
    candidateLines[2] !== '|---|---|' ||
    candidateLines.slice(3).some((line) => !/^\|.*\|$/.test(line))
  ) {
    return null;
  }

  const observedLabels = candidateLines.slice(3).map((line) => line.split('|')[1]?.trim() || '');
  if (observedLabels.some((label, index) => label !== expectedLabels[index])) return null;

  const before = body.slice(0, sectionStart).replace(/\s+$/, '');
  const after = body.slice(decisionTableIndex).replace(/^\s+/, '');
  return before + '\n\n' + after;
}

function canonicalEvidenceTable(gates, details = {}) {
  return [
    '| Gate | Status | Warum offen / blockiert | Nächster verifizierbarer Schritt |',
    '|---|---|---|---|',
    ...decisionEvidenceRows(gates, details).map(({ label, status, reason, nextStep }) =>
      `| ${label} | ${status} | ${compactCell(reason)} | ${compactCell(nextStep)} |`
    ),
  ].join('\n');
}

const VERSION_CADENCE_EVIDENCE_START = '<!-- CAPITAL_AI_VERSION_CADENCE_EVIDENCE_START -->';
const VERSION_CADENCE_EVIDENCE_END = '<!-- CAPITAL_AI_VERSION_CADENCE_EVIDENCE_END -->';

function renderVersionCadenceEvidenceTable(evidence = deriveVersionCadenceEvidence({})) {
  return [
    VERSION_CADENCE_EVIDENCE_START,
    '### 📦 Version & Deploy Cadence',
    '',
    '| Live Evidence | Wert |',
    '|---|---|',
    '| Aktuelle Version | `' + compactCell(String(evidence.currentVersion ?? 'N/A')) + '` |',
    '| Deploy-Zyklus bis nächste Version | `' + compactCell(String(evidence.deployProgress ?? 'N/A')) + '/' +
      compactCell(String(evidence.deployTotal ?? 'N/A')) + '` · noch `' + compactCell(String(evidence.deployRemaining ?? 'N/A')) +
      '` Deploy-Grenze(n) |',
    '| Merge-Fortschritt bis nächste Version | `' + compactCell(String(evidence.versionProgress ?? 'N/A')) +
      '/10` · noch `' + compactCell(String(evidence.versionRemaining ?? 'N/A')) + '` Merge(s) |',
    '| Nächstes PATCH | `' + compactCell(String(evidence.nextPatchVersion ?? 'N/A')) + '` |',
    VERSION_CADENCE_EVIDENCE_END,
  ].join('\n');
}

function upsertVersionCadenceEvidenceTable(bodyText, evidence) {
  const body = String(bodyText || '');
  const startCount = body.split(VERSION_CADENCE_EVIDENCE_START).length - 1;
  const endCount = body.split(VERSION_CADENCE_EVIDENCE_END).length - 1;
  if (startCount > 1 || endCount > 1 || startCount !== endCount) return null;

  const block = renderVersionCadenceEvidenceTable(evidence);
  if (startCount === 1) {
    const start = body.indexOf(VERSION_CADENCE_EVIDENCE_START);
    const end = body.indexOf(VERSION_CADENCE_EVIDENCE_END, start) + VERSION_CADENCE_EVIDENCE_END.length;
    return body.slice(0, start) + block + body.slice(end);
  }

  const evidenceHeading = '## 2. ✅ Evidence';
  const technicalHeading = '## 3. 🔍 Technical Evidence';
  const sectionStart = body.indexOf(evidenceHeading);
  const sectionEnd = body.indexOf(technicalHeading, sectionStart + evidenceHeading.length);
  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) return null;

  const before = body.slice(0, sectionEnd).replace(/\s+$/, '');
  const after = body.slice(sectionEnd).replace(/^\s+/, '');
  return before + '\n\n' + block + '\n\n' + after;
}

function replaceCanonicalEvidenceTable(bodyText, gates, details = {}) {
  const body = String(bodyText || '');
  const evidenceHeading = '## 2. ✅ Evidence';
  const technicalHeading = '## 3. 🔍 Technical Evidence';
  const sectionStart = body.indexOf(evidenceHeading);
  const sectionEnd = body.indexOf(technicalHeading, sectionStart + evidenceHeading.length);
  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) return null;

  const sectionPrefixEnd = sectionStart + evidenceHeading.length;
  const section = body.slice(sectionPrefixEnd, sectionEnd);
  const table = canonicalEvidenceTable(gates, details);
  const tablePattern = /^\| Gate \| Status[^\n]*\n\|[-:| ]+\|(?:\n\|[^\n]*\|)*/m;

  let nextSection;
  if (tablePattern.test(section)) {
    nextSection = section.replace(tablePattern, table);
  } else {
    nextSection = `\n\n${table}\n${section.replace(/^\s*/, '')}`;
  }

  return body.slice(0, sectionPrefixEnd) + nextSection + body.slice(sectionEnd);
}

function ensureDecisionStatusLine(bodyText, decisionStatus) {
  const body = String(bodyText || '');
  const exactStatus =
    /^> 🧭 \*\*Entscheidungsstatus: (READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED)\*\*\s*$/gm;
  const exactMatches = [...body.matchAll(exactStatus)];
  if (exactMatches.length > 1) return null;
  if (exactMatches.length === 1) {
    return body.replace(
      /^> 🧭 \*\*Entscheidungsstatus: (READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED)\*\*\s*$/m,
      `> 🧭 **Entscheidungsstatus: ${decisionStatus}**`,
    );
  }

  const malformedStatus = /^> 🧭 \*\*Entscheidungsstatus:[^\n]*$/gm;
  const malformedMatches = [...body.matchAll(malformedStatus)];
  if (malformedMatches.length > 1) return null;
  if (malformedMatches.length === 1) {
    return body.replace(
      /^> 🧭 \*\*Entscheidungsstatus:[^\n]*$/m,
      `> 🧭 **Entscheidungsstatus: ${decisionStatus}**`,
    );
  }

  const decisionHeadingIndex = body.indexOf('## 1. 🧭 Entscheidung');
  if (decisionHeadingIndex < 0) return null;
  const prefix = body.slice(0, decisionHeadingIndex);
  const headings = [...prefix.matchAll(/^# (?!#).+$/gm)];
  if (headings.length !== 1) return null;
  const heading = headings[0][0];
  const headingEnd = prefix.indexOf(heading) + heading.length;
  return body.slice(0, headingEnd) +
    `\n\n> 🧭 **Entscheidungsstatus: ${decisionStatus}**` +
    body.slice(headingEnd);
}

function upsertLiveDashboard(bodyText, gates, decisionStatus) {
  const body = String(bodyText || '');
  const decisionHeading = '## 1. 🧭 Entscheidung';
  const evidenceHeading = '## 2. ✅ Evidence';
  const decisionStart = body.indexOf(decisionHeading);
  const evidenceStart = body.indexOf(evidenceHeading, decisionStart + decisionHeading.length);
  if (decisionStart < 0 || evidenceStart < 0) return null;

  const marker = '### 📡 Live Dashboard';
  const markerCount = body.split(marker).length - 1;
  if (markerCount > 1) return null;

  const dashboard = [
    marker,
    '',
    '| Live-Signal | Zustand |',
    '|---|---|',
    '| Status | ' + decisionStatus + ' |',
    '| Synchronität | ' + compactCell(summarizeLiveDecisionSync(gates)) + ' |',
    '| Nächster Schritt | ' + compactCell(nextVerifiableDecisionStep(gates)) + ' |',
  ].join('\n');

  if (markerCount === 0) {
    const insertion = decisionStart + decisionHeading.length;
    return body.slice(0, insertion) + '\n\n' + dashboard + body.slice(insertion);
  }

  const section = body.slice(decisionStart, evidenceStart);
  const pattern = /### 📡 Live Dashboard\s*\n\s*\| Live-Signal \| Zustand \|\s*\n\|---\|---\|\s*\n\| Status \|[^\n]*\|\s*\n\| Synchronität \|[^\n]*\|\s*\n\| Nächster Schritt \|[^\n]*\|/m;
  if (pattern.test(section)) {
    const updatedSection = section.replace(pattern, dashboard);
    return body.slice(0, decisionStart) + updatedSection + body.slice(evidenceStart);
  }

  // Bounded recovery for a uniquely identifiable v1.8 dashboard table that drifted
  // from the canonical three-row projection. This is intentionally narrower than a
  // generic markdown rewrite: only the single Live Dashboard table directly before
  // the canonical Human Decision table may be replaced.
  const decisionTableHeader = '| Frage | Ergebnis |';
  const decisionTableCount = section.split(decisionTableHeader).length - 1;
  const markerIndex = section.indexOf(marker);
  const decisionTableIndex = section.indexOf(decisionTableHeader, markerIndex + marker.length);
  if (decisionTableCount !== 1 || markerIndex < 0 || decisionTableIndex < 0) return null;

  const candidate = section.slice(markerIndex, decisionTableIndex).trim();
  const candidateLines = candidate.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (
    candidateLines[0] !== marker ||
    candidateLines.length < 3 ||
    candidateLines.length > 20 ||
    candidateLines.slice(1).some((line) => !/^\|.*\|$/.test(line)) ||
    candidateLines.filter((line) => line === '| Live-Signal | Zustand |').length !== 1
  ) {
    return null;
  }

  const updatedSection =
    section.slice(0, markerIndex) +
    dashboard +
    '\n\n' +
    section.slice(decisionTableIndex);
  return body.slice(0, decisionStart) + updatedSection + body.slice(evidenceStart);
}

function upsertDecisionSummaryRow(bodyText, label, value) {
  const body = String(bodyText || '');
  const replaced = replaceRow(body, label, value);
  if (replaced != null) return replaced;

  const decisionStart = body.indexOf('## 1. 🧭 Entscheidung');
  const evidenceStart = body.indexOf('## 2. ✅ Evidence', decisionStart + 1);
  if (decisionStart < 0 || evidenceStart < 0) return null;
  const section = body.slice(decisionStart, evidenceStart);
  const anchorExpressions = [
    /^\|\s*Owner-Aktion\s*\|.*\|$/gm,
    /^\|\s*Human-\/CODEOWNER-Entscheidung\s*\|.*\|$/gm,
  ];
  const anchors = anchorExpressions.flatMap((expression) => [...section.matchAll(expression)]);
  if (anchors.length !== 1) return null;
  const anchorRow = anchors[0][0];
  const normalizedAnchorRow = /^\|\s*Human-\/CODEOWNER-Entscheidung\s*\|/.test(anchorRow)
    ? '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |'
    : anchorRow;
  const updatedSection = section.replace(
    anchorRow,
    `| ${label} | ${compactCell(value)} |\n${normalizedAnchorRow}`,
  );
  return body.slice(0, decisionStart) + updatedSection + body.slice(evidenceStart);
}

function migrateV17DecisionContract(bodyText) {
  const body = String(bodyText || '');
  const detected = detectPrTemplateVersion(body);
  if (detected === PR_TEMPLATE_VERSION) {
    return { eligible: true, migrated: false, reason: 'current-contract', body };
  }
  if (detected !== '1.7.0') {
    return { eligible: false, migrated: false, reason: 'unsupported-template-version', body };
  }

  const legacyMarker = 'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0';
  const markerCount = body.split(legacyMarker).length - 1;
  const requiredHeadings = [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ];
  if (
    markerCount !== 2 ||
    requiredHeadings.some((heading) => body.split(heading).length - 1 !== 1)
  ) {
    return { eligible: false, migrated: false, reason: 'v1.7-migration-boundary-ambiguous', body };
  }

  const migrated = body.replaceAll(legacyMarker, PR_TEMPLATE_MARKER);
  if (detectPrTemplateVersion(migrated) !== PR_TEMPLATE_VERSION) {
    throw new Error('v1.7 -> v' + PR_TEMPLATE_VERSION + ' migration did not converge.');
  }
  return {
    eligible: true,
    migrated: true,
    reason: 'v1.7-to-v1.8-live-dashboard-contract',
    body: migrated,
  };
}

export function reconcileDecisionBody(bodyText, gates, details = {}) {
  const original = String(bodyText || '');
  const contract = migrateV17DecisionContract(original);
  if (!contract.eligible || !contract.body.includes(PR_TEMPLATE_MARKER)) {
    return { eligible: false, changed: false, reason: contract.reason, body: original };
  }

  const requiredHeadings = [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ];
  if (requiredHeadings.some((heading) => contract.body.split(heading).length - 1 !== 1)) {
    return { eligible: false, changed: false, reason: 'decision-section-boundary-ambiguous', body: original };
  }
  if (contract.body.split('<summary>Technische Details & Traceability</summary>').length - 1 !== 1) {
    return { eligible: false, changed: false, reason: 'technical-evidence-details-boundary-missing', body: original };
  }
  if (contract.body.split('<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>').length - 1 !== 1) {
    return { eligible: false, changed: false, reason: 'production-baseline-details-boundary-missing', body: original };
  }

  const decisionStatus = deriveDecisionStatus(gates);
  let body = removeDuplicateCadencePresentation(contract.body);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'duplicate-cadence-presentation-boundary-ambiguous', body: original };
  }

  body = ensureDecisionStatusLine(body, decisionStatus);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-status-boundary-ambiguous', body: original };
  }

  body = upsertLiveDashboard(body, gates, decisionStatus);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'live-dashboard-boundary-ambiguous', body: original };
  }

  body = replaceCanonicalEvidenceTable(body, gates, details);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-evidence-section-missing', body: original };
  }

  body = upsertVersionCadenceEvidenceTable(body, details?.versionCadence);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'version-cadence-evidence-boundary-ambiguous', body: original };
  }

  body = upsertDecisionSummaryRow(body, 'Evidence', summarizeDecisionEvidence(gates));
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-evidence-summary-boundary-missing', body: original };
  }

  body = upsertDecisionSummaryRow(body, 'Blocker', summarizeDecisionBlockers(gates));
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-blocker-summary-boundary-missing', body: original };
  }

  return {
    eligible: true,
    changed: body !== original,
    reason:
      body === original
        ? 'already-current'
        : contract.migrated
          ? 'v1.7-to-v1.8-live-dashboard-migrated'
          : 'decision-evidence-reconciled',
    decisionStatus,
    body,
  };
}

const CANONICAL_V18_HEADINGS = Object.freeze([
  '## 1. 🧭 Entscheidung',
  '## 2. ✅ Evidence',
  '## 3. 🔍 Technical Evidence',
]);

function validateCanonicalBootstrapBody(bodyText) {
  const body = String(bodyText || '');
  if (detectPrTemplateVersion(body) !== PR_TEMPLATE_VERSION) return 'bootstrap-template-version-invalid';
  const headings = body.match(/^## .+$/gm) || [];
  if (
    headings.length !== CANONICAL_V18_HEADINGS.length ||
    !CANONICAL_V18_HEADINGS.every((heading, index) => headings[index] === heading)
  ) return 'bootstrap-headings-noncanonical';
  if (/\{\{[A-Z0-9_]+\}\}/.test(body)) return 'bootstrap-has-unresolved-placeholders';
  if (body.split('<summary>Technische Details & Traceability</summary>').length - 1 !== 1) {
    return 'bootstrap-technical-evidence-details-boundary-invalid';
  }
  if (body.split('<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>').length - 1 !== 1) {
    return 'bootstrap-production-baseline-details-boundary-invalid';
  }
  for (const marker of [
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
  ]) {
    if (body.split(marker).length - 1 !== 1) return 'bootstrap-baseline-boundary-invalid';
  }
  return '';
}

export function reconcileDecisionBodyWithBootstrap(
  bodyText,
  canonicalBootstrapBody,
  gates,
  details = {},
) {
  const original = String(bodyText || '');
  const direct = reconcileDecisionBody(original, gates, details);
  if (direct.eligible) return { ...direct, bootstrapped: false };
  const bootstrapEligibleReasons = new Set([
    'decision-section-boundary-ambiguous',
    'technical-evidence-details-boundary-missing',
    'production-baseline-details-boundary-missing',
  ]);
  if (
    !bootstrapEligibleReasons.has(direct.reason) ||
    detectPrTemplateVersion(original) !== PR_TEMPLATE_VERSION
  ) {
    return { ...direct, bootstrapped: false };
  }

  const bootstrap = String(canonicalBootstrapBody || '');
  if (!bootstrap.trim()) return { ...direct, bootstrapped: false };

  const bootstrapError = validateCanonicalBootstrapBody(bootstrap);
  if (bootstrapError) {
    return {
      eligible: false,
      changed: false,
      reason: bootstrapError,
      body: original,
      bootstrapped: false,
    };
  }

  const reconciled = reconcileDecisionBody(bootstrap, gates, details);
  if (!reconciled.eligible) {
    return {
      eligible: false,
      changed: false,
      reason: 'bootstrap-' + reconciled.reason,
      body: original,
      bootstrapped: false,
    };
  }

  return {
    ...reconciled,
    changed: reconciled.body !== original,
    reason: 'canonical-v1.8-renderer-bootstrap-reconciled',
    bootstrapped: true,
  };
}


async function paginateArray(url, token) {
  const values = [];
  for (let page = 1; page <= 20; page += 1) {
    const separator = url.includes('?') ? '&' : '?';
    const chunk = await githubJson(`${url}${separator}per_page=100&page=${page}`, token);
    if (!Array.isArray(chunk)) fail(`Paginated endpoint did not return an array: ${url}`);
    values.push(...chunk);
    if (chunk.length < 100) break;
  }
  return values;
}

async function fetchCheckRuns(repository, sha, token) {
  const values = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await githubJson(
      `https://api.github.com/repos/${repository}/commits/${sha}/check-runs?per_page=100&page=${page}`,
      token,
    );
    const runs = Array.isArray(response?.check_runs) ? response.check_runs : [];
    values.push(...runs);
    if (runs.length < 100) break;
  }
  return values;
}

async function fetchPullFiles(repository, number, token) {
  const rows = await paginateArray(
    `https://api.github.com/repos/${repository}/pulls/${number}/files`,
    token,
  );
  return rows.map((row) => String(row?.filename || '')).filter(Boolean);
}

async function fetchDecisionPolicy(repository, token) {
  const summaries = await githubJson(`https://api.github.com/repos/${repository}/rulesets`, token);
  if (!Array.isArray(summaries)) fail('Repository rulesets could not be read deterministically.');
  const details = [];
  for (const summary of summaries) {
    if (summary?.target !== 'branch' || summary?.enforcement !== 'active' || !summary?.id) continue;
    const detail = await githubJson(
      `https://api.github.com/repos/${repository}/rulesets/${summary.id}`,
      token,
    );
    details.push(detail);
  }
  return collectDecisionPolicy(details);
}

async function evaluateOverlapLive(repository, prNumber, token) {
  const targetFiles = await fetchPullFiles(repository, prNumber, token);
  const open = await paginateArray(
    'https://api.github.com/repos/' + repository + '/pulls?state=open&base=main',
    token,
  );
  const peerPulls = [];
  for (const pr of open) {
    if (Number(pr?.number) === Number(prNumber)) continue;
    peerPulls.push({
      number: Number(pr.number),
      files: await fetchPullFiles(repository, Number(pr.number), token),
    });
  }
  return {
    targetFiles,
    conflicts: findExactOverlap(targetFiles, peerPulls),
  };
}

function checkObservation(requirement, checkRuns) {
  const run = latestMatchingCheck(requirement, checkRuns);
  const state = decisionStateForCheck(run);
  const observed = !run
    ? 'MISSING'
    : run.status !== 'completed'
      ? String(run.status || 'UNKNOWN').toUpperCase()
      : String(run.conclusion || 'UNKNOWN').toUpperCase();
  return { state, text: String(requirement.context || 'unknown') + '=' + observed };
}

function checkGateReason(requirements, checkRuns, gateState, passLabel) {
  const observations = (requirements || []).map((requirement) => checkObservation(requirement, checkRuns));
  if (gateState === 'PASS') return passLabel + ' (' + observations.length + ').';
  if (observations.length === 0) return 'Keine auswertbare Check-Policy vorhanden.';
  const relevant = observations.filter((entry) => entry.state !== 'PASS');
  const prefix = gateState === 'BLOCKED' ? 'Nicht erfolgreich: ' : 'Noch ausstehend: ';
  return prefix + (relevant.length > 0 ? relevant.map((entry) => entry.text).join(', ') : 'Evidence nicht terminal.');
}

function overlapGateReason(conflicts, gateState) {
  if (gateState === 'PASS') return 'Kein blockierender Changed-File-Overlap mit anderen offenen PRs erkannt.';
  if (!Array.isArray(conflicts) || conflicts.length === 0) return 'Overlap-Evidence ist noch nicht vollständig.';
  return 'Overlap erkannt: ' + conflicts.map((conflict) => {
    const files = (conflict.files || []).slice(0, 3);
    const remaining = Math.max(0, (conflict.files || []).length - files.length);
    return 'PR #' + conflict.number + ': ' + files.join(', ') + (remaining > 0 ? ' (+' + remaining + ')' : '');
  }).join('; ');
}

function liveGateDetails({ mainSha, headSha, compare, checkRuns, policy, governanceRequirement, overlaps, gates, cadence }) {
  const security = securityRequirements(policy);
  return {
    main: {
      reason: gates.main === 'PASS'
        ? 'PR-Head ' + headSha.slice(0, 12) + ' enthält CURRENT_MAIN ' + mainSha.slice(0, 12) + '.'
        : 'PR-Head ' + headSha.slice(0, 12) + ' enthält CURRENT_MAIN ' + mainSha.slice(0, 12) + ' nicht (compare=' + String(compare?.status || 'unknown') + ').',
    },
    scope: {
      reason: checkGateReason([governanceRequirement], checkRuns, gates.scope, 'PR Governance bestätigt Scope / Ownership'),
    },
    overlap: {
      reason: overlapGateReason(overlaps, gates.overlap),
    },
    checks: {
      reason: checkGateReason(policy.requiredChecks, checkRuns, gates.checks, 'Alle Required Checks sind auf dem Exact Head erfolgreich'),
    },
    security: {
      reason: checkGateReason(security, checkRuns, gates.security, 'Alle erforderlichen Security-/Compliance-Checks sind erfolgreich'),
    },
    baseline: {
      reason: gates.baseline === 'PASS'
        ? 'Production-Baseline ist für main ' + mainSha.slice(0, 12) + ' / head ' + headSha.slice(0, 12) + ' exakt oder cadence-konform als DEPLOYMENT_QUEUED korreliert.'
        : 'Produktions-Baseline ist weder exakt CURRENT_MAIN noch als gesunde kanonische DEPLOYMENT_QUEUED-Ancestor-Baseline für main ' + mainSha.slice(0, 12) + ' / head ' + headSha.slice(0, 12) + ' verifiziert.',
    },
    versionCadence: deriveVersionCadenceEvidence(cadence),
  };
}

async function evaluateSnapshot({
  repository,
  token,
  prNumber,
  pr,
  mainSha,
  productionBaseline = null,
  cadence = null,
}) {
  const body = String(pr?.body || '');
  const headSha = normalizeSha(pr?.head?.sha);
  if (!/^[0-9a-f]{40}$/.test(headSha)) fail('PR #' + prNumber + ' has invalid head SHA.');

  const [compare, checkRuns, policy, overlap] = await Promise.all([
    githubJson('https://api.github.com/repos/' + repository + '/compare/' + mainSha + '...' + headSha, token),
    fetchCheckRuns(repository, headSha, token),
    fetchDecisionPolicy(repository, token),
    evaluateOverlapLive(repository, prNumber, token),
  ]);

  const governanceRequirement =
    policy.requiredChecks.find((check) => check.context === GOVERNANCE_CONTEXT) ||
    { context: GOVERNANCE_CONTEXT, integrationId: null };

  const gates = {
    main: ['ahead', 'identical'].includes(String(compare?.status || '')) ? 'PASS' : 'BLOCKED',
    scope: gateForRequirements([governanceRequirement], checkRuns),
    overlap: overlap.conflicts.length === 0 ? 'PASS' : 'BLOCKED',
    checks: gateForRequirements(policy.requiredChecks, checkRuns),
    security: gateForRequirements(securityRequirements(policy), checkRuns),
    baseline: evaluateProductionBaseline(body, mainSha, headSha, {
      productionBaseline,
      cadence,
      repository,
    }),
  };

  return {
    headSha,
    compare,
    checkRuns,
    policy,
    governanceRun: latestMatchingCheck(governanceRequirement, checkRuns),
    files: overlap.targetFiles,
    overlaps: overlap.conflicts,
    gates,
    gateDetails: liveGateDetails({
      mainSha,
      headSha,
      compare,
      checkRuns,
      policy,
      governanceRequirement,
      overlaps: overlap.conflicts,
      gates,
      cadence,
    }),
  };
}

async function mutateAutoMerge({ repository, token, pr, enabled }) {
  const pullRequestId = String(pr?.node_id || '');
  if (!pullRequestId) fail('PR #' + String(pr?.number || '?') + ' has no GraphQL node_id.');

  let query;
  let variables;
  if (enabled) {
    const settings = await githubJson('https://api.github.com/repos/' + repository, token);
    if (settings?.allow_auto_merge !== true) fail('Repository-level auto-merge capability is disabled.');
    const mergeMethod = resolveAutoMergeMethod(settings);
    if (!mergeMethod) fail('Repository exposes no supported auto-merge method.');
    query = 'mutation($pullRequestId:ID!,$mergeMethod:PullRequestMergeMethod!){enablePullRequestAutoMerge(input:{pullRequestId:$pullRequestId,mergeMethod:$mergeMethod}){pullRequest{number autoMergeRequest{enabledAt mergeMethod}}}}';
    variables = { pullRequestId, mergeMethod };
  } else {
    query = 'mutation($pullRequestId:ID!){disablePullRequestAutoMerge(input:{pullRequestId:$pullRequestId}){pullRequest{number autoMergeRequest{enabledAt mergeMethod}}}}';
    variables = { pullRequestId };
  }

  const response = await githubJson('https://api.github.com/graphql', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (Array.isArray(response?.errors) && response.errors.length > 0) {
    fail('GitHub auto-merge mutation failed: ' + response.errors.map((item) => item?.message || 'unknown').join('; '));
  }
  const key = enabled ? 'enablePullRequestAutoMerge' : 'disablePullRequestAutoMerge';
  const observed = response?.data?.[key]?.pullRequest;
  if (!observed || Number(observed.number) !== Number(pr.number)) {
    fail('GitHub auto-merge mutation readback missing for PR #' + pr.number + '.');
  }
  if (enabled && !observed.autoMergeRequest) fail('GitHub auto-merge arming readback missing for PR #' + pr.number + '.');
  if (!enabled && observed.autoMergeRequest) fail('GitHub auto-merge disable readback still active for PR #' + pr.number + '.');
  return observed;
}

async function reconcileOne({
  repository,
  token,
  prNumber,
  canonicalBootstrapBody = '',
  productionBaseline = null,
  prClass = 'N/A',
  cadenceRepoRoot = '',
}) {
  let pr = await githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token);
  if (pr?.state !== 'open' || pr?.base?.ref !== 'main' || pr?.head?.repo?.full_name !== repository) {
    console.log('[PR-DECISION] PR #' + prNumber + ' outside mutable open/same-repo/main boundary; skipped.');
    return { changed: false, skipped: true, reason: 'outside-mutable-boundary' };
  }

  const originalBody = String(pr?.body || '');
  const main = await githubJson('https://api.github.com/repos/' + repository + '/branches/main', token);
  const mainSha = normalizeSha(main?.commit?.sha);
  if (!/^[0-9a-f]{40}$/.test(mainSha)) fail('CURRENT_MAIN could not be resolved.');

  let cadence = null;
  if (productionBaseline && cadenceRepoRoot) {
    try {
      cadence = resolveMergeCadence({
        repoRoot: cadenceRepoRoot,
        ref: mainSha,
        productionSha: normalizeSha(productionBaseline?.production?.commitSha),
        productionHealthy: productionBaseline?.checks?.productionHealthy === true,
      });
    } catch (error) {
      console.warn(
        '[PR-DECISION] Cadence evidence could not be resolved; queued Production remains fail-closed: ' +
        (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  const leadingProjection = productionBaseline
    ? prepareLeadingPrBody(originalBody, productionBaseline, { prClass })
    : { eligible: false, changed: false, reason: 'production-baseline-missing', body: originalBody };

  const projectionSeedBody = leadingProjection.eligible ? leadingProjection.body : originalBody;
  const snapshotPr = { ...pr, body: projectionSeedBody };
  const snapshot = await evaluateSnapshot({
    repository,
    token,
    prNumber,
    pr: snapshotPr,
    mainSha,
    productionBaseline,
    cadence,
  });
  const rendered = reconcileDecisionBodyWithBootstrap(
    projectionSeedBody,
    canonicalBootstrapBody,
    snapshot.gates,
    snapshot.gateDetails,
  );
  const classification = classifyAutoMergeEligibility({
    pr,
    repository,
    body: rendered.eligible ? rendered.body : originalBody,
    files: snapshot.files,
    gates: snapshot.gates,
    compareStatus: snapshot.compare?.status,
  });

  if (!rendered.eligible) {
    console.log('[PR-DECISION] PR #' + prNumber + ': body not safely mutable (' + rendered.reason + '); no write or arming.');
    return {
      changed: false,
      skipped: true,
      reason: rendered.reason,
      gates: snapshot.gates,
      branchSyncRequired: classification.branchSyncRequired,
      autoMergeEligible: false,
      autoMergeState: HUMAN_MERGE_REQUIRED,
      autoMergeReason: rendered.reason,
    };
  }

  const requiredChecks = requiredCheckEvidence(snapshot.policy);
  const requiredChecksFingerprint = requiredCheckFingerprint(snapshot.policy);
  const contract = classification.eligible ? AUTO_MERGE_ELIGIBLE : HUMAN_MERGE_REQUIRED;
  const autoMergeReason = classification.eligible
    ? 'all-contract-gates-pass'
    : (classification.reasons.join(',') || 'policy-ineligible');
  const correlation = classification.eligible ? 'PASS' : 'BLOCKED';
  const expectedEvidence = {
    contract,
    headSha: snapshot.headSha,
    baseSha: mainSha,
    requiredChecksFingerprint,
    correlation,
    reason: autoMergeReason,
  };
  const previousEvidence = parseAutoMergeEvidence(originalBody);
  const evaluatedAt =
    autoMergeEvidenceMatches(previousEvidence, expectedEvidence) && previousEvidence?.evaluatedAt
      ? previousEvidence.evaluatedAt
      : new Date().toISOString();

  const projection = reconcileAutoMergeProjection(rendered.body, {
    ...expectedEvidence,
    requiredChecks,
    state: classification.eligible ? 'ELIGIBLE_PENDING_PROVIDER_ARMING' : HUMAN_MERGE_REQUIRED,
    evaluatedAt,
  });
  if (!projection.eligible) {
    console.log('[PR-DECISION] PR #' + prNumber + ': auto-merge projection refused (' + projection.reason + ').');
    return {
      changed: false,
      skipped: true,
      reason: projection.reason,
      gates: snapshot.gates,
      branchSyncRequired: classification.branchSyncRequired,
      autoMergeEligible: false,
      autoMergeState: HUMAN_MERGE_REQUIRED,
      autoMergeReason: projection.reason,
    };
  }

  const candidateBody = projection.body;
  const bodyChanged = candidateBody !== originalBody;
  let [livePr, liveMain] = await Promise.all([
    githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token),
    githubJson('https://api.github.com/repos/' + repository + '/branches/main', token),
  ]);
  if (
    livePr?.state !== 'open' ||
    livePr?.base?.ref !== 'main' ||
    livePr?.head?.repo?.full_name !== repository ||
    normalizeSha(livePr?.head?.sha) !== snapshot.headSha ||
    normalizeSha(liveMain?.commit?.sha) !== mainSha ||
    String(livePr?.body || '') !== originalBody
  ) {
    console.log('[PR-DECISION] PR #' + prNumber + ': snapshot drift before mutation; later event will reconcile.');
    return {
      changed: false,
      skipped: true,
      reason: 'snapshot-drift-before-write',
      gates: snapshot.gates,
      branchSyncRequired: classification.branchSyncRequired,
      autoMergeEligible: false,
      autoMergeState: HUMAN_MERGE_REQUIRED,
      autoMergeReason: 'snapshot-drift-before-write',
    };
  }

  if (bodyChanged) {
    if (livePr?.auto_merge) {
      await mutateAutoMerge({ repository, token, pr: livePr, enabled: false });
    }

    const updated = await githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: candidateBody }),
    });

    const observedBody = String(updated?.body || '');
    const observedStatus = extractDecisionStatus(observedBody);
    const observedGates = extractDecisionGates(observedBody);
    if (observedStatus !== rendered.decisionStatus) {
      fail('PR #' + prNumber + ' write readback has unexpected decision status ' + String(observedStatus) + '.');
    }
    for (const { key } of PR_DECISION_GATES) {
      if (observedGates[key] !== snapshot.gates[key]) {
        fail('PR #' + prNumber + ' write readback mismatch for gate ' + key + '.');
      }
    }
    if (!autoMergeEvidenceMatches(parseAutoMergeEvidence(observedBody), expectedEvidence)) {
      fail('PR #' + prNumber + ' auto-merge declaration readback mismatch.');
    }

    console.log(
      '[PR-DECISION] PR #' + prNumber + ': ' + rendered.decisionStatus +
      '; auto_merge_contract=' + contract +
      '; declaration written; provider arming waits for fresh Governance revalidation.',
    );
    return {
      changed: true,
      skipped: false,
      reason: 'decision-and-auto-merge-evidence-reconciled',
      gates: snapshot.gates,
      decisionStatus: rendered.decisionStatus,
      branchSyncRequired: classification.branchSyncRequired,
      autoMergeEligible: classification.eligible,
      autoMergeState: classification.eligible ? 'DECLARED_PENDING_REVALIDATION' : HUMAN_MERGE_REQUIRED,
      autoMergeReason,
      autoMergeHead: snapshot.headSha,
      autoMergeBase: mainSha,
      requiredChecks: requiredChecks.join('; '),
      evaluatedAt,
    };
  }

  if (!classification.eligible) {
    let state = HUMAN_MERGE_REQUIRED;
    if (livePr?.auto_merge) {
      await mutateAutoMerge({ repository, token, pr: livePr, enabled: false });
      state = 'DISARMED_HUMAN_MERGE_REQUIRED';
    }
    console.log('[PR-DECISION] PR #' + prNumber + ': ' + state + '; reason=' + autoMergeReason + '.');
    return {
      changed: false,
      skipped: false,
      reason: 'already-current',
      gates: snapshot.gates,
      decisionStatus: rendered.decisionStatus,
      branchSyncRequired: classification.branchSyncRequired,
      autoMergeEligible: false,
      autoMergeState: state,
      autoMergeReason,
      autoMergeHead: snapshot.headSha,
      autoMergeBase: mainSha,
      requiredChecks: requiredChecks.join('; '),
      evaluatedAt,
    };
  }

  const declaration = parseAutoMergeEvidence(originalBody);
  if (
    !autoMergeEvidenceMatches(declaration, expectedEvidence) ||
    !governanceCheckFreshAfterDeclaration(snapshot.governanceRun, declaration?.evaluatedAt)
  ) {
    console.log('[PR-DECISION] PR #' + prNumber + ': AUTO_MERGE_ELIGIBLE awaits fresh Governance revalidation.');
    return {
      changed: false,
      skipped: false,
      reason: 'governance-revalidation-pending',
      gates: snapshot.gates,
      decisionStatus: rendered.decisionStatus,
      branchSyncRequired: false,
      autoMergeEligible: true,
      autoMergeState: 'DECLARED_PENDING_REVALIDATION',
      autoMergeReason,
      autoMergeHead: snapshot.headSha,
      autoMergeBase: mainSha,
      requiredChecks: requiredChecks.join('; '),
      evaluatedAt: declaration?.evaluatedAt || evaluatedAt,
    };
  }

  livePr = await githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token);
  liveMain = await githubJson('https://api.github.com/repos/' + repository + '/branches/main', token);
  if (
    livePr?.state !== 'open' ||
    livePr?.base?.ref !== 'main' ||
    livePr?.head?.repo?.full_name !== repository ||
    normalizeSha(livePr?.head?.sha) !== snapshot.headSha ||
    normalizeSha(liveMain?.commit?.sha) !== mainSha ||
    String(livePr?.body || '') !== originalBody
  ) {
    return {
      changed: false,
      skipped: true,
      reason: 'snapshot-drift-before-auto-merge-arm',
      gates: snapshot.gates,
      autoMergeEligible: false,
      autoMergeState: HUMAN_MERGE_REQUIRED,
      autoMergeReason: 'snapshot-drift-before-auto-merge-arm',
    };
  }

  const finalSnapshot = await evaluateSnapshot({
    repository,
    token,
    prNumber,
    pr: livePr,
    mainSha,
    productionBaseline,
    cadence,
  });
  const finalClassification = classifyAutoMergeEligibility({
    pr: livePr,
    repository,
    body: originalBody,
    files: finalSnapshot.files,
    gates: finalSnapshot.gates,
    compareStatus: finalSnapshot.compare?.status,
  });
  const finalExpected = {
    contract: AUTO_MERGE_ELIGIBLE,
    headSha: finalSnapshot.headSha,
    baseSha: mainSha,
    requiredChecksFingerprint: requiredCheckFingerprint(finalSnapshot.policy),
    correlation: 'PASS',
    reason: 'all-contract-gates-pass',
  };
  const finalDeclaration = parseAutoMergeEvidence(originalBody);
  if (
    !finalClassification.eligible ||
    !autoMergeEvidenceMatches(finalDeclaration, finalExpected) ||
    !governanceCheckFreshAfterDeclaration(finalSnapshot.governanceRun, finalDeclaration?.evaluatedAt)
  ) {
    console.log('[PR-DECISION] PR #' + prNumber + ': final auto-merge revalidation failed closed.');
    return {
      changed: false,
      skipped: false,
      reason: 'final-auto-merge-revalidation-failed',
      gates: finalSnapshot.gates,
      branchSyncRequired: finalClassification.branchSyncRequired,
      autoMergeEligible: false,
      autoMergeState: HUMAN_MERGE_REQUIRED,
      autoMergeReason: finalClassification.reasons.join(',') || 'revalidation-failed',
    };
  }

  const armedAt = new Date().toISOString();
  if (!livePr?.auto_merge) {
    await mutateAutoMerge({ repository, token, pr: livePr, enabled: true });
  }
  const readback = await githubJson('https://api.github.com/repos/' + repository + '/pulls/' + prNumber, token);
  if (!readback?.auto_merge) fail('PR #' + prNumber + ' auto-merge readback is not active after arming.');

  console.log(
    '[PR-AUTO-MERGE] ARMED pr=' + prNumber +
    ' head=' + finalSnapshot.headSha +
    ' base=' + mainSha +
    ' checks=' + requiredCheckEvidence(finalSnapshot.policy).join(';') +
    ' correlation=PASS at=' + armedAt,
  );
  return {
    changed: false,
    skipped: false,
    reason: 'auto-merge-armed',
    gates: finalSnapshot.gates,
    decisionStatus: rendered.decisionStatus,
    branchSyncRequired: false,
    autoMergeEligible: true,
    autoMergeState: 'ARMED',
    autoMergeReason: 'all-contract-gates-pass',
    autoMergeHead: finalSnapshot.headSha,
    autoMergeBase: mainSha,
    requiredChecks: requiredCheckEvidence(finalSnapshot.policy).join('; '),
    evaluatedAt: finalDeclaration.evaluatedAt,
    armedAt,
  };
}

async function main() {
  const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const prNumber = Number(process.env.PR_NUMBER || 0);
  if (!repository || !repository.includes('/')) fail('GITHUB_REPOSITORY is missing or invalid.');
  if (!token) fail('GITHUB_TOKEN/GH_TOKEN is missing.');
  if (!Number.isInteger(prNumber) || prNumber <= 0) fail('PR_NUMBER must identify one open pull request.');

  const bootstrapPath = String(process.env.PR_CANONICAL_BOOTSTRAP_BODY || '').trim();
  const canonicalBootstrapBody = bootstrapPath && fs.existsSync(bootstrapPath)
    ? fs.readFileSync(bootstrapPath, 'utf8')
    : '';
  const baselinePath = String(process.env.PR_BASELINE_OUTPUT || '').trim();
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    fail('PR_BASELINE_OUTPUT must point to one trusted production baseline artifact.');
  }
  const productionBaseline = readJsonFile(baselinePath);
  const prClass = String(process.env.PR_CHECK_CLASS || 'N/A').trim() || 'N/A';
  const result = await reconcileOne({
    repository,
    token,
    prNumber,
    canonicalBootstrapBody,
    productionBaseline,
    prClass,
    cadenceRepoRoot: String(process.env.PR_CADENCE_REPO_ROOT || '').trim(),
  });
  appendGithubOutput({
    changed: String(result.changed === true),
    skipped: String(result.skipped === true),
    reason: result.reason || '',
    decision_status: result.decisionStatus || '',
    gate_main: result.gates?.main || '',
    gate_scope: result.gates?.scope || '',
    gate_overlap: result.gates?.overlap || '',
    gate_checks: result.gates?.checks || '',
    gate_security: result.gates?.security || '',
    gate_baseline: result.gates?.baseline || '',
    branch_sync_required: String(result.branchSyncRequired === true),
    auto_merge_eligible: String(result.autoMergeEligible === true),
    auto_merge_state: result.autoMergeState || '',
    auto_merge_reason: result.autoMergeReason || '',
    auto_merge_head: result.autoMergeHead || '',
    auto_merge_base: result.autoMergeBase || '',
    auto_merge_required_checks: result.requiredChecks || '',
    auto_merge_evaluated_at: result.evaluatedAt || '',
    auto_merge_armed_at: result.armedAt || '',
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reconcilePrDecisionEvidence.mjs')) {
  await main();
}
