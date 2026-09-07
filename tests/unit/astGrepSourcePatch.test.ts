import { describe, expect, it } from 'vitest';
import {
  AST_GREP_VERSION,
  assertTextPostconditions,
  assertTypeScriptSyntax,
  buildAstGrepApplyArgs,
  buildAstGrepScanArgs,
  parseAstGrepJson,
  resolveAstGrepInvocation,
  validateSourcePatchPlan,
  type SourcePatchPlan,
} from '../../scripts/operations/sourcePatch/astGrepSourcePatch';

const plan: SourcePatchPlan = {
  id: 'bb-2e-dashboard-drawer-strangler',
  target: 'src/components/Dashboard.tsx',
  rule: 'scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.yml',
  expectedMatches: 1,
  expectedPostMatches: 0,
  requiredAfter: ['DashboardNavigation'],
  forbiddenAfter: ['setMenuOpen(true)'],
};

describe('guarded ast-grep source patch contract', () => {
  it('normalizes a bounded single-file source patch plan', () => {
    expect(validateSourcePatchPlan(plan)).toEqual(plan);
  });

  it('rejects traversal and non-kebab plan identifiers', () => {
    expect(() => validateSourcePatchPlan({ ...plan, target: '../Dashboard.tsx' })).toThrow(/repository-relative/);
    expect(() => validateSourcePatchPlan({ ...plan, id: 'BB 2E' })).toThrow(/kebab-case/);
  });

  it('rejects rules outside the approved codemod roots', () => {
    expect(() => validateSourcePatchPlan({ ...plan, rule: 'src/components/rewrite.yml' })).toThrow(
      /outside allowed rule roots/,
    );
  });

  it('builds dry-run and apply commands against the exact target', () => {
    expect(buildAstGrepScanArgs(plan)).toEqual([
      'scan',
      '--rule',
      'scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.yml',
      '--json=compact',
      'src/components/Dashboard.tsx',
    ]);
    expect(buildAstGrepApplyArgs(plan)).toEqual([
      'scan',
      '--rule',
      'scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.yml',
      '--update-all',
      'src/components/Dashboard.tsx',
    ]);
  });

  it('parses compact ast-grep JSON and preserves exact match cardinality', () => {
    expect(parseAstGrepJson('[{"file":"src/components/Dashboard.tsx"}]')).toHaveLength(1);
    expect(parseAstGrepJson('')).toEqual([]);
    expect(() => parseAstGrepJson('{"file":"x"}')).toThrow(/must be an array/);
  });

  it('enforces required and forbidden postconditions', () => {
    expect(() => assertTextPostconditions('DashboardNavigation', plan)).not.toThrow();
    expect(() => assertTextPostconditions('DashboardNavigation setMenuOpen(true)', plan)).toThrow(
      /forbidden postcondition/,
    );
  });

  it('parses TypeScript and TSX after a rewrite', () => {
    expect(() => assertTypeScriptSyntax('example.ts', 'export const answer: number = 42;')).not.toThrow();
    expect(() => assertTypeScriptSyntax('example.tsx', 'export const View = () => <main>ok</main>;')).not.toThrow();
    expect(() => assertTypeScriptSyntax('example.tsx', 'export const View = () => <main>')).toThrow(/parse failed/);
  });

  it('fails closed when ast-grep is absent and download was not authorized', () => {
    expect(() => resolveAstGrepInvocation('/definitely/not/a/repo', false)).toThrow(/not installed locally/);
  });

  it('pins the npm-exec fallback to the reviewed ast-grep version', () => {
    const invocation = resolveAstGrepInvocation('/definitely/not/a/repo', true);
    expect(invocation.source).toBe('npm-exec');
    expect(invocation.argsPrefix.join(' ')).toContain(`@ast-grep/cli@${AST_GREP_VERSION}`);
  });
});
