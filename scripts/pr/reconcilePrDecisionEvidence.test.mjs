import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { computeMergeCadence } from '../operations/mergeCadence.mjs';
import { computeProductionBaselineId } from './lib.mjs';
import { replaceProductionBaselineBlock } from './productionBaselineBody.mjs';
import {
  collectDecisionPolicy,
  decisionStateForCheck,
  evaluateProductionBaseline,
  findExactOverlap,
  gateForRequirements,
  prepareLeadingPrBody,
  reconcileDecisionBody,
  reconcileDecisionBodyWithBootstrap,
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
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
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
    '<summary>Technische Details & Traceability</summary>',
    '',
    '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '',
    '</details>',
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

test('cadence-aware production baseline accepts queued ancestor lag and blocks true drift', () => {
  const productionSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const baseline = convergenceBaseline();
  baseline.production = { ...baseline.production, commitSha: productionSha };
  baseline.drift = { ...baseline.drift, productionToMainCommits: 3 };
  baseline.baselineId = computeProductionBaselineId(baseline);

  const projected = replaceProductionBaselineBlock(canonicalBody(), baseline);
  assert.equal(projected.changed, true);

  const cadence = (overrides = {}) => ({
    ref: mainSha,
    ...computeMergeCadence({
      active: true,
      mergeOrdinal: 13,
      productionOrdinal: 10,
      productionRelation: 'ANCESTOR',
      productionHealthy: true,
      currentVersion: '0.6.1',
      ...overrides,
    }),
  });
  const evaluate = (trustedBaseline, cadenceState = cadence(), repository = 'capital-ai-online/Finance') =>
    evaluateProductionBaseline(projected.body, mainSha, headSha, {
      productionBaseline: trustedBaseline,
      cadence: cadenceState,
      repository,
    });

  assert.equal(evaluate(baseline), 'PASS');
  assert.equal(evaluate(baseline, cadence({ mergeOrdinal: 15 })), 'BLOCKED');
  assert.equal(
    evaluate(baseline, cadence({ productionOrdinal: 0, productionRelation: 'DIVERGED' })),
    'BLOCKED',
  );
  assert.equal(evaluate(baseline, cadence({ productionHealthy: false })), 'BLOCKED');

  const wrongRepository = structuredClone(baseline);
  wrongRepository.production.repoSlug = 'other/repository';
  wrongRepository.baselineId = computeProductionBaselineId(wrongRepository);
  const wrongRepositoryProjection = replaceProductionBaselineBlock(canonicalBody(), wrongRepository);
  assert.equal(wrongRepositoryProjection.changed, true);
  assert.equal(
    evaluateProductionBaseline(wrongRepositoryProjection.body, mainSha, headSha, {
      productionBaseline: wrongRepository,
      cadence: cadence(),
      repository: 'capital-ai-online/Finance',
    }),
    'BLOCKED',
  );
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

test('reconciler normalizes v1.8 decision surface and is idempotent', () => {
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
  assert.match(first.body, /^\| Required Checks \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(first.body, /^\| Production \/ Deploy Cadence \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(first.body, /^\| Evidence \| Alle erforderlichen Gates erfüllt \|$/m);
  assert.match(first.body, /^\| Blocker \| Keine \|$/m);
  assert.match(first.body, /^\| Gate \| Status \| Warum offen \/ blockiert \| Nächster verifizierbarer Schritt \|$/m);
  assert.match(first.body, /^### 📡 Live Dashboard$/m);
  assert.match(first.body, /^\| Status \| READY_FOR_HUMAN_DECISION \|$/m);
  assert.match(first.body, /^\| Synchronität \| Main 🟢 PASS · Checks 🟢 PASS · Security 🟢 PASS · Baseline 🟢 PASS \|$/m);
  assert.match(first.body, /^\| Nächster Schritt \| Merge-Modus anhand des Auto-Merge Safety Contract revalidieren \|$/m);

  const second = reconcileDecisionBody(first.body, gates);
  assert.equal(second.changed, false);
  assert.equal(second.reason, 'already-current');
});

test('reconciler bootstraps malformed current v1.8 structure through a canonical renderer body', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PENDING',
    security: 'PASS',
    baseline: 'PASS',
  };
  const malformed = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Test',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '',
    '## 1. Entscheidung',
    'free-form body',
  ].join('\n');

  const result = reconcileDecisionBodyWithBootstrap(malformed, canonicalBody(), gates);
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.bootstrapped, true);
  assert.equal(result.reason, 'canonical-v1.8-renderer-bootstrap-reconciled');
  assert.deepEqual(result.body.match(/^## .+$/gm), [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ]);
  assert.match(result.body, /^\| Required Checks \| 🟡 PENDING \| .* \| .* \|$/m);
});

test('reconciler rejects unsafe v1.8 bootstrap bodies and remains fail closed', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  };
  const malformed = canonicalBody().replace('## 1. 🧭 Entscheidung', '## 1. Entscheidung');
  const unsafeBootstrap = canonicalBody().replace('## 2. ✅ Evidence', '## 2. Evidence');
  const result = reconcileDecisionBodyWithBootstrap(malformed, unsafeBootstrap, gates);
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'bootstrap-headings-noncanonical');
});

test('reconciler bootstraps the exact PR #1264 collapsed-details drift through trusted canonical v1.8', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PENDING',
    security: 'PASS',
    baseline: 'PENDING',
  };

  for (const [summary, directReason] of [
    ['<summary>Technische Details & Traceability</summary>', 'technical-evidence-details-boundary-missing'],
    ['<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>', 'production-baseline-details-boundary-missing'],
  ]) {
    const damaged = canonicalBody().replace(summary, '');
    const direct = reconcileDecisionBody(damaged, gates);
    assert.equal(direct.eligible, false);
    assert.equal(direct.reason, directReason);

    const repaired = reconcileDecisionBodyWithBootstrap(damaged, canonicalBody(), gates);
    assert.equal(repaired.eligible, true);
    assert.equal(repaired.changed, true);
    assert.equal(repaired.bootstrapped, true);
    assert.equal(repaired.reason, 'canonical-v1.8-renderer-bootstrap-reconciled');
    assert.match(repaired.body, /<summary>Technische Details & Traceability<\/summary>/);
    assert.match(repaired.body, /<summary>🤖 Maschinenlesbare Produktions-Baseline<\/summary>/);
  }
});

