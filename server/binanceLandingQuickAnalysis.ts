import express from 'express';
import { generateTextWithFallback } from '../src/services/agentModelRouting';
import { getAnthropicInstance, isAnthropicConfigured } from './anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './openaiClient';
import { checkRateLimit, getClientIp } from '../src/platform/Security/rateLimiter';

export const binanceLandingQuickAnalysisRouter = express.Router();

const BINANCE_MARKET_DATA_BASE = 'https://data-api.binance.vision';
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_REQUESTS_PER_MINUTE = 6;

interface BinanceTicker24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  volume: string;
  closeTime: number;
}

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export interface QuickAnalysisResult {
  marketData: {
    source: string;
    symbol: string;
    lastPrice: number;
    change24hPercent: number;
    high24h: number;
    low24h: number;
    quoteVolume24h: number;
    hourlyCloses: number[];
    asOf: string;
  };
  analysis: string;
  provider: string;
}

/** Fehler mit HTTP-Status, die 1:1 an den Client durchgereicht werden sollen. */
export class QuickAnalysisError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function normalizeSpotSymbol(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const compact = input.toUpperCase().replace(/[\s/_-]/g, '').trim();
  if (!/^[A-Z0-9]{2,20}$/.test(compact)) return null;
  return compact.endsWith('USDT') ? compact : `${compact}USDT`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${BINANCE_MARKET_DATA_BASE}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Binance HTTP ${response.status}: ${body.slice(0, 180)}`);
    }
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function finiteNumber(value: string | number): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function deterministicSummary(symbol: string, ticker: BinanceTicker24h, closes: number[]): string {
  const change = finiteNumber(ticker.priceChangePercent) ?? 0;
  const trend = closes.length >= 2
    ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100
    : 0;
  const direction = change > 1 ? 'positiv' : change < -1 ? 'negativ' : 'seitwärts';
  const intraday = trend > 0.5 ? 'aufwärtsgerichtet' : trend < -0.5 ? 'abwärtsgerichtet' : 'neutral';
  return `${symbol} zeigt auf 24-Stunden-Sicht ein ${direction}es Momentum (${change.toFixed(2)} %). ` +
    `Die letzten stündlichen Binance-Schlusskurse wirken ${intraday}. ` +
    `Die Aussage basiert ausschließlich auf öffentlichen Binance-Spot-Marktdaten und ist keine Anlageberatung.`;
}

/**
 * Geteilte Kernlogik (ADR-0038): laedt oeffentliche Binance-Spot-Marktdaten und erzeugt
 * daraus eine kurze AI-Einschaetzung ueber die bestehende Anthropic->OpenAI-Kette,
 * mit deterministischem Fallback statt Demo-/erfundenen Daten. Wird sowohl vom oeffentlichen
 * Landing-Endpunkt als auch vom authentifizierten Enterprise-Scorer-Endpunkt aufgerufen -
 * siehe ADR-0038-Nachtrag fuer die Trennung der beiden Aufrufkontexte.
 */
export async function computeBinanceQuickAnalysis(
  symbol: string,
  // Objekt statt zweier Positionsparameter, damit an jeder Aufrufstelle weiterhin ein
  // literaler promptId-Schluessel mit String-Wert im Quelltext steht - scripts/automation/
  // verifyDeploymentReadiness.ts (Abschnitt "Prompt Registry Coverage") erkennt Prompt-IDs
  // per Textmuster-Scan und würde eine rein positional durchgereichte ID nicht mehr finden.
  options: { promptId: string; requestId?: string },
): Promise<QuickAnalysisResult> {
  const { promptId, requestId } = options;
  const encodedSymbol = encodeURIComponent(symbol);
  let ticker: BinanceTicker24h;
  let klines: BinanceKline[];
  try {
    [ticker, klines] = await Promise.all([
      fetchJson<BinanceTicker24h>(`/api/v3/ticker/24hr?symbol=${encodedSymbol}`),
      fetchJson<BinanceKline[]>(`/api/v3/klines?symbol=${encodedSymbol}&interval=1h&limit=24`),
    ]);
  } catch (error: any) {
    const message = error?.name === 'AbortError'
      ? 'Binance-Marktdaten haben das Zeitlimit überschritten.'
      : String(error?.message || error);
    console.warn('[Binance Quick Analysis]', message);
    if (/Invalid symbol|HTTP 400/i.test(message)) {
      throw new QuickAnalysisError(404, `Kein Binance-Spot-Markt für ${symbol} gefunden.`);
    }
    throw new QuickAnalysisError(502, 'Binance-Marktdaten sind derzeit nicht verfügbar.');
  }

  const closes = klines
    .map(kline => finiteNumber(kline[4]))
    .filter((value): value is number => value !== null && value > 0);

  const lastPrice = finiteNumber(ticker.lastPrice);
  const change24h = finiteNumber(ticker.priceChangePercent);
  const high24h = finiteNumber(ticker.highPrice);
  const low24h = finiteNumber(ticker.lowPrice);
  const quoteVolume24h = finiteNumber(ticker.quoteVolume);

  if ([lastPrice, change24h, high24h, low24h, quoteVolume24h].some(value => value === null)) {
    throw new QuickAnalysisError(502, 'Binance hat unvollständige Marktdaten geliefert.');
  }

  const marketData: QuickAnalysisResult['marketData'] = {
    source: 'Binance Spot',
    symbol: ticker.symbol,
    lastPrice: lastPrice as number,
    change24hPercent: change24h as number,
    high24h: high24h as number,
    low24h: low24h as number,
    quoteVolume24h: quoteVolume24h as number,
    hourlyCloses: closes.slice(-24),
    asOf: new Date(ticker.closeTime || Date.now()).toISOString(),
  };

  const anthropic = isAnthropicConfigured() ? getAnthropicInstance() : null;
  const openai = isOpenAIConfigured() ? getOpenAIInstance() : null;

  let provider = 'quantitative-fallback';
  let analysis = deterministicSummary(symbol, ticker, closes);

  if (anthropic || openai) {
    const result = await generateTextWithFallback({
      anthropic,
      openai,
      gemini: null,
      promptId,
      contents: JSON.stringify(marketData),
      systemInstruction:
        'Du bist die CAPITAL-AI Kurzanalyse. Analysiere ausschließlich die gelieferten Binance-Spot-Marktdaten. ' +
        'Erfinde keine Kurse, Nachrichten, Fundamentaldaten oder On-Chain-Daten. Antworte auf Deutsch in maximal 4 kurzen Sätzen: ' +
        'Momentum, kurzfristiger Trend, auffällige Volatilität/Spanne und ein nüchterner Risikohinweis. ' +
        'Nenne Binance Spot als Datenquelle und formuliere ausdrücklich keine Kauf- oder Verkaufsempfehlung.',
      geminiModels: [],
      maxTokens: 320,
      requestId,
    });
    if (result?.text?.trim()) {
      provider = result.provider;
      analysis = result.text.trim();
    }
  }

  return { marketData, analysis, provider };
}

binanceLandingQuickAnalysisRouter.post('/quick-analysis', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`landing-binance-ai:${ip}`, MAX_REQUESTS_PER_MINUTE, 60_000)) {
    return res.status(429).json({ error: 'Zu viele Kurzanalyse-Anfragen. Bitte kurz warten.' });
  }

  const symbol = normalizeSpotSymbol(req.body?.symbol);
  if (!symbol) {
    return res.status(400).json({ error: 'Ungültiges Symbol. Beispiel: BTC, ETH oder SOL.' });
  }

  try {
    const result = await computeBinanceQuickAnalysis(symbol, { promptId: 'landing-binance-quick-analysis', requestId: req.requestId });
    return res.json(result);
  } catch (error: any) {
    if (error instanceof QuickAnalysisError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.warn('[Landing Binance Quick Analysis]', error?.message || error);
    return res.status(502).json({ error: 'Binance-Marktdaten sind derzeit nicht verfügbar.' });
  }
});
