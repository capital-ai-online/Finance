import express from 'express';
import { GoogleGenAI } from '@google/genai';
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

function normalizeSpotSymbol(input: unknown): string | null {
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
    const encodedSymbol = encodeURIComponent(symbol);
    const [ticker, klines] = await Promise.all([
      fetchJson<BinanceTicker24h>(`/api/v3/ticker/24hr?symbol=${encodedSymbol}`),
      fetchJson<BinanceKline[]>(`/api/v3/klines?symbol=${encodedSymbol}&interval=1h&limit=24`),
    ]);

    const closes = klines
      .map(kline => finiteNumber(kline[4]))
      .filter((value): value is number => value !== null && value > 0);

    const lastPrice = finiteNumber(ticker.lastPrice);
    const change24h = finiteNumber(ticker.priceChangePercent);
    const high24h = finiteNumber(ticker.highPrice);
    const low24h = finiteNumber(ticker.lowPrice);
    const quoteVolume24h = finiteNumber(ticker.quoteVolume);

    if ([lastPrice, change24h, high24h, low24h, quoteVolume24h].some(value => value === null)) {
      return res.status(502).json({ error: 'Binance hat unvollständige Marktdaten geliefert.' });
    }

    const marketData = {
      source: 'Binance Spot',
      symbol: ticker.symbol,
      lastPrice,
      change24hPercent: change24h,
      high24h,
      low24h,
      quoteVolume24h,
      hourlyCloses: closes.slice(-24),
      asOf: new Date(ticker.closeTime || Date.now()).toISOString(),
    };

    const anthropic = isAnthropicConfigured() ? getAnthropicInstance() : null;
    const openai = isOpenAIConfigured() ? getOpenAIInstance() : null;
    const gemini = process.env.GEMINI_API_KEY
      ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      : null;

    let provider = 'quantitative-fallback';
    let analysis = deterministicSummary(symbol, ticker, closes);

    if (anthropic || openai || gemini) {
      const result = await generateTextWithFallback({
        anthropic,
        openai,
        gemini,
        promptId: 'landing-binance-quick-analysis',
        contents: JSON.stringify(marketData),
        systemInstruction:
          'Du bist die öffentliche CAPITAL-AI Kurzanalyse. Analysiere ausschließlich die gelieferten Binance-Spot-Marktdaten. ' +
          'Erfinde keine Kurse, Nachrichten, Fundamentaldaten oder On-Chain-Daten. Antworte auf Deutsch in maximal 4 kurzen Sätzen: ' +
          'Momentum, kurzfristiger Trend, auffällige Volatilität/Spanne und ein nüchterner Risikohinweis. ' +
          'Nenne Binance Spot als Datenquelle und formuliere ausdrücklich keine Kauf- oder Verkaufsempfehlung.',
        geminiModels: ['gemini-3.1-pro-preview'],
        maxTokens: 320,
        requestId: req.requestId,
      });
      if (result?.text?.trim()) {
        provider = result.provider;
        analysis = result.text.trim();
      }
    }

    return res.json({ marketData, analysis, provider });
  } catch (error: any) {
    const message = error?.name === 'AbortError'
      ? 'Binance-Marktdaten haben das Zeitlimit überschritten.'
      : String(error?.message || error);
    console.warn('[Landing Binance Quick Analysis]', message);
    if (/Invalid symbol|HTTP 400/i.test(message)) {
      return res.status(404).json({ error: `Kein Binance-Spot-Markt für ${symbol} gefunden.` });
    }
    return res.status(502).json({ error: 'Binance-Marktdaten sind derzeit nicht verfügbar.' });
  }
});
