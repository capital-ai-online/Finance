import { getCleanEnv } from '../env';
import { CircuitBreaker } from '../../src/platform/MarketData/CircuitBreaker';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';
import { recordProviderHealth } from '../../src/platform/Supervisor/providerHealth';
import {
  createTelemetryRecord,
  type TelemetryRecord,
} from '../../src/platform/Telemetry/contracts';
import {
  GeminiResearchEvidenceAdapter,
  type GeminiResearchProviderCitation,
  type GeminiResearchTransport,
  type GeminiResearchTransportClaim,
  type GeminiResearchTransportRequest,
  type GeminiResearchTransportResponse,
} from '../../src/platform/ResearchEvidence/GeminiResearchEvidenceAdapter';

export const GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION = 'gemini-research-shadow/1.0.0' as const;
export const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions' as const;
const PROVIDER_ID = 'GeminiResearch';
const CAPABILITY = 'research-evidence-shadow';
const TELEMETRY_LIMIT = 500;

export type GeminiResearchShadowState =
  | 'DISABLED'
  | 'NOT_CONFIGURED'
  | 'READY'
  | 'RATE_LIMITED'
  | 'BUDGET_EXHAUSTED'
  | 'QUOTA_DORMANT'
  | 'CIRCUIT_OPEN'
  | 'UNAVAILABLE';

export type GeminiResearchShadowErrorCode =
  | 'FEATURE_DISABLED'
  | 'NOT_CONFIGURED'
  | 'RATE_BUDGET_EXCEEDED'
  | 'DAILY_BUDGET_EXCEEDED'
  | 'CIRCUIT_OPEN'
  | 'AUTH_ERROR'
  | 'PROVIDER_RATE_LIMITED'
  | 'FREE_TIER_QUOTA_DORMANT'
  | 'SCHEMA_ERROR'
  | 'TRANSPORT_ERROR'
  | 'PROVIDER_ERROR';

export class GeminiResearchShadowError extends Error {
  public constructor(
    public readonly code: GeminiResearchShadowErrorCode,
    message: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'GeminiResearchShadowError';
  }
}

export interface GeminiResearchShadowConfig {
  runtimeVersion: typeof GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION;
  enabled: boolean;
  ready: boolean;
  configurationErrors: readonly string[];
  apiKey: string | null;
  model: string | null;
  timeoutMs: number;
  requestsPerMinute: number;
  dailyRequestBudget: number;
  dailyTokenBudget: number;
  dailyCostBudgetUsd: number | null;
  inputUsdPerMillionTokens: number | null;
  outputUsdPerMillionTokens: number | null;
  googleSearchUsdPerThousandRequests: number | null;
  circuitFailureThreshold: number;
  circuitCooldownMs: number;
  maxOutputTokens: number;
  thinkingLevel: 'minimal' | 'low';
}

export interface GeminiResearchShadowBudgetSnapshot {
  day: string;
  requests: number;
  tokens: number;
  estimatedCostUsd: number;
  rateRemaining: number | null;
  rateResetAt: string | null;
}

export interface GeminiResearchShadowStatus {
  runtimeVersion: typeof GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION;
  state: GeminiResearchShadowState;
  enabled: boolean;
  ready: boolean;
  model: string | null;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  budget: GeminiResearchShadowBudgetSnapshot;
  lastObservedAt: string;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: GeminiResearchShadowErrorCode | null;
  lastErrorMessage: string | null;
  quotaDormantUntil: string | null;
}

export type GeminiResearchTelemetrySink = (record: TelemetryRecord) => void;

export interface GeminiResearchServerTransportOptions {
  config?: GeminiResearchShadowConfig;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  telemetrySink?: GeminiResearchTelemetrySink;
}

export interface GeminiResearchShadowRuntime {
  config: GeminiResearchShadowConfig;
  transport: GeminiResearchServerTransport | null;
  adapter: GeminiResearchEvidenceAdapter | null;
  status: () => GeminiResearchShadowStatus;
}

interface GeminiUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalThoughtTokens: number;
  totalToolUseTokens: number;
  totalTokens: number;
  googleSearchCalls: number;
}

