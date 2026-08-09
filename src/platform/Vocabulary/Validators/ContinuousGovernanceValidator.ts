import fs from 'fs';
import path from 'path';
import { createDefaultVocabularyRegistry } from '../index';

export interface ContinuousGovernanceFinding {
  ruleId: string;
  severity: 'error' | 'warning';
  path: string;
  term: string;
  conceptId?: string;
  message: string;
}

export interface ContinuousGovernanceReport {
  checkedAt: string;
  compliant: boolean;
  blocking: boolean;
  scannedFiles: number;
  findings: ContinuousGovernanceFinding[];
}

const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.yaml', '.yml']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'uploads']);
const LEGACY_EVIDENCE_PATHS = new Set([
  'docs/governance/vocabulary/rename-candidates.json',
  'docs/governance/vocabulary/rename-classification-evidence.json',
  'docs/governance/vocabulary/rename-backlog.json',
]);

function walk(root: string, current = root, result: string[] = []): string[] {
  if (!fs.existsSync(current)) return result;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walk(root, absolute, result);
    else if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) result.push(absolute);
  }
  return result;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsTerm(content: string, term: string): boolean {
  const pattern = new RegExp(`(^|[^A-Za-z0-9_])${escapeRegex(term)}([^A-Za-z0-9_]|$)`, 'i');
  return pattern.test(content);
}

export function validateContinuousVocabularyGovernance(root: string = process.cwd()): ContinuousGovernanceReport {
  const registry = createDefaultVocabularyRegistry();
  const concepts = registry.list();
  const findings: ContinuousGovernanceFinding[] = [];
  const files = walk(root);

  for (const absolute of files) {
    const relative = path.relative(root, absolute).replace(/\\/g, '/');
    if (LEGACY_EVIDENCE_PATHS.has(relative)) continue;
    const content = fs.readFileSync(absolute, 'utf8');

    for (const concept of concepts) {
      for (const forbiddenTerm of concept.forbiddenTerms) {
        if (containsTerm(content, forbiddenTerm)) {
          findings.push({
            ruleId: 'VOC-CONT-001',
            severity: 'error',
            path: relative,
            term: forbiddenTerm,
            conceptId: concept.id,
            message: `Forbidden vocabulary term "${forbiddenTerm}" detected; use ${concept.canonicalCodeTerm}.`,
          });
        }
      }
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    compliant: findings.length === 0,
    blocking: findings.some((finding) => finding.severity === 'error'),
    scannedFiles: files.length,
    findings,
  };
}
