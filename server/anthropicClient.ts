// ARCH-AUDIT-0002 (J3, Kapitel 14.6): "Model-Routing und providerübergreifender Rückfall."
// Lazy Anthropic-Client nach demselben Muster wie server/ai.ts (Gemini) und
// server/fmpIndices.ts (getCleanEnv). Ohne ANTHROPIC_API_KEY bleibt der Cross-Provider-
// Rückfall fail-open inaktiv - die Agenten verhalten sich dann exakt wie vor J3 (Gemini-Modelle
// in Reihenfolge, danach der hartkodierte getFallback()).

import Anthropic from '@anthropic-ai/sdk';
import { getCleanEnv } from './env';

let anthropicClient: Anthropic | null = null;

export function getAnthropicInstance(): Anthropic {
  if (!anthropicClient) {
    const key = getCleanEnv('ANTHROPIC_API_KEY');
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({ apiKey: key });
  }
  return anthropicClient;
}

export function isAnthropicConfigured(): boolean {
  return !!getCleanEnv('ANTHROPIC_API_KEY');
}

/**
 * Konfigurierbar statt hartkodiert - dieselbe Begründung wie loadPricingFromEnv() in
 * src/services/aiUsageTracker.ts (N2): Anthropic-Modell-Slugs ändern sich, ein fest
 * eingetragener Wert wäre binnen kurzer Zeit potenziell veraltet. Default ist bewusst ein
 * schnelles/günstiges Modell (Haiku-Tier) - der Cross-Provider-Rückfall greift ohnehin nur,
 * wenn beide Gemini-Modelle bereits fehlgeschlagen sind, nicht als Premium-Erstwahl.
 */
export function getAnthropicModel(): string {
  return getCleanEnv('ANTHROPIC_MODEL') || 'claude-haiku-4-5-20251001';
}
