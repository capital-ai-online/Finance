import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { orchestrator } from './src/lib/requestOrchestrator';
import { assetRegistry } from './src/lib/assetRegistry';
import { CryptoScoringService } from './src/services/cryptoScoringService';
import { MemeCoinScoringService } from './src/services/memeCoinScoringService';
import { createRawMaterialsRouter } from './src/routes/rawMaterialsRoutes';
import { RawMaterialsScoringService } from './src/services/rawMaterialsScoring';
import { createCryptoRouter } from './src/routes/cryptoRoutes';
import { socialMediaRouter } from './src/routes/socialMediaRoutes';
import { ClassificationService } from './src/services/classification.service';
import { generateCryptoScores, calculateBaseScore, calculateDefiScore } from './src/services/scoring.service';
import { trackedGenerateContent } from './src/services/aiUsageTracker';
import { generateStructuredWithFallback } from './src/services/agentModelRouting';
import { scoreValidationRouter, recordDailySnapshots } from './server/scoreValidation';
import { alertsRouter, evaluateAlerts } from './server/alerts';
import { generateTraditionalAssetInputs, generateTraditionalAssetInputsFromCloses, TraditionalAssetScoringService } from './src/services/traditionalAssetScoring';
import { ensureFundamentalsFresh, getCachedFundamentals } from './server/stockFundamentals';
import { INDEX_FMP_TICKERS, ensureIndexQuoteFresh, getCachedIndexQuote, ensureIndexHistoryFresh, getCachedIndexHistory } from './server/fmpIndices';
import { supervisorRouter } from './server/supervisorRouter';
import { createAgentEvaluationRouter } from './server/agentEvaluationRouter';
import { getAnthropicInstance, isAnthropicConfigured } from './server/anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './server/openaiClient';
import { executeSupervised } from './src/platform/Supervisor/supervisor';
import { newsRouter } from './src/features/news/newsRoutes';
import { registryRouter } from './src/features/registry/registryRoutes';
import { computeReturnStats, classifyTrendLabel } from './src/services/realMarketSignals';

// Import newly refactored modular server handlers (Production Billing & Enterprise Architecture)
import { getCleanEnv } from './server/env';
import { checkAdminAccess, runIamSchemaHealthCheck } from './src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from './src/platform/Security/types';
import {
  isSupabaseConfigured,
  getServerSupabase,
  saveLocalSubscription,
  getLocalSubscriptions,
  saveSubscription,
  getSubscription,
  getLocalPdfCredits,
  saveLocalPdfCredits
} from './server/db';
import { stripeRouter, handleWebhookEvent, getStripeInstance } from './server/stripe';
import { orchestratorRouter } from './server/orchestrator';
import { aiRouter, getGeminiInstance, isGeminiConfigured } from './server/ai';
import { systemEventsRouter, logSystemEvent } from './server/systemEvents';
import { hygieneRouter, startRecursiveFileWatcher } from './server/documentHygiene';
import { versionManagerRouter } from './src/platform/VersionManager/versionManager';
import { stepUpRouter } from './server/stepUp';
import { enforceScreeningQuota } from './server/quota';
import { complianceRouter } from './src/platform/Compliance/router';
import { checkRateLimit, getClientIp } from './src/platform/Security/rateLimiter';
import { createLogger, requestContext } from './server/logger';
import { metricsMiddleware, renderMetrics } from './server/metrics';

const serverLogger = createLogger('server');

dotenv.config();

const app = express();
const PORT = 3000;

// Audit ARCH-AUDIT-0002 (S4): weist als erste Middleware jedem Request eine Correlation-ID
// zu, damit nachfolgende Logs (CORS-Block, Rate-Limit, IAM-Pruefung, Route-Handler,
// Fehlerbehandlung) demselben Request zugeordnet werden koennen.
app.use(requestContext);
// Audit ARCH-AUDIT-0002 (H6): zeichnet Request-Zaehler/-Fehler/-Latenz fuer /metrics auf
// (Prometheus-Exposition-Format, siehe server/metrics.ts). Frueh montiert, damit auch von
// spaeteren Middlewares/Routen abgelehnte Requests (CORS-Block, Rate-Limit) erfasst werden.
app.use(metricsMiddleware);

// ---------------------------------------------------------
// Compliance-Review Punkt 1: Prozessweites Sicherheitsnetz gegen unbehandelte
// Promise-Rejections/Exceptions. Ersetzt keinen sauberen try/catch in einzelnen
// Handlern (die bleiben die erste Verteidigungslinie), verhindert aber, dass ein
// übersehener Fall den gesamten Prozess unkontrolliert abstürzen lässt.
// ---------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS][UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[PROCESS][UNCAUGHT EXCEPTION]', err);
  // Bewusst kein process.exit(): ein einzelner unerwarteter Fehler soll nicht den
  // gesamten Server für alle Nutzer beenden. Stattdessen wird geloggt, damit das
  // Monitoring (Compliance-Review Punkt 3) den Vorfall sichtbar macht.
});

// ---------------------------------------------------------
// ADR-0009 — CORS Hardening. Ersetzt die vorherige OWASP-Mitigation, die via
// `origin.endsWith('.run.app')` / `origin.startsWith('https://ais-')` faktisch
// jede beliebige Cloud-Run-Domain als vertrauenswürdig behandelte - ein Wildcard
// in Verkleidung, genau das, was ADR-0009 explizit verbietet.
// Zusätzlich fehlte die echte Produktionsdomain in der bisherigen Liste.
// ---------------------------------------------------------

const isProductionEnv = getCleanEnv('NODE_ENV') === 'production';

// Produktionsdomains: fest codiert, keine Muster-/Suffix-Prüfung (ADR-0009 Regel 1+2).
const PRODUCTION_ORIGINS = [
  'https://capital-ai.online',
  'https://www.capital-ai.online',
];

// Google AI Studio: NUR über explizite Environment Variable, nie hartcodiert,
// und NUR außerhalb der echten Produktionsumgebung nutzbar (ADR-0009,
// "Dadurch bleibt die Produktionsumgebung frei von unnötigen Entwicklungsfreigaben").
const AI_STUDIO_ORIGIN = getCleanEnv('AI_STUDIO_ORIGIN');

function isLocalDevOrigin(origin: string): boolean {
  // Nur exakt localhost/127.0.0.1 mit optionalem Port - kein Teilstring-Match,
  // der z.B. auf "http://localhost.attacker.com" anspringen könnte.
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function isOriginAllowed(origin: string): boolean {
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  if (!isProductionEnv) {
    if (isLocalDevOrigin(origin)) return true;
    if (AI_STUDIO_ORIGIN && origin === AI_STUDIO_ORIGIN) return true;
  }
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
    // Audit ARCH-AUDIT-0002 (AUD2-F-020): best-effort bleibt bewusst (Request nicht blockieren),
    // aber der Fehler war zuvor unsichtbar.
    serverLogger.error('security_events-Insert fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
  }
}

app.use((req, res, next) => {
  // 1. CORS-Allowlist-Prüfung (ADR-0009): keine dynamische Freigabe unbekannter
  // Domains, jede Origin wird explizit gegen eine feste Liste geprüft.
  const origin = req.headers.origin;

  if (origin) {
    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      // Credentials nur setzen, wenn die Origin tatsächlich validiert wurde
      // (ADR-0009: "Voraussetzung: Origin muss vorher validiert sein.").
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      logBlockedOrigin(origin, req).catch((err) => {
        console.error('[SECURITY] logBlockedOrigin fehlgeschlagen:', err);
      });
      if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'Origin nicht erlaubt.' });
      }
      // Kein ACAO-Header -> der Browser blockiert die Antwort clientseitig.
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // ADR-0009 listet zusätzlich `x-orchestrator-admin-token` als erlaubten Header.
  // Bewusst NICHT übernommen: dieser Header gehörte zum in ADR-0003.5 entfernten
  // Legacy-Token-Mechanismus (server/orchestrator.ts nutzt jetzt ausschließlich
  // JWT via checkAdminAccess()). Ihn hier wieder zuzulassen würde der eigentlichen,
  // bereits umgesetzten Architektur widersprechen - bitte ADR-0009 entsprechend
  // aktualisieren/dieses Feld als überholt markieren.
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

  // Preflight: nur erlaubte Origins erhalten 200 OK (ADR-0009 "Preflight Handling").
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // 2. HTTP Security Headers Hardening (OWASP Compliance). Audit ARCH-AUDIT-0002 (N7)
  // nennt "Helmet" als Massnahme; bewusst kein zusaetzliches Paket eingefuehrt, weil
  // dieser Block bereits alle sicherheitsrelevanten Header setzt, die Helmet default-
  // maessig liefern wuerde (CSP, X-Content-Type-Options, Referrer-Policy, HSTS,
  // Clickjacking-Schutz via frame-ancestors) - inklusive der projektspezifischen
  // ADR-0009-Origin-Allowlist-Logik, die eine generische Helmet-Konfiguration erst
  // wieder nachbilden muesste. Ein zweites Paket mit eigener Default-CSP wuerde mit
  // dieser bestehenden Logik kollidieren statt sie wiederzuverwenden.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content-Security-Policy: frame-ancestors an dieselbe Allowlist-Logik wie CORS
  // angeglichen (dieselbe `*.run.app`-Wildcard-Schwäche betraf zuvor auch hier
  // die Clickjacking-Absicherung, siehe ADR-0009-Geist auch wenn nicht wörtlich
  // Teil des ADR-Texts).
  const frameAncestors = [
    "'self'",
    ...(!isProductionEnv ? ["https://ai.studio", "http://localhost:*"] : []),
  ].join(' ');
  // Audit ARCH-AUDIT-0002 (N7): script-src und style-src ohne 'unsafe-inline'/'unsafe-eval'
  // in Produktion. Der Vite-Produktionsbuild enthaelt weder Inline-<script>- noch
  // Inline-<style>-Tags (nur externe, gehashte Dateien unter /assets, siehe
  // dist/index.html); React setzt Inline-Styles ueber die DOM-CSSOM-Eigenschaft
  // (element.style.xxx), nicht ueber das style=""-Attribut, und ist von style-src
  // nicht betroffen. Verifiziert per Playwright-Konsolen-Check (securitypolicyviolation-
  // Events) gegen den echten Produktionsbuild ueber mehrere Navigationspfade - keine
  // CSP-Violation-Reports (tiefere, nur eingeloggt erreichbare Ansichten wurden mangels
  // Testzugangsdaten in dieser Umgebung nicht erreicht, sollten aber denselben
  // externen-Assets-Build durchlaufen). Im Entwicklungsmodus benoetigt Vites HMR-Client
  // weiterhin 'unsafe-inline'/'unsafe-eval', daher dort unveraendert gelockert.
  const scriptSrc = isProductionEnv
    ? "'self' https://*.stripe.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com";
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; " +
    `script-src ${scriptSrc}; ` +
    "style-src 'self' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: referrer; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "frame-src 'self' https://*.stripe.com; " +
    `frame-ancestors ${frameAncestors};`
  );

  // Audit ARCH-AUDIT-0002 (N7, CSRF-Anteil): kein CSRF-Token-Mechanismus implementiert,
  // weil er hier keine reale Schutzwirkung haette - dieses Ergebnis, nicht eine
  // Unterlassung. Klassisches CSRF nutzt aus, dass Browser Session-Cookies automatisch
  // an denselben Origin anhaengen; diese Anwendung setzt und liest an keiner Stelle
  // Cookies (grep ueber src/ und server/ bestaetigt: 0 Treffer fuer res.cookie/
  // req.cookies/document.cookie/cookie-parser), der Supabase-Client
  // (src/supabaseClient.ts) nutzt die Standardkonfiguration mit localStorage-basierter
  // Session, und jede geschuetzte Route verlangt einen expliziten
  // `Authorization: Bearer <token>`-Header (server/iam/authMiddleware.ts), den ein
  // fremder Origin nicht automatisch mitschicken kann. Ein CSRF-Token waere daher
  // Security-Theater fuer ein Bedrohungsmodell, das hier nicht zutrifft. Sollte
  // zukuenftig Cookie-basierte Session-Authentifizierung eingefuehrt werden, muss
  // diese Einschaetzung neu bewertet werden.

  // Strict-Transport-Security (HSTS) in production
  if (isProductionEnv) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

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

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error(`❌ Webhook handling error:`, err);
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

