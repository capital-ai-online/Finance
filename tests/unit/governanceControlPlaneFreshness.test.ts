import { describe, expect, it } from 'vitest';
import {
  extractAuthorityMetadata,
  extractCurrentStateMainBaseline,
  isCurrentStateProjectionPath,
  validateAuthorityProjection,
  validateCurrentStateProjectionFreshness,
} from '../../scripts/governance/controlPlaneFreshnessRules.mjs';

const MAIN_SHA = 'a'.repeat(40);

describe('Governance Control Plane freshness/version rules', () => {
  it('reads authority version separately from a newer documentation projection version', () => {
    const metadata = extractAuthorityMetadata({
      text: [
        '**Authority ID:** `AUTH-GOV-CONTROL-PLANE`',
        '**Authority version:** `1.2.0`',
        '**Projection version:** `1.3.1`',
      ].join('\n'),
    });

    expect(metadata).toEqual({
      authorityId: 'AUTH-GOV-CONTROL-PLANE',
      version: '1.2.0',
    });
  });

  it('reads machine-readable authority metadata from a manifest', () => {
    expect(extractAuthorityMetadata({
      jsonValue: {
        authorityId: 'AUTH-GOV-CONTROL-PLANE',
        version: '1.2.0',
      },
    })).toEqual({
      authorityId: 'AUTH-GOV-CONTROL-PLANE',
      version: '1.2.0',
    });
  });

  it('fails closed on authority target version drift', () => {
    const findings = validateAuthorityProjection({
      filePath: 'docs/governance/control-plane/README.md',
      expectedAuthorityId: 'AUTH-GOV-CONTROL-PLANE',
      expectedVersion: '1.2.0',
      text: [
        '**Authority ID:** `AUTH-GOV-CONTROL-PLANE`',
        '**Authority version:** `1.3.1`',
      ].join('\n'),
      requireAuthorityId: true,
      requireVersion: true,
    });

    expect(findings.map((finding) => finding.code)).toContain('AUTHORITY_TARGET_VERSION_MISMATCH');
  });

  it('fails closed on authority identity drift', () => {
    const findings = validateAuthorityProjection({
      filePath: 'src/platform/Governance/manifest.json',
      expectedAuthorityId: 'AUTH-GOV-CONTROL-PLANE',
      expectedVersion: '1.2.0',
      jsonValue: {
        authorityId: 'AUTH-GOV-PARALLEL-PLANE',
        version: '1.2.0',
      },
      requireAuthorityId: true,
      requireVersion: true,
    });

    expect(findings.map((finding) => finding.code)).toContain('AUTHORITY_TARGET_ID_MISMATCH');
  });

  it('recognizes only canonical current-state/project task projections', () => {
    expect(isCurrentStateProjectionPath('docs/architecture/ROADMAP.md')).toBe(true);
    expect(isCurrentStateProjectionPath('docs/projects/governance/ROADMAP.md')).toBe(true);
    expect(isCurrentStateProjectionPath('docs/projects/governance/TASK_REGISTER.md')).toBe(true);
    expect(isCurrentStateProjectionPath('docs/projects/governance/README.md')).toBe(false);
    expect(isCurrentStateProjectionPath('docs/evidence/example.md')).toBe(false);
  });

  it('reads a recognized full current-main baseline', () => {
    const text = `**Baseline:** \`main@${MAIN_SHA}\``;
    expect(extractCurrentStateMainBaseline(text)).toBe(MAIN_SHA);
  });

  it('accepts a changed projection bound to the exact current main', () => {
    const findings = validateCurrentStateProjectionFreshness({
      filePath: 'docs/projects/governance/ROADMAP.md',
      text: `**Baseline:** \`main@${MAIN_SHA}\``,
      expectedMainSha: MAIN_SHA,
    });

    expect(findings).toEqual([]);
  });

  it('fails closed on a stale changed projection baseline', () => {
    const findings = validateCurrentStateProjectionFreshness({
      filePath: 'docs/projects/governance/TASK_REGISTER.md',
      text: `**Current correlation baseline:** \`main@${'b'.repeat(40)}\``,
      expectedMainSha: MAIN_SHA,
    });

    expect(findings.map((finding) => finding.code)).toContain('CURRENT_STATE_PROJECTION_BASELINE_STALE');
  });

  it('fails closed when a changed projection omits its current-main baseline', () => {
    const findings = validateCurrentStateProjectionFreshness({
      filePath: 'docs/architecture/ROADMAP.md',
      text: '# Current-State Index\n\nNo baseline here.',
      expectedMainSha: MAIN_SHA,
    });

    expect(findings.map((finding) => finding.code)).toContain('CURRENT_STATE_PROJECTION_BASELINE_MISSING');
  });
});
