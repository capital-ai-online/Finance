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
  // Audit ARCH-AUDIT-0002 (AUD2-F-001): 'synthetic', wenn score aus einem Zeichen-Hash des
  // Symbols abgeleitet wurde statt aus Marktdaten (aktuell alle Crypto-Assets betroffen,
  // siehe isCryptoScoreBasisSynthetic() in server.ts). Fehlt das Feld, ist die Herkunft fuer
  // diesen Asset-Typ nicht Gegenstand dieser Kennzeichnung (z.B. Aktien/Forex/Rohstoffe).
  scoreBasis?: 'synthetic';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
