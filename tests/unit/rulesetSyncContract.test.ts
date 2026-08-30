import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('ruleset sync linear-history contract', () => {
  const expected = JSON.parse(
    fs.readFileSync('.github/policies/main-production-protection.expected.json', 'utf8'),
  );
  const source = fs.readFileSync('scripts/security/rulesetSync.mjs', 'utf8');

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
});
