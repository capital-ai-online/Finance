#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

export const SIGNATURE = 'SELF_HEALING_NEXT_SLICE_INVARIANT_V1';
export const TARGET_PATH = 'tests/unit/selfHealingSupersession.test.ts';

const BRITTLE_ASSERTION =
  /^    expect\(workPackage\)\.toContain\('\*\*Next functional slice:\*\* \`SH-02\.\d+[A-Z]?\`'\);\s*$/m;

const INVARIANT_BLOCK = [
  '    const nextSlices = [',
  '      ...workPackage.matchAll(/^\\*\\*Next functional slice:\\*\\*\\s*`(SH-02\\.\\d+[A-Z]?)`/gm),',
  '    ];',
  "    expect(nextSlices, 'canonical work package must declare exactly one next functional slice').toHaveLength(1);",
  '',
  '    const nextSlice = nextSlices[0][1];',
  '    const nextRow = workPackage',
  "      .split(/\\r?\\n/)",
  '      .find((line) => line.startsWith(`| ${nextSlice} |`));',
  '    expect(nextRow, `missing work-graph row for ${nextSlice}`).toBeDefined();',
  '',
  '    const nextState = String(nextRow)',
  "      .split('|')",
  '      .map((cell) => cell.trim())',
  '      .filter(Boolean)',
  '      .at(-1);',
  '    expect(nextState, `${nextSlice} must expose a work-graph state`).toBeTruthy();',
  '    expect(nextState).not.toMatch(/^IMPLEMENTED_ON_MAIN(?:\\s*\\/|$)/);',
].join('\\n');

export async function repairPrAutofix({ worktree, signature }) {
  if (signature !== SIGNATURE) {
    throw new Error(`Unsupported self-healing next-slice repair signature: ${signature}`);
  }

  const file = path.join(worktree, TARGET_PATH);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`Expected regular target file is missing: ${TARGET_PATH}`);
  }

  const before = fs.readFileSync(file, 'utf8');
  if (!BRITTLE_ASSERTION.test(before)) {
    throw new Error('Expected brittle Self-Healing next-slice assertion was not found; refusing semantic guess.');
  }
  if (before.includes('canonical work package must declare exactly one next functional slice')) {
    throw new Error('Invariant-based next-slice assertion is already present; refusing duplicate repair.');
  }

  const after = before.replace(BRITTLE_ASSERTION, INVARIANT_BLOCK);
  if (after === before) throw new Error('Self-Healing next-slice invariant repair produced no change.');
  fs.writeFileSync(file, after, 'utf8');
}
