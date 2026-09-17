import { existsSync, readFileSync } from 'node:fs';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import * as ts from '@typescript/typescript6';

export const AST_GREP_PACKAGE = '@ast-grep/cli';
export const AST_GREP_VERSION = '0.45.3';

const ALLOWED_TARGET_ROOTS = ['src/', 'tests/', 'scripts/'];
const ALLOWED_RULE_ROOTS = ['scripts/operations/sourcePatch/rules/', 'scripts/frontend/codemods/'];

export interface SourcePatchPlan {
  id: string;
  target: string;
  rule: string;
  expectedMatches: number;
  expectedPostMatches?: number;
  requiredAfter?: string[];
  forbiddenAfter?: string[];
}

export interface AstGrepInvocation {
  command: string;
  argsPrefix: string[];
  source: 'local' | 'npm-exec';
}

function normalizeRepoPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function isWithinAllowedRoot(value: string, roots: string[]): boolean {
  return roots.some((root) => value.startsWith(root));
}

function assertSafeRepoRelativePath(value: string, field: string): string {
  const normalized = normalizeRepoPath(value.trim());
  if (!normalized || isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`${field} must be a repository-relative path without traversal`);
  }
  return normalized;
}

export function validateSourcePatchPlan(plan: SourcePatchPlan): SourcePatchPlan {
  if (!plan || typeof plan !== 'object') throw new Error('source patch plan is required');
  if (!plan.id || !/^[a-z0-9][a-z0-9-]*$/.test(plan.id)) {
    throw new Error('plan.id must be lowercase kebab-case');
  }

  const target = assertSafeRepoRelativePath(plan.target, 'plan.target');
  const rule = assertSafeRepoRelativePath(plan.rule, 'plan.rule');

  if (!isWithinAllowedRoot(target, ALLOWED_TARGET_ROOTS)) {
    throw new Error(`plan.target is outside allowed roots: ${target}`);
  }
  if (!isWithinAllowedRoot(rule, ALLOWED_RULE_ROOTS)) {
    throw new Error(`plan.rule is outside allowed rule roots: ${rule}`);
  }
  if (!Number.isInteger(plan.expectedMatches) || plan.expectedMatches < 1) {
    throw new Error('plan.expectedMatches must be an integer >= 1');
  }
  if (plan.expectedPostMatches !== undefined && (!Number.isInteger(plan.expectedPostMatches) || plan.expectedPostMatches < 0)) {
    throw new Error('plan.expectedPostMatches must be an integer >= 0');
  }

  return {
    ...plan,
    target,
    rule,
    expectedPostMatches: plan.expectedPostMatches ?? 0,
    requiredAfter: [...(plan.requiredAfter ?? [])],
    forbiddenAfter: [...(plan.forbiddenAfter ?? [])],
  };
}

export function buildAstGrepScanArgs(plan: SourcePatchPlan): string[] {
  const validated = validateSourcePatchPlan(plan);
  return ['scan', '--rule', validated.rule, '--json=compact', validated.target];
}

export function buildAstGrepApplyArgs(plan: SourcePatchPlan): string[] {
  const validated = validateSourcePatchPlan(plan);
  return ['scan', '--rule', validated.rule, '--update-all', validated.target];
}

export function parseAstGrepJson(stdout: string): unknown[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed) as unknown;
  if (!Array.isArray(parsed)) throw new Error('ast-grep JSON output must be an array');
  return parsed;
}

export function assertTextPostconditions(source: string, plan: SourcePatchPlan): void {
  for (const required of plan.requiredAfter ?? []) {
    if (!source.includes(required)) throw new Error(`required postcondition missing: ${required}`);
  }
  for (const forbidden of plan.forbiddenAfter ?? []) {
    if (source.includes(forbidden)) throw new Error(`forbidden postcondition still present: ${forbidden}`);
  }
}

export function assertTypeScriptSyntax(filePath: string, source: string): void {
  const extension = extname(filePath).toLowerCase();
  if (!['.ts', '.tsx', '.mts', '.cts'].includes(extension)) return;

  const scriptKind = extension === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);
  const diagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    const message = diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('; ');
    throw new Error(`TypeScript parse failed for ${filePath}: ${message}`);
  }
}

