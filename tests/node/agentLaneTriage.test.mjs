import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  evaluateLaneTriage,
  priorityWeight,
  projectIdFromLabels,
  rankWaitingCandidates,
} from '../../scripts/pr/agentLaneTriage.mjs';
import { parseProjectPresentations } from '../../scripts/pr/prLabelClassification.mjs';

const projects = ['CAPITAL-AI-GOV', 'CAPITAL-AI-FE', 'CAPITAL-AI-FINTECH'];

function pr(number, projectId, branch) {
  return {
    number,
    headRefName: branch,
    createdAt: '2026-09-26T18:00:00Z',
    labels: [{ name: `project:${projectId}` }],
  };
}

test('free project lane permits autonomous draft PR creation while another project lane is occupied', () => {
  const result = evaluateLaneTriage({
    candidate: {
      branch: 'agent/frontend-example-20260926',
      projectId: 'CAPITAL-AI-FE',
      priority: 'P1',
      startedAt: '2026-09-26T19:00:00Z',
    },
    openPulls: [pr(1500, 'CAPITAL-AI-GOV', 'agent/governance-open-20260926')],
    canonicalProjects: projects,
  });

  assert.equal(result.state, 'LANE_AVAILABLE');
  assert.equal(result.canCreate, true);
  assert.equal(result.lane.allLanesOccupied, false);
});

test('same project lane stays bounded to one active automated PR', () => {
  const result = evaluateLaneTriage({
    candidate: {
      branch: 'agent/frontend-waiting-20260926',
      projectId: 'CAPITAL-AI-FE',
      priority: 'P2',
      startedAt: '2026-09-26T19:00:00Z',
    },
    openPulls: [pr(1501, 'CAPITAL-AI-FE', 'agent/frontend-active-20260926')],
    canonicalProjects: projects,
  });

  assert.equal(result.state, 'PROJECT_LANE_OCCUPIED');
  assert.equal(result.canCreate, false);
  assert.equal(result.lane.occupiedBy.number, 1501);
});

test('all occupied lanes enter deterministic priority triage instead of inventing another lane', () => {
  const waiting = [
    { branch: 'agent/frontend-p2-older', projectId: 'CAPITAL-AI-FE', priority: 'P2', startedAt: '2026-09-26T15:00:00Z' },
    { branch: 'agent/fintech-p0-newer', projectId: 'CAPITAL-AI-FINTECH', priority: 'P0', startedAt: '2026-09-26T20:00:00Z' },
    { branch: 'agent/governance-p1-oldest', projectId: 'CAPITAL-AI-GOV', priority: 'P1', startedAt: '2026-09-26T14:00:00Z' },
  ];
  const result = evaluateLaneTriage({
    candidate: {
      branch: 'agent/frontend-current',
      projectId: 'CAPITAL-AI-FE',
      priority: 'P3',
      startedAt: '2026-09-26T21:00:00Z',
    },
    openPulls: [
      pr(1502, 'CAPITAL-AI-GOV', 'agent/governance-active'),
      pr(1503, 'CAPITAL-AI-FE', 'agent/frontend-active'),
      pr(1504, 'CAPITAL-AI-FINTECH', 'agent/fintech-active'),
    ],
    canonicalProjects: projects,
    waitingCandidates: waiting,
  });

  assert.equal(result.state, 'ALL_LANES_OCCUPIED');
  assert.equal(result.canCreate, false);
  assert.equal(result.lane.allLanesOccupied, true);
  assert.equal(result.triage.nextWaitingCandidate.branch, 'agent/fintech-p0-newer');
  assert.equal(result.authority.createsSecondQueue, false);
});


test('all canonical repository project lanes occupied produce deterministic all-lanes triage', () => {
  const markdown = fs.readFileSync('docs/projects/README.md', 'utf8');
  const canonicalProjects = parseProjectPresentations(markdown).map((row) => row.projectId);
  assert.ok(canonicalProjects.length > 3);

  const openPulls = canonicalProjects.map((projectId, index) =>
    pr(1600 + index, projectId, `agent/lane-${index}-active`),
  );

  const candidateProject = canonicalProjects[0];
  const result = evaluateLaneTriage({
    candidate: {
      branch: 'agent/canonical-all-lanes-candidate',
      projectId: candidateProject,
      priority: 'P2',
      startedAt: '2026-09-26T21:00:00Z',
    },
    openPulls,
    canonicalProjects,
    waitingCandidates: [
      {
        branch: 'agent/canonical-p1-waiting',
        projectId: candidateProject,
        priority: 'P1',
        startedAt: '2026-09-26T18:00:00Z',
      },
      {
        branch: 'agent/canonical-p0-waiting',
        projectId: canonicalProjects.at(-1),
        priority: 'P0-HIGHEST',
        startedAt: '2026-09-26T20:00:00Z',
      },
    ],
  });

  assert.equal(result.state, 'ALL_LANES_OCCUPIED');
  assert.equal(result.canCreate, false);
  assert.equal(result.lane.occupiedProjects.length, canonicalProjects.length);
  assert.equal(result.triage.nextWaitingCandidate.branch, 'agent/canonical-p0-waiting');
});

test('priority ordering is P0 then P1 then P2/P3 and ties use oldest start then branch', () => {
  assert.equal(priorityWeight('P0-HIGHEST'), 0);
  assert.equal(priorityWeight('P1'), 1);
  assert.equal(priorityWeight('unknown'), 4);

  const ranked = rankWaitingCandidates([
    { branch: 'agent/z', priority: 'P1', startedAt: '2026-09-26T10:00:00Z' },
    { branch: 'agent/b', priority: 'P0', startedAt: '2026-09-26T11:00:00Z' },
    { branch: 'agent/a', priority: 'P0', startedAt: '2026-09-26T11:00:00Z' },
  ]);

  assert.deepEqual(ranked.map((item) => item.branch), ['agent/a', 'agent/b', 'agent/z']);
});

test('multiple active automated PRs in one project lane fail closed', () => {
  assert.throws(
    () => evaluateLaneTriage({
      candidate: {
        branch: 'agent/frontend-third',
        projectId: 'CAPITAL-AI-FE',
        priority: 'P1',
      },
      openPulls: [
        pr(1701, 'CAPITAL-AI-FE', 'agent/frontend-one'),
        pr(1702, 'CAPITAL-AI-FE', 'agent/frontend-two'),
      ],
      canonicalProjects: projects,
    }),
    /exceeds capacity 1/,
  );
});

test('ambiguous or missing project labels fail closed', () => {
  assert.throws(() => projectIdFromLabels([]), /exactly one canonical project label/);
  assert.throws(
    () => projectIdFromLabels([
      { name: 'project:CAPITAL-AI-GOV' },
      { name: 'project:CAPITAL-AI-FE' },
    ]),
    /exactly one canonical project label/,
  );
});
