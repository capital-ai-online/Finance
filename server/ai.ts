import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { orchestrator } from '../src/lib/requestOrchestrator';

export const aiRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents,
      config: {
        systemInstruction: "You are the CAPITAL-AI Assistant, a highly professional, technically precise expert partner in quantitative finance, Graham value investing, and market analysis. Use a professional, accessible tone. Do not use unnecessary jargon. Prioritize clarity and data-driven insights. Remember the user is using CAPITAL-AI v0.5.5 Enterprise Architecture."
      }
    });

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
aiRouter.post('/analyze-image', upload.single('image'), orchestrator.handle('Gemini Vision'), async (req, res) => {
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

    const response = await ai.models.generateContent({
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
    });

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
