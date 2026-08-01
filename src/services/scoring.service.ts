import { baseWeights, defiWeights } from "../config/weights";
import type { CryptoAnalysisPayload, CryptoScores, CryptoValueCorridor } from "../types/crypto.types";
import { assetRegistry } from "../lib/assetRegistry";
import {
  clamp,
  scoreMarketCap,
  scoreLiquidity,
  scoreTokenomics,
  scoreSupplyTransparency,
  scoreVolatility,
  computeReturnStats,
  renormalizeAndScore,
} from "./realMarketSignals";

// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): risk und volatility sind "je hoeher, desto
// schlechter" - renormalizeAndScore() wendet fuer diese Felder (100 - Wert) an.
const INVERTED_FIELDS = new Set(["risk", "volatility"]);

export function calculateBaseScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  const { score } = renormalizeAndScore(s as Record<string, number | undefined>, baseWeights, INVERTED_FIELDS);
  return { ...s, final_score: score };
}

export function calculateDefiScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  const { score } = renormalizeAndScore(s as Record<string, number | undefined>, defiWeights, INVERTED_FIELDS);
  return { ...s, final_score: score };
}

export function calculateValueCorridor(finalScore: number, marketReference?: number): CryptoValueCorridor {
  const conservative = clamp(finalScore * 0.85);
  const neutral = clamp(finalScore);
  const optimistic = clamp(finalScore * 1.15);
  const fairValueGapPct = marketReference && marketReference > 0 ? ((neutral - marketReference) / marketReference) * 100 : 0;
  return { conservative, neutral, optimistic, fairValueGapPct };
}

export function selectModel(payload: CryptoAnalysisPayload) {
  return payload.classification?.category_main === "DeFi" ? "defi" : "base";
}

/**
 * Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): liefert die 5 marktdatenbasierten
 * CryptoScores-Felder aus TATSAECHLICHEN Daten der AssetRegistry (Preis/Volumen/
 * Marktkapitalisierung von CoinMarketCap/CoinGecko, Supply-Daten, echte Kurshistorie fuer
 * Volatilitaet) statt aus einem Zeichen-Hash des Symbols. Bedient sich selbststaendig ueber
 * `symbol` bei der bestehenden AssetRegistry (Wiederverwendung der Wertschoepfungskette,
 * keine neue Datenquelle) statt neue Parameter an allen Aufrufstellen einzufuehren. Felder
 * ohne belastbare Quelle fuer ein Asset bleiben undefined statt geschaetzt zu werden - siehe
 * renormalizeAndScore() in calculateBaseScore/calculateDefiScore.
 */
export async function generateCryptoScores(symbol: string, _change24h: number): Promise<Partial<CryptoScores>> {
  const s = symbol.toUpperCase().trim();
  const asset = assetRegistry.getAsset(s);

  const marketCapUsd = asset?.marketCap !== undefined ? asset.marketCap * 1e9 : undefined;
  const volumeUsd = asset?.volume24h !== undefined ? asset.volume24h * 1e6 : undefined;

  const marketCap = marketCapUsd !== undefined ? scoreMarketCap(marketCapUsd) : undefined;
  const liquidity = (volumeUsd !== undefined && marketCapUsd !== undefined)
    ? scoreLiquidity(volumeUsd, marketCapUsd)
    : undefined;
  const tokenomics = scoreTokenomics(asset?.circulatingSupply, asset?.maxSupply);
  const supplyTransparency = scoreSupplyTransparency(asset?.maxSupply, asset?.totalSupply);

  let volatility: number | undefined;
  try {
    const history = await assetRegistry.getHistory(s, 30);
    if (history.source === "live") {
      const stats = computeReturnStats(history.points.map((p) => p.close));
      if (stats) volatility = scoreVolatility(stats.dailyStdevPct);
    }
  } catch {
    // Keine echte Historie verfuegbar - volatility bleibt undefined statt geschaetzt.
  }

  return { marketCap, liquidity, tokenomics, supplyTransparency, volatility };
}
