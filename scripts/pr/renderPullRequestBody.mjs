#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  appendGithubOutput,
  fail,
  git,
  listAddedClaimFiles,
  readJsonFile,
  renderProductionBaselineBlock,
  PR_TEMPLATE_VERSION,
} from './lib.mjs';
import { canonicalizeKnownSectionHeadings } from './prBodySectionContract.mjs';

const baseRef = process.env.PR_BASE_REF || 'origin/main';
const headRef = process.env.PR_HEAD_REF || 'HEAD';
const baselinePath = process.env.PR_BASELINE_OUTPUT || 'artifacts/pr/production-baseline.json';
const templatePath = process.env.PR_TEMPLATE_PATH || '.github/pull_request_template.md';
const outputPath = process.env.PR_BODY_OUTPUT || 'artifacts/pr/pull-request-body.md';
const allowClaimless = process.env.PR_ALLOW_CLAIMLESS === 'true';
const projectMappingPath = process.env.PR_PROJECT_MAPPING_PATH || 'docs/projects/README.md';

if (!fs.existsSync(templatePath)) fail(`PR-Vorlage nicht gefunden: ${templatePath}`);
if (!fs.existsSync(baselinePath)) fail(`Produktions-Baseline nicht gefunden: ${baselinePath}`);
if (!fs.existsSync(projectMappingPath)) fail(`Projekt-Mapping nicht gefunden: ${projectMappingPath}`);

