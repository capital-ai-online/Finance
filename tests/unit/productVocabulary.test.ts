import { describe, expect, it } from 'vitest';
import { localizeProductCopy } from '../../src/app/presentation/productVocabulary';

describe('product vocabulary', () => {
  it('renames the standalone display word Crypto to Krypto', () => {
    expect(localizeProductCopy('Crypto')).toBe('Krypto');
    expect(localizeProductCopy('Crypto-Score · Crypto / DeFi')).toBe(
      'Krypto-Score · Krypto / DeFi',
    );
  });

  it('preserves technical identifiers and lowercase contract values', () => {
    expect(localizeProductCopy('CryptoScoringEnterprise')).toBe('CryptoScoringEnterprise');
    expect(localizeProductCopy('/api/crypto/score')).toBe('/api/crypto/score');
    expect(localizeProductCopy('crypto')).toBe('crypto');
  });
});