interface DailyBudgetState {
  day: string;
  requests: number;
  tokens: number;
  estimatedCostUsd: number;
}

interface ModelTextBlock {
  text: string;
  annotations: unknown[];
}

interface ParsedClaim {
  field: string;
  value: unknown;
  unit?: string;
  observedAt?: string;
  extractionConfidence?: number;
}

const telemetryLedger: TelemetryRecord[] = [];

function pushTelemetry(record: TelemetryRecord): void {
  telemetryLedger.push(record);
  if (telemetryLedger.length > TELEMETRY_LIMIT) telemetryLedger.shift();
}

export function getGeminiResearchShadowTelemetry(): TelemetryRecord[] {
  return telemetryLedger.map((record) => ({ ...record, context: { ...record.context }, attributes: record.attributes ? { ...record.attributes } : undefined }));
}

export function resetGeminiResearchShadowTelemetry(): void {
  telemetryLedger.length = 0;
}

function defaultTelemetrySink(record: TelemetryRecord): void {
  pushTelemetry(record);
  // Deliberately log only the already-sanitized telemetry record. No prompts, URLs or secrets.
  console.info('[GeminiResearchShadow]', JSON.stringify(record));
}

function parseBoolean(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

function parseInteger(value: string, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function parseNonNegativeNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function resolveRuntimeEnv(key: string): string {
  if (key === 'GEMINI_API_KEY') return getCleanEnv('GEMINI_API_KEY');
  return process.env[key]?.trim() ?? '';
}

export function loadGeminiResearchShadowConfig(
  resolve: (key: string) => string = resolveRuntimeEnv,
): GeminiResearchShadowConfig {
  const enabled = parseBoolean(resolve('GEMINI_RESEARCH_SHADOW_ENABLED'));
  const apiKey = resolve('GEMINI_API_KEY') || null;
  const model = resolve('GEMINI_RESEARCH_MODEL') || null;
  const inputUsdPerMillionTokens = parseNonNegativeNumber(resolve('GEMINI_RESEARCH_INPUT_USD_PER_M'));
  const outputUsdPerMillionTokens = parseNonNegativeNumber(resolve('GEMINI_RESEARCH_OUTPUT_USD_PER_M'));
  const googleSearchUsdPerThousandRequests = parseNonNegativeNumber(resolve('GEMINI_RESEARCH_SEARCH_USD_PER_1K'));
  const dailyCostBudgetUsd = parseNonNegativeNumber(resolve('GEMINI_RESEARCH_DAILY_COST_BUDGET_USD'));

  const configurationErrors: string[] = [];
  if (enabled) {
    if (!apiKey) configurationErrors.push('GEMINI_API_KEY is required when Gemini research shadow mode is enabled.');
    if (!model) configurationErrors.push('GEMINI_RESEARCH_MODEL is required when Gemini research shadow mode is enabled.');
    if (dailyCostBudgetUsd === null || dailyCostBudgetUsd <= 0) {
      configurationErrors.push('GEMINI_RESEARCH_DAILY_COST_BUDGET_USD must be configured to a positive value before activation.');
    }
    if (inputUsdPerMillionTokens === null || outputUsdPerMillionTokens === null) {
      configurationErrors.push('GEMINI_RESEARCH_INPUT_USD_PER_M / GEMINI_RESEARCH_OUTPUT_USD_PER_M must be configured before activation.');
    }
    if (googleSearchUsdPerThousandRequests === null) {
      configurationErrors.push('GEMINI_RESEARCH_SEARCH_USD_PER_1K must be explicitly configured before activation (zero is allowed when contract/quota makes search marginal cost zero).');
    }
  }

  return Object.freeze({
    runtimeVersion: GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
    enabled,
    ready: enabled && configurationErrors.length === 0,
    configurationErrors: Object.freeze(configurationErrors),
    apiKey,
    model,
    timeoutMs: parseInteger(resolve('GEMINI_RESEARCH_TIMEOUT_MS'), 8_000, 500, 30_000),
    requestsPerMinute: parseInteger(resolve('GEMINI_RESEARCH_REQUESTS_PER_MINUTE'), 3, 1, 60),
    dailyRequestBudget: parseInteger(resolve('GEMINI_RESEARCH_DAILY_REQUEST_BUDGET'), 50, 1, 10_000),
    dailyTokenBudget: parseInteger(resolve('GEMINI_RESEARCH_DAILY_TOKEN_BUDGET'), 250_000, 1_000, 100_000_000),
    dailyCostBudgetUsd,
    inputUsdPerMillionTokens,
    outputUsdPerMillionTokens,
    googleSearchUsdPerThousandRequests,
    circuitFailureThreshold: parseInteger(resolve('GEMINI_RESEARCH_CIRCUIT_FAILURE_THRESHOLD'), 3, 1, 20),
    circuitCooldownMs: parseInteger(resolve('GEMINI_RESEARCH_CIRCUIT_COOLDOWN_MS'), 60_000, 1_000, 3_600_000),
    maxOutputTokens: parseInteger(resolve('GEMINI_RESEARCH_MAX_OUTPUT_TOKENS'), 1_200, 128, 8_192),
    thinkingLevel: resolve('GEMINI_RESEARCH_THINKING_LEVEL') === 'minimal' ? 'minimal' : 'low',
  });
}

function utcDay(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

class GeminiResearchShadowBudget {
  private daily: DailyBudgetState;
  private readonly rateBudget: RateLimitBudget;
  private rateRemaining: number | null = null;
  private rateResetAtMs: number | null = null;

  public constructor(
    private readonly config: GeminiResearchShadowConfig,
    private readonly nowMs: () => number,
  ) {
    this.daily = { day: utcDay(this.nowMs()), requests: 0, tokens: 0, estimatedCostUsd: 0 };
    this.rateBudget = new RateLimitBudget({
      capacity: config.requestsPerMinute,
      windowMs: 60_000,
      nowMs,
    });
  }

  private rollDay(): void {
    const today = utcDay(this.nowMs());
    if (today !== this.daily.day) {
      this.daily = { day: today, requests: 0, tokens: 0, estimatedCostUsd: 0 };
    }
  }

  public reserveRequest(): void {
    this.rollDay();
    if (this.daily.requests >= this.config.dailyRequestBudget) {
      throw new GeminiResearchShadowError('DAILY_BUDGET_EXCEEDED', 'Gemini research daily request budget is exhausted.');
    }
    if (this.daily.tokens >= this.config.dailyTokenBudget) {
      throw new GeminiResearchShadowError('DAILY_BUDGET_EXCEEDED', 'Gemini research daily token budget is exhausted.');
    }
    if (
      this.config.dailyCostBudgetUsd !== null
      && this.daily.estimatedCostUsd >= this.config.dailyCostBudgetUsd
    ) {
      throw new GeminiResearchShadowError('DAILY_BUDGET_EXCEEDED', 'Gemini research daily cost budget is exhausted.');
    }

    const rate = this.rateBudget.tryConsume(PROVIDER_ID, CAPABILITY);
    this.rateRemaining = rate.remaining;
    this.rateResetAtMs = rate.resetAtMs;
    if (!rate.allowed) {
      throw new GeminiResearchShadowError('RATE_BUDGET_EXCEEDED', 'Gemini research local request-rate budget is exhausted.');
    }
    this.daily.requests += 1;
  }

  public recordUsage(tokens: number, estimatedCostUsd: number): void {
    this.rollDay();
    this.daily.tokens += Math.max(0, Math.floor(tokens));
    this.daily.estimatedCostUsd += Math.max(0, estimatedCostUsd);
  }

  public snapshot(): GeminiResearchShadowBudgetSnapshot {
    this.rollDay();
    return {
      day: this.daily.day,
      requests: this.daily.requests,
      tokens: this.daily.tokens,
      estimatedCostUsd: Number(this.daily.estimatedCostUsd.toFixed(6)),
      rateRemaining: this.rateRemaining,
      rateResetAt: this.rateResetAtMs === null ? null : new Date(this.rateResetAtMs).toISOString(),
    };
  }
}

function asFiniteInt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function parseUsage(payload: any): GeminiUsage {
  const usage = payload?.usage ?? {};
  const grounding = Array.isArray(usage?.grounding_tool_count) ? usage.grounding_tool_count : [];
  const googleSearchCalls = grounding.reduce((sum: number, entry: any) => {
    return entry?.type === 'google_search' ? sum + asFiniteInt(entry?.count) : sum;
  }, 0);
  return {
    totalInputTokens: asFiniteInt(usage?.total_input_tokens),
    totalOutputTokens: asFiniteInt(usage?.total_output_tokens),
    totalThoughtTokens: asFiniteInt(usage?.total_thought_tokens),
    totalToolUseTokens: asFiniteInt(usage?.total_tool_use_tokens),
    totalTokens: asFiniteInt(usage?.total_tokens),
    googleSearchCalls,
  };
}

function estimateCostUsd(config: GeminiResearchShadowConfig, usage: GeminiUsage): number {
  if (
    config.inputUsdPerMillionTokens === null
    || config.outputUsdPerMillionTokens === null
    || config.googleSearchUsdPerThousandRequests === null
  ) {
    throw new GeminiResearchShadowError('NOT_CONFIGURED', 'Gemini research cost policy is incomplete.');
  }
  const billableInputTokens = usage.totalInputTokens + usage.totalToolUseTokens;
  const billableOutputTokens = usage.totalOutputTokens + usage.totalThoughtTokens;
  const tokenCost = (billableInputTokens / 1_000_000) * config.inputUsdPerMillionTokens
    + (billableOutputTokens / 1_000_000) * config.outputUsdPerMillionTokens;
  const searchCost = (usage.googleSearchCalls / 1_000) * config.googleSearchUsdPerThousandRequests;
  return tokenCost + searchCost;
}

function buildInteractionInput(request: GeminiResearchTransportRequest): string {
  const lines = [
    `Asset ID: ${request.assetId}`,
    `Symbol: ${request.symbol}`,
    `Asset class: ${request.assetClass}`,
    `Requested fields: ${request.fields.join(', ')}`,
    `Research task: ${request.query}`,
  ];
  if (request.urls.length > 0) {
    lines.push('Explicit public source URLs to inspect:');
    request.urls.forEach((url) => lines.push(`- ${url}`));
  }
  lines.push('Return only the structured claim JSON required by the response schema. Do not output source URLs inside JSON.');
  return lines.join('\n');
}

function extractModelTextBlocks(payload: any): ModelTextBlock[] {
  if (!Array.isArray(payload?.steps)) return [];
  const blocks: ModelTextBlock[] = [];
  for (const step of payload.steps) {
    if (step?.type !== 'model_output' || !Array.isArray(step?.content)) continue;
    for (const content of step.content) {
      if (content?.type !== 'text' || typeof content?.text !== 'string' || !content.text.trim()) continue;
      blocks.push({ text: content.text, annotations: Array.isArray(content.annotations) ? content.annotations : [] });
    }
  }
  return blocks;
}

function normalizeParsedClaims(value: unknown): ParsedClaim[] {
  if (!value || typeof value !== 'object') return [];
  const claims = (value as any).claims;
  if (!Array.isArray(claims)) return [];
  return claims.slice(0, 100).flatMap((claim: any) => {
    if (!claim || typeof claim !== 'object' || typeof claim.field !== 'string' || !claim.field.trim()) return [];
    const primitive = claim.value === null || ['string', 'number', 'boolean'].includes(typeof claim.value);
    if (!primitive || (typeof claim.value === 'number' && !Number.isFinite(claim.value))) return [];
    return [{
      field: claim.field.trim().slice(0, 128),
      value: claim.value,
      unit: typeof claim.unit === 'string' ? claim.unit.trim().slice(0, 64) : undefined,
      observedAt: typeof claim.observedAt === 'string' ? claim.observedAt.trim().slice(0, 64) : undefined,
      extractionConfidence: typeof claim.extractionConfidence === 'number' && Number.isFinite(claim.extractionConfidence)
        ? claim.extractionConfidence
        : undefined,
    } satisfies ParsedClaim];
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findClaimObjectSpan(text: string, field: string, fromCharIndex: number): { startByte: number; endByte: number; nextCharIndex: number } | null {
  const encodedField = JSON.stringify(field);
  const pattern = new RegExp(`"field"\\s*:\\s*${escapeRegExp(encodedField)}`, 'g');
  pattern.lastIndex = fromCharIndex;
  const match = pattern.exec(text);
  if (!match) return null;
  const startChar = text.lastIndexOf('{', match.index);
  if (startChar < 0) return null;

  let inString = false;
  let escaped = false;
  let depth = 0;
  for (let i = startChar; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          startByte: Buffer.byteLength(text.slice(0, startChar), 'utf8'),
          endByte: Buffer.byteLength(text.slice(0, i + 1), 'utf8'),
          nextCharIndex: i + 1,
        };
      }
    }
  }
  return null;
}

function extractProviderCitations(block: ModelTextBlock): GeminiResearchProviderCitation[] {
  return block.annotations.flatMap((annotation: any) => {
    if (annotation?.type !== 'url_citation' || typeof annotation?.url !== 'string' || !annotation.url.trim()) return [];
    return [{
      url: annotation.url.trim(),
      title: typeof annotation.title === 'string' ? annotation.title.trim().slice(0, 300) : undefined,
      startIndex: typeof annotation.start_index === 'number' ? annotation.start_index : undefined,
      endIndex: typeof annotation.end_index === 'number' ? annotation.end_index : undefined,
    } satisfies GeminiResearchProviderCitation];
  });
}

function spansOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function bindClaimsToProviderCitations(
  text: string,
  parsedClaims: ParsedClaim[],
  citations: GeminiResearchProviderCitation[],
): GeminiResearchTransportClaim[] {
  const cursorByField = new Map<string, number>();
  return parsedClaims.map((claim) => {
    const startAt = cursorByField.get(claim.field) ?? 0;
    const span = findClaimObjectSpan(text, claim.field, startAt);
    if (span) cursorByField.set(claim.field, span.nextCharIndex);
    const providerCitationIndexes = span
      ? citations.flatMap((citation, index) => {
          if (citation.startIndex === undefined || citation.endIndex === undefined) return [];
          return spansOverlap(span.startByte, span.endByte, citation.startIndex, citation.endIndex) ? [index] : [];
        })
      : [];
    return {
      ...claim,
      providerCitationIndexes: [...new Set(providerCitationIndexes)],
    } satisfies GeminiResearchTransportClaim;
  });
}

function classifyHttpFailure(status: number): GeminiResearchShadowErrorCode {
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (status === 429) return 'PROVIDER_RATE_LIMITED';
  return status >= 500 ? 'TRANSPORT_ERROR' : 'PROVIDER_ERROR';
}

function parseRetryAfterMs(value: string | null, nowMs: number): number | null {
  if (!value?.trim()) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return nowMs + Math.ceil(seconds * 1_000);
  const absolute = Date.parse(value);
  return Number.isFinite(absolute) && absolute > nowMs ? absolute : null;
}

function nextPacificQuotaResetMs(nowMs: number): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(nowMs));
  const value = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  const localDate = new Date(Date.UTC(value('year'), value('month') - 1, value('day')));
  localDate.setUTCDate(localDate.getUTCDate() + 1);

  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const day = localDate.getUTCDate();
  const probe = new Date(Date.UTC(year, month, day, 8));
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(probe).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-8';
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offsetPart);
  const sign = match?.[1] === '+' ? 1 : -1;
  const hours = Number(match?.[2] ?? 8);
  const minutes = Number(match?.[3] ?? 0);
  const offsetMs = sign * (hours * 60 + minutes) * 60_000;
  return Date.UTC(year, month, day) - offsetMs;
}

