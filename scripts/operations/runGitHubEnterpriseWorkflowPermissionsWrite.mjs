import { createGitHubEnterpriseWorkflowPermissionsWriter } from './githubEnterpriseWorkflowPermissionsWriter.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PRIVATE-GITHUB-ENTERPRISE-WORKFLOW-PERMISSIONS-WRITE] missing required environment variable: ${name}`);
  }
  return value;
}

const enterprise = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG');
const enterpriseAdminPat = requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_ADMIN_PAT');

const writer = createGitHubEnterpriseWorkflowPermissionsWriter({
  enterprise,
  enterpriseAdminPat,
});

const result = await writer.ensure();

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  mode: 'PRIVATE_BOUNDED_GITHUB_ENTERPRISE_WORKFLOW_PERMISSIONS_WRITE',
  enterprise,
  operation: result.status,
  mutationPerformed: result.mutationPerformed,
  target: {
    defaultWorkflowPermissions: 'read',
    canApprovePullRequestReviews: false,
  },
  before: result.before,
  after: result.after,
  rawProxy: false,
  personalAccessTokenLogged: false,
  secretsOrTokensLogged: false,
}, null, 2)}\n`);
