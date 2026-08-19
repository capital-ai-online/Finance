import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Type } from './src/services/aiSchema';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { orchestrator } from './src/lib/requestOrchestrator';
import { assetRegistry } from './src/lib/assetRegistry';
import { MemeCoinScoringService } from './src/services/memeCoinScoringService';
import { RawMaterialsScoringService } from './src/services/rawMaterialsScoring';
import { generateStructuredWithFallback } from './src/services/agentModelRouting';
import { recordDailySnapshots } from './server/scoreValidation';
import { evaluateAlerts } from './server/alerts';
import { generateTraditionalAssetInputs, generateTraditionalAssetInputsFromCloses, TraditionalAssetScoringService } from './src/services/traditionalAssetScoring';
import { ensureFundamentalsFresh, getCachedFundamentals } from './server/stockFundamentals';
import { INDEX_FMP_TICKERS, ensureIndexQuoteFresh, getCachedIndexQuote, ensureIndexHistoryFresh, getCachedIndexHistory } from './server/fmpIndices';
import { getAnthropicInstance, isAnthropicConfigured } from './server/anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './server/openaiClient';
import { executeSupervised } from './src/platform/Supervisor/supervisor';
import { createApplicationMarketDataRuntime } from './server/marketData/createApplicationMarketDataRuntime';
import {
  enrichStandardCryptoWithCanonicalScore,
  isStandardCryptoMarketDataAsset,
} from './server/marketData/canonicalCryptoScoreEnrichment';
import { registerApplicationRoutes } from './server/routes/registerApplicationRoutes';
import { createDocumentationRouter } from './server/routes/documentationRoutes';
import { createHistoryRouter } from './server/routes/historyRoutes';
import { computeReturnStats, classifyTrendLabel } from './src/services/realMarketSignals';

// Import newly refactored modular server handlers (Production Billing & Enterprise Architecture)
import { getCleanEnv } from './server/env';
import { checkAdminAccess, runIamSchemaHealthCheck } from './src/platform/Security/authMiddleware';
import { validateRuntimeSecrets } from './server/validateRuntimeSecrets';
import { SUPERVISOR_ZONE_ROLES } from './src/platform/Security/types';
import {
  isSupabaseConfigured,
  getServerSupabase,
  saveLocalSubscription,
  getLocalSubscriptions,
  saveSubscription,
  getSubscription,
} from './server/db';
import { handleWebhookEvent, getStripeInstance } from './server/stripe';
import { processSubscriptionConfirmationMailJob } from './server/mailer';
import { registerOutboxJobHandler, startOutboxWorker, stopOutboxWorker } from './server/outboxWorker';
import { isAlpacaConfigured, runAlpacaShadowStartupSmoke } from './src/services/alpacaShadowProvider';
import { logSystemEvent } from './server/systemEvents';
import { startRecursiveFileWatcher } from './server/documentHygiene';
import { enforceScreeningQuota } from './server/quota';
import { checkRateLimit, getClientIp } from './src/platform/Security/rateLimiter';
import { createLogger, requestContext } from './server/logger';
import { metricsMiddleware, renderMetrics } from './server/metrics';
import { getStripeConfigurationStatus, resolveRuntimePort } from './server/runtime/renderRuntimeSafety';
import { registerProductionSpaFallback } from './server/runtime/spaFallback';

const serverLogger = createLogger('server');

// ADR-0054 / R-101: register outbox job handlers at composition time, before the worker poll
// loop starts. subscription_confirmation_mail retries a failed checkout-confirmation SMTP send
// (server/mailer.ts) with backoff instead of the previous permanent failure (see OPS-001).
registerOutboxJobHandler('subscription_confirmation_mail', processSubscriptionConfirmationMailJob);

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = resolveRuntimePort(getCleanEnv('PORT'));

app.use(requestContext);
app.use(metricsMiddleware);

process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS][UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[PROCESS][UNCAUGHT EXCEPTION]', err);
});

const isProductionEnv = getCleanEnv('NODE_ENV') === 'production';

const PRODUCTION_ORIGINS = [
  'https://capital-ai.online',
  'https://www.capital-ai.online',
];

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function isOriginAllowed(origin: string): boolean {
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  if (!isProductionEnv && isLocalDevOrigin(origin)) return true;
  return false;
}

async function logBlockedOrigin(origin: string, req: express.Request) {
  serverLogger.warn('Blocked CORS Origin', { requestId: req.requestId, origin, path: req.originalUrl });
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServerSupabase();
    const xff = req.headers['x-forwarded-for'];
    const ip = typeof xff === 'string' ? xff.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
    await supabase.from('security_events').insert({
      event_type: 'suspicious_request',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || null,
      endpoint: req.originalUrl,
      outcome: 'blocked',
      reason: `Blocked CORS Origin: ${origin}`,
    });
  } catch (err: any) {
    serverLogger.error('security_events-Insert fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      logBlockedOrigin(origin, req).catch((err) => {
        console.error('[SECURITY] logBlockedOrigin fehlgeschlagen:', err);
      });
      if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'Origin nicht erlaubt.' });
      }
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  const frameAncestors = [
    "'self'",
    ...(!isProductionEnv ? ["http://localhost:*"] : []),
  ].join(' ');
  const scriptSrc = isProductionEnv
    ? "'self' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com";
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; " +
    `script-src ${scriptSrc}; ` +
    "style-src 'self' https://fonts.googleapis.com https://cdn.cookiehub.eu; " +
    "img-src 'self' data: https: referrer; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "frame-src 'self' https://*.stripe.com; " +
    `frame-ancestors ${frameAncestors};`
  );

  if (isProductionEnv) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

const PROBE_PATH_PATTERNS = [
  /\.php$/i,
  /^\/wp-(admin|login|content|includes|json)(\/|$)/i,
  /^\/(config|wp-config)\.(php|json|ya?ml|ini)$/i,
  /^\/\.env(\.|$)/i,
  /^\/\.git(\/|$)/i,
  /^\/(phpinfo|info|test)\.php$/i,
];
app.use((req, res, next) => {
  if (PROBE_PATH_PATTERNS.some((pattern) => pattern.test(req.path))) {
    return res.status(404).end();
  }
  next();
});

const webhookHandler = async (req: express.Request, res: express.Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = getCleanEnv('STRIPE_WEBHOOK_SECRET');

  if (!sig || !webhookSecret) {
    console.warn('⚠️ Stripe Webhook called, but stripe-signature or STRIPE_WEBHOOK_SECRET is missing.');
    return res.status(400).send('Webhook Error: Missing signature or webhook secret.');
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeInstance();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('❌ Webhook handling error:', err);
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use((req, res, next) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`global:${ip}`, 300, 60_000)) {
    serverLogger.warn('Globales Rate-Limit erreicht', { requestId: req.requestId, ip, path: req.originalUrl });
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' });
  }
  next();
});

app.use(express.json());

const ai: any = null;

let anthropic: any = null;
try {
  if (isAnthropicConfigured()) {
    anthropic = getAnthropicInstance();
  }
} catch (e) {
  console.warn('Failed to retrieve Anthropic instance on boot:', e);
}

