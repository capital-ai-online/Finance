/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { eventMeshBus } from '../EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../EventMesh/Services/EventMeshService';
import { getProviderHealth, type ProviderHealthRecord } from './providerHealth';
import { evaluateWritePolicy } from '../Compliance/PolicyGate';
import { consumeApproval } from '../Security/approvals';
import type { Capability } from '../Security/capabilities';
import { getAiGovernanceInventory } from '../../services/aiGovernance';
import { getMarketDataProviderTelemetry, type ProviderRoutingTelemetry } from '../../services/marketDataProviderRouter';
import { getMarketDataProviderRegistry } from '../../services/marketDataProviderRegistry';
import {
  buildMarketIntegrityCalibrationReport,
  type MarketIntegrityCalibrationReport,
} from '../../services/marketIntegrityCalibration';
import { buildScreeningSlaReport, type ScreeningSlaReport } from '../../services/screeningSla';
import { getLatestScoreConfidenceEvidence, type ScoreConfidenceEvidenceRecord } from '../../services/scoreConfidenceEvidence';

export type AssetClass = 'crypto' | 'commodity' | 'stock' | 'forex' | 'index' | 'bond';

export interface TaskRoute {
  engineId: string;
  label: string;
  hasDedicatedEngine: boolean;
}

const TASK_ROUTING_TABLE: Record<AssetClass, TaskRoute> = {
  crypto: { engineId: 'crypto_orchestrator', label: 'Crypto/DeFi/Meme-Coin Scoring (verified market data + provenance)', hasDedicatedEngine: true },
  commodity: { engineId: 'rawmaterials_orchestrator', label: 'Rohstoff-Scoring (dedizierte Fachengine)', hasDedicatedEngine: true },
  stock: { engineId: 'traditional_asset_engine', label: 'Aktien-Scoring (Technik + Alpha-Vantage-Fundamentaldaten)', hasDedicatedEngine: true },
  forex: { engineId: 'traditional_asset_engine', label: 'Forex-Scoring (reale Kurshistorie, rein technisch)', hasDedicatedEngine: true },
  index: { engineId: 'traditional_asset_engine', label: 'Index-Scoring (FMP-Kurshistorie, rein technisch)', hasDedicatedEngine: true },
  bond: { engineId: 'sovereign_benchmark_yield_engine', label: 'Anleihen-Scoring: Sovereign-Benchmark-Rendite (ADR-0033, yield-state; kein Einzelanleihen-/Credit-/Duration-Score)', hasDedicatedEngine: true },
};

export function routeTask(assetClass: string): TaskRoute | undefined {
  return TASK_ROUTING_TABLE[assetClass as AssetClass];
}

export function getRoutingTable(): Record<AssetClass, TaskRoute> {
  return { ...TASK_ROUTING_TABLE };
}

export interface SupervisedExecutionRecord {
  taskName: string;
  attempts: number;
  succeeded: boolean;
  durationMs: number;
  timestamp: string;
  error?: string;
}

const MAX_EXECUTION_LOG = 200;
const executionLog: SupervisedExecutionRecord[] = [];

function recordExecution(entry: SupervisedExecutionRecord) {
  executionLog.push(entry);
  if (executionLog.length > MAX_EXECUTION_LOG) executionLog.shift();
}

