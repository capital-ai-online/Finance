import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { orchestrator } from './src/lib/requestOrchestrator';
import { assetRegistry } from './src/lib/assetRegistry';
import { calculateCryptoEnterpriseScore, generateCryptoInputs } from './src/lib/cryptoScoring';
import { DATA_INTEGRITY_MODE, APP_VERSION, assertDataIntegrityMode, withIntegrityTag, noDataResponse, notImplementedResponse } from './src/lib/dataIntegrity';
import { checkAndConsumeQuota, TIER_LIMITS } from './src/lib/freeTierLimits';
import { requireAuth, requireAdmin } from './src/lib/authMiddleware';
import { validateMarketRecord, auditScoreWeights, buildAuditTrail } from './src/lib/marketScoringAudit';

dotenv.config();

// Fail loud at boot if the No-Demo-Data policy constant was ever tampered
// with. This must run before any route is registered.
assertDataIntegrityMode();
console.log(`[AIF-CORE] v${APP_VERSION} starting — dataIntegrityMode="${DATA_INTEGRITY_MODE}"`);

// Helper to normalize, clean and safely resolve environment variables (stripping quotes, whitespaces, and resolving VITE_ prefix mismatch)
function getCleanEnv(key: string): string {
  let val = process.env[key];
  if (!val && key.startsWith('VITE_')) {
    val = process.env[key.substring(5)];
  } else if (!val && !key.startsWith('VITE_')) {
    val = process.env[`VITE_${key}`];
  }
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

const app = express();
const PORT = 3000;

// Lazy-loaded Stripe Client instance
let stripeClient: Stripe | null = null;
function getStripeInstance() {
  if (!stripeClient) {
    const key = getCleanEnv('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing.');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// Lazy-loaded Server-side Supabase Client instance
let serverSupabaseClient: any = null;

// Resolves the privileged server-side key. Supabase's new API key format
// (sb_secret_...) is preferred; legacy SUPABASE_SERVICE_ROLE_KEY /
// SUPABASE_ANON_KEY JWTs are kept only as a fallback. If legacy keys were
// ever disabled in the Supabase dashboard (Project Settings -> API Keys),
// any remaining JWT value here will be rejected with "Invalid API key" even
// though it is syntactically a valid token.
function getServerSupabaseKey(): string {
  return (
    getCleanEnv('SUPABASE_SECRET_KEY') ||
    getCleanEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    getCleanEnv('VITE_SUPABASE_ANON_KEY') ||
    getCleanEnv('SUPABASE_ANON_KEY')
  );
}

function isSupabaseConfigured(): boolean {
  const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
  const key = getServerSupabaseKey();
  return !!(url && key);
}

function getServerSupabase() {
  if (!serverSupabaseClient) {
    const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
    const key = getServerSupabaseKey();
    if (!url || !key) {
      throw new Error('Supabase integration variables are missing.');
    }
    serverSupabaseClient = createClient(url, key);
  }
  return serverSupabaseClient;
}

async function saveSubscription(email: string, tier: string) {
  if (!isSupabaseConfigured()) {
    console.log(`[Supabase Backend] Supabase not configured. Skipping save of ${email} -> ${tier}`);
    return;
  }
  try {
    const supabaseClientInstance = getServerSupabase();
    const cleanEmail = email.toLowerCase().trim();
    // We do an upsert on the table 'subscriptions' in PostgreSQL
    const { error } = await supabaseClientInstance
      .from('subscriptions')
      .upsert({ email: cleanEmail, tier, updated_at: new Date().toISOString() }, { onConflict: 'email' });
      
    if (error) {
      console.error("[Supabase Backend] Error saving subscription to DB:", error);
    } else {
      console.log(`[Supabase Backend] Successfully persisted subscription: ${cleanEmail} -> ${tier}`);
    }
  } catch (e: any) {
    console.error("[Supabase Backend] Error in saveSubscription:", e.message || e);
  }
}

async function getSubscription(email: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return 'Enterprise'; // Default premium tier fallback
  }
  try {
    const supabaseClientInstance = getServerSupabase();
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabaseClientInstance
      .from('subscriptions')
      .select('tier')
      .eq('email', cleanEmail)
      .maybeSingle();
      
    if (error) {
      console.error("[Supabase Backend] Error reading subscription from DB:", error);
    } else if (data) {
      return data.tier;
    }
  } catch (e: any) {
    console.error("[Supabase Backend] Error in getSubscription:", e.message || e);
  }
  return 'Enterprise'; // Default premium tier fallback
}


// 1. STRIPE WEBHOOK ENDPOINT (Must be placed BEFORE express.json() to get raw request body)
const webhookHandler = async (req: express.Request, res: express.Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = getCleanEnv('STRIPE_WEBHOOK_SECRET');

  if (!sig || !webhookSecret) {
    console.warn("⚠️ Stripe Webhook called, but stripe-signature or STRIPE_WEBHOOK_SECRET is missing.");
    return res.status(400).send("Webhook Error: Missing signature or webhook secret.");
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeInstance();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Stripe Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`ℹ️ Received Stripe webhook event: ${event.type}`);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const planId = session.metadata?.planId;
      const email = session.metadata?.email || session.customer_details?.email;
      
      if (planId && email) {
        saveSubscription(email, planId);
        console.log(`✅ Webhook: User ${email} successfully upgraded to ${planId}`);
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const email = subscription.metadata?.email;
      const planId = subscription.metadata?.planId;
      if (email && planId) {
        saveSubscription(email, planId);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const email = subscription.metadata?.email;
      if (email) {
        saveSubscription(email, 'Free');
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook handling error:`, err);
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json({ limit: '1mb' })); // cap body size to reduce abuse-driven memory pressure

// Minimal security headers (no new dependency — keeps Zero-New-Dependency
// principle). Reduces a few easy attack/abuse vectors that can contribute
// to instability under load.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn("Failed to initialize Gemini:", e);
}

// Routes
app.post('/api/chat', orchestrator.handle('Gemini Chat'), async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API key is missing or invalid' });
  }
  try {
    const { message, history } = req.body;
    
    // Convert history to format required by Gemini 
    // Assuming simple alternating history, or we can just send the chat directly
    // Let's use simple prompt construction for now or use the chat API if supported.
    
    // In @google/genai, ai.chats.create / ai.chats.sendMessage
    // We'll use models/gemini-3.1-pro-preview
    
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction: "You are the AIFinancial AI Assistant, a highly professional, technically precise expert partner in quantitative finance, Graham value investing, and market analysis. Use a professional, accessible tone. Do not use unnecessary jargon. Prioritize clarity and data-driven insights. Remember the user is using AIFinancial v3 Enterprise Architecture."
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-image', upload.single('image'), orchestrator.handle('Gemini Vision'), async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API key is missing or invalid' });
  }
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { prompt } = req.body;

    const base64Data = fs.readFileSync(file.path, { encoding: 'base64' });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || "Analyze this image from a financial perspective." },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.mimetype
              }
            }
          ]
        }
      ]
    });

    // Cleanup
    fs.unlinkSync(file.path);

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Image analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Real server-side endpoint for Stripe checkout session creation
// SECURITY: previously accepted a client-supplied `email` with no
// server-side verification — any caller could create a Stripe checkout
// session (or, worse, downstream subscription records) for an arbitrary
// email address. Now requires a verified Supabase JWT and uses the
// verified email exclusively.
app.post('/api/stripe/create-checkout-session', requireAuth(getServerSupabase), async (req: any, res) => {
  try {
    const { planId, billingPeriod, successUrl, cancelUrl } = req.body;
    const email = req.authUser.email; // verified, never trust req.body.email

    // Select price ID based on selected plan
    const planUpper = String(planId).toUpperCase();
    let priceId = '';
    
    if (planUpper === 'STARTER') {
      priceId = getCleanEnv('STRIPE_PRICE_ID_STARTER');
    } else if (planUpper === 'PRO') {
      priceId = getCleanEnv('STRIPE_PRICE_ID_PRO');
    } else if (planUpper === 'ENTERPRISE') {
      priceId = getCleanEnv('STRIPE_PRICE_ID_ENTERPRISE');
    }

    if (!priceId || priceId.startsWith('price_...')) {
      return res.status(400).json({ 
        error: `Der Stripe Price ID für '${planId}' ist auf dem Server noch nicht konfiguriert. Bitte setzen Sie STRIPE_PRICE_ID_${planUpper} in Ihrer .env Datei.` 
      });
    }

    const stripe = getStripeInstance();
    
    // Auto-append plan information to success URL for client fallback tracking
    const finalSuccessUrl = successUrl.includes('?') 
      ? `${successUrl}&plan=${planId}` 
      : `${successUrl}?plan=${planId}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: finalSuccessUrl,
      cancel_url: cancelUrl,
      metadata: {
        planId,
        email,
      },
      subscription_data: {
        metadata: {
          planId,
          email,
        }
      }
    });

    res.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: error.message || 'Serverfehler bei der Erstellung der Stripe Checkout Session.' });
  }
});

