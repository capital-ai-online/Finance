import { Router } from 'express';
import { getDeploymentIdentity, type DeploymentIdentity } from '../deploymentIdentity';
import {
  loadRoadmapStateProjection,
  parseRoadmapProjectRouting,
  type RoadmapProjectRoute,
} from './roadmapStateProjection';
import {
  computeMergeCadence,
  isCadenceContractActive,
  isPullRequestMerge,
} from '../../scripts/operations/mergeCadence.mjs';

const REPOSITORY = 'capital-ai-online/Finance';
const ACTIVATION_PR = 1336;
const CACHE_MS = 120_000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_COMMIT_PAGES = 5;
const BRANCH_CACHE_MS = 300_000;
const MAX_BRANCH_PAGES = 2;
const MAX_BRANCH_CANDIDATES = 120;
const BRANCH_COMPARE_CONCURRENCY = 12;
const PROJECT_MAPPING_PATH = 'docs/projects/README.md';

type FetchLike = typeof fetch;

export interface RoadmapCadenceProjection {
  schemaVersion: 'roadmap-cadence-projection/1.0.0';
  role: 'NON_AUTHORIZING_LIVE_PROJECTION';
  observedAt: string;
  stale: boolean;
  repository: {
    currentMainSha: string;
    packageVersion: string;
  };
  production: DeploymentIdentity;
  cadence: {
    mode: 'LEGACY_PER_MERGE' | 'CADENCE_5_10' | 'PENDING_ACTIVATION';
    activationPullRequest: 1336;
    activationMergeSha: string | null;
    mergeOrdinal: number | null;
    deployment: {
      interval: 5;
      progress: number | null;
      remaining: number | null;
      state: 'LEGACY_PER_MERGE' | 'DEPLOYMENT_QUEUED' | 'DEPLOYMENT_DUE' | 'CONVERGED' | 'PRODUCTION_DRIFT';
      nextTargetSha: string;
    };
    version: {
      interval: 10;
      progress: number | null;
      remaining: number | null;
      current: string;
      nextPatch: string;
    };
  };
}

let cache: { at: number; value: RoadmapCadenceProjection } | null = null;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'capital-ai-roadmap-cadence/1.0.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = String(process.env.GITHUB_TOKEN || '').trim();
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}

async function json(fetchImpl: FetchLike, url: string, headers: Record<string, string> = {}): Promise<any> {
  const response = await fetchImpl(url, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url);
  return response.json();
}

async function repositoryJsonAtRef(
  fetchImpl: FetchLike,
  path: string,
  ref: string,
): Promise<any> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url =
    'https://api.github.com/repos/' +
    REPOSITORY +
    '/contents/' +
    encodedPath +
    '?ref=' +
    encodeURIComponent(ref);
  const payload = await json(fetchImpl, url, githubHeaders());
  if (payload?.encoding !== 'base64' || typeof payload?.content !== 'string') {
    throw new Error('GitHub Contents response is not base64 text for ' + path + '@' + ref);
  }
  const text = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      path +
        '@' +
        ref +
        ' is not valid JSON: ' +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

function subject(commit: any): string {
  return String(commit?.commit?.message || '').split(/\r?\n/)[0];
}

function parents(commit: any): string {
  return Array.isArray(commit?.parents)
    ? commit.parents.map((parent: any) => String(parent?.sha || '')).join(' ')
    : '';
}

function isActivationMerge(commit: any): boolean {
  return new RegExp('^Merge pull request #' + ACTIVATION_PR + ' from ', 'i').test(subject(commit));
}

function countPrMerges(commits: any[]): number {
  return commits.filter((commit) => isPullRequestMerge(subject(commit), parents(commit))).length;
}

async function loadMainHistory(fetchImpl: FetchLike): Promise<{ commits: any[]; epochIndex: number }> {
  const commits: any[] = [];
  for (let page = 1; page <= MAX_COMMIT_PAGES; page += 1) {
    const url =
      'https://api.github.com/repos/' + REPOSITORY +
      '/commits?sha=main&per_page=100&page=' + String(page);
    const batch = await json(fetchImpl, url, githubHeaders());
    if (!Array.isArray(batch) || batch.length === 0) break;
    commits.push(...batch);
    const epochIndex = commits.findIndex(isActivationMerge);
    if (epochIndex >= 0) return { commits, epochIndex };
    if (batch.length < 100) break;
  }
  return { commits, epochIndex: -1 };
}

async function compareProductionToMain(fetchImpl: FetchLike, productionSha: string, currentMainSha: string): Promise<string> {
  const url =
    'https://api.github.com/repos/' + REPOSITORY +
    '/compare/' + encodeURIComponent(productionSha + '...' + currentMainSha);
  const value = await json(fetchImpl, url, githubHeaders());
  return String(value?.status || 'unknown');
}

