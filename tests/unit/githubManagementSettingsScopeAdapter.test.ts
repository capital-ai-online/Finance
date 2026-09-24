import { describe, expect, it, vi } from 'vitest';
import {
  createGitHubManagementSettingsScopeAdapter,
  GITHUB_MANAGEMENT_SETTINGS_SCOPES,
} from '../../scripts/operations/githubManagementSettingsScopeAdapter.mjs';

function fakeClient(label: string) {
  return {
    read: vi.fn(async (capability: string, input?: unknown) => ({ label, capability, input })),
    describeBoundary: vi.fn(() => ({ label, publicMethods: ['GET'], rawProxy: false })),
  };
}

describe('GitHub management settings scope adapter', () => {
  it('exposes exactly four read-only management scopes and routes each capability to its owner client', async () => {
    const enterpriseClient = fakeClient('enterprise');
    const organizationRepositoryClient = fakeClient('org-repo');
    const userClient = fakeClient('user');
    const adapter = createGitHubManagementSettingsScopeAdapter({
      enterpriseClient,
      organizationRepositoryClient,
      userClient,
      repository: 'capital-ai-online/Finance',
    });

    expect(adapter.listScopes()).toEqual(GITHUB_MANAGEMENT_SETTINGS_SCOPES);
    await adapter.read('enterprise', 'enterprise.actions.permissions.get');
    await adapter.read('organization', 'organization.actions.permissions.get');
    await adapter.read('repository', 'repository.settings.get');
    await adapter.read('user', 'user.profile.get');

    expect(enterpriseClient.read).toHaveBeenCalledWith('enterprise.actions.permissions.get');
    expect(organizationRepositoryClient.read).toHaveBeenCalledWith(
      'organization.actions.permissions.get',
      { repository: 'capital-ai-online/Finance' },
    );
    expect(organizationRepositoryClient.read).toHaveBeenCalledWith(
      'repository.settings.get',
      { repository: 'capital-ai-online/Finance' },
    );
    expect(userClient.read).toHaveBeenCalledWith('user.profile.get');
  });

  it('fails closed when a capability is routed through the wrong scope', async () => {
    const adapter = createGitHubManagementSettingsScopeAdapter({
      enterpriseClient: fakeClient('enterprise'),
      organizationRepositoryClient: fakeClient('org-repo'),
      userClient: fakeClient('user'),
      repository: 'capital-ai-online/Finance',
    });

    await expect(adapter.read('user', 'repository.settings.get')).rejects.toThrow(/does not belong/);
    await expect(adapter.read('enterprise', 'user.profile.get')).rejects.toThrow(/does not belong/);
  });

  it('has no mutation or raw provider surface', () => {
    const adapter = createGitHubManagementSettingsScopeAdapter({
      enterpriseClient: fakeClient('enterprise'),
      organizationRepositoryClient: fakeClient('org-repo'),
      userClient: fakeClient('user'),
      repository: 'capital-ai-online/Finance',
    });

    expect(adapter.describeBoundary()).toMatchObject({
      scopes: ['enterprise', 'organization', 'repository', 'user'],
      rawProxy: false,
      mutationMethods: [],
    });
    expect(Object.keys(adapter).sort()).toEqual([
      'describeBoundary',
      'listCapabilities',
      'listScopes',
      'read',
    ]);
  });
});
