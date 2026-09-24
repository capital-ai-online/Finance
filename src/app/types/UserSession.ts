export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

export interface UserSession {
  type: 'guest' | 'registered';
  name: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  subscriptionTier: SubscriptionTier;
  avatarId?: string;
  avatarColor?: string;
  preferredAssetClass?: 'Crypto' | 'Stocks' | 'Commodities' | 'Forex';
  riskProfile?: 'Sicherheitsorientiert' | 'Ausgewogen' | 'Spekulativ' | 'Hochfrequenz-Trading';
  capital?: number;
  customAvatarUrl?: string;
  favoriteCryptocurrencies?: string[];
  favoriteStocks?: string[];
  portfolioAssets?: string[];
  investmentHorizon?: 'Kurzfristig' | 'Mittelfristig' | 'Langfristig';
  experienceLevel?: 'Einsteiger' | 'Fortgeschritten' | 'Erfahren' | 'Professionell';
  preferredCurrency?: 'EUR' | 'USD' | 'CHF' | 'GBP';
  /**
   * Verified Supabase subject projected by the backend session endpoint.
   * Authentication tokens are intentionally never exposed on this browser model.
   */
  id?: string;
}
