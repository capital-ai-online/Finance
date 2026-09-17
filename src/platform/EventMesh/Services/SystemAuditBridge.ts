// ADR-0018, Folgeentscheidung 3 — additive Bruecke zwischen dem bestehenden,
// produktiven Audit-Log-Mechanismus (server/systemEvents.ts) und der Enterprise
// Event Mesh. Der bestehende Mechanismus (dateibasiertes Log + SSE-Broadcast an das
// Admin-Portal) bleibt vollstaendig unveraendert und ist die einzige Quelle, auf die
// sich Aufrufer verlassen duerfen. Diese Bruecke ergaenzt eine zusaetzliche,
// bestmoegliche Veroeffentlichung ueber den Event Bus - ein Fehler hier darf niemals
// den Audit-Log-Schreibvorgang selbst gefaehrden, weshalb server/systemEvents.ts
// diese Funktion in einem eigenen try/catch aufruft.

import { eventMeshBus } from '../Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from './EventMeshService';

export type SystemAuditEventType =
  | 'AUTH'
  | 'SUBSCRIPTION'
  | 'CREDITS'
  | 'ORCHESTRATOR'
  | 'MARKET_DATA'
  | 'SECURITY';

export interface SystemAuditPayload {
  type: SystemAuditEventType;
  action: string;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ip?: string;
}

/**
 * Veroeffentlicht ein SystemAuditEvent ueber die Enterprise Event Mesh. Bootstrapped
 * die Mesh beim ersten Aufruf (Katalog-Seed + Discovery), danach idempotent.
 */
export function publishSystemAuditEvent(payload: SystemAuditPayload): void {
  if (!isBootstrapped()) {
    bootstrapEventMesh(eventMeshBus);
  }
  eventMeshBus.publish('SystemAuditEvent', { ...payload }, {
    sourceComponent: 'server/systemEvents',
    essReferences: ['ESS-0013', 'ESS-0001-CONTRACTS'],
    adrReferences: ['ADR-0018'],
  });
}
