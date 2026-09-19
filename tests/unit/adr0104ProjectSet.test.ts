import { describe, expect, it } from 'vitest';
import {
  assertAdr0104SlotAvailable,
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

  it('projects FINTECH as the sole ADR-0104 owner for PVC-09 through PVC-17', () => {
    const [fintech] = resolveAdr0104ProjectSet(['CAPITAL-AI-FINTECH']);
    expect(fintech).toEqual({
      projectId: 'CAPITAL-AI-FINTECH',
      projectFolder: 'docs/projects/fintech/',
      projectStages: [
        'PVC-09',
        'PVC-10',
        'PVC-11',
        'PVC-12',
        'PVC-13',
        'PVC-14',
        'PVC-15',
        'PVC-16',
        'PVC-17',
      ],
      primaryOwner: 'CAPITAL-AI-FINTECH',
    });
    expect(() => resolveAdr0104ProjectSet(['CAPITAL-AI-DATA'])).toThrow('ADR0104_PROJECT_UNKNOWN');
  });

  it('rejects empty, duplicate and oversized sets', () => {
    expect(() => resolveAdr0104ProjectSet([])).toThrow('ADR0104_PROJECT_SET_INVALID');
    expect(() => resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-GOV'])).toThrow('ADR0104_PROJECT_SET_INVALID');
    expect(() => resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-OPS', 'CAPITAL-AI-DOC', 'CAPITAL-AI-FINTECH'])).toThrow('ADR0104_PROJECT_SET_INVALID');
  });

  it('rejects caller-invented projects and an initial project outside the set', () => {
    expect(() => resolveAdr0104ProjectSet(['docs/projects/governance/'])).toThrow('ADR0104_PROJECT_UNKNOWN');
    const set = resolveAdr0104ProjectSet(['CAPITAL-AI-GOV']);
    expect(() => assertInitialProjectMember(set, 'CAPITAL-AI-OPS')).toThrow('ADR0104_INITIAL_PROJECT_OUTSIDE_SET');
  });

  it('produces the same digest independent of selection order', () => {
    const a = resolveAdr0104ProjectSet(['CAPITAL-AI-GOV', 'CAPITAL-AI-OPS']);
    const b = resolveAdr0104ProjectSet(['CAPITAL-AI-OPS', 'CAPITAL-AI-GOV']);
    expect(digestAdr0104ProjectSet(a)).toBe(digestAdr0104ProjectSet(b));
  });

  it('fails closed for already-used S1/S2 and leaves only S3 available on v1.4.0 baseline', () => {
    expect(() => assertAdr0104SlotAvailable('ADR-0104-S1')).toThrow('ADR0104_SLOT_UNAVAILABLE');
    expect(() => assertAdr0104SlotAvailable('ADR-0104-S2')).toThrow('ADR0104_SLOT_UNAVAILABLE');
    expect(() => assertAdr0104SlotAvailable('ADR-0104-S3')).not.toThrow();
  });
});
