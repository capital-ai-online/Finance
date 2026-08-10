import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { CodeEvidence, CodeEvidenceKind, CodeEvidenceMap } from './CodeEvidence';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'uploads']);

function walk(root: string, current = root, files: string[] = []): string[] {
  if (!fs.existsSync(current)) return files;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walk(root, absolute, files);
    else files.push(absolute);
  }
  return files;
}

function normalize(root: string, absolute: string): string {
  return path.relative(root, absolute).replace(/\\/g, '/');
}

function evidenceId(kind: CodeEvidenceKind, sourceCommit: string, filePath: string, symbol = ''): string {
  return crypto.createHash('sha256').update(`${kind}|${sourceCommit}|${filePath}|${symbol}`).digest('hex').slice(0, 24);
}

function componentIdForPath(filePath: string): string {
  const match = filePath.match(/^src\/platform\/([^/]+)/);
  if (match) return match[1];
  if (filePath.startsWith('server/')) return 'Server';
  if (filePath.startsWith('src/')) return 'Application';
  return 'Repository';
}

function push(evidence: CodeEvidence[], kind: CodeEvidenceKind, sourceCommit: string, filePath: string, symbol?: string, detail?: string): void {
  evidence.push({
    evidenceId: evidenceId(kind, sourceCommit, filePath, symbol),
    kind,
    componentId: componentIdForPath(filePath),
    sourceCommit,
    path: filePath,
    ...(symbol ? { symbol } : {}),
    ...(detail ? { detail } : {}),
  });
}

function uniqueMatches(content: string, regex: RegExp): string[] {
  return [...new Set([...content.matchAll(regex)].map((match) => match[1]).filter(Boolean))].sort();
}

export function discoverRepositoryCodeEvidence(repoRoot: string, sourceCommit: string): CodeEvidenceMap {
  if (!/^[0-9a-f]{7,40}$/i.test(sourceCommit)) {
    throw new Error('[DocumentaryDiscovery] sourceCommit must be a Git commit SHA.');
  }

  const evidence: CodeEvidence[] = [];
  const files = walk(repoRoot).sort();

  for (const absolute of files) {
    const filePath = normalize(repoRoot, absolute);
    const extension = path.extname(filePath);

    if (path.basename(filePath) === 'manifest.json' && filePath.startsWith('src/platform/')) {
      push(evidence, 'manifest', sourceCommit, filePath, path.basename(path.dirname(filePath)));
      try {
        const manifest = JSON.parse(fs.readFileSync(absolute, 'utf8')) as { dependencies?: unknown };
        if (Array.isArray(manifest.dependencies)) {
          for (const dependency of manifest.dependencies.filter((value): value is string => typeof value === 'string').sort()) {
            push(evidence, 'dependency', sourceCommit, filePath, dependency, `manifest dependency: ${dependency}`);
          }
        }
      } catch {
        // Manifest validity is enforced by the dedicated manifest governance gate.
      }
      continue;
    }

    if (!SOURCE_EXTENSIONS.has(extension)) continue;
    const content = fs.readFileSync(absolute, 'utf8');
    push(evidence, 'module', sourceCommit, filePath);

    for (const symbol of uniqueMatches(content, /export\s+(?:default\s+)?(?:async\s+)?(?:class|function|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) {
      push(evidence, 'export', sourceCommit, filePath, symbol);
    }

    for (const symbol of uniqueMatches(content, /(?:export\s+)?(?:interface|type)\s+([A-Za-z_$][\w$]*)/g)) {
      push(evidence, 'contract', sourceCommit, filePath, symbol);
    }

    for (const route of uniqueMatches(content, /(?:router|app)\.(?:get|post|put|patch|delete|use)\(\s*['"`]([^'"`]+)['"`]/g)) {
      push(evidence, 'route', sourceCommit, filePath, route);
    }

    for (const eventName of uniqueMatches(content, /\b([A-Z][A-Za-z0-9]*Event)\b/g)) {
      push(evidence, 'event', sourceCommit, filePath, eventName);
    }
  }

  evidence.sort((a, b) => `${a.kind}|${a.path}|${a.symbol ?? ''}`.localeCompare(`${b.kind}|${b.path}|${b.symbol ?? ''}`));
  return Object.freeze({ sourceCommit, evidence: Object.freeze([...evidence]) as CodeEvidence[] });
}
