import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ruleset sync security contract', () => {
  const expected = JSON.parse(
    fs.readFileSync('.github/policies/main-production-protection.expected.json', 'utf8'),
  );
  const source = fs.readFileSync('scripts/security/rulesetSync.mjs', 'utf8');
  const adminSource = fs.readFileSync('scripts/security/rulesetAdminEnvironment.mjs', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/ruleset-sync.yml', 'utf8');

  it('owns linear history in the canonical expected policy', () => {
    expect(expected.required.required_linear_history).toBe(true);
    expect(expected.required.allowed_merge_methods).toEqual(['squash', 'rebase']);
    expect(expected.required.allowed_merge_methods).not.toContain('merge');
  });

  it('constructs, normalizes and enforces required_linear_history fail-closed', () => {
    expect(source).toContain(
      "...(req.required_linear_history ? [{ type: 'required_linear_history' }] : []),",
    );
    expect(source).toContain(
      "['non_fast_forward', 'deletion', 'required_linear_history'].includes(rule.type)",
    );
    expect(source).toContain("failures.push('required_linear_history-Schutz fehlt')");
    expect(source).toContain(
      "failures.push('Merge-Commits sind mit required_linear_history unvereinbar')",
    );
  });

  it('keeps mandatory signing disabled unless a later Owner decision changes policy', () => {
    expect(expected.required.required_signatures).toBeUndefined();
    expect(source).not.toContain("{ type: 'required_signatures' }");
  });

  it('keeps plan environment readback least-privilege and separate from admin writes', () => {
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('RULESET_ADMIN_READ_TOKEN: ${{ github.token }}');
    expect(workflow).toContain('GH_TOKEN: ${{ secrets.RULESET }}');
    expect(adminSource).toContain('const readToken = process.env.RULESET_ADMIN_READ_TOKEN;');
    expect(adminSource).toContain('const adminToken = process.env.GH_TOKEN;');
    expect(adminSource).toContain("if (mode === 'apply' && !adminToken)");
    expect(adminSource).toContain('const environment = await gh(environmentPath, readToken);');
    expect(adminSource).toContain('await gh(environmentPath, adminToken, {');
  });

  it('pins the ruleset control plane to the current supported Node 24 baseline', () => {
    expect(workflow).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(workflow).toContain("node-version: '24.18.0'");
  });
});
