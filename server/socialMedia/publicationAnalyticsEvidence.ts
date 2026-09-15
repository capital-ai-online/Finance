import { createHash } from 'node:crypto';
import type { SupportedAccountPlatform } from '../../src/platform/SocialMediaEngine/types';

export const SOCIAL_PUBLICATION_EVIDENCE_SCHEMA = 'social-publication-evidence/v1' as const;
export const SOCIAL_ANALYTICS_EVIDENCE_SCHEMA = 'social-analytics-evidence/v1' as const;

export type PublicationEvidenceState = 'published' | 'pending' | 'failed';
export type AssetEvidenceApplicability = 'required' | 'not_applicable';
export type AnalyticsSourceKind = 'provider_api' | 'provider_export' | 'verified_data_pipeline';

export interface AssetIdentityEvidence {
  applicability: AssetEvidenceApplicability;
  assetSha256?: string;
  assetReference?: string;
}

export interface SocialPublicationEvidenceInput {
  contentPackageId: string;
  contentIdentitySha256: string;
  approvalReference: string;
  platform: SupportedAccountPlatform;
  publicationState: PublicationEvidenceState;
  providerPostId?: string;
  providerPostUrl?: string;
  publishedAt?: string;
  observedAt: string;
  asset: AssetIdentityEvidence;
  failureReason?: string;
}

export interface SocialPublicationEvidence {
  schemaVersion: typeof SOCIAL_PUBLICATION_EVIDENCE_SCHEMA;
  publicationEvidenceId: string;
  contentPackageId: string;
  contentIdentitySha256: string;
  approvalReference: string;
  platform: SupportedAccountPlatform;
  publicationState: PublicationEvidenceState;
  providerPostId?: string;
  providerPostUrl?: string;
  publishedAt?: string;
  observedAt: string;
  asset: {
    applicability: AssetEvidenceApplicability;
    assetSha256?: string;
    assetReference?: string;
  };
  failureReason?: string;
}

export interface SocialAnalyticsEvidenceInput {
  sourceKind: AnalyticsSourceKind;
  sourceIdentity: string;
  sourceReference: string;
  metricName: string;
  metricUnit: string;
  metricValue: number;
  measurementWindowStart: string;
  measurementWindowEnd: string;
  observedAt: string;
}

export interface SocialAnalyticsEvidence {
  schemaVersion: typeof SOCIAL_ANALYTICS_EVIDENCE_SCHEMA;
  analyticsEvidenceId: string;
  publicationEvidenceId: string;
  contentPackageId: string;
  platform: SupportedAccountPlatform;
  providerPostId: string;
  sourceKind: AnalyticsSourceKind;
  sourceIdentity: string;
  sourceReference: string;
  metricName: string;
  metricUnit: string;
  metricValue: number;
  measurementWindowStart: string;
  measurementWindowEnd: string;
  observedAt: string;
}

const PLATFORMS = new Set<SupportedAccountPlatform>(['youtube', 'tiktok', 'instagram', 'x', 'facebook']);
const PUBLICATION_STATES = new Set<PublicationEvidenceState>(['published', 'pending', 'failed']);
const ANALYTICS_SOURCE_KINDS = new Set<AnalyticsSourceKind>([
  'provider_api',
  'provider_export',
  'verified_data_pipeline',
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const CONTENT_PACKAGE_PATTERN = /^scp_[a-f0-9]{24}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) throw new Error(`${field} is required for Social evidence provenance`);
  return normalized;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeSha256(value: unknown, field: string): string {
  const normalized = requiredText(value, field).toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) throw new Error(`${field} must be a SHA-256 hex digest`);
  return normalized;
}

function normalizeTimestamp(value: unknown, field: string): string {
  const normalized = requiredText(value, field);
  const epochMs = Date.parse(normalized);
  if (!Number.isFinite(epochMs)) throw new Error(`${field} must be a valid timestamp`);
  return new Date(epochMs).toISOString();
}

