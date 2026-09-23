import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const activeSelfHealingSurfaces = [
  'docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md',
  'docs/projects/operations/ROADMAP.md',
  'docs/projects/operations/WORK_PACKAGES.md',
  'docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md',
  'src/platform/Supervisor/README.md',
];

const archivedSh01 = 'docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md';
const archivedSupersession = 'docs/archive/governance/superseded/AUTONOMOUS_SELF_HEALING_RUNTIME_SUPERSESSION_2026-09-20.md';
const retiredActiveSupersession = 'docs/governance/control-plane/AUTONOMOUS_SELF_HEALING_RUNTIME_SUPERSESSION_2026-09-20.md';

describe('self-healing supersession surfaces', () => {
  it('keeps legacy SH-R execution rules out of active Self-Healing surfaces', () => {
    for (const path of activeSelfHealingSurfaces) {
      const content = readFileSync(path, 'utf8');
      expect(content, path).not.toMatch(/\bSH-R\d+\b/);
    }
  });

  it('archives predecessor rule projections and removes the narrow predecessor from the active control plane', () => {
    expect(existsSync(archivedSh01)).toBe(true);
    expect(existsSync(archivedSupersession)).toBe(true);
    expect(existsSync(retiredActiveSupersession)).toBe(false);
  });

  it('releases merged SH-02 claims and advances the canonical work graph', () => {
    const claim = JSON.parse(readFileSync('.ai/work-claims/OPS-08-B-SH-02-5-WORKER-JOB-RECOVERY-20260920.json', 'utf8'));
    const workPackage = readFileSync(
      'docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md',
      'utf8',
    );

    expect(claim.status).toBe('released');
    expect(claim.exclusive).toBe(false);
    expect(workPackage).toContain('SH-02.5 merge');
    const nextSlice = workPackage.match(/^\*\*Next functional slice:\*\*\s*`(SH-02\.\d+[A-Z]?)`/m)?.[1];
    expect(nextSlice, 'canonical work package must declare one next functional slice').toBeTruthy();

    const nextRow = workPackage
      .split(/\r?\n/)
      .find((line) => line.startsWith(`| ${nextSlice} |`));
    expect(nextRow, `missing work-graph row for ${nextSlice}`).toBeDefined();

    const nextState = String(nextRow)
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
      .at(-1);
    expect(nextState, `${nextSlice} must expose a work-graph state`).toBeTruthy();
    expect(nextState).not.toMatch(/^IMPLEMENTED_ON_MAIN(?:\s*\/|$)/);
    expect(workPackage).toContain('P0 priority invariant');
  });

  it('binds current Self-Healing semantics to the canonical contract version', () => {
    const architecture = readFileSync('docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md', 'utf8');
    const workPackage = readFileSync(
      'docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md',
      'utf8',
    );

    expect(architecture).toContain('self-healing-contract/1.2.0');
    expect(workPackage).toContain('self-healing-contract/1.2.0');
    expect(architecture).toContain('/AGENTS.md@CURRENT_MAIN');
  });
});