let openai: any = null;
try {
  if (isOpenAIConfigured()) {
    openai = getOpenAIInstance();
  }
} catch (e) {
  console.warn('Failed to retrieve OpenAI instance on boot:', e);
}

app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    configured: {
      supabase: isSupabaseConfigured(),
      alpaca: isAlpacaConfigured(),
      anthropic: isAnthropicConfigured(),
      openai: isOpenAIConfigured(),
    },
  });
});

app.get('/metrics', (req, res) => {
  const expectedToken = getCleanEnv('METRICS_TOKEN');
  if (!expectedToken) {
    return res.status(403).json({ error: 'METRICS_TOKEN nicht konfiguriert - /metrics ist deaktiviert.' });
  }
  const providedToken = req.headers['x-metrics-token'];
  if (providedToken !== expectedToken) {
    return res.status(403).json({ error: 'Zugriff verweigert.' });
  }
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(renderMetrics());
});

registerApplicationRoutes(app, { ai, anthropic, openai });

function getAssetPatternForSymbol(symbol: string): string {
  const s = symbol.toUpperCase().trim();
  if (s.startsWith('BTC')) return 'Bullish Engulfing';
  if (s.startsWith('ETH')) return 'Hammer Support';
  if (s.startsWith('AAPL')) return 'Cup & Handle';
  if (s.startsWith('TSLA')) return 'Double Bottom';
  if (s.startsWith('NVDA')) return 'Ascending Triangle';
  if (s.startsWith('GLD')) return 'Inverted Head & Shoulders';
  if (s.startsWith('EURUSD') || s.startsWith('EUR/USD')) return 'Bearish Harami';

  const charSum = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const patterns = [
    'Falling Wedge',
    'Morning Star',
    'Double Top',
    'Ascending Channel',
    'Three Inside Up',
    'Hammer Reversal',
    'Bull Flag'
  ];
  return patterns[charSum % patterns.length];
}

async function computeDisplayTrendLabel(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase().trim();
  try {
    if (INDEX_FMP_TICKERS[s]) {
      const points = getCachedIndexHistory(s);
      if (!points || points.length < 2) return undefined;
      const stats = computeReturnStats(points.map(p => p.close));
      return stats ? classifyTrendLabel(stats) : undefined;
    }
    const history = await assetRegistry.getHistory(s, 30);
    if (history.source !== 'live') return undefined;
    const stats = computeReturnStats(history.points.map(p => p.close));
    if (!stats) return undefined;
    return classifyTrendLabel(stats);
  } catch {
    return undefined;
  }
}

function getApplicationAreaForSymbol(symbol: string, type: string): string {
  const s = symbol.toUpperCase().trim();
  if (type === 'crypto') {
    if (s === 'ETH' || s === 'SOL' || s === 'ADA') return 'Webanwendungen';
    return 'DeFi & Smart Contracts';
  } else if (type === 'stock') {
    if (s === 'GOOGL' || s === 'META' || s === 'NFLX') return 'Webanwendungen';
    if (s === 'AAPL') return 'Unterhaltung & Services';
    if (s === 'MSFT' || s === 'AMZN') return 'E-Commerce & Cloud';
    if (s === 'NVDA' || s === 'AMD' || s === 'INTC') return 'Hardware & AI';
    return 'Andere';
  }
  return 'Andere';
}

const MEME_COIN_SYMBOLS = ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME'];

type ScoreBasis = 'market-data' | 'heuristic' | undefined;
interface AssetScoreResult { score: number; basis: ScoreBasis }

async function calculateAssetScore(symbol: string, type: string, change24h: number, baseScore?: number): Promise<AssetScoreResult> {
  const s = symbol.toUpperCase().trim();
  if (type === 'crypto') {
    if (!MEME_COIN_SYMBOLS.includes(s)) {
      throw new Error(`STANDARD_CRYPTO_REQUIRES_CANONICAL_DISPATCHER:${s}`);
    }
    const inputs = await MemeCoinScoringService.generateMemeCoinInputs(s, change24h);
    const result = MemeCoinScoringService.scoreMemeCoin(inputs);
    return { score: result.score, basis: 'market-data' };
  }

  if (type === 'commodity') {
    try {
      const payload = RawMaterialsScoringService.scoreMaterial({ name: s });
      return { score: Math.min(100.0, Math.max(0.0, Number(payload.scores.final_score.toFixed(1)))), basis: undefined };
    } catch (err) {
      console.warn(`[Commodity Scoring Fallback] Failed to score via RawMaterialsScoringService for ${s}, using momentum fallback:`, err);
    }
  }

  if (type === 'stock' || type === 'forex') {
    try {
      let fundamentals: { peRatio?: number; dividendYieldPct?: number; profitMarginPct?: number } | undefined;
      if (type === 'stock') {
        await ensureFundamentalsFresh(s);
        fundamentals = getCachedFundamentals(s);
      }
      const inputs = await generateTraditionalAssetInputs(s, type, fundamentals);
      const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
      if (result.usedFactors.length > 0) {
        return { score: result.score, basis: 'market-data' };
      }
    } catch (err: any) {
      console.warn(`[TraditionalAssetScoring Fallback] Failed for ${s}, using momentum fallback:`, err?.message || err);
    }
  }

  if (type === 'index' && INDEX_FMP_TICKERS[s]) {
    try {
      ensureIndexHistoryFresh(s).catch(() => {});
      const points = getCachedIndexHistory(s);
      if (points && points.length >= 2) {
        const inputs = generateTraditionalAssetInputsFromCloses(s, 'index', points.map(p => p.close));
        const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
        if (result.usedFactors.length > 0) {
          return { score: result.score, basis: 'market-data' };
        }
      }
    } catch (err: any) {
      console.warn(`[TraditionalAssetScoring Fallback] Failed for index ${s}, using momentum fallback:`, err?.message || err);
    }
  }

  const normBaseScore = baseScore !== undefined ? (baseScore > 10.0 ? baseScore : baseScore * 10) : undefined;
  let baseMomentum = normBaseScore !== undefined ? normBaseScore : (50.0 + (change24h > 0 ? Math.min(40.0, change24h * 5) : Math.max(-40.0, change24h * 5)));

  const pattern = getAssetPatternForSymbol(s);
  let patternBoost = 0;
  if (pattern === 'Bullish Engulfing') patternBoost = 45;
  else if (pattern === 'Inverted Head & Shoulders') patternBoost = 35;
  else if (pattern === 'Hammer Support' || pattern === 'Hammer Reversal') patternBoost = 30;
  else if (pattern === 'Double Bottom') patternBoost = 28;
  else if (pattern === 'Cup & Handle') patternBoost = 25;
  else if (pattern === 'Bull Flag' || pattern === 'Morning Star') patternBoost = 22;
  else if (pattern === 'Ascending Triangle' || pattern === 'Ascending Channel') patternBoost = 18;
  else if (pattern === 'Bearish Harami' || pattern === 'Double Top') patternBoost = -32;

  let finalScore = baseMomentum + patternBoost;

  if (pattern === 'Bullish Engulfing') {
    if (finalScore < 82) {
      finalScore = 82 + (change24h > 0 ? Math.min(10.0, change24h * 2) : Math.max(-10.0, change24h * 2));
    }
  }

  const clamped = Math.min(100.0, Math.max(1.0, Number(finalScore.toFixed(1))));
  return { score: clamped, basis: (type === 'index' || type === 'bond' || type === 'stock' || type === 'forex') ? 'heuristic' : undefined };
}

