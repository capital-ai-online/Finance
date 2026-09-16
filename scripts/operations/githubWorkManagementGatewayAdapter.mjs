import { createHash } from 'node:crypto';

export const CANONICAL_GITHUB_OWNER = 'capital-ai-online';
export const CANONICAL_GITHUB_REPOSITORY = 'Finance';
export const CANONICAL_WIKI_REPOSITORY = `${CANONICAL_GITHUB_OWNER}/${CANONICAL_GITHUB_REPOSITORY}.wiki`;
export const PILOT_MILESTONE_TITLE = 'GitHub Work Management Pilot';
export const PILOT_MILESTONE_DESCRIPTION =
  'Non-versioned delivery cohort for OPS-PR900-03B. No platform, release or deployment version authority.';

export const OFFICIAL_GITHUB_MCP_DELEGATION = Object.freeze({
  projects: Object.freeze(['projects_get', 'projects_list', 'projects_write']),
  issueTaxonomy: Object.freeze(['list_issue_types', 'list_issue_fields']),
  issueLifecycle: Object.freeze(['issue_write']),
});

export const GATEWAY_CAPABILITIES = Object.freeze([
  'github.work_management.milestones.list',
  'github.work_management.milestones.get',
  'github.work_management.milestones.create_pilot',
  'github.work_management.milestones.update_pilot',
  'github.work_management.wiki.read_navigation',
  'github.work_management.wiki.write_navigation',
]);

const CAPABILITY_SET = new Set(GATEWAY_CAPABILITIES);
const ALLOWED_MILESTONE_STATES = new Set(['open', 'closed']);
const MAX_MILESTONE_PAGES = 100;

export const WIKI_NAVIGATION_PAGES = Object.freeze({
  Home: [
    '# Finance Wiki',
    '',
    'Navigation only. Canonical authority remains in the repository.',
    '',
    '- [[CAPITAL-AI Projects|CAPITAL-AI-Projects]]',
  ].join('\n'),
  'CAPITAL-AI-Projects': [
    '# CAPITAL-AI Projects',
    '',
    'Navigation only.',
    '',
    '- [[CAPITAL-AI-OPS]]',
    '- [[Home]]',
  ].join('\n'),
  'CAPITAL-AI-OPS': [
    '# CAPITAL-AI-OPS',
    '',
    'Navigation only. Primary execution authority remains the canonical OPS Roadmap.',
    '',
    '- [[OPS-PR900-03B]]',
    '- [[CAPITAL-AI Projects|CAPITAL-AI-Projects]]',
    '- Canonical Roadmap: `docs/projects/operations/ROADMAP.md`',
  ].join('\n'),
  'OPS-PR900-03B': [
    '# OPS-PR900-03B',
    '',
    'Navigation entry only.',
    '',
    '- Canonical Roadmap: `docs/projects/operations/ROADMAP.md`',
    '- Primary Owner: `CAPITAL-AI-OPS`',
    '- Primary PVC: `PVC-02 — Controlled Implementation`',
    '- [[CAPITAL-AI-OPS]]',
  ].join('\n'),
  _Sidebar: [
    '- [[Home]]',
    '- [[CAPITAL-AI Projects|CAPITAL-AI-Projects]]',
    '- [[CAPITAL-AI-OPS]]',
    '- [[OPS-PR900-03B]]',
  ].join('\n'),
});

function fail(message) {
  throw new Error(`[GITHUB-WORK-MANAGEMENT-GATEWAY] ${message}`);
}

function assertCanonicalTarget(owner, repo) {
  if (owner !== CANONICAL_GITHUB_OWNER || repo !== CANONICAL_GITHUB_REPOSITORY) {
    fail(`target must be exactly ${CANONICAL_GITHUB_OWNER}/${CANONICAL_GITHUB_REPOSITORY}`);
  }
}

function assertCapability(capability) {
  if (!CAPABILITY_SET.has(capability)) fail(`capability is not allowlisted: ${String(capability)}`);
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) fail(`${label} must be a positive integer`);
}

function assertMilestoneState(value) {
  if (!ALLOWED_MILESTONE_STATES.has(value)) fail('milestone state must be open or closed');
}

function assertWikiPage(page) {
  if (!Object.prototype.hasOwnProperty.call(WIKI_NAVIGATION_PAGES, page)) {
    fail(`wiki page is not allowlisted: ${String(page)}`);
  }
}

function digest(value) {
  return `sha256:${createHash('sha256').update(String(value), 'utf8').digest('hex')}`;
}

function normalizeMilestone(raw) {
  if (!raw || typeof raw !== 'object') fail('milestone provider response must be an object');
  assertPositiveInteger(raw.number, 'milestone.number');
  const state = String(raw.state || '');
  assertMilestoneState(state);
  return Object.freeze({
    number: raw.number,
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    state,
    htmlUrl: typeof raw.html_url === 'string' ? raw.html_url : null,
    updatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
  });
}

function assertCanonicalMilestone(milestone) {
  if (milestone.title !== PILOT_MILESTONE_TITLE) {
    fail('provider milestone title does not match the canonical pilot milestone');
  }
  if (milestone.description !== PILOT_MILESTONE_DESCRIPTION) {
    fail('provider milestone description does not match the canonical non-versioned contract');
  }
}

