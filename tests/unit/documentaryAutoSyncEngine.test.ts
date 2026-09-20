import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyDocumentaryAutoSyncPlan,
  planDocumentaryAutoSync,
  registeredDocumentaryAutoSyncRules,
} from '../../src/platform/Documentary/Automation/DocumentaryAutoSyncEngine';

function write(root: string, relative: string, content: string): void {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

describe('DocumentaryAutoSyncEngine', () => {
  it('registers only bounded current-projection targets', () => {
    const rules = registeredDocumentaryAutoSyncRules();
    expect(rules.map((rule) => rule.path).sort()).toEqual([
      'docs/projects/PROJECT_VALUE_CHAIN.md',
      'docs/projects/README.md',
      'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md',
    ]);
    expect(rules.some((rule) => rule.path.startsWith('docs/archive/'))).toBe(false);
  });

  it('repairs superseded DATA routing deterministically', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-autosync-'));
    write(root, 'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md', [
      '| Project | PVC | Roadmap |',
      '|---|---|---|',
      '| `CAPITAL-AI-DATA` | `PVC-09..PVC-11` | [data](../projects/data/ROADMAP.md) |',
      '| `CAPITAL-AI-FINTECH` | `PVC-12..PVC-17` | [fintech](../projects/fintech/ROADMAP.md) |',
      '',
    ].join('\n'));
    write(root, 'docs/projects/README.md', [
      '| Project | Primary PVC stages | Role |',
      '|---|---|---|',
      '| `CAPITAL-AI-DATA` | `PVC-09`..`PVC-11` | Data |',
      '| `CAPITAL-AI-FINTECH` | `PVC-12`..`PVC-17` | FinTech |',
      '',
    ].join('\n'));
    write(root, 'docs/projects/PROJECT_VALUE_CHAIN.md', [
      '| PVC | Stage | Primary Project Owner |',
      '|---|---|---|',
      '| `PVC-09` | UAI / Data Ingestion | `CAPITAL-AI-DATA` |',
      '| `PVC-10` | Evidence Management | `CAPITAL-AI-DATA` |',
      '| `PVC-11` | Data Quality | `CAPITAL-AI-DATA` |',
      '',
    ].join('\n'));

    const plan = planDocumentaryAutoSync({ repoRoot: root, sourceCommit: 'a'.repeat(40) });
    expect(plan.patches).toHaveLength(3);
    expect(plan.patches.flatMap((patch) => patch.ruleIds)).toEqual(expect.arrayContaining([
      'DOC-AUTOSYNC-DATA-MASTER-INDEX-001',
      'DOC-AUTOSYNC-DATA-PROJECT-README-001',
      'DOC-AUTOSYNC-DATA-PVC-OWNER-001',
    ]));

    applyDocumentaryAutoSyncPlan(plan, root);

    const master = fs.readFileSync(path.join(root, 'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md'), 'utf8');
    const projects = fs.readFileSync(path.join(root, 'docs/projects/README.md'), 'utf8');
    const pvc = fs.readFileSync(path.join(root, 'docs/projects/PROJECT_VALUE_CHAIN.md'), 'utf8');
    expect(master).not.toContain('CAPITAL-AI-DATA');
    expect(master).toContain('PVC-09..PVC-17');
    expect(projects).not.toMatch(/^\|\s*`CAPITAL-AI-DATA`/m);
    expect(projects).toContain('`PVC-09`..`PVC-17`');
    expect(pvc).not.toMatch(/PVC-(?:09|10|11).*CAPITAL-AI-DATA/);
  });

  it('does not create patches for an already-converged baseline', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-autosync-clean-'));
    write(root, 'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md', '| `CAPITAL-AI-FINTECH` | `PVC-09..PVC-17` | [fintech](../projects/fintech/ROADMAP.md) |\n');
    write(root, 'docs/projects/README.md', '| `CAPITAL-AI-FINTECH` | `PVC-09`..`PVC-17` | FinTech |\n');
    write(root, 'docs/projects/PROJECT_VALUE_CHAIN.md', '| `PVC-09` | UAI / Data Ingestion | `CAPITAL-AI-FINTECH` |\n');

    const plan = planDocumentaryAutoSync({ repoRoot: root, sourceCommit: 'b'.repeat(40) });
    expect(plan.patches).toEqual([]);
  });
});