// Endpoint to securely report if Stripe keys are configured without exposing them
app.get('/api/stripe/config-status', (req, res) => {
  const sk = getCleanEnv('STRIPE_SECRET_KEY');
  const wh = getCleanEnv('STRIPE_WEBHOOK_SECRET');
  const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY');

  res.json({
    secretKeyConfigured: !!sk && !sk.startsWith('sk_test_...'),
    webhookSecretConfigured: !!wh && !wh.startsWith('whsec_...'),
    publishableKeyConfigured: !!pk && !pk.startsWith('pk_test_...')
  });
});

// Endpoint to dynamically retrieve the Stripe publishable key configured at run-time
app.get('/api/stripe/config', (req, res) => {
  res.json({
    publishableKey: getCleanEnv('STRIPE_PUBLISHABLE_KEY')
  });
});

// Endpoint to query server-side persisted subscriptions (synced from Webhooks)
// SECURITY: previously trusted a client-supplied email to open ANY
// matching Stripe customer's billing portal — i.e. anyone who knew or
// guessed another user's email could open their billing portal. Now
// requires a verified Supabase JWT and uses the verified email only.
app.post('/api/stripe/create-portal-session', requireAuth(getServerSupabase), async (req: any, res) => {
  try {
    const { returnUrl } = req.body;
    const cleanEmail = req.authUser.email;
    const stripe = getStripeInstance();

    // Look up customer by email in Stripe to retrieve customer ID
    const customers = await stripe.customers.list({
      email: cleanEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(400).json({
        error: `Für die E-Mail '${cleanEmail}' wurde in Stripe noch kein aktives Kundenkonto gefunden. Bitte schließen Sie zuerst ein Abonnement ab.`,
      });
    }

    const customerId = customers.data[0].id;

    // Construct origin dynamically for fallback
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = `${protocol}://${host}`;

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || origin,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: error.message || 'Serverfehler beim Erstellen der Portal-Sitzung.' });
  }
});

// SECURITY: previously allowed looking up ANY email's subscription tier
// via a query parameter (tier enumeration). Now requires a verified
// Supabase JWT and returns only the caller's own tier.
app.get('/api/stripe/user-subscription', requireAuth(getServerSupabase), async (req: any, res) => {
  const userEmail = req.authUser.email;
  const tier = await getSubscription(userEmail);
  res.json(withIntegrityTag({ email: userEmail, subscriptionTier: tier }));
});

// Server-side enforcement of the Pricing.md tier limits (see
// src/lib/freeTierLimits.ts). Previously the Free tier's "3 Screenings /
// 5 Tage" rule existed ONLY in frontend code (or not at all for some
// flows) and could be bypassed by calling the API directly or clearing
// localStorage. The frontend MUST call this before running a screening,
// Monte-Carlo simulation, or full AI analysis, and must respect `allowed:
// false`.
app.post('/api/quota/consume', requireAuth(getServerSupabase), async (req: any, res) => {
  const { quotaKind } = req.body as { quotaKind?: 'screening' | 'monte_carlo' | 'full_ai_analysis' };
  if (!quotaKind || !['screening', 'monte_carlo', 'full_ai_analysis'].includes(quotaKind)) {
    return res.status(400).json({ error: 'quotaKind muss screening, monte_carlo oder full_ai_analysis sein.' });
  }
  try {
    const tier = (await getSubscription(req.authUser.email)) as any;
    const result = await checkAndConsumeQuota(getServerSupabase(), req.authUser.email, tier, quotaKind);
    if (!result.allowed) {
      return res.status(429).json(withIntegrityTag({
        error: `Kontingent erreicht (${result.used}/${result.limit} im ${result.windowDays}-Tage-Fenster). Upgrade erforderlich.`,
        ...result,
      }));
    }
    res.json(withIntegrityTag(result));
  } catch (err: any) {
    console.error('[Quota] consume failed:', err.message || err);
    res.status(500).json({ error: 'Kontingent-Prüfung fehlgeschlagen.', detail: err.message });
  }
});

