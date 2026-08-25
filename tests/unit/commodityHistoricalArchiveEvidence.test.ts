import { describe, expect, it } from 'vitest';
import {
  COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION,
  buildCommodityHistoricalArchiveManifest,
  validateCommodityHistoricalArchiveManifest,
  verifyCommodityHistoricalArchiveArtifact,
  type CommodityHistoricalArchiveManifest,
} from '../../src/services/commodityHistoricalArchiveEvidence';

const CFTC_PAYLOAD = 'CFTC archived report payload\nmanaged-money,long,short,open-interest\n';

function cftcManifest(payload: string = CFTC_PAYLOAD): CommodityHistoricalArchiveManifest {
  return buildCommodityHistoricalArchiveManifest({
    providerId: 'cftc-cot',
    artifactId: 'cftc-cot-disaggregated-2026-08-04',
    artifactRole: 'PUBLICATION_REPORT',
    sourceUrl: 'https://www.cftc.gov/MarketReports/CommitmentsofTraders/HistoricalViewable/index.htm',
    sourceVersion: 'CFTC-COT-weekly-2026-08-07',
    releaseId: 'cftc-cot-release:2026-08-07',
    revisionId: null,
    publishedAt: '2026-08-07T19:30:00.000Z',
    capturedAt: '2026-08-07T19:31:00.000Z',
    mediaType: 'text/plain',
    captureMethod: 'OFFICIAL_HTTPS_DOWNLOAD',
    payload,
  });
}

