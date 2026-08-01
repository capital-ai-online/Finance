// ADR-0012 — Typdefinitionen fuer den SecurityComplianceAuditor Backend.
// Diese Datei existierte bisher nicht (Audit-Befund C-01 /
// FND-ADR-0012-01): src/components/SecurityComplianceAuditor.tsx
// importierte aus einem nicht existierenden Verzeichnis.

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  complianceReference: string;
  risk: string;
  filePath?: string;
}

export interface ScannerResult {
  id: string;
  name: string;
  type: string;
  version: string;
  complianceScore: number;
  confidenceScore: number;
  evidence: string;
  findings: Finding[];
  riskScore: number;
  executionTimeMs: number;
  // Audit ARCH-AUDIT-0002 (N6): ISO/IEC 27001:2022 Annex-A-Kontrollen, denen dieser
  // Scanner fachlich zuzuordnen ist (Format "A.x.y Kurzbezeichnung"). Interne
  // Selbsteinschaetzung, kein zertifiziertes Audit-Mapping - siehe isoControls-Konstante
  // in server/compliance/scanners.ts fuer die Zuordnungsbegruendung. Leer, wenn der
  // Scanner eine reine Code-Qualitaets-/Geschaeftslogik-Pruefung ohne direkten
  // Informationssicherheits-Kontrollbezug ist (z.B. tote Komponenten, gebrochene
  // Imports) - bewusst nicht erzwungen zugeordnet.
  isoControls: string[];
}

export interface ComplianceRun {
  id: string;
  createdAt: string;
  scannerResults: Record<string, ScannerResult>;
  findings: Finding[];
  scores: { compliance: number };
  assessment: {
    securityScore: number;
    enterpriseReadiness: number;
    productionReadiness: number;
    riskScore: number;
  };
  isProductionReady: boolean;
}

export interface RemediationPlan {
  findingId: string;
  priority: Severity;
  solution: string;
}

export interface ComplianceCertificate {
  id: string;
  runId: string;
  certifiedBy: string;
  scope: string;
  issuedAt: string;
}

export interface CompliancePolicy {
  name: string;
  description: string;
}
