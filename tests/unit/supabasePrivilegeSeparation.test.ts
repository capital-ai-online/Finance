import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertPrivilegedSupabaseConfigured,
  isPrivilegedSupabaseConfigured,
  isRlsSupabaseConfigured,
  saveSubscription,
} from '../../server/db';

const KEYS = [
  'NODE_ENV',
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'VITE_SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const originalEnv = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of KEYS) {
    originalEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  originalEnv.clear();
});

describe('Supabase privilege separation', () => {
  it('never treats a publishable key as privileged server configuration', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';

    expect(isRlsSupabaseConfigured()).toBe(true);
    expect(isPrivilegedSupabaseConfigured()).toBe(false);
    expect(() => assertPrivilegedSupabaseConfigured('test write')).toThrow(/fallback is forbidden/i);
  });

  it('recognizes a dedicated server secret independently from publishable credentials', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';

    expect(isPrivilegedSupabaseConfigured()).toBe(true);
    expect(isRlsSupabaseConfigured()).toBe(false);
  });

  it('fails production subscription persistence closed when privileged credentials are absent', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';

    await expect(saveSubscription('00000000-0000-0000-0000-000000000001', 'Enterprise', 'user@example.com'))
      .rejects.toThrow(/publishable\/anon fallback is forbidden/i);
  });
});
