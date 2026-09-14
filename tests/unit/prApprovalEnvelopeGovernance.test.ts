import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
  version: string;
  controls: Array<{ controlId: string; requirement: string; evidence?: string[] }>;
};
const authorities = JSON.parse(read('docs/governance/authority-registry.json')) as {
  version: string;
  entries: Array<{ authorityId: string; version: string; lifecycle?: string; scope?: string }>;
};

const control = (id: string) => catalog.controls.find((item) => item.controlId === id);
const authority = (id: string) => authorities.entries.find((item) => item.authorityId === id);

describe('converged bounded PR Approval Envelope governance', () => {
  it('evolves one stable PR-create control without creating a parallel authority', () => {
    const prCreate = control('CTRL-SDLC-PR-CREATE-001');
    expect(prCreate).toBeDefined();
    expect(catalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-PR-CREATE-001')).toHaveLength(1);
    expect(prCreate?.requirement).toContain('bounded Approval Envelope');
    expect(prCreate?.requirement).toContain('SHA movement alone does not invalidate approval and does not preserve it');
    expect(prCreate?.requirement).toContain('Fingerprint equality is not semantic safety proof');
    expect(prCreate?.requirement).toContain('Candidate branch semantics cannot self-bootstrap');
    expect(prCreate?.requirement).toContain('Human/CODEOWNER merge remains separate');
    expect(prCreate?.evidence).toEqual(expect.arrayContaining([
      'scripts/pr/approvalEnvelope.mjs',
      'scripts/pr/approvalEnvelope.test.mjs',
    ]));
  });

  it('keeps exact Git identity as evidence while requiring semantic recorrelation', () => {
    const agents = read('AGENTS.md');
    const ownerPolicy = read('docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');

    expect(agents).toContain('SHA equality is not semantic safety proof');
    expect(agents).toContain('SHA inequality is not by itself a material scope change');
    expect(agents).toContain('approval-base `main SHA` and approval branch-head SHA');
    expect(chain).toContain('SHA drift is evidence, not sole semantics');
    expect(chain).toContain('effective-change identity');
    expect(ownerPolicy).toContain('Approval Envelope');
    expect(ownerPolicy).toContain('approval-base');
  });

  it('uses exactly the three fail-closed Approval Envelope states', () => {
    const agents = read('AGENTS.md');
    const ownerPolicy = read('docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const helper = read('scripts/pr/approvalEnvelope.mjs');

    for (const state of ['APPROVAL_STILL_VALID', 'REAPPROVAL_REQUIRED', 'BLOCKED']) {
      expect(agents).toContain(state);
      expect(ownerPolicy).toContain(state);
      expect(chain).toContain(state);
      expect(helper).toContain(state);
    }
    expect(ownerPolicy).toContain('NOT RUN');
  });

  it('consolidates the future PR-create presentation without reviving the retired generic Owner-response rule', () => {
    const agents = read('AGENTS.md');
    const handoff = control('CTRL-SDLC-CHAT-HANDOFF-001');

    expect(agents).toContain('```yaml');
    expect(agents).toContain('PR-CREATION APPROVAL');
    expect(agents).toContain('Priorität:');
    expect(agents).toContain('Roadmap-Fortschritt:');
    expect(agents).toContain('Roadmap-Bewertung:');
    expect(agents).toContain('Nächste 2 Schritte');
    expect(agents).toContain('Owner-Freigabe');
    expect(agents).toContain('PR Erstellung : Freigegeben');
    expect(agents).not.toContain('Freigabe-Antwort:');
    expect(handoff?.requirement).toContain('sole Owner-Freigabe');
    expect(handoff?.requirement).toContain('no duplicate NÄCHSTE-SCHRITTE or exact-response block');
  });

  it('prevents candidate self-bootstrap and preserves the Human merge boundary', () => {
    const agents = read('AGENTS.md');
    const ownerPolicy = read('docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md');
    const projectReadme = read('docs/projects/governance/README.md');
    const merge = control('CTRL-MERGE-HUMAN-001');

    expect(agents).toContain('Candidate branch policy MUST NOT authorize its own PR creation');
    expect(ownerPolicy).toContain('Candidate branch semantics cannot authorize their own PR creation');
    expect(projectReadme).toContain('no candidate-policy self-bootstrap');
    expect(projectReadme).toContain('Human/CODEOWNER-only merge');
    expect(merge?.requirement).toContain('Approval Envelope state');
    expect(agents).toContain('FINAL PR-HEAD / CURRENT-MAIN CORRELATION');
  });

  it('preserves bounded Security remediation and current M10/NIST treatment', () => {
    const security = control('CTRL-SEC-BOUNDED-REMEDIATION-001');
    const chain = read('docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md');
    const checkClassification = read('docs/governance/PR_CHECK_CLASSIFICATION.md');
    const manifest = JSON.parse(read('src/platform/Governance/manifest.json')) as { standards: string[] };

    expect(catalog.controls.filter((item) => item.controlId === 'CTRL-SEC-BOUNDED-REMEDIATION-001')).toHaveLength(1);
    expect(security?.requirement).toContain('smallest sufficient repository remediation');
    expect(security?.requirement).toContain('does not transfer long-term ownership');
    expect(security?.requirement).toContain('protected external mutation');
    expect(chain).toContain('Delegated Security Implementation Authority (`CTRL-SEC-BOUNDED-REMEDIATION-001`)');
    expect(chain).toContain('EVIDENCE_READY != VERIFIED');
    expect(checkClassification).toContain('M10 `AUTHORIZE_PR_CI` ist gemäß current `AGENTS.md` **RETIRED / OFF**');
    expect(manifest.standards).toEqual(['ISO/IEC 42001:2023 benchmark']);
  });

  it('projects the evolved authorities and terminal GOV-CHAT-072 current-main state', () => {
    const roadmapPointer = read('docs/projects/governance/ROADMAP.md');
    const activeRoadmapPath = 'docs/projects/governance/CAPITAL_AI_GOVERNANCE_ROADMAP_2026-09-13.md';
    const activeRoadmap = read(activeRoadmapPath);
    const supersededRoadmap = read('docs/projects/governance/archive/CAPITAL_AI_GOVERNANCE_ROADMAP_SUPERSEDED_2026-09-13.md');
    const taskRegister = read('docs/projects/governance/TASK_REGISTER.md');
    const pluginUse = control('CTRL-SDLC-PLUGIN-USE-001');

    expect(authorities.version).toBe('1.61.0');
    expect(catalog.version).toBe('1.25.0');
    expect(authority('AUTH-GOV-AGENT-TRUST-ROOT')?.version).toBe('2.10.0');
    expect(authority('AUTH-GOV-HUMAN-OWNER-PR-APPROVAL')?.version).toBe('3.4.0');
    expect(authority('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION')?.version).toBe('2.9.0');
    expect(String(authority('AUTH-GOV-HUMAN-OWNER-PR-APPROVAL')?.scope ?? '')).toContain('incidental synchronization SHA drift alone does not require renewed approval');
    expect(String(authority('AUTH-GOV-HUMAN-OWNER-PR-APPROVAL')?.scope ?? '')).toContain('sole Owner-Freigabe');
    expect(String(authority('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION')?.scope ?? '')).toContain('CTRL-SDLC-PLUGIN-USE-001');
    expect(String(authority('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION')?.scope ?? '')).toContain('no unconditional invocation');
    expect(authority('AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19')?.lifecycle).toBe('accepted');
    expect(pluginUse).toBeDefined();
    expect(catalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-PLUGIN-USE-001')).toHaveLength(1);
    expect(roadmapPointer).toContain('POINTER — NOT AN INDEPENDENT ACTIVE ROADMAP');
    expect(roadmapPointer).toContain('CAPITAL_AI_GOVERNANCE_ROADMAP_2026-09-13.md');
    expect(activeRoadmap).toContain('ACTIVE — CANONICAL DATED ROADMAP');
    expect(supersededRoadmap).toContain('`GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868');
    expect(taskRegister).toMatch(/`GOV-CHAT-076`[^\n]*`DONE_MAIN`[^\n]*PR #868/i);
    expect(supersededRoadmap).toMatch(/`GOV-CHAT-074 \/[^`]+` — `DONE_MAIN \/ TERMINAL` via PR #874/);
    expect(taskRegister).toMatch(/\| `GOV-CHAT-074` \|[^\n]*\| `DONE_MAIN` \|[^\n]*PR #874/);
    const pluginPolicySection = supersededRoadmap.split(/^## GOV-CHAT-072\b/m)[1]?.split(/^## /m)[0];
    expect(pluginPolicySection).toBeDefined();
    expect(pluginPolicySection).toContain('**State:** `DONE_MAIN / TERMINAL`');
    expect(pluginPolicySection).toContain('PR #886');
    expect(pluginPolicySection).toContain('0945b7264d6819a57451748888e1fb8c71981762');
    expect(pluginPolicySection).toContain('CTRL-SDLC-PLUGIN-USE-001');
    expect(pluginPolicySection).not.toContain('IMPLEMENTED_ON_BRANCH / PR_GATE_NEXT');
    expect(taskRegister).toMatch(/\| `GOV-CHAT-072` \|[^\n]*\| `DONE_MAIN` \|[^\n]*PR #886[^\n]*0945b7264d6819a57451748888e1fb8c71981762/i);
    expect(taskRegister).not.toContain('IMPLEMENTED_ON_BRANCH / PR_GATE_NEXT');
  });
});
