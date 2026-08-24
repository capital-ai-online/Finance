import type { GoPlusTradeSimulationEvidence } from '../../../../MarketData/providers/GoPlusTransactionSimulationProvider';

export const CRYPTO_MEME_HONEYPOT_SIMULATION_EVIDENCE_VERSION =
  'crypto-meme-honeypot-simulation-evidence/0.1.0' as const;

export type CryptoMemeHoneypotSimulationEvidenceStatus =
  | 'READY'
  | 'BLOCKED'
  | 'NOT_COMPUTABLE';

export interface CryptoMemeHoneypotSimulationHardGates {
  readonly buySimulationSuccess: boolean | null;
  readonly sellSimulationSuccess: boolean | null;
}

export interface CryptoMemeHoneypotSimulationEvidence {
  readonly contractVersion: typeof CRYPTO_MEME_HONEYPOT_SIMULATION_EVIDENCE_VERSION;
  readonly status: CryptoMemeHoneypotSimulationEvidenceStatus;
  readonly chainId: string | null;
  readonly tokenAddress: string | null;
  readonly routeAuthorityId: string | null;
  readonly routeAuthorityVersion: string | null;
  readonly hardGates: CryptoMemeHoneypotSimulationHardGates;
  /** Exact keys defined by crypto-meme-research-features/0.3.0. */
  readonly researchFeatureKeys: readonly [
    'risk.buySimulationSuccess',
    'risk.sellSimulationSuccess',
  ];
  readonly evidenceRefs: readonly string[];
  readonly transactionFingerprints: readonly string[];
  readonly evaluatedAt: string;
  readonly reason?: string;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'RESEARCH_EVIDENCE_ONLY';
}

const FEATURE_KEYS: readonly [
  'risk.buySimulationSuccess',
  'risk.sellSimulationSuccess',
] = Object.freeze([
  'risk.buySimulationSuccess',
  'risk.sellSimulationSuccess',
]);

function refs(...groups: Array<readonly string[]>): readonly string[] {
  return Object.freeze([...new Set(groups.flat().map((value) => value.trim()).filter(Boolean))].sort());
}

function result(
  status: CryptoMemeHoneypotSimulationEvidenceStatus,
  evaluatedAt: string,
  hardGates: CryptoMemeHoneypotSimulationHardGates,
  evidenceRefs: readonly string[],
  transactionFingerprints: readonly string[],
  identity: Readonly<{
    chainId: string | null;
    tokenAddress: string | null;
    routeAuthorityId: string | null;
    routeAuthorityVersion: string | null;
  }>,
  reason?: string,
): CryptoMemeHoneypotSimulationEvidence {
  return Object.freeze({
    contractVersion: CRYPTO_MEME_HONEYPOT_SIMULATION_EVIDENCE_VERSION,
    status,
    ...identity,
    hardGates: Object.freeze(hardGates),
    researchFeatureKeys: FEATURE_KEYS,
    evidenceRefs: refs(evidenceRefs),
    transactionFingerprints: Object.freeze([...transactionFingerprints].sort()),
    evaluatedAt,
    ...(reason ? { reason } : {}),
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_EVIDENCE_ONLY' as const,
  });
}

function empty(evaluatedAt: string, reason: string): CryptoMemeHoneypotSimulationEvidence {
  return result(
    'NOT_COMPUTABLE',
    evaluatedAt,
    { buySimulationSuccess: null, sellSimulationSuccess: null },
    [],
    [],
    { chainId: null, tokenAddress: null, routeAuthorityId: null, routeAuthorityVersion: null },
    reason,
  );
}

/**
 * Composes exactly one governed BUY and one governed SELL pre-run observation into the two Meme
 * hard-gate evidence values. Provider availability, token-security flags and risk flags can never
 * manufacture a PASS here. Missing/ambiguous evidence remains NOT_COMPUTABLE.
 */