export async function buildRoadmapCadenceProjection(
  fetchImpl: FetchLike = fetch,
  production: DeploymentIdentity = getDeploymentIdentity(),
): Promise<RoadmapCadenceProjection> {
  const history = await loadMainHistory(fetchImpl);
  const currentMainSha = String(history.commits[0]?.sha || '').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(currentMainSha)) throw new Error('Live GitHub CURRENT_MAIN is unavailable.');

  const [contract, pkg] = await Promise.all([
    repositoryJsonAtRef(
      fetchImpl,
      'docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json',
      currentMainSha,
    ),
    repositoryJsonAtRef(fetchImpl, 'package.json', currentMainSha),
  ]);
  const packageVersion = String(pkg?.version || '');
  const active = isCadenceContractActive(contract);
  const activationCommit = history.epochIndex >= 0 ? history.commits[history.epochIndex] : null;
  const activationMergeSha = activationCommit ? String(activationCommit.sha || '').toLowerCase() : null;

  if (!active) {
    return {
      schemaVersion: 'roadmap-cadence-projection/1.0.0',
      role: 'NON_AUTHORIZING_LIVE_PROJECTION',
      observedAt: new Date().toISOString(),
      stale: false,
      repository: { currentMainSha, packageVersion },
      production,
      cadence: {
        mode: 'PENDING_ACTIVATION',
        activationPullRequest: ACTIVATION_PR,
        activationMergeSha,
        mergeOrdinal: null,
        deployment: {
          interval: 5,
          progress: null,
          remaining: null,
          state: 'LEGACY_PER_MERGE',
          nextTargetSha: currentMainSha,
        },
        version: {
          interval: 10,
          progress: null,
          remaining: null,
          current: packageVersion,
          nextPatch: computeMergeCadence({
            active: false,
            mergeOrdinal: 0,
            currentVersion: packageVersion,
          }).nextPatchVersion,
        },
      },
    };
  }

  if (history.epochIndex < 0 || !activationMergeSha) {
    throw new Error('Cadence contract is active but activation merge #' + String(ACTIVATION_PR) + ' is outside bounded main history.');
  }

  const afterEpoch = history.commits.slice(0, history.epochIndex);
  const mergeOrdinal = countPrMerges(afterEpoch);
  const productionSha = String(production.commitSha || '').toLowerCase();

  let productionOrdinal = 0;
  let productionRelation = 'UNKNOWN';
  if (/^[0-9a-f]{40}$/.test(productionSha)) {
    if (productionSha === currentMainSha) {
      productionOrdinal = mergeOrdinal;
      productionRelation = 'CURRENT_MAIN';
    } else {
      const productionIndex = history.commits.findIndex(
        (commit) => String(commit?.sha || '').toLowerCase() === productionSha,
      );
      if (productionIndex >= 0 && productionIndex < history.epochIndex) {
        productionOrdinal = countPrMerges(history.commits.slice(productionIndex, history.epochIndex));
        productionRelation = 'ANCESTOR';
      } else if (productionIndex > history.epochIndex) {
        productionOrdinal = 0;
        productionRelation = 'PRE_EPOCH';
      } else {
        const relation = await compareProductionToMain(fetchImpl, productionSha, currentMainSha);
        productionRelation = relation === 'ahead' || relation === 'identical' ? 'PRE_EPOCH' : 'DIVERGED';
      }
    }
  }

  if (
    (production.branch && production.branch !== 'main') ||
    (production.repoSlug && production.repoSlug !== REPOSITORY)
  ) {
    productionRelation = 'DIVERGED';
  }

  const cadence = computeMergeCadence({
    active: true,
    mergeOrdinal,
    productionOrdinal,
    productionRelation,
    productionHealthy: true,
    currentVersion: packageVersion,
  });

  const deploymentState =
    productionRelation === 'DIVERGED'
      ? 'PRODUCTION_DRIFT'
      : productionSha === currentMainSha
        ? 'CONVERGED'
        : cadence.deployDue
          ? 'DEPLOYMENT_DUE'
          : 'DEPLOYMENT_QUEUED';

  return {
    schemaVersion: 'roadmap-cadence-projection/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: new Date().toISOString(),
    stale: false,
    repository: { currentMainSha, packageVersion },
    production,
    cadence: {
      mode: 'CADENCE_5_10',
      activationPullRequest: ACTIVATION_PR,
      activationMergeSha,
      mergeOrdinal,
      deployment: {
        interval: 5,
        progress: cadence.deployProgress,
        remaining: cadence.deployRemaining,
        state: deploymentState,
        nextTargetSha: currentMainSha,
      },
      version: {
        interval: 10,
        progress: cadence.versionProgress,
        remaining: cadence.versionRemaining,
        current: packageVersion,
        nextPatch: cadence.nextPatchVersion,
      },
    },
  };
}

