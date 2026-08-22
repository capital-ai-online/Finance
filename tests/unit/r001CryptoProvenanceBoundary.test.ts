import { describe, expect, it } from 'vitest';
import { CryptoScoringService } from '../../src/services/cryptoScoringService';
import { MemeCoinScoringService } from '../../src/services/memeCoinScoringService';

describe('R-001 crypto provenance boundary', () => {
  it('does not turn BTC AssetRegistry bootstrap values into scoring factors', () => {
    const inputs = CryptoScoringService.generateCryptoInputsSync('BTC', 42);

    expect(inputs).toEqual({ coin: 'BTC' });
    expect(inputs.avg_daily_volume).toBeUndefined();
    expect(inputs.supply_dynamics).toBeUndefined();
    expect(inputs.regime_bonus).toBeUndefined();
  });

  it('does not turn DOGE AssetRegistry market cap and volume into meme liquidity', () => {
    const inputs = MemeCoinScoringService.generateMemeCoinInputsSync('DOGE');

    expect(inputs).toEqual({ coin: 'DOGE' });
    expect(inputs.liquidity).toBeUndefined();
  });

  it('fails closed when no verified factors are supplied', () => {
    const crypto = CryptoScoringService.scoreCrypto({ coin: 'BTC' });
    const meme = MemeCoinScoringService.scoreMemeCoin({ coin: 'DOGE' });

    expect(crypto.final_score).toBe(0);
    expect(crypto.data_quality.level).toBe('unknown');
    expect(crypto.data_quality.missing_fields).toContain('avg_daily_volume');
    expect(crypto.data_quality.missing_fields).toContain('supply_dynamics');
    expect(crypto.data_quality.missing_fields).not.toContain('regime_bonus');
    expect(crypto.data_quality.missing_fields).not.toContain('exchange_liquidity');
    expect(crypto.alerts.some(alert => alert.includes('keine reale Datenquelle'))).toBe(true);

    expect(meme.final_score).toBe(0);
    expect(meme.data_quality.level).toBe('unknown');
    expect(meme.data_quality.missing_fields).toContain('liquidity');
    expect(meme.alerts.some(alert => alert.includes('keine reale Datenquelle'))).toBe(true);
  });
});
