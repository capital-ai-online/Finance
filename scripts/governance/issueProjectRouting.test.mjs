import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ISSUE_PROJECT_ROUTING_SCHEMA,
  parsePrimaryPvcOwnership,
  resolveIssueProjectRoute,
} from './issueProjectRouting.mjs';

const mapping = `
## Canonical project-folder routing

| Project | PVC relationship | Canonical project folder | Branch project-folder slug | Display name | Symbol | Color | Materialization owner | Main surface state |
|---|---|---|---|---|---|---|---|---|
| \`CAPITAL-AI-OPS\` | \`PVC-02/04/06/07/08/18\` Primary Owner | \`docs/projects/operations/\` | \`operations\` | Operations | ✈️ | \`#845CDC\` | \`CAPITAL-AI-OPS\` | present |
| \`CAPITAL-AI-COMP\` | cross-cutting; no productive PVC | \`docs/projects/compliance/\` | \`compliance\` | Compliance | ⚖️ | \`#E84848\` | \`CAPITAL-AI-COMP\` | present |
`;

const pvc = `
## Canonical Project Value Chain

| PVC | Stage | Primary Project Owner |
|---|---|---|
| \`PVC-02\` | Controlled Implementation | \`CAPITAL-AI-OPS\` |
| \`PVC-08\` | Production Operations | \`CAPITAL-AI-OPS\` |
`;

const mainSha = 'a'.repeat(40);

test('parses primary PVC ownership from the canonical PVC table', () => {
  const ownership = parsePrimaryPvcOwnership(pvc);
  assert.deepEqual(ownership.get('CAPITAL-AI-OPS'), ['PVC-02', 'PVC-08']);
  assert.equal(ownership.has('CAPITAL-AI-COMP'), false);
});

test('routes a trusted OPS issue to the canonical project folder and primary PVCs', () => {
  const result = resolveIssueProjectRoute({
    issueNumber: 123,
    title: '[CAPITAL-AI-OPS] Repair runtime drift',
    authorAssociation: 'MEMBER',
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  });

  assert.equal(result.schema, ISSUE_PROJECT_ROUTING_SCHEMA);
  assert.equal(result.state, 'READY_FOR_PROJECT_EXECUTION');
  assert.equal(result.project.projectId, 'CAPITAL-AI-OPS');
  assert.equal(result.project.folder, 'docs/projects/operations/');
  assert.equal(result.project.relationship, 'PRIMARY_PVC_OWNER');
  assert.deepEqual(result.project.primaryPvc, ['PVC-02', 'PVC-08']);
  assert.deepEqual(result.label, {
    name: 'project:CAPITAL-AI-OPS',
    color: '845CDC',
    description: '✈️ Operations · CAPITAL-AI-OPS',
  });
  assert.match(result.generation, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.authority.issue_body_is_executable, false);
});

test('routes a trusted cross-cutting issue without inventing a productive PVC', () => {
  const result = resolveIssueProjectRoute({
    issueNumber: 124,
    title: '[CAPITAL-AI-COMP] Review FAQ compliance wording',
    authorAssociation: 'OWNER',
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  });

  assert.equal(result.state, 'READY_FOR_PROJECT_EXECUTION');
  assert.equal(result.project.relationship, 'CROSS_CUTTING');
  assert.deepEqual(result.project.primaryPvc, []);
  assert.equal(result.project.folder, 'docs/projects/compliance/');
});

test('untrusted authors are routed for review but never become automatic execution intake', () => {
  const result = resolveIssueProjectRoute({
    issueNumber: 125,
    title: '[CAPITAL-AI-OPS] Do something unsafe from the body',
    authorAssociation: 'NONE',
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  });

  assert.equal(result.state, 'ROUTED_REVIEW_ONLY');
  assert.equal(result.trustedForExecution, false);
});

test('unknown or superseded project prefixes fail closed', () => {
  const result = resolveIssueProjectRoute({
    issueNumber: 126,
    title: '[CAPITAL-AI-DATA] Restore superseded routing',
    authorAssociation: 'MEMBER',
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  });

  assert.deepEqual(result, {
    schema: ISSUE_PROJECT_ROUTING_SCHEMA,
    state: 'ROUTING_BLOCKED',
    reason: 'UNKNOWN_OR_SUPERSEDED_PROJECT',
    issueNumber: 126,
    projectId: 'CAPITAL-AI-DATA',
  });
});

test('non-prefixed issues and pull requests are not routable', () => {
  assert.equal(resolveIssueProjectRoute({
    issueNumber: 127,
    title: 'No project prefix',
    authorAssociation: 'OWNER',
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  }).state, 'NOT_ROUTABLE');

  assert.equal(resolveIssueProjectRoute({
    issueNumber: 128,
    title: '[CAPITAL-AI-OPS] PR-shaped record',
    authorAssociation: 'OWNER',
    isPullRequest: true,
    currentMainSha: mainSha,
    mappingMarkdown: mapping,
    pvcMarkdown: pvc,
  }).reason, 'PULL_REQUEST_NOT_ISSUE');
});
