import {
  createGitHubEnterpriseSettingsReadClient,
  GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES,
} from '../scripts/operations/githubEnterpriseSettingsReadClient.mjs';
import {
  projectActionsPermissions,
  projectCapturedSetting,
  projectSelectedActions,
  projectWorkflowPermissions,
} from '../scripts/operations/githubSettingsInventoryProjection.mjs';

const CACHE_MS = 5 * 60 * 1000;

type FetchLike = typeof fetch;

type EnterpriseActionEntry = ReturnType<typeof projectCapturedSetting>;

export interface GitHubEnterpriseActionsPolicySnapshot {
  schemaVersion: 'github-enterprise-actions-policy/1.0.0';
  role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION';
  status: 'PASS' | 'PARTIAL_COVERAGE';
  observedAt: string;
  enterprise: string;
  entries: {
    permissions: EnterpriseActionEntry;
    selectedActions: EnterpriseActionEntry;
    workflowPermissions: EnterpriseActionEntry;
  };
  boundary: {
    executionHost: 'FINANCE_RENDER_RUNTIME';
    openAiExecutionRequired: false;
    codexExecutionRequired: false;
    chatExecutionRequired: false;
    provider: ReturnType<ReturnType<typeof createGitHubEnterpriseSettingsReadClient>['describeBoundary']>;
    mutationPerformed: false;
    secretsOrTokensExposed: false;
  };
}

let cache: { key: string; at: number; value: GitHubEnterpriseActionsPolicySnapshot } | null = null;

function required(value: string | undefined, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`[GITHUB-ENTERPRISE-ACTIONS-PROJECTION] ${label} is not configured`);
  return normalized;
}

async function capture(
  capability: keyof typeof GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES,
  client: ReturnType<typeof createGitHubEnterpriseSettingsReadClient>,
  projector: (value: unknown) => unknown,
): Promise<EnterpriseActionEntry> {
  const descriptor = GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES[capability];
  try {
    return projectCapturedSetting({
      status: 'PASS',
      requiredPermission: descriptor.requiredPermission,
      data: await client.read(capability),
    }, projector);
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
      return projectCapturedSetting({
        status: 'NOT_OBSERVABLE',
        requiredPermission: descriptor.requiredPermission,
        providerStatus: error.status,
        reason: `${capability} is not readable with the configured bounded Enterprise reader`,
        providerDiagnostics: error.providerDiagnostics,
      }, projector);
    }
    throw error;
  }
}

export async function buildGitHubEnterpriseActionsPolicySnapshot({
  enterprise,
  enterpriseReadPat,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
}: {
  enterprise: string;
  enterpriseReadPat: string;
  fetchImpl?: FetchLike;
  now?: () => number;
}): Promise<GitHubEnterpriseActionsPolicySnapshot> {
  const client = createGitHubEnterpriseSettingsReadClient({
    enterprise,
    enterpriseReadPat,
    fetchImpl,
  });

  const [permissions, selectedActions, workflowPermissions] = await Promise.all([
    capture('enterprise.actions.permissions.get', client, projectActionsPermissions),
    capture('enterprise.actions.selected_actions.get', client, projectSelectedActions),
    capture('enterprise.actions.workflow_permissions.get', client, projectWorkflowPermissions),
  ]);

  const entries = Object.freeze({ permissions, selectedActions, workflowPermissions });
  const status = Object.values(entries).every((entry: any) => entry.status === 'PASS')
    ? 'PASS'
    : 'PARTIAL_COVERAGE';

  return Object.freeze({
    schemaVersion: 'github-enterprise-actions-policy/1.0.0',
    role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION',
    status,
    observedAt: new Date(now()).toISOString(),
    enterprise,
    entries,
    boundary: Object.freeze({
      executionHost: 'FINANCE_RENDER_RUNTIME',
      openAiExecutionRequired: false,
      codexExecutionRequired: false,
      chatExecutionRequired: false,
      provider: client.describeBoundary(),
      mutationPerformed: false,
      secretsOrTokensExposed: false,
    }),
  });
}

export async function loadGitHubEnterpriseActionsPolicySnapshot({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  enterprise = process.env.CAPITAL_AI_GITHUB_ENTERPRISE_SLUG,
  enterpriseReadPat = process.env.CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT,
}: {
  fetchImpl?: FetchLike;
  now?: () => number;
  enterprise?: string;
  enterpriseReadPat?: string;
} = {}): Promise<GitHubEnterpriseActionsPolicySnapshot> {
  const resolvedEnterprise = required(enterprise, 'CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
  const resolvedPat = required(enterpriseReadPat, 'CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT');
  const nowMs = now();
  const cacheKey = resolvedEnterprise;

  if (cache && cache.key === cacheKey && nowMs - cache.at < CACHE_MS) {
    return cache.value;
  }

  const value = await buildGitHubEnterpriseActionsPolicySnapshot({
    enterprise: resolvedEnterprise,
    enterpriseReadPat: resolvedPat,
    fetchImpl,
    now: () => nowMs,
  });
  cache = { key: cacheKey, at: nowMs, value };
  return value;
}

export function resetGitHubEnterpriseActionsPolicyCacheForTests(): void {
  cache = null;
}