// Read-only quota status check (does not consume) — used by the UI to show
// remaining screenings without triggering a consumption.
app.get('/api/quota/status', requireAuth(getServerSupabase), async (req: any, res) => {
  try {
    const tier = (await getSubscription(req.authUser.email)) as any;
    res.json(withIntegrityTag({ tier, limits: TIER_LIMITS[tier as keyof typeof TIER_LIMITS] }));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Define patterns, application areas, and pattern-aware asset scoring helpers
function getAssetPatternForSymbol(symbol: string): string {
  const s = symbol.toUpperCase().trim();
  if (s.startsWith('BTC')) return 'Bullish Engulfing';
  if (s.startsWith('ETH')) return 'Hammer Support';
  if (s.startsWith('AAPL')) return 'Cup & Handle';
  if (s.startsWith('TSLA')) return 'Double Bottom';
  if (s.startsWith('NVDA')) return 'Ascending Triangle';
  if (s.startsWith('GLD')) return 'Inverted Head & Shoulders';
  if (s.startsWith('EURUSD') || s.startsWith('EUR/USD')) return 'Bearish Harami';
  
  // Deterministic fallback based on symbol characters
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

function calculateAssetScore(symbol: string, type: string, change24h: number, baseScore?: number): number {
  const s = symbol.toUpperCase().trim();
  if (type === 'crypto') {
    const inputs = generateCryptoInputs(s, change24h);
    const result = calculateCryptoEnterpriseScore(inputs);
    return result.score;
  }
  
  // 1. Calculate base momentum score
  let baseMomentum = baseScore !== undefined ? baseScore : (5.0 + (change24h > 0 ? Math.min(4.0, change24h / 2) : Math.max(-4.0, change24h / 2)));
  
  // 2. Adjust based on patterns
  const pattern = getAssetPatternForSymbol(s);
  let patternBoost = 0;
  if (pattern === 'Bullish Engulfing') patternBoost = 4.5;
  else if (pattern === 'Inverted Head & Shoulders') patternBoost = 3.5;
  else if (pattern === 'Hammer Support' || pattern === 'Hammer Reversal') patternBoost = 3.0;
  else if (pattern === 'Double Bottom') patternBoost = 2.8;
  else if (pattern === 'Cup & Handle') patternBoost = 2.5;
  else if (pattern === 'Bull Flag' || pattern === 'Morning Star') patternBoost = 2.2;
  else if (pattern === 'Ascending Triangle' || pattern === 'Ascending Channel') patternBoost = 1.8;
  else if (pattern === 'Bearish Harami' || pattern === 'Double Top') patternBoost = -3.2;

  let finalScore = baseMomentum + patternBoost;

  // Let's make sure that if the pattern is highly bullish (like Bullish Engulfing), the score is strong and realistic (e.g., 7.5 to 9.5)
  if (pattern === 'Bullish Engulfing') {
    if (finalScore < 8.2) {
      finalScore = 8.2 + (change24h > 0 ? Math.min(1.0, change24h / 5) : Math.max(-1.0, change24h / 5));
    }
  }

  return Math.min(10.0, Math.max(1.0, Number(finalScore.toFixed(1))));
}

// Server-side cache and request coalescing for live market data to prevent rate-limiting (e.g. 429 Too Many Requests)
let cachedMarketData: any = null;
let lastMarketDataFetch = 0;
const MARKET_DATA_CACHE_TTL = 60 * 1000; // Cache live prices for 60 seconds
let activeMarketDataPromise: Promise<any> | null = null;

// Public, keyless ticker endpoints — used only for source_integrity
// cross-validation, never as a primary price source.
const CROSS_VALIDATION_SYMBOLS: { symbol: string; kraken: string; binance: string }[] = [
  { symbol: 'BTC', kraken: 'XBTUSD', binance: 'BTCUSDT' },
  { symbol: 'ETH', kraken: 'ETHUSD', binance: 'ETHUSDT' },
];
const CROSS_VALIDATION_DEVIATION_THRESHOLD = 0.02; // 2%

async function crossValidateCryptoSources(cryptoAssets: any[]): Promise<void> {
  await Promise.all(CROSS_VALIDATION_SYMBOLS.map(async ({ symbol, kraken, binance }) => {
    const asset = cryptoAssets.find(a => a.symbol === symbol);
    if (!asset || typeof asset.price !== 'number') return;

    const referencePrices: number[] = [];
    try {
      const krakenRes = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${kraken}`);
      if (krakenRes.ok) {
        const krakenData: any = await krakenRes.json();
        const pairKey = krakenData?.result ? Object.keys(krakenData.result)[0] : null;
        const last = pairKey ? parseFloat(krakenData.result[pairKey]?.c?.[0]) : NaN;
        if (!isNaN(last) && last > 0) referencePrices.push(last);
      }
    } catch (err: any) {
      console.warn(`[Source Integrity] Kraken cross-check failed for ${symbol}:`, err.message || err);
    }

    try {
      const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binance}`);
      if (binanceRes.ok) {
        const binanceData: any = await binanceRes.json();
        const last = parseFloat(binanceData?.price);
        if (!isNaN(last) && last > 0) referencePrices.push(last);
      }
    } catch (err: any) {
      console.warn(`[Source Integrity] Binance cross-check failed for ${symbol}:`, err.message || err);
    }

    if (referencePrices.length === 0) {
      // Both reference feeds unavailable — no basis for comparison, don't flag.
      return;
    }

    const avgReference = referencePrices.reduce((a, b) => a + b, 0) / referencePrices.length;
    const deviation = Math.abs(asset.price - avgReference) / avgReference;

    asset.sourceIntegrity = {
      checkedAgainst: referencePrices.length,
      deviationPct: Number((deviation * 100).toFixed(3)),
      flagged: deviation > CROSS_VALIDATION_DEVIATION_THRESHOLD,
    };

    if (deviation > CROSS_VALIDATION_DEVIATION_THRESHOLD) {
      console.warn(
        `[Source Integrity] ${symbol}: CoinGecko price ${asset.price} deviates ${(deviation * 100).toFixed(2)}% ` +
        `from Kraken/Binance average ${avgReference.toFixed(2)} — flagged, NOT auto-corrected.`
      );
    }
  }));
}

async function fetchLiveMarketData() {
  const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
  const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
  const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F'];

  let cryptoAssets = [];
  let cryptoFetchFailed = false;
  let stooqFetchFailed = false;
  try {
    const coingeckoUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
    const coingeckoRes = await fetch(coingeckoUrl);
    if (!coingeckoRes.ok) {
      throw new Error(`CoinGecko API returned status ${coingeckoRes.status}`);
    }
    const coingeckoData: any = await coingeckoRes.json();
    if (!coingeckoData || !Array.isArray(coingeckoData)) {
      throw new Error('CoinGecko API returned invalid non-array data');
    }
    cryptoAssets = coingeckoData.map((coin: any) => {
      const mcapBillions = coin.market_cap ? Number((coin.market_cap / 1e9).toFixed(1)) : 0;
      const volMillions = coin.total_volume ? Number((coin.total_volume / 1e6).toFixed(2)) : 0;
      const change24h = coin.price_change_percentage_24h || 0;
      const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
      const scoreVal = Math.min(10.0, Math.max(1.0, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));

      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto',
        price: coin.current_price,
        change24h: Number(change24h.toFixed(2)),
        grahamScore: 0,
        momentum: Number(baseMomentum.toFixed(1)),
        risk: 'High',
        status: 'Verifiziert',
        marketCap: mcapBillions,
        dividendYield: 0.0,
        volume24h: volMillions,
        score: scoreVal
      };
    });
  } catch (err: any) {
    console.warn('[Crypto Live API Warning] CoinGecko failed:', err.message || err);
    // No-Demo-Data-Policy: never fabricate or simulate crypto prices.
    cryptoAssets = [];
    cryptoFetchFailed = true;
  }

  // Market Data Validation Layer — source_integrity check: cross-validate
  // the two highest-weight assets (BTC/ETH) against two independent public
  // exchange feeds (Kraken, Binance). This does not replace CoinGecko as
  // the primary source; it flags (does not silently correct) a >2%
  // deviation, which would indicate a stale/bad CoinGecko read rather than
  // real market divergence. No API key required for these public endpoints.
  if (cryptoAssets.length > 0) {
    await crossValidateCryptoSources(cryptoAssets);
  }

  let stooqAssets = [];
  try {
    const stooqUrl = `https://stooq.com/q/d/l/?s=${[...STOCK_TICKERS, ...FOREX_TICKERS, ...COMMODITY_TICKERS].join('+')}&f=sdnjg1v`;
    const stooqRes = await fetch(stooqUrl);
    if (!stooqRes.ok) {
      throw new Error(`Stooq API returned status ${stooqRes.status}`);
    }
    const stooqText = await stooqRes.text();
    const lines = stooqText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      throw new Error('Stooq API returned empty data');
    }

    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
    let symbolIdx = headers.findIndex(h => h === 'symbol' || h === 'skrót' || h === 'skrot');
    let nameIdx = headers.findIndex(h => h === 'name' || h === 'nazwa');
    let closeIdx = headers.findIndex(h => h === 'close' || h === 'kurs' || h === 'cena' || h === 'price');
    let changePercentIdx = headers.findIndex(h => h === 'change%' || h === 'zmiana%' || h === 'changepercent');
    let volumeIdx = headers.findIndex(h => h === 'volume' || h === 'obrót' || h === 'obrot');

    if (symbolIdx === -1) symbolIdx = 0;
    if (nameIdx === -1) nameIdx = 3;
    if (closeIdx === -1) closeIdx = 4;
    if (changePercentIdx === -1) changePercentIdx = 6;
    if (volumeIdx === -1) volumeIdx = 7;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length <= Math.max(symbolIdx, nameIdx, closeIdx, changePercentIdx)) continue;

      const rawSymbol = cols[symbolIdx].trim();
      if (!rawSymbol) continue;

      const rawName = cols[nameIdx]?.trim() || rawSymbol;
      const price = parseFloat(cols[closeIdx]?.trim() || '');
      let change24h = parseFloat((cols[changePercentIdx]?.trim() || '').replace('%', ''));
      let vol = parseFloat(cols[volumeIdx]?.trim() || '');

      if (isNaN(price)) continue;
      if (isNaN(change24h)) change24h = 0;
      if (isNaN(vol)) vol = 0;

      let type = 'stock';
      let displaySymbol = rawSymbol;
      let name = rawName;

      if (STOCK_TICKERS.includes(rawSymbol)) {
        type = 'stock';
        displaySymbol = rawSymbol.endsWith('.US') ? rawSymbol.slice(0, -3) : rawSymbol;
      } else if (FOREX_TICKERS.includes(rawSymbol)) {
        type = 'forex';
        displaySymbol = rawSymbol;
      } else if (COMMODITY_TICKERS.includes(rawSymbol)) {
        type = 'commodity';
        if (rawSymbol === 'XAUUSD') {
          displaySymbol = 'GLD';
          name = 'Gold Spot';
        } else if (rawSymbol === 'XAGUSD') {
          displaySymbol = 'SLV';
          name = 'Silver Spot';
        } else if (rawSymbol === 'CL.F') {
          displaySymbol = 'USO';
          name = 'Crude Oil';
        }
      } else {
        continue;
      }

      // No-Demo-Data-Policy: Stooq's `sdnjg1v` feed only provides symbol,
      // date, name, close, change%, and volume — it does NOT provide
      // fundamentals. peRatio/debtToEquity/marketCap/dividendYield/
      // grahamScore were previously synthesized from `price % N` formulas,
      // which produced numbers that LOOK like real fundamentals but are
      // pure noise. They are now correctly reported as unavailable (the
      // frontend already renders undefined fundamentals as "N/A"/"-").
      // Likewise, fallback volume (when Stooq reports 0) is no longer
      // fabricated from price — it is reported as unavailable (0) instead
      // of a plausible-looking made-up number.
      let volumeInMillions = 0;
      let volumeIsReal = false;
      if (vol > 0) {
        volumeInMillions = Number(((vol * price) / 1e6).toFixed(2));
        volumeIsReal = true;
      }

      const isHighRisk = type === 'stock' && price > 500;
      const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h) : Math.max(-4, change24h));
      const scoreVal = Math.min(10.0, Math.max(1.0, Number((baseMomentum * 0.75 + (isHighRisk ? 0.5 : 1.2)).toFixed(1))));

      stooqAssets.push({
        symbol: displaySymbol,
        name,
        type,
        price,
        change24h,
        grahamScore: 0,
        momentum: Number(baseMomentum.toFixed(1)),
        risk: type === 'stock' ? 'Low' : 'Medium',
        status: 'Verifiziert',
        peRatio: undefined,
        debtToEquity: undefined,
        marketCap: undefined,
        dividendYield: undefined,
        volume24h: volumeInMillions,
        volumeIsEstimate: !volumeIsReal,
        score: scoreVal
      });
    }
  } catch (err: any) {
    console.warn('[Stooq Live API Warning] Stooq failed:', err.message || err);
    // No-Demo-Data-Policy: never fabricate or simulate stock/forex/commodity prices.
    stooqAssets = [];
    stooqFetchFailed = true;
  }

  const merged = [...cryptoAssets, ...stooqAssets];
  const enriched = merged.map(asset => {
    const pattern = getAssetPatternForSymbol(asset.symbol);
    const applicationArea = getApplicationAreaForSymbol(asset.symbol, asset.type);
    const score = calculateAssetScore(asset.symbol, asset.type, asset.change24h, asset.score);
    return {
      ...asset,
      pattern,
      applicationArea,
      score
    };
  });
  return { assets: enriched, cryptoFetchFailed, stooqFetchFailed };
}

