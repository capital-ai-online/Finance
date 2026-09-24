import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decisionEvidenceRows,
  decisionImpactLabel,
  deriveDecisionStatus,
  deriveProductionCadenceState,
  deriveVersionCadenceEvidence,
  extractDecisionGates,
  extractDecisionStatus,
  formatDecisionGateState,
  nextVerifiableDecisionStep,
  normalizeDecisionGateState,
  summarizeDecisionBlockers,
  summarizeDecisionEvidence,
  summarizeLiveDecisionSync,
} from './prDecisionState.mjs';

const pass = {
  main: 'PASS',
  scope: 'PASS',
  overlap: 'PASS',
  checks: 'PASS',
  security: 'PASS',
  baseline: 'PASS',
};

test('decision status is READY only when every required gate is PASS', () => {
  assert.equal(deriveDecisionStatus(pass), 'READY_FOR_HUMAN_DECISION');
  assert.equal(summarizeDecisionEvidence(pass), 'Alle erforderlichen Gates erfüllt');
  assert.equal(summarizeDecisionBlockers(pass), 'Keine');
});

test('BLOCKED dominates PENDING and PASS', () => {
  const gates = { ...pass, checks: 'PENDING', security: 'BLOCKED' };
  assert.equal(deriveDecisionStatus(gates), 'BLOCKED');
  assert.match(summarizeDecisionBlockers(gates), /Security \/ Compliance/);
});

test('missing, unknown and NOT_RUN-like text stay fail-closed as PENDING', () => {
  assert.equal(normalizeDecisionGateState(''), 'PENDING');
  assert.equal(normalizeDecisionGateState('NOT_RUN'), 'PENDING');
  assert.equal(normalizeDecisionGateState('🟢 PASS'), 'PASS');
  assert.equal(deriveDecisionStatus({ ...pass, checks: 'NOT_RUN' }), 'EVIDENCE_PENDING');
});

test('presentation and parser preserve canonical gate states', () => {
  const body = [
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '',
    '| Gate | Status | Warum offen / blockiert | Nächster verifizierbarer Schritt |',
    '|---|---|---|---|',
    '| Current Main | 🟢 PASS | erfüllt | keine |',
    '| Scope / Ownership | 🟢 PASS | erfüllt | keine |',
    '| Overlap | 🟡 PENDING | noch offen | erneut korrelieren |',
    '| Required Checks | 🟡 PENDING | laufen | warten |',
    '| Security / Compliance | 🟢 PASS | erfüllt | keine |',
    '| Production Baseline | 🟢 PASS | erfüllt | keine |',
  ].join('\n');

  assert.equal(extractDecisionStatus(body), 'EVIDENCE_PENDING');
  assert.deepEqual(extractDecisionGates(body), {
    main: 'PASS',
    scope: 'PASS',
    overlap: 'PENDING',
    checks: 'PENDING',
    security: 'PASS',
    baseline: 'PASS',
  });
  assert.equal(formatDecisionGateState('BLOCKED'), '🔴 BLOCKED');
});

test('legacy Production Baseline row remains parseable while new evidence renders the cadence label', () => {
  const legacyBody = [
    '> 🧭 **Entscheidungsstatus: READY_FOR_HUMAN_DECISION**',
    '| Current Main | 🟢 PASS | ok | none |',
    '| Scope / Ownership | 🟢 PASS | ok | none |',
    '| Overlap | 🟢 PASS | ok | none |',
    '| Required Checks | 🟢 PASS | ok | none |',
    '| Security / Compliance | 🟢 PASS | ok | none |',
    '| Production Baseline | 🟢 PASS | legacy alias | none |',
  ].join('\n');
  assert.equal(extractDecisionGates(legacyBody).baseline, 'PASS');
  assert.equal(decisionEvidenceRows(pass).find((row) => row.key === 'baseline')?.label, 'Production / Deploy Cadence');
});

