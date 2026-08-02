import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { logSystemEvent } from './systemEvents';
import { FileWatcher } from './fileWatcher';
import { decisionEngine } from './decisionEngine';
import { 
  sanitizeMarkdownContent, 
  sanitizeTextContent, 
  sanitizeJsonContent, 
  sanitizeAllDocs 
} from './documentSanitizer';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../src/platform/Security/types';
import { generateStructuredWithFallback, generateTextWithFallback } from '../src/services/agentModelRouting';
import { getAnthropicInstance, isAnthropicConfigured } from './anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from './openaiClient';
import { isGeminiConfigured } from './ai';
import { retrieveRelevantChunksWithEvidence, formatChunksForPrompt } from '../src/services/rag/retrieval';
import { getPromptGovernanceEntry, recordAiEvaluation, type AiProvider } from '../src/services/aiGovernance';

export const hygieneRouter = express.Router();

const DOCS_DIR = path.join(process.cwd(), 'docs');
const HISTORY_DIR = path.join(DOCS_DIR, '.history');
const HYGIENE_DB_FILE = path.join(process.cwd(), 'uploads', 'document_hygiene.json');

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Types & Interfaces
export type HygieneState =
  | 'IDLE'
  | 'PARSING'
  | 'CHECKING_DEPS'
  | 'WAITING_AI'
  | 'EXECUTING'
  | 'REVIEW_REQUIRED'
  | 'DONE';

export interface DependencyGraph {
  [filePath: string]: string[]; // files that the key file depends on
}

export interface ReviewTicket {
  id: string;
  filePath: string;
  timestamp: string;
  previousContent: string;
  proposedContent: string;
  diff: string;
  classification: string;
  confidence: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
}

export interface HygieneLogEntry {
  id: string;
  timestamp: string;
  filePath: string;
  eventType: 'add' | 'change' | 'unlink';
  classification: string;
  confidence: number;
  actionTaken: string;
  stateFlow: string[];
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'PAUSED';
  details: string;
}

export interface HygieneDatabase {
  state: HygieneState;
  logs: HygieneLogEntry[];
  tickets: ReviewTicket[];
}

// In-Memory State & Cache for active tracking
let currentState: HygieneState = 'IDLE';
let activeLogs: HygieneLogEntry[] = [];
let pendingTickets: ReviewTicket[] = [];
let fileWatchDebounceTimers: Record<string, NodeJS.Timeout> = {};

// Load database from file or initialize
function loadHygieneDb() {
  try {
    if (!fs.existsSync(path.dirname(HYGIENE_DB_FILE))) {
      fs.mkdirSync(path.dirname(HYGIENE_DB_FILE), { recursive: true });
    }
    if (fs.existsSync(HYGIENE_DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(HYGIENE_DB_FILE, 'utf8'));
      if (data.state) {
        decisionEngine.reset({ email: 'system', action: 'load' });
        decisionEngine.transitionTo(data.state, { email: 'system', action: 'load' });
        currentState = decisionEngine.getCurrentState();
      }
      activeLogs = data.logs || [];
      pendingTickets = data.tickets || [];
    } else {
      saveHygieneDb();
    }
  } catch (err) {
    console.error('Error loading hygiene db:', err);
  }
}

function saveHygieneDb() {
  try {
    const payload: HygieneDatabase = {
      state: decisionEngine.getCurrentState(),
      logs: activeLogs,
      tickets: pendingTickets,
    };
    fs.writeFileSync(HYGIENE_DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving hygiene db:', err);
  }
}

// Helper to transition state
function transitionTo(state: HygieneState, metadata?: Record<string, any>) {
  decisionEngine.transitionTo(state, metadata);
  currentState = decisionEngine.getCurrentState();
  saveHygieneDb();
}

// Compute line-by-line diff
export function computeDiff(oldText: string, newText: string): string {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  let diffText = '';

  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // unchanged line
      i++;
      j++;
    } else {
      // simple heuristics for additions/deletions
      if (i < oldLines.length && (j >= newLines.length || !newLines.slice(j, j + 5).includes(oldLines[i]))) {
        diffText += `- ${oldLines[i]}\n`;
        i++;
      } else if (j < newLines.length) {
        diffText += `+ ${newLines[j]}\n`;
        j++;
      }
    }
  }
  return diffText || 'No visible differences.';
}

// Parse dependencies using "@depends on <path>" syntax
export function buildDependencyGraph(): DependencyGraph {
  const graph: DependencyGraph = {};
  
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(DOCS_DIR, fullPath).replace(/\\/g, '/');

      // Skip history, reports, and dot files
      if (
        file.startsWith('.') ||
        relativePath.startsWith('.history') ||
        relativePath.startsWith('reports')
      ) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (['.md', '.json', '.txt'].includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const dependencies: string[] = [];
            // Regex to find "@depends on <path>"
            const regex = /@depends\s+on\s+([^\r\n\s]+)/gi;
            let match;
            while ((match = regex.exec(content)) !== null) {
              // Standardize path format
              const depPath = match[1].replace(/\\/g, '/').replace(/^\/+/, '');
              dependencies.push(depPath);
            }
            if (dependencies.length > 0) {
              graph[relativePath] = dependencies;
            }
          } catch (e) {
            console.error(`Error parsing file ${relativePath} for graph:`, e);
          }
        }
      }
    }
  }

  scanDir(DOCS_DIR);
  return graph;
}

// Trace reverse dependencies (files affected when the modified file changes)
export function getAffectedFiles(changedFile: string, graph: DependencyGraph): string[] {
  const affected: Set<string> = new Set();
  const queue: string[] = [changedFile.replace(/\\/g, '/')];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [file, deps] of Object.entries(graph)) {
      if (deps.some(d => d.toLowerCase() === current.toLowerCase())) {
        if (!affected.has(file)) {
          affected.add(file);
          queue.push(file);
        }
      }
    }
  }

  return Array.from(affected);
}

