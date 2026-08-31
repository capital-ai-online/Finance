import { Router } from 'express';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { providerErrorMessage, redactProviderCredentialText } from '../../src/platform/MarketData/providerCredentialRedaction';

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP'];
export const ALPHA_VANTAGE_CREDENTIAL = 'ALPHA_VANTAGE_API_KEY' as const;

export function resolveAlphaVantageCredential(environment: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = environment[ALPHA_VANTAGE_CREDENTIAL]?.trim();
  return value || undefined;
}

export const alphaVantageRouter = Router();

alphaVantageRouter.get('/alpha-vantage-quote', orchestrator.handle('Alpha Vantage Quote'), async (req, res) => {
  const { symbol } = req.query;
  const key = resolveAlphaVantageCredential();
  if (!key) {
    return res.status(503).json({
      error: `${ALPHA_VANTAGE_CREDENTIAL} is not configured.`,
      status: 'UNAVAILABLE',
    });
  }
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const rawSymbol = String(symbol).toUpperCase().trim();
  const isCrypto = CRYPTO_SYMBOLS.includes(rawSymbol);

  try {
    const url = isCrypto
      ? `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${rawSymbol}&to_currency=USD&apikey=${encodeURIComponent(key)}`
      : `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${rawSymbol}&apikey=${encodeURIComponent(key)}`;

    console.log(`[Alpha Vantage Quote] Requesting URL: ${redactProviderCredentialText(url)}`);
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
      return res.json({
        symbol: rawSymbol,
        price: parseFloat(rateObj['5. Exchange Rate']),
        change24h: 0.0,
        source: 'Alpha Vantage',
        timestamp: rateObj['6. Last Refreshed'],
      });
    }

    const quoteObj = data['Global Quote'];
    if (!quoteObj || Object.keys(quoteObj).length === 0) {
      return res.status(444).json({ error: 'Keine Kursdaten für dieses Symbol gefunden.', raw: data });
    }
    const change24h = parseFloat((quoteObj['10. change percent'] || '0%').replace('%', ''));
    const volume = parseFloat(quoteObj['06. volume']);
    return res.json({
      symbol: rawSymbol,
      price: parseFloat(quoteObj['05. price']),
      change24h: Number.isNaN(change24h) ? 0.0 : change24h,
      volume: Number.isNaN(volume) ? undefined : volume,
      source: 'Alpha Vantage',
      timestamp: quoteObj['07. latest trading day'],
    });
  } catch (err: unknown) {
    return res.status(500).json({
      error: providerErrorMessage(err) || 'Interner Serverfehler beim Abruf von Alpha Vantage.',
    });
  }
});
