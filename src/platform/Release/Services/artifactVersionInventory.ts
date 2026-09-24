import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const ARTIFACT_VERSION_INVENTORY_VERSION = 'artifact-version-inventory/1.1.0' as const;
export const ARTIFACT_VERSION_INVENTORY_SCHEMA_VERSION = '1.1.0' as const;
export const PLATFORM_VERSION_AUTHORITY_PATH = 'package.json' as const;
export const PLATFORM_VERSION_MIRROR_PATH = 'package-lock.json' as const;

export type ArtifactVersionDomain =
  | 'PLATFORM_VERSION_AUTHORITY'
  | 'PLATFORM_VERSION_MIRROR'
  | 'SEMANTIC_CONTRACT_VERSIONED'
  | 'SCHEMA_VERSIONED'
  | 'DERIVED_CONTENT_IDENTITY'
  | 'GENERATED_OR_EPHEMERAL'
  | 'UNCLASSIFIED_REQUIRES_OWNER_REVIEW';

export type ArtifactVersionSignalKind =
  | 'PACKAGE_VERSION'
  | 'LOCKFILE_VERSION'
  | 'LOCKFILE_ROOT_PACKAGE_VERSION'
  | 'SCHEMA_VERSION'
  | 'JSON_SCHEMA_ID'
  | 'MANIFEST_VERSION'
  | 'DECLARED_VERSION_FIELD'
  | 'EXPORTED_VERSION_CONSTANT'
  | 'MARKDOWN_VERSION_HEADER'
  | 'CONTRACT_VERSION_MARKER'
  | 'YAML_SCHEMA_VERSION'
  | 'YAML_VERSION_FIELD'
  | 'WORKFLOW_CONTRACT_VERSION_LITERAL'
  | 'GENERATED_MARKER';

export interface ArtifactVersionSignal {
  kind: ArtifactVersionSignalKind;
  name: string;
  value: string;
}

export type ArtifactVersionConsumerKind =
  | 'IMPORT'
  | 'WORKFLOW_SCRIPT_REFERENCE'
  | 'VALIDATOR_EXPECTATION'
  | 'TEST_LITERAL'
  | 'REGISTRY_REFERENCE'
  | 'RUNTIME_MANIFEST_DEPENDENCY'
  | 'PATH_REFERENCE';

export interface ArtifactVersionConsumerEdge {
  consumerPath: string;
  producerPath: string;
  kind: ArtifactVersionConsumerKind;
  binding: string;
  producerIdentity: string;
}

export interface ArtifactVersionConsumerAmbiguity {
  consumerPath: string;
  binding: string;
  candidateProducerPaths: string[];
}

export interface ArtifactVersionInventoryEntry {
  path: string;
  gitMode: string;
  blobSha: string;
  domain: ArtifactVersionDomain;
  semanticVersion: string | null;
  declaredVersions: string[];
  signals: ArtifactVersionSignal[];
  consumerFingerprint: string | null;
  classificationReason: string;
}

export interface ArtifactVersionInventory {
  schemaVersion: typeof ARTIFACT_VERSION_INVENTORY_SCHEMA_VERSION;
  generatorVersion: typeof ARTIFACT_VERSION_INVENTORY_VERSION;
  sourceHead: string | null;
  platformVersionAuthority: {
    path: typeof PLATFORM_VERSION_AUTHORITY_PATH;
    version: string | null;
  };
  counts: Record<ArtifactVersionDomain, number>;
  entries: ArtifactVersionInventoryEntry[];
  unclassifiedPaths: string[];
  consumerEdges: ArtifactVersionConsumerEdge[];
  consumerGraphAmbiguities: ArtifactVersionConsumerAmbiguity[];
  contentInventoryHash: string;
}

interface GitIndexEntry {
  path: string;
  gitMode: string;
  blobSha: string;
}