test('production cadence state distinguishes queued lag, due deploy, convergence and true drift', () => {
  const productionSha = '1'.repeat(40);
  const mainSha = '2'.repeat(40);
  const base = {
    active: true,
    deployDue: false,
    productionRelation: 'ANCESTOR',
    productionHealthy: true,
    productionSha,
    mainSha,
  };
  assert.equal(deriveProductionCadenceState(base), 'DEPLOYMENT_QUEUED');
  assert.equal(deriveProductionCadenceState({ ...base, deployDue: true }), 'DEPLOYMENT_DUE');
  assert.equal(deriveProductionCadenceState({ ...base, productionRelation: 'CURRENT_MAIN', productionSha: mainSha }), 'CONVERGED');
  assert.equal(deriveProductionCadenceState({ ...base, productionHealthy: false }), 'PRODUCTION_DRIFT');
  assert.equal(deriveProductionCadenceState({ ...base, productionRelation: 'DIVERGED' }), 'PRODUCTION_DRIFT');
  assert.equal(deriveProductionCadenceState({ ...base, active: false }), 'LEGACY_PER_MERGE');
});

test('version cadence evidence shows current version and deploy x/2 progress toward next PATCH', () => {
  const beforeDeploy = deriveVersionCadenceEvidence({
    active: true,
    currentVersion: '0.6.1',
    nextPatchVersion: '0.6.2',
    versionProgress: 4,
    versionRemaining: 6,
  });
  assert.equal(beforeDeploy.deployProgress, 0);
  assert.equal(beforeDeploy.deployTotal, 2);
  assert.equal(beforeDeploy.deployRemaining, 2);
  assert.match(beforeDeploy.reason, /0\/2/);
  assert.match(beforeDeploy.reason, /0\.6\.1/);
  assert.match(beforeDeploy.nextStep, /0\.6\.2/);
  assert.match(beforeDeploy.nextStep, /4\/10/);

  const afterFirstDeploy = deriveVersionCadenceEvidence({
    active: true,
    currentVersion: '0.6.1',
    nextPatchVersion: '0.6.2',
    versionProgress: 7,
    versionRemaining: 3,
  });
  assert.equal(afterFirstDeploy.deployProgress, 1);
  assert.equal(afterFirstDeploy.deployRemaining, 1);
  assert.match(afterFirstDeploy.reason, /1\/2/);
  assert.match(afterFirstDeploy.nextStep, /7\/10/);
});

test('evidence rows explain why a gate is blocked and what happens next', () => {
  const rows = decisionEvidenceRows({ ...pass, overlap: 'BLOCKED', checks: 'PENDING' });
  const overlap = rows.find((row) => row.key === 'overlap');
  const checks = rows.find((row) => row.key === 'checks');
  assert.equal(overlap.status, '🔴 BLOCKED');
  assert.match(overlap.reason, /Overlap/);
  assert.match(overlap.nextStep, /Overlap auflösen/);
  assert.equal(checks.status, '🟡 PENDING');
  assert.match(checks.reason, /Required Check/);
  assert.match(checks.nextStep, /Exact-Head-Checks/);
});

test('impact label is deterministic and does not invent a free-form risk score', () => {
  assert.equal(decisionImpactLabel('C', 'PASS'), 'C — Code/Tests/Config');
  assert.match(decisionImpactLabel('M', 'BLOCKED'), /Security\/Compliance BLOCKED/);
});


test('live dashboard projection is derived only from canonical gates', () => {
  assert.equal(
    summarizeLiveDecisionSync(pass),
    'Main 🟢 PASS · Checks 🟢 PASS · Security 🟢 PASS · Baseline 🟢 PASS',
  );
  assert.equal(
    nextVerifiableDecisionStep({ ...pass, checks: 'PENDING' }),
    'Ausstehende Evidence vervollständigen: Required Checks',
  );
  assert.equal(
    nextVerifiableDecisionStep({ ...pass, overlap: 'BLOCKED', checks: 'PENDING' }),
    'Blocker beheben und Evidence neu korrelieren: Overlap',
  );
  assert.equal(
    nextVerifiableDecisionStep(pass),
    'Merge-Modus anhand des Auto-Merge Safety Contract revalidieren',
  );
});
