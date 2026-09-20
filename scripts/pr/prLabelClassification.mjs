#!/usr/bin/env node

import fs from 'node:fs';

export const LABEL_CLASSIFICATION_SCHEMA = 'capital-ai-pr-label-classification/1.0.0';

const PRIORITY_ORDER = Object.freeze({ P0: 0, P1: 1, P2: 2, P3: 3 });
const VERSION_ORDER = Object.freeze({ MAJOR: 0, MINOR: 1, PATCH: 2, NONE: 3 });

function canonical(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeLabel(raw) {
  if (typeof raw === 'string') return { name: raw.trim(), color: null, description: null };
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  return {
    name,
    color: raw.color ? String(raw.color) : null,
    description: raw.description == null ? null : String(raw.description),
  };
}

function uniqueLabels(rawLabels) {
  const byName = new Map();
  for (const raw of rawLabels || []) {
    const label = normalizeLabel(raw);
    if (!label) continue;
    const key = label.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, label);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

function hasPhrase(text, phrase) {
  const t = ' ' + canonical(text) + ' ';
  const p = ' ' + canonical(phrase) + ' ';
  return t.includes(p);
}

function extractPriority(name) {
  const text = canonical(name);
  const match = text.match(/(?:^| )(p[0-3])(?: |$)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractVersionImpact(name) {
  const text = canonical(name);
  const values = ['major', 'minor', 'patch', 'none'];
  if (values.includes(text)) return text.toUpperCase();
  const prefixed = text.match(/(?:^| )(?:version|semver|release) (major|minor|patch|none)(?: |$)/);
  return prefixed ? prefixed[1].toUpperCase() : null;
}

function matchesAny(name, phrases) {
  return phrases.some((phrase) => hasPhrase(name, phrase));
}

export function classifyPrLabels(rawLabels) {
  const labels = uniqueLabels(rawLabels);
  const dimensions = {
    project_scope: [],
    priority: [],
    risk_security: [],
    change_type: [],
    version_impact: [],
    governance_workflow: [],
    status_blocker: [],
    automation_source: [],
    component_domain: [],
  };
  const matches = {};
  const prioritySignals = new Set();
  const versionSignals = new Set();

  for (const label of labels) {
    const name = label.name;
    const text = canonical(name);
    const labelDimensions = [];
    const add = (dimension) => {
      dimensions[dimension].push(name);
      labelDimensions.push(dimension);
    };

    if (/^(project|scope|owner|pvc)( |$)/.test(text) || /^capital ai (gov|ops|sec|qm|comp|fintech|frontend|documentary|seo)( |$)/.test(text)) add('project_scope');

    const priority = extractPriority(name);
    if (priority) { add('priority'); prioritySignals.add(priority); }

    if (matchesAny(name, ['security', 'risk', 'compliance', 'privacy', 'iam', 'secret', 'credential', 'billing', 'production', 'vulnerability', 'critical'])) add('risk_security');
    if (matchesAny(name, ['bug', 'fix', 'feature', 'enhancement', 'documentation', 'docs', 'refactor', 'test', 'tests', 'chore', 'dependency', 'dependencies', 'release'])) add('change_type');

    const versionImpact = extractVersionImpact(name);
    if (versionImpact) { add('version_impact'); versionSignals.add(versionImpact); }

    if (matchesAny(name, ['governance', 'policy', 'workflow', 'ci', 'automation', 'self healing', 'autofix', 'pull request', 'pr governance', 'deployment'])) add('governance_workflow');
    if (matchesAny(name, ['blocked', 'blocker', 'ready', 'pending', 'waiting', 'wip', 'draft', 'needs review', 'needs changes', 'failed', 'failing', 'hold'])) add('status_blocker');
    if (matchesAny(name, ['chatgpt', 'openai', 'deepseek', 'dependabot', 'renovate', 'bot', 'agent', 'codeql', 'source'])) add('automation_source');
    if (/^(area|component|domain|team|module)( |$)/.test(text)) add('component_domain');

    matches[name] = [...new Set(labelDimensions)].sort();
  }

  for (const key of Object.keys(dimensions)) {
    dimensions[key] = [...new Set(dimensions[key])].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  }

  const unmapped = labels.filter((label) => (matches[label.name] || []).length === 0);
  const mappedCount = labels.length - unmapped.length;
  const effectivePriority = [...prioritySignals].sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])[0] || 'UNSPECIFIED';
  const effectiveVersionImpact = [...versionSignals].sort((a, b) => VERSION_ORDER[a] - VERSION_ORDER[b])[0] || 'UNSPECIFIED';

  const drift = [];
  if (prioritySignals.size > 1) drift.push({ code: 'PRIORITY_CONFLICT', labels: dimensions.priority, effective: effectivePriority });
  if (versionSignals.size > 1) drift.push({ code: 'VERSION_IMPACT_CONFLICT', labels: dimensions.version_impact, effective: effectiveVersionImpact });

  const blocked = dimensions.status_blocker.filter((name) => matchesAny(name, ['blocked', 'blocker', 'hold', 'failed', 'failing', 'needs changes']));
  const ready = dimensions.status_blocker.filter((name) => matchesAny(name, ['ready']));
  if (blocked.length > 0 && ready.length > 0) {
    drift.push({ code: 'STATUS_CONFLICT', labels: [...blocked, ...ready].sort(), effective: 'BLOCKED_LABEL_PRESENT' });
  }

  const state = drift.length > 0 ? 'LABEL_DRIFT' : labels.length === 0 ? 'NO_LABELS' : unmapped.length > 0 ? 'PARTIAL_CLASSIFICATION' : 'CLASSIFIED';
  const ratio = labels.length === 0 ? 0 : Number((mappedCount / labels.length).toFixed(4));

  return {
    schema: LABEL_CLASSIFICATION_SCHEMA,
    state,
    label_count: labels.length,
    all_labels: labels,
    dimensions,
    matches,
    effective: {
      priority: effectivePriority,
      version_impact: effectiveVersionImpact,
      blocked_by_label: blocked.length > 0,
    },
    drift,
    coverage: {
      mapped_labels: mappedCount,
      unmapped_labels: unmapped.length,
      mapped_ratio: ratio,
    },
    unmapped,
    authority: {
      labels_can_authorize_merge: false,
      merge_authority: 'HUMAN_OWNER_ONLY',
      note: 'Labels are descriptive evidence and classification metadata only.',
    },
  };
}

function appendGithubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = [
    'classification_state=' + result.state,
    'label_count=' + result.label_count,
    'mapped_ratio=' + result.coverage.mapped_ratio,
    'effective_priority=' + result.effective.priority,
    'effective_version_impact=' + result.effective.version_impact,
    'label_drift=' + String(result.drift.length > 0),
    'classification_json<<CAPITAL_AI_LABEL_EOF',
    JSON.stringify(result),
    'CAPITAL_AI_LABEL_EOF',
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n', 'utf8');
}

function renderSummary(result) {
  const list = (values) => values.length ? values.join(', ') : '—';
  const drift = result.drift.length ? result.drift.map((item) => item.code + ': ' + list(item.labels || [])).join('<br>') : '—';
  const unmapped = result.unmapped.length ? result.unmapped.map((label) => label.name).join(', ') : '—';
  return [
    '## PR label classification',
    '',
    '| Signal | Result |',
    '|---|---|',
    '| State | `' + result.state + '` |',
    '| Labels consumed | `' + result.label_count + '` |',
    '| Mapping coverage | `' + Math.round(result.coverage.mapped_ratio * 100) + '%` |',
    '| Effective priority | `' + result.effective.priority + '` |',
    '| Version impact | `' + result.effective.version_impact + '` |',
    '| Project / scope | ' + list(result.dimensions.project_scope) + ' |',
    '| Risk / security | ' + list(result.dimensions.risk_security) + ' |',
    '| Change type | ' + list(result.dimensions.change_type) + ' |',
    '| Governance / workflow | ' + list(result.dimensions.governance_workflow) + ' |',
    '| Status / blocker | ' + list(result.dimensions.status_blocker) + ' |',
    '| Automation / source | ' + list(result.dimensions.automation_source) + ' |',
    '| Unmapped labels | ' + unmapped + ' |',
    '| Drift | ' + drift + ' |',
    '',
    '> Every attached label is preserved in the classification evidence. Labels never create merge authority; final merge remains Human Owner only.',
    '',
  ].join('\n');
}

function parseInput() {
  const raw = process.env.PR_LABELS_JSON || '[]';
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (error) { throw new Error('PR_LABELS_JSON is not valid JSON: ' + error.message); }
  if (!Array.isArray(parsed)) throw new Error('PR_LABELS_JSON must be a JSON array.');
  return parsed;
}

function main() {
  const result = classifyPrLabels(parseInput());
  appendGithubOutput(result);
  const summary = renderSummary(result);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--fail-on-drift') && result.drift.length > 0) process.exitCode = 2;
}

if (import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('prLabelClassification.mjs')) main();
