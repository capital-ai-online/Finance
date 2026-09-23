import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveManagementAccessToken } from '../operations/supabaseAuthRegistrationControl.mjs';

const canonical = 'canonical-management-token-1234567890';
const githubAlias = 'github-management-token-1234567890';
const legacyAlias = 'legacy-management-token-1234567890';

test('Supabase auth registration control prefers the canonical Render management token name', () => {
  const resolved = resolveManagementAccessToken({
    SUPABASE_MANAGEMENT_ACCESS_TOKEN: canonical,
    CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN: githubAlias,
    SUPABASE_ACCESS_TOKEN: legacyAlias,
  });
  assert.deepEqual(resolved, {
    accessToken: canonical,
    source: 'SUPABASE_MANAGEMENT_ACCESS_TOKEN',
  });
});

test('Supabase auth registration control accepts established server-only management aliases', () => {
  assert.deepEqual(
    resolveManagementAccessToken({ CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN: githubAlias }),
    { accessToken: githubAlias, source: 'CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN' },
  );
  assert.deepEqual(
    resolveManagementAccessToken({ SUPABASE_ACCESS_TOKEN: legacyAlias }),
    { accessToken: legacyAlias, source: 'SUPABASE_ACCESS_TOKEN' },
  );
});

test('Supabase auth registration control remains fail-closed without a valid management token', () => {
  assert.throws(
    () => resolveManagementAccessToken({ SUPABASE_ACCESS_TOKEN: 'short' }),
    /SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING/,
  );
});