// Audit ARCH-AUDIT-0002 (AUD2-F-015, S3): zuvor gab es kein Rate-Limiting, das PAUSCHAL fuer
// jede Route greift - nur einzelne Admin-/Auth-Zonen (server/iam/rateLimiter.ts) und die ueber
// orchestrator.handle() gefuehrten Markt-/Scoring-Routen (src/lib/requestOrchestrator.ts) waren
// begrenzt. Wiederverwendet denselben In-Memory-Limiter wie die Admin-Zonen statt eine weitere
// Rate-Limiting-Implementierung einzufuehren. Grosszuegig genug fuer normale Nutzung, faengt
// aber Endpunkte ab, die keine eigene Begrenzung haben (z.B. statische Registry-Reads).
// Greift NICHT fuer die beiden Webhook-Routen oben, da diese als spezifische Routen bereits
// VOR dieser globalen Middleware registriert sind und den Request-Zyklus selbst abschliessen.
app.use((req, res, next) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`global:${ip}`, 300, 60_000)) {
    serverLogger.warn('Globales Rate-Limit erreicht', { requestId: req.requestId, ip, path: req.originalUrl });
    return res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' });
  }
  next();
});

app.use(express.json());

// Retrieve the modular Gemini client safely for use in downstream routes
let ai: any = null;
try {
  if (isGeminiConfigured()) {
    ai = getGeminiInstance();
  }
} catch (e) {
  console.warn("Failed to retrieve Gemini instance on boot:", e);
}

// Audit ARCH-AUDIT-0002 (J3, Kapitel 14.6): optionaler Anthropic-Client fuer den
// providerübergreifenden Rückfall der 8 Gemini-Agenten. Ohne ANTHROPIC_API_KEY bleibt
// anthropic === null - die Agenten verhalten sich dann exakt wie vor J3 (fail-open).
let anthropic: any = null;
try {
  if (isAnthropicConfigured()) {
    anthropic = getAnthropicInstance();
  }
} catch (e) {
  console.warn("Failed to retrieve Anthropic instance on boot:", e);
}

// Audit ARCH-AUDIT-0002 (J3-Folge, Kapitel 14.6): dritter Provider in der Kette. Reihenfolge
// (Nutzerpriorisierung nach Bereitstellung aller drei Keys): Anthropic -> OpenAI -> Gemini
// (agentModelRouting.ts). Ohne OPENAI_API_KEY bleibt openai === null - fail-open.
let openai: any = null;
try {
  if (isOpenAIConfigured()) {
    openai = getOpenAIInstance();
  }
} catch (e) {
  console.warn("Failed to retrieve OpenAI instance on boot:", e);
}

// Health-Check-Endpunkt fuer Deployment-Plattformen (Audit ARCH-AUDIT-0002, Befund AUD2-F: kein
// Health-Check vorhanden). Bewusst ohne Netzwerkaufrufe an Drittanbieter - ein Health-Check muss
// schnell und unabhaengig von externen Ausfaellen antworten. `configured` spiegelt nur, ob die
// jeweilige Umgebungsvariable gesetzt ist, keine Live-Erreichbarkeit.
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    configured: {
      supabase: isSupabaseConfigured(),
      gemini: isGeminiConfigured(),
      anthropic: isAnthropicConfigured(),
      openai: isOpenAIConfigured(),
    },
  });
});

// Audit ARCH-AUDIT-0002 (H6): Prometheus-Exposition-Format, siehe server/metrics.ts.
// Bewusst NICHT ueber checkAdminAccess/Supabase geschuetzt - Metrics-Scraper koennen in der
// Regel keinen interaktiven Login durchfuehren, und die Metrik-Erfassung soll auch dann
// funktionieren, wenn Supabase nicht erreichbar ist (das ist selbst ein moeglicher
// Beobachtungsfall). Stattdessen ein statisches Token (METRICS_TOKEN) - fail-closed: ohne
// gesetztes Token ist der Endpunkt gesperrt, kein Fallback auf "offen".
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

// Mount Modular Router Sub-systems
//
// WICHTIG: Hier wird die oben defensiv ermittelte Instanz `ai` weitergereicht und NICHT erneut
// getGeminiInstance() aufgerufen. getGeminiInstance() wirft ohne GEMINI_API_KEY (server/ai.ts);
// ein Aufruf an dieser Stelle liegt ausserhalb jedes try/catch und wuerde den Serverstart
// komplett verhindern, statt den Betrieb ohne KI-Funktionen fortzusetzen. Beide Router und die
// dahinterliegenden Orchestratoren akzeptieren `GoogleGenAI | null` und liefern ohne Client
// ihre quantitativen Fallbacks.
app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));
app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));
app.use('/api/stripe', stripeRouter);
app.use('/api/orchestrator', orchestratorRouter);
app.use('/api/admin/hygiene', hygieneRouter);
app.use('/api/admin', systemEventsRouter);
app.use('/api/admin', versionManagerRouter);
app.use('/api/auth', stepUpRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/scoring', scoreValidationRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/admin/supervisor', supervisorRouter);
app.use('/api/admin/agent-evaluation', createAgentEvaluationRouter(ai, anthropic, openai));
app.use('/api/news', newsRouter);
app.use('/api/registry', registryRouter);
app.use('/api/social-media', socialMediaRouter);
app.use('/api', aiRouter);

// Define patterns, application areas, and pattern-aware asset scoring helpers
//
// Audit ARCH-AUDIT-0002 (J1, Kapitel 10.1/14.6, Datenqualitaetsschicht): diese Funktion weist
// JEDEM Symbol einen benannten Chart-Pattern zu, unabhaengig vom tatsaechlichen aktuellen
// Kursverlauf - entweder hartkodiert (BTC ist IMMER "Bullish Engulfing", egal was der reale
// Chart zeigt) oder ueber einen Zeichen-Hash-Fallback fuer alle anderen Symbole. Keine dieser
// Zuweisungen basiert auf echter Mustererkennung. Bleibt NUR als interner Eingabewert fuer den
// bestehenden Heuristik-Score-Pfad in calculateAssetScore() erhalten (Indizes/Anleihen und
// Aktien/Forex ohne echte Datenquelle, siehe dort) - unveraendertes Verhalten, kein Regressions-
// risiko fuer die bereits ehrlich als 'heuristic' gekennzeichneten Scores.
//
// Fuer das AN NUTZER AUSGELIEFERTE `pattern`-Feld (Watchlist, ComplianceExporter,
// CryptoEnterpriseEvaluator) wird stattdessen computeDisplayTrendLabel() verwendet: eine echte,
// aus tatsaechlicher Kurshistorie berechnete Trend-Klassifikation, oder undefined statt eines
// erfundenen Namens, wenn keine echte Historie vorliegt.
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

