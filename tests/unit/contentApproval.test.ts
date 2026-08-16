import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  contentApprovalStore,
  isApprovalGateEnabled,
  computeContentHash,
} from '../../server/socialMedia/contentApproval';

/** Content an approval is granted for; reused so tests stay readable. */
const CONTENT = {
  episodeTitle: 'Graham Fair Value',
  targetPlatforms: ['x', 'facebook'],
  customCaptions: { x: 'Wert statt Hype.', facebook: 'Wert statt Hype.' },
  hashtags: ['value', 'investing'],
  mediaType: 'social_post',
};

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
      content: CONTENT,
    });
    expect(row.status).toBe('pending');
    expect(contentApprovalStore.listForUser('u1')).toHaveLength(1);
  });

  it('approve then consume for publish', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
    contentApprovalStore.approve(row.id, 'owner@example.com');
    const used = contentApprovalStore.consumeForPublish(row.id, 'u1', CONTENT);
    expect(used.status).toBe('consumed');
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1', CONTENT)).toThrow(/not approved/);
  });

  it('rejects consume without approve', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1', CONTENT)).toThrow(/not approved/);
  });

  it('blocks cross-user consume', () => {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
    contentApprovalStore.approve(row.id, 'owner');
    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u2', CONTENT)).toThrow(/another user/);
  });

  // WP-N4 / ESS-0024 §10 / ADR-0080 invariant 5: the approval is bound to the
  // exact content. Without these, an approval is a bare token and the Owner's
  // decision can be redirected onto arbitrary content.
  describe('content binding (DENY cases)', () => {
    function approved() {
      const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
      contentApprovalStore.approve(row.id, 'owner');
      return row;
    }

    it('denies a changed caption', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', {
          ...CONTENT,
          customCaptions: { x: 'Kauf jetzt!', facebook: 'Wert statt Hype.' },
        }),
      ).toThrow(/does not match the approved version/);
      expect(contentApprovalStore.get(row.id)?.status).toBe('approved');
    });

    it('denies a changed title', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', { ...CONTENT, episodeTitle: 'Anderes' }),
      ).toThrow(/does not match the approved version/);
    });

    it('denies changed hashtags', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', { ...CONTENT, hashtags: ['pump'] }),
      ).toThrow(/does not match the approved version/);
    });

    it('denies a swapped media asset', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', {
          ...CONTENT,
          mediaUrl: 'https://example.invalid/other.mp4',
        }),
      ).toThrow(/does not match the approved version/);
    });

    it('denies an added target platform', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', {
          ...CONTENT,
          targetPlatforms: ['x', 'facebook', 'youtube'],
        }),
      ).toThrow(/does not match the approved version/);
    });

    it('denies a removed target platform', () => {
      const row = approved();
      expect(() =>
        contentApprovalStore.consumeForPublish(row.id, 'u1', { ...CONTENT, targetPlatforms: ['x'] }),
      ).toThrow(/does not match the approved version/);
    });

    it('denies an empty payload against a real approval', () => {
      const row = approved();
      expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1', {})).toThrow(
        /does not match the approved version/,
      );
    });
  });

  describe('hash canonicalisation', () => {
    it('ignores platform and hashtag order and surrounding whitespace', () => {
      expect(
        computeContentHash({
          episodeTitle: '  Graham Fair Value  ',
          targetPlatforms: ['facebook', 'x'],
          hashtags: ['investing', 'value'],
        }),
      ).toBe(
        computeContentHash({
          episodeTitle: 'Graham Fair Value',
          targetPlatforms: ['x', 'facebook'],
          hashtags: ['value', 'investing'],
        }),
      );
    });

    it('ignores caption key order but not caption content', () => {
      const a = computeContentHash({ customCaptions: { x: 'eins', facebook: 'zwei' } });
      const b = computeContentHash({ customCaptions: { facebook: 'zwei', x: 'eins' } });
      const c = computeContentHash({ customCaptions: { x: 'zwei', facebook: 'eins' } });
      expect(a).toBe(b);
      expect(a).not.toBe(c);
    });

    it('allows an unchanged payload through', () => {
      const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
      contentApprovalStore.approve(row.id, 'owner');
      expect(contentApprovalStore.consumeForPublish(row.id, 'u1', { ...CONTENT }).status).toBe(
        'consumed',
      );
    });
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
