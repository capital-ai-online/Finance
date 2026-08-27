// FO-01 / FO-05 regression guard for the Request-Orchestrator admin read boundary.
//
// The Orchestrator UI is an administrative projection. Client-side visibility must never be
// treated as authorization: every operational read endpoint must pass through the existing
// server-side IAM guard, while frontend access remains centralized through authFetch.

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

    expect(source).toMatch(/orchestratorRouter\.get\('\/stats',\s*requireOrchestratorAdmin,/);
    expect(source).toMatch(/orchestratorRouter\.get\('\/ping-models',\s*requireOrchestratorAdmin,/);
    expect(source).toContain("checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES)");
  });

  it('routes all frontend orchestrator calls through the typed authFetch adapter', () => {
    const client = readRepoFile('src/features/governance/ui/orchestrator/orchestratorApi.ts');
    const panel = readRepoFile('src/components/OrchestratorPanel.tsx');

    expect(client).toContain("import { authFetch } from '../../../../lib/authFetch'");
    expect(client).toContain('const response = await authFetch(url, options)');
    expect(client).toContain("'/api/orchestrator/stats'");
    expect(client).toContain("'/api/orchestrator/ping-models'");
    expect(client).toContain("'/api/orchestrator/config'");
    expect(client).toContain("'/api/orchestrator/reset'");

    expect(panel).not.toContain("authFetch('/api/orchestrator/stats')");
    expect(panel).not.toContain("fetch('/api/orchestrator/stats')");
    expect(panel).toContain('useOrchestratorTelemetry');
  });

  it('keeps the orchestrator router mounted through the canonical application composition', () => {
    const routes = readRepoFile('server/routes/registerApplicationRoutes.ts');
    expect(routes).toContain("app.use('/api/orchestrator', orchestratorRouter)");
  });

  describe('F-01 refusal termination after FO-05 extraction', () => {
    it('keeps refusal handling in the lifecycle hook and stops rescheduling refused reads', () => {
      const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');

      expect(hook).toContain('isRefusalStatus(err.status)');
      expect(hook).toContain('blockOnRefusal(err.status)');
      expect(hook).toContain('refusalActiveRef.current = true');
      expect(hook).toContain('refusalActiveRef.current) return');
    });

    it('does not reintroduce interval-based blind polling', () => {
      const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');
      const panel = readRepoFile('src/components/OrchestratorPanel.tsx');

      expect(hook).not.toContain('setInterval(');
      expect(panel).not.toContain('setInterval(');
      expect(hook).toContain('setTimeout(() =>');
    });
  });
});
