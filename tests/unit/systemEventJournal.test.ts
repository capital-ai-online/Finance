import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OperationalSystemEventJournal } from '../../server/systemEvents/systemEventJournal';

describe('OperationalSystemEventJournal governance boundary', () => {
  it('stores only real recorded events and never invents seed history', async () => {
    const journal = new OperationalSystemEventJournal();
    expect(journal.getRecent()).toEqual([]);

    const event = journal.record({
      type: 'MARKET_DATA',
      action: 'Refresh Completed',
      details: 'Provider-observed refresh completed.',
      status: 'SUCCESS',
    });

    const snapshot = await journal.list();
    expect(snapshot).toEqual(expect.objectContaining({
      durability: 'ephemeral',
      authority: 'operational-read-model',
      auditAuthority: false,
      piiPersistence: false,
    }));
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.events[0].id).toBe(event.id);
  });

  it('is bounded and does not expose actor or IP fields', async () => {
    const journal = new OperationalSystemEventJournal({ maxRecent: 2 });
    journal.record({ type: 'ORCHESTRATOR', action: 'A', details: 'one', status: 'SUCCESS' });
    journal.record({ type: 'ORCHESTRATOR', action: 'B', details: 'two', status: 'SUCCESS' });
    journal.record({ type: 'ORCHESTRATOR', action: 'C', details: 'three', status: 'SUCCESS' });

    const events = (await journal.list()).events;
    expect(events.map((event) => event.action)).toEqual(['C', 'B']);
    expect(events[0]).not.toHaveProperty('userEmail');
    expect(events[0]).not.toHaveProperty('ip');
  });

  it('does not create a second durable logging or retention authority', () => {
    const journalSource = fs.readFileSync(
      path.join(process.cwd(), 'server/systemEvents/systemEventJournal.ts'),
      'utf8',
    );
    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20260821183300_system_event_journal.sql',
    );

    expect(journalSource).not.toContain('getPrivilegedServerSupabase');
    expect(journalSource).not.toContain("from('system_event_journal')");
    expect(journalSource).toContain('public.security_events');
    expect(journalSource).toContain('ADR-0059');
    expect(fs.existsSync(migrationPath)).toBe(false);
  });

  it('retires legacy file state, synthetic seeds and runtime mutation surfaces', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'server/systemEvents.ts'), 'utf8');
    expect(source).not.toContain('uploads/system_events.json');
    expect(source).not.toContain('uploads/agents_registry.json');
    expect(source).not.toContain('Credits Purchase Webhook');
    expect(source).not.toContain('Model Routing Swapped');
    expect(source).not.toContain('fs.writeFileSync');
    expect(source).not.toContain('Find next ADR number');
    expect(source).not.toContain("get('/system-events/stream'");
    expect(source).toContain('RUNTIME_DERIVED_OPERATIONAL_EVENT_REQUIRED');
    expect(source).toContain('REPOSITORY_CONTROL_PLANE_REQUIRED');
    expect(source).toContain('RUNTIME_DERIVED_STATE_REQUIRED');
  });
});
