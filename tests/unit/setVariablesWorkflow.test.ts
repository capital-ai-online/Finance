import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Set variables workflow contract', () => {
  const yaml = fs.readFileSync(
    path.join(process.cwd(), '.github/workflows/set-variables.yml'),
    'utf8',
  );

  it('keeps the mutation bounded to one allowlisted repository variable', () => {
    expect(yaml).toContain('name: Set variables');
    expect(yaml).toContain('GHCR_DIGEST_PUBLISH_ENABLED value');
    expect(yaml).toContain('CAPITAL_AI_GITHUB_VARIABLE_VALUE');
    expect(yaml).toContain('runSetGitHubVariable.mjs');
    expect(yaml).not.toContain('CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT');
    expect(yaml).not.toContain('secrets.GITHUB_TOKEN');
  });

  it('uses one-time main bootstrap semantics and owner-only manual dispatch', () => {
    expect(yaml).toContain("github.actor == 'SvenKulessa'");
    expect(yaml).toContain('git diff --diff-filter=A');
    expect(yaml).toContain('.github/workflows/set-variables.yml');
    expect(yaml).toContain('echo "value=true"');
    expect(yaml).toContain('branches:');
    expect(yaml).toContain('- main');
  });
});