test('reconciler rejects a renderer bootstrap body that is itself missing collapsed-detail boundaries', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  };
  const malformed = canonicalBody().replace('## 1. 🧭 Entscheidung', '## 1. Entscheidung');
  const unsafeBootstrap = canonicalBody().replace('<summary>Technische Details & Traceability</summary>', '');
  const result = reconcileDecisionBodyWithBootstrap(malformed, unsafeBootstrap, gates);
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'bootstrap-technical-evidence-details-boundary-invalid');
});

test('reconciler repairs missing v1.8 Decision/Evidence projections without touching technical evidence', () => {
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
  assert.match(repaired.body, /^\| Current Main \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Scope \/ Ownership \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Overlap \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Required Checks \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Security \/ Compliance \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Production \/ Deploy Cadence \| 🟢 PASS \| .* \| .* \|$/m);
  assert.equal(repaired.body.split('## 3. 🔍 Technical Evidence')[1], technical);
});

test('reconciler repairs the observed v1.8 human-decision anchor and stale evidence rows from PR #1193', () => {
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
    .replace('| Evidence | alte manuelle Evidence |\n', '')
    .replace('| Blocker | alte Blocker |\n', '')
    .replace(
      '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
      '| Human-/CODEOWNER-Entscheidung | Erforderlich — geschützter Merge |',
    )
    .replace(
      '| Overlap | 🟢 PASS — stale annotation |',
      '| Changed-file overlap | 🟢 PASS — stale annotation |',
    )
    .replace('| Production Baseline | N/A — stale manual classification |\n', '');

  const repaired = reconcileDecisionBody(damaged, gates);
  assert.equal(repaired.eligible, true);
  assert.equal(repaired.changed, true);
  assert.equal(repaired.reason, 'decision-evidence-reconciled');
  assert.match(repaired.body, /^\| Evidence \| Alle erforderlichen Gates erfüllt \|$/m);
  assert.match(repaired.body, /^\| Blocker \| Keine \|$/m);
  assert.match(repaired.body, /^\| Owner-Aktion \| Human\/CODEOWNER Merge erforderlich \|$/m);
  assert.doesNotMatch(repaired.body, /^\| Human-\/CODEOWNER-Entscheidung \|/m);
  assert.match(repaired.body, /^\| Overlap \| 🟢 PASS \| .* \| .* \|$/m);
  assert.match(repaired.body, /^\| Production \/ Deploy Cadence \| 🟢 PASS \| .* \| .* \|$/m);
  assert.doesNotMatch(repaired.body, /^\| Changed-file overlap \|/m);
  assert.equal(repaired.body.split('## 3. 🔍 Technical Evidence')[1], technical);
});

