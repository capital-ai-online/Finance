// ARCH-AUDIT-0002 (H1, Kapitel 14.5) - Echte Fundamentaldaten fuer Aktien ueber Alpha Vantages
// OVERVIEW-Endpoint (KGV/PERatio, Dividendenrendite/DividendYield, Nettomarge/ProfitMargin -
// bewusst NUR Felder, die dieser kostenlose Endpunkt tatsaechlich liefert; ein "DebtToEquity"-
// Feld existiert dort nicht und wird daher nicht verwendet, statt es zu erfinden). Die bislang
// genutzten Werte stammten aus einem statischen Snapshot in server.ts' FALLBACK_ASSETS (siehe
// Kommentar dort: "Stooqs kostenloser CSV-Endpunkt liefert keine Fundamentaldaten"). Diese waren
// bereits real und nicht erfunden, aber eingefroren zum Zeitpunkt der Snapshot-Erstellung statt live.
//
// Alpha Vantages kostenlose Stufe begrenzt auf 5 Anfragen/Minute und ein Tageskontingent, das
// sich die on-demand Kurs-/Backtest-Endpunkte (server.ts, fetchAlphaVantageDailyHistory) bereits
// teilen. Ein globaler Cooldown (analog zum bestehenden Muster fuer CoinMarketCap/CoinGecko in
// fetchLiveMarketData) sorgt dafuer, dass hoechstens 1 OVERVIEW-Aufruf alle 20s erfolgt, UNABHAENGIG
// davon wie oft ensureFundamentalsFresh() aus dem 60s-Hintergrund-Refresh aufgerufen wird - der
// Aufrufer bekommt bei aktivem Cooldown einfach den (ggf. leeren) Cache-Stand zurueck, nie einen
// Fehler. Cache-TTL 24h, weil sich KGV/Dividendenrendite/Nettomarge nicht minuetlich aendern.

import { getCleanEnv } from './env';

export interface StockFundamentals {
  peRatio?: number;
  dividendYieldPct?: number;
  /** Nettomarge (Nettogewinn/Umsatz) in Prozent - Alpha-Vantage-Feld "ProfitMargin". */
  profitMarginPct?: number;
  fetchedAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_CALL_GAP_MS = 20 * 1000;

const cache = new Map<string, StockFundamentals>();
let lastCallAt = 0;

function isFresh(entry: StockFundamentals | undefined): entry is StockFundamentals {
  return !!entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

/**
 * Liefert den aktuellen Cache-Stand ohne einen Netzwerkaufruf auszuloesen - fuer die
 * synchronen Scoring-Pfade. undefined, wenn noch nichts (frisches) im Cache liegt.
 */
export function getCachedFundamentals(symbol: string): StockFundamentals | undefined {
  const entry = cache.get(symbol.toUpperCase().trim());
  return isFresh(entry) ? entry : undefined;
}

/**
 * Aktualisiert - falls noetig und der Cooldown es zulaesst - den Fundamentaldaten-Cache fuer
 * EIN Symbol. Best-effort, wirft nie: bei fehlendem Key, aktivem Cooldown, Alpha-Vantage-
 * Ratenlimit oder Netzwerkfehler bleibt der (ggf. leere) bisherige Cache-Stand unveraendert.
 */
export async function ensureFundamentalsFresh(symbol: string): Promise<void> {
  const s = symbol.toUpperCase().trim();
  if (isFresh(cache.get(s))) return;

  const key = getCleanEnv('ALPHA_VANTAGE_KEY');
  if (!key) return;

  if (Date.now() - lastCallAt < MIN_CALL_GAP_MS) return;
  lastCallAt = Date.now();

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${s}&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data: any = await res.json();
    if (!data || data['Note'] || data['Error Message'] || Object.keys(data).length === 0) return;

    const peRatio = parseFloat(data['PERatio']);
    const dividendYieldRaw = parseFloat(data['DividendYield']);
    const profitMarginRaw = parseFloat(data['ProfitMargin']);

    cache.set(s, {
      peRatio: Number.isFinite(peRatio) && peRatio > 0 ? peRatio : undefined,
      dividendYieldPct: Number.isFinite(dividendYieldRaw) ? dividendYieldRaw * 100 : undefined,
      profitMarginPct: Number.isFinite(profitMarginRaw) ? profitMarginRaw * 100 : undefined,
      fetchedAt: Date.now(),
    });
  } catch (err: any) {
    console.warn(`[StockFundamentals] Abruf fuer ${s} fehlgeschlagen:`, err?.message || err);
  }
}
