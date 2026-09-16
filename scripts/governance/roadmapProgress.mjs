import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_MAPPING_PATH = 'docs/projects/README.md';
const PROJECT_VALUE_CHAIN_PATH = 'docs/projects/PROJECT_VALUE_CHAIN.md';

const NON_TERMINAL_MARKERS = [
  /\bNOT[ _-]?RUN\b/i,
  /\bNOT[ _-]?PROVEN\b/i,
  /\bUNVERIFIED\b/i,
  /\bPARTIAL\b/i,
  /\bREADY(?:_[A-Z0-9_]+)?\b/i,
  /\bWAITING\b/i,
  /\bBLOCKED\b/i,
  /\bCONDITIONAL\b/i,
  /\bCONTINUOUS\b/i,
  /\bIMPLEMENTED[ _-]?ON[ _-]?BRANCH\b/i,
  /\bIN[ _-]?IMPLEMENTATION\b/i,
  /\bIMPLEMENTATION[ _-]?PENDING\b/i,
  /\bPENDING\b/i,
  /\bOPEN\b/i,
  /\bREFERRED\b/i,
  /\bEVIDENCE[ _-]?READY\b/i,
  /\bVALIDATION[ _-]?PENDING\b/i,
];

const TERMINAL_MARKERS = [
  /\bDONE[ _-]?MAIN\b/i,
  /\bDONE\b/i,
  /\bCLOSED\b/i,
  /\bCOMPLETE(?:D)?\b/i,
  /\bRETIRED\b/i,
  /\bSUPERSEDED\b/i,
  /\bVERIFIED\b/i,
  /\bTERMINAL\b/i,
];

const STATE_LINE_PATTERN = /^\s*(?:[-*]\s*)?(?:\*\*)?(?:State|Status)(?:\*\*)?\s*:\s*(.+?)\s*$/i;
const WORK_ITEM_ID_PATTERN = /^`?([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)`?(?=\s|—|–|:|$)/;

function stripInlineMarkdown(value) {
  return value
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => stripInlineMarkdown(cell));
}

function isSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, '')));
}

export function parseCanonicalProjects(mappingText) {
  const lines = mappingText.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    if (!line.trim().startsWith('|')) return false;
    const cells = splitMarkdownRow(line).map((cell) => cell.toLowerCase());
    return cells.includes('project') && cells.includes('canonical project folder') && cells.includes('branch project-folder slug');
  });

  if (headerIndex < 0) {
    throw new Error('CANONICAL_PROJECT_MAPPING_TABLE_NOT_FOUND');
  }

  const headers = splitMarkdownRow(lines[headerIndex]);
  const indexOf = (name) => headers.findIndex((header) => header.toLowerCase() === name.toLowerCase());
  const projectIndex = indexOf('Project');
  const pvcIndex = indexOf('PVC relationship');
  const folderIndex = indexOf('Canonical project folder');
  const slugIndex = indexOf('Branch project-folder slug');

  if ([projectIndex, pvcIndex, folderIndex, slugIndex].some((index) => index < 0)) {
    throw new Error('CANONICAL_PROJECT_MAPPING_COLUMNS_INCOMPLETE');
  }

  const projects = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim().startsWith('|')) {
      if (projects.length > 0) break;
      continue;
    }

    const cells = splitMarkdownRow(line);
    if (isSeparatorRow(cells)) continue;
    if (cells.length < headers.length) continue;

    const project = stripInlineMarkdown(cells[projectIndex]);
    const pvcRelationship = stripInlineMarkdown(cells[pvcIndex]);
    const folder = stripInlineMarkdown(cells[folderIndex]);
    const branchSlug = stripInlineMarkdown(cells[slugIndex]);

    if (!/^CAPITAL-AI-[A-Z0-9-]+$/.test(project)) continue;
    if (!/^docs\/projects\/[a-z0-9-]+\/$/.test(folder)) {
      throw new Error(`INVALID_CANONICAL_PROJECT_FOLDER:${project}:${folder}`);
    }
    if (!/^[a-z0-9-]+$/.test(branchSlug)) {
      throw new Error(`INVALID_CANONICAL_BRANCH_SLUG:${project}:${branchSlug}`);
    }

    projects.push({
      project,
      pvcRelationship,
      folder,
      branchSlug,
      roadmapPath: `${folder}ROADMAP.md`,
    });
  }

  if (projects.length === 0) {
    throw new Error('NO_CANONICAL_PROJECTS_DISCOVERED');
  }

  const ensureUnique = (key) => {
    const seen = new Set();
    for (const project of projects) {
      const value = project[key];
      if (seen.has(value)) {
        throw new Error(`DUPLICATE_CANONICAL_PROJECT_${key.toUpperCase()}:${value}`);
      }
      seen.add(value);
    }
  };

  ensureUnique('project');
  ensureUnique('folder');
  ensureUnique('branchSlug');
  return projects;
}

export function classifyRoadmapState(rawState) {
  if (!rawState || !rawState.trim()) return 'UNKNOWN';
  if (NON_TERMINAL_MARKERS.some((pattern) => pattern.test(rawState))) return 'NON_TERMINAL';
  if (TERMINAL_MARKERS.some((pattern) => pattern.test(rawState))) return 'TERMINAL';
  return 'UNKNOWN';
}

function extractStateFromLines(lines) {
  for (const line of lines) {
    const match = line.match(STATE_LINE_PATTERN);
    if (match) return stripInlineMarkdown(match[1]);
  }
  return null;
}

