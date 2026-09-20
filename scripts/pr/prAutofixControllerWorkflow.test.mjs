import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync('.github/workflows/pr-autofix-controller.yml', 'utf8');

test('controller uses completed workflow_run for initial runs and reruns with default-deny permissions', () => {
  assert.match(workflow, /workflow_run:\n\s+workflows: \[CI, PR Governance\]/);
  assert.match(workflow, /types: \[completed\]/);
  assert.doesNotMatch(workflow, /types: \[[^\]]*in_progress/);
  assert.match(workflow, /^permissions: \{\}$/m);
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});

test('classifier is read-only and binds exact same-repository PR head to current main', () => {
  const block = workflow.split('  classify:\n')[1].split('\n  delegate_pr_metadata:\n')[0];
  for (const token of [
    'actions: read',
    'contents: read',
    'pull-requests: read',
    "github.event.action == 'completed'",
    "github.event.workflow_run.conclusion == 'failure'",
    "pr.state === 'open'",
    "pr.base.ref === 'main'",
    'pr.head.repo?.full_name === repository',
    'normalizeSha(pr.head.sha) === headSha',
    'mainSha !== baseSha',
    "steps.source.outputs.conclusion == 'failure'",
  ]) assert.ok(block.includes(token), 'missing classify guard: ' + token);
  assert.doesNotMatch(block, /contents: write|pull-requests: write|actions: write/);
});