export function getRecentExecutions(limit = 50): SupervisedExecutionRecord[] {
  return executionLog.slice(-limit).reverse();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface SupervisionOptions {
  retries?: number;
  backoffMs?: number;
}

export async function executeSupervised<T>(
  taskName: string,
  fn: () => Promise<T>,
  options: SupervisionOptions = {}
): Promise<T> {
  const retries = options.retries ?? 2;
  const backoffMs = options.backoffMs ?? 500;
  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await fn();
      recordExecution({
        taskName,
        attempts: attempt,
        succeeded: true,
        durationMs: Date.now() - start,
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (err) {
      lastError = err;
      if (attempt <= retries) await sleep(backoffMs * Math.pow(2, attempt - 1));
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  recordExecution({
    taskName,
    attempts: retries + 1,
    succeeded: false,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    error: errorMessage,
  });

  try {
    if (!isBootstrapped()) bootstrapEventMesh(eventMeshBus);
    eventMeshBus.publish('SupervisorAlertEvent', {
      taskName,
      attempts: retries + 1,
      error: errorMessage,
    }, {
      sourceComponent: 'src/platform/Supervisor',
      essReferences: ['ESS-0001-CONTRACTS', 'ESS-0002'],
      adrReferences: ['ADR-0018'],
    });
  } catch {
    // Best effort only; never hide the original execution error.
  }

  throw lastError;
}

// ESS-0018 Phase 2 / ADR-0051: governed write-action execution, additive alongside
// executeSupervised() rather than a change to its signature (executeSupervised has exactly one
// other call site today, so this keeps that path entirely unaffected). This function is Apply
// only - dry-run/preview is a separate, unauthorized-safe read that happens before a caller ever
// requests an approval. Enforces Policy (Compliance PolicyGate) -> Approval (single-use,
// plan-hash-bound consumption, src/platform/Security/approvals.ts) -> Apply (executeSupervised)
// -> Audit (EventMesh). Fingerprint verification against current DB state is the write tool's
// own responsibility inside `fn` (Supervisor has no DB-specific knowledge) - a mismatch there
// should throw, which this function reports as a thrown error, never as a silent no-op success.

export interface ApprovedActionRequest<T> {
  taskName: string;
  action: string;
  capability: Capability;
  planHash: string;
  approvalId: string;
  actorUserId: string;
  targetResource: string;
  fn: () => Promise<T>;
}

export type ApprovedActionOutcome<T> =
  | { status: 'DENIED_POLICY'; reason: string }
  | { status: 'DENIED_APPROVAL'; reason: string }
  | { status: 'APPLIED'; result: T };

export async function executeApprovedSupervisedAction<T>(
  req: ApprovedActionRequest<T>
): Promise<ApprovedActionOutcome<T>> {
  const policy = evaluateWritePolicy(req.capability);
  if (policy.verdict === 'DENY') {
    return { status: 'DENIED_POLICY', reason: policy.reason };
  }

  const consumption = await consumeApproval(req.approvalId, req.action, req.planHash);
  if (consumption !== 'CONSUMED') {
    return { status: 'DENIED_APPROVAL', reason: `Approval-Status: ${consumption}` };
  }

  const result = await executeSupervised(req.taskName, req.fn);

  try {
    if (!isBootstrapped()) bootstrapEventMesh(eventMeshBus);
    eventMeshBus.publish('SupervisorApprovedActionApplied', {
      taskName: req.taskName,
      action: req.action,
      actorUserId: req.actorUserId,
      targetResource: req.targetResource,
    }, {
      sourceComponent: 'src/platform/Supervisor',
      essReferences: ['ESS-0018'],
      adrReferences: ['ADR-0051'],
    });
  } catch {
    // Best effort only; never hide the underlying Apply result.
  }

  return { status: 'APPLIED', result };
}

export interface SupervisorStatus {
  routingTable: Record<AssetClass, TaskRoute>;
  recentExecutions: SupervisedExecutionRecord[];
  providerHealth: ProviderHealthRecord[];
  marketDataRouting: {
    registeredProviders: number;
    activeProviders: number;
    candidateProviders: number;
    telemetry: ProviderRoutingTelemetry[];
  };
  marketIntegrity: MarketIntegrityCalibrationReport;
  screeningSla: ScreeningSlaReport;
  scoreConfidence: {
    latest: ScoreConfidenceEvidenceRecord | null;
    observed: boolean;
    calibrated: boolean;
  };
  aiGovernance: {
    providerRoles: number;
    registeredPrompts: number;
    recordedEvaluations: number;
    warnings: number;
    failures: number;
  };
  capabilities: {
    taskRouting: boolean;
    toolSelection: boolean;
    executionControl: boolean;
    retry: boolean;
    recovery: boolean;
    selfHealing: boolean;
    conflictResolution: boolean;
    providerHealth: boolean;
    marketDataRouting: boolean;
    marketIntegrityCalibration: boolean;
    screeningSla: boolean;
    scoreConfidenceEvidence: boolean;
    aiGovernance: boolean;
  };
  notes: string[];
}

export function getSupervisorStatus(): SupervisorStatus {
  const aiInventory = getAiGovernanceInventory();
  const warnings = aiInventory.recentEvaluations.filter(record => record.outcome === 'WARN').length;
  const failures = aiInventory.recentEvaluations.filter(record => record.outcome === 'FAIL').length;
  const marketProviders = getMarketDataProviderRegistry();
  const marketIntegrity = buildMarketIntegrityCalibrationReport();
  const routingTelemetry = getMarketDataProviderTelemetry();
  const screeningSla = buildScreeningSlaReport(routingTelemetry);
  const scoreConfidenceLatest = getLatestScoreConfidenceEvidence();
  return {
    routingTable: getRoutingTable(),
    recentExecutions: getRecentExecutions(),
    providerHealth: getProviderHealth(),
    marketDataRouting: {
      registeredProviders: marketProviders.length,
      activeProviders: marketProviders.filter(provider => provider.activation === 'active').length,
      candidateProviders: marketProviders.filter(provider => provider.activation === 'candidate').length,
      telemetry: routingTelemetry,
    },
    marketIntegrity,
    screeningSla,
    scoreConfidence: {
      latest: scoreConfidenceLatest,
      observed: scoreConfidenceLatest !== null,
      calibrated: scoreConfidenceLatest?.state === 'CALIBRATED',
    },
    aiGovernance: {
      providerRoles: aiInventory.models.length,
      registeredPrompts: aiInventory.prompts.length,
      recordedEvaluations: aiInventory.recentEvaluations.length,
      warnings,
      failures,
    },
    capabilities: {
      taskRouting: true,
      toolSelection: true,
      executionControl: true,
      retry: true,
      recovery: true,
      selfHealing: true,
      conflictResolution: true,
      providerHealth: true,
      marketDataRouting: true,
      marketIntegrityCalibration: true,
      screeningSla: true,
      scoreConfidenceEvidence: true,
      aiGovernance: true,
    },
    notes: [
      'conflictResolution: evidence-preserving Spot-/Snapshot-Quorum erkennt SOURCE_CONFLICT und verweigert einen künstlichen kanonischen Wert; harte Score-/Ranking-Gates bleiben bis zur Kalibrierung deaktiviert.',
      `marketIntegrityCalibration: ${marketIntegrity.status}; ${marketIntegrity.observations}/${marketIntegrity.minimumSample} Runtime-Beobachtungen. Eine Hard-Gate-Aktivierung bleibt reviewed und ist nicht automatisch freigegeben.`,
      `screeningSla: ${screeningSla.state}; ${screeningSla.providersObserved} Provider mit Runtime-Evidence. Dieser Status ist observability-only und blockiert Screening nicht automatisch.`,
      scoreConfidenceLatest
        ? `scoreConfidence: ${scoreConfidenceLatest.state}; sampleSize=${scoreConfidenceLatest.sampleSize}; confidence=${scoreConfidenceLatest.confidencePct ?? 'null'}%. Evidence ist observability-only und keine Execution-Wahrscheinlichkeit.`
        : 'scoreConfidence: NO_RUNTIME_EVIDENCE; eine Confidence wird erst nach einem real ausgeführten Score-Validation-Lauf angezeigt.',
      'providerHealth: runtime-basiert; nur tatsächlich beobachtete Provider-Aufrufe erscheinen im Status.',
      'marketDataRouting: adaptive Priorisierung nutzt Governance-Priorität, Failures/Cooldown und EWMA-Latenz; Candidate-Provider bleiben bis Production Handoff deaktiviert.',
      'aiGovernance: runtime-basiert; Evaluationen erscheinen erst, nachdem ein instrumentierter AI-Aufruf tatsächlich ausgeführt wurde.',
    ],
  };
}
