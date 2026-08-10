import { describe, expect, it } from 'vitest';
import { buildEventContractInventory } from '../../src/platform/EventMesh/Discovery/EventContractInventory';
import {
  assessEventSchemaCompatibility,
  assertEventRuntimeVersionContext,
} from '../../src/platform/EventMesh/Contracts/EventRuntimeVersionContext';

const definitions = [
  { name: 'ExampleEvent', category: 'System Events', essReferences: ['ESS-0013'], adrReferences: ['ADR-0018'] },
];

const components = [
  { component: 'Producer', manifestPath: '/Producer/manifest.json', events: { produces: ['ExampleEvent'], consumes: [] } },
  { component: 'Consumer', manifestPath: '/Consumer/manifest.json', events: { produces: [], consumes: ['ExampleEvent', 'UnknownEvent'] } },
];

describe('EventMesh E0 inventory', () => {
  it('builds a deterministic producer/consumer matrix and reports unregistered events', () => {
    const report = buildEventContractInventory(definitions, components);
    expect(report.events.map((event) => event.name)).toEqual(['ExampleEvent', 'UnknownEvent']);
    expect(report.events[0].producers).toEqual(['Producer']);
    expect(report.events[0].consumers).toEqual(['Consumer']);
    expect(report.events[0].gaps).toEqual([]);
    expect(report.events[1].gaps).toContain('UNREGISTERED_EVENT');
    expect(report.events[1].gaps).toContain('NO_AUTHORITY');
    expect(report.events[1].gaps).toContain('NO_PRODUCER');
  });
});

describe('EventMesh E3 version-aware contracts', () => {
  it('requires schema, producer, platform and commit provenance', () => {
    expect(() => assertEventRuntimeVersionContext({
      schemaVersion: '1.0.0',
      producerComponentVersion: '2.1.0',
      platformVersion: '0.6.0',
      sourceCommit: 'a'.repeat(40),
    })).not.toThrow();

    expect(() => assertEventRuntimeVersionContext({
      schemaVersion: '1',
      producerComponentVersion: '2.1.0',
      platformVersion: '0.6.0',
      sourceCommit: 'short',
    })).toThrow();
  });

  it('treats major schema changes as breaking and blocks downgrades', () => {
    expect(assessEventSchemaCompatibility('1.2.0', '1.3.0').compatible).toBe(true);
    expect(assessEventSchemaCompatibility('1.2.0', '2.0.0')).toMatchObject({ compatible: false, breaking: true });
    expect(assessEventSchemaCompatibility('1.2.0', '1.1.9')).toMatchObject({ compatible: false, breaking: false });
  });
});
