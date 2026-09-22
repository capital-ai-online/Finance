import { describe, expect, it } from 'vitest';
import {
  AAL2_DIAGNOSTIC_SUPERSESSION_ID,
  AAL2_REACTIVATION_STAGE,
  aal2DiagnosticState,
  isAal2EnabledFor,
} from '../../src/platform/Security/aal2DiagnosticSupersession';

describe('AAL2 diagnostic supersession', () => {
  it('starts in explicit Stage 0 with all AAL2 enforcement surfaces disabled', () => {
    expect(AAL2_DIAGNOSTIC_SUPERSESSION_ID).toBe(
      'CAPITAL-AI-AAL2-DIAGNOSTIC-SUPERSESSION-2026-09-22',
    );
    expect(AAL2_REACTIVATION_STAGE).toBe(0);
    expect(isAal2EnabledFor('login')).toBe(false);
    expect(isAal2EnabledFor('registration')).toBe(false);
    expect(isAal2EnabledFor('privileged')).toBe(false);
  });

  it('projects the stage without deleting or mutating factor state', () => {
    expect(aal2DiagnosticState('privileged')).toEqual({
      supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
      reactivationStage: 0,
      surface: 'privileged',
      aal2Required: false,
    });
  });
});
