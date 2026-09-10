import { createHash } from 'node:crypto';
import type { GeneratedTextVariant, GenerateTextResult } from './textContentGeneration';

export type SocialApprovalStatus =
  | 'DRAFT'
  | 'REVIEW_REQUIRED'
  | 'APPROVED_FOR_HANDOFF'
  | 'REJECTED'
  | 'SUPERSEDED';

export type SocialPublishStatus =
  | 'NOT_REQUESTED'
  | 'READY_FOR_HANDOFF'
  | 'HANDOFF_PENDING'
  | 'PUBLISHED_VERIFIED'
  | 'PUBLISH_FAILED'
  | 'UNKNOWN';

export type DisclosureApplicability = 'required' | 'not_applicable';

export interface SocialProvenance {
  source_content_id: string;
  source_domain: string;
  evidence_reference: string;
  transformation: 'deterministic_social_text_adaptation';
}

export interface SocialReferralMetadata {
  provider?: string;
  referral_url?: string;
  disclosure?: string;
}

export interface SocialContentPackage {
  content_package_id: string;
  source_content_id: string;
  source_domain: string;
  campaign_id?: string;
  channel: GeneratedTextVariant['platform'];
  content_type: GeneratedTextVariant['format'];
  text: string;
  media_requirements: { required: false };
  hashtags: string[];
  links: string[];
  disclosures: string[];
  disclosure_applicability: DisclosureApplicability;
  language: GenerateTextResult['locale'];
  tone: string;
  provenance: SocialProvenance;
  generated_at: string;
  approval_status: SocialApprovalStatus;
  approval_reference: string | null;
  publish_status: SocialPublishStatus;
  evidence_reference: string;
  candidate_content_hash: string;
  referral?: SocialReferralMetadata;
}

export interface SocialPackageMetadata {
  sourceContentId: string;
  sourceDomain: string;
  evidenceReference: string;
  disclosures?: string[];
  disclosureApplicability: DisclosureApplicability;
  links?: string[];
  hashtags?: string[];
  campaignId?: string;
  tone?: string;
  referral?: SocialReferralMetadata;
}

function requiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${field} is required for canonical Social provenance`);
  return normalized;
}

function normalizedList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function assertDisclosureIdentity(metadata: SocialPackageMetadata): string[] {
  if (metadata.disclosureApplicability !== 'required' && metadata.disclosureApplicability !== 'not_applicable') {
    throw new Error('disclosureApplicability must be required or not_applicable');
  }
  const disclosures = normalizedList(metadata.disclosures);
  if (metadata.disclosureApplicability === 'required' && disclosures.length === 0) {
    throw new Error('disclosures are required when disclosureApplicability=required');
  }
  return disclosures;
}

function normalizeReferral(value: SocialReferralMetadata | undefined): SocialReferralMetadata | undefined {
  if (!value) return undefined;
  const provider = value.provider?.trim() || undefined;
  const referralUrl = value.referral_url?.trim() || undefined;
  const disclosure = value.disclosure?.trim() || undefined;
  if (!provider && !referralUrl && !disclosure) return undefined;
  return { provider, referral_url: referralUrl, disclosure };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function extractInlineHashtags(text: string): string[] {
  return Array.from(text.matchAll(/(^|\s)#([\p{L}\p{N}_-]+)/gu), (match) => `#${match[2]}`);
}

export function buildSocialContentPackages(
  generated: GenerateTextResult,
  metadata: SocialPackageMetadata,
): SocialContentPackage[] {
  const sourceContentId = requiredText(metadata.sourceContentId, 'sourceContentId');
  const sourceDomain = requiredText(metadata.sourceDomain, 'sourceDomain');
  const evidenceReference = requiredText(metadata.evidenceReference, 'evidenceReference');
  const disclosures = assertDisclosureIdentity(metadata);
  const links = normalizedList(metadata.links);
  const explicitHashtags = normalizedList(metadata.hashtags);
  const tone = metadata.tone?.trim() || 'educational_compliance_aware';
  const referral = normalizeReferral(metadata.referral);

  return generated.variants.map((variant) => {
    const hashtags = explicitHashtags.length > 0 ? explicitHashtags : extractInlineHashtags(variant.text);
    const candidateCanonical = JSON.stringify({
      sourceContentId,
      sourceDomain,
      channel: variant.platform,
      contentType: variant.format,
      text: variant.text,
      hashtags: [...hashtags].sort(),
      links: [...links].sort(),
      disclosures: [...disclosures].sort(),
      disclosureApplicability: metadata.disclosureApplicability,
      language: generated.locale,
      tone,
      referral: referral || null,
    });
    const candidateHash = sha256(candidateCanonical);
    const packageId = `scp_${candidateHash.slice(0, 24)}`;

    return {
      content_package_id: packageId,
      source_content_id: sourceContentId,
      source_domain: sourceDomain,
      campaign_id: metadata.campaignId?.trim() || undefined,
      channel: variant.platform,
      content_type: variant.format,
      text: variant.text,
      media_requirements: { required: false },
      hashtags,
      links,
      disclosures,
      disclosure_applicability: metadata.disclosureApplicability,
      language: generated.locale,
      tone,
      provenance: {
        source_content_id: sourceContentId,
        source_domain: sourceDomain,
        evidence_reference: evidenceReference,
        transformation: 'deterministic_social_text_adaptation',
      },
      generated_at: generated.generatedAt,
      approval_status: 'DRAFT',
      approval_reference: null,
      publish_status: 'NOT_REQUESTED',
      evidence_reference: evidenceReference,
      candidate_content_hash: candidateHash,
      referral,
    };
  });
}
