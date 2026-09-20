import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  SIGNATURE,
  TARGET_PATH,
  repairPrAutofix,
} from './selfHealingNextSliceInvariantV1.mjs';

async function fixture(line = "    expect(workPackage).toContain('**Next functional slice:** \`SH-02.6\`');") {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'capital-ai-next-slice-'));
  const target = path.join(root, TARGET_PATH);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, [
    "it('releases merged SH-02 claims and advances the canonical work graph', () => {",
    "    const workPackage = readFileSync('work-package.md', 'utf8');",
    line,
    '});',
    '',
  ].join('\n'));
  return { root, target };
}

test('replaces a concrete next-slice literal with a work-graph invariant', async () => {
  const { root, target } = await fixture();
  await repairPrAutofix({ worktree: root, signature: SIGNATURE });
  const content = await fs.readFile(target, 'utf8');
  assert.match(content, /declare exactly one next functional slice/);
  assert.match(content, /missing work-graph row/);
  assert.match(content, /not\.toMatch\(\/\^IMPLEMENTED_ON_MAIN/);
  assert.doesNotMatch(content, /toContain\('\*\*Next functional slice:/);
});

test('works for another concrete SH-02 slice without encoding the replacement slice', async () => {
  const { root, target } = await fixture(
    "    expect(workPackage).toContain('**Next functional slice:** \`SH-02.9\`');",
  );
  await repairPrAutofix({ worktree: root, signature: SIGNATURE });
  const content = await fs.readFile(target, 'utf8');
  assert.doesNotMatch(content, /SH-02\.9/);
  assert.ok(content.includes('SH-02\\\\.\\\\d+[A-Z]?'));
});

test('fails closed when the expected brittle assertion or signature is absent', async () => {
  const { root } = await fixture('    expect(workPackage).toContain(\'P0 priority invariant\');');
  await assert.rejects(
    () => repairPrAutofix({ worktree: root, signature: SIGNATURE }),
    /brittle Self-Healing next-slice assertion was not found/,
  );

  const other = await fixture();
  await assert.rejects(
    () => repairPrAutofix({ worktree: other.root, signature: 'OTHER' }),
    /Unsupported self-healing next-slice repair signature/,
  );
});
