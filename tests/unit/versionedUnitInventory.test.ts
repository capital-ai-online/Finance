import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildVersionedUnitInventory,
  VERSIONED_UNIT_INVENTORY_CONTRACT,
} from '../../src/platform/Release/Services/versionedUnitInventory';

const createdRoots: string[] = [];
const SHA = 'a'.repeat(40);

function writeJson(root: string, relativePath: string, value: unknown): void {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-versioned-units-'));
  createdRoots.push(root);
  writeJson(root, 'package.json', { name: 'capital-ai', version: '0.6.0' });
  return root;
}

afterEach(() => {
  while (createdRoots.length > 0) {
    const root = createdRoots.pop();
    if (root) fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('VersionedUnitInventory', () => {
  it('projects platform, component, feature, application and backend units with exactly one version authority', () => {
    const root = createRepo();
    writeJson(root, 'src/platform/Documentary/manifest.json', {
      name: 'Documentary',
      version: '1.21.0',
      owner: 'CAPITAL-AI-DOC',
      documentation: ['README.md', 'docs/architecture/DOCUMENTARY.md'],
      dependencies: ['src/platform/Release'],
    });
    fs.mkdirSync(path.join(root, 'src/platform/NoManifest'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/features/crypto'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/app'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/shared'), { recursive: true });
    fs.writeFileSync(path.join(root, 'server.ts'), 'export {};\n', 'utf8');

    const inventory = buildVersionedUnitInventory(root, SHA);

    expect(inventory.contract).toBe(VERSIONED_UNIT_INVENTORY_CONTRACT);
    expect(inventory.readOnly).toBe(true);
    expect(inventory.mutationPerformed).toBe(false);
    expect(inventory.platformVersion).toBe('0.6.0');
    expect(inventory.coverage.versionAuthorityResolvedUnits).toBe(inventory.coverage.totalUnits);

    const platform = inventory.units.find((unit) => unit.unitId === 'UNIT-PLATFORM-CAPITAL-AI');
    expect(platform).toMatchObject({
      version: '0.6.0',
      versionAuthority: 'package.json#version',
      versionAuthorityMode: 'platform',
      ownerProject: 'CAPITAL-AI-OPS',
      primaryPVC: ['PVC-06'],
    });

    const documentary = inventory.units.find((unit) => unit.unitId === 'UNIT-PLATFORM-DOCUMENTARY');
    expect(documentary).toMatchObject({
      version: '1.21.0',
      versionAuthority: 'src/platform/Documentary/manifest.json#version',
      versionAuthorityMode: 'component',
      ownerProject: 'CAPITAL-AI-DOC',
      primaryPVC: ['PVC-03'],
      ownershipResolution: 'resolved',
    });

    const noManifest = inventory.units.find((unit) => unit.unitId === 'UNIT-PLATFORM-NO-MANIFEST');
    expect(noManifest).toMatchObject({
      version: '0.6.0',
      versionAuthority: 'package.json#version',
      versionAuthorityMode: 'inherited-platform',
      ownershipResolution: 'unresolved',
    });

    const crypto = inventory.units.find((unit) => unit.unitId === 'UNIT-FEATURE-CRYPTO');
    expect(crypto).toMatchObject({
      kind: 'frontend-feature',
      version: '0.6.0',
      versionAuthority: 'package.json#version',
      versionAuthorityMode: 'inherited-platform',
      sourceCommit: SHA,
    });

    expect(inventory.units.find((unit) => unit.unitId === 'UNIT-MODULE-APP')).toBeDefined();
    expect(inventory.units.find((unit) => unit.unitId === 'UNIT-MODULE-SHARED')).toBeDefined();
    expect(inventory.units.find((unit) => unit.unitId === 'UNIT-BACKEND-SERVER')).toMatchObject({
      sourcePath: 'server.ts',
      versionAuthority: 'package.json#version',
    });
  });

  it('fails closed when an existing component manifest declares an invalid component version', () => {
    const root = createRepo();
    writeJson(root, 'src/platform/Broken/manifest.json', {
      name: 'Broken',
      version: 'latest',
      owner: 'CAPITAL-AI-OPS / PVC-06',
    });

    expect(() => buildVersionedUnitInventory(root, SHA)).toThrow(/strict MAJOR\.MINOR\.PATCH SemVer/);
  });

  it('is deterministic for the same repository snapshot and source commit', () => {
    const root = createRepo();
    fs.mkdirSync(path.join(root, 'src/features/stocks'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/lib'), { recursive: true });

    const first = buildVersionedUnitInventory(root, SHA);
    const second = buildVersionedUnitInventory(root, SHA);

    expect(second).toEqual(first);
  });

  it('rejects non-canonical source commit identities', () => {
    const root = createRepo();
    expect(() => buildVersionedUnitInventory(root, 'main')).toThrow(/40-character lowercase Git SHA/);
  });
});
