import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs');

// SECURITY (2026-08-25 architecture review, finding #4): despite the historical "sanitize*"
// naming and the "verifiziert & bereinigt" (verified & cleaned) status text this module used to
// stamp into documents, none of the functions below perform any content security validation -
// they only insert/update a branding header block. They do not strip scripts, HTML, prompt-
// injection payloads, or secrets from the document body. Untrusted content passing through here
// remains fully untrusted afterwards. Real defenses live elsewhere (input validation at API
// boundaries, the human-gated /review approval flow in documentHygiene.ts). Do not treat a
// "branded" document as vetted, and do not reintroduce a status string that implies otherwise.

// Beautiful, responsive SVG logo matching the 3D network node design of the Capital-AI application
export const CAPITAL_AI_SVG_LOGO = `
<div align="center">
  <svg viewBox="0 0 200 180" width="100" height="90" style="filter: drop-shadow(0px 0px 15px rgba(194, 157, 83, 0.35));" aria-hidden="true">
    <g stroke="#C29D53" stroke-width="2" stroke-opacity="0.6">
      <line x1="60" y1="50" x2="78" y2="93" />
      <line x1="78" y1="93" x2="60" y2="135" />
      <line x1="60" y1="135" x2="100" y2="145" />
      <line x1="100" y1="145" x2="140" y2="133" />
      <line x1="140" y1="133" x2="142" y2="90" />
      <line x1="142" y1="90" x2="140" y2="48" />
      <line x1="140" y1="48" x2="105" y2="55" />
      <line x1="105" y1="55" x2="60" y2="50" />
      <line x1="100" y1="100" x2="60" y2="50" stroke="#06B6D4" />
      <line x1="100" y1="100" x2="140" y2="48" stroke="#06B6D4" />
      <line x1="100" y1="100" x2="140" y2="133" stroke="#8B5CF6" />
      <line x1="100" y1="100" x2="60" y2="135" stroke="#8B5CF6" />
    </g>
    <circle cx="60" cy="50" r="7" fill="#E5C17C" />
    <circle cx="140" cy="48" r="7" fill="#E5C17C" />
    <circle cx="140" cy="133" r="7" fill="#E5C17C" />
    <circle cx="60" cy="135" r="7" fill="#E5C17C" />
    <circle cx="100" cy="100" r="12" fill="#BD984E" />
    <circle cx="78" cy="93" r="5" fill="#E5C17C" />
    <circle cx="142" cy="90" r="5" fill="#E5C17C" />
    <circle cx="100" cy="145" r="5" fill="#E5C17C" />
    <circle cx="105" cy="55" r="5" fill="#E5C17C" />
  </svg>
</div>
`.trim();

/**
 * Standard Markdown header block.
 * Fully framed using precise HTML comments to facilitate idempotent searching and replacement.
 */
export const MARKDOWN_HEADER = `
<!-- CAPITAL-AI DOCUMENTARY HEADER START -->
${CAPITAL_AI_SVG_LOGO}

<div align="center">
  <h1 style="margin-top: 10px; margin-bottom: 2px; font-weight: 900; color: #E5C17C; letter-spacing: -0.04em; font-family: 'Space Grotesk', sans-serif; text-transform: uppercase;">⊞ Capital-AI Documentary</h1>
  <p style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #8A9A86; margin-top: 0; text-transform: uppercase; letter-spacing: 0.1em;">Autonomous AI Document Hygienist • Version 0.5.4</p>
</div>

| System-Metadaten | Spezifikation |
| :--- | :--- |
| **Plattform-Identität** | Capital-AI Documentary (V0.5.4) |
| **Gründer & Inhaber** | **Sven Kulessa** |
| **Zentrale E-Mail** | [sven.kulessa@capital-ai.online](mailto:sven.kulessa@capital-ai.online) |
| **Echtheits-Emblem** | \`⊞ CAPITAL-AI CORE\` |
| **Status** | 🟢 Branding-Header aktuell (keine Sicherheits-Validierung des Inhalts) |

---
<!-- CAPITAL-AI DOCUMENTARY HEADER END -->
`.trim();

/**
 * Standard Text header block for plain text files.
 * Fully framed to allow idempotent updating.
 */
export const TEXT_HEADER = `
========================================================================
⊞ CAPITAL-AI CORE • CAPITAL-AI DOCUMENTARY (V0.5.4)
------------------------------------------------------------------------
System:       Capital-AI Documentary (Autonomous AI Document Hygienist)
Gründer:      Sven Kulessa
Kontakt:      sven.kulessa@capital-ai.online
Echtheits-Emblem:  ⊞ CAPITAL-AI CORE
Status:       🟢 Branding-Header aktuell (keine Sicherheits-Validierung des Inhalts)
========================================================================
`.trim();

