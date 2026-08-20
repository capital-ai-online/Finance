import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DOCUMENT_REGISTRY_PATH,
  type RegistryEntry,
} from '../Governance/Services/DocumentationHygieneValidator';

export const SEMANTIC_FRESHNESS_ANALYZER_VERSION = 'documentary-semantic-freshness/1.0.0' as const;

const TERMINAL_LIFECYCLES = new Set(['archived', 'superseded', 'suspended']);
const REVIEW_ONLY_PREFIXES = [
  'docs/adr/',
  'docs/archive/',
  'docs/compliance/',
  'docs/evidence/',
  'docs/governance/',
  'docs/legal/',
  'docs/security/',
  'docs/release/',
];

export type DocumentaryMutationClass = 'PATCHABLE' | 'REVIEW_ONLY' | 'SKIP';
export type FreshnessReasonCode =
  | 'PERIODIC_FULL_SCAN'
  | 'DIRECT_SOURCE_REFERENCE'
  | 'DECLARED_DEPENDENCY'
  | 'COMPONENT_SEMANTIC_SCOPE'
  | 'DOCUMENT_REFERENCE';

export interface SourceChangeEvidence {
  path: string;
  summary?: string;
  diff?: string;
}

export interface SemanticFreshnessFinding {
  documentId: string;
  path: string;
  type: string;
  lifecycle: string;
  mutationClass: DocumentaryMutationClass;
  candidate: boolean;
  reasons: FreshnessReasonCode[];
  sourcePaths: string[];
  contentSha256: string | null;
}

export interface SemanticFreshnessReport {
  analyzerVersion: typeof SEMANTIC_FRESHNESS_ANALYZER_VERSION;
  correlationId: string;
  sourceCommit: string;
  generatedAt: string;
  fullScan: boolean;
  sourceChanges: SourceChangeEvidence[];
  findings: SemanticFreshnessFinding[];
  summary: {
    registered: number;
    candidates: number;
    patchable: number;
    reviewOnly: number;
    skipped: number;
  };
}

