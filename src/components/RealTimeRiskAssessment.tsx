// DEAKTIVIERTES MODUL / DEACTIVATED MODULE: Risikoassessment (Value-at-Risk Risiko-Zentrale)
//
// P0 PDF-BRANDING-HYGIENE (2026-08-19):
// Die ehemalige Runtime-Implementierung enthielt einen eigenständigen, nicht mehr
// kanonischen AIF-Capital-PDF-Generator. Das Modul ist laut
// docs/backlog/04-deactivated-modules.md archiviert und wird im aktiven Dashboard
// nicht gerendert. Um einen weiterhin ausführbaren Legacy-PDF-Pfad sowie unnötige
// tote Runtime-/Security-Oberfläche zu vermeiden, bleibt hier nur ein
// API-kompatibler Null-Stub. Die vollständige historische Implementierung ist über
// die Git-Historie revisionssicher wiederherstellbar.

interface RealTimeRiskAssessmentProps {
  userCapital: number;
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

/**
 * Archived compatibility component.
 *
 * Deliberately renders nothing and exposes no PDF/export side effects. Any future
 * reactivation must use `src/platform/PdfReporting/pdfBrand.ts` as the canonical
 * PDF brand/metadata contract and requires a dedicated architecture decision.
 */
export function RealTimeRiskAssessment(_props: RealTimeRiskAssessmentProps) {
  return null;
}
