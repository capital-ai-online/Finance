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

  it('binds one-shot reservation and reusable evidence to the exact PR and head SHA', () => {
    const yaml = workflow();
    expect(yaml).toContain('CURRENT_RUN_ID: ${{ github.run_id }}');
    expect(yaml).toContain('actions/workflows/ci.yml/runs?event=pull_request&head_sha=${PR_HEAD_SHA}&per_page=100');
    expect(yaml).toContain('select(.id != (${CURRENT_RUN_ID} | tonumber))');
    expect(yaml).toContain('select(any(.pull_requests[]?; .number == (${PR_NUMBER} | tonumber)))');
    expect(yaml).toContain('evidence_run_id: ${{ steps.gate.outputs.evidence_run_id }}');
    expect(yaml).toContain('evidence_job_id: ${{ steps.gate.outputs.evidence_job_id }}');
    expect(yaml).toContain('Evidence-Reuse für aktuellen PR-Head verifizieren');
    expect(yaml).toContain('.head_sha == env.PR_HEAD_SHA');
  });

  it('marks primary full-test evidence explicitly so reuse runs cannot become primary evidence', () => {
    const yaml = workflow();
    expect(yaml).toContain('name: build-and-test');
    expect(yaml).toContain('- name: Primär-Volltest autorisiert');
    expect(yaml).toContain('.name == "build-and-test" and .conclusion != "skipped" and any(.steps[]?; .name == "Primär-Volltest autorisiert" and .conclusion == "success")');
    expect(yaml).toContain('.name == "build-and-test" and .conclusion == "success" and any(.steps[]?; .name == "Primär-Volltest autorisiert" and .conclusion == "success")');
    expect(yaml).toContain('Marker-Step');
  });

  it('runs the required build-and-test job for fresh authorization or verified evidence reuse', () => {
    const yaml = workflow();
    expect(yaml).toContain("needs.owner-gate.outputs.approved == 'true' || needs.owner-gate.outputs.reused == 'true'");
    expect(yaml).toContain("needs.owner-gate.outputs.reused != 'true'");
    expect(yaml).toContain('One-Shot erfüllt: Primär-build-and-test');
    expect(yaml).toContain('Ein Retry auf demselben Head ist nicht erlaubt; ein neuer Commit/Head ist erforderlich.');
  });

  it('validates the live PR body and production baseline from immutable event refs without credentialed refetch', () => {
    const yaml = workflow();
    expect(yaml).toContain('Live-PR-Body und Produktionsbaseline validieren');
    expect(yaml).toContain('node scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node scripts/pr/validatePrBody.mjs');
    expect(yaml).toContain('PR_BASE_REF: ${{ github.event.pull_request.base.sha }}');
    expect(yaml).toContain('PR_HEAD_REF: ${{ github.event.pull_request.head.sha }}');
    expect(yaml).not.toContain('git fetch --no-tags origin main:refs/remotes/origin/main');
  });

  it('makes repository conventions blocking in the full C/R path', () => {
    const yaml = workflow();
    expect(yaml).toContain('Repository-Konventionen blocking prüfen');
    expect(yaml).toContain('npm run repository:validate');
    expect(yaml).not.toContain('repository:validate:advisory');
  });

  it('builds and starts the exact PR-head Docker image and probes healthz', () => {
    const yaml = workflow();
    expect(yaml).toContain("IMAGE_SHA: ${{ github.event_name == 'push' && github.sha || github.event.pull_request.head.sha }}");
    expect(yaml).toContain('docker build --tag "capital-ai-ci:${IMAGE_SHA}" .');
    expect(yaml).toContain('Produktions-Docker-Container starten und /healthz prüfen');
    expect(yaml).toContain('docker run -d');
    expect(yaml).toContain('http://127.0.0.1:${host_port}/healthz');
    expect(yaml).toContain("test \"$health_ok\" = 'true'");
  });

  it('preserves exact current-head Owner review and body snapshot authorization', () => {
    const yaml = workflow();
    expect(yaml).toContain('.commit_id == env.PR_HEAD_SHA');
    expect(yaml).toContain('PR_BODY: ${{ github.event.pull_request.body || \'\' }}');
    expect(yaml).toContain('Owner-Gate erfüllt und One-Shot frei. Genau ein Primär-build-and-test');
  });
});
