/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';

// Audit ARCH-AUDIT-0002 (N2, Kapitel 14.4): Prompt-Registry und Token-/Kostenerfassung fuer
// alle Gemini-API-Aufrufe. Vor N2 gab es keine zentrale Uebersicht, welche Prompts das System
// tatsaechlich verwendet und wie viele Tokens/Kosten dabei anfallen - jeder der 19
// Aufrufstellen (server.ts, server/ai.ts, server/documentHygiene.ts, src/agents/*.ts) rief
// generateContent() direkt und unbeobachtet auf.
//
// Der Prompt-TEXT selbst bleibt bewusst in der jeweiligen Agent-/Router-Datei (naeher am
// fachlichen Kontext, deutlich geringeres Refactoring-Risiko als eine Verschiebung aller
// System-Instructions/Response-Schemas in ein zentrales Modul) - PROMPT_REGISTRY ist der
// Katalog (stabile ID, Modulherkunft, Kurzbeschreibung, Version), nicht der Speicherort.

export interface PromptRegistryEntry {
  id: string;
  module: string;
  description: string;
  version: string;
}

export const PROMPT_REGISTRY: Record<string, PromptRegistryEntry> = {
  'chat-assistant': { id: 'chat-assistant', module: 'server/ai.ts (/api/chat)', description: 'Freier Chat-Assistent fuer quantitative Finanzfragen.', version: '1.0.0' },
  'image-analysis': { id: 'image-analysis', module: 'server/ai.ts (/api/analyze-image)', description: 'Bildanalyse aus finanzieller Perspektive (Gemini Vision).', version: '1.0.0' },
  'document-hygiene-change-classification': { id: 'document-hygiene-change-classification', module: 'server/documentHygiene.ts (analyzeChangeWithAI)', description: 'Klassifiziert eine Dokumentaenderung (typo/content_update/structural_change/new_section/conflict_candidate).', version: '1.0.0' },
  'document-hygiene-propagation': { id: 'document-hygiene-propagation', module: 'server/documentHygiene.ts (generatePropagatedContent)', description: 'Uebertraegt eine Aenderung semantisch auf ein abhaengiges Dokument.', version: '1.0.0' },
  'server-market-sentiment': { id: 'server-market-sentiment', module: 'server.ts (/api/market-sentiment)', description: 'Marktstimmungsanalyse mit Google-Suche-Grounding.', version: '1.0.0' },
  'server-market-sentiment-shock': { id: 'server-market-sentiment-shock', module: 'server.ts (/api/market-sentiment/simulate-shock)', description: 'Simuliert den Sentiment-Effekt eines makrooekonomischen Schock-Szenarios.', version: '1.0.0' },
  'server-portfolio-review': { id: 'server-portfolio-review', module: 'server.ts (/api/portfolio-review)', description: 'KI-gestuetztes Review einer Portfolio-Allokation samt Backtest-Kennzahlen.', version: '1.0.0' },
  'raw-materials-classification': { id: 'raw-materials-classification', module: 'src/agents/classificationAgent.ts', description: 'Klassifiziert einen Rohstoffnamen (Hauptklasse/Unterklasse/Markttyp/Bewertungsmodus).', version: '1.0.0' },
  'raw-materials-fundamentals': { id: 'raw-materials-fundamentals', module: 'src/agents/fundamentalsAgent.ts', description: 'Fundamentalanalyse eines Rohstoffs (Angebot/Nachfrage).', version: '1.0.0' },
  'raw-materials-risk': { id: 'raw-materials-risk', module: 'src/agents/riskAgent.ts', description: 'Risikoanalyse eines Rohstoffs (geopolitisch/Lieferkette).', version: '1.0.0' },
  'raw-materials-valuation': { id: 'raw-materials-valuation', module: 'src/agents/valuationAgent.ts', description: 'Bewertungsmodell/Preiskorridor eines Rohstoffs.', version: '1.0.0' },
  'crypto-classification': { id: 'crypto-classification', module: 'src/agents/cryptoClassificationAgent.ts', description: 'Klassifiziert ein Krypto-Asset (Kategorie/Tier).', version: '1.0.0' },
  'crypto-sentiment': { id: 'crypto-sentiment', module: 'src/agents/cryptoSentimentAgent.ts', description: 'Sentiment-/Narrativ-Analyse eines Krypto-Assets.', version: '1.0.0' },
  'crypto-onchain': { id: 'crypto-onchain', module: 'src/agents/cryptoOnChainAgent.ts', description: 'On-Chain-Aktivitaets-Einschaetzung eines Krypto-Assets.', version: '1.0.0' },
  'crypto-risk': { id: 'crypto-risk', module: 'src/agents/cryptoRiskAgent.ts', description: 'Risiko-/Manipulationseinschaetzung eines Krypto-Assets.', version: '1.0.0' },
};

