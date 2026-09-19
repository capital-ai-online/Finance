import fs from 'node:fs';
import { createGitHubLicenseUsageReadClient } from './githubLicenseUsageReadClient.mjs';

const MAX_PAGES = 100;

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[PRIVATE-GITHUB-LICENSE-USAGE-READ] missing required environment variable: ${name}`);
  return value;
}

function readPrivateKey() {
  const path = requiredEnv('CAPITAL_AI_GITHUB_APP_PRIVATE_KEY_PATH');
  const stat = fs.statSync(path);
  if (!stat.isFile()) throw new Error('[PRIVATE-GITHUB-LICENSE-USAGE-READ] private key path is not a file');
  return fs.readFileSync(path, 'utf8');
}

function safeSeatUser(user) {
  return Object.freeze({
    login: typeof user?.github_com_login === 'string' ? user.github_com_login : null,
    licenseType: typeof user?.license_type === 'string' ? user.license_type : null,
    githubComUser: user?.github_com_user === true,
    memberRoles: Array.isArray(user?.github_com_member_roles)
      ? Object.freeze(user.github_com_member_roles.filter((value) => typeof value === 'string'))
      : Object.freeze([]),
    enterpriseRoles: Array.isArray(user?.github_com_enterprise_roles)
      ? Object.freeze(user.github_com_enterprise_roles.filter((value) => typeof value === 'string'))
      : Object.freeze([]),
  });
}

function safeRepository(repository) {
  const breakdown = Array.isArray(repository?.advanced_security_committers_breakdown)
    ? repository.advanced_security_committers_breakdown
    : [];

  return Object.freeze({
    repository: typeof repository?.name === 'string' ? repository.name : null,
    activeCommitters: Number.isInteger(repository?.advanced_security_committers)
      ? repository.advanced_security_committers
      : breakdown.length,
    committers: Object.freeze(breakdown.map((committer) => Object.freeze({
      login: typeof committer?.user_login === 'string' ? committer.user_login : null,
      lastPushedDate: typeof committer?.last_pushed_date === 'string' ? committer.last_pushed_date : null,
    }))),
  });
}

async function readEnterpriseLicenses(client) {
  const users = [];
  let totals = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await client.getEnterpriseConsumedLicenses({ page });
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.users)) {
      throw new Error('[PRIVATE-GITHUB-LICENSE-USAGE-READ] consumed licenses response must contain users');
    }

    if (!totals) {
      totals = {
        totalSeatsConsumed: Number.isInteger(payload.total_seats_consumed) ? payload.total_seats_consumed : null,
        totalSeatsPurchased: Number.isInteger(payload.total_seats_purchased) ? payload.total_seats_purchased : null,
      };
    }

    users.push(...payload.users.map(safeSeatUser));
    if (payload.users.length < 100) {
      return Object.freeze({
        ...totals,
        userCountReturned: users.length,
        users: Object.freeze(users),
      });
    }
  }

  throw new Error('[PRIVATE-GITHUB-LICENSE-USAGE-READ] enterprise license pagination exceeded safety limit');
}

async function readAdvancedSecurityProduct(client, product) {
  const repositories = [];
  let totalCommitters = null;
  let totalRepositories = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await client.getAdvancedSecurityActiveCommitters({ product, page });
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.repositories)) {
      throw new Error('[PRIVATE-GITHUB-LICENSE-USAGE-READ] advanced security response must contain repositories');
    }

    if (totalCommitters === null && Number.isInteger(payload.total_advanced_security_committers)) {
      totalCommitters = payload.total_advanced_security_committers;
    }
    if (totalRepositories === null && Number.isInteger(payload.total_count)) {
      totalRepositories = payload.total_count;
    }

    repositories.push(...payload.repositories.map(safeRepository));
    if (payload.repositories.length < 100 || (totalRepositories !== null && repositories.length >= totalRepositories)) {
      return Object.freeze({
        product,
        totalActiveCommitters: totalCommitters,
        repositoryCount: totalRepositories ?? repositories.length,
        repositories: Object.freeze(repositories),
      });
    }
  }

  throw new Error('[PRIVATE-GITHUB-LICENSE-USAGE-READ] advanced security pagination exceeded safety limit');
}

async function capture(label, requiredPermission, operation) {
  try {
    return Object.freeze({ status: 'PASS', requiredPermission, data: await operation() });
  } catch (error) {
    if (error?.status === 403 || error?.status === 404) {
      return Object.freeze({
        status: 'BLOCKED',
        requiredPermission,
        providerStatus: error.status,
        reason: `${label} is not readable with the current GitHub App installation permissions`,
      });
    }
    throw error;
  }
}

const clientId = requiredEnv('CAPITAL_AI_GITHUB_APP_CLIENT_ID');
const privateKeyPem = readPrivateKey();
const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const organization = requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN');

const client = createGitHubLicenseUsageReadClient({
  clientId,
  privateKeyPem,
  enterprise,
  organization,
});

const installationEvidence = await client.preflight();
const [enterpriseLicenses, codeSecurity, secretProtection] = await Promise.all([
  capture(
    'Enterprise consumed licenses',
    'Enterprise administration: read',
    () => readEnterpriseLicenses(client),
  ),
  capture(
    'GitHub Code Security active committers',
    'Organization administration: read',
    () => readAdvancedSecurityProduct(client, 'code_security'),
  ),
  capture(
    'GitHub Secret Protection active committers',
    'Organization administration: read',
    () => readAdvancedSecurityProduct(client, 'secret_protection'),
  ),
]);

const blocked = [enterpriseLicenses, codeSecurity, secretProtection].some((item) => item.status !== 'PASS');
const output = Object.freeze({
  status: blocked ? 'BLOCKED' : 'PASS',
  mode: 'PRIVATE_SINGLE_USER_LICENSE_USAGE_ATTRIBUTION',
  enterprise,
  organization,
  installationEvidence,
  enterpriseLicenses,
  githubAdvancedSecurity: Object.freeze({
    codeSecurity,
    secretProtection,
  }),
  emailAddressesLogged: false,
  secretsOrTokensLogged: false,
});

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
if (blocked) process.exitCode = 2;