// Create file backup
export function backupFile(relativeFilePath: string): string | null {
  try {
    const srcPath = path.join(DOCS_DIR, relativeFilePath);
    if (!fs.existsSync(srcPath)) return null;

    if (!fs.existsSync(HISTORY_DIR)) {
      fs.mkdirSync(HISTORY_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = relativeFilePath.replace(/[\/\\]/g, '_');
    const backupName = `${timestamp}_${safeName}`;
    const backupPath = path.join(HISTORY_DIR, backupName);

    fs.copyFileSync(srcPath, backupPath);

    // Keep history trimmed to latest 100 entries, prune old ones
    const backups = fs.readdirSync(HISTORY_DIR).sort((a, b) => {
      return fs.statSync(path.join(HISTORY_DIR, b)).mtimeMs - fs.statSync(path.join(HISTORY_DIR, a)).mtimeMs;
    });
    if (backups.length > 100) {
      for (let i = 100; i < backups.length; i++) {
        try {
          fs.unlinkSync(path.join(HISTORY_DIR, backups[i]));
        } catch (e) {}
      }
    }

    return backupName;
  } catch (err) {
    console.error('Error backing up file:', err);
    return null;
  }
}

// Ensure the required Capital-AI Documentary branding signature is embedded in documents
export function ensureBrandingInContent(filePath: string, content: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.md') {
    return sanitizeMarkdownContent(content);
  }
  if (ext === '.json') {
    return sanitizeJsonContent(content);
  }
  if (ext === '.txt') {
    return sanitizeTextContent(content);
  }
  
  return content;
}

// Traverse docs directory recursively to apply branding to all documents on boot
export function applyBrandingToAllDocs(dir: string = DOCS_DIR) {
  const stats = sanitizeAllDocs(dir);
  console.log(`[DocumentHygiene] Capital-AI Documentary swept ${stats.total} files, updated/branded ${stats.modified} files.`);
}

// ARCH-AUDIT-0002 (J3-Folge/J4, Kapitel 14.6): Nutzerentscheidung - dieselbe Anthropic ->
// OpenAI -> Gemini-Kette wie bei den Scoring-Agenten, statt Gemini direkt anzusprechen. Kein
// Gemini-spezifisches Feature haengt an dieser Klassifikation. Zusaetzlich (J4, zweiter echter
// RAG-Verbraucher neben dem Chat-Assistenten): die Regel "conflict_candidate bei Widerspruch zu
// Standardvorgaben wie DSGVO/OWASP" konnte das Modell bisher nur aus Trainingswissen einschaetzen
// - es hatte keinen Zugriff auf die tatsaechlichen internen Richtliniendokumente
// (docs/DATENSCHUTZ_PROTOKOLL.md, docs/compliance/, ESS-0001-CONTRACTS). retrieveRelevantChunks()
// liefert jetzt die dazu passenden Ausschnitte als Kontext, wenn ein RAG-Index existiert -
// andernfalls bleibt das Verhalten unveraendert (leere Liste, kein zusaetzlicher Kontext).
async function analyzeChangeWithAI(
  filePath: string,
  oldContent: string,
  newContent: string,
  diff: string
): Promise<{
  classification: 'typo' | 'content_update' | 'structural_change' | 'new_section' | 'conflict_candidate';
  confidence: number;
  reason: string;
  suggestedAction: 'auto_override' | 'propagate_dependencies' | 'manual_review';
}> {
  try {
    const systemInstruction = `Du bist der "Capital-AI Documentary" Service (der autonome KI-Dokumenten-Hygieniker von Gründer Sven Kulessa, sven.kulessa@capital-ai.online). Deine Aufgabe ist es, Änderungen in einem Dokument zu analysieren, semantisch einzuordnen und festzulegen, ob diese Änderung automatisch durchgeführt werden kann oder ein Review erfordert. Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`;

    const promptEntry = getPromptGovernanceEntry('document-hygiene-change-classification');
    const retrieval = await retrieveRelevantChunksWithEvidence(`${filePath}\n${diff.slice(0, 1000)}`, {
      promptId: 'document-hygiene-change-classification',
      promptVersion: promptEntry?.version,
      topK: 5,
      minScore: 0.5,
    });
    const relevantChunks = retrieval.chunks;
    const ragContext = relevantChunks.length > 0
      ? `\n\n--- RELEVANTE INTERNE RICHTLINIEN (zur Einordnung von "conflict_candidate") ---\n${formatChunksForPrompt(relevantChunks)}`
      : '';

    const contents = `Hier sind die Details zur Datei:
Pfad: ${filePath}

--- ALTE VERSION ---
${oldContent.slice(0, 4000)}
${oldContent.length > 4000 ? '... [trunkiert]' : ''}

--- NEUE VERSION ---
${newContent.slice(0, 4000)}
${newContent.length > 4000 ? '... [trunkiert]' : ''}

--- EFFEKTIVER DIFF ---
${diff.slice(0, 2000)}
${ragContext}

Analysiere die Änderungen semantisch und liefere eine JSON-Antwort mit exakt folgenden Feldern:
1. "classification": Eines von "typo", "content_update", "structural_change", "new_section", "conflict_candidate".
   - "typo": Für reine Rechtschreibfehler, Zeichensetzung oder kleine optische Korrekturen.
   - "content_update": Inhaltliche Ergänzungen oder Updates, die sachlich korrekt sind.
   - "structural_change": Große Umstrukturierungen oder fundamentale Textverschiebungen.
   - "new_section": Das Hinzufügen einer komplett neuen Sektion.
   - "conflict_candidate": Wenn Widersprüche zu Standardvorgaben (z.B. DSGVO, OWASP, strict TS-Regeln) oder logische Konflikte entstehen könnten. Nutze dafür, wenn vorhanden, die oben aufgeführten internen Richtlinien-Ausschnitte statt allgemeinen Modellwissens.
2. "confidence": Ein numerischer Wert zwischen 0.0 und 1.0, der angibt, wie sicher du dir bei der Einordnung bist.
3. "reason": Eine prägnante, deutschsprachige Erklärung für deine Entscheidung.
4. "suggestedAction": Eines von "auto_override", "propagate_dependencies", "manual_review".
   - Nutze "auto_override" NUR bei sehr hohem Vertrauen (> 0.85) für "typo" oder unkritische Updates.
   - Nutze "propagate_dependencies" wenn die Änderung andere Dokumente beeinflussen könnte (die davon abhängen).
   - Nutze "manual_review" wenn Risiken, Widersprüche oder unklare Sachverhalte vorliegen.`;

    const result = await generateStructuredWithFallback({
      anthropic: isAnthropicConfigured() ? getAnthropicInstance() : null,
      openai: isOpenAIConfigured() ? getOpenAIInstance() : null,
      gemini: isGeminiConfigured() ? ai : null,
      promptId: 'document-hygiene-change-classification',
      contents,
      systemInstruction,
      geminiModels: ['gemini-3.5-flash'],
      schema: {
        type: Type.OBJECT,
        properties: {
          classification: {
            type: Type.STRING,
            description: 'Einordnung der Änderung',
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Konfidenz-Score (0-1)',
          },
          reason: {
            type: Type.STRING,
            description: 'Präzise Begründung der Analyse auf Deutsch',
          },
          suggestedAction: {
            type: Type.STRING,
            description: 'Empfohlene Aktion für den State-Flow',
          },
        },
        required: ['classification', 'confidence', 'reason', 'suggestedAction'],
      },
    });

    if (!result) {
      throw new Error('Kein KI-Provider konfiguriert oder alle konfigurierten Provider fehlgeschlagen.');
    }

    const parsed = result.data;
    const modelProvider: AiProvider = result.provider.startsWith('anthropic:')
      ? 'anthropic'
      : result.provider.startsWith('openai:')
        ? 'openai'
        : 'gemini';
    const model = result.provider.includes(':') ? result.provider.split(':').slice(1).join(':') : result.provider;
    const evidenceIds = retrieval.evidence.evidence.map(item => item.evidenceId);
    recordAiEvaluation({
      promptId: 'document-hygiene-change-classification',
      promptVersion: promptEntry?.version ?? 'unregistered',
      modelProvider,
      model,
      evidenceIds,
      checks: { schemaValid: true, grounded: evidenceIds.length > 0 },
      outcome: evidenceIds.length > 0 ? 'PASS' : 'WARN',
      notes: evidenceIds.length > 0
        ? `Documentary RAG evidence quality: ${retrieval.evidence.evaluation.quality}.`
        : 'Dokumenten-Hygiene-Klassifikation ohne Repository-RAG-Evidence; manuelle Review-Regeln bleiben maßgeblich.',
    });
    return {
      classification: parsed.classification || 'content_update',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      reason: parsed.reason || 'Keine detaillierte Begründung geliefert.',
      suggestedAction: parsed.suggestedAction || 'manual_review',
    };
  } catch (err: any) {
    console.error('KI-Analyse fehlgeschlagen:', err);
    return {
      classification: 'conflict_candidate',
      confidence: 0.0,
      reason: `KI-Analyse fehlgeschlagen: ${err.message || err}. Fallback auf manuelles Review.`,
      suggestedAction: 'manual_review',
    };
  }
}

// ARCH-AUDIT-0002 (J3-Folge/J4, Kapitel 14.6): dieselbe Anthropic -> OpenAI -> Gemini-Kette wie
// analyzeChangeWithAI() oben. maxTokens ist hier bewusst hoeher als der Chat-Default (8192 statt
// 2048) - die Antwort ist der VOLLSTAENDIGE neue Dokumentinhalt, nicht eine kurze Chat-Antwort;
// mit dem Default waeren laengere Dokumente bei Anthropic/OpenAI abgeschnitten worden (Gemini
// war davon nicht betroffen, da dort ohnehin kein explizites Limit gesetzt wird).
async function generatePropagatedContent(
  dependentFilePath: string,
  dependentContent: string,
  sourceFilePath: string,
  sourceDiff: string
): Promise<string> {
  try {
    const systemInstruction = `Du bist der "Capital-AI Documentary" Service (die autonome Dokumenten-Synchronisations-Engine von Gründer Sven Kulessa, sven.kulessa@capital-ai.online).
Ein übergeordnetes Dokument, von dem dieses Dokument abhängt, wurde geändert. Du musst diese Änderungen nun semantisch auf das abhängige Dokument übertragen, um Konsistenz zu wahren. Gib ausschließlich den reinen, aktualisierten Dokumenteninhalt zurück (kein Markdown-Wrapping mit \`\`\`md oder Erklärungen).`;

    const contents = `Abhängiges Dokument: ${dependentFilePath}
Quelle des Updates: ${sourceFilePath}

--- EFFEKTIVE ÄNDERUNGEN IN DER QUELLE ---
${sourceDiff}

--- AKTUELLER INHALT DES ABHÄNGIGEN DOKUMENTS ---
${dependentContent}

Bitte generiere den VOLLSTÄNDIGEN neuen Inhalt für das abhängige Dokument (${dependentFilePath}), der die oben stehenden Änderungen perfekt und fehlerfrei integriert. Behalte das ursprüngliche Format, Struktur und Metadaten (wie @depends on ...) bei.`;

    const result = await generateTextWithFallback({
      anthropic: isAnthropicConfigured() ? getAnthropicInstance() : null,
      openai: isOpenAIConfigured() ? getOpenAIInstance() : null,
      gemini: isGeminiConfigured() ? ai : null,
      promptId: 'document-hygiene-propagation',
      contents,
      systemInstruction,
      geminiModels: ['gemini-3.5-flash'],
      maxTokens: 8192,
    });

    if (!result) {
      console.error(`Kein KI-Provider verfuegbar fuer Propagation nach ${dependentFilePath}`);
      return dependentContent;
    }

    let text = result.text;
    // Strip potential markdown blocks if AI ignored instructions
    if (text.startsWith('```')) {
      const lines = text.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines[lines.length - 1].startsWith('```')) lines.pop();
      text = lines.join('\n');
    }
    const finalContent = text.trim();
    return ensureBrandingInContent(dependentFilePath, finalContent);
  } catch (err) {
    console.error(`Failed to propagate change to ${dependentFilePath}:`, err);
    return dependentContent; // Fallback to unchanged
  }
}

