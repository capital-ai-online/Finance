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

  it('keeps ruleset authority at the live provider and retires repository-owned desired policy', () => {
    const expectedPolicyPath = path.join(
      root,
      '.github/policies/main-production-protection.expected.json',
    );
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

  it('reuses the same chat-handoff control for foreign-project routing and bounded copyable prompts', () => {
    const agents = read('AGENTS.md');
    const handoffContract = read('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');
    const sameIdControls = controlCatalog.controls.filter(
      (item) => item.controlId === 'CTRL-SDLC-CHAT-HANDOFF-001',
    );

    expect(sameIdControls).toHaveLength(1);
    expect(handoff.requirement).toContain('POST_PR_HANDOFF');
    expect(handoff.requirement).toContain('FOREIGN_PROJECT_HANDOFF');
    expect(handoff.requirement).toContain('REFERRED_NOT_EXECUTED');
    expect(handoff.requirement).toContain('REQUIRES_CORRELATION');
    expect(handoff.evidence).toContain('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');

    expect(agents).toContain('Trigger 1 — `POST_PR_HANDOFF`');
    expect(agents).toContain('Trigger 2 — `FOREIGN_PROJECT_HANDOFF`');
    expect(agents).toContain('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');
    expect(agents).toContain('parts of at most **400 lines**');

    expect(handoffContract).toContain('PROJECT HANDOFF REQUIRED');
    expect(handoffContract).toContain('Target Project Folder: <TARGET_FOLDER>');
    expect(handoffContract).toContain('Status: REFERRED_NOT_EXECUTED');
    expect(handoffContract).toContain('[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]');
    expect(handoffContract).toContain('Maximum: **400 lines per prompt part**');
    expect(handoffContract).toContain('TEIL 1 VON N');
    expect(handoffContract).toContain('REQUIRES_CORRELATION');
    expect(handoffContract).toContain('The Security marker is additive only.');
    expect(handoffContract).toContain('It does not authorize:');
  });

  it('permits only Human-activated, time-bound, exact-scope global roadmap execution', () => {
    const agents = read('AGENTS.md');
    const policy = read('docs/governance/TEMPORARY_GLOBAL_ROADMAP_EXECUTION_POLICY.md');
    const handoffContract = read('docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md');
    const projectExecution = read('docs/projects/PROJECT_EXECUTION_MODEL.md');
    const adr = read('docs/adr/ADR-0104-owner-activated-global-roadmap-execution.md');
    const sessionSchema = JSON.parse(
      read('docs/governance/control-plane/global-roadmap-execution-session.schema.json'),
    ) as {
      properties: Record<string, { const?: unknown }>;
    };
    const jit = control('CTRL-GOV-JIT-GLOBAL-ROADMAP-001');
    const sameIdControls = controlCatalog.controls.filter(
      (item) => item.controlId === 'CTRL-GOV-JIT-GLOBAL-ROADMAP-001',
    );

    expect(sameIdControls).toHaveLength(1);
    expect(jit.status).toBe('required');
    expect(jit.authorityRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(jit.authorityRefs).toContain('AUTH-GOV-JIT-GLOBAL-ROADMAP-EXECUTION');
    expect(jit.authorityRefs).toContain('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION');
    expect(jit.authorityRefs).toContain('AUTH-ADR-GOV-JIT-GLOBAL-ROADMAP-2026-09-01');
    expect(jit.requirement).toContain('GOV_GLOBAL_ROADMAP_SESSION');
    expect(jit.requirement).toMatch(/at most 8 hours/i);
    expect(jit.requirement).toContain('Primary ownership never transfers');
    expect(jit.requirement).toContain('Exact-snapshot PR approval');
    expect(jit.requirement).toContain('Human/CODEOWNER merge');
    expect(jit.requirement).toContain('FOREIGN_PROJECT_HANDOFF');

    expect(agents).toContain('Owner-activated temporary global roadmap execution');
    expect(agents).toContain('GOV_GLOBAL_ROADMAP_SESSION');
    expect(agents).toContain('Maximum duration is **8 hours**');
    expect(agents).toContain('[GLOBAL_ROADMAP_CONTEXT_SWITCH -> <TARGET_PROJECT> | PVC-<NN>]');
    expect(agents).toContain('one branch/PR MUST NOT combine productive work owned by different Primary Owners');

    expect(policy).toContain('global administrator');
    expect(policy).toContain('repository-execution metaphor only');
    expect(policy).toContain('Scope expansion is never implicit.');
    expect(policy).toContain('Human/CODEOWNER merge remains separately required');
    expect(policy).toContain('A session does not authorize protected external mutations.');

    expect(sessionSchema.properties.mode.const).toBe('GOV_GLOBAL_ROADMAP_SESSION');
    expect(sessionSchema.properties.maxDurationHours.const).toBe(8);
    expect(sessionSchema.properties.chatBound.const).toBe(true);
    expect(sessionSchema.properties.repositoryMutationOnly.const).toBe(true);
    expect(sessionSchema.properties.exactPrApprovalRequired.const).toBe(true);
    expect(sessionSchema.properties.humanMergeRequired.const).toBe(true);
    expect(sessionSchema.properties.protectedExternalMutationSeparatelyApproved.const).toBe(true);
    expect(sessionSchema.properties.securityVerificationDelegated.const).toBe(false);
    expect(sessionSchema.properties.ownerTransfer.const).toBe(false);

    expect(handoffContract).toContain('Owner-activated global-roadmap execution exception');
    expect(handoffContract).toContain('GLOBAL ROADMAP CONTEXT SWITCH');
    expect(handoffContract).toContain('[GLOBAL_ROADMAP_CONTEXT_SWITCH -> <TARGET_PROJECT> | PVC-<NN>]');
    expect(handoffContract).toContain('fall back to the normal `FOREIGN_PROJECT_HANDOFF`');

    expect(projectExecution).toContain('The chat may traverse multiple Primary Owners, but a productive branch/PR may not.');
    expect(projectExecution).toContain('The session does not bypass `DC-00..DC-11`');

    expect(adr).toContain('AUTH-ADR-GOV-JIT-GLOBAL-ROADMAP-2026-09-01');
    expect(adr).toContain('execution delegation, not an ownership transfer');
    expect(adr).toContain('Maximum activation duration');
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
