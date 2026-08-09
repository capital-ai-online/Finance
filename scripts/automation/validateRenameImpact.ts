import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createDefaultVocabularyRegistry, type IVocabularyRegistry } from '../../src/platform/Vocabulary';

export type RenameClassification = 'SAFE' | 'CONDITIONAL' | 'BLOCKED';
export type RenameFindingSeverity = 'info' | 'warning' | 'blocker';

export interface RenameFinding {
  code: string;
  severity: RenameFindingSeverity;
  message: string;
  file?: string;
  line?: number;
}

export interface RenameImpactReport {
  sourceTerm: string;
  targetTerm: string;
  classification: RenameClassification;
  scannedFiles: number;
  references: number;
  runtimeReferences: number;
  documentationReferences: number;
  findings: RenameFinding[];
  requiredGates: string[];
}

export interface RenameImpactOptions {
  rootDir: string;
  sourceTerm: string;
  targetTerm: string;
  registry?: IVocabularyRegistry;
}

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.md', '.css', '.html', '.sql', '.env', '.txt',
]);

const IGNORED_DIRECTORIES = new Set([
  '.git', 'node_modules', 'dist', 'coverage', '.vite', '.cache', '.next', 'build',
]);

const RUNTIME_PREFIXES = ['src/', 'server.ts', 'scripts/', 'config/', '.github/'];
const DOCUMENTATION_PREFIXES = ['docs/', '.ai/'];

function normalizeRelative(file: string): string {
  return file.replaceAll(path.sep, '/');
}

function isRuntimePath(relative: string): boolean {
  return RUNTIME_PREFIXES.some((prefix) => relative === prefix || relative.startsWith(prefix));
}

function isDocumentationPath(relative: string): boolean {
  return DOCUMENTATION_PREFIXES.some((prefix) => relative.startsWith(prefix));
}

function walk(rootDir: string): string[] {
  const results: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && (TEXT_EXTENSIONS.has(path.extname(entry.name)) || entry.name === 'Dockerfile')) {
        results.push(fullPath);
      }
    }
  }

  return results.sort();
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsIdentifier(content: string, term: string): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  const regex = new RegExp(`(?<![A-Za-z0-9_$])${escapeRegex(term)}(?![A-Za-z0-9_$])`, 'g');
  for (let match = regex.exec(content); match; match = regex.exec(content)) matches.push(match);
  return matches;
}

function isSensitiveReference(content: string, term: string): string | undefined {
  const escaped = escapeRegex(term);
  const checks: Array<[string, RegExp]> = [
    ['ENV_OR_CONFIG_REFERENCE', new RegExp(`(?:process\\.env\\.|import\\.meta\\.env\\.|env\\s*[:=]|config)[^\\n]{0,100}${escaped}`, 'i')],
    ['API_OR_ROUTE_REFERENCE', new RegExp(`(?:(?:app|router)\\.(?:get|post|put|patch|delete)[^\\n]*${escaped}|/api/[^\\n]*${escaped})`, 'i')],
    ['DYNAMIC_IMPORT_REFERENCE', new RegExp(`(?:import\\s*\\(|lazy\\s*\\()[^\\n]{0,120}${escaped}`, 'i')],
    ['SCHEMA_OR_CONTRACT_REFERENCE', new RegExp(`(?:schema|contract|zod|interface|type)[^\\n]{0,120}${escaped}`, 'i')],
  ];

  for (const [code, regex] of checks) {
    if (regex.test(content)) return code;
  }
  return undefined;
}

function targetNamingFindings(targetTerm: string, registry: IVocabularyRegistry): RenameFinding[] {
  const findings: RenameFinding[] = [];
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(targetTerm)) {
    findings.push({
      code: 'TARGET_IDENTIFIER_REGEX',
      severity: 'blocker',
      message: `Target term "${targetTerm}" does not satisfy the technical identifier regex.`,
    });
  }

  const forbidden = registry.findForbiddenUsage(targetTerm);
  if (forbidden.length > 0) {
    findings.push({
      code: 'TARGET_FORBIDDEN_TERM',
      severity: 'blocker',
      message: `Target term "${targetTerm}" is forbidden by Vocabulary concepts: ${forbidden.map((entry) => entry.id).join(', ')}.`,
    });
  }

  const targetConcept = registry.resolveTerm(targetTerm);
  if (!targetConcept || targetConcept.canonicalCodeTerm !== targetTerm || targetConcept.status !== 'approved') {
    findings.push({
      code: 'TARGET_NOT_APPROVED_CANONICAL_TERM',
      severity: 'blocker',
      message: `Target term "${targetTerm}" is not an approved canonicalCodeTerm in the Vocabulary Registry.`,
    });
  }

  return findings;
}

