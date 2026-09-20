import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const marker = '<!-- CAPITAL_AI_ACTIONS_MINUTE_BLOCKER_V1 -->';

function workflow(relative: string): string {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

describe('GitHub Actions monthly minute hard blocker workflow contract', () => {
  const protectedWorkflows = [
    '.github/workflows/ci.yml',
    '.github/workflows/pr-governance.yml',
    '.github/workflows/container-security.yml',
  ];

  for (const file of protectedWorkflows) {
    it(`${file} fails closed on the durable 45k blocker before expensive work`, () => {
      const yaml = workflow(file);
      const gateIndex = yaml.indexOf('P0 GitHub Actions 45.000-Minuten-Blocker prüfen');
      expect(gateIndex).toBeGreaterThanOrEqual(0);
      expect(yaml).toContain('issues: read');
      expect(yaml).toContain(marker);
      expect(yaml).toContain('github.rest.issues.listForRepo');
      expect(yaml).toContain('kostenrelevante Required-Workflow-Arbeit wird fail-closed gestoppt');

      const expensiveTokens = file.endsWith('ci.yml')
        ? ['actions/checkout@', 'npm ci', 'npm test']
        : file.endsWith('pr-governance.yml')
          ? ['actions/checkout@', 'npm ci']
          : ['actions/checkout@', 'docker buildx build'];
      for (const token of expensiveTokens) {
        const index = yaml.indexOf(token);
        expect(index).toBeGreaterThan(gateIndex);
      }
    });
  }

  it('does not gate the cost-watch workflow so it can clear the blocker after month rollover', () => {
    const yaml = workflow('.github/workflows/github-cost-watch.yml');
    expect(yaml).toContain('syncGitHubActionsMinuteBlocker.mjs');
    expect(yaml).not.toContain('P0 GitHub Actions 45.000-Minuten-Blocker prüfen');
  });
});
