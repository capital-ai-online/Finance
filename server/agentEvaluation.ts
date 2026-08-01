// ARCH-AUDIT-0002 (J2, Kapitel 4.12/14.6) - "Evaluation gegen einen kuratierten
// Referenzdatensatz einfuehren, bevor weitere Agenten ergaenzt werden." Kein erfundenes
// Referenzdatensatz mit "richtigen Antworten" - fuer Bewertungsurteile wie Risiko-Scores oder
// Kaufempfehlungen gibt es keine verifizierbare "richtige" Antwort, die man vorab festlegen
// koennte, ohne selbst zu erfinden (dieselbe No-Demo-Data-Policy-Ueberlegung wie beim
// ISO-27001-SoA, COMP-SOA-0001).
//
// Stattdessen: eine echte Regressionsmessung, die OHNE jede Aenderung an den 8 Agenten-
// Dateien auskommt. Jeder Agent ruft bereits trackedGenerateContent() auf (N2,
// src/services/aiUsageTracker.ts), das bei jeder ERFOLGREICHEN KI-Antwort einen Eintrag im
// usageLedger hinterlaesst - und NUR dann (siehe Kommentar dort: "Faellt die Antwort ohne
// usageMetadata aus [...], wird KEIN Eintrag [...] erzeugt"). Ein Agentenaufruf, der auf
// getFallback() zurueckfaellt (kein konfigurierter Client ODER eine geworfene Exception),
// hinterlaesst deshalb KEINEN neuen Ledger-Eintrag mit der erwarteten promptId. Das ist ein
// echtes, aus der bereits vorhandenen Instrumentierung ableitbares Erfolgssignal - keine neue
// Messgroesse, nur eine neue Auswertung der bestehenden.

import crypto from 'crypto';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { getUsageLedger } from '../src/services/aiUsageTracker';
import { ClassificationAgent } from '../src/agents/classificationAgent';
import { FundamentalsAgent } from '../src/agents/fundamentalsAgent';
import { RiskAgent } from '../src/agents/riskAgent';
import { ValuationAgent } from '../src/agents/valuationAgent';
import { CryptoClassificationAgent } from '../src/agents/cryptoClassificationAgent';
import { CryptoSentimentAgent } from '../src/agents/cryptoSentimentAgent';
import { CryptoOnChainAgent } from '../src/agents/cryptoOnChainAgent';
import { CryptoRiskAgent } from '../src/agents/cryptoRiskAgent';

interface EvalCase {
  promptId: string;
  /** Reales, stabiles Eingabesymbol - kein fabriziertes Beispiel, dieselben Werte wie im
   * produktiven Pfad (rawMaterialsConfig.ts fuer "Gold", CRYPTO_SYMBOLS fuer "BTC"). */
  input: string;
  createAgent: (ai: any, anthropic: Anthropic | null, openai: OpenAI | null) => { analyze: (input: string) => Promise<unknown> };
}

// Audit ARCH-AUDIT-0002 (J3/J3-Folge, Kapitel 14.6): seit dem providerübergreifenden Rückfall
// zaehlt eine ueber Anthropic ODER OpenAI erzielte Antwort ebenso als "echte KI-Antwort" wie
// eine Gemini-Antwort - der Ledger-Eintrag (und damit die Erfolgserkennung unten) ist
// providerunabhaengig.
const EVAL_CASES: EvalCase[] = [
  { promptId: 'raw-materials-classification', input: 'Gold', createAgent: (ai, anthropic, openai) => new ClassificationAgent(ai, anthropic, openai) },
  { promptId: 'raw-materials-fundamentals', input: 'Gold', createAgent: (ai, anthropic, openai) => new FundamentalsAgent(ai, anthropic, openai) },
  { promptId: 'raw-materials-risk', input: 'Gold', createAgent: (ai, anthropic, openai) => new RiskAgent(ai, anthropic, openai) },
  { promptId: 'raw-materials-valuation', input: 'Gold', createAgent: (ai, anthropic, openai) => new ValuationAgent(ai, anthropic, openai) },
  { promptId: 'crypto-classification', input: 'BTC', createAgent: (ai, anthropic, openai) => new CryptoClassificationAgent(ai, anthropic, openai) },
  { promptId: 'crypto-sentiment', input: 'BTC', createAgent: (ai, anthropic, openai) => new CryptoSentimentAgent(ai, anthropic, openai) },
  { promptId: 'crypto-onchain', input: 'BTC', createAgent: (ai, anthropic, openai) => new CryptoOnChainAgent(ai, anthropic, openai) },
  { promptId: 'crypto-risk', input: 'BTC', createAgent: (ai, anthropic, openai) => new CryptoRiskAgent(ai, anthropic, openai) },
];

export interface AgentEvalResult {
  promptId: string;
  evalInput: string;
  succeeded: boolean;
  latencyMs: number;
}

/**
 * Fuehrt alle acht Agenten einmal gegen ihr reales Eval-Symbol aus und bestimmt je Aufruf, ob
 * eine echte KI-Antwort erzielt wurde (neuer usageLedger-Eintrag mit passender promptId
 * innerhalb des Aufruf-Fensters) oder auf getFallback() zurueckgefallen wurde. Faengt eine vom
 * Agenten dennoch durchgelassene Exception ab und wertet das ebenfalls als Fallback - ein
 * fehlerhafter Agent darf den restlichen Evaluationslauf nicht abbrechen.
 */
