import { baseWeights, defiWeights } from "../config/weights";
import type { CryptoAnalysisPayload, CryptoScores, CryptoValueCorridor } from "../types/crypto.types";
import { assetRegistry } from "../lib/assetRegistry";
import {
  clamp,
  scoreVolatility,
  computeReturnStats,
  renormalizeAndScore,
} from "./realMarketSignals";

// Audit ARCH-AUDIT-0002 / P0 remediation: risk und volatility sind "je hoeher, desto
// schlechter" - renormalizeAndScore() wendet fuer diese Felder (100 - Wert) an.
const INVERTED_FIELDS = new Set(["risk", "volatility"]);

function assertComputable(scores: Record<string, number | undefined>, model: string): void {
  const finite = Object.entries(scores).filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
  if (finite.length === 0) {
    const error = new Error(`SCORE_NOT_COMPUTABLE: Keine verifizierten Eingangsmerkmale fuer ${model} vorhanden.`);
    (error as any).code = 'SCORE_NOT_COMPUTABLE';
    throw error;
  }
}

export function calculateBaseScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  assertComputable(s as Record<string, number | undefined>, 'base');
  const { score } = renormalizeAndScore(s as Record<string, number | undefined>, baseWeights, INVERTED_FIELDS);
  return { ...s, final_score: score };
}

export function calculateDefiScore(payload: CryptoAnalysisPayload): CryptoScores {
  const s = payload.scores ?? {};
  assertComputable(s as Record<string, number | undefined>, 'defi');
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
 * P0 Scoring Integrity.
 *
 * Die AssetRegistry enthaelt weiterhin Bootstrap-/UI-Snapshotwerte fuer Preis, Volumen,
 * MarketCap und Supply. Solange diese Felder keine per Feld gespeicherte Provider-Provenance
 * und keinen Observation-Timestamp besitzen, duerfen sie NICHT als beweisbare
 * Scoring-Eingangsdaten verwendet werden. Deshalb werden hier ausschliesslich Merkmale aus
 * `HistoryResult.source === "live"` erzeugt. Fehlt echte Historie, bleibt das Ergebnis leer
 * und calculateBaseScore/calculateDefiScore schlagen fail-closed mit SCORE_NOT_COMPUTABLE fehl.
 *
 * Dies ist bewusst strenger als die vorherige AUD2-F-001-Teilkorrektur: ein plausibler
 * Registry-Default darf nie als Marktbeobachtung interpretiert werden.
 */
export async function generateCryptoScores(symbol: string, _change24h: number): Promise<Partial<CryptoScores>> {
  const s = symbol.toUpperCase().trim();

  try {
    const history = await assetRegistry.getHistory(s, 30);
    if (history.source !== "live") return {};

    const stats = computeReturnStats(history.points.map((p) => p.close));
    if (!stats) return {};

    return {
      volatility: scoreVolatility(stats.dailyStdevPct),
    };
  } catch {
    return {};
  }
}
