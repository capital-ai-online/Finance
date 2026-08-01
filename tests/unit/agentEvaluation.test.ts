// Audit ARCH-AUDIT-0002 (J2): Testabdeckung fuer die Agenten-Regressionsmessung. Kein echter
// Gemini-/Supabase-Zugriff im Test - getUsageLedger() und die acht Agentenklassen werden
// gemockt, um Erfolgs- und Fallback-Faelle deterministisch zu erzeugen.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLedger: Array<{ promptId: string }> = [];
const mockGetUsageLedger = vi.fn(() => mockLedger.slice());

vi.mock('../../src/services/aiUsageTracker', () => ({
  getUsageLedger: () => mockGetUsageLedger(),
}));

// Steuert je Test, welche der acht Agentenklassen eine "erfolgreiche" KI-Antwort simulieren
// (Ledger-Eintrag) und welche auf den Fallback zurueckfallen (kein Ledger-Eintrag) oder werfen.
const agentBehavior: Record<string, 'success' | 'fallback' | 'throw'> = {};

function makeAgentMock(promptId: string) {
  return class {
    async analyze(_input: string) {
      const behavior = agentBehavior[promptId] ?? 'success';
      if (behavior === 'throw') throw new Error(`${promptId} boom`);
      if (behavior === 'success') mockLedger.push({ promptId });
      return {};
    }
  };
}

vi.mock('../../src/agents/classificationAgent', () => ({ ClassificationAgent: makeAgentMock('raw-materials-classification') }));
vi.mock('../../src/agents/fundamentalsAgent', () => ({ FundamentalsAgent: makeAgentMock('raw-materials-fundamentals') }));
vi.mock('../../src/agents/riskAgent', () => ({ RiskAgent: makeAgentMock('raw-materials-risk') }));
vi.mock('../../src/agents/valuationAgent', () => ({ ValuationAgent: makeAgentMock('raw-materials-valuation') }));
vi.mock('../../src/agents/cryptoClassificationAgent', () => ({ CryptoClassificationAgent: makeAgentMock('crypto-classification') }));
vi.mock('../../src/agents/cryptoSentimentAgent', () => ({ CryptoSentimentAgent: makeAgentMock('crypto-sentiment') }));
vi.mock('../../src/agents/cryptoOnChainAgent', () => ({ CryptoOnChainAgent: makeAgentMock('crypto-onchain') }));
vi.mock('../../src/agents/cryptoRiskAgent', () => ({ CryptoRiskAgent: makeAgentMock('crypto-risk') }));

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelectResult = { data: [] as any[], error: null as any };
let supabaseConfigured = true;

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: vi.fn(() => supabaseConfigured),
  getServerSupabase: vi.fn(() => ({
    from: (table: string) => {
      if (table !== 'agent_evaluation_runs') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
      return {
        insert: mockInsert,
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve(mockSelectResult),
          }),
        }),
      };
    },
  })),
}));

import { runAgentEvaluation, persistAgentEvaluationRun, getAgentEvaluationHistory } from '../../server/agentEvaluation';

const ALL_PROMPT_IDS = [
  'raw-materials-classification', 'raw-materials-fundamentals', 'raw-materials-risk', 'raw-materials-valuation',
  'crypto-classification', 'crypto-sentiment', 'crypto-onchain', 'crypto-risk',
];

