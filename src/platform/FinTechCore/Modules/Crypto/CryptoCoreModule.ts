import type { FinTechCoreModule, FinTechCoreModuleDescriptor } from '../../CoreContracts';
import { FINTECH_CORE_CRYPTO_MODULE_ID } from '../../CryptoModuleContracts';

export const FINTECH_CORE_CRYPTO_MODULE_VERSION = 'fintech-core.crypto/0.1.0' as const;

export const CRYPTO_CORE_MODULE_DESCRIPTOR: FinTechCoreModuleDescriptor = Object.freeze({
  moduleId: FINTECH_CORE_CRYPTO_MODULE_ID,
  moduleVersion: FINTECH_CORE_CRYPTO_MODULE_VERSION,
  supportedAssetClasses: Object.freeze(['crypto'] as const),
  /**
   * FT-1 deliberately exposes only non-capital-moving modes. Guarded live/production are enabled
   * only in later roadmap phases after durable workflow, risk/compliance and execution contracts exist.
   */
  supportedOperatingModes: Object.freeze(['RESEARCH', 'PAPER'] as const),
});

export const cryptoCoreModule: FinTechCoreModule = Object.freeze({
  descriptor: CRYPTO_CORE_MODULE_DESCRIPTOR,
});
