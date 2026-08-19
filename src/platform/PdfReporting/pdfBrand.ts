import type { jsPDF } from 'jspdf';
import { CAPITAL_AI_VERSION } from '../Branding/runtimeBrand';

export type PdfRgb = [number, number, number];

type PdfBrandDefinition = {
  colors: {
    canvas: PdfRgb;
    foreground: PdfRgb;
    goldLight: PdfRgb;
    gold: PdfRgb;
    goldDark: PdfRgb;
    goldMuted: PdfRgb;
    cyan: PdfRgb;
    purple: PdfRgb;
    success: PdfRgb;
    warning: PdfRgb;
    danger: PdfRgb;
    textPrimary: PdfRgb;
    textSecondary: PdfRgb;
    surfaceLight: PdfRgb;
    borderLight: PdfRgb;
    link: PdfRgb;
  };
  fonts: {
    productSans: string;
    productDisplay: string;
    productMono: string;
    pdfSafeSans: string;
    pdfSafeMono: string;
  };
};

declare const __CAPITAL_AI_PDF_BRAND__: PdfBrandDefinition;

/**
 * Build-time PDF renderer adapter derived from docs/frontend/design-tokens.json.
 * Vite owns the conversion from product tokens to renderer-safe RGB tuples.
 */
export const PDF_BRAND = __CAPITAL_AI_PDF_BRAND__;
export { CAPITAL_AI_VERSION };

export const PDF_NOTICES = {
  informational:
    'Automatisch erzeugter CAPITAL-AI Analysebericht. Keine Anlage-, Rechts- oder Steuerberatung.',
  internalCompliance:
    'Interner CAPITAL-AI Selbstcheck. Keine externe Zertifizierung, Rechtsprüfung oder behördliche Freigabe.',
} as const;

export const PDF_ACCESSIBILITY_PROFILES = {
  client: {
    id: 'client-jsPDF',
    renderer: 'jsPDF',
    language: 'de-DE',
    conformance: 'metadata-only',
    tagged: false,
    pdfUa: false,
    statement:
      'Sprache und Dokumentmetadaten gesetzt; keine PDF/UA-, Tagged-PDF-, WCAG- oder BFSG-Konformitätsbehauptung.',
  },
  documentation: {
    id: 'documentation-weasyprint',
    renderer: 'WeasyPrint',
    language: 'de',
    conformance: 'tagged-pdf-ua-1-candidate',
    tagged: true,
    pdfUa: 'pdf/ua-1',
    statement:
      'Semantische HTML-Quelle mit WeasyPrint PDF/UA-1 und Tags; Verifikation des erzeugten Artefakts bleibt erforderlich.',
  },
} as const;

export type PdfReportKind = 'compliance' | 'backtest' | 'portfolio' | 'risk';

export interface PdfReportMetadata {
  reportId: string;
  reportKind: PdfReportKind;
  version: string;
  generatedAt: Date;
  accessibilityProfile: typeof PDF_ACCESSIBILITY_PROFILES.client.id;
}

const REPORT_PREFIX: Record<PdfReportKind, string> = {
  compliance: 'CMP',
  backtest: 'BKT',
  portfolio: 'PRT',
  risk: 'RSK',
};

function createSecureReportNonce(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(6);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  throw new Error('Secure random source unavailable for PDF report identifier.');
}

export function createPdfReportMetadata(reportKind: PdfReportKind): PdfReportMetadata {
  const generatedAt = new Date();
  const dateSegment = generatedAt.toISOString().slice(0, 10).replace(/-/g, '');

  return {
    reportId: `CAI-${REPORT_PREFIX[reportKind]}-${dateSegment}-${createSecureReportNonce()}`,
    reportKind,
    version: CAPITAL_AI_VERSION,
    generatedAt,
    accessibilityProfile: PDF_ACCESSIBILITY_PROFILES.client.id,
  };
}

export function applyPdfDocumentMetadata(
  doc: jsPDF,
  metadata: PdfReportMetadata,
  title: string,
  subject: string,
): void {
  doc.setLanguage(PDF_ACCESSIBILITY_PROFILES.client.language);
  doc.setProperties({
    title,
    subject,
    author: 'CAPITAL-AI',
    creator: `CAPITAL-AI ${metadata.version}`,
    keywords: [
      'CAPITAL-AI',
      metadata.reportKind,
      metadata.reportId,
      `accessibility:${metadata.accessibilityProfile}`,
    ].join(','),
  });
}

type EmblemNode = readonly [number, number, number];
type EmblemEdge = readonly [number, number, number, number, 'gold' | 'cyan' | 'purple'];

// Print-safe flattening of the product's 3D network-node emblem. Coordinates
// intentionally mirror CapitalAiLogo while avoiding external images or fonts.
const EMBLEM_NODES: readonly EmblemNode[] = [
  [0.50, 0.54, 0.078],
  [0.16, 0.14, 0.046],
  [0.54, 0.18, 0.034],
  [0.84, 0.13, 0.050],
  [0.20, 0.42, 0.034],
  [0.34, 0.48, 0.038],
  [0.86, 0.46, 0.043],
  [0.16, 0.82, 0.054],
  [0.50, 0.90, 0.040],
  [0.84, 0.80, 0.058],
] as const;

