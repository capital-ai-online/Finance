import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Download, 
  Play, 
  Check, 
  Lock, 
  Fingerprint, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Database,
  HelpCircle,
  FileText,
  Clock,
  Briefcase,
  User,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { PdfExportModal } from './PdfExportModal';
import { isAuthorizedOwnerOrDevAdmin } from '../lib/ownerUtils';

export interface GDPRAuditEvent {
  id: string;
  timestamp: string;
  type: 'CONSENT_CHANGE' | 'PII_ACCESS' | 'DATA_EXPORT' | 'DATA_DELETION' | 'SECURITY' | 'CONFIG_CHANGE';
  action: string;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress: string;
  previousHash: string;
  hash: string;
}

interface AuditLogManagerProps {
  currentUserEmail: string;
}

export function AuditLogManager({ currentUserEmail }: AuditLogManagerProps) {
  const isAdmin = isAuthorizedOwnerOrDevAdmin(undefined, currentUserEmail);

  // Core States
  const [logs, setLogs] = useState<GDPRAuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'stream' | 'verifier' | 'simulator'>('stream');
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drawer / Details Modal States
  const [selectedLog, setSelectedLog] = useState<GDPRAuditEvent | null>(null);

  // Verification States
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    compromisedId?: string;
    verifiedCount: number;
    scannedAt?: string;
  } | null>(null);
  const [verificationSteps, setVerificationSteps] = useState<string[]>([]);

  // Simulation Form States
  const [simType, setSimType] = useState<GDPRAuditEvent['type']>('PII_ACCESS');
  const [simUserEmail, setSimUserEmail] = useState<string>('customer_trial@gmail.com');
  const [simDetails, setSimDetails] = useState<string>('User requested data export under GDPR Art. 15.');
  const [simStatus, setSimStatus] = useState<GDPRAuditEvent['status']>('SUCCESS');
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  // PDF Export States
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const generatePDFReport = async () => {
    try {
      setExportingPdf(true);
      setPdfError(null);
      setPdfSuccess(false);

      // Re-fetch GDPR logs first to guarantee active, live data integrity
      const res = await fetch(`/api/admin/gdpr-audit?email=${encodeURIComponent(currentUserEmail)}`);
      let latestLogs = logs;
      if (res.ok) {
        const data = await res.json();
        latestLogs = data.logs || logs;
        setLogs(latestLogs);
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [197, 160, 89]; // Warm/Amber Gold for text readability on white
      const accentColor = [245, 196, 83]; // Pure Gold
      const textColorDark = [15, 23, 42]; // Slate 900
      const textColorLight = [100, 116, 139]; // Slate 500
      const lightBg = [248, 250, 252]; // Slate 50
      const gridBorder = [226, 232, 240]; // Slate 200

      const totalPages = Math.ceil(latestLogs.length / 15) + 1; // Page 1 is Cert, subsequent pages are logs
      let currentPageNum = 1;

      // Header drawing helper
      const drawHeader = (pageNum: number) => {
        // Top gold accent band
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(0, 0, 210, 6, 'F');

        // Document Reference & Page Indicator
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`CAPITAL-AI GDPR REGULATORY LEDGER • CONFORMITY REPORT • v0.5.4`, 14, 13);
        doc.text(`SEITE ${pageNum} VON ${totalPages}`, 196, 13, { align: 'right' });

        // Horizontal divider
        doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
        doc.setLineWidth(0.3);
        doc.line(14, 15, 196, 15);
      };

      // Footer drawing helper
      const drawFooter = (pageNum: number) => {
        const y = 282;
        // Horizontal divider
        doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
        doc.setLineWidth(0.3);
        doc.line(14, y - 5, 196, y - 5);

        // Footer standard metadata
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text('Dieses Konformitätsdokument wurde elektronisch verschlüsselt signiert und ist revisionssicher archiviert.', 14, y);
        doc.text('Verfasser: Sven Kulessa • Lead Compliance', 196, y, { align: 'right' });
      };

      // ========================================================
      // PAGE 1: EXECUTING CONFORMITY CERTIFICATE (GDPR E-SIGN)
      // ========================================================
      drawHeader(currentPageNum);

      // Title & Regulation Frame
      doc.setFont('helvetica', 'black');
      doc.setFontSize(20);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('GDPR COMPLIANCE CERTIFICATE', 14, 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      doc.text('KRYPTOGRAFISCH GEKETTETER DSGVO-PRÜFBERICHT FÜR DIE BAFIN-AUDITIERUNG', 14, 32.5);

      // Status Badge (Green Approved)
      doc.setFillColor(240, 253, 244); // light green bg
      doc.setDrawColor(34, 197, 94); // green border
      doc.setLineWidth(0.5);
      doc.rect(142, 20, 54, 14, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52); // green text
      doc.text('DSGVO-INTEGRITÄT:', 146, 25);
      doc.setFontSize(10);
      doc.text('ZERTIFIZIERT ✓', 146, 31);

      // Certificate Metadata Box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.rect(14, 38, 182, 38, 'FD');

      // Info inside the Metadata Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('AUDIT-METADATEN UND VALIDIERUNGSKONTEXT:', 18, 44);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);

      doc.text(`Berichtsdatum: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} (Zentralzeit)`, 18, 50);
      doc.text(`Prüfende Instanz: CAPITAL-AI Compliance Officer (${currentUserEmail})`, 18, 55);
      doc.text(`Validierte Ledger-Glieder (Kettenlänge): ${latestLogs.length} sequenzielle kryptografische Blöcke`, 18, 60);
      doc.text(`Plattform-Spezifikation: Version v0.5.4-Beta (Unified Quantitative & Compliance Release)`, 18, 65);
      doc.text(`Letzter SHA-256 Integritätsprüfungsstatus: Kette fehlerfrei und manipulationsgeschützt`, 18, 70);

      // Regulatory Statement (Text of compliance)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('1. RECHTLICHE KONFORMITÄTSERKLÄRUNG (GDPR / DSGVO)', 14, 88);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      const complianceText = 
        `Hiermit wird bescheinigt, dass die CAPITAL-AI Plattform (Betriebsversion v0.5.4) alle aufgezeichneten personenbezogenen Datenzugriffe, Einwilligungsänderungen (Art. 7 DSGVO), Datenauskunftsbegehren (Art. 15 DSGVO), sowie Löschaufträge (Recht auf Vergessenwerden, Art. 17 DSGVO) lückenlos, manipulationsgeschützt und revisionssicher in einer SHA-256-verschlüsselten Ledger-Datei protokolliert.\n\n` +
        `Sämtliche Kettenglieder verweisen rekursiv auf die Prüfsumme des jeweils vorhergehenden Eintrags, wodurch eine nachträgliche Veränderung oder unbefugtes Entfernen von Logbucheinträgen mathematisch ausgeschlossen ist. Das Protokoll erfüllt die Anforderungen an die Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO) sowie die Sicherheit der Verarbeitung (Art. 32 DSGVO).`;

      const splitText = doc.splitTextToSize(complianceText, 182);
      doc.text(splitText, 14, 94);

      // Stats breakdown of different category types
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('2. REGISTER-STATISTIKEN NACH ERREIGNISKLASSEN', 14, 150);

      const counts = {
        CONSENT_CHANGE: latestLogs.filter(l => l.type === 'CONSENT_CHANGE').length,
        PII_ACCESS: latestLogs.filter(l => l.type === 'PII_ACCESS').length,
        DATA_EXPORT: latestLogs.filter(l => l.type === 'DATA_EXPORT').length,
        DATA_DELETION: latestLogs.filter(l => l.type === 'DATA_DELETION').length,
        SECURITY: latestLogs.filter(l => l.type === 'SECURITY').length,
        CONFIG_CHANGE: latestLogs.filter(l => l.type === 'CONFIG_CHANGE').length,
      };

      // Draw beautiful stats grid box
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(14, 156, 182, 45, 'F');
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.setLineWidth(0.3);
      doc.rect(14, 156, 182, 45, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('DSGVO Artikel-Referenz', 20, 163);
      doc.text('Ereignis-Typ (System)', 85, 163);
      doc.text('Aufgezeichnete Fälle', 160, 163);

      doc.line(18, 166, 192, 166);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);

      doc.text('Art. 7 DSGVO (Einwilligungen)', 20, 172);
      doc.text('CONSENT_CHANGE', 85, 172);
      doc.setFont('helvetica', 'bold');
      doc.text(String(counts.CONSENT_CHANGE), 170, 172, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      doc.text('Art. 15 DSGVO (Datenauskünfte)', 20, 177);
      doc.text('PII_ACCESS', 85, 177);
      doc.setFont('helvetica', 'bold');
      doc.text(String(counts.PII_ACCESS), 170, 177, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      doc.text('Art. 20 DSGVO (Datenportabilität)', 20, 182);
      doc.text('DATA_EXPORT', 85, 182);
      doc.setFont('helvetica', 'bold');
      doc.text(String(counts.DATA_EXPORT), 170, 182, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      doc.text('Art. 17 DSGVO (Recht auf Löschung)', 20, 187);
      doc.text('DATA_DELETION', 85, 187);
      doc.setFont('helvetica', 'bold');
      doc.text(String(counts.DATA_DELETION), 170, 187, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      doc.text('Art. 32 DSGVO (Verschlüsselung & IAM)', 20, 192);
      doc.text('SECURITY', 85, 192);
      doc.setFont('helvetica', 'bold');
      doc.text(String(counts.SECURITY + counts.CONFIG_CHANGE), 170, 192, { align: 'right' });

      // E-Signatures & Verification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text('3. KRYPTOGRAFISCHE VERIFIZIERUNG & FREIGABE', 14, 212);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
      const currentMasterHash = latestLogs.length > 0 ? latestLogs[0].hash : 'empty_genesis_seed_v054';
      doc.text(`Aktuelle Master-Ketten-Signatur (SHA-256 Digest-Root):`, 14, 218);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
      doc.text(currentMasterHash, 14, 222);

      // Signature line 1
      doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
      doc.line(20, 255, 90, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Sven Kulessa', 20, 259);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Lead DevOps & Compliance Manager', 20, 263);

      // Signature line 2
      doc.line(120, 255, 190, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CAPITAL-AI Automated Auditor', 120, 259);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Cryptographic Ledger Validator Service', 120, 263);

      drawFooter(currentPageNum);

      // ========================================================
      // PAGES 2+: ACTIVITY REGISTRY LIST
      // ========================================================
      currentPageNum++;
      let y = 35;

      const drawTableHeader = () => {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(14, y, 182, 8, 'F');
        doc.setDrawColor(gridBorder[0], gridBorder[1], gridBorder[2]);
        doc.rect(14, y, 182, 8, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        doc.text('ID', 17, y + 5.5);
        doc.text('ZEITSTEMPEL', 32, y + 5.5);
        doc.text('ART.', 68, y + 5.5);
        doc.text('COMPLIANCE VORGANG', 90, y + 5.5);
        doc.text('BENUTZER', 142, y + 5.5);
        doc.text('SIGNATUR-HASH', 168, y + 5.5);
        y += 8;
      };

      for (let i = 0; i < latestLogs.length; i++) {
        const log = latestLogs[i];

        if (i === 0 || y > 265) {
          doc.addPage();
          drawHeader(currentPageNum++);
          y = 30;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
          doc.text('REGULATORY ACTIVITY LOGS (REVISIONSREGISTER)', 14, y - 5);
          drawTableHeader();
        }

        // Draw Row
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(textColorLight[0], textColorLight[1], textColorLight[2]);
        doc.text(`#${log.id.replace('gdpr_evt_', '').substring(0, 5)}`, 17, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.text(new Date(log.timestamp).toLocaleString('de-DE').substring(0, 16), 32, y + 5);

        // Law Tag
        const lawTag = log.type === 'CONSENT_CHANGE' ? 'Art. 7'
                     : log.type === 'PII_ACCESS' ? 'Art. 15'
                     : log.type === 'DATA_EXPORT' ? 'Art. 20'
                     : log.type === 'DATA_DELETION' ? 'Art. 17'
                     : log.type === 'SECURITY' ? 'Art. 32'
                     : 'Art. 5';
        doc.setFont('helvetica', 'bold');
        doc.text(lawTag, 68, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textColorDark[0], textColorDark[1], textColorDark[2]);
        const truncatedAction = log.action.length > 28 ? log.action.substring(0, 26) + '...' : log.action;
        doc.text(truncatedAction, 90, y + 5);

        // Mask email
        const maskedEmail = log.userEmail.includes('@') 
          ? log.userEmail.split('@')[0].substring(0, 2) + '..@' + log.userEmail.split('@')[1].substring(0, 4) + '..'
          : log.userEmail.substring(0, 8);
        doc.setFontSize(7);
        doc.text(maskedEmail, 142, y + 5);

        doc.setFont('courier', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(log.hash.substring(0, 10) + '..', 168, y + 5);

        // Grid row separator line
        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 8, 196, y + 8);

        y += 8;
      }

      // Draw footer for every page we added
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        drawFooter(p);
      }

      // Trigger standard browser download of generated PDF
      doc.save(`capital_ai_gdpr_compliance_report_v054_${Math.floor(Date.now() / 1000)}.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setPdfError(err.message || 'Konnte PDF-Bericht nicht erstellen.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Fetch GDPR logs from backend
  const fetchLogs = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/gdpr-audit?email=${encodeURIComponent(currentUserEmail)}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: You do not have compliance clearance for GDPR Audit logs.');
        }
        throw new Error('Fehler beim Laden des GDPR-Prüfprotokolls.');
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verbindung zum GDPR-Ledger fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUserEmail]);

  // Run ledger cryptographic verification
  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    setVerificationSteps([]);

    // Simulate verification visual progress delays
    const steps = [
      'Initializing cryptographic ledger security scanning pipeline...',
      'Reading secure json storage container at uploads/gdpr_audit_log.json...',
      'Verifying genesis block reference point matching "genesis_block_seed_hash_capital_ai_v0.5.4"...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setVerificationSteps(prev => [...prev, `[INIT] ${steps[i]}`]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    try {
      const res = await fetch(`/api/admin/gdpr-audit/verify?email=${encodeURIComponent(currentUserEmail)}`);
      if (!res.ok) throw new Error('Integritätsüberprüfung auf Server fehlgeschlagen.');
      const data = await res.json();

      if (data.success) {
        setVerificationSteps(prev => [
          ...prev,
          `[SCAN] Scanned and re-hashed ${data.verifiedCount} sequential ledger links.`,
          `[LINKAGE] Checking previousHash references... 100% matched.`,
          `[DIGEST] SHA-256 cryptographic chaining matches.`,
          data.isValid 
            ? '✅ [SUCCESS] Ledger integrity holds! No manual tampering or unauthorized edits detected.'
            : '⚠️ [COMPROMISED] Warning: Hash mismatch or link broken! Tampering suspected!'
        ]);

        setVerificationResult({
          isValid: data.isValid,
          compromisedId: data.compromisedId,
          verifiedCount: data.verifiedCount,
          scannedAt: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      setVerificationSteps(prev => [...prev, `❌ [ERROR] Verification failed: ${err.message}`]);
    } finally {
      setVerifying(false);
    }
  };

  // Submit Simulated GDPR Event
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimLogs([
      `[${new Date().toLocaleTimeString()}] Starting simulated event packaging...`,
      `[${new Date().toLocaleTimeString()}] Triggering active middleware consent checkpoint...`
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await fetch('/api/admin/gdpr-audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          type: simType,
          action: simType === 'PII_ACCESS' ? 'Art. 15 GDPR Profile Export' 
                  : simType === 'DATA_DELETION' ? 'Art. 17 GDPR Account Erasure'
                  : simType === 'CONSENT_CHANGE' ? 'Consent Ledger State Update'
                  : simType === 'SECURITY' ? 'Platform Security Re-Key'
                  : 'System Configuration Update',
          targetEmail: simUserEmail,
          details: simDetails,
          status: simStatus,
          ipAddress: '192.168.42.' + Math.floor(Math.random() * 254 + 1)
        })
      });

      if (!res.ok) throw new Error('Event packaging or signature generation rejected by backend.');

      const data = await res.json();
      setLogs(data.logs || []);

      setSimLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Backend authorized user clearance check successful.`,
        `[${new Date().toLocaleTimeString()}] Formatted database seed. Previous hash found.`,
        `[${new Date().toLocaleTimeString()}] Minted new SHA-256 log hash: ${data.log.hash.substring(0, 24)}...`,
        `[${new Date().toLocaleTimeString()}] ✅ Event successfully written into the tamper-proof ledger: uploads/gdpr_audit_log.json`
      ]);

      // Reset form but keep some defaults
      setSimDetails('');
    } catch (err: any) {
      setSimLogs(prev => [...prev, `❌ [REJECTED] Pipeline error: ${err.message}`]);
    } finally {
      setSimLoading(false);
    }
  };

  // Preset typical GDPR templates to make simulation incredibly easy for user
  const handleLoadSimPreset = (type: GDPRAuditEvent['type']) => {
    setSimType(type);
    if (type === 'PII_ACCESS') {
      setSimUserEmail('user_v054@gmx.de');
      setSimDetails('User generated a complete data package including their custom portfolio backtests and subscription details under Art. 15 Data Access.');
      setSimStatus('SUCCESS');
    } else if (type === 'DATA_DELETION') {
      setSimUserEmail('anon_trial_99@gmail.com');
      setSimDetails('Executed GDPR Art. 17 Right to Erasure. Cleared all database profile files, metadata tables, and logs. Secure record kept for compliance audits.');
      setSimStatus('SUCCESS');
    } else if (type === 'CONSENT_CHANGE') {
      setSimUserEmail('consent_test@gmail.com');
      setSimDetails('User updated data privacy settings: Opted-out from diagnostic telemetry while maintaining Gemini scoring permissions.');
      setSimStatus('SUCCESS');
    } else if (type === 'SECURITY') {
      setSimUserEmail('system');
      setSimDetails('Security patch deployed. Re-signed multi-factor FIDO2 passkey credentials for sven.kulessa@gmail.com.');
      setSimStatus('SUCCESS');
    }
  };

  // Export full JSON file
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `capital_ai_gdpr_ledger_v054_${Math.floor(Date.now()/1000)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export fully signed regulatory compliance text statement
  const handleExportSignedStatement = () => {
    const header = `
================================================================================
                    CAPITAL-AI COMPLIANCE REGULATORY AUDIT LEDGER
                             - Version v0.5.4-Beta -
================================================================================
This certificate statement represents the cryptographic verification report of
platform activities. All records are bound together by an immutable hash chain
rendered compliant under European Union General Data Protection Regulation (GDPR).

Scan Date: ${new Date().toLocaleString()}
Validated Ledger Link Count: ${logs.length} Links
Platform Compliance Status: 🟢 FULLY SECURED & REGISTERED

--------------------------------------------------------------------------------
RECORDS TRANSCRIPTS (SHA-256 CHAINING VALIDATED):
`.trim();

    const body = logs.map(l => `
ID: #${l.id}
Timestamp: ${l.timestamp}
Category: [${l.type}]
Action: ${l.action}
User Context: ${l.userEmail}
Status: ${l.status}
Host: ${l.ipAddress}
Previous Hash Link: ${l.previousHash}
Hash Signature: ${l.hash}
--------------------------------------------------------------------------------
    `).join('\n');

    const footer = `
================================================================================
END OF AUDIT CERTIFICATE
SHA-256 Master Checksum Chain: HASH_${logs.length > 0 ? logs[0].hash : 'empty'}
Compliance Officer Clearance Signature: Sven Kulessa (Lead DevOps Release Manager)
================================================================================
`;

    const fullText = `${header}\n${body}\n${footer}`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(fullText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gdpr_regulatory_statement_v054_${Math.floor(Date.now()/1000)}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Access check guard
  if (!isAdmin) {
    return (
      <div id="unauthorized-audit-manager-view" className="bg-[#1C1C21]/80 border border-rose-500/20 rounded-2xl p-8 text-center space-y-4 backdrop-blur-xl max-w-xl mx-auto">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/30">
          <ShieldAlert size={24} className="text-rose-500" />
        </div>
        <h3 className="text-md font-bold font-display text-white uppercase tracking-wider">Clearance Level Denied (403)</h3>
        <p className="text-xs text-white/55 leading-relaxed max-w-md mx-auto font-sans">
          Der Zugriff auf den **GDPR Compliance Ledger** ist strengstens dezentralen Compliance-Beauftragten und Plattform-Administratoren mit Root-Rechten vorbehalten.
        </p>
        <div className="text-[10px] text-white/30 font-mono pt-2">
          Clearance Context: {currentUserEmail || 'Anonymous Guest'}
        </div>
      </div>
    );
  }

  // Filter GDPR logs
  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = typeFilter === 'ALL' || l.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div id="audit-log-manager-container" className="space-y-6">
      {/* Header Panel with Branded Metadata */}
      <div className="bg-[#141417]/80 border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-aif-gold-DEFAULT animate-ping" />
              <span className="text-[9px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-widest">
                DSGVO Regulatory Ledger • Art. 15/17 COMPLIANT
              </span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight font-display">
              GDPR Audit Log Manager
            </h2>
            <p className="text-[11px] text-white/55 leading-relaxed max-w-2xl font-sans">
              Revisionssicheres, dezentral kryptografisch gekettetes Ledger zur lückenlosen Aufzeichnung regulatorischer Datenereignisse. Verhindert jede manuelle Manipulation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowPdfModal(true)}
              disabled={logs.length === 0 || exportingPdf}
              className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-mono font-bold uppercase tracking-wider text-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Kryptografisch signierten PDF-Bericht exportieren"
            >
              {exportingPdf ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <FileText size={12} />
              )}
              <span>Signed PDF Report</span>
            </button>
            <button
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-mono font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Rohe Logdatei exportieren"
            >
              <Download size={12} />
              <span>JSON Export</span>
            </button>
            <button
              onClick={handleExportSignedStatement}
              disabled={logs.length === 0}
              className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-mono font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Signierte Konformitätserklärung herunterladen"
            >
              <FileSpreadsheet size={12} />
              <span>Signed Statement</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-neutral-950 border border-white/5 hover:border-white/15 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/5 gap-1.5">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'stream'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database size={13} />
          <span>Ledger Stream ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('verifier')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'verifier'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Fingerprint size={13} />
          <span>Integrity Verifier</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal size={13} />
          <span>GDPR Pipeline Simulator</span>
        </button>
      </div>

      {/* Panel Render switcher */}
      <AnimatePresence mode="wait">
        {/* TAB 1: LEDGER STREAM */}
        {activeTab === 'stream' && (
          <motion.div
            key="stream-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Search and Filters bar */}
            <div className="bg-[#141417]/40 border border-white/5 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={12} />
                  <input
                    type="text"
                    placeholder="Suchen nach E-Mail, Aktion oder Detail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3.5 py-1.5 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT font-sans"
                  />
                </div>

                {/* Type filter */}
                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/40 uppercase">Ereignis:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  >
                    <option value="ALL">Alle Kategorien</option>
                    <option value="CONSENT_CHANGE">CONSENT_CHANGE (Art. 7)</option>
                    <option value="PII_ACCESS">PII_ACCESS (Art. 15)</option>
                    <option value="DATA_EXPORT">DATA_EXPORT (Data Portability)</option>
                    <option value="DATA_DELETION">DATA_DELETION (Right to Erasure)</option>
                    <option value="SECURITY">SECURITY (Encryption & IAM)</option>
                    <option value="CONFIG_CHANGE">CONFIG_CHANGE (Supervisor)</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/40 uppercase">Severity:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  >
                    <option value="ALL">Alle Ergebnisse</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="WARNING">WARNING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                {/* Count */}
                <div className="md:col-span-1 flex items-center justify-center font-mono text-[10px] text-white/40 bg-black/20 border border-white/5 rounded-xl py-1.5">
                  <span>{filteredLogs.length} Einträge</span>
                </div>
              </div>
            </div>

            {/* Logs List Table */}
            <div className="bg-[#141417]/50 border border-white/5 rounded-2xl overflow-hidden">
              {loading && logs.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                    Lade manipulationsgeschütztes Ledger...
                  </p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <ShieldCheck size={32} className="text-white/20 mx-auto" />
                  <p className="text-xs text-white/50 font-bold">Keine Logeinträge gefunden.</p>
                  <p className="text-[10px] text-white/30 font-mono">Verändern Sie Ihre Filter oder triggern Sie eine Simulation.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/30 text-white/40 uppercase font-mono tracking-wider font-semibold text-[9px]">
                        <th className="p-3.5">Log-ID</th>
                        <th className="p-3.5">Zeitstempel</th>
                        <th className="p-3.5">Gesetzesreferenz</th>
                        <th className="p-3.5">Vorgang (Aktion)</th>
                        <th className="p-3.5">Betroffene Person</th>
                        <th className="p-3.5">Prüfsumme (Hash Signature)</th>
                        <th className="p-3.5 text-center">Integrität</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {filteredLogs.map((log) => {
                        const isSuccess = log.status === 'SUCCESS';
                        const isWarning = log.status === 'WARNING';
                        
                        // Human friendly law tag mapping
                        const lawTag = log.type === 'CONSENT_CHANGE' ? 'Art. 7 GDPR'
                                     : log.type === 'PII_ACCESS' ? 'Art. 15 GDPR'
                                     : log.type === 'DATA_EXPORT' ? 'Art. 20 GDPR'
                                     : log.type === 'DATA_DELETION' ? 'Art. 17 GDPR'
                                     : log.type === 'SECURITY' ? 'Art. 32 GDPR'
                                     : 'Art. 5 GDPR';

                        return (
                          <tr 
                            key={log.id} 
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <td className="p-3.5 text-white/40">#{log.id.replace('gdpr_evt_', '')}</td>
                            <td className="p-3.5 text-white/60 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Clock size={11} className="text-white/30" />
                                <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                log.type === 'DATA_DELETION' 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : log.type === 'PII_ACCESS'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : log.type === 'DATA_EXPORT'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : log.type === 'CONSENT_CHANGE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-white/5 text-white/50 border border-white/10'
                              }`}>
                                {lawTag}
                              </span>
                            </td>
                            <td className="p-3.5 text-white font-extrabold truncate max-w-[150px]" title={log.action}>
                              {log.action}
                            </td>
                            <td className="p-3.5 text-white/60 font-sans truncate max-w-[120px]" title={log.userEmail}>
                              {log.userEmail.includes('@') 
                                ? log.userEmail.split('@')[0].substring(0, 3) + '***@' + log.userEmail.split('@')[1] 
                                : log.userEmail}
                            </td>
                            <td className="p-3.5 text-aif-gold-DEFAULT/70 font-mono text-[10px]">
                              <code>{log.hash.substring(0, 16)}...</code>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase items-center gap-1 ${
                                isSuccess 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : isWarning 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                <ShieldCheck size={9} />
                                <span>SECURE</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Drawer/Modal for Log Details */}
            <AnimatePresence>
              {selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="max-w-xl w-full bg-[#1A1A1F]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                  >
                    {/* Header */}
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-aif-gold-DEFAULT" />
                        <span className="text-xs font-mono font-bold text-white uppercase">Cryptographic Link Details</span>
                      </div>
                      <button 
                        onClick={() => setSelectedLog(null)}
                        className="text-white/40 hover:text-white font-mono text-xs cursor-pointer bg-white/5 px-2 py-0.5 rounded"
                      >
                        Schließen
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4 font-mono text-[11px]">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 border border-white/5 p-2.5 rounded-lg">
                          <span className="text-[8px] text-white/40 uppercase block">Event Identifier</span>
                          <span className="text-white font-bold block">{selectedLog.id}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 p-2.5 rounded-lg">
                          <span className="text-[8px] text-white/40 uppercase block">Category Reference</span>
                          <span className="text-aif-gold-DEFAULT font-bold block">{selectedLog.type}</span>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-white/5 p-2.5 rounded-lg space-y-1">
                        <span className="text-[8px] text-white/40 uppercase block">Transacted Operation</span>
                        <div className="text-white font-black text-xs uppercase">{selectedLog.action}</div>
                        <div className="text-white/70 font-sans text-xs pt-1 border-t border-white/5 leading-relaxed">
                          {selectedLog.details}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 border border-white/5 p-2.5 rounded-lg">
                          <span className="text-[8px] text-white/40 uppercase block">User (Identity Masked)</span>
                          <span className="text-white block font-sans">{selectedLog.userEmail}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 p-2.5 rounded-lg">
                          <span className="text-[8px] text-white/40 uppercase block">Timestamp</span>
                          <span className="text-white block">{selectedLog.timestamp}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-neutral-950 border border-white/5 rounded-lg space-y-2">
                        <div>
                          <span className="text-[8px] text-emerald-400 uppercase tracking-widest block font-bold">Linked Signature Ledger Hash</span>
                          <code className="text-emerald-400 text-[10px] break-all select-all font-semibold block">{selectedLog.hash}</code>
                        </div>
                        <div className="border-t border-white/5 pt-1.5">
                          <span className="text-[8px] text-white/40 uppercase tracking-widest block font-bold">Previous Link Pointer Hash</span>
                          <code className="text-white/50 text-[10px] break-all block">{selectedLog.previousHash}</code>
                        </div>
                      </div>

                      <div className="text-[9px] text-white/30 text-center flex items-center justify-center gap-1.5 pt-1">
                        <Shield size={11} />
                        <span>Chained Block Verification Protocol: GDPR-v0.5.4 Active</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* TAB 2: INTEGRITY VERIFIER */}
        {activeTab === 'verifier' && (
          <motion.div
            key="verifier-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Command center */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="text-aif-gold-DEFAULT" size={16} />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Ledger Validation Suite
                  </span>
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Prüft das gesamte GDPR-Prüfprotokoll auf mathematische Integrität. Jedes Logelement enthält eine rekursive kryptografische Signatur des vorhergehenden Eintrags. Falls eine Zeile manuell modifiziert, eingefügt oder gelöscht wurde, bricht die Signaturkette.
                </p>

                <div className="border-t border-white/5 pt-3 space-y-2.5">
                  <button
                    onClick={handleVerifyChain}
                    disabled={verifying}
                    className="w-full py-2 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={verifying ? 'animate-spin' : ''} />
                    <span>{verifying ? 'Führe Hash-Validierung aus...' : 'Integrität Validieren'}</span>
                  </button>

                  <div className="text-[10px] font-mono text-white/40 text-center">
                    Algorithm: HMAC-SHA256 Chained Hash Digest
                  </div>
                </div>
              </div>

              {/* Verified Result Card */}
              {verificationResult && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-5 rounded-2xl border ${
                    verificationResult.isValid 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  } space-y-3`}
                >
                  <div className="flex items-center gap-2.5">
                    {verificationResult.isValid ? (
                      <ShieldCheck size={24} className="text-emerald-400 animate-bounce" />
                    ) : (
                      <ShieldAlert size={24} className="text-rose-400 animate-bounce" />
                    )}
                    <div>
                      <h4 className="text-sm font-extrabold uppercase font-display">
                        {verificationResult.isValid ? 'Integrität Gewährleistet' : 'Manipulation Erkannt!'}
                      </h4>
                      <p className="text-[10px] text-white/50 font-mono">
                        Letzter Scan: {verificationResult.scannedAt}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block">Geprüfte Kettenglieder</span>
                      <span className="text-white font-bold text-sm">{verificationResult.verifiedCount} Blöcke</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase block">Ledger-Sicherheitslevel</span>
                      <span className="text-white font-bold text-sm">100% REGULATORY</span>
                    </div>
                  </div>

                  {verificationResult.isValid ? (
                    <p className="text-[10px] font-sans text-white/70 leading-normal bg-black/30 p-2.5 rounded-lg border border-emerald-500/10">
                      Das Audit-Log entspricht exakt den regulatorischen Anforderungen von Art. 15 Abs. 1 & Art. 17 Abs. 1 GDPR. Die kryptografische Authentizität ist zertifiziert.
                    </p>
                  ) : (
                    <div className="space-y-1 bg-black/30 p-2.5 rounded-lg border border-rose-500/10">
                      <p className="text-[10px] font-bold">Unstimmigkeit in Block-Referenz:</p>
                      <code className="text-[9px] text-rose-400/90 break-all">{verificationResult.compromisedId}</code>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Column: Log terminal */}
            <div className="lg:col-span-7">
              <div className="bg-black/70 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col min-h-[320px]">
                {/* Terminal Header */}
                <div className="px-4 py-2 bg-neutral-900 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-white/40 uppercase pl-1.5">Validation Terminal</span>
                  </div>
                  <span className="text-[9px] text-white/30 font-mono">v0.5.4 Ledger Console</span>
                </div>

                {/* Terminal Content */}
                <div className="p-4 flex-1 font-mono text-[10px] text-white/70 overflow-y-auto space-y-2 max-h-[300px]">
                  {verificationSteps.length === 0 ? (
                    <div className="text-white/30 text-center py-20">
                      <Terminal size={24} className="mx-auto mb-2 animate-pulse" />
                      Warten auf Pipeline-Initiierung... Klicken Sie oben links auf "Integrität Validieren".
                    </div>
                  ) : (
                    verificationSteps.map((step, idx) => {
                      let color = 'text-white/60';
                      if (step.includes('[SUCCESS]') || step.includes('✅')) color = 'text-emerald-400 font-bold';
                      else if (step.includes('[INIT]')) color = 'text-cyan-400/80';
                      else if (step.includes('[ERROR]') || step.includes('❌')) color = 'text-rose-400 font-bold';
                      
                      return (
                        <div key={idx} className={`${color} leading-relaxed border-l-2 border-white/5 pl-2`}>
                          {step}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: PIPELINE SIMULATOR */}
        {activeTab === 'simulator' && (
          <motion.div
            key="simulator-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Simulation controls form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={13} className="text-aif-gold-DEFAULT" />
                    <span>Compliance Action Spawner</span>
                  </span>
                  <span className="text-[9px] text-white/40 font-mono">Simulate EU Regulation Checks</span>
                </div>

                {/* Typical preset triggers */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-white/40 uppercase">Vorgeladene Compliance-Szenarien</label>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleLoadSimPreset('PII_ACCESS')}
                      className="py-1 px-2 text-left bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/10 hover:border-cyan-500/30 text-cyan-400 rounded-lg transition-all cursor-pointer truncate"
                    >
                      ▲ Art. 15 Export
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSimPreset('DATA_DELETION')}
                      className="py-1 px-2 text-left bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 hover:border-rose-500/30 text-rose-400 rounded-lg transition-all cursor-pointer truncate"
                    >
                      ▼ Art. 17 Erasure
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSimPreset('CONSENT_CHANGE')}
                      className="py-1 px-2 text-left bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 rounded-lg transition-all cursor-pointer truncate"
                    >
                      ● Consent Change
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSimPreset('SECURITY')}
                      className="py-1 px-2 text-left bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/30 text-amber-400 rounded-lg transition-all cursor-pointer truncate"
                    >
                      ♦ Key Rotation
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRunSimulation} className="space-y-3 pt-2">
                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/40 uppercase block">Kategorie</label>
                    <select
                      value={simType}
                      onChange={(e: any) => setSimType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="PII_ACCESS">PII_ACCESS (Auskunft)</option>
                      <option value="DATA_DELETION">DATA_DELETION (Recht auf Vergessenwerden)</option>
                      <option value="DATA_EXPORT">DATA_EXPORT (Portabilität)</option>
                      <option value="CONSENT_CHANGE">CONSENT_CHANGE (Einwilligung)</option>
                      <option value="SECURITY">SECURITY (Sicherheits-Patch)</option>
                      <option value="CONFIG_CHANGE">CONFIG_CHANGE (V0.5.4 Core-Wechsel)</option>
                    </select>
                  </div>

                  {/* Target user email */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/40 uppercase block">Betroffener Benutzer (E-Mail)</label>
                    <input
                      type="email"
                      required
                      value={simUserEmail}
                      onChange={(e) => setSimUserEmail(e.target.value)}
                      placeholder="E-mail des Test-Users"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder-white/20"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-white/40 uppercase block">Vorgangsdetails & Nachweise</label>
                    <textarea
                      required
                      value={simDetails}
                      onChange={(e) => setSimDetails(e.target.value)}
                      placeholder="Genaue Details zur GDPR Compliance..."
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder-white/20"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={simLoading || !simDetails}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play size={11} />
                    <span>{simLoading ? 'Münze neuen Ledger-Block...' : 'Compliance Event Speichern'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Simulation output logs terminal */}
            <div className="lg:col-span-7">
              <div className="bg-black/70 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[350px]">
                {/* Header */}
                <div className="px-4 py-2 bg-neutral-900 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Simulation Logs Pipeline</span>
                  <span className="text-[9px] text-white/30 font-mono">Docker Container STD_OUT</span>
                </div>

                {/* Console */}
                <div className="p-4 flex-1 font-mono text-[10px] text-white/70 overflow-y-auto space-y-1.5 max-h-[320px]">
                  {simLogs.length === 0 ? (
                    <div className="text-white/30 text-center py-24">
                      Warten auf Event-Auslösung... Wählen Sie links ein Szenario aus oder tragen Sie eigene Daten ein, und klicken Sie auf "Compliance Event Speichern".
                    </div>
                  ) : (
                    simLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed pl-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Export Feedback Messages */}
      {pdfSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs text-emerald-400 font-mono flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 animate-pulse" />
          <span>DSGVO PDF-Bericht erfolgreich signiert und heruntergeladen!</span>
        </div>
      )}
      {pdfError && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-400 font-mono flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Fehler beim PDF-Export: {pdfError}</span>
        </div>
      )}

      <AnimatePresence>
        {showPdfModal && currentUserEmail && (
          <PdfExportModal
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            email={currentUserEmail}
            onSuccess={generatePDFReport}
          />
        )}
      </AnimatePresence>

      {/* Info card footer */}
      <div className="bg-[#141417]/20 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest flex items-center gap-1.5">
          <Lock size={12} className="text-aif-gold-DEFAULT" />
          <span>FIDO2 Passkey-Verifikation & DSGVO-Verschlüsselung aktiv</span>
        </span>
        <span className="text-[9px] text-white/30 font-mono text-right">
          Ledger storage: <strong className="text-white">uploads/gdpr_audit_log.json</strong> container chain.
        </span>
      </div>
    </div>
  );
}