describe('Commodity historical archive evidence', () => {
  it('builds a content-addressed CFTC archive manifest without creating score authority', () => {
    const manifest = cftcManifest();
    const validation = validateCommodityHistoricalArchiveManifest(manifest);

    expect(manifest.contractVersion).toBe(COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION);
    expect(manifest.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.availabilityEvidenceId).toMatch(/^commodity-archive:[0-9a-f]{64}$/);
    expect(manifest.immutable).toBe(true);
    expect(manifest.canonical).toBe(false);
    expect(manifest.scoreEligible).toBe(false);
    expect(validation.valid).toBe(true);
    expect(validation.blockers).toEqual([]);
  });

  it('emits verified archived-release evidence only after exact payload verification', () => {
    const manifest = cftcManifest();
    const verification = verifyCommodityHistoricalArchiveArtifact(manifest, CFTC_PAYLOAD);

    expect(verification.valid).toBe(true);
    expect(verification.blockers).toEqual([]);
    expect(verification.releaseEvidence).toEqual({
      archiveManifestVersion: COMMODITY_HISTORICAL_ARCHIVE_MANIFEST_VERSION,
      verifiedArchive: true,
      publishedAt: manifest.publishedAt,
      capturedAt: manifest.capturedAt,
      releaseId: manifest.releaseId,
      revisionId: null,
      availabilityEvidenceId: manifest.availabilityEvidenceId,
      contentSha256: manifest.contentSha256,
      sourceVersion: manifest.sourceVersion,
      sourcePath: manifest.sourceUrl,
    });
    expect(verification.canonical).toBe(false);
    expect(verification.scoreEligible).toBe(false);
  });

  it('rejects a payload whose bytes no longer match the archive manifest', () => {
    const manifest = cftcManifest();
    const verification = verifyCommodityHistoricalArchiveArtifact(
      manifest,
      `${CFTC_PAYLOAD}tampered`,
    );

    expect(verification.valid).toBe(false);
    expect(verification.blockers).toContain('ARCHIVE_PAYLOAD_SHA256_MISMATCH');
    expect(verification.releaseEvidence).toBeNull();
  });

  it('rejects an official-looking hostname suffix attack', () => {
    const manifest = cftcManifest();
    const tampered: CommodityHistoricalArchiveManifest = {
      ...manifest,
      sourceUrl: 'https://www.cftc.gov.attacker.example/report.txt',
    };
    const validation = validateCommodityHistoricalArchiveManifest(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_SOURCE_URL_NOT_OFFICIAL_HTTPS:cftc-cot');
  });

  it('rejects non-HTTPS archive locations even for an approved provider host', () => {
    const manifest = cftcManifest();
    const tampered: CommodityHistoricalArchiveManifest = {
      ...manifest,
      sourceUrl: 'http://www.cftc.gov/MarketReports/report.txt',
    };
    const validation = validateCommodityHistoricalArchiveManifest(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_SOURCE_URL_NOT_OFFICIAL_HTTPS:cftc-cot');
  });

  it('strips API keys before archive URLs become persistent evidence identity', () => {
    const manifest = buildCommodityHistoricalArchiveManifest({
      providerId: 'eia',
      artifactId: 'eia-secret-bearing-url',
      artifactRole: 'DATA_PAYLOAD',
      sourceUrl: 'https://api.eia.gov/v2/seriesid/example?length=5000&api_key=do-not-persist#response',
      sourceVersion: 'EIA-archived-release-2026-08-10',
      releaseId: 'eia-release:2026-08-10',
      revisionId: 'revision-1',
      publishedAt: '2026-08-10T14:00:00.000Z',
      capturedAt: '2026-08-10T14:05:00.000Z',
      mediaType: 'application/json',
      captureMethod: 'OFFICIAL_HTTPS_DOWNLOAD',
      payload: '{"data":[]}',
    });
    const validation = validateCommodityHistoricalArchiveManifest(manifest);

    expect(manifest.sourceUrl).toContain('length=5000');
    expect(manifest.sourceUrl).not.toContain('api_key');
    expect(manifest.sourceUrl).not.toContain('do-not-persist');
    expect(manifest.sourceUrl).not.toContain('#response');
    expect(validation.valid).toBe(true);
  });

  it('still rejects a persisted manifest that was tampered to reintroduce a token query', () => {
    const manifest = cftcManifest();
    const tampered = {
      ...manifest,
      sourceUrl: `${manifest.sourceUrl}?token=do-not-persist`,
    } as CommodityHistoricalArchiveManifest;
    const validation = validateCommodityHistoricalArchiveManifest(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_SOURCE_URL_NOT_OFFICIAL_HTTPS:cftc-cot');
    expect(validation.blockers).toContain('ARCHIVE_AVAILABILITY_EVIDENCE_ID_MISMATCH');
  });

  it('requires revision lineage for revision-aware EIA archive evidence', () => {
    const manifest = buildCommodityHistoricalArchiveManifest({
      providerId: 'eia',
      artifactId: 'eia-archived-release-example',
      artifactRole: 'DATA_PAYLOAD',
      sourceUrl: 'https://api.eia.gov/v2/seriesid/example',
      sourceVersion: 'EIA-archived-release-2026-08-10',
      releaseId: 'eia-release:2026-08-10',
      revisionId: null,
      publishedAt: '2026-08-10T14:00:00.000Z',
      capturedAt: '2026-08-10T14:05:00.000Z',
      mediaType: 'application/json',
      captureMethod: 'OFFICIAL_HTTPS_DOWNLOAD',
      payload: '{"data":[]}',
    });
    const validation = validateCommodityHistoricalArchiveManifest(manifest);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_POLICY_REVISION_ID_REQUIRED:eia');
  });

  it('requires revision lineage for USDA PSD archived forecast payloads', () => {
    const manifest = buildCommodityHistoricalArchiveManifest({
      providerId: 'usda-fas-psd',
      artifactId: 'usda-psd-corn-2026-08',
      artifactRole: 'DATA_PAYLOAD',
      sourceUrl: 'https://apps.fas.usda.gov/OpenData/api/psd/commodity/0440000/world/year/2026',
      sourceVersion: 'USDA-PSD-release-2026-08',
      releaseId: 'usda-psd-release:2026-08-12',
      revisionId: null,
      publishedAt: '2026-08-12T16:00:00.000Z',
      capturedAt: '2026-08-12T16:02:00.000Z',
      mediaType: 'application/json',
      captureMethod: 'OFFICIAL_HTTPS_DOWNLOAD',
      payload: '[{"attributeId":1,"value":100}]',
    });
    const validation = validateCommodityHistoricalArchiveManifest(manifest);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_POLICY_REVISION_ID_REQUIRED:usda-fas-psd');
  });

  it('detects manifest metadata tampering through the availability evidence id', () => {
    const manifest = cftcManifest();
    const tampered: CommodityHistoricalArchiveManifest = {
      ...manifest,
      sourceVersion: 'CFTC-COT-weekly-mutated',
    };
    const validation = validateCommodityHistoricalArchiveManifest(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_AVAILABILITY_EVIDENCE_ID_MISMATCH');
    expect(validation.expectedAvailabilityEvidenceId).not.toBe(manifest.availabilityEvidenceId);
  });

  it('changes both payload and availability fingerprints when archive content changes', () => {
    const first = cftcManifest('first payload');
    const second = cftcManifest('second payload');

    expect(first.contentSha256).not.toBe(second.contentSha256);
    expect(first.availabilityEvidenceId).not.toBe(second.availabilityEvidenceId);
  });

  it('rejects publication timestamps that occur after capture time', () => {
    const manifest = cftcManifest();
    const tampered: CommodityHistoricalArchiveManifest = {
      ...manifest,
      publishedAt: '2026-08-07T19:32:00.000Z',
    };
    const validation = validateCommodityHistoricalArchiveManifest(tampered);

    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_PUBLISHED_AFTER_CAPTURED');
  });

  it('fails closed instead of throwing when persisted input contains an unknown provider id', () => {
    const manifest = cftcManifest();
    const malformed = {
      ...manifest,
      providerId: 'unknown-provider',
    } as unknown as CommodityHistoricalArchiveManifest;

    expect(() => validateCommodityHistoricalArchiveManifest(malformed)).not.toThrow();
    const validation = validateCommodityHistoricalArchiveManifest(malformed);
    expect(validation.valid).toBe(false);
    expect(validation.blockers).toContain('ARCHIVE_PROVIDER_ID_INVALID:unknown-provider');
  });
});
