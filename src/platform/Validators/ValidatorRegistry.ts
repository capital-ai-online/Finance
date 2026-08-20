import {
  REPOSITORY_QUALITY_REQUIRED_DOMAINS,
  type RepositoryQualityAdapter,
  type RepositoryQualityDomain,
} from '../Governance/Contracts/RepositoryQualityEvidence';

export const VALIDATOR_REGISTRY_VERSION = 'validator-registry/1.0.0' as const;

function domainOrder(domain: RepositoryQualityDomain): number {
  const index = REPOSITORY_QUALITY_REQUIRED_DOMAINS.indexOf(domain);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export class ValidatorRegistry {
  private readonly validators = new Map<RepositoryQualityDomain, RepositoryQualityAdapter>();

  constructor(validators: readonly RepositoryQualityAdapter[] = []) {
    this.registerAll(validators);
  }

  register(validator: RepositoryQualityAdapter): this {
    if (this.validators.has(validator.domain)) {
      throw new Error(`[ValidatorRegistry] duplicate validator for domain ${validator.domain}.`);
    }
    this.validators.set(validator.domain, validator);
    return this;
  }

  registerAll(validators: readonly RepositoryQualityAdapter[]): this {
    for (const validator of validators) this.register(validator);
    return this;
  }

  resolve(domain: RepositoryQualityDomain): RepositoryQualityAdapter | undefined {
    return this.validators.get(domain);
  }

  list(): readonly RepositoryQualityAdapter[] {
    return Object.freeze(
      [...this.validators.values()].sort((left, right) => domainOrder(left.domain) - domainOrder(right.domain)),
    );
  }

  domains(): readonly RepositoryQualityDomain[] {
    return Object.freeze(this.list().map((validator) => validator.domain));
  }
}
