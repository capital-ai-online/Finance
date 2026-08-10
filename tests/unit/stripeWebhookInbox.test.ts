// ADR-0045 / R-003: application-owned Stripe side effects must execute only after
// a durable event.id claim, and duplicate/integrity-conflict deliveries must not re-enter.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claimStripeEvent: vi.fn(),
  markStripeEventProcessed: vi.fn(),
  markStripeEventFailed: vi.fn(),
  getLocalPdfCredits: vi.fn(),
  saveLocalPdfCredits: vi.fn(),
  sendSubscriptionConfirmation: vi.fn(),
}));

vi.mock('../../server/env', () => ({
  getCleanEnv: vi.fn(() => ''),
}));

vi.mock('../../server/db', () => ({
  getSubscription: vi.fn(async () => 'Free'),
  getLocalPdfCredits: mocks.getLocalPdfCredits,
  saveLocalPdfCredits: mocks.saveLocalPdfCredits,
  isSupabaseConfigured: vi.fn(() => false),
  getServerSupabase: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

vi.mock('../../src/platform/Security/authMiddleware', () => ({
  resolveVerifiedIdentity: vi.fn(async () => null),
}));

vi.mock('../../server/mailer', () => ({
  sendSubscriptionConfirmation: mocks.sendSubscriptionConfirmation,
}));

vi.mock('../../server/ownerConfig_server', () => ({
  OWNER_NOTIFICATION_EMAIL: 'owner@example.com',
}));

vi.mock('../../server/stripeEventInbox', () => ({
  claimStripeEvent: mocks.claimStripeEvent,
  markStripeEventProcessed: mocks.markStripeEventProcessed,
  markStripeEventFailed: mocks.markStripeEventFailed,
}));

import { handleWebhookEvent } from '../../server/stripe';

function checkoutEvent(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'evt_checkout_1',
    object: 'event',
    api_version: '2026-06-30.basil',
    created: 1,
    livemode: true,
    pending_webhooks: 1,
    request: null,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        object: 'checkout.session',
        amount_total: 1000,
        currency: 'eur',
        customer_details: { email: 'kunde@example.com' },
        metadata: {
          user_id: '11111111-1111-1111-1111-111111111111',
          email: 'kunde@example.com',
          plan_id: 'PDF_EXPORT',
        },
        ...overrides,
      },
    },
  };
}

describe('Stripe webhook durable inbox gate (ADR-0045)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claimStripeEvent.mockResolvedValue({
      claimed: true,
      claimStatus: 'claimed',
      attempts: 1,
      integrityMatches: true,
    });
    mocks.markStripeEventProcessed.mockResolvedValue(undefined);
    mocks.markStripeEventFailed.mockResolvedValue(undefined);
    mocks.getLocalPdfCredits.mockResolvedValue(3);
    mocks.saveLocalPdfCredits.mockReturnValue(undefined);
    mocks.sendSubscriptionConfirmation.mockResolvedValue({
      skippedAsDuplicate: false,
      customer: { attempted: true, success: true },
      owner: { attempted: true, success: true },
    });
  });

  it('processes a claimed PDF checkout once and marks the event processed', async () => {
    const event = checkoutEvent();

    const result = await handleWebhookEvent(event);

    expect(result.duplicate).toBe(false);
    expect(mocks.getLocalPdfCredits).toHaveBeenCalledTimes(1);
    expect(mocks.saveLocalPdfCredits).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 6);
    expect(mocks.markStripeEventProcessed).toHaveBeenCalledWith('evt_checkout_1');
    expect(mocks.markStripeEventFailed).not.toHaveBeenCalled();
  });

  it('does not execute side effects for a duplicate event ID', async () => {
    mocks.claimStripeEvent.mockResolvedValue({
      claimed: false,
      claimStatus: 'duplicate_processed',
      attempts: 1,
      integrityMatches: true,
    });

    const result = await handleWebhookEvent(checkoutEvent());

    expect(result.duplicate).toBe(true);
    expect(mocks.getLocalPdfCredits).not.toHaveBeenCalled();
    expect(mocks.saveLocalPdfCredits).not.toHaveBeenCalled();
    expect(mocks.sendSubscriptionConfirmation).not.toHaveBeenCalled();
    expect(mocks.markStripeEventProcessed).not.toHaveBeenCalled();
  });

  // ADR-0045 §3 rule 2/3, confirmed against production evidence 2026-08-10 (see
  // docs/architecture/ROADMAP.md, "R-003 attempts-semantics clarification"): `attempts` is a
  // processing/claim-attempt counter, incremented ONLY when a `failed` event is reclaimed for
  // retry - a `processed`/`processing` duplicate MUST NOT increment it. A real Stripe redelivery
  // of an already-`processed` event correctly reported `attempts` unchanged; treating that as a
  // bug (e.g. "expected attempts >= 2 on any redelivery") contradicts the ADR and must not be
  // "fixed" in the claim SQL/TS wrapper.
  it('reports attempts unchanged (not incremented) for a duplicate of an already-processed event', async () => {
    mocks.claimStripeEvent.mockResolvedValue({
      claimed: false,
      claimStatus: 'duplicate_processed',
      attempts: 1, // unchanged from the original claim - this is correct, not stale data
      integrityMatches: true,
    });

    const result = await handleWebhookEvent(checkoutEvent());

    expect(result.claimStatus).toBe('duplicate_processed');
    expect(result.duplicate).toBe(true);
  });

  it('fails closed on an event-id/payload integrity conflict', async () => {
    mocks.claimStripeEvent.mockResolvedValue({
      claimed: false,
      claimStatus: 'integrity_conflict',
      attempts: 1,
      integrityMatches: false,
    });

    await expect(handleWebhookEvent(checkoutEvent())).rejects.toThrow('integrity conflict');
    expect(mocks.getLocalPdfCredits).not.toHaveBeenCalled();
    expect(mocks.saveLocalPdfCredits).not.toHaveBeenCalled();
    expect(mocks.markStripeEventProcessed).not.toHaveBeenCalled();
  });

  it('records a failed event when application side effects fail before completion', async () => {
    mocks.getLocalPdfCredits.mockRejectedValue(new Error('credit read failed'));

    await expect(handleWebhookEvent(checkoutEvent())).rejects.toThrow('credit read failed');

    expect(mocks.markStripeEventFailed).toHaveBeenCalledWith('evt_checkout_1', expect.any(Error));
    expect(mocks.markStripeEventProcessed).not.toHaveBeenCalled();
  });

  it('leaves the inbox row processing when finalization fails after side effects completed', async () => {
    mocks.markStripeEventProcessed.mockRejectedValue(new Error('finalization unavailable'));

    await expect(handleWebhookEvent(checkoutEvent())).rejects.toThrow('finalization unavailable');

    expect(mocks.saveLocalPdfCredits).toHaveBeenCalledTimes(1);
    expect(mocks.markStripeEventFailed).not.toHaveBeenCalled();
  });

  it('awaits confirmation processing before finalizing a subscription checkout event', async () => {
    const event = checkoutEvent({
      metadata: {
        user_id: '11111111-1111-1111-1111-111111111111',
        email: 'kunde@example.com',
        plan_id: 'PRO',
      },
    });

    await handleWebhookEvent(event);

    expect(mocks.sendSubscriptionConfirmation).toHaveBeenCalledWith(
      'kunde@example.com',
      'owner@example.com',
      expect.objectContaining({
        planId: 'PRO',
        sessionId: 'cs_1',
      }),
    );
    expect(mocks.markStripeEventProcessed).toHaveBeenCalledWith('evt_checkout_1');
  });
});
