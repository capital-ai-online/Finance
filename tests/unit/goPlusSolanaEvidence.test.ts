import { describe, expect, it, vi } from 'vitest';
import { GoPlusSolanaTokenSecurityProvider } from '../../src/platform/MarketData/providers/GoPlusSolanaTokenSecurityProvider';
import { adaptGoPlusSolanaEvidence } from '../../src/platform/FinTechCore/Modules/Crypto/Adapters/GoPlusSolanaEvidenceAdapter';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe('SC4 GoPlus Solana free evidence', () => {
  it('uses the keyless Solana endpoint and preserves Solana-specific facts', async () => {
    const mint = 'So11111111111111111111111111111111111111112';
    const fetchImpl = vi.fn(async () => jsonResponse({
      code: 1,
      result: {
        [mint]: {
          trusted_token: '1',
          mintable: { status: '0' },
          freezable: { status: '0' },
          closable: { status: '1' },
          metadata_mutable: { status: '1' },
          balance_mutable_authority: { status: '0' },
          transfer_hook_upgradable: { status: '0' },
          transfer_fee_upgradable: { status: '0' },
          default_account_state_upgradable: { status: '0' },
          transfer_fee: { current_fee_rate: { fee_rate: '25' } },
          holder_count: '1234',
          total_supply: '1000000',
          holders: [{ token_account: 'holder111111111111111111111111111111111', percent: '0.05', is_locked: '0' }],
          lp_holders: [{ token_account: 'lp111111111111111111111111111111111111', percent: '0.7', is_locked: '1' }],
          dex: [{ tvl: '250000' }],
        },
      },
    }));

    const provider = new GoPlusSolanaTokenSecurityProvider({
      env: {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseUrl: 'https://provider.example',
      nowMs: () => Date.parse('2026-08-22T05:00:00.000Z'),
    });

    const result = await provider.getTokenSecurity(mint);
    expect(result.status).toBe('VERIFIED');
    expect(result.mintable).toBe(false);
    expect(result.closable).toBe(true);
    expect(result.currentTransferFeeRateBps).toBe(25);
    expect(result.dexTvlUsd).toBe(250000);

    const call = String(fetchImpl.mock.calls[0]?.[0]);
    expect(call).toContain('/solana/token_security?');
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('does not masquerade Solana-only controls as EVM security fields', () => {
    const evidence = adaptGoPlusSolanaEvidence({
      contractVersion: 'goplus-solana-token-security-evidence/1.0.0',
      status: 'VERIFIED',
      mintAddress: 'So11111111111111111111111111111111111111112',
      retrievedAt: '2026-08-22T05:00:00.000Z',
      evidenceId: 'goplus:solana:e1',
      trustedToken: true,
      defaultAccountState: null,
      nonTransferable: false,
      metadataMutable: true,
      mintable: false,
      freezable: false,
      closable: true,
      transferFeeUpgradable: false,
      defaultAccountStateUpgradable: false,
      balanceMutable: false,
      transferHookUpgradable: false,
      currentTransferFeeRateBps: 25,
      holderCount: 100,
      totalSupply: 1000000,
      topHolders: [],
      lpHolders: [],
      dexTvlUsd: 250000,
    });

    expect(evidence.some(item => item.key === 'security.mintable')).toBe(true);
    expect(evidence.some(item => item.key === 'security.contractIsProxy')).toBe(false);
    expect(evidence.some(item => item.key === 'security.blacklistFunction')).toBe(false);
  });
});
