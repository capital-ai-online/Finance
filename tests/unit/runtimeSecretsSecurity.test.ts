import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateRuntimeSecrets } from '../../server/validateRuntimeSecrets';

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

    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit:${String(code)}`);
    }) as never);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => validateRuntimeSecrets(true)).toThrow('process.exit:1');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('accepts production when the modern Supabase secret and all critical secrets are present', () => {
    clearSecurityTestEnvironment();
    setOtherCriticalSecrets();
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_runtime_contract_test_only';

    const exit = vi.spyOn(process, 'exit');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    expect(() => validateRuntimeSecrets(true)).not.toThrow();
    expect(exit).not.toHaveBeenCalled();
  });
});
