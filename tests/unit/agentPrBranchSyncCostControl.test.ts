import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/sync-agent-pr-branches.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('P2 agent PR main-sync cost control', () => {
  it('keeps main-push sync and adds a single-PR ready-for-review recovery path', () => {
    const yaml = workflow();
    expect(yaml).toContain('push:\n    branches: [main]');
    expect(yaml).toContain('pull_request:\n    branches: [main]\n    types: [ready_for_review]');
    expect(yaml).toContain('workflow_dispatch: {}');
  });

  it('does not allocate a write-capable runner for fork ready-for-review events', () => {
    const yaml = workflow();
    expect(yaml).toContain("if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository");
  });

  it('observes draft state and exact head identity before deciding to sync', () => {
    const yaml = workflow();
    expect(yaml).toContain('headRefOid');
    expect(yaml).toContain('isDraft');
    expect(yaml).toContain('isCrossRepository');
    expect(yaml).toContain('baseRefName');
  });

  it('skips draft PRs only for automatic main-push fan-out', () => {
    const yaml = workflow();
    expect(yaml).toContain("if [ \"$EVENT_NAME\" = 'push' ] && [ \"$draft\" = 'true' ]; then");
    expect(yaml).toContain('Draft bleibt bei main-Push bewusst unsynchronisiert (P2 Cost-Control).');
    expect(yaml).not.toContain("if [ \"$EVENT_NAME\" = 'workflow_dispatch' ] && [ \"$draft\" = 'true' ]; then");
  });

  it('scopes ready-for-review to exactly the event PR', () => {
    const yaml = workflow();
    expect(yaml).toContain('EVENT_PR_NUMBER: ${{ github.event.pull_request.number }}');
    expect(yaml).toContain('gh pr view "$EVENT_PR_NUMBER"');
    expect(yaml).toContain("| jq -c '[.]'");
  });

  it('keeps the canonical active-provider branch allowlist and main base boundary', () => {
    const yaml = workflow();
    expect(yaml).toContain("if [ \"$base\" != 'main' ]; then");
    expect(yaml).toContain('agent/*|claude/*|grok/*|ai/*');
    expect(yaml).not.toContain('gemini/*');
    expect(yaml).not.toContain('copilot/*');
  });

  it('binds update-branch to the observed exact PR head SHA', () => {
    const yaml = workflow();
    expect(yaml).toContain("grep -Eq '^[0-9a-f]{40}$'");
    expect(yaml).toContain('-f "expected_head_sha=$head_sha"');
    expect(yaml).toContain('bereits aktuell, Head inzwischen geaendert oder Update laeuft schon (422)');
  });

  it('treats only the GitHub stacked-PR update-branch 403 as a nonfatal platform limitation', () => {
    const yaml = workflow();
    expect(yaml).toContain("Updating a stacked PR's branch via this endpoint is not supported");
    expect(yaml).toContain("&& grep -qi '403' err.log");
    expect(yaml).toContain('Stacked PR erkannt; GitHub update-branch ist fuer diesen Zustand nicht unterstuetzt (403).');
    expect(yaml).toContain('current-main ancestry bleibt vor Merge durch die bestehende PR-Governance fail-closed erzwungen.');
    expect(yaml).toContain('cat err.log');
    expect(yaml).toContain('exit 1');
  });

  it('does not let a single ready-for-review sync cancel a repository-wide main sync', () => {
    const yaml = workflow();
    expect(yaml).toContain("group: sync-agent-pr-branches-${{ github.event_name == 'pull_request' && github.event.pull_request.number || 'main' }}");
    expect(yaml).toContain('cancel-in-progress: true');
  });

  it('uses only the write permissions required by GitHub update-branch and no external actions', () => {
    const yaml = workflow();
    expect(yaml).toContain('contents: write');
    expect(yaml).toContain('pull-requests: write');
    expect(yaml).not.toContain('uses:');
  });
});
