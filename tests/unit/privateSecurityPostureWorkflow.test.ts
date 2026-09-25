import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = fs.readFileSync('.github/workflows/private-security-posture-read.yml', 'utf8');
const ci = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const server = fs.readFileSync('server.application.ts', 'utf8');
const render = fs.readFileSync('render.yaml', 'utf8');

describe('Private security posture workflow', () => {
  it('is manual, main/owner-bound and read-only', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("github.actor == 'SvenKulessa'");
    expect(workflow).toContain('permissions:\n  contents: read');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).not.toContain('actions: write');
    expect(workflow).not.toContain('pull-requests: write');
    expect(workflow).not.toContain('id-token: write');
    expect(workflow).not.toContain('actions/upload-artifact');
  });

  it('reuses bounded provider credentials and deletes all temporary evidence', () => {
    expect(workflow).toContain('CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT');
    expect(workflow).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(workflow).toContain('SUPABASE_DB_URL');
    expect(workflow).toContain('default_transaction_read_only=on');
    expect(workflow).toContain('runPrivateGitHubSettingsInventoryRead.mjs');
    expect(workflow).toContain('runPrivateGitHubSecurityPostureEvidence.mjs');
    expect(workflow).toContain('renderManagementAdapter.mjs --action inventory');
    expect(workflow).toContain('runPrivateSecurityPostureRead.mjs');
    expect(workflow).toContain('rm -f --');
  });

  it('moves the single deployment authority from the deleted hook to exact-commit Render API', () => {
    expect(ci).not.toContain('RENDER_DEPLOY_HOOK_URL');
    expect(ci).toContain('CAPITAL_AI_RENDER_API_KEY');
    expect(ci).toContain('triggerRenderExactCommit.mjs');
    expect(ci).toContain('VERIFIED_COMMIT_SHA');
    expect(ci).toContain('live_main_sha');
    expect(render).toContain('autoDeployTrigger: off');
  });

  it('implements the current Sitelemetry browser hardening findings without breaking popup auth', () => {
    expect(server).toContain("res.setHeader(\n    'Permissions-Policy'");
    expect(server).toContain("'Cross-Origin-Opener-Policy', 'same-origin-allow-popups'");
    expect(server).toContain("'Cross-Origin-Resource-Policy', 'same-site'");
    expect(server).toContain("'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'");
    expect(server).toContain("'X-Content-Type-Options', 'nosniff'");
    expect(server).toContain("'X-Frame-Options', 'SAMEORIGIN'");
  });
});
