import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAN_CONSTRAINED_AUTH_KEYS,
  SupabaseManagementHttpError,
  reconcileAuthRegistrationConfig,
  resolveManagementAccessToken,
  splitAuthConfigByPlan,
} from '../operations/supabaseAuthRegistrationControl.mjs';

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

test('plan-constrained auth settings are isolated from the baseline mutation payload', () => {
  const desired = {
    password_min_length: 12,
    password_hibp_enabled: true,
    security_captcha_enabled: false,
  };
  const result = splitAuthConfigByPlan(desired);

  assert.deepEqual(PLAN_CONSTRAINED_AUTH_KEYS, ['password_hibp_enabled']);
  assert.deepEqual(result.baseline, {
    password_min_length: 12,
    security_captcha_enabled: false,
  });
  assert.deepEqual(result.planConstrained, {
    password_hibp_enabled: true,
  });
});

test('HTTP 402 for leaked-password protection is attested as plan-constrained without blocking baseline convergence', async () => {
  let state = {};
  const request = async (_path, _token, init = {}) => {
    if (init.method === 'PATCH') {
      const payload = JSON.parse(init.body);
      if (Object.prototype.hasOwnProperty.call(payload, 'password_hibp_enabled')) {
        throw new SupabaseManagementHttpError(402);
      }
      state = { ...state, ...payload };
    }
    return { ...state, password_hibp_enabled: false };
  };

  const result = await reconcileAuthRegistrationConfig(canonical, { request });

  assert.ok(result.verifiedKeys.includes('password_min_length'));
  assert.ok(!result.verifiedKeys.includes('password_hibp_enabled'));
  assert.deepEqual(result.planConstraints, [{
    key: 'password_hibp_enabled',
    desiredValue: true,
    state: 'UNAVAILABLE_BY_PLAN',
    httpStatus: 402,
    authority: 'ADR-0031',
  }]);
});

test('non-plan Management API failures remain fail-closed', async () => {
  let call = 0;
  const request = async (_path, _token, init = {}) => {
    call += 1;
    if (init.method === 'PATCH' && init.body.includes('password_hibp_enabled')) {
      throw new SupabaseManagementHttpError(403);
    }
    if (init.method === 'PATCH') {
      return {};
    }
    return call > 1
      ? {
          site_url: 'https://capital-ai.online',
        }
      : {};
  };

  await assert.rejects(
    reconcileAuthRegistrationConfig(canonical, { request }),
    /SUPABASE_MANAGEMENT_HTTP_403|SUPABASE_AUTH_CONFIG_READBACK_MISMATCH/,
  );
});

test('production runtime does not require a Supabase Management API token', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');

  assert.match(
    dockerfile,
    /NODE_OPTIONS=--import=\/app\/server\/runtime\/runtimeArtifactGuard\.mjs/,
  );
  assert.doesNotMatch(dockerfile, /CAPITAL_AI_SUPABASE_AUTH_CONFIG_CONTROL=true/);
  assert.doesNotMatch(
    dockerfile,
    /--import=\/app\/scripts\/operations\/supabaseAuthRegistrationControl\.mjs/,
  );
  assert.doesNotMatch(
    dockerfile,
    /COPY[^\n]*supabaseAuthRegistrationControl\.mjs/,
  );
  assert.doesNotMatch(dockerfile, /COPY[^\n]*\/app\/supabase\/templates/);
});
