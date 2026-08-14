import { spawnSync } from 'node:child_process';

// M6 (Supply Chain Provenance): shared exact-source-commit resolution, used by
// buildRuntimeReleaseManifest.ts, dependencySecurity.ts (SBOM) and
// buildSupplyChainProvenance.ts so all three bind to the identical commit identity instead of
// each re-deriving it independently, which could silently drift between artifacts.
export function resolveSourceCommit(repoRoot: string): string | null {
  const gitHead = () => {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
    if (result.status !== 0) return null;
    const commit = String(result.stdout || '').trim();
    return commit || null;
  };
  return (
    process.env.RELEASE_SOURCE_COMMIT ||
    process.env.GITHUB_SHA ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    process.env.SOURCE_VERSION ||
    gitHead()
  );
}