// Process single file event detected by Watcher
export async function processFileEvent(
  eventType: 'add' | 'change' | 'unlink',
  relativePath: string,
  userEmail: string = 'Autonomer File Watcher'
) {
  const normPath = relativePath.replace(/\\/g, '/');
  
  const logEntry: HygieneLogEntry = {
    id: 'hlog_' + Math.random().toString(36).substring(2, 12),
    timestamp: new Date().toISOString(),
    filePath: normPath,
    eventType,
    classification: 'parsing',
    confidence: 1.0,
    actionTaken: 'scanning',
    stateFlow: ['IDLE'],
    status: 'SUCCESS',
    details: `Sitzung gestartet für Event '${eventType}' auf '${normPath}'.`,
  };

  try {
    transitionTo('PARSING', { email: userEmail, filePath: normPath });
    logEntry.stateFlow.push('PARSING');

    if (eventType === 'unlink') {
      logEntry.classification = 'structural_change';
      logEntry.actionTaken = 'manual_review_required';
      logEntry.status = 'WARNING';
      logEntry.details = `Datei '${normPath}' wurde gelöscht. Dies erfordert ein manuelles Review der Abhängigkeiten.`;
      activeLogs.unshift(logEntry);
      
      logSystemEvent(
        'SECURITY',
        'Document Deleted',
        userEmail,
        `Document ${normPath} was deleted. Flagged for review.`,
        'WARNING'
      );
      transitionTo('REVIEW_REQUIRED', { email: userEmail, filePath: normPath });
      saveHygieneDb();
      return;
    }

    const fullPath = path.join(DOCS_DIR, normPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Datei existiert nicht: ${fullPath}`);
    }

    let newContent = fs.readFileSync(fullPath, 'utf8');
    const brandedContent = ensureBrandingInContent(normPath, newContent);
    if (brandedContent !== newContent) {
      fs.writeFileSync(fullPath, brandedContent, 'utf8');
      newContent = brandedContent;
    }

    // Retrieve previous version from history if exists, or treat as empty
    let oldContent = '';
    const safeName = normPath.replace(/[\/\\]/g, '_');
    if (fs.existsSync(HISTORY_DIR)) {
      const matchingBackups = fs.readdirSync(HISTORY_DIR)
        .filter(f => f.endsWith(safeName))
        .sort((a, b) => fs.statSync(path.join(HISTORY_DIR, b)).mtimeMs - fs.statSync(path.join(HISTORY_DIR, a)).mtimeMs);
      
      if (matchingBackups.length > 0) {
        oldContent = fs.readFileSync(path.join(HISTORY_DIR, matchingBackups[0]), 'utf8');
      }
    }

    const diff = computeDiff(oldContent, newContent);

    // If no changes, complete immediately
    if (!diff || diff === 'No visible differences.') {
      logEntry.actionTaken = 'no_action';
      logEntry.details = 'Keine inhaltlichen Änderungen festgestellt.';
      logEntry.stateFlow.push('DONE');
      activeLogs.unshift(logEntry);
      transitionTo('IDLE', { email: userEmail, filePath: normPath });
      saveHygieneDb();
      return;
    }

    // Step 2: CHECKING_DEPS
    transitionTo('CHECKING_DEPS', { email: userEmail, filePath: normPath });
    logEntry.stateFlow.push('CHECKING_DEPS');
    const graph = buildDependencyGraph();
    const affected = getAffectedFiles(normPath, graph);

    // Step 3: WAITING_AI
    transitionTo('WAITING_AI', { email: userEmail, filePath: normPath });
    logEntry.stateFlow.push('WAITING_AI');
    
    const analysis = await analyzeChangeWithAI(normPath, oldContent, newContent, diff);
    logEntry.classification = analysis.classification;
    logEntry.confidence = analysis.confidence;

    // Step 4: EXECUTING decision flow
    transitionTo('EXECUTING', { email: userEmail, filePath: normPath });
    logEntry.stateFlow.push('EXECUTING');

    // Rule FA-11: auto_override applies only when confidence > 0.85 and action is auto_override
    if (analysis.suggestedAction === 'auto_override' && analysis.confidence >= 0.85) {
      backupFile(normPath);
      logEntry.actionTaken = 'auto_override';
      logEntry.details = `Automatische Freigabe erteilt. Begründung: ${analysis.reason}`;
      logEntry.stateFlow.push('DONE');
      activeLogs.unshift(logEntry);

      logSystemEvent(
        'ORCHESTRATOR',
        'Auto Override Approved',
        userEmail,
        `Autonomously applied changes to ${normPath} (Confidence: ${analysis.confidence})`,
        'SUCCESS'
      );
      transitionTo('IDLE', { email: userEmail, filePath: normPath });
    } 
    else if (analysis.suggestedAction === 'propagate_dependencies' && analysis.confidence >= 0.85 && affected.length > 0) {
      // Automatic dependency propagation
      backupFile(normPath);
      logEntry.actionTaken = 'propagate_dependencies';
      logEntry.details = `Änderung automatisch freigegeben und wird auf ${affected.length} abhängige Dokumente übertragen. Begründung: ${analysis.reason}`;
      
      const propagationList: string[] = [];
      for (const depFile of affected) {
        const depFullPath = path.join(DOCS_DIR, depFile);
        if (fs.existsSync(depFullPath)) {
          const currentDepContent = fs.readFileSync(depFullPath, 'utf8');
          const updatedDepContent = await generatePropagatedContent(
            depFile,
            currentDepContent,
            normPath,
            diff
          );
          if (updatedDepContent && updatedDepContent !== currentDepContent) {
            backupFile(depFile);
            fs.writeFileSync(depFullPath, updatedDepContent, 'utf8');
            propagationList.push(depFile);
          }
        }
      }

      logEntry.details += ` Übertragene Dateien: [${propagationList.join(', ')}]`;
      logEntry.stateFlow.push('DONE');
      activeLogs.unshift(logEntry);

      logSystemEvent(
        'ORCHESTRATOR',
        'Auto Propagation Complete',
        userEmail,
        `Propagated changes from ${normPath} to: ${propagationList.join(', ')}`,
        'SUCCESS'
      );
      transitionTo('IDLE', { email: userEmail, filePath: normPath });
    }
    else {
      // Rule FA-13: manual_review triggered
      logEntry.actionTaken = 'flagged_for_review';
      logEntry.status = 'PAUSED';
      logEntry.details = `Review erforderlich. Grund: ${analysis.reason} (Action: ${analysis.suggestedAction}, Konfidenz: ${analysis.confidence})`;
      logEntry.stateFlow.push('REVIEW_REQUIRED');
      activeLogs.unshift(logEntry);

      const ticket: ReviewTicket = {
        id: 'ticket_' + Math.random().toString(36).substring(2, 12),
        filePath: normPath,
        timestamp: new Date().toISOString(),
        previousContent: oldContent,
        proposedContent: newContent,
        diff,
        classification: analysis.classification,
        confidence: analysis.confidence,
        reason: analysis.reason,
        status: 'PENDING',
      };
      
      // If a pending ticket already exists for this file, overwrite or replace it to avoid clutter
      pendingTickets = pendingTickets.filter(t => t.filePath !== normPath);
      pendingTickets.unshift(ticket);

      logSystemEvent(
        'SECURITY',
        'Review Ticket Created',
        userEmail,
        `Document ${normPath} flagged for review. Decision chain paused. Reason: ${analysis.reason}`,
        'WARNING'
      );
      transitionTo('REVIEW_REQUIRED', { email: userEmail, filePath: normPath });
    }

    saveHygieneDb();
  } catch (err: any) {
    console.error('Error during document hygiene pipeline:', err);
    logEntry.status = 'FAILED';
    logEntry.details = `Pipeline-Absturz: ${err.message || err}`;
    logEntry.stateFlow.push('IDLE');
    activeLogs.unshift(logEntry);
    transitionTo('IDLE', { email: userEmail, filePath: normPath });
    saveHygieneDb();
  }
}

// ----------------- ADMIN API ROUTES -----------------

export function getHygieneStatusData() {
  loadHygieneDb();
  return {
    state: currentState,
    logs: activeLogs,
    tickets: pendingTickets,
  };
}

// Restrict routes to IAM-verified administrators/owners (ADR-0003.5/0008)
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authz = await checkAdminAccess(req, 'document-hygiene', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }
  next();
}

// 1. GET status, graph, logs, and tickets
hygieneRouter.get('/status', requireAdmin, (req, res) => {
  loadHygieneDb();
  const graph = buildDependencyGraph();
  res.json({
    state: currentState,
    logs: activeLogs,
    tickets: pendingTickets,
    dependencyGraph: graph,
  });
});

// 2. POST review decision (Approve/Decline)
hygieneRouter.post('/review', requireAdmin, async (req, res) => {
  const { ticketId, decision, email } = req.body;
  if (!ticketId || !decision) {
    return res.status(400).json({ error: 'ticketId and decision are required.' });
  }

  loadHygieneDb();
  const ticketIndex = pendingTickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Review-Ticket nicht gefunden.' });
  }

  const ticket = pendingTickets[ticketIndex];
  
  try {
    transitionTo('EXECUTING', { email, filePath: ticket.filePath });
    
    if (decision === 'approve') {
      ticket.status = 'APPROVED';
      backupFile(ticket.filePath);
      
      // Write proposed content
      const fullPath = path.join(DOCS_DIR, ticket.filePath);
      const brandedProposedContent = ensureBrandingInContent(ticket.filePath, ticket.proposedContent);
      fs.writeFileSync(fullPath, brandedProposedContent, 'utf8');

      // Check if we need to propagate dependencies
      const graph = buildDependencyGraph();
      const affected = getAffectedFiles(ticket.filePath, graph);
      const propagatedFiles: string[] = [];

      for (const depFile of affected) {
        const depFullPath = path.join(DOCS_DIR, depFile);
        if (fs.existsSync(depFullPath)) {
          const currentDepContent = fs.readFileSync(depFullPath, 'utf8');
          const updatedDepContent = await generatePropagatedContent(
            depFile,
            currentDepContent,
            ticket.filePath,
            ticket.diff
          );
          if (updatedDepContent && updatedDepContent !== currentDepContent) {
            backupFile(depFile);
            fs.writeFileSync(depFullPath, updatedDepContent, 'utf8');
            propagatedFiles.push(depFile);
          }
        }
      }

      logSystemEvent(
        'ORCHESTRATOR',
        'Review Ticket Approved',
        email,
        `Admin manually approved changes to ${ticket.filePath}. Propagated to: ${propagatedFiles.join(', ') || 'none'}`,
        'SUCCESS'
      );

      // Add success log entry
      activeLogs.unshift({
        id: 'hlog_' + Math.random().toString(36).substring(2, 12),
        timestamp: new Date().toISOString(),
        filePath: ticket.filePath,
        eventType: 'change',
        classification: ticket.classification,
        confidence: ticket.confidence,
        actionTaken: 'manual_approve',
        stateFlow: ['REVIEW_REQUIRED', 'EXECUTING', 'DONE'],
        status: 'SUCCESS',
        details: `Ticket manuell freigegeben durch ${email}. Ähnliche Updates übertragen auf: [${propagatedFiles.join(', ')}]`,
      });

    } else {
      ticket.status = 'DECLINED';
      
      // Revert the file back to old content
      const fullPath = path.join(DOCS_DIR, ticket.filePath);
      if (ticket.previousContent) {
        fs.writeFileSync(fullPath, ticket.previousContent, 'utf8');
      } else {
        // If it was newly added, remove it
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      logSystemEvent(
        'SECURITY',
        'Review Ticket Declined',
        email,
        `Admin declined changes to ${ticket.filePath}. Rolled back or deleted.`,
        'WARNING'
      );

      activeLogs.unshift({
        id: 'hlog_' + Math.random().toString(36).substring(2, 12),
        timestamp: new Date().toISOString(),
        filePath: ticket.filePath,
        eventType: 'change',
        classification: ticket.classification,
        confidence: ticket.confidence,
        actionTaken: 'manual_decline',
        stateFlow: ['REVIEW_REQUIRED', 'EXECUTING', 'DONE'],
        status: 'WARNING',
        details: `Ticket abgelehnt durch ${email}. Änderungen wurden verworfen oder zurückgerollt.`,
      });
    }

    // Remove from pending
    pendingTickets.splice(ticketIndex, 1);
    transitionTo(pendingTickets.length > 0 ? 'REVIEW_REQUIRED' : 'IDLE', { email, filePath: ticket.filePath });
    saveHygieneDb();

    res.json({ success: true, tickets: pendingTickets, logs: activeLogs });
  } catch (err: any) {
    console.error('Error handling review decision:', err);
    transitionTo('REVIEW_REQUIRED', { email, filePath: ticket.filePath });
    res.status(500).json({ error: `Fehler bei der Freigabe: ${err.message || err}` });
  }
});

// 3. POST Manual Rollback
hygieneRouter.post('/rollback', requireAdmin, (req, res) => {
  const { filePath, backupName, email } = req.body;
  if (!filePath || !backupName) {
    return res.status(400).json({ error: 'filePath and backupName are required.' });
  }

  const backupPath = path.join(HISTORY_DIR, backupName);
  const targetPath = path.join(DOCS_DIR, filePath);

  try {
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: `Backup-Version '${backupName}' wurde nicht gefunden.` });
    }

    // Backup current state first
    backupFile(filePath);

    // Restore backup
    fs.copyFileSync(backupPath, targetPath);

    logSystemEvent(
      'SECURITY',
      'Document Rollback',
      email,
      `Rolled back ${filePath} to version ${backupName}`,
      'SUCCESS'
    );

    activeLogs.unshift({
      id: 'hlog_' + Math.random().toString(36).substring(2, 12),
      timestamp: new Date().toISOString(),
      filePath,
      eventType: 'change',
      classification: 'structural_change',
      confidence: 1.0,
      actionTaken: 'manual_rollback',
      stateFlow: ['IDLE', 'EXECUTING', 'DONE'],
      status: 'SUCCESS',
      details: `Manuelle Wiederherstellung durchgeführt von ${email} auf Stand ${backupName}.`,
    });

    saveHygieneDb();
    res.json({ success: true, logs: activeLogs });
  } catch (err: any) {
    res.status(500).json({ error: `Rollback fehlgeschlagen: ${err.message || err}` });
  }
});

// 4. GET list of history/backup files
hygieneRouter.get('/history-files', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(HISTORY_DIR)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(HISTORY_DIR)
      .map(file => {
        const filePath = path.join(HISTORY_DIR, file);
        const stat = fs.statSync(filePath);
        return {
          name: file,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Abrufen der Backup-Dateien: ${err.message || err}` });
  }
});