interface DocumentRegistryEnvelope {
  schemaVersion: string;
  authority: string;
  entries: RegistryEntry[];
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function resolveRepoPath(repoRoot: string, relativePath: string): string | null {
  const normalized = normalizeRepoPath(relativePath);
  if (!normalized || path.isAbsolute(normalized)) return null;
  const root = path.resolve(repoRoot);
  const absolute = path.resolve(root, normalized);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  return absolute;
}

function readRegularNonSymlinkText(absolutePath: string): string | null {
  if (!fs.existsSync(absolutePath)) return null;
  const stat = fs.lstatSync(absolutePath);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  return fs.readFileSync(absolutePath, 'utf8');
}

function semanticToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function sourceComponent(pathValue: string): string | null {
  const match = normalizeRepoPath(pathValue).match(/^src\/platform\/([^/]+)\//i);
  return match?.[1] ?? null;
}

function mentionsSource(content: string, sourcePath: string): boolean {
  const normalized = normalizeRepoPath(sourcePath);
  if (!normalized) return false;
  return content.replace(/\\/g, '/').toLowerCase().includes(normalized.toLowerCase());
}

function declaresDependency(content: string, sourcePath: string): boolean {
  const dependencies = [...content.matchAll(/@depends\s+on\s+([^\r\n\s]+)/gi)]
    .map((match) => normalizeRepoPath(match[1]).toLowerCase());
  return dependencies.includes(normalizeRepoPath(sourcePath).toLowerCase());
}

function hasComponentSemanticScope(entry: RegistryEntry, content: string, sourcePath: string): boolean {
  const component = sourceComponent(sourcePath);
  if (!component) return false;
  const token = semanticToken(component);
  if (token.length < 3) return false;
  const haystack = semanticToken(`${entry.path} ${entry.type} ${entry.owner} ${entry.authority} ${content.slice(0, 24000)}`);
  return haystack.includes(token);
}

function referencesChangedDocument(content: string, sourcePath: string): boolean {
  const normalized = normalizeRepoPath(sourcePath);
  if (!normalized.startsWith('docs/')) return false;
  const basename = path.posix.basename(normalized).toLowerCase();
  return basename.length >= 6 && content.toLowerCase().includes(basename);
}

export function classifyDocumentMutation(entry: Pick<RegistryEntry, 'path' | 'lifecycle'>): DocumentaryMutationClass {
  const documentPath = normalizeRepoPath(entry.path);
  const lifecycle = String(entry.lifecycle ?? '').toLowerCase();
  if (TERMINAL_LIFECYCLES.has(lifecycle)) return 'SKIP';
  if (!documentPath.startsWith('docs/')) return 'REVIEW_ONLY';
  if (REVIEW_ONLY_PREFIXES.some((prefix) => documentPath.startsWith(prefix))) return 'REVIEW_ONLY';
  return 'PATCHABLE';
}

export function isAutomaticDocumentPatchPathAllowed(documentPath: string): boolean {
  const normalized = normalizeRepoPath(documentPath);
  if (!normalized.startsWith('docs/')) return false;
  return !REVIEW_ONLY_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function analyzeSemanticFreshness(options: {
  repoRoot?: string;
  correlationId: string;
  sourceCommit: string;
  sourceChanges?: SourceChangeEvidence[];
  generatedAt?: string;
}): SemanticFreshnessReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  if (!options.correlationId.trim()) throw new Error('[SemanticFreshnessAnalyzer] correlationId is required.');
  if (!/^[0-9a-f]{40}$/i.test(options.sourceCommit)) {
    throw new Error('[SemanticFreshnessAnalyzer] sourceCommit must be a full 40-character SHA.');
  }

  const registryPath = path.join(repoRoot, DOCUMENT_REGISTRY_PATH);
  const registryText = readRegularNonSymlinkText(registryPath);
  if (registryText === null) {
    throw new Error('[SemanticFreshnessAnalyzer] document registry must be a readable regular non-symlink file.');
  }
  const registry = JSON.parse(registryText) as DocumentRegistryEnvelope;
  if (!Array.isArray(registry.entries)) throw new Error('[SemanticFreshnessAnalyzer] document registry entries are invalid.');

  const sourceChanges = (options.sourceChanges ?? [])
    .map((change) => ({ ...change, path: normalizeRepoPath(change.path) }))
    .filter((change) => change.path.length > 0);
  const fullScan = sourceChanges.length === 0;
  const findings: SemanticFreshnessFinding[] = [];

  for (const entry of registry.entries) {
    const mutationClass = classifyDocumentMutation(entry);
    const absolute = resolveRepoPath(repoRoot, entry.path);
    const content = absolute ? readRegularNonSymlinkText(absolute) : null;
    const reasons = new Set<FreshnessReasonCode>();
    const relatedSources = new Set<string>();

    if (mutationClass !== 'SKIP' && content !== null) {
      if (fullScan) reasons.add('PERIODIC_FULL_SCAN');
      for (const change of sourceChanges) {
        if (normalizeRepoPath(entry.path) === change.path) continue;
        if (declaresDependency(content, change.path)) {
          reasons.add('DECLARED_DEPENDENCY');
          relatedSources.add(change.path);
        }
        if (mentionsSource(content, change.path)) {
          reasons.add('DIRECT_SOURCE_REFERENCE');
          relatedSources.add(change.path);
        }
        if (hasComponentSemanticScope(entry, content, change.path)) {
          reasons.add('COMPONENT_SEMANTIC_SCOPE');
          relatedSources.add(change.path);
        }
        if (referencesChangedDocument(content, change.path)) {
          reasons.add('DOCUMENT_REFERENCE');
          relatedSources.add(change.path);
        }
      }
    }

    const candidate = mutationClass !== 'SKIP' && content !== null && reasons.size > 0;
    findings.push({
      documentId: entry.documentId,
      path: normalizeRepoPath(entry.path),
      type: entry.type,
      lifecycle: entry.lifecycle,
      mutationClass,
      candidate,
      reasons: [...reasons].sort(),
      sourcePaths: [...relatedSources].sort(),
      contentSha256: content === null ? null : sha256(content),
    });
  }

  const candidates = findings.filter((finding) => finding.candidate);
  return Object.freeze({
    analyzerVersion: SEMANTIC_FRESHNESS_ANALYZER_VERSION,
    correlationId: options.correlationId,
    sourceCommit: options.sourceCommit.toLowerCase(),
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    fullScan,
    sourceChanges,
    findings,
    summary: {
      registered: findings.length,
      candidates: candidates.length,
      patchable: candidates.filter((finding) => finding.mutationClass === 'PATCHABLE').length,
      reviewOnly: candidates.filter((finding) => finding.mutationClass === 'REVIEW_ONLY').length,
      skipped: findings.filter((finding) => finding.mutationClass === 'SKIP').length,
    },
  });
}