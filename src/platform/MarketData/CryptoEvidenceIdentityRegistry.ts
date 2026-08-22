import type { GoPlusTokenIdentity } from './providers/GoPlusTokenSecurityProvider';
import type { GovernedDuneEvidenceRequest } from '../../services/cryptoExtendedEvidence';

export const CRYPTO_EVIDENCE_IDENTITY_REGISTRY_VERSION = 'crypto-evidence-identity-registry/1.0.0' as const;

export interface CryptoEvidenceIdentityRecord {
  readonly symbol: string;
  /** Exact EVM chain ID + contract identity. Mutually exclusive with goPlusSolanaMintAddress. */
  readonly goPlusEvm?: GoPlusTokenIdentity;
  /** Exact Solana SPL/SPL-2022 mint address. */
  readonly goPlusSolanaMintAddress?: string;
  /** Exact Messari protocol identifier; never fuzzy-matched from a symbol/name. */
  readonly messariProtocolIdentifier?: string;
  /** Optional curated LunarCrush topic override. */
  readonly lunarCrushTopic?: string;
  /** Owner-reviewed saved query IDs and output mappings. */
  readonly dune?: readonly GovernedDuneEvidenceRequest[];
  /** Human-verifiable identity source references, e.g. official project/provider pages. */
  readonly sourceRefs: readonly string[];
  readonly verifiedAt: string;
  readonly reviewedBy: string;
  readonly status: 'VERIFIED' | 'SUSPENDED';
}

/**
 * Canonical registry intentionally starts empty.
 *
 * Contract addresses, Solana mints, provider protocol IDs and Dune query IDs are high-impact
 * identity data. They MUST be added by reviewed repository change with source references; the
 * runtime never guesses these values from ticker symbols. Existing DeFiLlama slug authority in
 * assetRegistry/fetchDefiProtocolEvidence is deliberately not duplicated here.
 */
export const CRYPTO_EVIDENCE_IDENTITY_RECORDS: readonly CryptoEvidenceIdentityRecord[] = Object.freeze([]);

function validateRecord(record: CryptoEvidenceIdentityRecord): void {
  if (!/^[A-Z0-9.=-]{1,20}$/.test(record.symbol)) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_INVALID_SYMBOL:${record.symbol}`);
  }
  if (record.goPlusEvm && record.goPlusSolanaMintAddress) {
    throw new Error(`CRYPTO_EVIDENCE_IDENTITY_AMBIGUOUS_CHAIN:${record.symbol}`);
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
