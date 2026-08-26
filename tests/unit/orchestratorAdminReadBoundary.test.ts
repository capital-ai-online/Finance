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

  // F-01 — der Poll darf eine serverseitige Abweisung nicht im 2-Sekunden-Takt wiederholen.
  // Jeder wiederholte Versuch schreibt einen weiteren DENIED-Datensatz nach iam_access_log.
  describe('F-01 poll termination on server refusal', () => {
    it('starts the interval only from an authorized read, never unconditionally on mount', () => {
      const source = readRepoFile('src/components/OrchestratorPanel.tsx');

      // Das Intervall wird ausschließlich in startPolling() erzeugt. Ein setInterval direkt im
      // Mount-Effekt würde bei einer bereits abgelehnten Sitzung sofort wieder zu poppeln beginnen.
      const intervalCreations = source.match(/setInterval\(/g) ?? [];
      expect(intervalCreations).toHaveLength(1);
      expect(source).toMatch(/const startPolling = \(\) => \{[\s\S]*?setInterval\(/);
      expect(source).toMatch(/if \(pollRef\.current !== null\) return;/);
    });

    it('clears the interval on refusal and on unmount', () => {
      const source = readRepoFile('src/components/OrchestratorPanel.tsx');

      expect(source).toMatch(/const stopPolling = \(\) => \{[\s\S]*?clearInterval\(pollRef\.current\)/);
      expect(source).toMatch(/const blockOnRefusal = \(status: number\) => \{\s*stopPolling\(\);/);
      expect(source).toContain('return () => stopPolling();');
    });

    it('routes both protected reads through the shared refusal policy', () => {
      const source = readRepoFile('src/components/OrchestratorPanel.tsx');

      expect(source).toContain("from './orchestratorPollPolicy'");
      // Sowohl der Stats-Poll als auch der Model-Ping müssen abbrechen.
      expect(source.match(/if \(isRefusalStatus\(res\.status\)\) \{\s*blockOnRefusal\(res\.status\);\s*return;/g))
        .toHaveLength(2);
    });

    it('resumes polling once a read is authorized again', () => {
      const source = readRepoFile('src/components/OrchestratorPanel.tsx');

      // Nach erneuter Anmeldung darf das Panel nicht dauerhaft tot bleiben.
      expect(source).toMatch(/setRefusal\(null\);\s*startPolling\(\);/);
    });
  });
});
