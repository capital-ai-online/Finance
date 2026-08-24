import { createHash } from 'node:crypto';
import {
  normalizeFinTechCoreFixedPoint,
  type FinTechCoreFixedPoint,
} from '../Financial/FixedPoint';
import type { FinTechCoreRiskEvidenceSnapshot } from '../RiskCompliance/RiskComplianceContracts';
import {
  FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
  type FinTechCorePortfolioAllocationProposal,
  type FinTechCorePortfolioEvidenceSnapshot,
} from './PortfolioAllocationContracts';

export const FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION =
  'fintech-core/portfolio-risk-projection/0.1.0' as const;

export type FinTechCorePortfolioRiskProjectionFailureCode =
  | 'PROJECTION_AUTHORITY_INVALID'
  | 'SOURCE_IDENTITY_MISMATCH'
  | 'SOURCE_HASH_INVALID'
  | 'SOURCE_EVIDENCE_MISSING'
  | 'SOURCE_FIXED_POINT_INVALID'
  | 'SOURCE_ACCOUNTING_MISMATCH'
  | 'PROJECTION_TIMESTAMP_INVALID';

export type FinTechCorePortfolioRiskEvidenceFields = Pick<
  FinTechCoreRiskEvidenceSnapshot,
  | 'projectedGrossExposure'
  | 'currentEquity'
  | 'portfolioEvidenceAuthorityId'
  | 'portfolioEvidenceRefs'
>;

export interface FinTechCorePortfolioRiskProjectionAuthority {
  readonly authorityId: string;
  readonly authorityVersion: string;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCorePortfolioRiskProjectionInput {
  readonly proposal: FinTechCorePortfolioAllocationProposal;
  readonly portfolio: FinTechCorePortfolioEvidenceSnapshot;
  readonly projectionAuthority: FinTechCorePortfolioRiskProjectionAuthority;
  readonly projectedAt: string;
}

export interface FinTechCorePortfolioRiskProjectionSuccess {
  readonly status: 'PROJECTED';
  readonly contractVersion: typeof FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION;
  readonly portfolioId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly decisionVersion: string;
  readonly projectionAuthorityId: string;
  readonly projectionAuthorityVersion: string;
  readonly sourcePortfolioValuationAuthorityId: string;
  readonly sourceAllocationInputHash: string;
  readonly sourceAllocationOutputHash: string;
  readonly riskEvidence: FinTechCorePortfolioRiskEvidenceFields;
  readonly projectionHash: string;
  readonly projectedAt: string;
  readonly executionHandoffEligible: false;
}

export interface FinTechCorePortfolioRiskProjectionFailure {
  readonly status: 'NOT_COMPUTABLE';
  readonly code: FinTechCorePortfolioRiskProjectionFailureCode;
  readonly reason: string;
  readonly executionHandoffEligible: false;
}

export type FinTechCorePortfolioRiskProjectionResult =
  | FinTechCorePortfolioRiskProjectionSuccess
  | FinTechCorePortfolioRiskProjectionFailure;

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  const source = value as Readonly<Record<string, unknown>>;
  return Object.keys(source).sort().reduce<Record<string, unknown>>((result, key) => {
    const entry = source[key];
    if (entry !== undefined) result[key] = canonicalize(entry);
    return result;
  }, {});
}

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

function uniqueEvidenceRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([
    ...new Set(groups.flat().map((value) => value.trim()).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right)));
}

function hasEvidence(refs: readonly string[]): boolean {
  return refs.length > 0 && refs.every((ref) => Boolean(ref.trim()));
}

function failure(
  code: FinTechCorePortfolioRiskProjectionFailureCode,
  reason: string,
): FinTechCorePortfolioRiskProjectionFailure {
  return Object.freeze({ status: 'NOT_COMPUTABLE', code, reason, executionHandoffEligible: false });
}

function normalizeAtScale(
  value: FinTechCoreFixedPoint,
  scale: number,
  field: string,
): FinTechCoreFixedPoint {
  const normalized = normalizeFinTechCoreFixedPoint(value, field, {
    allowZero: true,
    allowNegative: false,
  });
  if (normalized.scale !== scale) {
    throw new Error(`${field}.scale must equal proposal.quoteScale=${scale}.`);
  }
  return normalized;
}

