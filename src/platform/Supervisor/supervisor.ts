/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { eventMeshBus } from '../EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../EventMesh/Services/EventMeshService';
import { getProviderHealth, type ProviderHealthRecord } from './providerHealth';
import { getAiGovernanceInventory } from '../../services/aiGovernance';

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
  bond: { engineId: 'heuristic_fallback', label: 'Kein dediziertes Anleihen-Scoring implementiert', hasDedicatedEngine: false },
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

export interface SupervisorStatus {
  routingTable: Record<AssetClass, TaskRoute>;
  recentExecutions: SupervisedExecutionRecord[];
  providerHealth: ProviderHealthRecord[];
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
    aiGovernance: boolean;
  };
  notes: string[];
}

export function getSupervisorStatus(): SupervisorStatus {
  const aiInventory = getAiGovernanceInventory();
  const warnings = aiInventory.recentEvaluations.filter(record => record.outcome === 'WARN').length;
  const failures = aiInventory.recentEvaluations.filter(record => record.outcome === 'FAIL').length;
  return {
    routingTable: getRoutingTable(),
    recentExecutions: getRecentExecutions(),
    providerHealth: getProviderHealth(),
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
      conflictResolution: false,
      providerHealth: true,
      aiGovernance: true,
    },
    notes: [
      'conflictResolution: nicht implementiert - pro Anlageklasse existiert aktuell eine autoritative Scoring-Engine; echte konkurrierende Entscheidungsquellen liegen nicht vor.',
      'providerHealth: runtime-basiert; nur tatsächlich beobachtete Provider-Aufrufe erscheinen im Status.',
      'aiGovernance: runtime-basiert; Evaluationen erscheinen erst, nachdem ein instrumentierter AI-Aufruf tatsächlich ausgeführt wurde.',
    ],
  };
}
