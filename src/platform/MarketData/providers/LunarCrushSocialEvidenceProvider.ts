import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const LUNARCRUSH_PROVIDER_ID = 'lunarcrush' as const;
export const LUNARCRUSH_BASE_URL = 'https://lunarcrush.ai' as const;
export const LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION = 'lunarcrush-social-evidence/1.0.0' as const;

export type LunarCrushEvidenceStatus = 'VERIFIED' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface LunarCrushSocialEvidence {
  readonly contractVersion: typeof LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION;
  readonly status: LunarCrushEvidenceStatus;
  readonly topic: string;
  readonly symbol: string | null;
  readonly observedAt: string | null;
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly interactions24h: number | null;
  readonly mentions24h: number | null;
  readonly activeCreators24h: number | null;
  readonly createdPosts24h: number | null;
  readonly sentimentPct: number | null;
  readonly spamPosts: number | null;
  readonly socialDominancePct: number | null;
  readonly spamRatio: number | null;
  readonly reason?: string;
}

export interface LunarCrushSocialEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function latestPoint(root: unknown): { row: Record<string, unknown>; symbol: string | null } | null {
  if (!root || typeof root !== 'object') return null;
  const payload = root as Record<string, unknown>;
  const config = payload.config && typeof payload.config === 'object' ? payload.config as Record<string, unknown> : null;
  const data = Array.isArray(payload.data) ? payload.data : [];
  const row = [...data].reverse().find((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'));
  if (!row) return null;
  const symbol = typeof config?.symbol === 'string' && config.symbol.trim() ? config.symbol.toUpperCase() : null;
  return { row, symbol };
}

export class LunarCrushSocialEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: LunarCrushSocialEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? LUNARCRUSH_BASE_URL,
      apiKey: options.apiKey ?? env.LUNARCRUSH_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    };
    this.http = new ResearchEvidenceProviderHttp(LUNARCRUSH_PROVIDER_ID, 'sentiment', transport);
  }

  /**
   * Uses LunarCrush social time-series only. Market price, market-cap, AltRank and Galaxy Score
   * fields are intentionally ignored so social evidence cannot recursively confirm market evidence.
   */
  public async getSocialEvidence(topicInput: string): Promise<LunarCrushSocialEvidence> {
    const topic = topicInput.toLowerCase().trim();
    if (!topic || !/^[a-z0-9 #$.-]{1,100}$/.test(topic)) {
      return Object.freeze({
        contractVersion: LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION,
        status: 'INVALID',
        topic,
        symbol: null,
        observedAt: null,
        retrievedAt: new Date().toISOString(),
        evidenceRef: null,
        interactions24h: null,
        mentions24h: null,
        activeCreators24h: null,
        createdPosts24h: null,
        sentimentPct: null,
        spamPosts: null,
        socialDominancePct: null,
        spamRatio: null,
        reason: 'LunarCrush topic format is invalid.',
      });
    }

    const result = await this.http.requestJson(
      `/topic/${encodeURIComponent(topic)}/time-series?interval=1d&bucket=hour&format=json`,
    );
    if (result.status !== 'READY') {
      return Object.freeze({
        contractVersion: LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION,
        status: result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        topic,
        symbol: null,
        observedAt: null,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        interactions24h: null,
        mentions24h: null,
        activeCreators24h: null,
        createdPosts24h: null,
        sentimentPct: null,
        spamPosts: null,
        socialDominancePct: null,
        spamRatio: null,
        reason: result.reason,
      });
    }

    const latest = latestPoint(result.data);
    if (!latest) {
      return Object.freeze({
        contractVersion: LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION,
        status: 'INVALID',
        topic,
        symbol: null,
        observedAt: null,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        interactions24h: null,
        mentions24h: null,
        activeCreators24h: null,
        createdPosts24h: null,
        sentimentPct: null,
        spamPosts: null,
        socialDominancePct: null,
        spamRatio: null,
        reason: 'LunarCrush response has no time-series observation.',
      });
    }

    const row = latest.row;
    const observedSeconds = finite(row.time);
    const observedAt = observedSeconds === null ? null : new Date(observedSeconds * 1000).toISOString();
    const createdPosts = finite(row.posts_created);
    const spamPosts = finite(row.spam);
    const spamRatio = createdPosts !== null && createdPosts > 0 && spamPosts !== null
      ? Math.min(1, Math.max(0, spamPosts / createdPosts))
      : null;

    return Object.freeze({
      contractVersion: LUNARCRUSH_SOCIAL_EVIDENCE_CONTRACT_VERSION,
      status: 'VERIFIED',
      topic,
      symbol: latest.symbol,
      observedAt,
      retrievedAt: result.retrievedAt,
      evidenceRef: `lunarcrush:topic-timeseries:${encodeURIComponent(topic)}:${observedAt ?? result.retrievedAt}`,
      interactions24h: finite(row.interactions),
      mentions24h: finite(row.posts_active),
      activeCreators24h: finite(row.contributors_active),
      createdPosts24h: createdPosts,
      sentimentPct: finite(row.sentiment),
      spamPosts,
      socialDominancePct: finite(row.social_dominance),
      spamRatio,
    });
  }
}