const FALLBACK_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 68500.0, change24h: 2.45, grahamScore: 0, momentum: 7.2, risk: 'High', status: 'Verifiziert', marketCap: 1340.0, dividendYield: 0.0, volume24h: 28500.0, score: 8.5, pattern: 'Bullish Engulfing', applicationArea: 'DeFi & Smart Contracts' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3450.0, change24h: -1.2, grahamScore: 0, momentum: 5.8, risk: 'High', status: 'Verifiziert', marketCap: 415.0, dividendYield: 0.0, volume24h: 15200.0, score: 7.4, pattern: 'Hammer Support', applicationArea: 'Webanwendungen' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', price: 145.2, change24h: 5.8, grahamScore: 0, momentum: 8.5, risk: 'High', status: 'Verifiziert', marketCap: 67.5, dividendYield: 0.0, volume24h: 3800.0, score: 8.6, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', price: 0.42, change24h: -0.8, grahamScore: 0, momentum: 4.5, risk: 'High', status: 'Verifiziert', marketCap: 15.1, dividendYield: 0.0, volume24h: 420.0, score: 6.5, pattern: 'Double Bottom', applicationArea: 'Webanwendungen' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 189.3, change24h: 1.15, grahamScore: 22.4, momentum: 6.2, risk: 'Low', status: 'Verifiziert', peRatio: 28.5, debtToEquity: 1.45, marketCap: 2950.0, dividendYield: 0.51, volume24h: 9500.0, score: 7.2, pattern: 'Cup & Handle', applicationArea: 'Unterhaltung & Services' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', price: 415.6, change24h: 0.85, grahamScore: 18.2, momentum: 6.8, risk: 'Low', status: 'Verifiziert', peRatio: 35.2, debtToEquity: 0.28, marketCap: 3080.0, dividendYield: 0.72, volume24h: 12400.0, score: 7.8, pattern: 'Ascending Channel', applicationArea: 'E-Commerce & Cloud' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', price: 172.5, change24h: -0.42, grahamScore: 24.1, momentum: 5.5, risk: 'Low', status: 'Verifiziert', peRatio: 25.4, debtToEquity: 0.06, marketCap: 2150.0, dividendYield: 0.46, volume24h: 8100.0, score: 7.1, pattern: 'Three Inside Up', applicationArea: 'Webanwendungen' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', price: 185.2, change24h: -1.1, grahamScore: 12.8, momentum: 5.1, risk: 'Medium', status: 'Verifiziert', peRatio: 40.1, debtToEquity: 0.42, marketCap: 1920.0, dividendYield: 0.0, volume24h: 9100.0, score: 6.4, pattern: 'Falling Wedge', applicationArea: 'E-Commerce & Cloud' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', price: 127.4, change24h: 4.62, grahamScore: 8.5, momentum: 9.2, risk: 'High', status: 'Verifiziert', peRatio: 68.4, debtToEquity: 0.15, marketCap: 3120.0, dividendYield: 0.03, volume24h: 24500.0, score: 9.1, pattern: 'Ascending Triangle', applicationArea: 'Hardware & AI' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', price: 178.4, change24h: -3.45, grahamScore: 11.2, momentum: 3.8, risk: 'High', status: 'Verifiziert', peRatio: 48.2, debtToEquity: 0.05, marketCap: 565.0, dividendYield: 0.0, volume24h: 14800.0, score: 5.8, pattern: 'Double Bottom', applicationArea: 'Andere' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', price: 504.2, change24h: 1.68, grahamScore: 19.5, momentum: 7.1, risk: 'Medium', status: 'Verifiziert', peRatio: 28.1, debtToEquity: 0.07, marketCap: 1280.0, dividendYield: 0.4, volume24h: 11200.0, score: 7.8, pattern: 'Cup & Handle', applicationArea: 'Webanwendungen' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', price: 610.5, change24h: -0.5, grahamScore: 14.2, momentum: 5.9, risk: 'Medium', status: 'Verifiziert', peRatio: 36.5, debtToEquity: 0.85, marketCap: 265.0, dividendYield: 0.0, volume24h: 4500.0, score: 7.5, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', price: 160.2, change24h: 2.1, grahamScore: 10.4, momentum: 6.5, risk: 'High', status: 'Verifiziert', peRatio: 52.0, debtToEquity: 0.04, marketCap: 258.0, dividendYield: 0.0, volume24h: 7500.0, score: 7.2, pattern: 'Double Bottom', applicationArea: 'Hardware & AI' },
  { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', price: 30.4, change24h: -0.95, grahamScore: 15.1, momentum: 4.1, risk: 'Low', status: 'Verifiziert', peRatio: 22.8, debtToEquity: 0.38, marketCap: 129.0, dividendYield: 1.64, volume24h: 3100.0, score: 5.4, pattern: 'Bull Flag', applicationArea: 'Hardware & AI' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', price: 1.0824, change24h: 0.12, grahamScore: 0, momentum: 5.2, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1202.48, score: 5.5 },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'forex', price: 1.2645, change24h: -0.15, grahamScore: 0, momentum: 4.8, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1205.29, score: 5.0 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', price: 156.85, change24h: 0.35, grahamScore: 0, momentum: 6.2, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1203.7, score: 6.1 },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', price: 1.3652, change24h: 0.04, grahamScore: 0, momentum: 5.1, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.3, score: 5.2 },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', price: 0.9085, change24h: -0.21, grahamScore: 0, momentum: 4.3, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.82, score: 4.7 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', price: 0.6625, change24h: 0.18, grahamScore: 0, momentum: 5.4, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.25, score: 5.6 },
  { symbol: 'GLD', name: 'Gold Spot', type: 'commodity', price: 2340.5, change24h: 0.65, grahamScore: 0, momentum: 6.5, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 360.25, score: 6.8 },
  { symbol: 'SLV', name: 'Silver Spot', type: 'commodity', price: 30.12, change24h: 1.45, grahamScore: 0, momentum: 7.2, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 350.12, score: 7.4 },
  { symbol: 'USO', name: 'Crude Oil', type: 'commodity', price: 78.45, change24h: -1.82, grahamScore: 0, momentum: 3.5, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 358.45, score: 4.1 },
  { symbol: 'NG=F', name: 'Natural Gas', type: 'commodity', price: 2.54, change24h: 3.12, grahamScore: 0, momentum: 7.0, risk: 'High', status: 'Verifiziert', marketCap: 180.0, dividendYield: 0.0, volume24h: 220.50, score: 6.5 },
  { symbol: 'WTI', name: 'WTI Crude Oil', type: 'commodity', price: 77.20, change24h: -1.40, grahamScore: 0, momentum: 4.2, risk: 'Medium', status: 'Verifiziert', marketCap: 1050.0, dividendYield: 0.0, volume24h: 410.80, score: 5.8 },
  { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'commodity', price: 81.85, change24h: -1.25, grahamScore: 0, momentum: 4.5, risk: 'Medium', status: 'Verifiziert', marketCap: 1150.0, dividendYield: 0.0, volume24h: 460.20, score: 6.1 },
  { symbol: 'GSPC', name: 'S&P 500', type: 'index', price: 5450.20, change24h: 0.45, grahamScore: 0, momentum: 5.5, risk: 'Medium', status: 'Verifiziert', marketCap: 44000.0, dividendYield: 1.35, volume24h: 4200.0, score: 7.2, pattern: 'Ascending Channel', applicationArea: 'Aktien-Benchmark' },
  { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'index', price: 17850.50, change24h: 0.85, grahamScore: 0, momentum: 6.8, risk: 'Medium', status: 'Verifiziert', marketCap: 26000.0, dividendYield: 0.85, volume24h: 5100.0, score: 7.8, pattern: 'Cup & Handle', applicationArea: 'Technologie-Sektor' },
  { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'index', price: 39120.00, change24h: 0.15, grahamScore: 0, momentum: 4.8, risk: 'Low', status: 'Verifiziert', marketCap: 11200.0, dividendYield: 1.95, volume24h: 1200.0, score: 6.5, pattern: 'Bull Flag', applicationArea: 'Industrie & Blue Chips' },
  { symbol: 'RUT', name: 'Russell 2000', type: 'index', price: 2025.40, change24h: -0.35, grahamScore: 0, momentum: 4.1, risk: 'High', status: 'Verifiziert', marketCap: 3100.0, dividendYield: 1.10, volume24h: 850.0, score: 5.9, pattern: 'Double Bottom', applicationArea: 'Small Caps' },
  { symbol: 'FTSE', name: 'FTSE 100', type: 'index', price: 8240.10, change24h: 0.22, grahamScore: 0, momentum: 4.5, risk: 'Low', status: 'Verifiziert', marketCap: 2500.0, dividendYield: 3.80, volume24h: 920.0, score: 6.2, pattern: 'Ascending Triangle', applicationArea: 'UK Blue Chips' },
  { symbol: 'GDAXI', name: 'DAX 40', type: 'index', price: 18210.80, change24h: 0.38, grahamScore: 0, momentum: 5.2, risk: 'Medium', status: 'Verifiziert', marketCap: 1800.0, dividendYield: 2.90, volume24h: 750.0, score: 6.9, pattern: 'Morning Star', applicationArea: 'Deutsche Industrie' },
  { symbol: 'FCHI', name: 'CAC 40', type: 'index', price: 7650.50, change24h: 0.12, grahamScore: 0, momentum: 4.4, risk: 'Medium', status: 'Verifiziert', marketCap: 2100.0, dividendYield: 3.10, volume24h: 620.0, score: 6.1, pattern: 'Hammer Support', applicationArea: 'Französische Blue Chips' },
  { symbol: 'N225', name: 'Nikkei 225', type: 'index', price: 38650.00, change24h: 0.95, grahamScore: 0, momentum: 6.5, risk: 'Medium', status: 'Verifiziert', marketCap: 4800.0, dividendYield: 1.70, volume24h: 1800.0, score: 7.4, pattern: 'Ascending Channel', applicationArea: 'Japanischer Markt' },
  { symbol: 'HSI', name: 'Hang Seng Index', type: 'index', price: 18020.00, change24h: -1.15, grahamScore: 0, momentum: 3.2, risk: 'High', status: 'Verifiziert', marketCap: 3400.0, dividendYield: 3.50, volume24h: 1400.0, score: 5.0, pattern: 'Falling Wedge', applicationArea: 'Hongkong & China' },
  { symbol: 'AXJO', name: 'S&P/ASX 200', type: 'index', price: 7780.40, change24h: 0.18, grahamScore: 0, momentum: 4.6, risk: 'Low', status: 'Verifiziert', marketCap: 1600.0, dividendYield: 4.10, volume24h: 530.0, score: 6.0, pattern: 'Double Bottom', applicationArea: 'Australischer Markt' },
  { symbol: 'SSMI', name: 'SMI Swiss Market Index', type: 'index', price: 12050.20, change24h: 0.05, grahamScore: 0, momentum: 4.0, risk: 'Low', status: 'Verifiziert', marketCap: 1400.0, dividendYield: 2.80, volume24h: 410.0, score: 5.8, pattern: 'Hammer Support', applicationArea: 'Schweizer Leitindex' },
  { symbol: 'IBEX', name: 'IBEX 35', type: 'index', price: 11120.50, change24h: -0.25, grahamScore: 0, momentum: 3.8, risk: 'Medium', status: 'Verifiziert', marketCap: 750.0, dividendYield: 3.40, volume24h: 380.0, score: 5.5, pattern: 'Double Top', applicationArea: 'Spanische Blue Chips' },
  { symbol: 'FTSEMIB', name: 'FTSE MIB', type: 'index', price: 33450.00, change24h: 0.42, grahamScore: 0, momentum: 5.4, risk: 'Medium', status: 'Verifiziert', marketCap: 820.0, dividendYield: 3.60, volume24h: 440.0, score: 6.8, pattern: 'Cup & Handle', applicationArea: 'Italienische Wirtschaft' },
  { symbol: 'BVSP', name: 'Ibovespa', type: 'index', price: 119500.00, change24h: 0.65, grahamScore: 0, momentum: 5.8, risk: 'High', status: 'Verifiziert', marketCap: 950.0, dividendYield: 4.50, volume24h: 1100.0, score: 7.1, pattern: 'Morning Star', applicationArea: 'Brasilianischer Markt' },
  { symbol: 'MXX', name: 'IPC Mexico', type: 'index', price: 52450.00, change24h: -0.85, grahamScore: 0, momentum: 3.6, risk: 'High', status: 'Verifiziert', marketCap: 450.0, dividendYield: 2.50, volume24h: 310.0, score: 5.2, pattern: 'Falling Wedge', applicationArea: 'Mexikanischer Markt' },
  { symbol: 'SSEC', name: 'SSE Composite', type: 'index', price: 3010.50, change24h: -0.42, grahamScore: 0, momentum: 3.9, risk: 'High', status: 'Verifiziert', marketCap: 6200.0, dividendYield: 2.20, volume24h: 2100.0, score: 5.4, pattern: 'Double Bottom', applicationArea: 'Festlandchina' },
  { symbol: 'BSESN', name: 'BSE Sensex', type: 'index', price: 77300.00, change24h: 0.72, grahamScore: 0, momentum: 6.2, risk: 'Medium', status: 'Verifiziert', marketCap: 4100.0, dividendYield: 1.15, volume24h: 1300.0, score: 7.6, pattern: 'Ascending Triangle', applicationArea: 'Indische Wirtschaft' },
  { symbol: 'JKSE', name: 'JSX Composite', type: 'index', price: 6880.00, change24h: 0.15, grahamScore: 0, momentum: 4.5, risk: 'Medium', status: 'Verifiziert', marketCap: 580.0, dividendYield: 2.40, volume24h: 280.0, score: 6.0, pattern: 'Hammer Support', applicationArea: 'Indonesischer Markt' },
  { symbol: 'KLSE', name: 'FTSE Bursa Malaysia KLCI', type: 'index', price: 1605.50, change24h: 0.08, grahamScore: 0, momentum: 4.2, risk: 'Low', status: 'Verifiziert', marketCap: 350.0, dividendYield: 3.20, volume24h: 190.0, score: 5.7, pattern: 'Double Bottom', applicationArea: 'Malaysischer Markt' },
  { symbol: 'STI', name: 'Straits Times Index', type: 'index', price: 3310.20, change24h: 0.12, grahamScore: 0, momentum: 4.3, risk: 'Low', status: 'Verifiziert', marketCap: 420.0, dividendYield: 3.95, volume24h: 220.0, score: 5.9, pattern: 'Cup & Handle', applicationArea: 'Singapur Markt' },
  { symbol: 'KS11', name: 'KOSPI Composite', type: 'index', price: 2750.40, change24h: 0.55, grahamScore: 0, momentum: 5.1, risk: 'Medium', status: 'Verifiziert', marketCap: 1550.0, dividendYield: 1.85, volume24h: 680.0, score: 6.6, pattern: 'Morning Star', applicationArea: 'Südkoreanischer Markt' },
  { symbol: 'TWII', name: 'TSEC Weighted Index', type: 'index', price: 22450.00, change24h: 1.05, grahamScore: 0, momentum: 7.0, risk: 'High', status: 'Verifiziert', marketCap: 2100.0, dividendYield: 2.10, volume24h: 980.0, score: 7.9, pattern: 'Ascending Channel', applicationArea: 'Taiwanese Tech' },
  { symbol: 'TA125', name: 'TA-125 Index', type: 'index', price: 1980.20, change24h: -0.15, grahamScore: 0, momentum: 4.1, risk: 'Medium', status: 'Verifiziert', marketCap: 180.0, dividendYield: 2.30, volume24h: 110.0, score: 5.5, pattern: 'Hammer Support', applicationArea: 'Israelischer Markt' },
  { symbol: 'NZ50', name: 'NZX 50 Index', type: 'index', price: 11750.00, change24h: 0.02, grahamScore: 0, momentum: 3.9, risk: 'Low', status: 'Verifiziert', marketCap: 120.0, dividendYield: 3.85, volume24h: 90.0, score: 5.6, pattern: 'Double Bottom', applicationArea: 'Neuseeland Markt' },
  { symbol: 'AORD', name: 'All Ordinaries Index', type: 'index', price: 8020.50, change24h: 0.14, grahamScore: 0, momentum: 4.5, risk: 'Low', status: 'Verifiziert', marketCap: 1750.0, dividendYield: 4.00, volume24h: 560.0, score: 6.1, pattern: 'Ascending Channel', applicationArea: 'Breiter australischer Markt' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', type: 'index', price: 12.85, change24h: -2.40, grahamScore: 0, momentum: 3.0, risk: 'High', status: 'Verifiziert', marketCap: 0.0, dividendYield: 0.00, volume24h: 310.0, score: 4.8, pattern: 'Hammer Support', applicationArea: 'Angst-Barometer' },
  { symbol: 'SDAX', name: 'SDAX', type: 'index', price: 14550.00, change24h: -0.12, grahamScore: 0, momentum: 4.1, risk: 'Medium', status: 'Verifiziert', marketCap: 150.0, dividendYield: 2.10, volume24h: 180.0, score: 5.7, pattern: 'Double Bottom', applicationArea: 'Deutsche Small Caps' },
  { symbol: 'MDAX', name: 'MDAX', type: 'index', price: 25450.00, change24h: -0.28, grahamScore: 0, momentum: 3.8, risk: 'Medium', status: 'Verifiziert', marketCap: 280.0, dividendYield: 2.45, volume24h: 320.0, score: 5.5, pattern: 'Double Top', applicationArea: 'Deutsche Mid Caps' },
  { symbol: 'TECDAX', name: 'TecDAX', type: 'index', price: 3450.00, change24h: 0.62, grahamScore: 0, momentum: 5.4, risk: 'High', status: 'Verifiziert', marketCap: 120.0, dividendYield: 1.65, volume24h: 140.0, score: 6.6, pattern: 'Ascending Triangle', applicationArea: 'Deutsche Tech-Werte' },
  { symbol: 'STOXX50E', name: 'EURO STOXX 50', type: 'index', price: 4950.20, change24h: 0.28, grahamScore: 0, momentum: 4.9, risk: 'Low', status: 'Verifiziert', marketCap: 3800.0, dividendYield: 3.15, volume24h: 1100.0, score: 6.4, pattern: 'Ascending Channel', applicationArea: 'Europäische Blue Chips' }
];