export async function loadRoadmapCadenceProjection(fetchImpl: FetchLike = fetch): Promise<RoadmapCadenceProjection> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.value;
  try {
    const value = await buildRoadmapCadenceProjection(fetchImpl);
    cache = { at: now, value };
    return value;
  } catch (error) {
    if (cache) {
      return { ...cache.value, stale: true, observedAt: new Date().toISOString() };
    }
    throw error;
  }
}


export interface RoadmapLiveBranch {
  name: string;
  headSha: string;
  currentMainSha: string;
  aheadBy: number;
  behindBy: 0;
  relation: 'LIVE_CURRENT_MAIN_DESCENDANT';
  projectId: string | null;
  projectFolder: string | null;
  projectLabel: string | null;
  ownerResolution: 'RESOLVED' | 'UNRESOLVED';
}

export interface RoadmapBranchProjection {
  schemaVersion: 'roadmap-branch-evidence/1.0.0';
  role: 'NON_AUTHORIZING_LIVE_PROJECTION';
  observedAt: string;
  stale: boolean;
  repository: {
    currentMainSha: string;
  };
  scan: {
    candidateCount: number;
    comparedCount: number;
    excludedCount: number;
    comparisonFailures: number;
    truncated: boolean;
  };
  branches: RoadmapLiveBranch[];
}

let branchCache: { at: number; value: RoadmapBranchProjection } | null = null;

async function repositoryTextAtRef(
  fetchImpl: FetchLike,
  path: string,
  ref: string,
): Promise<string> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url =
    'https://api.github.com/repos/' +
    REPOSITORY +
    '/contents/' +
    encodedPath +
    '?ref=' +
    encodeURIComponent(ref);
  const payload = await json(fetchImpl, url, githubHeaders());
  if (payload?.encoding !== 'base64' || typeof payload?.content !== 'string') {
    throw new Error('GitHub Contents response is not base64 text for ' + path + '@' + ref);
  }
  return Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
}

async function resolveRepositoryCurrentMain(fetchImpl: FetchLike): Promise<string> {
  const payload = await json(
    fetchImpl,
    'https://api.github.com/repos/' + REPOSITORY + '/commits/main',
    githubHeaders(),
  );
  const sha = String(payload?.sha || '').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('Live GitHub CURRENT_MAIN is unavailable.');
  return sha;
}

async function listRepositoryBranchHeads(
  fetchImpl: FetchLike,
): Promise<{ branches: Array<{ name: string; headSha: string }>; truncated: boolean }> {
  const rows: Array<{ name: string; headSha: string }> = [];
  for (let page = 1; page <= MAX_BRANCH_PAGES; page += 1) {
    const payload = await json(
      fetchImpl,
      'https://api.github.com/repos/' +
        REPOSITORY +
        '/branches?per_page=100&page=' +
        String(page),
      githubHeaders(),
    );
    if (!Array.isArray(payload)) throw new Error('GitHub branches response must be an array.');
    for (const branch of payload) {
      const name = String(branch?.name || '');
      const headSha = String(branch?.commit?.sha || '').toLowerCase();
      if (!name || name === 'main' || !/^[0-9a-f]{40}$/.test(headSha)) continue;
      rows.push({ name, headSha });
    }
    if (payload.length < 100) break;
  }
  return {
    branches: rows.slice(0, MAX_BRANCH_CANDIDATES),
    truncated: rows.length > MAX_BRANCH_CANDIDATES,
  };
}

function resolveBranchProject(
  branchName: string,
  routes: RoadmapProjectRoute[],
): RoadmapProjectRoute | null {
  const normalized = branchName.toLowerCase();
  const remainder = normalized.includes('/') ? normalized.slice(normalized.indexOf('/') + 1) : normalized;
  const candidates = routes.filter((route) => {
    const slug = route.branchSlug.toLowerCase();
    return (
      remainder === slug ||
      remainder.startsWith(slug + '-') ||
      remainder.startsWith(slug + '/') ||
      normalized === slug ||
      normalized.startsWith(slug + '-') ||
      normalized.startsWith(slug + '/')
    );
  });
  return candidates.length === 1 ? candidates[0] : null;
}

