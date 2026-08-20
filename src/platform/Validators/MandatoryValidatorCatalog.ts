import type { RepositoryQualityDomain } from '../Governance/Contracts/RepositoryQualityEvidence';

export const MANDATORY_VALIDATOR_CATALOG_VERSION = 'mandatory-validator-catalog/1.0.0' as const;
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

const DEFAULT_BINDINGS: readonly MandatoryValidatorBinding[] = Object.freeze([
  {
    name: 'RepositoryStructureValidator',
    availability: 'PARTIAL',
    sources: ['src/platform/VersionManager/repositoryConventionValidator.ts'],
    coveredDomains: ['repository-conventions'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 12', 'ADR-0076', 'ADR-0096'],
    note: 'Existing repository conventions cover naming/collision/integrity subsets, not the full Chapter-2 structure contract.',
  },
  {
    name: 'DirectoryResponsibilityValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 12'],
    note: 'No dedicated executable directory-responsibility validator is currently authoritative.',
  },
  {
    name: 'NamingValidator',
    availability: 'AVAILABLE',
    sources: ['src/platform/VersionManager/repositoryConventionValidator.ts'],
    coveredDomains: ['repository-conventions'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 12', 'ADR-0076', 'ADR-0096'],
    note: 'Existing repository-convention validation supplies executable naming evidence; no naming rules are duplicated here.',
  },
  {
    name: 'LayerValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'Architecture tests exist, but no reusable runtime LayerValidator source is currently authoritative.',
  },
  {
    name: 'DependencyValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'No dedicated reusable runtime DependencyValidator has been identified.',
  },
  {
    name: 'InterfaceValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'No dedicated executable InterfaceValidator has been identified.',
  },
  {
    name: 'ManifestValidator',
    availability: 'PARTIAL',
    sources: ['src/platform/Quality/Validators/DocumentationConsistencyValidator.ts'],
    coveredDomains: ['documentation-consistency'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12', 'ESS-0005', 'ESS-0012', 'ADR-0096'],
    note: 'QM manifest consistency is executable, but this is not a repository-wide ManifestValidator.',
  },
  {
    name: 'ComponentValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'No dedicated executable ComponentValidator has been identified.',
  },
  {
    name: 'MetadataValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'Existing metadata tests do not constitute a reusable runtime MetadataValidator.',
  },
  {
    name: 'DocumentationValidator',
    availability: 'AVAILABLE',
    sources: [
      'src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts',
      'src/platform/Quality/Validators/DocumentationConsistencyValidator.ts',
    ],
    coveredDomains: ['documentation-hygiene', 'documentation-consistency'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12', 'ESS-0012', 'ADR-0014', 'ADR-0096'],
    note: 'Existing Documentary/QM validators supply executable documentation evidence without moving rule authority into Quality.',
  },
  {
    name: 'EventValidator',
    availability: 'PARTIAL',
    sources: [
      'src/platform/EventMesh/Registry/EventRegistry.ts',
      'src/platform/EventMesh/Events/StandardEventCatalog.ts',
    ],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 8', 'ESS-0001-CONTRACTS Chapter 12', 'ESS-0013', 'ADR-0018'],
    note: 'Event registration/catalog enforcement exists, but no complete Chapter-12 EventValidator is exposed as a Quality adapter.',
  },
  {
    name: 'VersionValidator',
    availability: 'AVAILABLE',
    sources: ['src/platform/Release/Services/platformVersionControlPlane.ts'],
    coveredDomains: ['platform-version'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12', 'ADR-0030', 'ADR-0096'],
    note: 'The Release control-plane provides the authoritative read-only version projection.',
  },
  {
    name: 'SecurityValidator',
    availability: 'AVAILABLE',
    sources: ['src/platform/Compliance/scanners.ts#SEC-*'],
    coveredDomains: ['compliance'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12', 'ESS-0006', 'ADR-0012'],
    note: 'Security evidence is sourced from existing SecurityComplianceAuditor SEC scanners; rules remain owned by Security/Compliance.',
  },
  {
    name: 'ComplianceValidator',
    availability: 'AVAILABLE',
    sources: ['src/platform/Compliance/scanners.ts'],
    coveredDomains: ['compliance'],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12', 'ESS-0006', 'ADR-0012'],
    note: 'Existing SecurityComplianceAuditor scanners provide executable compliance evidence.',
  },
  {
    name: 'KnowledgeValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12', 'ESS-0009'],
    note: 'No authoritative executable KnowledgeValidator is currently available.',
  },
  {
    name: 'TwinValidator',
    availability: 'NOT_AVAILABLE',
    sources: [],
    coveredDomains: [],
    authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    note: 'No authoritative executable TwinValidator is currently available.',
  },
]);

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
