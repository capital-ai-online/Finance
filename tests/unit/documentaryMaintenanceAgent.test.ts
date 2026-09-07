import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { analyzeSemanticFreshness } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
import {
  DOCUMENT_LIFECYCLE_POLICY_PATH,
} from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';
import { observeDocumentaryMaintenance } from '../../src/platform/Supervisor/documentaryMaintenanceObservation';
import {
  applyDocumentaryMaintenancePlan,
  planDocumentaryMaintenance,
  type DocumentarySemanticMaintenanceProvider,
} from '../../src/platform/Documentary/Agents/DocumentaryMaintenanceAgent';

function write(root: string, relative: string, content: string): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

function git(root: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function setupRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-agent-'));
  write(root, 'docs/architecture/FOO.md', '# Foo\nImplementation: `src/platform/Foo/service.ts`\nState: old\n');
  write(root, 'docs/governance/document-registry.json', `${JSON.stringify({
    schemaVersion: '1.2.0',
    authority: DOCUMENT_LIFECYCLE_POLICY_PATH,
    entries: [{ documentId: 'DOC-FOO', type: 'architecture', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.2.3', language: 'en', lifecycle: 'approved', path: 'docs/architecture/FOO.md' }],
  }, null, 2)}\n`);
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.email', 'documentary-maintenance-test@example.invalid']);
  git(root, ['config', 'user.name', 'Documentary Maintenance Test']);
  git(root, ['add', '--', 'docs/architecture/FOO.md', 'docs/governance/document-registry.json']);
  git(root, ['commit', '-m', 'test baseline']);
  return root;
}

const provider: DocumentarySemanticMaintenanceProvider = {
  async assessFreshness() {
    return { stale: true, confidence: 0.95, reason: 'Source evidence changes the documented state.', provider: 'test:model', evidenceIds: ['E-1'] };
  },
  async proposeUpdate({ currentContent }) {
    return { content: currentContent.replace('State: old', 'State: current'), provider: 'test:model', evidenceIds: ['E-2'] };
  },
};

describe('Documentary Maintenance Agent', () => {
  it('applies only when the checked-out maintenance branch matches the authorized branch and bumps version deterministically', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'foo-update', sourceCommit: 'c'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts', summary: 'State is now current.' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider });
    expect(plan.patches).toHaveLength(1);
    git(root, ['switch', '-c', 'agent/documentary-maintenance-foo-update']);
    const result = applyDocumentaryMaintenancePlan({ repoRoot: root, branchName: 'agent/documentary-maintenance-foo-update', plan });
    expect(result.changedPaths).toContain('docs/governance/document-registry.json');
    expect(fs.readFileSync(path.join(root, 'docs/architecture/FOO.md'), 'utf8')).toContain('State: current');
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/governance/document-registry.json'), 'utf8'));
    expect(registry.entries[0].version).toBe('1.2.4');
    expect(registry.entries[0].lifecycle).toBe('generated');
  });

  it('rejects a maintenance branch parameter when the repository is actually checked out on main', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'main-deny', sourceCommit: 'd'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider });
    expect(() => applyDocumentaryMaintenancePlan({ repoRoot: root, branchName: 'agent/documentary-maintenance-main-deny', plan })).toThrow(/checked-out branch mismatch/);
  });

  it('skips semantic proposals that exceed the document size boundary', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'oversized-proposal', sourceCommit: 'e'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const oversizedProvider: DocumentarySemanticMaintenanceProvider = {
      async assessFreshness() {
        return { stale: true, confidence: 0.99, reason: 'Test oversized proposal.', provider: 'test:model', evidenceIds: ['E-1'] };
      },
      async proposeUpdate() {
        return { content: 'x'.repeat((256 * 1024) + 1), provider: 'test:model', evidenceIds: ['E-2'] };
      },
    };
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider: oversizedProvider });
    expect(plan.patches).toHaveLength(0);
    expect(plan.skipped.some((item) => item.reason.includes('exceeds 262144 bytes'))).toBe(true);
  });

  it('rejects a symlinked canonical Document Registry before mutation', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'registry-symlink', sourceCommit: 'f'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider });
    git(root, ['switch', '-c', 'agent/documentary-maintenance-registry-symlink']);

    const registryPath = path.join(root, 'docs/governance/document-registry.json');
    const targetPath = path.join(root, 'docs/governance/document-registry-target.json');
    fs.renameSync(registryPath, targetPath);
    fs.symlinkSync('document-registry-target.json', registryPath);

    expect(() => applyDocumentaryMaintenancePlan({
      repoRoot: root,
      branchName: 'agent/documentary-maintenance-registry-symlink',
      plan,
    })).toThrow(/regular non-symlink file/);
  });
});