function extractHeadingItems(roadmapText) {
  const lines = roadmapText.split(/\r?\n/);
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!match) continue;
    const headingText = stripInlineMarkdown(match[2]);
    const idMatch = headingText.match(WORK_ITEM_ID_PATTERN);
    if (!idMatch) continue;
    headings.push({ index, level: match[1].length, id: idMatch[1], heading: headingText });
  }

  return headings.map((heading, headingIndex) => {
    let end = lines.length;
    for (let next = headingIndex + 1; next < headings.length; next += 1) {
      if (headings[next].level <= heading.level) {
        end = headings[next].index;
        break;
      }
    }
    const sectionLines = lines.slice(heading.index + 1, end);
    const state = extractStateFromLines(sectionLines);
    return {
      id: heading.id,
      source: 'heading',
      heading: heading.heading,
      state,
      classification: classifyRoadmapState(state),
    };
  });
}

function extractTableItems(roadmapText) {
  const lines = roadmapText.split(/\r?\n/);
  const items = [];

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].trim().startsWith('|') || !lines[index + 1].trim().startsWith('|')) continue;
    const headers = splitMarkdownRow(lines[index]);
    const separator = splitMarkdownRow(lines[index + 1]);
    if (!isSeparatorRow(separator)) continue;

    const normalized = headers.map((header) => header.toLowerCase());
    const idIndex = normalized.findIndex((header) => ['id', 'work package', 'work item', 'item'].includes(header));
    const stateIndex = normalized.findIndex((header) => ['state', 'status'].includes(header));
    if (idIndex < 0 || stateIndex < 0) continue;

    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex].trim().startsWith('|')) {
      const cells = splitMarkdownRow(lines[rowIndex]);
      const rawId = cells[idIndex] ?? '';
      const idMatch = stripInlineMarkdown(rawId).match(WORK_ITEM_ID_PATTERN);
      if (idMatch) {
        const state = stripInlineMarkdown(cells[stateIndex] ?? '');
        items.push({
          id: idMatch[1],
          source: 'table',
          heading: stripInlineMarkdown(rawId),
          state: state || null,
          classification: classifyRoadmapState(state),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }

  return items;
}

export function extractRoadmapItems(roadmapText) {
  const combined = [...extractHeadingItems(roadmapText), ...extractTableItems(roadmapText)];
  const byId = new Map();

  for (const item of combined) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, { ...item, evidence: [{ source: item.source, state: item.state }] });
      continue;
    }

    existing.evidence.push({ source: item.source, state: item.state });
    if (existing.classification === 'UNKNOWN' && item.classification !== 'UNKNOWN') {
      existing.state = item.state;
      existing.classification = item.classification;
    } else if (
      item.classification !== 'UNKNOWN' &&
      existing.classification !== 'UNKNOWN' &&
      item.classification !== existing.classification
    ) {
      existing.classification = 'CONFLICT';
    }
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function calculateRoadmapProgress(roadmapText) {
  const items = extractRoadmapItems(roadmapText);
  if (items.length === 0) {
    return {
      status: 'NOT_PROVEN',
      progressPercent: null,
      numerator: null,
      denominator: null,
      reason: 'NO_EXPLICIT_WORK_ITEMS_DISCOVERED',
      items: [],
    };
  }

  const unresolved = items.filter((item) => item.classification === 'UNKNOWN' || item.classification === 'CONFLICT');
  if (unresolved.length > 0) {
    return {
      status: 'NOT_PROVEN',
      progressPercent: null,
      numerator: null,
      denominator: items.length,
      reason: 'UNRESOLVED_WORK_ITEM_STATE',
      unresolvedItems: unresolved.map((item) => item.id),
      items,
    };
  }

  const terminal = items.filter((item) => item.classification === 'TERMINAL').length;
  const progressPercent = Math.round((terminal / items.length) * 10000) / 100;

  return {
    status: 'PROVEN',
    progressPercent,
    numerator: terminal,
    denominator: items.length,
    reason: null,
    items,
  };
}

export async function buildCanonicalRoadmapProgress({ rootDir = process.cwd() } = {}) {
  const mappingPath = path.join(rootDir, PROJECT_MAPPING_PATH);
  const pvcPath = path.join(rootDir, PROJECT_VALUE_CHAIN_PATH);
  const [mappingText] = await Promise.all([
    readFile(mappingPath, 'utf8'),
    readFile(pvcPath, 'utf8'),
  ]);

  const projects = parseCanonicalProjects(mappingText);
  const results = [];

  for (const project of projects) {
    try {
      const roadmapText = await readFile(path.join(rootDir, project.roadmapPath), 'utf8');
      results.push({ ...project, ...calculateRoadmapProgress(roadmapText) });
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        results.push({
          ...project,
          status: 'NOT_PROVEN',
          progressPercent: null,
          numerator: null,
          denominator: null,
          reason: 'CANONICAL_ROADMAP_MISSING',
          items: [],
        });
        continue;
      }
      throw error;
    }
  }

  return {
    schemaVersion: '1.0.0',
    measurementBasis: {
      projectDiscovery: PROJECT_MAPPING_PATH,
      ownershipProjection: PROJECT_VALUE_CHAIN_PATH,
      roadmapSource: 'docs/projects/<canonical-folder>/ROADMAP.md',
      unit: 'explicit work-item ID in a heading or ID-bearing State/Status table row',
      numerator: 'work items with an explicit terminal State/Status classification',
      denominator: 'all explicitly discovered work items when every item has a resolvable State/Status classification',
      failClosedRule: 'missing/unknown/conflicting work-item state or missing Roadmap => NOT_PROVEN; no percentage is emitted',
      nonTerminalPrecedence: true,
    },
    projectCount: results.length,
    projects: results,
  };
}

async function runCli() {
  const report = await buildCanonicalRoadmapProgress();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
