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
 * Resolve documentary artifacts that are consumed by executable, test or workflow
 * surfaces. Unexpected git failures throw so callers fail closed.
 *
 * @param {string[]} files
 * @param {string} headRef
 * @param {{ cwd?: string }} options
 */
export function findRuntimeConsumedPaths(files, headRef = 'HEAD', options = {}) {
  const roots = ['src', 'server', 'scripts', '.github/workflows', 'tests'];
  const consumed = [];

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
      if (out) consumed.push(file);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 1) continue;
      throw error;
    }
  }

  return Array.from(new Set(consumed));
}
