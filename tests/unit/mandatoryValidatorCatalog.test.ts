import { describe, expect, it } from 'vitest';
import {
  CHAPTER_12_MANDATORY_VALIDATORS,
  MandatoryValidatorCatalog,
} from '../../src/platform/Validators/MandatoryValidatorCatalog';

describe('MandatoryValidatorCatalog', () => {
  it('represents the exact 16 Chapter-12 mandatory validators as executable capabilities', () => {
    const snapshot = new MandatoryValidatorCatalog().snapshot();

    expect(CHAPTER_12_MANDATORY_VALIDATORS).toEqual([
      'RepositoryStructureValidator',
      'DirectoryResponsibilityValidator',
      'NamingValidator',
      'LayerValidator',
      'DependencyValidator',
      'InterfaceValidator',
      'ManifestValidator',
      'ComponentValidator',
      'MetadataValidator',
      'DocumentationValidator',
      'EventValidator',
      'VersionValidator',
      'SecurityValidator',
      'ComplianceValidator',
      'KnowledgeValidator',
      'TwinValidator',
    ]);
    expect(snapshot).toMatchObject({ total: 16, available: 16, partial: 0, notAvailable: 0, complete: true });
    expect(snapshot.validators.every((item) => item.availability === 'AVAILABLE')).toBe(true);
    expect(snapshot.validators.every((item) => item.sources.includes('src/platform/Validators/Chapter12ValidatorRunner.ts'))).toBe(true);
  });

  it('rejects duplicate bindings instead of allowing ambiguous authority', () => {
    const binding = new MandatoryValidatorCatalog().resolve('NamingValidator');
    expect(() => new MandatoryValidatorCatalog([binding, binding])).toThrow(/duplicate binding/);
  });
});
