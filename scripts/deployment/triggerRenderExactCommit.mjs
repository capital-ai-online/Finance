import { triggerRenderExactCommitDeploy } from '../operations/renderManagementAdapter.mjs';

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[RENDER-EXACT-COMMIT-DEPLOY] missing ${name}`);
  return value;
}

const result = await triggerRenderExactCommitDeploy({
  apiKey: requiredEnv('CAPITAL_AI_RENDER_API_KEY'),
  commitId: requiredEnv('VERIFIED_COMMIT_SHA'),
});

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
