import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { resolveCanonicalProjectLabelSet, resolvePreCreatePrLabel } from './prLabelClassification.mjs';

const projectMapping = fs.readFileSync(new URL('../../docs/projects/README.md', import.meta.url), 'utf8');
const createWorkflowPath = new URL('../../.github/workflows/open-agent-draft-pr.yml', import.meta.url);
const retiredWorkflowPath = new URL('../../.github/workflows/pr-label-classification.yml', import.meta.url);

test('resolves the canonical GOV project label before PR creation', () => {
  const result = resolvePreCreatePrLabel({
    projectId: 'CAPITAL-AI-GOV',
    mappingMarkdown: projectMapping,
  });

  assert.equal(result.state, 'PRE_CREATE_CLASSIFIED');
  assert.equal(result.phase, 'PRE_PR_CREATE');
  assert.equal(result.label.name, 'project:CAPITAL-AI-GOV');
  assert.equal(result.label.color, 'A1A1AA');
  assert.match(result.label.description, /Governance/);
  assert.equal(result.authority.labels_can_authorize_merge, false);
});

test('uses the canonical project color instead of a second label color registry', () => {
  const result = resolvePreCreatePrLabel({
    projectId: 'CAPITAL-AI-FE',
    mappingMarkdown: projectMapping,
  });

  assert.equal(result.label.name, 'project:CAPITAL-AI-FE');
  assert.equal(result.label.color, 'DC7CA8');
  assert.match(result.label.description, /Frontend/);
});

test('resolves the complete canonical project label set for provider convergence without a second registry', () => {
  const result = resolveCanonicalProjectLabelSet({ mappingMarkdown: projectMapping });

  assert.equal(result.state, 'CANONICAL_PROJECT_LABEL_SET_CLASSIFIED');
  assert.equal(result.phase, 'CURRENT_MAIN_PROVIDER_CONVERGENCE');
  assert.equal(result.labels.length, 11);
  assert.equal(new Set(result.labels.map((label) => label.name)).size, result.labels.length);
  assert.deepEqual(
    result.labels.find((label) => label.projectId === 'CAPITAL-AI-OPS'),
    {
      projectId: 'CAPITAL-AI-OPS',
      name: 'project:CAPITAL-AI-OPS',
      color: '845CDC',
      description: '✈️ Operations · CAPITAL-AI-OPS',
    },
  );
  assert.equal(
    result.labels.find((label) => label.projectId === 'CAPITAL-AI-FE')?.color,
    'DC7CA8',
  );
  assert.equal(result.authority.labels_can_authorize_merge, false);
});

test('fails closed when project resolution is missing or ambiguous', () => {
  assert.throws(
    () => resolvePreCreatePrLabel({ projectId: 'CAPITAL-AI-UNKNOWN', mappingMarkdown: projectMapping }),
    /exactly one canonical project presentation row/,
  );

  const duplicated = projectMapping.replace(
    '| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance',
    '| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance\n| `CAPITAL-AI-GOV` | `PVC-05` Primary Owner + cross-cutting Governance',
  );
  assert.throws(
    () => resolvePreCreatePrLabel({ projectId: 'CAPITAL-AI-GOV', mappingMarkdown: duplicated }),
    /exactly one canonical project presentation row/,
  );
});

test('fails closed on malformed canonical project color', () => {
  const malformed = projectMapping.replace('`#A1A1AA`', '`gray`');
  assert.throws(
    () => resolvePreCreatePrLabel({ projectId: 'CAPITAL-AI-GOV', mappingMarkdown: malformed }),
    /color must be canonical #RRGGBB/,
  );
});

test('PR create workflow classifies before creation and converges provider metadata from current main', () => {
  const workflow = fs.readFileSync(createWorkflowPath, 'utf8');
  const classifyIndex = workflow.indexOf('node ../create-policy/scripts/pr/prLabelClassification.mjs');
  const ensureIndex = workflow.indexOf('gh label create "$PR_LABEL_NAME"');
  const createIndex = workflow.indexOf('GH_TOKEN="$PR_CREATE_TOKEN" gh pr create');

  assert.ok(classifyIndex >= 0, 'pre-create label classification step missing');
  assert.ok(ensureIndex > classifyIndex, 'repository label must be ensured after classification');
  assert.ok(createIndex > ensureIndex, 'PR must be created only after classification and label ensure');
  assert.match(workflow, /--label "\$PR_LABEL_NAME"/);
  assert.match(workflow, /converge-project-labels:[\s\S]*?permissions:\s*\n\s*contents:\s*read\s*\n\s*pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /converge-project-labels:[\s\S]*?permissions:\s*\n\s*contents:\s*read\s*\n\s*issues:\s*write/);
  assert.match(workflow, /preflight-and-open:[\s\S]*?permissions:\s*\n\s*contents:\s*read\s*\n\s*pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /^permissions:\s*\n\s+pull-requests:\s*write/m);
  assert.doesNotMatch(workflow, /PR_LABELS_JSON/);
  assert.match(workflow, /PR_LABEL_CLASSIFICATION_SCOPE=ALL_PROJECTS/);
  assert.match(workflow, /CANONICAL_PROJECT_LABEL_SET_CLASSIFIED/);
  assert.match(workflow, /gh label create "\$name"/);
  assert.match(workflow, /Provider-Readback/);
  assert.match(workflow, /inputs\.head_branch == ''/);
});

test('the former post-create PR label workflow is an inert no-runner tombstone', () => {
  const retired = fs.readFileSync(retiredWorkflowPath, 'utf8');
  assert.match(retired, /on:\n  workflow_dispatch:/);
  assert.match(retired, /permissions:\s*\{\}/);
  assert.match(retired, /if:\s*false/);
  assert.doesNotMatch(retired, /^\s{2}(pull_request|pull_request_target|push|schedule|workflow_run):/m);
});