const MARKET_DATA_CACHE_TTL = 60 * 1000;

function syncAssetToRegistry(asset: any) {
  assetRegistry.updateAsset(asset.symbol, {
    price: asset.price,
    change24h: asset.change24h,
    marketCap: asset.marketCap,
    volume24h: asset.volume24h,
    score: asset.score,
    pattern: asset.pattern,
    ...(asset.circulatingSupply !== undefined ? { circulatingSupply: asset.circulatingSupply } : {}),
    ...(asset.maxSupply !== undefined ? { maxSupply: asset.maxSupply } : {}),
    ...(asset.totalSupply !== undefined ? { totalSupply: asset.totalSupply } : {}),
  });
}

async function enrichMarketDataAsset(asset: any) {
  const pattern = await computeDisplayTrendLabel(asset.symbol);
  const applicationArea = getApplicationAreaForSymbol(asset.symbol, asset.type);

  if (isStandardCryptoMarketDataAsset(asset)) {
    const canonical = await enrichStandardCryptoWithCanonicalScore(asset);
    return { ...canonical, pattern, applicationArea };
  }

  const { score, basis } = await calculateAssetScore(asset.symbol, asset.type, asset.change24h, asset.score);
  return { ...asset, pattern, applicationArea, score, scoreBasis: basis };
}

