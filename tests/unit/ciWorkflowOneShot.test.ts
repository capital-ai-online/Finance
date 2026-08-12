import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.join(process.cwd(), '.github/workflows/ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('CI one-shot build-and-test contract', () => {
  it('keeps workflow permissions read-only and adds Actions read access for durable run evidence', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions: read');
    expect(yaml).toContain('contents: read');
    expect(yaml).toContain('pull-requests: read');
    expect(yaml).not.toContain('actions: write');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('pull_request_target:');
  });

  it('does not cancel an authorized PR build when later metadata edits arrive', () => {
    const yaml = workflow();
    expect(yaml).toContain("cancel-in-progress: ${{ github.event_name == 'push' }}");
    expect(yaml).toContain('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}');
  });

  it('starts the Owner gate only on the transition to both canonical attestations', () => {
    const yaml = workflow();
    expect(yaml).toContain('github.run_attempt == 1');
    expect(yaml).toContain('github.event.changes.body.from != null');
    expect(yaml).toContain("contains(github.event.pull_request.body, '- [x] Human/Owner: vollständigen PR-Diff geprüft.')");
    expect(yaml).toContain("contains(github.event.pull_request.body, '- [x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.')");
    expect(yaml).toContain("contains(github.event.changes.body.from, '- [x] Human/Owner: vollständigen PR-Diff geprüft.')");
    expect(yaml).toContain("contains(github.event.changes.body.from, '- [x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.')");
  });

  it('binds the one-shot reservation to the exact PR and head SHA', () => {
    const yaml = workflow();
    expect(yaml).toContain('CURRENT_RUN_ID: ${{ github.run_id }}');
    expect(yaml).toContain('actions/workflows/ci.yml/runs?event=pull_request&head_sha=${PR_HEAD_SHA}&per_page=100');
    expect(yaml).toContain('select(.id != (${CURRENT_RUN_ID} | tonumber))');
    expect(yaml).toContain('select(any(.pull_requests[]?; .number == (${PR_NUMBER} | tonumber)))');
  });

  it('treats every non-skipped build-and-test job as a consumed or reserved one-shot slot', () => {
    const yaml = workflow();
    expect(yaml).toContain('.name == "build-and-test" and .conclusion != "skipped"');
    expect(yaml).toContain('One-Shot reserviert: build-and-test');
    expect(yaml).toContain('One-Shot erfüllt: build-and-test');
    expect(yaml).toContain('Ein Retry auf demselben Head ist nicht erlaubt; ein neuer Commit/Head ist erforderlich.');
  });

  it('preserves exact current-head Owner review and body snapshot authorization', () => {
    const yaml = workflow();
    expect(yaml).toContain('.commit_id == env.PR_HEAD_SHA');
    expect(yaml).toContain('PR_BODY: ${{ github.event.pull_request.body || \'\' }}');
    expect(yaml).toContain('needs.owner-gate.outputs.approved == \'true\'');
    expect(yaml).toContain('Owner-Gate erfüllt und One-Shot frei. Genau ein build-and-test');
  });
});
