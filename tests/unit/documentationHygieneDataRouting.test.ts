import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectDataOwnershipRoutingFindings,
  DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
} from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';

function write(root: string, relative: string, value: string): void {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

describe('DocumentationHygieneValidator DATA ownership routing guard', () => {
  it('allows historical supersession wording and archive provenance', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-hygiene-data-pass-'));

    write(
      root,
      'docs/projects/PROJECT_VALUE_CHAIN.md',
      '`CAPITAL-AI-DATA` is superseded. Historical references to former `PVC-09..11` ownership remain evidence only; current routing is `CAPITAL-AI-FINTECH`.',
    );
    write(
      root,
      'docs/projects/README.md',
      '`CAPITAL-AI-DATA` is superseded and no longer a canonical project-folder route. Current work resolves to `CAPITAL-AI-FINTECH / PVC-09..17`.',
    );
    write(
      root,
      'docs/archive/shared/capital-ai-data/HANDOFFS.md',
      '- target_project: `CAPITAL-AI-DATA`\n- roadmap_reference: docs/projects/data/ROADMAP.md\n',
    );

    expect(collectDataOwnershipRoutingFindings(root)).toEqual([]);
    expect(DOCUMENTATION_HYGIENE_VALIDATOR_VERSION).toBe('documentation-hygiene-validator/1.3.0');
  });

  it('fails closed on active current DATA routing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-hygiene-data-fail-'));

    write(
      root,
      'docs/projects/operations/CROSS_PROJECT_DEPENDENCIES.md',
      [
        '### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]',
        '- target_project: `CAPITAL-AI-DATA`',
        '- roadmap_reference: docs/projects/data/ROADMAP.md',
      ].join('\n'),
    );
    write(
      root,
      'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md',
      '| `CAPITAL-AI-DATA` | `PVC-09..PVC-11` | [roadmap](../projects/data/ROADMAP.md) |',
    );

    const findings = collectDataOwnershipRoutingFindings(root);
    const codes = findings.map((finding) => finding.code);

    expect(codes).toContain('SUPERSEDED_DATA_HANDOFF_TARGET');
    expect(codes).toContain('SUPERSEDED_DATA_ROUTE_FIELD');
    expect(codes).toContain('SUPERSEDED_DATA_PROJECT_PATH');
    expect(codes).toContain('SUPERSEDED_DATA_PROJECT_ROUTE');
  });

  it('blocks PVC-09..11 ownership assigned back to DATA in a current projection', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-hygiene-data-owner-'));

    write(
      root,
      'docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md',
      '| PVC-10 Evidence Management | CAPITAL-AI-DATA | evidence integrity |',
    );

    const findings = collectDataOwnershipRoutingFindings(root);
    expect(findings.map((finding) => finding.code)).toContain('SUPERSEDED_DATA_PVC_OWNER');
  });
});
