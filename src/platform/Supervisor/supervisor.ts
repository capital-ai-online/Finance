/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { eventMeshBus } from '../EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../EventMesh/Services/EventMeshService';
import { getProviderHealth, type ProviderHealthRecord } from './providerHealth';
import {
  getSelfHealingContractSnapshot,
  type IdempotencyClass,
  type SelfHealingContractSnapshot,
} from './selfHealingContract';
import {
  getFaultInjectionSuiteSnapshot,
  type FaultInjectionSuiteSnapshot,
} from './faultInjectionConvergence';
import {
  getDependencyResilienceSnapshot,
  projectProviderResilience,
  type DependencyResilienceSnapshot,
  type ProviderResilienceProjection,
} from './dependencyResilience';
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
import {
  observeAgentProviderChain,
  type AgentProviderObservation,
} from './agentProviderObservation';

export type AssetClass = 'crypto' | 'commodity' | 'stock' | 'forex' | 'index' | 'bond';

export const SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID =
  'ScoringDispatcher.dispatchCanonicalScore' as const;

export interface TaskRoute {
  /**
   * Legacy compatibility field for Supervisor consumers.
   * It now identifies the productive score authority, never a research orchestrator.
   */
  engineId: typeof SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID;
  scoreAuthorityId: typeof SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID;
  domainExecutorId: string;
  researchOrchestratorId?: 'crypto_orchestrator' | 'rawmaterials_orchestrator';
  label: string;
  hasDedicatedEngine: boolean;
}

const TASK_ROUTING_TABLE: Record<AssetClass, TaskRoute> = {
  crypto: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore',
    researchOrchestratorId: 'crypto_orchestrator',
    label: 'Crypto-Scoring via ScoringDispatcher; CryptoOrchestrator bleibt Research/Enrichment only.',
    hasDedicatedEngine: true,
  },
  commodity: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'commodityEvidenceScoring.scoreCommodityMarketEvidence',
    researchOrchestratorId: 'rawmaterials_orchestrator',
    label: 'Rohstoff-Scoring via ScoringDispatcher; RawMaterialsOrchestrator bleibt Research/Evidence only.',
    hasDedicatedEngine: true,
  },
  stock: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'traditionalAssetScoring.TraditionalAssetScoringService',
    label: 'Aktien-Scoring via ScoringDispatcher und registriertem Traditional Domain Executor.',
    hasDedicatedEngine: true,
  },
  forex: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'traditionalAssetScoring.TraditionalAssetScoringService',
    label: 'Forex-Scoring via ScoringDispatcher und registriertem Traditional Domain Executor.',
    hasDedicatedEngine: true,
  },
  index: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'traditionalAssetScoring.TraditionalAssetScoringService',
    label: 'Index-Scoring via ScoringDispatcher und registriertem Traditional Domain Executor.',
    hasDedicatedEngine: true,
  },
  bond: {
    engineId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    scoreAuthorityId: SUPERVISOR_CANONICAL_SCORE_AUTHORITY_ID,
    domainExecutorId: 'sovereignBenchmarkEvidenceScoring.scoreSovereignBenchmarkEvidence',
    label: 'Anleihen-Scoring via ScoringDispatcher: Sovereign-Benchmark-Rendite; kein Einzelanleihen-/Credit-/Duration-Score.',
    hasDedicatedEngine: true,
  },
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
  idempotencyClass: IdempotencyClass;
  requestedRetries: number;
  retrySuppressed: boolean;
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
  jitterMs?: number;
  idempotencyClass?: IdempotencyClass;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

function boundedRandom(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.999999, Math.max(0, value));
}

