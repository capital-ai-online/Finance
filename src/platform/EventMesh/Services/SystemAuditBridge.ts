// ADR-0018 compatibility bridge from the bounded operational system-event projection to the
// in-process Enterprise Event Mesh.
//
// IMPORTANT: `SystemAuditEvent` is a legacy catalog name. Neither this bridge nor Event Mesh is an
// audit authority, durable evidence store, authorization source or compliance ledger. Durable
// security denials remain owned by public.security_events; agent/action audit evidence remains
// owned by ADR-0059 / agent_audit_events. The bridge intentionally carries no actor email or IP so
// operational telemetry does not duplicate PII held by those canonical authorities.

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
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

/** Publishes a best-effort, non-authorizing operational signal to the in-process Event Mesh. */
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
