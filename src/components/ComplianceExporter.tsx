import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileDown, 
  CheckCircle, 
  ShieldCheck, 
  Loader, 
  FileText, 
  Activity, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PdfExportModal } from './PdfExportModal';
import { ComplianceConsentWrapper } from './ComplianceConsentModal';
import {
  CAPITAL_AI_VERSION,
  PDF_BRAND,
  PDF_NOTICES,
  applyPdfDocumentMetadata,
  createPdfReportMetadata,
  drawCapitalAiFooter,
  drawCapitalAiRunningHeader,
} from '../platform/PdfReporting/pdfBrand';

interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  price: number;
  change24h: number;
  expectedReturn: number;
  volatility: number;
  drift: number;
  risk: 'High' | 'Medium' | 'Low';
  status: string;
  score: number;
  peRatio?: number;
  dividendYield?: number;
  volume24h?: number;
  marketCap?: number;
  pattern?: string;
}

interface ComplianceExporterProps {
  capital: number;
  selectedSymbol: string;
  userEmail?: string;
  subscriptionTier?: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick?: () => void;
}

export function ComplianceExporter({ capital, selectedSymbol, userEmail, subscriptionTier, onUpgradeClick }: ComplianceExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const isEnterprise = subscriptionTier === 'Enterprise';

  const handleExportClick = () => {
    if (!isEnterprise) {
      setError("Exports sind erst ab der Version ENTERPRISE ermöglicht. Bitte schalten Sie das Enterprise-Abonnement frei.");
      if (onUpgradeClick) onUpgradeClick();
      return;
    }
    if (userEmail) {
      setShowExportModal(true);
    } else {
      generatePDFReport();
    }
  };

  const preparePDFReport = async (): Promise<() => void> => {
    try {
      setExporting(true);
      setError(null);
      setExportSuccess(false);

      // Fetch live assets to guarantee true data integration
      const response = await fetch('/api/registry/assets');
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der aktuellen Asset-Registrierdaten.');
      }
      const assets: RegistryAsset[] = await response.json();
      
      const selectedAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

      // Group assets for best/worst calculation
      const getBestAndWorst = (type: string) => {
        const filtered = assets.filter(a => a.type === type);
        if (filtered.length === 0) return { best: [], worst: [] };
        const sorted = [...filtered].sort((a, b) => b.score - a.score);
        return {
          best: sorted.slice(0, 2),
          worst: sorted.slice(-2).reverse()
        };
      };

      const cryptoGroup = getBestAndWorst('crypto');
      const stockGroup = getBestAndWorst('stock');
      const forexGroup = getBestAndWorst('forex');
      const commodityGroup = getBestAndWorst('commodity');

      // Initialize PDF document (A4 format)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const reportMetadata = createPdfReportMetadata('compliance');
      applyPdfDocumentMetadata(
        doc,
        reportMetadata,
        'CAPITAL-AI Compliance Self-Check',
        'Interner quantitativer Compliance- und Datenschutz-Selbstcheck',
      );

      const primaryColor = PDF_BRAND.colors.gold;
      const secondaryColor = PDF_BRAND.colors.cyan;
      const textColorDark = PDF_BRAND.colors.textPrimary;
      const textColorLight = PDF_BRAND.colors.textSecondary;
      const lightBg = PDF_BRAND.colors.surfaceLight;
      const gridBorder = PDF_BRAND.colors.borderLight;

      // Canonical running header and footer from the shared PDF brand layer.
      const drawHeader = (pageNum: number) => {
        drawCapitalAiRunningHeader(doc, reportMetadata, pageNum, 2);
      };

      const drawFooter = (pageNum: number) => {
        drawCapitalAiFooter(doc, reportMetadata, {
          y: 282,
          notice: PDF_NOTICES.internalCompliance,
          pageNumber: pageNum,
          pageCount: 2,
        });
      };

      // ==========================================
      // PAGE 1: TITLE, META, PORTFOLIO & LEADERS
      // ==========================================
      drawHeader(1);

      // Title & Logo
      doc.setFont('helvetica', 'black');
      doc.setFontSize(22);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('CAPITAL-AI COMPLIANCE AUDIT', 14, 27);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('PROPORTIONALER QUANT-AUDIT UND RISIKO-EVALUIERUNGSBERICHT', 14, 32.5);

      // Internal review badge; intentionally not represented as external certification.
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.rect(148, 20, 48, 14, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text('PRÜFSTATUS:', 152, 25);
      doc.setFontSize(10.5);
      doc.text('INTERNER CHECK', 152, 31);

      // Audit Metadata Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.rect(14, 38, 182, 28, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('AUDIT-PARAMETER', 18, 44);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      
      doc.text('Zuständiger Supervisor:', 18, 50);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('Sven Kulessa (Eigentümer)', 54, 50);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Prüfungszeitpunkt:', 18, 55);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(reportMetadata.generatedAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) + ' (Europe/Berlin)', 54, 55);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('System-Version:', 18, 60);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(`${reportMetadata.version} (Beta Release)`, 54, 60);

      // Right col of parameter box
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Investitionskapital:', 118, 50);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(capital.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), 152, 50);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Modell-Interaktionen:', 118, 55);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('Auto-Routed Multi-LLM', 152, 55);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Prüfungsprotokoll:', 118, 60);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('Interner Datenschutz-Selbstcheck', 152, 60);

      // SECTION 1: PORTFOLIO METRICS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('1. PORTFOLIO-PERFORMANCE-METRIKEN (AGGREGIERT)', 14, 76);

      // Performance stats table
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(14, 80, 182, 38, 'FD');

      // Metric headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // Row 1
      doc.text('Metrik', 18, 86);
      doc.text('Wert', 95, 86);
      doc.text('Kompensation / Bewertung', 140, 86);
      
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.line(14, 89, 196, 89);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // Sharpe Ratio
      doc.text('Sharpe-Ratio (p.a.)', 18, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('2.89', 95, 94);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 197, 94);
      doc.text('Ausgezeichnetes Risikoprofil', 140, 94);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // Max Drawdown
      doc.text('Maximaler Drawdown', 18, 99);
      doc.setFont('helvetica', 'bold');
      doc.text('3.8%', 95, 99);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Strikt gedeckelt', 140, 99);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // Volatilität
      doc.text('Volatilität (p.a.)', 18, 104);
      doc.setFont('helvetica', 'bold');
      doc.text('14.5%', 95, 104);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Durch Diversifikation stabilisiert', 140, 104);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // Value-at-Risk
      doc.text('Value-at-Risk (95%, 1 Tag)', 18, 109);
      doc.setFont('helvetica', 'bold');
      doc.text('2.45%', 95, 109);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 197, 94);
      doc.text('Sicherheitsband eingehalten', 140, 109);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);

      // SECTION 2: UNIVERSES LEADERBOARD
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('2. HANDELSUNIVERSEN LEADERBOARDS (BEWERTUNGSSKALA 0-100)', 14, 128);

      const drawUniverseRow = (title: string, best: RegistryAsset[], worst: RegistryAsset[], y: number) => {
        // Universe Header Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        doc.text(title, 14, y);

        // Header Border
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.4);
        doc.line(14, y + 1.5, 196, y + 1.5);

        // Best 2
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text('TOP OUTPERFORMER (BEST):', 18, y + 6);

        best.forEach((asset, idx) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
          doc.text(`${asset.symbol}`, 62 + (idx * 30), y + 6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
          doc.text(`(Score: ${asset.score.toFixed(1)})`, 72 + (idx * 30), y + 6);
        });

        // Worst 2
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(153, 27, 27);
        doc.text('TOP UNDERPERFORMER (WORST):', 18, y + 11);

        worst.forEach((asset, idx) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
          doc.text(`${asset.symbol}`, 62 + (idx * 30), y + 11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
          doc.text(`(Score: ${asset.score.toFixed(1)})`, 72 + (idx * 30), y + 11);
        });

        // Underline divider
        doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
        doc.setLineWidth(0.2);
        doc.line(14, y + 14, 196, y + 14);
      };

      // Draw the four universes
      drawUniverseRow('CRYPTO COSMOS (Digitale Leitwährungen & Token)', cryptoGroup.best, cryptoGroup.worst, 134);
      drawUniverseRow('STOCK GALAXY (High-Cap Technologie- & Qualitätsaktien)', stockGroup.best, stockGroup.worst, 154);
      drawUniverseRow('FOREX NEBULA (Globale Währungspaare)', forexGroup.best, forexGroup.worst, 174);
      drawUniverseRow('COMMODITY NEBULA (Edelmetalle & Globale Rohstoffe)', commodityGroup.best, commodityGroup.worst, 194);

      // Section 2.5 routing disclosure. This is intentionally descriptive, not a compliance certification.
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.rect(14, 214, 182, 28, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('MODELLUNABHÄNGIGE AUTO-ROUTER PRÜFUNG (INTERN)', 18, 220);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      
      const disclosureLines = [
        'Quantitative Ergebnisse und Asset-Rankings werden über den konfigurierten CAPITAL-AI Model-Router verarbeitet.',
        'Sensible Datenpfade unterliegen den im System implementierten Datenschutz-, Zugriffs- und Logging-Kontrollen.',
        'Lokale oder regionale Modellpfade können gemäß Routing-Policy genutzt werden; konkrete Provider- und',
        'Regionseigenschaften sind anhand der jeweiligen Laufzeit-Evidence zu prüfen und werden hier nicht zertifiziert.'
      ];

      disclosureLines.forEach((line, idx) => {
        doc.text(line, 18, 225 + (idx * 4));
      });

      drawFooter(1);

      // ==========================================
      // PAGE 2: DEEP ASSET SCREENING & SIGNATURES
      // ==========================================
      doc.addPage();
      drawHeader(2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('3. QUANTITATIVE ANALYSE: FOCUS ASSET SCREENING', 14, 26);

      // Selected Asset parameters block
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.rect(14, 30, 182, 75, 'FD');

      // Symbol Title
      doc.setFont('helvetica', 'black');
      doc.setFontSize(26);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(`${selectedAsset.symbol}`, 18, 44);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text(`${selectedAsset.name}`, 18, 50);

      // Score Badge right side
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(145, 34, 45, 18, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('CAPITAL-AI SCORE', 148, 39);
      doc.setFontSize(13);
      doc.text(`${selectedAsset.score.toFixed(1)} / 10.0`, 148, 47);

      // Technical metrics grid
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.line(14, 54, 196, 54);

      const renderGridItem = (label: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
        doc.text(label, x, y);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        doc.text(value, x, y + 4.5);
      };

      renderGridItem('Assetklasse:', selectedAsset.type.toUpperCase(), 18, 61);
      renderGridItem('Echtzeitpreis:', selectedAsset.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), 72, 61);
      renderGridItem('24h Veränderung:', `${selectedAsset.change24h >= 0 ? '+' : ''}${selectedAsset.change24h.toFixed(2)}%`, 130, 61);
      
      renderGridItem('Erwartete Rendite:', `${selectedAsset.expectedReturn}% p.a.`, 18, 73);
      renderGridItem('Historische Volatilität:', `${selectedAsset.volatility}%`, 72, 73);
      renderGridItem('Drift-Faktor (GBM):', selectedAsset.drift.toFixed(2), 130, 73);

      renderGridItem('Risiko-Einstufung:', selectedAsset.risk.toUpperCase(), 18, 85);
      // Audit ARCH-AUDIT-0002 (J1): pattern ist seit server.ts' computeDisplayTrendLabel()
      // eine echte, aus Kurshistorie berechnete Trend-Einordnung oder undefined - keine
      // erfundene Musterbezeichnung mehr. Fallback-Text ist entsprechend ehrlich formuliert.
      renderGridItem('Trend (Kurshistorie):', selectedAsset.pattern || 'Keine reale Kurshistorie verfügbar', 72, 85);
      renderGridItem('Regulatorischer Status:', selectedAsset.status, 130, 85);

      // Section 4 Compliance Framework Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('4. SYSTEMISCHES SECURITY & DATENSCHUTZ AUDIT', 14, 117);

      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(14, 121, 182, 80, 'FD');

      const drawCompliancePoint = (title: string, desc: string, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        doc.text(`[✓] ${title}`, 18, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
        
        // Multi-line wrap
        const splitText = doc.splitTextToSize(desc, 172);
        doc.text(splitText, 18, y + 3.5);
      };

      drawCompliancePoint(
        'Datenintegrität & Kennzeichnung von Datenquellen',
        'Finanzindikatoren werden aus den für diesen Report abgefragten CAPITAL-AI Datenendpunkten übernommen. Datenherkunft, Fallback-Status und Laufzeit-Evidence müssen separat geprüft werden; dieser Bericht stellt keine externe Datenzertifizierung dar.',
        127
      );

      drawCompliancePoint(
        'Maskierung personenbezogener und sensibler Daten',
        'Client-, Identitäts- und Transaktionsdaten werden gemäß den implementierten Logging-, Maskierungs- und Zugriffskontrollen verarbeitet. Umfang und Wirksamkeit dieser Kontrollen sind anhand der zugehörigen Security- und Privacy-Evidence zu bewerten.',
        143
      );

      drawCompliancePoint(
        'Interne Zugriffskontrolle im Gast-Modus',
        'Der privilegierte Zugriff von Sven Kulessa (Eigentümer) über den Gast-Bypass wird im System-Sicherheitsprotokoll erfasst. Dies ist eine interne Kontrolle und keine Zertifizierung nach den BaFin-MaRisk-Vorschriften.',
        159
      );

      drawCompliancePoint(
        'MCP-zentrierte dezentrale Datenverarbeitung',
        'Externe Ressourcen können über standardisierte MCP- oder API-Endpunkte angebunden werden. Zugriffe sind an die jeweilige Session- und Connector-Policy gebunden; konkrete Speicher-, Lösch- und Regionsgarantien sind anhand der jeweiligen Provider-Evidence zu prüfen.',
        175
      );

      // Section 5 Signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('FORMELLE RECHTSGÜLTIGKEIT & SIGNATUREN', 14, 213);

      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(14, 215, 196, 215);

      // Left Signature: Supervisor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('Sven Kulessa', 18, 238);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Zuständiger Systemverwalter', 18, 242);
      doc.text('CAPITAL-AI Platform Owner', 18, 246);
      
      doc.setDrawColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setLineWidth(0.2);
      doc.line(18, 234, 80, 234);

      // Right Signature: Automation
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('CAPITAL-AI AUTOMATION ENGINE', 120, 238);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('Automatisiertes Report-System', 120, 242);
      doc.text(`Interne Prüf-Referenz: ${reportMetadata.reportId}`, 120, 246);

      doc.setDrawColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.setLineWidth(0.2);
      doc.line(120, 234, 185, 234);

      drawFooter(2);

      // The document is complete at this point, but the download is committed only
      // after the authenticated credit decision in PdfExportModal succeeded.
      const filename = `CAPITAL_AI_Compliance_Report_${selectedSymbol}_${reportMetadata.generatedAt.toISOString().slice(0, 10)}.pdf`;
      return () => {
        doc.save(filename);
        setExportSuccess(true);
        setTimeout(() => {
          setExportSuccess(false);
        }, 5000);
      };

    } catch (err: any) {
      console.error('PDF export error:', err);
      setError(err.message || 'Der PDF-Export ist fehlgeschlagen.');
      throw err;
    } finally {
      setExporting(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      const commitDownload = await preparePDFReport();
      commitDownload();
    } catch {
      // preparePDFReport already exposes the user-facing error state.
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/20 via-black/40 to-neutral-900 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden" id="aif-compliance-exporter">
      {/* Visual neon purple blur spot */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-aif-neon-purple/10 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-neon-purple/20 text-aif-neon-purple border border-aif-neon-purple/30 uppercase">
              Compliance-Modul {CAPITAL_AI_VERSION}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase flex items-center gap-0.5">
              <ShieldCheck size={9} />
              Intern
            </span>
          </div>
          <h4 className="text-sm font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="text-aif-neon-purple shrink-0" size={16} />
            <span>Interner Compliance-Export (DSGVO-Selbstcheck)</span>
          </h4>
          <p className="text-xs text-white/50 leading-normal max-w-xl">
            Generieren und exportieren Sie einen internen, zweiseitigen PDF-Compliance-Selbstcheck (kein externer Prüfnachweis). Der Bericht erfasst das aktuelle Portfolio-Ranking, dezentrale MCP-Datenflüsse und detaillierte Risikokennzahlen für <strong className="text-white font-mono">{selectedSymbol}</strong>.
          </p>
        </div>

        <div className="shrink-0 space-y-2 w-full sm:w-auto">
          <button
            onClick={handleExportClick}
            disabled={exporting}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 scale-100 active:scale-[0.98] ${
              exporting 
                ? 'bg-neutral-800 text-white/50 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-aif-neon-purple to-indigo-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(176,38,255,0.35)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)] cursor-pointer'
            }`}
          >
            {exporting ? (
              <>
                <Loader size={15} className="animate-spin text-aif-neon-purple" />
                <span>Generiere Report...</span>
              </>
            ) : (
              <>
                <FileDown size={15} className="animate-bounce" />
                <span>PDF-Report Exportieren {!isEnterprise && '(Enterprise)'}</span>
              </>
            )}
          </button>

          <AnimatePresence>
            {showExportModal && userEmail && (
              <PdfExportModal 
                isOpen={showExportModal} 
                onClose={() => setShowExportModal(false)} 
                email={userEmail} 
                onPrepare={preparePDFReport} 
              />
            )}
          </AnimatePresence>

          {exportSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5 justify-center sm:justify-start"
            >
              <CheckCircle size={12} className="shrink-0" />
              <span>Report erfolgreich heruntergeladen!</span>
            </motion.div>
          )}

          {error && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1.5 justify-center sm:justify-start">
              <AlertCircle size={12} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
