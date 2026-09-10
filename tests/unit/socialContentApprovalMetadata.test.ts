import { beforeEach, describe, expect, it } from 'vitest';
import { contentApprovalStore } from '../../server/socialMedia/contentApproval';

const CONTENT = {
  episodeTitle: 'Graham Fair Value',
  targetPlatforms: ['x', 'facebook'],
  customCaptions: { x: 'Wert statt Hype.', facebook: 'Wert statt Hype.' },
  hashtags: ['value', 'investing'],
  mediaType: 'social_post',
  contentPackageId: 'scp_0123456789abcdef01234567',
  sourceContentId: 'doc:fair-value-check:v1',
  sourceDomain: 'CAPITAL-AI-DOC',
  disclosures: ['Keine Anlageberatung.'],
  links: ['https://capital-ai.de'],
  referralDisclosure: 'Referral disclosure v1',
};

describe('SOCIAL-P0 approval metadata binding', () => {
  beforeEach(() => contentApprovalStore.resetForTests());

  function approved() {
    const row = contentApprovalStore.create({ userId: 'u1', title: 'T', content: CONTENT });
    contentApprovalStore.approve(row.id, 'owner');
    return row;
  }

  it.each([
    ['content package identity', { ...CONTENT, contentPackageId: 'scp_changed' }],
    ['source identity', { ...CONTENT, sourceContentId: 'doc:fair-value-check:v2' }],
    ['source domain', { ...CONTENT, sourceDomain: 'OTHER-DOMAIN' }],
    ['disclosure', { ...CONTENT, disclosures: ['Geänderte Disclosure.'] }],
    ['link', { ...CONTENT, links: ['https://example.invalid'] }],
    ['referral disclosure', { ...CONTENT, referralDisclosure: 'Referral disclosure v2' }],
  ])('denies publish when approved %s changes', (_field, changedContent) => {
    const row = approved();

    expect(() => contentApprovalStore.consumeForPublish(row.id, 'u1', changedContent)).toThrow(
      /does not match the approved version/,
    );
    expect(contentApprovalStore.get(row.id)?.status).toBe('approved');
  });

  it('allows the unchanged canonical metadata snapshot', () => {
    const row = approved();
    expect(contentApprovalStore.consumeForPublish(row.id, 'u1', { ...CONTENT }).status).toBe('consumed');
  });
});
