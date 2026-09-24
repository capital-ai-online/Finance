import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const PROVIDER_PREFIX = /^(agent|claude|grok|ai)\//;
const CONVENTIONAL_PREFIX = /^(feat|fix|hotfix|chore|refactor|docs|test|perf|security)\//;
const PROJECT_ID = /^CAPITAL-AI-[A-Z0-9-]+$/;
const PROJECT_LABEL = /^project:CAPITAL-AI-[A-Z0-9-]+$/;

const cleanCell = (value) => String(value ?? '')
  .trim()
  .replace(/^\`|\`$/g, '');

export function parseProjectBranchRoutes(markdown) {
  const routes = new Map();
  for (const line of String(markdown ?? '').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(cleanCell);
    if (cells.length < 4 || !PROJECT_ID.test(cells[0])) continue;
    const branchSlug = cells[3];
    if (!/^[a-z0-9-]+$/.test(branchSlug)) continue;
    if (routes.has(cells[0])) throw new Error(`duplicate project route: ${cells[0]}`);
    routes.set(cells[0], {
      projectId: cells[0],
      pvcRelationship: cells[1],
      projectFolder: cells[2],
      branchSlug,
    });
  }
  return routes;
}

function deny(reason, evidence = {}) {
  return { allowed: false, reason, ...evidence };
}

export function evaluateBranchSyncTrust(input, projectRoutingMarkdown) {
  const repository = String(input?.repository ?? '').trim();
  const headRepositoryFullName = String(input?.headRepositoryFullName ?? '').trim();
  const headRefName = String(input?.headRefName ?? '').trim();
  const baseRefName = String(input?.baseRefName ?? '').trim();
  const authorAssociation = String(input?.authorAssociation ?? '').trim().toUpperCase();
  const title = String(input?.title ?? '').trim();
  const labels = Array.isArray(input?.labels) ? input.labels.map((label) => String(label)) : [];
  const isCrossRepository = input?.isCrossRepository === true;

  if (!repository || !headRepositoryFullName || headRepositoryFullName.toLowerCase() !== repository.toLowerCase()) {
    return deny('HEAD_REPOSITORY_MISMATCH');
  }
  if (isCrossRepository) return deny('FORK_OR_CROSS_REPOSITORY');
  if (baseRefName !== 'main') return deny('BASE_NOT_MAIN');

  if (PROVIDER_PREFIX.test(headRefName)) {
    return {
      allowed: true,
      reason: 'TRUSTED_PROVIDER_PREFIX',
      projectId: null,
      branchSlug: headRefName.split('/')[0],
    };
  }

  if (!TRUSTED_ASSOCIATIONS.has(authorAssociation)) {
    return deny('UNTRUSTED_AUTHOR_ASSOCIATION', { authorAssociation });
  }

  const titleMatches = title.match(/\[CAPITAL-AI-[A-Z0-9-]+\]/g) ?? [];
  if (titleMatches.length !== 1 || !title.startsWith(titleMatches[0])) {
    return deny('PROJECT_TITLE_PREFIX_INVALID');
  }
  const projectId = titleMatches[0].slice(1, -1);
  if (!PROJECT_ID.test(projectId)) return deny('PROJECT_ID_INVALID');

  const projectLabels = labels.filter((label) => PROJECT_LABEL.test(label));
  if (projectLabels.length !== 1 || projectLabels[0] !== `project:${projectId}`) {
    return deny('PROJECT_LABEL_MISMATCH', { projectId, projectLabels });
  }

  const routes = parseProjectBranchRoutes(projectRoutingMarkdown);
  const route = routes.get(projectId);
  if (!route) return deny('UNKNOWN_PROJECT_ROUTE', { projectId });

  const projectNamespace = headRefName.startsWith(`${route.branchSlug}/`);
  const conventionalNamespace = CONVENTIONAL_PREFIX.test(headRefName);
  if (!projectNamespace && !conventionalNamespace) {
    return deny('BRANCH_NAMESPACE_MISMATCH', {
      projectId,
      expectedProjectNamespace: `${route.branchSlug}/*`,
    });
  }

  return {
    allowed: true,
    reason: projectNamespace ? 'TRUSTED_PROJECT_NAMESPACE' : 'TRUSTED_CONVENTIONAL_NAMESPACE',
    projectId,
    branchSlug: route.branchSlug,
    pvcRelationship: route.pvcRelationship,
    projectFolder: route.projectFolder,
    authorAssociation,
  };
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const routingPath = process.argv[2];
  if (!routingPath) throw new Error('project routing path is required');
  const routing = fs.readFileSync(routingPath, 'utf8');
  const rawInput = process.env.BRANCH_SYNC_PR_JSON;
  if (!rawInput) throw new Error('BRANCH_SYNC_PR_JSON is required');
  const decision = evaluateBranchSyncTrust(JSON.parse(rawInput), routing);
  process.stdout.write(`${JSON.stringify(decision)}\n`);
}