const marketDataRuntime = createApplicationMarketDataRuntime({
  fallbackAssets: FALLBACK_ASSETS,
  registryAssets: () => assetRegistry.getAssets(),
  enrichAsset: enrichMarketDataAsset,
  syncAsset: syncAssetToRegistry,
  persistSnapshots: (assets) => {
    executeSupervised('recordDailySnapshots', () => recordDailySnapshots(assets.map((a: any) => ({
      symbol: a.symbol,
      assetType: a.type,
      score: a.score,
      scoreBasis: a.scoreBasis,
      price: a.price,
    })))).catch(err => console.warn('[ScoreValidation] recordDailySnapshots fehlgeschlagen:', err?.message || err));
  },
  evaluateAlerts: (assets) => {
    executeSupervised('evaluateAlerts', () => evaluateAlerts(assets.map((a: any) => ({ symbol: a.symbol, score: a.score }))))
      .catch(err => console.warn('[Alerts] evaluateAlerts fehlgeschlagen:', err?.message || err));
  },
  onProviderFailure: (stage, error: any) => console.warn(`[Market Data] Provider stage "${stage}" failed:`, error?.message || error),
  onRefreshFailure: (error: any) => console.warn('[Market Data] Refresh failed:', error?.message || error),
  ttlMs: MARKET_DATA_CACHE_TTL,
});

