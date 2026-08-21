import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  OperationalSystemEventJournal,
  type SystemEvent,
  type SystemEventDurableStore,
} from '../../server/systemEvents/systemEventJournal';

describe('OperationalSystemEventJournal governance boundary', () => {
  it('stores only real recorded events and never invents seed history', async () => {
    const journal = new OperationalSystemEventJournal({ production: false });
    expect(journal.getRecent()).toEqual([]);

    const event = journal.record({
      type: 'MARKET_DATA',
      action: 'Refresh Completed',
      userEmail: 'system',
      details: 'Provider-observed refresh completed.',
      status: 'SUCCESS',
    });

    const snapshot = await journal.list();
    expect(snapshot.authority).toBe('operational-read-model');
    expect(snapshot.auditAuthority).toBe(false);
    expect(snapshot.durability).toBe('memory-only');
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.events[0].id).toBe(event.id);
  });

  it('uses a durable store when configured without changing audit authority', async () => {
    const durable: SystemEvent[] = [];
    const store: SystemEventDurableStore = {
      append: vi.fn(async (event) => {
        durable.unshift({ ...event });
      }),
      list: vi.fn(async (limit) => durable.slice(0, limit)),
    };
    const journal = new OperationalSystemEventJournal({ durableStore: store, production: true });

    journal.record({
      type: 'ORCHESTRATOR',
      action: 'Research Pipeline Executed',
      userEmail: 'system',
      details: 'Actual execution telemetry.',
      status: 'SUCCESS',
    });
    await vi.waitFor(() => expect(store.append).toHaveBeenCalledTimes(1));

    const snapshot = await journal.list();
    expect(snapshot.durability).toBe('durable');
    expect(snapshot.auditAuthority).toBe(false);
    expect(snapshot.events).toHaveLength(1);
  });

  it('marks missing production durability as degraded instead of writing a local file', async () => {
    const onPersistenceError = vi.fn();
    const journal = new OperationalSystemEventJournal({
      production: true,
      onPersistenceError,
    });

    journal.record({
      type: 'SECURITY',
      action: 'Operational Projection Test',
      userEmail: 'system',
      details: 'No durable store configured.',
      status: 'WARNING',
    });
    const snapshot = await journal.list();

    expect(snapshot.durability).toBe('degraded');
    expect(onPersistenceError).toHaveBeenCalledTimes(1);
  });

  it('retires legacy file state, synthetic seeds and runtime ADR generation', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'server/systemEvents.ts'), 'utf8');
    expect(source).not.toContain('uploads/system_events.json');
    expect(source).not.toContain('uploads/agents_registry.json');
    expect(source).not.toContain('Credits Purchase Webhook');
    expect(source).not.toContain('Model Routing Swapped');
    expect(source).not.toContain('fs.writeFileSync');
    expect(source).not.toContain('Find next ADR number');
    expect(source).toContain('REPOSITORY_CONTROL_PLANE_REQUIRED');
    expect(source).toContain('RUNTIME_DERIVED_STATE_REQUIRED');
  });
});
