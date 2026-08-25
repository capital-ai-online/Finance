// FO-01 / ADR-0067 regression guard for the Request-Orchestrator admin read boundary.
//
// The Orchestrator UI is an administrative projection. Client-side visibility must never be
// treated as authorization: every operational read endpoint must pass through the existing
// server-side IAM guard, and the browser consumer must attach the verified Supabase session
// token through the shared authFetch adapter.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('FO-01 orchestrator admin read boundary', () => {
  it('protects operational orchestrator GET endpoints with the shared admin guard', () => {
    const source = readRepoFile('server/orchestrator.ts');

    expect(source).toMatch(
      /orchestratorRouter\.get\('\/stats',\s*requireOrchestratorAdmin,/
    );
    expect(source).toMatch(
      /orchestratorRouter\.get\('\/ping-models',\s*requireOrchestratorAdmin,/
    );
    expect(source).toContain("checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES)");
  });

  it('uses the authenticated frontend adapter for protected orchestrator reads', () => {
    const source = readRepoFile('src/components/OrchestratorPanel.tsx');

    expect(source).toContain("authFetch('/api/orchestrator/stats')");
    expect(source).toContain("authFetch('/api/orchestrator/ping-models')");
    expect(source).not.toContain("fetch('/api/orchestrator/stats')");
    expect(source).not.toContain("fetch('/api/orchestrator/ping-models')");
  });

  it('keeps the orchestrator router mounted through the canonical application composition', () => {
    const routes = readRepoFile('server/routes/registerApplicationRoutes.ts');
    expect(routes).toContain("app.use('/api/orchestrator', orchestratorRouter)");
  });
});