app.get('/api/market-data', orchestrator.handle('Market Feed'), async (req, res) => {
  try {
    const data = await marketDataRuntime.get();
    return res.json(data);
  } catch (error: any) {
    console.warn('[API Warning] Failed to retrieve live market-data, returning resilient fallback:', error.message || error);
    const dynamicFallback = await Promise.all(assetRegistry.getAssets().map(async asset => {
      const enriched = await enrichMarketDataAsset(asset);
      return { ...enriched, status: 'Fallback', dataSource: 'fallback' as const };
    }));
    res.json(dynamicFallback);
  }
});

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK', 'MATIC'];

async function fetchAlphaVantageDailyHistory(symbol: string, isCrypto: boolean, key: string): Promise<{ date: string, close: number }[] | null> {
  try {
    let url = '';
    if (isCrypto) {
      url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${key}`;
    } else {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${key}`;
    }

    console.log(`[Alpha Vantage] Requesting URL: ${url.replace(key, 'REDACTED')}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Alpha Vantage] HTTP error ${res.status} for ${symbol}`);
      return null;
    }

    const data: any = await res.json();
    if (data['Note']) {
      console.warn(`[Alpha Vantage] Rate limit reached for ${symbol}`);
      return null;
    }
    if (data['Error Message']) {
      console.warn(`[Alpha Vantage] Error message for ${symbol}: ${data['Error Message']}`);
      return null;
    }

    const seriesKey = isCrypto ? 'Time Series (Digital Currency Daily)' : 'Time Series (Daily)';
    const series = data[seriesKey];
    if (!series) {
      console.warn(`[Alpha Vantage] No series data found under key "${seriesKey}" for ${symbol}. Response keys: ${Object.keys(data).join(', ')}`);
      return null;
    }

    const history: { date: string, close: number }[] = [];
    const keys = Object.keys(series);
    for (const dateStr of keys) {
      const entry = series[dateStr];
      const closeKey = isCrypto ? '4a. close (USD)' : '4. close';
      const closeVal = parseFloat(entry[closeKey]);
      if (isNaN(closeVal)) continue;

      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}.${parts[1]}.${parts[0].substring(2)}`;
        history.push({ date: formattedDate, close: closeVal });
      }
    }

    history.sort((a, b) => {
      const partsA = a.date.split('.');
      const partsB = b.date.split('.');
      if (partsA.length === 3 && partsB.length === 3) {
        const dA = new Date(Number('20' + partsA[2]), Number(partsA[1]) - 1, Number(partsA[0]));
        const dB = new Date(Number('20' + partsB[2]), Number(partsB[1]) - 1, Number(partsB[0]));
        return dA.getTime() - dB.getTime();
      }
      return 0;
    });

    console.log(`[Alpha Vantage] Successfully loaded ${history.length} data points for ${symbol}`);
    return history;
  } catch (err: any) {
    console.warn(`[Alpha Vantage Error] Fetch failed for ${symbol}:`, err.message || err);
    return null;
  }
}

app.get('/api/alpha-vantage-quote', orchestrator.handle('Alpha Vantage Quote'), async (req, res) => {
  const { symbol } = req.query;
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) {
    return res.status(400).json({ error: 'ALPHA_VANTAGE_KEY is not configured.' });
  }
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  const isCrypto = CRYPTO_SYMBOLS.includes(rawSymbol) || ['SOL', 'ADA', 'XRP'].includes(rawSymbol);

  try {
    let url = '';
    if (isCrypto) {
      url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${rawSymbol}&to_currency=USD&apikey=${key}`;
    } else {
      url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${rawSymbol}&apikey=${key}`;
    }

    console.log(`[Alpha Vantage Quote] Requesting URL: ${url.replace(key, 'REDACTED')}`);
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: `Alpha Vantage returned HTTP status ${response.status}` });
    }

    const data: any = await response.json();
    if (data['Note']) {
      return res.status(429).json({ error: 'Alpha Vantage Rate-Limit erreicht (5 Anfragen pro Minute). Bitte kurz warten.' });
    }
    if (data['Error Message']) {
      return res.status(400).json({ error: `Fehler von Alpha Vantage: ${data['Error Message']}` });
    }

    if (isCrypto) {
      const rateObj = data['Realtime Currency Exchange Rate'];
      if (!rateObj) {
        return res.status(444).json({ error: 'Keine Wechselkursdaten gefunden.', raw: data });
      }
      const price = parseFloat(rateObj['5. Exchange Rate']);
      const lastRefreshed = rateObj['6. Last Refreshed'];
      res.json({
        symbol: rawSymbol,
        price,
        change24h: 0.0,
        source: 'Alpha Vantage',
        timestamp: lastRefreshed
      });
    } else {
      const quoteObj = data['Global Quote'];
      if (!quoteObj || Object.keys(quoteObj).length === 0) {
        return res.status(444).json({ error: 'Keine Kursdaten für dieses Symbol gefunden.', raw: data });
      }
      const price = parseFloat(quoteObj['05. price']);
      const changePercentStr = quoteObj['10. change percent'] || '0%';
      const change24h = parseFloat(changePercentStr.replace('%', ''));
      const volume = parseFloat(quoteObj['06. volume']);
      res.json({
        symbol: rawSymbol,
        price,
        change24h: isNaN(change24h) ? 0.0 : change24h,
        volume: isNaN(volume) ? undefined : volume,
        source: 'Alpha Vantage',
        timestamp: quoteObj['07. latest trading day']
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Interner Serverfehler beim Abruf von Alpha Vantage.' });
  }
});

app.use(createDocumentationRouter());

app.post('/api/docs-file', express.json(), (req, res) => {
  const { path: docPath, content } = req.body;
  if (!docPath || content === undefined) {
    return res.status(400).json({ error: 'Path and content parameters are required.' });
  }

  const sanitizedPath = String(docPath)
    .replace(/\.\./g, '')
    .replace(/\\/g, '/')
    .trim();

  const absolutePath = path.join(process.cwd(), 'docs', sanitizedPath);

  if (!absolutePath.startsWith(path.join(process.cwd(), 'docs'))) {
    return res.status(403).json({ error: 'Access denied: Path lies outside of secure /docs boundary.' });
  }

  try {
    const parentDir = path.dirname(absolutePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, content, 'utf-8');
    res.json({ success: true, path: sanitizedPath });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Schreiben der Datei: ${err.message || err}` });
  }
});

app.use(createHistoryRouter());

app.get('/api/crypto-scoring/:symbol', async (req, res) => {
  const quota = await enforceScreeningQuota(req);
  if (!quota.allowed) {
    return res.status(429).json({
      error: 'Tägliches Screening-Limit erreicht. Upgrade auf PRO für unbegrenzte Screenings.',
      reason: quota.reason,
    });
  }

  const symbol = req.params.symbol.toUpperCase();
  const asset = assetRegistry.getAsset(symbol) || FALLBACK_ASSETS.find(a => a.symbol === symbol);
  const change24h = asset ? asset.change24h : 0;
  const isMemeCoin = (asset && (asset as any).subtype === 'memecoin') || MEME_COIN_SYMBOLS.includes(symbol);

  if (!isMemeCoin) {
    return res.status(503).json({
      status: 'SCORING_BOUNDARY_VIOLATION',
      scoreEligible: false,
      error: 'Standard-Crypto must be handled by the canonical scoring compatibility router.',
      canonicalEndpoint: '/api/crypto/score',
    });
  }

  const inputs = await MemeCoinScoringService.generateMemeCoinInputs(symbol, change24h);
  const result = MemeCoinScoringService.scoreMemeCoin(inputs);
  return res.json({
    inputs,
    result,
    isMemeCoin: true,
    scoreBasis: 'market-data'
  });
});

