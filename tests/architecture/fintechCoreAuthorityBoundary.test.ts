import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const FOUNDATION_FILES = [
  '../../src/platform/FinTechCore/CoreContracts.ts',
  '../../src/platform/FinTechCore/CoreModuleRegistry.ts',
  '../../src/platform/FinTechCore/CoreEngine.ts',
  '../../src/platform/FinTechCore/CryptoModuleContracts.ts',
  '../../src/platform/FinTechCore/Runtime/WorkflowStateMachine.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/CryptoCoreModule.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryProfileResolver.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/CryptoCategoryFeatureContracts.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/Adapters/VerifiedCryptoSnapshotFeatureAdapter.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternDetectionContracts.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry.ts',
  '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternSignalResolver.ts',
  '../../src/platform/FinTechCore/index.ts',
] as const;

const FORBIDDEN_DIRECT_AUTHORITIES = [
  'verifiedCryptoTechnicalScoring',
  'cryptoScoringService',
  'ScoringExecutorAdapters',
  'generateCryptoScores',
  'calculateBaseScore',
  'calculateDefiScore',
  '@supabase/supabase-js',
  'kraken-api',
] as const;

describe('FinTech Core FT-1/FT-2 authority boundary', () => {
  it('does not import productive domain scorers, database clients or exchange clients directly', () => {
    for (const relativeFile of FOUNDATION_FILES) {
      const source = readFileSync(new URL(relativeFile, import.meta.url), 'utf8');
      for (const forbidden of FORBIDDEN_DIRECT_AUTHORITIES) {
        expect(source, `${relativeFile} must not reference ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('keeps the verified snapshot adapter pure and prevents provider I/O from moving into FinTech Core', () => {
    const source = readFileSync(
      new URL('../../src/platform/FinTechCore/Modules/Crypto/Adapters/VerifiedCryptoSnapshotFeatureAdapter.ts', import.meta.url),
      'utf8',
    );

    expect(source).toContain("import type {");
    expect(source).not.toContain('getVerifiedCryptoSnapshot(');
    expect(source).not.toContain('fetch(');
    expect(source).not.toContain('axios');
  });

  it('keeps FT-2C detector-agnostic and does not silently bind an external TA runtime', () => {
    const patternFiles = [
      '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternDetectionContracts.ts',
      '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternReliabilityRegistry.ts',
      '../../src/platform/FinTechCore/Modules/Crypto/Pattern/PatternSignalResolver.ts',
    ] as const;

    for (const relativeFile of patternFiles) {
      const source = readFileSync(new URL(relativeFile, import.meta.url), 'utf8');
      expect(source).not.toMatch(/from\s+['"](?:talib|technicalindicators|tulind)['"]/i);
      expect(source).not.toContain('OrderIntent');
      expect(source).not.toContain('dispatchCanonicalScore(');
    }
  });

  it('keeps Crypto Module 01 non-live during the foundation phase', () => {
    const source = readFileSync(
      new URL('../../src/platform/FinTechCore/Modules/Crypto/CryptoCoreModule.ts', import.meta.url),
      'utf8',
    );

    expect(source).toContain("supportedOperatingModes: Object.freeze(['RESEARCH', 'PAPER'])");
    expect(source).not.toContain("supportedOperatingModes: Object.freeze(['RESEARCH', 'PAPER', 'GUARDED_LIVE'");
  });
});
