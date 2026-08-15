import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolvePublicHtmlFile } from '../../server/runtime/spaFallback';

describe('S2 resolvePublicHtmlFile', () => {
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
    expect(resolvePublicHtmlFile(dir, '/')).toBe(path.join(dir, 'index.html'));
  });

  it('prefers prerendered impressum/index.html', () => {
    expect(resolvePublicHtmlFile(dir, '/impressum')).toBe(
      path.join(dir, 'impressum', 'index.html'),
    );
  });

  it('falls back to root index when route file missing', () => {
    expect(resolvePublicHtmlFile(dir, '/agb')).toBe(path.join(dir, 'index.html'));
  });
});
