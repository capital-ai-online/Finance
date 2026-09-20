import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateProjectValueChain } from '../governance/validateProjectValueChain.mjs';

const pvc = (index) => `PVC-${String(index).padStart(2, '0')}`;

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function canonicalRows() {
  return Array.from({ length: 18 }, (_, offset) => {
    const index = offset + 1;
    const owner = index <= 11 ? 'CAPITAL-AI-A' : 'CAPITAL-AI-B';
    return `| \`${pvc(index)}\` | Stage ${index} | \`${owner}\` |`;
  }).join('\n');
}

function buildFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-pvc-'));
  write(root, 'docs/projects/PROJECT_VALUE_CHAIN.md', `# PVC\n\n## Canonical Project Value Chain\n\n| PVC | Stage | Primary Project Owner |\n|---|---|---|\n${canonicalRows()}\n\n## Boundary invariants\n\n1. Every stage has one owner.\n\n## Transitional repository state\n\nNo transition is required for this fixture.\n`);
  write(root, 'docs/projects/README.md', `# Projects\n\n## Primary project ownership\n\n| Project | Primary PVC stages | Role |\n|---|---|---|\n| \`CAPITAL-AI-A\` | \`PVC-01\`..\`PVC-11\` | Primary |\n| \`CAPITAL-AI-B\` | \`PVC-12\`..\`PVC-18\` | Primary |\n\n## Canonical project-folder routing\n\n| Project | PVC relationship | Canonical project folder | Branch project-folder slug | Materialization owner | Main surface state |\n|---|---|---|---|---|---|\n| \`CAPITAL-AI-A\` | \`PVC-01..11\` Primary Owner | \`docs/projects/a/\` | \`a\` | \`CAPITAL-AI-A\` | present |\n| \`CAPITAL-AI-B\` | \`PVC-12..18\` Primary Owner | \`docs/projects/b/\` | \`b\` | \`CAPITAL-AI-B\` | present via PR #1 |\n| \`CAPITAL-AI-C\` | cross-cutting; no productive PVC | \`docs/projects/c/\` | \`c\` | \`CAPITAL-AI-C\` | present |\n`);
  write(root, 'docs/projects/a/README.md', `# A\n\n**Project ID:** \`CAPITAL-AI-A\`  \n**Primary Project Value Chain ownership:** \`PVC-01\` through \`PVC-11\`\n`);
  write(root, 'docs/projects/b/README.md', `# B\n\n**Project:** \`CAPITAL-AI-B\`  \n**Primary Project Value Chain ownership:** \`PVC-12\` through \`PVC-18\`\n`);
  write(root, 'docs/projects/c/README.md', `# C\n\n**Project ID:** \`CAPITAL-AI-C\`  \n**Primary Productive PVC ownership:** \`[]\`\n`);
  return root;
}

function withFixture(run) {
  const root = buildFixture();
  try {
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('accepts an internally consistent PVC and project-folder model', () => {
  withFixture((root) => {
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.deepEqual(result.summary, {
      pvcStages: 18,
      primaryProjects: 2,
      projectFolders: 3,
      crossCuttingProjects: 1,
    });
  });
});

test('fails closed when the ownership projection disagrees with the canonical chain', () => {
  withFixture((root) => {
    const readmePath = path.join(root, 'docs/projects/README.md');
    const readme = fs.readFileSync(readmePath, 'utf8').replace('`PVC-01`..`PVC-11`', '`PVC-01`..`PVC-12`');
    fs.writeFileSync(readmePath, readme, 'utf8');
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /duplicate owners|disagrees with/);
  });
});

test('rejects PVC-19 ownership and productive ownership by a cross-cutting project', () => {
  withFixture((root) => {
    const readmePath = path.join(root, 'docs/projects/c/README.md');
    fs.writeFileSync(readmePath, `# C\n\n**Project ID:** \`CAPITAL-AI-C\`  \n**Primary Productive PVC ownership:** \`PVC-19\`\n`, 'utf8');
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /PVC-19/);
    assert.match(result.errors.join('\n'), /cross-cutting project must not declare productive PVC ownership/);
  });
});

test('rejects stale migration-gap state after a project README is materialized', () => {
  withFixture((root) => {
    const readmePath = path.join(root, 'docs/projects/README.md');
    const readme = fs.readFileSync(readmePath, 'utf8').replace('| `CAPITAL-AI-C` | cross-cutting; no productive PVC | `docs/projects/c/` | `c` | `CAPITAL-AI-C` | present |', '| `CAPITAL-AI-C` | cross-cutting; no productive PVC | `docs/projects/c/` | `c` | `CAPITAL-AI-C` | owner migration gap |');
    fs.writeFileSync(readmePath, readme, 'utf8');
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /exists but routing state is stale\/non-present/);
  });
});

test('allows a pre-resolved owner migration gap while the target project README is absent', () => {
  withFixture((root) => {
    fs.rmSync(path.join(root, 'docs/projects/c'), { recursive: true, force: true });
    const readmePath = path.join(root, 'docs/projects/README.md');
    const readme = fs.readFileSync(readmePath, 'utf8').replace('| `CAPITAL-AI-C` | cross-cutting; no productive PVC | `docs/projects/c/` | `c` | `CAPITAL-AI-C` | present |', '| `CAPITAL-AI-C` | cross-cutting; no productive PVC | `docs/projects/c/` | `c` | `CAPITAL-AI-C` | owner migration gap |');
    fs.writeFileSync(readmePath, readme, 'utf8');
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.summary.crossCuttingProjects, 1);
  });
});

test('rejects present routing state when the project README is missing', () => {
  withFixture((root) => {
    fs.rmSync(path.join(root, 'docs/projects/c'), { recursive: true, force: true });
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /routing says "present" but docs\/projects\/c\/README\.md is missing/);
  });
});

test('rejects a project folder with README that is absent from canonical routing', () => {
  withFixture((root) => {
    write(root, 'docs/projects/unrouted/README.md', '# Unrouted\n');
    const result = validateProjectValueChain({ root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /missing from canonical routing table/);
  });
});
