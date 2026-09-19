import { getCleanEnv } from '../env';
import {
  createGeminiResearchShadowRuntime,
  loadGeminiResearchShadowConfig,
  type GeminiResearchServerTransportOptions,
  type GeminiResearchShadowConfig,
  type GeminiResearchShadowRuntime,
} from './geminiResearchTransport';

export const GEMINI_RESEARCH_FREE_TIER_POLICY_VERSION = 'gemini-research-free-tier-policy/1.1.0' as const;
export const GEMINI_RESEARCH_FREE_TIER_MODEL = 'gemini-2.5-flash' as const;
export const GEMINI_RESEARCH_FREE_TIER_VERIFIED_AT = '2026-09-18' as const;
export const GEMINI_RESEARCH_FREE_TIER_DOCUMENTED_SEARCH_RPD = 500 as const;
export const GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP = 100 as const;

// The underlying generic shadow runtime requires a positive technical cost ceiling. In the
// Free-Tier-only wrapper every configured unit price is forced to zero, so this sentinel can never
// authorize spend. It only keeps the generic budget contract internally satisfiable.
const ZERO_COST_TECHNICAL_SENTINEL_USD = 0.000001;

export interface GeminiResearchFreeTierPolicyStatus {
  policyVersion: typeof GEMINI_RESEARCH_FREE_TIER_POLICY_VERSION;
  verifiedAt: typeof GEMINI_RESEARCH_FREE_TIER_VERIFIED_AT;
  freeTierOnly: true;
  paidBillingPermitted: false;
  billingProjectAttested: boolean;
  model: typeof GEMINI_RESEARCH_FREE_TIER_MODEL;
  documentedSearchRpd: typeof GEMINI_RESEARCH_FREE_TIER_DOCUMENTED_SEARCH_RPD;
  localDailyRequestCap: typeof GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP;
}

export interface GeminiResearchFreeTierRuntime extends GeminiResearchShadowRuntime {
  freeTierPolicy: GeminiResearchFreeTierPolicyStatus;
}

export interface GeminiResearchFreeTierRuntimeOptions
  extends Omit<GeminiResearchServerTransportOptions, 'config'> {
  /** Test seam. Production resolves GEMINI_API_KEY through the canonical secret-file loader. */
  resolve?: (key: string) => string;
}

function defaultResolve(key: string): string {
  if (key === 'GEMINI_API_KEY') return getCleanEnv('GEMINI_API_KEY');
  return process.env[key]?.trim() ?? '';
}

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

function resolveFreeTierOnly(value: string): boolean {
  return value.trim() === '' ? true : parseBoolean(value);
}

function boundedDailyRequestBudget(value: string): number {
  const parsed = Number(value);
  const requested = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 50;
  return Math.min(requested, GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP);
}

/**
 * Canonical factory for Gemini Research Shadow execution.
 *
 * This wrapper deliberately does not expose a paid-mode switch. It pins a currently documented
 * Free-Tier model, forces all local unit-cost inputs to zero and requires an explicit operator
 * attestation that the API key belongs to a Gemini Free-Tier project with billing disabled.
 *
 * An API key alone does not encode a trustworthy billing state, so the repository cannot prove
 * this property cryptographically. If billing is later attached to that Google project, the
 * attestation must be revoked before any further shadow traffic is allowed.
 */
export function createGeminiResearchFreeTierRuntime(
  options: GeminiResearchFreeTierRuntimeOptions = {},
): GeminiResearchFreeTierRuntime {
  const resolve = options.resolve ?? defaultResolve;
  const requestedEnabled = parseBoolean(resolve('GEMINI_RESEARCH_SHADOW_ENABLED'));
  const freeTierOnly = resolveFreeTierOnly(resolve('GEMINI_RESEARCH_FREE_TIER_ONLY'));
  const billingProjectAttested = parseBoolean(resolve('GEMINI_RESEARCH_FREE_TIER_ATTESTED'));
  const dailyRequestBudget = boundedDailyRequestBudget(resolve('GEMINI_RESEARCH_DAILY_REQUEST_BUDGET'));

  const policyResolver = (key: string): string => {
    switch (key) {
      case 'GEMINI_RESEARCH_MODEL':
        return GEMINI_RESEARCH_FREE_TIER_MODEL;
      case 'GEMINI_RESEARCH_INPUT_USD_PER_M':
      case 'GEMINI_RESEARCH_OUTPUT_USD_PER_M':
      case 'GEMINI_RESEARCH_SEARCH_USD_PER_1K':
        return '0';
      case 'GEMINI_RESEARCH_DAILY_COST_BUDGET_USD':
        return String(ZERO_COST_TECHNICAL_SENTINEL_USD);
      case 'GEMINI_RESEARCH_DAILY_REQUEST_BUDGET':
        return String(dailyRequestBudget);
      default:
        return resolve(key);
    }
  };

  const base = loadGeminiResearchShadowConfig(policyResolver);
  const configurationErrors = [...base.configurationErrors];
  if (requestedEnabled && !freeTierOnly) {
    configurationErrors.push('GEMINI_RESEARCH_FREE_TIER_ONLY must remain true; paid Gemini research mode is forbidden.');
  }
  if (requestedEnabled && !billingProjectAttested) {
    configurationErrors.push(
      'GEMINI_RESEARCH_FREE_TIER_ATTESTED=true is required after verifying that the Gemini API key belongs to a Free-Tier project with billing disabled.',
    );
  }

  const config: GeminiResearchShadowConfig = Object.freeze({
    ...base,
    enabled: requestedEnabled,
    ready: requestedEnabled && configurationErrors.length === 0,
    configurationErrors: Object.freeze(configurationErrors),
    model: GEMINI_RESEARCH_FREE_TIER_MODEL,
    dailyRequestBudget,
    dailyCostBudgetUsd: ZERO_COST_TECHNICAL_SENTINEL_USD,
    inputUsdPerMillionTokens: 0,
    outputUsdPerMillionTokens: 0,
    googleSearchUsdPerThousandRequests: 0,
  });

  const runtime = createGeminiResearchShadowRuntime({
    config,
    fetchImpl: options.fetchImpl,
    nowMs: options.nowMs,
    telemetrySink: options.telemetrySink,
  });

  return {
    ...runtime,
    freeTierPolicy: Object.freeze({
      policyVersion: GEMINI_RESEARCH_FREE_TIER_POLICY_VERSION,
      verifiedAt: GEMINI_RESEARCH_FREE_TIER_VERIFIED_AT,
      freeTierOnly: true,
      paidBillingPermitted: false,
      billingProjectAttested,
      model: GEMINI_RESEARCH_FREE_TIER_MODEL,
      documentedSearchRpd: GEMINI_RESEARCH_FREE_TIER_DOCUMENTED_SEARCH_RPD,
      localDailyRequestCap: GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP,
    }),
  };
}
