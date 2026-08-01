// ARCH-AUDIT-0002 (J3-Folge, Kapitel 14.6): dritter Provider in der Modell-/Provider-Kette.
// Nutzerentscheidung: Priorisierung Anthropic -> OpenAI -> Gemini (in dieser Reihenfolge,
// siehe agentModelRouting.ts). Lazy-Client nach demselben Muster wie server/ai.ts (Gemini) und
// server/anthropicClient.ts. Ohne OPENAI_API_KEY bleibt dieser Provider fail-open inaktiv.

import OpenAI from 'openai';
import { getCleanEnv } from './env';

let openaiClient: OpenAI | null = null;

export function getOpenAIInstance(): OpenAI {
  if (!openaiClient) {
    const key = getCleanEnv('OPENAI_API_KEY');
    if (!key) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

export function isOpenAIConfigured(): boolean {
  return !!getCleanEnv('OPENAI_API_KEY');
}

/**
 * Konfigurierbar statt hartkodiert - dieselbe Begruendung wie bei getAnthropicModel()
 * (server/anthropicClient.ts) und loadPricingFromEnv() (N2): Modell-Slugs aendern sich.
 * Default ist ein guenstiges/schnelles Mini-Tier-Modell (verifiziert ueber die aktuelle
 * OpenAI-API-Modelldokumentation, Stand dieser Session) - passend zur Rolle in der Kette
 * (Anthropic/OpenAI sind hier gleichrangige Zwischenstufen vor dem Gemini-Rueckfall, keine
 * kostenintensive Erstwahl fuer jede Anfrage).
 */
export function getOpenAIModel(): string {
  return getCleanEnv('OPENAI_MODEL') || 'gpt-5.4-mini';
}
