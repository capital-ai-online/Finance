import fs from 'node:fs';
import path from 'node:path';
import type { RepositoryQualityCheckResult } from '../Governance/Contracts/RepositoryQualityEvidence';
import { STANDARD_EVENT_CATALOG } from '../EventMesh/Events/StandardEventCatalog';
import {
  CHAPTER_12_MANDATORY_VALIDATORS,
  type MandatoryValidatorName,
} from './MandatoryValidatorCatalog';
import {
  CHAPTER_12_VALIDATION_REPORT_SCHEMA,
  CHAPTER_12_VALIDATOR_CONTRACT_VERSION,
  type Chapter12ValidationContext,
  type Chapter12ValidationReport,
  type Chapter12ValidatorFinding,
  type Chapter12ValidatorResult,
  type Chapter12ValidatorSeverity,
  type Chapter12ValidatorStatus,
} from './Chapter12ValidatorContract';

export const CHAPTER_12_VALIDATOR_RUNNER_VERSION = 'chapter12-validator-runner/1.0.0' as const;

const REQUIRED_ROOT_DIRS = ['.ai', 'docs', 'scripts', 'src', 'supabase', 'tests', 'public'] as const;
const REQUIRED_PLATFORM_MODULES = [
  'Core', 'Shared', 'Knowledge', 'Documentary', 'VersionManager', 'Supervisor', 'PlatformDirector',
  'Architecture', 'Discovery', 'Registry', 'Events', 'Contracts', 'Models', 'Interfaces', 'Validators',
  'Generators', 'Plugins', 'Telemetry', 'Quality', 'Security', 'Compliance', 'Release',
] as const;
const CROSS_CUTTING_MODULES = new Set([
  'Architecture', 'Events', 'Contracts', 'Models', 'Interfaces', 'Validators', 'Generators', 'Plugins',
  'Telemetry', 'Quality', 'Security', 'Compliance', 'Release',
]);
const CORE_LAYER_ORDER = ['Core', 'Shared', 'Knowledge', 'Documentary', 'VersionManager', 'Supervisor', 'PlatformDirector'] as const;
const MANIFEST_REQUIRED_FIELDS = [
  'name', 'version', 'status', 'owner', 'description', 'category', 'dependencies', 'interfaces',
  'contracts', 'events', 'knowledge', 'documentation',
] as const;
const METADATA_REQUIRED_FIELDS = ['lifecycle', 'health', 'quality', 'security', 'ai', 'ess', 'adr'] as const;
const QUALITY_AXES = ['documentationScore', 'testScore', 'architectureScore', 'securityScore', 'knowledgeScore', 'metadataScore', 'twinScore'] as const;
const SECURITY_FIELDS = ['classification', 'sensitivity', 'authentication', 'authorization', 'encryption', 'audit', 'compliance', 'lastSecurityReview'] as const;
const KNOWLEDGE_FILES = [
  'repository.json', 'architecture.json', 'components.json', 'interfaces.json', 'services.json', 'events.json',
  'agents.json', 'orchestrators.json', 'database.json', 'api.json', 'security.json', 'documentation.json',
  'dependencies.json', 'workflows.json', 'policies.json', 'versions.json', 'releases.json', 'plugins.json',
  'risks.json', 'graph.json',
] as const;
const TWIN_FILES = ['current.json', 'planned.json', 'drift.json'] as const;
const TWIN_COMPONENT_FIELDS = [
  'twinId', 'componentId', 'version', 'twinVersion', 'sourceChecksum', 'metadataChecksum', 'knowledgeVersion',
  'architectureVersion', 'lifecycle', 'health', 'quality', 'security', 'dependencies', 'interfaces', 'events',
  'documentation', 'lastSynchronizedAt', 'state',
] as const;

interface PlatformManifestRecord {
  module: string;
  path: string;
  absolutePath: string;
  data: Record<string, unknown> | null;
}

function normalize(relative: string): string {
  return relative.replace(/\\/g, '/');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readJson(filePath: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function listDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function walkFiles(dir: string, root = dir, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(absolute, root, out);
    else out.push(normalize(path.relative(root, absolute)));
  }
  return out.sort();
}

function codeFiles(dir: string): string[] {
  return walkFiles(dir).filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.(ts|tsx)$/.test(file) && !/\.d\.ts$/.test(file));
}

