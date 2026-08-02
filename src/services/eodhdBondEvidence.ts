import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';

export interface BondEvidencePoint {
  date: string;
  value: number;
}

export interface BondEvidenceResult {
  provider: 'EODHD';
  providerSymbol: string;
  points: BondEvidencePoint[];
  retrievedAt: string;
  sourcePath: string;
  evidenceIds: string[];
}

export interface BondEvidenceOptions {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  timeoutMs?: number;
  nowMs?: () => number;
}

/**
 * Evidence-only adapter for explicitly known EODHD government-bond tickers (e.g. *.GBOND).
 * No ticker guessing and no bond score is produced here. Government yields may legitimately be
 * negative, therefore any finite observation is preserved instead of applying a positive-price gate.
 */
export async function getEodhdBondEvidence(
  providerSymbol: string,
  days = 90,
  options: BondEvidenceOptions = {},
): Promise<BondEvidenceResult> {
  const symbol = providerSymbol.toUpperCase().trim();
  if (!/^[A-Z0-9_-]+\.GBOND$/.test(symbol)) {
    throw new Error('Bond evidence requires an explicit EODHD *.GBOND provider symbol; ticker guessing is prohibited.');
  }
  const apiKey = options.apiKey ?? process.env.EODHD_API_KEY;
  if (!apiKey) throw new Error('EODHD_API_KEY is not configured.');
  const nowMs = options.nowMs ?? Date.now;
  const boundedDays = Math.min(Math.max(days, 20), 3650);
  const from = new Date(nowMs() - (boundedDays + 10) * 86_400_000).toISOString().slice(0, 10);
  const sourcePath = `https://eodhd.com/api/eod/${symbol}`;
  const url = `${sourcePath}?api_token=${encodeURIComponent(apiKey)}&fmt=json&period=d&order=a&from=${from}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  const started = Date.now();
  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.4' },
    });
    if (!response.ok) throw new Error(`EODHD HTTP ${response.status}`);
    const rows: any = await response.json();
    if (!Array.isArray(rows)) throw new Error('EODHD returned no bond-history array.');
    const points = rows
      .map((row: any) => ({
        date: typeof row?.date === 'string' ? row.date.slice(0, 10) : '',
        value: Number(row?.adjusted_close ?? row?.close),
      }))
      .filter((point: BondEvidencePoint) => /^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.value))
      .slice(-boundedDays);
    if (points.length < 2) throw new Error(`EODHD returned only ${points.length} usable bond observations.`);
    const retrievedAt = new Date(nowMs()).toISOString();
    recordMarketDataProviderOutcome({ provider: 'EODHD', success: true, latencyMs: Date.now() - started });
    recordProviderHealth({ provider: 'EODHD', capability: 'bond-history', state: 'healthy', cacheMode: 'live' });
    return {
      provider: 'EODHD',
      providerSymbol: symbol,
      points,
      retrievedAt,
      sourcePath,
      evidenceIds: points.map(point => `bond:eodhd:${symbol}:${point.date}`),
    };
  } catch (error) {
    recordMarketDataProviderOutcome({ provider: 'EODHD', success: false });
    recordProviderHealth({
      provider: 'EODHD', capability: 'bond-history', state: 'unavailable',
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
