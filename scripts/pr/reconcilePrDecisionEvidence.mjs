#!/usr/bin/env node

import {
  PR_TEMPLATE_MARKER,
  appendGithubOutput,
  fail,
  githubJson,
} from './lib.mjs';
import {
  PR_DECISION_GATES,
  deriveDecisionStatus,
  extractDecisionGates,
  extractDecisionStatus,
  formatDecisionGateState,
  summarizeDecisionBlockers,
  summarizeDecisionEvidence,
} from './prDecisionState.mjs';

const SECURITY_CONTEXT_PATTERN = /(gitguardian|hardened image|security|cve|vulnerab|license compliance)/i;
const GOVERNANCE_CONTEXT = 'PR Governance (Kosten / Workflow / Vorlage)';
const LICENSE_CONTEXT = 'License compliance check';

export function normalizeSha(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compactCell(value) {
  return String(value || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
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

export function evaluateProductionBaseline(bodyText, mainSha, headSha) {
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
  return productionSha === expectedMain &&
    baselineMainSha === expectedMain &&
    baselineHeadSha === expectedHead &&
    productionBranch === 'main' &&
    productionDrift === '0'
    ? 'PASS'
    : 'BLOCKED';
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

function canonicalEvidenceTable(gates) {
  return [
    '| Gate | Status |',
    '|---|---|',
    ...PR_DECISION_GATES.map(({ key, label }) =>
      `| ${label} | ${formatDecisionGateState(gates?.[key])} |`
    ),
  ].join('\n');
}

function replaceCanonicalEvidenceTable(bodyText, gates) {
  const body = String(bodyText || '');
  const evidenceHeading = '## 2. ✅ Evidence';
  const technicalHeading = '## 3. 🔍 Technical Evidence';
  const sectionStart = body.indexOf(evidenceHeading);
  const sectionEnd = body.indexOf(technicalHeading, sectionStart + evidenceHeading.length);
  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) return null;

  const sectionPrefixEnd = sectionStart + evidenceHeading.length;
  const section = body.slice(sectionPrefixEnd, sectionEnd);
  const table = canonicalEvidenceTable(gates);
  const tablePattern = /\| Gate \| Status \|\s*\n\|---\|---\|(?:\s*\n\|[^\n]*\|[^\n]*\|)*/m;

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

function upsertDecisionSummaryRow(bodyText, label, value) {
  const body = String(bodyText || '');
  const replaced = replaceRow(body, label, value);
  if (replaced != null) return replaced;

  const decisionStart = body.indexOf('## 1. 🧭 Entscheidung');
  const evidenceStart = body.indexOf('## 2. ✅ Evidence', decisionStart + 1);
  if (decisionStart < 0 || evidenceStart < 0) return null;
  const section = body.slice(decisionStart, evidenceStart);
  const ownerExpression = /^\|\s*Owner-Aktion\s*\|.*\|$/m;
  if (!ownerExpression.test(section)) return null;
  const updatedSection = section.replace(
    ownerExpression,
    `| ${label} | ${compactCell(value)} |\n$&`,
  );
  return body.slice(0, decisionStart) + updatedSection + body.slice(evidenceStart);
}

export function reconcileDecisionBody(bodyText, gates) {
  const original = String(bodyText || '');
  if (!original.includes(PR_TEMPLATE_MARKER) || !/CAPITAL_AI_PR_TEMPLATE_VERSION:\s*1\.7\.0/.test(original)) {
    return { eligible: false, changed: false, reason: 'non-v1.7-body', body: original };
  }

  const requiredHeadings = [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ];
  if (requiredHeadings.some((heading) => original.split(heading).length - 1 !== 1)) {
    return { eligible: false, changed: false, reason: 'decision-section-boundary-ambiguous', body: original };
  }

  const decisionStatus = deriveDecisionStatus(gates);
  let body = ensureDecisionStatusLine(original, decisionStatus);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-status-boundary-ambiguous', body: original };
  }

  body = replaceCanonicalEvidenceTable(body, gates);
  if (body == null) {
    return { eligible: false, changed: false, reason: 'decision-evidence-section-missing', body: original };
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
    reason: body === original ? 'already-current' : 'decision-evidence-reconciled',
    decisionStatus,
    body,
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
    `https://api.github.com/repos/${repository}/pulls?state=open&base=main`,
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
  return findExactOverlap(targetFiles, peerPulls);
}

async function reconcileOne({ repository, token, prNumber }) {
  let pr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
  if (pr?.state !== 'open' || pr?.base?.ref !== 'main' || pr?.head?.repo?.full_name !== repository) {
    console.log(`[PR-DECISION] PR #${prNumber} outside mutable open/same-repo/main boundary; skipped.`);
    return { changed: false, skipped: true, reason: 'outside-mutable-boundary' };
  }

  const originalBody = String(pr?.body || '');
  const headSha = normalizeSha(pr?.head?.sha);
  if (!/^[0-9a-f]{40}$/.test(headSha)) fail(`PR #${prNumber} has invalid head SHA.`);

  const main = await githubJson(`https://api.github.com/repos/${repository}/branches/main`, token);
  const mainSha = normalizeSha(main?.commit?.sha);
  if (!/^[0-9a-f]{40}$/.test(mainSha)) fail('CURRENT_MAIN could not be resolved.');

  const [compare, checkRuns, policy, overlaps] = await Promise.all([
    githubJson(`https://api.github.com/repos/${repository}/compare/${mainSha}...${headSha}`, token),
    fetchCheckRuns(repository, headSha, token),
    fetchDecisionPolicy(repository, token),
    evaluateOverlapLive(repository, prNumber, token),
  ]);

  const governanceRequirement =
    policy.requiredChecks.find((check) => check.context === GOVERNANCE_CONTEXT) ||
    { context: GOVERNANCE_CONTEXT, integrationId: null };

  const mainGate = ['ahead', 'identical'].includes(String(compare?.status || ''))
    ? 'PASS'
    : 'BLOCKED';
  const scopeGate = gateForRequirements([governanceRequirement], checkRuns);
  const overlapGate = overlaps.length === 0 ? 'PASS' : 'BLOCKED';
  const checksGate = gateForRequirements(policy.requiredChecks, checkRuns);
  const securityGate = gateForRequirements(securityRequirements(policy), checkRuns);
  const baselineGate = evaluateProductionBaseline(originalBody, mainSha, headSha);

  const gates = {
    main: mainGate,
    scope: scopeGate,
    overlap: overlapGate,
    checks: checksGate,
    security: securityGate,
    baseline: baselineGate,
  };

  const rendered = reconcileDecisionBody(originalBody, gates);
  if (!rendered.eligible) {
    console.log(`[PR-DECISION] PR #${prNumber}: body not safely mutable (${rendered.reason}); no write.`);
    return { changed: false, skipped: true, reason: rendered.reason, gates };
  }

  const [livePr, liveMain] = await Promise.all([
    githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token),
    githubJson(`https://api.github.com/repos/${repository}/branches/main`, token),
  ]);
  if (
    livePr?.state !== 'open' ||
    livePr?.base?.ref !== 'main' ||
    livePr?.head?.repo?.full_name !== repository ||
    normalizeSha(livePr?.head?.sha) !== headSha ||
    normalizeSha(liveMain?.commit?.sha) !== mainSha ||
    String(livePr?.body || '') !== originalBody
  ) {
    console.log(`[PR-DECISION] PR #${prNumber}: live snapshot drifted before write; later event will reconcile it.`);
    return { changed: false, skipped: true, reason: 'snapshot-drift-before-write', gates };
  }

  if (!rendered.changed) {
    console.log(`[PR-DECISION] PR #${prNumber}: ${rendered.decisionStatus}; body already current.`);
    return { changed: false, skipped: false, reason: 'already-current', gates, decisionStatus: rendered.decisionStatus };
  }

  const updated = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: rendered.body }),
  });

  const observedBody = String(updated?.body || '');
  const observedStatus = extractDecisionStatus(observedBody);
  const observedGates = extractDecisionGates(observedBody);
  if (observedStatus !== rendered.decisionStatus) {
    fail(`PR #${prNumber} write readback has unexpected decision status ${String(observedStatus)}.`);
  }
  for (const { key } of PR_DECISION_GATES) {
    if (observedGates[key] !== gates[key]) {
      fail(`PR #${prNumber} write readback mismatch for gate ${key}: ${String(observedGates[key])} != ${gates[key]}.`);
    }
  }

  console.log(
    `[PR-DECISION] PR #${prNumber}: ${rendered.decisionStatus}; ` +
    `main=${mainGate} scope=${scopeGate} overlap=${overlapGate} checks=${checksGate} ` +
    `security=${securityGate} baseline=${baselineGate}; required_checks=${policy.requiredChecks.length}; ` +
    `overlap_conflicts=${overlaps.length}.`,
  );
  return { changed: true, skipped: false, gates, decisionStatus: rendered.decisionStatus };
}

async function main() {
  const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const prNumber = Number(process.env.PR_NUMBER || 0);
  if (!repository || !repository.includes('/')) fail('GITHUB_REPOSITORY is missing or invalid.');
  if (!token) fail('GITHUB_TOKEN/GH_TOKEN is missing.');
  if (!Number.isInteger(prNumber) || prNumber <= 0) fail('PR_NUMBER must identify one open pull request.');

  const result = await reconcileOne({ repository, token, prNumber });
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
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reconcilePrDecisionEvidence.mjs')) {
  await main();
}
