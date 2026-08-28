const CRYPTO_DISPLAY_TERM = /\bCrypto\b/g;

/**
 * Normalizes German product copy without mutating technical identifiers.
 *
 * Deliberately matches the standalone display word only. Identifiers such as
 * `CryptoScoringEnterprise`, lowercase contract values (`crypto`) and paths
 * remain untouched.
 */
export function localizeProductCopy(value: string): string {
  return value.replace(CRYPTO_DISPLAY_TERM, 'Krypto');
}
