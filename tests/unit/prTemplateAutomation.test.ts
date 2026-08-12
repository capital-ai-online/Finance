import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('PR template automation contract', () => {
  it('leaves exactly two manual Human/Owner checkboxes outside machine-managed blocks', () => {
    const template = read('.github/pull_request_template.md');
    expect(template).toContain('CAPITAL_AI_PR_TEMPLATE_VERSION: 2.2.0');
    expect(template).toContain('CAPITAL_AI_MACHINE_EVIDENCE_START');
    expect(template).toContain('CAPITAL_AI_MACHINE_MERGE_START');

    const withoutMachine = template
      .replace(/<!-- CAPITAL_AI_MACHINE_EVIDENCE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_EVIDENCE_END -->/g, '')
      .replace(/<!-- CAPITAL_AI_MACHINE_MERGE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_MERGE_END -->/g, '');
    const manual = [...withoutMachine.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/gm)].map((match) => match[1]);
    expect(manual).toEqual([
      'Human/Owner: vollständigen PR-Diff geprüft.',
      'Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.',
    ]);
  });

  it('marks every non-human checkbox as machine managed', () => {
    const template = read('.github/pull_request_template.md');
    const blocks = [
      template.match(/<!-- CAPITAL_AI_MACHINE_EVIDENCE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_EVIDENCE_END -->/)?.[0] || '',
      template.match(/<!-- CAPITAL_AI_MACHINE_MERGE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_MERGE_END -->/)?.[0] || '',
    ];
    for (const block of blocks) {
      const labels = [...block.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/gm)].map((match) => match[1]);
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.every((label) => label.startsWith('🤖'))).toBe(true);
    }
  });

  it('syncs status from trusted-main workflow evidence after Governance and CI runs', () => {
    const workflow = read('.github/workflows/pr-auto-classification.yml');
    expect(workflow).toContain('name: PR Auto-Status');
    expect(workflow).toContain('workflows: ["PR Governance", "CI"]');
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('ref: main');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('node scripts/pr/updatePrClassification.mjs');
    expect(workflow).toContain('node scripts/pr/syncPrEvidence.mjs');
  });

  it('resets Human checkboxes only when the PR head changes', () => {
    const updater = read('scripts/pr/updatePrClassification.mjs');
    expect(updater).toContain("markerValue('CAPITAL_AI_SYNC_HEAD_SHA', 'UNSET')");
    expect(updater).toContain('const headChanged = previousSyncHead !== currentHead;');
    expect(updater).toContain('if (headChanged)');
    expect(updater).toContain("'- [ ] Human/Owner: vollständigen PR-Diff geprüft.'");
  });

  it('binds automatic evidence and Human review to the exact current head', () => {
    const sync = read('scripts/pr/syncPrEvidence.mjs');
    expect(sync).toContain('head_sha=${headSha}');
    expect(sync).toContain('review.commit_id === headSha');
    expect(sync).toContain('CAPITAL_AI_MACHINE_EVIDENCE_START');
    expect(sync).toContain('CAPITAL_AI_MACHINE_MERGE_START');
    expect(sync).toContain("candidate.name === 'build-and-test'");
    expect(sync).toContain("stepConclusion(candidate, 'Primär-Volltest autorisiert') === 'success'");
  });

  it('keeps merge authority outside auto-set checkboxes', () => {
    const template = read('.github/pull_request_template.md');
    expect(template).toContain('Nicht automatisierbare Grenzen – bewusst ohne Checkbox');
    expect(template).toContain('Merge erfolgt nur nach einer **separaten ausdrücklichen menschlichen Anweisung**');
    expect(template).not.toMatch(/- \[[ xX]\].*Merge erfolgt nur nach/);
  });
});
