import path from 'node:path';
import {
  analyzeSemanticFreshness,
  type SourceChangeEvidence,
  type SemanticFreshnessReport,
} from './SemanticFreshnessAnalyzer';

export const APPLICATION_CHANGE_IMPACT_ANALYZER_VERSION = 'documentary-application-change-impact/1.0.0' as const;

export type ApplicationChangeKind =
  | 'ROUTE'
  | 'DEPENDENCY'
  | 'RUNTIME'
  | 'CONTRACT'
  | 'CONFIG'
  | 'DOCUMENTATION'
  | 'WORKFLOW'
  | 'UNKNOWN';

export interface ApplicationChangeImpact {
  analyzerVersion: typeof APPLICATION_CHANGE_IMPACT_ANALYZER_VERSION;
  correlationId: string;
  sourceCommit: string;
  changedPaths: string[];
  changeKinds: Record<ApplicationChangeKind, string[]>;
  patchableDocumentationPaths: string[];
  reviewOnlyDocumentationPaths: string[];
  dependencySignals: string[];
  routeSignals: string[];
  freshness: SemanticFreshnessReport;
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').trim();
}

export function classifyApplicationChange(pathValue: string): ApplicationChangeKind {
  const value = normalize(pathValue).toLowerCase();
  const basename = path.posix.basename(value);

  if (value.startsWith('.github/workflows/')) return 'WORKFLOW';
  if (
    value.startsWith('docs/contracts/') ||
    value.includes('/contracts/') ||
    value.endsWith('.schema.json') ||
    value.endsWith('.schema.ts')
  ) return 'CONTRACT';
  if (value.startsWith('docs/')) return 'DOCUMENTATION';
  if (
    value === 'package.json' ||
    value.endsWith('/package.json') ||
    /(^|\/)(package-lock|pnpm-lock|yarn\.lock)/.test(value) ||
    value.includes('dependencies')
  ) return 'DEPENDENCY';
  if (
    value.includes('/route') ||
    value.includes('/router') ||
    value.startsWith('server/routes/') ||
    basename === 'server.ts' ||
    basename === 'app.tsx'
  ) return 'ROUTE';
  if (
    value.endsWith('.yml') ||
    value.endsWith('.yaml') ||
    value.endsWith('.json') ||
    value.endsWith('.toml') ||
    value.endsWith('.env.example')
  ) return 'CONFIG';
  if (
    value.startsWith('src/') ||
    value.startsWith('server/') ||
    value.startsWith('scripts/')
  ) return 'RUNTIME';
  return 'UNKNOWN';
}

function collectSignals(changes: SourceChangeEvidence[], kind: ApplicationChangeKind): string[] {
  return changes
    .map((change) => normalize(change.path))
    .filter((changedPath) => classifyApplicationChange(changedPath) === kind)
    .sort();
}

export function analyzeApplicationChangeImpact(options: {
  repoRoot?: string;
  correlationId: string;
  sourceCommit: string;
  sourceChanges: SourceChangeEvidence[];
  generatedAt?: string;
}): ApplicationChangeImpact {
  const sourceChanges = options.sourceChanges
    .map((change) => ({ ...change, path: normalize(change.path) }))
    .filter((change) => change.path.length > 0);

  const freshness = analyzeSemanticFreshness({
    repoRoot: options.repoRoot,
    correlationId: options.correlationId,
    sourceCommit: options.sourceCommit,
    sourceChanges,
    generatedAt: options.generatedAt,
  });

  const changeKinds = {
    ROUTE: collectSignals(sourceChanges, 'ROUTE'),
    DEPENDENCY: collectSignals(sourceChanges, 'DEPENDENCY'),
    RUNTIME: collectSignals(sourceChanges, 'RUNTIME'),
    CONTRACT: collectSignals(sourceChanges, 'CONTRACT'),
    CONFIG: collectSignals(sourceChanges, 'CONFIG'),
    DOCUMENTATION: collectSignals(sourceChanges, 'DOCUMENTATION'),
    WORKFLOW: collectSignals(sourceChanges, 'WORKFLOW'),
    UNKNOWN: collectSignals(sourceChanges, 'UNKNOWN'),
  } satisfies Record<ApplicationChangeKind, string[]>;

  const candidates = freshness.findings.filter((finding) => finding.candidate);
  const patchableDocumentationPaths = candidates
    .filter((finding) => finding.mutationClass === 'PATCHABLE')
    .map((finding) => finding.path)
    .sort();
  const reviewOnlyDocumentationPaths = candidates
    .filter((finding) => finding.mutationClass === 'REVIEW_ONLY')
    .map((finding) => finding.path)
    .sort();

  return Object.freeze({
    analyzerVersion: APPLICATION_CHANGE_IMPACT_ANALYZER_VERSION,
    correlationId: options.correlationId,
    sourceCommit: options.sourceCommit.toLowerCase(),
    changedPaths: sourceChanges.map((change) => change.path).sort(),
    changeKinds,
    patchableDocumentationPaths,
    reviewOnlyDocumentationPaths,
    dependencySignals: changeKinds.DEPENDENCY,
    routeSignals: changeKinds.ROUTE,
    freshness,
  });
}