// Helper to gather all documents and code files for scanning, excluding build artifacts
function getFilesToScan(): { fullPath: string; relPath: string; category: 'docs' | 'code' }[] {
  const result: { fullPath: string; relPath: string; category: 'docs' | 'code' }[] = [];

  function walk(dir: string, category: 'docs' | 'code') {
    if (!fs.existsSync(dir)) return;
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
      const rel = path.relative(process.cwd(), dir).replace(/\\/g, '/');
      result.push({ fullPath: dir, relPath: rel, category });
      return;
    }

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');

      // Exclude build artifacts, histories, uploads, and system directories
      if (
        file.startsWith('.') ||
        file === 'node_modules' ||
        file === 'dist' ||
        file === 'uploads' ||
        rel.includes('.history') ||
        rel.includes('reports')
      ) {
        continue;
      }

      const fstat = fs.statSync(full);
      if (fstat.isDirectory()) {
        walk(full, category);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (category === 'docs' && ['.md', '.json', '.txt'].includes(ext)) {
          result.push({ fullPath: full, relPath: rel, category });
        } else if (category === 'code' && ['.ts', '.tsx'].includes(ext)) {
          result.push({ fullPath: full, relPath: rel, category });
        }
      }
    }
  }

  // Gather documents recursively
  walk(DOCS_DIR, 'docs');

  // Gather key full-stack code files
  const serverTs = path.join(process.cwd(), 'server.ts');
  if (fs.existsSync(serverTs)) {
    result.push({ fullPath: serverTs, relPath: 'server.ts', category: 'code' });
  }
  const appTsx = path.join(process.cwd(), 'src', 'App.tsx');
  if (fs.existsSync(appTsx)) {
    result.push({ fullPath: appTsx, relPath: 'src/App.tsx', category: 'code' });
  }
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  if (fs.existsSync(componentsDir)) {
    walk(componentsDir, 'code');
  }

  return result;
}