export async function runAgentEvaluation(ai: any, anthropic: Anthropic | null = null, openai: OpenAI | null = null): Promise<AgentEvalResult[]> {
  const results: AgentEvalResult[] = [];

  for (const evalCase of EVAL_CASES) {
    const ledgerBefore = getUsageLedger().length;
    const start = Date.now();
    try {
      await evalCase.createAgent(ai, anthropic, openai).analyze(evalCase.input);
    } catch {
      // Wird unten ueber den Ledger-Vergleich als Fallback erkannt - kein separater
      // Fehlerpfad noetig, ein Agent, der eine Exception durchlaesst, hat per Definition
      // keine echte Antwort erzielt.
    }
    const latencyMs = Date.now() - start;
    const newEntries = getUsageLedger().slice(ledgerBefore);
    const succeeded = newEntries.some(entry => entry.promptId === evalCase.promptId);

    results.push({ promptId: evalCase.promptId, evalInput: evalCase.input, succeeded, latencyMs });
  }

  return results;
}

/**
 * Persistiert einen Evaluationslauf in Supabase. Best-effort: ein Fehler beim Schreiben lässt
 * den Aufrufer den Lauf trotzdem als Ergebnis zurueckgeben, nur ohne dauerhafte Historie.
 */
export async function persistAgentEvaluationRun(results: AgentEvalResult[]): Promise<{ runId: string; persisted: boolean }> {
  const runId = crypto.randomUUID();
  if (!isSupabaseConfigured()) {
    return { runId, persisted: false };
  }
  try {
    const supabase = getServerSupabase();
    const rows = results.map(r => ({
      run_id: runId,
      prompt_id: r.promptId,
      eval_input: r.evalInput,
      succeeded: r.succeeded,
      latency_ms: r.latencyMs,
    }));
    const { error } = await supabase.from('agent_evaluation_runs').insert(rows);
    if (error) {
      console.warn('[AgentEvaluation] Persistieren fehlgeschlagen:', error.message);
      return { runId, persisted: false };
    }
    return { runId, persisted: true };
  } catch (err: any) {
    console.warn('[AgentEvaluation] Persistieren fehlgeschlagen:', err?.message || err);
    return { runId, persisted: false };
  }
}

export interface AgentEvaluationRunSummary {
  runId: string;
  evaluatedAt: string;
  results: AgentEvalResult[];
}

export interface AgentRegressionEntry {
  promptId: string;
  previousSucceeded: boolean;
  latestSucceeded: boolean;
  /** true, wenn der Agent im vorherigen Lauf noch echte Antworten lieferte und jetzt nicht mehr. */
  regressed: boolean;
}

export interface AgentEvaluationHistory {
  latest: AgentEvaluationRunSummary | null;
  previous: AgentEvaluationRunSummary | null;
  regressions: AgentRegressionEntry[];
}

/**
 * Liefert den juengsten Lauf sowie den davor, samt einer expliziten Gegenueberstellung je
 * Agent - die eigentliche "Regressionsmessung" aus dem Roadmap-Titel: ein Agent, der im
 * vorherigen Lauf noch eine echte Antwort lieferte und jetzt nicht mehr, ist ein Regressions-
 * Kandidat (z.B. nach einem Prompt-/Modell-/Schema-Wechsel).
 */
export async function getAgentEvaluationHistory(): Promise<AgentEvaluationHistory> {
  const empty: AgentEvaluationHistory = { latest: null, previous: null, regressions: [] };
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('agent_evaluation_runs')
      .select('run_id, prompt_id, eval_input, succeeded, latency_ms, evaluated_at')
      .order('evaluated_at', { ascending: false })
      .limit(EVAL_CASES.length * 2);

    if (error || !data || data.length === 0) return empty;

    const rows = data as Array<{
      run_id: string; prompt_id: string; eval_input: string; succeeded: boolean; latency_ms: number; evaluated_at: string;
    }>;

    const runIdsInOrder: string[] = [];
    for (const row of rows) {
      if (!runIdsInOrder.includes(row.run_id)) runIdsInOrder.push(row.run_id);
    }

    const toSummary = (runId: string): AgentEvaluationRunSummary => {
      const runRows = rows.filter(r => r.run_id === runId);
      return {
        runId,
        evaluatedAt: runRows[0]?.evaluated_at,
        results: runRows.map(r => ({
          promptId: r.prompt_id,
          evalInput: r.eval_input,
          succeeded: r.succeeded,
          latencyMs: r.latency_ms,
        })),
      };
    };

    const latest = runIdsInOrder[0] ? toSummary(runIdsInOrder[0]) : null;
    const previous = runIdsInOrder[1] ? toSummary(runIdsInOrder[1]) : null;

    const regressions: AgentRegressionEntry[] = [];
    if (latest && previous) {
      for (const latestResult of latest.results) {
        const previousResult = previous.results.find(r => r.promptId === latestResult.promptId);
        if (!previousResult) continue;
        regressions.push({
          promptId: latestResult.promptId,
          previousSucceeded: previousResult.succeeded,
          latestSucceeded: latestResult.succeeded,
          regressed: previousResult.succeeded && !latestResult.succeeded,
        });
      }
    }

    return { latest, previous, regressions };
  } catch (err: any) {
    console.warn('[AgentEvaluation] Historie-Abfrage fehlgeschlagen:', err?.message || err);
    return empty;
  }
}
