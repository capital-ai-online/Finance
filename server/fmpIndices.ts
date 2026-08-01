// ARCH-AUDIT-0002 (J1-Folge, Kapitel 10.1/14.6) - schliesst den in H1/J1 dokumentierten Gap:
// fuer Indizes existierte KEINE Live-Kursquelle ueberhaupt (permanent dataSource:'fallback').
// Financial Modeling Prep (FMP) liefert echte Index-Kurse und -Historie. Der Nutzer hat einen
// eigenen FMP_API_KEY in der Produktivumgebung hinterlegt (siehe render.yaml).
//
// FMPs Batch-/"full"-Quote-Endpunkte erfordern einen Ultimate/Enterprise-Plan (verifiziert per
// MCP-Testaufruf in dieser Session) - der vorhandene Key hat diesen Plan nicht. Deshalb werden
// Quotes/Historie EINZELN je Symbol abgerufen, mit Cache + globalem Cooldown (identisches
// Muster wie server/stockFundamentals.ts fuer Alpha Vantage, H1) statt alle ~30 Indizes bei
// jedem 60s-Hintergrund-Refresh gleichzeitig abzufragen.

import { getCleanEnv } from './env';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Symbol-Zuordnung: die bereits in server.ts (FALLBACK_ASSETS) verwendeten Index-Symbole ->
// FMPs tatsaechliche Ticker (meist "^"-Praefix, einzelne Ausnahmen mit Boersen-Suffix).
export const INDEX_FMP_TICKERS: Record<string, string> = {
  GSPC: '^GSPC',
  IXIC: '^IXIC',
  DJI: '^DJI',
  RUT: '^RUT',
  FTSE: '^FTSE',
  GDAXI: '^GDAXI',
  FCHI: '^FCHI',
  N225: '^N225',
  HSI: '^HSI',
  AXJO: '^AXJO',
  SSMI: '^SSMI',
  IBEX: '^IBEX',
  FTSEMIB: 'FTSEMIB.MI',
  BVSP: '^BVSP',
  MXX: '^MXX',
  SSEC: '000001.SS',
  BSESN: '^BSESN',
  JKSE: '^JKSE',
  KLSE: '^KLSE',
  STI: '^STI',
  KS11: '^KS11',
  TWII: '^TWII',
  TA125: '^TA125.TA',
  NZ50: '^NZ50',
  AORD: '^AORD',
  VIX: '^VIX',
  SDAX: '^SDAXI',
  MDAX: '^MDAXI',
  TECDAX: '^TECDAX',
  STOXX50E: '^STOXX50E',
};

export interface IndexQuote {
  price: number;
  change24h: number;
  fetchedAt: number;
}

export interface IndexHistoryPoint {
  date: string;
  close: number;
}

const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000; // Kurse: 5 Minuten
const HISTORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Historie: 24 Stunden (fuer Trend/Score ausreichend)
const MIN_CALL_GAP_MS = 5 * 1000; // hoechstens 1 FMP-Aufruf alle 5s, unabhaengig vom Aufrufer

const quoteCache = new Map<string, IndexQuote>();
const historyCache = new Map<string, { points: IndexHistoryPoint[]; fetchedAt: number }>();
let lastCallAt = 0;

function isQuoteFresh(entry: IndexQuote | undefined): entry is IndexQuote {
  return !!entry && Date.now() - entry.fetchedAt < QUOTE_CACHE_TTL_MS;
}

function isHistoryFresh(entry: { fetchedAt: number } | undefined): boolean {
  return !!entry && Date.now() - entry.fetchedAt < HISTORY_CACHE_TTL_MS;
}

function canCallNow(): boolean {
  return Date.now() - lastCallAt >= MIN_CALL_GAP_MS;
}

export function getCachedIndexQuote(symbol: string): IndexQuote | undefined {
  const entry = quoteCache.get(symbol.toUpperCase().trim());
  return isQuoteFresh(entry) ? entry : undefined;
}

export function getCachedIndexHistory(symbol: string): IndexHistoryPoint[] | undefined {
  const entry = historyCache.get(symbol.toUpperCase().trim());
  return entry ? entry.points : undefined;
}

/**
 * Aktualisiert - falls noetig und der globale Cooldown es zulaesst - den Quote-Cache fuer EIN
 * Index-Symbol. Best-effort, wirft nie: bei fehlendem Key, unbekanntem Symbol, aktivem
 * Cooldown oder Netzwerkfehler bleibt der (ggf. leere) bisherige Cache-Stand unveraendert.
 */
export async function ensureIndexQuoteFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  const fmpTicker = INDEX_FMP_TICKERS[s];
  if (!fmpTicker) return;
  if (isQuoteFresh(quoteCache.get(s))) return;

  const key = getCleanEnv('FMP_API_KEY');
  if (!key) return;
  if (!canCallNow()) return;
  lastCallAt = Date.now();

  try {
    const url = `${FMP_BASE_URL}/quote?symbol=${encodeURIComponent(fmpTicker)}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data: any = await res.json();
    const entry = Array.isArray(data) ? data[0] : undefined;
    if (!entry || typeof entry.price !== 'number') return;

    quoteCache.set(s, {
      price: entry.price,
      change24h: typeof entry.changePercentage === 'number' ? entry.changePercentage : 0,
      fetchedAt: Date.now(),
    });
  } catch (err: any) {
    console.warn(`[FMPIndices] Quote-Abruf fuer ${s} (${fmpTicker}) fehlgeschlagen:`, err?.message || err);
  }
}

/**
 * Analog zu ensureIndexQuoteFresh(), aber fuer die 30-Tage-Historie (fuer die technische
 * Scoring-Engine, H1). Laengere Cache-TTL, da sich eine 30-Tage-Reihe nicht minuetlich
 * veraendert.
 */
export async function ensureIndexHistoryFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  const fmpTicker = INDEX_FMP_TICKERS[s];
  if (!fmpTicker) return;
  if (isHistoryFresh(historyCache.get(s))) return;

  const key = getCleanEnv('FMP_API_KEY');
  if (!key) return;
  if (!canCallNow()) return;
  lastCallAt = Date.now();

  try {
    const to = new Date();
    const from = new Date(to.getTime() - 45 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `${FMP_BASE_URL}/historical-price-eod/light?symbol=${encodeURIComponent(fmpTicker)}&from=${fmt(from)}&to=${fmt(to)}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) return;

    const points: IndexHistoryPoint[] = data
      .filter((d: any) => typeof d.price === 'number' && typeof d.date === 'string')
      .map((d: any) => ({ date: d.date, close: d.price }))
      .sort((a: IndexHistoryPoint, b: IndexHistoryPoint) => a.date.localeCompare(b.date));

    if (points.length === 0) return;
    historyCache.set(s, { points, fetchedAt: Date.now() });
  } catch (err: any) {
    console.warn(`[FMPIndices] Historie-Abruf fuer ${s} (${fmpTicker}) fehlgeschlagen:`, err?.message || err);
  }
}
