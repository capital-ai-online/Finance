import { describe, expect, it } from 'vitest';
import {
  buildSocialAnalyticsEvidence,
  buildSocialPublicationEvidence,
  validateSocialAnalyticsEvidenceInput,
  validateSocialPublicationEvidenceInput,
} from '../../server/socialMedia/publicationAnalyticsEvidence';

const CONTENT_HASH = 'a'.repeat(64);
const ASSET_HASH = 'b'.repeat(64);

const PUBLISHED = {
  contentPackageId: 'scp_1234567890abcdef12345678',
  contentIdentitySha256: CONTENT_HASH,
  approvalReference: 'cap_owner_approval_001',
  platform: 'youtube' as const,
  publicationState: 'published' as const,
  providerPostId: 'yt-post-001',
  providerPostUrl: 'https://www.youtube.com/watch?v=yt-post-001',
  publishedAt: '2026-09-15T10:00:00Z',
  observedAt: '2026-09-15T10:00:05Z',
  asset: {
    applicability: 'required' as const,
    assetSha256: ASSET_HASH,
    assetReference: 'artifact://social/video/short-001',
  },
};

const ANALYTICS = {
  sourceKind: 'provider_api' as const,
  sourceIdentity: 'youtube-analytics-api:v2',
  sourceReference: 'provider-query://youtube/yt-post-001/views',
  metricName: 'views',
  metricUnit: 'count',
  metricValue: 42,
  measurementWindowStart: '2026-09-15T10:00:00Z',
  measurementWindowEnd: '2026-09-15T11:00:00Z',
  observedAt: '2026-09-15T11:00:10Z',
};

describe('SOCIAL-P3 publication evidence', () => {
  it('binds package, content, asset, approval and provider-post identity deterministically', () => {
    const first = buildSocialPublicationEvidence(PUBLISHED);
    const second = buildSocialPublicationEvidence({ ...PUBLISHED });

    expect(first.schemaVersion).toBe('social-publication-evidence/v1');
    expect(first.publicationEvidenceId).toMatch(/^spe_[a-f0-9]{32}$/);
    expect(first.publicationEvidenceId).toBe(second.publicationEvidenceId);
    expect(first.contentPackageId).toBe(PUBLISHED.contentPackageId);
    expect(first.contentIdentitySha256).toBe(CONTENT_HASH);
    expect(first.approvalReference).toBe(PUBLISHED.approvalReference);
    expect(first.providerPostId).toBe(PUBLISHED.providerPostId);
    expect(first.asset.assetSha256).toBe(ASSET_HASH);
  });

  it('changes evidence identity when the provider-post identity changes', () => {
    const first = buildSocialPublicationEvidence(PUBLISHED);
    const second = buildSocialPublicationEvidence({
      ...PUBLISHED,
      providerPostId: 'yt-post-002',
      providerPostUrl: 'https://www.youtube.com/watch?v=yt-post-002',
    });

    expect(second.publicationEvidenceId).not.toBe(first.publicationEvidenceId);
  });

  it.each([
    ['contentPackageId', { ...PUBLISHED, contentPackageId: '' }],
    ['canonical package id', { ...PUBLISHED, contentPackageId: 'package-1' }],
    ['contentIdentitySha256', { ...PUBLISHED, contentIdentitySha256: 'not-a-hash' }],
    ['approvalReference', { ...PUBLISHED, approvalReference: '   ' }],
    ['providerPostId', { ...PUBLISHED, providerPostId: '' }],
    ['publishedAt', { ...PUBLISHED, publishedAt: undefined }],
  ])('fails closed when mandatory published correlation %s is invalid', (_field, value) => {
    expect(() => buildSocialPublicationEvidence(value as any)).toThrow();
  });

  it('requires immutable asset identity when an asset is applicable', () => {
    expect(() =>
      buildSocialPublicationEvidence({
        ...PUBLISHED,
        asset: { applicability: 'required', assetReference: 'artifact://missing-hash' } as any,
      }),
    ).toThrow(/asset\.assetSha256/);
  });

  it('permits an explicit no-asset publication without inventing an asset identity', () => {
    const evidence = buildSocialPublicationEvidence({
      ...PUBLISHED,
      platform: 'x',
      providerPostId: 'x-post-001',
      providerPostUrl: 'https://x.com/capital_ai/status/x-post-001',
      asset: { applicability: 'not_applicable' },
    });

    expect(evidence.asset).toEqual({ applicability: 'not_applicable' });
  });

  it('records failed publication evidence without fabricating published state', () => {
    const failed = buildSocialPublicationEvidence({
      ...PUBLISHED,
      publicationState: 'failed',
      providerPostId: undefined,
      providerPostUrl: undefined,
      publishedAt: undefined,
      failureReason: 'provider rejected request',
    });

    expect(failed.publicationState).toBe('failed');
    expect(failed.providerPostId).toBeUndefined();
    expect(failed.failureReason).toBe('provider rejected request');
  });

  it('rejects failed evidence that carries a published timestamp', () => {
    expect(() =>
      validateSocialPublicationEvidenceInput({
        ...PUBLISHED,
        publicationState: 'failed',
        failureReason: 'provider rejected request',
      }),
    ).toThrow(/publishedAt must be absent/);
  });
});

