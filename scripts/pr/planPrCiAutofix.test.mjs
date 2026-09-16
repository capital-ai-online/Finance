import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFailure,
  isProtectedAutofixPath,
  planAutofix,
} from './planPrCiAutofix.mjs';

const base = {
  changedFiles: ['src/features/example.ts'],
  failedSteps: ['Vollständige Test-Suite ausführen'],
  failureLog: '',
  attempts: 0,
  baseRef: 'main',
  headRef: 'agent/operations-example-20260916',
  headRepo: 'capital-ai-online/Finance',
  repository: 'capital-ai-online/Finance',
};

test('recognizes deterministic README projection drift before generic failure classes', () => {
  const result = classifyFailure(
    ['Repository-Integrität prüfen'],
    '[readme-sync] README projection drift detected. Run: npm run readme:sync',
  );
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'deterministic-readme');
  assert.equal(result.failure_class, 'generated-readme-drift');
  assert.equal(result.run_readme_check, true);
});

test('routes TypeScript failures to the existing Codex Cloud PR task path', () => {
  const result = classifyFailure(['TypeScript prüfen']);
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'codex-cloud');
  assert.equal(result.failure_class, 'typescript');
  assert.equal(result.reason, 'existing-codex-github-pr-task-eligible');
  assert.equal(result.run_lint, true);
  assert.equal(result.run_tests, true);
});

test('continues to hold test and build failures outside the first Codex slice', () => {
  for (const [step, expectedClass] of [
    ['Vollständige Test-Suite ausführen', 'test'],
    ['Produktions-Build erstellen', 'build'],
  ]) {
    const result = classifyFailure([step]);
    assert.equal(result.eligible, false);
    assert.equal(result.engine, 'none');
    assert.equal(result.failure_class, expectedClass);
    assert.equal(result.reason, 'agentic-engine-not-materialized-for-this-failure-class');
  }
});

test('blocks infrastructure, dependency-audit and deployment failures', () => {
  for (const step of [
    'Produktionsabhängigkeiten prüfen',
    'Docker-Hardening prüfen',
    'Produktions-Docker-Image bauen und prüfen',
    'Deployment verifiziert / Render-Produktion',
  ]) {
    const result = classifyFailure([step]);
    assert.equal(result.eligible, false);
    assert.equal(result.failure_class, 'protected-or-infrastructure');
  }
});

test('fails closed for unknown failed steps', () => {
  const result = classifyFailure(['Unbekannter externer Check']);
  assert.equal(result.eligible, false);
  assert.equal(result.failure_class, 'unknown');
});

test('protects workflow, governance, auth, billing and CI-planner surfaces', () => {
  for (const path of [
    'AGENTS.md',
    '.github/workflows/ci.yml',
    'docs/governance/control-catalog.json',
    'docs/projects/operations/ROADMAP.md',
    'scripts/pr/planPrValidation.mjs',
    'scripts/security/example.mjs',
    'src/platform/Auth/session.ts',
    'src/platform/Billing/service.ts',
    'supabase/migrations/20260916.sql',
  ]) {
    assert.equal(isProtectedAutofixPath(path), true, path);
  }
  assert.equal(isProtectedAutofixPath('src/features/example.ts'), false);
  assert.equal(isProtectedAutofixPath('README.md'), false);
});

test('blocks fork or foreign-head pull requests', () => {
  const result = planAutofix({ ...base, headRepo: 'someone/fork' });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'fork-or-foreign-head-repository');
});

test('blocks non-agent-managed branch mutation', () => {
  const result = planAutofix({ ...base, headRef: 'feature/human-owned-change' });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'head-branch-is-not-agent-managed');
});

test('blocks protected original PR scope before failure classification', () => {
  const result = planAutofix({
    ...base,
    changedFiles: ['.github/workflows/ci.yml'],
    failedSteps: ['TypeScript prüfen'],
  });
  assert.equal(result.eligible, false);
  assert.equal(result.failure_class, 'protected-scope');
});

test('enforces a maximum of two autofix attempts', () => {
  const result = planAutofix({ ...base, attempts: 2 });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'autofix-attempt-limit-reached');
});

test('permits the deterministic README repair on a safe same-repository PR', () => {
  const result = planAutofix({
    ...base,
    failedSteps: ['Repository-Integrität prüfen'],
    failureLog: '[readme-sync] README projection drift detected. Run: npm run readme:sync',
  });
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'deterministic-readme');
  assert.equal(result.attempt, 1);
});

test('permits a bounded Codex handoff for TypeScript on a safe same-repository PR', () => {
  const result = planAutofix({
    ...base,
    failedSteps: ['TypeScript prüfen'],
  });
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'codex-cloud');
  assert.equal(result.failure_class, 'typescript');
  assert.equal(result.attempt, 1);
});
