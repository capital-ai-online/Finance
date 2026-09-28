import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePrCreateExecutionIdentity,
  TRUSTED_PR_CREATE_HANDOFFS,
} from '../../scripts/pr/prCreateExecutionIdentity.mjs';

test('manual Owner dispatch remains resolved only for the exact Owner actor pair', () => {
  assert.deepEqual(
    resolvePrCreateExecutionIdentity({
      actor: 'SvenKulessa',
      triggeringActor: 'SvenKulessa',
      trustedHandoff: '',
      eventName: 'workflow_dispatch',
      ref: 'refs/heads/main',
    }),
    {
      authorityResolved: true,
      mode: 'HUMAN_OWNER',
      trustedInternalHandoff: false,
      trustedHandoff: null,
    },
  );

  assert.equal(
    resolvePrCreateExecutionIdentity({
      actor: 'github-actions[bot]',
      triggeringActor: 'github-actions[bot]',
      trustedHandoff: '',
      eventName: 'workflow_dispatch',
      ref: 'refs/heads/main',
    }).authorityResolved,
    false,
  );
});

test('trusted internal handoffs require exact event and main ref binding', () => {
  const cases = [
    ['documentary-autosync', 'push'],
    ['agent-autocreate', 'workflow_run'],
    ['self-healing-recovery', 'schedule'],
  ];

  for (const [trustedHandoff, eventName] of cases) {
    const resolved = resolvePrCreateExecutionIdentity({
      actor: 'github-actions[bot]',
      triggeringActor: 'github-actions[bot]',
      trustedHandoff,
      eventName,
      ref: 'refs/heads/main',
    });
    assert.equal(resolved.authorityResolved, true);
    assert.equal(resolved.mode, 'TRUSTED_INTERNAL_HANDOFF');
    assert.equal(resolved.trustedInternalHandoff, true);

    const wrongEvent = resolvePrCreateExecutionIdentity({
      actor: 'github-actions[bot]',
      triggeringActor: 'github-actions[bot]',
      trustedHandoff,
      eventName: 'workflow_dispatch',
      ref: 'refs/heads/main',
    });
    assert.equal(wrongEvent.authorityResolved, false);

    const wrongRef = resolvePrCreateExecutionIdentity({
      actor: 'github-actions[bot]',
      triggeringActor: 'github-actions[bot]',
      trustedHandoff,
      eventName,
      ref: 'refs/heads/feature',
    });
    assert.equal(wrongRef.authorityResolved, false);
  }
});

test('unknown handoffs fail closed even for a repository automation actor', () => {
  const resolved = resolvePrCreateExecutionIdentity({
    actor: 'github-actions[bot]',
    triggeringActor: 'github-actions[bot]',
    trustedHandoff: 'unknown-handoff',
    eventName: 'schedule',
    ref: 'refs/heads/main',
  });
  assert.deepEqual(resolved, {
    authorityResolved: false,
    mode: 'UNRESOLVED',
    trustedInternalHandoff: false,
    trustedHandoff: 'unknown-handoff',
  });
});

test('trusted handoff catalog remains bounded to the three canonical internal callers', () => {
  assert.deepEqual(Object.keys(TRUSTED_PR_CREATE_HANDOFFS).sort(), [
    'agent-autocreate',
    'documentary-autosync',
    'self-healing-recovery',
  ]);
});
