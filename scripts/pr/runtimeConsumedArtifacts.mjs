import { execFileSync } from 'node:child_process';

export function normalizePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .trim();
}

export function isDocsPath(filePath) {
  const path = normalizePath(filePath);
  return !path || path.startsWith('docs/') || path.startsWith('.ai/') || path.endsWith('.md');
}

/**
 * Resolve documentary artifacts to the exact executable/test/workflow files
 * that consume them. Unexpected git failures throw so callers fail closed.
 *
 * @param {string[]} files
 * @param {string} headRef
 * @param {{ cwd?: string }} options
 */
export function findRuntimeConsumerFiles(files, headRef = 'HEAD', options = {}) {
  const roots = ['src', 'server', 'scripts', '.github/workflows', 'tests'];
  const consumers = {};

  for (const rawFile of files || []) {
    const file = normalizePath(rawFile);
    if (!file || !isDocsPath(file)) continue;
    try {
      const out = execFileSync(
        'git',
        ['grep', '-F', '-l', '-e', file, headRef, '--', ...roots],
        {
          cwd: options.cwd,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ).trim();
      if (!out) continue;
      const prefix = `${headRef}:`;
      const matches = out
        .split(/\r?\n/)
        .map((value) => value.startsWith(prefix) ? value.slice(prefix.length) : value)
        .map(normalizePath)
        .filter(Boolean);
      if (matches.length > 0) consumers[file] = Array.from(new Set(matches)).sort();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 1) continue;
      throw error;
    }
  }

  return consumers;
}

export function findRuntimeConsumedPaths(files, headRef = 'HEAD', options = {}) {
  return Object.keys(findRuntimeConsumerFiles(files, headRef, options)).sort();
}
