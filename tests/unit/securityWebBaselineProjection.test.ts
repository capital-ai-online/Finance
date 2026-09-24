import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(path, 'utf8');

describe('SEC-WEB-00 current attack-surface baseline', () => {
  const roadmap = read('docs/architecture/ROADMAP.md');
  const evidence = read(
    'docs/projects/security/evidence/SEC_WEB_00_CURRENT_ATTACK_SURFACE_BASELINE_2026-09-24.md',
  );
  const containerWorkflow = read('.github/workflows/container-security.yml');
  const ciWorkflow = read('.github/workflows/ci.yml');

  it('binds the Security baseline to exact CURRENT_MAIN and advances only through F01/F16', () => {
    expect(evidence).toContain('main@67f9be45e41d78ca5d5c58f9be860d1887e4afad');
    expect(evidence).toContain('F01 | **VERIFIED_CURRENT_MAIN**');
    expect(evidence).toContain('F16 | **VERIFIED_CURRENT_MAIN**');
    expect(evidence).toContain('F15 | **CONFIRMED_OPEN / P0**');
    expect(roadmap).toContain('SEC-WEB-00` | P0 | `BASELINE_COMPLETE / EVIDENCE_READY');
    expect(roadmap).toContain('F01+F16 VERIFIED / F15 OWNER_RETURN_OPEN');
  });

  it('binds the canonical registry digest and exact publisher evidence', () => {
    expect(evidence).toContain(
      'ghcr.io/capital-ai-online/finance@sha256:a793cf5d0259d7a529213cf437a77a8f92940a45bcb85463b77223722be18306',
    );
    expect(evidence).toContain('Container Security run `35957793419`: PASS');
    expect(evidence).toContain('immutable GHCR evidence artifact ID: `10790897202`');
    expect(containerWorkflow).toContain('ghcr-registry-readback-digest.txt');
    expect(containerWorkflow).toContain('renderDigestImageReference.mjs');
    expect(containerWorkflow).not.toContain('RENDER_DEPLOY_HOOK_URL');
  });

  it('fails closed on the remaining F15 split between verified GHCR and Render source deployment', () => {
    expect(ciWorkflow).toContain('RENDER_DEPLOY_HOOK_URL');
    expect(ciWorkflow).toContain('ref=main');
    expect(ciWorkflow).not.toContain('ghcr-image-digest.txt');
    expect(evidence).toContain('OPS-07-A Release Evidence Contract');
    expect(evidence).toContain('OPS-08-A Production Handoff & Recovery');
  });

  it('does not promote later P0 steps while F15 is open', () => {
    expect(roadmap).toContain('F15 OPEN (OPS-07-A + OPS-08-A) → F23 → F10');
    expect(evidence).toContain('F23 — held behind F15');
    expect(evidence).toContain('F10 — held behind F23');
  });
});
