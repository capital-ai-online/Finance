#!/usr/bin/env node

import {
  PR_TEMPLATE_MARKER,
  classifyPullRequestScope,
  fail,
  githubJson,
  githubPaginated,
} from './lib.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const prNumber = Number(process.env.PR_NUMBER || 0);
if (!repository) fail('GITHUB_REPOSITORY fehlt.');
if (!token) fail('GITHUB_TOKEN/GH_TOKEN fehlt.');
if (!prNumber) fail('PR_NUMBER fehlt.');

const pr = await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token);
let body = String(pr.body || '');
if (!body.includes(PR_TEMPLATE_MARKER)) {
  console.log(`[PR-EVIDENCE] PR #${prNumber} verwendet nicht ${PR_TEMPLATE_MARKER}; keine Status-Synchronisierung.`);
  process.exit(0);
}

const files = await githubPaginated(`/repos/${repository}/pulls/${prNumber}/files`, token);
const changedFiles = files.map((file) => String(file.filename || '')).filter(Boolean);

function markerValue(name, fallback) {
  const match = body.match(new RegExp(`<!--\\s*${name}:\\s*([^>]+?)\\s*-->`, 'i'));
  return match ? match[1].trim() : fallback;
}
function checkedHuman(label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^-\\s*\\[[xX]\\]\\s*${escaped}\\s*$`, 'm').test(body);
}
function stepConclusion(job, name) {
  return job?.steps?.find((step) => step.name === name)?.conclusion || null;
}
function machineCheck(ok, label, detail = '') {
  return `- [${ok ? 'x' : ' '}] 🤖 ${label}${detail ? ` — ${detail}` : ''}`;
}
function replaceBlock(source, start, end, replacement) {
  const pattern = new RegExp(`<!-- ${start} -->[\\s\\S]*?<!-- ${end} -->`);
  if (!pattern.test(source)) fail(`PR #${prNumber} enthält den maschinenverwalteten Block ${start}/${end} nicht.`);
  return source.replace(pattern, `<!-- ${start} -->\n${replacement}\n<!-- ${end} -->`);
}

let externalMutation = markerValue('CAPITAL_AI_EXTERNAL_MUTATION', 'NONE').toUpperCase();
const allowedMutationStates = new Set(['NONE', 'PLANNED', 'HUMAN APPROVED', 'MUTATED', 'VERIFIED PASS', 'FAILED-ROLLED-BACK']);
if (!allowedMutationStates.has(externalMutation)) externalMutation = 'PLANNED';
const requestedProfile = markerValue('CAPITAL_AI_EXECUTION_PROFILE', 'AUTO').toUpperCase();
const classification = classifyPullRequestScope(changedFiles, {
  externalMutation,
  executionProfile: requestedProfile === 'AUTO' ? '' : requestedProfile,
});
const classNames = {
  D: 'D — Dokumentation',
  C: 'C — Anwendung/Test/Konfiguration',
  R: 'R — Runtime/CI/Dependency/Deployment',
  M: 'M — externe Produktionsänderung',
};

const headSha = String(pr.head?.sha || '');
const baseSha = String(pr.base?.sha || '');
const syncHead = markerValue('CAPITAL_AI_SYNC_HEAD_SHA', 'UNSET');
const classificationOk = syncHead === headSha
  && body.includes(`Repository-Scope:** ${classNames[classification.repositoryClass]}`)
  && body.includes(`Wirksame Checkklasse:** ${classNames[classification.checkClass]}`)
  && body.includes(`Execution Profile:** ${classification.executionProfile}`)
  && body.includes(`Externe Produktionsmutation:** ${classification.externalMutation}`);

const reviews = await githubPaginated(`/repos/${repository}/pulls/${prNumber}/reviews`, token);
const ownerReviewOk = reviews.some((review) => {
  const signal = String(review.body || '').trim();
  return review.user?.login === 'SvenKulessa'
    && review.commit_id === headSha
    && (signal === '💪' || signal.toLowerCase() === 'okay');
});
const ownerBoxesOk = checkedHuman('Human/Owner: vollständigen PR-Diff geprüft.')
  && checkedHuman('Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.');
const humanGateOk = ownerBoxesOk && ownerReviewOk;

const runsPayload = await githubJson(
  `https://api.github.com/repos/${repository}/actions/runs?event=pull_request&head_sha=${headSha}&per_page=100`,
  token,
);
const runs = (runsPayload.workflow_runs || [])
  .filter((run) => (run.pull_requests || []).some((pull) => Number(pull.number) === prNumber))
  .sort((a, b) => Number(b.id) - Number(a.id));
