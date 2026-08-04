import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { resolveVerifiedIdentity, checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../src/platform/Security/types';
import { trackedGenerateContent, getUsageSummary, getUsageLedger, PROMPT_REGISTRY } from '../src/services/aiUsageTracker';
import { retrieveRelevantChunksWithEvidence, formatChunksForPrompt } from '../src/services/rag/retrieval';
import { generateTextWithFallback, type ChatTurn } from '../src/services/agentModelRouting';
import { getPromptGovernanceEntry, recordAiEvaluation, getAiGovernanceInventory, type AiProvider } from '../src/services/aiGovernance';
import { getAnthropicInstance, isAnthropicConfigured } from './anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './openaiClient';
import { entitlementsRouter } from './entitlements';
import { binanceLandingQuickAnalysisRouter } from './binanceLandingQuickAnalysis';

export const aiRouter = express.Router();

// ADR-0034: aiRouter is mounted at /api in server.ts. Keep entitlement runtime logic in
// its own router while exposing the stable /api/entitlements/* contract without adding
// another top-level mount point to the monolithic server bootstrap.
aiRouter.use('/entitlements', entitlementsRouter);
// ADR-0038: public landing-page market intelligence stays inside the existing /api AI
// boundary while the Binance adapter remains isolated in its own server-side module.
aiRouter.use('/landing', binanceLandingQuickAnalysisRouter);

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif|heic|heif)$/i.test(file.mimetype)) {
      return cb(new Error('Nur Bilddateien (PNG, JPEG, WebP, GIF, HEIC) sind erlaubt.'));
    }
    cb(null, true);
  },
});

let aiClient: GoogleGenAI | null = null;

export function getGeminiInstance(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY environment variable is required');
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function parseProviderAttribution(provider: string): { modelProvider: AiProvider; model: string } {
  if (provider.startsWith('anthropic:')) return { modelProvider: 'anthropic', model: provider.slice('anthropic:'.length) };
  if (provider.startsWith('openai:')) return { modelProvider: 'openai', model: provider.slice('openai:'.length) };
  return { modelProvider: 'gemini', model: provider.replace(/^gemini:/, '') };
}

// AI Chat: provider fallback + repository RAG evidence + runtime evaluation governance.
aiRouter.post('/chat', orchestrator.handle('AI Chat'), async (req, res) => {
  const anthropic = isAnthropicConfigured() ? getAnthropicInstance() : null;
  const openai = isOpenAIConfigured() ? getOpenAIInstance() : null;
  const gemini = isGeminiConfigured() ? getGeminiInstance() : null;
  if (!anthropic && !openai && !gemini) {
    return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder GEMINI_API_KEY erforderlich).' });
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

    let systemInstruction = "You are the CAPITAL-AI Assistant, a highly professional, technically precise expert partner in quantitative finance, Graham value investing, and market analysis. Use a professional, accessible tone. Do not use unnecessary jargon. Prioritize clarity and data-driven insights.";
    if (retrieval.chunks.length > 0) {
      systemInstruction += `\n\nNutze bei Bedarf die folgenden Ausschnitte aus der internen CAPITAL-AI-Dokumentation als zusätzlichen Kontext. Zitiere die Quelle, wenn du daraus etwas übernimmst. Wenn die Ausschnitte die Frage nicht betreffen, ignoriere sie:\n\n${formatChunksForPrompt(retrieval.chunks)}`;
    }

    const result = await generateTextWithFallback({
      anthropic,
      openai,
      gemini,
      promptId: 'chat-assistant',
      contents: message,
      history: chatHistory,
      systemInstruction,
      geminiModels: ['gemini-3.1-pro-preview'],
      requestId: req.requestId,
    });

    if (!result) {
      console.log('[System Notice] Chat API: alle konfigurierten Provider fehlgeschlagen, nutze Offline-Fallback.');
      return res.json({
        reply: 'Entschuldigung, der CAPITAL-AI-Dienst ist derzeit stark ausgelastet. Bitte versuchen Sie es in wenigen Augenblicken noch einmal. In der Zwischenzeit können Sie alle anderen quantitativen Analyse- und Backtesting-Tools vollumfänglich nutzen!'
      });
    }

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
      checks: {
        grounded: hasEvidence,
      },
      outcome: hasEvidence ? 'PASS' : 'WARN',
      notes: hasEvidence
        ? `RAG evidence quality: ${retrieval.evidence.evaluation.quality}.`
        : 'Kein RAG-Evidence-Treffer verfügbar; Antwort wurde ohne Repository-Grounding erzeugt.',
    });

    res.json({
      reply: result.text,
      governance: {
        evaluationId: evaluation.evaluationId,
        outcome: evaluation.outcome,
        evidenceQuality: retrieval.evidence.evaluation.quality,
        evidenceIds,
        retrievalId: retrieval.evidence.attribution.retrievalId,
      },
    });
  } catch (error: any) {
    console.log('[System Info] Chat finished with warning', error?.message || error);
    res.status(500).json({ error: 'Dienst vorübergehend nicht verfügbar.' });
  }
});

// AI Image Analysis Endpoint. Gemini-specific vision path remains intentionally provider-bound.
aiRouter.post(
  '/analyze-image',
  (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message || 'Datei-Upload fehlgeschlagen.' });
      next();
    });
  },
  orchestrator.handle('Gemini Vision'),
  async (req, res) => {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
  if (!isGeminiConfigured()) return res.status(500).json({ error: 'Gemini API key is missing or invalid' });
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image provided' });

    const { prompt } = req.body;
    const ai = getGeminiInstance();
    const base64Data = fs.readFileSync(file.path, { encoding: 'base64' });

    const response = await trackedGenerateContent(ai, {
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || 'Analyze this image from a financial perspective.' },
            { inlineData: { data: base64Data, mimeType: file.mimetype } }
          ]
        }
      ]
    }, { promptId: 'image-analysis', requestId: req.requestId });

    fs.unlink(file.path, () => {});
    res.json({ reply: response.text });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    const errMsg = error?.message || String(error || '');
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      console.log('[System Notice] Image analysis API: utilizing offline visual fallback.');
      return res.json({ reply: 'Entschuldigung, das KI-Bildanalyse-System ist derzeit stark ausgelastet (Rate-Limit überschritten). Bitte versuchen Sie es in Kürze erneut, sobald die Auslastung abgenommen hat.' });
    }
    console.log('[System Info] Image analysis finished with warning');
    res.status(500).json({ error: 'Dienst vorübergehend nicht verfügbar.' });
  }
});

// Admin-only AI usage + governance inventory.
aiRouter.get('/usage', async (req, res) => {
  const authz = await checkAdminAccess(req, 'ai:usage', ADMIN_ZONE_ROLES);
  if (!authz.authorized) return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  res.json({
    summary: getUsageSummary(),
    ledger: getUsageLedger(),
    promptRegistry: PROMPT_REGISTRY,
    governance: getAiGovernanceInventory(),
  });
});