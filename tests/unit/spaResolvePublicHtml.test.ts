import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resolvePublicHtmlFile,
  isPathInsideRoot,
  PUBLIC_ROUTE_HTML,
} from '../../server/runtime/spaFallback';

describe('S2 resolvePublicHtmlFile (path-safe)', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-s2-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<html>home</html>');
    fs.mkdirSync(path.join(dir, 'impressum'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'impressum', 'index.html'), '<html>impressum</html>');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('serves root index for /', () => {
    expect(resolvePublicHtmlFile(dir, '/')).toBe(path.resolve(dir, 'index.html'));
  });

  it('prefers prerendered impressum/index.html', () => {
    expect(resolvePublicHtmlFile(dir, '/impressum')).toBe(
      path.resolve(dir, 'impressum', 'index.html'),
    );
  });

  it('falls back to root index when route file missing', () => {
    expect(resolvePublicHtmlFile(dir, '/agb')).toBe(path.resolve(dir, 'index.html'));
  });

  it('does not use request path segments for unknown/traversal-like inputs', () => {
    // Not in allowlist → always root index, never joins ../ or absolute segments
    const attacks = [
      '/../../etc/passwd',
      '/impressum/../../etc/passwd',
      '/..%2f..%2fetc%2fpasswd',
      '//etc/passwd',
      '/impressum/../../../package.json',
    ];
    for (const attack of attacks) {
      const resolved = resolvePublicHtmlFile(dir, attack);
      expect(resolved).toBe(path.resolve(dir, 'index.html'));
      expect(isPathInsideRoot(dir, resolved)).toBe(true);
    }
  });

  it('allowlist only contains fixed relative filenames', () => {
    for (const [route, rel] of Object.entries(PUBLIC_ROUTE_HTML)) {
      expect(route.startsWith('/')).toBe(true);
      expect(rel.includes('..')).toBe(false);
      expect(path.isAbsolute(rel)).toBe(false);
    }
  });
});
