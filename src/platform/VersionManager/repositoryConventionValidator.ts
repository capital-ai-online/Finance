import fs from 'fs';
import path from 'path';

export type RepositoryConventionSeverity = 'error' | 'warning' | 'info';
export type RepositoryConventionMode = 'advisory' | 'strict';

export interface RepositoryConventionFinding {
  ruleId: string;
  severity: RepositoryConventionSeverity;
  path: string;
  message: string;
  expected?: string;
  actual?: string;
}

export interface RepositoryConventionReport {
  checkedAt: string;
  root: string;
  mode: RepositoryConventionMode;
  compliant: boolean;
  blocking: boolean;
  summary: {
    errors: number;
    warnings: number;
    info: number;
    total: number;
  };
  findings: RepositoryConventionFinding[];
}

const PROJECT_NAME = 'capital-ai';
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const ADR_PATTERN = /^ADR-\d{4}(?:_\d+)?-[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;
const ESS_PATTERN = /^ESS-\d{4}(?:-[A-Za-z0-9][A-Za-z0-9._-]*)?\.md$/;
const COMPONENT_PATTERN = /^[A-Z][A-Za-z0-9]*\.tsx$/;
const PLATFORM_DIR_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

function readJson(filePath: string): any | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return undefined;
  }
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
}

function listDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

function walkRelative(root: string, current = root, result: string[] = []): string[] {
  if (!fs.existsSync(current)) return result;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'uploads') continue;
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');
    if (entry.isDirectory()) walkRelative(root, absolute, result);
    else result.push(relative);
  }
  return result;
}

function pushFinding(
  findings: RepositoryConventionFinding[],
  ruleId: string,
  severity: RepositoryConventionSeverity,
  filePath: string,
  message: string,
  expected?: string,
  actual?: string
) {
  findings.push({ ruleId, severity, path: filePath, message, expected, actual });
}

function validatePackageIdentity(root: string, findings: RepositoryConventionFinding[]) {
  const packagePath = path.join(root, 'package.json');
  const lockPath = path.join(root, 'package-lock.json');
  const pkg = readJson(packagePath);
  const lock = readJson(lockPath);

  if (!pkg) {
    pushFinding(findings, 'REPO-PKG-001', 'error', 'package.json', 'package.json fehlt oder ist kein gueltiges JSON.');
    return;
  }

  if (pkg.name !== PROJECT_NAME) {
    pushFinding(findings, 'REPO-PKG-002', 'error', 'package.json', 'Projektname entspricht nicht der verbindlichen CAPITAL-AI Identitaet.', PROJECT_NAME, String(pkg.name));
  }

  if (typeof pkg.version !== 'string' || !SEMVER_PATTERN.test(pkg.version)) {
    pushFinding(findings, 'REPO-PKG-003', 'error', 'package.json', 'Projektversion ist keine gueltige Semantic Version.', 'MAJOR.MINOR.PATCH', String(pkg.version));
  }

  if (!lock) {
    pushFinding(findings, 'REPO-PKG-004', 'warning', 'package-lock.json', 'package-lock.json fehlt oder ist kein gueltiges JSON.');
    return;
  }

  const lockRoot = lock.packages?.[''] ?? {};
  const lockName = lock.name ?? lockRoot.name;
  const lockVersion = lock.version ?? lockRoot.version;

  if (lockName && lockName !== pkg.name) {
    pushFinding(findings, 'REPO-PKG-005', 'error', 'package-lock.json', 'Projektname in package-lock.json ist nicht mit package.json synchron.', String(pkg.name), String(lockName));
  }
  if (lockVersion && lockVersion !== pkg.version) {
    pushFinding(findings, 'REPO-PKG-006', 'error', 'package-lock.json', 'Projektversion in package-lock.json ist nicht mit package.json synchron.', String(pkg.version), String(lockVersion));
  }

  if (lockRoot.name && lockRoot.name !== pkg.name) {
    pushFinding(findings, 'REPO-PKG-007', 'error', 'package-lock.json#packages[""]', 'Root-Paketname im Lockfile ist nicht synchron.', String(pkg.name), String(lockRoot.name));
  }
  if (lockRoot.version && lockRoot.version !== pkg.version) {
    pushFinding(findings, 'REPO-PKG-008', 'error', 'package-lock.json#packages[""]', 'Root-Paketversion im Lockfile ist nicht synchron.', String(pkg.version), String(lockRoot.version));
  }
}

