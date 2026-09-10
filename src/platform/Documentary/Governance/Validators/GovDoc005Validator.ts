import fs from 'node:fs';
import path from 'node:path';
import type { RegistryEntry } from '../Services/DocumentationHygieneValidator';
import { DOCUMENT_REGISTRY_PATH } from '../Services/DocumentationHygieneValidator';

export const GOV_DOC_005_VALIDATOR_VERSION = 'gov-doc-005-validator/1.0.0' as const;

export const GOV_DOC_005_RULE = Object.freeze({
  ruleId: 'GOV-DOC-005',
  name: 'Documentation path exception',
  area: 'DOC',
  description: 'Documentation outside docs/ without a registered exception.',
  severity: 'High',
  rationale: 'Markdown documentation outside docs/ must be explicitly registered by exact repository-relative path.',
  essReference: 'ESS-0012-CONTRACTS Chapter 2.5',
  evidenceType: 'FileReference',
  version: '1.0.0',
} as const);

export interface GovDoc005FileReferenceEvidence {
  type: 'FileReference';
  path: string;
  line: number;
  referencedPath: string;
}

export interface GovDoc005Finding {
  ruleId: typeof GOV_DOC_005_RULE.ruleId;
  severity: typeof GOV_DOC_005_RULE.severity;
  area: typeof GOV_DOC_005_RULE.area;
  documentId: string;
  documentPath: string;
  message: string;
  evidence: GovDoc005FileReferenceEvidence[];
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

function isDocsPath(value: string): boolean {
  const normalized = normalizeRepoPath(value);
  return normalized === 'docs' || normalized.startsWith('docs/');
}

function isMarkdownPath(value: string): boolean {
  return /\.md$/i.test(normalizeRepoPath(value));
}

function resolveRegularNonSymlinkFile(repoRoot: string, relativePath: string): string | null {
  const normalized = normalizeRepoPath(relativePath);
  if (!normalized || path.isAbsolute(normalized)) return null;

  const root = path.resolve(repoRoot);
  const absolute = path.resolve(root, normalized);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  if (!fs.existsSync(absolute)) return null;

  const stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  return absolute;
}

function readRegistryEntries(repoRoot: string): RegistryEntry[] {
  const registryPath = path.join(repoRoot, DOCUMENT_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    throw new Error(`[GovDoc005Validator] document registry is required: ${DOCUMENT_REGISTRY_PATH}`);
  }

  const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as { entries?: RegistryEntry[] };
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`[GovDoc005Validator] document registry entries are required: ${DOCUMENT_REGISTRY_PATH}`);
  }
  return parsed.entries;
}

export function collectGovDoc005Findings(options: {
  repoRoot?: string;
  documentPaths: readonly string[];
  entries?: readonly RegistryEntry[];
}): GovDoc005Finding[] {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const entries = options.entries ?? readRegistryEntries(repoRoot);
  const registeredPaths = new Set(
    entries
      .map((entry) => normalizeRepoPath(String(entry.path ?? '')))
      .filter((entryPath) => entryPath.length > 0),
  );

  const candidatePaths = [...new Set(options.documentPaths.map(normalizeRepoPath).filter(Boolean))].sort();
  const findings: GovDoc005Finding[] = [];

  for (const documentPath of candidatePaths) {
    if (!isMarkdownPath(documentPath) || isDocsPath(documentPath)) continue;
    if (registeredPaths.has(documentPath)) continue;
    if (!resolveRegularNonSymlinkFile(repoRoot, documentPath)) continue;

    findings.push({
      ruleId: GOV_DOC_005_RULE.ruleId,
      severity: GOV_DOC_005_RULE.severity,
      area: GOV_DOC_005_RULE.area,
      documentId: `UNREGISTERED:${documentPath}`,
      documentPath,
      message: `${documentPath}: Markdown documentation is outside docs/ and has no exact registered exception in ${DOCUMENT_REGISTRY_PATH}.`,
      evidence: [{
        type: 'FileReference',
        path: documentPath,
        line: 1,
        referencedPath: documentPath,
      }],
    });
  }

  return findings;
}
