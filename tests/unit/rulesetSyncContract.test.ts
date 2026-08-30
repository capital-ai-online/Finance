import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ruleset readback security contract', () => {
  const source = fs.readFileSync('scripts/security/rulesetSync.mjs', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/ruleset-sync.yml', 'utf8');

  it('retires the repository-owned canonical desired ruleset', () => {
    expect(fs.existsSync('.github/policies/main-production-protection.expected.json')).toBe(false);
    expect(fs.existsSync('scripts/security/rulesetAdminEnvironment.mjs')).toBe(false);
    expect(source).not.toContain('EXPECTED_PATH');
    expect(source).not.toContain('buildDesiredRuleset');
  });

  it('supports provider readback only and exposes no apply mode', () => {
    expect(source).toContain("const RULESET_NAME = 'main-production-protection';");
    expect(source).toContain("if (mode !== 'plan')");
    expect(source).toContain("method: 'GET'");
    expect(source).not.toContain('apply-package-a');
    expect(source).not.toMatch(/method:\s*['\"](?:PATCH|PUT|POST|DELETE)['\"]/);
    expect(source).not.toContain('enforceRulesetFloor');
    expect(source).not.toContain('enforceRepositoryFloor');
  });

  it('keeps workflow dispatch read-only with no mutation choices', () => {
    expect(workflow).toContain('Ruleset Readback (main-production-protection)');
    expect(workflow).toContain('node scripts/security/rulesetSync.mjs plan');
    expect(workflow).toContain('GH_TOKEN: ${{ secrets.RULESET }}');
    expect(workflow).not.toContain('package_a');
    expect(workflow).not.toContain('full');
    expect(workflow).not.toContain('rulesetAdminEnvironment.mjs');
    expect(workflow).not.toContain('RULESET_ADMIN_READ_TOKEN');
  });

  it('pins the readback control plane to the current supported Node 24 baseline', () => {
    expect(workflow).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(workflow).toContain("node-version: '24.18.0'");
  });
});
