/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — store factory.
 * Production fails closed without privileged Supabase (no anon fallback).
 */
import { isPrivilegedSupabaseConfigured } from '../../../../server/db';
import type { ISeoEngineStore } from './ISeoEngineStore';
import { MemorySeoEngineStore } from './MemorySeoEngineStore';
import { SupabaseSeoEngineStore } from './SupabaseSeoEngineStore';

export type CreateSeoEngineStoreOptions = {
  /** Force memory adapter (unit tests). */
  forceMemory?: boolean;
  /** When forcing memory, optionally skip keyword/content seed. */
  seed?: boolean;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function createSeoEngineStore(options?: CreateSeoEngineStoreOptions): ISeoEngineStore {
  if (options?.forceMemory) {
    return new MemorySeoEngineStore({ seed: options.seed });
  }

  if (isPrivilegedSupabaseConfigured()) {
    return new SupabaseSeoEngineStore();
  }

  if (isProduction()) {
    throw new Error(
      '[SeoEngine][SECURITY] Production requires privileged Supabase configuration; '
        + 'memory fallback is forbidden (fail-closed).',
    );
  }

  return new MemorySeoEngineStore({ seed: options?.seed });
}

let singleton: ISeoEngineStore | null = null;

/** Lazy process singleton for HTTP routes. */
export function getSeoEngineStore(): ISeoEngineStore {
  if (!singleton) {
    singleton = createSeoEngineStore();
  }
  return singleton;
}

/** Test helper to clear the process singleton. */
export function resetSeoEngineStoreSingletonForTests(): void {
  singleton = null;
}