export interface AiUsageRecord {
  promptId: string;
  model: string;
  timestamp: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  /**
   * undefined, wenn fuer `model` keine reale Preistabelle konfiguriert ist (siehe
   * configureModelPricing()) - bewusst kein geschaetzter/erfundener Kostenwert
   * (No-Demo-Data-Policy, docs/DATENSCHUTZ_PROTOKOLL.md).
   */
  estimatedCostUsd?: number;
  requestId?: string;
}

const MAX_LEDGER_SIZE = 5000;
const usageLedger: AiUsageRecord[] = [];

interface ModelPricing {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

// Audit ARCH-AUDIT-0002 (N2): KEINE hartkodierte Preistabelle. Tatsaechliche Gemini-Preise
// haengen von Modellvariante, Kontextfenster-Groesse und Vertrag ab und aendern sich; ein
// im Code fest eingetragener USD-Wert waere binnen kurzer Zeit falsch und wuerde einen nicht
// verifizierten Kostenwert als scheinbar reale Zahl ausgeben - exakt das Muster, das
// AUD2-F-001 fuer Scoring-Eingangsgroessen bereits korrigiert hat. Stattdessen: optionale
// Konfiguration zur Laufzeit ueber Umgebungsvariablen (siehe configureModelPricing()/
// loadPricingFromEnv()). Ohne Konfiguration bleibt estimatedCostUsd undefined statt geschaetzt.
const modelPricing = new Map<string, ModelPricing>();

export function configureModelPricing(model: string, pricing: ModelPricing): void {
  modelPricing.set(model, pricing);
}

/**
 * Laedt Preise aus Umgebungsvariablen im Format
 * GEMINI_PRICE_<MODEL>_INPUT_PER_M / GEMINI_PRICE_<MODEL>_OUTPUT_PER_M (USD je 1M Tokens),
 * z.B. GEMINI_PRICE_GEMINI_3_5_FLASH_INPUT_PER_M=0.075. Modellname wird dafuer auf
 * Grossbuchstaben mit Unterstrichen normalisiert. Best-effort: fehlende/ungueltige Werte
 * werden uebersprungen statt einen Default anzunehmen.
 */
export function loadPricingFromEnv(models: string[]): void {
  for (const model of models) {
    const envKey = model.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const inputRaw = process.env[`GEMINI_PRICE_${envKey}_INPUT_PER_M`];
    const outputRaw = process.env[`GEMINI_PRICE_${envKey}_OUTPUT_PER_M`];
    const inputPerMillionUsd = inputRaw !== undefined ? Number(inputRaw) : NaN;
    const outputPerMillionUsd = outputRaw !== undefined ? Number(outputRaw) : NaN;
    if (Number.isFinite(inputPerMillionUsd) && Number.isFinite(outputPerMillionUsd)) {
      configureModelPricing(model, { inputPerMillionUsd, outputPerMillionUsd });
    }
  }
}

function computeCostUsd(model: string, promptTokens: number, candidateTokens: number): number | undefined {
  const pricing = modelPricing.get(model);
  if (!pricing) return undefined;
  return (promptTokens / 1_000_000) * pricing.inputPerMillionUsd + (candidateTokens / 1_000_000) * pricing.outputPerMillionUsd;
}

/**
 * Dünner Wrapper um ai.models.generateContent(): reicht Parameter und Antwort unveraendert
 * durch (keine Aenderung an Prompt/System-Instruction/Response-Schema), zeichnet aber die
 * reale usageMetadata der Antwort auf. Faellt die Antwort ohne usageMetadata aus (z.B. manche
 * Fehler-/Mock-Antworten), wird KEIN Eintrag mit geschaetzten Werten erzeugt.
 */
export async function trackedGenerateContent(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  meta: { promptId: string; requestId?: string }
): ReturnType<GoogleGenAI['models']['generateContent']> {
  const response = await ai.models.generateContent(params);
  try {
    recordGeminiUsage(response, String((params as any).model || 'unknown'), meta);
  } catch {
    // Aufzeichnung ist best-effort und darf den eigentlichen KI-Aufruf nicht gefaehrden.
  }
  return response;
}

function recordGeminiUsage(response: any, model: string, meta: { promptId: string; requestId?: string }): void {
  const usage = response?.usageMetadata;
  if (!usage) return;
  const promptTokens = typeof usage.promptTokenCount === 'number' ? usage.promptTokenCount : 0;
  const candidateTokens = typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0;
  const totalTokens = typeof usage.totalTokenCount === 'number' ? usage.totalTokenCount : promptTokens + candidateTokens;
  pushUsageRecord(model, promptTokens, candidateTokens, totalTokens, meta);
}

// Audit ARCH-AUDIT-0002 (J3, Kapitel 14.6): providerübergreifender Rückfall auf Anthropic
// Claude, wenn beide Gemini-Modelle fehlschlagen (src/services/agentModelRouting.ts). Der
// Ledger bleibt EIN gemeinsames, providerübergreifendes Instrument - genau das macht J2s
// Erfolgserkennung (Diff auf getUsageLedger() vor/nach einem Agentenaufruf) weiterhin
// korrekt, unabhaengig davon, welcher Provider tatsaechlich geantwortet hat.
export async function trackedAnthropicMessage(
  anthropic: Anthropic,
  params: Parameters<Anthropic['messages']['create']>[0],
  meta: { promptId: string; requestId?: string }
): Promise<Awaited<ReturnType<Anthropic['messages']['create']>>> {
  const response = await anthropic.messages.create(params);
  try {
    recordAnthropicUsage(response, String((params as any).model || 'unknown'), meta);
  } catch {
    // Aufzeichnung ist best-effort und darf den eigentlichen KI-Aufruf nicht gefaehrden.
  }
  return response;
}

function recordAnthropicUsage(response: any, model: string, meta: { promptId: string; requestId?: string }): void {
  const usage = response?.usage;
  if (!usage) return;
  const promptTokens = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
  const candidateTokens = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
  pushUsageRecord(model, promptTokens, candidateTokens, promptTokens + candidateTokens, meta);
}

// Audit ARCH-AUDIT-0002 (J3-Folge): dritter Provider in der Kette (Anthropic -> OpenAI ->
// Gemini, Nutzerpriorisierung). Derselbe gemeinsame, providerunabhaengige Ledger wie bei
// trackedAnthropicMessage() - J2s Erfolgserkennung bleibt unveraendert korrekt.
export async function trackedOpenAIMessage(
  openai: OpenAI,
  params: Parameters<OpenAI['chat']['completions']['create']>[0],
  meta: { promptId: string; requestId?: string }
): Promise<Awaited<ReturnType<OpenAI['chat']['completions']['create']>>> {
  const response = await openai.chat.completions.create(params);
  try {
    recordOpenAIUsage(response, String((params as any).model || 'unknown'), meta);
  } catch {
    // Aufzeichnung ist best-effort und darf den eigentlichen KI-Aufruf nicht gefaehrden.
  }
  return response;
}

function recordOpenAIUsage(response: any, model: string, meta: { promptId: string; requestId?: string }): void {
  const usage = response?.usage;
  if (!usage) return;
  const promptTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
  const candidateTokens = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
  const totalTokens = typeof usage.total_tokens === 'number' ? usage.total_tokens : promptTokens + candidateTokens;
  pushUsageRecord(model, promptTokens, candidateTokens, totalTokens, meta);
}

function pushUsageRecord(model: string, promptTokens: number, candidateTokens: number, totalTokens: number, meta: { promptId: string; requestId?: string }): void {
  usageLedger.push({
    promptId: meta.promptId,
    model,
    timestamp: new Date().toISOString(),
    promptTokens,
    candidateTokens,
    totalTokens,
    estimatedCostUsd: computeCostUsd(model, promptTokens, candidateTokens),
    requestId: meta.requestId,
  });
  if (usageLedger.length > MAX_LEDGER_SIZE) usageLedger.shift();
}

export interface AiUsageSummary {
  totalCalls: number;
  totalPromptTokens: number;
  totalCandidateTokens: number;
  totalTokens: number;
  /** undefined, wenn fuer keinen beteiligten Modellnamen eine Preiskonfiguration vorliegt. */
  totalEstimatedCostUsd?: number;
  byPromptId: Record<string, { calls: number; totalTokens: number; estimatedCostUsd?: number }>;
  byModel: Record<string, { calls: number; totalTokens: number; estimatedCostUsd?: number }>;
}

/**
 * In-memory Ledger (Kapazitaet 5000 Eintraege, wird beim Serverneustart geleert) - fuer eine
 * dauerhafte, neustartfeste Kostenhistorie waere eine Supabase-Tabelle ein sinnvoller
 * Folgeschritt (analog zu D3/D4), bewusst nicht Teil dieses Schritts.
 */
export function getUsageLedger(): AiUsageRecord[] {
  return usageLedger.slice();
}

export function getUsageSummary(): AiUsageSummary {
  const byPromptId: AiUsageSummary['byPromptId'] = {};
  const byModel: AiUsageSummary['byModel'] = {};
  let totalPromptTokens = 0;
  let totalCandidateTokens = 0;
  let totalCostKnown = false;
  let totalEstimatedCostUsd = 0;

  for (const rec of usageLedger) {
    totalPromptTokens += rec.promptTokens;
    totalCandidateTokens += rec.candidateTokens;
    if (rec.estimatedCostUsd !== undefined) {
      totalCostKnown = true;
      totalEstimatedCostUsd += rec.estimatedCostUsd;
    }

    const pEntry = byPromptId[rec.promptId] || { calls: 0, totalTokens: 0, estimatedCostUsd: undefined };
    pEntry.calls += 1;
    pEntry.totalTokens += rec.totalTokens;
    if (rec.estimatedCostUsd !== undefined) pEntry.estimatedCostUsd = (pEntry.estimatedCostUsd ?? 0) + rec.estimatedCostUsd;
    byPromptId[rec.promptId] = pEntry;

    const mEntry = byModel[rec.model] || { calls: 0, totalTokens: 0, estimatedCostUsd: undefined };
    mEntry.calls += 1;
    mEntry.totalTokens += rec.totalTokens;
    if (rec.estimatedCostUsd !== undefined) mEntry.estimatedCostUsd = (mEntry.estimatedCostUsd ?? 0) + rec.estimatedCostUsd;
    byModel[rec.model] = mEntry;
  }

  return {
    totalCalls: usageLedger.length,
    totalPromptTokens,
    totalCandidateTokens,
    totalTokens: totalPromptTokens + totalCandidateTokens,
    totalEstimatedCostUsd: totalCostKnown ? totalEstimatedCostUsd : undefined,
    byPromptId,
    byModel,
  };
}
