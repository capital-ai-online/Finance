import { getCleanEnv } from '../env';
import { isSupabaseConfigured } from '../db';
import { runIamSchemaHealthCheck } from '../../src/platform/Security/authMiddleware';
import { isAnthropicConfigured } from '../anthropicClient';
import { isOpenAIConfigured } from '../openaiClient';
import { getStripeConfigurationStatus, type StripeConfigurationStatus } from './renderRuntimeSafety';
import { getProcessHealthSnapshot } from './processHealth';

export interface BusinessReadinessInput {
  processHealthy: boolean;
  supabaseConfigured: boolean;
  iamSchemaHealthy: boolean;
  stripe: StripeConfigurationStatus;
  optionalProviders: {
    anthropic: boolean;
    openai: boolean;
  };
}

export interface BusinessReadinessSnapshot {
  status: 'ready' | 'not-ready';
  ready: boolean;
  checkedAt: string;
  blockingChecks: {
    processHealthy: boolean;
    supabaseConfigured: boolean;
    iamSchemaHealthy: boolean;
    stripeCoreConfigured: boolean;
    stripeCatalogConfigured: boolean;
  };
  capabilities: {
    billing: StripeConfigurationStatus;
    optionalProviders: BusinessReadinessInput['optionalProviders'];
  };
  semantics: {
    livenessEndpoint: '/healthz';
    strictReadinessEndpoint: '/readyz';
    readinessProjectionEndpoint: '/healthz/readiness';
    externalMarketDataProvidersAreNotProbed: true;
  };
}

const REQUIRED_STRIPE_CATALOG_KEYS: Array<keyof StripeConfigurationStatus> = [
  'starterMonthlyConfigured',
  'starterYearlyConfigured',
  'proMonthlyConfigured',
  'proYearlyConfigured',
  'enterpriseConfigured',
  'founderConfigured',
  'pdfExportConfigured',
];

export function evaluateBusinessReadiness(
  input: BusinessReadinessInput,
  checkedAt = new Date().toISOString(),
): BusinessReadinessSnapshot {
  const stripeCoreConfigured = input.stripe.secretKeyConfigured
    && input.stripe.publishableKeyConfigured
    && input.stripe.webhookSecretConfigured;
  const stripeCatalogConfigured = REQUIRED_STRIPE_CATALOG_KEYS.every((key) => input.stripe[key]);

  const blockingChecks = {
    processHealthy: input.processHealthy,
    supabaseConfigured: input.supabaseConfigured,
    iamSchemaHealthy: input.iamSchemaHealthy,
    stripeCoreConfigured,
    stripeCatalogConfigured,
  };
  const ready = Object.values(blockingChecks).every(Boolean);

  return {
    status: ready ? 'ready' : 'not-ready',
    ready,
    checkedAt,
    blockingChecks,
    capabilities: {
      billing: input.stripe,
      optionalProviders: input.optionalProviders,
    },
    semantics: {
      livenessEndpoint: '/healthz',
      strictReadinessEndpoint: '/readyz',
      readinessProjectionEndpoint: '/healthz/readiness',
      externalMarketDataProvidersAreNotProbed: true,
    },
  };
}

interface ReadinessCacheEntry {
  expiresAt: number;
  snapshot: BusinessReadinessSnapshot;
}

let cache: ReadinessCacheEntry | null = null;
const READINESS_CACHE_MS = 30_000;

/**
 * Runtime readiness intentionally probes only a dependency already used as a fail-closed
 * authorization boundary: the Supabase IAM schema. It does not call market-data or AI providers,
 * because their quotas/outages must degrade the affected capability rather than trigger a Render
 * restart loop. Secret/key values are never returned; diagnostics expose booleans only.
 *
 * A latched fatal process event bypasses the normal readiness cache immediately. No new external
 * dependency probe is started during fatal shutdown; the process is simply projected not-ready
 * until the existing bounded SIGTERM path terminates it and Render supervision restarts it.
 */
export async function probeBusinessReadiness(now = Date.now()): Promise<BusinessReadinessSnapshot> {
  const processHealthy = getProcessHealthSnapshot().healthy;
  if (!processHealthy) {
    if (cache) {
      return {
        ...cache.snapshot,
        status: 'not-ready',
        ready: false,
        checkedAt: new Date(now).toISOString(),
        blockingChecks: {
          ...cache.snapshot.blockingChecks,
          processHealthy: false,
        },
      };
    }

    return evaluateBusinessReadiness({
      processHealthy: false,
      supabaseConfigured: isSupabaseConfigured(),
      iamSchemaHealthy: false,
      stripe: getStripeConfigurationStatus(getCleanEnv),
      optionalProviders: {
        anthropic: isAnthropicConfigured(),
        openai: isOpenAIConfigured(),
      },
    }, new Date(now).toISOString());
  }

  if (cache && cache.expiresAt > now) return cache.snapshot;

  const supabaseConfigured = isSupabaseConfigured();
  const iamSchemaHealthy = supabaseConfigured ? await runIamSchemaHealthCheck() : false;
  const stripe = getStripeConfigurationStatus(getCleanEnv);

  const snapshot = evaluateBusinessReadiness({
    processHealthy: true,
    supabaseConfigured,
    iamSchemaHealthy,
    stripe,
    optionalProviders: {
      anthropic: isAnthropicConfigured(),
      openai: isOpenAIConfigured(),
    },
  });

  cache = { expiresAt: now + READINESS_CACHE_MS, snapshot };
  return snapshot;
}

export function clearBusinessReadinessCacheForTests(): void {
  cache = null;
}
