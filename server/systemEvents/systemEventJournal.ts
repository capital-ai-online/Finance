import { randomUUID } from 'node:crypto';

export type SystemEventType = 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
export type SystemEventStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: SystemEventType;
  action: string;
  details: string;
  status: SystemEventStatus;
}

export interface SystemEventInput {
  type: SystemEventType;
  action: string;
  details: string;
  status: SystemEventStatus;
}

export interface SystemEventJournalSnapshot {
  events: SystemEvent[];
  durability: 'ephemeral';
  authority: 'operational-read-model';
  auditAuthority: false;
  piiPersistence: false;
}

export interface OperationalSystemEventJournalOptions {
  maxRecent?: number;
}

const DEFAULT_MAX_RECENT = 100;

function normalizeText(value: string): string {
  return String(value ?? '').trim();
}

function cloneEvent(event: SystemEvent): SystemEvent {
  return { ...event };
}

/**
 * Bounded, process-local operational projection for Supervisor/admin UI.
 *
 * Authority boundaries:
 * - NOT an audit log and NOT compliance evidence (ADR-0059 owns agent audit evidence).
 * - NOT a security-event authority (`public.security_events` owns durable security denials).
 * - NOT a business-state store and never authorizes a mutation.
 * - Persists no actor email, user id or IP address; operational PII is intentionally not duplicated.
 * - Ephemeral-by-design is valid under ADR-0037 because this is non-authoritative diagnostics.
 *
 * A restart may clear this projection. That loss is acceptable and preferable to creating a
 * second durable log/retention authority. Durable evidence must be written by the canonical owner.
 */
export class OperationalSystemEventJournal {
  private readonly recent: SystemEvent[] = [];
  private readonly maxRecent: number;

  constructor(options: OperationalSystemEventJournalOptions = {}) {
    this.maxRecent = Math.max(1, options.maxRecent ?? DEFAULT_MAX_RECENT);
  }

  record(input: Readonly<SystemEventInput>): SystemEvent {
    const event: SystemEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type: input.type,
      action: normalizeText(input.action),
      details: normalizeText(input.details),
      status: input.status,
    };

    this.recent.unshift(event);
    if (this.recent.length > this.maxRecent) this.recent.length = this.maxRecent;
    return cloneEvent(event);
  }

  getRecent(limit = this.maxRecent): SystemEvent[] {
    return this.recent.slice(0, Math.max(0, limit)).map(cloneEvent);
  }

  async list(limit = this.maxRecent): Promise<SystemEventJournalSnapshot> {
    return {
      events: this.getRecent(Math.max(1, Math.min(limit, this.maxRecent))),
      durability: 'ephemeral',
      authority: 'operational-read-model',
      auditAuthority: false,
      piiPersistence: false,
    };
  }
}

export const operationalSystemEventJournal = new OperationalSystemEventJournal();