const EMBLEM_EDGES: readonly EmblemEdge[] = [
  [0.16, 0.14, 0.34, 0.48, 'gold'],
  [0.34, 0.48, 0.16, 0.82, 'gold'],
  [0.16, 0.82, 0.50, 0.90, 'gold'],
  [0.50, 0.90, 0.84, 0.80, 'gold'],
  [0.84, 0.80, 0.86, 0.46, 'gold'],
  [0.86, 0.46, 0.84, 0.13, 'gold'],
  [0.84, 0.13, 0.54, 0.18, 'gold'],
  [0.54, 0.18, 0.50, 0.54, 'gold'],
  [0.50, 0.54, 0.50, 0.90, 'gold'],
  [0.50, 0.54, 0.34, 0.48, 'gold'],
  [0.50, 0.54, 0.86, 0.46, 'gold'],
  [0.16, 0.14, 0.84, 0.13, 'cyan'],
  [0.20, 0.42, 0.86, 0.46, 'cyan'],
  [0.50, 0.90, 0.20, 0.42, 'cyan'],
  [0.16, 0.14, 0.84, 0.80, 'purple'],
  [0.84, 0.13, 0.16, 0.82, 'purple'],
] as const;

function edgeColor(kind: EmblemEdge[4]): PdfRgb {
  if (kind === 'cyan') return PDF_BRAND.colors.cyan;
  if (kind === 'purple') return PDF_BRAND.colors.purple;
  return PDF_BRAND.colors.gold;
}

export function drawCapitalAiEmblem(
  doc: jsPDF,
  x: number,
  y: number,
  width = 18,
): void {
  const height = width * 0.9;

  for (const [x1, y1, x2, y2, kind] of EMBLEM_EDGES) {
    doc.setDrawColor(...edgeColor(kind));
    doc.setLineWidth(kind === 'gold' ? 0.45 : 0.22);
    doc.line(x + x1 * width, y + y1 * height, x + x2 * width, y + y2 * height);
  }

  for (const [nx, ny, radius] of EMBLEM_NODES) {
    doc.setFillColor(...PDF_BRAND.colors.gold);
    doc.setDrawColor(...PDF_BRAND.colors.goldDark);
    doc.setLineWidth(0.18);
    doc.circle(x + nx * width, y + ny * height, radius * width, 'FD');
  }
}

export function drawCapitalAiWordmark(
  doc: jsPDF,
  x: number,
  y: number,
  size = 17,
): void {
  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(size);
  doc.setTextColor(...PDF_BRAND.colors.gold);
  doc.text('CAPITAL-AI', x, y);
}

export function drawCapitalAiReportHeader(
  doc: jsPDF,
  metadata: PdfReportMetadata,
  subtitle: string,
): void {
  const { canvas, foreground, gold, textSecondary } = PDF_BRAND.colors;

  doc.setFillColor(...canvas);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 38, 210, 2, 'F');

  drawCapitalAiEmblem(doc, 12, 7, 16);
  drawCapitalAiWordmark(doc, 31, 17, 17);

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...foreground);
  doc.text(subtitle, 31, 27);

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(metadata.reportId, 195, 15, { align: 'right' });

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'normal');
  doc.setTextColor(...textSecondary);
  doc.text(
    `V${metadata.version} • ${metadata.generatedAt.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    195,
    26,
    { align: 'right' },
  );
}

export function drawCapitalAiRunningHeader(
  doc: jsPDF,
  metadata: PdfReportMetadata,
  pageNumber: number,
  pageCount: number,
): void {
  const { gold, borderLight, textSecondary } = PDF_BRAND.colors;

  doc.setFillColor(...gold);
  doc.rect(0, 0, 210, 4.5, 'F');
  drawCapitalAiEmblem(doc, 13, 6.2, 7);
  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(...textSecondary);
  doc.text(`CAPITAL-AI • REPORT ID: ${metadata.reportId} • V${metadata.version}`, 23, 11.5);
  doc.text(`SEITE ${pageNumber} VON ${pageCount}`, 196, 11.5, { align: 'right' });
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.line(14, 15, 196, 15);
}

export function drawCapitalAiFooter(
  doc: jsPDF,
  metadata: PdfReportMetadata,
  options: {
    y?: number;
    notice?: string;
    pageNumber?: number;
    pageCount?: number;
  } = {},
): void {
  const y = options.y ?? 282;
  const { borderLight, textSecondary } = PDF_BRAND.colors;

  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.line(14, y - 5, 196, y - 5);

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textSecondary);
  doc.text(options.notice ?? PDF_NOTICES.informational, 14, y, { maxWidth: 120 });

  const pageLabel =
    options.pageNumber && options.pageCount
      ? ` • ${options.pageNumber}/${options.pageCount}`
      : '';
  doc.text(`${metadata.reportId} • V${metadata.version}${pageLabel}`, 196, y, { align: 'right' });
}
