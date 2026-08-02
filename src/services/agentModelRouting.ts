// ARCH-AUDIT-0002 (J3, Kapitel 14.6): "Model-Routing und providerübergreifender Rückfall."
//
// Vorher: jeder der 4 Rohstoff-Agenten wiederholte denselben Prompt/System-Instruction/Schema-
// Block zweimal (Premium-Modell, dann bei Fehlschlag identisch nochmal mit dem Flash-Modell)
// copy-paste-dupliziert. Die 4 Krypto-Agenten hatten gar keinen Modell-Retry - ein
// Fehlschlag ging direkt auf den hartkodierten getFallback(). Und in beiden Fällen gab es nur
// einen einzigen Anbieter (Google Gemini) - ein Gemini-Totalausfall (nicht nur Rate-Limit)
// hätte alle 8 Agenten gleichzeitig auf ihren statischen Fallback zurückfallen lassen.
//
// Jetzt: eine gemeinsame Routing-Funktion, die die Retry-/Fallback-Kette EINMAL implementiert
// und von allen 8 Agenten wiederverwendet wird (Wiederverwendung bestehender Komponenten statt
// Parallelstruktur). Jeder Agent bleibt für seinen eigenen Prompt/System-Instruction/Schema und
// die Zuordnung der JSON-Antwort auf sein Domänen-Objekt zuständig - nur die Ausführung der
// Modellkette ist zentralisiert.
//
// Reihenfolge (J3-Folge, explizite Nutzerpriorisierung nach Bereitstellung aller drei Keys):
// 1) Anthropic Claude, 2) OpenAI, 3) Gemini-Modelle in der vom Agenten übergebenen Reihenfolge
// (i.d.R. Premium -> Flash) als letzter Rückfall. Jede Stufe wird NUR versucht, wenn ein
// Client dafür konfiguriert ist - ohne einen der drei Keys bleibt die jeweilige Stufe fail-open
// inaktiv, die Kette rutscht einfach zur naechsten Stufe durch.

import { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { trackedGenerateContent, trackedAnthropicMessage, trackedOpenAIMessage } from './aiUsageTracker';
import { getAnthropicModel } from '../../server/anthropicClient';
import { getOpenAIModel } from '../../server/openaiClient';

export interface StructuredGenerationRequest {
  promptId: string;
  contents: string;
  systemInstruction: string;
  /** Gemini-responseSchema (Type.OBJECT/STRING/NUMBER/...) - fuer Anthropic/OpenAI in ein JSON-Schema konvertiert. */
  schema: Record<string, unknown>;
  /** Gemini-Modelle in Versuchsreihenfolge (letzte Stufe der Kette), z.B. ['gemini-3.1-pro-preview', 'gemini-3.5-flash']. */
  geminiModels: string[];
  requestId?: string;
}

export interface StructuredGenerationResult {
  data: any;
  /** Tatsaechlich erfolgreich verwendetes Modell, z.B. 'anthropic:claude-haiku-4-5', 'openai:gpt-5.4-mini' oder 'gemini-3.1-pro-preview'. */
  provider: string;
}

/**
 * Wandelt ein Gemini-`Type`-Schema (Enum-Werte wie 'OBJECT'/'STRING'/'NUMBER'/'INTEGER'/'ARRAY',
 * Grossschreibung) in ein Standard-JSON-Schema (Kleinschreibung) um - fuer Anthropics
 * `tools[].input_schema` und OpenAIs `response_format.json_schema.schema` gleichermassen
 * verwendbar (beide erwarten Standard-JSON-Schema). INTEGER existiert in JSON Schema nicht als
 * eigener `type`-Wert neben `number` - es wird auf `number` abgebildet, die Ganzzahligkeit ist
 * ohnehin nur eine Beschreibungs-Konvention der Agenten-Prompts, keine harte Validierung.
 */
export function toJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const out: Record<string, unknown> = {};
  if (typeof schema.type === 'string') {
    const t = schema.type.toLowerCase();
    out.type = t === 'integer' ? 'number' : t;
  }
  if (schema.description) out.description = schema.description;
  if (schema.properties && typeof schema.properties === 'object') {
    const props: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(schema.properties)) {
      props[key] = toJsonSchema(val);
    }
    out.properties = props;
  }
  if (schema.items) out.items = toJsonSchema(schema.items);
  if (Array.isArray(schema.required)) out.required = schema.required;
  return out;
}