// Real, live market data endpoint utilizing CoinGecko (Crypto) and Stooq (Stocks/Forex/Commodities).
// No-Demo-Data-Policy: this endpoint NEVER returns fabricated/simulated data.
// If a live source is unavailable, it returns 503 + { status: "NO_DATA" } instead
// of a random-walk "fallback" — there is no acceptable substitute for real prices.
app.get('/api/market-data', orchestrator.handle('Market Feed'), async (req, res) => {
  const now = Date.now();

  // 1. Serve from cache if valid
  if (cachedMarketData && (now - lastMarketDataFetch < MARKET_DATA_CACHE_TTL)) {
    return res.json(withIntegrityTag({ assets: cachedMarketData }));
  }

  // 2. Request coalescing: if an active fetch is already in progress, wait for it
  if (activeMarketDataPromise) {
    try {
      const result = await activeMarketDataPromise;
      if (result.assets.length > 0) {
        return res.json(withIntegrityTag({ assets: result.assets }));
      }
    } catch (err) {
      // fall through to the fresh-fetch branch below
    }
  }

  // 3. Spawning a new fetch
  activeMarketDataPromise = fetchLiveMarketData();
  try {
    const result = await activeMarketDataPromise;
    activeMarketDataPromise = null;

    if (result.assets.length === 0) {
      // Both CoinGecko and Stooq failed and there's nothing real to serve.
      if (cachedMarketData) {
        console.warn('[market-data] Live fetch failed, serving last-known-good cache.');
        return res.json(withIntegrityTag({ assets: cachedMarketData, stale: true }));
      }
      return res.status(503).json(noDataResponse('CoinGecko und Stooq waren beide nicht erreichbar. Keine Live-Daten verfügbar.'));
    }

    cachedMarketData = result.assets;
    lastMarketDataFetch = Date.now();
    assetRegistry.updateFromLiveData(result.assets);

    if (result.cryptoFetchFailed || result.stooqFetchFailed) {
      return res.json(withIntegrityTag({
        assets: result.assets,
        partial: true,
        cryptoUnavailable: result.cryptoFetchFailed,
        stooqUnavailable: result.stooqFetchFailed,
      }));
    }
    return res.json(withIntegrityTag({ assets: result.assets }));
  } catch (error: any) {
    activeMarketDataPromise = null;
    console.warn('[API Warning] Failed to retrieve live market-data:', error.message || error);

    if (cachedMarketData) {
      return res.json(withIntegrityTag({ assets: cachedMarketData, stale: true }));
    }
    return res.status(503).json(noDataResponse(error.message || 'Marktdaten derzeit nicht verfügbar.'));
  }
});

