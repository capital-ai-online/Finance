export const TRUSTED_PR_CREATE_HANDOFFS = Object.freeze({
  'documentary-autosync': Object.freeze({
    eventName: 'push',
    ref: 'refs/heads/main',
  }),
  'agent-autocreate': Object.freeze({
    eventName: 'workflow_run',
    ref: 'refs/heads/main',
  }),
  'self-healing-recovery': Object.freeze({
    eventName: 'schedule',
    ref: 'refs/heads/main',
  }),
});

export function resolvePrCreateExecutionIdentity({
  actor,
  triggeringActor,
  trustedHandoff,
  eventName,
  ref,
}) {
  const normalizedActor = String(actor || '').trim();
  const normalizedTriggeringActor = String(triggeringActor || normalizedActor).trim();
  const normalizedHandoff = String(trustedHandoff || '').trim();
  const normalizedEvent = String(eventName || '').trim();
  const normalizedRef = String(ref || '').trim();

  const humanOwner =
    normalizedActor === 'SvenKulessa' &&
    normalizedTriggeringActor === 'SvenKulessa';

  if (humanOwner && normalizedHandoff === '') {
    return {
      authorityResolved: true,
      mode: 'HUMAN_OWNER',
      trustedInternalHandoff: false,
      trustedHandoff: null,
    };
  }

  const expected = TRUSTED_PR_CREATE_HANDOFFS[normalizedHandoff];
  const trustedInternalHandoff = Boolean(
    expected &&
    expected.eventName === normalizedEvent &&
    expected.ref === normalizedRef,
  );

  if (trustedInternalHandoff) {
    return {
      authorityResolved: true,
      mode: 'TRUSTED_INTERNAL_HANDOFF',
      trustedInternalHandoff: true,
      trustedHandoff: normalizedHandoff,
    };
  }

  return {
    authorityResolved: false,
    mode: 'UNRESOLVED',
    trustedInternalHandoff: false,
    trustedHandoff: normalizedHandoff || null,
  };
}
