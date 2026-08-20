import { describe, expect, it } from 'vitest';
import { FintechValueChainQualityProjection } from '../../src/platform/Quality/ValueChain/FintechValueChainQualityProjection';

describe('FintechValueChainQualityProjection', () => {
  it('keeps the canonical SC-MD-SPT v1.1 chain structurally connected without Quality hot-path coupling', () => {
    const report = new FintechValueChainQualityProjection().project(process.cwd(), '2026-08-20T00:00:00.000Z');

    expect(report.schemaVersion).toBe('fintech-value-chain-quality/1.0.0');
    expect(report.authority).toBe('SC-MD-SPT-0001');
    expect(report.totalStages).toBe(18);
    expect(report.connectedStages).toBe(18);
    expect(report.stages.every((stage) => stage.status === 'CONNECTED')).toBe(true);
    expect(report.stages.map((stage) => stage.id)).toContain('VC-02-IDENTITY-ACCESS');
    expect(report.stages.map((stage) => stage.id)).toContain('VC-03-ENTITLEMENT-USAGE');
    expect(report.stages.map((stage) => stage.id)).toContain('VC-05-ORCHESTRATION-RUNTIME-GUARD');
    expect(report.stages.map((stage) => stage.id)).toContain('VC-08-DISPLAY-RESEARCH');
    expect(report.hotPathIsolation.checkedArtifacts).toHaveLength(9);
    expect(report.hotPathIsolation.directQualityImports).toEqual([]);
    expect(report.hotPathIsolation.isolated).toBe(true);
    expect(report.homogeneous).toBe(true);
    expect(report.nonAuthorizingStatement).toContain('does not change market data');
    expect(report.nonAuthorizingStatement).toContain('entitlements');
    expect(report.nonAuthorizingStatement).toContain('ranking');
  });
});