function normalizeHttpsUrl(value: unknown, field: string): string | undefined {
  const normalized = optionalText(value);
  if (!normalized) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`${field} must use https`);
  return parsed.toString();
}

function assertPlatform(value: unknown): asserts value is SupportedAccountPlatform {
  if (typeof value !== 'string' || !PLATFORMS.has(value as SupportedAccountPlatform)) {
    throw new Error('platform must be a supported Social provider platform');
  }
}

function assertPublicationState(value: unknown): asserts value is PublicationEvidenceState {
  if (typeof value !== 'string' || !PUBLICATION_STATES.has(value as PublicationEvidenceState)) {
    throw new Error('publicationState must be published, pending or failed');
  }
}

function assertAssetEvidence(value: unknown): asserts value is AssetIdentityEvidence {
  if (!isRecord(value)) throw new Error('asset evidence is required');
  const applicability = value.applicability;
  if (applicability !== 'required' && applicability !== 'not_applicable') {
    throw new Error('asset.applicability must be required or not_applicable');
  }

  if (applicability === 'required') {
    normalizeSha256(value.assetSha256, 'asset.assetSha256');
    requiredText(value.assetReference, 'asset.assetReference');
    return;
  }

  if (optionalText(value.assetSha256) || optionalText(value.assetReference)) {
    throw new Error('asset identity must be absent when asset.applicability=not_applicable');
  }
}

export function validateSocialPublicationEvidenceInput(
  value: unknown,
): asserts value is SocialPublicationEvidenceInput {
  if (!isRecord(value)) throw new Error('publication evidence input must be an object');

  const contentPackageId = requiredText(value.contentPackageId, 'contentPackageId');
  if (!CONTENT_PACKAGE_PATTERN.test(contentPackageId)) {
    throw new Error('contentPackageId must be a canonical SOCIAL-P0 package id');
  }
  normalizeSha256(value.contentIdentitySha256, 'contentIdentitySha256');
  requiredText(value.approvalReference, 'approvalReference');
  assertPlatform(value.platform);
  assertPublicationState(value.publicationState);
  assertAssetEvidence(value.asset);
  const observedAt = normalizeTimestamp(value.observedAt, 'observedAt');

  const providerPostId = optionalText(value.providerPostId);
  const publishedAt = optionalText(value.publishedAt)
    ? normalizeTimestamp(value.publishedAt, 'publishedAt')
    : undefined;
  normalizeHttpsUrl(value.providerPostUrl, 'providerPostUrl');
  const failureReason = optionalText(value.failureReason);

  if (value.publicationState === 'published') {
    if (!providerPostId) throw new Error('providerPostId is required for published evidence');
    if (!publishedAt) throw new Error('publishedAt is required for published evidence');
    if (Date.parse(observedAt) < Date.parse(publishedAt)) {
      throw new Error('observedAt must not precede publishedAt');
    }
    if (failureReason) throw new Error('failureReason must be absent for published evidence');
  }

  if (value.publicationState === 'pending') {
    if (!providerPostId) throw new Error('providerPostId is required for pending evidence');
    if (failureReason) throw new Error('failureReason must be absent for pending evidence');
  }

  if (value.publicationState === 'failed') {
    if (!failureReason) throw new Error('failureReason is required for failed publication evidence');
    if (publishedAt) throw new Error('publishedAt must be absent for failed publication evidence');
  }
}

function normalizeAssetEvidence(value: AssetIdentityEvidence): SocialPublicationEvidence['asset'] {
  if (value.applicability === 'not_applicable') return { applicability: 'not_applicable' };
  return {
    applicability: 'required',
    assetSha256: normalizeSha256(value.assetSha256, 'asset.assetSha256'),
    assetReference: requiredText(value.assetReference, 'asset.assetReference'),
  };
}