describe('agentEvaluation', () => {
  beforeEach(() => {
    mockLedger.length = 0;
    mockGetUsageLedger.mockClear();
    mockInsert.mockClear();
    mockSelectResult.data = [];
    mockSelectResult.error = null;
    supabaseConfigured = true;
    for (const id of ALL_PROMPT_IDS) agentBehavior[id] = 'success';
  });

  describe('runAgentEvaluation', () => {
    it('markiert alle acht Agenten als erfolgreich, wenn jeder einen Ledger-Eintrag erzeugt', async () => {
      const results = await runAgentEvaluation(null);
      expect(results).toHaveLength(8);
      expect(results.every(r => r.succeeded)).toBe(true);
      expect(results.map(r => r.promptId).sort()).toEqual([...ALL_PROMPT_IDS].sort());
    });

    it('erkennt einen Fallback (kein Ledger-Eintrag) als nicht erfolgreich', async () => {
      agentBehavior['crypto-risk'] = 'fallback';
      const results = await runAgentEvaluation(null);
      const cryptoRisk = results.find(r => r.promptId === 'crypto-risk');
      expect(cryptoRisk?.succeeded).toBe(false);
      expect(results.filter(r => r.succeeded)).toHaveLength(7);
    });

    it('faengt eine durchgelassene Exception ab und wertet sie als Fallback, ohne den Lauf abzubrechen', async () => {
      agentBehavior['raw-materials-risk'] = 'throw';
      const results = await runAgentEvaluation(null);
      expect(results).toHaveLength(8);
      const riskResult = results.find(r => r.promptId === 'raw-materials-risk');
      expect(riskResult?.succeeded).toBe(false);
    });

    it('verwendet die realen Eval-Symbole Gold (Rohstoffe) und BTC (Krypto)', async () => {
      const results = await runAgentEvaluation(null);
      const raw = results.filter(r => r.promptId.startsWith('raw-materials-'));
      const crypto = results.filter(r => r.promptId.startsWith('crypto-'));
      expect(raw.every(r => r.evalInput === 'Gold')).toBe(true);
      expect(crypto.every(r => r.evalInput === 'BTC')).toBe(true);
    });
  });

  describe('persistAgentEvaluationRun', () => {
    it('schreibt alle Ergebnisse mit derselben run_id in die Tabelle', async () => {
      const results = await runAgentEvaluation(null);
      const { runId, persisted } = await persistAgentEvaluationRun(results);
      expect(persisted).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      const rows = mockInsert.mock.calls[0][0];
      expect(rows).toHaveLength(8);
      expect(rows.every((r: any) => r.run_id === runId)).toBe(true);
    });

    it('meldet persisted:false, wenn Supabase nicht konfiguriert ist, liefert aber trotzdem eine runId', async () => {
      supabaseConfigured = false;
      const { runId, persisted } = await persistAgentEvaluationRun([]);
      expect(persisted).toBe(false);
      expect(runId).toBeTruthy();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('faengt einen Schreibfehler ab und meldet persisted:false statt zu werfen', async () => {
      mockInsert.mockResolvedValueOnce({ error: { message: 'boom' } });
      const { persisted } = await persistAgentEvaluationRun([
        { promptId: 'crypto-risk', evalInput: 'BTC', succeeded: true, latencyMs: 10 },
      ]);
      expect(persisted).toBe(false);
    });
  });

  describe('getAgentEvaluationHistory', () => {
    it('liefert leere Historie ohne konfiguriertes Supabase', async () => {
      supabaseConfigured = false;
      const history = await getAgentEvaluationHistory();
      expect(history).toEqual({ latest: null, previous: null, regressions: [] });
    });

    it('erkennt eine Regression: Agent lieferte im vorherigen Lauf einen Erfolg, im aktuellen einen Fallback', async () => {
      mockSelectResult.data = [
        { run_id: 'run-2', prompt_id: 'crypto-risk', eval_input: 'BTC', succeeded: false, latency_ms: 5, evaluated_at: '2026-08-01T12:00:00Z' },
        { run_id: 'run-1', prompt_id: 'crypto-risk', eval_input: 'BTC', succeeded: true, latency_ms: 5, evaluated_at: '2026-07-31T12:00:00Z' },
      ];
      const history = await getAgentEvaluationHistory();
      expect(history.latest?.runId).toBe('run-2');
      expect(history.previous?.runId).toBe('run-1');
      expect(history.regressions).toEqual([
        { promptId: 'crypto-risk', previousSucceeded: true, latestSucceeded: false, regressed: true },
      ]);
    });

    it('meldet keine Regression, wenn der Agent in beiden Laeufen erfolgreich war', async () => {
      mockSelectResult.data = [
        { run_id: 'run-2', prompt_id: 'crypto-risk', eval_input: 'BTC', succeeded: true, latency_ms: 5, evaluated_at: '2026-08-01T12:00:00Z' },
        { run_id: 'run-1', prompt_id: 'crypto-risk', eval_input: 'BTC', succeeded: true, latency_ms: 5, evaluated_at: '2026-07-31T12:00:00Z' },
      ];
      const history = await getAgentEvaluationHistory();
      expect(history.regressions[0].regressed).toBe(false);
    });
  });
});
