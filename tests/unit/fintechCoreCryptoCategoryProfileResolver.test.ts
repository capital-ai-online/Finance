import { describe, expect, it } from 'vitest';
import {
  resolveCryptoCategoryProfiles,
  type CryptoCategoryEvidenceCandidate,
} from '../../src/platform/FinTechCore';
import type { CryptoClassification } from '../../src/types/crypto.types';

function classification(
  category_main: CryptoClassification['category_main'],
  confidence = 0.9,
): CryptoClassification {
  return {
    category_main,
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    confidence,
    reasoning: ['test fixture'],
  };
}

function candidate(
  overrides: Partial<CryptoCategoryEvidenceCandidate> = {},
): CryptoCategoryEvidenceCandidate {
  return {
    category: 'DeFi',
    source: 'VERIFIED_EXTERNAL_TAXONOMY',
    confidence: 0.8,
    evidenceRefs: ['evidence:category:defi'],
    ...overrides,
  };
}

describe('FinTech Core crypto category profile resolver', () => {
  it('keeps canonical classification as the primary profile authority', () => {
    const result = resolveCryptoCategoryProfiles(classification('Layer 1'));

    expect(result.primary).toMatchObject({
      category: 'Layer 1',
      profileId: 'layer1',
      source: 'CANONICAL_CLASSIFICATION',
      sourceStatus: 'SOURCE_DEFINED',
    });
    expect(result.analysisReady).toBe(true);
    expect(result.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
  });

  it('adds verified specialized secondary profiles without double-counting the primary profile', () => {
    const result = resolveCryptoCategoryProfiles(
      classification('Layer 1'),
      [
        candidate(),
        candidate({ category: 'Layer 1', evidenceRefs: ['evidence:duplicate:l1'] }),
        candidate({ category: 'DeFi', evidenceRefs: ['evidence:duplicate:defi'] }),
      ],
    );

    expect(result.secondary).toHaveLength(1);
    expect(result.secondary[0]).toMatchObject({
      category: 'DeFi',
      profileId: 'defi',
    });
  });

  it('never promotes agent-research category output into a secondary analysis profile', () => {
    const result = resolveCryptoCategoryProfiles(
      classification('Layer 1'),
      [candidate({ source: 'AGENT_RESEARCH' })],
    );

    expect(result.secondary).toEqual([]);
    expect(result.rejectedEvidence).toHaveLength(1);
    expect(result.rejectedEvidence[0].reason).toContain('research-only');
  });

  it('requires provenance evidence for deterministic or verified secondary promotion', () => {
    const result = resolveCryptoCategoryProfiles(
      classification('Layer 1'),
      [candidate({ evidenceRefs: [] })],
    );

    expect(result.secondary).toEqual([]);
    expect(result.rejectedEvidence[0].reason).toContain('evidence reference');
  });

  it('requires semantic qualifiers for conditional AI/DePIN and NFT mappings', () => {
    const withoutQualifier = resolveCryptoCategoryProfiles(
      classification('Layer 1'),
      [candidate({ category: 'AI / Data' })],
    );
    expect(withoutQualifier.secondary).toEqual([]);
    expect(withoutQualifier.rejectedEvidence[0].reason).toContain('semantic qualifier');

    const withQualifier = resolveCryptoCategoryProfiles(
      classification('Layer 1'),
      [candidate({
        category: 'AI / Data',
        qualifiers: ['depin'],
        evidenceRefs: ['evidence:depin:network'],
      })],
    );
    expect(withQualifier.secondary[0]).toMatchObject({
      profileId: 'ai-depin',
      binding: 'CONDITIONAL',
    });
  });

  it('keeps unknown primary classification explicitly not analysis-ready', () => {
    const result = resolveCryptoCategoryProfiles(classification('Unknown', 0.4));
    expect(result.primary).toMatchObject({
      profileId: 'generic',
      sourceStatus: 'PENDING_EVIDENCE',
    });
    expect(result.analysisReady).toBe(false);
  });
});
