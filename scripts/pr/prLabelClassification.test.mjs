import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { resolvePreCreatePrLabel } from './prLabelClassification.mjs';

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

test('PR create workflow classifies and ensures the label before gh pr create', () => {
  const workflow = fs.readFileSync(createWorkflowPath, 'utf8');
  const classifyIndex = workflow.indexOf('node ../create-policy/scripts/pr/prLabelClassification.mjs');
  const ensureIndex = workflow.indexOf('gh label create "$PR_LABEL_NAME"');
  const createIndex = workflow.indexOf('gh pr create');

  assert.ok(classifyIndex >= 0, 'pre-create label classification step missing');
  assert.ok(ensureIndex > classifyIndex, 'repository label must be ensured after classification');
  assert.ok(createIndex > ensureIndex, 'PR must be created only after classification and label ensure');
  assert.match(workflow, /--label "\$PR_LABEL_NAME"/);
  assert.match(workflow, /issues:\s*write/);
  assert.doesNotMatch(workflow, /PR_LABELS_JSON/);
});

test('the former post-create PR label classification workflow is retired', () => {
  assert.equal(fs.existsSync(retiredWorkflowPath), false);
});
