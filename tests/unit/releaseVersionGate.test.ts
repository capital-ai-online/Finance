import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyReleaseVersionPlan,
  assertAppliedVersionConsistency,
  buildReleaseVersionPlan,
  expectedClassification,
  restoreReleaseVersionFiles,
  type ReleaseVersionRequest,
} from '../../src/platform/Release/Services/releaseVersionGate';

const tempRoots: string[] = [];

function write(root: string, relativePath: string, content: string): void {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function createFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-release-gate-'));
  tempRoots.push(root);
  write(root, 'package.json', JSON.stringify({ name: 'capital-ai', version: '0.6.0' }, null, 2));
  write(root, 'package-lock.json', JSON.stringify({ name: 'capital-ai', version: '0.6.0', lockfileVersion: 3, packages: { '': { name: 'capital-ai', version: '0.6.0' } } }, null, 2));
  write(root, 'metadata.json', JSON.stringify({ name: 'Capital-AI', version: '0.6.0' }, null, 2));
  write(root, 'README.md', '[![Version](Version-0.6.0_Beta)]');
  write(root, 'AGENTS.md', '**Control Plane Version:** 2.1.0');
  write(root, 'docs/code-quality/CODE_QUALITY_STANDARDS.md', '**Version:** 0.6.0\nPinned to **Version 0.6.0**.');
  write(root, 'docs/ceo/EXECUTIVE_SUMMARY.md', '**Version:** 0.6.0 (Beta-Phase)');
  write(root, 'docs/archive/raw-materials/API.md', '*Historical snapshot under CAPITAL-AI Platform Specification Version 0.6.0.*');
  write(root, 'index.html', '<meta name="description" content="CAPITAL-AI (Version 0.6.0)">');
  return root;
}

function request(overrides: Partial<ReleaseVersionRequest> = {}): ReleaseVersionRequest {
  return {
    targetVersion: '0.7.0',
    classification: 'MINOR',
    workPackages: ['PR-449'],
    adrs: ['ADR-0030', 'ADR-0096'],
    migrations: ['none'],
    risks: ['none'],
    rollbackBoundary: 'Rollback to the exact prior accepted 0.6.0 artifact.',
    acceptanceRequirements: ['production smoke tests'],
    ...overrides,
  };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('ADR-0030 release version gate', () => {
  it('classifies only the exact next PATCH, MINOR or MAJOR transition', () => {
    expect(expectedClassification('0.6.0', '0.6.1')).toBe('PATCH');
    expect(expectedClassification('0.6.7', '0.7.0')).toBe('MINOR');
    expect(expectedClassification('0.9.4', '1.0.0')).toBe('MAJOR');
    expect(() => expectedClassification('0.6.0', '0.6.2')).toThrow('exakt den nächsten Patch');
    expect(() => expectedClassification('0.6.0', '0.8.0')).toThrow('nächste Minor-Version');
    expect(() => expectedClassification('0.6.0', '0.6.0')).toThrow('muss größer');
  });

  it('rejects a classification that does not match the requested version transition', () => {
    const root = createFixture();
    expect(() => buildReleaseVersionPlan(root, request({ classification: 'PATCH' })))
      .toThrow('passt nicht zum Versionssprung');
  });

  it('requires a dedicated GA ADR for a MAJOR release', () => {
    const root = createFixture();
    expect(() => buildReleaseVersionPlan(root, request({ targetVersion: '1.0.0', classification: 'MAJOR' })))
      .toThrow('GA-ADR');
  });

  it('fails closed when package-lock metadata already diverges before the release', () => {
    const root = createFixture();
    const lockPath = path.join(root, 'package-lock.json');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.packages[''].version = '0.5.9';
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
    expect(() => buildReleaseVersionPlan(root, request())).toThrow('package-lock.json ist nicht versionskonsistent');
  });

  it('updates authority and direct mirrors while keeping README derived and AGENTS untouched', () => {
    const root = createFixture();
    const originalReadme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    const originalAgents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    const archivedApiPath = path.join(root, 'docs/archive/raw-materials/API.md');
    const originalArchivedApi = fs.readFileSync(archivedApiPath, 'utf8');
    const plan = buildReleaseVersionPlan(root, request());

    expect(plan.updatedFiles).toContain('README.md');
    expect(plan.updatedFiles).not.toContain('AGENTS.md');
    expect(plan.updatedFiles).not.toContain('docs/API.md');
    expect(plan.updatedFiles).not.toContain('docs/archive/raw-materials/API.md');

    const originals = applyReleaseVersionPlan(root, plan);
    expect(() => assertAppliedVersionConsistency(root, '0.7.0')).not.toThrow();
    expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8')).toBe(originalReadme);
    expect(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')).toBe(originalAgents);
    expect(fs.readFileSync(archivedApiPath, 'utf8')).toBe(originalArchivedApi);
    expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toContain('Version 0.7.0');

    restoreReleaseVersionFiles(root, originals);
    expect(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version).toBe('0.6.0');
    expect(JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')).packages[''].version).toBe('0.6.0');
    expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8')).toBe(originalReadme);
  });

  it('refuses MINOR release plans without ADR traceability or production acceptance requirements', () => {
    const root = createFixture();
    expect(() => buildReleaseVersionPlan(root, request({ adrs: [] }))).toThrow('ADR-Referenz');
    expect(() => buildReleaseVersionPlan(root, request({ acceptanceRequirements: [] }))).toThrow('Production-Acceptance');
  });
});
