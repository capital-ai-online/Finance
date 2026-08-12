import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('PR CI credential isolation', () => {
  it('executes candidate code only in a contents-read job without persisted credentials', () => {
    const yaml = read('.github/workflows/pr-build-and-test.yml');
    const executor = yaml.slice(yaml.indexOf('  build-and-test-executor:'), yaml.indexOf('  report-pr-head-check:'));
    expect(executor).toContain('permissions:\n      contents: read');
    expect(executor).not.toContain('checks: write');
    expect(executor).not.toContain('pull-requests: write');
    expect(executor).not.toContain('GH_TOKEN:');
    expect(executor).toContain('ref: ${{ inputs.head_sha }}');
    expect(executor).toContain('persist-credentials: false');
    expect(executor).toContain('test "$(git rev-parse HEAD)" = "${{ inputs.head_sha }}"');
  });

  it('runs metadata preflight from trusted main while treating the candidate as data', () => {
    const yaml = read('.github/workflows/pr-build-and-test.yml');
    const owner = yaml.slice(yaml.indexOf('  owner-evidence:'), yaml.indexOf('  build-and-test-executor:'));
    expect(owner).toContain('ref: ${{ github.sha }}');
    expect(owner).toContain('path: policy');
    expect(owner).toContain('path: candidate');
    expect(owner).toContain('git fetch --no-tags ../policy main:refs/remotes/origin/main');
    expect(owner).toContain('node "$POLICY_ROOT/scripts/pr/validatePrBody.mjs"');
    expect(owner).not.toContain('node scripts/pr/validatePrBody.mjs');
    expect(owner).not.toContain('npm ci');
  });

  it('keeps all external actions pinned to full commit SHAs', () => {
    for (const file of ['.github/workflows/ci.yml', '.github/workflows/pr-build-and-test.yml', '.github/workflows/pr-auto-classification.yml']) {
      const uses = [...read(file).matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map((match) => match[1]);
      expect(uses.length).toBeGreaterThan(0);
      expect(uses.every((value) => /@[0-9a-f]{40}$/.test(value))).toBe(true);
    }
  });
});
