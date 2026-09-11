import { describe, expect, it } from 'vitest';
import { generateTextContent } from '../../server/socialMedia/textContentGeneration';
import { buildSocialContentPackages } from '../../server/socialMedia/socialContentPackage';

const GENERATED = generateTextContent({
  topic: 'Benjamin Graham Fair Value Check',
  locale: 'de',
  platforms: ['x'],
});

const METADATA = {
  sourceContentId: 'doc:fair-value-check:v1',
  sourceDomain: 'CAPITAL-AI-DOC',
  evidenceReference: 'evidence://fair-value-check/v1',
  disclosureApplicability: 'required' as const,
  disclosures: ['Keine Anlageberatung.'],
  links: ['https://capital-ai.de'],
  campaignId: 'campaign:value-education',
  tone: 'educational_compliance_aware',
};

describe('SOCIAL-P0 canonical content package', () => {
  it('maps the existing generator output into the canonical package contract', () => {
    const [pkg] = buildSocialContentPackages(GENERATED, METADATA);

    expect(pkg.content_package_id).toMatch(/^scp_[a-f0-9]{24}$/);
    expect(pkg.source_content_id).toBe(METADATA.sourceContentId);
    expect(pkg.source_domain).toBe(METADATA.sourceDomain);
    expect(pkg.channel).toBe('x');
    expect(pkg.content_type).toBe('tweet');
    expect(pkg.provenance).toEqual({
      source_content_id: METADATA.sourceContentId,
      source_domain: METADATA.sourceDomain,
      evidence_reference: METADATA.evidenceReference,
      transformation: 'deterministic_social_text_adaptation',
    });
    expect(pkg.disclosures).toEqual(METADATA.disclosures);
    expect(pkg.approval_status).toBe('DRAFT');
    expect(pkg.approval_reference).toBeNull();
    expect(pkg.publish_status).toBe('NOT_REQUESTED');
    expect(pkg.candidate_content_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same generated snapshot and metadata', () => {
    const [first] = buildSocialContentPackages(GENERATED, METADATA);
    const [second] = buildSocialContentPackages(GENERATED, METADATA);

    expect(second.content_package_id).toBe(first.content_package_id);
    expect(second.candidate_content_hash).toBe(first.candidate_content_hash);
  });

  it.each([
    ['sourceContentId', { ...METADATA, sourceContentId: '   ' }],
    ['sourceDomain', { ...METADATA, sourceDomain: '' }],
    ['evidenceReference', { ...METADATA, evidenceReference: '' }],
  ])('fails closed when mandatory provenance field %s is missing', (_field, metadata) => {
    expect(() => buildSocialContentPackages(GENERATED, metadata)).toThrow(/required for canonical Social provenance/);
  });

  it('fails closed when disclosure identity says required but no disclosure is supplied', () => {
    expect(() =>
      buildSocialContentPackages(GENERATED, {
        ...METADATA,
        disclosures: [],
      }),
    ).toThrow(/disclosures are required/);
  });

  it('permits an explicit not-applicable disclosure decision with an empty disclosure list', () => {
    const [pkg] = buildSocialContentPackages(GENERATED, {
      ...METADATA,
      disclosureApplicability: 'not_applicable',
      disclosures: [],
    });

    expect(pkg.disclosure_applicability).toBe('not_applicable');
    expect(pkg.disclosures).toEqual([]);
  });

  it('correlates referral/disclosure metadata into immutable content identity', () => {
    const [withoutReferral] = buildSocialContentPackages(GENERATED, METADATA);
    const [withReferral] = buildSocialContentPackages(GENERATED, {
      ...METADATA,
      referral: {
        provider: 'example',
        referral_url: 'https://example.invalid/ref',
        disclosure: 'Referral link; applicability requires Compliance confirmation.',
      },
    });

    expect(withReferral.candidate_content_hash).not.toBe(withoutReferral.candidate_content_hash);
    expect(withReferral.content_package_id).not.toBe(withoutReferral.content_package_id);
  });
});
