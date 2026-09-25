import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_CONNECTION_CONTRACTS,
  DATA_CONNECTION_CONCEPTS,
  validateAnalysisConnectionContracts,
} from '../../src/platform/Scoring/AnalysisConnectionRegistry';
import {
  architectureFitScore,
  benchmarkWorkflow,
  buildDefaultWorkflow,
  validateWorkflow,
} from '../../src/features/datacalculator/model/dataCalculatorModel';

describe('AnalysisConnectionRegistry', () => {
  it('covers the four requested connection concepts without structural contract errors', () => {
    expect(validateAnalysisConnectionContracts()).toEqual([]);
    expect(new Set(DATA_CONNECTION_CONCEPTS.map((concept) => concept.name))).toEqual(new Set([
      'Tier 1-4',
      'Data Authority & Evidence',
      'Hybrid',
      'Individual',
    ]));
  });

  it('gives every analysis/scoring entry provider services, storage models, UI flow and formula evidence', () => {
    expect(ANALYSIS_CONNECTION_CONTRACTS.length).toBeGreaterThanOrEqual(38);

    for (const contract of ANALYSIS_CONNECTION_CONTRACTS) {
      expect(contract.assetClasses.length).toBeGreaterThan(0);
      expect(contract.providerApplicationServices.length).toBeGreaterThan(0);
      expect(contract.storageModels.length).toBeGreaterThan(0);
      expect(contract.uiFlow.length).toBeGreaterThan(0);
      expect(contract.formula.trim().length).toBeGreaterThan(0);
      expect(contract.sourceRefs.length).toBeGreaterThan(0);
      expect(contract.benchmark.providerLatencyMeasured).toBe(false);
    }
  });

  it('keeps disabled, research and blocked legacy components out of canonical execution', () => {
    const bond = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'individual-bond-scoring-draft');
    const meme = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'crypto-meme-integrity');
    const defi = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'crypto-defi-fundamental');
    const portfolioPerformance = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'portfolio-performance-legacy');
    const legacyScreener = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'legacy-screener');
    const buffett = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'buffett-value-check');

    expect(bond?.status).toBe('DISABLED');
    expect(meme?.status).toBe('RESEARCH_ONLY');
    expect(defi?.status).toBe('RESEARCH_ONLY');
    expect(portfolioPerformance?.status).toBe('BLOCKED');
    expect(legacyScreener?.status).toBe('BLOCKED');
    expect(buffett?.status).toBe('COMPATIBILITY_ONLY');
  });

  it('keeps all canonical default workflows free of blocked architecture gates', () => {
    const canonical = ANALYSIS_CONNECTION_CONTRACTS.filter((contract) => contract.status === 'CANONICAL');

    for (const contract of canonical) {
      const checks = validateWorkflow(contract, buildDefaultWorkflow(contract));
      expect(checks.filter((check) => check.state === 'BLOCKED'), contract.id).toEqual([]);
      expect(architectureFitScore(contract, checks)).toBeGreaterThanOrEqual(70);
    }
  });

  it('blocks a productive workflow when evidence and canonical boundary are removed', () => {
    const crypto = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'crypto-technical-provenance');
    expect(crypto).toBeDefined();

    const checks = validateWorkflow(crypto!, ['Provider Adapter', 'UI']);
    const blockedIds = checks.filter((check) => check.state === 'BLOCKED').map((check) => check.id);

    expect(blockedIds).toContain('evidence-before-evaluation');
    expect(blockedIds).toContain('canonical-boundary');
  });


  it('blocks legacy synthetic workflows while keeping research models explicitly non-canonical', () => {
    const blockedIds = [
      'monte-carlo-risk-engine',
      'portfolio-performance-legacy',
      'legacy-screener',
      'charts-technical-analysis-legacy',
      'heatmap-creator-legacy',
      'asset-universe-sandbox-legacy',
      'legacy-market-sentiment-widget',
      'legacy-sentiment-dashboard',
    ];

    for (const id of blockedIds) {
      const contract = ANALYSIS_CONNECTION_CONTRACTS.find((candidate) => candidate.id === id);
      expect(contract?.status, id).toBe('BLOCKED');
      const checks = validateWorkflow(contract!, buildDefaultWorkflow(contract!));
      expect(checks.find((check) => check.id === 'status-gate')?.state, id).toBe('BLOCKED');
    }

    for (const id of [
      'crypto-momentum-research',
      'crypto-regime-research',
      'crypto-pattern-confluence-research',
      'crypto-signal-fusion-research',
      'crypto-kill-switch-research',
    ]) {
      const contract = ANALYSIS_CONNECTION_CONTRACTS.find((candidate) => candidate.id === id);
      expect(contract?.status, id).toBe('RESEARCH_ONLY');
      expect(contract?.scoringModel.toLowerCase(), id).toContain('research');
    }
  });

  it('benchmarks only local validation and never fabricates provider latency', () => {
    const commodity = ANALYSIS_CONNECTION_CONTRACTS.find((contract) => contract.id === 'commodity-market-evidence');
    expect(commodity).toBeDefined();

    const ticks = [10, 12];
    const result = benchmarkWorkflow(
      commodity!,
      buildDefaultWorkflow(commodity!),
      10,
      () => ticks.shift() ?? 12,
    );

    expect(result.iterations).toBe(10);
    expect(result.localValidationMs).toBe(2);
    expect(result.averageValidationMs).toBe(0.2);
    expect(result.providerLatencyMs).toBeNull();
    expect(result.providerLatencyStatus).toBe('NOT_MEASURED');
  });
});
