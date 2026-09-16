import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFailure,
  isBoundedAgenticSourcePath,
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
    ['Vollständige Test-Suite ausführen'],
    '[readme-sync] README projection drift detected. Run: npm run readme:sync',
  );
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'deterministic-readme');
  assert.equal(result.run_readme_check, true);
});

test('routes bounded TypeScript, test and build failures to optional agentic patching', () => {
  for (const [step, expectedClass] of [
    ['TypeScript prüfen', 'typescript'],
    ['Vollständige Test-Suite ausführen', 'test'],
    ['Produktions-Build erstellen', 'build'],
  ]) {
    const result = classifyFailure([step]);
    assert.equal(result.eligible, true);
    assert.equal(result.engine, 'copilot');
    assert.equal(result.failure_class, expectedClass);
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
});

test('agentic patches are restricted to non-test src paths', () => {
  assert.equal(isBoundedAgenticSourcePath('src/features/example.ts'), true);
  assert.equal(isBoundedAgenticSourcePath('src/features/example.test.ts'), false);
  assert.equal(isBoundedAgenticSourcePath('tests/unit/example.test.ts'), false);
  assert.equal(isBoundedAgenticSourcePath('scripts/automation/example.ts'), false);
});

test('blocks fork or foreign-head pull requests', () => {
  const result = planAutofix({
    ...base,
    headRepo: 'someone/fork',
  });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'fork-or-foreign-head-repository');
});

test('blocks non-agent-managed branch mutation', () => {
  const result = planAutofix({
    ...base,
    headRef: 'feature/human-owned-change',
  });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'head-branch-is-not-agent-managed');
});

test('blocks protected original PR scope before failure classification', () => {
  const result = planAutofix({
    ...base,
    changedFiles: ['.github/workflows/ci.yml'],
  });
  assert.equal(result.eligible, false);
  assert.equal(result.failure_class, 'protected-scope');
});

test('blocks Copilot spend for test-only or tooling-only original PR scope', () => {
  for (const changedFiles of [
    ['tests/unit/example.test.ts'],
    ['scripts/automation/example.ts'],
    ['vite.config.ts'],
  ]) {
    const result = planAutofix({ ...base, changedFiles });
    assert.equal(result.eligible, false);
    assert.equal(result.reason, 'agentic-patch-requires-source-only-original-pr-scope');
  }
});

test('allows documentation alongside bounded source scope without granting docs mutation', () => {
  const result = planAutofix({
    ...base,
    changedFiles: ['src/features/example.ts', 'docs/notes.md'],
  });
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'copilot');
});

test('enforces a maximum of two autofix attempts', () => {
  const result = planAutofix({
    ...base,
    attempts: 2,
  });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'autofix-attempt-limit-reached');
});

test('permits safe same-repository source failure on the first attempt', () => {
  const result = planAutofix(base);
  assert.equal(result.eligible, true);
  assert.equal(result.engine, 'copilot');
  assert.equal(result.failure_class, 'test');
  assert.equal(result.attempt, 1);
});