/**
 * Projects a validated long-only allocation proposal into only the portfolio-derived fields that
 * FT-5 already expects. This function does not evaluate a risk gate and cannot create APPROVED
 * evidence. The caller must combine these fields with independent peak-equity, liquidity, market
 * freshness and counterparty evidence before invoking the existing deterministic FT-5 gate.
 */
export function projectPortfolioAllocationToRiskEvidence(
  input: FinTechCorePortfolioRiskProjectionInput,
): FinTechCorePortfolioRiskProjectionResult {
  const { proposal, portfolio, projectionAuthority } = input;

  if (
    !projectionAuthority.authorityId.trim()
    || !projectionAuthority.authorityVersion.trim()
    || !hasEvidence(projectionAuthority.evidenceRefs)
  ) {
    return failure(
      'PROJECTION_AUTHORITY_INVALID',
      'Portfolio risk projection requires an explicit authority ID/version and attributable evidenceRefs.',
    );
  }

  if (
    proposal.allocationContractVersion !== FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION
    || !proposal.portfolioId.trim()
    || proposal.portfolioId !== portfolio.portfolioId
    || proposal.quoteAssetId !== portfolio.quoteAssetId
    || !portfolio.evidenceAuthorityId.trim()
  ) {
    return failure(
      'SOURCE_IDENTITY_MISMATCH',
      'Allocation proposal and portfolio valuation identities must match exactly.',
    );
  }

  if (!SHA256_PATTERN.test(proposal.inputHash) || !SHA256_PATTERN.test(proposal.outputHash)) {
    return failure('SOURCE_HASH_INVALID', 'Allocation proposal input/output hashes are invalid.');
  }

  if (
    !hasEvidence(proposal.evidenceRefs)
    || !hasEvidence(portfolio.evidenceRefs)
    || portfolio.positions.some((position) => !hasEvidence(position.evidenceRefs))
  ) {
    return failure(
      'SOURCE_EVIDENCE_MISSING',
      'Allocation and portfolio valuation evidence must remain attributable before FT-5 projection.',
    );
  }

  const projectedAt = Date.parse(input.projectedAt);
  const proposalEvaluatedAt = Date.parse(proposal.evaluatedAt);
  const portfolioObservedAt = Date.parse(portfolio.observedAt);
  if (
    !Number.isFinite(projectedAt)
    || !Number.isFinite(proposalEvaluatedAt)
    || !Number.isFinite(portfolioObservedAt)
    || projectedAt < proposalEvaluatedAt
    || projectedAt < portfolioObservedAt
  ) {
    return failure(
      'PROJECTION_TIMESTAMP_INVALID',
      'Projection timestamp must be valid and not precede the allocation or portfolio evidence.',
    );
  }

  let currentEquity: FinTechCoreFixedPoint;
  let reservedCash: FinTechCoreFixedPoint;
  const targetNotionals: FinTechCoreFixedPoint[] = [];
  try {
    currentEquity = normalizeAtScale(portfolio.totalEquity, proposal.quoteScale, 'portfolio.totalEquity');
    reservedCash = normalizeAtScale(proposal.reservedCashNotional, proposal.quoteScale, 'proposal.reservedCashNotional');
    if (BigInt(currentEquity.atoms) <= 0n) {
      throw new Error('portfolio.totalEquity must be greater than zero.');
    }
    for (const delta of proposal.deltas) {
      targetNotionals.push(normalizeAtScale(
        delta.targetNotional,
        proposal.quoteScale,
        `proposal.deltas[${delta.assetId}].targetNotional`,
      ));
    }
  } catch (error) {
    return failure(
      'SOURCE_FIXED_POINT_INVALID',
      error instanceof Error ? error.message : 'Portfolio risk projection fixed-point input is invalid.',
    );
  }

  if (
    proposal.totalTargetWeightBps + proposal.reservedCashWeightBps !== 10_000
    || proposal.totalTargetWeightBps < 0
    || proposal.reservedCashWeightBps < 0
  ) {
    return failure(
      'SOURCE_ACCOUNTING_MISMATCH',
      'Allocation proposal target and cash weights must sum exactly to 10000 bps.',
    );
  }

  const projectedGrossExposureAtoms = targetNotionals.reduce(
    (sum, value) => sum + BigInt(value.atoms),
    0n,
  );
  if (projectedGrossExposureAtoms + BigInt(reservedCash.atoms) !== BigInt(currentEquity.atoms)) {
    return failure(
      'SOURCE_ACCOUNTING_MISMATCH',
      'Target notionals plus reserved cash must exactly equal current portfolio equity.',
    );
  }

  const allocationOutputCanonical = Object.freeze({
    totalTargetWeightBps: proposal.totalTargetWeightBps,
    reservedCashWeightBps: proposal.reservedCashWeightBps,
    reservedCashNotional: proposal.reservedCashNotional,
    deltas: proposal.deltas.map((delta) => ({
      assetId: delta.assetId,
      currentWeightBps: delta.currentWeightBps,
      targetWeightBps: delta.targetWeightBps,
      currentNotional: delta.currentNotional,
      targetNotional: delta.targetNotional,
      deltaNotional: delta.deltaNotional,
      rebalanceRequired: delta.rebalanceRequired,
      side: delta.side,
    })),
    evidenceRefs: proposal.evidenceRefs,
  });
  const expectedAllocationOutputHash = sha256({
    inputHash: proposal.inputHash,
    output: allocationOutputCanonical,
  });
  if (expectedAllocationOutputHash !== proposal.outputHash) {
    return failure(
      'SOURCE_HASH_INVALID',
      'Allocation proposal output hash does not match the deterministic proposal content.',
    );
  }

  const portfolioEvidenceRefs = uniqueEvidenceRefs(
    projectionAuthority.evidenceRefs,
    proposal.evidenceRefs,
    portfolio.evidenceRefs,
    ...portfolio.positions.map((position) => position.evidenceRefs),
    [`allocation-input:${proposal.inputHash}`, `allocation-output:${proposal.outputHash}`],
  );

  const riskEvidence: FinTechCorePortfolioRiskEvidenceFields = Object.freeze({
    projectedGrossExposure: Object.freeze({
      atoms: projectedGrossExposureAtoms.toString(),
      scale: proposal.quoteScale,
    }),
    currentEquity,
    portfolioEvidenceAuthorityId: projectionAuthority.authorityId.trim(),
    portfolioEvidenceRefs,
  });

  const projectionHash = sha256({
    contractVersion: FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION,
    portfolioId: proposal.portfolioId,
    runId: proposal.runId,
    traceId: proposal.traceId,
    correlationId: proposal.correlationId,
    decisionVersion: proposal.decisionVersion,
    projectionAuthorityId: projectionAuthority.authorityId.trim(),
    projectionAuthorityVersion: projectionAuthority.authorityVersion.trim(),
    sourcePortfolioValuationAuthorityId: portfolio.evidenceAuthorityId.trim(),
    sourceAllocationInputHash: proposal.inputHash,
    sourceAllocationOutputHash: proposal.outputHash,
    riskEvidence,
    projectedAt: input.projectedAt,
  });

  return Object.freeze({
    status: 'PROJECTED',
    contractVersion: FINTECH_CORE_PORTFOLIO_RISK_PROJECTION_CONTRACT_VERSION,
    portfolioId: proposal.portfolioId,
    runId: proposal.runId,
    traceId: proposal.traceId,
    correlationId: proposal.correlationId,
    decisionVersion: proposal.decisionVersion,
    projectionAuthorityId: projectionAuthority.authorityId.trim(),
    projectionAuthorityVersion: projectionAuthority.authorityVersion.trim(),
    sourcePortfolioValuationAuthorityId: portfolio.evidenceAuthorityId.trim(),
    sourceAllocationInputHash: proposal.inputHash,
    sourceAllocationOutputHash: proposal.outputHash,
    riskEvidence,
    projectionHash,
    projectedAt: input.projectedAt,
    executionHandoffEligible: false,
  });
}
