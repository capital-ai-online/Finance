import { describe, expect, it } from 'vitest';
import {
  CANONICAL_WIKI_REPOSITORY,
  PILOT_MILESTONE_DESCRIPTION,
  PILOT_MILESTONE_TITLE,
  WIKI_NAVIGATION_PAGES,
  createGitHubWorkManagementGatewayAdapter,
} from '../../scripts/operations/githubWorkManagementGatewayAdapter.mjs';

function milestone(number: number, state = 'open') {
  return {
    number,
    title: PILOT_MILESTONE_TITLE,
    description: PILOT_MILESTONE_DESCRIPTION,
    state,
    html_url: `https://github.com/capital-ai-online/Finance/milestone/${number}`,
    updated_at: '2026-09-16T08:00:00Z',
    token: 'must-not-project',
  };
}

function harness() {
  const calls: Array<Record<string, unknown>> = [];
  const store = new Map(Object.entries(WIKI_NAVIGATION_PAGES));
  let nextMilestone = milestone(7);

  const githubRest = async (request: { method: string; path: string; body?: Record<string, unknown> }) => {
    calls.push(request);
    if (request.method === 'GET' && request.path.endsWith('/milestones?state=all&per_page=100')) {
      return [nextMilestone];
    }
    if (request.method === 'POST' && request.path.endsWith('/milestones')) return nextMilestone;
    if (request.method === 'PATCH') {
      nextMilestone = milestone(7, String(request.body?.state ?? 'open'));
      return nextMilestone;
    }
    if (request.method === 'GET' && request.path.endsWith('/milestones/7')) return nextMilestone;
    throw new Error(`unexpected ${request.method} ${request.path}`);
  };

  const wikiTransport = {
    async readPage({ wikiRepository, page }: { wikiRepository: string; page: string }) {
      expect(wikiRepository).toBe(CANONICAL_WIKI_REPOSITORY);
      return store.get(page) ?? '';
    },
    async writePage({ wikiRepository, page, content }: { wikiRepository: string; page: string; content: string }) {
      expect(wikiRepository).toBe(CANONICAL_WIKI_REPOSITORY);
      store.set(page, content);
    },
  };

  return {
    adapter: createGitHubWorkManagementGatewayAdapter({ githubRest, wikiTransport }),
    calls,
    store,
  };
}

describe('GitHub Work-Management Gateway Adapter', () => {
  it('rejects non-canonical repositories', () => {
    expect(() => createGitHubWorkManagementGatewayAdapter({
      owner: 'other',
      repo: 'Finance',
      githubRest: async () => ({}),
      wikiTransport: { readPage: async () => '', writePage: async () => undefined },
    })).toThrow(/target must be exactly/);
  });

  it('rejects capabilities outside the explicit allowlist', async () => {
    const { adapter } = harness();
    await expect(adapter.execute('github.raw.request')).rejects.toThrow(/not allowlisted/);
  });

  it('creates only the canonical pilot milestone and verifies provider readback', async () => {
    const { adapter, calls } = harness();
    const result = await adapter.execute('github.work_management.milestones.create_pilot');

    expect(result.readback.title).toBe(PILOT_MILESTONE_TITLE);
    expect(result.readback.description).toBe(PILOT_MILESTONE_DESCRIPTION);
    expect(result.readback).not.toHaveProperty('token');
    expect(calls[0]).toMatchObject({
      method: 'POST',
      body: {
        title: PILOT_MILESTONE_TITLE,
        description: PILOT_MILESTONE_DESCRIPTION,
      },
    });
    expect(calls[1]).toMatchObject({ method: 'GET' });
  });

  it('updates only the canonical milestone state and verifies provider readback', async () => {
    const { adapter } = harness();
    const result = await adapter.execute('github.work_management.milestones.update_pilot', {
      number: 7,
      state: 'closed',
    });

    expect(result.readback.state).toBe('closed');
    await expect(adapter.execute('github.work_management.milestones.update_pilot', {
      number: 7,
      state: 'deleted',
    })).rejects.toThrow(/state must be open or closed/);
  });

  it('writes only generated navigation wiki content and verifies readback', async () => {
    const { adapter, store } = harness();
    const result = await adapter.execute('github.work_management.wiki.write_navigation', {
      page: 'OPS-PR900-03B',
    });

    expect(result.readback).toBe('PASS');
    expect(store.get('OPS-PR900-03B')).toBe(WIKI_NAVIGATION_PAGES['OPS-PR900-03B']);
    expect(result.contentDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('rejects arbitrary wiki pages', async () => {
    const { adapter } = harness();
    await expect(adapter.execute('github.work_management.wiki.write_navigation', {
      page: 'Governance',
    })).rejects.toThrow(/wiki page is not allowlisted/);
  });

  it('delegates Projects and issue taxonomy to the official GitHub MCP server', () => {
    const { adapter } = harness();
    const surface = adapter.describeSurface();

    expect(surface.officialGitHubMcp.projects).toEqual(['projects_get', 'projects_list', 'projects_write']);
    expect(surface.officialGitHubMcp.issueTaxonomy).toEqual(['list_issue_types', 'list_issue_fields']);
    expect(surface.officialGitHubMcp.issueLifecycle).toEqual(['issue_write']);
  });
});
