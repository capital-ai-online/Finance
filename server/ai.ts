import express from 'express';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../src/platform/Security/types';
import { getUsageSummary, getUsageLedger, PROMPT_REGISTRY } from '../src/services/aiUsageTracker';
import { retrieveRelevantChunksWithEvidence, formatChunksForPrompt } from '../src/services/rag/retrieval';
import { generateTextWithFallback, type ChatTurn } from '../src/services/agentModelRouting';
import { getPromptGovernanceEntry, recordAiEvaluation, getAiGovernanceInventory, type AiProvider } from '../src/services/aiGovernance';
import { createAiContentTransparencyEnvelope } from '../src/services/aiContentTransparency';
import { getAnthropicInstance, isAnthropicConfigured } from './anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './openaiClient';
import { SupabaseAiGovernanceSink } from './aiGovernanceSupabaseSink';
import { entitlementsRouter } from './entitlements';
import { binanceLandingQuickAnalysisRouter } from './binanceLandingQuickAnalysis';

export const aiRouter = express.Router();
const aiGovernanceSink = new SupabaseAiGovernanceSink();

aiRouter.use('/entitlements', entitlementsRouter);
aiRouter.use('/landing', binanceLandingQuickAnalysisRouter);

function parseProviderAttribution(provider: string): { modelProvider: AiProvider; model: string } {
  if (provider.startsWith('anthropic:')) return { modelProvider: 'anthropic', model: provider.slice('anthropic:'.length) };
  return { modelProvider: 'openai', model: provider.replace(/^openai:/, '') };
}

aiRouter.post('/chat', orchestrator.handle('AI Chat'), async (req, res) => {
  const anthropic = isAnthropicConfigured() ? getAnthropicInstance() : null;
  const openai = isOpenAIConfigured() ? getOpenAIInstance() : null;
  if (!anthropic && !openai) {
    return res.status(503).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY oder OPENAI_API_KEY erforderlich).' });
  }

  try {
    const { message, history } = req.body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Eine nicht-leere Nachricht ist erforderlich.' });
    }
    const chatHistory: ChatTurn[] = Array.isArray(history)
      ? history.map((msg: any) => ({ role: msg.role === 'user' ? 'user' : 'assistant', text: String(msg.text ?? '') }))
      : [];

    const promptEntry = getPromptGovernanceEntry('chat-assistant');
    const retrieval = await retrieveRelevantChunksWithEvidence(message, {
      promptId: 'chat-assistant',
      promptVersion: promptEntry?.version,
      topK: 5,
      minScore: 0.5,
    });

    let systemInstruction = [
      'You are the CAPITAL-AI Assistant, a highly professional, technically precise expert partner in quantitative finance, Graham value investing, and market analysis.',
      'Prioritize clarity and evidence.',
      'Never invent sources, citations, prices, scores or regulatory claims.',
      'Separate source-backed facts from analysis and uncertainty.',
      'Retrieved context alone does not prove claim-level grounding or citation completeness.',
      'AI explanations have no financial decision, approval, ranking, eligibility, OrderIntent or execution authority.',
    ].join(' ');
    if (retrieval.chunks.length > 0) {
      systemInstruction += `\n\nNutze diese geprüften internen Quellen als Kontext. Zitiere nur Quellen, die die konkrete Aussage tatsächlich stützen; erfinde keine Referenzen:\n\n${formatChunksForPrompt(retrieval.chunks)}`;
    }

    const result = await generateTextWithFallback({
      anthropic,
      openai,
      promptId: 'chat-assistant',
      contents: message,
      history: chatHistory,
      systemInstruction,
      requestId: req.requestId,
    });

    if (!result) return res.status(503).json({ error: 'Alle konfigurierten KI-Provider sind derzeit nicht verfügbar.' });

    const attribution = parseProviderAttribution(result.provider);
    const evidenceIds = retrieval.evidence.evidence.map(item => item.evidenceId);
    const hasEvidence = evidenceIds.length > 0;
    const evaluation = recordAiEvaluation({
      promptId: 'chat-assistant',
      promptVersion: promptEntry?.version ?? 'unregistered',
      modelProvider: attribution.modelProvider,
      model: attribution.model,
      requestId: req.requestId,
      evidenceIds,
      checks: {},
      outcome: hasEvidence ? 'PASS' : 'WARN',
      notes: hasEvidence
        ? `RAG evidence quality: ${retrieval.evidence.evaluation.quality}. Retrieval availability is recorded; claim-level grounding and citation completeness are not independently verified.`
        : 'Keine Repository-Evidence verfügbar; claim-level grounding and citation completeness are not independently verified.',
    });
    const persistence = await aiGovernanceSink.write(evaluation);

    if (!persistence.persisted) {
      console.warn('[AI Governance] Durable evaluation evidence unavailable', {
        evaluationId: evaluation.evaluationId,
        sink: persistence.sink,
        reason: persistence.reason,
      });
    }

    const transparency = createAiContentTransparencyEnvelope({
      origin: 'ai-generated',
      provider: attribution.modelProvider,
      model: attribution.model,
      promptId: 'chat-assistant',
      promptVersion: promptEntry?.version ?? 'unregistered',
      requestId: req.requestId,
      retrievalId: retrieval.evidence.attribution.retrievalId,
      evidenceIds,
      grounding: 'not-verified',
      citationCompleteness: 'not-verified',
      humanReview: 'not-reviewed',
    });

    res.json({
      reply: result.text,
      governance: {
        evaluationId: evaluation.evaluationId,
        outcome: evaluation.outcome,
        evidenceQuality: retrieval.evidence.evaluation.quality,
        evidenceIds,
        retrievalId: retrieval.evidence.attribution.retrievalId,
        persistence: {
          durable: persistence.persisted,
          sink: persistence.sink,
          reason: persistence.persisted ? undefined : persistence.reason,
        },
      },
      transparency,
    });
  } catch (error: any) {
    console.log('[System Info] Chat finished with warning', error?.message || error);
    res.status(500).json({ error: 'Dienst vorübergehend nicht verfügbar.' });
  }
});

// Der frühere Gemini-spezifische Vision-Pfad wurde entfernt. Fail-closed verhindert,
// dass Uploads angenommen oder lokal gespeichert werden, solange kein geprüfter Ersatz existiert.
aiRouter.post('/analyze-image', (_req, res) => {
  res.status(410).json({
    error: 'IMAGE_ANALYSIS_UNAVAILABLE',
    reason: 'Der frühere Gemini-Vision-Provider wurde anwendungsweit entfernt.',
  });
});

aiRouter.get('/usage', async (req, res) => {
  const authz = await checkAdminAccess(req, 'ai:usage', ADMIN_ZONE_ROLES);
  if (!authz.authorized) return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  res.json({
    summary: getUsageSummary(),
    ledger: getUsageLedger(),
    promptRegistry: PROMPT_REGISTRY,
    governance: {
      ...getAiGovernanceInventory(),
      evaluationCache: {
        durable: false,
        type: 'process-memory',
        note: 'Recent evaluations are a bounded operational cache. Durable evidence uses the server-side append-only Supabase sink when available.',
      },
    },
  });
});