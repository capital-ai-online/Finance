import { describe, expect, it } from 'vitest';
import { buildCycloneDxSbom, evaluateDependencyPolicy } from '../../scripts/automation/dependencySecurity';

describe('dependency security policy', () => {
  const pkg = {
    name: 'capital-ai',
    version: '0.6.0',
    dependencies: { express: '^5.0.0' },
    devDependencies: { vite: '^6.2.3' },
  };
  const lock = {
    packages: {
      '': {
        name: 'capital-ai',
        version: '0.6.0',
        dependencies: { express: '^5.0.0' },
        devDependencies: { vite: '^6.2.3' },
      },
      'node_modules/express': {
        version: '5.1.0',
        resolved: 'https://registry.npmjs.org/express/-/express-5.1.0.tgz',
        integrity: 'sha512-test',
      },
      'node_modules/vite': {
        version: '6.4.3',
        resolved: 'https://registry.npmjs.org/vite/-/vite-6.4.3.tgz',
        integrity: 'sha512-vite',
        dev: true,
      },
      'node_modules/dev-only': { version: '1.0.0', dev: true, integrity: 'sha512-dev' },
    },
  };

  it('accepts locked registry dependencies and patched Vite', () => {
    const result = evaluateDependencyPolicy(pkg, lock);
    expect(result.violations).toEqual([]);
    expect(result.productionDependencyCount).toBe(1);
  });

  it('rejects non-reproducible and remote source specifiers', () => {
    const result = evaluateDependencyPolicy(
      { ...pkg, dependencies: { unsafe: 'git+https://example.invalid/repo.git' } },
      {
        packages: {
          ...lock.packages,
          '': {
            ...lock.packages[''],
            dependencies: { unsafe: 'git+https://example.invalid/repo.git' },
          },
        },
      },
    );
    expect(result.violations.some(item => item.includes('unsicherer/nicht reproduzierbarer'))).toBe(true);
  });

  it('validates devDependencies against the package-lock root metadata', () => {
    const result = evaluateDependencyPolicy(pkg, {
      packages: {
        ...lock.packages,
        '': { ...lock.packages[''], devDependencies: { vite: '^6.4.3' } },
      },
    });
    expect(result.violations).toContain('devDependencies.vite: package.json und package-lock Root-Specifier divergieren');
  });

  it('rejects a vulnerable Vite 6 root lock resolution', () => {
    const result = evaluateDependencyPolicy(pkg, {
      packages: {
        ...lock.packages,
        'node_modules/vite': { ...lock.packages['node_modules/vite'], version: '6.4.2' },
      },
    });
    expect(result.violations.some(item => item.includes('vite@6.4.2 unterschreitet Security Floor 6.4.3'))).toBe(true);
    expect(result.violations.some(item => item.includes('GHSA-fx2h-pf6j-xcff'))).toBe(true);
  });

  it('rejects vulnerable nested Vite copies as well as the root copy', () => {
    const result = evaluateDependencyPolicy(pkg, {
      packages: {
        ...lock.packages,
        'node_modules/tool/node_modules/vite': {
          version: '6.4.1',
          resolved: 'https://registry.npmjs.org/vite/-/vite-6.4.1.tgz',
          integrity: 'sha512-nested-vite',
        },
      },
    });
    expect(
      result.violations.some(item =>
        item.includes('node_modules/tool/node_modules/vite: vite@6.4.1 unterschreitet Security Floor 6.4.3'),
      ),
    ).toBe(true);
  });

  it('fails closed when a governed lockfile version is not valid SemVer', () => {
    const result = evaluateDependencyPolicy(pkg, {
      packages: {
        ...lock.packages,
        'node_modules/vite': { ...lock.packages['node_modules/vite'], version: '6.4.x' },
      },
    });
    expect(result.violations.some(item => item.includes("Sicherheitsversion '6.4.x' ist nicht als SemVer auswertbar"))).toBe(
      true,
    );
  });

  it('builds a CycloneDX 1.5 production SBOM without dev-only components', () => {
    const sbom = buildCycloneDxSbom(pkg, lock, 'urn:uuid:test');
    expect(sbom.bomFormat).toBe('CycloneDX');
    expect(sbom.specVersion).toBe('1.5');
    expect(sbom.metadata.component.name).toBe('capital-ai');
    expect(sbom.components.map((component: any) => component.name)).toContain('express');
    expect(sbom.components.map((component: any) => component.name)).not.toContain('dev-only');
    expect(sbom.components.map((component: any) => component.name)).not.toContain('vite');
  });

  it('embeds source commit and lockfile digest when a source binding is provided (M6)', () => {
    const sbom = buildCycloneDxSbom(pkg, lock, 'urn:uuid:test', {
      sourceCommit: 'abc123',
      packageLockSha256: 'deadbeef',
    });
    const properties = sbom.metadata.properties;
    expect(properties).toContainEqual({ name: 'capital-ai:source-commit', value: 'abc123' });
    expect(properties).toContainEqual({ name: 'capital-ai:package-lock-sha256', value: 'deadbeef' });
  });

  it('omits source binding properties when none is provided', () => {
    const sbom = buildCycloneDxSbom(pkg, lock, 'urn:uuid:test');
    expect(sbom.metadata.properties).toEqual([]);
  });
});
