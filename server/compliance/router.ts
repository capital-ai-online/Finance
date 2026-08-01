// ADR-0012 — Backend-Anbindung des SecurityComplianceAuditor.
//
// Schließt den im ADR dokumentierten Befund "Backend-Anbindung fehlt
// vollständig": src/components/SecurityComplianceAuditor.tsx ruft sieben
// Endpunkte unter /api/compliance/* auf, die bislang nicht existierten.
//
// Zugriffsschutz folgt demselben Muster wie server.ts (registry:assets:update
// über checkAdminAccess) - der Auditor ist Teil des Admin-Portals und darf
// laut ADR "keine Berechtigungen vergeben, keine IAM-Regeln verändern,
// keine Sicherheitsmechanismen umgehen", besitzt aber selbst produktive
// Findings/Zertifikate, die nicht unauthentifiziert einsehbar sein dürfen.

import express from 'express';
import { checkAdminAccess } from '../iam/authMiddleware';
import { ADMIN_ZONE_ROLES } from '../iam/types';
import {
  buildRemediationPlans,
  createCertificate,
  executeComplianceRun,
  getCertificates,
  getLastRun,
  getRunById,
} from './store';
import type { ComplianceRun } from './types';

export const complianceRouter = express.Router();

const ACTIVE_POLICY = {
  name: 'BaFin Compliance & GDPR Policy',
  description: 'Enforces strict secure data processing, transaction tracking, and release requirements.',
};

function generateReports(run: ComplianceRun) {
  const findingLines = run.findings.length === 0
    ? '_Keine offenen Befunde._'
    : run.findings.map(f => `- **[${f.severity}] ${f.title}** — ${f.description} (${f.complianceReference})`).join('\n');

  // Audit ARCH-AUDIT-0002 (N6): ISO/IEC 27001:2022 Annex-A-Kontrollzuordnung je Scanner,
  // aus den in server/compliance/scanners.ts hinterlegten isoControls-Feldern - interne
  // Selbsteinschaetzung, kein zertifiziertes Audit-Mapping (siehe Kommentar dort).
  const scannersWithIso = Object.values(run.scannerResults).filter(s => s.isoControls.length > 0);
  const isoLines = scannersWithIso.length === 0
    ? '_Keine ISO-27001-Kontrollzuordnung im aktuellen Lauf._'
    : scannersWithIso.map(s => `- **${s.id} ${s.name}** → ${s.isoControls.join(', ')}`).join('\n');
  const isoControlCoverage = new Set(scannersWithIso.flatMap(s => s.isoControls)).size;

  const markdown = `# Compliance Report ${run.id}

**Datum:** ${run.createdAt}
**Compliance-Score:** ${run.scores.compliance}%
**Security-Score:** ${run.assessment.securityScore}%
**Enterprise Readiness:** ${run.assessment.enterpriseReadiness}%
**Production Readiness:** ${run.assessment.productionReadiness}%
**Production Ready:** ${run.isProductionReady ? 'Ja' : 'Nein'}

## Befunde

${findingLines}

## ISO/IEC 27001:2022 Annex-A-Kontrollzuordnung

Interne Selbsteinschaetzung (${scannersWithIso.length} von ${Object.keys(run.scannerResults).length} Scannern,
${isoControlCoverage} unterschiedliche Kontrollen abgedeckt) - kein zertifiziertes Audit-Mapping,
Startpunkt fuer eine spaetere ISO-27001-Zertifizierungsvorbereitung (Roadmap J6).

${isoLines}
`;

  const json = JSON.stringify(run, null, 2);

  const scannerLines = Object.values(run.scannerResults)
    .map(s => `  ${s.id}["${s.name}<br/>${s.complianceScore}%"]:::${s.complianceScore >= 95 ? 'ok' : s.complianceScore >= 70 ? 'warn' : 'fail'}`)
    .join('\n');
  const mermaid = `flowchart TD
  RUN["Compliance Run ${run.id}"]
${scannerLines}
  RUN --> ${Object.keys(run.scannerResults).join('\n  RUN --> ')}
  classDef ok fill:#10b981,color:#000
  classDef warn fill:#f59e0b,color:#000
  classDef fail fill:#f43f5e,color:#fff
`;

  const documentaryExport = JSON.stringify({
    artifactType: 'ComplianceRun',
    essReference: 'ESS-0001-CONTRACTS Chapter 11',
    adrReference: 'ADR-0012',
    runId: run.id,
    createdAt: run.createdAt,
    scores: run.scores,
    assessment: run.assessment,
    isProductionReady: run.isProductionReady,
    findingCount: run.findings.length,
  }, null, 2);

  return { markdown, json, mermaid, documentaryExport };
}

complianceRouter.get('/dashboard', async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:dashboard', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const lastRun = await getLastRun();
  res.json({ lastRun, activePolicy: ACTIVE_POLICY });
});

complianceRouter.get('/risk', async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:risk', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const runId = String(req.query.runId || '');
  const run = runId ? await getRunById(runId) : await getLastRun();
  if (!run) {
    return res.json({ remediationPlans: [] });
  }
  res.json({ remediationPlans: buildRemediationPlans(run.findings) });
});

complianceRouter.get('/certificates', async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:certificates', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const certificates = await getCertificates();
  res.json({ certificates });
});

complianceRouter.post('/run', express.json(), async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:run', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  try {
    const run = await executeComplianceRun(authz.actorLabel);
    res.json({ success: true, run });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Fehler beim Ausführen des Compliance-Scans.' });
  }
});

complianceRouter.post('/certify', express.json(), async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:certify', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const { runId } = req.body || {};
  if (!runId) {
    return res.status(400).json({ error: 'runId ist erforderlich.' });
  }
  const run = await getRunById(String(runId));
  if (!run) {
    return res.status(404).json({ error: 'Compliance-Lauf nicht gefunden.' });
  }
  if (!run.isProductionReady) {
    return res.status(422).json({ error: 'Zertifizierung abgelehnt: Lauf erfüllt die Production-Ready-Kriterien nicht.' });
  }
  try {
    const certificate = await createCertificate(run.id, authz.actorLabel);
    res.json({ success: true, certificate });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Fehler beim Ausstellen des Zertifikats.' });
  }
});

complianceRouter.get('/report', async (req, res) => {
  const authz = await checkAdminAccess(req, 'compliance:report', ADMIN_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }
  const runId = String(req.query.runId || '');
  const run = runId ? await getRunById(runId) : await getLastRun();
  if (!run) {
    return res.status(404).json({ error: 'Compliance-Lauf nicht gefunden.' });
  }
  res.json({ reports: generateReports(run) });
});
