import { describe, expect, it } from 'vitest';
import { capitalAiProcessGraphProjection } from '../../src/features/governance/ui/processGraph/capitalAiProcessGraphProjection';


describe('GOV-08 process graph projection', () => {
  it('projects the canonical 18 PVC stages without decision authority', () => {
    expect(capitalAiProcessGraphProjection.nodes).toHaveLength(18);
    expect(capitalAiProcessGraphProjection.edges).toHaveLength(17);
    expect(capitalAiProcessGraphProjection.decisionAuthority).toBe(false);
    expect(capitalAiProcessGraphProjection.nodes[0]).toMatchObject({ pvc: 'PVC-01', primaryOwner: 'CAPITAL-AI-CLIENT' });
    expect(capitalAiProcessGraphProjection.nodes[17]).toMatchObject({ pvc: 'PVC-18', primaryOwner: 'CAPITAL-AI-OPS' });
  });

  it('fails closed to UNKNOWN until OPS/PVC-18 supplies operational evidence', () => {
    for (const node of capitalAiProcessGraphProjection.nodes) {
      expect(node.state).toBe('UNKNOWN');
      expect(node.evidenceRefs).toEqual([]);
      expect(node.authority).toBe('NON_AUTHORIZING_PROJECTION');
    }
  });
});