function manifests(repoRoot: string): PlatformManifestRecord[] {
  const platformRoot = path.join(repoRoot, 'src', 'platform');
  return listDirectories(platformRoot).map((module) => {
    const absolutePath = path.join(platformRoot, module, 'manifest.json');
    return {
      module,
      path: normalize(path.relative(repoRoot, absolutePath)),
      absolutePath,
      data: fs.existsSync(absolutePath) ? readJson(absolutePath) : null,
    };
  });
}

function severityRank(severity: Chapter12ValidatorSeverity): number {
  return { Information: 0, Low: 1, Medium: 2, High: 3, Critical: 4 }[severity];
}

function aggregateSeverity(findings: readonly Chapter12ValidatorFinding[]): Chapter12ValidatorSeverity {
  return findings.reduce<Chapter12ValidatorSeverity>(
    (current, finding) => severityRank(finding.severity) > severityRank(current) ? finding.severity : current,
    'Information',
  );
}

function result(
  context: Readonly<Chapter12ValidationContext>,
  name: MandatoryValidatorName,
  contract: string,
  scope: string,
  findings: readonly Chapter12ValidatorFinding[],
  evidenceRefs: readonly string[],
  statusOverride?: Chapter12ValidatorStatus,
): Chapter12ValidatorResult {
  const severity = aggregateSeverity(findings);
  const status = statusOverride ?? (severity === 'Critical' || severity === 'High' ? 'FAIL' : 'PASS');
  return Object.freeze({
    validatorId: `CAPITAL-AI-QV-${String(CHAPTER_12_MANDATORY_VALIDATORS.indexOf(name) + 1).padStart(2, '0')}`,
    validatorName: name,
    validatorVersion: CHAPTER_12_VALIDATOR_RUNNER_VERSION,
    contract,
    scope,
    checkedObject: 'SvenKulessa/Finance',
    checkedAt: context.checkedAt,
    status,
    severity,
    findings: Object.freeze([...findings]),
    evidenceRefs: Object.freeze([...evidenceRefs]),
    correlationId: correlationId(context),
  });
}

function finding(ruleId: string, severity: Chapter12ValidatorSeverity, filePath: string | null, message: string, ...evidenceRefs: string[]): Chapter12ValidatorFinding {
  return Object.freeze({ ruleId, severity, path: filePath, message, evidenceRefs: Object.freeze(evidenceRefs) });
}

function correlationId(context: Readonly<Chapter12ValidationContext>): string {
  return `quality:${context.sourceCommit ?? 'working-tree'}`;
}

