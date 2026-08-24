import { createHash } from 'node:crypto';
import {
  FINTECH_CORE_FIXED_POINT_MAX_SCALE,
  normalizeFinTechCoreFixedPoint,
  type FinTechCoreFixedPoint,
} from '../Financial/FixedPoint';
import {
  FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
  type FinTechCorePortfolioAllocationFailure,
  type FinTechCorePortfolioAllocationFailureCode,
  type FinTechCorePortfolioAllocationInput,
  type FinTechCorePortfolioAllocationProposal,
  type FinTechCorePortfolioAllocationResult,
  type FinTechCorePortfolioAllocationStatus,
  type FinTechCorePortfolioPositionEvidence,
  type FinTechCorePortfolioTargetAllocation,
} from './PortfolioAllocationContracts';

const BPS_DENOMINATOR = 10_000n;

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
  status: Exclude<FinTechCorePortfolioAllocationStatus, 'PROPOSED'>,
  code: FinTechCorePortfolioAllocationFailureCode,
  reason: string,
): FinTechCorePortfolioAllocationFailure {
  return Object.freeze({ status, code, reason, executionHandoffEligible: false as const });
}

function validateBps(value: number, field: string, options: Readonly<{ allowZero?: boolean }> = {}): string | null {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    return `${field} must be an integer in [0, 10000].`;
  }
  if (!options.allowZero && value === 0) {
    return `${field} must be greater than zero.`;
  }
  return null;
}

function normalizeAtQuoteScale(
  value: FinTechCoreFixedPoint,
  quoteScale: number,
  field: string,
  options: Readonly<{ allowZero?: boolean }> = {},
): FinTechCoreFixedPoint {
  const normalized = normalizeFinTechCoreFixedPoint(value, field, {
    allowZero: options.allowZero ?? true,
    allowNegative: false,
  });
  if (normalized.scale !== quoteScale) {
    throw new Error(`${field}.scale must equal policy.quoteScale=${quoteScale}.`);
  }
  return normalized;
}

function fixedPoint(atoms: bigint, scale: number): FinTechCoreFixedPoint {
  return Object.freeze({ atoms: atoms.toString(), scale });
}

function multiplyByBps(value: FinTechCoreFixedPoint, bps: number): FinTechCoreFixedPoint {
  const atoms = BigInt(value.atoms);
  return fixedPoint((atoms * BigInt(bps)) / BPS_DENOMINATOR, value.scale);
}

function roundedWeightBps(valueAtoms: bigint, totalAtoms: bigint): number {
  if (totalAtoms <= 0n || valueAtoms <= 0n) return 0;
  return Number((valueAtoms * BPS_DENOMINATOR + totalAtoms / 2n) / totalAtoms);
}

function sortedPositions(
  positions: readonly FinTechCorePortfolioPositionEvidence[],
): readonly FinTechCorePortfolioPositionEvidence[] {
  return [...positions].sort((left, right) => left.assetId.trim().localeCompare(right.assetId.trim()));
}

function sortedTargets(
  targets: readonly FinTechCorePortfolioTargetAllocation[],
): readonly FinTechCorePortfolioTargetAllocation[] {
  return [...targets].sort((left, right) => left.assetId.localeCompare(right.assetId));
}

function workflowContextError(input: FinTechCorePortfolioAllocationInput): string | null {
  const { context } = input;
  if (
    !context.moduleId.trim()
    || !context.runId.trim()
    || !context.traceId.trim()
    || !context.correlationId.trim()
    || !context.decisionVersion.trim()
    || !context.asset.assetId.trim()
    || !Number.isFinite(Date.parse(context.startedAt))
    || !Number.isFinite(Date.parse(input.evaluatedAt))
  ) {
    return 'Workflow context identity/timestamps are incomplete or invalid.';
  }
  if (Date.parse(input.evaluatedAt) < Date.parse(context.startedAt)) {
    return 'Portfolio allocation cannot be evaluated before workflow context.startedAt.';
  }
  return null;
}

/**
 * P1 deterministic portfolio allocation/position-sizing foundation.
 *
 * This function deliberately does not infer target weights from scores, LLM outputs, provider data
 * or an optimizer. It validates externally governed target weights against explicit concentration,
 * deployment and cash-reserve constraints, then produces deterministic notional deltas. The output
 * is never an execution approval: FT-5 Risk/Compliance and FT-6 OrderIntent remain mandatory.
 */
