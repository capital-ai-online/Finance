import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const QUALITY_ROOT = path.join(process.cwd(), 'src', 'platform', 'Quality');
const FORBIDDEN_ROOTS = [
  'Compliance',
  'Security',
  'Release',
  'Documentary',
  'Vocabulary',
  'EventMesh',
].map((name) => path.join(process.cwd(), 'src', 'platform', name));

function collectTypeScriptFiles(directory: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...collectTypeScriptFiles(fullPath));
    else if (/\.tsx?$/.test(entry.name)) out.push(fullPath);
  }
  return out;
}

describe('Quality Center architecture boundary', () => {
  it('keeps domain implementations outside src/platform/Quality imports', () => {
    const violations: string[] = [];
    const importPattern = /from\s+['"]([^'"]+)['"]/g;

    for (const file of collectTypeScriptFiles(QUALITY_ROOT)) {
      const content = fs.readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = importPattern.exec(content))) {
        const specifier = match[1];
        if (!specifier.startsWith('.')) continue;
        const target = path.resolve(path.dirname(file), specifier);
        if (FORBIDDEN_ROOTS.some((root) => target === root || target.startsWith(`${root}${path.sep}`))) {
          violations.push(`${path.relative(process.cwd(), file)} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
