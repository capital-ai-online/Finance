import { describe, expect, it } from 'vitest';
import { buildCycloneDxSbom, evaluateDependencyPolicy } from '../../scripts/automation/dependencySecurity';

describe('dependency security policy', () => {
  const pkg = {
    name: 'capital-ai',
    version: '0.6.0',
    dependencies: { express: '^5.0.0' },
  };
  const lock = {
    packages: {
      '': { name: 'capital-ai', version: '0.6.0', dependencies: { express: '^5.0.0' } },
      'node_modules/express': {
        version: '5.1.0',
        resolved: 'https://registry.npmjs.org/express/-/express-5.1.0.tgz',
        integrity: 'sha512-test',
      },
      'node_modules/dev-only': { version: '1.0.0', dev: true, integrity: 'sha512-dev' },
    },
  };

  it('accepts locked registry dependencies', () => {
    const result = evaluateDependencyPolicy(pkg, lock);
    expect(result.violations).toEqual([]);
    expect(result.productionDependencyCount).toBe(1);
  });

  it('rejects non-reproducible and remote source specifiers', () => {
    const result = evaluateDependencyPolicy(
      { ...pkg, dependencies: { unsafe: 'git+https://example.invalid/repo.git' } },
      { packages: { '': { dependencies: { unsafe: 'git+https://example.invalid/repo.git' } } } },
    );
    expect(result.violations.some(item => item.includes('unsicherer/nicht reproduzierbarer'))).toBe(true);
  });

  it('builds a CycloneDX 1.5 production SBOM without dev-only components', () => {
    const sbom = buildCycloneDxSbom(pkg, lock, 'urn:uuid:test');
    expect(sbom.bomFormat).toBe('CycloneDX');
    expect(sbom.specVersion).toBe('1.5');
    expect(sbom.metadata.component.name).toBe('capital-ai');
    expect(sbom.components.map((component: any) => component.name)).toContain('express');
    expect(sbom.components.map((component: any) => component.name)).not.toContain('dev-only');
  });
});
