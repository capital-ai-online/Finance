import { getAiEvaluations, getAiGovernanceInventory, type AiEvaluationRecord } from '../../services/aiGovernance';
import type { Finding, ScannerResult, Severity } from './types';

const SEVERITY_WEIGHT: Record<Severity, number> = { CRITICAL: 40, HIGH: 25, MEDIUM: 12, LOW: 5 };

function findingForEvaluation(record: AiEvaluationRecord, sequence: number): Finding | null {
  if (record.outcome === 'PASS') return null;
  const severity: Severity = record.outcome === 'FAIL' ? 'HIGH' : 'MEDIUM';
  return {
    id: `FND-AIGOV-${sequence}`,
    title: `AI evaluation ${record.outcome}: ${record.promptId}`,
    severity,
    description: `Prompt ${record.promptId}@${record.promptVersion} via ${record.modelProvider}:${record.model} produced governance outcome ${record.outcome}. Evaluation-ID: ${record.evaluationId}. Request-ID: ${record.requestId ?? 'n/a'}.`,
    complianceReference: 'AI Governance / Model-Prompt-Evaluation Registry / ISO/IEC 42001 performance evaluation',
    risk: record.outcome === 'FAIL'
      ? 'Ein produktiver AI-Aufruf hat einen Governance-, Schema- oder Grounding-Check nicht bestanden.'
      : 'Ein produktiver AI-Aufruf benötigt zusätzliche Prüfung oder besitzt unvollständige Evidenz.',
  };
}

/**
 * Converts actually recorded AI evaluations into runtime compliance evidence. No evaluation
 * means no artificial success score: the scanner is omitted until an AI invocation has been
 * observed and evaluated.
 */
export function buildAiGovernanceEvidenceScanner(
  evaluations: AiEvaluationRecord[] = getAiEvaluations(200),
): ScannerResult | null {
  if (evaluations.length === 0) return null;
  const started = Date.now();
  const findings = evaluations
    .map((record, index) => findingForEvaluation(record, index + 1))
    .filter((finding): finding is Finding => finding !== null);
  const penalty = findings.reduce((sum, finding) => sum + SEVERITY_WEIGHT[finding.severity], 0);
  const pass = evaluations.filter(record => record.outcome === 'PASS').length;
  const warn = evaluations.filter(record => record.outcome === 'WARN').length;
  const fail = evaluations.filter(record => record.outcome === 'FAIL').length;
  const inventory = getAiGovernanceInventory();

  return {
    id: 'RUNTIME-AI-01',
    name: 'Runtime AI Model / Prompt / Evaluation Governance',
    type: 'GOVERNANCE',
    version: '1.0.1',
    complianceScore: Math.max(0, 100 - penalty),
    confidenceScore: 100,
    evidence: `${evaluations.length} recorded AI evaluations: ${pass} PASS, ${warn} WARN, ${fail} FAIL. Registry: ${inventory.models.length} provider roles, ${inventory.prompts.length} prompts.`,
    findings,
    riskScore: Math.min(100, penalty),
    executionTimeMs: Math.max(0, Date.now() - started),
    isoControls: ['A.5.1 Policies for information security', 'A.8.16 Monitoring activities', 'A.8.28 Secure coding'],
  };
}
