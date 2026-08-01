/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ARCH-AUDIT-0002 (H4, Kapitel 4.4): "src/platform/Supervisor/ enthaelt in beiden Staenden
// null TypeScript-Dateien. Was 'Supervisor' heisst, ist ein Frontend-Dashboard
// (SupervisorDashboard.tsx), das vier Endpunkte liest [...]. Es enthaelt keine Steuerungslogik."
// Dieses Modul ist die reale Komponente, die die Manifest-Beschreibung einloest.
//
// Der Befund nennt sieben erwartete Faehigkeiten: Task Routing, Execution Control, Retry,
// Recovery, Conflict Resolution, Self Healing, Tool Selection. Ehrliche Bestandsaufnahme
// statt Vollstaendigkeits-Behauptung (No-Demo-Data-Policy gilt hier genauso fuer
// Architektur-Beschreibungen wie fuer Messwerte):
//
// ECHT IMPLEMENTIERT:
// - Task Routing / Tool Selection: routeTask() bildet Anlageklasse -> zustaendige Engine
//   strukturell ab (dieselbe Zuordnung, die bisher implizit in server.ts' calculateAssetScore()
//   verstreut war, jetzt an einer Stelle abfragbar).
// - Execution Control / Retry / Recovery / Self Healing: executeSupervised() fuehrt eine
//   uebergebene asynchrone Aufgabe mit echtem Retry-mit-Backoff aus, statt (wie zuvor an allen
//   Aufrufstellen in server.ts) bei einem einzelnen Fehlschlag sofort aufzugeben. Jede
//   Ausfuehrung wird in einem beschraenkten Ringpuffer aufgezeichnet (Task, Versuche, Ergebnis,
//   Dauer) - echte, aus tatsaechlichen Aufrufen entstandene Daten, keine Platzhalter.
//
// NICHT IMPLEMENTIERT (bewusst, mit Begruendung statt stillschweigend):
// - Conflict Resolution: setzt mehrere konkurrierende Quellen fuer dieselbe Entscheidung
//   voraus. Die aktuelle Architektur hat pro Anlageklasse genau EINE autoritative Engine
//   (siehe routeTask()) - es gibt aktuell keinen echten Konflikt aufzuloesen. Wird erst
//   relevant, wenn z.B. mehrere Scoring-Quellen fuer dieselbe Anlageklasse konkurrieren.

import { eventMeshBus } from '../EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../EventMesh/Services/EventMeshService';

export type AssetClass = 'crypto' | 'commodity' | 'stock' | 'forex' | 'index' | 'bond';

export interface TaskRoute {
  engineId: string;
  label: string;
  /** true, wenn diese Anlageklasse aktuell auf eine reale Fachengine geroutet wird. */
  hasDedicatedEngine: boolean;
}

// Audit ARCH-AUDIT-0002 (S6, H1): dieselbe Einordnung wie assetRegistry/server.ts
// getScoreBasis() - hier zentral als Routing-Tabelle statt an mehreren Stellen implizit.
const TASK_ROUTING_TABLE: Record<AssetClass, TaskRoute> = {
  crypto: { engineId: 'crypto_orchestrator', label: 'Crypto/DeFi/Meme-Coin Scoring (real-marktdatenbasiert)', hasDedicatedEngine: true },
  commodity: { engineId: 'rawmaterials_orchestrator', label: 'Rohstoff-Scoring (dedizierte Fachengine)', hasDedicatedEngine: true },
  stock: { engineId: 'traditional_asset_engine', label: 'Aktien-Scoring (Technik + Alpha-Vantage-Fundamentaldaten, H1)', hasDedicatedEngine: true },
  forex: { engineId: 'traditional_asset_engine', label: 'Forex-Scoring (rein technisch, H1)', hasDedicatedEngine: true },
  index: { engineId: 'heuristic_fallback', label: 'Momentum-Heuristik (keine Live-Kursquelle fuer Indizes vorhanden)', hasDedicatedEngine: false },
  bond: { engineId: 'heuristic_fallback', label: 'Momentum-Heuristik (kein Anleihen-Scoring implementiert)', hasDedicatedEngine: false },
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
  /** Zusaetzliche Versuche NACH dem ersten - 2 bedeutet insgesamt 3 Versuche. Default 2. */
  retries?: number;
  /** Basis-Backoff in ms, verdoppelt sich je Versuch (Standard-Exponential-Backoff). Default 500. */
  backoffMs?: number;
}

/**
 * Fuehrt eine asynchrone Aufgabe mit echtem Retry-mit-Backoff aus (Execution Control/Retry/
 * Recovery/Self Healing). Wirft erst, wenn ALLE Versuche fehlgeschlagen sind. Jede Ausfuehrung
 * (erfolgreich oder nicht) wird im Ringpuffer aufgezeichnet; ein endgueltig fehlgeschlagener
 * Task veroeffentlicht zusaetzlich ein SupervisorAlertEvent ueber die Enterprise Event Mesh
 * (Manifest-Zusage src/platform/Supervisor/manifest.json: "produces": ["SupervisorAlertEvent"]).
 */
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
      if (attempt <= retries) {
        await sleep(backoffMs * Math.pow(2, attempt - 1));
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
    // Event-Mesh-Veroeffentlichung ist best-effort - darf den urspruenglichen Fehler
    // nicht verschlucken oder einen zweiten, verwirrenden Fehler nach oben werfen.
  }

  throw lastError;
}

export interface SupervisorStatus {
  routingTable: Record<AssetClass, TaskRoute>;
  recentExecutions: SupervisedExecutionRecord[];
  capabilities: {
    taskRouting: boolean;
    toolSelection: boolean;
    executionControl: boolean;
    retry: boolean;
    recovery: boolean;
    selfHealing: boolean;
    conflictResolution: boolean;
  };
  notes: string[];
}

export function getSupervisorStatus(): SupervisorStatus {
  return {
    routingTable: getRoutingTable(),
    recentExecutions: getRecentExecutions(),
    capabilities: {
      taskRouting: true,
      toolSelection: true,
      executionControl: true,
      retry: true,
      recovery: true,
      selfHealing: true,
      conflictResolution: false,
    },
    notes: [
      'conflictResolution: nicht implementiert - die aktuelle Architektur hat pro Anlageklasse genau eine autoritative Engine, es gibt aktuell keinen echten Konflikt zwischen mehreren Quellen aufzuloesen.',
    ],
  };
}
