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

test('reconciler removes duplicate merge-count presentation while preserving live evidence', () => {
  const duplicatePresentation = canonicalBody()
    .replace(
      '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`\n# Test',
      [
        '`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0`',
        '> 📦 **package.json:** `0.6.2` · 🚀 **Render Production:** PR #1363 · ⏳ **Auto-Deploy:** noch `1` PR-Merge(s)',
        '',
        '# Test',
      ].join('\n'),
    )
    .replace(
      '| Nächster Schritt | Ausstehende Evidence vervollständigen: Required Checks |\n\n| Frage | Ergebnis |',
      [
        '| Nächster Schritt | Ausstehende Evidence vervollständigen: Required Checks |',
        '',
        '### 🚀 Production & Cadence',
        '',
        '| Production-Signal | Zustand |',
        '|---|---|',
        '| CURRENT_MAIN | `cb0012e7f384` |',
        '| Live Production | `0.6.2` · `b2eb210a7310` |',
        '| Render Production PR | `#1363` |',
        '| Deploy-Cadence | `DEPLOYMENT_QUEUED` · `4/5` · noch `1` Merge(s) |',
        '| Nächstes Deploy-Ziel | `cb0012e7f384` |',
        '| Plattformversion | `0.6.2` |',
        '| Version-Cadence | `8/10` · noch `2` Merge(s) |',
        '| Nächstes PATCH-Ziel | `0.6.3` |',
        '',
        '| Frage | Ergebnis |',
      ].join('\n'),
    );

  const result = reconcileDecisionBody(duplicatePresentation, gates, {
    versionCadence: deriveVersionCadenceEvidence({
      active: true,
      currentVersion: '0.6.2',
      nextPatchVersion: '0.6.3',
      versionProgress: 8,
      versionRemaining: 2,
    }),
  });

  assert.equal(result.eligible, true);
  assert.equal(result.changed, true);
  assert.equal(result.body.includes('> 📦 **package.json:**'), false);
  assert.equal(result.body.includes('### 🚀 Production & Cadence'), false);
  assert.equal(result.body.includes('| Deploy-Cadence |'), false);
  assert.equal(result.body.includes('| Version-Cadence |'), false);
  assert.equal(result.body.split('CAPITAL_AI_VERSION_CADENCE_EVIDENCE_START').length - 1, 1);
  assert.ok(result.body.includes('| Aktuelle Version | `0.6.2` |'));
  assert.ok(result.body.includes('| Deploy-Zyklus bis nächste Version | `1/2` · noch `1` Deploy-Grenze(n) |'));
  assert.ok(result.body.includes('| Merge-Fortschritt bis nächste Version | `8/10` · noch `2` Merge(s) |'));
  assert.ok(result.body.includes('| Nächstes PATCH | `0.6.3` |'));
});

