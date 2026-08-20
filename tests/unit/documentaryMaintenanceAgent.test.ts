import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeSemanticFreshness } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
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

function setupRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-agent-'));
  write(root, 'docs/architecture/FOO.md', '# Foo\nImplementation: `src/platform/Foo/service.ts`\nState: old\n');
  write(root, 'docs/governance/document-registry.json', `${JSON.stringify({
    schemaVersion: '1.2.0',
    authority: 'docs/governance/DOCUMENTATION_HYGIENE_POLICY.md',
    entries: [{ documentId: 'DOC-FOO', type: 'architecture', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.2.3', language: 'en', lifecycle: 'approved', path: 'docs/architecture/FOO.md' }],
  }, null, 2)}\n`);
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
  it('applies only on a maintenance branch and bumps document patch version deterministically', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'foo-update', sourceCommit: 'c'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts', summary: 'State is now current.' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider });
    expect(plan.patches).toHaveLength(1);
    const result = applyDocumentaryMaintenancePlan({ repoRoot: root, branchName: 'agent/documentary-maintenance-foo-update', plan });
    expect(result.changedPaths).toContain('docs/governance/document-registry.json');
    expect(fs.readFileSync(path.join(root, 'docs/architecture/FOO.md'), 'utf8')).toContain('State: current');
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/governance/document-registry.json'), 'utf8'));
    expect(registry.entries[0].version).toBe('1.2.4');
    expect(registry.entries[0].lifecycle).toBe('generated');
  });

  it('rejects apply on main', async () => {
    const root = setupRepo();
    const freshness = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'main-deny', sourceCommit: 'd'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts' }] });
    const recommendation = observeDocumentaryMaintenance(freshness, []);
    const plan = await planDocumentaryMaintenance({ repoRoot: root, freshness, recommendation, provider });
    expect(() => applyDocumentaryMaintenancePlan({ repoRoot: root, branchName: 'main', plan })).toThrow(/isolated/);
  });
});
