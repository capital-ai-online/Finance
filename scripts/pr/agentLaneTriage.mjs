#!/usr/bin/env node

import fs from 'node:fs';
import { parseProjectPresentations } from './prLabelClassification.mjs';

export const AGENT_BRANCH_PATTERN = /^(agent|claude|grok|ai)\//;
export const TRIAGE_SCHEMA = 'capital-ai-agent-lane-triage/1.0.0';

const PRIORITY_WEIGHT = Object.freeze({
  'P0-HIGHEST': 0,
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
});

function fail(message) {
  throw new Error(message);
}

export function priorityWeight(priority) {
  const normalized = String(priority || '').trim().toUpperCase();
  return PRIORITY_WEIGHT[normalized] ?? 4;
}

export function projectIdFromLabels(labels) {
  const names = (Array.isArray(labels) ? labels : [])
    .map((label) => typeof label === 'string' ? label : label?.name)
    .filter(Boolean);
  const projects = names
    .filter((name) => /^project:CAPITAL-AI-[A-Z0-9-]+$/.test(name))
    .map((name) => name.slice('project:'.length));
  if (projects.length !== 1) {
    fail(`Open automated PR must expose exactly one canonical project label; found ${projects.length}.`);
  }
  return projects[0];
}

export function rankWaitingCandidates(candidates) {
  return [...(Array.isArray(candidates) ? candidates : [])].sort((left, right) => {
    const priorityDelta = priorityWeight(left.priority) - priorityWeight(right.priority);
    if (priorityDelta !== 0) return priorityDelta;

    const leftStarted = Date.parse(left.startedAt || '') || Number.MAX_SAFE_INTEGER;
    const rightStarted = Date.parse(right.startedAt || '') || Number.MAX_SAFE_INTEGER;
    if (leftStarted !== rightStarted) return leftStarted - rightStarted;

    return String(left.branch || '').localeCompare(String(right.branch || ''));
  });
}

function normalizeOpenPulls(openPulls) {
  return (Array.isArray(openPulls) ? openPulls : [])
    .filter((pr) => AGENT_BRANCH_PATTERN.test(String(pr.headRefName || pr.head || '').trim()))
    .map((pr) => ({
      number: Number(pr.number),
      branch: String(pr.headRefName || pr.head || '').trim(),
      projectId: pr.projectId || projectIdFromLabels(pr.labels),
      createdAt: pr.createdAt || null,
      title: pr.title || null,
    }));
}

export function evaluateLaneTriage({
  candidate,
  openPulls,
  canonicalProjects,
  waitingCandidates = [],
}) {
  const projects = [...new Set((canonicalProjects || []).map((value) => String(value).trim()).filter(Boolean))];
  if (projects.length === 0) fail('Canonical project lane set is empty.');

  const projectId = String(candidate?.projectId || '').trim();
  const branch = String(candidate?.branch || '').trim();
  if (!projects.includes(projectId)) fail(`Candidate project ${projectId || '<empty>'} is not a canonical project lane.`);
  if (!AGENT_BRANCH_PATTERN.test(branch)) fail(`Candidate branch ${branch || '<empty>'} is outside the approved agent namespaces.`);

  const active = normalizeOpenPulls(openPulls);
  for (const pr of active) {
    if (!projects.includes(pr.projectId)) {
      fail(`Open PR #${pr.number} resolves to non-canonical project lane ${pr.projectId}.`);
    }
  }

  const activeByProject = new Map();
  for (const pr of active) {
    const entries = activeByProject.get(pr.projectId) || [];
    entries.push(pr);
    activeByProject.set(pr.projectId, entries);
  }
  for (const [activeProjectId, entries] of activeByProject) {
    if (entries.length > 1) {
      fail(`Project lane ${activeProjectId} exceeds capacity 1 with open PRs ${entries.map((pr) => '#' + pr.number).join(', ')}.`);
    }
  }

  const occupiedProjects = [...activeByProject.keys()].sort();
  const occupant = activeByProject.get(projectId)?.[0] || null;
  const allLanesOccupied = projects.every((project) => occupiedProjects.includes(project));
  const rankedWaiting = rankWaitingCandidates([
    ...waitingCandidates,
    {
      branch,
      projectId,
      priority: candidate.priority || 'P2',
      startedAt: candidate.startedAt || null,
    },
  ]);

  return {
    schema: TRIAGE_SCHEMA,
    state: occupant
      ? (allLanesOccupied ? 'ALL_LANES_OCCUPIED' : 'PROJECT_LANE_OCCUPIED')
      : 'LANE_AVAILABLE',
    canCreate: occupant === null,
    candidate: {
      branch,
      projectId,
      priority: candidate.priority || 'P2',
      startedAt: candidate.startedAt || null,
    },
    lane: {
      capacity: 1,
      occupiedBy: occupant,
      occupiedProjects,
      canonicalProjectCount: projects.length,
      allLanesOccupied,
    },
    triage: {
      order: 'priority_then_oldest_startedAt_then_branch',
      waiting: rankedWaiting,
      nextWaitingCandidate: rankedWaiting[0] || null,
    },
    authority: {
      createsMergeAuthority: false,
      createsSecondQueue: false,
      note: 'Branches/work claims remain the candidate evidence. Triage is a deterministic PR-create scheduling projection only.',
    },
  };
}

function appendGithubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `lane_state=${result.state}`,
      `can_create=${String(result.canCreate)}`,
      `all_lanes_occupied=${String(result.lane.allLanesOccupied)}`,
      'triage_json<<CAPITAL_AI_TRIAGE_EOF',
      JSON.stringify(result),
      'CAPITAL_AI_TRIAGE_EOF',
    ].join('\n') + '\n',
    'utf8',
  );
}

function main() {
  const mappingPath = process.env.PR_PROJECT_MAPPING_PATH || 'docs/projects/README.md';
  const openPullsPath = process.env.PR_LANE_OPEN_PRS_PATH;
  const outputPath = process.env.PR_LANE_TRIAGE_OUTPUT || 'artifacts/pr/agent-lane-triage.json';

  if (!fs.existsSync(mappingPath)) fail(`Project mapping not found: ${mappingPath}`);
  if (!openPullsPath || !fs.existsSync(openPullsPath)) fail('PR_LANE_OPEN_PRS_PATH is required.');

  const projects = parseProjectPresentations(fs.readFileSync(mappingPath, 'utf8')).map((row) => row.projectId);
  const openPulls = JSON.parse(fs.readFileSync(openPullsPath, 'utf8'));
  const result = evaluateLaneTriage({
    candidate: {
      branch: process.env.PR_HEAD_BRANCH,
      projectId: process.env.PR_PROJECT_ID,
      priority: process.env.PR_PRIORITY || 'P2',
      startedAt: process.env.PR_STARTED_AT || null,
    },
    openPulls,
    canonicalProjects: projects,
  });

  fs.mkdirSync(outputPath.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  appendGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('agentLaneTriage.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(`[AGENT-LANE-TRIAGE] ${error.message}`);
    process.exitCode = 1;
  }
}
