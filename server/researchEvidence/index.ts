export {
  GEMINI_RESEARCH_FREE_TIER_DOCUMENTED_SEARCH_RPD,
  GEMINI_RESEARCH_FREE_TIER_LOCAL_DAILY_REQUEST_CAP,
  GEMINI_RESEARCH_FREE_TIER_MODEL,
  GEMINI_RESEARCH_FREE_TIER_POLICY_VERSION,
  GEMINI_RESEARCH_FREE_TIER_VERIFIED_AT,
  createGeminiResearchFreeTierRuntime,
} from './geminiResearchFreeTierRuntime';
export type {
  GeminiResearchFreeTierPolicyStatus,
  GeminiResearchFreeTierRuntime,
  GeminiResearchFreeTierRuntimeOptions,
} from './geminiResearchFreeTierRuntime';

// Raw transport primitives remain available by explicit module path for tests/internal
// implementation work. The package-level server entry point intentionally exposes only the
// Free-Tier-only factory so a future consumer cannot opt into paid Gemini billing by accident.
export {
  GEMINI_INTERACTIONS_ENDPOINT,
  GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
  GeminiResearchShadowError,
  getGeminiResearchShadowTelemetry,
  resetGeminiResearchShadowTelemetry,
} from './geminiResearchTransport';
export type {
  GeminiResearchShadowErrorCode,
  GeminiResearchShadowRuntime,
  GeminiResearchShadowState,
  GeminiResearchShadowStatus,
} from './geminiResearchTransport';
