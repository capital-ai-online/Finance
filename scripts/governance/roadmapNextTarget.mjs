import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCanonicalRoadmapProgress,
  classifyRoadmapState,
  extractRoadmapItems,
} from './roadmapProgress.mjs';

const READY_SEGMENT_PATTERN = /^(?:READY(?:_FOR_(?:IMPLEMENTATION|EXECUTION))?|REPOSITORY[ _-]?EXECUTABLE|EXECUTABLE)\b/i;
const BLOCKING_STATE_MARKERS = [
  /\bBLOCKED\b/i,
  /\bWAITING\b/i,
  /\bCONDITIONAL\b/i,
  /\bDEPENDENCY[ _-]?HELD\b/i,
  /\bREFERRED\b/i,
  /\bPARTIAL\b/i,
  /\bNOT[ _-]?RUN\b/i,
  /\bVALIDATION[ _-]?PENDING\b/i,
  /\bEVIDENCE[ _-]?READY\b/i,
  /\bIMPLEMENTED[ _-]?ON[ _-]?BRANCH\b/i,
  /\bIN[ _-]?IMPLEMENTATION\b/i,
  /\bIMPLEMENTATION[ _-]?PENDING\b/i,
  /\bPENDING\b/i,
  /\bOPEN\b/i,
];

const WORK_ITEM_ID_AT_START = /^`?([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)`?(?=\s|—|–|:|$)/;
const WORK_ITEM_REFERENCE_PATTERN = /\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g;
const NON_WORK_NAMESPACE_PREFIXES = [
  'CAPITAL-AI-',
  'PVC-',
  'ADR-',
  'ESS-',
  'AUTH-',
  'CTRL-',
  'DOC-',
  'PR-',
  'ISO-',
  'NIST-',
];