async function computeDisplayTrendLabel(symbol: string): Promise<string | undefined> {
  const s = symbol.toUpperCase().trim();
  try {
    // Audit ARCH-AUDIT-0002 (J1-Folge): Indizes haben keine Historie in assetRegistry
    // (das wuerde einen FMP-API-Key im client-gebuendelten assetRegistry.ts erfordern),
    // sondern im serverseitigen FMP-Cache (server/fmpIndices.ts).
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

// Audit ARCH-AUDIT-0002 (Befund AUD2-F-001, Kapitel 6, sowie S1/S2/S5, S6 Kapitel 14.3): Legt
// die Herkunft des score-Feldes offen, statt es unmarkiert wie eine einheitlich datenbasierte
// Bewertung erscheinen zu lassen (No-Demo-Data-Policy, docs/DATENSCHUTZ_PROTOKOLL.md).
// - 'market-data': alle Crypto-Assets (Standard und Meme) - generateCryptoScores() bzw.
//   MemeCoinScoringService.generateMemeCoinInputs() beziehen seit S1/S2/S5 reale Marktdaten
//   (Marktkapitalisierung/Volumen/Supply von CoinMarketCap/CoinGecko, echte Kurshistorie fuer
//   Volatilitaet/Trend/Momentum) aus der AssetRegistry; fehlende Faktoren werden dynamisch
//   ausgeschlossen statt geschaetzt (renormalizeAndScore()). Enthaelt KEINE Agenten-Analyse
//   (die gibt es nur ueber /api/crypto/analyze via CryptoOrchestrator) - daher weiterhin von
//   einer vollstaendigen Multi-Agenten-Bewertung unterschieden statt als "live" bezeichnet.
// - 'market-data' (Aktien/Forex, seit H1): traditionalAssetScoring.ts kombiniert echte
//   technische Faktoren (Trend/Momentum/Breakout/Volatilitaet/RSI aus assetRegistry.getHistory(),
//   dieselben Primitive wie beim Krypto-Scoring) mit - nur bei Aktien - realen Fundamentaldaten
//   (KGV/Dividendenrendite/Nettomarge von Alpha Vantage OVERVIEW, server/stockFundamentals.ts).
//   Faellt fuer ein konkretes Symbol ohne jede reale Datenquelle auf die Heuristik zurueck
//   (dann basis='heuristic', siehe calculateAssetScore()).
// - 'market-data' (Indizes, seit J1-Folge): dieselbe technische Bewertung wie Forex (keine
//   Unternehmensbilanz), aus echter Kurshistorie von FMP (server/fmpIndices.ts, Rate-Limit-
//   bewusst schrittweise befuellt) statt der zuvor vollstaendig fehlenden Live-Kursquelle.
// - 'heuristic': Anleihen (keine Live-Kursquelle vorhanden) sowie Aktien/Forex/Indizes im
//   Fall ohne (noch) verfuegbare reale Datenquelle - eine Momentum-/Pattern-Heuristik auf
//   Basis von change24h und einer ebenfalls deterministischen Mustererkennung
//   (calculateAssetScore unterer Zweig).
// - undefined: Rohstoffe (RawMaterialsScoringService) haben eine dedizierte, konfigurierbare
//   Fachengine und sind von diesem Befund nicht betroffen.
const MEME_COIN_SYMBOLS = ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME'];

type ScoreBasis = 'market-data' | 'heuristic' | undefined;
interface AssetScoreResult { score: number; basis: ScoreBasis }

/**
 * Audit ARCH-AUDIT-0002 (H1): basis spiegelt die TATSAECHLICH verwendete Berechnung wider,
 * nicht nur den statischen Anlagetyp - Aktien/Forex fallen auf die alte Heuristik zurueck,
 * wenn fuer ein konkretes Symbol weder reale Kurshistorie noch Fundamentaldaten vorliegen
 * (siehe unten); in diesem Fall darf 'basis' NICHT 'market-data' behaupten, obwohl der
 * Anlagetyp das normalerweise waere. Vorher war scoreBasis rein typbasiert (getScoreBasis())
 * und konnte diesen Fall nicht abbilden.
 */
async function calculateAssetScore(symbol: string, type: string, change24h: number, baseScore?: number): Promise<AssetScoreResult> {
  const s = symbol.toUpperCase().trim();
  if (type === 'crypto') {
    const isMemeCoin = MEME_COIN_SYMBOLS.includes(s);
    if (isMemeCoin) {
      const inputs = await MemeCoinScoringService.generateMemeCoinInputs(s, change24h);
      const result = MemeCoinScoringService.scoreMemeCoin(inputs);
      return { score: result.score, basis: 'market-data' };
    } else {
      const classification = ClassificationService.classifyAsset(s);
      const seedScores = await generateCryptoScores(s, change24h);
      const payload = {
        asset_name: s,
        symbol: s,
        classification,
        scores: seedScores
      };
      const finalScores = classification.category_main === 'DeFi'
        ? calculateDefiScore(payload)
        : calculateBaseScore(payload);
      return { score: Number(((finalScores.final_score ?? 0) / 10).toFixed(1)), basis: 'market-data' };
    }
  }

  if (type === 'commodity') {
    try {
      // Core raw material scoring utilizing the multi-agent/deterministic scoring service of the Rohstoff-Orchestrator
      // The scoring engine calculates a 0-100 score which we return directly for a unified 0-100 scale.
      const payload = RawMaterialsScoringService.scoreMaterial({ name: s });
      return { score: Math.min(100.0, Math.max(0.0, Number(payload.scores.final_score.toFixed(1)))), basis: undefined };
    } catch (err) {
      console.warn(`[Commodity Scoring Fallback] Failed to score via RawMaterialsScoringService for ${s}, using momentum fallback:`, err);
    }
  }

  // Audit ARCH-AUDIT-0002 (H1): echte technische (+ bei Aktien fundamentale) Bewertungslogik,
  // ersetzt die Hash-Pattern-Heuristik unten fuer diese Anlageklassen (Anleihen bleiben auf
  // der Heuristik - es existiert fuer sie aktuell keine Live-Kursquelle).
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
      // Keine reale Datenquelle fuer dieses Symbol verfuegbar (weder Historie noch
      // Fundamentaldaten) - auf die Heuristik unten zurueckfallen. basis bleibt unten
      // korrekt 'heuristic', TROTZ Anlagetyp stock/forex.
    } catch (err: any) {
      console.warn(`[TraditionalAssetScoring Fallback] Failed for ${s}, using momentum fallback:`, err?.message || err);
    }
  }

  // Audit ARCH-AUDIT-0002 (J1-Folge): echte technische Bewertung fuer Indizes ueber FMP
  // (server/fmpIndices.ts) - rein technisch wie Forex (keine Unternehmensbilanz). Faellt auf
  // die Heuristik zurueck, solange der FMP-Historie-Cache fuer dieses Symbol noch nicht
  // gefuellt ist (Rate-Limit-bewusstes, schrittweises Befuellen, siehe fetchLiveMarketData()).
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

  // 1. Calculate base momentum score (scaled to 10-100 scale)
  const normBaseScore = baseScore !== undefined ? (baseScore > 10.0 ? baseScore : baseScore * 10) : undefined;
  let baseMomentum = normBaseScore !== undefined ? normBaseScore : (50.0 + (change24h > 0 ? Math.min(40.0, change24h * 5) : Math.max(-40.0, change24h * 5)));

  // 2. Adjust based on patterns (scaled to 10-100 scale)
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

  // Ensure strong bullish patterns like Bullish Engulfing keep their high rating!
  if (pattern === 'Bullish Engulfing') {
    if (finalScore < 82) {
      finalScore = 82 + (change24h > 0 ? Math.min(10.0, change24h * 2) : Math.max(-10.0, change24h * 2));
    }
  }

  const clamped = Math.min(100.0, Math.max(1.0, Number(finalScore.toFixed(1))));
  return { score: clamped, basis: (type === 'index' || type === 'bond' || type === 'stock' || type === 'forex') ? 'heuristic' : undefined };
}

// Fallback mock data with realistic slightly fluctuating stats on demand
const FALLBACK_ASSETS = [
  // Cryptos
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 68500.0, change24h: 2.45, grahamScore: 0, momentum: 7.2, risk: 'High', status: 'Verifiziert', marketCap: 1340.0, dividendYield: 0.0, volume24h: 28500.0, score: 8.5, pattern: 'Bullish Engulfing', applicationArea: 'DeFi & Smart Contracts' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3450.0, change24h: -1.2, grahamScore: 0, momentum: 5.8, risk: 'High', status: 'Verifiziert', marketCap: 415.0, dividendYield: 0.0, volume24h: 15200.0, score: 7.4, pattern: 'Hammer Support', applicationArea: 'Webanwendungen' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', price: 145.2, change24h: 5.8, grahamScore: 0, momentum: 8.5, risk: 'High', status: 'Verifiziert', marketCap: 67.5, dividendYield: 0.0, volume24h: 3800.0, score: 8.6, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', price: 0.42, change24h: -0.8, grahamScore: 0, momentum: 4.5, risk: 'High', status: 'Verifiziert', marketCap: 15.1, dividendYield: 0.0, volume24h: 420.0, score: 6.5, pattern: 'Double Bottom', applicationArea: 'Webanwendungen' },

  // Stocks
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

  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', price: 1.0824, change24h: 0.12, grahamScore: 0, momentum: 5.2, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1202.48, score: 5.5 },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'forex', price: 1.2645, change24h: -0.15, grahamScore: 0, momentum: 4.8, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1205.29, score: 5.0 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', price: 156.85, change24h: 0.35, grahamScore: 0, momentum: 6.2, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1203.7, score: 6.1 },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', price: 1.3652, change24h: 0.04, grahamScore: 0, momentum: 5.1, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.3, score: 5.2 },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', price: 0.9085, change24h: -0.21, grahamScore: 0, momentum: 4.3, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.82, score: 4.7 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', price: 0.6625, change24h: 0.18, grahamScore: 0, momentum: 5.4, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.25, score: 5.6 },

  // Commodities
  { symbol: 'GLD', name: 'Gold Spot', type: 'commodity', price: 2340.5, change24h: 0.65, grahamScore: 0, momentum: 6.5, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 360.25, score: 6.8 },
  { symbol: 'SLV', name: 'Silver Spot', type: 'commodity', price: 30.12, change24h: 1.45, grahamScore: 0, momentum: 7.2, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 350.12, score: 7.4 },
  { symbol: 'USO', name: 'Crude Oil', type: 'commodity', price: 78.45, change24h: -1.82, grahamScore: 0, momentum: 3.5, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 358.45, score: 4.1 },
  { symbol: 'NG=F', name: 'Natural Gas', type: 'commodity', price: 2.54, change24h: 3.12, grahamScore: 0, momentum: 7.0, risk: 'High', status: 'Verifiziert', marketCap: 180.0, dividendYield: 0.0, volume24h: 220.50, score: 6.5 },
  { symbol: 'WTI', name: 'WTI Crude Oil', type: 'commodity', price: 77.20, change24h: -1.40, grahamScore: 0, momentum: 4.2, risk: 'Medium', status: 'Verifiziert', marketCap: 1050.0, dividendYield: 0.0, volume24h: 410.80, score: 5.8 },
  { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'commodity', price: 81.85, change24h: -1.25, grahamScore: 0, momentum: 4.5, risk: 'Medium', status: 'Verifiziert', marketCap: 1150.0, dividendYield: 0.0, volume24h: 460.20, score: 6.1 },

  // Indices (Top 30 Indices)
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

