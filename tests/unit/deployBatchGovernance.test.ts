import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

describe('application-wide deployment batching governance', () => {
  const agents = read('AGENTS.md');
  const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
    controls: Array<{ controlId: string; requirement: string }>;
  };

  it('separates post-merge correlation from Render deployment mutation', () => {
    expect(agents).toContain('Post-merge production correlation and deployment batching');
    expect(agents).toContain('MUST NOT by itself require or trigger a Render production deployment');
    expect(agents).toContain('Render native Auto Deploy remains off');
    expect(agents).not.toContain('deploy-production path for that exact SHA MUST be observed as triggered no later than five minutes');
  });

  it('classifies healthy ancestor lag as queued instead of production drift', () => {
    expect(agents).toContain('DEPLOYMENT_QUEUED');
    expect(agents).toContain('an ancestor of `CURRENT_MAIN`');
    expect(agents).toContain('Expected ancestor lag MUST NOT create or maintain a production-drift issue');
    expect(agents).toContain('actual `PRODUCTION_DRIFT` remains fail-closed');
  });

  it('defines a truthful observed merge-progress and next-version projection', () => {
    expect(agents).toContain('observed_required_merges = merged_since_production + open_main_pull_requests');
    expect(agents).toContain('observed_merge_progress = merged_since_production / observed_required_merges');
    expect(agents).toContain('package.json#version@CURRENT_MAIN');
    expect(agents).toContain('it is not a fixed global merge threshold');
  });

  it('keeps one deployment authority control and routes productive implementation to OPS', () => {
    const deployControls = catalog.controls.filter((item) => item.controlId === 'CTRL-DEPLOY-AUTH-001');
    expect(deployControls).toHaveLength(1);
    expect(deployControls[0].requirement).toContain('DEPLOYMENT_QUEUED');
    expect(deployControls[0].requirement).toContain('separate exact-SHA verified deployment-batch action');

    const roadmap = read('docs/projects/governance/ROADMAP.md');
    expect(roadmap).toContain('GOV-DEPLOY-BATCH-01');
    expect(roadmap).toContain('CAPITAL-AI-OPS / PVC-06, PVC-07, PVC-08');
    expect(roadmap).toContain('no CI, Render, runtime or provider mutation');
  });
});