/**
 * Adds or updates the standard framed branding header in markdown content.
 * This does NOT validate or sanitize the document body - see the file-level note above.
 */
export function applyMarkdownBrandingHeader(content: string): string {
  const headerStartToken = '<!-- CAPITAL-AI DOCUMENTARY HEADER START -->';
  const headerEndToken = '<!-- CAPITAL-AI DOCUMENTARY HEADER END -->';

  const startIndex = content.indexOf(headerStartToken);
  const endIndex = content.indexOf(headerEndToken);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Replace the existing header block with the updated standard one
    const preHeader = content.substring(0, startIndex);
    const postHeader = content.substring(endIndex + headerEndToken.length);
    return `${preHeader}${MARKDOWN_HEADER}\n\n${postHeader.trim()}`;
  }

  // Header not found, prepend to content
  return `${MARKDOWN_HEADER}\n\n${content.trim()}`;
}

/**
 * Adds or updates the standard branding header in plain text content.
 * This does NOT validate or sanitize the document body - see the file-level note above.
 */
export function applyTextBrandingHeader(content: string): string {
  const headerStartToken = '⊞ CAPITAL-AI CORE • CAPITAL-AI DOCUMENTARY';
  const headerEndToken = '========================================================================';

  const startIndex = content.indexOf(headerStartToken);

  if (startIndex !== -1) {
    // Find the second occurrences of the border lines to strip the old header
    const firstBorderIdx = content.indexOf('========================================================================');
    if (firstBorderIdx !== -1 && firstBorderIdx < startIndex) {
      const secondBorderIdx = content.indexOf('========================================================================', startIndex);
      if (secondBorderIdx !== -1) {
        const postHeader = content.substring(secondBorderIdx + headerEndToken.length);
        return `${TEXT_HEADER}\n\n${postHeader.trim()}`;
      }
    }
  }

  // Prepend new text header if none existed
  return `${TEXT_HEADER}\n\n${content.trim()}`;
}

/**
 * Embeds standard branding metadata properties into JSON content.
 * This does NOT validate or sanitize the document body - see the file-level note above.
 */
export function applyJsonBrandingMetadata(content: string): string {
  try {
    const obj = JSON.parse(content);
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      obj.documentaryMetadata = {
        system: "Capital-AI Documentary",
        founder: "Sven Kulessa",
        email: "sven.kulessa@capital-ai.online",
        emblem: "⊞ CAPITAL-AI CORE",
        version: "0.5.4",
        status: "Branding metadata applied (no content security validation)",
        timestamp: new Date().toISOString()
      };
      return JSON.stringify(obj, null, 2);
    }
  } catch (e) {
    // If invalid JSON, return unmodified
  }
  return content;
}

/**
 * Applies the branding header/metadata to a single document on disk. Returns true if modified.
 */
export function applyBrandingToFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');
    let sanitizedContent = content;

    if (ext === '.md') {
      sanitizedContent = applyMarkdownBrandingHeader(content);
    } else if (ext === '.txt') {
      sanitizedContent = applyTextBrandingHeader(content);
    } else if (ext === '.json') {
      sanitizedContent = applyJsonBrandingMetadata(content);
    } else {
      return false; // Skip unsupported extensions
    }

    if (sanitizedContent !== content) {
      fs.writeFileSync(filePath, sanitizedContent, 'utf8');
      return true;
    }
  } catch (err) {
    console.error(`[documentSanitizer] Error sanitizing file ${filePath}:`, err);
  }

  return false;
}

/**
 * Recursively applies the branding header/metadata to every markdown, text, and JSON document
 * under the target directory. Kept as `sanitizeAllDocs` for backward-compatible call sites.
 */
export function sanitizeAllDocs(dir: string = DOCS_DIR): { total: number; modified: number } {
  let total = 0;
  let modified = 0;

  if (!fs.existsSync(dir)) {
    return { total, modified };
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden folders, history folder, and node_modules
        if (!entry.name.startsWith('.') && entry.name !== '.history' && entry.name !== 'reports' && entry.name !== 'node_modules') {
          const stats = sanitizeAllDocs(fullPath);
          total += stats.total;
          modified += stats.modified;
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.md', '.txt', '.json'].includes(ext)) {
          total++;
          const wasModified = applyBrandingToFile(fullPath);
          if (wasModified) {
            modified++;
          }
        }
      }
    }
  } catch (err) {
    console.error(`[documentSanitizer] Recursive scan failed in ${dir}:`, err);
  }

  return { total, modified };
}