// Server-side cache and request coalescing for live market data to prevent rate-limiting (e.g. 429 Too Many Requests)
let cachedMarketData: any = null;
let lastMarketDataFetch = 0;
const MARKET_DATA_CACHE_TTL = 60 * 1000; // Cache live prices for 60 seconds
let activeMarketDataPromise: Promise<any> | null = null;
let cmcCoolDownUntil = 0;
let coingeckoCoolDownUntil = 0;

async function fetchLiveMarketData() {
  const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
  const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
  const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'];

  let cryptoAssets = [];
  const cmcKey = getCleanEnv('COINMARKETCAP_API_KEY');
  let cmcFetchedSuccessfully = false;

  if (cmcKey && Date.now() >= cmcCoolDownUntil) {
    try {
      console.log('[Crypto Live API] Fetching cryptocurrency data from CoinMarketCap API (Primary Source)...');
      // CoinMarketCap lists 100 assets on free tier by default, which perfectly covers the top market caps
      const cmcUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD';
      const cmcRes = await fetch(cmcUrl, {
        headers: {
          'X-CMC_PRO_API_KEY': cmcKey,
          'Accept': 'application/json'
        }
      });
      if (!cmcRes.ok) {
        if (cmcRes.status === 429) {
          cmcCoolDownUntil = Date.now() + 15 * 60 * 1000; // Cool down for 15 minutes
          console.log('[Crypto Live API] CoinMarketCap API rate limited (429). Cooling down for 15 minutes.');
        } else {
          cmcCoolDownUntil = Date.now() + 5 * 60 * 1000; // Cool down for 5 minutes on other errors
        }
        throw new Error(`CoinMarketCap API returned status ${cmcRes.status}`);
      }
      const cmcData: any = await cmcRes.json();
      if (cmcData && cmcData.data && Array.isArray(cmcData.data)) {
        cryptoAssets = cmcData.data.map((coin: any) => {
          const usdQuote = coin.quote?.USD || {};
          const price = usdQuote.price || 0;
          const change24h = usdQuote.percent_change_24h || 0;
          const marketCap = usdQuote.market_cap || 0;
          const volume24h = usdQuote.volume_24h || 0;

          const mcapBillions = Number((marketCap / 1e9).toFixed(1));
          const volMillions = Number((volume24h / 1e6).toFixed(2));
          const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
          const scoreVal = Math.min(10.0, Math.max(1.0, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));

          return {
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            type: 'crypto',
            price: price,
            change24h: Number(change24h.toFixed(2)),
            grahamScore: 0,
            momentum: Number(baseMomentum.toFixed(1)),
            risk: 'High',
            status: 'Verifiziert',
            marketCap: mcapBillions,
            dividendYield: 0.0,
            volume24h: volMillions,
            score: scoreVal,
            // Audit ARCH-AUDIT-0002 (S1/S2/S5): reale Supply-Daten fuer Tokenomics-Scoring
            circulatingSupply: typeof coin.circulating_supply === 'number' ? coin.circulating_supply : undefined,
            maxSupply: typeof coin.max_supply === 'number' ? coin.max_supply : null,
            totalSupply: typeof coin.total_supply === 'number' ? coin.total_supply : undefined
          };
        });
        cmcFetchedSuccessfully = true;
        console.log(`[Crypto Live API] Successfully loaded ${cryptoAssets.length} assets from CoinMarketCap!`);
      } else {
        throw new Error('CoinMarketCap API returned invalid format or empty data');
      }
    } catch (cmcErr: any) {
      console.log('[Crypto Live API] CoinMarketCap API rate-limited or inactive; smoothly transitioning to secondary sources.');
    }
  } else if (cmcKey) {
    console.log(`[Crypto Live API] Skipping CoinMarketCap (under active rate-limit cooling for another ${Math.ceil((cmcCoolDownUntil - Date.now()) / 1000)}s)...`);
  }

  if (!cmcFetchedSuccessfully) {
    let coingeckoFetchedSuccessfully = false;

    if (Date.now() >= coingeckoCoolDownUntil) {
      try {
        const coingeckoUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';
        const coingeckoRes = await fetch(coingeckoUrl);
        if (!coingeckoRes.ok) {
          if (coingeckoRes.status === 429) {
            coingeckoCoolDownUntil = Date.now() + 15 * 60 * 1000; // Cool down for 15 minutes
            console.log('[Crypto Live API] CoinGecko API rate limited (429). Cooling down for 15 minutes.');
          } else {
            coingeckoCoolDownUntil = Date.now() + 5 * 60 * 1000; // Cool down for 5 minutes on other errors
          }
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
            score: scoreVal,
            dataSource: 'live',
            // Audit ARCH-AUDIT-0002 (S1/S2/S5): reale Supply-Daten fuer Tokenomics-Scoring
            circulatingSupply: typeof coin.circulating_supply === 'number' ? coin.circulating_supply : undefined,
            maxSupply: typeof coin.max_supply === 'number' ? coin.max_supply : null,
            totalSupply: typeof coin.total_supply === 'number' ? coin.total_supply : undefined
          };
        });
        coingeckoFetchedSuccessfully = true;
      } catch (err: any) {
        console.log('[Crypto Live API] CoinGecko inactive or failed (attempting resilient multi-source fallback):', err.message || err);
      }
    } else {
      console.log(`[Crypto Live API] Skipping CoinGecko (under active rate-limit cooling for another ${Math.ceil((coingeckoCoolDownUntil - Date.now()) / 1000)}s)...`);
    }

    if (!coingeckoFetchedSuccessfully) {
      let livePricesFound = false;
      const binanceMap = new Map();

      // FALLBACK SOURCE 1: Individual Binance ticker queries (simple symbol format to bypass WAF blocks)
      try {
      console.log('[Crypto Live API] Trying Fallback Source 1: Binance single-symbol tickers');
      const symbolsToFetch = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'];
      await Promise.all(symbolsToFetch.map(async (sym) => {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.ok) {
            const data: any = await res.json();
            if (data && data.lastPrice) {
              binanceMap.set(sym, {
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChangePercent || '0'),
                volume: parseFloat(data.volume || '0')
              });
            }
          }
        } catch (singleErr) {
          console.warn(`[Crypto Live API] Binance single-symbol fetch failed for ${sym}:`, singleErr);
        }
      }));

      if (binanceMap.has('BTCUSDT') || binanceMap.has('ETHUSDT')) {
        livePricesFound = true;
        console.log('[Crypto Live API] Fallback Source 1 (Binance) successfully retrieved live prices!');
      }
    } catch (binanceErr: any) {
      console.warn('[Crypto Live API Warning] Binance fallback failed:', binanceErr.message || binanceErr);
    }

    // FALLBACK SOURCE 2: Kraken Public Ticker API
    if (!livePricesFound) {
      try {
        console.log('[Crypto Live API] Trying Fallback Source 2: Kraken Public API');
        const krakenUrl = 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,ADAUSD';
        const krakenRes = await fetch(krakenUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (krakenRes.ok) {
          const krakenData: any = await krakenRes.json();
          if (krakenData && krakenData.result) {
            const r = krakenData.result;
            // Map Kraken key names to standard keys
            const pairsMap: { [key: string]: string } = {
              'XXBTZUSD': 'BTCUSDT',
              'XETHZUSD': 'ETHUSDT',
              'XSOLZUSD': 'SOLUSDT',
              'SOLUSD': 'SOLUSDT',
              'XADAZUSD': 'ADAUSDT',
              'ADAUSD': 'ADAUSDT'
            };

            for (const krakenKey of Object.keys(r)) {
              const standardKey = pairsMap[krakenKey];
              if (standardKey) {
                const item = r[krakenKey];
                const lastPrice = parseFloat(item.c[0]);
                const openPrice = parseFloat(item.o);
                const change24h = openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : 0;
                binanceMap.set(standardKey, {
                  price: lastPrice,
                  change24h: change24h,
                  volume: parseFloat(item.v[1] || '0')
                });
              }
            }
            if (binanceMap.has('BTCUSDT') || binanceMap.has('ETHUSDT')) {
              livePricesFound = true;
              console.log('[Crypto Live API] Fallback Source 2 (Kraken) successfully retrieved live prices!');
            }
          }
        }
      } catch (krakenErr: any) {
        console.warn('[Crypto Live API Warning] Kraken fallback failed:', krakenErr.message || krakenErr);
      }
    }

    // FALLBACK SOURCE 3: Coinbase Public Spot API
    if (!livePricesFound) {
      try {
        console.log('[Crypto Live API] Trying Fallback Source 3: Coinbase Spot API');
        const coinbases = [
          { symbol: 'BTCUSDT', url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot' },
          { symbol: 'ETHUSDT', url: 'https://api.coinbase.com/v2/prices/ETH-USD/spot' },
          { symbol: 'SOLUSDT', url: 'https://api.coinbase.com/v2/prices/SOL-USD/spot' },
          { symbol: 'ADAUSDT', url: 'https://api.coinbase.com/v2/prices/ADA-USD/spot' }
        ];

        await Promise.all(coinbases.map(async (cb) => {
          try {
            const res = await fetch(cb.url, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (res.ok) {
              const data: any = await res.json();
              if (data && data.data && data.data.amount) {
                // Coinbase Spot API liefert nur den aktuellen Preis, keine 24h-
                // Aenderung/kein Volumen. Frueher wurde hier ein zufaelliger
                // change24h-Wert erfunden (No-Demo-Data-Policy-Verstoss, siehe
                // docs/DATENSCHUTZ_PROTOKOLL.md) - jetzt explizit 0 statt einer
                // erfundenen Zahl, da der reale Wert aus dieser Quelle unbekannt ist.
                binanceMap.set(cb.symbol, {
                  price: parseFloat(data.data.amount),
                  change24h: 0,
                  volume: 0
                });
              }
            }
          } catch (cbErr) {
            console.warn(`[Crypto Live API] Coinbase single-symbol fetch failed for ${cb.symbol}:`, cbErr);
          }
        }));

        if (binanceMap.has('BTCUSDT') || binanceMap.has('ETHUSDT')) {
          livePricesFound = true;
          console.log('[Crypto Live API] Fallback Source 3 (Coinbase) successfully retrieved live prices!');
        }
      } catch (coinbaseErr: any) {
        console.warn('[Crypto Live API Warning] Coinbase fallback failed:', coinbaseErr.message || coinbaseErr);
      }
    }

    // Map fetched results, oder als letzte Stufe der Resilienzkette den statischen
    // Fallback-Bestand verwenden - explizit ohne erfundene "Live-Fluktuation"
    // (No-Demo-Data-Policy, docs/DATENSCHUTZ_PROTOKOLL.md): eine zufaellige
    // Preisbewegung auf einem statischen Snapshot zu simulieren wuerde genau die
    // "simulierten Taeuschungsdaten" erzeugen, die die Policy verbietet. dataSource
    // markiert stattdessen ehrlich, ob der jeweilige Wert live oder Fallback ist.
    cryptoAssets = FALLBACK_ASSETS.filter(a => a.type === 'crypto').map(asset => {
      const binanceKey = `${asset.symbol}USDT`;
      const liveData = binanceMap.get(binanceKey);
      if (liveData && !isNaN(liveData.price) && liveData.price > 0) {
        const change24h = liveData.change24h;
        const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
        const scoreVal = Math.min(10.0, Math.max(1.0, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));
        return {
          ...asset,
          price: liveData.price,
          change24h: Number(change24h.toFixed(2)),
          momentum: Number(baseMomentum.toFixed(1)),
          score: scoreVal,
          volume24h: liveData.volume > 0 ? Number(((liveData.volume * liveData.price) / 1e6).toFixed(2)) : asset.volume24h,
          dataSource: 'live'
        };
      } else {
        return {
          ...asset,
          status: 'Fallback',
          dataSource: 'fallback'
        };
      }
    });
  }
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
        const targets: { sym: string; name: string }[] = [];
        if (rawSymbol === 'XAUUSD') {
          targets.push({ sym: 'GLD', name: 'Gold Spot' });
        } else if (rawSymbol === 'XAGUSD') {
          targets.push({ sym: 'SLV', name: 'Silver Spot' });
        } else if (rawSymbol === 'CL.F') {
          targets.push({ sym: 'USO', name: 'Crude Oil' });
          targets.push({ sym: 'WTI', name: 'WTI Crude Oil' });
        } else if (rawSymbol === 'NG.F') {
          targets.push({ sym: 'NG=F', name: 'Natural Gas' });
        } else if (rawSymbol === 'CO.F') {
          targets.push({ sym: 'BRENT', name: 'Brent Crude Oil' });
        }

        for (const target of targets) {
          const volumeInMillions = vol > 0 ? Number(((vol * price) / 1e6).toFixed(2)) : Number((350 + (price % 10) * 45).toFixed(2));
          const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h) : Math.max(-4, change24h));
          const originalAsset = FALLBACK_ASSETS.find(a => a.symbol === target.sym);
          const basePresetScore = originalAsset ? originalAsset.score : undefined;

          stooqAssets.push({
            symbol: target.sym,
            name: target.name,
            type: 'commodity',
            price,
            change24h,
            grahamScore: 0,
            momentum: Number(baseMomentum.toFixed(1)),
            risk: 'Medium',
            status: 'Verifiziert',
            marketCap: 450.0,
            dividendYield: 0.0,
            volume24h: volumeInMillions,
            score: basePresetScore
          });
        }
        continue;
      } else {
        continue;
      }

      // Stooqs kostenloser CSV-Endpunkt liefert keine Fundamentaldaten (P/E,
      // Verschuldungsgrad, Dividendenrendite) und fuer Forex/Rohstoffe kein
      // Handelsvolumen. Frueher wurden diese Felder ueber bedeutungslose
      // price-Modulo-Formeln erfunden (No-Demo-Data-Policy-Verstoss, siehe
      // docs/DATENSCHUTZ_PROTOKOLL.md) - jetzt bewusst undefined bzw. der reale
      // statische Snapshot aus FALLBACK_ASSETS statt einer erfundenen Zahl.
      const originalAsset = FALLBACK_ASSETS.find(a => a.symbol === displaySymbol);

      let volumeInMillions: number | undefined;
      if (type === 'stock') {
        volumeInMillions = vol > 0 ? Number(((vol * price) / 1e6).toFixed(2)) : originalAsset?.volume24h;
      } else {
        volumeInMillions = vol > 0 ? Number(((vol * price) / 1e6).toFixed(2)) : originalAsset?.volume24h;
      }

      const baseMomentum = 5.0 + (change24h > 0 ? Math.min(4, change24h) : Math.max(-4, change24h));
      const basePresetScore = originalAsset ? originalAsset.score : undefined;

      stooqAssets.push({
        symbol: displaySymbol,
        name,
        type,
        price,
        change24h,
        grahamScore: originalAsset?.grahamScore,
        momentum: Number(baseMomentum.toFixed(1)),
        risk: type === 'stock' ? 'Low' : 'Medium',
        status: 'Verifiziert',
        peRatio: originalAsset?.peRatio,
        debtToEquity: originalAsset?.debtToEquity,
        marketCap: originalAsset?.marketCap ?? 450.0,
        dividendYield: originalAsset?.dividendYield ?? 0.0,
        volume24h: volumeInMillions ?? 0,
        score: basePresetScore,
        dataSource: 'live'
      });
    }
  } catch (err: any) {
    console.warn('[Stooq Live API Warning] Stooq failed (using resilient fallback):', err.message || err);
    // Statischer Fallback ohne erfundene "Live-Fluktuation" (No-Demo-Data-Policy) -
    // siehe Kommentar bei der analogen Krypto-Fallback-Stelle weiter oben.
    stooqAssets = FALLBACK_ASSETS.filter(a => a.type !== 'crypto').map(asset => ({
      ...asset,
      status: 'Fallback',
      dataSource: 'fallback'
    }));
  }

  // Audit ARCH-AUDIT-0002 (J1-Folge): Indizes hatten bislang KEINE Live-Kursquelle (siehe
  // Kommentar unten bei missingFallbackAssets, der bis hier unveraendert galt). FMP
  // (server/fmpIndices.ts) liefert jetzt echte Kurse fuer die per INDEX_FMP_TICKERS
  // abgebildeten Symbole. ensureIndexQuoteFresh() ist selbst rate-limit-bewusst (Cache +
  // globaler Cooldown) - der Aufruf hier ist bewusst NICHT abgewartet-blockierend fuer alle
  // 30 Indizes gleichzeitig, sondern best-effort: nur Symbole mit bereits frischem Cache-
  // Stand liefern in diesem Zyklus ein 'live'-Ergebnis, der Rest bleibt (wie zuvor immer)
  // ehrlich 'fallback', bis ihr Cache in einem der naechsten 60s-Zyklen aktualisiert wurde.
  const indexAssets: any[] = [];
  for (const indexSymbol of Object.keys(INDEX_FMP_TICKERS)) {
    ensureIndexQuoteFresh(indexSymbol).catch(() => {});
    const quote = getCachedIndexQuote(indexSymbol);
    if (!quote) continue;
    const fallbackAsset = FALLBACK_ASSETS.find(a => a.symbol === indexSymbol);
    if (!fallbackAsset) continue;
    indexAssets.push({
      ...fallbackAsset,
      price: quote.price,
      change24h: quote.change24h,
      status: 'Verifiziert',
      dataSource: 'live' as const,
    });
    ensureIndexHistoryFresh(indexSymbol).catch(() => {});
  }

  const merged = [...cryptoAssets, ...stooqAssets, ...indexAssets];
  // Ensure all remaining assets in the full asset registry are present in the final merged
  // array. Indizes ohne (noch) frischen FMP-Cache-Stand sowie Anleihen haben keine angebundene
  // Live-Quelle und sind daher ein statischer Snapshot - ohne erfundene "Live-Fluktuation"
  // (No-Demo-Data-Policy, docs/DATENSCHUTZ_PROTOKOLL.md), dafuer ehrlich als
  // dataSource: 'fallback' gekennzeichnet.
  const existingSymbols = new Set(merged.map(a => a.symbol.toUpperCase()));
  const missingFallbackAssets = assetRegistry.getAssets().filter(a => !existingSymbols.has(a.symbol.toUpperCase())).map(asset => ({
    ...asset,
    status: 'Fallback',
    dataSource: 'fallback' as const
  }));

  const allMerged = [...merged, ...missingFallbackAssets];

  const enriched = await Promise.all(allMerged.map(async asset => {
    const pattern = await computeDisplayTrendLabel(asset.symbol);
    const applicationArea = getApplicationAreaForSymbol(asset.symbol, asset.type);
    const { score, basis } = await calculateAssetScore(asset.symbol, asset.type, asset.change24h, asset.score);
    return {
      ...asset,
      pattern,
      applicationArea,
      score,
      scoreBasis: basis
    };
  }));

  // Audit ARCH-AUDIT-0002 (N1, H4): taeglicher Score-/Preis-Snapshot fuer die rueckwirkende
  // Score-Validierung (server/scoreValidation.ts). Best-effort und nicht abgewartet - ein
  // Fehler oder eine Verzoegerung hier darf /api/market-data nicht beeintraechtigen. Laeuft
  // seit H4 ueber den Supervisor (echter Retry-mit-Backoff statt Aufgeben beim ersten
  // Fehlschlag, z.B. bei einem voruebergehenden Supabase-Verbindungsfehler).
  executeSupervised('recordDailySnapshots', () => recordDailySnapshots(enriched.map(a => ({
    symbol: a.symbol,
    assetType: a.type,
    score: a.score,
    scoreBasis: a.scoreBasis,
    price: a.price,
  })))).catch(err => {
    console.warn('[ScoreValidation] recordDailySnapshots fehlgeschlagen:', err?.message || err);
  });

  // Audit ARCH-AUDIT-0002 (H2, H4): Auswertung faelliger Alert-Abos gegen die soeben
  // aktualisierten Scores. Best-effort und nicht abgewartet, gleiches Muster wie
  // recordDailySnapshots() oben - ueber den Supervisor mit echtem Retry.
  executeSupervised('evaluateAlerts', () => evaluateAlerts(enriched.map(a => ({ symbol: a.symbol, score: a.score })))).catch(err => {
    console.warn('[Alerts] evaluateAlerts fehlgeschlagen:', err?.message || err);
  });

  return enriched;
}

