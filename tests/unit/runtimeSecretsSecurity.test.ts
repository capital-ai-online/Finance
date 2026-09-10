import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveEnvironmentValue } from '../../server/env';
import { validateRuntimeSecrets } from '../../server/validateRuntimeSecrets';
import { SECRET_FILE_KEYS } from '../../scripts/security/secretFileManifest';

const TEST_KEYS = [
  'SUPABASE_SECRET_KEY',
  'VITE_SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'VITE_STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'VITE_STRIPE_WEBHOOK_SECRET',
  'TOTP_ENCRYPTION_KEY',
  'VITE_TOTP_ENCRYPTION_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'VITE_ALPHA_VANTAGE_API_KEY',
] as const;

const originalValues = new Map<string, string | undefined>(
  TEST_KEYS.map((key) => [key, process.env[key]]),
);

function clearSecurityTestEnvironment(): void {
  for (const key of TEST_KEYS) delete process.env[key];
}

function setOtherCriticalSecrets(): void {
  process.env.STRIPE_SECRET_KEY = 'sk_test_runtime_contract_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_runtime_contract_123';
  process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);
}

function setModernSupabaseSecret(): void {
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_runtime_contract_test_only';
}

function expectProductionExit(): void {
  const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
    throw new Error(`process.exit:${String(code)}`);
  }) as never);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);

  expect(() => validateRuntimeSecrets(true)).toThrow('process.exit:1');
  expect(exit).toHaveBeenCalledWith(1);
}

afterEach(() => {
  for (const key of TEST_KEYS) {
    const original = originalValues.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
  vi.restoreAllMocks();
});

describe('production runtime secret hardening', () => {
  it('fails closed when only the legacy Supabase service-role key is available', () => {
    clearSecurityTestEnvironment();
    setOtherCriticalSecrets();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy_service_role_test_only';

    expectProductionExit();
  });

  it('rejects VITE_* aliases for every server-only critical secret', () => {
    clearSecurityTestEnvironment();
    setOtherCriticalSecrets();
    process.env.VITE_SUPABASE_SECRET_KEY = 'sb_secret_vite_alias_test_only';
    expectProductionExit();
    vi.restoreAllMocks();

    clearSecurityTestEnvironment();
    setModernSupabaseSecret();
    process.env.VITE_STRIPE_SECRET_KEY = 'sk_test_vite_alias_only';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_runtime_contract_123';
    process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);
    expectProductionExit();
    vi.restoreAllMocks();

    clearSecurityTestEnvironment();
    setModernSupabaseSecret();
    process.env.STRIPE_SECRET_KEY = 'sk_test_runtime_contract_123';
    process.env.VITE_STRIPE_WEBHOOK_SECRET = 'whsec_vite_alias_only';
    process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);
    expectProductionExit();
    vi.restoreAllMocks();

    clearSecurityTestEnvironment();
    setModernSupabaseSecret();
    process.env.STRIPE_SECRET_KEY = 'sk_test_runtime_contract_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_runtime_contract_123';
    process.env.VITE_TOTP_ENCRYPTION_KEY = 'b'.repeat(64);
    expectProductionExit();
  });

  it('does not resolve server-only secrets across the VITE namespace in either direction', () => {
    expect(resolveEnvironmentValue('SUPABASE_SECRET_KEY', {
      secretValues: {},
      environment: { VITE_SUPABASE_SECRET_KEY: 'vite-only-value' },
    })).toBe('');

    expect(resolveEnvironmentValue('VITE_SUPABASE_SECRET_KEY', {
      secretValues: { SUPABASE_SECRET_KEY: 'server-secret-file-value' },
      environment: { SUPABASE_SECRET_KEY: 'server-env-value' },
    })).toBe('');
  });

  it('keeps the Cloudflare to Render edge proof in the canonical server secret boundary', () => {
    expect(SECRET_FILE_KEYS).toContain('CAPITAL_AI_EDGE_TRUST_SECRET');

    expect(resolveEnvironmentValue('CAPITAL_AI_EDGE_TRUST_SECRET', {
      secretValues: {},
      environment: { VITE_CAPITAL_AI_EDGE_TRUST_SECRET: 'vite-only-test-value' },
    })).toBe('');

    expect(resolveEnvironmentValue('VITE_CAPITAL_AI_EDGE_TRUST_SECRET', {
      secretValues: { CAPITAL_AI_EDGE_TRUST_SECRET: 'server-secret-file-test-value' },
      environment: { CAPITAL_AI_EDGE_TRUST_SECRET: 'server-env-test-value' },
    })).toBe('');
  });

  it('keeps Alpha Vantage canonical-only in the server secret manifest and VITE boundary', () => {
    expect(SECRET_FILE_KEYS).toContain('ALPHA_VANTAGE_API_KEY');
    expect(SECRET_FILE_KEYS).not.toContain('ALPHA_VANTAGE_KEY');

    expect(resolveEnvironmentValue('ALPHA_VANTAGE_API_KEY', {
      secretValues: {},
      environment: { VITE_ALPHA_VANTAGE_API_KEY: 'vite-only-test-value' },
    })).toBe('');

    expect(resolveEnvironmentValue('VITE_ALPHA_VANTAGE_API_KEY', {
      secretValues: { ALPHA_VANTAGE_API_KEY: 'server-secret-file-test-value' },
      environment: { ALPHA_VANTAGE_API_KEY: 'server-env-test-value' },
    })).toBe('');
  });

  it('accepts production when the modern Supabase secret and all critical secrets are present', () => {
    clearSecurityTestEnvironment();
    setOtherCriticalSecrets();
    setModernSupabaseSecret();

    const exit = vi.spyOn(process, 'exit');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(() => validateRuntimeSecrets(true)).not.toThrow();
    expect(exit).not.toHaveBeenCalled();
  });
});
