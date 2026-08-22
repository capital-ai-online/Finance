import type { GoPlusTokenIdentity } from './providers/GoPlusTokenSecurityProvider';
import type {
  GovernedDexScreenerIdentity,
  GovernedDuneEvidenceRequest,
} from '../../services/cryptoExtendedEvidence';

export const CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION = 'crypto-evidence-identity-registry/1.1.0' as const;

export interface CryptoEvidenceIdentityRecord {
  readonly symbol: string;
  /** Exact EVM chain ID + contract identity. Mutually exclusive with goPlusSolanaMintAddress. */
  readonly goPlusEvm?: GoPlusTokenIdentity;
  /** Exact Solana SPL/SPL-2022 mint address. */
  readonly goPlusSolanaMintAddress?: string;
  /** Exact DEX Screener chain slug + token address. No fuzzy symbol lookup. */
  readonly dexScreener?: GovernedDexScreenerIdentity;
  /** Exact public Kraken Futures Charts market symbol; omitted if the asset has no governed market. */
  readonly krakenFuturesSymbol?: string;
  /** Owner-reviewed Dune saved query IDs, expected schemas and feature mappings. */
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
  /** Human-verifiable identity source references, preferably official project/provider pages. */
  readonly sourceRefs: readonly string[];
  readonly verifiedAt: string;
  readonly reviewedBy: string;
  readonly status: 'VERIFIED' | 'SUSPENDED';
}

/**
 * Canonical registry intentionally starts empty.
 *
 * Contract addresses, Solana mints, DEX token identities, Kraken Futures symbols and Dune query
 * IDs are high-impact identity data. They MUST be added by reviewed repository change with source
 * references; runtime code never guesses these values from ticker symbols. Existing DeFiLlama
 * slug authority in assetRegistry/fetchDefiProtocolEvidence is deliberately not duplicated here.
 */
export const CRYPTO_EVIDENCE_IDENTITY_RECORDS: readonly CryptoEvidenceIdentityRecord[] = Object.freeze([]);

function validateRecord(record: CryptoEvidenceIdentityRecord): void {
  if (!/^[A-Z0-9.=-]{1,20}$/.test(record.symbol)) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_SYMBOL:${record.symbol}`);
  }
  if (record.goPlusEvm && record.goPlusSolanaMintAddress) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_AMBIGUOUS_CHAIN:${record.symbol}`);
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
