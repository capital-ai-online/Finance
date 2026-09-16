import { execFileSync } from 'node:child_process';
import { buildVersionedUnitInventory } from '../../src/platform/Release/Services/versionedUnitInventory';

function resolveSourceCommit(): string {
  const fromEnv = process.env.GITHUB_SHA || process.env.GIT_COMMIT || process.env.SOURCE_VERSION;
  if (fromEnv) return fromEnv.trim();
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

const jsonMode = process.argv.includes('--json');

try {
  const inventory = buildVersionedUnitInventory(process.cwd(), resolveSourceCommit());
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  } else {
    process.stdout.write(
      `[VersionedUnitInventory] PASS contract=${inventory.contract} ` +
      `platform=${inventory.platformVersion} units=${inventory.coverage.totalUnits} ` +
      `versioned=${inventory.coverage.versionAuthorityResolvedUnits} ` +
      `component-authority=${inventory.coverage.componentAuthorityUnits} ` +
      `platform-inherited=${inventory.coverage.inheritedPlatformUnits} ` +
      `ownership-resolved=${inventory.coverage.ownershipResolvedUnits} ` +
      `ownership-unresolved=${inventory.coverage.ownershipUnresolvedUnits}\n`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[VersionedUnitInventory] FAIL ${message}\n`);
  process.exitCode = 1;
}