function validateDocumentNaming(root: string, findings: RepositoryConventionFinding[]) {
  const adrDirs = [path.join(root, 'docs', 'adr'), path.join(root, 'docs', 'adr', 'resolved')];
  for (const adrDir of adrDirs) {
    for (const file of listFiles(adrDir).filter(name => name.endsWith('.md') && name.startsWith('ADR-'))) {
      if (!ADR_PATTERN.test(file)) {
        pushFinding(findings, 'REPO-NAME-ADR', 'warning', path.relative(root, path.join(adrDir, file)).replace(/\\/g, '/'), 'ADR-Dateiname verletzt die ADR-Namenskonvention.', 'ADR-0000-kebab-case-title.md', file);
      }
    }
  }

  const skillDir = path.join(root, '.ai', 'skills');
  for (const file of listFiles(skillDir).filter(name => name.startsWith('ESS-') && name.endsWith('.md'))) {
    if (!ESS_PATTERN.test(file)) {
      pushFinding(findings, 'REPO-NAME-ESS', 'warning', `.ai/skills/${file}`, 'ESS-Dateiname verletzt die ESS-Namenskonvention.', 'ESS-0000-Component-Name.md', file);
    }
  }

  const componentsDir = path.join(root, 'src', 'components');
  for (const file of listFiles(componentsDir).filter(name => name.endsWith('.tsx'))) {
    if (!COMPONENT_PATTERN.test(file)) {
      pushFinding(findings, 'REPO-NAME-COMPONENT', 'warning', `src/components/${file}`, 'React-Komponentendatei soll PascalCase verwenden.', 'PascalCase.tsx', file);
    }
  }

  const platformDir = path.join(root, 'src', 'platform');
  for (const dir of listDirectories(platformDir)) {
    if (!PLATFORM_DIR_PATTERN.test(dir)) {
      pushFinding(findings, 'REPO-NAME-PLATFORM', 'warning', `src/platform/${dir}/`, 'Platform-Komponentenverzeichnis soll PascalCase verwenden.', 'PascalCase', dir);
    }
  }
}

function validateCaseCollisions(root: string, findings: RepositoryConventionFinding[]) {
  const seen = new Map<string, string>();
  for (const relative of walkRelative(root)) {
    const normalized = relative.toLocaleLowerCase('en-US');
    const previous = seen.get(normalized);
    if (previous && previous !== relative) {
      pushFinding(findings, 'REPO-CASE-001', 'error', relative, 'Repository enthaelt eine case-insensitive Pfadkollision. Das ist zwischen Linux/Windows/macOS nicht portabel.', previous, relative);
    } else {
      seen.set(normalized, relative);
    }
  }
}

function validateLegacyIdentity(root: string, findings: RepositoryConventionFinding[]) {
  for (const relative of ['package.json', 'package-lock.json', 'metadata.json']) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) continue;
    const content = fs.readFileSync(absolute, 'utf8');
    if (/react-example/i.test(content)) {
      pushFinding(findings, 'REPO-IDENTITY-001', 'error', relative, 'Legacy-Projektidentitaet "react-example" ist in einem verbindlichen Metadatenartefakt enthalten.', 'capital-ai', 'react-example');
    }
  }
}

function validateExceptionRegistry(root: string, findings: RepositoryConventionFinding[]) {
  const registryPath = path.join(root, '.ai', 'registry', 'exception-registry.json');
  const registry = readJson(registryPath);
  if (!registry) {
    pushFinding(findings, 'REPO-EXC-001', 'warning', '.ai/registry/exception-registry.json', 'Enterprise Exception Registry fehlt oder ist unlesbar; Root-Abweichungen koennen nicht governance-konform bewertet werden.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const exception of registry.exceptions ?? []) {
    if (exception.status === 'Time Limited' && exception.expiresAt && exception.expiresAt < today) {
      pushFinding(findings, 'REPO-EXC-002', 'error', String(exception.path ?? 'unknown'), `Enterprise Exception ${exception.id ?? ''} ist abgelaufen.`, `expiresAt >= ${today}`, String(exception.expiresAt));
    }
  }
}

export function validateRepositoryConventions(
  root: string = process.cwd(),
  mode: RepositoryConventionMode = 'advisory'
): RepositoryConventionReport {
  const findings: RepositoryConventionFinding[] = [];

  validatePackageIdentity(root, findings);
  validateDocumentNaming(root, findings);
  validateCaseCollisions(root, findings);
  validateLegacyIdentity(root, findings);
  validateExceptionRegistry(root, findings);

  const summary = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      acc.total += 1;
      return acc;
    },
    { errors: 0, warnings: 0, info: 0, total: 0 }
  );

  const compliant = summary.errors === 0 && summary.warnings === 0;
  const blocking = mode === 'strict' && summary.errors > 0;

  return {
    checkedAt: new Date().toISOString(),
    root,
    mode,
    compliant,
    blocking,
    summary,
    findings
  };
}
