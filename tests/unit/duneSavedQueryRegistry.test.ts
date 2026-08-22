import { describe, expect, it } from 'vitest';
import {
  deriveDuneAllowedQueryIds,
  resolveDuneSavedQueriesForSymbol,
  resolveDuneSavedQueryContracts,
} from '../../src/platform/MarketData/DuneSavedQueryRegistry';

describe('DuneSavedQueryRegistry', () => {
  const env = {
    DUNE_QUERY_AAVE_ACTIVE_ADDRESSES: '5833540',
    DUNE_QUERY_AAVE_TREASURY: '27230',
    DUNE_QUERY_AAVE_ORACLE_RAW: '',
    DUNE_QUERY_AAVE_ADDRESS_RETENTION: '',
    DUNE_QUERY_AAVE_TOKEN_EMISSIONS: '',
    DUNE_QUERY_AAVE_LP_CONCENTRATION: '',
  } as NodeJS.ProcessEnv;

  it('derives the allowlist only from configured semantic query keys', () => {
    expect(deriveDuneAllowedQueryIds(env)).toEqual([5833540, 27230]);
    expect(deriveDuneAllowedQueryIds(env)).not.toContain(91004);
    expect(deriveDuneAllowedQueryIds(env)).not.toContain(5823857);
  });

  it('keeps unconfigured custom queries out of runtime resolution', () => {
    const resolved = resolveDuneSavedQueriesForSymbol('aave', env);
    expect(resolved).toHaveLength(2);
    expect(resolved.map((item) => item.key)).toEqual([
      'AAVE_ACTIVE_ADDRESSES',
      'AAVE_TREASURY',
    ]);
  });

  it('maps treasury to a raw USD feature and never directly to treasuryToMarketCap', () => {
    const treasury = resolveDuneSavedQueriesForSymbol('AAVE', env)
      .find((item) => item.key === 'AAVE_TREASURY');
    expect(treasury?.expectedColumns).toEqual(['observed_at', 'treasury_usd']);
    expect(treasury?.mappings).toEqual([
      { featureKey: 'protocol.treasuryUsd', column: 'treasury_usd' },
    ]);
    expect(treasury?.mappings.some((mapping) => mapping.featureKey.includes('treasuryToMarketCap'))).toBe(false);
  });

  it('rejects duplicate numeric IDs across semantic query contracts', () => {
    const duplicateEnv = {
      ...env,
      DUNE_QUERY_AAVE_TREASURY: '5833540',
    } as NodeJS.ProcessEnv;
    expect(() => resolveDuneSavedQueryContracts(duplicateEnv)).toThrow('DUNE_QUERY_REGISTRY_DUPLICATE_QUERY_ID');
  });

  it('ignores malformed and non-positive query IDs rather than broadening authority', () => {
    const invalidEnv = {
      ...env,
      DUNE_QUERY_AAVE_ACTIVE_ADDRESSES: '-1',
      DUNE_QUERY_AAVE_TREASURY: 'not-a-query',
    } as NodeJS.ProcessEnv;
    expect(resolveDuneSavedQueryContracts(invalidEnv)).toEqual([]);
  });
});