// 4.5. GET /lint - scan workspace files for insecure patterns and documentary non-compliances
hygieneRouter.get('/lint', requireAdmin, (req, res) => {
  try {
    const files = getFilesToScan();
    const diagnostics: any[] = [];

    for (const target of files) {
      try {
        const content = fs.readFileSync(target.fullPath, 'utf8');
        const lines = content.split('\n');
        const ext = path.extname(target.fullPath).toLowerCase();

        // 1. File-level check: DOC-03 (Missing Authenticity / Branding)
        if (target.category === 'docs') {
          if (ext === '.md') {
            const hasEmblem = content.includes('⊞ CAPITAL-AI CORE') || content.includes('⊞ Capital-AI');
            const hasSven = content.includes('Sven Kulessa');
            if (!hasEmblem || !hasSven) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: 1,
                severity: 'warning',
                ruleId: 'DOC-03',
                ruleName: 'Fehlende Authentizität',
                message: 'Dem Dokument fehlt das standardisierte Echtheits-Emblem `⊞ CAPITAL-AI CORE` oder der Inhabernachweis für Gründer Sven Kulessa.',
                evidence: lines[0] || '',
                suggestion: 'Klicken Sie auf "Auto-Fix", um den standardisierten, revisionssicheren Header hinzuzufügen.',
                autoFixable: true
              });
            }
          } else if (ext === '.txt') {
            const hasEmblem = content.includes('⊞ CAPITAL-AI CORE');
            if (!hasEmblem) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: 1,
                severity: 'warning',
                ruleId: 'DOC-03',
                ruleName: 'Fehlende Authentizität',
                message: 'Diesem Klartext-Dokument fehlt das Echtheits-Emblem `⊞ CAPITAL-AI CORE`.',
                evidence: lines[0] || '',
                suggestion: 'Klicken Sie auf "Auto-Fix", um den Plain-Text-Branding-Header einzufügen.',
                autoFixable: true
              });
            }
          } else if (ext === '.json') {
            const hasMeta = content.includes('documentaryMetadata');
            if (!hasMeta) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: 1,
                severity: 'warning',
                ruleId: 'DOC-03',
                ruleName: 'Fehlende Authentizität',
                message: 'Diesem JSON-Dokument fehlt das Feld `documentaryMetadata`.',
                evidence: lines[0] || '',
                suggestion: 'Klicken Sie auf "Auto-Fix", um die genormten System-Metadaten einzufügen.',
                autoFixable: true
              });
            }
          }
        }

        // 2. Line-by-line checks
        for (let idx = 0; idx < lines.length; idx++) {
          const line = lines[idx];
          const lineNum = idx + 1;

          // SEC-01: API Key / Secret leak
          const hasSk = /sk_(test|live)_[a-zA-Z0-9]{20,}/.test(line);
          const hasCmc = /CMC_PRO_API_KEY\s*[:=]\s*['"`][a-zA-Z0-9-]{10,}/i.test(line);
          const hasHardcodedKey = /api[-_]?key\s*[:=]\s*['"`][a-zA-Z0-9-_]{20,}/i.test(line);
          
          if (hasSk || hasCmc || hasHardcodedKey) {
            diagnostics.push({
              id: `diag_${Math.random().toString(36).substring(2, 12)}`,
              filePath: target.relPath,
              line: lineNum,
              severity: 'error',
              ruleId: 'SEC-01',
              ruleName: 'Möglicher API-Key Leak',
              message: 'Ein hartkodierter API-Schlüssel oder Secret-Token wurde in dieser Zeile entdeckt.',
              evidence: line.trim().substring(0, 80),
              suggestion: 'Nutzen Sie Umgebungsvariablen über process.env und definieren Sie diese in der .env.example-Vorlage.',
              autoFixable: false
            });
          }

          // SEC-02: window.alert() or direct alert usage
          if (target.category === 'code') {
            const hasAlert = /window\.alert\s*\(/.test(line) || /\balert\s*\(['"`][^'"`]+['"`]\)/.test(line);
            if (hasAlert) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: lineNum,
                severity: 'error',
                ruleId: 'SEC-02',
                ruleName: 'Inkompatible Browser-API',
                message: 'Nutzung von window.alert() blockiert die Anwendung im Sandbox-Iframe von AI Studio.',
                evidence: line.trim(),
                suggestion: 'Nutzen Sie moderne UI-Modals oder Toast-Komponenten für Interaktions-Feedback.',
                autoFixable: false
              });
            }

            // SEC-03: localStorage token leak
            const hasSessionToken = /localStorage\.setItem\s*\(\s*['"`](token|auth|jwt|session)['"`]/.test(line);
            if (hasSessionToken) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: lineNum,
                severity: 'warning',
                ruleId: 'SEC-03',
                ruleName: 'Sitzungsschlüssel im LocalStorage',
                message: 'Sensible Authentifizierungsschlüssel sollten nicht unverschlüsselt im LocalStorage verbleiben.',
                evidence: line.trim(),
                suggestion: 'Nutzen Sie sichere HTTP-only Cookies oder zustandslose Authentifizierung.',
                autoFixable: false
              });
            }

            // SEC-04: dangerouslySetInnerHTML
            const hasDangerHtml = /dangerouslySetInnerHTML/.test(line);
            if (hasDangerHtml) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: lineNum,
                severity: 'warning',
                ruleId: 'SEC-04',
                ruleName: 'Potenzielle XSS-Schnittstelle',
                message: 'Nutzung von dangerouslySetInnerHTML kann Cross-Site-Scripting (XSS) ermöglichen.',
                evidence: line.trim(),
                suggestion: 'Prüfen Sie, ob Sie stattdessen Text oder eine geprüfte Markdown-Bibliothek (react-markdown) nutzen können.',
                autoFixable: false
              });
            }

            // SEC-05: Direct eval
            const hasEval = /\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line);
            if (hasEval) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: lineNum,
                severity: 'error',
                ruleId: 'SEC-05',
                ruleName: 'Dynamische Code-Ausführung',
                message: 'Nutzung von eval() oder new Function() stellt ein extremes Sicherheitsrisiko dar.',
                evidence: line.trim(),
                suggestion: 'Verwenden Sie strukturierte Parser oder statische Zuordnungen anstelle dynamischer Auswertungen.',
                autoFixable: false
              });
            }
          }

          // DOC-01: Legacy Versioning (Platform version is 0.5.4)
          const hasLegacyVersion = /(version|v7\.5|v1\.0\.0|v1\.0|v2\.0)\s*[:=]?\s*['"`]?[0-9]+\.[0-9]+(\.[0-9]+)?['"`]?/i.test(line) || 
                                   /version\s+7\.5/i.test(line) || /version\s+1\.0/i.test(line);
          const isCorrectVersion = line.includes('0.5.4');
          if (hasLegacyVersion && !isCorrectVersion) {
            diagnostics.push({
              id: `diag_${Math.random().toString(36).substring(2, 12)}`,
              filePath: target.relPath,
              line: lineNum,
              severity: 'warning',
              ruleId: 'DOC-01',
              ruleName: 'Veraltete Versionsangabe',
              message: 'Es wird eine veraltete Version (z.B. v7.5, v1.0.0) referenziert. Die Version der Plattform ist fest auf Version 0.5.4 (Beta-Phase) definiert.',
              evidence: line.trim(),
              suggestion: 'Klicken Sie auf "Auto-Fix", um die Angabe auf Version 0.5.4 abzuändern.',
              autoFixable: true
            });
          }

          // DOC-02: Fake / Mock Data Check
          const hasMockKeyword = /(mockData|mock_data|tempData|dummyData|lorem\s+ipsum|loremIpsum|placeholder_data)/i.test(line) ||
                                 (target.category === 'docs' && /(lorem\s+ipsum|dolor\s+sit|dummy\s+text|blindtext)/i.test(line));
          if (hasMockKeyword) {
            diagnostics.push({
              id: `diag_${Math.random().toString(36).substring(2, 12)}`,
              filePath: target.relPath,
              line: lineNum,
              severity: 'warning',
              ruleId: 'DOC-02',
              ruleName: 'Scheindaten & Platzhalter',
              message: 'Es wurden simulierte Scheindaten (Mock Data) oder Platzhalter-Texte (wie Lorem Ipsum) gefunden.',
              evidence: line.trim().substring(0, 80),
              suggestion: 'Ersetzen Sie den Platzhalter durch reale System-Metriken oder eine sinnvolle Beschreibung.',
              autoFixable: false
            });
          }

          // DOC-04: Unmasked PII (unmasked customer emails)
          const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/g;
          let emailMatch;
          while ((emailMatch = emailRegex.exec(line)) !== null) {
            const foundEmail = emailMatch[1].toLowerCase();
            if (
              foundEmail !== 'sven.kulessa@gmail.com' &&
              foundEmail !== 'sven.kulessa@gmx.net' &&
              foundEmail !== 'sven.kulessa@capital-ai.online' &&
              foundEmail !== 'customer_trial@gmail.com'
            ) {
              diagnostics.push({
                id: `diag_${Math.random().toString(36).substring(2, 12)}`,
                filePath: target.relPath,
                line: lineNum,
                severity: 'warning',
                ruleId: 'DOC-04',
                ruleName: 'Unmaskierte personenbezogene Daten (PII)',
                message: `Unmaskierte E-Mail-Adresse (${foundEmail}) entdeckt. Kundendaten müssen anonymisiert oder maskiert sein.`,
                evidence: line.trim(),
                suggestion: 'Klicken Sie auf "Auto-Fix", um die E-Mail-Adresse revisionssicher zu maskieren.',
                autoFixable: true
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning file ${target.relPath}:`, err);
      }
    }

    res.json({ success: true, diagnostics });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Lintent des Workspace: ${err.message || err}` });
  }
});

