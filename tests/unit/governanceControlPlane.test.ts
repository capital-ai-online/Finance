import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

type JsonRecord = Record<string, unknown>;
type Finding = { code: string; message: string };

type RegistryFixture = {
  authorityRegistry: { entries: JsonRecord[] };
  adrRegistry: { migratedRecords: JsonRecord[]; parallelNamespaceReservations: JsonRecord[] };
  documentRegistry: { entries: JsonRecord[] };
};

async function loadRuleValidator() {
  // @ts-expect-error Runtime-governance rules intentionally remain a Node ESM module consumed by the canonical CLI.
  const module = await import('../../scripts/governance/controlPlaneRegistryRules.mjs');
  return module.validateGovernanceRegistryRelations as (fixture: RegistryFixture) => Finding[];
}

function readFixture(): RegistryFixture {
  return {
    authorityRegistry: JSON.parse(fs.readFileSync(path.join(root, 'docs/governance/authority-registry.json'), 'utf8')),
    adrRegistry: JSON.parse(fs.readFileSync(path.join(root, 'docs/adr/registry.json'), 'utf8')),
    documentRegistry: JSON.parse(fs.readFileSync(path.join(root, 'docs/governance/document-registry.json'), 'utf8')),
  } as RegistryFixture;
}

function findingCodes(findings: Finding[]) {
  return findings.map((finding) => finding.code);
}

function reservation(displayId: string, overrides: JsonRecord = {}): JsonRecord {
  return {
    displayId,
    branch: 'test/governance-reservation',
    source: 'unit-test',
    path: `docs/adr/${displayId}-test.md`,
    observedHead: 'a'.repeat(40),
    state: 'active',
    reservedAt: '2026-08-20T17:45:00+02:00',
    ...overrides,
  };
}

describe('Governance Control Plane', () => {
  it('TEST 1: denies a normative component inventory', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    const inventory = fixture.documentRegistry.entries.find((entry) => entry.path === 'docs/frontend/COMPONENT_INVENTORY.md');
    expect(inventory).toBeDefined();
    inventory!.normative = true;

    expect(findingCodes(validate(fixture))).toContain('INVENTORY_NORMATIVE_AUTHORITY_CLAIM');
  });

  it('TEST 2: denies financial-runtime authority in a roadmap', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    const roadmap = fixture.documentRegistry.entries.find((entry) => entry.path === 'docs/frontend/FRONTEND_ROADMAP.md');
    expect(roadmap).toBeDefined();
    roadmap!.normativeScope = ['financial-runtime'];

    expect(findingCodes(validate(fixture))).toContain('ROADMAP_FINANCIAL_RUNTIME_AUTHORITY_CLAIM');
  });

  it('TEST 3: denies a projection to an unknown AUTH ID', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    const inventory = fixture.documentRegistry.entries.find((entry) => entry.path === 'docs/frontend/COMPONENT_INVENTORY.md');
    expect(inventory).toBeDefined();
    inventory!.projectionOf = ['AUTH-FRONTEND-PRESENTATION-ARCHITECTURE', 'AUTH-UNKNOWN-TEST'];

    expect(findingCodes(validate(fixture))).toContain('PROJECTION_AUTHORITY_UNKNOWN');
  });

  it('TEST 4: denies two authorities claiming the same exclusive normative scope', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    fixture.documentRegistry.entries.push({
      documentId: 'DOC-TEST-DUPLICATE-FRONTEND-AUTHORITY',
      documentRole: 'authority',
      normative: true,
      normativeScope: ['frontend-source-tree'],
      lifecycle: 'approved',
      path: 'docs/test/duplicate-frontend-authority.md',
    });

    expect(findingCodes(validate(fixture))).toContain('DUPLICATE_EXCLUSIVE_NORMATIVE_SCOPE');
  });

  it('TEST 5: denies two parallel active ADR-0097 reservations', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    fixture.adrRegistry.parallelNamespaceReservations = [
      reservation('ADR-0097', { branch: 'test/one' }),
      reservation('ADR-0097', { branch: 'test/two', observedHead: 'b'.repeat(40) }),
    ];

    expect(findingCodes(validate(fixture))).toContain('DUPLICATE_PARALLEL_ADR_RESERVATION');
  });

  it('TEST 6: denies an active ADR plus active reservation of the same display ID', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    fixture.adrRegistry.parallelNamespaceReservations = [reservation('ADR-0097')];

    expect(findingCodes(validate(fixture))).toContain('PARALLEL_ADR_NAMESPACE_COLLISION');
  });

  it('TEST 7: denies a stale ADR reservation', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    fixture.adrRegistry.parallelNamespaceReservations = [
      reservation('ADR-0100', { state: 'stale', staleReason: 'observedHead no longer matches reserving branch preflight evidence' }),
    ];

    expect(findingCodes(validate(fixture))).toContain('STALE_ADR_RESERVATION');
  });

  it('TEST 8: denies an active projection to a suspended authority', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();
    fixture.authorityRegistry.entries.push({
      authorityId: 'AUTH-TEST-SUSPENDED-PARENT',
      lifecycle: 'suspended',
    });
    fixture.documentRegistry.entries.push({
      documentId: 'DOC-TEST-SUSPENDED-PROJECTION',
      documentRole: 'projection',
      normative: false,
      normativeScope: [],
      authorityRefs: ['AUTH-TEST-SUSPENDED-PARENT'],
      projectionOf: ['AUTH-TEST-SUSPENDED-PARENT'],
      lifecycle: 'approved',
      path: 'docs/test/suspended-projection.md',
    });

    expect(findingCodes(validate(fixture))).toContain('PROJECTION_PARENT_NON_AUTHORIZING');
  });

  it('TEST 9: accepts the canonical frontend document-role matrix', async () => {
    const validate = await loadRuleValidator();
    const fixture = readFixture();

    expect(validate(fixture)).toEqual([]);
  });

  it('TEST 10: preserves existing governance invariants in the canonical CLI', () => {
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
    ) as { migratedRecords: Array<{ authorityId: string; displayId: string; version: string; lifecycle: string; path: string }>; parallelNamespaceReservations: JsonRecord[] };

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