const ANTHROPIC_TOOL_NAME = 'submit_structured_result';

async function tryAnthropic(
  anthropic: Anthropic,
  req: StructuredGenerationRequest
): Promise<StructuredGenerationResult | null> {
  const model = getAnthropicModel();
  try {
    const response: any = await trackedAnthropicMessage(anthropic, {
      model,
      max_tokens: 1024,
      system: req.systemInstruction,
      messages: [{ role: 'user', content: req.contents }],
      tools: [{
        name: ANTHROPIC_TOOL_NAME,
        description: 'Liefert das angeforderte strukturierte Analyseergebnis.',
        input_schema: toJsonSchema(req.schema),
      }],
      tool_choice: { type: 'tool', name: ANTHROPIC_TOOL_NAME },
    } as any, { promptId: req.promptId, requestId: req.requestId });

    const toolUse = Array.isArray(response?.content)
      ? response.content.find((block: any) => block?.type === 'tool_use')
      : undefined;
    if (toolUse?.input) {
      return { data: toolUse.input, provider: `anthropic:${model}` };
    }
    console.warn(`[AgentModelRouting] Anthropic-Antwort ohne tool_use-Block fuer '${req.promptId}'.`);
  } catch (e) {
    console.warn(`[AgentModelRouting] Anthropic (${model}) fehlgeschlagen fuer '${req.promptId}'.`, e);
  }
  return null;
}

async function tryOpenAI(
  openai: OpenAI,
  req: StructuredGenerationRequest
): Promise<StructuredGenerationResult | null> {
  const model = getOpenAIModel();
  try {
    const response = await trackedOpenAIMessage(openai, {
      model,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: req.systemInstruction },
        { role: 'user', content: req.contents },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          // OpenAI erlaubt nur [a-zA-Z0-9_-], max. 64 Zeichen.
          name: req.promptId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64),
          schema: toJsonSchema(req.schema),
        },
      },
    } as any, { promptId: req.promptId, requestId: req.requestId });

    const content = (response as any)?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.length > 0) {
      return { data: JSON.parse(content), provider: `openai:${model}` };
    }
    console.warn(`[AgentModelRouting] OpenAI-Antwort ohne Inhalt fuer '${req.promptId}'.`);
  } catch (e) {
    console.warn(`[AgentModelRouting] OpenAI (${model}) fehlgeschlagen fuer '${req.promptId}'.`, e);
  }
  return null;
}

async function tryGemini(
  gemini: GoogleGenAI,
  req: StructuredGenerationRequest
): Promise<StructuredGenerationResult | null> {
  for (const model of req.geminiModels) {
    try {
      const response = await trackedGenerateContent(gemini, {
        model,
        contents: req.contents,
        config: {
          systemInstruction: req.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: req.schema as any,
        },
      }, { promptId: req.promptId, requestId: req.requestId });
      const data = JSON.parse(response.text || '{}');
      return { data, provider: model };
    } catch (e) {
      console.warn(`[AgentModelRouting] Gemini-Modell '${model}' fehlgeschlagen fuer '${req.promptId}'.`, e);
    }
  }
  return null;
}

/**
 * Fuehrt die Modell-/Provider-Kette fuer eine einzelne strukturierte Agentenanfrage aus, in
 * der Reihenfolge Anthropic -> OpenAI -> Gemini. Liefert `null`, wenn kein Provider
 * konfiguriert ist ODER alle konfigurierten Provider fehlschlagen - der Aufrufer (Agent)
 * faellt dann auf seinen eigenen, hartkodierten getFallback() zurueck.
 */
export async function generateStructuredWithFallback(
  req: StructuredGenerationRequest & { gemini: GoogleGenAI | null; anthropic: Anthropic | null; openai: OpenAI | null }
): Promise<StructuredGenerationResult | null> {
  const { gemini, anthropic, openai, ...rest } = req;

  if (anthropic) {
    const result = await tryAnthropic(anthropic, rest);
    if (result) return result;
  }

  if (openai) {
    const result = await tryOpenAI(openai, rest);
    if (result) return result;
  }

  if (gemini) {
    const result = await tryGemini(gemini, rest);
    if (result) return result;
  }

  return null;
}
