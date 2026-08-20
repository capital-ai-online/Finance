import { describe, expect, it } from 'vitest';
import { FintechValueChainQualityProjection } from '../../src/platform/Quality/ValueChain/FintechValueChainQualityProjection';

describe('FintechValueChainQualityProjection', () => {
  it('keeps all canonical SC-MD-SPT stages structurally connected without Quality hot-path coupling', () => {
    const report = new FintechValueChainQualityProjection().project(process.cwd(), '2026-08-20T00:00:00.000Z');

    expect(report.schemaVersion).toBe('fintech-value-chain-quality/1.0.0');
    expect(report.authority).toBe('SC-MD-SPT-0001');
    expect(report.totalStages).toBe(14);
    expect(report.connectedStages).toBe(14);
    expect(report.stages.every((stage) => stage.status === 'CONNECTED')).toBe(true);
    expect(report.hotPathIsolation.checkedArtifacts).toHaveLength(6);
    expect(report.hotPathIsolation.directQualityImports).toEqual([]);
    expect(report.hotPathIsolation.isolated).toBe(true);
    expect(report.homogeneous).toBe(true);
    expect(report.nonAuthorizingStatement).toContain('does not change market data');
    expect(report.nonAuthorizingStatement).toContain('ranking');
  });
});