test('reconciler keeps summary insertion fail-closed when both supported human-action anchors exist', () => {
  const damaged = canonicalBody()
    .replace('| Evidence | alte manuelle Evidence |\n', '')
    .replace('| Blocker | alte Blocker |\n', '')
    .replace(
      '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
      '| Human-/CODEOWNER-Entscheidung | Erforderlich |\n| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
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
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'decision-evidence-summary-boundary-missing');
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
test('reconciler atomically migrates canonical v1.7 to v1.8 and adds the live dashboard', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PENDING',
    security: 'PASS',
    baseline: 'PASS',
  };
  const legacy = canonicalBody().replaceAll(
    'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0',
    'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.7.0',
  );
  const result = reconcileDecisionBody(legacy, gates);
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'v1.7-to-v1.8-live-dashboard-migrated');
  assert.match(result.body, /CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.8\.0/);
  assert.doesNotMatch(result.body, /CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.7\.0/);
  assert.match(result.body, /^### 📡 Live Dashboard$/m);
  assert.match(result.body, /^\| Status \| EVIDENCE_PENDING \|$/m);
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
  assert.match(result.body, /^\| Overlap \| 🔴 BLOCKED \| .*Overlap.* \| .*Overlap auflösen.* \|$/m);
});

test('workflow uses trusted completion events and the shared PR writer lease', () => {
  const workflow = fs.readFileSync('.github/workflows/pr-decision-reconciler.yml', 'utf8');
  const createWorkflow = fs.readFileSync('.github/workflows/open-agent-draft-pr.yml', 'utf8');
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
  assert.match(workflow, /PR-v1\.8-Struktur und exakten Bootstrap-Snapshot binden/);
  assert.match(workflow, /PR_CADENCE_REPO_ROOT: \.\.\/candidate/);
  assert.match(workflow, /bootstrap_required/);
  assert.ok(workflow.includes(String.raw`const currentV18 = /CAPITAL_AI_PR_TEMPLATE_VERSION:\s*1\.8\.0/.test(body);`));
  assert.ok(!workflow.includes(String.raw`CAPITAL_AI_PR_TEMPLATE_VERSION:\\s*1\\.8\\.0`));
  assert.match(workflow, /technicalDetailsSummary = '<summary>Technische Details & Traceability<\/summary>'/);
  assert.match(workflow, /machineBaselineSummary = '<summary>🤖 Maschinenlesbare Produktions-Baseline<\/summary>'/);
  assert.match(workflow, /occurrenceCount\(technicalDetailsSummary\) === 1/);
  assert.match(workflow, /occurrenceCount\(machineBaselineSummary\) === 1/);
  assert.match(workflow, /ref: \${\{ steps\.bootstrap_snapshot\.outputs\.head_sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node \.\.\/policy\/scripts\/pr\/productionPreflight\.mjs/);
  assert.match(workflow, /node \.\.\/policy\/scripts\/pr\/renderPullRequestBody\.mjs/);
  const bootstrapRenderBlock = workflow
    .split('      - name: Kanonischen v1.8-Body ausschließlich mit Trusted-Main-Renderer erzeugen\n')[1]
    .split('\n      - name: Evidence → Decision gegen Live-State reconciliieren\n')[0];
  assert.match(bootstrapRenderBlock, /PR_ALLOW_CLAIMLESS: 'true'/);
  assert.match(bootstrapRenderBlock, /PR_PROJECT_ID: \$\{\{ steps\.bootstrap_snapshot\.outputs\.project_id \}\}/);
  assert.match(bootstrapRenderBlock, /PR_PRIMARY_OWNER: \$\{\{ steps\.bootstrap_snapshot\.outputs\.primary_owner \}\}/);
  assert.match(bootstrapRenderBlock, /PR_AFFECTED_PVC: \$\{\{ steps\.bootstrap_snapshot\.outputs\.affected_pvc \}\}/);
  assert.match(
    bootstrapRenderBlock,
    /Existing PRs may predate work-claim enforcement/,
  );
  assert.match(workflow, /Claimless v1\.8 bootstrap requires existing Projekt and Owner \/ PVC evidence/);
  assert.match(workflow, /Claimless v1\.8 bootstrap project identity mismatch/);
  assert.match(workflow, /Claimless v1\.8 bootstrap requires canonical project label project:/);
  assert.match(workflow, /Claimless v1\.8 bootstrap PVC evidence is not canonical/);
  assert.match(workflow, /projectLabels\.includes\(\`project:\$\{projectId\}\`\)/);

  const bootstrapStep = workflow
    .split('      - name: PR-v1.8-Struktur und exakten Bootstrap-Snapshot binden\n')[1]
    .split('\n      - name: Trusted Policy exakt an Live-CURRENT_MAIN binden\n')[0];
  const bootstrapScript = bootstrapStep
    .split('          script: |\n')[1]
    .split('\n')
    .map((line) => line.startsWith('            ') ? line.slice(12) : line)
    .join('\n');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  assert.doesNotThrow(() =>
    new AsyncFunction('github', 'context', 'core', 'process', bootstrapScript),
  );
  assert.doesNotMatch(createWorkflow, /PR_ALLOW_CLAIMLESS:\s*['"]?true/);
  assert.match(workflow, /PR_CANONICAL_BOOTSTRAP_BODY: \.\.\/candidate\/artifacts\/pr\/decision-reconciler-bootstrap-body\.md/);

  assert.doesNotMatch(workflow, /pull_request_target:/);
});


test('Decision Evidence Reconciler consumes exact dispatched CI revalidation events', () => {
  const workflow = fs.readFileSync('.github/workflows/pr-decision-reconciler.yml', 'utf8');
  assert.match(workflow, /run\?\.event === 'workflow_dispatch'/);
  assert.match(workflow, /run\?\.path === '\.github\/workflows\/ci\.yml'/);
  assert.match(workflow, /expectedHeadRef/);
  assert.match(workflow, /run\.event === 'workflow_dispatch' \? run\.head_branch : ''/);
});


test('reconciler deterministically replaces a bounded non-canonical v1.8 live dashboard like PR #1218', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PENDING',
    security: 'PASS',
    baseline: 'PENDING',
  };
  const damaged = canonicalBody().replace(
    [
      '### 📡 Live Dashboard',
      '',
      '| Live-Signal | Zustand |',
      '|---|---|',
      '| Status | EVIDENCE_PENDING |',
      '| Synchronität | Main 🟢 PASS · Checks 🟡 PENDING · Security 🟢 PASS · Baseline 🟢 PASS |',
      '| Nächster Schritt | Ausstehende Evidence vervollständigen: Required Checks |',
    ].join('\n'),
    [
      '### 📡 Live Dashboard',
      '',
      '| Live-Signal | Zustand |',
      '|---|---|',
      '| Status | EVIDENCE_PENDING |',
      '| CURRENT_MAIN | `1111111111111111111111111111111111111111` |',
      '| Exact PR Head | `2222222222222222222222222222222222222222` |',
      '| Branch-Sync | PASS — behind_by=0 |',
      '| Scope / Owner | PASS — CAPITAL-AI-GOV / PVC-05 |',
      '| Hosted Checks | PENDING |',
    ].join('\n'),
  );

  const result = reconcileDecisionBody(damaged, gates);
  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'decision-evidence-reconciled');
  assert.match(result.body, /^\| Status \| EVIDENCE_PENDING \|$/m);
  assert.match(result.body, /^\| Synchronität \| Main 🟢 PASS · Checks 🟡 PENDING · Security 🟢 PASS · Baseline 🟡 PENDING \|$/m);
  assert.match(result.body, /^\| Nächster Schritt \| Ausstehende Evidence vervollständigen: Required Checks, Production \/ Deploy Cadence \|$/m);
  assert.doesNotMatch(result.body, /^\| CURRENT_MAIN \|/m);
  assert.doesNotMatch(result.body, /^\| Exact PR Head \|/m);
  assert.doesNotMatch(result.body, /^\| Branch-Sync \|/m);
});

test('reconciler still fails closed when a malformed dashboard contains non-table prose before the Human Decision table', () => {
  const gates = {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PASS',
    checks: 'PASS',
    security: 'PASS',
    baseline: 'PASS',
  };
  const canonical = reconcileDecisionBody(canonicalBody(), gates);
  assert.equal(canonical.eligible, true);
  assert.equal(canonical.changed, true);

  const damaged = canonical.body.replace(
    '| Synchronität | Main 🟢 PASS · Checks 🟢 PASS · Security 🟢 PASS · Baseline 🟢 PASS |',
    'manual prose that must not be swallowed',
  );
  assert.notEqual(damaged, canonical.body);

  const result = reconcileDecisionBody(damaged, gates);
  assert.equal(result.eligible, false);
  assert.equal(result.changed, false);
  assert.equal(result.reason, 'live-dashboard-boundary-ambiguous');
});
function convergenceBaseline() {
  const baseline = {
    schemaVersion: '1.2.0',
    generatedAt: '2026-09-23T11:40:00.000Z',
    productionUrl: 'https://capital-ai.online/',
    productionHealthUrl: 'https://capital-ai.online/healthz',
    bootstrap: false,
    production: {
      status: 'ok', version: '0.6.0', commitSha: mainSha, branch: 'main',
      repoSlug: 'capital-ai-online/Finance', provider: 'render',
    },
    main: { sha: mainSha },
    head: { sha: headSha, version: '0.6.0' },
    drift: { productionToMainCommits: 0, mainToHeadCommits: 1 },
    checks: {
      productionHealthy: true, immutableProductionIdentity: true, productionRepoMatches: true,
      productionBranchIsMain: true, productionIsAncestorOfMain: true, branchContainsCurrentMain: true,
      versionIsNotOlderThanProduction: true,
    },
  };
  baseline.baselineId = computeProductionBaselineId(baseline);
  return baseline;
}

test('leading PR body projection repairs the PR #1298 hybrid shape and binds one canonical baseline before Decision/Evidence', () => {
  const baseline = convergenceBaseline();
  const legacyBlock = [
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '- **Baseline-ID:** `sha256:stale`',
    '- **Produktions-Commit:** `' + mainSha + '`',
    '- **Produktions-Branch:** `main`',
    '- **Aktueller main-Commit:** `' + mainSha + '`',
    '- **PR-Head-Commit:** `' + headSha + '`',
    '- **Abweichung Produktion → main:** `0` Commit(s)',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
  ].join('\n');
  const body = [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Test',
    '> 🧭 **Entscheidungsstatus: BLOCKED**',
    '> P1 🟠 Hoch · PR-Klasse C · PATCH 🩹',
    '## 1. 🧭 Entscheidung',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '## 2. ✅ Evidence',
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '## 3. 🔍 Technical Evidence',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '- **Priorität:** P1 🟠 Hoch',
    '- **Versionsimpact:** PATCH 🩹',
    '- **Version-Manager-Check:** NOT_RUN — fixture.',
    '- **PR-Klasse:** C',
    '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
    '</details>',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    'NOT_RUN — wird durch die kanonische PR-Evidence-Automation gegen Exact Head erzeugt.',
    '</details>',
    '## 7. Maschinenlesbare Baseline',
    '',
    legacyBlock,
  ].join('\n');

  const result = prepareLeadingPrBody(body, baseline, { prClass: 'C' });

  assert.equal(result.eligible, true);
  assert.equal(result.structureChanged, true);
  assert.equal(result.baselineChanged, true);
  assert.doesNotMatch(result.body, /^## 7\. Maschinenlesbare Baseline$/m);
  assert.ok(result.body.includes(baseline.baselineId));
  assert.equal((result.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->/g) || []).length, 1);
  assert.deepEqual(result.body.match(/^## .+$/gm), [
    '## 1. 🧭 Entscheidung',
    '## 2. ✅ Evidence',
    '## 3. 🔍 Technical Evidence',
  ]);
});

test('PR #1403 marker-free v1.8 NOT_RUN baseline converges through the existing leading baseline specialist', () => {
  const baseline = convergenceBaseline();
  const body = canonicalBody()
    .replace('> P1 · PR-Klasse C · PATCH', '> P1 🟠 Hoch · PR-Klasse C · PATCH 🩹')
    .replace(
      '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance\n- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
      [
        '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance',
        '- **Priorität:** P1 🟠 Hoch',
        '- **Versionsimpact:** PATCH 🩹',
        '- **Version-Manager-Check:** NOT_RUN — PR #1403 regression fixture.',
        '- **PR-Klasse:** C',
        '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
      ].join('\n'),
    )
    .replace(
      /<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->[\s\S]*?<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/,
      'NOT_RUN — wird durch die kanonische PR-Evidence-Automation gegen Exact Head erzeugt.',
    );

  const result = prepareLeadingPrBody(body, baseline, { prClass: 'C' });

  assert.equal(result.eligible, true);
  assert.equal(result.structureChanged, false);
  assert.equal(result.baselineChanged, true);
  assert.equal(result.reason, 'production-baseline-reconciled');
  assert.ok(result.body.includes(baseline.baselineId));
  assert.doesNotMatch(result.body, /NOT_RUN — wird durch die kanonische PR-Evidence-Automation gegen Exact Head erzeugt\./);
  assert.equal((result.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->/g) || []).length, 1);
  assert.equal((result.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/g) || []).length, 1);
});

test('auto-merge projected v1.8 body refreshes Production baseline without duplicating the Human/CODEOWNER gate', () => {
  const baseline = convergenceBaseline();
  const autoMergeBody = canonicalBody()
    .replace(
      '> P1 · PR-Klasse C · PATCH',
      '> P1 🟠 Hoch · PR-Klasse C · PATCH 🩹',
    )
    .replace(
      '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
      '| Owner-Aktion | Keine manuelle Merge-Aktion; GitHub Auto-Merge nach Exact-Head-Revalidierung |',
    )
    .replace(
      '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance\n- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
      [
        '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance',
        '- **Priorität:** P1 🟠 Hoch',
        '- **Versionsimpact:** PATCH 🩹',
        '- **Version-Manager-Check:** PASS — canonical auto-merge refresh fixture.',
        '- **PR-Klasse:** C',
        '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Nein — GitHub Auto-Merge Safety Contract',
      ].join('\n'),
    );

  const result = prepareLeadingPrBody(autoMergeBody, baseline, { prClass: 'C' });

  assert.equal(result.eligible, true);
  assert.equal(result.baselineChanged, true);
  assert.equal(
    (result.body.match(/^- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\*/gm) || []).length,
    1,
  );
  assert.match(
    result.body,
    /^- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Nein — GitHub Auto-Merge Safety Contract$/m,
  );
  assert.doesNotMatch(
    result.body,
    /^- \*\*Human-\/CODEOWNER-Freigabe für Merge erforderlich:\*\* Ja$/m,
  );
});

test('PR #1364 treats later Production movement as a new baseline generation and converges idempotently', () => {
  const firstProductionSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const firstBaseline = convergenceBaseline();
  firstBaseline.generatedAt = '2026-09-24T02:36:00.000Z';
  firstBaseline.production = {
    ...firstBaseline.production,
    commitSha: firstProductionSha,
  };
  firstBaseline.drift = {
    ...firstBaseline.drift,
    productionToMainCommits: 1,
  };
  firstBaseline.baselineId = computeProductionBaselineId(firstBaseline);

  const canonicalProductionRefreshBody = canonicalBody()
    .replace(
      '> P1 · PR-Klasse C · PATCH',
      '> P1 🟠 Hoch · PR-Klasse C · PATCH 🩹',
    )
    .replace(
      '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance\n- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
      [
        '- **Projekt:** 🧠 CAPITAL-AI-GOV · Governance',
        '- **Priorität:** P1 🟠 Hoch',
        '- **Versionsimpact:** PATCH 🩹',
        '- **Version-Manager-Check:** PASS — canonical production-refresh fixture.',
        '- **PR-Klasse:** C',
        '- **Human-/CODEOWNER-Freigabe für Merge erforderlich:** Ja',
      ].join('\n'),
    );

  const first = prepareLeadingPrBody(canonicalProductionRefreshBody, firstBaseline, { prClass: 'C' });
  assert.equal(first.eligible, true);
  assert.equal(first.structureChanged, false);
  assert.equal(first.baselineChanged, true);
  assert.ok(first.body.includes(firstBaseline.baselineId));
  assert.ok(first.body.includes(firstProductionSha));

  const nextBaseline = structuredClone(firstBaseline);
  nextBaseline.generatedAt = '2026-09-24T02:41:27.475Z';
  nextBaseline.production.commitSha = mainSha;
  nextBaseline.drift.productionToMainCommits = 0;
  nextBaseline.baselineId = computeProductionBaselineId(nextBaseline);

  assert.notEqual(nextBaseline.baselineId, firstBaseline.baselineId);

  const second = prepareLeadingPrBody(first.body, nextBaseline, { prClass: 'C' });
  assert.equal(second.eligible, true);
  assert.equal(second.structureChanged, false);
  assert.equal(second.baselineChanged, true);
  assert.equal(second.reason, 'production-baseline-reconciled');
  assert.ok(second.body.includes(nextBaseline.baselineId));
  assert.ok(second.body.includes(mainSha));
  assert.ok(!second.body.includes(firstBaseline.baselineId));
  assert.equal((second.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->/g) || []).length, 1);
  assert.equal((second.body.match(/<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->/g) || []).length, 1);

  const stable = prepareLeadingPrBody(second.body, nextBaseline, { prClass: 'C' });
  assert.equal(stable.eligible, true);
  assert.equal(stable.changed, false);
  assert.equal(stable.structureChanged, false);
  assert.equal(stable.baselineChanged, false);
  assert.equal(stable.reason, 'already-canonical');
});

