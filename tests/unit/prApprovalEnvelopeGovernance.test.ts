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
    expect(agents).toContain('Project Presentation:');
    expect(agents).toContain('same current `docs/projects/README.md` routing row');
    expect(agents).toContain('color is supplementary');
    expect(agents).toContain('Source Project:');
    expect(agents).toContain('Source Folder:');
    expect(agents).toContain('Target Project:');
    expect(agents).toContain('Target Folder:');
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

  it('renders all canonical project presentations from one routing source and resolves Current, Source and Target independently', () => {
    const mapping = read('docs/projects/README.md');
    const template = read('.github/pull_request_template.md');
    const renderer = read('scripts/pr/renderPullRequestBody.mjs');

    const expected = [
      ['CAPITAL-AI-CLIENT', 'docs/projects/agent-client/', 'Agent Client', '🧪', '#58AC60'],
      ['CAPITAL-AI-GOV', 'docs/projects/governance/', 'Governance', '🧠', '#A1A1AA'],
      ['CAPITAL-AI-SEC', 'docs/projects/security/', 'Security', '💻', '#E04C4C'],
      ['CAPITAL-AI-FE', 'docs/projects/frontend/', 'Frontend', '🎨', '#DC7CA8'],
      ['CAPITAL-AI-DATA', 'docs/projects/data/', 'Data', '📁', '#8058CC'],
      ['CAPITAL-AI-QM', 'docs/projects/quality-management/', 'Quality Management', '🩺', '#4480E8'],
      ['CAPITAL-AI-OPS', 'docs/projects/operations/', 'Operations', '✈️', '#845CDC'],
      ['CAPITAL-AI-DOC', 'docs/projects/documentary/', 'Documentary', '📋', '#5CB060'],
      ['CAPITAL-AI-SEO', 'docs/projects/seo/', 'SEO', '✒️', '#E8C464'],
      ['CAPITAL-AI-COMP', 'docs/projects/compliance/', 'Compliance', '⚖️', '#E84848'],
      ['CAPITAL-AI-FINTECH', 'docs/projects/fintech/', 'FinTech', '📊', '#E080AC'],
      ['CAPITAL-AI-SOCIAL', 'docs/projects/social-media/', 'Social Media', '♡', '#E8C45C'],
    ] as const;

    for (const header of ['Canonical project folder', 'Display name', 'Symbol', 'Color']) expect(mapping).toContain(header);
    const routingSection = mapping.split(/^## Canonical project-folder routing\s*$/m)[1]?.split(/^## /m)[0];
    expect(routingSection).toBeDefined();
    for (const [projectId, folder, displayName, symbol, color] of expected) {
      const matchingLines = String(routingSection).split(/\r?\n/).filter((line) => line.startsWith(`| \`${projectId}\``));
      expect(matchingLines).toHaveLength(1);
      expect(matchingLines[0]).toContain(`\`${folder}\``);
      expect(matchingLines[0]).toContain(displayName);
      expect(matchingLines[0]).toContain(symbol);
      expect(matchingLines[0]).toContain(`\`${color}\``);
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(mapping).toContain('No second project-presentation registry');
    expect(mapping).toContain('Color is supplementary only');
    expect(mapping).toContain('Source and Target projects are resolved independently');

    for (const placeholder of [
      'PROJECT_DISPLAY_NAME', 'PROJECT_SYMBOL', 'PROJECT_COLOR', 'PROJECT_FOLDER',
      'SOURCE_PROJECT_ID', 'SOURCE_PROJECT_DISPLAY_NAME', 'SOURCE_PROJECT_SYMBOL', 'SOURCE_PROJECT_COLOR', 'SOURCE_PROJECT_FOLDER',
      'TARGET_PROJECT_ID', 'TARGET_PROJECT_DISPLAY_NAME', 'TARGET_PROJECT_SYMBOL', 'TARGET_PROJECT_COLOR', 'TARGET_PROJECT_FOLDER',
    ]) expect(template).toContain(`{{${placeholder}}}`);
    expect(template).toContain('Farbe ist nie alleiniger Bedeutungsträger');
    expect(template).toContain('docs/projects/README.md');

    expect(renderer).toContain("const projectMappingPath = process.env.PR_PROJECT_MAPPING_PATH || 'docs/projects/README.md'");
    expect(renderer).toContain('resolveProjectPresentation(projectId)');
    expect(renderer).toContain("const sourceProjectId = String(process.env.PR_SOURCE_PROJECT_ID || projectId).trim()");
    expect(renderer).toContain("const targetProjectId = String(process.env.PR_TARGET_PROJECT_ID || projectId).trim()");
    expect(renderer).toContain('SOURCE_PROJECT_FOLDER: sourcePresentation.folder');
    expect(renderer).toContain('TARGET_PROJECT_FOLDER: targetPresentation.folder');
    expect(renderer).toContain('Projectfolder widerspricht der kanonischen Routing-Zeile');
    expect(renderer).toContain('muss genau eine Project-Presentation-Zeile besitzen');
    expect(renderer).toContain('Canonical project folder ist ungültig');
    expect(renderer).toContain('Display name fehlt');
    expect(renderer).toContain('Symbol fehlt');
    expect(renderer).toContain('Color muss #RRGGBB sein');
    expect(renderer).toContain('PR-Vorlage enthält noch nicht aufgelöste Vorlagenplatzhalter');
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

  it('projects the evolved authorities, roadmap pointer and active Governance roadmap state', () => {
    const roadmapPointer = read('docs/projects/governance/ROADMAP.md');
    const activeRoadmap = read('docs/projects/governance/CAPITAL_AI_GOVERNANCE_ROADMAP_2026-09-13.md');
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
    expect(roadmapPointer).toContain('CAPITAL_AI_GOVERNANCE_ROADMAP_SUPERSEDED_2026-09-13.md');
    expect(roadmapPointer).toContain('Execution truth is the dated active roadmap above');
    expect(activeRoadmap).toContain('ACTIVE — CANONICAL DATED ROADMAP');
    expect(activeRoadmap).toContain('### GOV-PR900-07 — Project presentation in PR approval and PR body');
    expect(activeRoadmap).toContain('candidate `/AGENTS.md` presentation extension is non-authorizing until Human Merge');
    expect(activeRoadmap).toContain('candidate semantics cannot self-bootstrap');

    expect(taskRegister).toMatch(/`GOV-CHAT-076`[^\n]*`DONE_MAIN`[^\n]*PR #868/i);
    expect(taskRegister).toMatch(/\| `GOV-CHAT-074` \|[^\n]*\| `DONE_MAIN` \|[^\n]*PR #874/);
    expect(taskRegister).toMatch(/\| `GOV-CHAT-072` \|[^\n]*\| `DONE_MAIN` \|[^\n]*PR #886[^\n]*0945b7264d6819a57451748888e1fb8c71981762/i);
    expect(taskRegister).not.toContain('IMPLEMENTED_ON_BRANCH / PR_GATE_NEXT');
  });
});
