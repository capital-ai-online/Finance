import type { RepositoryQualityDomain } from '../Governance/Contracts/RepositoryQualityEvidence';

export const MANDATORY_VALIDATOR_CATALOG_VERSION = 'mandatory-validator-catalog/1.1.0' as const;
export const MANDATORY_VALIDATOR_COVERAGE_SCHEMA = 'mandatory-validator-coverage/1.0.0' as const;

export const CHAPTER_12_MANDATORY_VALIDATORS = [
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
] as const;

export type MandatoryValidatorName = typeof CHAPTER_12_MANDATORY_VALIDATORS[number];
export type MandatoryValidatorAvailability = 'AVAILABLE' | 'PARTIAL' | 'NOT_AVAILABLE';

export interface MandatoryValidatorBinding {
  name: MandatoryValidatorName;
  availability: MandatoryValidatorAvailability;
  sources: readonly string[];
  coveredDomains: readonly RepositoryQualityDomain[];
  authorityRefs: readonly string[];
  note: string;
}

export interface MandatoryValidatorCoverageSnapshot {
  schemaVersion: typeof MANDATORY_VALIDATOR_COVERAGE_SCHEMA;
  catalogVersion: typeof MANDATORY_VALIDATOR_CATALOG_VERSION;
  total: 16;
  available: number;
  partial: number;
  notAvailable: number;
  complete: boolean;
  validators: readonly MandatoryValidatorBinding[];
}

const RUNNER_SOURCE = 'src/platform/Validators/Chapter12ValidatorRunner.ts';

const AUTHORITIES: Record<MandatoryValidatorName, readonly string[]> = {
  RepositoryStructureValidator: ['ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 16'],
  DirectoryResponsibilityValidator: ['ESS-0001-CONTRACTS Chapter 3'],
  NamingValidator: ['ESS-0001-CONTRACTS Chapter 5', 'ADR-0076'],
  LayerValidator: ['ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6', 'ESS-0001-CONTRACTS Chapter 16'],
  DependencyValidator: ['ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6'],
  InterfaceValidator: ['ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 7'],
  ManifestValidator: ['ESS-0001-CONTRACTS Chapter 7'],
  ComponentValidator: ['ESS-0001-CONTRACTS Chapter 7'],
  MetadataValidator: ['ESS-0001-CONTRACTS Chapter 7', 'ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12'],
  DocumentationValidator: ['ESS-0001-CONTRACTS Chapter 12', 'ESS-0012', 'ADR-0014'],
  EventValidator: ['ESS-0001-CONTRACTS Chapter 8', 'ESS-0013', 'ADR-0018'],
  VersionValidator: ['ESS-0001-CONTRACTS Chapter 9', 'ESS-0001-CONTRACTS Chapter 12', 'ADR-0030', 'ADR-0096'],
  SecurityValidator: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12', 'ESS-0006', 'ADR-0012'],
  ComplianceValidator: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12', 'ESS-0006', 'ADR-0012'],
  KnowledgeValidator: ['ESS-0001-CONTRACTS Chapter 15', 'ESS-0009'],
  TwinValidator: ['ESS-0001-CONTRACTS Chapter 18'],
};

const DOMAIN_BINDINGS: Partial<Record<MandatoryValidatorName, readonly RepositoryQualityDomain[]>> = {
  NamingValidator: ['repository-conventions'],
  DocumentationValidator: ['documentation-hygiene', 'documentation-consistency'],
  VersionValidator: ['platform-version'],
  SecurityValidator: ['compliance'],
  ComplianceValidator: ['compliance'],
};

const ADDITIONAL_SOURCES: Partial<Record<MandatoryValidatorName, readonly string[]>> = {
  NamingValidator: ['src/platform/VersionManager/repositoryConventionValidator.ts'],
  DocumentationValidator: [
    'src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts',
    'src/platform/Quality/Validators/DocumentationConsistencyValidator.ts',
  ],
  EventValidator: ['src/platform/EventMesh/Events/StandardEventCatalog.ts'],
  VersionValidator: ['src/platform/Release/Services/platformVersionControlPlane.ts'],
  SecurityValidator: ['src/platform/Compliance/scanners.ts'],
  ComplianceValidator: ['src/platform/Compliance/scanners.ts'],
};

const DEFAULT_BINDINGS: readonly MandatoryValidatorBinding[] = Object.freeze(
  CHAPTER_12_MANDATORY_VALIDATORS.map((name) => Object.freeze({
    name,
    availability: 'AVAILABLE' as const,
    sources: Object.freeze([RUNNER_SOURCE, ...(ADDITIONAL_SOURCES[name] ?? [])]),
    coveredDomains: Object.freeze([...(DOMAIN_BINDINGS[name] ?? [])]),
    authorityRefs: Object.freeze([...AUTHORITIES[name]]),
    note: 'Executable Chapter-12 validator is available. Availability describes executable validation capability, not repository conformance; real findings remain PASS/FAIL/NOT_AVAILABLE evidence.',
  })),
);

function freezeBinding(binding: MandatoryValidatorBinding): MandatoryValidatorBinding {
  return Object.freeze({
    ...binding,
    sources: Object.freeze([...binding.sources]),
    coveredDomains: Object.freeze([...binding.coveredDomains]),
    authorityRefs: Object.freeze([...binding.authorityRefs]),
  });
}

export class MandatoryValidatorCatalog {
  private readonly bindings: readonly MandatoryValidatorBinding[];

  constructor(bindings: readonly MandatoryValidatorBinding[] = DEFAULT_BINDINGS) {
    const names = new Set<MandatoryValidatorName>();
    for (const binding of bindings) {
      if (!CHAPTER_12_MANDATORY_VALIDATORS.includes(binding.name)) {
        throw new Error(`[MandatoryValidatorCatalog] unknown Chapter-12 validator ${binding.name}.`);
      }
      if (names.has(binding.name)) {
        throw new Error(`[MandatoryValidatorCatalog] duplicate binding for ${binding.name}.`);
      }
      names.add(binding.name);
    }
    this.bindings = Object.freeze(bindings.map(freezeBinding));
  }

  resolve(name: MandatoryValidatorName): MandatoryValidatorBinding {
    const binding = this.bindings.find((candidate) => candidate.name === name);
    if (binding) return binding;
    return freezeBinding({
      name,
      availability: 'NOT_AVAILABLE',
      sources: [],
      coveredDomains: [],
      authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
      note: 'Mandatory validator has no registered implementation binding.',
    });
  }

  snapshot(): MandatoryValidatorCoverageSnapshot {
    const validators = CHAPTER_12_MANDATORY_VALIDATORS.map((name) => this.resolve(name));
    const available = validators.filter((binding) => binding.availability === 'AVAILABLE').length;
    const partial = validators.filter((binding) => binding.availability === 'PARTIAL').length;
    const notAvailable = validators.filter((binding) => binding.availability === 'NOT_AVAILABLE').length;
    return Object.freeze({
      schemaVersion: MANDATORY_VALIDATOR_COVERAGE_SCHEMA,
      catalogVersion: MANDATORY_VALIDATOR_CATALOG_VERSION,
      total: 16 as const,
      available,
      partial,
      notAvailable,
      complete: available === 16,
      validators: Object.freeze(validators),
    });
  }
}
