import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
  version: string;
  controls: Array<{ controlId: string; title?: string; requirement: string; evidence?: string[] }>;
};
const authorities = JSON.parse(read('docs/governance/authority-registry.json')) as {
  version: string;
  entries: Array<{ authorityId: string; version: string; lifecycle?: string; scope?: string }>;
};

const control = (id: string) => catalog.controls.find((item) => item.controlId === id);
const authority = (id: string) => authorities.entries.find((item) => item.authorityId === id);

describe('correlation-gated PR creation and post-create Owner governance', () => {
  it('projects the stable PR-create control without creating a parallel authority', () => {
    const prCreate = control('CTRL-SDLC-PR-CREATE-001');
    const agents = read('AGENTS.md');

    expect(prCreate).toBeDefined();
    expect(catalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-PR-CREATE-001')).toHaveLength(1);
    expect(prCreate?.title).toBe('Pull Request creation projection');
    expect(prCreate?.requirement).toContain('defined only in AGENTS.md');
    expect(prCreate?.requirement).toContain('Unmerged predecessor change content is never assumed to be current main');
    expect(prCreate?.evidence).toEqual(expect.arrayContaining([
      'AGENTS.md',
      '.github/workflows/open-agent-draft-pr.yml',
      'tests/unit/githubAgentDraftPrWorkflow.test.ts',
    ]));
    expect(agents).toContain('PR creation may be automated after final correlation PASS');
    expect(agents).toContain('unresolved or blocked correlation stops creation');
    expect(agents).toContain('Human/CODEOWNER review and merge remain separate external authority');
  });

  it('requires fresh current-main correlation and truthful validation rather than a pre-create credential', () => {
    const agents = read('AGENTS.md');

    expect(agents).toContain('Before Pull Request readiness');
    expect(agents).toContain('PR creation may be automated after final correlation PASS');
    expect(agents).toContain('unresolved or blocked correlation stops creation');
    expect(agents).toContain('`NOT_RUN`, missing evidence, `BLOCKED` and `FAIL` are never represented as `PASS`');
    expect(agents).toContain('Human/CODEOWNER review and merge remain separate external authority');
  });

  it('keeps unmerged predecessor state non-authorizing and re-correlates against CURRENT_MAIN', () => {
    const agents = read('AGENTS.md');

    expect(agents).toContain('`CURRENT_MAIN` is the repository baseline');
    expect(agents).toContain('Open Pull Requests, branches, previous chat outputs, historical evidence and unmerged change sets are correlation/evidence inputs only');
    expect(agents).toContain('Before Pull Request readiness, re-read current `main`, branch head, merge base, open writers');
    expect(agents).toContain('Any head movement invalidates earlier correlation evidence');
  });

  it('keeps trust-root changes subject to Human Merge activation', () => {
    const agents = read('AGENTS.md');
    const workflow = read('.github/workflows/open-agent-draft-pr.yml');

    expect(agents).toContain('A Pull Request changing this file cannot authorize itself');
    expect(agents).toContain('Until Human/CODEOWNER merge, the rules on then-current `main` govern creation, validation, review and merge of that Pull Request');
    expect(agents).toContain('After merge, this file alone is the repository-wide ChatGPT/AI/development instruction surface');
    expect(workflow).not.toContain('owner_pr_create_approval:');
    expect(workflow).not.toContain('approval_envelope_json:');
    expect(workflow).not.toContain('verifyPrCreationApproval.mjs');
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
      const matchingLines = String(routingSection).split(/\r?\n/).filter((line) => line.startsWith('| `' + projectId + '`'));
      expect(matchingLines).toHaveLength(1);
      expect(matchingLines[0]).toContain('`' + folder + '`');
      expect(matchingLines[0]).toContain(displayName);
      expect(matchingLines[0]).toContain(symbol);
      expect(matchingLines[0]).toContain('`' + color + '`');
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(mapping).toContain('No second project-presentation registry');
    expect(mapping).toContain('Color is supplementary only');
    expect(mapping).toContain('Source and Target project presentation MUST each resolve independently through this same mapping source');

    for (const placeholder of [
      'PROJECT_DISPLAY_NAME', 'PROJECT_SYMBOL', 'PROJECT_COLOR', 'PROJECT_FOLDER',
      'SOURCE_PROJECT_ID', 'SOURCE_PROJECT_DISPLAY_NAME', 'SOURCE_PROJECT_SYMBOL', 'SOURCE_PROJECT_COLOR', 'SOURCE_PROJECT_FOLDER',
      'TARGET_PROJECT_ID', 'TARGET_PROJECT_DISPLAY_NAME', 'TARGET_PROJECT_SYMBOL', 'TARGET_PROJECT_COLOR', 'TARGET_PROJECT_FOLDER',
    ]) expect(template).toContain('{{' + placeholder + '}}');
    expect(template).toContain('Farbe ist nie alleiniger Bedeutungsträger');
    expect(template).toContain('docs/projects/README.md');

    expect(renderer).toContain("const projectMappingPath = process.env.PR_PROJECT_MAPPING_PATH || 'docs/projects/README.md'");
    expect(renderer).toContain('resolveProjectPresentation(projectId)');
    expect(renderer).toContain("const sourceProjectId = String(process.env.PR_SOURCE_PROJECT_ID || projectId).trim()");
    expect(renderer).toContain("const targetProjectId = String(process.env.PR_TARGET_PROJECT_ID || projectId).trim()");
    expect(renderer).toContain('SOURCE_PROJECT_FOLDER: sourcePresentation.folder');
    expect(renderer).toContain('TARGET_PROJECT_FOLDER: targetPresentation.folder');
  });

  it('preserves the Human merge boundary and bounded Security remediation', () => {
    const agents = read('AGENTS.md');
    const merge = control('CTRL-MERGE-HUMAN-001');
    const security = control('CTRL-SEC-BOUNDED-REMEDIATION-001');

    expect(agents).toContain('Human/CODEOWNER review and merge remain separate external authority');
    expect(agents).toContain('Agents MUST NOT self-approve, self-merge, enable auto-merge');
    expect(merge?.requirement).toContain('Every main merge is a distinct Human/CODEOWNER decision');
    expect(merge?.requirement).toContain('Agent self-merge and auto-merge remain prohibited');
    expect(security?.requirement).toContain('bounded by ownership');
    expect(security?.requirement).toContain('protected-action gates');
    expect(agents).toContain('ownership remains unchanged');
    expect(agents).toContain('Protected Production, IAM, Billing, Secret, DNS, destructive-data');
  });

  it('projects the consolidated authority versions without changing stable IDs', () => {
    const canonicalRoadmap = read('docs/projects/governance/ROADMAP.md');
    const pluginUse = control('CTRL-SDLC-PLUGIN-USE-001');

    expect(authorities.version).toBe('1.64.0');
    expect(catalog.version).toBe('1.27.0');
    expect(authority('AUTH-GOV-AGENT-TRUST-ROOT')?.version).toBe('4.0.0');
    expect(authority('AUTH-GOV-HUMAN-OWNER-PR-APPROVAL')?.version).toBe('4.0.0');
    expect(authority('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION')?.version).toBe('4.0.0');
    expect(String(authority('AUTH-GOV-HUMAN-OWNER-PR-APPROVAL')?.scope ?? '')).toContain('resolved exclusively through AGENTS.md');
    expect(String(authority('AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION')?.scope ?? '')).toContain('resolved exclusively through AGENTS.md');
    expect(pluginUse).toBeDefined();
    expect(catalog.controls.filter((item) => item.controlId === 'CTRL-SDLC-PLUGIN-USE-001')).toHaveLength(1);
    expect(canonicalRoadmap).toContain('ACTIVE — CANONICAL PROJECT ROADMAP');
    expect(canonicalRoadmap).toContain('Human/CODEOWNER-only merge remains mandatory');
  });
});
