import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildPublicHtmlFiles,
  isPathInsideRoot,
} from '../../server/runtime/spaFallback';

describe('S2 public HTML files (path-safe)', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-s2-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<html>home</html>');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('builds every sendFile candidate from fixed paths below dist', () => {
    const files = buildPublicHtmlFiles(dir);
    expect(files).toEqual({
      root: path.resolve(dir, 'index.html'),
      universe: path.resolve(dir, 'universe', 'index.html'),
      learningPlatform: path.resolve(dir, 'learning-platform', 'index.html'),
      vocabulary: path.resolve(dir, 'vocabulary', 'index.html'),
      impressum: path.resolve(dir, 'impressum', 'index.html'),
      agb: path.resolve(dir, 'agb', 'index.html'),
      datenschutz: path.resolve(dir, 'datenschutz', 'index.html'),
      faq: path.resolve(dir, 'faq', 'index.html'),
    });
    for (const candidate of Object.values(files)) {
      expect(isPathInsideRoot(dir, candidate)).toBe(true);
    }
  });

  it('does not expose a resolver that combines request paths with filesystem paths', () => {
    const files = buildPublicHtmlFiles(dir);
    const serialized = JSON.stringify(files);
    for (const attack of [
      '../../etc/passwd',
      '/impressum/../../etc/passwd',
      '..%2f..%2fetc%2fpasswd',
    ]) {
      expect(serialized).not.toContain(attack);
    }
  });
});
