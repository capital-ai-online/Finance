import { describe, expect, it } from 'vitest';
import {
  CHAPTER_12_MANDATORY_VALIDATORS,
  MandatoryValidatorCatalog,
} from '../../src/platform/Validators/MandatoryValidatorCatalog';

describe('MandatoryValidatorCatalog', () => {
  it('represents the exact 16 Chapter-12 mandatory validators without inventing coverage', () => {
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
    expect(snapshot).toMatchObject({ total: 16, available: 5, partial: 3, notAvailable: 8, complete: false });
    expect(snapshot.validators.find((item) => item.name === 'NamingValidator')?.availability).toBe('AVAILABLE');
    expect(snapshot.validators.find((item) => item.name === 'KnowledgeValidator')?.availability).toBe('NOT_AVAILABLE');
    expect(snapshot.validators.find((item) => item.name === 'TwinValidator')?.availability).toBe('NOT_AVAILABLE');
  });

  it('rejects duplicate bindings instead of allowing ambiguous authority', () => {
    const binding = new MandatoryValidatorCatalog().resolve('NamingValidator');
    expect(() => new MandatoryValidatorCatalog([binding, binding])).toThrow(/duplicate binding/);
  });
});
