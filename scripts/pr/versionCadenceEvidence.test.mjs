import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveVersionCadenceEvidence } from './prDecisionState.mjs';
import { reconcileDecisionBody } from './reconcilePrDecisionEvidence.mjs';

function canonicalBody() {
  return [
    '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->',
    '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
    '# Test',
    '',
    '> 🧭 **Entscheidungsstatus: EVIDENCE_PENDING**',
    '',
    '## 1. 🧭 Entscheidung',
    '',
    '### 📡 Live Dashboard',
    '',
    '| Live-Signal | Zustand |',
    '|---|---|',
    '| Status | EVIDENCE_PENDING |',
    '| Synchronität | Main 🟢 PASS · Checks 🟡 PENDING · Security 🟢 PASS · Baseline 🟢 PASS |',
    '| Nächster Schritt | Ausstehende Evidence vervollständigen: Required Checks |',
    '',
    '| Frage | Ergebnis |',
    '|---|---|',
    '| Evidence | stale |',
    '| Blocker | stale |',
    '| Owner-Aktion | Human/CODEOWNER Merge erforderlich |',
    '',
    '## 2. ✅ Evidence',
    '',
    '| Gate | Status | Warum offen / blockiert | Nächster verifizierbarer Schritt |',
    '|---|---|---|---|',
    '| Current Main | 🟢 PASS | stale | stale |',
    '| Scope / Ownership | 🟢 PASS | stale | stale |',
    '| Overlap | 🟢 PASS | stale | stale |',
    '| Required Checks | 🟡 PENDING | stale | stale |',
    '| Security / Compliance | 🟢 PASS | stale | stale |',
    '| Production / Deploy Cadence | 🟢 PASS | stale | stale |',
    '',
    '## 3. 🔍 Technical Evidence',
    '',
    '<details>',
    '<summary>Technische Details & Traceability</summary>',
    '</details>',
    '',
    '<details>',
    '<summary>🤖 Maschinenlesbare Produktions-Baseline</summary>',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->',
    '`CAPITAL_AI_PRODUCTION_BASELINE_START`',
    '`CAPITAL_AI_PRODUCTION_BASELINE_END`',
    '<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->',
    '</details>',
  ].join('\n');
}

const gates = {
  main: 'PASS',
  scope: 'PASS',
  overlap: 'PASS',
  checks: 'PENDING',
  security: 'PASS',
  baseline: 'PASS',
};

test('version/deploy cadence row is live, informational, and singular across reconciles', () => {
  const first = reconcileDecisionBody(canonicalBody(), gates, {
    versionCadence: deriveVersionCadenceEvidence({
      active: true,
      currentVersion: '0.6.1',
      nextPatchVersion: '0.6.2',
      versionProgress: 4,
      versionRemaining: 6,
    }),
  });
  assert.equal(first.eligible, true);
  assert.match(first.body, /CAPITAL_AI_VERSION_CADENCE_EVIDENCE_START/);
  assert.match(first.body, /^\| Aktuelle Version \| `0\.6\.1` \|$/m);
  assert.match(first.body, /^\| Deploy-Zyklus bis nächste Version \| `0\/2` · noch `2` Deploy-Grenze\(n\) \|$/m);
  assert.match(first.body, /^\| Merge-Fortschritt bis nächste Version \| `4\/10` · noch `6` Merge\(s\) \|$/m);
  assert.match(first.body, /^\| Nächstes PATCH \| `0\.6\.2` \|$/m);

  const second = reconcileDecisionBody(first.body, gates, {
    versionCadence: deriveVersionCadenceEvidence({
      active: true,
      currentVersion: '0.6.1',
      nextPatchVersion: '0.6.2',
      versionProgress: 7,
      versionRemaining: 3,
    }),
  });
  assert.equal(second.eligible, true);
  assert.equal((second.body.match(/CAPITAL_AI_VERSION_CADENCE_EVIDENCE_START/g) || []).length, 1);
  assert.equal((second.body.match(/CAPITAL_AI_VERSION_CADENCE_EVIDENCE_END/g) || []).length, 1);
  assert.match(second.body, /^\| Deploy-Zyklus bis nächste Version \| `1\/2` · noch `1` Deploy-Grenze\(n\) \|$/m);
  assert.match(second.body, /^\| Merge-Fortschritt bis nächste Version \| `7\/10` · noch `3` Merge\(s\) \|$/m);
  assert.doesNotMatch(second.body, /`0\/2`/);
});
