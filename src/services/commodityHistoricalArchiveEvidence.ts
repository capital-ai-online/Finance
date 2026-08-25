import { createHash } from 'node:crypto';
import {
  commodityHistoricalSourcePolicy,
  type CommodityHistoricalSourceId,
} from '../platform/Scoring/CommodityHistoricalVintage';

export const COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION =
  'commodity-historical-archive-manifest/1.0.0' as const;

export type CommodityHistoricalArchiveProviderId = Extract<
  CommodityHistoricalSourceId,
  'eia' | 'usda-fas-psd' | 'cftc-cot' | 'usgs-mcs' | 'eu-crma'
>;

export type CommodityHistoricalArchiveArtifactRole =
  | 'DATA_PAYLOAD'
  | 'PUBLICATION_REPORT'
  | 'REGULATORY_ASSESSMENT';

export type CommodityHistoricalArchiveCaptureMethod =
  | 'OFFICIAL_HTTPS_DOWNLOAD'
  | 'OWNER_VERIFIED_IMPORT';

export interface CommodityHistoricalArchiveManifest {
  readonly contractVersion: typeof COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION;
  readonly providerId: CommodityHistoricalArchiveProviderId;
  readonly artifactId: string;
  readonly artifactRole: CommodityHistoricalArchiveArtifactRole;
  readonly sourceUrl: string;
  readonly sourceVersion: string;
  readonly releaseId: string;
  readonly revisionId: string | null;
  readonly publishedAt: string;
  readonly capturedAt: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly contentSha256: string;
  readonly captureMethod: CommodityHistoricalArchiveCaptureMethod;
  readonly availabilityEvidenceId: string;
  readonly immutable: true;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityHistoricalArchiveManifestValidation {
  readonly valid: boolean;
  readonly blockers: readonly string[];
  readonly expectedAvailabilityEvidenceId: string;
  readonly canonical: false;
  readonly scoreEligible: false;
}

export interface CommodityVerifiedArchivedReleaseEvidence {
  readonly archiveManifestVersion: typeof COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION;
  readonly verifiedArchive: true;
  readonly publishedAt: string;
  readonly capturedAt: string;
  readonly releaseId: string;
  readonly revisionId: string | null;
  readonly availabilityEvidenceId: string;
  readonly contentSha256: string;
  readonly sourceVersion: string;
  readonly sourcePath: string;
}

export interface CommodityVerifiedArchivedReleaseEvidenceValidation {
  readonly valid: boolean;
  readonly blockers: readonly string[];
}

export interface CommodityHistoricalArchiveVerification {
  readonly valid: boolean;
  readonly blockers: readonly string[];
  readonly manifestValidation: CommodityHistoricalArchiveManifestValidation;
  readonly computedContentSha256: string;
  readonly computedByteLength: number;
  readonly releaseEvidence: CommodityVerifiedArchivedReleaseEvidence | null;
  readonly canonical: false;
  readonly scoreEligible: false;
}

const ARCHIVE_PROVIDER_IDS: readonly CommodityHistoricalArchiveProviderId[] = Object.freeze([
  'eia',
  'usda-fas-psd',
  'cftc-cot',
  'usgs-mcs',
  'eu-crma',
]);

const PROVIDER_HOST_SUFFIXES: Readonly<Record<CommodityHistoricalArchiveProviderId, readonly string[]>> = Object.freeze({
  eia: Object.freeze(['eia.gov']),
  'usda-fas-psd': Object.freeze(['fas.usda.gov']),
  'cftc-cot': Object.freeze(['cftc.gov']),
  'usgs-mcs': Object.freeze(['usgs.gov']),
  'eu-crma': Object.freeze(['eur-lex.europa.eu', 'ec.europa.eu']),
});

const ALLOWED_MEDIA_TYPES = new Set([
  'application/json',
  'application/pdf',
  'application/zip',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/html',
  'text/plain',
]);

function roles(
  ...values: CommodityHistoricalArchiveArtifactRole[]
): readonly CommodityHistoricalArchiveArtifactRole[] {
  return Object.freeze(values);
}

const ALLOWED_ROLES: Readonly<Record<CommodityHistoricalArchiveProviderId, readonly CommodityHistoricalArchiveArtifactRole[]>> = Object.freeze({
  eia: roles('DATA_PAYLOAD', 'PUBLICATION_REPORT'),
  'usda-fas-psd': roles('DATA_PAYLOAD', 'PUBLICATION_REPORT'),
  'cftc-cot': roles('DATA_PAYLOAD', 'PUBLICATION_REPORT'),
  'usgs-mcs': roles('DATA_PAYLOAD', 'PUBLICATION_REPORT'),
  'eu-crma': roles('DATA_PAYLOAD', 'PUBLICATION_REPORT', 'REGULATORY_ASSESSMENT'),
});

const SENSITIVE_QUERY_PARAMETER_NAMES = new Set([
  'api-key',
  'api_key',
  'apikey',
  'authorization',
  'access-token',
  'access_token',
  'token',
  'key',
  'secret',
  'signature',
  'sig',
]);

function sha256(payload: string | Uint8Array): string {
  return createHash('sha256').update(payload).digest('hex');
}

function byteLength(payload: string | Uint8Array): number {
  return typeof payload === 'string' ? Buffer.byteLength(payload, 'utf8') : payload.byteLength;
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function nonEmpty(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function validSha256(value: unknown): boolean {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value.trim());
}

function isArchiveProviderId(value: string): value is CommodityHistoricalArchiveProviderId {
  return (ARCHIVE_PROVIDER_IDS as readonly string[]).includes(value);
}

function hostnameAllowed(providerId: CommodityHistoricalArchiveProviderId, hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return PROVIDER_HOST_SUFFIXES[providerId].some(suffix => (
    normalized === suffix || normalized.endsWith(`.${suffix}`)
  ));
}

function containsSensitiveQueryParameter(parsed: URL): boolean {
  for (const key of parsed.searchParams.keys()) {
    if (SENSITIVE_QUERY_PARAMETER_NAMES.has(key.trim().toLowerCase())) return true;
  }
  return false;
}

function validateOfficialSourceUrlShape(
  providerId: CommodityHistoricalArchiveProviderId,
  parsed: URL,
): boolean {
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.port && parsed.port !== '443') return false;
  if (!hostnameAllowed(providerId, parsed.hostname)) return false;
  return true;
}

function sanitizeOfficialSourceUrlForManifest(
  providerId: CommodityHistoricalArchiveProviderId,
  sourceUrl: string,
): string {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error('COMMODITY_ARCHIVE_SOURCE_URL_INVALID');
  }
  if (!validateOfficialSourceUrlShape(providerId, parsed)) {
    throw new Error('COMMODITY_ARCHIVE_SOURCE_URL_INVALID');
  }

  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (SENSITIVE_QUERY_PARAMETER_NAMES.has(key.trim().toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.searchParams.sort();
  return parsed.toString();
}

function parseOfficialSourceUrl(
  providerId: CommodityHistoricalArchiveProviderId,
  sourceUrl: string,
): URL | null {
  try {
    const parsed = new URL(sourceUrl);
    if (!validateOfficialSourceUrlShape(providerId, parsed)) return null;
    if (parsed.hash) return null;
    if (containsSensitiveQueryParameter(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function manifestIdentity(manifest: Omit<CommodityHistoricalArchiveManifest, 'availabilityEvidenceId'>): unknown {
  return {
    contractVersion: manifest.contractVersion,
    providerId: manifest.providerId,
    artifactId: manifest.artifactId,
    artifactRole: manifest.artifactRole,
    sourceUrl: manifest.sourceUrl,
    sourceVersion: manifest.sourceVersion,
    releaseId: manifest.releaseId,
    revisionId: manifest.revisionId,
    publishedAt: manifest.publishedAt,
    capturedAt: manifest.capturedAt,
    mediaType: manifest.mediaType,
    byteLength: manifest.byteLength,
    contentSha256: manifest.contentSha256,
    captureMethod: manifest.captureMethod,
    immutable: manifest.immutable,
    canonical: manifest.canonical,
    scoreEligible: manifest.scoreEligible,
  };
}

function expectedAvailabilityEvidenceId(
  manifest: Omit<CommodityHistoricalArchiveManifest, 'availabilityEvidenceId'>,
): string {
  return `commodity-archive:${sha256(JSON.stringify(manifestIdentity(manifest)))}`;
}

/**
 * Creates an immutable manifest from exact captured bytes. Credential-like query parameters are
 * removed before the URL participates in evidence identity, so API keys/tokens cannot be persisted
 * by the normal builder path. The manifest still requires explicit verification against the bytes
 * before archived-release evidence can be emitted.
 */
export function buildCommodityHistoricalArchiveManifest(input: Readonly<{
  providerId: CommodityHistoricalArchiveProviderId;
  artifactId: string;
  artifactRole: CommodityHistoricalArchiveArtifactRole;
  sourceUrl: string;
  sourceVersion: string;
  releaseId: string;
  revisionId?: string | null;
  publishedAt: string;
  capturedAt: string;
  mediaType: string;
  captureMethod: CommodityHistoricalArchiveCaptureMethod;
  payload: string | Uint8Array;
}>): CommodityHistoricalArchiveManifest {
  const base = {
    contractVersion: COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION,
    providerId: input.providerId,
    artifactId: input.artifactId.trim(),
    artifactRole: input.artifactRole,
    sourceUrl: sanitizeOfficialSourceUrlForManifest(input.providerId, input.sourceUrl.trim()),
    sourceVersion: input.sourceVersion.trim(),
    releaseId: input.releaseId.trim(),
    revisionId: input.revisionId?.trim() || null,
    publishedAt: input.publishedAt,
    capturedAt: input.capturedAt,
    mediaType: input.mediaType.trim().toLowerCase(),
    byteLength: byteLength(input.payload),
    contentSha256: sha256(input.payload),
    captureMethod: input.captureMethod,
    immutable: true as const,
    canonical: false as const,
    scoreEligible: false as const,
  };
  return Object.freeze({
    ...base,
    availabilityEvidenceId: expectedAvailabilityEvidenceId(base),
  });
}

export function validateCommodityHistoricalArchiveManifest(
  manifest: CommodityHistoricalArchiveManifest,
): CommodityHistoricalArchiveManifestValidation {
  const blockers: string[] = [];
  const runtimeProviderId = String(manifest.providerId);
  const providerId = isArchiveProviderId(runtimeProviderId) ? runtimeProviderId : null;
  const policy = providerId ? commodityHistoricalSourcePolicy(providerId) : null;
  const { availabilityEvidenceId: _ignoredEvidenceId, ...identityInput } = manifest;
  const expectedEvidenceId = expectedAvailabilityEvidenceId(identityInput);

  if (manifest.contractVersion !== COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION) {
    blockers.push('ARCHIVE_MANIFEST_CONTRACT_VERSION_MISMATCH');
  }
  if (!providerId) blockers.push(`ARCHIVE_PROVIDER_ID_INVALID:${runtimeProviderId}`);
  if (!nonEmpty(manifest.artifactId)) blockers.push('ARCHIVE_ARTIFACT_ID_REQUIRED');
  if (providerId && !ALLOWED_ROLES[providerId].includes(manifest.artifactRole)) {
    blockers.push(`ARCHIVE_ARTIFACT_ROLE_NOT_ALLOWED:${providerId}:${manifest.artifactRole}`);
  }
  if (!providerId || !parseOfficialSourceUrl(providerId, manifest.sourceUrl)) {
    blockers.push(`ARCHIVE_SOURCE_URL_NOT_OFFICIAL_HTTPS:${runtimeProviderId}`);
  }
  if (!nonEmpty(manifest.sourceVersion)) blockers.push('ARCHIVE_SOURCE_VERSION_REQUIRED');
  if (!nonEmpty(manifest.releaseId)) blockers.push('ARCHIVE_RELEASE_ID_REQUIRED');
  if (policy?.pitRequiresReleaseId && !nonEmpty(manifest.releaseId)) {
    blockers.push(`ARCHIVE_POLICY_RELEASE_ID_REQUIRED:${runtimeProviderId}`);
  }
  if (policy?.pitRequiresRevisionId && !nonEmpty(manifest.revisionId)) {
    blockers.push(`ARCHIVE_POLICY_REVISION_ID_REQUIRED:${runtimeProviderId}`);
  }
  if (!validTimestamp(manifest.publishedAt) || !validTimestamp(manifest.capturedAt)) {
    blockers.push('ARCHIVE_TIMESTAMP_INVALID');
  } else if (Date.parse(manifest.publishedAt) > Date.parse(manifest.capturedAt)) {
    blockers.push('ARCHIVE_PUBLISHED_AFTER_CAPTURED');
  }
  if (!ALLOWED_MEDIA_TYPES.has(manifest.mediaType)) {
    blockers.push(`ARCHIVE_MEDIA_TYPE_NOT_ALLOWED:${manifest.mediaType}`);
  }
  if (!Number.isInteger(manifest.byteLength) || manifest.byteLength <= 0) {
    blockers.push('ARCHIVE_BYTE_LENGTH_INVALID');
  }
  if (!validSha256(manifest.contentSha256)) blockers.push('ARCHIVE_CONTENT_SHA256_INVALID');
  if (manifest.captureMethod !== 'OFFICIAL_HTTPS_DOWNLOAD' && manifest.captureMethod !== 'OWNER_VERIFIED_IMPORT') {
    blockers.push('ARCHIVE_CAPTURE_METHOD_INVALID');
  }
  if (manifest.immutable !== true || manifest.canonical !== false || manifest.scoreEligible !== false) {
    blockers.push('ARCHIVE_MANIFEST_AUTHORITY_INVALID');
  }
  if (manifest.availabilityEvidenceId !== expectedEvidenceId) {
    blockers.push('ARCHIVE_AVAILABILITY_EVIDENCE_ID_MISMATCH');
  }

  return Object.freeze({
    valid: blockers.length === 0,
    blockers: Object.freeze(blockers),
    expectedAvailabilityEvidenceId: expectedEvidenceId,
    canonical: false,
    scoreEligible: false,
  });
}

/**
 * Validates a persisted release-evidence projection before any Historical Vintage builder consumes
 * it. This does not replace verification of the original bytes; it prevents metadata-only objects
 * from being accepted accidentally at downstream archive entry points.
 */
export function validateCommodityVerifiedArchivedReleaseEvidence(
  providerId: CommodityHistoricalArchiveProviderId,
  evidence: CommodityVerifiedArchivedReleaseEvidence,
): CommodityVerifiedArchivedReleaseEvidenceValidation {
  const blockers: string[] = [];
  const policy = commodityHistoricalSourcePolicy(providerId);
  if (evidence.archiveManifestVersion !== COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION) {
    blockers.push('VERIFIED_ARCHIVE_MANIFEST_VERSION_MISMATCH');
  }
  if (evidence.verifiedArchive !== true) blockers.push('VERIFIED_ARCHIVE_MARKER_REQUIRED');
  if (!validTimestamp(evidence.publishedAt) || !validTimestamp(evidence.capturedAt)) {
    blockers.push('VERIFIED_ARCHIVE_TIMESTAMP_INVALID');
  } else if (Date.parse(evidence.publishedAt) > Date.parse(evidence.capturedAt)) {
    blockers.push('VERIFIED_ARCHIVE_PUBLISHED_AFTER_CAPTURED');
  }
  if (policy.pitRequiresReleaseId && !nonEmpty(evidence.releaseId)) {
    blockers.push(`VERIFIED_ARCHIVE_RELEASE_ID_REQUIRED:${providerId}`);
  }
  if (policy.pitRequiresRevisionId && !nonEmpty(evidence.revisionId)) {
    blockers.push(`VERIFIED_ARCHIVE_REVISION_ID_REQUIRED:${providerId}`);
  }
  if (!/^commodity-archive:[0-9a-f]{64}$/i.test(evidence.availabilityEvidenceId)) {
    blockers.push('VERIFIED_ARCHIVE_AVAILABILITY_EVIDENCE_ID_INVALID');
  }
  if (!validSha256(evidence.contentSha256)) blockers.push('VERIFIED_ARCHIVE_CONTENT_SHA256_INVALID');
  if (!nonEmpty(evidence.sourceVersion)) blockers.push('VERIFIED_ARCHIVE_SOURCE_VERSION_REQUIRED');
  if (!parseOfficialSourceUrl(providerId, evidence.sourcePath)) {
    blockers.push(`VERIFIED_ARCHIVE_SOURCE_PATH_INVALID:${providerId}`);
  }
  return Object.freeze({ valid: blockers.length === 0, blockers: Object.freeze(blockers) });
}

/**
 * Verifies that the bytes used for historical normalization are exactly the bytes bound by the
 * archive manifest. A valid result is the only normal path into a verified archived-release
 * evidence projection. No model/registry/score authority is created here.
 */
export function verifyCommodityHistoricalArchiveArtifact(
  manifest: CommodityHistoricalArchiveManifest,
  payload: string | Uint8Array,
): CommodityHistoricalArchiveVerification {
  const blockers: string[] = [];
  const manifestValidation = validateCommodityHistoricalArchiveManifest(manifest);
  blockers.push(...manifestValidation.blockers);

  const computedContentSha256 = sha256(payload);
  const computedByteLength = byteLength(payload);
  if (computedContentSha256 !== manifest.contentSha256) blockers.push('ARCHIVE_PAYLOAD_SHA256_MISMATCH');
  if (computedByteLength !== manifest.byteLength) blockers.push('ARCHIVE_PAYLOAD_BYTE_LENGTH_MISMATCH');

  const valid = blockers.length === 0;
  const releaseEvidence: CommodityVerifiedArchivedReleaseEvidence | null = valid
    ? Object.freeze({
        archiveManifestVersion: COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION,
        verifiedArchive: true,
        publishedAt: manifest.publishedAt,
        capturedAt: manifest.capturedAt,
        releaseId: manifest.releaseId,
        revisionId: manifest.revisionId,
        availabilityEvidenceId: manifest.availabilityEvidenceId,
        contentSha256: manifest.contentSha256,
        sourceVersion: manifest.sourceVersion,
        sourcePath: manifest.sourceUrl,
      })
    : null;

  return Object.freeze({
    valid,
    blockers: Object.freeze(blockers),
    manifestValidation,
    computedContentSha256,
    computedByteLength,
    releaseEvidence,
    canonical: false,
    scoreEligible: false,
  });
}
