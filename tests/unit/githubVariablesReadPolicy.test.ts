import { describe, expect, it } from 'vitest';
import { classifyGitHubVariablesReadStatus } from '../../scripts/operations/githubVariablesReadPolicy.mjs';

describe('GitHub variables read evidence policy', () => {
  it('treats absent repository and organization variables as non-failing NOT_CONFIGURED evidence', () => {
    expect(classifyGitHubVariablesReadStatus(
      { status: 'NOT_CONFIGURED' },
      { status: 'NOT_CONFIGURED' },
    )).toEqual({
      status: 'NOT_CONFIGURED',
      exitCode: 0,
    });
  });

  it('returns PASS when at least one configured scope is readable', () => {
    expect(classifyGitHubVariablesReadStatus(
      { status: 'PASS' },
      { status: 'NOT_CONFIGURED' },
    )).toEqual({
      status: 'PASS',
      exitCode: 0,
    });
  });

  it('keeps a permission failure fail-closed even if another scope is readable', () => {
    expect(classifyGitHubVariablesReadStatus(
      { status: 'PASS' },
      { status: 'BLOCKED' },
    )).toEqual({
      status: 'BLOCKED',
      exitCode: 2,
    });
  });

  it('rejects unknown state combinations rather than manufacturing PASS evidence', () => {
    expect(() => classifyGitHubVariablesReadStatus(
      { status: 'UNKNOWN' },
      { status: 'NOT_CONFIGURED' },
    )).toThrow(/unsupported evidence state combination/);
  });
});
