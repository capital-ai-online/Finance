import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('fatal process child evidence', () => {
  it('exits non-zero even when the delegated SIGTERM cleanup completes with exit(0)', () => {
    const fixture = path.resolve(process.cwd(), 'tests/fixtures/processFatalExitChild.ts');
    const child = spawnSync(process.execPath, ['--import', 'tsx', fixture], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 5_000,
      env: process.env,
    });

    expect(child.error).toBeUndefined();
    expect(child.signal).toBeNull();
    expect(child.status).toBe(1);
  });
});
