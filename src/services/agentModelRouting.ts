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
// Reihenfolge: 1) Gemini-Modelle in der vom Agenten übergebenen Reihenfolge (i.d.R.
// Premium -> Flash), 2) Anthropic Claude NUR wenn ein Client konfiguriert ist (J3) - das ist
// der providerübergreifende Teil. Ohne konfigurierten Anthropic-Client (kein ANTHROPIC_API_KEY)
// bleibt der Rückfall fail-open inaktiv, exakt wie vor J3.

import { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import { trackedGenerateContent, trackedAnthropicMessage } from './aiUsageTracker';
import { getAnthropicModel } from '../../server/anthropicClient';

export interface StructuredGenerationRequest {
  promptId: string;
  contents: string;
  systemInstruction: string;
  /** Gemini-responseSchema (Type.OBJECT/STRING/NUMBER/...) - fuer Anthropic in ein JSON-Schema konvertiert. */
  schema: Record<string, unknown>;
  /** Modelle in Versuchsreihenfolge, z.B. ['gemini-3.1-pro-preview', 'gemini-3.5-flash']. */
  geminiModels: string[];
  requestId?: string;
}

export interface StructuredGenerationResult {
  data: any;
  /** Tatsaechlich erfolgreich verwendetes Modell, z.B. 'gemini-3.1-pro-preview' oder 'anthropic:claude-haiku-4-5-20251001'. */
  provider: string;
}

/**
 * Wandelt ein Gemini-`Type`-Schema (Enum-Werte wie 'OBJECT'/'STRING'/'NUMBER'/'INTEGER'/'ARRAY',
 * Grossschreibung) in ein Standard-JSON-Schema (Kleinschreibung) fuer Anthropics
 * `tools[].input_schema` um. INTEGER existiert in JSON Schema nicht als eigener `type`-Wert
 * neben `number` - es wird auf `number` abgebildet, die Ganzzahligkeit ist ohnehin nur eine
 * Beschreibungs-Konvention der Agenten-Prompts, keine harte Validierung.
 */
export function toAnthropicSchema(schema: any): any {
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
      props[key] = toAnthropicSchema(val);
    }
    out.properties = props;
  }
  if (schema.items) out.items = toAnthropicSchema(schema.items);
  if (Array.isArray(schema.required)) out.required = schema.required;
  return out;
}

const ANTHROPIC_TOOL_NAME = 'submit_structured_result';

/**
 * Fuehrt die Modell-/Provider-Kette fuer eine einzelne strukturierte Agentenanfrage aus.
 * Liefert `null`, wenn kein Provider konfiguriert ist ODER alle konfigurierten Provider
 * fehlschlagen - der Aufrufer (Agent) faellt dann auf seinen eigenen, hartkodierten
 * getFallback() zurueck, exakt wie vor J3.
 */
export async function generateStructuredWithFallback(
  req: StructuredGenerationRequest & { gemini: GoogleGenAI | null; anthropic: Anthropic | null }
): Promise<StructuredGenerationResult | null> {
  const { gemini, anthropic, promptId, contents, systemInstruction, schema, geminiModels, requestId } = req;

  if (gemini) {
    for (const model of geminiModels) {
      try {
        const response = await trackedGenerateContent(gemini, {
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema as any,
          },
        }, { promptId, requestId });
        const data = JSON.parse(response.text || '{}');
        return { data, provider: model };
      } catch (e) {
        console.warn(`[AgentModelRouting] Gemini-Modell '${model}' fehlgeschlagen fuer '${promptId}'.`, e);
      }
    }
  }

  if (anthropic) {
    const model = getAnthropicModel();
    try {
      const response: any = await trackedAnthropicMessage(anthropic, {
        model,
        max_tokens: 1024,
        system: systemInstruction,
        messages: [{ role: 'user', content: contents }],
        tools: [{
          name: ANTHROPIC_TOOL_NAME,
          description: 'Liefert das angeforderte strukturierte Analyseergebnis.',
          input_schema: toAnthropicSchema(schema),
        }],
        tool_choice: { type: 'tool', name: ANTHROPIC_TOOL_NAME },
      } as any, { promptId, requestId });

      const toolUse = Array.isArray(response?.content)
        ? response.content.find((block: any) => block?.type === 'tool_use')
        : undefined;
      if (toolUse?.input) {
        return { data: toolUse.input, provider: `anthropic:${model}` };
      }
      console.warn(`[AgentModelRouting] Anthropic-Antwort ohne tool_use-Block fuer '${promptId}'.`);
    } catch (e) {
      console.warn(`[AgentModelRouting] Anthropic-Rueckfall (${model}) fehlgeschlagen fuer '${promptId}'.`, e);
    }
  }

  return null;
}
