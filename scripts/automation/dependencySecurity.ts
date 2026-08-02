import fs from 'fs';
import path from 'path';

export interface DependencyPolicyResult {
  violations: string[];
  productionDependencyCount: number;
}

function isDisallowedSpecifier(specifier: string): boolean {
  const value = specifier.trim().toLowerCase();
  return value === '*' || value === 'latest' || /^(git\+|git:|https?:|file:|link:)/.test(value);
}

export function evaluateDependencyPolicy(pkg: any, lock: any): DependencyPolicyResult {
  const violations: string[] = [];
  const dependencies: Record<string, string> = pkg?.dependencies ?? {};
  const rootLock = lock?.packages?.[''];

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (typeof specifier !== 'string' || isDisallowedSpecifier(specifier)) {
      violations.push(`${name}: unsicherer/nicht reproduzierbarer Dependency-Specifier '${String(specifier)}'`);
      continue;
    }

    const rootSpecifier = rootLock?.dependencies?.[name];
    if (rootSpecifier !== specifier) {
      violations.push(`${name}: package.json und package-lock Root-Specifier divergieren`);
    }

    const locked = lock?.packages?.[`node_modules/${name}`];
    if (!locked || typeof locked.version !== 'string' || !locked.version) {
      violations.push(`${name}: kein aufgelöster Lockfile-Eintrag mit Version`);
      continue;
    }
    if (!locked.integrity && !locked.resolved?.startsWith('https://registry.npmjs.org/')) {
      violations.push(`${name}@${locked.version}: weder Integrity-Hash noch verifizierbarer npm-Registry-Ursprung im Lockfile`);
    }
  }

  return { violations, productionDependencyCount: Object.keys(dependencies).length };
}

export function buildCycloneDxSbom(pkg: any, lock: any, serialNumber = 'urn:uuid:capital-ai-build'): any {
  const components = Object.entries<any>(lock?.packages ?? {})
    .filter(([packagePath, entry]) => packagePath.startsWith('node_modules/') && entry?.version && entry?.dev !== true)
    .map(([packagePath, entry]) => {
      const name = packagePath.replace(/^node_modules\//, '');
      return {
        type: 'library',
        name,
        version: String(entry.version),
        purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(String(entry.version))}`,
        properties: [
          { name: 'capital-ai:lockfile-path', value: packagePath },
          ...(entry.integrity ? [{ name: 'capital-ai:npm-integrity', value: String(entry.integrity) }] : []),
        ],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      component: {
        type: 'application',
        name: pkg?.name ?? 'unknown',
        version: pkg?.version ?? 'unknown',
      },
      tools: [{ vendor: 'CAPITAL-AI', name: 'dependencySecurity.ts', version: '1.0.0' }],
    },
    components,
  };
}

export function writeCycloneDxSbom(repoRoot: string, pkg: any, lock: any): string {
  const outputDir = path.join(repoRoot, 'dist', 'security');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'sbom.cdx.json');
  const sbom = buildCycloneDxSbom(pkg, lock);
  fs.writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
  return outputPath;
}
