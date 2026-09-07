import fs from 'node:fs';
import path from 'node:path';
import qs from 'qs';
import { describe, expect, it } from 'vitest';

const EXPECTED_QS_VERSION = '6.16.0';

describe('qs DoS remediation', () => {
  it('pins the patched transitive release in package metadata and lockfile', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
    const lockfile = JSON.parse(fs.readFileSync(path.resolve('package-lock.json'), 'utf8'));

    expect(packageJson.overrides?.qs).toBe(EXPECTED_QS_VERSION);
    expect(lockfile.packages?.['node_modules/qs']?.version).toBe(EXPECTED_QS_VERSION);
  });

  it('handles attacker-controlled constructor.isBuffer without throwing', () => {
    const parsed = qs.parse('x%5Bconstructor%5D%5BisBuffer%5D=y', { allowPrototypes: true });

    expect(parsed).toEqual({ x: { constructor: { isBuffer: 'y' } } });
    expect(() => qs.stringify(parsed)).not.toThrow();
  });

  it('enforces arrayLimit for bracket-key comma parsing', () => {
    expect(() =>
      qs.parse('a[]=1,2,3,4', {
        comma: true,
        arrayLimit: 3,
        throwOnLimitExceeded: true,
      }),
    ).toThrow();
  });
});
