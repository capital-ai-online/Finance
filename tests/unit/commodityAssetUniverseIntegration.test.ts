import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Commodity evaluation tools in the Asset Universe', () => {
  const assetUniverseSource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/AssetUniverseDashboard.tsx'),
    'utf8',
  );
  const workspaceSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/commodities/ui/CommodityEvaluationWorkspace.tsx'),
    'utf8',
  );
  const rawMaterialsSource = fs.readFileSync(
    path.join(process.cwd(), 'src/features/commodities/ui/RawMaterialsDashboard.tsx'),
    'utf8',
  );
  const rawMaterialsCompatibilitySource = fs.readFileSync(
    path.join(process.cwd(), 'src/components/RawMaterialsDashboard.tsx'),
    'utf8',
  );
  const frontendArchitectureGateSource = fs.readFileSync(
    path.join(process.cwd(), 'scripts/automation/validateFrontendArchitecture.ts'),
    'utf8',
  );

  it('mounts one dedicated Commodities workspace instead of the former synthetic slider score', () => {
    expect(assetUniverseSource).toContain("id: 'commodities'");
    expect(assetUniverseSource).toContain("name: 'Commodities'");
    expect(assetUniverseSource).toContain("activeTab === 'commodities'");
    expect(assetUniverseSource).toContain('<CommodityEvaluationWorkspace />');
    expect(assetUniverseSource).not.toContain('commodities-curve');
    expect(assetUniverseSource).not.toContain('commodities-supplyDemand');
    expect(assetUniverseSource).not.toContain('commodities-hedgeRisk');
    expect(assetUniverseSource).not.toContain("asset: 'Kupfer (CU)'");
  });

  it('bundles canonical scoring, orchestrator research and the research sandbox with explicit authority labels', () => {
    expect(workspaceSource).toContain('Verifizierter Markt-Score');
    expect(workspaceSource).toContain('Orchestrator-Research');
    expect(workspaceSource).toContain('Research-Sandbox');
    expect(workspaceSource).toContain('CANONICAL SCORE');
    expect(workspaceSource).toContain('NOT SCORE ELIGIBLE');
    expect(workspaceSource).toContain('<RawMaterialsDashboard />');
    expect(rawMaterialsCompatibilitySource).toContain(
      "from '../features/commodities/ui/RawMaterialsDashboard'",
    );
  });

  it('loads the canonical score only from the governed verified-score route and preserves fail-closed UI states', () => {
    expect(rawMaterialsSource).toContain('/api/raw-materials/verified-score/');
    expect(rawMaterialsSource).toContain('normalizeCanonicalScore');
    expect(rawMaterialsSource).toContain("canonicalScore?.status === 'READY'");
    expect(rawMaterialsSource).toContain('Es wird kein Ersatzwert erzeugt.');
    expect(rawMaterialsSource).toContain('scoreEligible=false');
    expect(rawMaterialsSource).toContain('4 Research Agents / Parallel');
    expect(rawMaterialsSource).not.toContain('8 Workers / Parallel Processing');
  });

  it('labels legacy structural values as research-only and does not invert the resilience warning', () => {
    expect(rawMaterialsSource).toContain('Struktureller Research-Score · nicht kanonisch');
    expect(rawMaterialsSource).toContain('Legacy Research-Score');
    expect(rawMaterialsSource).toContain('payload.scores.risk_resilience < 40');
    expect(rawMaterialsSource).toContain('NIEDRIGE RESILIENZ / HOHES RISIKO');
  });

  it('registers the canonical Commodity feature slice in the frontend architecture gate', () => {
    expect(frontendArchitectureGateSource).toContain("'src/features/commodities/ui/index.ts'");
  });
});