export function composeMemeHoneypotSimulationEvidence(
  buy: GoPlusTradeSimulationEvidence,
  sell: GoPlusTradeSimulationEvidence,
  evaluatedAt: string,
): CryptoMemeHoneypotSimulationEvidence {
  const evaluationMs = Date.parse(evaluatedAt);
  if (!Number.isFinite(evaluationMs)) {
    return empty(evaluatedAt, 'A valid evaluatedAt timestamp is required.');
  }
  if (buy.kind !== 'BUY' || sell.kind !== 'SELL') {
    return empty(evaluatedAt, 'Exactly one BUY and one SELL simulation evidence record are required.');
  }

  const identityMatches =
    buy.chainId === sell.chainId
    && buy.tokenAddress === sell.tokenAddress
    && buy.routeAuthorityId === sell.routeAuthorityId
    && buy.routeAuthorityVersion === sell.routeAuthorityVersion;
  if (!identityMatches) {
    return empty(evaluatedAt, 'BUY/SELL simulation identity or route authority does not match exactly.');
  }

  const buyRetrievedMs = Date.parse(buy.retrievedAt);
  const sellRetrievedMs = Date.parse(sell.retrievedAt);
  if (
    !Number.isFinite(buyRetrievedMs)
    || !Number.isFinite(sellRetrievedMs)
    || evaluationMs < buyRetrievedMs
    || evaluationMs < sellRetrievedMs
  ) {
    return empty(evaluatedAt, 'Evaluation timestamp must not precede either simulation observation.');
  }

  if (
    buy.status !== 'VERIFIED'
    || sell.status !== 'VERIFIED'
    || !buy.evidenceId
    || !sell.evidenceId
    || buy.executionHandoffEligible !== false
    || sell.executionHandoffEligible !== false
  ) {
    return result(
      'NOT_COMPUTABLE',
      evaluatedAt,
      { buySimulationSuccess: null, sellSimulationSuccess: null },
      refs(buy.routeEvidenceRefs, sell.routeEvidenceRefs),
      [buy.transactionFingerprint, sell.transactionFingerprint],
      {
        chainId: buy.chainId,
        tokenAddress: buy.tokenAddress,
        routeAuthorityId: buy.routeAuthorityId,
        routeAuthorityVersion: buy.routeAuthorityVersion,
      },
      'Both provider observations must be VERIFIED, attributable and non-executable.',
    );
  }

  if (
    buy.tokenBalanceChangeAtoms === null
    || sell.tokenBalanceChangeAtoms === null
    || buy.directionSucceeded === null
    || sell.directionSucceeded === null
  ) {
    return result(
      'NOT_COMPUTABLE',
      evaluatedAt,
      { buySimulationSuccess: null, sellSimulationSuccess: null },
      refs(
        buy.routeEvidenceRefs,
        sell.routeEvidenceRefs,
        [buy.evidenceId, sell.evidenceId],
      ),
      [buy.transactionFingerprint, sell.transactionFingerprint],
      {
        chainId: buy.chainId,
        tokenAddress: buy.tokenAddress,
        routeAuthorityId: buy.routeAuthorityId,
        routeAuthorityVersion: buy.routeAuthorityVersion,
      },
      'Simulation completed without sufficient target-token balance evidence for both directions.',
    );
  }

  const hardGates: CryptoMemeHoneypotSimulationHardGates = Object.freeze({
    buySimulationSuccess: buy.directionSucceeded,
    sellSimulationSuccess: sell.directionSucceeded,
  });
  const status: CryptoMemeHoneypotSimulationEvidenceStatus =
    hardGates.buySimulationSuccess && hardGates.sellSimulationSuccess ? 'READY' : 'BLOCKED';

  return result(
    status,
    evaluatedAt,
    hardGates,
    refs(
      buy.routeEvidenceRefs,
      sell.routeEvidenceRefs,
      [buy.evidenceId, sell.evidenceId],
      [`simulation-fingerprint:${buy.transactionFingerprint}`, `simulation-fingerprint:${sell.transactionFingerprint}`],
    ),
    [buy.transactionFingerprint, sell.transactionFingerprint],
    {
      chainId: buy.chainId,
      tokenAddress: buy.tokenAddress,
      routeAuthorityId: buy.routeAuthorityId,
      routeAuthorityVersion: buy.routeAuthorityVersion,
    },
    status === 'BLOCKED' ? 'At least one governed transaction direction failed simulation.' : undefined,
  );
}
