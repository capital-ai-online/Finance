const API_BASE = 'https://api.github.com';
const API_VERSION = '2026-03-10';
const TIMEOUT_MS = 15_000;

const EXPECTED_SECRET_NAMES = Object.freeze([
  'CAPITAL_AI_GITHUB_APP_PRIVATE_KEY',
  'CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT',
  'CAPITAL_AI_RENDER_API_KEY',
  'RENDER_DEPLOY_HOOK_URL',
  'SUPABASE_DB_URL',
]);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function fail(message) {
  throw new Error(`[GITHUB-SECURITY-POSTURE-EVIDENCE] ${message}`);
}

function assertSlug(value, label) {
  const v = clean(value);
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(v)) fail(`${label} must be a GitHub slug`);
  return v;
}

function assertRepository(value, organization) {
  const v = clean(value);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v)) fail('repository must use owner/repository form');
  if (v.split('/')[0].toLowerCase() !== organization.toLowerCase()) fail('repository owner must match organization');
  return v;
}

function sanitizeText(value) {
  return clean(value)
    .replace(/https?:\/\/[^\s)"']+/gi, '[REDACTED_URL]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, '[REDACTED_TOKEN]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED_TOKEN]')
    .slice(0, 240);
}

function projectFailure(error, requiredPermission) {
  return Object.freeze({
    status: 'NOT_OBSERVABLE',
    providerStatus: Number.isInteger(error?.status) ? error.status : null,
    requiredPermission,
    reason: sanitizeText(error?.message || 'provider read failed'),
  });
}

async function getJson({ token, path, fetchImpl }) {
  let response;
  try {
    response = await fetchImpl(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': API_VERSION,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    fail(`network request failed: ${error?.name || 'unknown'}`);
  }
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = null; }
  }
  if (!response.ok) {
    const error = new Error(`GitHub API read failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function projectInstallations(payload) {
  const rows = Array.isArray(payload?.installations) ? payload.installations : [];
  return Object.freeze({
    status: 'PASS',
    totalCount: Number.isInteger(payload?.total_count) ? payload.total_count : rows.length,
    installations: Object.freeze(rows.map((row) => Object.freeze({
      appSlug: clean(row?.app_slug) || null,
      repositorySelection: clean(row?.repository_selection) || null,
      permissions: Object.freeze(Object.entries(row?.permissions || {})
        .filter(([key, value]) => typeof key === 'string' && typeof value === 'string')
        .map(([key, value]) => `${key}:${value}`)
        .sort()),
      events: Object.freeze((Array.isArray(row?.events) ? row.events : []).filter((v) => typeof v === 'string').sort()),
      createdAt: clean(row?.created_at) || null,
      updatedAt: clean(row?.updated_at) || null,
      suspended: Boolean(row?.suspended_at),
    }))),
    idsProjected: false,
    accountIdentityProjected: false,
  });
}

function projectSecretMetadata(payload) {
  const rows = Array.isArray(payload?.secrets) ? payload.secrets : [];
  const byName = new Map(rows.map((row) => [clean(row?.name), row]));
  return Object.freeze({
    status: 'PASS',
    totalCount: Number.isInteger(payload?.total_count) ? payload.total_count : rows.length,
    expected: Object.freeze(EXPECTED_SECRET_NAMES.map((name) => {
      const row = byName.get(name);
      return Object.freeze({
        name,
        present: Boolean(row),
        visibility: row ? clean(row.visibility) || null : null,
        createdAt: row ? clean(row.created_at) || null : null,
        updatedAt: row ? clean(row.updated_at) || null : null,
        selectedRepositoryScope: Boolean(row?.selected_repositories_url),
      });
    })),
    valuesProjected: false,
    unlistedSecretNamesProjected: false,
  });
}

function projectAuditLog(payload) {
  const rows = Array.isArray(payload) ? payload : [];
  const interesting = rows
    .filter((row) => /(?:secret|token|oauth|integration|hook|app|actions|repo|org|copilot|billing)/i.test(clean(row?.action)))
    .slice(0, 100);
  return Object.freeze({
    status: 'PASS',
    observedCount: rows.length,
    securityRelevantCount: interesting.length,
    events: Object.freeze(interesting.map((row) => Object.freeze({
      action: clean(row?.action) || null,
      actor: clean(row?.actor) || null,
      org: clean(row?.org) || null,
      repo: clean(row?.repo) || null,
      app: clean(row?.app || row?.oauth_application_name) || null,
      createdAt: Number.isFinite(Number(row?.created_at)) ? Number(row.created_at) : null,
    }))),
    ipAddressesProjected: false,
    userAgentsProjected: false,
    credentialValuesProjected: false,
  });
}

export async function readGitHubSecurityPostureEvidence({
  enterprise,
  organization,
  repository,
  enterpriseReadPat,
  fetchImpl = globalThis.fetch,
} = {}) {
  const ent = assertSlug(enterprise, 'enterprise');
  const org = assertSlug(organization, 'organization');
  const repo = assertRepository(repository, org);
  const token = clean(enterpriseReadPat);
  if (!token) fail('enterpriseReadPat is required');
  if (typeof fetchImpl !== 'function') fail('fetchImpl is required');

  const reads = [
    {
      key: 'enterpriseAudit',
      permission: 'Enterprise audit log: read',
      path: `/enterprises/${encodeURIComponent(ent)}/audit-log?include=web&order=desc&per_page=100`,
      project: projectAuditLog,
    },
    {
      key: 'organizationAppInstallations',
      permission: 'Organization administration: read',
      path: `/orgs/${encodeURIComponent(org)}/installations?per_page=100`,
      project: projectInstallations,
    },
    {
      key: 'organizationActionsSecrets',
      permission: 'Organization Actions secrets metadata: read',
      path: `/orgs/${encodeURIComponent(org)}/actions/secrets?per_page=100`,
      project: projectSecretMetadata,
    },
    {
      key: 'repositoryActionsSecrets',
      permission: 'Repository Actions secrets metadata: read',
      path: `/repos/${repo.split('/').map(encodeURIComponent).join('/')}/actions/secrets?per_page=100`,
      project: projectSecretMetadata,
    },
  ];

  const entries = {};
  for (const read of reads) {
    try {
      entries[read.key] = read.project(await getJson({ token, path: read.path, fetchImpl }));
    } catch (error) {
      entries[read.key] = projectFailure(error, read.permission);
    }
  }

  return Object.freeze({
    schemaVersion: '1.0.0',
    status: Object.values(entries).every((entry) => entry.status === 'PASS') ? 'PASS' : 'PARTIAL_COVERAGE',
    enterprise: ent,
    organization: org,
    repository: repo,
    entries: Object.freeze(entries),
    boundary: Object.freeze({
      methods: Object.freeze(['GET']),
      rawProxy: false,
      credentialValuesProjected: false,
      evidenceOnly: true,
    }),
  });
}
