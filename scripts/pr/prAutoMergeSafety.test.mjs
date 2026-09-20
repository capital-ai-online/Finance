import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTO_MERGE_ELIGIBLE,
  HUMAN_MERGE_REQUIRED,
  classifyAutoMergeEligibility,
  governanceCheckFreshAfterDeclaration,
  parseAutoMergeEvidence,
  reconcileAutoMergeProjection,
  requiredCheckFingerprint,
  resolveAutoMergeMethod,
} from './prAutoMergeSafety.mjs';

const repository = 'capital-ai-online/Finance';
const headSha = '2222222222222222222222222222222222222222';
const baseSha = '1111111111111111111111111111111111111111';
const passGates = Object.freeze({
  main: 'PASS',
  scope: 'PASS',
  overlap: 'PASS',
  checks: 'PASS',
  security: 'PASS',
  baseline: 'PASS',
});

function pr(overrides = {}) {
  return {
    number: 42,
    title: '[CAPITAL-AI-FE] [ChatGPT] Safe UI copy',
    draft: false,
    user: { login: 'capital-ai-online' },
    base: { ref: 'main' },
    head: {
      ref: 'agent/frontend-safe-ui-copy',
      repo: { full_name: repository },
    },
    ...overrides,
  };
}

function canonicalBody() {
  return [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0 -->',
    '# Test',
    '',
    '## 1. 🧭 Entscheidung',
    '',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '- **Merge-Modus:** HUMAN_MERGE_REQUIRED',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '- **Auto-Merge:** Nein',
  ].join('\n');
}

test('safe synchronized same-repository PR becomes auto-merge eligible', () => {
  const result = classifyAutoMergeEligibility({
    pr: pr(),
    repository,
    body: canonicalBody(),
    files: ['client/src/components/MarketingHero.tsx'],
    gates: passGates,
    compareStatus: 'ahead',
  });
  assert.equal(result.eligible, true);
  assert.equal(result.branchSyncRequired, false);
  assert.deepEqual(result.reasons, []);
});

test('protected governance/control-plane mutations stay human-merge required', () => {
  const result = classifyAutoMergeEligibility({
    pr: pr({ title: '[CAPITAL-AI-GOV] [ChatGPT] Change workflow policy' }),
    repository,
    body: canonicalBody(),
    files: ['.github/workflows/ci.yml'],
    gates: passGates,
    compareStatus: 'ahead',
  });
  assert.equal(result.eligible, false);
  assert.equal(result.branchSyncRequired, false);
  assert.ok(result.reasons.includes('governance-control-plane'));
});

test('trusted behind PR is routed to the canonical branch-sync writer', () => {
  const result = classifyAutoMergeEligibility({
    pr: pr(),
    repository,
    body: canonicalBody(),
    files: ['client/src/components/MarketingHero.tsx'],
    gates: { ...passGates, main: 'BLOCKED', baseline: 'BLOCKED' },
    compareStatus: 'behind',
  });
  assert.equal(result.eligible, false);
  assert.equal(result.branchSyncRequired, true);
  assert.ok(result.reasons.includes('current-main-not-ancestor'));
});

test('auto-merge projection explicitly declares the contract and exact evidence', () => {
  const policy = {
    requiredChecks: [
      { context: 'build-and-test', integrationId: 15368 },
      { context: 'PR Governance (Kosten / Workflow / Vorlage)', integrationId: 15368 },
    ],
  };
  const evidence = {
    contract: AUTO_MERGE_ELIGIBLE,
    headSha,
    baseSha,
    requiredChecksFingerprint: requiredCheckFingerprint(policy),
    requiredChecks: ['PR Governance (Kosten / Workflow / Vorlage)::15368', 'build-and-test::15368'],
    correlation: 'PASS',
    state: 'ELIGIBLE_PENDING_PROVIDER_ARMING',
    evaluatedAt: '2026-09-20T21:45:00.000Z',
    reason: 'all-contract-gates-pass',
  };
  const projected = reconcileAutoMergeProjection(canonicalBody(), evidence);
  assert.equal(projected.eligible, true);
  assert.equal(projected.changed, true);
  assert.match(projected.body, /AUTO_MERGE_ELIGIBLE/);
  assert.match(projected.body, /GitHub Auto-Merge nach Exact-Head-Revalidierung/);
  const parsed = parseAutoMergeEvidence(projected.body);
  assert.equal(parsed.contract, AUTO_MERGE_ELIGIBLE);
  assert.equal(parsed.headSha, headSha);
  assert.equal(parsed.baseSha, baseSha);
  assert.equal(parsed.correlation, 'PASS');
});

test('human-required projection remains explicit and never looks eligible', () => {
  const projected = reconcileAutoMergeProjection(canonicalBody(), {
    contract: HUMAN_MERGE_REQUIRED,
    headSha,
    baseSha,
    requiredChecksFingerprint: 'sha256:test',
    requiredChecks: [],
    correlation: 'BLOCKED',
    state: HUMAN_MERGE_REQUIRED,
    evaluatedAt: '2026-09-20T21:45:00.000Z',
    reason: 'security-sensitive',
  });
  assert.equal(projected.eligible, true);
  assert.match(projected.body, /HUMAN_MERGE_REQUIRED/);
  assert.match(projected.body, /Nein — security-sensitive/);
});

test('governance success must be newer than the eligibility declaration', () => {
  const evaluatedAt = '2026-09-20T21:45:00.000Z';
  assert.equal(
    governanceCheckFreshAfterDeclaration(
      { status: 'completed', conclusion: 'success', completed_at: '2026-09-20T21:46:00.000Z' },
      evaluatedAt,
    ),
    true,
  );
  assert.equal(
    governanceCheckFreshAfterDeclaration(
      { status: 'completed', conclusion: 'success', completed_at: '2026-09-20T21:44:59.000Z' },
      evaluatedAt,
    ),
    false,
  );
});

test('provider merge method follows repository capabilities without bypass selection', () => {
  assert.equal(resolveAutoMergeMethod({ allow_merge_commit: true }), 'MERGE');
  assert.equal(resolveAutoMergeMethod({ allow_squash_merge: true }), 'SQUASH');
  assert.equal(resolveAutoMergeMethod({ allow_rebase_merge: true }), 'REBASE');
  assert.equal(resolveAutoMergeMethod({}), null);
});


test('legacy PR template is never auto-merge eligible', () => {
  const result = classifyAutoMergeEligibility({
    pr: pr(),
    repository,
    body: canonicalBody().replace(/1\.7\.0/g, '1.6.0'),
    files: ['client/src/components/MarketingHero.tsx'],
    gates: passGates,
    compareStatus: 'ahead',
  });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes('non-current-pr-template'));
});