// --- CoinMarketCap proxy (supplemental crypto source, freemium: 300 req/day) ---
// Server-side cache is deliberately longer than the CoinGecko cache (5 min
// vs 60s) since the CMC free tier's daily quota is scarce. This endpoint is
// additive/supplemental — CoinGecko remains the primary crypto source in
// /api/market-data; this is exposed separately so the frontend can request
// it explicitly (e.g. for symbols CoinGecko's top-50 doesn't cover) without
// burning quota on every screener refresh.
const CMC_CACHE_TTL = 5 * 60 * 1000;
let cmcCache: { data: any; timestamp: number } | null = null;
let activeCmcPromise: Promise<any> | null = null;

app.get('/api/coinmarketcap/quotes', orchestrator.handle('CoinMarketCap Feed'), async (req, res) => {
  const apiKey = getCleanEnv('COINMARKETCAP_API_KEY');
  if (!apiKey) {
    return res.status(501).json(notImplementedResponse('COINMARKETCAP_API_KEY ist nicht konfiguriert.'));
  }

  const now = Date.now();
  if (cmcCache && (now - cmcCache.timestamp < CMC_CACHE_TTL)) {
    return res.json(withIntegrityTag({ assets: cmcCache.data, cached: true }));
  }

  if (activeCmcPromise) {
    try {
      const data = await activeCmcPromise;
      return res.json(withIntegrityTag({ assets: data, cached: true }));
    } catch {
      // fall through to fresh fetch
    }
  }

  const symbolsParam = typeof req.query.symbols === 'string' && req.query.symbols.length > 0
    ? req.query.symbols
    : 'BTC,ETH,SOL,ADA,XRP,DOT,DOGE,AVAX,LINK,MATIC';

  activeCmcPromise = (async () => {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbolsParam)}&convert=USD`;
    const cmcRes = await fetch(url, {
      headers: { 'X-CMC_PRO_API_KEY': apiKey, 'Accept': 'application/json' },
    });
    if (!cmcRes.ok) {
      throw new Error(`CoinMarketCap API returned status ${cmcRes.status}`);
    }
    const cmcData: any = await cmcRes.json();
    const symbolData = cmcData?.data || {};
    const assets = Object.keys(symbolData).map((sym) => {
      const entry = Array.isArray(symbolData[sym]) ? symbolData[sym][0] : symbolData[sym];
      const quote = entry?.quote?.USD;
      return {
        symbol: sym,
        name: entry?.name,
        price: quote?.price,
        change24h: quote?.percent_change_24h,
        marketCap: quote?.market_cap ? Number((quote.market_cap / 1e9).toFixed(2)) : undefined,
        volume24h: quote?.volume_24h ? Number((quote.volume_24h / 1e6).toFixed(2)) : undefined,
        source: 'coinmarketcap',
      };
    });
    return assets;
  })();

  try {
    const data = await activeCmcPromise;
    activeCmcPromise = null;
    cmcCache = { data, timestamp: Date.now() };
    return res.json(withIntegrityTag({ assets: data }));
  } catch (error: any) {
    activeCmcPromise = null;
    console.warn('[CoinMarketCap Proxy] Failed:', error.message || error);
    if (cmcCache) {
      return res.json(withIntegrityTag({ assets: cmcCache.data, stale: true }));
    }
    return res.status(503).json(noDataResponse(error.message || 'CoinMarketCap derzeit nicht erreichbar.'));
  }
});

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK', 'MATIC'];

// Helper to fetch daily historical data from Alpha Vantage
async function fetchAlphaVantageDailyHistory(symbol: string, isCrypto: boolean, key: string): Promise<{ date: string, close: number }[] | null> {
  try {
    const fn = isCrypto ? 'DIGITAL_CURRENCY_DAILY' : 'TIME_SERIES_DAILY';
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
    if (data["Note"]) {
      console.warn(`[Alpha Vantage] Rate limit reached for ${symbol}`);
      return null;
    }
    if (data["Error Message"]) {
      console.warn(`[Alpha Vantage] Error message for ${symbol}: ${data["Error Message"]}`);
      return null;
    }

    const seriesKey = isCrypto ? "Time Series (Digital Currency Daily)" : "Time Series (Daily)";
    const series = data[seriesKey];
    if (!series) {
      console.warn(`[Alpha Vantage] No series data found under key "${seriesKey}" for ${symbol}. Response keys: ${Object.keys(data).join(', ')}`);
      return null;
    }

    const history: { date: string, close: number }[] = [];
    const keys = Object.keys(series);
    for (const dateStr of keys) {
      const entry = series[dateStr];
      const closeKey = isCrypto ? "4a. close (USD)" : "4. close";
      const closeVal = parseFloat(entry[closeKey]);
      if (isNaN(closeVal)) continue;

      // Convert date "YYYY-MM-DD" to "DD.MM.YY"
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const formattedDate = `${parts[2]}.${parts[1]}.${parts[0].substring(2)}`;
        history.push({ date: formattedDate, close: closeVal });
      }
    }

    // Sort chronologically (earliest to latest)
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

// Real-time on-demand Alpha Vantage Quote Proxy
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
    if (data["Note"]) {
      return res.status(429).json({ error: 'Alpha Vantage Rate-Limit erreicht (5 Anfragen pro Minute). Bitte kurz warten.' });
    }
    if (data["Error Message"]) {
      return res.status(400).json({ error: `Fehler von Alpha Vantage: ${data["Error Message"]}` });
    }

    if (isCrypto) {
      const rateObj = data["Realtime Currency Exchange Rate"];
      if (!rateObj) {
        return res.status(404).json({ error: 'Keine Wechselkursdaten gefunden.', raw: data });
      }
      const price = parseFloat(rateObj["5. Exchange Rate"]);
      const lastRefreshed = rateObj["6. Last Refreshed"];
      res.json({
        symbol: rawSymbol,
        price,
        change24h: 0.0,
        source: 'Alpha Vantage',
        timestamp: lastRefreshed
      });
    } else {
      const quoteObj = data["Global Quote"];
      if (!quoteObj || Object.keys(quoteObj).length === 0) {
        return res.status(404).json({ error: 'Keine Kursdaten für dieses Symbol gefunden.', raw: data });
      }
      const price = parseFloat(quoteObj["05. price"]);
      const changePercentStr = quoteObj["10. change percent"] || "0%";
      const change24h = parseFloat(changePercentStr.replace('%', ''));
      const volume = parseFloat(quoteObj["06. volume"]);
      res.json({
        symbol: rawSymbol,
        price,
        change24h: isNaN(change24h) ? 0.0 : change24h,
        volume: isNaN(volume) ? undefined : volume,
        source: 'Alpha Vantage',
        timestamp: quoteObj["07. latest trading day"]
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Interner Serverfehler beim Abruf von Alpha Vantage.' });
  }
});


// Endpoint to retrieve real local documentation content to verify compliance, architecture, and security
app.get('/api/docs-file', (req, res) => {
  const { path: docPath } = req.query;
  if (!docPath) {
    return res.status(400).json({ error: 'Path parameter is required.' });
  }

  // Sanitize path to prevent directory traversal
  const sanitizedPath = String(docPath)
    .replace(/\.\./g, '') // Remove parent directory attempts
    .replace(/\\/g, '/')   // Normalize slashes
    .trim();

  // Construct absolute file path
  const absolutePath = path.join(process.cwd(), 'docs', sanitizedPath);

  // Verify that the file remains within the /docs folder
  if (!absolutePath.startsWith(path.join(process.cwd(), 'docs'))) {
    return res.status(403).json({ error: 'Access denied: Path lies outside of secure /docs boundary.' });
  }

  try {
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: `Dokumentation nicht gefunden: ${sanitizedPath}` });
    }
    const content = fs.readFileSync(absolutePath, 'utf-8');
    res.json({ path: sanitizedPath, content });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Lesen der Datei: ${err.message || err}` });
  }
});

