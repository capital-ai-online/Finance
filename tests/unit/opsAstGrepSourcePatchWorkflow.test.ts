import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/ops-ast-grep-source-patch.yml'),
  'utf8',
);

describe('OPS ast-grep BB-2E workflow', () => {
  it('is a manual, main-bound and explicitly confirmed execution path', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('expected_head_sha:');
    expect(workflow).toContain('confirm_apply:');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('inputs.confirm_apply == true');
  });

  it('uses the accepted Node 24.18.0 baseline and immutable action pins', () => {
    expect(workflow).toContain(
      'actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8',
    );
    expect(workflow).toContain(
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
    );
    expect(workflow).toContain(
      'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    );
    expect(workflow).toContain(
      'actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
    );
    expect(workflow).toContain("node-version: '24.18.0'");
    expect(workflow).not.toMatch(/uses:\s+[^\n]+@(v\d+|main|master)\b/);
  });

  it('configures the requested local Git identity before merge operations in both jobs', () => {
    expect(workflow.split("git -C work config user.name 'SvenKulessa'")).toHaveLength(3);
    expect(
      workflow.split("git -C work config user.email 'sven.kulessa@gmx.net'"),
    ).toHaveLength(3);
    expect(workflow).not.toContain('github-actions[bot]');
  });

  it('hard-binds the current FE target branch, head, plan, runner and productive target file', () => {
    expect(workflow).toContain(
      'TARGET_BRANCH: agent/frontend-bb-2e-dashboard-drawer-20260910',
    );
    expect(workflow).toContain(
      'ref: agent/frontend-bb-2e-dashboard-drawer-20260910',
    );
    expect(workflow).toContain(
      "default: 'ae85bfbcbf6cee7c4eaeb8b09e7da8106954914b'",
    );
    expect(workflow).not.toContain('agent/frontend-bb2e-drawer-rematerialize-20260910');
    expect(workflow).not.toContain('88dcaa1c671d16caa8dd60d0dd9b4b43c5cb5020');
    expect(workflow).not.toContain('agent/frontend-bb2e-dashboard-drawer-20260910');
    expect(workflow).not.toContain('ab337d52193a8d89f440bfa98265d7f77ff27477');
    expect(workflow).not.toContain('agent/frontend-dashboard-drawer-strangler-20260907');
    expect(workflow).toContain('TARGET_FILE: src/components/Dashboard.tsx');
    expect(workflow).toContain(
      'PLAN_PATH: scripts/frontend/codemods/bb2e-dashboard-drawer-strangler.json',
    );
    expect(workflow).toContain(
      'RUNNER_PATH: scripts/operations/sourcePatch/astGrepSourcePatch.ts',
    );
    expect(workflow).toContain('EXPECTED_HEAD_SHA: ${{ inputs.expected_head_sha }}');
    expect(workflow).toContain('[[ ! "$EXPECTED_HEAD_SHA" =~ ^[0-9a-f]{40}$ ]]');
  });

  it('keeps target code read-only until validation has passed', () => {
    expect(workflow).toContain('patch-and-validate:');
    expect(workflow).toContain('permissions:\n      contents: read');
    expect(workflow).toContain('apply-and-push:');
    expect(workflow).toContain('needs: patch-and-validate');
    expect(workflow).toContain("needs.patch-and-validate.result == 'success'");
    expect(workflow).toContain('permissions:\n      contents: write');
    expect(workflow).not.toContain('persist-credentials: true');
  });

  it('correlates main through a local trusted checkout instead of tokenized shell fetches', () => {
    expect(workflow).toContain('ref: main');
    expect(workflow).toContain('path: policy');
    expect(workflow).toContain('git -C work fetch --no-tags ../policy HEAD:refs/remotes/origin/main');
    expect(workflow).not.toContain('git fetch --no-tags origin main:refs/remotes/origin/main');
    expect(workflow).not.toContain('git -C work fetch --no-tags origin main:refs/remotes/origin/main');
  });

  it('executes the trusted runner as a 10-to-0 ast-grep cutover', () => {
    expect(workflow).toContain('cmp "policy/$RUNNER_PATH" "work/$RUNNER_PATH"');
    expect(workflow).toContain('--plan "$PLAN_PATH"');
    expect(workflow).toContain('--allow-download');
    expect(workflow).toContain('--apply');
    expect(workflow).toContain('ast-grep Dry-Run — exakt 10 Matches');
    expect(workflow).toContain('ast-grep Apply — exakt 10 auf 0');
  });

  it('fails closed on legacy drawer residue or an expanded patch surface', () => {
    expect(workflow).toContain('git -C work diff --name-only');
    expect(workflow).toContain("${CHANGED[0]}\" != \"$TARGET_FILE");
    expect(workflow).toContain(
      "menuOpen|setMenuOpen|DashboardExpandedSection|getDashboardSection\\(activeView\\)|Slide-out Retractable Hamburger Drawer Navigation",
    );
    expect(workflow).toContain("import { DashboardNavigation } from '../app/dashboard/DashboardNavigation';");
  });

  it('runs the focused BB-2E exit gates before any write-capable job can push', () => {
    expect(workflow).toContain('tests/unit/dashboardDrawerStranglerCodemod.test.ts');
    expect(workflow).toContain('tests/unit/dashboardNavigation.test.ts');
    expect(workflow).toContain('tests/unit/dashboardNavigationDrawer.test.ts');
    expect(workflow).toContain('run: npm run lint');
    expect(workflow).toContain('run: npm run frontend:architecture:check');
    expect(workflow).toContain('run: npm run build');
    expect(workflow).toContain('run: git -C work diff --check');
  });

  it('binds the privileged push to the exact remote head and validated blob', () => {
    expect(workflow).toContain('EXPECTED_PATCHED_BLOB: ${{ needs.patch-and-validate.outputs.patched_blob }}');
    expect(workflow).toContain('OBSERVED_PATCHED_BLOB="$(git -C work hash-object "$TARGET_FILE")"');
    expect(workflow).toContain('REMOTE_HEAD="$(git -C work -c http.https://github.com/.extraheader=');
    expect(workflow).toContain('if [[ "$REMOTE_HEAD" != "$EXPECTED_HEAD_SHA" ]]');
    expect(workflow).toContain('push origin "HEAD:refs/heads/$TARGET_BRANCH"');
    expect(workflow).toContain('GITHUB_TOKEN: ${{ github.token }}');
  });
});
