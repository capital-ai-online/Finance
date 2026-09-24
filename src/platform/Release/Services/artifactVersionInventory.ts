import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const ARTIFACT_VERSION_INVENTORY_VERSION = 'artifact-version-inventory/1.0.0' as const;
export const ARTIFACT_VERSION_INVENTORY_SCHEMA_VERSION = '1.0.0' as const;
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
  | 'GENERATED_MARKER';

export interface ArtifactVersionSignal {
  kind: ArtifactVersionSignalKind;
  name: string;
  value: string;
}

export interface ArtifactVersionInventoryEntry {
  path: string;
  gitMode: string;
  blobSha: string;
  domain: ArtifactVersionDomain;
  semanticVersion: string | null;
  declaredVersions: string[];
  signals: ArtifactVersionSignal[];
  consumerFingerprint: null;
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
  contentInventoryHash: string;
}

interface GitIndexEntry {
  path: string;
  gitMode: string;
  blobSha: string;
}

const MAX_SIGNAL_BYTES = 1024 * 1024;
const GENERATED_PATH = /(^|\/)(?:dist|coverage|generated|artifacts?|snapshots?)(?:\/|$)/i;
const GENERATED_HEADER = /^\\s*(?:(?:\\/\\/|#|<!--|\\*)\\s*)?(?:@generated\\b|this file is (?:auto[- ]?)?generated\\b|generated file\\b|do not edit\\b)/im;
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

function detectSignals(repoPath: string, text: string | null): ArtifactVersionSignal[] {
  const signals: ArtifactVersionSignal[] = [];
  if (text === null) return signals;

  detectJsonSignals(repoPath, text, signals);
  detectSourceSignals(repoPath, text, signals);
  detectMarkdownSignals(repoPath, text, signals);
  detectYamlSignals(repoPath, text, signals);

  const generatedHeaderWindow = text.split(/\\r?\\n/).slice(0, 8).join('\\n');\n  if (GENERATED_HEADER.test(generatedHeaderWindow)) {
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

function buildEntry(repoRoot: string, indexEntry: GitIndexEntry): ArtifactVersionInventoryEntry {
  const text = readSignalText(repoRoot, indexEntry);
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
  const entries = readGitIndex(repoRoot).map((entry) => buildEntry(repoRoot, entry));
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
    contentInventoryHash: buildContentInventoryHash(entries),
  };
}
