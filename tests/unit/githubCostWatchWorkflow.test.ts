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
    expect(yaml).toContain("CAPITAL_AI_GITHUB_COST_WATCH_START_AT: '2026-10-01T00:00:00.000Z'");
    expect(yaml).toContain('CAPITAL_AI_GITHUB_ORG_LOGIN');
    expect(yaml).toContain('CAPITAL_AI_GITHUB_USER_ACCESS_TOKEN');
    expect(yaml).not.toContain('SMTP_PASSWORD');
    expect(yaml).not.toContain('SMTP_HOST');
  });

  it('keeps test execution owner-dispatched and monitor execution schedule-bound', () => {
    expect(yaml).toContain("github.event_name == 'schedule' || github.actor == 'SvenKulessa'");
    expect(yaml).toContain("github.event_name == 'workflow_dispatch' && inputs.mode || 'monitor'");
  });
});
