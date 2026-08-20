import fs from 'node:fs';
import path from 'node:path';
import type { RepositoryQualityFinding } from '../../Governance/Contracts/RepositoryQualityEvidence';

export const QM_DOCUMENTATION_CONSISTENCY_VALIDATOR_VERSION = 'qm-documentation-consistency-validator/1.3.0' as const;

export interface DocumentationConsistencyReport {
  checkedAt: string;
  compliant: boolean;
  blocking: boolean;
  findings: readonly RepositoryQualityFinding[];
}

function readText(repoRoot: string, relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson<T>(repoRoot: string, relativePath: string): T {
  return JSON.parse(readText(repoRoot, relativePath)) as T;
}

function finding(
  ruleId: string,
  message: string,
  relativePath: string,
  expected?: string,
  actual?: string,
  severity: RepositoryQualityFinding['severity'] = 'error',
): RepositoryQualityFinding {
  return {
    domain: 'documentation-consistency',
    ruleId,
    severity,
    message,
    path: relativePath,
    expected,
    actual,
    evidenceRefs: ['ESS-0005', 'ESS-0012', 'ADR-0014', 'ADR-0096'],
  };
}

function extractEssVersion(content: string): string | null {
  const match = content.match(/\nskill:\s*[\s\S]*?\n\s*version:\s*([^\s]+)[\s\S]*?\ncapital_ai:/);
  return match?.[1]?.trim() ?? null;
}

function extractReadmeVersion(content: string): string | null {
  return content.match(/^Version:\s*([^\s]+)$/m)?.[1]?.trim() ?? null;
}

export function validateQmDocumentationConsistency(
  repoRoot = process.cwd(),
  checkedAt = new Date().toISOString(),
): DocumentationConsistencyReport {
  const findings: RepositoryQualityFinding[] = [];

  const qualityManifestPath = 'src/platform/Quality/manifest.json';
  const validatorsManifestPath = 'src/platform/Validators/manifest.json';
  const qualityReadmePath = 'src/platform/Quality/README.md';
  const essPath = '.ai/skills/ESS-0005-Quality-Center.md';
  const registryPath = '.ai/registry/ess-registry.json';
  const packagePath = 'package.json';

  let qualityManifest: any;
  let validatorsManifest: any;
  let registry: any;
  let packageJson: any;
  let essContent = '';
  let readmeContent = '';

  try { qualityManifest = readJson<any>(repoRoot, qualityManifestPath); }
  catch (error) { findings.push(finding('QM-DOC-001', `Quality manifest unreadable: ${String(error)}`, qualityManifestPath)); }
  try { validatorsManifest = readJson<any>(repoRoot, validatorsManifestPath); }
  catch (error) { findings.push(finding('QM-DOC-002', `Validators manifest unreadable: ${String(error)}`, validatorsManifestPath)); }
  try { registry = readJson<any>(repoRoot, registryPath); }
  catch (error) { findings.push(finding('QM-DOC-003', `ESS registry unreadable: ${String(error)}`, registryPath)); }
  try { packageJson = readJson<any>(repoRoot, packagePath); }
  catch (error) { findings.push(finding('QM-DOC-004', `package.json unreadable: ${String(error)}`, packagePath)); }
  try { essContent = readText(repoRoot, essPath); }
  catch (error) { findings.push(finding('QM-DOC-005', `ESS-0005 unreadable: ${String(error)}`, essPath)); }
  try { readmeContent = readText(repoRoot, qualityReadmePath); }
  catch (error) { findings.push(finding('QM-DOC-006', `Quality README unreadable: ${String(error)}`, qualityReadmePath)); }

  if (qualityManifest && essContent && readmeContent && registry) {
    const manifestVersion = String(qualityManifest.version ?? '');
    const essVersion = extractEssVersion(essContent);
    const readmeVersion = extractReadmeVersion(readmeContent);
    const registryEntry = Array.isArray(registry.entries)
      ? registry.entries.find((entry: any) => entry.id === 'ESS-0005')
      : undefined;
    const registryVersion = registryEntry ? String(registryEntry.version ?? '') : null;

    for (const [label, value, file] of [
      ['ESS-0005', essVersion, essPath],
      ['Quality README', readmeVersion, qualityReadmePath],
      ['ESS registry', registryVersion, registryPath],
    ] as const) {
      if (value !== manifestVersion) {
        findings.push(finding('QM-DOC-010', `${label} version does not match Quality manifest version.`, file, manifestVersion, value ?? 'missing'));
      }
    }
  }

  if (qualityManifest) {
    const contracts = Array.isArray(qualityManifest.contracts) ? qualityManifest.contracts : [];
    for (const contract of [
      'repository-quality-observation/1.1.0',
      'quality-center-contract/1.3.0',
      'chapter12-validator-contract/1.0.0',
      'chapter12-validation-report/1.0.0',
      'fintech-value-chain-quality/1.0.0',
    ]) {
      if (!contracts.includes(contract)) {
        findings.push(finding('QM-DOC-011', `Quality manifest is missing contract ${contract}.`, qualityManifestPath, contract));
      }
    }

    const declaredTests = Array.isArray(qualityManifest.tests) ? qualityManifest.tests : [];
    for (const testPath of declaredTests) {
      if (!fs.existsSync(path.join(repoRoot, testPath))) {
        findings.push(finding('QM-DOC-012', 'Quality manifest declares a missing test file.', qualityManifestPath, testPath));
      }
    }
  }

  if (validatorsManifest) {
    if (validatorsManifest.status === 'unspecified') {
      findings.push(finding('QM-DOC-013', 'Validators manifest still reports unspecified although ValidatorRegistry is implemented.', validatorsManifestPath, 'implemented', 'unspecified'));
    }
    const interfaces = Array.isArray(validatorsManifest.interfaces) ? validatorsManifest.interfaces : [];
    for (const expected of ['ValidatorRegistry', 'Chapter12ValidatorRunner']) {
      if (!interfaces.includes(expected)) {
        findings.push(finding('QM-DOC-014', `Validators manifest does not declare ${expected}.`, validatorsManifestPath, expected));
      }
    }
  }

  if (packageJson) {
    if (packageJson.scripts?.['repository:quality:check'] !== 'tsx scripts/automation/validateRepositoryQuality.ts') {
      findings.push(finding('QM-DOC-015', 'Quality CLI contract and package script are inconsistent.', packagePath, 'tsx scripts/automation/validateRepositoryQuality.ts', String(packageJson.scripts?.['repository:quality:check'] ?? 'missing'));
    }
  }

  const staleClaimPattern = /null Testdateien|kein Code|keine funktionale Spezifikation|5\s+available|3\s+partial|8\s+(?:notAvailable|not available)/i;
  for (const [file, content] of [[essPath, essContent], [qualityReadmePath, readmeContent]] as const) {
    if (content && staleClaimPattern.test(content)) {
      findings.push(finding('QM-DOC-016', 'QM documentation still contains a historical implementation/coverage claim.', file, 'current 16/16 executable validator state', 'historical implementation statement', 'warning'));
    }
  }

  const ordered = findings.sort((left, right) => `${left.ruleId}|${left.path ?? ''}`.localeCompare(`${right.ruleId}|${right.path ?? ''}`));
  return Object.freeze({
    checkedAt,
    compliant: ordered.length === 0,
    blocking: ordered.some((item) => item.severity === 'error'),
    findings: Object.freeze(ordered),
  });
}
