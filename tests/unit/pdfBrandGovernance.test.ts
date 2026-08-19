import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const activePdfSources = [
  'src/components/ComplianceExporter.tsx',
  'src/components/BacktestEngine.tsx',
  'src/components/PortfolioBacktester.tsx',
];

const forbiddenLegacyPdfClaims = [
  'AIF-Capital',
  'AIF_Capital_',
  'AIF_Compliance_Report_',
  'DSGVO-konforme quantitative Echtzeitanalyse',
  'Compliant with Art. 30 GDPR / BFSG Accessibility Standards',
  'COMPLIANCE-STATUS:',
  'VERIFIZIERT ✓',
  'GDPR/DSGVO Filter OK',
];

describe('P0 CAPITAL-AI PDF brand governance', () => {
  it('routes every active jsPDF report through the canonical brand contract', () => {
    for (const sourcePath of activePdfSources) {
      const source = read(sourcePath);
      expect(source).toContain("platform/PdfReporting/pdfBrand");
      expect(source).toContain('createPdfReportMetadata(');
      expect(source).toContain('applyPdfDocumentMetadata(');
    }
  });

  it('keeps known legacy names and unsupported certification claims out of active PDF sources', () => {
    const combined = activePdfSources.map(read).join('\n');

    for (const forbidden of forbiddenLegacyPdfClaims) {
      expect(combined).not.toContain(forbidden);
    }

    expect(combined).not.toContain('System-Version: 0.5.4');
    expect(combined).not.toContain('Version 0.7.0');
  });

  it('uses a secure immutable report-id source instead of Math.random', () => {
    const brandContract = read('src/platform/PdfReporting/pdfBrand.ts');
    const complianceSource = read('src/components/ComplianceExporter.tsx');

    expect(brandContract).toContain('crypto.randomUUID');
    expect(brandContract).toContain('crypto.getRandomValues');
    expect(brandContract).not.toContain('Math.random');
    expect(complianceSource).not.toContain('Math.random');
    expect(complianceSource).toContain('drawCapitalAiRunningHeader(doc, reportMetadata');
  });

  it('derives the shared runtime/report version from package.json at build time', () => {
    const packageJson = JSON.parse(read('package.json')) as { version: string };
    const viteConfig = read('vite.config.ts');
    const brandContract = read('src/platform/PdfReporting/pdfBrand.ts');
    const runtimeBrand = read('src/platform/Branding/runtimeBrand.ts');

    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+(?:[-+].+)?$/);
    expect(viteConfig).toContain("fs.readFileSync(path.resolve(__dirname, 'package.json')");
    expect(viteConfig).toContain('__CAPITAL_AI_VERSION__');
    expect(runtimeBrand).toContain('CAPITAL_AI_VERSION = __CAPITAL_AI_VERSION__');
    expect(brandContract).toContain("from '../Branding/runtimeBrand'");
    expect(brandContract).toContain('export { CAPITAL_AI_VERSION }');
  });

  it('keeps the archived risk module free of executable PDF/export code', () => {
    const riskModule = read('src/components/RealTimeRiskAssessment.tsx');

    expect(riskModule).not.toContain("from 'jspdf'");
    expect(riskModule).not.toContain('new jsPDF');
    expect(riskModule).not.toContain('AIF-CAPITAL');
    expect(riskModule).not.toContain('AIF_Capital_');
    expect(riskModule).toContain('return null;');
  });
});