function localAstGrepBinary(repoRoot: string): string | null {
  const unix = resolve(repoRoot, 'node_modules/.bin/ast-grep');
  if (existsSync(unix)) return unix;
  const windows = resolve(repoRoot, 'node_modules/.bin/ast-grep.cmd');
  if (existsSync(windows)) return windows;
  return null;
}

export function resolveAstGrepInvocation(repoRoot: string, allowDownload: boolean): AstGrepInvocation {
  const local = localAstGrepBinary(repoRoot);
  if (local) return { command: local, argsPrefix: [], source: 'local' };
  if (!allowDownload) {
    throw new Error(
      `ast-grep ${AST_GREP_VERSION} is not installed locally; rerun with --allow-download to use a pinned npm exec invocation`,
    );
  }
  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    argsPrefix: ['exec', '--yes', `--package=${AST_GREP_PACKAGE}@${AST_GREP_VERSION}`, '--', 'ast-grep'],
    source: 'npm-exec',
  };
}

function execute(invocation: AstGrepInvocation, args: string[], repoRoot: string): string {
  const result = spawnSync(invocation.command, [...invocation.argsPrefix, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`ast-grep command failed (${result.status}): ${String(result.stderr).trim()}`);
  }
  return String(result.stdout);
}

function assertAstGrepVersion(invocation: AstGrepInvocation, repoRoot: string): void {
  const version = execute(invocation, ['--version'], repoRoot).trim();
  if (!version.includes(AST_GREP_VERSION)) {
    throw new Error(`ast-grep version mismatch: expected ${AST_GREP_VERSION}, observed ${version || '<empty>'}`);
  }
}

function readPlan(repoRoot: string, planPath: string): SourcePatchPlan {
  const safePlanPath = assertSafeRepoRelativePath(planPath, 'plan path');
  const absolute = resolve(repoRoot, safePlanPath);
  const rel = normalizeRepoPath(relative(repoRoot, absolute));
  if (rel.startsWith(`..${sep}`) || rel === '..') throw new Error('plan path escapes repository root');
  return validateSourcePatchPlan(JSON.parse(readFileSync(absolute, 'utf8')) as SourcePatchPlan);
}

function parseCliArgs(argv: string[]): { planPath: string; apply: boolean; allowDownload: boolean } {
  let planPath = '';
  let apply = false;
  let allowDownload = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') {
      planPath = argv[index + 1] ?? '';
      index += 1;
    } else if (arg === '--apply') {
      apply = true;
    } else if (arg === '--allow-download') {
      allowDownload = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!planPath) throw new Error('--plan <repository-relative-json-file> is required');
  return { planPath, apply, allowDownload };
}

export function runSourcePatch(argv = process.argv.slice(2), repoRoot = process.cwd()): void {
  const { planPath, apply, allowDownload } = parseCliArgs(argv);
  const plan = readPlan(repoRoot, planPath);
  const invocation = resolveAstGrepInvocation(repoRoot, allowDownload);
  assertAstGrepVersion(invocation, repoRoot);

  const beforeMatches = parseAstGrepJson(execute(invocation, buildAstGrepScanArgs(plan), repoRoot));
  if (beforeMatches.length !== plan.expectedMatches) {
    throw new Error(
      `precondition cardinality failed for ${plan.id}: expected ${plan.expectedMatches}, observed ${beforeMatches.length}`,
    );
  }

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify({ id: plan.id, target: plan.target, rule: plan.rule, matches: beforeMatches.length, mode: 'dry-run' })}\n`,
    );
    return;
  }

  execute(invocation, buildAstGrepApplyArgs(plan), repoRoot);

  const afterMatches = parseAstGrepJson(execute(invocation, buildAstGrepScanArgs(plan), repoRoot));
  if (afterMatches.length !== (plan.expectedPostMatches ?? 0)) {
    throw new Error(
      `postcondition cardinality failed for ${plan.id}: expected ${plan.expectedPostMatches ?? 0}, observed ${afterMatches.length}`,
    );
  }

  const targetSource = readFileSync(resolve(repoRoot, plan.target), 'utf8');
  assertTextPostconditions(targetSource, plan);
  assertTypeScriptSyntax(plan.target, targetSource);

  process.stdout.write(
    `${JSON.stringify({ id: plan.id, target: plan.target, rule: plan.rule, matchesBefore: beforeMatches.length, matchesAfter: afterMatches.length, mode: 'apply', astGrepSource: invocation.source })}\n`,
  );
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) runSourcePatch();