const jobsCache = new Map();
async function jobsFor(runId) {
  if (!jobsCache.has(runId)) {
    const payload = await githubJson(
      `https://api.github.com/repos/${repository}/actions/runs/${runId}/jobs?filter=all&per_page=100`,
      token,
    );
    jobsCache.set(runId, payload.jobs || []);
  }
  return jobsCache.get(runId);
}

let governanceOk = false;
let workflowSecurityOk = !changedFiles.some((file) => file.startsWith('.github/workflows/'));
for (const run of runs.filter((candidate) => candidate.name === 'PR Governance')) {
  if (run.conclusion !== 'success') continue;
  const jobs = await jobsFor(run.id);
  governanceOk = true;
  if (!workflowSecurityOk) {
    workflowSecurityOk = jobs.some((job) => job.name === 'Sicherheit geänderter Workflows' && job.conclusion === 'success');
  }
  if (governanceOk && workflowSecurityOk) break;
}
const governanceSecurityOk = governanceOk && workflowSecurityOk;

let primaryJob = null;
for (const run of runs.filter((candidate) => candidate.name === 'CI')) {
  const jobs = await jobsFor(run.id);
  const job = jobs.find((candidate) =>
    candidate.name === 'build-and-test'
    && stepConclusion(candidate, 'Primär-Volltest autorisiert') === 'success');
  if (job) {
    primaryJob = job;
    break;
  }
}

const baselineOk = stepConclusion(primaryJob, 'Live-PR-Body und Produktionsbaseline validieren') === 'success';
const repositoryIntegrityOk = classification.repositoryClass === 'D'
  || stepConclusion(primaryJob, 'Repository-Integrität prüfen') === 'success';
const repositoryConventionsOk = classification.repositoryClass === 'D'
  || stepConclusion(primaryJob, 'Repository-Konventionen blocking prüfen') === 'success';

const softwareStepNames = [
  'Abhängigkeiten installieren',
  'Produktionsabhängigkeiten prüfen',
  'TypeScript prüfen',
  'Unit-Tests ausführen',
  'Produktions-Build erstellen',
  'Produktions-CSP-Auslieferung nach Build prüfen',
  'Produktionskonfiguration und Deployment-Bereitschaft prüfen',
];
const softwareChecksOk = classification.repositoryClass === 'D'
  || (repositoryIntegrityOk && softwareStepNames.every((name) => stepConclusion(primaryJob, name) === 'success'));

const dockerStepNames = [
  'Docker-Hardening prüfen',
  'Produktions-Docker-Image bauen und prüfen',
  'Produktions-Docker-Container starten und /healthz prüfen',
];
const dockerRequired = classification.repositoryClass === 'R';
const dockerOk = !dockerRequired || dockerStepNames.every((name) => stepConclusion(primaryJob, name) === 'success');
const buildEvidenceOk = primaryJob?.conclusion === 'success';
const mutationOk = !classification.mutationApprovalRequired || externalMutation === 'VERIFIED PASS';

const allRequiredChecksOk = classificationOk
  && governanceSecurityOk
  && baselineOk
  && repositoryConventionsOk
  && softwareChecksOk
  && dockerOk
  && buildEvidenceOk
  && mutationOk;

const evidenceLines = [
  machineCheck(classificationOk, 'Automatische Klassifikation und aktueller Head sind synchronisiert.', classificationOk ? headSha.slice(0, 12) : 'nicht synchron'),
  machineCheck(governanceSecurityOk, 'Governance-/Workflow-Security für den aktuellen Head ist erfolgreich.'),
  machineCheck(baselineOk, 'Live-PR-Body und Produktionsbaseline sind gegen den aktuellen Head validiert.'),
  machineCheck(repositoryConventionsOk, 'Repository-Konventionen sind im für die Klasse erforderlichen Modus erfüllt.', classification.repositoryClass === 'D' ? 'für Klasse D nicht erforderlich' : ''),
  machineCheck(softwareChecksOk, 'Erforderliche Software-/Build-Prüfungen sind erfolgreich oder für die Klasse nicht erforderlich.', classification.repositoryClass === 'D' ? 'Dokumentations-Fast-Path' : ''),
  machineCheck(dockerOk, 'Docker-/Runtime-Prüfungen sind erfolgreich oder für die Klasse nicht erforderlich.', dockerRequired ? 'Klasse R' : `für Klasse ${classification.repositoryClass} nicht erforderlich`),
  machineCheck(buildEvidenceOk, '`build-and-test` besitzt gültige current-head Primär- oder One-Shot-Evidence.'),
  machineCheck(mutationOk, 'Externe Produktionsmutation ist verifiziert oder für diesen PR nicht erforderlich.', classification.mutationApprovalRequired ? externalMutation : 'NONE'),
].join('\n');
body = replaceBlock(body, 'CAPITAL_AI_MACHINE_EVIDENCE_START', 'CAPITAL_AI_MACHINE_EVIDENCE_END', evidenceLines);