export class GeminiResearchServerTransport implements GeminiResearchTransport {
  private readonly fetchImpl: typeof fetch;
  private readonly nowMs: () => number;
  private readonly telemetrySink: GeminiResearchTelemetrySink;
  private readonly circuit: CircuitBreaker;
  private readonly budget: GeminiResearchShadowBudget;
  private lastSuccessAt: string | null = null;
  private lastFailureAt: string | null = null;
  private lastErrorCode: GeminiResearchShadowErrorCode | null = null;
  private lastErrorMessage: string | null = null;
  private quotaDormantUntilMs: number | null = null;

  public constructor(
    public readonly config: GeminiResearchShadowConfig,
    options: Omit<GeminiResearchServerTransportOptions, 'config'> = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.nowMs = options.nowMs ?? Date.now;
    this.telemetrySink = options.telemetrySink ?? defaultTelemetrySink;
    this.circuit = new CircuitBreaker({
      failureThreshold: config.circuitFailureThreshold,
      cooldownMs: config.circuitCooldownMs,
      nowMs: this.nowMs,
    });
    this.budget = new GeminiResearchShadowBudget(config, this.nowMs);
  }

  public status(): GeminiResearchShadowStatus {
    const now = new Date(this.nowMs()).toISOString();
    let state: GeminiResearchShadowState = 'READY';
    if (!this.config.enabled) state = 'DISABLED';
    else if (!this.config.ready) state = 'NOT_CONFIGURED';
    else if (this.quotaDormantUntilMs !== null && this.nowMs() < this.quotaDormantUntilMs) state = 'QUOTA_DORMANT';
    else if (this.circuit.state(PROVIDER_ID) === 'OPEN') state = 'CIRCUIT_OPEN';
    return {
      runtimeVersion: GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
      state,
      enabled: this.config.enabled,
      ready: this.config.ready,
      model: this.config.model,
      circuitState: this.circuit.state(PROVIDER_ID),
      budget: this.budget.snapshot(),
      lastObservedAt: now,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastErrorCode: this.lastErrorCode,
      lastErrorMessage: this.lastErrorMessage,
      quotaDormantUntil: this.quotaDormantUntilMs === null ? null : new Date(this.quotaDormantUntilMs).toISOString(),
    };
  }

