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

describe('CAPITAL-AI Branding Manifest v6.2 / PDF brand projection', () => {
  const tokens = JSON.parse(read('docs/frontend/design-tokens.json')) as Record<string, unknown>;
  const css = read('src/index.css');
  const vite = read('vite.config.ts');
  const pdfBrand = read('src/platform/PdfReporting/pdfBrand.ts');
  const logo = read('src/shared/branding/CapitalAiLogo.tsx');
  const neuralBackground = read('src/shared/visuals/NeuralBackground.tsx');
  const notebook = read('scripts/docs/export_notebooklm_pdfs.py');
  const requirements = read('scripts/docs/requirements-notebooklm-pdf.txt');
  const verifier = read('scripts/docs/verify_pdf_render.py');

  it('keeps the canonical palette aligned with the web theme', () => {
    const pairs: Array<[string[], string]> = [
      [['color', 'background'], '--color-background'],
      [['color', 'foreground'], '--color-foreground'],
      [['color', 'border'], '--color-border'],
      [['color', 'brand', 'primary'], '--color-brand-primary'],
      [['color', 'brand', 'accent'], '--color-brand-accent'],
      [['color', 'brand', 'cyan'], '--color-brand-cyan'],
      [['color', 'brand', 'success'], '--color-brand-success'],
      [['color', 'brand', 'danger'], '--color-brand-danger'],
      [['color', 'aif', 'gold', 'DEFAULT'], '--color-aif-gold-DEFAULT'],
      [['color', 'aif', 'neon', 'cyan'], '--color-aif-neon-cyan'],
      [['color', 'aif', 'neon', 'purple'], '--color-aif-neon-purple'],
    ];

    for (const [tokenPath, variable] of pairs) {
      expect(tokenValue(tokens, ...tokenPath)).toBe(cssThemeValue(css, variable));
    }

    expect(tokenValue(tokens, 'color', 'background')).toBe('#08080C');
    expect(tokenValue(tokens, 'color', 'brand', 'primary')).toBe('#F9BF21');
    expect(tokenValue(tokens, 'color', 'brand', 'accent')).toBe('#8D26FF');
    expect(tokenValue(tokens, 'color', 'brand', 'cyan')).toBe('#F9BF21');
    expect(tokenValue(tokens, 'color', 'brand', 'success')).toBe('#44DE88');
    expect(tokenValue(tokens, 'color', 'brand', 'danger')).toBe('#F87171');
    expect(tokenValue(tokens, 'color', 'surface', 'elevated')).toBe('#121215');
  });

  it('keeps Dark Black + AIF Gold as the primary brand pair and Cyan semantic-only', () => {
    expect(tokenValue(tokens, 'color', 'background')).toBe('#08080C');
    expect(tokenValue(tokens, 'color', 'brand', 'primary')).toBe('#F9BF21');
    expect(tokenValue(tokens, 'color', 'brand', 'cyan')).toBe(
      tokenValue(tokens, 'color', 'brand', 'primary'),
    );
    expect(tokenValue(tokens, 'color', 'aif', 'neon', 'cyan')).toBe(
      tokenValue(tokens, 'color', 'brand', 'primary'),
    );
    expect(tokenValue(tokens, 'color', 'semantic', 'info')).toBe('#22D3EE');
    expect(tokenValue(tokens, 'color', 'assetClass', 'crypto')).toBe('#22D3EE');
    expect(tokenValue(tokens, 'color', 'factor', 'technical')).toBe('#22D3EE');
  });

  it('uses Inter headings, Poppins body and JetBrains Mono data typography', () => {
    expect(tokenValue(tokens, 'font', 'display')).toContain('Inter');
    expect(tokenValue(tokens, 'font', 'sans')).toContain('Poppins');
    expect(tokenValue(tokens, 'font', 'mono')).toContain('JetBrains Mono');
    expect(css).toContain('--font-display: "Inter"');
    expect(css).toContain('h1,');
    expect(css).not.toContain('Montserrat');
  });

  it('derives the PDF renderer adapter from canonical design-token roles', () => {
    expect(vite).toContain("docs/frontend/design-tokens.json");
    expect(vite).toContain('__CAPITAL_AI_PDF_BRAND__');
    expect(vite).toContain("tokenString('color', 'brand', 'primary')");
    expect(vite).toContain("tokenString('color', 'brand', 'cyan')");
    expect(vite).toContain("tokenString('color', 'brand', 'accent')");
    expect(vite).toContain("tokenString('color', 'print', 'textPrimary')");
    expect(vite).not.toMatch(/tokenString\('color',\s*'aif'/);
    expect(pdfBrand).toContain('export const PDF_BRAND = __CAPITAL_AI_PDF_BRAND__');
    expect(pdfBrand).not.toContain('canvas: [24, 24, 27]');
  });

  it('renders the canonical shared mark with Gold as the brand anchor', () => {
    expect(pdfBrand).toContain('drawCapitalAiEmblem');
    expect(pdfBrand).toContain('drawCapitalAiWordmark');
    expect(pdfBrand).toContain('EMBLEM_NODES');
    expect(pdfBrand).toContain('EMBLEM_EDGES');
    expect(logo).toContain("from '../../platform/Branding/runtimeBrand'");
    expect(logo).toContain('version = CAPITAL_AI_VERSION');
    expect(logo).toContain('var(--color-brand-primary)');
    expect(logo).toContain('var(--color-brand-accent)');
    expect(logo).not.toContain('var(--color-aif-neon-cyan)');
    expect(neuralBackground).toContain('var(--color-brand-primary)');
    expect(neuralBackground).toContain('var(--color-brand-accent)');
    expect(neuralBackground).not.toContain('bg-aif-neon-cyan');
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
    expect(notebook).toContain('DESIGN_TOKENS_PATH = REPO_ROOT / "docs" / "frontend" / "design-tokens.json"');
  });

  it('pins the PDF renderer toolchain and supplies an independent render verifier', () => {
    expect(requirements).toContain('Markdown==3.10.2');
    expect(requirements).toContain('WeasyPrint==69.0');
    expect(requirements).toContain('Pygments==2.20.0');
    expect(requirements).not.toMatch(/PyMuPDF|fitz/i);
    expect(verifier).toContain('pdfinfo');
    expect(verifier).toContain('pdftotext');
    expect(verifier).toContain('pdftoppm');
    expect(verifier).toContain('expect_tagged');
  });
});
