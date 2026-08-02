import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { resolveVerifiedIdentity, checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../src/platform/Security/types';
import { trackedGenerateContent, getUsageSummary, getUsageLedger, PROMPT_REGISTRY } from '../src/services/aiUsageTracker';
import { retrieveRelevantChunks, formatChunksForPrompt } from '../src/services/rag/retrieval';

export const aiRouter = express.Router();

// Audit ARCH-AUDIT-0002 (AUD2-F-016): zuvor ohne Groessenbegrenzung und ohne MIME-Pruefung -
// jeder beliebige Dateityp und jede Groesse konnte hochgeladen werden. 8 MB deckt uebliche
// Foto-/Screenshot-Groessen ab; die Gemini-Vision-API akzeptiert ohnehin nur Bildformate.
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

// Lazy-loaded Gemini Client instance (Complies with critical SDK lazy init and error prevention standards)
let aiClient: GoogleGenAI | null = null;

export function getGeminiInstance(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// 1. AI Chat Endpoint
aiRouter.post('/chat', orchestrator.handle('Gemini Chat'), async (req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(500).json({ error: 'Gemini API key is missing or invalid' });
  }
  try {
    const { message, history } = req.body;
    const ai = getGeminiInstance();
    
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    contents.push({ role: 'user', parts: [{ text: message }] });

    let systemInstruction = "You are the CAPITAL-AI Assistant, a highly professional, technically precise expert partner in quantitative finance, Graham value investing, and market analysis. Use a professional, accessible tone. Do not use unnecessary jargon. Prioritize clarity and data-driven insights. Remember the user is using CAPITAL-AI v0.5.5 Enterprise Architecture.";
    // ARCH-AUDIT-0002 (J4, Kapitel 14.6): erdet die Antwort in real indizierter interner
    // Dokumentation (docs/, .ai/skills/), statt sich ausschliesslich auf Modellwissen zu
    // verlassen. Ohne gebauten Index (npm run rag:build-index) oder ohne konfigurierten
    // Embedding-Provider liefert retrieveRelevantChunks() eine leere Liste - das Verhalten
    // bleibt dann exakt wie vor dieser Aenderung.
    const relevantChunks = await retrieveRelevantChunks(message);
    if (relevantChunks.length > 0) {
      systemInstruction += `\n\nNutze bei Bedarf die folgenden Ausschnitte aus der internen CAPITAL-AI-Dokumentation als zusaetzlichen Kontext. Zitiere die Quelle, wenn du daraus etwas uebernimmst. Wenn die Ausschnitte die Frage nicht betreffen, ignoriere sie:\n\n${formatChunksForPrompt(relevantChunks)}`;
    }

    const response = await trackedGenerateContent(ai, {
      model: 'gemini-3.1-pro-preview',
      contents,
      config: { systemInstruction }
    }, { promptId: 'chat-assistant', requestId: req.requestId });

    res.json({ reply: response.text });
  } catch (error: any) {
    const errMsg = error?.message || String(error || '');
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exhausted") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      console.log("[System Notice] Chat API: utilizing offline quantitative assistant fallback.");
      return res.json({
        reply: "Entschuldigung, der CAPITAL-AI-Dienst ist derzeit stark ausgelastet (Rate-Limit überschritten). Bitte versuchen Sie es in wenigen Augenblicken noch einmal. In der Zwischenzeit können Sie alle anderen quantitativen Analyse- und Backtesting-Tools vollumfänglich nutzen!"
      });
    }
    console.log("[System Info] Chat finished with warning");
    res.status(500).json({ error: "Dienst vorübergehend nicht verfügbar." });
  }
});

// 2. AI Image Analysis Endpoint
// Audit ARCH-AUDIT-0002 (AUD2-F-016): zuvor ohne jede Authentifizierung aufrufbar - jeder
// unangemeldete Client konnte beliebig oft die kostenpflichtige Gemini-Vision-API auslösen.
aiRouter.post(
  '/analyze-image',
  (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Datei-Upload fehlgeschlagen.' });
      }
      next();
    });
  },
  orchestrator.handle('Gemini Vision'),
  async (req, res) => {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
  }
  if (!isGeminiConfigured()) {
    return res.status(500).json({ error: 'Gemini API key is missing or invalid' });
  }
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { prompt } = req.body;
    const ai = getGeminiInstance();
    const base64Data = fs.readFileSync(file.path, { encoding: 'base64' });

    const response = await trackedGenerateContent(ai, {
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt || "Analyze this image from a financial perspective." },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.mimetype
              }
            }
          ]
        }
      ]
    }, { promptId: 'image-analysis', requestId: req.requestId });

    // Cleanup uploaded file asynchronously
    fs.unlink(file.path, () => {});

    res.json({ reply: response.text });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    const errMsg = error?.message || String(error || '');
    if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exhausted") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      console.log("[System Notice] Image analysis API: utilizing offline visual fallback.");
      return res.json({
        reply: "Entschuldigung, das KI-Bildanalyse-System ist derzeit stark ausgelastet (Rate-Limit überschritten). Bitte versuchen Sie es in Kürze erneut, sobald die Auslastung abgenommen hat."
      });
    }
    console.log("[System Info] Image analysis finished with warning");
    res.status(500).json({ error: "Dienst vorübergehend nicht verfügbar." });
  }
});

// 3. AI Usage Dashboard (Audit ARCH-AUDIT-0002, N2: Prompt-Registry und Token-/
// Kostenerfassung). Admin-only, analog zum Muster in src/platform/Compliance/router.ts.
aiRouter.get('/usage', async (req, res) => {
  const authz = await checkAdminAccess(req, 'ai:usage', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  res.json({
    summary: getUsageSummary(),
    ledger: getUsageLedger(),
    promptRegistry: PROMPT_REGISTRY,
  });
});
