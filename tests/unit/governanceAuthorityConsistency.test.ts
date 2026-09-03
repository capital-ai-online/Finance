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

  it('treats productive M10 as retired and excludes it from current implementation discovery', () => {
    const agents = read('AGENTS.md');
    const roadmap = read('docs/architecture/ROADMAP.md');
    const m10 = control('CTRL-CI-M10-001');

    expect(m10.status).toBe('required');
    expect(m10.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(m10.requirement).toMatch(/M10 .*retired/i);
    expect(m10.requirement).toContain('PR #691');
    expect(m10.requirement).toMatch(/MUST NOT search/i);
    expect(m10.requirement).toMatch(/absence of a productive M10 implementation as a gap/i);
    expect(agents).toContain('RETIRED / OFF');
    expect(agents).toContain('MUST NOT search');
    expect(agents).not.toContain('M10 MUST NOT be reactivated until');
    expect(roadmap).toContain('M10 PR-CI passkey runtime is `RETIRED / OFF`');
    expect(roadmap).toContain('No productive M10 implementation is expected in current state');
    expect(roadmap).not.toContain('Mandatory blockers before M10 reactivation');
  });

  it('labels the governance library as a historical snapshot with a current-authority annotation', () => {
    const library = read('docs/governance/CAPITAL_AI_GOVERNANCE_LIBRARY_REPORT_2026-08-15.md');
    expect(library).toContain('Snapshot date:** 2026-08-15');
    expect(library).toContain('Current-authority annotation:** 2026-08-19');
    expect(library).toContain('2026-08-16 retired');
  });

  it('keeps ruleset authority at the live provider and retires repository-owned desired policy', () => {
    const expectedPolicyPath = path.join(root, '.github/policies/main-production-protection.expected.json');
    const sync = read('scripts/security/rulesetSync.mjs');
    const workflow = read('.github/workflows/ruleset-sync.yml');

    expect(fs.existsSync(expectedPolicyPath)).toBe(false);
    expect(sync).toContain("const RULESET_NAME = 'main-production-protection';");
    expect(sync).toContain("authority: 'live-provider-state'");
    expect(sync).toContain('Provider authority: current live GitHub configuration');
    expect(sync).not.toContain('EXPECTED_PATH');
    expect(sync).not.toContain('apply-package-a');
    expect(workflow).toContain('Ruleset Readback (main-production-protection)');
    expect(workflow).not.toContain('package_a');
    expect(workflow).not.toContain('full');
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

  it('bounds every chat-governed post-PR handoff to the next two actionable steps', () => {
    const agents = read('AGENTS.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');

    expect(handoff.status).toBe('required');
    expect(handoff.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(handoff.authorityRefs).toContain('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION');
    expect(handoff.requirement).toMatch(/at most the two highest-priority/i);
    expect(handoff.requirement).toMatch(/exit gate/i);
    expect(agents).toContain('CTRL-SDLC-CHAT-HANDOFF-001');
    expect(agents).toContain('only the two highest-priority immediately actionable steps');
    expect(chain).toContain('CTRL-SDLC-CHAT-HANDOFF-001');
    expect(chain).toContain('current `main`, open Pull Requests, changed-file/semantic overlap');
  });

  it('withdraws post-PVC routing contracts and keeps only folder-to-PVC mapping', () => {
    const agents = read('AGENTS.md');
    const projectMap = read('docs/projects/README.md');
    const pvc = read('docs/projects/PROJECT_VALUE_CHAIN.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');
    const sameIdControls = controlCatalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-CHAT-HANDOFF-001');

    expect(sameIdControls).toHaveLength(1);
    expect(handoff.requirement).toContain('POST_PR_HANDOFF');
    expect(handoff.requirement).not.toContain('FOREIGN_PROJECT_HANDOFF');
    expect(handoff.evidence).toContain('docs/projects/README.md');
    expect(handoff.evidence).toContain('docs/projects/PROJECT_VALUE_CHAIN.md');
    expect(handoff.evidence).not.toContain('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');

    expect(agents).toContain('POST_PR_HANDOFF');
    expect(agents).not.toContain('Trigger 2 — `FOREIGN_PROJECT_HANDOFF`');
    expect(agents).not.toContain('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');
    expect(agents).toContain('docs/projects/PROJECT_VALUE_CHAIN.md');

    expect(fs.existsSync(path.join(root, 'docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs/projects/PROJECT_EXECUTION_MODEL.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs/projects/ROADMAP_REGISTRY.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs/governance/OWNER_DEVICE_AUTHORIZATION_CUTOVER_AUTHORITY.md'))).toBe(false);

    expect(projectMap).toContain('Canonical project-folder routing');
    expect(projectMap).toContain('PVC-01');
    expect(projectMap).not.toContain('CROSS_PROJECT_HANDOFF_CONTRACT.md');
    expect(pvc).toContain('PVC-01');
    expect(pvc).toContain('Primary Project Owner');
  });

  it('requires diff and impact analysis before semantic supersession becomes effective', () => {
    const authorityPolicy = read('docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md');
    const supersession = control('CTRL-GOV-AUTH-002');
    const impactPath = 'docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md';
    const impact = read(impactPath);

    expect(authorityPolicy).toContain('AUTH-GOV-SUPERSESSION-POLICY');
    expect(authorityPolicy).toContain('A bare `supersedes: ["AUTH-..."]` entry is a relation anchor only');
    expect(supersession.status).toBe('required');
    expect(supersession.authorityRefs).toContain('AUTH-GOV-SUPERSESSION-POLICY');
    expect(supersession.evidence).toContain(impactPath);
    expect(impact).toContain('DOC-GOV-CONTROL-PLANE-IMPACT-2026-08-19');
    expect(impact).toContain('AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19');
  });

  it('projects the accepted ADR-0104 v1.5 bounded project-set authority without restoring withdrawn handoff overlays', () => {
    const registry = JSON.parse(read('docs/adr/registry.json')) as {
      migratedRecords: Array<{
        displayId: string;
        version: string;
        supersessionScope?: {
          type?: string;
          activationCondition?: string;
          targets?: Array<{ authorityId?: string; controls?: string[] }>;
          exclusions?: string[];
        };
        projectSetPolicy?: {
          mode?: string;
          minProjects?: number;
          maxProjects?: number;
          runtimeProjectAdditionAllowed?: boolean;
          canonicalMappingRequired?: boolean;
          humanReadableNavigation?: string[];
          slots?: Record<string, string>;
        };
        note?: string;
      }>;
    };
    const adr0104 = registry.migratedRecords.find((item) => item.displayId === 'ADR-0104');

    expect(adr0104).toBeDefined();
    expect(adr0104?.version).toBe('1.5.0');
    expect(adr0104?.supersessionScope?.type).toBe('conditional-partial');
    expect(adr0104?.supersessionScope?.activationCondition).toMatch(/immutable predeclared set/i);
    expect(adr0104?.supersessionScope?.targets?.some((target) =>
      target.controls?.includes('IN_SET_PROJECT_SWITCH')
    )).toBe(true);
    expect(adr0104?.supersessionScope?.exclusions).toContain('CTRL-MERGE-HUMAN-001');
    expect(adr0104?.supersessionScope?.exclusions).toContain('POST_PR_HANDOFF');
    expect(adr0104?.projectSetPolicy).toMatchObject({
      mode: 'immutable-predeclared-bounded-set',
      minProjects: 1,
      maxProjects: 3,
      runtimeProjectAdditionAllowed: false,
      canonicalMappingRequired: true,
    });
    expect(adr0104?.projectSetPolicy?.humanReadableNavigation).toEqual([
      'docs/projects/PROJECT_VALUE_CHAIN.md',
      'docs/projects/<project>/ROADMAP.md',
      'applicable ADR',
      'applicable ESS',
    ]);
    expect(adr0104?.projectSetPolicy?.slots).toMatchObject({
      'ADR-0104-S1': 'CONSUMED',
      'ADR-0104-S2': 'CONSUMED',
      'ADR-0104-S3': 'AVAILABLE',
    });
    expect(adr0104?.note).toContain('v1.5.0');
    expect(adr0104?.note).toContain('withdrawn post-PVC routing/device-cutover contracts');
  });
});
