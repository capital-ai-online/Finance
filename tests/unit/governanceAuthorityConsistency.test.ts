import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

interface GovernanceControl {
  controlId: string;
  status: string;
  authorityRefs: string[];
  requirement: string;
  evidence?: string[];
}

const controlCatalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
  controls: GovernanceControl[];
};

const control = (controlId: string): GovernanceControl => {
  const found = controlCatalog.controls.find((item) => item.controlId === controlId);
  expect(found, `missing governance control ${controlId}`).toBeDefined();
  return found as GovernanceControl;
};

describe('governance authority consistency', () => {
  it('uses the Accepted ADR-0069 2026-08-16 addendum as the current PR-gate authority', () => {
    const adr0069 = read('docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md');
    expect(adr0069).toContain('Status:** ACCEPTED');
    expect(adr0069).toContain('NACHTRAG 2026-08-16');
    expect(adr0069).toContain('Owner-Gate-Ritual retired');
  });

  it('does not present the retired Viewed/emoji ritual as a current Systemadmin merge prerequisite', () => {
    const agents = read('AGENTS.md');
    const m10 = control('CTRL-CI-M10-001');

    expect(agents).not.toContain(
      'Human/Owner current-head review, Viewed attestations, scope-appropriate CI and a separate explicit Human merge instruction remain mandatory.',
    );
    expect(m10.status).toBe('required');
    expect(m10.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(m10.requirement).toMatch(/M10 .*suspended\/off/i);
    expect(m10.requirement).toContain('Historical M10 evidence cannot reactivate the gate.');
  });

  it('labels the governance library as a historical snapshot with a current-authority annotation', () => {
    const library = read('docs/governance/CAPITAL_AI_GOVERNANCE_LIBRARY_REPORT_2026-08-15.md');
    expect(library).toContain('Snapshot date:** 2026-08-15');
    expect(library).toContain('Current-authority annotation:** 2026-08-19');
    expect(library).toContain('2026-08-16 retired');
  });

  it('keeps machine-readable main-protection policy explicit about current versus historical authority', () => {
    const policy = JSON.parse(read('.github/policies/main-production-protection.expected.json')) as {
      schema_version: string;
      authority?: {
        accepted_decision?: string;
        historical_decision_records_are_non_normative?: boolean;
      };
      promotion?: Record<string, string | null>;
    };

    expect(policy.schema_version).toBe('1.3');
    expect(policy.authority?.accepted_decision).toContain('ADR-0069');
    expect(policy.authority?.historical_decision_records_are_non_normative).toBe(true);
    expect(policy.promotion?.['decision_2026-08-16_owner_gate_retired']).toContain('retired');
  });

  it('does not assign provider-specific profiles repository authority in the active DevelopmentChain', () => {
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const trustRoot = control('CTRL-GOV-TRUST-001');

    expect(trustRoot.status).toBe('required');
    expect(trustRoot.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(trustRoot.evidence).toContain('AGENTS.md');
    expect(fs.existsSync(path.join(root, 'CLAUDE.md'))).toBe(false);
    expect(chain).not.toContain('Google AI Studio ist die Entwicklungsumgebung für Anwendungscode');
  });

  it('requires diff and impact analysis before semantic supersession becomes effective', () => {
    const authorityPolicy = read('docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md');
    const supersession = control('CTRL-GOV-AUTH-002');
    const impactPath =
      'docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md';
    const impact = read(impactPath);

    expect(authorityPolicy).toContain('AUTH-GOV-SUPERSESSION-POLICY');
    expect(supersession.status).toBe('required');
    expect(supersession.authorityRefs).toContain('AUTH-GOV-SUPERSESSION-POLICY');
    expect(supersession.evidence).toContain(impactPath);
    expect(impact).toContain('DOC-GOV-CONTROL-PLANE-IMPACT-2026-08-19');
    expect(impact).toContain('AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19');
  });
});