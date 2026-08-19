import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import {
  PDF_ACCESSIBILITY_PROFILES,
  PDF_NOTICES,
  applyPdfDocumentMetadata,
  createPdfReportMetadata,
  drawCapitalAiFooter,
  drawCapitalAiReportHeader,
} from '../../src/platform/PdfReporting/pdfBrand';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop();
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
});

function commandAvailable(command: string): boolean {
  const result = spawnSync(command, ['-v'], { encoding: 'utf8' });
  return result.status === 0;
}

function ppmDimensions(file: string): [number, number] {
  const data = fs.readFileSync(file);
  const text = data.subarray(0, Math.min(data.length, 512)).toString('latin1');
  const tokens = text
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith('#'))
    .join(' ')
    .trim()
    .split(/\s+/);
  if (tokens[0] !== 'P6') throw new Error(`Unexpected PPM magic: ${tokens[0]}`);
  return [Number(tokens[1]), Number(tokens[2])];
}

describe('CAPITAL-AI jsPDF rendering baseline', () => {
  it('creates an A4 report with shared branding, metadata and extractable text', () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const metadata = createPdfReportMetadata('backtest');
    applyPdfDocumentMetadata(
      doc,
      metadata,
      'CAPITAL-AI PDF Renderer Smoke',
      'P1/P2 deterministic renderer regression fixture',
    );
    drawCapitalAiReportHeader(doc, metadata, 'PDF RENDERER SMOKE');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('CAPITAL-AI PDF RENDERER SMOKE BODY', 15, 65);
    doc.text(`Accessibility profile: ${metadata.accessibilityProfile}`, 15, 75);
    drawCapitalAiFooter(doc, metadata, { y: 285, notice: PDF_NOTICES.informational });

    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 1);
    expect(metadata.accessibilityProfile).toBe(PDF_ACCESSIBILITY_PROFILES.client.id);
    expect(PDF_ACCESSIBILITY_PROFILES.client.pdfUa).toBe(false);
    expect(PDF_ACCESSIBILITY_PROFILES.client.tagged).toBe(false);

    const bytes = Buffer.from(doc.output('arraybuffer'));
    expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(4_000);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-pdf-smoke-'));
    tempDirs.push(tempDir);
    const pdf = path.join(tempDir, 'client-smoke.pdf');
    fs.writeFileSync(pdf, bytes);

    if (commandAvailable('pdftotext')) {
      const extracted = spawnSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
      expect(extracted.status).toBe(0);
      expect(extracted.stdout).toContain('CAPITAL-AI');
      expect(extracted.stdout).toContain(metadata.reportId);
      expect(extracted.stdout).toContain('PDF RENDERER SMOKE BODY');
    }

    if (commandAvailable('pdftoppm')) {
      const prefix = path.join(tempDir, 'page');
      const rendered = spawnSync(
        'pdftoppm',
        ['-f', '1', '-l', '1', '-singlefile', '-r', '72', pdf, prefix],
        { encoding: 'utf8' },
      );
      expect(rendered.status).toBe(0);
      const ppm = `${prefix}.ppm`;
      expect(fs.existsSync(ppm)).toBe(true);
      const [width, height] = ppmDimensions(ppm);
      expect(width).toBeGreaterThanOrEqual(590);
      expect(width).toBeLessThanOrEqual(600);
      expect(height).toBeGreaterThanOrEqual(837);
      expect(height).toBeLessThanOrEqual(847);
    }
  });
});
