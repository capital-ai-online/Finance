import { describe, expect, it } from 'vitest';
import { cryptoCoreModule } from '../../src/platform/FinTechCore/Modules/Crypto/CryptoCoreModule';
import {
  EQUITY_RESEARCH_LENSES,
  EQUITY_RESEARCH_UNIVERSE_VERSION,
} from '../../src/platform/FinTechCore/Universe/EquityResearchUniverse';
import {
  FINTECH_UNIVERSE_ORCHESTRATION_PROJECTION_VERSION,
  projectFinTechUniverseOrchestration,
} from '../../src/platform/FinTechCore/Universe/FinTechUniverseProjection';
import { DEFAULT_SCORING_MODELS } from '../../src/platform/Scoring/ScoringModelRegistry';

describe('FINTECH multi-asset universe orchestration projection', () => {
  const projection = projectFinTechUniverseOrchestration(
    DEFAULT_SCORING_MODELS,
    [cryptoCoreModule],
  );

  it('projects all canonical scorable asset classes without inventing runtime capability', () => {
    expect(projection.contractVersion).toBe(FINTECH_UNIVERSE_ORCHESTRATION_PROJECTION_VERSION);
    expect(projection.classes.map((entry) => entry.assetClass)).toEqual([
      'crypto',
      'stock',
      'forex',
      'commodity',
      'index',
      'bond',
    ]);

    const crypto = projection.classes.find((entry) => entry.assetClass === 'crypto');
    expect(crypto?.attachmentState).toBe('WORKFLOW_AND_SCORING');
    expect(crypto?.workflowModules).toEqual(['fintech-core.crypto']);
    expect(crypto?.canonicalModels.map((model) => `${model.modelId}@${model.modelVersion}`))
      .toEqual(['crypto-technical-provenance@0.7.0']);
    expect(crypto?.researchModels.map((model) => model.modelId)).toEqual([
      'crypto-defi-fundamental',
      'crypto-meme-integrity',
    ]);

    for (const assetClass of ['stock', 'forex', 'commodity', 'index', 'bond'] as const) {
      const entry = projection.classes.find((candidate) => candidate.assetClass === assetClass);
      expect(entry?.attachmentState).toBe('SCORING_ONLY');
      expect(entry?.workflowModules).toEqual([]);
      expect(entry?.canonicalModels.length).toBeGreaterThan(0);
    }
  });

  it('keeps universe and scoring authority explicit and fail-closed', () => {
    for (const entry of projection.classes) {
      expect(entry.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
      expect(entry.workflowAuthority).toBe('FINTECH_CORE_MODULE_REGISTRY_ONLY');
      expect(entry.universeSla.syntheticFillAllowed).toBe(false);
      expect(entry.universeSla.topLevelTarget).toBe(24);
      expect(entry.universeSla.subcategoryTarget).toBe(24);
    }
  });

  it('adds the owner-reference equity lenses as research targets, never productive models', () => {
    expect(EQUITY_RESEARCH_UNIVERSE_VERSION).toBe('fintech-equity-research-universe/1.0.0');
    expect(EQUITY_RESEARCH_LENSES).toHaveLength(20);
    expect(new Set(EQUITY_RESEARCH_LENSES.map((lens) => lens.id)).size).toBe(20);
    expect(EQUITY_RESEARCH_LENSES).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'quality-growth', label: 'Quality Growth' }),
      expect.objectContaining({ id: 'deep-value', label: 'Deep Value' }),
      expect.objectContaining({ id: 'semiconductor-ai-infrastructure', label: 'Semiconductor / AI Infrastructure' }),
      expect.objectContaining({ id: 'healthcare-innovators', label: 'Healthcare Innovators' }),
    ]));
    for (const lens of EQUITY_RESEARCH_LENSES) {
      expect(lens.lifecycle).toBe('RESEARCH_TARGET_NOT_MODEL');
      expect(lens.currentChampionBinding).toBe('traditional-scoring@2.1.0');
      expect(lens.scoreAuthority).toBe('SCORING_DISPATCHER_ONLY');
    }
  });
});