export function analyzeRenameImpact(options: RenameImpactOptions): RenameImpactReport {
  const rootDir = path.resolve(options.rootDir);
  const registry = options.registry ?? createDefaultVocabularyRegistry();
  const findings: RenameFinding[] = targetNamingFindings(options.targetTerm, registry);
  let references = 0;
  let runtimeReferences = 0;
  let documentationReferences = 0;

  if (options.sourceTerm === options.targetTerm) {
    findings.push({ code: 'NO_OP_RENAME', severity: 'blocker', message: 'Source and target terms are identical.' });
  }
  if (options.sourceTerm.toLowerCase() === options.targetTerm.toLowerCase() && options.sourceTerm !== options.targetTerm) {
    findings.push({
      code: 'CASE_ONLY_RENAME',
      severity: 'blocker',
      message: 'Case-only renames are blocked because Linux/Windows/macOS filesystem behavior can diverge. Use an explicit two-step migration.',
    });
  }

  const files = walk(rootDir);
  for (const file of files) {
    const relative = normalizeRelative(path.relative(rootDir, file));
    const content = fs.readFileSync(file, 'utf8');
    const matches = containsIdentifier(content, options.sourceTerm);
    if (matches.length === 0) continue;

    references += matches.length;
    if (isRuntimePath(relative)) runtimeReferences += matches.length;
    if (isDocumentationPath(relative)) documentationReferences += matches.length;

    const sensitiveCode = isSensitiveReference(content, options.sourceTerm);
    if (sensitiveCode && isRuntimePath(relative)) {
      findings.push({
        code: sensitiveCode,
        severity: 'blocker',
        message: `Sensitive rename surface detected in ${relative}.`,
        file: relative,
        line: lineNumber(content, matches[0].index),
      });
    } else if (isRuntimePath(relative)) {
      findings.push({
        code: 'RUNTIME_REFERENCE',
        severity: 'warning',
        message: `Runtime reference requires dependency-aware migration in ${relative}.`,
        file: relative,
        line: lineNumber(content, matches[0].index),
      });
    } else {
      findings.push({
        code: 'NON_RUNTIME_REFERENCE',
        severity: 'info',
        message: `Non-runtime reference detected in ${relative}.`,
        file: relative,
        line: lineNumber(content, matches[0].index),
      });
    }
  }

  const hasBlocker = findings.some((finding) => finding.severity === 'blocker');
  const hasRuntimeReference = runtimeReferences > 0;
  const classification: RenameClassification = hasBlocker ? 'BLOCKED' : hasRuntimeReference ? 'CONDITIONAL' : 'SAFE';

  return {
    sourceTerm: options.sourceTerm,
    targetTerm: options.targetTerm,
    classification,
    scannedFiles: files.length,
    references,
    runtimeReferences,
    documentationReferences,
    findings,
    requiredGates: ['npm run lint', 'npm test', 'npm run build', 'npm run predeploy:check'],
  };
}

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runCli(): void {
  const sourceTerm = readArg('--from');
  const targetTerm = readArg('--to');
  const rootDir = readArg('--root') ?? process.cwd();

  if (!sourceTerm || !targetTerm) {
    console.error('Usage: npm run rename:validate -- --from <SourceTerm> --to <ApprovedCanonicalTerm> [--root <path>]');
    process.exitCode = 2;
    return;
  }

  const report = analyzeRenameImpact({ rootDir, sourceTerm, targetTerm });
  console.log(JSON.stringify(report, null, 2));
  if (report.classification === 'BLOCKED') process.exitCode = 1;
}

const isDirectExecution = Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) runCli();
