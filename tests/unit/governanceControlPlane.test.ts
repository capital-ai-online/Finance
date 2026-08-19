import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('Governance Control Plane', () => {
  it('passes the deterministic structural governance validator', () => {
    expect(() => {
      execFileSync(
        process.execPath,
        [path.join(root, 'scripts/governance/validateGovernanceControlPlane.mjs')],
        {
          cwd: root,
          env: process.env,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    }).not.toThrow();
  });
});
