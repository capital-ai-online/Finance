/**
 * Temporary Owner-directed AAL2 authentication diagnostic supersession.
 *
 * Stage 0 is intentionally active while the productive login stall is isolated. Native MFA
 * factors remain enrolled. This module controls only normal login and registration/onboarding
 * authentication; privileged server authorization remains on the independent CURRENT_MAIN
 * requireVerifiedAal2()/requireStepUp() boundary.
 *
 * Reactivation sequence:
 *   0 -> login + registration AAL2 requirements superseded
 *   1 -> login AAL2 can be re-enabled account-by-account via profiles.mfa_required_account
 *   2 -> registration/onboarding AAL2 requirement restored
 *
 * Change this stage only through the ordinary branch/PR/Human-CODEOWNER path. Do not introduce
 * email/user-id exceptions or a second runtime override.
 */

export const AAL2_DIAGNOSTIC_SUPERSESSION_ID =
  'CAPITAL-AI-AAL2-DIAGNOSTIC-SUPERSESSION-2026-09-22';

export const AAL2_REACTIVATION_STAGE = 0 as 0 | 1 | 2;

export type Aal2AuthenticationSurface = 'login' | 'registration';

const MIN_STAGE: Record<Aal2AuthenticationSurface, 1 | 2> = {
  login: 1,
  registration: 2,
};

export const AAL2_AUTH_TEST_QUARANTINE = AAL2_REACTIVATION_STAGE === 0;

export function isAal2EnabledFor(surface: Aal2AuthenticationSurface): boolean {
  return AAL2_REACTIVATION_STAGE >= MIN_STAGE[surface];
}

export function aal2DiagnosticState(surface: Aal2AuthenticationSurface) {
  return {
    supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
    reactivationStage: AAL2_REACTIVATION_STAGE,
    surface,
    aal2Required: isAal2EnabledFor(surface),
    privilegedServerAal2Unaffected: true,
  } as const;
}
