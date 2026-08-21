import { randomUUID } from 'node:crypto';
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../db';
import { getCleanEnv } from '../env';

export type SystemEventType = 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
export type SystemEventStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: SystemEventType;
  action: string;
  userEmail: string;
  details: string;
  status: SystemEventStatus;
  ip?: string;
}

export interface SystemEventInput {
  type: SystemEventType;
  action: string;
  userEmail: string;
  details: string;
  status: SystemEventStatus;
  ip?: string;
}

export type SystemEventJournalDurability = 'durable' | 'memory-only' | 'degraded';

export interface SystemEventJournalSnapshot {
  events: SystemEvent[];
  durability: SystemEventJournalDurability;
  authority: 'operational-read-model';
  auditAuthority: false;
}

export interface SystemEventDurableStore {
  append(event: Readonly<SystemEvent>): Promise<void>;
  list(limit: number): Promise<SystemEvent[]>;
}

export interface OperationalSystemEventJournalOptions {
  durableStore?: SystemEventDurableStore;
  production?: boolean;
  maxRecent?: number;
  onPersistenceError?: (error: unknown) => void;
}

const DEFAULT_MAX_RECENT = 100;

function normalizeText(value: string, fallback = ''): string {
  return String(value ?? fallback).trim();
}

function cloneEvent(event: SystemEvent): SystemEvent {
  return { ...event };
}

/**
 * Operational event read model for Supervisor/admin UI.
 *
 * This is intentionally NOT the ADR-0059 agent/security audit authority and MUST NOT be used for
 * authorization, compliance evidence or approval reconstruction. In production a configured
 * durable store is preferred; absence/failure degrades only this operational projection and never
 * falls back to mutable container files or synthetic seed events.
 */
export class OperationalSystemEventJournal {
  private readonly recent: SystemEvent[] = [];
  private readonly durableStore?: SystemEventDurableStore;
  private readonly production: boolean;
  private readonly maxRecent: number;
  private readonly onPersistenceError: (error: unknown) => void;
  private degraded = false;

  constructor(options: OperationalSystemEventJournalOptions = {}) {
    this.durableStore = options.durableStore;
    this.production = options.production ?? false;
    this.maxRecent = Math.max(1, options.maxRecent ?? DEFAULT_MAX_RECENT);
    this.onPersistenceError = options.onPersistenceError ?? (() => undefined);
  }

  record(input: Readonly<SystemEventInput>): SystemEvent {
    const event: SystemEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type: input.type,
      action: normalizeText(input.action),
      userEmail: normalizeText(input.userEmail, 'system') || 'system',
      details: normalizeText(input.details),
      status: input.status,
      ...(input.ip ? { ip: normalizeText(input.ip) } : {}),
    };

    this.recent.unshift(event);
    if (this.recent.length > this.maxRecent) this.recent.length = this.maxRecent;

    if (this.durableStore) {
      void this.durableStore.append(event).catch((error) => {
        this.degraded = true;
        this.onPersistenceError(error);
      });
    } else if (this.production) {
      this.degraded = true;
      this.onPersistenceError(new Error('[SystemEventJournal] production durable store is unavailable.'));
    }

    return cloneEvent(event);
  }

  getRecent(limit = this.maxRecent): SystemEvent[] {
    return this.recent.slice(0, Math.max(0, limit)).map(cloneEvent);
  }

  async list(limit = this.maxRecent): Promise<SystemEventJournalSnapshot> {
    const boundedLimit = Math.max(1, Math.min(limit, this.maxRecent));
    if (this.durableStore) {
      try {
        const events = (await this.durableStore.list(boundedLimit)).slice(0, boundedLimit).map(cloneEvent);
        this.recent.splice(0, this.recent.length, ...events);
        this.degraded = false;
        return { events, durability: 'durable', authority: 'operational-read-model', auditAuthority: false };
      } catch (error) {
        this.degraded = true;
        this.onPersistenceError(error);
      }
    }

    return {
      events: this.getRecent(boundedLimit),
      durability: this.degraded ? 'degraded' : 'memory-only',
      authority: 'operational-read-model',
      auditAuthority: false,
    };
  }
}

class SupabaseSystemEventStore implements SystemEventDurableStore {
  async append(event: Readonly<SystemEvent>): Promise<void> {
    const supabase = getPrivilegedServerSupabase();
    const { error } = await supabase.from('system_event_journal').insert({
      id: event.id,
      occurred_at: event.timestamp,
      event_type: event.type,
      action: event.action,
      actor_label: event.userEmail,
      details: event.details,
      status: event.status,
      ip_address: event.ip ?? null,
      source_component: 'server/systemEvents',
    });
    if (error) {
      throw new Error(`[SystemEventJournal] durable append failed: ${error.message || JSON.stringify(error)}`);
    }
  }

  async list(limit: number): Promise<SystemEvent[]> {
    const supabase = getPrivilegedServerSupabase();
    const { data, error } = await supabase
      .from('system_event_journal')
      .select('id, occurred_at, event_type, action, actor_label, details, status, ip_address')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) {
      throw new Error(`[SystemEventJournal] durable read failed: ${error.message || JSON.stringify(error)}`);
    }
    return (data ?? []).map((row: any) => ({
      id: String(row.id),
      timestamp: String(row.occurred_at),
      type: row.event_type as SystemEventType,
      action: String(row.action),
      userEmail: String(row.actor_label || 'system'),
      details: String(row.details),
      status: row.status as SystemEventStatus,
      ...(row.ip_address ? { ip: String(row.ip_address) } : {}),
    }));
  }
}

function createDefaultJournal(): OperationalSystemEventJournal {
  const production = getCleanEnv('NODE_ENV') === 'production';
  return new OperationalSystemEventJournal({
    production,
    durableStore: isPrivilegedSupabaseConfigured() ? new SupabaseSystemEventStore() : undefined,
    onPersistenceError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[SystemEventJournal][DEGRADED] ${message}`);
    },
  });
}

export const operationalSystemEventJournal = createDefaultJournal();