app.post('/api/crypto-scoring/:symbol', express.json(), async (req, res) => {
  const quota = await enforceScreeningQuota(req);
  if (!quota.allowed) {
    return res.status(429).json({
      error: 'Tägliches Screening-Limit erreicht. Upgrade auf PRO für unbegrenzte Screenings.',
      reason: quota.reason,
    });
  }

  const symbol = req.params.symbol.toUpperCase();
  const customInputs = req.body;
  const asset = assetRegistry.getAsset(symbol) || FALLBACK_ASSETS.find(a => a.symbol === symbol);
  const change24h = asset ? asset.change24h : 0;
  const isMemeCoin = (asset && (asset as any).subtype === 'memecoin') || MEME_COIN_SYMBOLS.includes(symbol);

  if (!isMemeCoin) {
    return res.status(503).json({
      status: 'SCORING_BOUNDARY_VIOLATION',
      scoreEligible: false,
      error: 'Standard-Crypto must be handled by the canonical scoring compatibility router.',
      canonicalEndpoint: '/api/crypto/score',
    });
  }

  const hasCustomInputs = customInputs && Object.keys(customInputs).length > 0;
  const defaultInputs = await MemeCoinScoringService.generateMemeCoinInputs(symbol, change24h);
  const mergedInputs = {
    ...defaultInputs,
    ...customInputs,
    coin: symbol
  };
  const result = MemeCoinScoringService.scoreMemeCoin(mergedInputs);
  return res.json({
    inputs: mergedInputs,
    result,
    isMemeCoin: true,
    scoreBasis: hasCustomInputs ? 'user-adjusted' : 'market-data'
  });
});

app.post('/api/market-sentiment/simulate-shock', express.json(), orchestrator.handle('Market Sentiment Simulator'), async (req, res) => {
  if (!anthropic && !openai) {
    return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY oder OPENAI_API_KEY erforderlich).' });
  }
  const symbol = (req.body.symbol as string || 'BTC').toUpperCase();
  const assetClass = (req.body.assetClass as string || 'Crypto');
  const shockScenario = (req.body.shockScenario as string || 'Fed-Zinsanhebung');

  try {
    const result = await generateStructuredWithFallback({
      anthropic,
      openai,
      promptId: 'server-market-sentiment-shock',
      systemInstruction: 'Du bist ein hochprofessioneller Quant-Analyst. Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.',
      contents: `Analysiere den theoretischen Einfluss eines makroökonomischen Schocks oder Finanzereignisses auf ein Asset.

Asset: "${symbol}" (Kategorie: ${assetClass})
Simulierter Schock / Ereignis: "${shockScenario}"

Berechne den potenziellen Einfluss: originalScore (0-100, normales Sentiment vor dem Schock), newScore (0-100, projiziertes Sentiment nach dem Schock), impactLabel (Stark Negativ | Negativ | Neutral | Positiv | Stark Positiv), transmissionMechanism (professionelle Erklärung der Übertragungskanäle in deutscher Sprache, max. 3 Sätze), predictedDrivers (potenzielle Markttreiber nach dem Schock, je mit text und impact Bullisch|Bearisch|Neutral), riskLevel (Niedrig | Mittel | Hoch | Extrem).`,
      schema: {
        type: Type.OBJECT,
        properties: {
          originalScore: { type: Type.NUMBER },
          newScore: { type: Type.NUMBER },
          impactLabel: { type: Type.STRING },
          transmissionMechanism: { type: Type.STRING },
          predictedDrivers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING }, impact: { type: Type.STRING } },
              required: ['text', 'impact'],
            },
          },
          riskLevel: { type: Type.STRING },
        },
        required: ['originalScore', 'newScore', 'impactLabel', 'transmissionMechanism', 'predictedDrivers', 'riskLevel'],
      },
      requestId: req.requestId,
    });

    if (!result) {
      throw new Error('Kein KI-Provider konfiguriert oder alle konfigurierten Provider fehlgeschlagen.');
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('Error simulating market sentiment shock:', error);

    let originalScore = 55;
    let newScore = 40;
    let impactLabel = 'Negativ';
    let riskLevel = 'Hoch';

    if (shockScenario.toLowerCase().includes('senkt') || shockScenario.toLowerCase().includes('cut') || shockScenario.toLowerCase().includes('beat') || shockScenario.toLowerCase().includes('positive')) {
      newScore = 75;
      impactLabel = 'Positiv';
      riskLevel = 'Niedrig';
    }

    res.json({
      originalScore,
      newScore,
      impactLabel,
      transmissionMechanism: `Die Simulation prognostiziert, dass "${shockScenario}" signifikante makroökonomische Ströme auslöst. Bei ${symbol} führt dies zu einer unmittelbaren Umschichtung von Liquidität und einer Anpassung der Risikoprämien im ${assetClass}-Sektor.`,
      predictedDrivers: [
        { text: `Unmittelbare Markt-Reaktion auf "${shockScenario}"`, impact: impactLabel === 'Positiv' ? 'Bullisch' : 'Bearisch' },
        { text: 'Umschichtung von Portfolio-Liquidität', impact: 'Neutral' }
      ],
      riskLevel
    });
  }
});

