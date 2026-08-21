import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/self-heal-ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('S5B self-heal suspension', () => {
  it('removes automatic failure fan-out and keeps manual diagnostics only', () => {
    const yaml = workflow();
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).not.toMatch(/^\s*workflow_run:/m);
    expect(yaml).toContain('AUTONOMOUS_SELF_HEAL=SUSPENDED');
  });

  it('is read-only and has no AI secret or repository mutation path', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions: read');
    expect(yaml).toContain('contents: read');
    expect(yaml).toContain('pull-requests: read');
    expect(yaml).not.toContain('contents: write');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('issues: write');
    expect(yaml).not.toContain('id-token: write');
    expect(yaml).not.toContain('ANTHROPIC_API_KEY');
    expect(yaml).not.toContain('anthropics/claude-code-action');
    expect(yaml).not.toContain('gh pr create');
    expect(yaml).not.toContain('git push');
  });

  it('retains useful read-only PR and failed-run inspection', () => {
    const yaml = workflow();
    expect(yaml).toContain('gh pr view');
    expect(yaml).toContain('gh run view');
    expect(yaml).toContain('timeout-minutes: 3');
  });
});
