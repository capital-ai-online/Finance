/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ESS-0018 Phase 1 / ADR-0050: Screening/Scoring-Erklaerbarkeits-Agent. Liest ausschliesslich
// ueber das read-only Agent-Tool getScoreSnapshotEvidence und erklaert einen bereits
// persistierten Score anhand der zitierten Snapshot-Historie. Erfindet keine Erklaerung, wenn
// keine Evidenz vorliegt (fail-closed, analog RAG-Evidence-Layer).

import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { generateTextWithFallback } from '../services/agentModelRouting';
import { getScoreSnapshotEvidence } from '../services/agentTools/supabaseScoreEvidenceTool';
import type { RagEvidenceBundle } from '../services/rag/evidenceLayer';

export interface ScoreExplainabilityRequest {
  symbol: string;
  fromDate?: string;
  toDate?: string;
}

export interface ScoreExplainabilityResult {
  symbol: string;
  explanation: string;
  evidence: RagEvidenceBundle;
  modelProvider: string | null;
}

export class ScoreExplainabilityAgent {
  private ai: AiGenerationClient | null;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
    this.openai = openaiClient;
  }

  public async explain(request: ScoreExplainabilityRequest): Promise<ScoreExplainabilityResult> {
    const { rows, evidence } = await getScoreSnapshotEvidence(request);

    if (evidence.evaluation.quality === 'NO_EVIDENCE') {
      return {
        symbol: request.symbol,
        explanation: `Keine gespeicherten Score-Snapshots fuer "${request.symbol}" im angefragten Zeitraum gefunden.`,
        evidence,
        modelProvider: null,
      };
    }

    const historyText = rows
      .map(row => `${row.snapshot_date}: Score ${row.score} (Basis: ${row.score_basis ?? 'unbekannt'}), Preis ${row.price}`)
      .join('\n');

    const result = await generateTextWithFallback({
      anthropic: this.anthropic,
      openai: this.openai,
      promptId: 'score-explainability',
      systemInstruction: `Du bist der "Score Explainability Agent" der CAPITAL-AI Plattform.
Erklaere ausschliesslich anhand der bereitgestellten, tatsaechlich gespeicherten Score-Snapshots, wie sich der Score fuer das angefragte Symbol entwickelt hat.
Erfinde keine Daten und keine Gruende, die nicht aus den bereitgestellten Snapshots ableitbar sind. Wenn die Datenlage duenn ist, sag das explizit.`,
      contents: `Symbol: ${request.symbol}\nGespeicherte Score-Snapshots (neueste zuerst):\n${historyText}`,
    });

    return {
      symbol: request.symbol,
      explanation: result?.text ?? `Score-Historie fuer ${request.symbol} liegt vor (${rows.length} Snapshots), aber es konnte keine KI-Erklaerung erzeugt werden.`,
      evidence,
      modelProvider: result?.provider ?? null,
    };
  }
}
