import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateRepositoryConventions } from './repositoryConventionValidator';

const tempRoots: string[] = [];

function createRepoFixture(options?: { name?: string; version?: string; lockVersion?: string }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-conventions-'));
  tempRoots.push(root);

  fs.mkdirSync(path.join(root, 'src', 'components'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src', 'platform', 'VersionManager'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs', 'adr'), { recursive: true });
  fs.mkdirSync(path.join(root, '.ai', 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, '.ai', 'registry'), { recursive: true });

  const name = options?.name ?? 'capital-ai';
  const version = options?.version ?? '0.6.0';
  const lockVersion = options?.lockVersion ?? version;

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name, version }, null, 2));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({
    name,
    version: lockVersion,
    lockfileVersion: 3,
    packages: { '': { name, version: lockVersion } }
  }, null, 2));
  fs.writeFileSync(path.join(root, '.ai', 'registry', 'exception-registry.json'), JSON.stringify({ exceptions: [] }, null, 2));
  fs.writeFileSync(path.join(root, 'src', 'components', 'AdminPortal.tsx'), 'export default function AdminPortal() { return null; }');
  fs.writeFileSync(path.join(root, 'docs', 'adr', 'ADR-0020-repository-conventions.md'), '# ADR');
  fs.writeFileSync(path.join(root, '.ai', 'skills', 'ESS-0004-Enterprise-Version-Manager.md'), '# ESS');

  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('validateRepositoryConventions', () => {
  it('accepts a convention-compliant repository in strict mode', () => {
    const report = validateRepositoryConventions(createRepoFixture(), 'strict');

    expect(report.summary.errors).toBe(0);
    expect(report.blocking).toBe(false);
  });

  it('blocks a legacy project identity in strict mode', () => {
    const report = validateRepositoryConventions(createRepoFixture({ name: 'react-example' }), 'strict');

    expect(report.blocking).toBe(true);
    expect(report.findings.some(finding => finding.ruleId === 'REPO-PKG-002')).toBe(true);
  });

  it('detects package-lock version drift', () => {
    const report = validateRepositoryConventions(createRepoFixture({ version: '0.6.0', lockVersion: '0.5.4' }), 'strict');

    expect(report.blocking).toBe(true);
    expect(report.findings.some(finding => finding.ruleId === 'REPO-PKG-006')).toBe(true);
  });

  it('keeps errors non-blocking in advisory mode', () => {
    const report = validateRepositoryConventions(createRepoFixture({ name: 'react-example' }), 'advisory');

    expect(report.summary.errors).toBeGreaterThan(0);
    expect(report.blocking).toBe(false);
  });
});