// 4.6. POST /lint-fix - apply single-issue auto-remediation programmatically
hygieneRouter.post('/lint-fix', requireAdmin, (req, res) => {
  const { filePath, line, ruleId, email } = req.body;
  if (!filePath || !ruleId) {
    return res.status(400).json({ error: 'filePath and ruleId are required.' });
  }

  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: `Datei nicht gefunden: ${filePath}` });
  }

  try {
    const isDoc = filePath.startsWith('docs/');
    const relativeDocPath = isDoc ? filePath.substring(5) : filePath;
    
    // Safety Snapshot Backup
    if (isDoc) {
      backupFile(relativeDocPath);
    } else {
      const backupDir = path.join(HISTORY_DIR, 'code_backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(fullPath, path.join(backupDir, `${Date.now()}_${path.basename(filePath)}`));
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    if (ruleId === 'DOC-03') {
      const updated = ensureBrandingInContent(relativeDocPath, content);
      fs.writeFileSync(fullPath, updated, 'utf8');
    } else {
      const lines = content.split('\n');
      const lineIdx = Number(line) - 1;
      if (lineIdx < 0 || lineIdx >= lines.length) {
        return res.status(400).json({ error: `Zeile ${line} existiert nicht in der Datei.` });
      }

      let lineText = lines[lineIdx];

      if (ruleId === 'DOC-01') {
        lineText = lineText.replace(/(v7\.5|v1\.0\.0|v1\.0|v2\.0|Version\s+7\.5|Version\s+1\.0)/gi, 'Version 0.5.4');
      } else if (ruleId === 'DOC-04') {
        const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/gi;
        lineText = lineText.replace(emailRegex, (match, local, domain) => {
          const lowerMatch = match.toLowerCase();
          if (
            lowerMatch === 'sven.kulessa@gmail.com' ||
            lowerMatch === 'sven.kulessa@gmx.net' ||
            lowerMatch === 'sven.kulessa@capital-ai.online' ||
            lowerMatch === 'customer_trial@gmail.com'
          ) {
            return match;
          }
          const maskedLocal = local[0] + '***';
          return `${maskedLocal}@${domain}`;
        });
      }

      lines[lineIdx] = lineText;
      fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
    }

    logSystemEvent(
      'SECURITY',
      'Linter Auto-Fix Applied',
      email || 'Admin Linter',
      `Applied auto-fix for rule ${ruleId} on file ${filePath} (line ${line})`,
      'SUCCESS'
    );

    res.json({ success: true, message: `Auto-Fix für Regel ${ruleId} erfolgreich angewendet.` });
  } catch (err: any) {
    console.error(`Error applying auto-fix on ${filePath}:`, err);
    res.status(500).json({ error: `Fehler beim Ausführen des Auto-Fixes: ${err.message || err}` });
  }
});

// 5. POST manual execution trigger
hygieneRouter.post('/trigger', requireAdmin, async (req, res) => {
  const { filePath, email } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'filePath parameter is required.' });
  }

  const fullPath = path.join(DOCS_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: `Dokument nicht gefunden: ${filePath}` });
  }

  try {
    processFileEvent('change', filePath, email || 'Admin Manual Trigger');
    res.json({ success: true, message: `Hygieneprüfung für '${filePath}' erfolgreich gestartet.` });
  } catch (err: any) {
    res.status(500).json({ error: `Konnte Prüfung nicht starten: ${err.message || err}` });
  }
});