  private emitTelemetry(input: {
    outcome: 'success' | 'failure' | 'degraded' | 'denied';
    severity: 'info' | 'warn' | 'error';
    durationMs?: number;
    request: GeminiResearchTransportRequest;
    attributes: Record<string, unknown>;
  }): void {
    const record = createTelemetryRecord({
      signal: 'trace',
      severity: input.severity,
      stage: 'data-validation',
      eventName: 'research.discovery.completed',
      outcome: input.outcome,
      durationMs: input.durationMs,
      provider: 'Gemini',
      assetClass: input.request.assetClass,
      context: {
        requestId: input.request.correlationId,
        service: 'capital-ai-gemini-research-shadow',
        environment: process.env.NODE_ENV?.trim() || 'unknown',
        version: GEMINI_RESEARCH_SHADOW_RUNTIME_VERSION,
        commitSha: process.env.RENDER_GIT_COMMIT?.trim() || undefined,
      },
      attributes: {
        shadowMode: true,
        model: this.config.model,
        fieldsCount: input.request.fields.length,
        urlsCount: input.request.urls.length,
        functionCallingEnabled: false,
        ...input.attributes,
      },
      auditReference: 'ADR-0087',
    });
    this.telemetrySink(record);
  }

  private recordDenied(
    request: GeminiResearchTransportRequest,
    error: GeminiResearchShadowError,
    startedAtMs: number,
  ): never {
    const now = new Date(this.nowMs()).toISOString();
    this.lastFailureAt = now;
    this.lastErrorCode = error.code;
    this.lastErrorMessage = error.message;
    const budget = this.budget.snapshot();
    const diagnosticCode = error.code === 'RATE_BUDGET_EXCEEDED' || error.code === 'PROVIDER_RATE_LIMITED' || error.code === 'FREE_TIER_QUOTA_DORMANT'
      ? 'rate_limited'
      : error.code === 'AUTH_ERROR'
        ? 'auth_error'
        : error.code === 'SCHEMA_ERROR'
          ? 'schema_error'
          : error.code === 'FEATURE_DISABLED' || error.code === 'NOT_CONFIGURED'
            ? 'not_configured'
            : 'provider_error';
    recordProviderHealth({
      provider: PROVIDER_ID,
      capability: CAPABILITY,
      state: error.code === 'RATE_BUDGET_EXCEEDED' || error.code === 'DAILY_BUDGET_EXCEEDED' || error.code === 'FREE_TIER_QUOTA_DORMANT' || error.code === 'CIRCUIT_OPEN'
        ? 'degraded'
        : 'unavailable',
      diagnosticCode,
      payloadUsable: false,
      circuitOpenUntil: this.circuit.openedUntilIso(PROVIDER_ID) ?? undefined,
      message: error.message,
    });
    this.emitTelemetry({
      request,
      outcome: error.code === 'FEATURE_DISABLED' || error.code === 'NOT_CONFIGURED' || error.code === 'RATE_BUDGET_EXCEEDED' || error.code === 'DAILY_BUDGET_EXCEEDED' || error.code === 'FREE_TIER_QUOTA_DORMANT' || error.code === 'CIRCUIT_OPEN'
        ? 'denied'
        : 'failure',
      severity: error.code === 'AUTH_ERROR' || error.code === 'SCHEMA_ERROR' ? 'error' : 'warn',
      durationMs: Math.max(0, this.nowMs() - startedAtMs),
      attributes: {
        errorCode: error.code,
        httpStatus: error.httpStatus,
        budgetRequests: budget.requests,
        budgetTokens: budget.tokens,
        budgetEstimatedCostUsd: budget.estimatedCostUsd,
      },
    });
    throw error;
  }

