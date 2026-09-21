#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import {
  parseProjectPresentations,
  resolvePreCreatePrLabel,
} from '../pr/prLabelClassification.mjs';

export const ISSUE_PROJECT_ROUTING_SCHEMA = 'capital-ai-self-healing-issue-routing/1.0.0';
export const ISSUE_PROJECT_ROUTING_MARKER = 'CAPITAL_AI_SH_ISSUE_DISPATCH_V1';

const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

function cleanCell(value) {
  return String(value ?? '').replace(/`/g, '').replace(/\*\*/g, '').trim();
}

export function parsePrimaryPvcOwnership(markdown) {
  const marker = '## Canonical Project Value Chain';
  const sectionStart = String(markdown || '').indexOf(marker);
  if (sectionStart < 0) throw new Error('Canonical Project Value Chain section is missing.');

  const lines = String(markdown).slice(sectionStart + marker.length).split(/\r?\n/);
  const rows = [];
  let started = false;
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      started = true;
      rows.push(line);
    } else if (started) {
      break;
    }
  }
  if (rows.length < 3) throw new Error('Canonical Project Value Chain table is not parseable.');

  const ownership = new Map();
  for (const line of rows.slice(2)) {
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cleanCell);
    if (cells.length < 3) continue;
    const pvc = cells[0].match(/PVC-\d{2}/)?.[0];
    const owner = cells[2].match(/CAPITAL-AI-[A-Z0-9-]+/)?.[0];
    if (!pvc || !owner) continue;
    if (!ownership.has(owner)) ownership.set(owner, []);
    ownership.get(owner).push(pvc);
  }
  return ownership;
}

function generationDigest(payload) {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

export function resolveIssueProjectRoute({
  issueNumber,
  title,
  authorAssociation,
  issueState = 'open',
  isPullRequest = false,
  currentMainSha,
  mappingMarkdown,
  pvcMarkdown,
}) {
  const number = Number(issueNumber);
  const normalizedTitle = String(title || '').trim();
  const association = String(authorAssociation || '').trim().toUpperCase();
  const mainSha = String(currentMainSha || '').trim().toLowerCase();

  if (!Number.isInteger(number) || number <= 0) throw new Error('issueNumber must be a positive integer.');
  if (!/^[0-9a-f]{40}$/.test(mainSha)) throw new Error('currentMainSha must be an exact 40-character SHA.');
  if (isPullRequest) {
    return {
      schema: ISSUE_PROJECT_ROUTING_SCHEMA,
      state: 'NOT_ROUTABLE',
      reason: 'PULL_REQUEST_NOT_ISSUE',
      issueNumber: number,
    };
  }
  if (String(issueState || '').toLowerCase() !== 'open') {
    return {
      schema: ISSUE_PROJECT_ROUTING_SCHEMA,
      state: 'NOT_ROUTABLE',
      reason: 'ISSUE_NOT_OPEN',
      issueNumber: number,
    };
  }

  const match = normalizedTitle.match(/^\[(CAPITAL-AI-[A-Z0-9-]+)\]\s+(.+)$/);
  if (!match) {
    return {
      schema: ISSUE_PROJECT_ROUTING_SCHEMA,
      state: 'NOT_ROUTABLE',
      reason: 'CANONICAL_PROJECT_PREFIX_MISSING',
      issueNumber: number,
    };
  }

  const projectId = match[1];
  const subject = match[2].trim();
  const presentations = parseProjectPresentations(String(mappingMarkdown || ''))
    .filter((row) => row.projectId === projectId);

  if (presentations.length !== 1) {
    return {
      schema: ISSUE_PROJECT_ROUTING_SCHEMA,
      state: 'ROUTING_BLOCKED',
      reason: presentations.length === 0 ? 'UNKNOWN_OR_SUPERSEDED_PROJECT' : 'AMBIGUOUS_PROJECT',
      issueNumber: number,
      projectId,
    };
  }

  const labelResolution = resolvePreCreatePrLabel({
    projectId,
    mappingMarkdown: String(mappingMarkdown || ''),
  });
  const ownership = parsePrimaryPvcOwnership(String(pvcMarkdown || ''));
  const primaryPvc = [...(ownership.get(projectId) || [])].sort();
  const relationship = primaryPvc.length > 0 ? 'PRIMARY_PVC_OWNER' : 'CROSS_CUTTING';
  const trustedForExecution = TRUSTED_ASSOCIATIONS.has(association);

  const generation = {
    schema: ISSUE_PROJECT_ROUTING_SCHEMA,
    issueNumber: number,
    title: normalizedTitle,
    projectId,
    projectFolder: presentations[0].folder,
    owner: projectId,
    relationship,
    primaryPvc,
    currentMainSha: mainSha,
  };

  return {
    schema: ISSUE_PROJECT_ROUTING_SCHEMA,
    state: trustedForExecution ? 'READY_FOR_PROJECT_EXECUTION' : 'ROUTED_REVIEW_ONLY',
    reason: trustedForExecution ? 'TRUSTED_PROJECT_ISSUE_ROUTED' : 'UNTRUSTED_AUTHOR_ASSOCIATION_REVIEW_ONLY',
    issueNumber: number,
    title: normalizedTitle,
    subject,
    authorAssociation: association || 'NONE',
    trustedForExecution,
    project: {
      ...presentations[0],
      owner: projectId,
      relationship,
      primaryPvc,
    },
    label: labelResolution.label,
    currentMainSha: mainSha,
    generation: generationDigest(generation),
    authority: {
      issue_is_instruction_surface: false,
      issue_body_is_executable: false,
      title_prefix_selects_project_only: true,
      execution_authority: '/AGENTS.md@CURRENT_MAIN',
      merge_authority: 'HUMAN_OWNER_OR_ACTIVE_AUTO_MERGE_CONTRACT_ONLY',
    },
  };
}

function appendGithubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = [
    `route_state=${result.state || ''}`,
    `route_reason=${result.reason || ''}`,
    `project_id=${result.project?.projectId || result.projectId || ''}`,
    `project_folder=${result.project?.folder || ''}`,
    `project_relationship=${result.project?.relationship || ''}`,
    `primary_pvc=${(result.project?.primaryPvc || []).join(',')}`,
    `label_name=${result.label?.name || ''}`,
    `label_color=${result.label?.color || ''}`,
    `label_description=${result.label?.description || ''}`,
    `generation=${result.generation || ''}`,
    `execution_ready=${result.state === 'READY_FOR_PROJECT_EXECUTION' ? 'true' : 'false'}`,
    'routing_json<<CAPITAL_AI_ISSUE_ROUTE_EOF',
    JSON.stringify(result),
    'CAPITAL_AI_ISSUE_ROUTE_EOF',
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n', 'utf8');
}

function main() {
  const mappingPath = process.env.ISSUE_PROJECT_MAPPING_PATH || 'docs/projects/README.md';
  const pvcPath = process.env.ISSUE_PVC_MAPPING_PATH || 'docs/projects/PROJECT_VALUE_CHAIN.md';
  for (const path of [mappingPath, pvcPath]) {
    if (!fs.existsSync(path)) throw new Error('Required routing source missing: ' + path);
  }

  const result = resolveIssueProjectRoute({
    issueNumber: process.env.ISSUE_NUMBER,
    title: process.env.ISSUE_TITLE,
    authorAssociation: process.env.ISSUE_AUTHOR_ASSOCIATION,
    issueState: process.env.ISSUE_STATE,
    isPullRequest: process.env.ISSUE_IS_PULL_REQUEST === 'true',
    currentMainSha: process.env.CURRENT_MAIN_SHA,
    mappingMarkdown: fs.readFileSync(mappingPath, 'utf8'),
    pvcMarkdown: fs.readFileSync(pvcPath, 'utf8'),
  });

  appendGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('issueProjectRouting.mjs')) {
  try {
    main();
  } catch (error) {
    console.error('[SELF-HEALING-ISSUE-ROUTER] ' + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
