import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

interface AdrRegistryRecord {
  authorityId: string;
  displayId: string;
  version: string;
  lifecycle: string;
  path: string;
}

interface AdrRegistry {
  migratedRecords: AdrRegistryRecord[];
  parallelNamespaceReservations: Array<{ displayId?: string; path?: string; status?: string }>;
}

describe('Governance Control Plane', () => {
  it('passes the deterministic structural governance validator', () => {
    expect(() => {
      execFileSync(
        process.execPath,
        [path.join(root, 'scripts/governance/validateGovernanceControlPlane.mjs')],
        {
          cwd: root,
          env: process.env,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    }).not.toThrow();
  });

  it('keeps merged ADR-0094 accepted while ADR-0096 v1.1 remains a proposed amendment until Human Merge', () => {
    const registry = JSON.parse(
      fs.readFileSync(path.join(root, 'docs/adr/registry.json'), 'utf8'),
    ) as AdrRegistry;

    const adr0094 = registry.migratedRecords.find((record) => record.displayId === 'ADR-0094');
    const adr0096 = registry.migratedRecords.find((record) => record.displayId === 'ADR-0096');

    expect(adr0094).toMatchObject({
      authorityId: 'AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19',
      lifecycle: 'accepted',
      path: 'docs/adr/ADR-0094-open-source-pdf-companion-and-short-media-rendering.md',
    });
    expect(adr0096).toMatchObject({
      authorityId: 'AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19',
      version: '1.1.0',
      lifecycle: 'proposed',
      path: 'docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md',
    });
    expect(registry.parallelNamespaceReservations).toEqual([]);
  });
});
