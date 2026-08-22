import type { GoPlusTokenIdentity } from './providers/GoPlusTokenSecurityProvider';
import type {
  GovernedDexScreenerIdentity,
  GovernedDuneEvidenceRequest,
} from '../../services/cryptoExtendedEvidence';

export const CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION = 'crypto-evidence-identity-registry/1.3.0' as const;

export interface CryptoEvidenceIdentityRecord {
  readonly symbol: string;
  readonly goPlusEvm?: GoPlusTokenIdentity;
  readonly goPlusSolanaMintAddress?: string;
  readonly dexScreener?: GovernedDexScreenerIdentity;
  /** Exact Binance USD-M futures symbol, e.g. BTCUSDT. */
  readonly binanceFuturesSymbol?: string;
  /** Exact public Kraken Futures Charts market symbol. */
  readonly krakenFuturesSymbol?: string;
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
  readonly sourceRefs: readonly string[];
  readonly verifiedAt: string;
  readonly reviewedBy: string;
  readonly status: 'VERIFIED' | 'SUSPENDED';
}

/**
 * High-impact identities remain review-gated and are never guessed from ticker symbols.
 * Binance/Kraken are both primary suppliers, but exact venue-market identities remain explicit so
 * an asset cannot silently resolve to the wrong perpetual/contract or quote currency.
 *
 * Dune rows below are Owner-supplied query metadata. Runtime admission is still fail-closed:
 * DUNE_ALLOWED_QUERY_IDS must contain the same IDs and DuneQueryEvidenceProvider validates the
 * declared result schema on every read before any value can be projected as VERIFIED evidence.
 */
export const CRYPTO_EVIDENCE_IDENTITY_RECORDS: readonly CryptoEvidenceIdentityRecord[] = Object.freeze([
  Object.freeze({
    symbol: 'AAVE',
    dune: Object.freeze([
      Object.freeze({
        queryId: 5833540,
        expectedColumns: Object.freeze(['observed_at', 'active_addresses']),
        mappings: Object.freeze([
          Object.freeze({ featureKey: 'protocol.activeAddresses24h', column: 'active_addresses' }),
        ]),
      }),
      Object.freeze({
        queryId: 27230,
        expectedColumns: Object.freeze(['observed_at', 'treasury_usd']),
        mappings: Object.freeze([
          // Raw treasury value only. It MUST NOT be treated as treasuryToMarketCap without a
          // separately governed market-cap observation + transform contract.
          Object.freeze({ featureKey: 'protocol.treasuryUsd', column: 'treasury_usd' }),
        ]),
      }),
    ]),
    sourceRefs: Object.freeze([
      'owner-attested:dune:https://dune.com/queries/5833540:Aave:Ethereum:Active Addresses:daily',
      'owner-attested:dune:https://dune.com/queries/27230:Aave:Ethereum:Treasury Value Over Time:daily',
    ]),
    verifiedAt: '2026-08-22T14:03:00.000Z',
    reviewedBy: 'OWNER',
    status: 'VERIFIED' as const,
  }),
]);

function validateRecord(record: CryptoEvidenceIdentityRecord): void {
  if (!/^[A-Z0-9.=-]{1,20}$/.test(record.symbol)) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_SYMBOL:${record.symbol}`);
  }
  if (record.goPlusEvm && record.goPlusSolanaMintAddress) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_AMBIGUOUS_CHAIN:${record.symbol}`);
  }
  if (record.binanceFuturesSymbol && !/^[A-Z0-9_]{5,30}$/.test(record.binanceFuturesSymbol)) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_BINANCE_MARKET:${record.symbol}`);
  }
  if (record.krakenFuturesSymbol && !/^[A-Z0-9_.-]{2,40}$/.test(record.krakenFuturesSymbol)) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_KRAKEN_MARKET:${record.symbol}`);
  }
  if (record.dexScreener) {
    if (!/^[a-z0-9_-]{1,30}$/.test(record.dexScreener.chainId) || record.dexScreener.tokenAddress.length < 20) {
      throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_DEXSCREENER:${record.symbol}`);
    }
  }
  if (record.sourceRefs.length === 0 || !record.verifiedAt || !record.reviewedBy) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_MISSING_GOVERNANCE:${record.symbol}`);
  }
}

for (const record of CRYPTO_EVIDENCE_IDENTITY_RECORDS) validateRecord(record);
if (new Set(CRYPTO_EVIDENCE_IDENTITY_RECORDS.map(record => record.symbol)).size !== CRYPTO_EVIDENCE_IDENTITY_RECORDS.length) {
  throw new Error('CRYPTO_EVIDENCE_IDENTITY_DUPLICATE_SYMBOL');
}

export function resolveCryptoEvidenceIdentity(symbolInput: string): CryptoEvidenceIdentityRecord | null {
  const symbol = symbolInput.toUpperCase().trim();
  const record = CRYPTO_EVIDENCE_IDENTITY_RECORDS.find(item => item.symbol === symbol && item.status === 'VERIFIED');
  return record ?? null;
}
