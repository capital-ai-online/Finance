import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decisionImpactLabel,
  deriveDecisionStatus,
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
    '| Gate | Status |',
    '|---|---|',
    '| Current Main | 🟢 PASS |',
    '| Scope / Ownership | 🟢 PASS |',
    '| Overlap | 🟡 PENDING |',
    '| Required Checks | 🟡 PENDING |',
    '| Security / Compliance | 🟢 PASS |',
    '| Production Baseline | 🟢 PASS |',
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
