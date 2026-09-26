import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

describe('application-wide merge cadence governance', () => {
  const agents = read('AGENTS.md');
  const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
    controls: Array<{ controlId: string; requirement: string }>;
  };
  const versionContract = JSON.parse(
    read('docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json'),
  );

  it('binds normal Render deployment to exactly five merged pull requests', () => {
    expect(agents).toContain('positive `mergeOrdinal` divisible by **5**');
    expect(agents).toContain('`5, 10, 15, ...`');
    expect(agents).toContain('the state becomes `DEPLOYMENT_DUE`');
    expect(agents).toContain('the deployment target is the then-latest `CURRENT_MAIN`');
    expect(agents).toContain('Render native Auto Deploy remains off');
  });

  it('keeps tests, self-healing and dashboard truth on latest current main', () => {
    expect(agents).toContain('CI, tests, Security/Compliance checks, Self-Healing and the live/current-state dashboard MUST follow the latest `CURRENT_MAIN`');
    expect(agents).toContain('`DEPLOYMENT_QUEUED` below `5/5` MUST NOT trigger exact-SHA runtime recovery');
    expect(agents).toContain('repository automation MAY advance the existing next-PR synchronization and Self-Healing continuation lanes');
    expect(read('.github/workflows/self-healing-package-continuation.yml')).toContain("workflows: ['Post-Merge Production Correlation']");
    expect(read('.github/workflows/ops-exact-sha-runtime-recovery.yml')).toContain("workflows: ['CI', 'Post-Merge Production Correlation']");
  });

  it('defines a non-retroactive deployment cadence and retires merge-count release versioning', () => {
    expect(agents).toContain('non-retroactive `cadenceEpoch`');
    expect(agents).toContain('Pull Requests merged before the epoch');
    expect(agents).toContain('deployment progress `x/5`');
    expect(agents).toContain('former package-version and `x/10` Production-version cadence projection is retired');
    expect(agents).toContain('No merge count by itself may mutate package metadata or manufacture a Production Release version');
  });

  it('binds Production Release version to immutable acceptance evidence instead of merge count', () => {
    expect(agents).toContain('former fixed **10-merge PATCH cadence is retired**');
    expect(agents).toContain('five-merge deployment boundary is therefore also the normal Release-candidate assembly point');
    expect(agents).toContain('immutable accepted Release Manifest');
    expect(agents).toContain('protected final Git tag `vMAJOR.MINOR.PATCH`');
    expect(agents).toContain('productionReleaseVersion + sourceSha + artifactDigest + deploymentGeneration/providerDeploymentId');
    expect(agents).toContain('existing package-version runtime/tool implementation remains historical/current implementation evidence');
    // The productive OPS implementation is intentionally migrated only after this Governance supersession merges.
    expect(versionContract.version).toBe('1.1.0');
    expect(versionContract.automaticMaterializationPolicy.singleVersionAuthority).toBe('package.json#version');
  });

  it('preserves one deploy authority and one version authority', () => {
    const deploy = catalog.controls.filter((item) => item.controlId === 'CTRL-DEPLOY-AUTH-001');
    const version = catalog.controls.filter((item) => item.controlId === 'CTRL-GOV-VERSION-002');
    expect(deploy).toHaveLength(1);
    expect(version).toHaveLength(1);
    expect(deploy[0].requirement).toContain('every fifth merged Pull Request');
    expect(version[0].requirement).toContain('protected final `vMAJOR.MINOR.PATCH` Git tag');
    expect(version[0].requirement).toContain('immutable accepted Release Manifest');
    expect(version[0].requirement).toContain('ten-merge package PATCH materialization is retired');
    expect(version[0].requirement).toContain('package/tooling metadata only');
  });
});
