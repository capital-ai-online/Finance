import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ciWorkflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
const prGuardWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/m10-pr-authorization-guard.yml'),
  'utf8',
);

describe('M10 CI check orchestration', () => {
  it('reserves build-and-test for main push and authoritative workflow_dispatch only', () => {
    expect(ciWorkflow).toContain('workflow_dispatch:');
    expect(ciWorkflow).toContain('push:');
    expect(ciWorkflow).not.toMatch(/^\s{2}pull_request:/m);
    expect(ciWorkflow.match(/name: build-and-test/g)).toHaveLength(1);
    expect(ciWorkflow).toContain("test \"$M10_ACTION\" = 'AUTHORIZE_PR_CI'");
    expect(ciWorkflow).toContain('/api/m10/credential-enrollment/authorize/workflow-gate');
    expect(ciWorkflow).not.toContain('M10_BOOTSTRAP_PR');
    expect(ciWorkflow).not.toContain("M10 Controlled-Cutover bootstrap: PR #429");
  });

  it('handles ordinary PR lifecycle events in a separate cheap non-authoritative boundary', () => {
    expect(prGuardWorkflow).toMatch(/^\s{2}pull_request:/m);
    expect(prGuardWorkflow).toContain('types: [opened, synchronize, reopened, ready_for_review]');
    expect(prGuardWorkflow).toContain('name: m10-pr-event-boundary');
    expect(prGuardWorkflow).toContain('M10 BOUNDARY PASS');
    expect(prGuardWorkflow).toContain('bewertet keinen Passkey-Autorisierungszustand');
    expect(prGuardWorkflow).not.toContain('M10 DENY');
    expect(prGuardWorkflow).not.toContain('exit 1');
    expect(prGuardWorkflow).not.toContain('actions/checkout');
    expect(prGuardWorkflow).not.toContain('actions/setup-node');
    expect(prGuardWorkflow).not.toContain('npm ');
    expect(prGuardWorkflow).not.toContain('id-token: write');
    expect(prGuardWorkflow).not.toContain('M10_CONSUMPTION_ID');
  });
});
