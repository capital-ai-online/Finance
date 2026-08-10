// ESS-0018 Phase 2 / ADR-0051: server/db.ts wird gemockt (gleiches Muster wie
// tests/unit/supabaseScoreEvidenceTool.test.ts), damit keine echte Datenbankverbindung noetig
// ist. Fokus: fail-closed bei jedem Fehler, keine Wildcard-/Fantasie-Capabilities, aktives Grant
// nur wenn nicht widerrufen und nicht abgelaufen.

import { describe, it, expect, vi, beforeEach } from 'vitest';

let selectResult: { data: any[] | null; error: any } = { data: [], error: null };
let insertResult: { data: any; error: any } = { data: { id: 'grant-1' }, error: null };
let updateResult: { data: any; error: any } = { data: { id: 'grant-1' }, error: null };

const mockFrom = vi.fn((table: string) => {
  if (table !== 'capability_grants') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          is: () => ({
            limit: () => Promise.resolve(selectResult),
          }),
        }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve(insertResult),
      }),
    }),
    update: () => ({
      eq: () => ({
        is: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve(updateResult),
          }),
        }),
      }),
    }),
  };
});

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

import { CAPABILITIES, checkCapability, grantCapability, revokeCapability, isKnownCapability } from '../../src/platform/Security/capabilities';
import { isPrivilegedSupabaseConfigured } from '../../server/db';

describe('capabilities (ESS-0018 Phase 2)', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    selectResult = { data: [], error: null };
    insertResult = { data: { id: 'grant-1' }, error: null };
    updateResult = { data: { id: 'grant-1' }, error: null };
    (isPrivilegedSupabaseConfigured as any).mockReturnValue(true);
  });

  it('rejects unknown capability strings - no wildcard, no raw-SQL-shaped names', () => {
    expect(isKnownCapability('supabase.sql.execute')).toBe(false);
    expect(isKnownCapability('supabase.admin.*')).toBe(false);
    expect(isKnownCapability(CAPABILITIES.ADMIN_DIAGNOSTICS_READ)).toBe(true);
  });

  it('fails closed when Supabase is not configured', async () => {
    (isPrivilegedSupabaseConfigured as any).mockReturnValue(false);
    const result = await checkCapability('user-1', CAPABILITIES.ADMIN_DIAGNOSTICS_READ);
    expect(result).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fails closed on a database error rather than defaulting to allow', async () => {
    selectResult = { data: null, error: { message: 'connection reset' } };
    const result = await checkCapability('user-1', CAPABILITIES.ADMIN_DIAGNOSTICS_READ);
    expect(result).toBe(false);
  });

  it('grants access when an active, unexpired row exists', async () => {
    selectResult = { data: [{ id: 'g1', expires_at: null }], error: null };
    expect(await checkCapability('user-1', CAPABILITIES.ADMIN_DIAGNOSTICS_READ)).toBe(true);
  });

  it('denies access once every grant is expired', async () => {
    selectResult = { data: [{ id: 'g1', expires_at: '2000-01-01T00:00:00.000Z' }], error: null };
    expect(await checkCapability('user-1', CAPABILITIES.ADMIN_DIAGNOSTICS_READ)).toBe(false);
  });

  it('grantCapability rejects unknown capabilities before touching the database', async () => {
    await expect(grantCapability({
      capability: 'supabase.sql.execute' as any,
      granteeUserId: 'user-1',
      grantedByUserId: 'owner-1',
    })).rejects.toThrow(/Unbekannte Capability/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('revokeCapability returns false when no matching un-revoked row exists', async () => {
    updateResult = { data: null, error: null };
    expect(await revokeCapability('missing-grant', 'owner-1')).toBe(false);
  });

  it('revokeCapability returns true when a row was updated', async () => {
    updateResult = { data: { id: 'grant-1' }, error: null };
    expect(await revokeCapability('grant-1', 'owner-1')).toBe(true);
  });
});
