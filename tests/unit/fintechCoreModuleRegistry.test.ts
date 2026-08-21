import { describe, expect, it } from 'vitest';
import {
  FINTECH_CORE_CRYPTO_MODULE_ID,
  FinTechCoreModuleRegistry,
  cryptoCoreModule,
  type FinTechCoreModule,
} from '../../src/platform/FinTechCore';

function cloneModule(moduleId: string): FinTechCoreModule {
  return Object.freeze({
    descriptor: Object.freeze({
      ...cryptoCoreModule.descriptor,
      moduleId,
    }),
  });
}

describe('FinTech Core module registry', () => {
  it('resolves Crypto Module 01 for research and paper only', () => {
    const registry = new FinTechCoreModuleRegistry([cryptoCoreModule]);

    expect(registry.resolve({
      assetClass: 'crypto',
      operatingMode: 'RESEARCH',
    })).toMatchObject({
      status: 'RESOLVED',
      module: { descriptor: { moduleId: FINTECH_CORE_CRYPTO_MODULE_ID } },
    });

    expect(registry.resolve({
      moduleId: FINTECH_CORE_CRYPTO_MODULE_ID,
      assetClass: 'crypto',
      operatingMode: 'PAPER',
    }).status).toBe('RESOLVED');
  });

  it('fails closed for live modes before later roadmap gates exist', () => {
    const registry = new FinTechCoreModuleRegistry([cryptoCoreModule]);

    expect(registry.resolve({
      moduleId: FINTECH_CORE_CRYPTO_MODULE_ID,
      assetClass: 'crypto',
      operatingMode: 'GUARDED_LIVE',
    }).status).toBe('MODULE_NOT_AVAILABLE');

    expect(registry.resolve({
      moduleId: FINTECH_CORE_CRYPTO_MODULE_ID,
      assetClass: 'crypto',
      operatingMode: 'PRODUCTION',
    }).status).toBe('MODULE_NOT_AVAILABLE');
  });

  it('fails closed for unsupported asset classes and unknown module ids', () => {
    const registry = new FinTechCoreModuleRegistry([cryptoCoreModule]);

    expect(registry.resolve({
      assetClass: 'stock',
      operatingMode: 'RESEARCH',
    }).status).toBe('MODULE_NOT_AVAILABLE');

    expect(registry.resolve({
      moduleId: 'fintech-core.unknown',
      assetClass: 'crypto',
      operatingMode: 'RESEARCH',
    }).status).toBe('MODULE_NOT_AVAILABLE');
  });

  it('rejects duplicate module ids and ambiguous routing', () => {
    expect(() => new FinTechCoreModuleRegistry([
      cryptoCoreModule,
      cloneModule(FINTECH_CORE_CRYPTO_MODULE_ID),
    ])).toThrow(`FINTECH_CORE_MODULE_DUPLICATE:${FINTECH_CORE_CRYPTO_MODULE_ID}`);

    const ambiguous = new FinTechCoreModuleRegistry([
      cryptoCoreModule,
      cloneModule('fintech-core.crypto-shadow'),
    ]);

    expect(ambiguous.resolve({
      assetClass: 'crypto',
      operatingMode: 'RESEARCH',
    }).status).toBe('MODULE_NOT_AVAILABLE');
  });
});
