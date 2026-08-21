import { describe, expect, it } from 'vitest';
import {
  OrchestratorAgentRuntimeProjection,
} from '../../src/orchestrator/agentRuntimeProjection';
import {
  CryptoOrchestrator,
  CRYPTO_ORCHESTRATOR_AGENT_DESCRIPTORS,
} from '../../src/orchestrator/cryptoOrchestrator';
import {
  RawMaterialsOrchestrator,
  RAW_MATERIALS_ORCHESTRATOR_AGENT_DESCRIPTORS,
} from '../../src/orchestrator/rawMaterialsOrchestrator';
import { getAgentsRegistry } from '../../server/systemEvents';

describe('orchestrator-owned agent runtime projection', () => {
  it('projects all agents owned by actually constructed orchestrators into the read API', () => {
    new CryptoOrchestrator(null);
    new RawMaterialsOrchestrator(null);

    const projected = getAgentsRegistry();
    const ids = new Set(projected.map((agent) => agent.id));
    const expected = [
      ...CRYPTO_ORCHESTRATOR_AGENT_DESCRIPTORS,
      ...RAW_MATERIALS_ORCHESTRATOR_AGENT_DESCRIPTORS,
    ];

    for (const descriptor of expected) {
      expect(ids.has(descriptor.id)).toBe(true);
      expect(projected.find((agent) => agent.id === descriptor.id)).toEqual(expect.objectContaining({
        ...descriptor,
        status: 'IDLE',
        activeTask: 'Keine aktive Aufgabe',
        queriesCount: 0,
        performance: 'N/A',
      }));
    }
    expect(projected).toHaveLength(expected.length);
  });

  it('does not fabricate an unknown agent when activity is reported for an unregistered id', () => {
    const projection = new OrchestratorAgentRuntimeProjection();
    expect(projection.updateActivity('unknown.agent', 'should not exist', true)).toBe(false);
    expect(projection.list()).toEqual([]);
  });

  it('is idempotent for the same descriptor and fails closed for conflicting ownership', () => {
    const projection = new OrchestratorAgentRuntimeProjection();
    const descriptor = {
      id: 'test.agent',
      name: 'Test Agent',
      role: 'Regression test',
      orchestratorId: 'test_orchestrator',
      model: 'provider-neutral',
    } as const;

    projection.registerMany([descriptor]);
    projection.registerMany([descriptor]);
    expect(projection.list()).toHaveLength(1);

    expect(() => projection.registerMany([{
      ...descriptor,
      orchestratorId: 'other_orchestrator',
    }])).toThrow(/Conflicting descriptor/);
  });

  it('keeps activity state bound to the registered orchestrator-owned agent', () => {
    const projection = new OrchestratorAgentRuntimeProjection();
    projection.registerMany([{
      id: 'test.agent',
      name: 'Test Agent',
      role: 'Regression test',
      orchestratorId: 'test_orchestrator',
      model: 'provider-neutral',
    }]);

    expect(projection.updateActivity('test.agent', 'real task', true)).toBe(true);
    expect(projection.list()[0]).toEqual(expect.objectContaining({
      status: 'ACTIVE',
      activeTask: 'real task',
      queriesCount: 1,
    }));

    expect(projection.updateActivity('test.agent', 'ignored on stop', false)).toBe(true);
    expect(projection.list()[0]).toEqual(expect.objectContaining({
      status: 'IDLE',
      activeTask: 'Keine aktive Aufgabe',
      queriesCount: 1,
    }));
  });
});
