import { describe, expect, it } from 'vitest';
import {
  OSS_QUALITY_TOOL_IDS,
  buildUnifiedQualityFindingId,
  isOssQualityToolId,
} from '../../src/platform/Quality/Findings/UnifiedFindingContract';

describe('UnifiedFindingContract', () => {
  it('creates stable finding identities from tool/rule/location/identity', () => {
    const input = {
      sourceTool: 'osv-scanner' as const,
      ruleId: 'GHSA-example',
      path: 'package-lock.json',
      line: 1,
      identity: 'npm|example|1.0.0|GHSA-example',
    };
    expect(buildUnifiedQualityFindingId(input)).toBe(buildUnifiedQualityFindingId(input));
    expect(buildUnifiedQualityFindingId(input)).toMatch(/^QF-[0-9A-F]{24}$/);
    expect(buildUnifiedQualityFindingId({ ...input, identity: 'different' })).not.toBe(
      buildUnifiedQualityFindingId(input),
    );
  });

  it('keeps the supported OSS tool namespace bounded', () => {
    expect(OSS_QUALITY_TOOL_IDS).toEqual([
      'gitleaks',
      'osv-scanner',
      'vitest-coverage',
      'knip',
      'jscpd',
    ]);
    expect(isOssQualityToolId('gitleaks')).toBe(true);
    expect(isOssQualityToolId('unknown-scanner')).toBe(false);
  });
});