  public async discover(request: GeminiResearchTransportRequest): Promise<GeminiResearchTransportResponse> {
    const startedAtMs = this.nowMs();
    if (!this.config.enabled) {
      return this.recordDenied(request, new GeminiResearchShadowError('FEATURE_DISABLED', 'Gemini research shadow mode is disabled.'), startedAtMs);
    }
    if (!this.config.ready || !this.config.apiKey || !this.config.model) {
      return this.recordDenied(
        request,
        new GeminiResearchShadowError('NOT_CONFIGURED', this.config.configurationErrors.join(' ') || 'Gemini research shadow configuration is incomplete.'),
        startedAtMs,
      );
    }
    if (this.quotaDormantUntilMs !== null) {
      if (startedAtMs < this.quotaDormantUntilMs) {
        return this.recordDenied(
          request,
          new GeminiResearchShadowError(
            'FREE_TIER_QUOTA_DORMANT',
            `Gemini Free-Tier quota is dormant until ${new Date(this.quotaDormantUntilMs).toISOString()}.`,
            429,
          ),
          startedAtMs,
        );
      }
      this.quotaDormantUntilMs = null;
    }
    if (!this.circuit.allow(PROVIDER_ID)) {
      return this.recordDenied(request, new GeminiResearchShadowError('CIRCUIT_OPEN', 'Gemini research circuit breaker is open.'), startedAtMs);
    }
    try {
      this.budget.reserveRequest();
    } catch (error) {
      if (error instanceof GeminiResearchShadowError) return this.recordDenied(request, error, startedAtMs);
      throw error;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(GEMINI_INTERACTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-goog-api-key': this.config.apiKey,
          'User-Agent': 'CAPITAL-AI/0.6.0 GeminiResearchShadow',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.model,
          input: buildInteractionInput(request),
          system_instruction: request.systemInstruction,
          tools: request.tools.map((type) => ({ type })),
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: request.responseSchema,
          },
          store: false,
          background: false,
          generation_config: {
            max_output_tokens: this.config.maxOutputTokens,
            thinking_level: this.config.thinkingLevel,
            thinking_summaries: 'none',
          },
        }),
      });

      if (!response.ok) {
        const code = classifyHttpFailure(response.status);
        if (code === 'PROVIDER_RATE_LIMITED') {
          this.quotaDormantUntilMs = parseRetryAfterMs(response.headers.get('retry-after'), this.nowMs())
            ?? nextPacificQuotaResetMs(this.nowMs());
          throw new GeminiResearchShadowError(
            code,
            `Gemini Free-Tier quota/rate limit reached; provider is dormant until ${new Date(this.quotaDormantUntilMs).toISOString()}.`,
            response.status,
          );
        }
        throw new GeminiResearchShadowError(code, `Gemini Interactions API returned HTTP ${response.status}.`, response.status);
      }

      const payload: any = await response.json();
      if (payload?.status && payload.status !== 'completed') {
        throw new GeminiResearchShadowError('PROVIDER_ERROR', `Gemini interaction ended with status ${String(payload.status)}.`);
      }
      const blocks = extractModelTextBlocks(payload);
      if (blocks.length !== 1) {
        throw new GeminiResearchShadowError('SCHEMA_ERROR', 'Gemini structured interaction did not return exactly one model text block.');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(blocks[0].text);
      } catch {
        throw new GeminiResearchShadowError('SCHEMA_ERROR', 'Gemini structured interaction returned invalid JSON.');
      }
      const parsedClaims = normalizeParsedClaims(parsed);
      const providerCitations = extractProviderCitations(blocks[0]);
      const claims = bindClaimsToProviderCitations(blocks[0].text, parsedClaims, providerCitations);
      const usage = parseUsage(payload);
      const estimatedCostUsd = estimateCostUsd(this.config, usage);
      const tokenBudgetValue = usage.totalTokens || (
        usage.totalInputTokens + usage.totalOutputTokens + usage.totalThoughtTokens + usage.totalToolUseTokens
      );
      this.budget.recordUsage(tokenBudgetValue, estimatedCostUsd);
      this.circuit.success(PROVIDER_ID);
      const now = new Date(this.nowMs()).toISOString();
      this.lastSuccessAt = now;
      this.lastErrorCode = null;
      this.lastErrorMessage = null;
      const budget = this.budget.snapshot();

      recordProviderHealth({
        provider: PROVIDER_ID,
        capability: CAPABILITY,
        state: 'healthy',
        diagnosticCode: 'healthy',
        payloadUsable: true,
        message: `Gemini research shadow interaction completed with ${claims.length} structured claim(s) and ${providerCitations.length} provider citation(s).`,
      });
      this.emitTelemetry({
        request,
        outcome: 'success',
        severity: 'info',
        durationMs: Math.max(0, this.nowMs() - startedAtMs),
        attributes: {
          claimsCount: claims.length,
          providerCitationCount: providerCitations.length,
          boundClaimsCount: claims.filter((claim) => claim.providerCitationIndexes.length > 0).length,
          inputTokens: usage.totalInputTokens,
          outputTokens: usage.totalOutputTokens,
          thoughtTokens: usage.totalThoughtTokens,
          toolUseTokens: usage.totalToolUseTokens,
          totalTokens: tokenBudgetValue,
          googleSearchCalls: usage.googleSearchCalls,
          estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
          budgetRequests: budget.requests,
          budgetTokens: budget.tokens,
          budgetEstimatedCostUsd: budget.estimatedCostUsd,
          store: false,
        },
      });

      return {
        model: this.config.model,
        providerCitations,
        claims,
      };
    } catch (error) {
      const normalized = error instanceof GeminiResearchShadowError
        ? error
        : new GeminiResearchShadowError(
            'TRANSPORT_ERROR',
            error instanceof Error && error.name === 'AbortError'
              ? 'Gemini research shadow request timed out.'
              : 'Gemini research shadow transport failed.',
          );
      this.circuit.failure(PROVIDER_ID);
      return this.recordDenied(request, normalized, startedAtMs);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createGeminiResearchShadowRuntime(
  options: GeminiResearchServerTransportOptions = {},
): GeminiResearchShadowRuntime {
  const config = options.config ?? loadGeminiResearchShadowConfig();
  if (!config.enabled || !config.ready) {
    const nowMs = options.nowMs ?? Date.now;
    const reason = !config.enabled ? 'Gemini research shadow mode is disabled.' : config.configurationErrors.join(' ');
    recordProviderHealth({
      provider: PROVIDER_ID,
      capability: CAPABILITY,
      state: 'degraded',
      diagnosticCode: 'not_configured',
      payloadUsable: false,
      message: reason,
    });
    const placeholder = new GeminiResearchServerTransport(config, options);
    return {
      config,
      transport: null,
      adapter: null,
      status: () => ({ ...placeholder.status(), lastObservedAt: new Date(nowMs()).toISOString() }),
    };
  }
  const transport = new GeminiResearchServerTransport(config, options);
  const adapter = new GeminiResearchEvidenceAdapter(transport, () => new Date(options.nowMs?.() ?? Date.now()));
  return {
    config,
    transport,
    adapter,
    status: () => transport.status(),
  };
}
