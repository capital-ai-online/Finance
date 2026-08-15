import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  contentApprovalStore,
  isApprovalGateEnabled,
} from '../../server/socialMedia/contentApproval';

describe('N4 contentApprovalStore', () => {
  beforeEach(() => {
    contentApprovalStore.resetForTests();
  });

  afterEach(() => {
    delete process.env.SOCIAL_MEDIA_REQUIRE_APPROVAL;
  });

  it('creates pending approvals', () => {
    const row = contentApprovalStore.create({
      userId: 'u1',
      title: 'Graham Fair Value Thread',
      platforms: ['x', 'facebook'],
    });
    expect(row.status).toBe('pending');
    expect(contentApprovalStore.listForUser('u1')).toHaveLength(1);
  });

  it('approve then consume for publish', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T' });
    contentApprovalStore.approve(row.id, 'owner@example.com');
    const used = contentApprovalStore.consumeForPublish(row.id, 'u1');
    expect(used.status).toBe('consumed');
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1')).toThrow(/not approved/);
  });

  it('rejects consume without approve', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T' });
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1')).toThrow(/not approved/);
  });

  it('blocks cross-user consume', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T' });
    contentApprovalStore.approve(row.id, 'owner');
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u2')).toThrow(/another user/);
  });

  it('gate defaults to on in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.SOCIAL_MEDIA_REQUIRE_APPROVAL;
    expect(isApprovalGateEnabled()).toBe(true);
    process.env.SOCIAL_MEDIA_REQUIRE_APPROVAL = 'false';
    expect(isApprovalGateEnabled()).toBe(false);
    process.env.NODE_ENV = prev;
  });
});