export function evaluateDeterministicPortfolioAllocation(
  input: FinTechCorePortfolioAllocationInput,
): FinTechCorePortfolioAllocationResult {
  const { context, policy, portfolio } = input;

  const contextError = workflowContextError(input);
  if (contextError) {
    return failure('NOT_COMPUTABLE', 'WORKFLOW_CONTEXT_INVALID', contextError);
  }

  if (context.operatingMode !== 'RESEARCH' && context.operatingMode !== 'PAPER') {
    return failure(
      'BLOCKED',
      'MODE_NOT_ALLOWED',
      `Portfolio allocation proposals are limited to RESEARCH/PAPER; received ${context.operatingMode}.`,
    );
  }

  if (!context.portfolioId?.trim()) {
    return failure('NOT_COMPUTABLE', 'PORTFOLIO_ID_REQUIRED', 'Workflow context.portfolioId is required.');
  }
  if (!portfolio.portfolioId.trim() || portfolio.portfolioId !== context.portfolioId) {
    return failure(
      'NOT_COMPUTABLE',
      'PORTFOLIO_ID_MISMATCH',
      'Portfolio snapshot identity must exactly match workflow context.portfolioId.',
    );
  }

  if (
    policy.contractVersion !== FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION
    || !policy.policyId.trim()
    || !policy.policyVersion.trim()
    || !policy.quoteAssetId.trim()
    || !Number.isInteger(policy.quoteScale)
    || policy.quoteScale < 0
    || policy.quoteScale > FINTECH_CORE_FIXED_POINT_MAX_SCALE
  ) {
    return failure('NOT_COMPUTABLE', 'POLICY_INVALID', 'Portfolio allocation policy identity or quote scale is invalid.');
  }
  if (!hasEvidence(policy.evidenceRefs)) {
    return failure('NOT_COMPUTABLE', 'POLICY_EVIDENCE_MISSING', 'Portfolio allocation policy requires attributable evidenceRefs.');
  }
  if (policy.longOnly !== true || policy.leverageAllowed !== false) {
    return failure(
      'BLOCKED',
      'UNSUPPORTED_SHORT_OR_LEVERAGE',
      'P1 supports long-only, unlevered allocation only.',
    );
  }

  const policyBpsErrors = [
    validateBps(policy.maxAssetWeightBps, 'policy.maxAssetWeightBps'),
    validateBps(policy.maxPortfolioDeploymentBps, 'policy.maxPortfolioDeploymentBps', { allowZero: true }),
    validateBps(policy.minCashReserveBps, 'policy.minCashReserveBps', { allowZero: true }),
    validateBps(policy.rebalanceThresholdBps, 'policy.rebalanceThresholdBps', { allowZero: true }),
  ].filter((value): value is string => Boolean(value));
  if (policyBpsErrors.length > 0 || policy.maxPortfolioDeploymentBps + policy.minCashReserveBps > 10_000) {
    return failure(
      'NOT_COMPUTABLE',
      'POLICY_INVALID',
      policyBpsErrors[0] ?? 'maxPortfolioDeploymentBps + minCashReserveBps must not exceed 10000.',
    );
  }

  if (
    portfolio.quoteAssetId !== policy.quoteAssetId
    || !portfolio.evidenceAuthorityId.trim()
    || !Number.isFinite(Date.parse(portfolio.observedAt))
    || Date.parse(portfolio.observedAt) > Date.parse(input.evaluatedAt)
    || !hasEvidence(portfolio.evidenceRefs)
  ) {
    return failure(
      'NOT_COMPUTABLE',
      'PORTFOLIO_EVIDENCE_INVALID',
      'Portfolio evidence identity, timestamps, authority or evidenceRefs are invalid.',
    );
  }

  let totalEquity: FinTechCoreFixedPoint;
  let cashBalance: FinTechCoreFixedPoint;
  try {
    totalEquity = normalizeAtQuoteScale(portfolio.totalEquity, policy.quoteScale, 'portfolio.totalEquity', { allowZero: false });
    cashBalance = normalizeAtQuoteScale(portfolio.cashBalance, policy.quoteScale, 'portfolio.cashBalance');
  } catch (error) {
    return failure(
      'NOT_COMPUTABLE',
      'INVALID_FIXED_POINT',
      error instanceof Error ? error.message : 'Portfolio fixed-point values are invalid.',
    );
  }

  const currentByAsset = new Map<string, Readonly<{ marketValue: FinTechCoreFixedPoint; evidenceRefs: readonly string[] }>>();
  let positionAtoms = 0n;
  for (const position of portfolio.positions) {
    const assetId = position.assetId.trim();
    if (!assetId || currentByAsset.has(assetId)) {
      return failure('NOT_COMPUTABLE', 'DUPLICATE_ASSET', `Portfolio contains duplicate or empty assetId: ${position.assetId}.`);
    }
    if (assetId === policy.quoteAssetId) {
      return failure('NOT_COMPUTABLE', 'QUOTE_ASSET_CONFLICT', 'Quote/cash asset must not also appear as a position.');
    }
    if (!hasEvidence(position.evidenceRefs)) {
      return failure('NOT_COMPUTABLE', 'PORTFOLIO_EVIDENCE_INVALID', `Position ${assetId} requires evidenceRefs.`);
    }
    try {
      const marketValue = normalizeAtQuoteScale(position.marketValue, policy.quoteScale, `portfolio.positions[${assetId}].marketValue`);
      positionAtoms += BigInt(marketValue.atoms);
      currentByAsset.set(assetId, Object.freeze({ marketValue, evidenceRefs: uniqueEvidenceRefs(position.evidenceRefs) }));
    } catch (error) {
      return failure(
        'NOT_COMPUTABLE',
        'INVALID_FIXED_POINT',
        error instanceof Error ? error.message : `Position ${assetId} market value is invalid.`,
      );
    }
  }

  if (positionAtoms + BigInt(cashBalance.atoms) !== BigInt(totalEquity.atoms)) {
    return failure(
      'NOT_COMPUTABLE',
      'PORTFOLIO_BALANCE_MISMATCH',
      'cashBalance + all position market values must exactly equal totalEquity for deterministic P1 sizing.',
    );
  }

  const targetByAsset = new Map<string, FinTechCorePortfolioTargetAllocation>();
  let totalTargetWeightBps = 0;
  for (const target of input.targets) {
    const assetId = target.assetId.trim();
    if (!assetId || targetByAsset.has(assetId)) {
      return failure('NOT_COMPUTABLE', 'DUPLICATE_ASSET', `Targets contain duplicate or empty assetId: ${target.assetId}.`);
    }
    if (assetId === policy.quoteAssetId) {
      return failure('NOT_COMPUTABLE', 'QUOTE_ASSET_CONFLICT', 'Cash reserve is derived and must not be supplied as a target asset.');
    }
    if (!target.targetAuthorityId.trim() || !target.targetAuthorityVersion.trim()) {
      return failure(
        'NOT_COMPUTABLE',
        'TARGET_AUTHORITY_MISSING',
        `Target ${assetId} requires targetAuthorityId and targetAuthorityVersion.`,
      );
    }
    if (!hasEvidence(target.evidenceRefs)) {
      return failure('NOT_COMPUTABLE', 'TARGET_EVIDENCE_MISSING', `Target ${assetId} requires attributable evidenceRefs.`);
    }
    const targetBpsError = validateBps(target.targetWeightBps, `targets[${assetId}].targetWeightBps`, { allowZero: true });
    if (targetBpsError) {
      return failure('NOT_COMPUTABLE', 'TARGET_WEIGHT_INVALID', targetBpsError);
    }
    if (target.targetWeightBps > policy.maxAssetWeightBps) {
      return failure(
        'BLOCKED',
        'TARGET_WEIGHT_EXCEEDS_ASSET_LIMIT',
        `Target ${assetId} weight ${target.targetWeightBps}bps exceeds policy maxAssetWeightBps=${policy.maxAssetWeightBps}.`,
      );
    }
    totalTargetWeightBps += target.targetWeightBps;
    targetByAsset.set(assetId, Object.freeze({
      ...target,
      assetId,
      targetAuthorityId: target.targetAuthorityId.trim(),
      targetAuthorityVersion: target.targetAuthorityVersion.trim(),
      evidenceRefs: uniqueEvidenceRefs(target.evidenceRefs),
    }));
  }

  if (totalTargetWeightBps > policy.maxPortfolioDeploymentBps) {
    return failure(
      'BLOCKED',
      'PORTFOLIO_DEPLOYMENT_EXCEEDED',
      `Target deployment ${totalTargetWeightBps}bps exceeds policy maxPortfolioDeploymentBps=${policy.maxPortfolioDeploymentBps}.`,
    );
  }

  const reservedCashWeightBps = 10_000 - totalTargetWeightBps;
  if (reservedCashWeightBps < policy.minCashReserveBps) {
    return failure(
      'BLOCKED',
      'CASH_RESERVE_VIOLATION',
      `Derived cash reserve ${reservedCashWeightBps}bps is below policy minCashReserveBps=${policy.minCashReserveBps}.`,
    );
  }

  const assetIds = [...new Set([...currentByAsset.keys(), ...targetByAsset.keys()])]
    .sort((left, right) => left.localeCompare(right));
  const totalEquityAtoms = BigInt(totalEquity.atoms);

  const deltas = assetIds.map((assetId) => {
    const current = currentByAsset.get(assetId);
    const target = targetByAsset.get(assetId);
    const currentNotional = current?.marketValue ?? fixedPoint(0n, policy.quoteScale);
    const currentAtoms = BigInt(currentNotional.atoms);
    const targetWeightBps = target?.targetWeightBps ?? 0;
    const targetNotional = multiplyByBps(totalEquity, targetWeightBps);
    const targetAtoms = BigInt(targetNotional.atoms);
    const deltaAtoms = targetAtoms - currentAtoms;
    const currentWeightBps = roundedWeightBps(currentAtoms, totalEquityAtoms);
    const weightDriftBps = Math.abs(targetWeightBps - currentWeightBps);
    const rebalanceRequired = deltaAtoms !== 0n && weightDriftBps >= policy.rebalanceThresholdBps;
    const side = rebalanceRequired ? (deltaAtoms > 0n ? 'BUY' as const : 'SELL' as const) : null;

    return Object.freeze({
      assetId,
      currentWeightBps,
      targetWeightBps,
      currentNotional,
      targetNotional,
      deltaNotional: fixedPoint(deltaAtoms, policy.quoteScale),
      rebalanceRequired,
      side,
      evidenceRefs: uniqueEvidenceRefs(current?.evidenceRefs ?? [], target?.evidenceRefs ?? []),
    });
  });

  const reservedCashNotional = fixedPoint(
    totalEquityAtoms - deltas.reduce((sum, delta) => sum + BigInt(delta.targetNotional.atoms), 0n),
    policy.quoteScale,
  );

  const evidenceRefs = uniqueEvidenceRefs(
    policy.evidenceRefs,
    portfolio.evidenceRefs,
    ...portfolio.positions.map((position) => position.evidenceRefs),
    ...input.targets.map((target) => target.evidenceRefs),
  );

  const inputCanonical = Object.freeze({
    allocationContractVersion: FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    portfolioId: context.portfolioId,
    decisionVersion: context.decisionVersion,
    operatingMode: context.operatingMode,
    policy: {
      policyId: policy.policyId.trim(),
      policyVersion: policy.policyVersion.trim(),
      quoteAssetId: policy.quoteAssetId,
      quoteScale: policy.quoteScale,
      maxAssetWeightBps: policy.maxAssetWeightBps,
      maxPortfolioDeploymentBps: policy.maxPortfolioDeploymentBps,
      minCashReserveBps: policy.minCashReserveBps,
      rebalanceThresholdBps: policy.rebalanceThresholdBps,
      longOnly: policy.longOnly,
      leverageAllowed: policy.leverageAllowed,
      evidenceRefs: uniqueEvidenceRefs(policy.evidenceRefs),
    },
    portfolio: {
      portfolioId: portfolio.portfolioId,
      quoteAssetId: portfolio.quoteAssetId,
      totalEquity,
      cashBalance,
      positions: sortedPositions(portfolio.positions).map((position) => {
        const assetId = position.assetId.trim();
        return {
          assetId,
          marketValue: currentByAsset.get(assetId)?.marketValue,
          evidenceRefs: uniqueEvidenceRefs(position.evidenceRefs),
        };
      }),
      evidenceAuthorityId: portfolio.evidenceAuthorityId.trim(),
      observedAt: portfolio.observedAt,
      evidenceRefs: uniqueEvidenceRefs(portfolio.evidenceRefs),
    },
    targets: sortedTargets([...targetByAsset.values()]).map((target) => ({
      assetId: target.assetId,
      targetWeightBps: target.targetWeightBps,
      targetAuthorityId: target.targetAuthorityId,
      targetAuthorityVersion: target.targetAuthorityVersion,
      evidenceRefs: uniqueEvidenceRefs(target.evidenceRefs),
    })),
    evaluatedAt: input.evaluatedAt,
  });
  const inputHash = sha256(inputCanonical);

  const outputCanonical = Object.freeze({
    totalTargetWeightBps,
    reservedCashWeightBps,
    reservedCashNotional,
    deltas: deltas.map((delta) => ({
      assetId: delta.assetId,
      currentWeightBps: delta.currentWeightBps,
      targetWeightBps: delta.targetWeightBps,
      currentNotional: delta.currentNotional,
      targetNotional: delta.targetNotional,
      deltaNotional: delta.deltaNotional,
      rebalanceRequired: delta.rebalanceRequired,
      side: delta.side,
    })),
    evidenceRefs,
  });

  const proposal: FinTechCorePortfolioAllocationProposal = Object.freeze({
    status: 'PROPOSED',
    allocationContractVersion: FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION,
    portfolioId: context.portfolioId,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    decisionVersion: context.decisionVersion,
    policyId: policy.policyId.trim(),
    policyVersion: policy.policyVersion.trim(),
    quoteAssetId: policy.quoteAssetId,
    quoteScale: policy.quoteScale,
    totalTargetWeightBps,
    reservedCashWeightBps,
    reservedCashNotional,
    deltas: Object.freeze(deltas),
    inputHash,
    outputHash: sha256({ inputHash, output: outputCanonical }),
    evidenceRefs,
    evaluatedAt: input.evaluatedAt,
    executionHandoffEligible: false,
  });

  return proposal;
}
