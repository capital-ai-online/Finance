#!/usr/bin/env node

import fs from 'node:fs';

export const LABEL_CLASSIFICATION_SCHEMA = 'capital-ai-pr-label-classification/2.0.0';

function cleanCell(value) {
  return String(value ?? '').replace(/`/g, '').replace(/\*\*/g, '').trim();
}

function fail(message) {
  throw new Error(message);
}

export function parseProjectPresentations(markdown) {
  const marker = '## Canonical project-folder routing';
  const sectionStart = markdown.indexOf(marker);
  if (sectionStart < 0) fail('Canonical project-folder routing section is missing.');

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
  if (tableLines.length < 3) fail('Canonical project routing table is not parseable.');

  const splitRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
  const headers = splitRow(tableLines[0]).map(cleanCell);
  const rows = [];

  for (const line of tableLines.slice(2)) {
    const cells = splitRow(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const projectId = cleanCell(row.Project).match(/CAPITAL-AI-[A-Z0-9-]+/)?.[0];
    if (!projectId) continue;

    rows.push({
      projectId,
      folder: cleanCell(row['Canonical project folder']),
      displayName: cleanCell(row['Display name']),
      symbol: cleanCell(row.Symbol),
      color: cleanCell(row.Color).toUpperCase(),
    });
  }

  return rows;
}

export function resolvePreCreatePrLabel({ projectId, mappingMarkdown }) {
  const normalizedProjectId = String(projectId || '').trim();
  if (!/^CAPITAL-AI-[A-Z0-9-]+$/.test(normalizedProjectId)) {
    fail(`Invalid or missing PR_PROJECT_ID: ${normalizedProjectId || '<empty>'}`);
  }

  const matches = parseProjectPresentations(String(mappingMarkdown || ''))
    .filter((row) => row.projectId === normalizedProjectId);

  if (matches.length !== 1) {
    fail(`${normalizedProjectId} must resolve to exactly one canonical project presentation row; found ${matches.length}.`);
  }

  const presentation = matches[0];
  if (!/^docs\/projects\/[a-z0-9-]+\/$/.test(presentation.folder)) {
    fail(`${normalizedProjectId} has an invalid canonical project folder.`);
  }
  if (!presentation.displayName || !presentation.symbol) {
    fail(`${normalizedProjectId} is missing display name or symbol.`);
  }
  if (!/^#[0-9A-F]{6}$/.test(presentation.color)) {
    fail(`${normalizedProjectId} color must be canonical #RRGGBB.`);
  }

  const label = {
    name: `project:${normalizedProjectId}`,
    color: presentation.color.slice(1),
    description: `${presentation.symbol} ${presentation.displayName} · ${normalizedProjectId}`.slice(0, 100),
  };

  return {
    schema: LABEL_CLASSIFICATION_SCHEMA,
    state: 'PRE_CREATE_CLASSIFIED',
    phase: 'PRE_PR_CREATE',
    project: presentation,
    label,
    authority: {
      labels_can_authorize_merge: false,
      merge_authority: 'HUMAN_OWNER_OR_ACTIVE_AUTO_MERGE_CONTRACT_ONLY',
      note: 'Project labels are presentation/classification metadata resolved before PR creation.',
    },
  };
}

export function resolveCanonicalProjectLabelSet({ mappingMarkdown }) {
  const markdown = String(mappingMarkdown || '');
  const presentations = parseProjectPresentations(markdown);
  if (presentations.length === 0) fail('Canonical project presentation set is empty.');

  const seen = new Set();
  const labels = presentations.map((presentation) => {
    if (seen.has(presentation.projectId)) {
      fail(`${presentation.projectId} must occur exactly once in the canonical project presentation set.`);
    }
    seen.add(presentation.projectId);
    const resolved = resolvePreCreatePrLabel({
      projectId: presentation.projectId,
      mappingMarkdown: markdown,
    });
    return {
      projectId: resolved.project.projectId,
      ...resolved.label,
    };
  });

  return {
    schema: LABEL_CLASSIFICATION_SCHEMA,
    state: 'CANONICAL_PROJECT_LABEL_SET_CLASSIFIED',
    phase: 'CURRENT_MAIN_PROVIDER_CONVERGENCE',
    labels,
    authority: {
      labels_can_authorize_merge: false,
      merge_authority: 'HUMAN_OWNER_OR_ACTIVE_AUTO_MERGE_CONTRACT_ONLY',
      note: 'Provider label convergence reuses the canonical pre-create project mapping and creates no second PR classifier.',
    },
  };
}

function appendGithubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = [
    `classification_state=${result.state}`,
    `project_id=${result.project.projectId}`,
    `label_name=${result.label.name}`,
    `label_color=${result.label.color}`,
    `label_description=${result.label.description}`,
    'classification_json<<CAPITAL_AI_LABEL_EOF',
    JSON.stringify(result),
    'CAPITAL_AI_LABEL_EOF',
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n', 'utf8');
}

function main() {
  const mappingPath = process.env.PR_PROJECT_MAPPING_PATH || 'docs/projects/README.md';
  const projectId = process.env.PR_PROJECT_ID;
  const scope = String(process.env.PR_LABEL_CLASSIFICATION_SCOPE || 'SINGLE_PROJECT').trim();
  if (!fs.existsSync(mappingPath)) fail(`Project mapping not found: ${mappingPath}`);

  const mappingMarkdown = fs.readFileSync(mappingPath, 'utf8');
  if (scope === 'ALL_PROJECTS') {
    const result = resolveCanonicalProjectLabelSet({ mappingMarkdown });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (scope !== 'SINGLE_PROJECT') fail(`Unsupported PR_LABEL_CLASSIFICATION_SCOPE: ${scope}`);

  const result = resolvePreCreatePrLabel({ projectId, mappingMarkdown });
  appendGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('prLabelClassification.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(`[PR-LABEL-PRECREATE] ${error.message}`);
    process.exitCode = 1;
  }
}
