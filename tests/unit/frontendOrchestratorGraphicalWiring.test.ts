import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const routeComposition = read('server/routes/registerApplicationRoutes.ts');
const screeningGate = read('server/middleware/verifiedScreeningEntitlement.ts');
const orchestratorPanel = read('src/components/OrchestratorPanel.tsx');
const orchestratorApi = read('src/features/governance/ui/orchestrator/orchestratorApi.ts');
const supervisorDashboard = read('src/components/SupervisorDashboard.tsx');
const systemEvents = read('server/systemEvents.ts');
const defi = read('src/components/DeFiOrchestration.tsx');
const rawMaterials = read('src/features/commodities/ui/RawMaterialsDashboard.tsx');
const newsticker = read('src/components/Newsticker.tsx');
const cryptoRoutes = read('src/routes/cryptoRoutes.ts');
const rawMaterialsRoutes = read('src/routes/rawMaterialsRoutes.ts');

describe('Frontend orchestrator graphical wiring', () => {
  it('keeps RequestOrchestrator telemetry behind the canonical admin consumer', () => {
    expect(orchestratorPanel).toContain('useOrchestratorTelemetry');
    expect(orchestratorApi).toContain("'/api/orchestrator/stats'");
    expect(orchestratorApi).toContain("'/api/orchestrator/ping-models'");
    expect(routeComposition).toContain("app.use('/api/orchestrator', orchestratorRouter)");
  });

  it('projects structural domain-orchestrator status through SupervisorDashboard without invented runtime metrics', () => {
    expect(supervisorDashboard).toContain("authFetch('/api/admin/orchestrators/status')");
    expect(systemEvents).toContain("id: 'crypto_orchestrator'");
    expect(systemEvents).toContain("id: 'rawmaterials_orchestrator'");
    expect(systemEvents).toContain('latency: null');
    expect(systemEvents).not.toContain("id: 'meme_orchestrator'");
  });

  it('keeps CryptoOrchestrator research separate from the authenticated canonical DeFi score', () => {
    expect(defi).toContain("import { authFetch } from '../lib/authFetch'");
    expect(defi).toContain("authFetch('/api/crypto/score'");
    expect(defi).toContain("fetch('/api/crypto/analyze'");
    expect(defi).not.toContain("fetch('/api/crypto/score'");
    expect(cryptoRoutes).toContain("router.post('/analyze'");
    expect(cryptoRoutes).toContain("status: 'RESEARCH_ONLY'");
    expect(cryptoRoutes).toContain("router.post('/score'");
    expect(screeningGate).toContain('/^\\/api\\/crypto\\/score');
  });

  it('keeps RawMaterialsOrchestrator research separate from the authenticated canonical commodity score', () => {
    expect(rawMaterials).toContain("import { authFetch } from '../../../lib/authFetch'");
    expect(rawMaterials).toContain('authFetch(`/api/raw-materials/verified-score/');
    expect(rawMaterials).toContain("fetch('/api/raw-materials/analyze'");
    expect(rawMaterials).toContain("fetch('/api/raw-materials/score'");
    expect(rawMaterials).not.toContain('fetch(`/api/raw-materials/verified-score/');
    expect(rawMaterialsRoutes).toContain("router.post('/analyze'");
    expect(rawMaterialsRoutes).toContain("router.get('/verified-score/:symbol'");
    expect(screeningGate).toContain('/^\\/api\\/raw-materials\\/verified-score');
  });

  it('binds the intelligence ticker to canonical score, provenance and authenticated news contracts', () => {
    expect(newsticker).toContain("import { authFetch } from '../lib/authFetch'");
    expect(newsticker).toContain("import { fetchAuthenticatedNews } from '../features/news/authenticatedNewsFetch'");
    expect(newsticker).toContain("authFetch('/api/crypto/score'");
    expect(newsticker).toContain("method: 'POST'");
    expect(newsticker).toContain('asset_name: current.name');
    expect(newsticker).not.toContain('/api/crypto/score?');
    expect(newsticker).toContain('stringArray(integrity?.providers)');
    expect(newsticker).toContain('canonicalEvidenceIds(integrity?.evidence)');
    expect(newsticker).toContain('authFetch(`/api/registry/assets/${encodeURIComponent(symbol)}/verified-context`)');
    expect(newsticker).toContain('fetchAuthenticatedNews(`/api/news?symbol=${encodeURIComponent(symbol)}`)');
  });
});
