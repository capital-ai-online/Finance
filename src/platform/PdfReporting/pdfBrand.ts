import type { jsPDF } from 'jspdf';

declare const __CAPITAL_AI_VERSION__: string;

export type PdfRgb = [number, number, number];

export const CAPITAL_AI_VERSION = __CAPITAL_AI_VERSION__;

export const PDF_BRAND = {
  colors: {
    canvas: [24, 24, 27] as PdfRgb,
    foreground: [255, 255, 255] as PdfRgb,
    gold: [245, 196, 83] as PdfRgb,
    goldDark: [212, 160, 23] as PdfRgb,
    cyan: [13, 221, 221] as PdfRgb,
    purple: [176, 38, 255] as PdfRgb,
    textPrimary: [29, 36, 48] as PdfRgb,
    textSecondary: [100, 116, 139] as PdfRgb,
    surfaceLight: [248, 250, 252] as PdfRgb,
    borderLight: [226, 232, 240] as PdfRgb,
    success: [74, 222, 128] as PdfRgb,
    warning: [251, 191, 36] as PdfRgb,
    danger: [248, 113, 113] as PdfRgb,
  },
  fonts: {
    pdfSafeSans: 'helvetica',
    productSans: 'Poppins',
    productDisplay: 'Montserrat',
    productMono: 'JetBrains Mono',
  },
} as const;

export const PDF_NOTICES = {
  informational:
    'Automatisch erzeugter CAPITAL-AI Analysebericht. Keine Anlage-, Rechts- oder Steuerberatung.',
  internalCompliance:
    'Interner CAPITAL-AI Selbstcheck. Keine externe Zertifizierung, Rechtsprüfung oder behördliche Freigabe.',
} as const;

export type PdfReportKind = 'compliance' | 'backtest' | 'portfolio' | 'risk';

export interface PdfReportMetadata {
  reportId: string;
  reportKind: PdfReportKind;
  version: string;
  generatedAt: Date;
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
  };
}

export function applyPdfDocumentMetadata(
  doc: jsPDF,
  metadata: PdfReportMetadata,
  title: string,
  subject: string,
): void {
  doc.setProperties({
    title,
    subject,
    author: 'CAPITAL-AI',
    creator: `CAPITAL-AI ${metadata.version}`,
    keywords: `CAPITAL-AI,${metadata.reportKind},${metadata.reportId}`,
  });
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

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...gold);
  doc.text('CAPITAL-AI', 15, 18);

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...foreground);
  doc.text(subtitle, 15, 28);

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(metadata.reportId, 195, 16, { align: 'right' });

  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'normal');
  doc.setTextColor(...textSecondary);
  doc.text(
    `V${metadata.version} • ${metadata.generatedAt.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`,
    195,
    27,
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
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFont(PDF_BRAND.fonts.pdfSafeSans, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textSecondary);
  doc.text(`CAPITAL-AI • REPORT ID: ${metadata.reportId} • V${metadata.version}`, 14, 13);
  doc.text(`SEITE ${pageNumber} VON ${pageCount}`, 196, 13, { align: 'right' });
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
