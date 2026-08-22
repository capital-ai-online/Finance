import assert from 'node:assert/strict';
import test from 'node:test';
import { planChatGptSandboxChecks } from './chatGptSandboxPolicy.mjs';

test('documentation/governance changes select local governance checks without hosted CI authority', () => {
  const plan = planChatGptSandboxChecks([
    'docs/adr/ADR-0097-documentary-maintenance-agent-control-loop.md',
    'docs/governance/authority-registry.json',
  ]);

  assert.deepEqual(plan.scripts, [
    'docs:hygiene:check',
    'governance:control-plane',
    'repository:quality:check',
  ]);
  assert.equal(plan.networkInstallAllowed, false);
  assert.equal(plan.repositoryMutationAllowed, false);
  assert.equal(plan.mergeAuthority, false);
  assert.equal(plan.hostedCiReplacement, false);
});

test('Documentary runtime changes add targeted maintenance tests and TypeScript validation', () => {
  const plan = planChatGptSandboxChecks([
    'src/platform/Documentary/manifest.json',
    'src/platform/Documentary/Agents/ArchiveRetentionAgent.ts',
  ]);

  assert.deepEqual(plan.scripts, [
    'documentary:maintenance:test',
    'lint',
    'repository:quality:check',
  ]);
});

test('full mode is explicit and adds repository test/build only after cost-controlled checks', () => {
  const plan = planChatGptSandboxChecks(['server/ai.ts'], { full: true });
  assert.deepEqual(plan.scripts, ['lint', 'repository:quality:check', 'test', 'build']);
  assert.equal(plan.full, true);
});
