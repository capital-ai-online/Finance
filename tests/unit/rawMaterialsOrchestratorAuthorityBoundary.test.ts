import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('commodity raw-materials orchestrator authority boundary', () => {
  const orchestratorSource = fs.readFileSync(
    path.join(process.cwd(), 'src/orchestrator/rawMaterialsOrchestrator.ts'),
    'utf8',
  );
  const routeSource = fs.readFileSync(
    path.join(process.cwd(), 'src/routes/rawMaterialsRoutes.ts'),
    'utf8',
  );

  it('keeps the orchestrator research-only and outside productive scoring authority', () => {
    expect(orchestratorSource).toContain("semantic: 'RESEARCH_CONTEXT_ONLY'");
    expect(orchestratorSource).toContain('scoreEligible: false');
    expect(orchestratorSource).toContain('scoringAuthority: false');
    expect(orchestratorSource).toContain('executionAuthority: false');
    expect(orchestratorSource).toContain("evidenceStatus: 'UNVERIFIED_AGENT_RESEARCH'");

    expect(orchestratorSource).not.toContain("from '../services/rawMaterialsScoring'");
    expect(orchestratorSource).not.toContain('dispatchCanonicalScore(');
    expect(orchestratorSource).not.toContain('RawMaterialsScoringService.');
    expect(orchestratorSource).not.toContain('researchCompositeScore:');
  });

  it('composes source-backed research without creating score or execution authority', () => {
    expect(orchestratorSource).toContain('composeSourceBackedResearch');
    expect(orchestratorSource).toContain('composeCommodityResearchFeatureSnapshot');
    expect(orchestratorSource).toContain('evaluateCommodityCategoryResearchSnapshot');
    expect(orchestratorSource).toContain('canonical: false');
    expect(orchestratorSource).toContain('executionEligible: false');
  });

  it('isolates the historical dashboard score at the legacy route boundary', () => {
    expect(routeSource).toContain('buildLegacyResearchCompatibilityPayload');
    expect(routeSource).toContain('legacyCompatibility: true');
    expect(routeSource).toContain("scoreSemantic: 'legacy-structural-research'");
    expect(routeSource).toContain('scoreEligible: false');
    expect(routeSource).toContain('canonical: false');
  });

  it('retains ScoringDispatcher as the only canonical commodity route authority', () => {
    expect(routeSource).toContain("router.get('/verified-score/:symbol'");
    expect(routeSource).toContain('dispatchCanonicalScore');
    expect(routeSource).toContain("assetClass: 'commodity'");
    expect(routeSource).toContain("execution: { kind: 'commodity-evidence', evidence }");
  });
});