function cleanCell(value) {
  return String(value ?? '').replace(/`/g, '').replace(/\*\*/g, '').trim();
}

const PRIORITY_PRESENTATION = Object.freeze({
  P0: 'P0 🔴 Kritisch',
  P1: 'P1 🟠 Hoch',
  P2: 'P2 🟡 Normal',
  P3: 'P3 🟢 Niedrig',
});

const VERSION_IMPACT_PRESENTATION = Object.freeze({
  NOT_EVALUATED: 'NOT_EVALUATED ⚪',
  NONE: 'NONE ➖',
  PATCH: 'PATCH 🩹',
  MINOR: 'MINOR ✨',
  MAJOR: 'MAJOR 💥',
});

function normalizePriority(value) {
  const key = String(value || '').trim().toUpperCase().match(/^P[0-3]/)?.[0] || 'P2';
  return PRIORITY_PRESENTATION[key];
}

function normalizeVersionImpact(value) {
  const key = String(value || '').trim().toUpperCase().split(/\s+/)[0];
  return VERSION_IMPACT_PRESENTATION[key] || VERSION_IMPACT_PRESENTATION.NOT_EVALUATED;
}

function resolveProjectPresentation(projectId) {
  const markdown = fs.readFileSync(projectMappingPath, 'utf8');
  const marker = '## Canonical project-folder routing';
  const sectionStart = markdown.indexOf(marker);
  if (sectionStart < 0) fail(`${projectMappingPath}: Canonical project-folder routing fehlt.`);

  const lines = markdown.slice(sectionStart + marker.length).split(/\r?\n/);
  const tableLines = [];
  let started = false;
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      started = true;
      tableLines.push(line);
    } else if (started) {
      break;
    }
  }
  if (tableLines.length < 3) fail(`${projectMappingPath}: Project-Routing-Tabelle ist nicht renderfähig.`);

  const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const headers = splitRow(tableLines[0]).map(cleanCell);
  const matches = [];

  for (const line of tableLines.slice(2)) {
    const cells = splitRow(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const rowProjectId = cleanCell(row.Project).match(/CAPITAL-AI-[A-Z0-9-]+/)?.[0];
    if (rowProjectId !== projectId) continue;
    matches.push({
      projectId: rowProjectId,
      folder: cleanCell(row['Canonical project folder']),
      displayName: cleanCell(row['Display name']),
      symbol: cleanCell(row.Symbol),
      color: cleanCell(row.Color).toUpperCase(),
    });
  }

  if (matches.length !== 1) fail(`${projectMappingPath}: ${projectId} muss genau eine Project-Presentation-Zeile besitzen.`);
  const presentation = matches[0];
  if (!presentation.folder || !/^docs\/projects\/[a-z0-9-]+\/$/.test(presentation.folder)) fail(`${projectMappingPath}: ${projectId} Canonical project folder ist ungültig.`);
  if (!presentation.displayName) fail(`${projectMappingPath}: ${projectId} Display name fehlt.`);
  if (!presentation.symbol) fail(`${projectMappingPath}: ${projectId} Symbol fehlt.`);
  if (!/^#[0-9A-F]{6}$/.test(presentation.color)) fail(`${projectMappingPath}: ${projectId} Color muss #RRGGBB sein.`);
  return presentation;
}

const claims = listAddedClaimFiles(baseRef, headRef);
if (claims.length > 1) fail(`Für die PR-Erzeugung ist höchstens ein neuer Work-Claim zulässig; gefunden: ${claims.length}.`);
if (claims.length === 0 && !allowClaimless) fail('Für den Agenten-PR-Pfad ist genau ein neuer Work-Claim erforderlich. Claimlose Human/API/Connector-Pfade müssen PR_ALLOW_CLAIMLESS=true explizit setzen.');

let claimPath = 'N/A (kein neuer Work-Claim im Diff)';
let claim;
if (claims.length === 1) {
  claimPath = claims[0];
  claim = headRef === 'HEAD' ? readJsonFile(claimPath) : JSON.parse(git(['show', `${headRef}:${claimPath}`]));
} else {
  claim = {
    claimId: 'N/A (kein neuer Work-Claim im Diff)',
    workItem: process.env.PR_WORK_ITEM_DE || process.env.PR_TITLE || 'Autorisierter Human/API/Connector-Änderungsantrag',
    projectId: process.env.PR_PROJECT_ID || 'N/A',
    projectFolder: process.env.PR_PROJECT_FOLDER || 'N/A',
    projectStage: process.env.PR_AFFECTED_PVC || 'N/A',
    agent: {
      provider: process.env.PR_AGENT_PROVIDER || 'N/A (Human/API/Connector-Pfad)',
      model: process.env.PR_AGENT_MODEL || 'N/A',
      executionSurface: process.env.PR_AGENT_SURFACE || 'GitHub API/UI/Connector',
    },
  };
}

const baseline = readJsonFile(baselinePath);
const productionBaselineBlock = renderProductionBaselineBlock(baseline);
const template = fs.readFileSync(templatePath, 'utf8');
const headBranch = process.env.PR_HEAD_BRANCH || (() => {
  const value = git(['rev-parse', '--abbrev-ref', headRef]);
  return value === 'HEAD' ? process.env.GITHUB_REF_NAME || 'detached-head' : value;
})();

const workItem = String(claim.workItemDE || claim.workItemDe || claim.workItem || claim.titleDE || `Agenten-Arbeitsauftrag ${claim.claimId}`).trim();
const projectId = String(claim.projectId || process.env.PR_PROJECT_ID || 'N/A').trim();
const affectedPvc = String(claim.projectStage || process.env.PR_AFFECTED_PVC || 'N/A').trim();
const primaryOwner = String(process.env.PR_PRIMARY_OWNER || projectId || 'N/A').trim();
const agentClient = String(process.env.PR_AGENT_CLIENT || 'ChatGPT').trim();
const priority = normalizePriority(process.env.PR_PRIORITY || claim.priority || 'P2');
const priorityReason = String(
  process.env.PR_PRIORITY_REASON ||
  claim.priorityReason ||
  'Standardpriorität — keine P0/P1-Eskalation ist im Work Claim belegt.',
).trim();
const versionImpact = normalizeVersionImpact(process.env.PR_VERSION_IMPACT || 'NOT_EVALUATED');
const versionImpactReason = String(
  process.env.PR_VERSION_IMPACT_REASON ||
  'Keine deterministische Versionsevidence wurde an den PR-Renderer übergeben.',
).trim();
const versionManagerCheck = String(
  process.env.PR_VERSION_MANAGER_CHECK ||
  'NOT_RUN — fokussierter Function-Smoke ist als PR-Check vorgesehen und benötigt Human-Freigabe.',
).trim();

if (!projectId || projectId === 'N/A') fail('Kanonischer PR-Titel erfordert eine aufgelöste PROJECT-ID.');
if (!agentClient) fail('Kanonischer PR-Titel erfordert einen faktischen Agent-Client.');

const projectPresentation = resolveProjectPresentation(projectId);
const claimedProjectFolder = String(claim.projectFolder || process.env.PR_PROJECT_FOLDER || projectPresentation.folder).trim();
if (claimedProjectFolder !== 'N/A' && claimedProjectFolder !== projectPresentation.folder) fail(`${projectMappingPath}: ${projectId} Projectfolder widerspricht der kanonischen Routing-Zeile.`);

const sourceProjectId = String(process.env.PR_SOURCE_PROJECT_ID || projectId).trim();
const targetProjectId = String(process.env.PR_TARGET_PROJECT_ID || projectId).trim();
const sourcePresentation = resolveProjectPresentation(sourceProjectId);
const targetPresentation = resolveProjectPresentation(targetProjectId);

const replacements = {
  WORK_ITEM: workItem,
  PRIORITY: priority,
  PRIORITY_REASON: priorityReason,
  VERSION_IMPACT: versionImpact,
  VERSION_IMPACT_REASON: versionImpactReason,
  VERSION_MANAGER_CHECK: versionManagerCheck,
  CLAIM_ID: claim.claimId,
  CLAIM_FILE: claimPath,
  HEAD_BRANCH: headBranch,
  AGENT_PROVIDER: claim.agent?.provider || 'unbekannt',
  AGENT_MODEL: claim.agent?.model || 'unbekannt',
  AGENT_SURFACE: claim.agent?.executionSurface || 'unbekannt',
  PROJECT_ID: projectId,
  PROJECT_FOLDER: projectPresentation.folder,
  PROJECT_DISPLAY_NAME: projectPresentation.displayName,
  PROJECT_SYMBOL: projectPresentation.symbol,
  PROJECT_COLOR: projectPresentation.color,
  SOURCE_PROJECT_ID: sourcePresentation.projectId,
  SOURCE_PROJECT_FOLDER: sourcePresentation.folder,
  SOURCE_PROJECT_DISPLAY_NAME: sourcePresentation.displayName,
  SOURCE_PROJECT_SYMBOL: sourcePresentation.symbol,
  SOURCE_PROJECT_COLOR: sourcePresentation.color,
  TARGET_PROJECT_ID: targetPresentation.projectId,
  TARGET_PROJECT_FOLDER: targetPresentation.folder,
  TARGET_PROJECT_DISPLAY_NAME: targetPresentation.displayName,
  TARGET_PROJECT_SYMBOL: targetPresentation.symbol,
  TARGET_PROJECT_COLOR: targetPresentation.color,
  PRIMARY_OWNER: primaryOwner,
  AFFECTED_PVC: affectedPvc,
  IMPLEMENTATION: process.env.PR_IMPLEMENTATION || workItem,
  WHY: process.env.PR_WHY || 'N/A — im PR-Kontext zu konkretisieren',
  ROADMAP: process.env.PR_ROADMAP || 'N/A — nicht im Work Claim spezifiziert',
  EXIT_GATE: process.env.PR_EXIT_GATE || 'N/A — im PR-Kontext zu konkretisieren',
  PR_CLASS: process.env.PR_CHECK_CLASS || 'N/A',
  PR_CLASS_REASON: process.env.PR_CHECK_CLASS_REASON || 'N/A — im PR-Kontext zu konkretisieren',
  EXPECTED_CHECKS: process.env.PR_EXPECTED_CHECKS || 'gemäß ermittelter PR-Klasse',
  MAIN_SYNC_STATUS: process.env.PR_MAIN_SYNC_STATUS || 'Ja — gegen die gebundene Preflight-Baseline',
  OVERLAP_STATUS: process.env.PR_OVERLAP_STATUS || 'N/A — im PR-Kontext zu konkretisieren',
  PRODUCTION_BASELINE_BLOCK: productionBaselineBlock,
};

let body = template;
for (const [key, value] of Object.entries(replacements)) body = body.split(`{{${key}}}`).join(String(value));
body = canonicalizeKnownSectionHeadings(body);

const unresolved = [...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
if (unresolved.length > 0) fail(`PR-Vorlage enthält noch nicht aufgelöste Vorlagenplatzhalter: ${[...new Set(unresolved)].join(', ')}`);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');

const title = `[${projectId}] [${agentClient}] ${workItem}`.slice(0, 240);
appendGithubOutput({ pr_body_output: outputPath, pr_title: title, claim_id: claim.claimId, claim_file: claimPath, baseline_id: baseline.baselineId });
console.log(`[PR-VORLAGE] ${outputPath} aus deutscher Vorlage v${PR_TEMPLATE_VERSION} mit atomarer Baseline ${baseline.baselineId} erzeugt.`);
