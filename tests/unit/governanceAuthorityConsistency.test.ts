import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');
const exists = (repoPath: string) => fs.existsSync(path.join(root, repoPath));

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

const retiredStandalonePolicies = [
  'docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md',
  'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md',
  'docs/governance/GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY.md',
];

describe('governance authority consistency', () => {
  it('keeps the Accepted ADR-0069 2026-08-16 addendum as subject-matter evidence', () => {
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
    expect(m10.authorityRefs).toEqual(expect.arrayContaining([
      'AUTH-GOV-AGENT-TRUST-ROOT',
      'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
      'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    ]));
    expect(m10.requirement).toMatch(/M10 .*retired/i);
    expect(m10.requirement).toContain('PR #691');
    expect(m10.requirement).toMatch(/MUST NOT search/i);
    expect(m10.requirement).toMatch(/absence of a productive M10 implementation as a gap/i);
    expect(agents).toContain('RETIRED / OFF');
    expect(agents).toContain('MUST NOT search');
    expect(agents).toContain('PR #691');
    expect(roadmap).toMatch(/M10[^\n]*RETIRED \/ OFF/i);
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

  it('uses AGENTS.md as the single repository-wide instruction surface', () => {
    const agents = read('AGENTS.md');
    const trustRoot = control('CTRL-GOV-TRUST-001');

    expect(trustRoot.status).toBe('required');
    expect(trustRoot.authorityRefs).toEqual(['AUTH-GOV-AGENT-TRUST-ROOT']);
    expect(trustRoot.requirement).toMatch(/AGENTS\.md is the only repository-wide AI\/chat\/development instruction surface/i);
    expect(trustRoot.evidence).toContain('AGENTS.md');
    expect(agents).toContain('single repository-wide trust root and repository instruction surface');
    expect(agents).toContain('There is no second repository-wide or chat-specific development guideline');
    expect(agents).toContain('standalone DevelopmentChain/PR/foreign-execution policy files are retired and removed');
    expect(exists('CLAUDE.md')).toBe(false);
    expect(exists('.github/copilot-instructions.md')).toBe(false);
    for (const policy of retiredStandalonePolicies) {
      expect(exists(policy), `${policy} must remain retired`).toBe(false);
    }
  });

  it('defines exactly one bounded capability-use projection without creating plugin authority', () => {
    const agents = read('AGENTS.md');
    const client = read('docs/projects/agent-client/CLIENT_CONTRACTS.md');
    const authorityRegistry = JSON.parse(read('docs/governance/authority-registry.json')) as {
      entries: Array<{ authorityId: string }>;
    };
    const pluginControls = controlCatalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-PLUGIN-USE-001');
    const pluginUse = control('CTRL-SDLC-PLUGIN-USE-001');

    expect(pluginControls).toHaveLength(1);
    expect(pluginUse.status).toBe('required');
    expect(pluginUse.authorityRefs).toEqual([
      'AUTH-GOV-AGENT-TRUST-ROOT',
      'AUTH-ESS-AI-AGENT-CAPABILITY-PLANE',
    ]);
    expect(pluginUse.requirement).toMatch(/tools, not authority/i);
    expect(pluginUse.requirement).toMatch(/least-privilege/i);
    expect(agents).toContain('Connected plugins, apps, MCP tools and connectors are capabilities, not authority');
    expect(agents).toContain('least-privileged sufficient option');
    expect(agents).toContain('Do not cycle through integrations speculatively');
    expect(agents).toContain('Do not install, connect, enable, disable or change OAuth/permissions merely because a capability exists');
    expect(client).toContain('integration is unavailable/disconnected/not enabled');
    expect(client).toContain('no automatic connection or enablement');
    expect(authorityRegistry.entries.filter((entry) => /AUTH-.*(?:PLUGIN|CONNECTOR)/i.test(entry.authorityId))).toHaveLength(0);
  });

  it('keeps PR creation correlation-gated while Human Owner-only merge remains separate', () => {
    const agents = read('AGENTS.md');
    const prCreate = control('CTRL-SDLC-PR-CREATE-001');

    expect(prCreate.status).toBe('required');
    expect(prCreate.authorityRefs).toEqual(expect.arrayContaining([
      'AUTH-GOV-AGENT-TRUST-ROOT',
      'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
      'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    ]));
    expect(prCreate.requirement).toMatch(/defined only in AGENTS\.md/i);
    expect(prCreate.requirement).toMatch(/Unmerged predecessor change content is never assumed to be current main/i);
    expect(agents).toContain('PR creation and PR updates may be automated after final correlation PASS');
    expect(agents).toContain('unresolved or blocked correlation stops readiness');
    expect(agents).toContain('`NOT_RUN`, missing evidence, `BLOCKED` and `FAIL` are never represented as `PASS`');
    expect(agents).toContain('The final Pull Request merge is the sole mandatory Human Owner action');
    expect(agents).toContain('Agents and automation MUST NOT self-merge, enable auto-merge');
    for (const policy of retiredStandalonePolicies) {
      expect(exists(policy)).toBe(false);
    }
  });

  it('requires every main merge to remain a distinct Human Owner decision', () => {
    const agents = read('AGENTS.md');
    const merge = control('CTRL-MERGE-HUMAN-001');

    expect(merge.status).toBe('required');
    expect(merge.requirement).toMatch(/Every main merge is a distinct Human Owner decision/i);
    expect(merge.requirement).toMatch(/self-merge and auto-merge remain prohibited/i);
    expect(agents).toContain('Every repository change is delivered through a Pull Request');
    expect(agents).toContain('Human/CODEOWNER review and merge remain separate external authority');
    expect(agents).toContain('Agents MUST NOT self-approve, self-merge, enable auto-merge');
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
    expect(supersession.evidence).toContain('docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md');
    expect(impact).toContain('DOC-GOV-CONTROL-PLANE-IMPACT-2026-08-19');
    expect(impact).toContain('AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19');
  });

  it('projects the accepted ADR-0104 v1.5 bounded project-set authority without restoring withdrawn overlays', () => {
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