// ----------------- ARCHITECTURE DECISION RECORDS (ADR) MANAGER ENDPOINTS -----------------
const ADR_DIR = path.join(process.cwd(), 'docs', 'adr');
const ADR_HISTORY_FILE = path.join(process.cwd(), 'docs', 'adr', 'adr_history.json');

function getADRHistory(): Record<string, any[]> {
  try {
    if (fs.existsSync(ADR_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(ADR_HISTORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading ADR history file:', err);
  }
  return {};
}

function saveADRHistory(history: Record<string, any[]>) {
  try {
    const dir = path.dirname(ADR_HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ADR_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving ADR history file:', err);
  }
}

function recordAdrHistory(
  id: string,
  title: string,
  decision: string,
  status: string,
  author: string,
  updatedBy: string
) {
  const history = getADRHistory();
  const formattedId = id.toUpperCase();
  if (!history[formattedId]) {
    history[formattedId] = [];
  }

  const versions = history[formattedId];
  const nextVersionNum = versions.length + 1;

  // Check if the decision actually changed
  if (versions.length > 0) {
    const latest = versions[versions.length - 1];
    if (latest.decision.trim() === decision.trim()) {
      return; // No change in decision, skip recording
    }
  }

  versions.push({
    version: nextVersionNum,
    title,
    decision,
    status,
    author,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || author || 'System'
  });

  saveADRHistory(history);
}

function ensureADRDirectoryAndSeeds() {
  if (!fs.existsSync(ADR_DIR)) {
    fs.mkdirSync(ADR_DIR, { recursive: true });
  }

  const files = fs.readdirSync(ADR_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    const adr1 = {
      id: 'ADR-0001',
      title: 'Standardisierung der Plattform-Version auf 0.5.4',
      status: 'ACCEPTED',
      date: '2026-07-09',
      author: 'Sven Kulessa',
      context: 'Zuvor wurden auf verschiedenen Seiten und Systemprotokollen unterschiedliche Plattform-Versionen wie v7.5 oder v1.0.0 referenziert. Dies verletzte die Dokumentationsintegrität und erschwerte eine einheitliche Auditierung.',
      decision: 'Es wird hiermit entschieden, die offizielle Revisionsnummer der gesamten CAPITAL-AI Plattform in der aktuellen Beta-Phase strikt auf Version 0.5.4 festzulegen. Ein automatischer Dokumenten-Linter prüft künftig alle Quelldateien und Berichte auf Einhaltung dieser Vorgabe.',
      consequences: 'Alle Benutzeroberflächen, Protokolle, PDF-Exporte und Markdown-Spezifikationen verweisen nun einheitlich auf Version 0.5.4. Abweichungen führen zu Warnungen im Security Linter.'
    };
    fs.writeFileSync(path.join(ADR_DIR, 'ADR-0001-platform-version.md'), generateADRContent(adr1), 'utf8');
    recordAdrHistory(adr1.id, adr1.title, adr1.decision, adr1.status, adr1.author, 'System');

    const adr2 = {
      id: 'ADR-0002',
      title: 'Verwendung von Google Firestore für cloud-basierte Datenpersistenz',
      status: 'ACCEPTED',
      date: '2026-07-09',
      author: 'Sven Kulessa',
      context: 'Für kritische, benutzergenerierte Inhalte wie Audit-Protokolle, Freigabetickets und Benutzereinstellungen ist eine ausfallsichere, revisionssichere Cloud-Speicherung erforderlich. Ein reiner lokaler Speicher (LocalStorage) ist unzureichend für firmenweite Audit-Sicherheit.',
      decision: 'Wir integrieren Google Firebase Firestore als primäre dokumentenorientierte Cloud-Datenbank. Alle sicherheitsrelevanten Zustände und Hygiene-Protokolle werden in Echtzeit dorthin synchronisiert, abgesichert durch restriktive Firestore Security Rules.',
      consequences: 'Erhöhte Ausfallsicherheit und Revisionssicherheit für den Administrator und Gründer Sven Kulessa. Lokaler Cache dient nur noch als Fallback.'
    };
    fs.writeFileSync(path.join(ADR_DIR, 'ADR-0002-firestore-persistence.md'), generateADRContent(adr2), 'utf8');
    recordAdrHistory(adr2.id, adr2.title, adr2.decision, adr2.status, adr2.author, 'System');

    const adr3 = {
      id: 'ADR-0003',
      title: 'Automatisierte Dokumenten-Hygiene-Engine',
      status: 'ACCEPTED',
      date: '2026-07-09',
      author: 'Sven Kulessa',
      context: 'Markdown-Spezifikationen und Quellcode-Dateien in anspruchsvollen Finanz- und regulatorischen Systemen neigen dazu, unstrukturiert zu wachsen und sensitive Daten (wie API-Keys, PII) unverschlüsselt zu offenbaren.',
      decision: 'Wir implementieren einen automatisierten Dokumenten-Linter im Backend, der alle Workspace-Dateien auf SEC- und DOC-Regeln scannt und im UI-Dashboard des Admin-Portals ein direktes "Auto-Fixing" anbietet.',
      consequences: 'Revisionssichere und DSGVO-konforme Pflege aller Platform-Ressourcen ohne manuellen Entwicklungsaufwand.'
    };
    fs.writeFileSync(path.join(ADR_DIR, 'ADR-0003-hygiene-engine.md'), generateADRContent(adr3), 'utf8');
    recordAdrHistory(adr3.id, adr3.title, adr3.decision, adr3.status, adr3.author, 'System');
  }
}

function generateADRContent(adr: {
  id: string;
  title: string;
  status: string;
  date: string;
  author: string;
  context: string;
  decision: string;
  consequences: string;
}) {
  return `# ${adr.id}: ${adr.title}

* **Status:** ${adr.status.toUpperCase()}
* **Datum:** ${adr.date}
* **Autor:** ${adr.author}

## Kontext
${adr.context}

## Entscheidung
${adr.decision}

## Konsequenzen
${adr.consequences}
`;
}

function parseADRFile(filePath: string, content: string) {
  const lines = content.split('\n');
  let id = '';
  let title = '';
  let status = 'PROPOSED';
  let date = '';
  let author = '';
  let context = '';
  let decision = '';
  let consequences = '';

  const titleLine = lines.find(l => l.startsWith('#'));
  if (titleLine) {
    const match = titleLine.match(/^#\s*(ADR-\d+)\s*[:-]\s*(.*)$/);
    if (match) {
      id = match[1].trim();
      title = match[2].trim();
    } else {
      title = titleLine.replace(/^#\s*/, '').trim();
    }
  }

  if (!id) {
    const filename = path.basename(filePath, '.md');
    const idMatch = filename.match(/^(ADR-\d+)/i);
    if (idMatch) {
      id = idMatch[1].toUpperCase();
    } else {
      id = 'ADR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
  }

  for (const line of lines) {
    const statusMatch = line.match(/[\*-]\s*\*\*Status:\*\*\s*(.*)/i);
    if (statusMatch) status = statusMatch[1].trim();

    const dateMatch = line.match(/[\*-]\s*\*\*Dat(?:um|e):\*\*\s*(.*)/i);
    if (dateMatch) date = dateMatch[1].trim();

    const authorMatch = line.match(/[\*-]\s*\*\*Auto(?:r|h):?\*\*\s*(.*)/i);
    if (authorMatch) author = authorMatch[1].trim();
  }

  function findHeadingIndex(terms: string[]) {
    for (const term of terms) {
      const idx = content.search(new RegExp(`^##\\s*${term}`, 'im'));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const headings = [
    { key: 'context', terms: ['kontext', 'context'] },
    { key: 'decision', terms: ['entscheidung', 'decision'] },
    { key: 'consequences', terms: ['konsequenzen', 'consequences'] }
  ];

  const positions = headings
    .map(h => ({ key: h.key, index: findHeadingIndex(h.terms) }))
    .filter(p => p.index !== -1)
    .sort((a, b) => a.index - b.index);

  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    
    const headingStart = current.index;
    const newlineIdx = content.indexOf('\n', headingStart);
    const contentStart = newlineIdx === -1 ? headingStart : newlineIdx + 1;
    const contentEnd = next ? next.index : content.length;
    
    const sectionText = content.substring(contentStart, contentEnd).trim();
    if (current.key === 'context') context = sectionText;
    else if (current.key === 'decision') decision = sectionText;
    else if (current.key === 'consequences') consequences = sectionText;
  }

  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  return { id, title, status, date, author, context, decision, consequences, filePath, relPath };
}

// 1. GET all ADRs
hygieneRouter.get('/adr', requireAdmin, (req, res) => {
  try {
    ensureADRDirectoryAndSeeds();
    const files = fs.readdirSync(ADR_DIR).filter(f => f.endsWith('.md'));
    const adrs = files.map(file => {
      const fullPath = path.join(ADR_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      return parseADRFile(fullPath, content);
    });
    res.json({ success: true, adrs });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Laden der ADRs: ${err.message || err}` });
  }
});

// 2. POST create ADR
hygieneRouter.post('/adr', requireAdmin, (req, res) => {
  const { id, title, status, date, author, context, decision, consequences, email } = req.body;
  if (!id || !title || !status || !date || !author) {
    return res.status(400).json({ error: 'id, title, status, date, and author are required.' });
  }

  try {
    ensureADRDirectoryAndSeeds();
    
    const formattedId = id.trim().toUpperCase();
    const safeTitle = title.trim().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().replace(/-+/g, '-');
    const fileName = `${formattedId}-${safeTitle}.md`;
    const fullPath = path.join(ADR_DIR, fileName);

    const adrData = { id: formattedId, title, status, date, author, context, decision, consequences };
    const content = generateADRContent(adrData);

    fs.writeFileSync(fullPath, content, 'utf8');

    // Record initial version in history
    recordAdrHistory(formattedId, title, decision || '', status, author, email || author);

    logSystemEvent(
      'SECURITY',
      'ADR Created',
      email || 'Admin',
      `Architectural Decision Record '${formattedId}' (${title}) created successfully.`,
      'SUCCESS'
    );

    res.json({ success: true, adr: parseADRFile(fullPath, content) });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Erstellen der ADR: ${err.message || err}` });
  }
});

// 3. PUT update ADR
hygieneRouter.put('/adr/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, status, date, author, context, decision, consequences, email } = req.body;
  
  if (!title || !status || !date || !author) {
    return res.status(400).json({ error: 'title, status, date, and author are required.' });
  }

  try {
    ensureADRDirectoryAndSeeds();
    
    const files = fs.readdirSync(ADR_DIR).filter(f => f.endsWith('.md'));
    const targetFile = files.find(f => f.toUpperCase().startsWith(`${id.toUpperCase()}-`));
    
    if (!targetFile) {
      return res.status(404).json({ error: `ADR mit ID ${id} wurde nicht gefunden.` });
    }

    const oldFullPath = path.join(ADR_DIR, targetFile);
    
    const safeTitle = title.trim().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().replace(/-+/g, '-');
    const newFileName = `${id.toUpperCase()}-${safeTitle}.md`;
    const newFullPath = path.join(ADR_DIR, newFileName);

    const adrData = { id: id.toUpperCase(), title, status, date, author, context, decision, consequences };
    const content = generateADRContent(adrData);

    if (oldFullPath !== newFullPath) {
      fs.unlinkSync(oldFullPath);
    }

    fs.writeFileSync(newFullPath, content, 'utf8');

    // Record new version in history if decision field changed
    recordAdrHistory(id.toUpperCase(), title, decision || '', status, author, email || author);

    logSystemEvent(
      'SECURITY',
      'ADR Updated',
      email || 'Admin',
      `Architectural Decision Record '${id.toUpperCase()}' updated successfully.`,
      'SUCCESS'
    );

    res.json({ success: true, adr: parseADRFile(newFullPath, content) });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Aktualisieren der ADR: ${err.message || err}` });
  }
});

// 4. DELETE ADR
hygieneRouter.delete('/adr/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const email = req.query.email || req.body.email;

  try {
    ensureADRDirectoryAndSeeds();
    const files = fs.readdirSync(ADR_DIR).filter(f => f.endsWith('.md'));
    const targetFile = files.find(f => f.toUpperCase().startsWith(`${id.toUpperCase()}-`));
    
    if (!targetFile) {
      return res.status(404).json({ error: `ADR mit ID ${id} wurde nicht gefunden.` });
    }

    const fullPath = path.join(ADR_DIR, targetFile);
    fs.unlinkSync(fullPath);

    // Clean up history
    const history = getADRHistory();
    if (history[id.toUpperCase()]) {
      delete history[id.toUpperCase()];
      saveADRHistory(history);
    }

    logSystemEvent(
      'SECURITY',
      'ADR Deleted',
      String(email || 'Admin'),
      `Architectural Decision Record '${id.toUpperCase()}' deleted successfully.`,
      'SUCCESS'
    );

    res.json({ success: true, message: `ADR ${id} erfolgreich gelöscht.` });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Löschen der ADR: ${err.message || err}` });
  }
});

// 5. GET ADR history
hygieneRouter.get('/adr/:id/history', requireAdmin, (req, res) => {
  const { id } = req.params;
  try {
    ensureADRDirectoryAndSeeds();
    let history = getADRHistory();
    const formattedId = id.toUpperCase();
    let adrHistory = history[formattedId] || [];

    if (adrHistory.length === 0) {
      // Find the file and parse current decision as version 1
      const files = fs.readdirSync(ADR_DIR).filter(f => f.endsWith('.md'));
      const targetFile = files.find(f => f.toUpperCase().startsWith(`${formattedId}-`));
      if (targetFile) {
        const fullPath = path.join(ADR_DIR, targetFile);
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = parseADRFile(fullPath, content);
        if (parsed && parsed.decision) {
          recordAdrHistory(
            formattedId,
            parsed.title,
            parsed.decision,
            parsed.status,
            parsed.author,
            'System (Auto-Migration)'
          );
          // Reload history
          history = getADRHistory();
          adrHistory = history[formattedId] || [];
        }
      }
    }

    res.json({ success: true, history: adrHistory });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Laden der ADR-Historie: ${err.message || err}` });
  }
});


// ----------------- RECURSIVE FILE WATCHER INITIALIZATION -----------------

let activeWatcher: FileWatcher | null = null;

export function startRecursiveFileWatcher() {
  loadHygieneDb();

  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // Ensure ADR directory is created and seeded immediately on start!
  try {
    ensureADRDirectoryAndSeeds();
  } catch (err) {
    console.error('[DocumentHygiene] Error pre-seeding ADRs on start:', err);
  }

  // Audit ARCH-AUDIT-0002 (AUD2-F-014, S7): applyBrandingToAllDocs() lief hier zuvor bei
  // JEDEM Serverstart unbedingt und mutierte dabei alle ~70 Dokumente unter docs/ (SVG-Header-
  // Injektion), auch wenn keine Aenderung vorlag - das macht jeden Start zu einer Quelle von
  // Dutzenden unbeabsichtigten Diffs und ist mit reproduzierbaren Builds unvereinbar. Der Sweep
  // ist jetzt ein explizites Skript: `npm run hygiene:sweep` (scripts/automation/sweepDocumentaryBranding.ts).
  // Der FileWatcher unten bleibt unveraendert - er reagiert nur auf tatsaechliche Datei-Events,
  // er mutiert nicht proaktiv den gesamten Bestand.

  if (activeWatcher) {
    activeWatcher.stop();
  }

  activeWatcher = new FileWatcher(
    async (event, relativePath) => {
      console.log(`[DocumentHygiene] Received watched file event '${event}' on '${relativePath}'`);
      await processFileEvent(event, relativePath);
    },
    {
      docsDir: DOCS_DIR,
      debounceMs: 1500,
      allowedExtensions: ['.md', '.json', '.txt', '.pdf'],
      ignoredPrefixes: ['.history', 'reports']
    }
  );

  activeWatcher.start();
}
