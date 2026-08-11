// ARCH-AUDIT-0002 (H5, Kapitel 14.5): erster Schritt der Zerlegung von server.ts entlang
// der Fachdomaenen nach src/features/ (die Domaenen-Ordner existierten bereits als leere
// Platzhalter - .gitkeep - seit fruehen Aufgaben dieser Session, aber ohne Inhalt). /api/news
// war die am staerksten in sich geschlossene Route in server.ts (keine Abhaengigkeit von
// geteiltem Zustand wie assetRegistry/fetchLiveMarketData) und damit der risikoaermste erste
// Kandidat fuer diese neue Zielstruktur. Verhalten 1:1 aus server.ts uebernommen, keine
// funktionale Aenderung.

import express from 'express';

export type NewsSentiment = 'positive' | 'negative' | 'neutral';

const POSITIVE_KEYWORDS = ['bullish', 'surge', 'gain', 'rise', 'rally', 'growth'];
const NEGATIVE_KEYWORDS = ['bearish', 'plummet', 'drop', 'fall', 'crash', 'risk', 'hack'];

/** Rein textbasierte Sentiment-Heuristik (Schluesselwort-Abgleich) - deterministisch, keine KI. */
export function classifyNewsSentiment(headline: string, description: string): NewsSentiment {
  const text = `${headline || ''} ${description || ''}`.toLowerCase();
  if (POSITIVE_KEYWORDS.some(kw => text.includes(kw))) return 'positive';
  if (NEGATIVE_KEYWORDS.some(kw => text.includes(kw))) return 'negative';
  return 'neutral';
}

export const newsRouter = express.Router();

newsRouter.get('/', async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey.startsWith('MY_') || apiKey.includes('test') || apiKey.length <= 5) {
    return res.status(503).json({
      status: 'NO_DATA',
      reason: 'NEWS_API_KEY ist nicht konfiguriert oder ungültig.',
    });
  }

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=cryptocurrency+OR+bitcoin+OR+ethereum+OR+finance&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`);
    if (response.ok) {
      const data: any = await response.json();
      if (data.status === 'ok' && Array.isArray(data.articles)) {
        const newsItems = data.articles.slice(0, 5).map((art: any, idx: number) => ({
          id: `news_${idx}_${Date.now()}`,
          headline: art.title || 'Krypto Markt Update',
          summary: art.description || art.content || 'Keine detaillierte Beschreibung verfügbar.',
          sentiment: classifyNewsSentiment(art.title, art.description),
          time: new Date(art.publishedAt || Date.now()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
          source: art.source?.name || 'NewsAPI',
        }));
        return res.json(newsItems);
      }
    }
    return res.status(503).json({
      status: 'NO_DATA',
      reason: 'Fehler beim Abrufen der Nachrichten von der externen NewsAPI (Antwort war fehlerhaft).',
    });
  } catch (error: any) {
    console.warn('[News API] Failed to fetch from NewsAPI.org:', error.message || error);
    return res.status(503).json({
      status: 'NO_DATA',
      reason: `Der externe NewsAPI-Aufruf ist fehlgeschlagen: ${error.message || error}`,
    });
  }
});
