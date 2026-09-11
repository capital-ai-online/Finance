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
    expect(m10.authorityRefs).toEqual(expect.arrayContaining([
      'AUTH-GOV-AGENT-TRUST-ROOT',
      'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
      'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    ]));
    expect(m10.requirement).toMatch(/M10 .*retired/i);
    expect(m10.requirement).toContain('PR #691');
    expect(m10.requirement).toMatch(/MUST NOT search/i);
    expect(m10.requirement).toMatch(/absence of a productive M10 implementation as a gap/i);
    expect(m10.evidence).toEqual(expect.arrayContaining([
      'AGENTS.md',
      'docs/architecture/ROADMAP.md',
    ]));
    expect(agents).toContain('RETIRED / OFF');
    expect(agents).toContain('MUST NOT search');
    expect(agents).not.toContain('M10 MUST NOT be reactivated until');
    expect(roadmap).toContain('AUTH-GOV-DEVELOPMENT-CHAIN-STATUS');
    expect(roadmap).toMatch(/M10[^\n]*RETIRED \/ OFF/i);
    expect(roadmap).not.toContain('Mandatory blockers before M10 reactivation');
    expect(roadmap).not.toMatch(/Current enforced M10 state\s*[—-]\s*COMPLETE\s*\/\s*VERIFIED PASS/i);
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

  it('defines exactly one bounded relevant plugin-use control without creating plugin authority', () => {
    const agents = read('AGENTS.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
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
      'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
      'AUTH-ESS-AI-AGENT-CAPABILITY-PLANE',
    ]);
    expect(pluginUse.requirement).toMatch(/only when it directly advances the current bounded task/i);
    expect(pluginUse.requirement).toMatch(/least-privileged sufficient available capability/i);
    expect(pluginUse.requirement).toContain('Availability never grants authority');
    expect(pluginUse.requirement).toContain('Unconditional invocation');
    expect(pluginUse.requirement).toMatch(/automatic install\/connect\/enable\/disable\/permission\/OAuth\/MCP-host mutation/i);
    expect(pluginUse.requirement).toContain('Human/CODEOWNER merge');
    expect(pluginUse.requirement).toContain('protected external-mutation gates');
    expect(pluginUse.requirement).toContain('untrusted inputs');

    expect(agents).toContain('CTRL-SDLC-PLUGIN-USE-001');
    expect(agents).toContain('cycling through all available integrations');
    expect(chain).toContain('CTRL-SDLC-PLUGIN-USE-001');
    expect(chain).toContain('Availability never grants authority');
    expect(client).toContain('integration is unavailable/disconnected/not enabled');
    expect(client).toContain('no automatic connection or enablement');

    expect(authorityRegistry.entries.filter((entry) => /AUTH-.*(?:PLUGIN|CONNECTOR)/i.test(entry.authorityId))).toHaveLength(0);
  });

  it('uses one consolidated PR-create approval block and Roadmap-first continuation', () => {
    const agents = read('AGENTS.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const approval = read('docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');
    const prCreate = control('CTRL-SDLC-PR-CREATE-001');

    expect(handoff.status).toBe('required');
    expect(handoff.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(handoff.authorityRefs).toContain('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION');
    expect(handoff.requirement).toContain('CHAT_RUN_HANDOFF');
    expect(handoff.requirement).toContain('POST_PR_HANDOFF');
    expect(handoff.requirement).toMatch(/at most two/i);
    expect(handoff.requirement).toMatch(/exit gates/i);
    expect(handoff.requirement).toMatch(/Roadmap-first/i);
    expect(handoff.requirement).toMatch(/fenced yaml/i);
    expect(handoff.requirement).toContain('sole Owner-Freigabe');
    expect(handoff.requirement).toContain('no duplicate NÄCHSTE-SCHRITTE or exact-response block');

    expect(prCreate.requirement).toContain('bounded Approval Envelope');
    expect(prCreate.requirement).toContain('APPROVAL_STILL_VALID');
    expect(prCreate.requirement).toContain('REAPPROVAL_REQUIRED');
    expect(prCreate.requirement).toContain('BLOCKED');
    expect(prCreate.requirement).toContain('Human/CODEOWNER merge remains separate');

    expect(agents).toContain('```yaml');
    expect(agents).toContain('PR-CREATION APPROVAL');
    expect(agents).toContain('Priorität:');
    expect(agents).toContain('Roadmap-Fortschritt:');
    expect(agents).toContain('Roadmap-Bewertung:');
    expect(agents).toContain('Nächste 2 Schritte');
    expect(agents).toContain('Owner-Freigabe');
    expect(agents).toContain('PR Erstellung : Freigegeben');
    expect(agents).not.toContain('Freigabe-Antwort:');

    expect(chain).toContain('CTRL-SDLC-CHAT-HANDOFF-001');
    expect(chain).toContain('CHAT_RUN_HANDOFF');
    expect(chain).toContain('Roadmap-first');
    expect(chain).toContain('sole `Owner-Freigabe` response');
    expect(chain).not.toContain('Freigabe-Antwort:');

    expect(approval).toContain('single PR-creation approval surface');
    expect(approval).toContain('fenced `yaml` code block');
    expect(approval).toContain('Priority semantics');
    expect(approval).toContain('Generic process instructions');
    expect(approval).toContain('PR Erstellung : Freigegeben');
  });

  it('requires every main merge to come from a PR correlated against then-current main', () => {
    const agents = read('AGENTS.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const approval = read('docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md');
    const merge = control('CTRL-MERGE-HUMAN-001');

    expect(merge.status).toBe('required');
    expect(merge.requirement).toMatch(/Every merge into main originates from a Pull Request/i);
    expect(merge.requirement).toMatch(/final PR-head\/current-main correlation/i);
    expect(merge.requirement).toContain('Approval Envelope state');
    expect(merge.requirement).toContain('auto-merge enablement remain prohibited');

    expect(agents).toContain('FINAL PR-HEAD / CURRENT-MAIN CORRELATION');
    expect(agents).toMatch(/Every merge into `main` MUST originate from a Pull Request targeting `main`/i);
    expect(chain).toContain('FINAL PR-HEAD / CURRENT-MAIN CORRELATION');
    expect(chain).toContain('## Final pre-merge correlation');
    expect(approval).toContain('## Human Merge control');
    expect(approval).toContain('Every merge into `main` MUST originate from a Pull Request targeting `main`');
  });

  it('withdraws post-PVC routing contracts and keeps only folder-to-PVC mapping', () => {
    const agents = read('AGENTS.md');
    const projectMap = read('docs/projects/README.md');
    const pvc = read('docs/projects/PROJECT_VALUE_CHAIN.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');
    const sameIdControls = controlCatalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-CHAT-HANDOFF-001');

    expect(sameIdControls).toHaveLength(1);
    expect(handoff.requirement).toContain('POST_PR_HANDOFF');
    expect(handoff.requirement).toContain('CHAT_RUN_HANDOFF');
    expect(handoff.requirement).not.toContain('FOREIGN_PROJECT_HANDOFF');
    expect(handoff.evidence).toContain('docs/projects/README.md');
    expect(handoff.evidence).toContain('docs/projects/PROJECT_VALUE_CHAIN.md');
    expect(handoff.evidence).not.toContain('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');

    expect(agents).toContain('POST_PR_HANDOFF');
    expect(agents).toContain('CHAT_RUN_HANDOFF');
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