app.post('/api/portfolio-review', express.json(), orchestrator.handle('Portfolio Review'), async (req, res) => {
  if (!anthropic && !openai) {
    return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY oder OPENAI_API_KEY erforderlich).' });
  }
  const { allocation, metrics1Y, metrics3Y, metrics5Y } = req.body;

  try {
    const result = await generateStructuredWithFallback({
      anthropic,
      openai,
      promptId: 'server-portfolio-review',
      systemInstruction: 'Du bist ein hochprofessioneller Quant-Portfolio-Analyst und Risk-Officer bei CAPITAL-AI. Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.',
      contents: `Analysiere die folgende Portfolio-Allokation und deren historische Backtest-Ergebnisse (1, 3 und 5 Jahre):

Allokation:
${JSON.stringify(allocation, null, 2)}

Performance-Metriken:
- 1-Jahr-Zeitraum: Rendite: ${metrics1Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${metrics1Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${metrics1Y?.sharpeRatio?.toFixed(2)}
- 3-Jahre-Zeitraum: Rendite: ${metrics3Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${metrics3Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${metrics3Y?.sharpeRatio?.toFixed(2)}
- 5-Jahre-Zeitraum: Rendite: ${metrics5Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${metrics5Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${metrics5Y?.sharpeRatio?.toFixed(2)}

Generiere ein professionelles, fundiertes Review in deutscher Sprache: executiveSummary (prägnanter Absatz, 2-3 Sätze, der das Risiko-Rendite-Profil dieser Allokation zusammenfasst), riskAssessment (spezifische Risikobetrachtung der Kombination aus den gewählten Assets, z.B. Diversifikation, Korrelationen, Volatilität), optimizations (Liste konkreter Verbesserungsvorschläge, z.B. Erhöhung von Gold zur Reduktion von Drawdowns oder Reduktion von Krypto bei hoher Volatilität).`,
      schema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          riskAssessment: { type: Type.STRING },
          optimizations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['executiveSummary', 'riskAssessment', 'optimizations'],
      },
      requestId: req.requestId,
    });

    if (!result) {
      throw new Error('Kein KI-Provider konfiguriert oder alle konfigurierten Provider fehlgeschlagen.');
    }

    res.json(result.data);
  } catch (error: any) {
    console.log('[System Notice] Portfolio Review generator: utilizing quantitative dynamic metrics.');

    const alloc = Array.isArray(allocation) ? allocation : [];
    const isCryptoHeavy = alloc.some((item: any) => {
      const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA'].includes(String(item.symbol || '').toUpperCase());
      return isCrypto && (item.weight || 0) > 30;
    });

    const hasGold = alloc.some((item: any) => String(item.symbol || '').toUpperCase() === 'GLD' && (item.weight || 0) > 5);

    const sharpe = metrics3Y?.sharpeRatio || metrics1Y?.sharpeRatio || 1.0;
    const maxDd = metrics3Y?.maxDrawdown || metrics1Y?.maxDrawdown || 15;
    const annualReturn = metrics3Y?.strategyReturn || metrics1Y?.strategyReturn || 10;

    let executiveSummary = '';
    let riskAssessment = '';
    const optimizations = [];

    if (sharpe >= 1.5) {
      executiveSummary = `Diese Allokation demonstriert ein hocheffizientes Risiko-Rendite-Profil mit einer hervorragenden Sharpe Ratio von ${sharpe.toFixed(2)}. Die historische Performance liefert starke risikobereinigte Erträge über die analysierten Zeiträume.`;
      riskAssessment = `Das Gesamtrisiko ist dank einer ausgewogenen Streuung exzellent kontrolliert. Der maximale Drawdown blieb mit -${maxDd.toFixed(2)}% in einem sehr gesunden Rahmen, was auf ein resilientes Portfolio hindeutet.`;
    } else if (sharpe >= 0.8) {
      executiveSummary = `Die Allokation weist ein solides und stabiles Risiko-Rendite-Profil auf. Mit einer Sharpe Ratio von ${sharpe.toFixed(2)} erzielt das Portfolio eine angemessene Risikoprämie über dem risikofreien Zinssatz.`;
      riskAssessment = `Das Portfolio zeigt eine moderate, marktübliche Volatilität. Der maximale historische Drawdown von -${maxDd.toFixed(2)}% spiegelt zyklische Schwankungen wider, die durch gezielte Diversifikation weiter abgefedert werden können.`;
    } else {
      executiveSummary = `Das Portfolio zeigt im historischen Vergleich ein suboptimales Verhältnis zwischen Risiko und Rendite (Sharpe Ratio: ${sharpe.toFixed(2)}). Die Erträge von durchschnittlich ${annualReturn.toFixed(2)}% rechtfertigen die eingegangenen Schwankungen nur unzureichend.`;
      riskAssessment = `Es besteht ein erhöhtes Drawdown-Risiko von bis zu -${maxDd.toFixed(2)}%. Das Portfolio weist strukturelle Klumpenrisiken auf, die in volatilen Marktphasen zu empfindlichen temporären Buchverlusten führen können.`;
    }

    if (isCryptoHeavy) {
      optimizations.push('Reduzierung des hohen Krypto-Gewichts (aktuell über 30%) zur drastischen Senkung der Portfolio-Volatilität und des maximalen Drawdowns.');
    } else if (!isCryptoHeavy && alloc.length > 0) {
      optimizations.push('Erwägen Sie eine kleine, kontrollierte Beimischung (3-5%) von etablierten Kryptowerten (BTC/ETH), um das Gesamtrenditepotenzial bei moderatem Risikoaufschlag zu optimieren.');
    }

    if (!hasGold) {
      optimizations.push('Integration einer defensiven, unkorrelierten Komponente wie Gold (GLD) mit 5-10% Gewichtung zur signifikanten Absicherung bei geopolitischen Krisen und globalen Markt-Drawdowns.');
    } else {
      optimizations.push('Systematisches, antizyklisches Rebalancing des Gold-Anteils zur kontinuierlichen Gewährleistung der Absicherungsfunktion.');
    }

    if (maxDd > 20) {
      optimizations.push('Erhöhung des Anteils an liquiden Blue-Chip-Aktien oder konservativen Devisen (z.B. USDCHF), um den maximalen Drawdown unter die kritische Schwelle von 20% zu stabilisieren.');
    } else {
      optimizations.push('Optimierung der Rebalancing-Frequenz (z.B. quartalsweise), um Marktgewinne systematisch zu sichern und Abweichungen von der strategischen Asset-Allokation zu minimieren.');
    }

    res.json({
      executiveSummary,
      riskAssessment,
      optimizations
    });
  }
});

async function startServer() {
  validateRuntimeSecrets(isProductionEnv);
  await runIamSchemaHealthCheck();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { redirect: false, index: false }));
    registerProductionSpaFallback(app, distPath);
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    serverLogger.error('Unbehandelter Route-Fehler', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: err?.message || String(err),
    });
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: 'Interner Serverfehler.', requestId: req.requestId });
  });

  let marketDataRefreshTimer: NodeJS.Timeout | null = null;
  let shutdownStarted = false;

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);

    startRecursiveFileWatcher();

    void runAlpacaShadowStartupSmoke()
      .then((summary) => serverLogger.info('Alpaca shadow startup smoke', summary))
      .catch(() => serverLogger.warn('Alpaca shadow startup smoke failed without a provider observation.'));

    console.log('[Market Data] Initiating background fetch to populate AssetRegistry...');
    marketDataRuntime.backgroundRefresh().then(data => {
      if (data) {
        console.log(`[Market Data] Successfully pre-cached ${data.length} assets on startup.`);
      } else {
        console.warn('[Market Data] Pre-cache on startup failed.');
      }
    });

    marketDataRefreshTimer = setInterval(async () => {
      const data = await marketDataRuntime.backgroundRefresh();
      if (data) {
        console.log('[Market Data] Background cache refresh completed.');
      } else {
        console.warn('[Market Data] Background refresh failed.');
      }
    }, 60 * 1000);

    startOutboxWorker();
    serverLogger.info('Stripe configuration validation', getStripeConfigurationStatus(getCleanEnv));
  });

  const shutdown = (signal: 'SIGTERM' | 'SIGINT') => {
    if (shutdownStarted) return;
    shutdownStarted = true;
    serverLogger.info('Graceful shutdown initiated', { signal });

    if (marketDataRefreshTimer) {
      clearInterval(marketDataRefreshTimer);
      marketDataRefreshTimer = null;
    }
    stopOutboxWorker();

    const forceExitTimer = setTimeout(() => {
      serverLogger.error('Graceful shutdown timeout exceeded', { signal, timeoutMs: 25_000 });
      process.exit(1);
    }, 25_000);
    forceExitTimer.unref();

    httpServer.close((error?: Error) => {
      clearTimeout(forceExitTimer);
      if (error) {
        serverLogger.error('HTTP server close failed during shutdown', { signal, error: error.message });
        process.exit(1);
      }
      serverLogger.info('Graceful shutdown completed', { signal });
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

startServer();