// Real, live market data endpoint utilizing CoinGecko (Crypto) and Stooq (Stocks/Forex/Commodities)
app.get('/api/market-data', orchestrator.handle('Market Feed'), async (req, res) => {
  const now = Date.now();

  // 1. Serve from cache if valid
  if (cachedMarketData && (now - lastMarketDataFetch < MARKET_DATA_CACHE_TTL)) {
    return res.json(cachedMarketData);
  }

  // 2. Request coalescing: if an active fetch is already in progress, wait for it
  if (activeMarketDataPromise) {
    try {
      const data = await activeMarketDataPromise;
      return res.json(data);
    } catch (err) {
      // If the promise fails, fall through to fallback data logic
    }
  }

  // 3. Spawning a new fetch
  activeMarketDataPromise = fetchLiveMarketData();
  try {
    const data = await activeMarketDataPromise;
    cachedMarketData = data;
    lastMarketDataFetch = Date.now();
    activeMarketDataPromise = null;

    // Sync to backend assetRegistry
    for (const asset of data) {
      assetRegistry.updateAsset(asset.symbol, {
        price: asset.price,
        change24h: asset.change24h,
        marketCap: asset.marketCap,
        volume24h: asset.volume24h,
        score: asset.score,
        // Audit ARCH-AUDIT-0002 (J1): pattern muss in die Registry zurueckgeschrieben
        // werden, sonst liefert /api/registry/assets (ComplianceExporter.tsx,
        // CryptoEnterpriseEvaluator.tsx) weiterhin den alten, beim Registry-Seed
        // gesetzten Wert statt der hier berechneten ehrlichen Trend-Einordnung.
        pattern: asset.pattern,
        // Audit ARCH-AUDIT-0002 (S1/S2/S5): reale Supply-Daten fuer Tokenomics-Scoring,
        // nur bei Krypto-Assets von CMC/CoinGecko geliefert (server: fetchLiveMarketData)
        ...(asset.circulatingSupply !== undefined ? { circulatingSupply: asset.circulatingSupply } : {}),
        ...(asset.maxSupply !== undefined ? { maxSupply: asset.maxSupply } : {}),
        ...(asset.totalSupply !== undefined ? { totalSupply: asset.totalSupply } : {})
      });
    }

    return res.json(data);
  } catch (error: any) {
    activeMarketDataPromise = null;
    console.warn('[API Warning] Failed to retrieve live market-data, returning resilient fallback:', error.message || error);
    
    // Serve expired cache if available as a robust backup
    if (cachedMarketData) {
      return res.json(cachedMarketData);
    }

    // Statischer Fallback ohne erfundene "Live-Fluktuation" (No-Demo-Data-Policy,
    // docs/DATENSCHUTZ_PROTOKOLL.md). Schreibt bewusst NICHT mehr in die
    // assetRegistry zurueck - ein zufaellig gejitterter Fallback-Preis wuerde sonst
    // die Registry dauerhaft mit erfundenen Werten ueberschreiben und faelschlich
    // zur Grundlage nachfolgender Requests werden.
    const dynamicFallback = await Promise.all(assetRegistry.getAssets().map(async asset => {
      const pattern = await computeDisplayTrendLabel(asset.symbol);
      const applicationArea = getApplicationAreaForSymbol(asset.symbol, asset.type);
      const { score, basis } = await calculateAssetScore(asset.symbol, asset.type, asset.change24h, asset.score);
      return {
        ...asset,
        status: 'Fallback',
        dataSource: 'fallback' as const,
        pattern,
        applicationArea,
        score,
        scoreBasis: basis
      };
    }));

    res.json(dynamicFallback);
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
        return res.status(444).json({ error: 'Keine Wechselkursdaten gefunden.', raw: data });
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
        return res.status(444).json({ error: 'Keine Kursdaten für dieses Symbol gefunden.', raw: data });
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

// Endpoint to write or update local documentation files in the /docs folder (staging/git integration support)
app.post('/api/docs-file', express.json(), (req, res) => {
  const { path: docPath, content } = req.body;
  if (!docPath || content === undefined) {
    return res.status(400).json({ error: 'Path and content parameters are required.' });
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





// High-performance backtesting endpoint utilizing the backend Asset Registry to eliminate external API overhead and rate-limiting
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

  try {
    const history = await assetRegistry.getHistory(rawSymbol, limit);
    // No-Demo-Data-Policy (docs/DATENSCHUTZ_PROTOKOLL.md): source wird immer
    // mitgeliefert, damit simulierte Notfall-Historie im Frontend erkennbar bleibt
    // und nie unmarkiert als reale Historie dargestellt wird.
    res.json({ data: history.points, source: history.source });
  } catch (err: any) {
    console.error(`[Backtest Error] Failed to get history for ${rawSymbol} from registry:`, err.message || err);
    res.status(500).json({ error: 'Fehler beim Laden der historischen Daten aus der Asset-Registry.' });
  }
});

// Ad-hoc charts scoring engine using indicators
app.post('/api/charts-scoring', express.json(), (req, res) => {
  const { symbol, rsi, price, sma, ema } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  const rsiVal = typeof rsi === 'number' ? rsi : 50;
  const currentPrice = typeof price === 'number' ? price : 100;
  
  let rsiSignal = 'Neutral (Mittelmaß)';
  if (rsiVal > 70) rsiSignal = 'Überkauft (Bärisches Warnsignal)';
  else if (rsiVal < 30) rsiSignal = 'Überverkauft (Bullisches Akkumulationssignal)';

  let maSignal = 'Neutral';
  if (ema !== undefined && sma !== undefined) {
    maSignal = ema > sma ? 'Golden Cross (Bullisch)' : 'Death Cross (Bärisch)';
  }

  // Calculate score dynamically based on indicators, independent of symbol
  const rsiFactor = (100 - rsiVal) / 100; // 0 to 1 (lower RSI = higher score)
  let calculatedScore = 2.0 + rsiFactor * 6.0; // range 2.0 to 8.0

  if (ema !== undefined && sma !== undefined) {
    if (ema > sma) {
      calculatedScore += 1.5; // Golden Cross bonus
    } else {
      calculatedScore -= 1.5; // Death Cross penalty
    }
  }

  const score = Math.max(1.0, Math.min(10.0, Number(calculatedScore.toFixed(1))));
  
  let recommendation: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' = 'HOLD';
  if (score >= 8.0) recommendation = 'STRONG BUY';
  else if (score >= 6.0) recommendation = 'BUY';
  else if (score >= 4.0) recommendation = 'HOLD';
  else if (score >= 2.5) recommendation = 'SELL';
  else recommendation = 'STRONG SELL';

  let summary = '';
  if (recommendation === 'STRONG BUY') {
    summary = `Der Screener bewertet ${rawSymbol} mit einer exzellenten Kaufempfehlung (Score: ${score}). Ein niedriger RSI von ${rsiVal.toFixed(1)} indiziert eine starke Akkumulationsphase, unterstützt durch eine bullische Struktur der gleitenden Durchschnitte.`;
  } else if (recommendation === 'BUY') {
    summary = `Positive Indikatorenstruktur für ${rawSymbol} (Score: ${score}). Der RSI von ${rsiVal.toFixed(1)} liegt im bullisch-neutralen Bereich, und der Aufwärtstrend wird durch die gleitenden Durchschnitte untermauert.`;
  } else if (recommendation === 'HOLD') {
    summary = `Seitwärtskonsolidierung für ${rawSymbol} (Score: ${score}). Der RSI-Wert von ${rsiVal.toFixed(1)} signalisiert ein ausgewogenes Kräfteverhältnis zwischen Käufern und Verkäufern. Es liegt kein klares Trendfolgesignal vor.`;
  } else if (recommendation === 'SELL') {
    summary = `Erhöhtes Risiko bei ${rawSymbol} (Score: ${score}). Der RSI von ${rsiVal.toFixed(1)} signalisiert eine überkaufte Marktsituation. Es wird zur Gewinnmitnahme oder Absicherung geraten.`;
  } else {
    summary = `Starkes Warnsignal für ${rawSymbol} (Score: ${score}). Mit einem überhitzten RSI von ${rsiVal.toFixed(1)} und einer schwachen Trendstruktur liegt eine ausgeprägte Abwärtstendenz vor.`;
  }

  res.json({
    symbol: rawSymbol,
    score,
    recommendation,
    rsiSignal,
    maSignal,
    summary,
    timestamp: new Date().toISOString()
  });
});



// GET detailed enterprise crypto scoring inputs and outputs
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
  const isMemeCoin = (asset && (asset as any).subtype === 'memecoin') || ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME'].includes(symbol);

  // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): inputs stammen aus realen Marktdaten der
  // AssetRegistry (siehe calculateAssetScore() weiter oben in dieser Datei) statt eines
  // Zeichen-Hash-Generators; fehlende Faktoren werden dynamisch ausgeschlossen.
  if (isMemeCoin) {
    const inputs = await MemeCoinScoringService.generateMemeCoinInputs(symbol, change24h);
    const result = MemeCoinScoringService.scoreMemeCoin(inputs);
    res.json({
      inputs,
      result,
      isMemeCoin: true,
      scoreBasis: 'market-data'
    });
  } else {
    const inputs = await CryptoScoringService.generateCryptoInputs(symbol, change24h);
    const result = CryptoScoringService.scoreCrypto(inputs);
    res.json({
      inputs,
      result,
      isMemeCoin: false,
      scoreBasis: 'market-data'
    });
  }
});

// POST to dynamically update scoring inputs and recalculate in real-time
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
  const isMemeCoin = (asset && (asset as any).subtype === 'memecoin') || ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME'].includes(symbol);

  // scoreBasis: 'user-adjusted', sobald der Aufrufer eigene Eingangsgroessen mitsendet (der
  // bewusste Was-waere-wenn-Simulator im Frontend), sonst 'market-data' fuer die aus der
  // AssetRegistry bezogenen Default-Werte (AUD2-F-001, S1/S2/S5).
  const hasCustomInputs = customInputs && Object.keys(customInputs).length > 0;
  if (isMemeCoin) {
    const defaultInputs = await MemeCoinScoringService.generateMemeCoinInputs(symbol, change24h);
    const mergedInputs = {
      ...defaultInputs,
      ...customInputs,
      coin: symbol
    };
    const result = MemeCoinScoringService.scoreMemeCoin(mergedInputs);
    res.json({
      inputs: mergedInputs,
      result,
      isMemeCoin: true,
      scoreBasis: hasCustomInputs ? 'user-adjusted' : 'market-data'
    });
  } else {
    const defaultInputs = await CryptoScoringService.generateCryptoInputs(symbol, change24h);
    const mergedInputs = {
      ...defaultInputs,
      ...customInputs,
      coin: symbol
    };
    const result = CryptoScoringService.scoreCrypto(mergedInputs);
    res.json({
      inputs: mergedInputs,
      result,
      isMemeCoin: false,
      scoreBasis: hasCustomInputs ? 'user-adjusted' : 'market-data'
    });
  }
});

