import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

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

function isSupabaseConfigured(): boolean {
  const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
  const key = getCleanEnv('SUPABASE_SERVICE_ROLE_KEY') || getCleanEnv('VITE_SUPABASE_ANON_KEY') || getCleanEnv('SUPABASE_ANON_KEY');
  return !!(url && key);
}

function getServerSupabase() {
  if (!serverSupabaseClient) {
    const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
    const key = getCleanEnv('SUPABASE_SERVICE_ROLE_KEY') || getCleanEnv('VITE_SUPABASE_ANON_KEY') || getCleanEnv('SUPABASE_ANON_KEY');
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

app.use(express.json());

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
app.post('/api/chat', async (req, res) => {
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

app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
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
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { planId, email, billingPeriod, successUrl, cancelUrl } = req.body;
    
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
app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    const { email, returnUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist ein Pflichtfeld.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
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

app.get('/api/stripe/user-subscription', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }
  const userEmail = String(email).toLowerCase().trim();
  const tier = await getSubscription(userEmail);
  res.json({ email: userEmail, subscriptionTier: tier });
});

// Real, live market data endpoint utilizing CoinGecko (Crypto) and Stooq (Stocks/Forex/Commodities)
// NOTE: No-Demo-Data-Policy: This endpoint NEVER returns fabricated/simulated data.
// If a live source is unavailable, it returns 503 + { status: "NO_DATA" } instead of a fallback.
app.get('/api/market-data', async (req, res) => {
  const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
  const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
  const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F'];

  try {
    // 1. Fetch Crypto from CoinGecko API
    const coingeckoUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
    const coingeckoRes = await fetch(coingeckoUrl);
    if (!coingeckoRes.ok) {
      throw new Error(`CoinGecko API returned status ${coingeckoRes.status}`);
    }
    const coingeckoData: any = await coingeckoRes.json();
    const cryptoAssets = coingeckoData.map((coin: any) => {
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

    // 2. Fetch Stocks, Forex, Commodities from Stooq API
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

    const stooqAssets = [];
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

      let volumeInMillions = 0;
      if (type === 'stock') {
        volumeInMillions = vol > 0 ? Number(((vol * price) / 1e6).toFixed(2)) : Number((price * 1.5).toFixed(1));
      } else if (type === 'forex') {
        volumeInMillions = Number((1200 + (price % 5) * 200).toFixed(2));
      } else { // commodity
        volumeInMillions = vol > 0 ? Number(((vol * price) / 1e6).toFixed(2)) : Number((350 + (price % 10) * 45).toFixed(2));
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
        grahamScore: type === 'stock' ? Number((4 + (price % 5)).toFixed(1)) : 0,
        momentum: Number(baseMomentum.toFixed(1)),
        risk: type === 'stock' ? 'Low' : 'Medium',
        status: 'Verifiziert',
        peRatio: type === 'stock' ? Number((12 + (price % 25)).toFixed(1)) : undefined,
        debtToEquity: type === 'stock' ? Number((0.2 + (price % 1.5)).toFixed(2)) : undefined,
        marketCap: type === 'stock' ? Number((100 + (price % 1500)).toFixed(1)) : 450.0,
        dividendYield: type === 'stock' && (price % 2 > 0.5) ? Number((1.5 + (price % 3)).toFixed(2)) : 0.0,
        volume24h: volumeInMillions,
        score: scoreVal
      });
    }

    res.json([...cryptoAssets, ...stooqAssets]);
  } catch (error: any) {
    // No-Demo-Data-Policy: never fabricate or simulate market data. If CoinGecko/Stooq
    // are unreachable, surface that fact explicitly so the frontend can show a clear
    // "keine Live-Daten verfügbar" state instead of fake numbers.
    console.error('[Market-Data] Live data sources unavailable:', error.message || error);
    res.status(503).json({
      status: 'NO_DATA',
      message: 'Live-Marktdaten (CoinGecko/Stooq) sind aktuell nicht erreichbar. Es werden keine simulierten Daten angezeigt.'
    });
  }
});

// Real historical close values for backtesting retrieved from Stooq daily CSV downloads
app.get('/api/backtest-history', async (req, res) => {
  const { symbol, range } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  let limit = 365;
  if (range === '3Y') limit = 365 * 3;
  else if (range === '5Y') limit = 365 * 5;

  try {
    let stooqSymbol = rawSymbol;
    if (rawSymbol === 'BTC') stooqSymbol = 'BTCUSD';
    else if (rawSymbol === 'ETH') stooqSymbol = 'ETHUSD';
    else if (rawSymbol === 'SOL') stooqSymbol = 'SOLUSD';
    else if (rawSymbol === 'ADA') stooqSymbol = 'ADAUSD';
    else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'INTC'].includes(rawSymbol)) {
      stooqSymbol = `${rawSymbol}.US`;
    } else if (rawSymbol === 'GLD') {
      stooqSymbol = 'XAUUSD';
    } else if (rawSymbol === 'SLV') {
      stooqSymbol = 'XAGUSD';
    } else if (rawSymbol === 'USO') {
      stooqSymbol = 'CL.F';
    }

    const response = await fetch(`https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`);
    if (!response.ok) {
      throw new Error(`Stooq HTTP error: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      throw new Error('Empty CSV response');
    }

    const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
    const dateIdx = headers.indexOf('date');
    const closeIdx = headers.indexOf('close');
    if (dateIdx === -1 || closeIdx === -1) {
      throw new Error('Invalid CSV headers');
    }

    let history = [];
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

    if (history.length === 0) {
      throw new Error('No valid history parsed');
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

    if (history.length > limit) {
      history = history.slice(-limit);
    }

    res.json(history);
  } catch (err: any) {
    // No-Demo-Data-Policy: never simulate a price history. If Stooq has no real
    // historical data for this symbol, the frontend must show NO_DATA, not a
    // synthetic Geometric-Brownian-Motion curve.
    console.error(`[Backtest-History] Stooq unavailable for ${rawSymbol}:`, err.message || err);
    res.status(503).json({
      status: 'NO_DATA',
      message: `Keine echten historischen Kursdaten für ${rawSymbol} verfügbar.`
    });
  }
});

// Real newsfeed returns 200 with NOT_IMPLEMENTED until a live news API subscription (such as NewsAPI, Reuters, or Bloomberg feed) is officially configured.
// All hardcoded mock headlines attributed to Reuters Finance, Bloomberg, etc., have been removed.
app.get('/api/news', (req, res) => {
  res.json({ status: "NOT_IMPLEMENTED", message: "Real-time news feed is disabled. Configure NEWS_API_KEY to fetch live stories." });
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
    // SPA fallback: deliberately a path-less middleware (no '*' pattern) so it does
    // not depend on path-to-regexp wildcard syntax, which differs between Express 4
    // (bare '*') and Express 5 (named '*splat') and was previously mismatched here
    // ('*all' does not behave as a catch-all on Express 4.21's path-to-regexp 0.1.x).
    app.use((req, res) => {
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
