import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import { MARKET_DATA_HISTORY_CONTRACT_VERSION } from '../../src/platform/MarketData/contracts';
import { buildValidatedHistoryInput } from '../../src/platform/MarketData/ValidatedDataInput';
import {
  PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION,
  validateProviderHistoryInput,
} from '../../src/platform/MarketData/providerInputValidation';

const bond = createUniversalAssetIdentity({ symbol: 'DE10Y', assetClass: 'bond' });

const history = (close: number) => ({
  contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
  provider: 'test-sovereign-yield',
  providerFeed: 'daily-yield',
  symbol: 'DE10Y',
  assetClass: 'bond' as const,
  currency: 'PCT',
  receivedAt: '2026-09-16T12:00:00.000Z',
  qualityState: 'HISTORICAL' as const,
  correlationId: 'corr-de10y-signed-history',
  points: [
    { timestamp: '2026-09-15T12:00:00.000Z', close: -0.25 },
    { timestamp: '2026-09-16T12:00:00.000Z', close },
  ],
  evidenceId: 'evd:test-sovereign-yield:DE10Y:daily-yield',
});

describe('DATA validated history value semantics', () => {
  it('keeps the default history rule price-positive and fail-closed for negative observations', () => {
    const validated = buildValidatedHistoryInput(bond, history(-0.1));

    expect(validated.valueSemantics).toBe('POSITIVE_PRICE');
    expect(validated.status).toBe('FAIL');
    expect(validated.reason).toContain('provider-history-invalid:points');
  });

  it('accepts finite negative sovereign-yield observations only after explicit SIGNED_VALUE opt-in', () => {
    const validated = buildValidatedHistoryInput(bond, history(-0.1), {
      valueSemantics: 'SIGNED_VALUE',
    });

    expect(validated.valueSemantics).toBe('SIGNED_VALUE');
    expect(validated.status).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
    expect(validated.points.map((point) => point.close)).toEqual([-0.25, -0.1]);
  });

  it('still rejects non-finite signed observations', () => {
    const validated = buildValidatedHistoryInput(bond, history(Number.NaN), {
      valueSemantics: 'SIGNED_VALUE',
    });

    expect(validated.status).toBe('FAIL');
  });

  it('makes provider-input semantics explicit without changing snapshot positivity rules', () => {
    const result = validateProviderHistoryInput({
      providerId: 'test-sovereign-yield',
      symbol: 'DE10Y',
      assetClass: 'bond',
      receivedAt: '2026-09-16T12:00:00.000Z',
      correlationId: 'corr-provider-signed-history',
      evidenceRef: 'evd:test-sovereign-yield:DE10Y:daily-yield',
      valueSemantics: 'SIGNED_VALUE',
      points: [{ timestamp: '2026-09-16T12:00:00.000Z', close: -0.1 }],
    });

    expect(result.contractVersion).toBe(PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION);
    expect(PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION).toBe('provider-input-validation/1.1.0');
    expect(result.admissibility).toBe('ADMISSIBLE');
    expect(result.reason).toBe('provider-history-admissible:signed_value');
  });
});
