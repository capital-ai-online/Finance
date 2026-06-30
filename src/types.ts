export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
