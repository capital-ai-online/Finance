import { createGitHubPublicMainRulesetWriter } from '../governance/githubPublicMainRulesetWriter.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`[PUBLIC-MAIN-RULESET-WRITE] missing required environment variable: ${name}`);
  }
  return value;
}

const writer = createGitHubPublicMainRulesetWriter({
  repositoryAdminToken: requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY_ADMIN_TOKEN'),
});

const result = await writer.ensure();

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  mode: 'BOUNDED_PUBLIC_MAIN_REPOSITORY_RULESET_WRITE',
  operation: result.status,
  mutationPerformed: result.mutationPerformed,
  visibilityMutationPerformed: false,
  target: {
    repository: 'capital-ai-online/Finance',
    ruleset: 'main-production-protection',
    requiredApprovingReviewCount: 1,
    requireCodeOwnerReview: true,
    requireLastPushApproval: false,
    requiredReviewThreadResolution: true,
  },
  after: result.after,
  rawProxy: false,
  tokenLogged: false,
}, null, 2)}\n`);
