import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_PVC_IDS = Array.from({ length: 18 }, (_, index) => `PVC-${String(index + 1).padStart(2, '0')}`);
const EXPECTED_PVC_SET = new Set(EXPECTED_PVC_IDS);

function cleanCell(value) {
  return String(value ?? '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

function projectId(value) {
  return cleanCell(value).match(/CAPITAL-AI-[A-Z0-9-]+/)?.[0] ?? null;
}

function getSection(markdown, heading) {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start < 0) return null;
  const remainder = markdown.slice(start + marker.length);
  const nextHeading = remainder.search(/\n##\s+/);
  return nextHeading >= 0 ? remainder.slice(0, nextHeading) : remainder;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseFirstTable(sectionText) {
  if (!sectionText) return null;
  const tableLines = [];
  let started = false;

  for (const line of sectionText.split(/\r?\n/)) {
    if (line.trim().startsWith('|')) {
      started = true;
      tableLines.push(line);
      continue;
    }
    if (started) break;
  }

  if (tableLines.length < 3) return null;
  const headers = splitMarkdownRow(tableLines[0]).map(cleanCell);
  const separator = splitMarkdownRow(tableLines[1]);
  if (!separator.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;

  return tableLines.slice(2).map((line) => {
    const cells = splitMarkdownRow(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function expandPvcRefs(value) {
  const cleaned = cleanCell(value);
  const matches = [...cleaned.matchAll(/PVC-(\d{2})/g)];
  if (matches.length === 0) return [];

  if (
    matches.length === 2
    && (/\.\./.test(cleaned) || /\bthrough\b/i.test(cleaned) || /PVC-\d{2}\s*[–—]\s*PVC-\d{2}/.test(cleaned))
  ) {
    const start = Number(matches[0][1]);
    const end = Number(matches[1][1]);
    if (Number.isInteger(start) && Number.isInteger(end) && start <= end) {
      return Array.from({ length: end - start + 1 }, (_, offset) => `PVC-${String(start + offset).padStart(2, '0')}`);
    }
  }

  return [...new Set(matches.map((match) => `PVC-${match[1]}`))];
}

function sameSet(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every((item) => right.has(item));
}

function readRequired(root, relativePath, errors) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`${relativePath}: required file is missing`);
    return null;
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function ownershipDeclarationLines(markdown) {
  const markers = [
    'Primary Productive PVC ownership',
    'Primary Project Value Chain ownership',
    'Project Value Chain ownership',
    'Primary stages',
    'Primary Project Value Chain stage',
    'Value-chain stage',
  ];
  return markdown
    .split(/\r?\n/)
    .filter((line) => markers.some((marker) => line.toLowerCase().includes(marker.toLowerCase())));
}

function hasExplicitZeroProductiveOwnership(markdown) {
  return /Primary Productive PVC ownership:\*\*\s*`?\[\]`?/i.test(markdown)
    || /owns\s+\*\*none\*\*\s+of them as productive Primary Owner/i.test(markdown);
}

function hasClientTransition(valueChainMarkdown, projectReadme) {
  const transition = getSection(valueChainMarkdown, 'Transitional repository state') ?? '';
  return transition.includes('docs/projects/agent-client/**')
    && transition.includes('VC-01')
    && /Value-chain stage:\*\*\s*`VC-01\b/i.test(projectReadme);
}

function parseCanonicalValueChain(valueChainMarkdown, errors) {
  const rows = parseFirstTable(getSection(valueChainMarkdown, 'Canonical Project Value Chain'));
  if (!rows) {
    errors.push('docs/projects/PROJECT_VALUE_CHAIN.md: canonical PVC table is missing or malformed');
    return new Map();
  }

  const owners = new Map();
  for (const row of rows) {
    const refs = expandPvcRefs(row.PVC);
    const owner = projectId(row['Primary Project Owner']);
    if (refs.length !== 1) {
      errors.push(`PROJECT_VALUE_CHAIN canonical row must contain exactly one PVC: ${JSON.stringify(row)}`);
      continue;
    }
    const pvc = refs[0];
    if (!EXPECTED_PVC_SET.has(pvc)) {
      errors.push(`PROJECT_VALUE_CHAIN contains out-of-range stage ${pvc}; canonical namespace is PVC-01..PVC-18`);
    }
    if (!owner) {
      errors.push(`PROJECT_VALUE_CHAIN ${pvc}: Primary Project Owner is missing or malformed`);
      continue;
    }
    if (owners.has(pvc)) {
      errors.push(`PROJECT_VALUE_CHAIN ${pvc}: duplicate Primary Project Owner rows`);
      continue;
    }
    owners.set(pvc, owner);
  }

  for (const pvc of EXPECTED_PVC_IDS) {
    if (!owners.has(pvc)) errors.push(`PROJECT_VALUE_CHAIN is missing ${pvc}`);
  }
  if (owners.size !== EXPECTED_PVC_IDS.length) {
    errors.push(`PROJECT_VALUE_CHAIN must contain exactly ${EXPECTED_PVC_IDS.length} canonical stages; found ${owners.size}`);
  }

  return owners;
}

function parsePrimaryOwnership(projectsReadme, errors) {
  const rows = parseFirstTable(getSection(projectsReadme, 'Primary project ownership'));
  if (!rows) {
    errors.push('docs/projects/README.md: Primary project ownership table is missing or malformed');
    return new Map();
  }

  const mapping = new Map();
  for (const row of rows) {
    const project = projectId(row.Project);
    const pvcs = expandPvcRefs(row['Primary PVC stages']);
    if (!project) {
      errors.push(`Primary project ownership row has no valid project: ${JSON.stringify(row)}`);
      continue;
    }
    if (pvcs.length === 0) {
      errors.push(`Primary project ownership ${project}: no PVC stages declared`);
      continue;
    }
    for (const pvc of pvcs) {
      if (!EXPECTED_PVC_SET.has(pvc)) {
        errors.push(`Primary project ownership ${project}: out-of-range ${pvc}`);
        continue;
      }
      if (mapping.has(pvc)) {
        errors.push(`Primary project ownership ${pvc}: duplicate owners ${mapping.get(pvc)} and ${project}`);
        continue;
      }
      mapping.set(pvc, project);
    }
  }
  return mapping;
}

function parseRouting(projectsReadme, errors) {
  const rows = parseFirstTable(getSection(projectsReadme, 'Canonical project-folder routing'));
  if (!rows) {
    errors.push('docs/projects/README.md: Canonical project-folder routing table is missing or malformed');
    return [];
  }

  const seenProjects = new Set();
  const seenFolders = new Set();
  const seenSlugs = new Set();
  const routes = [];

  for (const row of rows) {
    const project = projectId(row.Project);
    const materializationOwner = projectId(row['Materialization owner']);
    const folder = cleanCell(row['Canonical project folder']).replace(/\/$/, '');
    const slug = cleanCell(row['Branch project-folder slug']);
    const relationship = cleanCell(row['PVC relationship']);
    const state = cleanCell(row['Main surface state']);

    if (!project) {
      errors.push(`Project routing row has no valid project: ${JSON.stringify(row)}`);
      continue;
    }
    if (seenProjects.has(project)) errors.push(`Project routing contains duplicate project ${project}`);
    if (folder && seenFolders.has(folder)) errors.push(`Project routing contains duplicate folder ${folder}`);
    if (slug && seenSlugs.has(slug)) errors.push(`Project routing contains duplicate branch slug ${slug}`);
    seenProjects.add(project);
    if (folder) seenFolders.add(folder);
    if (slug) seenSlugs.add(slug);

    if (materializationOwner !== project) {
      errors.push(`Project routing ${project}: materialization owner must remain ${project}, found ${materializationOwner ?? 'missing'}`);
    }
    if (!/^docs\/projects\/[^/]+$/.test(folder)) {
      errors.push(`Project routing ${project}: canonical folder must be a direct docs/projects/<slug>/ path, found ${folder || 'missing'}`);
    } else if (slug !== path.basename(folder)) {
      errors.push(`Project routing ${project}: branch slug ${slug || 'missing'} must equal folder basename ${path.basename(folder)}`);
    }
    if (!/^present(?:\b|\s)/i.test(state)) {
      errors.push(`Project routing ${project}: main surface state must be present after materialization, found "${state || 'missing'}"`);
    }

    routes.push({ project, materializationOwner, folder, slug, relationship, state });
  }

  return routes;
}

export function validateProjectValueChain({ root = process.cwd() } = {}) {
  const errors = [];
  const resolvedRoot = path.resolve(root);
  const valueChainMarkdown = readRequired(resolvedRoot, 'docs/projects/PROJECT_VALUE_CHAIN.md', errors);
  const projectsReadme = readRequired(resolvedRoot, 'docs/projects/README.md', errors);

  if (!valueChainMarkdown || !projectsReadme) {
    return { ok: false, errors, summary: null };
  }

  const canonicalOwners = parseCanonicalValueChain(valueChainMarkdown, errors);
  const projectedOwners = parsePrimaryOwnership(projectsReadme, errors);
  const routes = parseRouting(projectsReadme, errors);

  for (const pvc of EXPECTED_PVC_IDS) {
    const canonicalOwner = canonicalOwners.get(pvc);
    const projectedOwner = projectedOwners.get(pvc);
    if (canonicalOwner && projectedOwner && canonicalOwner !== projectedOwner) {
      errors.push(`${pvc}: PROJECT_VALUE_CHAIN owner ${canonicalOwner} disagrees with docs/projects/README owner ${projectedOwner}`);
    }
    if (canonicalOwner && !projectedOwner) {
      errors.push(`${pvc}: docs/projects/README Primary project ownership projection is missing ${canonicalOwner}`);
    }
  }

  for (const pvc of projectedOwners.keys()) {
    if (!canonicalOwners.has(pvc)) {
      errors.push(`${pvc}: docs/projects/README projects an ownership stage not present in PROJECT_VALUE_CHAIN`);
    }
  }

  const primaryProjects = new Set(canonicalOwners.values());
  const routedProjects = new Set(routes.map((route) => route.project));
  const routedFolders = new Set(routes.map((route) => route.folder));
  const projectRoot = path.join(resolvedRoot, 'docs/projects');

  for (const project of primaryProjects) {
    if (!routedProjects.has(project)) errors.push(`Primary owner ${project}: missing canonical project-folder routing row`);
  }

  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const readmePath = path.join(projectRoot, entry.name, 'README.md');
    if (!fs.existsSync(readmePath)) continue;
    const relativeFolder = `docs/projects/${entry.name}`;
    if (!routedFolders.has(relativeFolder)) {
      errors.push(`${relativeFolder}: project folder with README exists but is missing from canonical routing table`);
    }
  }

  let crossCuttingCount = 0;
  for (const route of routes) {
    const readmePath = `${route.folder}/README.md`;
    const projectReadme = readRequired(resolvedRoot, readmePath, errors);
    if (!projectReadme) continue;

    const identity = projectReadme.match(/\*\*(?:Project ID|Project):\*\*\s*`?(CAPITAL-AI-[A-Z0-9-]+)`?/i)?.[1] ?? null;
    if (identity !== route.project) {
      errors.push(`${readmePath}: project identity must be ${route.project}, found ${identity ?? 'missing'}`);
    }

    const expectedPvcs = new Set(
      [...canonicalOwners.entries()]
        .filter(([, owner]) => owner === route.project)
        .map(([pvc]) => pvc),
    );
    const declarationLines = ownershipDeclarationLines(projectReadme);
    const declaredPvcs = new Set(declarationLines.flatMap(expandPvcRefs));

    for (const pvc of declaredPvcs) {
      if (!EXPECTED_PVC_SET.has(pvc)) {
        errors.push(`${readmePath}: ownership declaration contains out-of-range ${pvc}; PVC-19+ is not permitted`);
      }
    }

    const isCrossCutting = /no productive pvc/i.test(route.relationship);
    if (isCrossCutting) {
      crossCuttingCount += 1;
      if (expectedPvcs.size > 0) {
        errors.push(`${route.project}: routing says cross-cutting/no productive PVC but PROJECT_VALUE_CHAIN assigns ${[...expectedPvcs].join(', ')}`);
      }
      if (declaredPvcs.size > 0) {
        errors.push(`${readmePath}: cross-cutting project must not declare productive PVC ownership (${[...declaredPvcs].join(', ')})`);
      }
      if (!hasExplicitZeroProductiveOwnership(projectReadme)) {
        errors.push(`${readmePath}: cross-cutting project must explicitly state zero productive PVC ownership`);
      }
      continue;
    }

    if (expectedPvcs.size === 0) {
      errors.push(`${route.project}: routed as productive owner but owns no canonical PVC stage`);
      continue;
    }

    if (declaredPvcs.size === 0) {
      const clientTransitionAllowed = route.project === 'CAPITAL-AI-CLIENT'
        && expectedPvcs.size === 1
        && expectedPvcs.has('PVC-01')
        && hasClientTransition(valueChainMarkdown, projectReadme);
      if (!clientTransitionAllowed) {
        errors.push(`${readmePath}: productive project must declare its canonical PVC ownership`);
      }
    } else if (!sameSet(declaredPvcs, expectedPvcs)) {
      errors.push(`${readmePath}: declared PVC ownership ${[...declaredPvcs].sort().join(', ')} does not match canonical ${[...expectedPvcs].sort().join(', ')}`);
    }
  }

  const summary = {
    pvcStages: canonicalOwners.size,
    primaryProjects: primaryProjects.size,
    projectFolders: routes.length,
    crossCuttingProjects: crossCuttingCount,
  };

  return { ok: errors.length === 0, errors, summary };
}

export function formatValidationResult(result) {
  if (!result.ok) {
    return [
      `[project-value-chain] FAIL (${result.errors.length} finding${result.errors.length === 1 ? '' : 's'})`,
      ...result.errors.map((error) => `- ${error}`),
    ].join('\n');
  }
  return `[project-value-chain] PASS: ${result.summary.pvcStages} PVC stages, ${result.summary.primaryProjects} primary owners, ${result.summary.projectFolders} routed project folders, ${result.summary.crossCuttingProjects} cross-cutting projects.`;
}

function cliRoot(argv) {
  const index = argv.indexOf('--root');
  if (index < 0) return process.cwd();
  const value = argv[index + 1];
  if (!value) throw new Error('--root requires a path');
  return value;
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  try {
    const result = validateProjectValueChain({ root: cliRoot(process.argv.slice(2)) });
    const output = formatValidationResult(result);
    if (result.ok) {
      console.log(output);
    } else {
      console.error(output);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`[project-value-chain] FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
