import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/sync-agent-pr-branches.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('post-correlation next PR pipeline gate', () => {
  it('replaces direct main-push fan-out with the successful post-merge correlation trigger', () => {
    const yaml = workflow();
    expect(yaml).toContain("workflow_run:\n    workflows: ['Post-Merge Production Correlation']\n    types: [completed]\n    branches: [main]");
    expect(yaml).not.toContain('on:\n  push:\n    branches: [main]');
    expect(yaml).toContain('pull_request:\n    branches: [main]\n    types: [ready_for_review]');
    expect(yaml).toContain('workflow_dispatch: {}');
  });

  it('hard-binds the privileged correlation source before allocating the write lane', () => {
    const yaml = workflow();
    expect(yaml).toContain('github.event.workflow_run.repository.full_name == github.repository');
    expect(yaml).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
    expect(yaml).toContain("github.event.workflow_run.path == '.github/workflows/post-merge-production-correlation.yml'");
    expect(yaml).toContain("github.event.workflow_run.event == 'push'");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).not.toContain('pull_request_target:');
    expect(yaml).toContain("github.event_name == 'workflow_dispatch'");
    expect(yaml).toContain("github.event_name == 'pull_request'");
    expect(yaml).toContain('github.event.pull_request.head.repo.full_name == github.repository');
  });

  it('rejects stale correlation before any PR synchronization', () => {
    const yaml = workflow();
    expect(yaml).toContain('SOURCE_MAIN_SHA: ${{ github.event.workflow_run.head_sha }}');
    expect(yaml).toContain("current_main_sha=\"$(gh api \"repos/$REPO/branches/main\" --jq '.commit.sha')\"");
    expect(yaml).toContain('if [ "$current_main_sha" != "$SOURCE_MAIN_SHA" ]; then');
    expect(yaml).toContain('Kein PR wird synchronisiert.');
  });

  it('selects exactly one review-ready eligible PR in deterministic FIFO order', () => {
    const yaml = workflow();
    expect(yaml).toContain("prs=\"$(echo \"$prs\" | jq -c 'sort_by(.number)')\"");
    expect(yaml).toContain("if [ \"$EVENT_NAME\" = 'workflow_run' ] && [ \"$draft\" = 'true' ]; then");
    expect(yaml).toContain('Post-Korrelation: PR #$number ($head) ist der naechste eligible FIFO-PR');
    expect(yaml).toContain("done < <(echo \"$prs\" | jq -c '.[]')");
  });

  it('observes draft, author and exact head identity before deciding to sync', () => {
    const yaml = workflow();
    expect(yaml).toContain('headRefOid');
    expect(yaml).toContain('isDraft');
    expect(yaml).toContain('isCrossRepository');
    expect(yaml).toContain('baseRefName');
    expect(yaml).toContain('author');
    expect(yaml).toContain("author=\"$(echo \"$pr\" | jq -r '.author.login // \"\"')\"");
  });

  it('scopes ready-for-review to exactly the event PR', () => {
    const yaml = workflow();
    expect(yaml).toContain('EVENT_PR_NUMBER: ${{ github.event.pull_request.number }}');
    expect(yaml).toContain('gh pr view "$EVENT_PR_NUMBER"');
    expect(yaml).toContain("| jq -c '[.]'");
  });

  it('keeps active provider prefixes and owner-authored conventional work branches', () => {
    const yaml = workflow();
    expect(yaml).toContain("if [ \"$base\" != 'main' ]; then");
    expect(yaml).toContain('agent/*|claude/*|grok/*|ai/*');
    expect(yaml).toContain('feat/*|fix/*|hotfix/*|chore/*|refactor/*|docs/*|test/*|perf/*|security/*');
    expect(yaml).toContain('repo_owner="${REPO%%/*}"');
    expect(yaml).toContain('if [ "$author" != "$repo_owner" ]; then');
    expect(yaml).not.toContain('gemini/*');
    expect(yaml).not.toContain('copilot/*');
  });

  it('binds update-branch to the observed exact PR head SHA', () => {
    const yaml = workflow();
    expect(yaml).toContain("grep -Eq '^[0-9a-f]{40}$'");
    expect(yaml).toContain('-f "expected_head_sha=$head_sha"');
    expect(yaml).toContain('bereits aktuell, Head inzwischen geaendert oder Update laeuft schon (422)');
  });

  it('stops fail-closed instead of skipping a selected stacked PR', () => {
    const yaml = workflow();
    expect(yaml).toContain("Updating a stacked PR's branch via this endpoint is not supported");
    expect(yaml).toContain("&& grep -qi '403' err.log");
    expect(yaml).toContain('Post-Korrelation stoppt fail-closed beim ausgewaehlten PR; kein spaeterer PR wird uebersprungen.');
  });

  it('shares the canonical PR writer lease for ready-for-review and serializes the dynamic continuation lane', () => {
    const yaml = workflow();
    expect(yaml).toContain("format('capital-ai-pr-writer-{0}', github.event.pull_request.number)");
    expect(yaml).toContain("'capital-ai-post-merge-continuation-main'");
    expect(yaml).toContain('cancel-in-progress: false');
  });

  it('binds every post-correlation update to the canonical PR generation immediately before mutation', () => {
    const yaml = workflow();
    expect(yaml).toContain('node policy/scripts/pr/prConvergenceGeneration.mjs');
    expect(yaml).toContain('generation="$(generation_for "$number" "$head_sha" "$current_main_sha")"');
    expect(yaml).toContain('live_generation="$(generation_for "$number" "$live_head_sha" "$live_main_sha")"');
    expect(yaml).toContain('Continuation Generation drifted before mutation');
    expect(yaml).toContain('gh api "repos/$REPO/compare/$current_main_sha...$head_sha"');
  });

  it('treats update-branch 422 as converged only after exact current-main ancestry readback', () => {
    const yaml = workflow();
    expect(yaml).toContain('422 is ambiguous');
    expect(yaml).toContain('after_lineage');
    expect(yaml).toContain('422 ohne beweisbare Konvergenz');
    expect(yaml).toContain("[ \"$after_lineage\" = 'ahead' ]");
    expect(yaml).toContain("[ \"$after_lineage\" = 'identical' ]");
  });

  it('uses a pinned GitHub App token only for the trusted automatic lane', () => {
    const yaml = workflow();
    expect(yaml).toContain('contents: write');
    expect(yaml).toContain('pull-requests: write');
    expect(yaml).toContain("if: github.event_name == 'workflow_run'");
    expect(yaml).toContain('actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1');
    expect(yaml).toContain('client-id: ${{ vars.CAPITAL_AI_GITHUB_APP_CLIENT_ID }}');
    expect(yaml).toContain('private-key: ${{ secrets.CAPITAL_AI_GITHUB_APP_PRIVATE_KEY }}');
    expect(yaml).toContain('permission-contents: write');
    expect(yaml).toContain('permission-pull-requests: write');
    expect(yaml).toContain("GH_TOKEN: ${{ github.event_name == 'workflow_run' && steps.app_token.outputs.token || github.token }}");
  });
});
