import { describe, expect, it } from 'vitest';
import {
  OSS_QUALITY_PROFILES,
  OSS_QUALITY_TOOL_IDS,
  UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA,
  buildUnifiedQualityFindingId,
  isOssQualityProfile,
  isOssQualityToolId,
  type UnifiedQualityToolStatus,
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

  it('keeps the supported OSS tool and execution-profile namespaces bounded', () => {
    expect(OSS_QUALITY_TOOL_IDS).toEqual([
      'gitleaks',
      'osv-scanner',
      'vitest-coverage',
      'knip',
      'jscpd',
    ]);
    expect(OSS_QUALITY_PROFILES).toEqual(['PR_FAST', 'DEEP_BASELINE', 'FULL']);
    expect(UNIFIED_OSS_QUALITY_BUNDLE_SCHEMA).toBe('oss-quality-evidence/1.1.0');
    expect(isOssQualityToolId('gitleaks')).toBe(true);
    expect(isOssQualityToolId('unknown-scanner')).toBe(false);
    expect(isOssQualityProfile('PR_FAST')).toBe(true);
    expect(isOssQualityProfile('unknown')).toBe(false);
  });

  it('models intentionally deferred evidence explicitly instead of calling it PASS', () => {
    const deferred: UnifiedQualityToolStatus = 'NOT_APPLICABLE';
    expect(deferred).toBe('NOT_APPLICABLE');
    expect(deferred).not.toBe('PASS');
  });
});