export async function executeSupervised<T>(
  taskName: string,
  fn: () => Promise<T>,
  options: SupervisionOptions = {}
): Promise<T> {
  const requestedRetries = Math.max(0, Math.floor(options.retries ?? 2));
  const idempotencyClass = options.idempotencyClass ?? 'SIDE_EFFECTING';
  const retrySafe = idempotencyClass === 'READ_ONLY' || idempotencyClass === 'IDEMPOTENT';
  const retries = retrySafe ? requestedRetries : 0;
  const backoffMs = Math.max(0, Math.floor(options.backoffMs ?? 500));
  const jitterMs = Math.max(0, Math.floor(options.jitterMs ?? Math.min(backoffMs, 250)));
  const sleepFn = options.sleep ?? sleep;
  const random = options.random ?? Math.random;
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
        idempotencyClass,
        requestedRetries,
        retrySuppressed: requestedRetries > 0 && !retrySafe,
      });
      return result;
    } catch (err) {
      lastError = err;
      if (attempt <= retries) {
        const exponential = backoffMs * Math.pow(2, attempt - 1);
        const jitter = Math.floor(boundedRandom(random) * jitterMs);
        await sleepFn(exponential + jitter);
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  recordExecution({
    taskName,
    attempts: retries + 1,
    succeeded: false,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    idempotencyClass,
    requestedRetries,
    retrySuppressed: requestedRetries > 0 && !retrySafe,
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

/** Lightweight finding for ESS-0002 spirit — observe/evaluate only; Supervisor never decides. */
export interface SupervisorFinding {
  id: string;
  category: 'execution' | 'provider_chain' | 'inventory';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  evidence: string;
  timestamp: string;
  recommendation: string;
}

function buildFindingsFromExecutions(
  recent: SupervisedExecutionRecord[],
  agentProviders: AgentProviderObservation,
): SupervisorFinding[] {
  const findings: SupervisorFinding[] = [];
  const now = new Date().toISOString();

  const failed = recent.filter(r => !r.succeeded).slice(0, 10);
  for (const f of failed) {
    findings.push({
      id: `exec-fail-${f.taskName}-${f.timestamp}`,
      category: 'execution',
      severity: 'MEDIUM',
      summary: `Supervised task failed after ${f.attempts} attempt(s): ${f.taskName}`,
      evidence: f.error ?? 'no error message',
      timestamp: f.timestamp,
      recommendation: 'Review task implementation and retry policy; Supervisor does not auto-remediate.',
    });
  }

  if (!agentProviders.inventoryComplete) {
    findings.push({
      id: 'provider-inventory-incomplete',
      category: 'inventory',
      severity: 'HIGH',
      summary: 'Canonical DEVELOPMENT Chain provider inventory incomplete',
      evidence: `Missing: ${agentProviders.missingProviders.join(', ') || 'unknown'}`,
      timestamp: now,
      recommendation: 'Register missing ChatGPT/Claude/Grok profiles before M8 cutover.',
    });
  }

  const blockedCanonical = Object.entries(agentProviders.cutoverByProvider)
    .filter(([id, status]) => agentProviders.expectedProviders.includes(id) && status === 'BLOCKED');
  if (blockedCanonical.length > 0) {
    findings.push({
      id: 'provider-cutover-blocked',
      category: 'provider_chain',
      severity: 'MEDIUM',
      summary: 'One or more canonical providers are cutover-BLOCKED (fail-closed without full M8 evidence)',
      evidence: blockedCanonical.map(([id, s]) => `${id}=${s}`).join('; '),
      timestamp: now,
      recommendation: 'Complete real-caller, control-plane, bypass, audit, rollback and host evidence per ADR-0062.',
    });
  }

  return findings;
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
  /** ESS-0002: observation of DEVELOPMENT Chain / AI value-chain agent providers (ChatGPT, Claude, Grok). */
  agentProviderChain: AgentProviderObservation;
  /** Lightweight findings — observation only; no decision authority. */
  findings: SupervisorFinding[];
  /** Pure remediation contract projection; it does not itself execute a recovery action. */
  selfHealingContract: SelfHealingContractSnapshot;
  /** SH-02.10 deterministic, non-destructive fault/convergence projection for the read-only Control Panel. */
  faultInjectionConvergence: FaultInjectionSuiteSnapshot;
  /** SH-02.4 dependency-resilience projection; provider-native retry remains owner-correct. */
  dependencyResilience: DependencyResilienceSnapshot;
  providerResilience: ProviderResilienceProjection[];
  capabilities: {
    taskRouting: boolean;
    toolSelection: boolean;
    executionControl: boolean;
    retry: boolean;
    recovery: boolean;
    selfHealing: boolean;
    selfHealingContract: boolean;
    faultInjectionConvergence: boolean;
    conflictResolution: boolean;
    providerHealth: boolean;
    marketDataRouting: boolean;
    marketIntegrityCalibration: boolean;
    screeningSla: boolean;
    scoreConfidenceEvidence: boolean;
    aiGovernance: boolean;
    agentProviderObservation: boolean;
    findings: boolean;
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
  const recentExecutions = getRecentExecutions();
  const agentProviderChain = observeAgentProviderChain();
  const findings = buildFindingsFromExecutions(recentExecutions, agentProviderChain);
  const selfHealingContract = getSelfHealingContractSnapshot();
  const faultInjectionConvergence = getFaultInjectionSuiteSnapshot();
  const dependencyResilience = getDependencyResilienceSnapshot();
  const providerHealth = getProviderHealth();
  const providerResilience = providerHealth.map(record => projectProviderResilience(record));

  return {
    routingTable: getRoutingTable(),
    recentExecutions,
    providerHealth,
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
    agentProviderChain,
    findings,
    selfHealingContract,
    faultInjectionConvergence,
    dependencyResilience,
    providerResilience,
    capabilities: {
      taskRouting: true,
      toolSelection: true,
      executionControl: true,
      retry: true,
      recovery: true,
      selfHealing: false,
      selfHealingContract: selfHealingContract.valid,
      faultInjectionConvergence: faultInjectionConvergence.complete,
      conflictResolution: true,
      providerHealth: true,
      marketDataRouting: true,
      marketIntegrityCalibration: true,
      screeningSla: true,
      scoreConfidenceEvidence: true,
      aiGovernance: true,
      agentProviderObservation: true,
      findings: true,
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
      'agentProviderChain: canonical providers ChatGPT, Claude, Grok (Owner 2026-08-16). Google AI Studio / NotebookLM / Gemini = RETIRED.',
      'findings: observation-only; Supervisor entscheidet niemals (ESS-0002).',
      `selfHealingContract: ${selfHealingContract.valid ? 'VALID' : 'INVALID'}; enabled=${selfHealingContract.enabledActionIds.join(',') || 'none'}; held=${selfHealingContract.heldActionIds.join(',') || 'none'}.`,
      `faultInjectionConvergence: ${faultInjectionConvergence.complete ? 'COMPLETE' : 'INCOMPLETE'}; scenarios=${faultInjectionConvergence.scenarioCount}/${faultInjectionConvergence.requiredScenarioCount}; baselineStaleCoverage=${faultInjectionConvergence.scenarioIds.includes('CURRENT_STATE_PROJECTION_BASELINE_STALE') ? 'COVERED' : 'MISSING'}; projection-only until SH-02.11 staged activation.`,
      `dependencyResilience: ${dependencyResilience.valid ? 'VALID' : 'INVALID'}; genericSafeRetry=${dependencyResilience.genericSafeRetryActivation}; provider-native retry/circuit/LKG remains owner-correct and is projected without nested retries. Runtime selfHealing remains false until staged activation in SH-02.11.`,
      ...agentProviderChain.notes,
    ],
  };
}