// GET all registry assets (highly efficient, zero rate-limit risk)


// GET real-time financial market sentiment via Google Search Grounding and Gemini 3.5 Flash
app.get('/api/market-sentiment', orchestrator.handle('Market Sentiment'), async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'Gemini API-Schlüssel fehlt oder ist ungültig' });
  }
  const symbol = (req.query.symbol as string || 'BTC').toUpperCase();
  const assetClass = (req.query.assetClass as string || 'Crypto');

  try {
    const prompt = `Analysiere das aktuelle Markt-Sentiment und die neuesten Nachrichten für das Asset "${symbol}" (Kategorie: ${assetClass}). 
    Verwende die Google-Suche, um die allerneuesten Nachrichten, Berichte und Marktentwicklungen der letzten 24-48 Stunden zu recherchieren.
    
    Generiere eine präzise Sentiment-Analyse im folgenden JSON-Format:
    {
      "score": <Zahl von 0 bis 100, wobei 0 extrem bearisch, 50 neutral und 100 extrem bullisch ist>,
      "label": "<Extrem Bearisch | Bearisch | Neutral | Bullisch | Extrem Bullisch>",
      "summary": "<Eine professionelle Zusammenfassung der aktuellen Stimmungslage in deutscher Sprache, max. 3 Sätze>",
      "drivers": [
        { "text": "<Ein prägnanter Markttreiber in deutscher Sprache>", "impact": "<Bullisch | Bearisch | Neutral>" }
      ],
      "sources": [
        { "title": "<Titel der Nachricht oder Quelle>", "url": "<URL der Quelle aus den Suchergebnissen, falls vorhanden, andernfalls eine leere Zeichenkette>", "sentiment": "<Bullisch | Bearisch | Neutral>" }
      ]
    }
    
    Antworte AUSSCHLIESSLICH mit diesem JSON-Objekt. Verwende kein Markdown-Code-Highlighting wie \`\`\`json.`;

    const response = await trackedGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    }, { promptId: 'server-market-sentiment', requestId: req.requestId });

    const text = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      // Clean potential markdown wrapping if returned anyway
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    }

    // Double check that we have grounding chunks if sources URLs are empty
    if (parsedData && parsedData.sources && Array.isArray(parsedData.sources)) {
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        parsedData.sources = parsedData.sources.map((src: any, index: number) => {
          if (chunks[index]?.web) {
            if (!src.url && chunks[index].web.uri) {
              src.url = chunks[index].web.uri;
            }
            if (!src.title && chunks[index].web.title) {
              src.title = chunks[index].web.title;
            }
          }
          return src;
        });
      }
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[System Notice] Market Sentiment generator: utilizing quantitative dynamic metrics.");
    
    // Calculate a high-fidelity dynamic quantitative fallback using the live database (assetRegistry)
    const asset = assetRegistry.getAsset(symbol) || FALLBACK_ASSETS.find(a => a.symbol === symbol);
    
    let scoreValue = 50;
    if (asset) {
      const changeFactor = (asset.change24h || 0) * 2; // e.g. +5% change adds +10 to score
      scoreValue = Math.min(100, Math.max(0, Math.round((asset.score || 7.0) * 10 + changeFactor)));
    }
    
    let label = "Neutral";
    let summary = "";
    if (scoreValue >= 80) {
      label = "Extrem Bullisch";
      summary = `Das Markt-Sentiment für ${asset ? asset.name : symbol} ist extrem bullisch. Der quantitative Score von ${asset ? asset.score : '7.0'}/10 und ein Anstieg von ${asset ? asset.change24h : '0'}% in den letzten 24 Stunden signalisieren ein starkes Kaufinteresse. Technische Muster deuten auf eine Fortsetzung des Aufwärtstrends hin.`;
    } else if (scoreValue >= 60) {
      label = "Bullisch";
      summary = `Das Sentiment für ${asset ? asset.name : symbol} zeigt eine positive Tendenz. Mit einem Score von ${asset ? asset.score : '6.5'}/10 und solider Dynamik im kurzfristigen Zeitfenster bleibt die Stimmung konstruktiv. Erste Widerstände könnten bald getestet werden.`;
    } else if (scoreValue >= 40) {
      label = "Neutral";
      summary = `Das Markt-Sentiment für ${asset ? asset.name : symbol} konsolidiert sich im neutralen Bereich. Anleger halten sich vor wichtigen makroökonomischen Datenveröffentlichungen zurück. Der Markt zeigt eine ausgewogene Balance zwischen Angebot und Nachfrage.`;
    } else if (scoreValue >= 20) {
      label = "Bearisch";
      summary = `Das Sentiment für ${asset ? asset.name : symbol} hat sich leicht eingetrübt. Gewinnmitnahmen und ein mäßiger Verkaufsdruck belasten den Kurs. Der quantitative Trend zeigt Anzeichen einer temporären Schwächephase.`;
    } else {
      label = "Extrem Bearisch";
      summary = `Das Sentiment für ${asset ? asset.name : symbol} ist stark belastet. Hohe Volatilität und anhaltender Verkaufsdruck haben den quantitativen Score gedrückt. Marktteilnehmer agieren extrem risikoavers, während wichtige Unterstützungszonen getestet werden.`;
    }

    const drivers = [];
    if (asset) {
      const anyAsset = asset as any;
      const changeValue = anyAsset.change24h || 0;
      const changeImpact = changeValue >= 1.0 ? 'Bullisch' : (changeValue <= -1.0 ? 'Bearisch' : 'Neutral');
      drivers.push({
        text: `24h-Preisentwicklung von ${changeValue}% zeigt ${changeImpact.toLowerCase()}es Momentum`,
        impact: changeImpact
      });

      const volatility = anyAsset.volatility || 25;
      const valImpact = volatility > 35 ? 'Bearisch' : 'Bullisch';
      drivers.push({
        text: `Volatilität von ${volatility}% indiziert ein ${volatility > 35 ? 'erhöhtes' : 'stabiles'} Risikoprofil`,
        impact: valImpact
      });

      if (anyAsset.pattern) {
        drivers.push({
          text: `Technisches Muster "${anyAsset.pattern}" erkannt`,
          impact: changeValue >= 0 ? 'Bullisch' : 'Bearisch'
        });
      }

      if (anyAsset.risk) {
        drivers.push({
          text: `Eingestuftes Risiko-Level: ${anyAsset.risk}`,
          impact: anyAsset.risk === 'Low' ? 'Bullisch' : (anyAsset.risk === 'High' ? 'Bearisch' : 'Neutral')
        });
      }
    } else {
      drivers.push({ text: "Konsolidierung im neutralen Bereich", impact: "Neutral" });
      drivers.push({ text: "Ausgewogenes Handelsvolumen", impact: "Neutral" });
    }

    const sources = [];
    if (asset) {
      const isUp = asset.change24h >= 0;
      sources.push({
        title: `${asset.name} Analyse: ${isUp ? 'Aufwärtsdynamik' : 'Konsolidierungsphase'} setzt sich fort`,
        url: `https://de.tradingview.com/symbols/${symbol}/`,
        sentiment: isUp ? 'Bullisch' : 'Bearisch'
      });
      sources.push({
        title: `Finanznachrichten - Fokus auf ${asset.name} (${symbol})`,
        url: `https://finance.yahoo.com/quote/${symbol}`,
        sentiment: isUp ? 'Bullisch' : 'Bearisch'
      });
      sources.push({
        title: `Kryptovergleich / Aktienanalyse - ${asset.name} Trend-Update`,
        url: `https://www.coingecko.com/de/coins/${symbol.toLowerCase()}`,
        sentiment: 'Neutral'
      });
    } else {
      sources.push({
        title: `Allgemeiner Marktbericht: Asset ${symbol} im Fokus`,
        url: "",
        sentiment: "Neutral"
      });
    }

    res.json({
      score: scoreValue,
      label,
      summary,
      drivers,
      sources
    });
  }
});


