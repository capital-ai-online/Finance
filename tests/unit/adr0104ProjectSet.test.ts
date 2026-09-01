import { describe, expect, it } from 'vitest';
import {
  assertInitialProjectMember,
  digestAdr0104ProjectSet,
  resolveAdr0104ProjectSet,
} from '../../server/ownerAuthorization/adr0104ProjectSet';

describe('ADR-0104 immutable project set', () => {
  it('resolves canonical server-owned metadata and sorts deterministically', () => {
    const set = resolveAdr0104ProjectSet(['CAPITAL-AI-OPS', 'CAPITAL-AI-GOV']);
    expect(set.map((item) => item.projectId)).toEqual(['CAPITAL-AI-GOV', 'CAPITAL-AI-OPS']);
    expect(set[0].projectFolder).toBe('docs/projects/governance/');
    expect(set[1].projectFolder).toBe('docs/projects/operations/');
  });

  it('rejects empty, duplicate and oversized sets', () => {
    expect(() => resolveAdr0104ProjectSet([])).toThrow('ADR0104_PROJECT_SET_INVALID');
    expect(() => resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-GOV'])).toThrow('ADR0104_PROJECT_SET_INVALID');
    expect(() => resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-OPS', 'CAPITAL-AI-DATA', 'CAPITAL-AI-FINTECH'])).toThrow('ADR0104_PROJECT_SET_INVALID');
  });

  it('rejects caller-invented projects', () => {
    expect(() => resolveAdr0104ProjectSet(['docs/projects/governance/'])).toThrow('ADR0104_PROJECT_UNKNOWN');
  });

  it('requires the initial project to be inside the immutable set', () => {
    const set = resolveAdr0104ProjectSet(['CAPITAL-AI-GOV']);
    expect(() => assertInitialProjectMember(set, 'CAPITAL-AI-OPS')).toThrow('ADR0104_INITIAL_PROJECT_OUTSIDE_SET');
  });

  it('produces the same digest independent of selection order', () => {
    const a = resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-OPS']);
    const b = resolveAdr0104ProjectSet(['CAPITAL-AI-OPS', 'CAPITAL-AI-GOV']);
    expect(digestAdr0104ProjectSet(a)).toBe(digestAdr0104ProjectSet(b));
  });
});
