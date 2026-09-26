import { describe, expect, it, vi } from 'vitest';
import { readGitHubSecurityPostureEvidence } from '../../scripts/operations/githubSecurityPostureEvidenceClient.mjs';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub security posture evidence client', () => {
  it('projects bounded app, secret-metadata and audit evidence without credential values', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(init?.method).toBe('GET');
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer read-token');

      if (url.pathname === '/enterprises/capital-ai-online/audit-log') {
        return jsonResponse([
          { action: 'org.update_actions_secret', actor: 'owner', org: 'capital-ai-online', created_at: 1 },
          { action: 'repo.access', actor: 'reader', repo: 'capital-ai-online/Finance', created_at: 2 },
        ]);
      }
      if (url.pathname === '/orgs/capital-ai-online/installations') {
        return jsonResponse({
          total_count: 1,
          installations: [{
            id: 99,
            app_slug: 'google-ai-studio',
            repository_selection: 'all',
            permissions: { contents: 'read' },
            events: ['push'],
            account: { login: 'must-not-project' },
            created_at: '2026-09-25T10:00:00Z',
            updated_at: '2026-09-25T11:00:00Z',
          }],
        });
      }
      if (url.pathname === '/orgs/capital-ai-online/actions/secrets') {
        return jsonResponse({
          total_count: 2,
          secrets: [
            { name: 'CAPITAL_AI_RENDER_API_KEY', visibility: 'selected', created_at: 'a', updated_at: 'b', selected_repositories_url: 'https://example.invalid' },
            { name: 'OTHER_PRIVATE_NAME', visibility: 'all', created_at: 'a', updated_at: 'b' },
          ],
        });
      }
      if (url.pathname === '/repos/capital-ai-online/Finance/actions/secrets') {
        return jsonResponse({
          total_count: 1,
          secrets: [{ name: 'SUPABASE_DB_URL', created_at: 'a', updated_at: 'b' }],
        });
      }
      throw new Error(`unexpected path ${url.pathname}`);
    });

    const result = await readGitHubSecurityPostureEvidence({
      enterprise: 'capital-ai-online',
      organization: 'capital-ai-online',
      repository: 'capital-ai-online/Finance',
      enterpriseReadPat: 'read-token',
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(result.status).toBe('PASS');
    expect(result.entries.organizationAppInstallations.installations[0]).toMatchObject({
      appSlug: 'google-ai-studio',
      repositorySelection: 'all',
    });
    expect(result.entries.organizationActionsSecrets.expected).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'CAPITAL_AI_RENDER_API_KEY', present: true }),
      expect.objectContaining({ name: 'RENDER_DEPLOY_HOOK_URL', present: false }),
    ]));
    expect(result.entries.repositoryActionsSecrets.expected).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'SUPABASE_DB_URL', present: true }),
    ]));
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('OTHER_PRIVATE_NAME');
    expect(serialized).not.toContain('must-not-project');
    expect(serialized).not.toContain('read-token');
    expect(result.entries.enterpriseAudit.events[0]).toMatchObject({
      action: 'org.update_actions_secret',
      actor: 'owner',
    });
  });

  it('preserves missing permissions as NOT_OBSERVABLE rather than guessing PASS', async () => {
    const result = await readGitHubSecurityPostureEvidence({
      enterprise: 'capital-ai-online',
      organization: 'capital-ai-online',
      repository: 'capital-ai-online/Finance',
      enterpriseReadPat: 'read-token',
      fetchImpl: (async () => jsonResponse({ message: 'forbidden' }, 403)) as typeof fetch,
    });
    expect(result.status).toBe('PARTIAL_COVERAGE');
    expect(Object.values(result.entries).every((entry) => entry.status === 'NOT_OBSERVABLE')).toBe(true);
    expect(result.boundary).toMatchObject({
      rawProxy: false,
      credentialValuesProjected: false,
      evidenceOnly: true,
    });
  });
});
