import fs from 'node:fs';
import path from 'node:path';

export const DOCUMENTATION_HYGIENE_VALIDATOR_VERSION = 'documentation-hygiene-validator/1.3.0' as const;
export const DOCUMENT_LIFECYCLE_POLICY_PATH = 'docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md' as const;
/** @deprecated Historical compatibility alias; use DOCUMENT_LIFECYCLE_POLICY_PATH. */
export const DOCUMENTATION_HYGIENE_POLICY_PATH = DOCUMENT_LIFECYCLE_POLICY_PATH;
export const DOCUMENT_REGISTRY_PATH = 'docs/governance/document-registry.json' as const;

export interface RegistryEntry {
  documentId: string;
  type: string;
  owner: string;
  authority: string;
  version: string;
  language: 'de' | 'en' | 'mixed' | string;
  lifecycle: 'draft' | 'generated' | 'reviewed' | 'approved' | 'superseded' | 'archived' | 'suspended' | 'historical' | string;
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
const ALLOWED_LIFECYCLES = new Set(['draft', 'generated', 'reviewed', 'approved', 'superseded', 'archived', 'suspended', 'historical']);
const SEMVER = /^\d+\.\d+\.\d+$/;
const DOCUMENT_ID = /^DOC-[A-Z0-9-]+$/;

const CURRENT_DATA_ROUTING_PROJECTION_PATHS = Object.freeze([
  'docs/projects/README.md',
  'docs/projects/PROJECT_VALUE_CHAIN.md',
  'docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md',
  'docs/projects/fintech/VALIDATION_REPORT.md',
  'docs/projects/operations/CROSS_PROJECT_DEPENDENCIES.md',
  'docs/compliance/CAPITAL-AI-COMP/mappings/COMPLIANCE_HANDOFF_REGISTER.md',
  'docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md',
  'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md',
]);

const ACTIVE_DATA_ROUTING_PATTERNS = Object.freeze([
  {
    code: 'SUPERSEDED_DATA_PROJECT_ROUTE',
    pattern: /^\s*\|\s*`?CAPITAL-AI-DATA`?\s*\|/i,
    message: 'Current project projection must not route an active row to CAPITAL-AI-DATA.',
  },
  {
    code: 'SUPERSEDED_DATA_PVC_OWNER',
    pattern: /PVC-(?:09|10|11)[^\n]*CAPITAL-AI-DATA/i,
    message: 'PVC-09..11 current ownership must resolve to CAPITAL-AI-FINTECH.',
  },
  {
    code: 'SUPERSEDED_DATA_HANDOFF_TARGET',
    pattern: /\[(?:CROSS_PROJECT_HANDOFF|SECURITY_HANDOFF|COMPLIANCE_HANDOFF)\s*->\s*CAPITAL-AI-DATA\b/i,
    message: 'Current handoff target must not resolve to CAPITAL-AI-DATA.',
  },
  {
    code: 'SUPERSEDED_DATA_ROUTE_FIELD',
    pattern: /^\s*[-*]?\s*(?:\*\*)?(?:target_project|primary_owner|roadmap_reference|target_project\s*\/\s*affected_project)(?:\*\*)?\s*:\s*.*(?:CAPITAL-AI-DATA|docs\/projects\/data\/)/i,
    message: 'Current routing fields must resolve former DATA scope to CAPITAL-AI-FINTECH.',
  },
  {
    code: 'SUPERSEDED_DATA_PROJECT_PATH',
    pattern: /docs\/projects\/data\//i,
    message: 'docs/projects/data/ is retired and must not be referenced as a current project route.',
  },
]);

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

export function collectDataOwnershipRoutingFindings(repoRoot = process.cwd()): DocumentationHygieneFinding[] {
  const findings: DocumentationHygieneFinding[] = [];

  for (const relativePath of CURRENT_DATA_ROUTING_PROJECTION_PATHS) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) continue;

    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of ACTIVE_DATA_ROUTING_PATTERNS) {
        if (!rule.pattern.test(line)) continue;
        findings.push(finding(
          rule.code,
          `${rule.message} Line ${index + 1}: ${line.trim()}`,
          relativePath,
        ));
      }
    });
  }

  return findings.sort((left, right) => `${left.code}:${left.path ?? ''}:${left.message}`.localeCompare(`${right.code}:${right.path ?? ''}:${right.message}`));
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

  findings.push(...collectDataOwnershipRoutingFindings(repoRoot));

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
  if (registry.authority !== DOCUMENT_LIFECYCLE_POLICY_PATH) {
    findings.push(finding('REGISTRY_AUTHORITY_INVALID', `Registry authority must be ${DOCUMENT_LIFECYCLE_POLICY_PATH}`, DOCUMENT_REGISTRY_PATH));
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
