export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex' | 'index';
  subtype?: 'memecoin' | 'standard';
  price: number;
  change24h: number;
  score: number; // Final Intelligent Score
  grahamScore: number;
  momentum: number;
  risk: string;
  status: string;
  peRatio?: number;
  debtToEquity?: number;
  marketCap?: number;
  dividendYield?: number;
  volume24h?: number;
  pattern?: string;
  applicationArea?: string;
  // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5, S6): Herkunft des score-Feldes, siehe
  // getScoreBasis() in server.ts. 'synthetic' = aus Zeichen-Hash des Symbols abgeleitet
  // (bisher nur noch Meme-Coins). 'market-data' = reale Marktdaten (Marktkapitalisierung/
  // Volumen/Supply/Kurshistorie), aber ohne vollstaendige Multi-Agenten-Analyse (Crypto,
  // Standard). 'heuristic' = Momentum-/Pattern-Heuristik statt eigener Fachengine (Aktien/
  // Forex/Indizes/Anleihen). Fehlt das Feld (z.B. Rohstoffe), hat der Asset-Typ eine
  // dedizierte Fachengine.
  scoreBasis?: 'synthetic' | 'market-data' | 'heuristic';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
