import type { CryptoCategory, CryptoClassification } from '../../../../types/crypto.types';
import {
  resolveCryptoAnalysisProfile,
  type CryptoAnalysisProfileId,
  type CryptoProfileBinding,
} from '../../CryptoModuleContracts';
import { resolveEffectiveCryptoCategoryAnalysisProfile } from './CryptoMemeProfileSupersession';

export const CRYPTO_CATEGORY_PROFILE_RESOLVER_VERSION =
  'fintech-core.crypto/category-profile-resolver/0.2.0' as const;

export type CryptoCategoryEvidenceSource =
  | 'CANONICAL_CLASSIFICATION'
  | 'DETERMINISTIC_REGISTRY'
  | 'VERIFIED_EXTERNAL_TAXONOMY'
  | 'AGENT_RESEARCH';

export interface CryptoCategoryEvidenceCandidate {
  readonly category: CryptoCategory;
  readonly source: CryptoCategoryEvidenceSource;
  readonly confidence: number;
  readonly evidenceRefs: readonly string[];
  /** Optional normalized semantic qualifiers such as `depin` or `nft`. */
  readonly qualifiers?: readonly string[];
}

export interface CryptoResolvedAnalysisProfile {
  readonly category: CryptoCategory;
  readonly profileId: CryptoAnalysisProfileId;
  readonly binding: CryptoProfileBinding;
  readonly source: CryptoCategoryEvidenceSource;
  readonly confidence: number;
  readonly evidenceRefs: readonly string[];
  readonly sourceStatus: 'SOURCE_DEFINED' | 'PENDING_EVIDENCE';
}

export interface CryptoRejectedProfileEvidence {
  readonly category: CryptoCategory;
  readonly source: CryptoCategoryEvidenceSource;
  readonly reason: string;
}

export interface CryptoCategoryProfileResolution {
  readonly resolverVersion: typeof CRYPTO_CATEGORY_PROFILE_RESOLVER_VERSION;
  readonly primary: CryptoResolvedAnalysisProfile;
  readonly secondary: readonly CryptoResolvedAnalysisProfile[];
  readonly rejectedEvidence: readonly CryptoRejectedProfileEvidence[];
  readonly analysisReady: boolean;
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function normalizedQualifiers(candidate: CryptoCategoryEvidenceCandidate): ReadonlySet<string> {
  return new Set((candidate.qualifiers ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean));
}

function conditionalBindingSatisfied(candidate: CryptoCategoryEvidenceCandidate): boolean {
  const qualifiers = normalizedQualifiers(candidate);
  if (candidate.category === 'AI / Data') return qualifiers.has('depin');
  if (candidate.category === 'NFT / Creator') return qualifiers.has('nft') || qualifiers.has('collection');
  return false;
}

function isPromotableSecondarySource(source: CryptoCategoryEvidenceSource): boolean {
  return source === 'DETERMINISTIC_REGISTRY' || source === 'VERIFIED_EXTERNAL_TAXONOMY';
}

function toResolved(
  category: CryptoCategory,
  source: CryptoCategoryEvidenceSource,
  confidence: number,
  evidenceRefs: readonly string[],
): CryptoResolvedAnalysisProfile {
  const binding = resolveCryptoAnalysisProfile(category);
  return Object.freeze({
    category,
    profileId: binding.profileId,
    binding: binding.binding,
    source,
    confidence: clampConfidence(confidence),
    evidenceRefs: Object.freeze([...evidenceRefs]),
    sourceStatus: resolveEffectiveCryptoCategoryAnalysisProfile(binding.profileId).sourceStatus,
  });
}

/**
 * Builds a non-scoring analytical profile view from the canonical primary classification plus
 * optional secondary taxonomy evidence.
 *
 * - canonical classification always owns the primary profile;
 * - agent research can never promote a secondary profile;
 * - verified/deterministic secondary evidence requires at least one evidence reference;
 * - conditional mappings require explicit semantic qualifiers;
 * - duplicate profile IDs are not counted twice;
 * - superseded category profiles are resolved through the effective profile contract.
 */
export function resolveCryptoCategoryProfiles(
  classification: CryptoClassification,
  secondaryCandidates: readonly CryptoCategoryEvidenceCandidate[] = [],
): CryptoCategoryProfileResolution {
  const primary = toResolved(
    classification.category_main,
    'CANONICAL_CLASSIFICATION',
    classification.confidence,
    Object.freeze([]),
  );

  const secondary: CryptoResolvedAnalysisProfile[] = [];
  const rejectedEvidence: CryptoRejectedProfileEvidence[] = [];
  const selectedProfiles = new Set<CryptoAnalysisProfileId>([primary.profileId]);

  for (const candidate of secondaryCandidates) {
    const binding = resolveCryptoAnalysisProfile(candidate.category);

    if (!isPromotableSecondarySource(candidate.source)) {
      rejectedEvidence.push(Object.freeze({
        category: candidate.category,
        source: candidate.source,
        reason: 'Secondary category evidence is research-only and cannot promote an analysis profile.',
      }));
      continue;
    }

    if (candidate.evidenceRefs.length === 0) {
      rejectedEvidence.push(Object.freeze({
        category: candidate.category,
        source: candidate.source,
        reason: 'Verified secondary profile promotion requires at least one evidence reference.',
      }));
      continue;
    }

    if (binding.binding === 'CONDITIONAL' && !conditionalBindingSatisfied(candidate)) {
      rejectedEvidence.push(Object.freeze({
        category: candidate.category,
        source: candidate.source,
        reason: `Conditional profile ${binding.profileId} requires an explicit semantic qualifier.`,
      }));
      continue;
    }

    if (binding.profileId === 'generic') {
      rejectedEvidence.push(Object.freeze({
        category: candidate.category,
        source: candidate.source,
        reason: 'Generic category evidence does not add a specialized secondary analysis profile.',
      }));
      continue;
    }

    if (selectedProfiles.has(binding.profileId)) continue;

    const resolved = toResolved(
      candidate.category,
      candidate.source,
      candidate.confidence,
      candidate.evidenceRefs,
    );
    secondary.push(resolved);
    selectedProfiles.add(resolved.profileId);
  }

  return Object.freeze({
    resolverVersion: CRYPTO_CATEGORY_PROFILE_RESOLVER_VERSION,
    primary,
    secondary: Object.freeze(secondary),
    rejectedEvidence: Object.freeze(rejectedEvidence),
    analysisReady: primary.sourceStatus === 'SOURCE_DEFINED',
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  });
}
