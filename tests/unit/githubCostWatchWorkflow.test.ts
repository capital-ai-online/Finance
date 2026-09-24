import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('GitHub cost watch workflow contract', () => {
  const yaml = fs.readFileSync(
    path.join(process.cwd(), '.github/workflows/github-cost-watch.yml'),
    'utf8',
  );

  it('uses bounded schedule, main-owned OIDC and no SMTP credential in GitHub Actions', () => {
    expect(yaml).toContain("cron: '3,18,33,48 * * * *'");
    expect(yaml).toContain('id-token: write');
    expect(yaml).toContain('issues: write');
    expect(yaml).toContain("CAPITAL_AI_GITHUB_COST_WATCH_START_AT: '2026-10-01T00:00:00.000Z'");
    expect(yaml).toContain('CAPITAL_AI_GITHUB_ORG_LOGIN');
    expect(yaml).toContain('CAPITAL_AI_GITHUB_USER_BILLING_READ_TOKEN');
    expect(yaml).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(yaml).toContain('CAPITAL_AI_RENDER_WORKSPACE_ID');
    expect(yaml).toContain('CAPITAL_AI_RENDER_WORKSPACE_PLAN');
    expect(yaml).toContain('CAPITAL_AI_STRIPE_BILLING_READ_KEY');
    expect(yaml).not.toContain('STRIPE_SECRET_KEY');
    expect(yaml).not.toContain('SMTP_PASSWORD');
    expect(yaml).not.toContain('SMTP_HOST');
  });

  it('keeps the 45k blocker machine-managed and leaves the cost-watch workflow itself exempt', () => {
    expect(yaml).toContain('45.000-Minuten-Hard-Blocker mit GitHub-Issue synchronisieren');
    expect(yaml).toContain('node scripts/operations/syncGitHubActionsMinuteBlocker.mjs');
    expect(yaml).toContain('CAPITAL_AI_GITHUB_COST_WATCH_REPORT_PATH');
    expect(yaml).not.toContain('P0 GitHub Actions 45.000-Minuten-Blocker prüfen');
  });

  it('keeps test execution owner-dispatched and monitor execution schedule-bound', () => {
    expect(yaml).toContain("github.event_name == 'schedule' || github.actor == 'SvenKulessa'");
    expect(yaml).toContain("github.event_name == 'workflow_dispatch' && inputs.mode || 'monitor'");
  });
});
