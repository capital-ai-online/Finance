// M6 (Supply Chain Provenance): resolveSourceCommit() is the single source-of-truth used by the
// release manifest, the SBOM and the provenance statement to bind to the exact same commit - a
// bug here would silently desynchronize all three artifacts.

import { describe, it, expect, afterEach } from 'vitest';
import { resolveSourceCommit } from '../../scripts/automation/sourceIdentity';

const ENV_KEYS = ['RELEASE_SOURCE_COMMIT', 'GITHUB_SHA', 'RENDER_GIT_COMMIT', 'GIT_COMMIT', 'SOURCE_VERSION'] as const;

describe('resolveSourceCommit', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('prefers RELEASE_SOURCE_COMMIT over all other sources', () => {
    process.env.RELEASE_SOURCE_COMMIT = 'from-release-var';
    process.env.GITHUB_SHA = 'from-github';
    expect(resolveSourceCommit(process.cwd())).toBe('from-release-var');
  });

  it('falls back to GITHUB_SHA when RELEASE_SOURCE_COMMIT is unset', () => {
    process.env.GITHUB_SHA = 'from-github';
    process.env.RENDER_GIT_COMMIT = 'from-render';
    expect(resolveSourceCommit(process.cwd())).toBe('from-github');
  });

  it('falls back to git HEAD when no override env var is set', () => {
    const result = resolveSourceCommit(process.cwd());
    expect(result).toMatch(/^[0-9a-f]{40}$/);
  });
});
