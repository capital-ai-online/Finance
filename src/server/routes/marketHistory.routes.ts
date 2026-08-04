import express from 'express';
import { orchestrator } from '../../lib/requestOrchestrator';
import { assetRegistry } from '../../lib/assetRegistry';

export const marketHistoryRouter = express.Router();

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK', 'MATIC'];

async function fetchAlphaVantageDailyHistory(symbol: string, isCrypto: boolean, key: string): Promise<{ date: string, close: number }[] | null> {
  try {
    const url = isCrypto
      ? `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${key}`
      : `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${key}`;

    console.log(`[Alpha Vantage] Requesting URL: ${url.replace(key, 'REDACTED')}`);
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: any = await res.json();
    if (data['Note'] || data['Error Message']) return null;

    const seriesKey = isCrypto ? 'Time Series (Digital Currency Daily)' : 'Time Series (Daily)';
    const series = data[seriesKey];
    if (!series) return null;

    const history: { date: string, close: number }[] = [];
    for (const dateStr of Object.keys(series)) {
      const entry = series[dateStr];
      const closeKey = isCrypto ? '4a. close (USD)' : '4. close';
      const closeVal = parseFloat(entry[closeKey]);
      if (Number.isNaN(closeVal)) continue;
      const parts = dateStr.split('-');
      if (parts.length === 3) history.push({ date: `${parts[2]}.${parts[1]}.${parts[0].substring(2)}`, close: closeVal });
    }

    history.sort((a, b) => {
      const pa = a.date.split('.');
      const pb = b.date.split('.');
      return new Date(Number(`20${pa[2]}`), Number(pa[1]) - 1, Number(pa[0])).getTime()
        - new Date(Number(`20${pb[2]}`), Number(pb[1]) - 1, Number(pb[0])).getTime();
    });
    return history;
  } catch {
    return null;
  }
}

marketHistoryRouter.get('/api/alpha-vantage-quote', orchestrator.handle('Alpha Vantage Quote'), async (req, res) => {
  const { symbol } = req.query;
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return res.status(400).json({ error: 'ALPHA_VANTAGE_KEY is not configured.' });
  if (!symbol) return res.status(400).json({ error: 'Symbol parameter is required.' });

  const rawSymbol = String(symbol).toUpperCase().trim();
  const isCrypto = CRYPTO_SYMBOLS.includes(rawSymbol);

  try {
    const url = isCrypto
      ? `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${rawSymbol}&to_currency=USD&apikey=${key}`
      : `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${rawSymbol}&apikey=${key}`;
    const response = await fetch(url);
    if (!response.ok) return res.status(500).json({ error: `Alpha Vantage returned HTTP status ${response.status}` });
    const data: any = await response.json();
    if (data['Note']) return res.status(429).json({ error: 'Alpha Vantage Rate-Limit erreicht. Bitte kurz warten.' });
    if (data['Error Message']) return res.status(400).json({ error: `Fehler von Alpha Vantage: ${data['Error Message']}` });

    if (isCrypto) {
      const rateObj = data['Realtime Currency Exchange Rate'];
      if (!rateObj) return res.status(444).json({ error: 'Keine Wechselkursdaten gefunden.', raw: data });
      return res.json({ symbol: rawSymbol, price: parseFloat(rateObj['5. Exchange Rate']), change24h: 0, source: 'Alpha Vantage', timestamp: rateObj['6. Last Refreshed'] });
    }

    const quoteObj = data['Global Quote'];
    if (!quoteObj || Object.keys(quoteObj).length === 0) return res.status(444).json({ error: 'Keine Kursdaten für dieses Symbol gefunden.', raw: data });
    const change24h = parseFloat(String(quoteObj['10. change percent'] || '0%').replace('%', ''));
    const volume = parseFloat(quoteObj['06. volume']);
    return res.json({ symbol: rawSymbol, price: parseFloat(quoteObj['05. price']), change24h: Number.isNaN(change24h) ? 0 : change24h, volume: Number.isNaN(volume) ? undefined : volume, source: 'Alpha Vantage', timestamp: quoteObj['07. latest trading day'] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Interner Serverfehler beim Abruf von Alpha Vantage.' });
  }
});

marketHistoryRouter.get('/api/backtest-history', orchestrator.handle('Backtest Download'), async (req, res) => {
  const { symbol, range } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol parameter is required.' });

  const rawSymbol = String(symbol).toUpperCase().trim();
  let limit = 365;
  if (range === '3Y' || range === '1095') limit = 1095;
  else if (range === '5Y' || range === '1825') limit = 1825;
  else {
    const parsed = parseInt(String(range));
    if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
  }

  try {
    const history = await assetRegistry.getHistory(rawSymbol, limit);
    return res.json({ data: history.points, source: history.source });
  } catch (err: any) {
    return res.status(500).json({ error: 'Fehler beim Laden der historischen Daten aus der Asset-Registry.' });
  }
});

export { fetchAlphaVantageDailyHistory };
