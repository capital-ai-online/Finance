import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.join(process.cwd(), '.github/workflows/ci.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('CI credential isolation after checkout', () => {
  it('uses immutable event SHAs for PR preflight without a network fetch after persist-credentials false', () => {
    const yaml = workflow();
    expect(yaml).toContain('persist-credentials: false');
    expect(yaml).toContain('PR_BASE_REF: ${{ github.event.pull_request.base.sha }}');
    expect(yaml).toContain('PR_HEAD_REF: ${{ github.event.pull_request.head.sha }}');
    expect(yaml).not.toContain('git fetch --no-tags origin main:refs/remotes/origin/main');
    expect(yaml).toContain("git rev-parse --verify \"${PR_BASE_REF}^{commit}\" >/dev/null");
    expect(yaml).toContain("git rev-parse --verify \"${PR_HEAD_REF}^{commit}\" >/dev/null");
  });
});
