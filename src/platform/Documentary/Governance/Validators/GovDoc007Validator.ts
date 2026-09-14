import fs from 'node:fs';
import path from 'node:path';

export const GOV_DOC_007_VALIDATOR_VERSION = 'gov-doc-007-validator/1.0.0' as const;

export const GOV_DOC_007_RULE = Object.freeze({
  ruleId: 'GOV-DOC-007',
  name: 'Unresolved documentation reference',
  area: 'DOC',
  description: 'Document with an unresolved reference.',
  severity: 'Low',
  rationale: 'Explicit repository-local documentation references must resolve to existing repository targets.',
  essReference: 'ESS-0012-CONTRACTS Chapter 2.5',
  evidenceType: 'FileReference',
  version: '1.0.0',
} as const);

export interface GovDoc007ReferenceCandidate {
  documentId: string;
  documentPath: string;
  line: number;
  referencedPath: string;
}

export interface GovDoc007Finding {
  ruleId: typeof GOV_DOC_007_RULE.ruleId;
  severity: typeof GOV_DOC_007_RULE.severity;
  area: typeof GOV_DOC_007_RULE.area;
  documentId: string;
  documentPath: string;
  message: string;
  evidence: Array<{
    type: 'FileReference';
    path: string;
    line: number;
    referencedPath: string;
  }>;
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

function isSafeRepoPath(value: string): boolean {
  const normalized = normalizeRepoPath(value);
  return Boolean(normalized)
    && !normalized.startsWith('/')
    && !/^[A-Za-z]:\//.test(normalized)
    && !normalized.split('/').includes('..');
}

function isExternalOrFragment(value: string): boolean {
  return value.startsWith('#')
    || value.startsWith('//')
    || value.startsWith('/')
    || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value);
}

function resolveReference(repoRoot: string, documentPath: string, referencedPath: string): string | null {
  const target = referencedPath.split(/[?#]/, 1)[0].trim();
  if (!target || isExternalOrFragment(referencedPath)) return null;

  const root = path.resolve(repoRoot);
  const sourceDirectory = path.dirname(path.resolve(root, documentPath));
  const absoluteTarget = path.resolve(sourceDirectory, target);
  if (absoluteTarget !== root && !absoluteTarget.startsWith(`${root}${path.sep}`)) return '__INVALID__';
  return normalizeRepoPath(path.relative(root, absoluteTarget));
}

function targetExists(repoRoot: string, relativePath: string): boolean {
  const absolute = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(absolute)) return false;
  return !fs.lstatSync(absolute).isSymbolicLink();
}

export function collectGovDoc007Findings(options: {
  repoRoot?: string;
  references: readonly GovDoc007ReferenceCandidate[];
}): GovDoc007Finding[] {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const findings: GovDoc007Finding[] = [];

  const references = [...options.references].sort((left, right) =>
    `${normalizeRepoPath(left.documentPath)}:${String(left.line).padStart(10, '0')}:${left.referencedPath}`
      .localeCompare(`${normalizeRepoPath(right.documentPath)}:${String(right.line).padStart(10, '0')}:${right.referencedPath}`));

  for (const reference of references) {
    const documentId = reference.documentId.trim();
    const documentPath = normalizeRepoPath(reference.documentPath);
    if (!documentId || !isSafeRepoPath(documentPath) || !Number.isInteger(reference.line) || reference.line < 1) {
      throw new Error('[GovDoc007Validator] reference evidence requires documentId, a safe repository-relative documentPath and a positive integer line.');
    }

    const resolvedPath = resolveReference(repoRoot, documentPath, reference.referencedPath);
    if (resolvedPath === null) continue;
    if (resolvedPath !== '__INVALID__' && targetExists(repoRoot, resolvedPath)) continue;

    const referencedPath = resolvedPath === '__INVALID__' ? reference.referencedPath : resolvedPath;
    findings.push({
      ruleId: GOV_DOC_007_RULE.ruleId,
      severity: GOV_DOC_007_RULE.severity,
      area: GOV_DOC_007_RULE.area,
      documentId,
      documentPath,
      message: `${documentId}: documentation reference does not resolve: ${referencedPath}.`,
      evidence: [{
        type: 'FileReference',
        path: documentPath,
        line: reference.line,
        referencedPath,
      }],
    });
  }

  return findings;
}
