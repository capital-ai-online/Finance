import { describe, expect, it, vi } from 'vitest';
import {
  GOPLUS_TRANSACTION_SIMULATION_PATH,
  GoPlusTransactionSimulationProvider,
  type GoPlusGovernedTradeSimulationRequest,
  type GoPlusTradeSimulationEvidence,
} from '../../src/platform/MarketData/providers/GoPlusTransactionSimulationProvider';
import { composeMemeHoneypotSimulationEvidence } from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/GoPlusHoneypotSimulationEvidenceAdapter';

const TOKEN = '0x1111111111111111111111111111111111111111';
const FROM = '0x2222222222222222222222222222222222222222';
const ROUTER = '0x3333333333333333333333333333333333333333';
const NOW = '2026-08-24T17:30:00.000Z';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function request(
  kind: 'BUY' | 'SELL',
  overrides: Partial<GoPlusGovernedTradeSimulationRequest> = {},
): GoPlusGovernedTradeSimulationRequest {
  return {
    kind,
    chainId: '1',
    tokenAddress: TOKEN,
    from: FROM,
    to: ROUTER,
    data: '0x1234',
    value: '0',
    routeAuthorityId: 'AUTH-CRYPTO-ROUTE-RESEARCH',
    routeAuthorityVersion: '0.1.0',
    routeEvidenceRefs: ['route:quote:1', 'route:calldata:1'],
    ...overrides,
  };
}

function verifiedEvidence(
  kind: 'BUY' | 'SELL',
  directionSucceeded: boolean | null,
  overrides: Partial<GoPlusTradeSimulationEvidence> = {},
): GoPlusTradeSimulationEvidence {
  return {
    contractVersion: 'goplus-transaction-simulation-evidence/1.0.0',
    status: 'VERIFIED',
    kind,
    chainId: '1',
    tokenAddress: TOKEN,
    routeAuthorityId: 'AUTH-CRYPTO-ROUTE-RESEARCH',
    routeAuthorityVersion: '0.1.0',
    routeEvidenceRefs: ['route:quote:1'],
    transactionFingerprint: `sha256:${(kind === 'BUY' ? 'a' : 'b').repeat(64)}`,
    retrievedAt: NOW,
    evidenceId: `goplus:${kind.toLowerCase()}:1`,
    simulated: true,
    reverted: directionSucceeded === false,
    revertReason: directionSucceeded === false ? 'execution reverted' : null,
    tokenBalanceChangeAtoms: directionSucceeded === null ? null : kind === 'BUY' ? '100' : '-100',
    directionSucceeded,
    riskFlags: [],
    suspiciousAddresses: [],
    executionHandoffEligible: false,
    ...overrides,
  };
}

describe('P1-A GoPlus transaction simulation evidence', () => {
  it('fails closed without the key required by the transaction simulation endpoint', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      jsonResponse({ code: 1, result: {} }));
    const provider = new GoPlusTransactionSimulationProvider({
      env: {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('BUY'));

    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.directionSucceeded).toBeNull();
    expect(result.executionHandoffEligible).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an ungoverned route before transport', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      jsonResponse({ code: 1, result: {} }));
    const provider = new GoPlusTransactionSimulationProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('BUY', {
      routeAuthorityId: '',
      routeEvidenceRefs: [],
    }));

    expect(result.status).toBe('INVALID');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts a governed BUY pre-run only when the target-token delta is positive', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({
      code: 1,
      result: {
        is_simulated: true,
        is_revert: false,
        erc20_balance_changes: [{ token_address: TOKEN, change: '100' }],
        flagged: [],
        suspicious_addresses: [],
      },
    }));
    const provider = new GoPlusTransactionSimulationProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('BUY'));

    expect(result.status).toBe('VERIFIED');
    expect(result.directionSucceeded).toBe(true);
    expect(result.tokenBalanceChangeAtoms).toBe('100');
    expect(result.transactionFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(result.executionHandoffEligible).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(GOPLUS_TRANSACTION_SIMULATION_PATH);
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
  });

  it('accepts a governed SELL pre-run only when the target-token delta is negative', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({
      code: 1,
      result: {
        is_simulated: '1',
        is_revert: '0',
        erc20_balance_changes: [{ token_address: TOKEN, token_balance_change: { change: '-250' } }],
      },
    }));
    const provider = new GoPlusTransactionSimulationProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('SELL'));

    expect(result.status).toBe('VERIFIED');
    expect(result.directionSucceeded).toBe(true);
    expect(result.tokenBalanceChangeAtoms).toBe('-250');
  });

  it('keeps a completed simulation without target-token delta non-computable', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({
      code: 1,
      result: { is_simulated: true, is_revert: false, erc20_balance_changes: [] },
    }));
    const provider = new GoPlusTransactionSimulationProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('BUY'));

    expect(result.status).toBe('VERIFIED');
    expect(result.tokenBalanceChangeAtoms).toBeNull();
    expect(result.directionSucceeded).toBeNull();
  });

  it('treats a provider-confirmed revert as a failed direction, never as missing evidence', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => jsonResponse({
      code: 1,
      result: { is_simulated: true, is_revert: true, revert_reason: 'execution reverted' },
    }));
    const provider = new GoPlusTransactionSimulationProvider({
      apiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse(NOW),
    });

    const result = await provider.simulateTrade(request('SELL'));

    expect(result.status).toBe('VERIFIED');
    expect(result.reverted).toBe(true);
    expect(result.revertReason).toBe('execution reverted');
    expect(result.directionSucceeded).toBe(false);
  });

  it('projects only the two canonical Meme hard-gate keys when BUY and SELL are attributable', () => {
    const result = composeMemeHoneypotSimulationEvidence(
      verifiedEvidence('BUY', true),
      verifiedEvidence('SELL', true),
      '2026-08-24T17:31:00.000Z',
    );

    expect(result.status).toBe('READY');
    expect(result.hardGates).toEqual({ buySimulationSuccess: true, sellSimulationSuccess: true });
    expect(result.researchFeatureKeys).toEqual([
      'risk.buySimulationSuccess',
      'risk.sellSimulationSuccess',
    ]);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.authority).toBe('RESEARCH_EVIDENCE_ONLY');
  });

  it('blocks when one governed direction actually fails', () => {
    const result = composeMemeHoneypotSimulationEvidence(
      verifiedEvidence('BUY', true),
      verifiedEvidence('SELL', false),
      '2026-08-24T17:31:00.000Z',
    );

    expect(result.status).toBe('BLOCKED');
    expect(result.hardGates).toEqual({ buySimulationSuccess: true, sellSimulationSuccess: false });
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('does not manufacture a failed hard gate when provider evidence is incomplete', () => {
    const result = composeMemeHoneypotSimulationEvidence(
      verifiedEvidence('BUY', null),
      verifiedEvidence('SELL', true),
      '2026-08-24T17:31:00.000Z',
    );

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.hardGates).toEqual({ buySimulationSuccess: null, sellSimulationSuccess: null });
  });

  it('rejects BUY/SELL evidence from different route authorities', () => {
    const result = composeMemeHoneypotSimulationEvidence(
      verifiedEvidence('BUY', true),
      verifiedEvidence('SELL', true, { routeAuthorityVersion: '0.2.0' }),
      '2026-08-24T17:31:00.000Z',
    );

    expect(result.status).toBe('NOT_COMPUTABLE');
    expect(result.hardGates.buySimulationSuccess).toBeNull();
    expect(result.hardGates.sellSimulationSuccess).toBeNull();
  });
});
