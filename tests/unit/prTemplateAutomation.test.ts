import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('PR template automation contract', () => {
  it('keeps Human authority out of the body and only machine boxes in managed blocks', () => {
    const template = read('.github/pull_request_template.md');
    expect(template).toContain('CAPITAL_AI_PR_TEMPLATE_VERSION: 2.3.0');
    expect(template).toContain('CAPITAL_AI_HUMAN_GATE_AUTHORITY: BOT_COMMENT_ONLY');
    const withoutMachine = template
      .replace(/<!-- CAPITAL_AI_MACHINE_EVIDENCE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_EVIDENCE_END -->/g, '')
      .replace(/<!-- CAPITAL_AI_MACHINE_MERGE_START -->[\s\S]*?<!-- CAPITAL_AI_MACHINE_MERGE_END -->/g, '');
    expect([...withoutMachine.matchAll(/^\s*-\s*\[[ xX]\]/gm)]).toHaveLength(0);
    expect(template).not.toContain('- [ ] Human/Owner:');
    expect(template).toContain('ausschließlich im head-gebundenen Bot-Kommentar');
  });

  it('marks every body checkbox as machine managed', () => {
    const template = read('.github/pull_request_template.md');
    const labels = [...template.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+?)\s*$/gm)].map((match) => match[1]);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((label) => label.startsWith('🤖'))).toBe(true);
  });

  it('syncs after Governance and dispatched PR build runs from trusted main', () => {
    const workflow = read('.github/workflows/pr-auto-classification.yml');
    expect(workflow).toContain('workflows: ["PR Governance", "PR Build and Test"]');
    expect(workflow).toContain('PR-Nummer fail-closed ermitteln');
    expect(workflow).toContain('RUN_TITLE: ${{ github.event.workflow_run.display_title }}');
    expect(workflow).toContain('ref: main');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('PR_NUMBER: ${{ steps.pr.outputs.number }}');
  });

  it('resets approval only through the comment workflow and trusts exact check identities', () => {
    const updater = read('scripts/pr/updatePrClassification.mjs');
    const sync = read('scripts/pr/syncPrEvidence.mjs');
    expect(updater).not.toContain("'- [ ] Human/Owner:");
    expect(updater).toContain('Bot-Kommentar-Workflow zurückgesetzt');
    expect(sync).toContain('check-runs?filter=all');
    expect(sync).toContain('capital-ai:pr:${prNumber}:${kind}');
    expect(sync).toContain("check.app?.slug === 'github-actions'");
    expect(sync).not.toContain('checkedHuman');
  });
});
