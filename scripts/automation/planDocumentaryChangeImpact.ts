import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { analyzeApplicationChangeImpact } from '../../src/platform/Documentary/Discovery/ApplicationChangeImpactAnalyzer';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function runGit(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

const base = arg('base') ?? 'HEAD^';
const head = arg('head') ?? 'HEAD';
const output = arg('output') ?? 'artifacts/documentary/change-impact.json';
const sourceCommit = runGit(['rev-parse', head]);
const changedPaths = runGit(['diff', '--name-only', `${base}..${head}`])
  .split(/\r?\n/)
  .map(normalize)
  .filter(Boolean);

const report = analyzeApplicationChangeImpact({
  correlationId: `DOC-IMPACT-${sourceCommit.slice(0, 12).toUpperCase()}`,
  sourceCommit,
  sourceChanges: changedPaths.map((changedPath) => ({ path: changedPath })),
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output,
  sourceCommit,
  changedPaths: report.changedPaths.length,
  patchable: report.patchableDocumentationPaths.length,
  reviewOnly: report.reviewOnlyDocumentationPaths.length,
  routeSignals: report.routeSignals.length,
  dependencySignals: report.dependencySignals.length,
}, null, 2));