const MAX_SIGNAL_BYTES = 1024 * 1024;
const GENERATED_PATH = /(^|\/)(?:dist|coverage|generated|artifacts?|snapshots?)(?:\/|$)/i;
const GENERATED_HEADER = /^\s*(?:(?:\/\/|#|<!--|\*)\s*)?(?:@generated\b|this file is (?:auto[- ]?)?generated\b|generated file\b|do not edit\b)/im;
const STRONG_SEMANTIC_PATH = /(^|\/)(?:docs\/(?:adr|governance|contracts?)|\.ai\/skills|src\/platform\/Release)(?:\/|$)/i;
const TEST_OR_FIXTURE_PATH = /(^|\/)(?:tests?|__tests__|fixtures?)(?:\/|$)/i;

const DOMAIN_ORDER: ArtifactVersionDomain[] = [
  'PLATFORM_VERSION_AUTHORITY',
  'PLATFORM_VERSION_MIRROR',
  'SEMANTIC_CONTRACT_VERSIONED',
  'SCHEMA_VERSIONED',
  'DERIVED_CONTENT_IDENTITY',
  'GENERATED_OR_EPHEMERAL',
  'UNCLASSIFIED_REQUIRES_OWNER_REVIEW',
];

function sha256(value: string): string {
  return 'sha256:' + crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeRepoPath(value: string): string {
  return value.replaceAll('\\', '/');
}

function readGitIndex(repoRoot: string): GitIndexEntry[] {
  const raw = execFileSync('git', ['ls-files', '-s', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const entries: GitIndexEntry[] = [];
  for (const token of raw.split('\0')) {
    if (!token) continue;
    const tab = token.indexOf('\t');
    if (tab < 0) throw new Error('Artifact version inventory denied: malformed git ls-files entry');
    const prefix = token.slice(0, tab).split(' ');
    if (prefix.length !== 3) throw new Error('Artifact version inventory denied: malformed git index prefix');
    const [gitMode, blobSha, stage] = prefix;
    if (stage !== '0') {
      throw new Error('Artifact version inventory denied: non-stage-0 Git index entry detected for ' + token.slice(tab + 1));
    }
    if (!/^[0-9]{6}$/.test(gitMode) || !/^[0-9a-f]{40}$/.test(blobSha)) {
      throw new Error('Artifact version inventory denied: unsupported Git index identity');
    }
    entries.push({
      path: normalizeRepoPath(token.slice(tab + 1)),
      gitMode,
      blobSha,
    });
  }

  return entries.sort((left, right) => left.path.localeCompare(right.path));
}

function resolveHead(repoRoot: string): string | null {
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^[0-9a-f]{40}$/.test(head) ? head : null;
  } catch {
    return null;
  }
}

function readSignalText(repoRoot: string, entry: GitIndexEntry): string | null {
  if (!['100644', '100755'].includes(entry.gitMode)) return null;

  let size: number;
  try {
    size = Number(execFileSync('git', ['cat-file', '-s', entry.blobSha], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim());
  } catch {
    return null;
  }

  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_SIGNAL_BYTES) return null;

  let buffer: Buffer;
  try {
    buffer = execFileSync('git', ['cat-file', 'blob', entry.blobSha], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_SIGNAL_BYTES + 1,
    });
  } catch {
    return null;
  }

  if (buffer.includes(0)) return null;
  return buffer.toString('utf8');
}

function pushSignal(
  signals: ArtifactVersionSignal[],
  kind: ArtifactVersionSignalKind,
  name: string,
  value: unknown,
): void {
  if (typeof value !== 'string') return;
  const normalized = value.trim();
  if (!normalized) return;
  const key = kind + '\0' + name + '\0' + normalized;
  if (signals.some((signal) => signal.kind + '\0' + signal.name + '\0' + signal.value === key)) return;
  signals.push({ kind, name, value: normalized });
}

function detectJsonSignals(repoPath: string, text: string, signals: ArtifactVersionSignal[]): void {
  if (!repoPath.toLowerCase().endsWith('.json')) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return;
  const object = parsed as Record<string, unknown>;

  if (repoPath === PLATFORM_VERSION_AUTHORITY_PATH) {
    pushSignal(signals, 'PACKAGE_VERSION', 'version', object.version);
    return;
  }

  if (repoPath === PLATFORM_VERSION_MIRROR_PATH) {
    pushSignal(signals, 'LOCKFILE_VERSION', 'version', object.version);
    const packages = object.packages;
    if (packages && typeof packages === 'object' && !Array.isArray(packages)) {
      const rootPackage = (packages as Record<string, unknown>)[''];
      if (rootPackage && typeof rootPackage === 'object' && !Array.isArray(rootPackage)) {
        pushSignal(signals, 'LOCKFILE_ROOT_PACKAGE_VERSION', 'packages[""].version', (rootPackage as Record<string, unknown>).version);
      }
    }
    return;
  }

  pushSignal(signals, 'SCHEMA_VERSION', 'schemaVersion', object.schemaVersion);
  pushSignal(signals, 'SCHEMA_VERSION', 'schema_version', object.schema_version);
  pushSignal(signals, 'JSON_SCHEMA_ID', '$id', object.$id);

  if (path.posix.basename(repoPath).toLowerCase() === 'manifest.json') {
    pushSignal(signals, 'MANIFEST_VERSION', 'version', object.version);
  } else if (/(^|\/)(?:contracts?|control-plane|registry|schemas?)(?:\/|$)/i.test(repoPath)) {
    pushSignal(signals, 'DECLARED_VERSION_FIELD', 'version', object.version);
  }
}

function detectSourceSignals(repoPath: string, text: string, signals: ArtifactVersionSignal[]): void {
  if (TEST_OR_FIXTURE_PATH.test(repoPath)) return;
  const pattern = /export\s+const\s+([A-Z0-9_]*_VERSION)\s*=\s*['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(pattern)) {
    pushSignal(signals, 'EXPORTED_VERSION_CONSTANT', match[1], match[2]);
  }
}

function detectMarkdownSignals(repoPath: string, text: string, signals: ArtifactVersionSignal[]): void {
  const marker = /CAPITAL_AI_PR_TEMPLATE_VERSION\s*:\s*([0-9]+\.[0-9]+\.[0-9]+)/g;
  for (const match of text.matchAll(marker)) {
    pushSignal(signals, 'CONTRACT_VERSION_MARKER', 'CAPITAL_AI_PR_TEMPLATE_VERSION', match[1]);
  }

  if (!/\.md$/i.test(repoPath)) return;
  const header = /^\s*(?:\*\*)?(?:Document\s+|Contract\s+|Schema\s+)?Version(?:\*\*)?\s*:\s*([^\n\r]+)/gim;
  for (const match of text.matchAll(header)) {
    pushSignal(signals, 'MARKDOWN_VERSION_HEADER', 'Version', match[1].replace(/\*\*/g, '').trim());
  }
}

function detectYamlSignals(repoPath: string, text: string, signals: ArtifactVersionSignal[]): void {
  if (!/\.ya?ml$/i.test(repoPath)) return;
  const schema = /^\s*(schemaVersion|schema_version)\s*:\s*['"]?([^\n\r#'"]+)/gim;
  for (const match of text.matchAll(schema)) {
    pushSignal(signals, 'YAML_SCHEMA_VERSION', match[1], match[2]);
  }

  if (/(?:manifest|schema|contract)/i.test(path.posix.basename(repoPath))) {
    const version = /^\s*version\s*:\s*['"]?([^\n\r#'"]+)/gim;
    for (const match of text.matchAll(version)) {
      pushSignal(signals, 'YAML_VERSION_FIELD', 'version', match[1]);
    }
  }
}

function detectWorkflowContractSignals(repoPath: string, text: string, signals: ArtifactVersionSignal[]): void {
  if (!/^\.github\/workflows\/.+\.ya?ml$/i.test(repoPath)) return;

  const normalized = text
    .replaceAll('\\s*', '')
    .replaceAll('\\.', '.');
  const marker = /CAPITAL_AI_PR_TEMPLATE_VERSION:\s*([0-9]+\.[0-9]+\.[0-9]+)/g;
  for (const match of normalized.matchAll(marker)) {
    pushSignal(signals, 'WORKFLOW_CONTRACT_VERSION_LITERAL', 'CAPITAL_AI_PR_TEMPLATE_VERSION', match[1]);
  }
}

function detectSignals(repoPath: string, text: string | null): ArtifactVersionSignal[] {
  const signals: ArtifactVersionSignal[] = [];
  if (text === null) return signals;

  detectJsonSignals(repoPath, text, signals);
  detectSourceSignals(repoPath, text, signals);
  detectMarkdownSignals(repoPath, text, signals);
  detectYamlSignals(repoPath, text, signals);
  detectWorkflowContractSignals(repoPath, text, signals);

  const generatedHeaderWindow = text.split(/\r?\n/).slice(0, 8).join('\n');
  if (GENERATED_HEADER.test(generatedHeaderWindow)) {
    pushSignal(signals, 'GENERATED_MARKER', 'generated', 'true');
  }

  return signals.sort((left, right) =>
    (left.kind + '\0' + left.name + '\0' + left.value).localeCompare(right.kind + '\0' + right.name + '\0' + right.value),
  );
}

function isGenerated(repoPath: string, signals: ArtifactVersionSignal[]): boolean {
  return GENERATED_PATH.test(repoPath) || signals.some((signal) => signal.kind === 'GENERATED_MARKER');
}

function hasSchemaDeclaration(signals: ArtifactVersionSignal[]): boolean {
  return signals.some((signal) =>
    signal.kind === 'SCHEMA_VERSION' ||
    signal.kind === 'YAML_SCHEMA_VERSION' ||
    signal.kind === 'JSON_SCHEMA_ID',
  );
}

function hasSemanticDeclaration(repoPath: string, signals: ArtifactVersionSignal[]): boolean {
  if (signals.some((signal) => signal.kind === 'MANIFEST_VERSION')) return true;
  if (repoPath === '.github/pull_request_template.md' &&
      signals.some((signal) => signal.kind === 'CONTRACT_VERSION_MARKER')) return true;
  if (signals.some((signal) => signal.kind === 'EXPORTED_VERSION_CONSTANT')) return true;
  if (STRONG_SEMANTIC_PATH.test(repoPath) &&
      signals.some((signal) =>
        signal.kind === 'MARKDOWN_VERSION_HEADER' ||
        signal.kind === 'DECLARED_VERSION_FIELD' ||
        signal.kind === 'YAML_VERSION_FIELD')) return true;
  return false;
}

function declaredVersions(signals: ArtifactVersionSignal[]): string[] {
  return [...new Set(
    signals
      .filter((signal) => signal.kind !== 'GENERATED_MARKER' && signal.kind !== 'JSON_SCHEMA_ID')
      .map((signal) => signal.value),
  )].sort();
}

function semanticVersionForDomain(domain: ArtifactVersionDomain, signals: ArtifactVersionSignal[]): string | null {
  let relevant: ArtifactVersionSignal[] = [];

  if (domain === 'PLATFORM_VERSION_AUTHORITY') {
    relevant = signals.filter((signal) => signal.kind === 'PACKAGE_VERSION');
  } else if (domain === 'PLATFORM_VERSION_MIRROR') {
    relevant = signals.filter((signal) => signal.kind === 'LOCKFILE_VERSION');
  } else if (domain === 'SCHEMA_VERSIONED') {
    relevant = signals.filter((signal) =>
      signal.kind === 'SCHEMA_VERSION' ||
      signal.kind === 'YAML_SCHEMA_VERSION' ||
      signal.kind === 'YAML_VERSION_FIELD');
  } else if (domain === 'SEMANTIC_CONTRACT_VERSIONED') {
    relevant = signals.filter((signal) =>
      signal.kind === 'MANIFEST_VERSION' ||
      signal.kind === 'DECLARED_VERSION_FIELD' ||
      signal.kind === 'EXPORTED_VERSION_CONSTANT' ||
      signal.kind === 'MARKDOWN_VERSION_HEADER' ||
      signal.kind === 'CONTRACT_VERSION_MARKER');
  }

  const values = [...new Set(relevant.map((signal) => signal.value))];
  return values.length === 1 ? values[0] : null;
}

function classify(repoPath: string, signals: ArtifactVersionSignal[]): {
  domain: ArtifactVersionDomain;
  reason: string;
} {
  if (repoPath === PLATFORM_VERSION_AUTHORITY_PATH) {
    return {
      domain: 'PLATFORM_VERSION_AUTHORITY',
      reason: 'Exact canonical platform-version authority path.',
    };
  }
  if (repoPath === PLATFORM_VERSION_MIRROR_PATH) {
    return {
      domain: 'PLATFORM_VERSION_MIRROR',
      reason: 'Exact canonical package-lock platform-version mirror path.',
    };
  }
  if (isGenerated(repoPath, signals)) {
    return {
      domain: 'GENERATED_OR_EPHEMERAL',
      reason: 'Generated path or explicit generated-content marker.',
    };
  }

  const schema = hasSchemaDeclaration(signals);
  const semantic = hasSemanticDeclaration(repoPath, signals);

  if (schema && semantic) {
    return {
      domain: 'UNCLASSIFIED_REQUIRES_OWNER_REVIEW',
      reason: 'Conflicting schema and semantic-contract self-declarations require owner resolution.',
    };
  }
  if (schema) {
    return {
      domain: 'SCHEMA_VERSIONED',
      reason: 'Explicit schema identity declaration discovered.',
    };
  }
  if (semantic) {
    return {
      domain: 'SEMANTIC_CONTRACT_VERSIONED',
      reason: 'Explicit semantic contract identity declaration discovered.',
    };
  }
  return {
    domain: 'DERIVED_CONTENT_IDENTITY',
    reason: 'No authoritative semantic/schema declaration; Git blob identity is canonical.',
  };
}

function buildEntry(indexEntry: GitIndexEntry, text: string | null): ArtifactVersionInventoryEntry {
  const signals = detectSignals(indexEntry.path, text);
  const classification = classify(indexEntry.path, signals);
  return {
    path: indexEntry.path,
    gitMode: indexEntry.gitMode,
    blobSha: indexEntry.blobSha,
    domain: classification.domain,
    semanticVersion: semanticVersionForDomain(classification.domain, signals),
    declaredVersions: declaredVersions(signals),
    signals,
    consumerFingerprint: null,
    classificationReason: classification.reason,
  };
}


function producerIdentity(entry: ArtifactVersionInventoryEntry): string {
  return sha256(JSON.stringify({
    path: entry.path,
    domain: entry.domain,
    semanticVersion: entry.semanticVersion,
    blobSha: entry.blobSha,
  }));
}

function isConsumerGraphProducer(entry: ArtifactVersionInventoryEntry): boolean {
  return (
    entry.domain === 'PLATFORM_VERSION_AUTHORITY' ||
    entry.domain === 'SEMANTIC_CONTRACT_VERSIONED' ||
    entry.domain === 'SCHEMA_VERSIONED'
  );
}

function classifyConsumerKind(repoPath: string, imported: boolean): ArtifactVersionConsumerKind {
  if (imported) return 'IMPORT';
  if (TEST_OR_FIXTURE_PATH.test(repoPath)) return 'TEST_LITERAL';
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(repoPath)) return 'WORKFLOW_SCRIPT_REFERENCE';
  if (/(^|\/)(?:registry|registries)(?:\/|\.)/i.test(repoPath)) return 'REGISTRY_REFERENCE';
  if (/(^|\/)(?:package(?:-lock)?\.json|manifest\.(?:json|ya?ml))$/i.test(repoPath)) {
    return 'RUNTIME_MANIFEST_DEPENDENCY';
  }
  if (/(?:validator|contract|reconciler|autofix)/i.test(repoPath)) return 'VALIDATOR_EXPECTATION';
  return 'PATH_REFERENCE';
}

function resolveTrackedReference(
  consumerPath: string,
  specifier: string,
  tracked: Map<string, ArtifactVersionInventoryEntry>,
): ArtifactVersionInventoryEntry | null {
  const normalizedSpecifier = normalizeRepoPath(specifier.trim());
  if (!normalizedSpecifier || normalizedSpecifier.startsWith('#')) return null;

  const rootCandidate = normalizedSpecifier.replace(/^\.\//, '');
  const baseCandidate = normalizedSpecifier.startsWith('.')
    ? path.posix.normalize(path.posix.join(path.posix.dirname(consumerPath), normalizedSpecifier))
    : rootCandidate;

  const candidates = [
    baseCandidate,
    baseCandidate + '.ts',
    baseCandidate + '.tsx',
    baseCandidate + '.js',
    baseCandidate + '.mjs',
    baseCandidate + '.cjs',
    baseCandidate + '.json',
    baseCandidate + '.yml',
    baseCandidate + '.yaml',
    baseCandidate + '.md',
    path.posix.join(baseCandidate, 'index.ts'),
    path.posix.join(baseCandidate, 'index.tsx'),
    path.posix.join(baseCandidate, 'index.js'),
    path.posix.join(baseCandidate, 'index.mjs'),
  ];

  for (const candidate of candidates) {
    const resolved = tracked.get(candidate);
    if (resolved && isConsumerGraphProducer(resolved)) return resolved;
  }
  return null;
}

function importedSpecifiers(text: string): string[] {
  const values = new Set<string>();
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) values.add(match[1]);
  }
  return [...values].sort();
}

function quotedPathSpecifiers(text: string): string[] {
  const values = new Set<string>();
  const pattern = /['"`]([^'"`\r\n]{2,260})['"`]/g;
  for (const match of text.matchAll(pattern)) {
    const value = match[1];
    if (value.includes('/') && !value.includes('://')) values.add(value);
  }
  return [...values].sort();
}

function exportedVersionProducerGroups(
  entries: ArtifactVersionInventoryEntry[],
): Map<string, Array<{ entry: ArtifactVersionInventoryEntry; signal: ArtifactVersionSignal }>> {
  const groups = new Map<string, Array<{ entry: ArtifactVersionInventoryEntry; signal: ArtifactVersionSignal }>>();
  for (const entry of entries) {
    if (!isConsumerGraphProducer(entry)) continue;
    for (const signal of entry.signals) {
      if (signal.kind !== 'EXPORTED_VERSION_CONSTANT') continue;
      const key = signal.name.toUpperCase() + '\0' + signal.value;
      const current = groups.get(key) ?? [];
      current.push({ entry, signal });
      groups.set(key, current);
    }
  }
  return groups;
}

function buildConsumerGraph(
  entries: ArtifactVersionInventoryEntry[],
  textByPath: Map<string, string | null>,
): {
  edges: ArtifactVersionConsumerEdge[];
  ambiguities: ArtifactVersionConsumerAmbiguity[];
} {
  const tracked = new Map(entries.map((entry) => [entry.path, entry]));
  const versionGroups = exportedVersionProducerGroups(entries);
  const edges = new Map<string, ArtifactVersionConsumerEdge>();
  const ambiguities = new Map<string, ArtifactVersionConsumerAmbiguity>();

  const addEdge = (
    consumer: ArtifactVersionInventoryEntry,
    producer: ArtifactVersionInventoryEntry,
    kind: ArtifactVersionConsumerKind,
    binding: string,
  ) => {
    if (consumer.path === producer.path) return;
    const edge: ArtifactVersionConsumerEdge = {
      consumerPath: consumer.path,
      producerPath: producer.path,
      kind,
      binding,
      producerIdentity: producerIdentity(producer),
    };
    const key = [edge.consumerPath, edge.producerPath, edge.kind, edge.binding].join('\0');
    edges.set(key, edge);
  };

  for (const consumer of entries) {
    const text = textByPath.get(consumer.path);
    if (!text) continue;
    const versionBindingText = text.replaceAll('\\.', '.');

    for (const specifier of importedSpecifiers(text)) {
      const producer = resolveTrackedReference(consumer.path, specifier, tracked);
      if (producer) addEdge(consumer, producer, 'IMPORT', 'import:' + specifier);
    }

    for (const specifier of quotedPathSpecifiers(text)) {
      const producer = resolveTrackedReference(consumer.path, specifier, tracked);
      if (producer) {
        addEdge(
          consumer,
          producer,
          classifyConsumerKind(consumer.path, false),
          'path:' + specifier,
        );
      }
    }

    for (const group of versionGroups.values()) {
      const { signal } = group[0];
      const aliases = [signal.name, 'CAPITAL_AI_' + signal.name];
      const alias = aliases.find((candidate) => text.includes(candidate));
      if (!alias || !versionBindingText.includes(signal.value)) continue;

      const uniqueProducerPaths = [...new Set(group.map(({ entry }) => entry.path))].sort();
      const binding = 'version:' + alias + '=' + signal.value;
      if (uniqueProducerPaths.length !== 1) {
        const key = consumer.path + '\0' + binding;
        ambiguities.set(key, {
          consumerPath: consumer.path,
          binding,
          candidateProducerPaths: uniqueProducerPaths,
        });
        continue;
      }

      const producer = group[0].entry;
      addEdge(
        consumer,
        producer,
        classifyConsumerKind(consumer.path, false),
        binding,
      );
    }
  }

  const sortedEdges = [...edges.values()].sort((left, right) =>
    [
      left.consumerPath,
      left.producerPath,
      left.kind,
      left.binding,
      left.producerIdentity,
    ].join('\0').localeCompare([
      right.consumerPath,
      right.producerPath,
      right.kind,
      right.binding,
      right.producerIdentity,
    ].join('\0')),
  );

  for (const entry of entries) {
    const consumerEdges = sortedEdges
      .filter((edge) => edge.consumerPath === entry.path)
      .map((edge) => ({
        producerPath: edge.producerPath,
        kind: edge.kind,
        binding: edge.binding,
        producerIdentity: edge.producerIdentity,
      }));
    entry.consumerFingerprint = consumerEdges.length > 0
      ? sha256(JSON.stringify(consumerEdges))
      : null;
  }

  return {
    edges: sortedEdges,
    ambiguities: [...ambiguities.values()].sort((left, right) =>
      (left.consumerPath + '\0' + left.binding).localeCompare(right.consumerPath + '\0' + right.binding),
    ),
  };
}

function emptyCounts(): Record<ArtifactVersionDomain, number> {
  return Object.fromEntries(DOMAIN_ORDER.map((domain) => [domain, 0])) as Record<ArtifactVersionDomain, number>;
}

function buildContentInventoryHash(entries: ArtifactVersionInventoryEntry[]): string {
  const rows = entries.map((entry) => ({
    path: entry.path,
    domain: entry.domain,
    semanticVersion: entry.semanticVersion,
    blobSha: entry.blobSha,
    consumerFingerprint: entry.consumerFingerprint,
  }));
  return sha256(JSON.stringify(rows));
}

export function buildArtifactVersionInventory(repoRoot: string): ArtifactVersionInventory {
  const indexEntries = readGitIndex(repoRoot);
  const textByPath = new Map<string, string | null>();
  for (const indexEntry of indexEntries) {
    textByPath.set(indexEntry.path, readSignalText(repoRoot, indexEntry));
  }

  const entries = indexEntries.map((entry) => buildEntry(entry, textByPath.get(entry.path) ?? null));
  const consumerGraph = buildConsumerGraph(entries, textByPath);
  const counts = emptyCounts();
  for (const entry of entries) counts[entry.domain] += 1;

  const authority = entries.find((entry) => entry.path === PLATFORM_VERSION_AUTHORITY_PATH);
  const unclassifiedPaths = entries
    .filter((entry) => entry.domain === 'UNCLASSIFIED_REQUIRES_OWNER_REVIEW')
    .map((entry) => entry.path);

  return {
    schemaVersion: ARTIFACT_VERSION_INVENTORY_SCHEMA_VERSION,
    generatorVersion: ARTIFACT_VERSION_INVENTORY_VERSION,
    sourceHead: resolveHead(repoRoot),
    platformVersionAuthority: {
      path: PLATFORM_VERSION_AUTHORITY_PATH,
      version: authority?.semanticVersion ?? null,
    },
    counts,
    entries,
    unclassifiedPaths,
    consumerEdges: consumerGraph.edges,
    consumerGraphAmbiguities: consumerGraph.ambiguities,
    contentInventoryHash: buildContentInventoryHash(entries),
  };
}