export function buildSocialPublicationEvidence(input: SocialPublicationEvidenceInput): SocialPublicationEvidence {
  validateSocialPublicationEvidenceInput(input);

  const canonical = {
    contentPackageId: input.contentPackageId.trim().toLowerCase(),
    contentIdentitySha256: normalizeSha256(input.contentIdentitySha256, 'contentIdentitySha256'),
    approvalReference: input.approvalReference.trim(),
    platform: input.platform,
    publicationState: input.publicationState,
    providerPostId: optionalText(input.providerPostId),
    providerPostUrl: normalizeHttpsUrl(input.providerPostUrl, 'providerPostUrl'),
    publishedAt: optionalText(input.publishedAt) ? normalizeTimestamp(input.publishedAt, 'publishedAt') : undefined,
    observedAt: normalizeTimestamp(input.observedAt, 'observedAt'),
    asset: normalizeAssetEvidence(input.asset),
    failureReason: optionalText(input.failureReason),
  };

  const publicationEvidenceId = `spe_${sha256(JSON.stringify(canonical)).slice(0, 32)}`;
  return {
    schemaVersion: SOCIAL_PUBLICATION_EVIDENCE_SCHEMA,
    publicationEvidenceId,
    ...canonical,
  };
}

export function validateSocialAnalyticsEvidenceInput(value: unknown): asserts value is SocialAnalyticsEvidenceInput {
  if (!isRecord(value)) throw new Error('analytics evidence input must be an object');
  if (typeof value.sourceKind !== 'string' || !ANALYTICS_SOURCE_KINDS.has(value.sourceKind as AnalyticsSourceKind)) {
    throw new Error('unsupported analytics source kind; synthetic/manual analytics are not accepted');
  }
  requiredText(value.sourceIdentity, 'sourceIdentity');
  requiredText(value.sourceReference, 'sourceReference');
  requiredText(value.metricName, 'metricName');
  requiredText(value.metricUnit, 'metricUnit');
  if (typeof value.metricValue !== 'number' || !Number.isFinite(value.metricValue)) {
    throw new Error('metricValue must be a finite number from the declared real evidence source');
  }

  const start = normalizeTimestamp(value.measurementWindowStart, 'measurementWindowStart');
  const end = normalizeTimestamp(value.measurementWindowEnd, 'measurementWindowEnd');
  const observedAt = normalizeTimestamp(value.observedAt, 'observedAt');
  if (Date.parse(start) >= Date.parse(end)) {
    throw new Error('measurement window must have start before end');
  }
  if (Date.parse(observedAt) < Date.parse(end)) {
    throw new Error('observedAt must not precede measurementWindowEnd');
  }
}

export function buildSocialAnalyticsEvidence(
  publication: SocialPublicationEvidence,
  input: SocialAnalyticsEvidenceInput,
): SocialAnalyticsEvidence {
  if (publication.schemaVersion !== SOCIAL_PUBLICATION_EVIDENCE_SCHEMA) {
    throw new Error('publication evidence schema is not supported');
  }
  if (publication.publicationState !== 'published' || !publication.providerPostId) {
    throw new Error('analytics evidence requires verified published publication evidence with providerPostId');
  }
  validateSocialAnalyticsEvidenceInput(input);

  const canonical = {
    publicationEvidenceId: publication.publicationEvidenceId,
    contentPackageId: publication.contentPackageId,
    platform: publication.platform,
    providerPostId: publication.providerPostId,
    sourceKind: input.sourceKind,
    sourceIdentity: input.sourceIdentity.trim(),
    sourceReference: input.sourceReference.trim(),
    metricName: input.metricName.trim(),
    metricUnit: input.metricUnit.trim(),
    metricValue: input.metricValue,
    measurementWindowStart: normalizeTimestamp(input.measurementWindowStart, 'measurementWindowStart'),
    measurementWindowEnd: normalizeTimestamp(input.measurementWindowEnd, 'measurementWindowEnd'),
    observedAt: normalizeTimestamp(input.observedAt, 'observedAt'),
  };

  const analyticsEvidenceId = `sae_${sha256(JSON.stringify(canonical)).slice(0, 32)}`;
  return {
    schemaVersion: SOCIAL_ANALYTICS_EVIDENCE_SCHEMA,
    analyticsEvidenceId,
    ...canonical,
  };
}