test('controller derives a bounded PR metadata shape before semantic delegation', () => {
  const block = workflow.split('  classify:\n')[1].split('\n  delegate_pr_metadata:\n')[0];
  for (const token of [
    "core.setOutput('pr_metadata_shape', prMetadataShape)",
    'CURRENT_V17_CANONICAL',
    'CURRENT_V17_LEGACY_BASELINE_SECTION',
    'CURRENT_V17_OTHER',
    'CURRENT_V16_GENERIC_MISSING_SECTIONS',
    'CURRENT_V16_SECURITY_BOUNDARY_EXACT',
    'CURRENT_V16_SECURITY_BOUNDARY_LOOKALIKE',
    'PR_METADATA_SHAPE: ${{ steps.pr.outputs.pr_metadata_shape }}',
    'REPORT_METADATA_SHAPE: ${{ steps.pr.outputs.pr_metadata_shape }}',
  ]) assert.ok(block.includes(token), 'missing metadata-shape semantic guard: ' + token);
  assert.doesNotMatch(block, /core\.setOutput\('pr_body'/);
});

test('v1.7 legacy-baseline shape detection is exact and bounded', () => {
  const block = workflow.split('  classify:\n')[1].split('\n  delegate_pr_metadata:\n')[0];
  for (const token of [
    "v17Headings.length === 4",
    "v17Headings[3] === '## 7. Maschinenlesbare Baseline'",
    "occurrenceCount('{{PRODUCTION_BASELINE_BLOCK}}') === 1",
    "occurrenceCount('<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->') === 1",
    "occurrenceCount('<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->') === 1",
  ]) assert.ok(block.includes(token), 'missing exact v1.7 legacy-baseline shape guard: ' + token);
});

test('completed source binding accepts every valid run_attempt without polling', () => {
  const classify = workflow.split('  classify:\n')[1].split('\n  delegate_pr_metadata:\n')[0];
  for (const token of [
    'Abgeschlossenen Source-Run exakt binden',
    "context.payload.action !== 'completed'",
    "sourceRun.status !== 'completed'",
    'Number(sourceRun.run_attempt) < 1',
    "core.setOutput('conclusion'",
    "core.setOutput('run_attempt'",
  ]) assert.ok(classify.includes(token), 'missing completed source binding: ' + token);
  assert.doesNotMatch(classify, /getWorkflowRun|Date\.now\(\) \+ 240_000|setTimeout/);
});

test('failure logs are bounded, redacted and never uploaded as artifacts', () => {
  assert.ok(workflow.includes('tail -n 700 "$raw" > "$bounded"'));
  assert.ok(workflow.includes('head -c 120000 "$bounded"'));
  for (const marker of ['[REDACTED_GITHUB_TOKEN]','[REDACTED_API_TOKEN]','[REDACTED_STRIPE_TOKEN]','[REDACTED_SUPABASE_TOKEN]']) {
    assert.ok(workflow.includes(marker));
  }
  assert.doesNotMatch(workflow, /path: \$\{\{ runner\.temp \}\}\/pr-autofix-failed/);
});

test('existing baseline and PR metadata writers remain specialist-owned', () => {
  assert.ok(workflow.includes('Current-State Baseline Autofix owns CURRENT_STATE_PROJECTION_BASELINE_* repository writes.'));
  assert.ok(workflow.includes('PR Production Baseline Auto-Refresh owns deterministic PR-body/template/baseline writes.'));
  assert.doesNotMatch(workflow, /updatePrProductionBaseline\.mjs|repairLegacyPrBodyStructure\.mjs/);
});

test('metadata delegation creates no second writer and no rerun dispatch', () => {
  const block = workflow.split('  delegate_pr_metadata:\n')[1].split('\n\n  repair:\n')[0];
  assert.ok(block.includes("needs.classify.outputs.decision == 'DELEGATE_PR_PRODUCTION_BASELINE_REFRESH'"));
  assert.match(block, /permissions:\n      contents: read/);
  assert.ok(block.includes('independently subscribed PR Production Baseline Auto-Refresh workflow'));
  assert.doesNotMatch(block, /actions: write|pull-requests: write|contents: write/);
  assert.doesNotMatch(block, /POST \/repos\/\{owner\}\/\{repo\}\/actions\/runs\/\{run_id\}\/rerun|exactSpecialist/);
});

test('candidate checkout exists only in read-only repair job and never in write job', () => {
  const repair = workflow.split('  repair:\n')[1].split('\n  write:\n')[0];
  const write = workflow.split('  write:\n')[1];
  assert.match(repair, /permissions:\n      contents: read/);
  assert.ok(repair.includes('Kandidaten-Head ohne persistierte Credentials auschecken'));
  assert.ok(repair.includes('persist-credentials: false'));
  assert.doesNotMatch(repair, /contents: write|actions: write|pull-requests: write/);
  assert.match(write, /actions: write\n      contents: write\n      pull-requests: read/);
  assert.doesNotMatch(write, /actions\/checkout@/);
  assert.doesNotMatch(write, /node (?:work|candidate)\//);
});

test('write is exact-head/main, non-force and CI redispatch is after the branch write', () => {
  const write = workflow.split('  write:\n')[1];
  for (const token of [
    "pr.state !== 'open' || pr.base.ref !== 'main'",
    'normalizeSha(pr.head.sha) !== expectedHead',
    'normalizeSha(pr.base.sha) !== expectedBase',
    'normalizeSha(main.commit.sha) !== expectedBase',
    'force: false',
    "workflow_id: 'ci.yml'",
    'expected_head_sha: commit.sha',
    'expected_base_sha: expectedBase',
  ]) assert.ok(write.includes(token), 'missing write guard: ' + token);
  assert.ok(write.indexOf('updateRef') < write.indexOf('createWorkflowDispatch'));
});

test('all referenced marketplace actions are pinned to immutable commit SHAs', () => {
  const refs = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.match(ref, /@[0-9a-f]{40}$/i, 'un-pinned action: ' + ref);
});

test('repeat-autofix signature trailer remains a loop-prevention boundary', () => {
  for (const token of ['CAPITAL_AI_AUTOFIX_SIGNATURE:','previous_autofix_signature','PREVIOUS_AUTOFIX_SIGNATURE']) {
    assert.ok(workflow.includes(token));
  }
});


test('controller materializes one immutable PR convergence generation from trusted main', () => {
  const classify = workflow.split('  classify:\n')[1].split('\n  delegate_pr_metadata:\n')[0];
  for (const token of [
    'Kanonische PR-Generation aus Trusted Main materialisieren',
    'node scripts/pr/prConvergenceGeneration.mjs',
    'CURRENT_MAIN_SHA: ${{ steps.pr.outputs.current_main_sha }}',
    'generation_id: ${{ steps.generation.outputs.generation_id }}',
    'control_plane_version: ${{ steps.generation.outputs.control_plane_version }}',
    'writer_lease_key: ${{ steps.generation.outputs.writer_lease_key }}',
  ]) assert.ok(classify.includes(token), 'missing convergence generation binding: ' + token);
});

test('registered writer is serialized by the shared per-PR writer lease', () => {
  const write = workflow.split('  write:\n')[1];
  assert.ok(write.includes('group: ${{ needs.classify.outputs.writer_lease_key }}'));
  assert.ok(write.includes('cancel-in-progress: false'));
  assert.ok(workflow.includes('capital-ai-pr-writer-') === false, 'lease construction belongs to the trusted generation helper, not duplicated workflow literals');
});

test('write-time readback recomputes and verifies the exact generation before mutation', () => {
  const write = workflow.split('  write:\n')[1];
  for (const token of [
    'EXPECTED_GENERATION_ID: ${{ needs.classify.outputs.generation_id }}',
    'EXPECTED_CONTROL_PLANE_VERSION: ${{ needs.classify.outputs.control_plane_version }}',
    "path: 'AGENTS.md'",
    "ref: expectedBase",
    'schema=capital-ai-pr-convergence-generation/1.0.0',
    'PR generation drift before autofix write',
    'Control-plane drift before autofix write',
    'CAPITAL_AI_PR_GENERATION:',
  ]) assert.ok(write.includes(token), 'missing generation readback guard: ' + token);
  assert.ok(write.indexOf('PR generation drift before autofix write') < write.indexOf('createCommit'));
});