function assertRestTransport(githubRest) {
  if (typeof githubRest !== 'function') fail('githubRest transport is required');
}

function assertWikiTransport(wikiTransport) {
  if (!wikiTransport || typeof wikiTransport.readPage !== 'function' || typeof wikiTransport.writePage !== 'function') {
    fail('wikiTransport with readPage/writePage is required');
  }
}

async function readMilestone(githubRest, owner, repo, number) {
  assertPositiveInteger(number, 'milestone number');
  const raw = await githubRest({
    method: 'GET',
    path: `/repos/${owner}/${repo}/milestones/${number}`,
  });
  return normalizeMilestone(raw);
}

async function listMilestones(githubRest, owner, repo) {
  const milestones = [];

  for (let page = 1; page <= MAX_MILESTONE_PAGES; page += 1) {
    const raw = await githubRest({
      method: 'GET',
      path: `/repos/${owner}/${repo}/milestones?state=all&per_page=100&page=${page}`,
    });
    if (!Array.isArray(raw)) fail('milestone list response must be an array');

    milestones.push(...raw.map(normalizeMilestone));
    if (raw.length < 100) return Object.freeze(milestones);
  }

  fail(`milestone pagination exceeded safety limit of ${MAX_MILESTONE_PAGES} pages`);
}

export function createGitHubWorkManagementGatewayAdapter({
  githubRest = undefined,
  wikiTransport = undefined,
  owner = CANONICAL_GITHUB_OWNER,
  repo = CANONICAL_GITHUB_REPOSITORY,
} = {}) {
  assertCanonicalTarget(owner, repo);
  assertRestTransport(githubRest);
  assertWikiTransport(wikiTransport);

  return Object.freeze({
    describeSurface() {
      return Object.freeze({
        target: `${owner}/${repo}`,
        officialGitHubMcp: OFFICIAL_GITHUB_MCP_DELEGATION,
        boundedAdapterCapabilities: GATEWAY_CAPABILITIES,
        wikiRepository: CANONICAL_WIKI_REPOSITORY,
      });
    },

    async execute(capability, input = {}) {
      assertCapability(capability);

      if (capability === 'github.work_management.milestones.list') {
        return listMilestones(githubRest, owner, repo);
      }

      if (capability === 'github.work_management.milestones.get') {
        return readMilestone(githubRest, owner, repo, input.number);
      }

      if (capability === 'github.work_management.milestones.create_pilot') {
        const created = normalizeMilestone(await githubRest({
          method: 'POST',
          path: `/repos/${owner}/${repo}/milestones`,
          body: {
            title: PILOT_MILESTONE_TITLE,
            description: PILOT_MILESTONE_DESCRIPTION,
          },
        }));
        assertCanonicalMilestone(created);
        const readback = await readMilestone(githubRest, owner, repo, created.number);
        assertCanonicalMilestone(readback);
        if (readback.state !== created.state) fail('milestone create readback state mismatch');
        return Object.freeze({ operation: 'create_pilot', readback });
      }

      if (capability === 'github.work_management.milestones.update_pilot') {
        assertPositiveInteger(input.number, 'milestone number');
        assertMilestoneState(input.state);

        const existing = await readMilestone(githubRest, owner, repo, input.number);
        assertCanonicalMilestone(existing);

        const updated = normalizeMilestone(await githubRest({
          method: 'PATCH',
          path: `/repos/${owner}/${repo}/milestones/${input.number}`,
          body: {
            title: PILOT_MILESTONE_TITLE,
            description: PILOT_MILESTONE_DESCRIPTION,
            state: input.state,
          },
        }));
        assertCanonicalMilestone(updated);
        const readback = await readMilestone(githubRest, owner, repo, input.number);
        assertCanonicalMilestone(readback);
        if (readback.state !== input.state) fail('milestone update readback state mismatch');
        return Object.freeze({ operation: 'update_pilot', readback });
      }

      if (capability === 'github.work_management.wiki.read_navigation') {
        assertWikiPage(input.page);
        const value = await wikiTransport.readPage({
          wikiRepository: CANONICAL_WIKI_REPOSITORY,
          page: input.page,
        });
        if (typeof value !== 'string') fail('wiki readback must return UTF-8 text');
        return Object.freeze({
          page: input.page,
          contentDigest: digest(value),
          matchesCanonicalNavigation: value === WIKI_NAVIGATION_PAGES[input.page],
        });
      }

      if (capability === 'github.work_management.wiki.write_navigation') {
        assertWikiPage(input.page);
        const content = WIKI_NAVIGATION_PAGES[input.page];
        await wikiTransport.writePage({
          wikiRepository: CANONICAL_WIKI_REPOSITORY,
          page: input.page,
          content,
        });
        const readback = await wikiTransport.readPage({
          wikiRepository: CANONICAL_WIKI_REPOSITORY,
          page: input.page,
        });
        if (readback !== content) fail('wiki write readback mismatch');
        return Object.freeze({
          page: input.page,
          contentDigest: digest(readback),
          readback: 'PASS',
        });
      }

      fail(`unreachable capability dispatch: ${capability}`);
    },
  });
}