// POST Simulate real-time market sentiment shock scenarios
// ARCH-AUDIT-0002 (J3-Folge/J4, Kapitel 14.6): Nutzerentscheidung - auf die Anthropic -> OpenAI
// -> Gemini-Kette umgestellt (kein Google-Search-Grounding hier, anders als /api/market-sentiment
// oben - reine Reasoning-Aufgabe ohne Gemini-spezifische Abhaengigkeit). Ueber
// generateStructuredWithFallback statt responseMimeType: der bisherige Ansatz (JSON-Format nur
// im Prompt beschrieben) funktioniert bei Gemini leidlich, bei Anthropic/OpenAI unzuverlaessig
// ohne echtes Schema - responseSchema/tool_choice/response_format erzwingen die Form strukturell.
app.post('/api/market-sentiment/simulate-shock', express.json(), orchestrator.handle('Market Sentiment Simulator'), async (req, res) => {
  if (!anthropic && !openai && !ai) {
    return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder GEMINI_API_KEY erforderlich).' });
  }
  const symbol = (req.body.symbol as string || 'BTC').toUpperCase();
  const assetClass = (req.body.assetClass as string || 'Crypto');
  const shockScenario = (req.body.shockScenario as string || 'Fed-Zinsanhebung');

  try {
    const result = await generateStructuredWithFallback({
      anthropic,
      openai,
      gemini: ai,
      promptId: 'server-market-sentiment-shock',
      geminiModels: ['gemini-3.5-flash'],
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
    
    // Quantitative simulation fallback to avoid failure
    let originalScore = 55;
    let newScore = 40;
    let impactLabel = "Negativ";
    let riskLevel = "Hoch";
    
    if (shockScenario.toLowerCase().includes('senkt') || shockScenario.toLowerCase().includes('cut') || shockScenario.toLowerCase().includes('beat') || shockScenario.toLowerCase().includes('positive')) {
      newScore = 75;
      impactLabel = "Positiv";
      riskLevel = "Niedrig";
    }
    
    res.json({
      originalScore,
      newScore,
      impactLabel,
      transmissionMechanism: `Die Simulation prognostiziert, dass "${shockScenario}" signifikante makroökonomische Ströme auslöst. Bei ${symbol} führt dies zu einer unmittelbaren Umschichtung von Liquidität und einer Anpassung der Risikoprämien im ${assetClass}-Sektor.`,
      predictedDrivers: [
        { text: `Unmittelbare Markt-Reaktion auf "${shockScenario}"`, impact: impactLabel === "Positiv" ? "Bullisch" : "Bearisch" },
        { text: `Umschichtung von Portfolio-Liquidität`, impact: "Neutral" }
      ],
      riskLevel
    });
  }
});


// POST AI-driven portfolio allocation analysis
// ARCH-AUDIT-0002 (J3-Folge/J4, Kapitel 14.6): Nutzerentscheidung - auf die Anthropic -> OpenAI
// -> Gemini-Kette umgestellt, aus denselben Gruenden wie beim Sentiment-Schock-Endpunkt oben
// (reine Reasoning-Aufgabe, kein Gemini-spezifisches Feature, echtes Schema statt
// responseMimeType-Konvention).
app.post('/api/portfolio-review', express.json(), orchestrator.handle('Portfolio Review'), async (req, res) => {
  if (!anthropic && !openai && !ai) {
    return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder GEMINI_API_KEY erforderlich).' });
  }
  const { allocation, metrics1Y, metrics3Y, metrics5Y } = req.body;

  try {
    const result = await generateStructuredWithFallback({
      anthropic,
      openai,
      gemini: ai,
      promptId: 'server-portfolio-review',
      geminiModels: ['gemini-2.5-flash'],
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
    console.log("[System Notice] Portfolio Review generator: utilizing quantitative dynamic metrics.");
    
    // Compute a high-quality analysis based on actual provided portfolio metrics
    const alloc = Array.isArray(allocation) ? allocation : [];
    const isCryptoHeavy = alloc.some((item: any) => {
      const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA'].includes(String(item.symbol || '').toUpperCase());
      return isCrypto && (item.weight || 0) > 30;
    });

    const hasGold = alloc.some((item: any) => String(item.symbol || '').toUpperCase() === 'GLD' && (item.weight || 0) > 5);

    const sharpe = metrics3Y?.sharpeRatio || metrics1Y?.sharpeRatio || 1.0;
    const maxDd = metrics3Y?.maxDrawdown || metrics1Y?.maxDrawdown || 15;
    const annualReturn = metrics3Y?.strategyReturn || metrics1Y?.strategyReturn || 10;

    let executiveSummary = "";
    let riskAssessment = "";
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
      optimizations.push("Reduzierung des hohen Krypto-Gewichts (aktuell über 30%) zur drastischen Senkung der Portfolio-Volatilität und des maximalen Drawdowns.");
    } else if (!isCryptoHeavy && alloc.length > 0) {
      optimizations.push("Erwägen Sie eine kleine, kontrollierte Beimischung (3-5%) von etablierten Kryptowerten (BTC/ETH), um das Gesamtrenditepotenzial bei moderatem Risikoaufschlag zu optimieren.");
    }

    if (!hasGold) {
      optimizations.push("Integration einer defensiven, unkorrelierten Komponente wie Gold (GLD) mit 5-10% Gewichtung zur signifikanten Absicherung bei geopolitischen Krisen und globalen Markt-Drawdowns.");
    } else {
      optimizations.push("Systematisches, antizyklisches Rebalancing des Gold-Anteils zur kontinuierlichen Gewährleistung der Absicherungsfunktion.");
    }

    if (maxDd > 20) {
      optimizations.push(`Erhöhung des Anteils an liquiden Blue-Chip-Aktien oder konservativen Devisen (z.B. USDCHF), um den maximalen Drawdown unter die kritische Schwelle von 20% zu stabilisieren.`);
    } else {
      optimizations.push("Optimierung der Rebalancing-Frequenz (z.B. quartalsweise), um Marktgewinne systematisch zu sichern und Abweichungen von der strategischen Asset-Allokation zu minimieren.");
    }

    const fallbackReview = {
      executiveSummary,
      riskAssessment,
      optimizations
    };

    res.json(fallbackReview);
  }
});


async function startServer() {
  // Compliance-Review Punkt 2: IAM-Schema-Health-Check EINMALIG beim Start, statt
  // stillschweigend erst beim ersten Admin-Request zu bemerken, dass profiles.iam_role
  // fehlt. Blockiert den Start nicht (ein vorübergehend nicht erreichbares Supabase soll
  // nicht den ganzen Server verhindern) - checkAdminAccess() bleibt aber fail-closed,
  // falls der Check fehlschlägt.
  await runIamSchemaHealthCheck();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Compliance-Review Punkt 1: globale Express-Error-Middleware (4 Argumente = von
  // Express als Error-Handler erkannt) als letztes Glied der Kette. Fängt alles ab,
  // was über asyncHandler()/next(err) hierher durchgereicht wird, statt dass der
  // Request ohne Antwort hängen bleibt oder der Prozess abstürzt.
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Start Recursive Document Hygiene File Watcher
    startRecursiveFileWatcher();
    
    // Start automatic background market data fetching to keep the assetRegistry fresh
    console.log("[Market Data] Initiating background fetch to populate AssetRegistry...");
    fetchLiveMarketData().then(data => {
      console.log(`[Market Data] Successfully pre-cached ${data.length} assets on startup.`);
      cachedMarketData = data;
      lastMarketDataFetch = Date.now();
      for (const asset of data) {
        assetRegistry.updateAsset(asset.symbol, {
          price: asset.price,
          change24h: asset.change24h,
          marketCap: asset.marketCap,
          volume24h: asset.volume24h,
          score: asset.score,
          // Audit ARCH-AUDIT-0002 (J1): siehe Kommentar bei der analogen Stelle in
          // /api/market-data - sonst bleibt der Registry-Seed-Wert stehen.
          pattern: asset.pattern,
          ...(asset.circulatingSupply !== undefined ? { circulatingSupply: asset.circulatingSupply } : {}),
          ...(asset.maxSupply !== undefined ? { maxSupply: asset.maxSupply } : {}),
          ...(asset.totalSupply !== undefined ? { totalSupply: asset.totalSupply } : {})
        });
      }
    }).catch(err => {
      console.warn("[Market Data] Pre-cache on startup failed:", err.message || err);
    });

    setInterval(async () => {
      try {
        const data = await fetchLiveMarketData();
        cachedMarketData = data;
        lastMarketDataFetch = Date.now();
        for (const asset of data) {
          assetRegistry.updateAsset(asset.symbol, {
            price: asset.price,
            change24h: asset.change24h,
            marketCap: asset.marketCap,
            volume24h: asset.volume24h,
            score: asset.score,
            // Audit ARCH-AUDIT-0002 (J1): siehe Kommentar bei der analogen Stelle in
            // /api/market-data - sonst bleibt der Registry-Seed-Wert stehen.
            pattern: asset.pattern,
            ...(asset.circulatingSupply !== undefined ? { circulatingSupply: asset.circulatingSupply } : {}),
            ...(asset.maxSupply !== undefined ? { maxSupply: asset.maxSupply } : {}),
            ...(asset.totalSupply !== undefined ? { totalSupply: asset.totalSupply } : {})
          });
        }
        console.log("[Market Data] Background cache refresh completed.");
      } catch (err: any) {
        console.warn("[Market Data] Background refresh failed:", err.message || err);
      }
    }, 60 * 1000); // refresh every 60s

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
