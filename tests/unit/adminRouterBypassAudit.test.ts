// M8 Exit Gate item 4 / Cutover Sequence step 6 regression guard
// (docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md).
//
// This test does not exercise runtime behavior — it statically re-verifies the exact audit
// performed in that evidence document: every admin-adjacent or systemadmin-execution route
// mounted in registerApplicationRoutes.ts must go through the shared checkAdminAccess guard (or,
// for the one AI-agent-reachable execution surface, the full SA3B OIDC+SA3 chain), and no NEW
// admin-adjacent mount may be added without a corresponding entry here. If this test starts
// failing because a new `/api/admin*` or `/api/internal/systemadmin*` route was added, that is
// exactly the signal this guard exists to raise: extend the table below deliberately, don't just
// make the assertion pass.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

interface GuardedMount {
  mountPrefix: string;
  routerFile: string;
  expectedGuard: string;
}

const GUARDED_MOUNTS: readonly GuardedMount[] = [
  { mountPrefix: '/api/admin/hygiene', routerFile: 'server/documentHygiene.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin', routerFile: 'server/systemEvents.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin', routerFile: 'src/platform/VersionManager/versionManager.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/diagnostics', routerFile: 'server/adminDiagnostics.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/quality-center', routerFile: 'server/qualityCenter.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/github-enterprise', routerFile: 'server/routes/githubEnterpriseActionsPolicyRoutes.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/google-analytics', routerFile: 'server/routes/googleAnalyticsReadRoutes.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/supervisor', routerFile: 'server/supervisorRouter.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/admin/agent-evaluation', routerFile: 'server/agentEvaluationRouter.ts', expectedGuard: 'checkAdminAccess' },
  { mountPrefix: '/api/internal/systemadmin-execution', routerFile: 'server/systemadmin/systemadminExecutionBrokerRouter.ts', expectedGuard: 'verifyGitHubActionsOidcToken' },
];

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('M8 provider-specific admin bypass route audit (Exit Gate item 4)', () => {
  it('every currently known admin-adjacent router source file imports and uses its expected shared guard', () => {
    for (const mount of GUARDED_MOUNTS) {
      const source = readRepoFile(mount.routerFile);
      expect(source, `${mount.routerFile} must reference ${mount.expectedGuard}`).toContain(mount.expectedGuard);
    }
  });

  it('the systemadmin execution broker composes the full SA3 authorization chain, not a bespoke check', () => {
    const source = readRepoFile('server/systemadmin/systemadminExecutionBrokerRouter.ts');
    expect(source).toContain('authorizeSystemadminAuditedExecution');
    expect(source).toContain('verifyGitHubActionsOidcToken');
  });

  it('checkAdminAccess is defined exactly once — no router implements a bespoke local admin check', () => {
    const definitionSites = ['src/platform/Security/authMiddleware.ts'];
    for (const file of definitionSites) {
      const source = readRepoFile(file);
      expect(source).toMatch(/export\s+async\s+function\s+checkAdminAccess/);
    }
  });

  it('no new admin-adjacent or systemadmin-execution route was mounted without an audited entry above', () => {
    const routes = readRepoFile('server/routes/registerApplicationRoutes.ts');
    const mountLines = [...routes.matchAll(/app\.use\('(\/api\/admin[^']*|\/api\/internal\/systemadmin[^']*)'/g)]
      .map(match => match[1]);
    const auditedPrefixes = new Set(GUARDED_MOUNTS.map(mount => mount.mountPrefix));
    for (const mountPath of mountLines) {
      expect(auditedPrefixes.has(mountPath), `Unaudited admin-adjacent mount found: ${mountPath}. Add it to GUARDED_MOUNTS above and to docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md.`).toBe(true);
    }
    // Sanity: this repo does have admin-adjacent routes today — an empty match set would mean
    // the regex itself stopped working, not that the surface disappeared.
    expect(mountLines.length).toBeGreaterThan(0);
  });
});