describe('SOCIAL-P3 analytics evidence', () => {
  it('binds real source/metric/window provenance to verified publication evidence deterministically', () => {
    const publication = buildSocialPublicationEvidence(PUBLISHED);
    const first = buildSocialAnalyticsEvidence(publication, ANALYTICS);
    const second = buildSocialAnalyticsEvidence(publication, { ...ANALYTICS });

    expect(first.schemaVersion).toBe('social-analytics-evidence/v1');
    expect(first.analyticsEvidenceId).toMatch(/^sae_[a-f0-9]{32}$/);
    expect(first.analyticsEvidenceId).toBe(second.analyticsEvidenceId);
    expect(first.publicationEvidenceId).toBe(publication.publicationEvidenceId);
    expect(first.providerPostId).toBe(PUBLISHED.providerPostId);
    expect(first.sourceIdentity).toBe(ANALYTICS.sourceIdentity);
    expect(first.metricName).toBe('views');
    expect(first.measurementWindowEnd).toBe('2026-09-15T11:00:00.000Z');
  });

  it('rejects synthetic or manual analytics origins', () => {
    expect(() =>
      validateSocialAnalyticsEvidenceInput({
        ...ANALYTICS,
        sourceKind: 'synthetic',
      }),
    ).toThrow(/synthetic\/manual analytics are not accepted/);
  });

  it.each([
    ['sourceIdentity', { ...ANALYTICS, sourceIdentity: '' }],
    ['sourceReference', { ...ANALYTICS, sourceReference: '' }],
    ['metricName', { ...ANALYTICS, metricName: '' }],
    ['metricUnit', { ...ANALYTICS, metricUnit: '' }],
    ['metricValue', { ...ANALYTICS, metricValue: Number.NaN }],
  ])('fails closed when analytics provenance field %s is invalid', (_field, value) => {
    expect(() => validateSocialAnalyticsEvidenceInput(value)).toThrow();
  });

  it('rejects inverted measurement windows', () => {
    expect(() =>
      validateSocialAnalyticsEvidenceInput({
        ...ANALYTICS,
        measurementWindowStart: '2026-09-15T12:00:00Z',
        measurementWindowEnd: '2026-09-15T11:00:00Z',
      }),
    ).toThrow(/start before end/);
  });

  it('rejects observations taken before the measurement window is complete', () => {
    expect(() =>
      validateSocialAnalyticsEvidenceInput({
        ...ANALYTICS,
        observedAt: '2026-09-15T10:30:00Z',
      }),
    ).toThrow(/must not precede measurementWindowEnd/);
  });

  it('refuses analytics for pending or failed publication evidence', () => {
    const pending = buildSocialPublicationEvidence({
      ...PUBLISHED,
      publicationState: 'pending',
      publishedAt: undefined,
    });

    expect(() => buildSocialAnalyticsEvidence(pending, ANALYTICS)).toThrow(
      /requires verified published publication evidence/,
    );
  });
});
