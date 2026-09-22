/**
 * Temporary Owner-directed AAL2 diagnostic supersession.
 *
 * Stage 0 is intentionally active while the productive login stall is isolated. Native MFA
 * factors remain enrolled; this module only controls whether AAL2 is REQUIRED at each surface.
 *
 * Reactivation sequence:
 *   0 -> all AAL2 requirements superseded
 *   1 -> login AAL2 can be re-enabled account-by-account via profiles.mfa_required_account
 *   2 -> registration/onboarding requires native AAL2 again
 *   3 -> privileged server actions require provider-verified AAL2 again (fully restored)
 *
 * Change this stage only through the ordinary branch/PR/Human-CODEOWNER path. Do not introduce
 * email/user-id exceptions or a second runtime override.
 */

export const AAL2_DIAGNOSTIC_SUPERSESSION_ID =
  'CAPITAL-AI-AAL2-DIAGNOSTIC-SUPERSESSION-2026-09-22';

export const AAL2_REACTIVATION_STAGE = 0 as 0 | 1 | 2 | 3;

export type Aal2Surface = 'login' | 'registration' | 'privileged';

const MIN_STAGE: Record<Aal2Surface, 1 | 2 | 3> = {
  login: 1,
  registration: 2,
  privileged: 3,
};

export function isAal2EnabledFor(surface: Aal2Surface): boolean {
  return AAL2_REACTIVATION_STAGE >= MIN_STAGE[surface];
}

export function aal2DiagnosticState(surface: Aal2Surface) {
  return {
    supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
    reactivationStage: AAL2_REACTIVATION_STAGE,
    surface,
    aal2Required: isAal2EnabledFor(surface),
  } as const;
}