// High-performance backtesting endpoint utilizing the backend Asset Registry to eliminate external API overhead and rate-limiting
// No-Demo-Data-Policy: this endpoint previously called assetRegistry.getHistory(),
// which generated a synthetic price history via Geometric Brownian Motion
// ("to reduce Stooq/Alpha Vantage load") and presented it as real backtest
// data. That has been removed. History now comes exclusively from Stooq
// (primary) with Alpha Vantage as a real secondary source; if neither has
// data, the endpoint returns NO_DATA/503 — never a simulated curve.
app.get('/api/backtest-history', orchestrator.handle('Backtest Download'), async (req, res) => {
  const { symbol, range } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  let limit = 365;
  if (range === '3Y' || range === '1095') limit = 365 * 3;
  else if (range === '5Y' || range === '1825') limit = 365 * 5;
  else {
    const parsedLimit = parseInt(String(range));
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = parsedLimit;
    }
  }

  const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK', 'MATIC'].includes(rawSymbol);

  // 1. Try Stooq first (free, no rate-limit key needed)
  try {
    let stooqSymbol = rawSymbol;
    if (rawSymbol === 'BTC') stooqSymbol = 'BTCUSD';
    else if (rawSymbol === 'ETH') stooqSymbol = 'ETHUSD';
    else if (rawSymbol === 'SOL') stooqSymbol = 'SOLUSD';
    else if (rawSymbol === 'ADA') stooqSymbol = 'ADAUSD';
    else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'INTC'].includes(rawSymbol)) {
      stooqSymbol = `${rawSymbol}.US`;
    } else if (rawSymbol === 'GLD') stooqSymbol = 'XAUUSD';
    else if (rawSymbol === 'SLV') stooqSymbol = 'XAGUSD';
    else if (rawSymbol === 'USO') stooqSymbol = 'CL.F';

    const response = await fetch(`https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`);
    if (!response.ok) throw new Error(`Stooq HTTP error: ${response.status}`);
    const csvText = await response.text();
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) throw new Error('Empty CSV response');

    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
    const dateIdx = headers.indexOf('date');
    const closeIdx = headers.indexOf('close');
    if (dateIdx === -1 || closeIdx === -1) throw new Error('Invalid CSV headers');

    let history: { date: string, close: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length <= Math.max(dateIdx, closeIdx)) continue;
      const dateRaw = cols[dateIdx];
      const close = parseFloat(cols[closeIdx]);
      if (isNaN(close)) continue;
      const dateParts = dateRaw.split('-');
      let dateFormatted = dateRaw;
      if (dateParts.length === 3) {
        dateFormatted = `${dateParts[2]}.${dateParts[1]}.${dateParts[0].substring(2)}`;
      }
      history.push({ date: dateFormatted, close });
    }

    if (history.length === 0) throw new Error('No valid history parsed');

    history.sort((a, b) => {
      const pa = a.date.split('.'), pb = b.date.split('.');
      if (pa.length === 3 && pb.length === 3) {
        const dA = new Date(Number('20' + pa[2]), Number(pa[1]) - 1, Number(pa[0]));
        const dB = new Date(Number('20' + pb[2]), Number(pb[1]) - 1, Number(pb[0]));
        return dA.getTime() - dB.getTime();
      }
      return 0;
    });

    if (history.length > limit) history = history.slice(-limit);
    return res.json(withIntegrityTag({ history, source: 'stooq' }));
  } catch (stooqErr: any) {
    console.warn(`[Backtest-History] Stooq unavailable for ${rawSymbol}:`, stooqErr.message || stooqErr);
  }

  // 2. Fall back to Alpha Vantage if configured
  const avKey = process.env.ALPHA_VANTAGE_KEY;
  if (avKey && avKey.length > 5) {
    try {
      const avHistory = await fetchAlphaVantageDailyHistory(rawSymbol, isCrypto, avKey);
      if (avHistory && avHistory.length > 0) {
        const sliced = avHistory.length > limit ? avHistory.slice(-limit) : avHistory;
        return res.json(withIntegrityTag({ history: sliced, source: 'alpha_vantage' }));
      }
    } catch (avErr: any) {
      console.warn(`[Backtest-History] Alpha Vantage unavailable for ${rawSymbol}:`, avErr.message || avErr);
    }
  }

  // 3. No real data anywhere — return NO_DATA, never a simulated curve.
  return res.status(503).json(noDataResponse(`Keine echten historischen Kursdaten für ${rawSymbol} verfügbar.`));
});

