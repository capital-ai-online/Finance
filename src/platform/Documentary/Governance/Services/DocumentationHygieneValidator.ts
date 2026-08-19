import fs from 'node:fs';
import path from 'node:path';

export const DOCUMENTATION_HYGIENE_VALIDATOR_VERSION = 'documentation-hygiene-validator/1.1.0' as const;
export const DOCUMENTATION_HYGIENE_POLICY_PATH = 'docs/governance/DOCUMENTATION_HYGIENE_POLICY.md' as const;
export const DOCUMENT_REGISTRY_PATH = 'docs/governance/document-registry.json' as const;

export interface RegistryEntry {
  documentId: string;
  type: string;
  owner: string;
  authority: string;
  version: string;
  language: 'de' | 'en' | 'mixed' | string;
  lifecycle: 'draft' | 'generated' | 'reviewed' | 'approved' | 'superseded' | 'archived' | 'suspended' | string;
  path: string;
}

interface DocumentRegistry {
  schemaVersion: string;
  authority: string;
  entries: RegistryEntry[];
}

export interface DocumentationHygieneFinding {
  code: string;
  message: string;
  path?: string;
}

const ALLOWED_ROOT_MARKDOWN = new Set(['README.md', 'AGENTS.md']);
const ALLOWED_LANGUAGES = new Set(['de', 'en', 'mixed']);
const ALLOWED_LIFECYCLES = new Set(['draft', 'generated', 'reviewed', 'approved', 'superseded', 'archived', 'suspended']);
const SEMVER = /^\d+\.\d+\.\d+$/;
const DOCUMENT_ID = /^DOC-[A-Z0-9-]+$/;

function finding(code: string, message: string, filePath?: string): DocumentationHygieneFinding {
  return filePath ? { code, message, path: filePath } : { code, message };
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function readRegistry(repoRoot: string): DocumentRegistry {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, DOCUMENT_REGISTRY_PATH), 'utf8')) as DocumentRegistry;
}

function resolveRegistryTarget(repoRoot: string, documentPath: string): string | null {
  if (!documentPath || path.isAbsolute(documentPath)) return null;
  const absoluteRoot = path.resolve(repoRoot);
  const target = path.resolve(repoRoot, documentPath);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${path.sep}`)) return null;
  return target;
}

export function collectDocumentationHygieneFindings(repoRoot = process.cwd()): DocumentationHygieneFinding[] {
  const findings: DocumentationHygieneFinding[] = [];

  const rootMarkdown = fs.readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  for (const name of rootMarkdown) {
    if (!ALLOWED_ROOT_MARKDOWN.has(name)) {
      findings.push(finding('ROOT_MARKDOWN_NOT_ALLOWED', `Root Markdown is not allowed by policy: ${name}`, name));
    }
  }

  let registry: DocumentRegistry;
  try {
    registry = readRegistry(repoRoot);
  } catch (error) {
    findings.push(finding('REGISTRY_UNREADABLE', `Document registry cannot be read: ${error instanceof Error ? error.message : String(error)}`, DOCUMENT_REGISTRY_PATH));
    return findings;
  }

  if (!SEMVER.test(String(registry.schemaVersion ?? ''))) {
    findings.push(finding('REGISTRY_SCHEMA_VERSION_INVALID', `Invalid registry schemaVersion: ${String(registry.schemaVersion ?? '')}`, DOCUMENT_REGISTRY_PATH));
  }
  if (registry.authority !== DOCUMENTATION_HYGIENE_POLICY_PATH) {
    findings.push(finding('REGISTRY_AUTHORITY_INVALID', `Registry authority must be ${DOCUMENTATION_HYGIENE_POLICY_PATH}`, DOCUMENT_REGISTRY_PATH));
  }
  if (!Array.isArray(registry.entries)) {
    findings.push(finding('REGISTRY_ENTRIES_INVALID', 'Registry entries must be an array.', DOCUMENT_REGISTRY_PATH));
    return findings;
  }

  for (const duplicate of duplicateValues(registry.entries.map((entry) => String(entry.documentId ?? '')))) {
    findings.push(finding('DOCUMENT_ID_DUPLICATE', `Duplicate documentId: ${duplicate}`, DOCUMENT_REGISTRY_PATH));
  }
  for (const duplicate of duplicateValues(registry.entries.map((entry) => String(entry.path ?? '')))) {
    findings.push(finding('DOCUMENT_PATH_DUPLICATE', `Duplicate document path: ${duplicate}`, duplicate));
  }

  for (const entry of registry.entries) {
    const documentId = String(entry.documentId ?? '');
    const documentPath = String(entry.path ?? '');
    if (!DOCUMENT_ID.test(documentId)) findings.push(finding('DOCUMENT_ID_INVALID', `Invalid documentId: ${documentId}`, documentPath || DOCUMENT_REGISTRY_PATH));
    if (!String(entry.type ?? '').trim()) findings.push(finding('DOCUMENT_TYPE_MISSING', `${documentId}: type is required.`, documentPath));
    if (!String(entry.owner ?? '').trim()) findings.push(finding('DOCUMENT_OWNER_MISSING', `${documentId}: owner is required.`, documentPath));
    if (!String(entry.authority ?? '').trim()) findings.push(finding('DOCUMENT_AUTHORITY_MISSING', `${documentId}: authority is required.`, documentPath));
    if (!SEMVER.test(String(entry.version ?? ''))) findings.push(finding('DOCUMENT_VERSION_INVALID', `${documentId}: invalid version ${String(entry.version ?? '')}`, documentPath));
    if (!ALLOWED_LANGUAGES.has(String(entry.language ?? ''))) findings.push(finding('DOCUMENT_LANGUAGE_INVALID', `${documentId}: invalid language ${String(entry.language ?? '')}`, documentPath));
    if (!ALLOWED_LIFECYCLES.has(String(entry.lifecycle ?? ''))) findings.push(finding('DOCUMENT_LIFECYCLE_INVALID', `${documentId}: invalid lifecycle ${String(entry.lifecycle ?? '')}`, documentPath));

    const target = resolveRegistryTarget(repoRoot, documentPath);
    if (!target) {
      findings.push(finding('DOCUMENT_PATH_INVALID', `${documentId}: path must remain repository-relative.`, documentPath || DOCUMENT_REGISTRY_PATH));
    } else if (!fs.existsSync(target)) {
      findings.push(finding('DOCUMENT_TARGET_MISSING', `${documentId}: registry target does not exist.`, documentPath));
    }
  }

  return findings.sort((left, right) => `${left.code}:${left.path ?? ''}:${left.message}`.localeCompare(`${right.code}:${right.path ?? ''}:${right.message}`));
}

export function assertDocumentationHygiene(repoRoot = process.cwd()): void {
  const findings = collectDocumentationHygieneFindings(repoRoot);
  if (findings.length === 0) return;
  const details = findings.map((item) => `- ${item.code}${item.path ? ` [${item.path}]` : ''}: ${item.message}`).join('\n');
  throw new Error(`${DOCUMENTATION_HYGIENE_VALIDATOR_VERSION} found ${findings.length} violation(s):\n${details}`);
}
