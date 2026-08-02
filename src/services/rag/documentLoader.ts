// ARCH-AUDIT-0002 (J4, Kapitel 14.6): "RAG mit Wissensanbindung". Laedt reale Markdown-
// Dokumentation des Repositories (docs/, .ai/skills/) und zerlegt sie in zitierfaehige
// Abschnitte. Erzeugt keinen Text - nur Ausschnitte aus tatsaechlich vorhandenen Dateien.

import fs from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();
const MAX_CHUNK_CHARS = 1500;

export interface DocumentChunk {
  id: string;
  sourcePath: string;
  heading: string;
  text: string;
}

function walkMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(full));
    } else if (entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

/** Zerlegt eine Markdown-Datei an ihren Ueberschriften (# / ##) in Abschnitte. Ein zu langer
 *  Abschnitt wird zusaetzlich an Absatzgrenzen in mehrere Chunks von je maximal
 *  MAX_CHUNK_CHARS Zeichen aufgeteilt, damit ein einzelner Chunk fuer eine Embedding-Anfrage
 *  handhabbar bleibt. */
// server/documentHygiene.ts fuegt beim Serverstart in praktisch jedes Markdown-Dokument einen
// identischen Marken-Header (SVG-Logo) ein (siehe ARCH-AUDIT-0002, Nebenbefund AUD2-F-014).
// Fuer die Retrieval-Qualitaet ist das reines Rauschen - fast jede der 102 Quelldateien wuerde
// sonst mit demselben inhaltsleeren Chunk beginnen.
const DOCUMENTARY_HEADER = /<!-- CAPITAL-AI DOCUMENTARY HEADER START -->[\s\S]*?<!-- CAPITAL-AI DOCUMENTARY HEADER END -->\n?/;

function chunkMarkdown(sourcePath: string, rawContent: string): DocumentChunk[] {
  const content = rawContent.replace(DOCUMENTARY_HEADER, '');
  const sections: Array<{ heading: string; lines: string[] }> = [{ heading: sourcePath, lines: [] }];
  for (const line of content.split('\n')) {
    if (/^#{1,2}\s+/.test(line)) {
      sections.push({ heading: line.replace(/^#{1,2}\s+/, '').trim(), lines: [] });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }

  const chunks: DocumentChunk[] = [];
  for (const section of sections) {
    const text = section.lines.join('\n').trim();
    if (text.length === 0) continue;
    const parts = text.length <= MAX_CHUNK_CHARS ? [text] : splitByParagraph(text, MAX_CHUNK_CHARS);
    parts.forEach((part, i) => {
      chunks.push({
        id: `${sourcePath}#${section.heading}${parts.length > 1 ? `[${i}]` : ''}`,
        sourcePath,
        heading: section.heading,
        text: part,
      });
    });
  }
  return chunks;
}

function splitByParagraph(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const parts: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxChars && current.length > 0) {
      parts.push(current.trim());
      current = '';
    }
    current += (current ? '\n\n' : '') + p;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Laedt und zerlegt die gesamte reale Dokumentation unter docs/ und .ai/skills/. */
export function loadCorpusChunks(): DocumentChunk[] {
  const roots = ['docs', '.ai/skills'];
  const chunks: DocumentChunk[] = [];
  for (const root of roots) {
    for (const file of walkMarkdownFiles(path.join(REPO_ROOT, root))) {
      const relPath = path.relative(REPO_ROOT, file).split(path.sep).join('/');
      const content = fs.readFileSync(file, 'utf8');
      chunks.push(...chunkMarkdown(relPath, content));
    }
  }
  return chunks;
}
