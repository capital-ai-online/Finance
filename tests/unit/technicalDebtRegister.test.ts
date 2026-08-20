import { describe, expect, it } from 'vitest';
import type { QualityCenterEventName, QualityEventSink } from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { TechnicalDebtRegister } from '../../src/platform/Quality/TechnicalDebt/TechnicalDebtRegister';

describe('TechnicalDebtRegister', () => {
  it('records debt, publishes lifecycle evidence and requires evidence before resolution', () => {
    const events: QualityCenterEventName[] = [];
    const sink: QualityEventSink = { publish: (eventName) => { events.push(eventName); } };
    const register = new TechnicalDebtRegister([], sink);
    register.record({
      id: 'TD-QM-001',
      component: 'src/platform/Quality',
      cause: 'Missing complete test-gate evidence',
      impact: 'Gate 5 remains NOT_AVAILABLE',
      effort: 'MEDIUM',
      priority: 'MEDIUM',
      targetVersion: null,
      createdAt: '2026-08-20T00:00:00.000Z',
      sourceRefs: ['ESS-0005'],
    });

    expect(register.snapshot()).toMatchObject({
      schemaVersion: 'technical-debt-register/1.1.0',
      open: 1,
      resolved: 0,
      eventPublication: { attempted: 1, published: 1, failed: 0 },
    });
    expect(events).toEqual(['TechnicalDebtDetectedEvent']);
    expect(() => register.resolve('TD-QM-001', [])).toThrow(/requires non-empty evidence/);

    const resolved = register.resolve('TD-QM-001', ['PR-TEST-EVIDENCE'], '2026-08-20T01:00:00.000Z');
    expect(resolved.status).toBe('RESOLVED');
    expect(events).toEqual(['TechnicalDebtDetectedEvent', 'TechnicalDebtResolvedEvent']);
    expect(register.snapshot()).toMatchObject({
      open: 0,
      resolved: 1,
      eventPublication: { attempted: 2, published: 2, failed: 0 },
    });
  });

  it('never silently overwrites or closes an existing debt item', () => {
    const register = new TechnicalDebtRegister();
    const input = {
      id: 'TD-QM-002', component: 'Quality', cause: 'cause', impact: 'impact', effort: 'SMALL' as const,
      priority: 'LOW' as const, targetVersion: null, createdAt: '2026-08-20T00:00:00.000Z', sourceRefs: ['ESS-0005'],
    };
    register.record(input);
    expect(() => register.record(input)).toThrow(/already exists/);
    register.resolve(input.id, ['evidence']);
    expect(() => register.resolve(input.id, ['evidence-2'])).toThrow(/already resolved/);
  });

  it('keeps debt state auditable when EventMesh publication fails', () => {
    const sink: QualityEventSink = { publish: () => { throw new Error('transport unavailable'); } };
    const register = new TechnicalDebtRegister([], sink);
    register.record({
      id: 'TD-QM-003', component: 'Quality', cause: 'cause', impact: 'impact', effort: 'SMALL',
      priority: 'LOW', targetVersion: null, createdAt: '2026-08-20T00:00:00.000Z', sourceRefs: ['ESS-0005'],
    });
    expect(register.snapshot()).toMatchObject({
      open: 1,
      eventPublication: { attempted: 1, published: 0, failed: 1 },
    });
  });
});
