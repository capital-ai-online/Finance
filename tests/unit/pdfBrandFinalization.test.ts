import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

function cssThemeValue(css: string, variable: string): string {
  const match = css.match(new RegExp(`${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing CSS theme variable: ${variable}`);
  return match[1].trim();
}

type TokenNode = { value?: unknown; $value?: unknown; [key: string]: unknown };

function tokenValue(tokens: Record<string, unknown>, ...segments: string[]): unknown {
  let current: unknown = tokens;
  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      throw new Error(`Missing token ${segments.join('.')}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (current && typeof current === 'object') {
    const token = current as TokenNode;
    if ('$value' in token) return token.$value;
    if ('value' in token) return token.value;
  }
  return current;
}

describe('P1/P2 CAPITAL-AI PDF brand finalization', () => {
  const tokens = JSON.parse(read('docs/frontend/design-tokens.json')) as Record<string, unknown>;
  const css = read('src/index.css');
  const vite = read('vite.config.ts');
  const pdfBrand = read('src/platform/PdfReporting/pdfBrand.ts');
  const logo = read('src/components/CapitalAiLogo.tsx');
  const notebook = read('scripts/docs/export_notebooklm_pdfs.py');
  const requirements = read('scripts/docs/requirements-notebooklm-pdf.txt');
  const verifier = read('scripts/docs/verify_pdf_render.py');

  it('keeps product CSS and canonical color tokens aligned', () => {
    const pairs: Array<[string[], string]> = [
      [['color', 'background'], '--color-background'],
      [['color', 'foreground'], '--color-foreground'],
      [['color', 'aif', 'gold', 'light'], '--color-aif-gold-light'],
      [['color', 'aif', 'gold', 'DEFAULT'], '--color-aif-gold-DEFAULT'],
      [['color', 'aif', 'gold', 'dark'], '--color-aif-gold-dark'],
      [['color', 'aif', 'gold', 'muted'], '--color-aif-gold-muted'],
      [['color', 'aif', 'neon', 'cyan'], '--color-aif-neon-cyan'],
      [['color', 'aif', 'neon', 'purple'], '--color-aif-neon-purple'],
    ];

    for (const [tokenPath, variable] of pairs) {
      expect(tokenValue(tokens, ...tokenPath)).toBe(cssThemeValue(css, variable));
    }
  });

  it('derives the PDF renderer adapter from the design-token source of truth', () => {
    expect(vite).toContain("docs/frontend/design-tokens.json");
    expect(vite).toContain('__CAPITAL_AI_PDF_BRAND__');
    expect(vite).toContain("tokenString('color', 'aif', 'gold', 'DEFAULT')");
    expect(vite).toContain("tokenString('color', 'print', 'textPrimary')");
    expect(pdfBrand).toContain('export const PDF_BRAND = __CAPITAL_AI_PDF_BRAND__');
    expect(pdfBrand).not.toContain('canvas: [24, 24, 27]');
  });

  it('renders a shared vector emblem and uses one runtime release version', () => {
    expect(pdfBrand).toContain('drawCapitalAiEmblem');
    expect(pdfBrand).toContain('drawCapitalAiWordmark');
    expect(pdfBrand).toContain('EMBLEM_NODES');
    expect(pdfBrand).toContain('EMBLEM_EDGES');
    expect(logo).toContain("from '../platform/Branding/runtimeBrand'");
    expect(logo).toContain('version = CAPITAL_AI_VERSION');
    expect(logo).not.toContain("version = '0.7.0'");
    expect(logo).toContain('var(--color-aif-gold-DEFAULT)');
    expect(logo).toContain('var(--color-aif-neon-cyan)');
    expect(logo).toContain('var(--color-aif-neon-purple)');
  });

  it('keeps jsPDF accessibility claims capability-bounded', () => {
    expect(pdfBrand).toContain("id: 'client-jsPDF'");
    expect(pdfBrand).toContain("conformance: 'metadata-only'");
    expect(pdfBrand).toContain('tagged: false');
    expect(pdfBrand).toContain('pdfUa: false');
    expect(pdfBrand).toContain('doc.setLanguage(PDF_ACCESSIBILITY_PROFILES.client.language)');
    expect(pdfBrand).not.toContain('BFSG-konform');
    expect(pdfBrand).not.toContain('PDF/UA-konform');
  });

  it('uses semantic tagged PDF/UA-1 for Documentation-as-Code output', () => {
    expect(notebook).toContain('PDF_VARIANT = "pdf/ua-1"');
    expect(notebook).toContain('PDF_TAGS = True');
    expect(notebook).toContain('pdf_variant=PDF_VARIANT');
    expect(notebook).toContain('pdf_tags=PDF_TAGS');
    expect(notebook).toContain('<header class="cover">');
    expect(notebook).toContain('<nav class="toc" aria-label="Inhaltsverzeichnis">');
    expect(notebook).toContain('<main>');
    expect(notebook).toContain('<article class="doc"');
    expect(notebook).not.toContain('#10233d');
    expect(notebook).toContain('docs/frontend/design-tokens.json');
  });

  it('pins the PDF renderer toolchain and supplies an independent render verifier', () => {
    expect(requirements).toContain('Markdown==3.10.2');
    expect(requirements).toContain('WeasyPrint==69.0');
    expect(requirements).toContain('Pygments==2.20.0');
    expect(requirements).not.toMatch(/PyMuPDF|fitz/i);
    expect(verifier).toContain('pdfinfo');
    expect(verifier).toContain('pdftotext');
    expect(verifier).toContain('pdftoppm');
    expect(verifier).toContain('formalPdfUaValidation');
    expect(notebook).toContain('--smoke');
  });
});
