// ADR-0012 — Persistenz- und Aggregationsschicht des SecurityComplianceAuditor.

import { getServerSupabase, isSupabaseConfigured } from '../../../server/db';
import { runAllScanners } from './scanners';
import type { ComplianceCertificate, ComplianceRun, Finding, ScannerResult, Severity } from './types';

function avg(nums: number[]): number {
  if (nums.length === 0) return 100;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function byType(scanners: ScannerResult[], types: string[]): ScannerResult[] {
  return scanners.filter(s => types.includes(s.type));
}

interface RunRow {
  id: string;
  created_at: string;
  scanner_results: Record<string, ScannerResult>;
  findings: Finding[];
  compliance_score: number;
  security_score: number;
  enterprise_readiness: number;
  production_readiness: number;
  risk_score: number;
  is_production_ready: boolean;
}

function rowToRun(row: RunRow): ComplianceRun {
  return {
    id: row.id,
    createdAt: row.created_at,
    scannerResults: row.scanner_results,
    findings: row.findings,
    scores: { compliance: row.compliance_score },
    assessment: {
      securityScore: row.security_score,
      enterpriseReadiness: row.enterprise_readiness,
      productionReadiness: row.production_readiness,
      riskScore: row.risk_score,
    },
    isProductionReady: row.is_production_ready,
  };
}

/**
 * Führt alle 21 Scanner-Module aus, aggregiert die Scores und persistiert
 * den Lauf. Wirft, wenn Supabase nicht konfiguriert ist - der Auditor ist
 * eine reine Admin-Funktion ohne sinnvollen lokalen Fallback-Modus.
 */
export async function executeComplianceRun(triggeredBy: string | undefined): Promise<ComplianceRun> {
  const scannerResultsList = runAllScanners();
  const scannerResults: Record<string, ScannerResult> = {};
  for (const s of scannerResultsList) scannerResults[s.id] = s;
  const findings: Finding[] = scannerResultsList.flatMap(s => s.findings);

  const complianceScore = avg(scannerResultsList.map(s => s.complianceScore));
  const securityScore = avg(byType(scannerResultsList, ['SECURITY']).map(s => s.complianceScore));
  const enterpriseReadiness = avg(byType(scannerResultsList, ['GOVERNANCE', 'CODE_QUALITY']).map(s => s.complianceScore));
  const productionReadiness = avg(byType(scannerResultsList, ['DATA', 'BILLING']).map(s => s.complianceScore));
  const riskScore = avg(scannerResultsList.map(s => s.riskScore));

  const hasBlockingFindings = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  const isProductionReady = securityScore >= 95 && complianceScore >= 95 && !hasBlockingFindings;

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase ist nicht konfiguriert - der Compliance-Auditor benötigt eine persistente Datenbank.');
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('compliance_runs')
    .insert({
      triggered_by: triggeredBy || null,
      scanner_results: scannerResults,
      findings,
      compliance_score: complianceScore,
      security_score: securityScore,
      enterprise_readiness: enterpriseReadiness,
      production_readiness: productionReadiness,
      risk_score: riskScore,
      is_production_ready: isProductionReady,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Compliance-Lauf konnte nicht gespeichert werden: ${error?.message || 'unbekannter Fehler'}`);
  }

  return rowToRun(data as RunRow);
}

export async function getLastRun(): Promise<ComplianceRun | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('compliance_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRun(data as RunRow);
}

export async function getRunById(runId: string): Promise<ComplianceRun | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('compliance_runs').select('*').eq('id', runId).maybeSingle();
  if (error || !data) return null;
  return rowToRun(data as RunRow);
}

export async function getCertificates(): Promise<ComplianceCertificate[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('compliance_certificates')
    .select('*')
    .order('issued_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    runId: row.run_id,
    certifiedBy: row.certified_by,
    scope: row.scope,
    issuedAt: row.issued_at,
  }));
}

export async function createCertificate(runId: string, certifiedBy: string): Promise<ComplianceCertificate> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase ist nicht konfiguriert.');
  }
  const supabase = getServerSupabase();
  const id = `CERT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { data, error } = await supabase
    .from('compliance_certificates')
    .insert({ id, run_id: runId, certified_by: certifiedBy, scope: 'CAPITAL-AI Production Deployment' })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Zertifikat konnte nicht ausgestellt werden: ${error?.message || 'unbekannter Fehler'}`);
  }
  return { id: data.id, runId: data.run_id, certifiedBy: data.certified_by, scope: data.scope, issuedAt: data.issued_at };
}

export function buildRemediationPlans(findings: Finding[]) {
  return findings.map(f => ({
    findingId: f.id,
    priority: f.severity as Severity,
    solution: `Beheben Sie: ${f.title}. Betroffen: ${f.filePath || 'siehe Beschreibung'}. Referenz: ${f.complianceReference}.`,
  }));
}
