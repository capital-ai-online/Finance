// Audit ARCH-AUDIT-0002 (AUD2-F-014, S7): expliziter Ersatz fuer den zuvor bei jedem
// Serverstart unbedingt ausgefuehrten Dokumenten-Branding-Sweep (server/documentHygiene.ts
// startRecursiveFileWatcher()). Bewusst manuell auszufuehren statt automatisch beim Boot,
// damit Serverstarts keine unbeabsichtigten Dokumentmutationen mehr erzeugen.
//
// Aufruf: npm run hygiene:sweep

import { applyBrandingToAllDocs } from '../../server/documentHygiene';

console.log('[DocumentHygiene] Manueller Sweep gestartet (scripts/automation/sweepDocumentaryBranding.ts)...');
applyBrandingToAllDocs();
console.log('[DocumentHygiene] Sweep abgeschlossen.');