async function compareBranchToCurrentMain(
  fetchImpl: FetchLike,
  currentMainSha: string,
  branch: { name: string; headSha: string },
  routes: RoadmapProjectRoute[],
): Promise<RoadmapLiveBranch | null> {
  const comparison = await json(
    fetchImpl,
    'https://api.github.com/repos/' +
      REPOSITORY +
      '/compare/' +
      currentMainSha +
      '...' +
      branch.headSha,
    githubHeaders(),
  );
  const aheadBy = Number(comparison?.ahead_by);
  const behindBy = Number(comparison?.behind_by);
  if (!Number.isInteger(aheadBy) || !Number.isInteger(behindBy)) {
    throw new Error('GitHub compare response is missing ahead_by/behind_by.');
  }
  if (behindBy !== 0 || aheadBy <= 0) return null;

  const route = resolveBranchProject(branch.name, routes);
  return {
    name: branch.name,
    headSha: branch.headSha,
    currentMainSha,
    aheadBy,
    behindBy: 0,
    relation: 'LIVE_CURRENT_MAIN_DESCENDANT',
    projectId: route?.projectId ?? null,
    projectFolder: route?.folder ?? null,
    projectLabel: route?.label ?? null,
    ownerResolution: route ? 'RESOLVED' : 'UNRESOLVED',
  };
}

export async function buildRoadmapBranchProjection(
  fetchImpl: FetchLike = fetch,
): Promise<RoadmapBranchProjection> {
  const currentMainSha = await resolveRepositoryCurrentMain(fetchImpl);
  const [mappingMarkdown, listed] = await Promise.all([
    repositoryTextAtRef(fetchImpl, PROJECT_MAPPING_PATH, currentMainSha),
    listRepositoryBranchHeads(fetchImpl),
  ]);
  const routes = parseRoadmapProjectRouting(mappingMarkdown);
  const branches: RoadmapLiveBranch[] = [];
  let comparedCount = 0;
  let comparisonFailures = 0;

  for (let offset = 0; offset < listed.branches.length; offset += BRANCH_COMPARE_CONCURRENCY) {
    const batch = listed.branches.slice(offset, offset + BRANCH_COMPARE_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (candidate) => {
        try {
          const value = await compareBranchToCurrentMain(
            fetchImpl,
            currentMainSha,
            candidate,
            routes,
          );
          return { ok: true as const, value };
        } catch {
          return { ok: false as const, value: null };
        }
      }),
    );
    for (const result of results) {
      comparedCount += 1;
      if (!result.ok) {
        comparisonFailures += 1;
        continue;
      }
      if (result.value) branches.push(result.value);
    }
  }

  if (listed.branches.length > 0 && comparisonFailures === listed.branches.length) {
    throw new Error('All GitHub branch comparisons failed.');
  }

  branches.sort((left, right) => {
    const project = String(left.projectId || 'ZZZ').localeCompare(String(right.projectId || 'ZZZ'));
    return project !== 0 ? project : left.name.localeCompare(right.name);
  });

  return {
    schemaVersion: 'roadmap-branch-evidence/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: new Date().toISOString(),
    stale: false,
    repository: { currentMainSha },
    scan: {
      candidateCount: listed.branches.length,
      comparedCount,
      excludedCount: comparedCount - comparisonFailures - branches.length,
      comparisonFailures,
      truncated: listed.truncated,
    },
    branches,
  };
}

export async function loadRoadmapBranchProjection(
  fetchImpl: FetchLike = fetch,
): Promise<RoadmapBranchProjection> {
  const now = Date.now();
  if (branchCache && now - branchCache.at < BRANCH_CACHE_MS) return branchCache.value;
  try {
    const value = await buildRoadmapBranchProjection(fetchImpl);
    branchCache = { at: now, value };
    return value;
  } catch (error) {
    if (branchCache) {
      return {
        ...branchCache.value,
        stale: true,
        observedAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export const roadmapCadenceRouter = Router();

roadmapCadenceRouter.get('/cadence', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=90');
    res.json(await loadRoadmapCadenceProjection());
  } catch (error) {
    res.status(503).json({
      schemaVersion: 'roadmap-cadence-projection/1.0.0',
      role: 'NON_AUTHORIZING_LIVE_PROJECTION',
      state: 'EVIDENCE_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

roadmapCadenceRouter.get('/state', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=90');
    res.json(await loadRoadmapStateProjection());
  } catch (error) {
    res.status(503).json({
      schemaVersion: 'roadmap-live-state/1.0.0',
      role: 'NON_AUTHORIZING_LIVE_PROJECTION',
      state: 'EVIDENCE_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

roadmapCadenceRouter.get('/branches', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=90');
    res.json(await loadRoadmapBranchProjection());
  } catch (error) {
    res.status(503).json({
      schemaVersion: 'roadmap-branch-evidence/1.0.0',
      role: 'NON_AUTHORIZING_LIVE_PROJECTION',
      state: 'EVIDENCE_UNAVAILABLE',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
