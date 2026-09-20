import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');

function read(relative: string): string {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

describe('Documentary WP-06D draft PR handoff', () => {
  it('hands only a validated autosync branch to the canonical reusable draft PR workflow', () => {
    const yaml = read('.github/workflows/documentary-change-impact.yml');

    expect(yaml).toContain('outputs:\n      branch: ${{ steps.write.outputs.branch }}');
    expect(yaml).toContain('draft-pr-handoff:');
    expect(yaml).toContain('needs: autosync-branch');
    expect(yaml).toContain("if: needs.autosync-branch.outputs.branch != ''");
    expect(yaml).toContain('uses: ./.github/workflows/open-agent-draft-pr.yml');
    expect(yaml).toContain('head_branch: ${{ needs.autosync-branch.outputs.branch }}');
    expect(yaml).toContain('trusted_handoff: documentary-autosync');
    expect(yaml).not.toContain('gh pr create');
  });

  it('binds review-only and semantic candidates into the generated work claim', () => {
    const yaml = read('.github/workflows/documentary-change-impact.yml');

    expect(yaml).toContain('reviewRequiredPaths: Array.isArray(impact.reviewOnlyDocumentationPaths)');
    expect(yaml).toContain('semanticPatchCandidates: Array.isArray(impact.patchableDocumentationPaths)');
    expect(yaml).toContain("projectId: 'CAPITAL-AI-DOC'");
    expect(yaml).toContain("projectStage: 'PVC-03'");
  });

  it('renders Documentary handoff evidence into the PR body when claim metadata exists', () => {
    const renderer = read('scripts/pr/renderPullRequestBody.mjs');

    expect(renderer).toContain('## Documentary Handoff Evidence');
    expect(renderer).toContain('claim.reviewRequiredPaths');
    expect(renderer).toContain('claim.semanticPatchCandidates');
    expect(renderer).toContain('Protected/review-only paths are evidence only');
  });
});