function arrayOfStrings(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function semver(value: unknown): boolean {
  return typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

function repositoryStructure(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  for (const dir of REQUIRED_ROOT_DIRS) {
    if (!fs.existsSync(path.join(context.repoRoot, dir))) {
      findings.push(finding('QV-REPO-001', 'Critical', dir, `Verbindliches Root-Verzeichnis ${dir} fehlt.`, 'ESS-0001-CONTRACTS Chapter 2'));
    }
  }
  const platformRoot = path.join(context.repoRoot, 'src', 'platform');
  const existing = new Set(listDirectories(platformRoot));
  for (const module of REQUIRED_PLATFORM_MODULES) {
    if (!existing.has(module)) findings.push(finding('QV-REPO-002', 'Critical', `src/platform/${module}`, `Verbindliches Plattformmodul ${module} fehlt.`, 'ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 16'));
  }
  for (const manifest of manifests(context.repoRoot)) {
    if ((REQUIRED_PLATFORM_MODULES as readonly string[]).includes(manifest.module)) continue;
    const adr = arrayOfStrings(manifest.data?.adr);
    if (adr.length === 0) findings.push(finding('QV-REPO-003', 'High', `src/platform/${manifest.module}`, 'Zusaetzliches Plattformmodul besitzt keine ADR-Referenz fuer die Strukturerweiterung.', 'ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 16'));
  }
  return result(context, 'RepositoryStructureValidator', 'ESS-0001-CONTRACTS Chapter 2/16', 'Repository- und Plattformstruktur', findings, ['ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 16']);
}

function directoryResponsibilities(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  for (const manifest of manifests(context.repoRoot)) {
    if (!manifest.data) {
      findings.push(finding('QV-DIR-001', 'High', manifest.path, 'Verzeichnis besitzt kein lesbares manifest.json als maschinenlesbare Verantwortungsbeschreibung.', 'ESS-0001-CONTRACTS Chapter 3', 'ESS-0001-CONTRACTS Chapter 7'));
      continue;
    }
    for (const field of ['description', 'owner', 'category']) {
      if (!hasNonEmptyString(manifest.data[field])) findings.push(finding('QV-DIR-002', 'High', manifest.path, `Directory-Responsibility-Metadatum ${field} fehlt oder ist leer.`, 'ESS-0001-CONTRACTS Chapter 3', 'ESS-0001-CONTRACTS Chapter 7'));
    }
    const moduleRoot = path.dirname(manifest.absolutePath);
    const misplacedTests = walkFiles(moduleRoot).filter((file) => /\.test\.(ts|tsx|js|mjs|cjs)$/.test(file));
    for (const test of misplacedTests) findings.push(finding('QV-DIR-003', 'High', `src/platform/${manifest.module}/${test}`, 'Testdatei liegt ausserhalb des verbindlichen tests/-Bereichs.', 'ESS-0001-CONTRACTS Chapter 2', 'ESS-0001-CONTRACTS Chapter 12'));
  }
  return result(context, 'DirectoryResponsibilityValidator', 'ESS-0001-CONTRACTS Chapter 3', 'Verzeichnisverantwortung und erlaubte Inhalte', findings, ['ESS-0001-CONTRACTS Chapter 3']);
}

function layerValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const records = manifests(context.repoRoot);
  for (const record of records) {
    if (!record.data) continue;
    const deps = arrayOfStrings(record.data.dependencies).map((dep) => dep.split('/').filter(Boolean).at(-1) ?? dep);
    const forbidden = new Set(arrayOfStrings(record.data.forbiddenDependencies).map((dep) => dep.split('/').filter(Boolean).at(-1) ?? dep));
    for (const dep of deps) {
      if (forbidden.has(dep)) findings.push(finding('QV-LAYER-001', 'Critical', record.path, `${record.module} deklariert die zugleich verbotene Abhaengigkeit ${dep}.`, 'ESS-0001-CONTRACTS Chapter 6', 'ESS-0001-CONTRACTS Chapter 16'));
    }
    if (CROSS_CUTTING_MODULES.has(record.module)) {
      const allowed = new Set(['Core', 'Shared']);
      if (record.module === 'Release') ['Registry', 'Knowledge', 'Documentary', 'VersionManager'].forEach((item) => allowed.add(item));
      for (const dep of deps) if (!allowed.has(dep)) findings.push(finding('QV-LAYER-002', 'High', record.path, `Querschnittsmodul ${record.module} haengt von ${dep} ausserhalb seiner Chapter-16-Grenze ab.`, 'ESS-0001-CONTRACTS Chapter 16'));
    }
    const moduleIndex = CORE_LAYER_ORDER.indexOf(record.module as typeof CORE_LAYER_ORDER[number]);
    if (moduleIndex >= 0) {
      for (const dep of deps) {
        const depIndex = CORE_LAYER_ORDER.indexOf(dep as typeof CORE_LAYER_ORDER[number]);
        if (depIndex > moduleIndex) findings.push(finding('QV-LAYER-003', 'Critical', record.path, `Layer-Abhaengigkeit ${record.module} -> ${dep} zeigt nach oben und verletzt die festgelegte Richtung.`, 'ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6'));
      }
    }
  }
  return result(context, 'LayerValidator', 'ESS-0001-CONTRACTS Chapter 4/6/16', 'Layer-Hierarchie und Cross-Cutting-Grenzen', findings, ['ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6', 'ESS-0001-CONTRACTS Chapter 16']);
}

function dependencyValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const records = manifests(context.repoRoot);
  const known = new Set(records.map((item) => item.module));
  const graph = new Map<string, string[]>();
  for (const record of records) {
    if (!record.data) continue;
    const deps = arrayOfStrings(record.data.dependencies).map((dep) => dep.split('/').filter(Boolean).at(-1) ?? dep);
    graph.set(record.module, deps.filter((dep) => known.has(dep)));
    const seen = new Set<string>();
    for (const dep of deps) {
      if (dep === record.module) findings.push(finding('QV-DEP-001', 'Critical', record.path, 'Komponente deklariert eine Selbstabhaengigkeit.', 'ESS-0001-CONTRACTS Chapter 6'));
      if (seen.has(dep)) findings.push(finding('QV-DEP-002', 'High', record.path, `Abhaengigkeit ${dep} ist doppelt deklariert.`, 'ESS-0001-CONTRACTS Chapter 6'));
      seen.add(dep);
      if (!known.has(dep)) findings.push(finding('QV-DEP-003', 'High', record.path, `Deklarierte Plattformabhaengigkeit ${dep} ist nicht aufloesbar.`, 'ESS-0001-CONTRACTS Chapter 6'));
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const walk = (node: string) => {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      const cycle = [...stack.slice(Math.max(0, start)), node].join(' -> ');
      findings.push(finding('QV-DEP-004', 'Critical', `src/platform/${node}/manifest.json`, `Zyklische Plattformabhaengigkeit erkannt: ${cycle}.`, 'ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6'));
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node); stack.push(node);
    for (const dep of graph.get(node) ?? []) walk(dep);
    stack.pop(); visiting.delete(node); visited.add(node);
  };
  for (const node of [...graph.keys()].sort()) walk(node);
  return result(context, 'DependencyValidator', 'ESS-0001-CONTRACTS Chapter 4/6', 'Deklarierte Abhaengigkeiten und Zyklen', findings, ['ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 6']);
}

function interfaceValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const globalInterfaceFiles = codeFiles(path.join(context.repoRoot, 'src', 'platform', 'Interfaces'));
  const globalText = globalInterfaceFiles.map((file) => fs.readFileSync(path.join(context.repoRoot, 'src', 'platform', 'Interfaces', file), 'utf8')).join('\n');
  for (const record of manifests(context.repoRoot)) {
    if (!record.data) continue;
    const declared = arrayOfStrings(record.data.interfaces);
    if (declared.length === 0) continue;
    const moduleRoot = path.dirname(record.absolutePath);
    const moduleText = codeFiles(moduleRoot).map((file) => fs.readFileSync(path.join(moduleRoot, file), 'utf8')).join('\n');
    for (const interfaceName of declared) {
      const escaped = interfaceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b(?:interface|type|class)\\s+${escaped}\\b|\\b${escaped}\\b`);
      if (!pattern.test(moduleText) && !pattern.test(globalText)) findings.push(finding('QV-IFACE-001', 'High', record.path, `Deklariertes Interface ${interfaceName} ist weder im Komponentenquellcode noch unter src/platform/Interfaces nachweisbar.`, 'ESS-0001-CONTRACTS Chapter 4', 'ESS-0001-CONTRACTS Chapter 7'));
    }
  }
  return result(context, 'InterfaceValidator', 'ESS-0001-CONTRACTS Chapter 4', 'Deklarierte Komponenten- und Enterprise-Interfaces', findings, ['ESS-0001-CONTRACTS Chapter 4']);
}

function manifestValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  for (const record of manifests(context.repoRoot)) {
    if (!record.data) {
      findings.push(finding('QV-MAN-001', 'Critical', record.path, 'manifest.json fehlt oder ist ungueltig.', 'ESS-0001-CONTRACTS Chapter 7'));
      continue;
    }
    for (const field of MANIFEST_REQUIRED_FIELDS) {
      if (!(field in record.data)) findings.push(finding('QV-MAN-002', 'High', record.path, `Pflichtfeld ${field} fehlt im Manifest.`, 'ESS-0001-CONTRACTS Chapter 7'));
    }
    if (!semver(record.data.version)) findings.push(finding('QV-MAN-003', 'High', record.path, 'Manifest-Version ist keine Semantic Version.', 'ESS-0001-CONTRACTS Chapter 7', 'ESS-0001-CONTRACTS Chapter 9'));
    if (!isRecord(record.data.events) || !Array.isArray(record.data.events.produces) || !Array.isArray(record.data.events.consumes)) findings.push(finding('QV-MAN-004', 'High', record.path, 'events muss produces[] und consumes[] bereitstellen.', 'ESS-0001-CONTRACTS Chapter 7', 'ESS-0001-CONTRACTS Chapter 8'));
    for (const field of ['dependencies', 'interfaces', 'contracts', 'knowledge', 'documentation']) if (!Array.isArray(record.data[field])) findings.push(finding('QV-MAN-005', 'High', record.path, `Manifestfeld ${field} muss eine Liste sein.`, 'ESS-0001-CONTRACTS Chapter 7'));
  }
  return result(context, 'ManifestValidator', 'ESS-0001-CONTRACTS Chapter 7', 'Repositoryweite Manifest-Schema-Pruefung', findings, ['ESS-0001-CONTRACTS Chapter 7']);
}

function componentValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  for (const record of manifests(context.repoRoot)) {
    const moduleRoot = path.join(context.repoRoot, 'src', 'platform', record.module);
    for (const required of ['README.md', 'CHANGELOG.md', 'component.yaml']) if (!fs.existsSync(path.join(moduleRoot, required))) findings.push(finding('QV-COMP-001', 'High', `src/platform/${record.module}/${required}`, `${required} fehlt fuer die Enterprise-Komponente.`, 'ESS-0001-CONTRACTS Chapter 7'));
    if (!record.data) continue;
    const status = String(record.data.status ?? '');
    const count = codeFiles(moduleRoot).length;
    if (status === 'unspecified' && count > 0) findings.push(finding('QV-COMP-002', 'High', record.path, `Status unspecified widerspricht ${count} realen Code-Dateien.`, 'ESS-0001-CONTRACTS Chapter 7'));
    if (['implemented', 'development', 'core-implementation', 'implemented-core-registry'].includes(status) && count === 0) findings.push(finding('QV-COMP-003', 'High', record.path, `Status ${status} behauptet Implementierung, aber es existiert kein produktiver TypeScript-Code.`, 'ESS-0001-CONTRACTS Chapter 7'));
  }
  return result(context, 'ComponentValidator', 'ESS-0001-CONTRACTS Chapter 7', 'Komponentenartefakte und Implementierungsstatus', findings, ['ESS-0001-CONTRACTS Chapter 7']);
}

function metadataValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  for (const record of manifests(context.repoRoot)) {
    if (!record.data) continue;
    for (const field of METADATA_REQUIRED_FIELDS) if (!(field in record.data)) findings.push(finding('QV-META-001', 'High', record.path, `Enterprise-Metadatum ${field} fehlt.`, 'ESS-0001-CONTRACTS Chapter 7'));
    if (!Array.isArray(record.data.ess) || arrayOfStrings(record.data.ess).length === 0) findings.push(finding('QV-META-002', 'High', record.path, 'ESS-Referenzen fehlen.', 'ESS-0001-CONTRACTS Chapter 7'));
    if (!Array.isArray(record.data.adr)) findings.push(finding('QV-META-003', 'High', record.path, 'ADR-Referenzen muessen als Liste vorliegen.', 'ESS-0001-CONTRACTS Chapter 7'));
    const quality = record.data.quality;
    if (!isRecord(quality)) findings.push(finding('QV-META-004', 'High', record.path, 'Quality-Metadaten fehlen oder sind ungueltig.', 'ESS-0001-CONTRACTS Chapter 7', 'ESS-0001-CONTRACTS Chapter 12'));
    else for (const axis of QUALITY_AXES) {
      const value = quality[axis];
      if (value !== null && (typeof value !== 'number' || value < 0 || value > 100)) findings.push(finding('QV-META-005', 'High', record.path, `Quality-Achse ${axis} muss null oder 0..100 sein.`, 'ESS-0001-CONTRACTS Chapter 12'));
    }
    const security = record.data.security;
    if (!isRecord(security)) findings.push(finding('QV-META-006', 'High', record.path, 'Security-Metadaten fehlen oder sind ungueltig.', 'ESS-0001-CONTRACTS Chapter 11'));
    else for (const field of SECURITY_FIELDS) if (!(field in security)) findings.push(finding('QV-META-007', 'High', record.path, `Security-Metadatum ${field} fehlt.`, 'ESS-0001-CONTRACTS Chapter 11'));
  }
  return result(context, 'MetadataValidator', 'ESS-0001-CONTRACTS Chapter 7/11/12', 'Enterprise-, Quality- und Security-Metadaten', findings, ['ESS-0001-CONTRACTS Chapter 7', 'ESS-0001-CONTRACTS Chapter 11', 'ESS-0001-CONTRACTS Chapter 12']);
}

function eventValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const catalogNames = new Set<string>();
  for (const event of STANDARD_EVENT_CATALOG) {
    if (catalogNames.has(event.name)) findings.push(finding('QV-EVENT-001', 'Critical', 'src/platform/EventMesh/Events/StandardEventCatalog.ts', `Doppelter Event-Katalogeintrag ${event.name}.`, 'ESS-0001-CONTRACTS Chapter 8'));
    catalogNames.add(event.name);
    if (!event.name.endsWith('Event')) findings.push(finding('QV-EVENT-002', 'High', 'src/platform/EventMesh/Events/StandardEventCatalog.ts', `Event ${event.name} verletzt das verbindliche Event-Suffix.`, 'ESS-0001-CONTRACTS Chapter 8'));
    if (event.essReferences.length === 0 || event.adrReferences.length === 0) findings.push(finding('QV-EVENT-003', 'High', 'src/platform/EventMesh/Events/StandardEventCatalog.ts', `Event ${event.name} besitzt unvollstaendige ESS-/ADR-Referenzen.`, 'ESS-0001-CONTRACTS Chapter 8'));
  }
  for (const record of manifests(context.repoRoot)) {
    if (!record.data || !isRecord(record.data.events)) continue;
    const names = [...arrayOfStrings(record.data.events.produces), ...arrayOfStrings(record.data.events.consumes)];
    for (const name of names) {
      if (!name.endsWith('Event')) findings.push(finding('QV-EVENT-004', 'High', record.path, `Deklariertes Ereignis ${name} endet nicht auf Event.`, 'ESS-0001-CONTRACTS Chapter 8'));
      if (!catalogNames.has(name)) findings.push(finding('QV-EVENT-005', 'High', record.path, `Deklariertes Ereignis ${name} fehlt im StandardEventCatalog.`, 'ESS-0001-CONTRACTS Chapter 8', 'ESS-0013'));
    }
  }
  return result(context, 'EventValidator', 'ESS-0001-CONTRACTS Chapter 8', 'Event-Namen, Registry und Manifestbindungen', findings, ['ESS-0001-CONTRACTS Chapter 8', 'ESS-0013']);
}

function knowledgeValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const knowledgeRoot = path.join(context.repoRoot, '.ai', 'knowledge');
  if (!fs.existsSync(knowledgeRoot)) return result(context, 'KnowledgeValidator', 'ESS-0001-CONTRACTS Chapter 15', 'Enterprise Knowledge Graph', [finding('QV-KNOW-001', 'High', '.ai/knowledge', 'Verbindlicher Knowledge-Graph-Speicher fehlt.', 'ESS-0001-CONTRACTS Chapter 15')], ['ESS-0001-CONTRACTS Chapter 15']);
  for (const file of KNOWLEDGE_FILES) {
    const absolute = path.join(knowledgeRoot, file);
    if (!fs.existsSync(absolute)) findings.push(finding('QV-KNOW-002', 'High', `.ai/knowledge/${file}`, 'Verbindliche Knowledge-Datei fehlt.', 'ESS-0001-CONTRACTS Chapter 15'));
    else if (!readJson(absolute)) findings.push(finding('QV-KNOW-003', 'High', `.ai/knowledge/${file}`, 'Knowledge-Datei ist kein gueltiges JSON-Objekt.', 'ESS-0001-CONTRACTS Chapter 15'));
  }
  const graph = readJson(path.join(knowledgeRoot, 'graph.json'));
  if (graph) {
    const nodes = Array.isArray(graph.nodes) ? graph.nodes.filter(isRecord) : [];
    const relationships = Array.isArray(graph.relationships) ? graph.relationships.filter(isRecord) : [];
    const ids = new Set<string>();
    for (const node of nodes) {
      const id = typeof node.id === 'string' ? node.id : '';
      if (!id) findings.push(finding('QV-KNOW-004', 'High', '.ai/knowledge/graph.json', 'Knowledge-Knoten ohne ID erkannt.', 'ESS-0001-CONTRACTS Chapter 15'));
      else if (ids.has(id)) findings.push(finding('QV-KNOW-005', 'Critical', '.ai/knowledge/graph.json', `Doppelte Knowledge-Knoten-ID ${id}.`, 'ESS-0001-CONTRACTS Chapter 15'));
      else ids.add(id);
      if (!hasNonEmptyString(node.source) && !hasNonEmptyString(node.origin)) findings.push(finding('QV-KNOW-006', 'High', '.ai/knowledge/graph.json', `Knowledge-Knoten ${id || '<unknown>'} besitzt keinen Ursprung.`, 'ESS-0001-CONTRACTS Chapter 15'));
    }
    for (const relationship of relationships) {
      const source = String(relationship.source ?? ''); const target = String(relationship.target ?? '');
      if (!ids.has(source) || !ids.has(target)) findings.push(finding('QV-KNOW-007', 'High', '.ai/knowledge/graph.json', `Knowledge-Beziehung ${source} -> ${target} verweist auf einen unbekannten Endpunkt.`, 'ESS-0001-CONTRACTS Chapter 15'));
      if (relationship.confidence === 'Assumed') findings.push(finding('QV-KNOW-008', 'Critical', '.ai/knowledge/graph.json', 'Assumed-Beziehung ist im Enterprise Knowledge Graph nicht zulaessig.', 'ESS-0001-CONTRACTS Chapter 15'));
    }
  }
  return result(context, 'KnowledgeValidator', 'ESS-0001-CONTRACTS Chapter 15', 'Knowledge-Dateien, Knoten, Beziehungen und Urspruenge', findings, ['ESS-0001-CONTRACTS Chapter 15']);
}

function twinValidation(context: Readonly<Chapter12ValidationContext>): Chapter12ValidatorResult {
  const findings: Chapter12ValidatorFinding[] = [];
  const twinRoot = path.join(context.repoRoot, '.ai', 'knowledge', 'twin');
  if (!fs.existsSync(twinRoot)) return result(context, 'TwinValidator', 'ESS-0001-CONTRACTS Chapter 18', 'Enterprise Digital Twin', [finding('QV-TWIN-001', 'High', '.ai/knowledge/twin', 'Verbindlicher Digital-Twin-Speicher fehlt.', 'ESS-0001-CONTRACTS Chapter 18')], ['ESS-0001-CONTRACTS Chapter 18']);
  for (const file of TWIN_FILES) {
    const absolute = path.join(twinRoot, file);
    if (!fs.existsSync(absolute)) findings.push(finding('QV-TWIN-002', 'High', `.ai/knowledge/twin/${file}`, 'Verbindliche Twin-Datei fehlt.', 'ESS-0001-CONTRACTS Chapter 18'));
  }
  if (!fs.existsSync(path.join(twinRoot, 'history'))) findings.push(finding('QV-TWIN-003', 'High', '.ai/knowledge/twin/history', 'Twin-History-Verzeichnis fehlt.', 'ESS-0001-CONTRACTS Chapter 18'));
  const current = readJson(path.join(twinRoot, 'current.json'));
  if (current) {
    const twins = Array.isArray(current.components) ? current.components.filter(isRecord) : [];
    if (twins.length === 0) findings.push(finding('QV-TWIN-004', 'High', '.ai/knowledge/twin/current.json', 'current.json enthaelt keine Component Twins.', 'ESS-0001-CONTRACTS Chapter 18'));
    for (const twin of twins) {
      for (const field of TWIN_COMPONENT_FIELDS) if (!(field in twin)) findings.push(finding('QV-TWIN-005', 'High', '.ai/knowledge/twin/current.json', `Component Twin ${String(twin.componentId ?? '<unknown>')} fehlt Pflichtfeld ${field}.`, 'ESS-0001-CONTRACTS Chapter 18'));
      if (twin.state !== 'Synchronized') findings.push(finding('QV-TWIN-006', 'High', '.ai/knowledge/twin/current.json', `Component Twin ${String(twin.componentId ?? '<unknown>')} ist nicht Synchronized.`, 'ESS-0001-CONTRACTS Chapter 18'));
    }
  }
  const drift = readJson(path.join(twinRoot, 'drift.json'));
  if (drift) {
    const items = Array.isArray(drift.items) ? drift.items : Array.isArray(drift.drift) ? drift.drift : [];
    if (items.length > 0) findings.push(finding('QV-TWIN-007', 'Critical', '.ai/knowledge/twin/drift.json', `${items.length} offene Twin-Drift-Eintraege erkannt.`, 'ESS-0001-CONTRACTS Chapter 18'));
  }
  return result(context, 'TwinValidator', 'ESS-0001-CONTRACTS Chapter 18', 'Twin-Speicher, Component Twins, Synchronitaet und Drift', findings, ['ESS-0001-CONTRACTS Chapter 18']);
}

function observationBacked(
  context: Readonly<Chapter12ValidationContext>,
  name: MandatoryValidatorName,
  domains: readonly string[],
  contract: string,
  scope: string,
  filter?: (finding: RepositoryQualityCheckResult['findings'][number]) => boolean,
): Chapter12ValidatorResult {
  const checks = context.repositoryObservation.checks.filter((check) => domains.includes(check.domain));
  if (checks.length === 0 || checks.some((check) => check.status === 'NOT_AVAILABLE')) return result(context, name, contract, scope, [], [contract], 'NOT_AVAILABLE');
  const findings: Chapter12ValidatorFinding[] = [];
  for (const check of checks) for (const item of check.findings) {
    if (filter && !filter(item)) continue;
    const source = item.sourceSeverity?.toUpperCase();
    const severity: Chapter12ValidatorSeverity = source === 'CRITICAL' ? 'Critical' : source === 'HIGH' || item.severity === 'error' ? 'High' : source === 'MEDIUM' || item.severity === 'warning' ? 'Medium' : source === 'LOW' ? 'Low' : 'Information';
    findings.push(finding(item.ruleId, severity, item.path ?? null, item.message, ...(item.evidenceRefs ?? check.authorityRefs)));
  }
  const forcedFailure = checks.some((check) => check.blocking || check.status === 'FAIL');
  return result(context, name, contract, scope, findings, checks.flatMap((check) => check.authorityRefs), forcedFailure ? 'FAIL' : undefined);
}

export class Chapter12ValidatorRunner {
  run(context: Readonly<Chapter12ValidationContext>): Chapter12ValidationReport {
    const results: readonly Chapter12ValidatorResult[] = Object.freeze([
      repositoryStructure(context),
      directoryResponsibilities(context),
      observationBacked(context, 'NamingValidator', ['repository-conventions'], 'ESS-0001-CONTRACTS Chapter 5', 'Enterprise Naming Contracts', (item) => item.ruleId.includes('NAME') || item.ruleId.includes('CASE')),
      layerValidation(context),
      dependencyValidation(context),
      interfaceValidation(context),
      manifestValidation(context),
      componentValidation(context),
      metadataValidation(context),
      observationBacked(context, 'DocumentationValidator', ['documentation-hygiene', 'documentation-consistency'], 'ESS-0001-CONTRACTS Chapter 4/7/12', 'Dokumentationskonformitaet'),
      eventValidation(context),
      observationBacked(context, 'VersionValidator', ['platform-version'], 'ESS-0001-CONTRACTS Chapter 9/12', 'Versionskonformitaet'),
      observationBacked(context, 'SecurityValidator', ['compliance'], 'ESS-0001-CONTRACTS Chapter 11/12', 'Security-Evidence', (item) => item.sourceSeverity === 'CRITICAL' || item.sourceSeverity === 'HIGH' || item.ruleId.startsWith('SEC-')),
      observationBacked(context, 'ComplianceValidator', ['compliance'], 'ESS-0001-CONTRACTS Chapter 11/12', 'Compliance-Evidence'),
      knowledgeValidation(context),
      twinValidation(context),
    ]);
    const failed = results.filter((item) => item.status === 'FAIL').length;
    const notAvailable = results.filter((item) => item.status === 'NOT_AVAILABLE').length;
    const passed = results.length - failed - notAvailable;
    const overallStatus: Chapter12ValidatorStatus = failed > 0 ? 'FAIL' : notAvailable > 0 ? 'NOT_AVAILABLE' : 'PASS';
    return Object.freeze({
      schemaVersion: CHAPTER_12_VALIDATION_REPORT_SCHEMA,
      contractVersion: CHAPTER_12_VALIDATOR_CONTRACT_VERSION,
      checkedAt: context.checkedAt,
      correlationId: correlationId(context),
      overallStatus,
      blocking: results.some((item) => item.findings.some((entry) => entry.severity === 'Critical' || entry.severity === 'High')),
      executed: results.length,
      total: 16 as const,
      passed,
      failed,
      notAvailable,
      results,
    });
  }
}