const mergeLines = [
  machineCheck(humanGateOk, 'Human-/Owner-Gate ist für den aktuellen Head technisch verifiziert.'),
  machineCheck(allRequiredChecksOk, 'Alle automatisch erforderlichen Checks der erkannten Klasse sind erfüllt.', `Klasse ${classification.checkClass}`),
].join('\n');
body = replaceBlock(body, 'CAPITAL_AI_MACHINE_MERGE_START', 'CAPITAL_AI_MACHINE_MERGE_END', mergeLines);

// Sichtbare Baseline-Felder werden nur bei echtem Evidence-Wechsel aktualisiert, damit Body-Edits idempotent bleiben.
try {
  const response = await fetch('https://capital-ai.online/healthz', {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.ok) {
    const payload = await response.json();
    const deployment = payload?.deployment || {
      version: response.headers.get('x-capital-ai-version'),
      commitSha: response.headers.get('x-capital-ai-commit'),
      branch: response.headers.get('x-capital-ai-branch'),
    };
    const productionVersion = String(deployment?.version || 'unbekannt');
    const productionSha = String(deployment?.commitSha || 'unbekannt');
    const productionBranch = String(deployment?.branch || 'main');
    let productionToMain = 'nicht ermittelt';
    let mainToHead = 'nicht ermittelt';
    if (/^[0-9a-f]{40}$/i.test(productionSha) && /^[0-9a-f]{40}$/i.test(baseSha) && /^[0-9a-f]{40}$/i.test(headSha)) {
      const [prodCompare, headCompare] = await Promise.all([
        githubJson(`https://api.github.com/repos/${repository}/compare/${productionSha}...${baseSha}`, token),
        githubJson(`https://api.github.com/repos/${repository}/compare/${baseSha}...${headSha}`, token),
      ]);
      productionToMain = String(prodCompare.ahead_by ?? 'nicht ermittelt');
      mainToHead = String(headCompare.ahead_by ?? 'nicht ermittelt');
    }
    const signature = [
      `- **Produktionsversion:** \`${productionVersion}\``,
      `- **Produktions-Commit:** \`${productionSha}\``,
      `- **Produktions-Branch:** \`${productionBranch}\``,
      `- **Aktueller main-Commit:** \`${baseSha}\``,
      `- **PR-Head-Commit:** \`${headSha}\``,
      `- **Abweichung Produktion → main:** \`${productionToMain}\` Commit(s)`,
      `- **Abweichung main → PR-Head:** \`${mainToHead}\` Commit(s)`,
    ];
    const baselineAlreadyCurrent = signature.every((line) => body.includes(line));
    if (!baselineAlreadyCurrent) {
      const baselineBlock = `<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->\n${signature.join('\n')}\n- **Baseline erzeugt am:** \`${new Date().toISOString()}\`\n<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->`;
      body = body.replace(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->[\s\S]*?<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/, baselineBlock);
    }
  }
} catch (error) {
  console.warn(`[PR-EVIDENCE] Produktionsbaseline konnte nicht sichtbar aktualisiert werden: ${error?.message || error}`);
}

if (body === String(pr.body || '')) {
  console.log(`[PR-EVIDENCE] PR #${prNumber}@${headSha} ist bereits evidence-synchron.`);
  process.exit(0);
}

await githubJson(`https://api.github.com/repos/${repository}/pulls/${prNumber}`, token, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ body }),
});
console.log(`[PR-EVIDENCE] PR #${prNumber}@${headSha}: human=${humanGateOk}, governance=${governanceSecurityOk}, baseline=${baselineOk}, software=${softwareChecksOk}, docker=${dockerOk}, build=${buildEvidenceOk}, ready=${allRequiredChecksOk}.`);
