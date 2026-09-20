import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  collectDecisionPolicy,
  decisionStateForCheck,
  evaluateProductionBaseline,
  findExactOverlap,
  gateForRequirements,
  reconcileDecisionBody,
  securityRequirements,
} from './reconcilePrDecisionEvidence.mjs';

const mainSha = '1111111111111111111111111111111111111111';
const headSha = '2222222222222222222222222222222222222222';

function activeRuleset() {
  return {
    enforcement: 'active',
    target: 'branch',
    conditions: { ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] } },
    rules: [
      {
        type: 'required_status_checks',
        parameters: {
          required_status_checks: [
            { context: 'GitGuardian Security Checks', integration_id: 46505 },
            { context: 'Hardened image / HIGH+CRITICAL CVE gate', integration_id: 15368 },
            { context: 'PR Governance (Kosten / Workflow / Vorlage)', integration_id: 15368 },
            { context: 'build-and-test', integration_id: 15368 },
          ],
        },
      },
      { type: 'license_compliance_scanning' },
    ],
  };
}

function successfulRun(name, appId, id) {
  return {
    id,
    name,
    status: 'completed',
    conclusion: 'success',
    app: { id: appId },
  };
}

function canonicalBody() {
  return [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0`',
    '# Test',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '> P1 · PR-Klasse C · PATCH',
    '',
    '## 1. 🧭 Entscheidung',
    '',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Was ändert sich? | Test |',
    '| Warum jetzt? | Test |',
    '| Auswirkung / Risikoklasse | C |',
    '| Evidence | alte manuelle Evidence |',
    '| Blocker | alte Blocker |',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS — stale annotation |',
    '| Scope / Ownership | 🟢 PASS — stale annotation |',
    '| Overlap | 🟢 PASS — stale annotation |',
    '| Required Checks | 🟡 PENDING |',
    '| Security / Compliance | 🟡 PENDING |',
    '| Production Baseline | N/A — stale manual classification |',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Produktions-Commit:** `' + mainSha + '`',
    '- **Produktions-Branch:** `main`',
    '- **Aktueller main-Commit:** `' + mainSha + '`',
    '- **PR-Head-Commit:** `' + headSha + '`',
    '- **Abweichung Produktion → main:** `0` Commit(s)',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '',
    '</details>',
  ].join('\n');
}

test('active main ruleset drives required checks and security subset', () => {
  const policy = collectDecisionPolicy([activeRuleset()]);
  assert.equal(policy.requiredChecks.length, 4);
  assert.equal(policy.licenseCompliance, true);
  assert.deepEqual(
    securityRequirements(policy).map((entry) => entry.context).sort(),
    [
      'GitGuardian Security Checks',
      'Hardened image / HIGH+CRITICAL CVE gate',
      'License compliance check',
    ],
  );
});

test('required check aggregation is PASS only for completed success', () => {
  const policy = collectDecisionPolicy([activeRuleset()]);
  const runs = [
    successfulRun('GitGuardian Security Checks', 46505, 1),
    successfulRun('Hardened image / HIGH+CRITICAL CVE gate', 15368, 2),
    successfulRun('PR Governance (Kosten / Workflow / Vorlage)', 15368, 3),
    successfulRun('build-and-test', 15368, 4),
  ];
  assert.equal(gateForRequirements(policy.requiredChecks, runs), 'PASS');

  const skipped = { ...runs[0], id: 5, conclusion: 'skipped' };
  assert.equal(decisionStateForCheck(skipped), 'PENDING');
  assert.equal(gateForRequirements(policy.requiredChecks, [skipped, ...runs.slice(1)]), 'PENDING');

  const failed = { ...runs[3], id: 6, conclusion: 'failure' };
  assert.equal(gateForRequirements(policy.requiredChecks, [...runs.slice(0, 3), failed]), 'BLOCKED');
});

test('production baseline is bound to exact current main and head', () => {
  const body = canonicalBody();
  assert.equal(evaluateProductionBaseline(body, mainSha, headSha), 'PASS');
  assert.equal(
    evaluateProductionBaseline(body, '3333333333333333333333333333333333333333', headSha),
    'BLOCKED',
  );
  assert.equal(evaluateProductionBaseline('no baseline', mainSha, headSha), 'PENDING');
});

test('exact changed-file overlap is deterministic and owner-neutral', () => {
  assert.deepEqual(
    findExactOverlap(
      ['scripts/pr/a.mjs', '.github/workflows/a.yml'],
      [
        { number: 8, files: ['docs/x.md'] },
        { number: 7, files: ['scripts/pr/a.mjs', 'docs/y.md'] },
      ],
    ),
    [{ number: 7, files: ['scripts/pr/a.mjs'] }],
  );
});

test('reconciler normalizes v1.7 decision surface and is idempotent', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  };
  const first = reconcileDecisionBody(canonicalBody(), gates);
  assert.equal(first.eligible, true);
  assert.equal(first.changed, true);
  assert.equal(first.decisionStatus, 'READY_FOR_HUMAN_DECISION');
  assert.match(first.body, /^> 🧭 \*\*Entscheidungsstatus: READY_FOR_HUMAN_DECISION\*\*$/m);
  assert.match(first.body, /^\| Required Checks \| 🟢 PASS \|$/m);
  assert.match(first.body, /^\| Production Baseline \| 🟢 PASS \|$/m);
  assert.match(first.body, /^\| Evidence \| Alle erforderlichen Gates erfüllt \|$/m);
  assert.match(first.body, /^\| Blocker \| Keine \|$/m);
  assert.match(first.body, /^### 📡 Live Dashboard$/m);
  assert.match(first.body, /^\| Status \| READY_FOR_HUMAN_DECISION \|$/m);
  assert.match(first.body, /^\| Synchronität \| Main 🟢 PASS · Checks 🟢 PASS · Security 🟢 PASS · Baseline 🟢 PASS \|$/m);
  assert.match(first.body, /^\| Nächster Schritt \| Merge-Modus anhand des Auto-Merge Safety Contract revalidieren \|$/m);

  const second = reconcileDecisionBody(first.body, gates);
  assert.equal(second.changed, false);
  assert.equal(second.reason, 'already-current');
});

test('reconciler repairs missing v1.7 Decision/Evidence projections without touching technical evidence', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  };
  const technical = canonicalBody().split('## 3. 🔍 Technical Evidence')[1];
  const damaged = canonicalBody()
    .replace('> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**\n', '')
    .replace('| Evidence | alte manuelle Evidence |\n', '')
    .replace('| Blocker | alte Blocker |\n', '')
    .replace('| Required Checks | 🟡 PENDING |\n', '')
    .replace('| Security / Compliance | 🟡 PENDING |\n', '');

  const repaired = reconcileDecisionBody(damaged, gates);
  assert.equal(repaired.eligible, true);
  assert.equal(repaired.changed, true);
  assert.equal(repaired.decisionStatus, 'READY_FOR_HUMAN_DECISION');
  assert.match(repaired.body, /^> 🧭 \*\*Entscheidungsstatus: READY_FOR_HUMAN_DECISION\*\*$/m);
  assert.match(repaired.body, /^\| Evidence \| Alle erforderlichen Gates erfüllt \|$/m);
  assert.match(repaired.body, /^\| Blocker \| Keine \|$/m);
  assert.match(repaired.body, /^\| Current Main \| 🟢 PASS \|$/m);
  assert.match(repaired.body, /^\| Scope \/ Ownership \| 🟢 PASS \|$/m);
  assert.match(repaired.body, /^\| Overlap \| 🟢 PASS \|$/m);
  assert.match(repaired.body, /^\| Required Checks \| 🟢 PASS \|$/m);
  assert.match(repaired.body, /^\| Security \/ Compliance \| 🟢 PASS \|$/m);
  assert.match(repaired.body, /^\| Production Baseline \| 🟢 PASS \|$/m);
  assert.equal(repaired.body.split('## 3. 🔍 Technical Evidence')[1], technical);
});

test('reconciler refuses ambiguous duplicate Decision section boundaries', () => {
  const damaged = canonicalBody().replace(
    '## 3. 🔍 Technical Evidence',
    '## 2. ✅ Evidence\n\n## 3. 🔍 Technical Evidence',
  );
  const result = reconcileDecisionBody(damaged, {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'decision-section-boundary-ambiguous');
});
test('a blocked gate dominates the human decision state', () => {
  const result = reconcileDecisionBody(canonicalBody(), {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'BLOCKED',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  });
  assert.equal(result.decisionStatus, 'BLOCKED');
  assert.match(result.body, /^\| Blocker \| Blockiert: Overlap \|$/m);
});

test('workflow uses trusted completion events and the shared PR writer lease', () => {
  const workflow = fs.readFileSync('.github/workflows/pr-decision-reconciler.yml', 'utf8');
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \[CI, PR Governance, Container Security\]/);
  assert.match(workflow, /check_run:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /capital-ai-pr-writer-\$\{\{ matrix\.pr_number \}\}/);
  assert.match(workflow, /branch_sync_required/);
  assert.match(workflow, /sync-agent-pr-branches\.yml/);
  assert.match(workflow, /createWorkflowDispatch/);
  assert.match(workflow, /auto_merge_state/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
});