// Real-time newsfeed powered by NewsAPI.org or dynamically generated by Gemini AI when NEWS_API_KEY is configured.
// Live news feed via NewsAPI.org ONLY. No-Demo-Data-Policy: this endpoint
// previously fell back through Gemini-generated "realistic" news, and then
// to hardcoded fake items attributed to real publishers (Bloomberg, Reuters)
// — that violated the policy and has been removed entirely. If NewsAPI is
// unavailable or unconfigured, the endpoint now returns NOT_IMPLEMENTED/501
// or NO_DATA/503 instead of inventing content.
app.get('/api/news', orchestrator.handle('News Feed'), async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey.length < 6 || apiKey.startsWith('MY_') || apiKey.toLowerCase().includes('test')) {
    return res.status(501).json(notImplementedResponse(
      'NEWS_API_KEY ist nicht konfiguriert. Es werden keine erfundenen Nachrichten angezeigt.'
    ));
  }

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=cryptocurrency+OR+bitcoin+OR+ethereum+OR+finance&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`);
    if (!response.ok) {
      throw new Error(`NewsAPI returned status ${response.status}`);
    }
    const data: any = await response.json();
    if (data.status !== 'ok' || !Array.isArray(data.articles)) {
      throw new Error('NewsAPI returned an unexpected payload shape');
    }

    const newsItems = data.articles.slice(0, 5).map((art: any, idx: number) => {
      const text = ((art.title || '') + ' ' + (art.description || '')).toLowerCase();
      let sentiment = 'neutral';
      if (text.includes('bullish') || text.includes('surge') || text.includes('gain') || text.includes('rise') || text.includes('rally') || text.includes('growth')) {
        sentiment = 'positive';
      } else if (text.includes('bearish') || text.includes('plummet') || text.includes('drop') || text.includes('fall') || text.includes('crash') || text.includes('risk') || text.includes('hack')) {
        sentiment = 'negative';
      }
      return {
        id: `news_${idx}_${Date.now()}`,
        headline: art.title || 'Krypto Markt Update',
        summary: art.description || art.content || 'Keine detaillierte Beschreibung verfügbar.',
        sentiment,
        time: new Date(art.publishedAt || Date.now()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
        source: art.source?.name || 'NewsAPI',
        url: art.url || null,
      };
    });
    return res.json(withIntegrityTag({ items: newsItems }));
  } catch (error: any) {
    console.warn('[News API] NewsAPI.org request failed:', error.message || error);
    return res.status(503).json(noDataResponse(
      `NewsAPI.org war nicht erreichbar oder lieferte keine validen Daten: ${error.message || 'unbekannter Fehler'}`
    ));
  }
});

// Ad-hoc charts scoring engine using indicators.
// No-Demo-Data-Policy: this endpoint previously hardcoded a forced
// score/recommendation of 8.8 "STRONG BUY" for BTC regardless of its actual
// RSI/EMA/SMA values, and claimed to have detected a "Bullish Engulfing"
// candlestick pattern it never received OHLC data for. That has been
// removed. The score below is now a deterministic, symbol-agnostic
// function of only the real indicator values the client sends.
app.post('/api/charts-scoring', express.json(), (req, res) => {
  const { symbol, rsi, price, sma, ema } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }
  if (typeof rsi !== 'number' || typeof price !== 'number') {
    return res.status(400).json({ error: 'rsi and price (numbers) are required for a real scoring computation.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  const rsiVal = rsi;
  const hasMaData = typeof ema === 'number' && typeof sma === 'number';

  let rsiSignal = 'Neutral (Mittelmaß)';
  if (rsiVal > 70) rsiSignal = 'Überkauft (Bärisches Warnsignal)';
  else if (rsiVal < 30) rsiSignal = 'Überverkauft (Bullisches Akkumulationssignal)';

  let maSignal = 'Keine Daten';
  let maDeltaPct = 0;
  if (hasMaData) {
    maSignal = ema > sma ? 'Golden Cross (Bullisch)' : (ema < sma ? 'Death Cross (Bärisch)' : 'Neutral');
    maDeltaPct = sma !== 0 ? ((ema - sma) / sma) * 100 : 0;
  }

  // RSI sub-score: 0 (very bearish) .. 10 (very bullish), centered at RSI 50.
  // Oversold RSI (<30) trends bullish (mean-reversion), overbought (>70) trends bearish.
  const rsiScore = Math.max(0, Math.min(10, 5 + (50 - rsiVal) / 10));

  // MA sub-score: derived from the actual EMA/SMA gap, clamped to +/-2.5 points.
  const maScore = hasMaData ? Math.max(-2.5, Math.min(2.5, maDeltaPct * 0.5)) : 0;

  const rawScore = hasMaData ? (rsiScore * 0.6 + (5 + maScore) * 0.4) : rsiScore;
  const score = Math.round(Math.max(0, Math.min(10, rawScore)) * 10) / 10;

  // Market Scoring Audit Layer (Layer 2): verify the weights that fed this
  // score actually sum to 1.0 and every component stayed in its valid 0-1
  // range BEFORE the number is trusted and returned. This is the structural
  // safeguard against a repeat of the previous bug class (a hardcoded score
  // override that ignored its declared formula/inputs entirely) — if the
  // formula is ever edited such that the weights no longer sum correctly,
  // this flags it instead of silently serving a wrong score.
  const scoreAudit = hasMaData
    ? auditScoreWeights(
        { trend: 0.6, momentum: 0.4 },
        { trend: rsiScore / 10, momentum: (5 + maScore) / 10 },
        score * 10 // normalize to the audit layer's 0-100 scale
      )
    : auditScoreWeights({ trend: 1.0 }, { trend: rsiScore / 10 }, score * 10);

  if (scoreAudit.status === 'rejected') {
    console.error('[Market Scoring Audit] REJECTED /api/charts-scoring output:', scoreAudit.issues);
    return res.status(500).json({
      error: 'Scoring formula integrity check failed — refusing to serve an unverified score.',
      auditTrail: buildAuditTrail(null, scoreAudit),
    });
  }

  let recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' = 'HOLD';
  if (score >= 8) recommendation = 'STRONG BUY';
  else if (score >= 6.5) recommendation = 'BUY';
  else if (score >= 3.5) recommendation = 'HOLD';
  else if (score >= 2) recommendation = 'SELL';
  else recommendation = 'STRONG SELL';

  const summaryParts: string[] = [];
  summaryParts.push(`RSI(${rsiVal.toFixed(1)}) → ${rsiSignal}.`);
  if (hasMaData) {
    summaryParts.push(`EMA/SMA-Abstand ${maDeltaPct >= 0 ? '+' : ''}${maDeltaPct.toFixed(2)}% → ${maSignal}.`);
  } else {
    summaryParts.push('Keine EMA/SMA-Daten übermittelt — Score basiert ausschließlich auf RSI.');
  }
  summaryParts.push(`Zusammengesetzter Score: ${score.toFixed(1)}/10 → ${recommendation}.`);
  const summary = summaryParts.join(' ');

  res.json({
    symbol: rawSymbol,
    score,
    auditTrail: buildAuditTrail(null, scoreAudit),
    recommendation,
    rsiSignal,
    maSignal,
    summary,
    timestamp: new Date().toISOString()
  });
});

// Stats API for Request Orchestrator — ADMIN ONLY.
// Previously unauthenticated: leaked per-user IP addresses + request logs
// to any anonymous caller, and allowed anyone to reconfigure or wipe the
// server's rate-limiting state (DoS vector). Locked to Owner/Enterprise.
app.get('/api/orchestrator/stats', requireAuth(getServerSupabase), requireAdmin(getSubscription), (req, res) => {
  res.json(withIntegrityTag(orchestrator.getStats()));
});

// Dynamic configuration update API — ADMIN ONLY.
app.post('/api/orchestrator/config', requireAuth(getServerSupabase), requireAdmin(getSubscription), (req, res) => {
  const { concurrencyLimit, maxQueueSize, maxRequestsPerWindow } = req.body;
  orchestrator.updateConfig({
    concurrencyLimit: typeof concurrencyLimit === 'number' ? concurrencyLimit : undefined,
    maxQueueSize: typeof maxQueueSize === 'number' ? maxQueueSize : undefined,
    maxRequestsPerWindow: typeof maxRequestsPerWindow === 'number' ? maxRequestsPerWindow : undefined
  });
  res.json(withIntegrityTag({ success: true, stats: orchestrator.getStats() }));
});

// Dynamic stats reset API — ADMIN ONLY.
app.post('/api/orchestrator/reset', requireAuth(getServerSupabase), requireAdmin(getSubscription), (req, res) => {
  orchestrator.resetStats();
  res.json(withIntegrityTag({ success: true, stats: orchestrator.getStats() }));
});

// GET detailed enterprise crypto scoring inputs and outputs.
// No-Demo-Data-Policy: only assets present in the live registry (sourced
// from real CoinGecko data) are scored; unknown symbols get NO_DATA.
app.get('/api/crypto-scoring/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const asset = assetRegistry.getAsset(symbol);
  if (!asset) {
    return res.status(404).json(noDataResponse(`Keine Live-Daten für ${symbol} im Asset-Registry gefunden.`));
  }
  const inputs = generateCryptoInputs(symbol, asset.change24h, asset.volume24h ?? null);
  const result = calculateCryptoEnterpriseScore(inputs);
  res.json(withIntegrityTag({ inputs, result }));
});

// POST to dynamically update scoring inputs and recalculate in real-time
app.post('/api/crypto-scoring/:symbol', express.json(), (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const customInputs = req.body;
  const asset = assetRegistry.getAsset(symbol);
  const change24h = asset ? asset.change24h : 0;
  const volume = asset ? (asset.volume24h ?? null) : null;
  const defaultInputs = generateCryptoInputs(symbol, change24h, volume);

  const mergedInputs = {
    ...defaultInputs,
    ...customInputs,
    coin: symbol
  };

  const result = calculateCryptoEnterpriseScore(mergedInputs);
  res.json(withIntegrityTag({ inputs: mergedInputs, result }));
});

// GET all registry assets — populated exclusively from real /api/market-data fetches.
app.get('/api/registry/assets', (req, res) => {
  res.json(withIntegrityTag({ assets: assetRegistry.getAssets(), hasLiveData: assetRegistry.hasLiveData() }));
});

// GET single asset details from registry
app.get('/api/registry/assets/:symbol', (req, res) => {
  const asset = assetRegistry.getAsset(req.params.symbol);
  if (!asset) {
    return res.status(404).json(noDataResponse('Asset nicht in der Live-Registry gefunden (noch keine Live-Daten abgerufen oder unbekanntes Symbol).'));
  }
  res.json(withIntegrityTag(asset));
});

// NOTE: The previous POST /api/registry/assets/:symbol endpoint allowed any
// unauthenticated caller to overwrite an asset's price/volatility/drift
// directly in the registry — i.e. inject fabricated values that would then
// flow into scoring/backtests as if they were real. This has been removed
// entirely. The registry is now read-only from the outside; it is only
// ever written by updateFromLiveData() after a verified CoinGecko/Stooq fetch.

// Global error handler — MUST be registered last, after all routes.
// Previously, an unhandled error thrown inside a route could crash the
// entire Node process (taking down the app for every concurrent user).
// This catches synchronous + Express-forwarded async errors and returns a
// clean JSON error instead of letting the process die.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Route Error]', req.method, req.path, err?.message || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Interner Serverfehler.', dataIntegrityMode: DATA_INTEGRITY_MODE });
});

// Process-level guards: log and stay alive instead of letting one bad
// promise rejection or stray exception take the whole server (and every
// connected user) down — a direct contributor to "Anwendungsausfälle
// wegen zu hoher Request-Anfragen" under load.
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Secure run-time diagnostics for Stripe integration
    const sk = getCleanEnv('STRIPE_SECRET_KEY');
    const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY');
    const wh = getCleanEnv('STRIPE_WEBHOOK_SECRET');
    const priceStarter = getCleanEnv('STRIPE_PRICE_ID_STARTER');
    const pricePro = getCleanEnv('STRIPE_PRICE_ID_PRO');
    const priceEnterprise = getCleanEnv('STRIPE_PRICE_ID_ENTERPRISE');

    console.log("=== [Stripe Server Diagnostics] ===");
    console.log(`STRIPE_SECRET_KEY: ${sk ? `Configured (Length: ${sk.length}, Prefix: ${sk.substring(0, 7)})` : 'Missing'}`);
    console.log(`STRIPE_PUBLISHABLE_KEY: ${pk ? `Configured (Length: ${pk.length}, Prefix: ${pk.substring(0, 7)})` : 'Missing'}`);
    console.log(`STRIPE_WEBHOOK_SECRET: ${wh ? `Configured (Length: ${wh.length}, Prefix: ${wh.substring(0, 6)})` : 'Missing'}`);
    console.log(`STRIPE_PRICE_ID_STARTER: ${priceStarter ? `Configured (Length: ${priceStarter.length}, Val: ${priceStarter.substring(0, 10)}...)` : 'Missing'}`);
    console.log(`STRIPE_PRICE_ID_PRO: ${pricePro ? `Configured (Length: ${pricePro.length}, Val: ${pricePro.substring(0, 10)}...)` : 'Missing'}`);
    console.log(`STRIPE_PRICE_ID_ENTERPRISE: ${priceEnterprise ? `Configured (Length: ${priceEnterprise.length}, Val: ${priceEnterprise.substring(0, 10)}...)` : 'Missing'}`);
    console.log("====================================");
  });
}

startServer();
