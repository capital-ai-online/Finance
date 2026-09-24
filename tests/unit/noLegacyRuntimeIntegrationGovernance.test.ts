import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

describe('current implementation integrity', () => {
  const agents = read('AGENTS.md');
  const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
    controls: Array<{ controlId: string; requirement: string; status: string }>;
  };

  it('forbids legacy and compatibility implementations from productive current paths', () => {
    expect(agents).toContain('Current implementation integrity — no legacy runtime/UI integration');
    expect(agents).toContain('MUST NOT integrate, mount, render, import, execute, route through, or depend on');
    expect(agents).toContain('legacy');
    expect(agents).toContain('compatibility');
    expect(agents).toContain('current website, API, runtime, worker, workflow or user/admin interface');
  });

  it('requires migration or reimplementation instead of legacy wrapping', () => {
    expect(agents).toContain('implement or migrate that capability through the current canonical architecture');
    expect(agents).toContain('instead of wrapping, renaming, proxying or re-exposing the legacy implementation');
    expect(agents).toContain('owner-correct removal is preferred over indefinite compatibility retention');
  });

  it('keeps historical evidence isolated and archive provenance verifiable', () => {
    expect(agents).toContain('Historical source, rules, ADRs, reports and implementation evidence MAY remain only when needed for provenance, audit or rollback evidence');
    expect(agents).toContain('archive integrity must be verifiable from repository provenance');
    expect(agents).toContain('fail closed on unexplained content or provenance mismatch');
  });

  it('projects exactly one stable control for the invariant', () => {
    const controls = catalog.controls.filter((item) => item.controlId === 'CTRL-ARCH-NO-LEGACY-RUNTIME-001');
    expect(controls).toHaveLength(1);
    expect(controls[0].status).toBe('required');
    expect(controls[0].requirement).toContain('Active website, API, runtime, worker, workflow and user/admin UI paths');
    expect(controls[0].requirement).toContain('must not consume');
  });
});
