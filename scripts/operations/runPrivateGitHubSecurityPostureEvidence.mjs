import fs from 'node:fs';
import { readGitHubSecurityPostureEvidence } from './githubSecurityPostureEvidenceClient.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[PRIVATE-GITHUB-SECURITY-POSTURE] missing required environment variable: ${name}`);
  return value;
}

const output = await readGitHubSecurityPostureEvidence({
  enterprise: requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_SLUG'),
  organization: requiredEnv('CAPITAL_AI_GITHUB_ORG_LOGIN'),
  repository: requiredEnv('CAPITAL_AI_GITHUB_REPOSITORY'),
  enterpriseReadPat: requiredEnv('CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT'),
});

const path = requiredEnv('CAPITAL_AI_GITHUB_SECURITY_EVIDENCE_PATH');
fs.writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
process.stdout.write(`${JSON.stringify({ status: output.status, mutationPerformed: false }, null, 2)}\n`);
