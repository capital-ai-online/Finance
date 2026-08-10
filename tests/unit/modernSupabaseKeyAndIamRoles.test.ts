import { describe, expect, it } from 'vitest';
import { resolveEnvironmentValue } from '../../server/env';
import {
  ALL_ROLES,
  ADMIN_ZONE_ROLES,
  DIAGNOSTIC_ZONE_ROLES,
  OPERATIONS_ZONE_ROLES,
  OWNER_ONLY_ROLES,
} from '../../src/platform/Security/types';

describe('modern Supabase secret contract', () => {
  it('prefers finance-secrets.env values over stale service-level env values', () => {
    const resolved = resolveEnvironmentValue('SUPABASE_SECRET_KEY', {
      secretValues: { SUPABASE_SECRET_KEY: 'sb_secret_canonical' },
      environment: { SUPABASE_SECRET_KEY: 'sb_secret_stale' },
    });

    expect(resolved).toBe('sb_secret_canonical');
  });

  it('falls back to process env when the canonical secret file does not contain the key', () => {
    const resolved = resolveEnvironmentValue('SUPABASE_SECRET_KEY', {
      secretValues: {},
      environment: { SUPABASE_SECRET_KEY: 'sb_secret_fallback' },
    });

    expect(resolved).toBe('sb_secret_fallback');
  });
});

describe('AI admin IAM role zoning', () => {
  it('registers dedicated least-privilege diagnostic and operations roles', () => {
    expect(ALL_ROLES).toEqual(expect.arrayContaining([
      'diagnostic_operator',
      'operations_operator',
      'security_auditor',
    ]));
  });

  it('does not grant new operator roles generic admin-zone access', () => {
    expect(ADMIN_ZONE_ROLES).toEqual(['owner', 'admin']);
    expect(ADMIN_ZONE_ROLES).not.toContain('diagnostic_operator');
    expect(ADMIN_ZONE_ROLES).not.toContain('operations_operator');
    expect(ADMIN_ZONE_ROLES).not.toContain('security_auditor');
  });

  it('allows diagnostic roles only into diagnostic coarse zones', () => {
    expect(DIAGNOSTIC_ZONE_ROLES).toContain('diagnostic_operator');
    expect(DIAGNOSTIC_ZONE_ROLES).toContain('security_auditor');
    expect(OPERATIONS_ZONE_ROLES).not.toContain('diagnostic_operator');
    expect(OPERATIONS_ZONE_ROLES).not.toContain('security_auditor');
  });

  it('keeps operations and break-glass boundaries explicit', () => {
    expect(OPERATIONS_ZONE_ROLES).toEqual(['owner', 'admin', 'operations_operator']);
    expect(OWNER_ONLY_ROLES).toEqual(['owner']);
    expect(ALL_ROLES).not.toContain('break_glass' as never);
  });
});