function stripInlineMarkdown(value) {
  return value
    .trim()
    .replace(/`([^`\r\n]+)`/g, '$1')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function normalizeWorkPackageTableHeaderAliases(roadmapText) {
  return roadmapText
    .split(/\r?\n/)
    .map((line) => {
      if (
        /^\s*\|\s*WP\s*\|/i.test(line)
        && /\|\s*(?:State|Status)\s*\|/i.test(line)
      ) {
        return line.replace(/^(\s*\|\s*)WP(\s*\|)/i, '$1ID$2');
      }
      return line;
    })
    .join('\n');
}

function extractHeadingSections(roadmapText) {
  const lines = roadmapText.split(/\r?\n/);
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,4})\s+(.+?)\s*$/);
    if (!match) continue;
    const heading = stripInlineMarkdown(match[2]);
    const idMatch = heading.match(WORK_ITEM_ID_AT_START);
    if (!idMatch) continue;
    headings.push({ index, level: match[1].length, id: idMatch[1] });
  }

  const sections = new Map();
  for (let headingIndex = 0; headingIndex < headings.length; headingIndex += 1) {
    const current = headings[headingIndex];
    let end = lines.length;
    for (let next = headingIndex + 1; next < headings.length; next += 1) {
      if (headings[next].level <= current.level) {
        end = headings[next].index;
        break;
      }
    }
    sections.set(current.id, lines.slice(current.index + 1, end).join('\n'));
  }

  return sections;
}

function stateSegments(rawState) {
  return rawState
    .split(/[|/;]|[—–]/)
    .map((segment) => stripInlineMarkdown(segment))
    .filter(Boolean);
}

export function isExplicitExecutionReady(rawState) {
  if (!rawState || !rawState.trim()) return false;
  if (classifyRoadmapState(rawState) === 'TERMINAL') return false;
  if (BLOCKING_STATE_MARKERS.some((pattern) => pattern.test(rawState))) return false;
  return stateSegments(rawState).some((segment) => READY_SEGMENT_PATTERN.test(segment));
}

function isNonWorkNamespaceReference(value) {
  return NON_WORK_NAMESPACE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function dependencyLines(sectionText) {
  if (!sectionText) return [];
  const values = [];
  for (const line of sectionText.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(?:[-*]\s*)?(?:\*\*)?(?:Dependencies?|Depends on)(?:\*\*)?\s*:\s*(.+?)\s*$/i,
    );
    if (match) values.push(stripInlineMarkdown(match[1]));
  }
  return values;
}

function isExplicitNoDependency(value) {
  return /^(?:none|n\/?a|not applicable|no dependencies|none declared)$/i.test(value.trim());
}

function evaluateDependencies({ item, sectionText, workItemIndex }) {
  const declarations = dependencyLines(sectionText);
  if (declarations.length === 0) {
    return {
      ready: true,
      declaration: 'NONE_DECLARED',
      dependencyIds: [],
      reason: null,
    };
  }

  if (declarations.every((value) => isExplicitNoDependency(value))) {
    return {
      ready: true,
      declaration: declarations.join(' | '),
      dependencyIds: [],
      reason: null,
    };
  }

  const references = [
    ...new Set(
      declarations
        .flatMap((value) => value.match(WORK_ITEM_REFERENCE_PATTERN) ?? [])
        .filter((value) => value !== item.id && !isNonWorkNamespaceReference(value)),
    ),
  ];

  const unknownReferences = references.filter((id) => !workItemIndex.has(id));
  if (unknownReferences.length > 0) {
    return {
      ready: false,
      declaration: declarations.join(' | '),
      dependencyIds: references,
      reason: 'UNKNOWN_DEPENDENCY_REFERENCE',
      blockers: unknownReferences,
    };
  }

  if (references.length === 0) {
    return {
      ready: false,
      declaration: declarations.join(' | '),
      dependencyIds: [],
      reason: 'UNSTRUCTURED_DEPENDENCY_DECLARATION',
      blockers: declarations,
    };
  }

  const nonTerminal = references.filter((id) => workItemIndex.get(id)?.item.classification !== 'TERMINAL');
  if (nonTerminal.length > 0) {
    return {
      ready: false,
      declaration: declarations.join(' | '),
      dependencyIds: references,
      reason: 'DEPENDENCY_NOT_TERMINAL',
      blockers: nonTerminal.map((id) => ({
        id,
        state: workItemIndex.get(id)?.item.state ?? null,
        classification: workItemIndex.get(id)?.item.classification ?? 'UNKNOWN',
      })),
    };
  }

  return {
    ready: true,
    declaration: declarations.join(' | '),
    dependencyIds: references,
    reason: null,
  };
}

function hasRepeatedSourceEvidence(item) {
  const sources = (item.evidence ?? []).map((entry) => entry.source);
  return sources.some((source, index) => sources.indexOf(source) !== index);
}

function normalizeProjectRoadmap(entry, projectOrder) {
  const roadmapText = entry.roadmapText ?? '';
  const normalizedRoadmapText = normalizeWorkPackageTableHeaderAliases(roadmapText);
  const sections = extractHeadingSections(roadmapText);
  const items = extractRoadmapItems(normalizedRoadmapText).map((item) => ({
    ...item,
    sourceOrder: roadmapText.indexOf(item.id),
    sectionText: sections.get(item.id) ?? null,
    ambiguousIdentity: hasRepeatedSourceEvidence(item),
  }));

  return {
    projectOrder,
    project: entry.project,
    pvcRelationship: entry.pvcRelationship,
    folder: entry.folder,
    branchSlug: entry.branchSlug,
    roadmapPath: entry.roadmapPath,
    roadmapMissing: Boolean(entry.roadmapMissing),
    items,
  };
}

export function selectNextRoadmapTarget(projectRoadmaps) {
  const projects = projectRoadmaps.map((entry, index) => normalizeProjectRoadmap(entry, index));
  const workItemIndex = new Map();
  const duplicateIds = new Set();
  const ambiguousItems = [];

  for (const project of projects) {
    for (const item of project.items) {
      if (item.ambiguousIdentity) {
        ambiguousItems.push({
          project: project.project,
          roadmapPath: project.roadmapPath,
          id: item.id,
          reason: 'DUPLICATE_WORK_ITEM_ID',
          evidence: item.evidence ?? [],
        });
      }
      if (workItemIndex.has(item.id)) duplicateIds.add(item.id);
      else workItemIndex.set(item.id, { project, item });
    }
  }

  if (ambiguousItems.length > 0) {
    return {
      schemaVersion: '1.0.0',
      status: 'NO_EXECUTABLE_TARGET',
      target: null,
      reason: 'DUPLICATE_WORK_ITEM_ID',
      blockers: ambiguousItems.sort((left, right) =>
        left.project.localeCompare(right.project) || left.id.localeCompare(right.id)),
      eligibleCount: 0,
    };
  }

  if (duplicateIds.size > 0) {
    return {
      schemaVersion: '1.0.0',
      status: 'NO_EXECUTABLE_TARGET',
      target: null,
      reason: 'DUPLICATE_WORK_ITEM_ID',
      blockers: [...duplicateIds].sort().map((id) => ({ id, reason: 'DUPLICATE_WORK_ITEM_ID' })),
      eligibleCount: 0,
    };
  }

  const eligible = [];
  const blockers = [];

  for (const project of projects) {
    if (project.roadmapMissing) {
      blockers.push({
        project: project.project,
        roadmapPath: project.roadmapPath,
        reason: 'CANONICAL_ROADMAP_MISSING',
      });
      continue;
    }

    const readyItems = project.items.filter((item) => isExplicitExecutionReady(item.state ?? ''));
    if (readyItems.length === 0) {
      blockers.push({
        project: project.project,
        roadmapPath: project.roadmapPath,
        reason: 'NO_EXPLICIT_EXECUTION_READY_STATE',
      });
      continue;
    }

    for (const item of readyItems) {
      const dependency = evaluateDependencies({
        item,
        sectionText: item.sectionText,
        workItemIndex,
      });

      if (!dependency.ready) {
        blockers.push({
          project: project.project,
          roadmapPath: project.roadmapPath,
          workItemId: item.id,
          state: item.state,
          reason: dependency.reason,
          dependencyDeclaration: dependency.declaration,
          dependencyBlockers: dependency.blockers ?? [],
        });
        continue;
      }

      eligible.push({
        projectOrder: project.projectOrder,
        sourceOrder: item.sourceOrder < 0 ? Number.MAX_SAFE_INTEGER : item.sourceOrder,
        project: project.project,
        pvcRelationship: project.pvcRelationship,
        folder: project.folder,
        branchSlug: project.branchSlug,
        roadmapPath: project.roadmapPath,
        workItemId: item.id,
        heading: item.heading,
        state: item.state,
        dependencies: dependency.dependencyIds,
        dependencyDeclaration: dependency.declaration,
      });
    }
  }

  eligible.sort(
    (left, right) =>
      left.projectOrder - right.projectOrder ||
      left.sourceOrder - right.sourceOrder ||
      left.workItemId.localeCompare(right.workItemId),
  );

  if (eligible.length === 0) {
    return {
      schemaVersion: '1.0.0',
      status: 'NO_EXECUTABLE_TARGET',
      target: null,
      reason: 'NO_DEPENDENCY_READY_WORK_ITEM',
      blockers,
      eligibleCount: 0,
      selectionBasis: 'canonical project order -> Roadmap source order -> work-item ID',
    };
  }

  const selected = eligible[0];
  return {
    schemaVersion: '1.0.0',
    status: 'TARGET_SELECTED',
    target: {
      project: selected.project,
      pvcRelationship: selected.pvcRelationship,
      folder: selected.folder,
      branchSlug: selected.branchSlug,
      roadmapPath: selected.roadmapPath,
      workItemId: selected.workItemId,
      heading: selected.heading,
      state: selected.state,
      dependencies: selected.dependencies,
      dependencyDeclaration: selected.dependencyDeclaration,
    },
    reason: null,
    blockers,
    eligibleCount: eligible.length,
    selectionBasis: 'canonical project order -> Roadmap source order -> work-item ID',
  };
}

export async function buildCanonicalRoadmapNextTarget({ rootDir = process.cwd() } = {}) {
  const progress = await buildCanonicalRoadmapProgress({ rootDir });
  const projectRoadmaps = [];

  for (const project of progress.projects) {
    try {
      const roadmapText = await readFile(path.join(rootDir, project.roadmapPath), 'utf8');
      projectRoadmaps.push({ ...project, roadmapText, roadmapMissing: false });
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        projectRoadmaps.push({ ...project, roadmapText: '', roadmapMissing: true });
        continue;
      }
      throw error;
    }
  }

  const selection = selectNextRoadmapTarget(projectRoadmaps);
  return {
    ...selection,
    projectCount: progress.projectCount,
    authorityBoundary: {
      sourceOfTruth: 'canonical docs/projects/<project>/ROADMAP.md files',
      ownership: 'preserved from docs/projects/README.md / PROJECT_VALUE_CHAIN.md',
      persistence: 'none',
      mutation: 'none',
      shadowQueue: false,
    },
  };
}

async function runCli() {
  const report = await buildCanonicalRoadmapNextTarget();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath && fileURLToPath(import.meta.url) === entryPath) {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
