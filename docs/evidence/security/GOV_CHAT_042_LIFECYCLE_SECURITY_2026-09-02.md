# CAPITAL-AI-SEC — GOV-CHAT-042 Lifecycle Security Integration Evidence

**Work item:** `GOV-CHAT-042`  
**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Entry main:** `fad74e34fcfff514d315543840fecf43359624e8`  
**Branch:** `agent/security-lifecycle-security-hardening-20260902`  
**Date:** 2026-09-02  
**Authority effect:** none  
**Production mutation:** none  
**Release:** NOT AUTHORIZED  
**Production:** NOT AUTHORIZED

## Scope and ownership

CAPITAL-AI-SEC owns the independent Security assessment, Security test design, finding lifecycle and verification evidence. It owns no productive `PVC-*` stage. Productive remediation remains with the Primary Project Owner for the affected stage unless the change is inherently reusable Security infrastructure under `src/platform/Security`.

Current lifecycle routing relevant to this assessment:

- `PVC-02` — CAPITAL-AI-OPS / Controlled Implementation;
- `PVC-05` — CAPITAL-AI-GOV / Platform Director and authority-lifecycle reconciliation;
- `PVC-08` — CAPITAL-AI-OPS / provider and Production Operations evidence;
- `PVC-18` — CAPITAL-AI-OPS / EventMesh and Traceability transport/evidence linkage only.

Frontend remains a projection/interaction layer and has no productive PVC ownership.

## Correlated upstream evidence

- OPS lifecycle harness implementation: PR #683 merged; work claim released on current main.
- FE auth-lifecycle remediation: PR #723 merged into current main.
- OPS provider evidence remains explicitly partial: Supabase Local application-schema replay and Stripe Sandbox/Test Clock execution are `NOT_AVAILABLE`; the subscription identity migration is repository-implemented but not deployed.
- Existing Security finding `S1-R2-06` already records incomplete server-side entitlement/capability enforcement for several protected product capabilities.

Missing provider/runtime evidence is not converted into Security PASS.

## Security boundary matrix

| Lifecycle stage | Security boundary | Canonical authority | Existing control | Security result |
|---|---|---|---|---|
| Unauthenticated | public/private separation | Supabase Auth + application routing | no browser session grants server authority | repository contract present |
| Registration | registration policy + provider identity | Supabase Auth | self-registration currently controlled-disabled in `SessionComposition` | fail-closed client flow; provider policy not independently runtime-tested here |
| Authentication | bearer token → verified provider identity | Supabase Auth | `resolveVerifiedIdentity()` / `supabase.auth.getUser(token)` | PASS at repository contract level |
| Session establishment | provider-managed session + app bootstrap | Supabase Auth SDK | single auth-state source, bounded bootstrap key, live post-MFA session read | PASS at repository contract level |
| Onboarding | lifecycle projection before app session | existing onboarding contract | `needsOnboarding()` + `RegistrationCompletionGate` | client gating present; not authorization authority |
| MFA enrollment | native provider factor lifecycle | Supabase MFA | native MFA flow + server AAL2 verification surfaces | server verification exists |
| MFA verification | assurance level | Supabase MFA | `requireVerifiedAal2()` reads provider AAL from bearer token | PASS for server AAL2 boundary; application-wide runtime coverage not fully proven |
| Authenticated application | session projection | Supabase Auth | post-MFA identity match before `handleSupabaseSession()` | PASS at repository contract level |
| Subscription | provider event + server projection | Stripe + server subscription projection | signed webhook/inbox + canonical projection | repository control present; provider execution partial |
| Entitlement readback | authenticated server readback | server-side subscription source | `/api/stripe/user-subscription` resolves verified identity and `getSubscription(identity.userId)` | PASS for readback boundary |
| Privileged action | server authorization + capability/assurance | IAM / feature-specific server boundary | `checkAdminAccess()`, `requireVerifiedAal2()`, `requireStepUp()` and feature controls where implemented | OPEN for capabilities already identified by `S1-R2-06` |
| Logout | provider session invalidation + UI reset | Supabase Auth | explicit `local`/`global` sign-out, bounded timeout, projection reset | repository contract present; JWT residual window remains |
| Session revocation | provider session semantics | Supabase Auth | refresh/session invalidation; access JWT semantics provider-defined | runtime verification incomplete |

## Authority map

| Concern | Canonical authority / component | GOV-CHAT-042 rule |
|---|---|---|
| Authentication | Supabase Auth, consumed by `src/platform/Security/authMiddleware.ts` and application auth composition | no second authentication authority |
| Identity | `resolveVerifiedIdentity()` over Supabase `getUser(token)` | client IDs/emails are not identity authority |
| Session | Supabase Auth session/refresh/sign-out semantics | no custom session registry |
| MFA | Supabase native MFA/AAL; server `requireVerifiedAal2()` | UI MFA state is projection only |
| Authorization | IAM/feature-specific server enforcement, including `checkAdminAccess()` / step-up contracts | frontend visibility is never authorization |
| Entitlement | authenticated server subscription/capability source | browser tier/cache is non-authoritative |
| Frontend | `src/app/**`, `src/features/**` presentation/composition | projection / interaction only |
| Lifecycle harness | `scripts/operations/userLifecycleHarness.ts` | validation/orchestration/evidence only |
| EventMesh | existing transport boundary / `PVC-18` | transport only; no Security decision |
| Traceability | existing evidence/trace surfaces | linkage only; no Security decision |

## Threat matrix

| Threat | Correlated control | Result / gap |
|---|---|---|
| Authentication bypass | verified bearer identity; password login and self-registration controlled-disabled in current FE composition | repository control PASS; provider runtime abuse controls not fully exercised |
| Authorization bypass | server IAM/step-up plus feature-specific capability gates | OPEN where `S1-R2-06` found missing/alternate-path enforcement |
| MFA bypass | onboarding → MFA gate in FE; server `requireVerifiedAal2()` for privileged assurance | server boundary exists; universal application-AAL2 enforcement is not inferred from FE gating |
| Session fixation | provider-managed session; no custom session ID issuance | no repository-level custom fixation surface found |
| Session replay / theft | bearer validation, bounded refresh/retry | provider/JWT residual risk; XSS or stolen live token remains material until expiry/revocation semantics apply |
| Stale session acceptance | backend revalidates bearer identity; `authFetch()` handles one refresh/retry then unauthorized | provider runtime revocation behavior not fully exercised |
| Stale entitlement acceptance | server readback uses verified identity | UI can become stale; protected actions must independently enforce current capability; `S1-R2-06` remains open |
| Privilege escalation / IDOR | verified identity; no userId/email query authority on subscription readback | readback protected; capability-specific gaps remain routed |
| Confused deputy | server resolves actor identity itself | no client identity delegation on correlated readback path |
| Client-side authorization trust | FE tier/localStorage is projection | PASS as design rule; not sufficient for capabilities lacking server enforcement |
| Account enumeration | generic authentication-required server errors on correlated readback | no enumeration path identified in reviewed lifecycle surface; provider auth endpoints not runtime-tested here |
| Credential stuffing / brute force | password login currently disabled; provider/native login path | reduced password surface; provider abuse controls remain provider/config evidence |
| Lifecycle transition replay | session bootstrap dedupe; single-use step-up tokens | repository controls present; provider E2E replay not fully exercised |
| CSRF | correlated protected APIs use explicit bearer header rather than browser cookie authority | no material cookie-auth CSRF boundary identified in reviewed paths |
| XSS impact on Auth/Session | CSP program exists; bearer/session accessible through active browser application context | residual impact remains high; strict CSP promotion evidence remains separately open under `S1-R2-09` |
| Insecure logout / incomplete global logout | explicit local/global sign-out and local projection reset | issued access JWTs can remain valid until expiry under provider semantics |
| Race / TOCTOU | post-MFA live-session re-read; bounded refresh dedupe | entitlement revocation between UI readback and action is safe only where the action has server capability enforcement |
| Open redirect | existing Security finding `S1-R2-05` routes Stripe redirect boundary to OPS | OPEN / inherited Security finding |
| Sensitive error leakage | generic client-facing auth failures; internal logs retain diagnostics | no raw DB/stack leakage found in correlated readback; broader runtime logs not reverified here |

## Session security assessment

Current implementation delegates creation, renewal, refresh, rotation and invalidation semantics to Supabase Auth. `authFetch()` obtains the live SDK session, performs at most one deduplicated refresh/retry after a 401 and emits the global unauthorized event only after the retry also fails. `SessionComposition` performs explicit local/global sign-out and clears onboarding/MFA/session projection in a `finally` block.

Security does **not** introduce a custom revocation list or token registry. The known provider semantic remains: already-issued access JWTs can remain usable until expiry after sign-out/revocation while refresh/session state is revoked. Stronger instantaneous revocation would require a separately owned provider/session design decision, not an ad-hoc SEC session authority.

## MFA assessment

MFA enrollment/verification is not treated as a browser boolean. The server helper `requireVerifiedAal2()` resolves the user from the bearer token and asks Supabase for the current authenticator assurance level. `requireStepUp()` additionally binds a one-time, purpose-bound, unexpired step-up token to that AAL2 identity and marks it used atomically through the existing database boundary.

The frontend `LoginStepUpGate` is interaction/orchestration only. After verification, the application re-reads the live Supabase session and rejects an identity mismatch before projecting authenticated application state.

**Residual:** this assessment does not infer that every authenticated API requires AAL2 merely because the frontend gates the dashboard. Privileged endpoints must call the canonical server assurance/authorization boundary where required. Existing step-up infrastructure is present; no new step-up architecture is required by GOV-CHAT-042.

## Entitlement / authorization assessment

The subscription readback itself is correctly separated:

`Bearer token → verified Supabase identity → getSubscription(identity.userId) → validated tier projection`.

A Checkout redirect, email address, localStorage value, client `userId`, client role or cached subscription tier is not authority.

However, **subscription readback is not equivalent to authorization**. The existing `S1-R2-06` inventory already identifies protected capabilities with incomplete or alternate-path server enforcement. Therefore GOV-CHAT-042 cannot claim Authorization/Entitlement PASS for the full product lifecycle until those target-owned capability gaps return implementation and exact verification evidence.

## Abuse-case matrix

| Abuse case | Expected secure behavior | Existing behavior | Gap |
|---|---|---|---|
| Direct privileged URL | server denies unless identity/role/assurance/capability allows | FE routing is not relied on by canonical server controls | capability-specific `S1-R2-06` gaps remain |
| Manipulated frontend state | no authority change | server readback ignores browser identity/tier | protected features without server capability gate remain open |
| Modified localStorage | no authority change | `mcc_user_session` is projection only | same capability-specific residual |
| Old browser session | invalid/revoked session ultimately receives 401 and projection resets | bounded refresh/retry + unauthorized logout | provider revocation E2E not executed |
| Subscription removed server-side | next authoritative check denies paid capability | readback is server-based | safe only when action rechecks capability; TOCTOU gap otherwise |
| Stale entitlement cache | server action must ignore stale client cache | readback on session establishment is authoritative for UI projection | action-level enforcement incomplete for known capabilities |
| MFA incomplete | protected flow remains blocked | FE gate + server AAL2 helper for assurance-sensitive actions | universal API AAL2 not inferred |
| Global revocation | refresh/session state revoked; UI resets; protected requests fail as provider semantics take effect | explicit global sign-out exists | access JWT may remain valid until expiry |
| Two tabs disagree | server remains authority; stale tab should recover on failed request | shared provider session + auth unauthorized event | browser E2E stale-tab scenario not independently executed |
| Out-of-order API responses | old response must not grant server capability | server remains decision point | UI race cannot be called Security PASS without browser/runtime evidence |

## Existing Security evidence baseline

Reused rather than duplicated:

- `tests/unit/authMiddlewareAal2.test.ts`;
- `tests/integration/nativeMfaAal2.test.ts`;
- `tests/unit/sessionCompositionSecurityBoundary.test.ts`;
- `tests/unit/postMfaSubscriptionHandoffRegression.test.ts`;
- `tests/unit/subscriptionReadbackAuthContract.test.ts`;
- `tests/unit/s1R2EntitlementAuthority.test.ts`;
- `tests/unit/authLifecycleRemediation.test.ts`;
- `tests/unit/userLifecycleHarness.test.ts`;
- `tests/provider/userLifecycleProviderContract.test.ts`;
- OPS lifecycle evidence and existing Security roadmap/work-package/traceability surfaces.

GOV-CHAT-042 adds `tests/unit/userLifecycleSecurityContract.test.ts` only as a cross-boundary regression contract tying these canonical surfaces together; it creates no new authority.

## Confirmed Security gaps / residual risks

### ULS-SEC-001 — Production subscription identity projection not yet verified

OPS evidence records that the repository migration moves subscription identity authority from email to `metadata.user_id`, but the migration was **not deployed** by GOV-CHAT-040. Security therefore cannot verify Production entitlement identity against the remediated contract.

**Routing:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`, `project_namespace: PVC`, `project_stage: PVC-08`.  
**Required evidence:** authorized Production migration/deployment evidence plus exact post-change read-only verification proving subscription ownership is keyed by verified Auth user ID and fails closed on missing/malformed identity.  
**Status:** `WAITING_FOR_EVIDENCE`.

### ULS-SEC-002 — Provider lifecycle scenarios remain NOT_AVAILABLE

Supabase Local application-schema/RLS replay and Stripe Sandbox/Test Clock scenarios were not executed in the OPS evidence set. Payment-failure and true provider redelivery/duplicate-webhook evidence also remain unavailable.

**Routing:** `[SECURITY_HANDOFF -> CAPITAL-AI-OPS | VC-08]`.  
**Required evidence:** truthful local/sandbox execution where infrastructure exists; unavailable scenarios remain `NOT_AVAILABLE`.  
**Status:** `WAITING_FOR_EVIDENCE`.

### ULS-SEC-003 — Full protected-capability server enforcement remains incomplete

Existing `S1-R2-06` evidence identifies multiple premium/protected capabilities whose server enforcement is missing, partial or bypassable through alternate paths. UI subscription state cannot close this finding.

**Routing:** preserve existing `S1-R2-06` parent/child handoffs to OPS and the actual capability Primary Owners.  
**Required evidence:** per-capability server-side DENY tests after target-owned remediation.  
**Status:** `OPEN / REFERRED_NOT_EXECUTED`.

### ULS-SEC-004 — Global logout has provider-defined access-token residual window

Global sign-out revokes provider session/refresh state but cannot be represented as instantaneous invalidation of every already-issued access JWT. The UI correctly states this limitation. No custom session authority is introduced.

**Routing:** provider/session policy follow-up only if a stronger guarantee is required; otherwise retain as explicit residual risk.  
**Status:** `RESIDUAL / NOT SILENTLY CLOSED`.

### ULS-SEC-005 — Leaked-password protection provider control disabled

OPS read-only Security Advisor evidence records `auth_leaked_password_protection` disabled. Current application password login and self-registration are controlled-disabled, so this is defense-in-depth rather than evidence of an active password-login bypass in the reviewed flow.

**Routing:** CAPITAL-AI-OPS provider/config evidence under `PVC-08`, subject to provider tier/capability and separate mutation approval.  
**Status:** `OPEN DEFENSE-IN-DEPTH / PROVIDER CONFIG`.

## PART 2 implementation scope

Security-local implementation is intentionally limited to:

1. one cross-boundary lifecycle Security regression contract: `tests/unit/userLifecycleSecurityContract.test.ts`;
2. this exact correlation/threat/authority/gap evidence record.

No foreign productive Auth, Session, MFA, Billing, Entitlement, Frontend, Supabase, Stripe, EventMesh or Production code/configuration is mutated.

## Validation

| Check | Result |
|---|---|
| Current `/AGENTS.md` and project/security surfaces read | PASS |
| Current main/open PR correlation at entry | PASS |
| Open PR overlap at entry | NONE |
| Existing Security control/test reuse | PASS |
| New targeted test execution | NOT RUN — current connector surface does not provide repository checkout/test execution |
| Lint | NOT RUN |
| Type validation | NOT RUN |
| Build | NOT RUN |
| `npm run predeploy:check` | NOT RUN |
| Provider/runtime tests | NOT RUN by Security; OPS evidence remains partial/NOT_AVAILABLE as documented |

No NOT RUN check is represented as PASS.

## Security review matrix

| Security domain | Before | After this candidate | Evidence |
|---|---|---|---|
| Authentication | canonical verified bearer identity existed | unchanged; cross-boundary regression contract added | auth middleware + new test |
| Session | provider authority + bounded FE/authFetch handling | unchanged; residual JWT/revocation semantics explicitly recorded | authFetch/session composition + evidence |
| MFA | native MFA/AAL + step-up existed | unchanged; authority boundary and direct-bypass limitation explicitly correlated | auth middleware/native MFA tests |
| Authorization | mixed feature-level coverage | unchanged productively; known gaps explicitly retained, not hidden by UI state | `S1-R2-06` + this evidence |
| Entitlements | authenticated readback existed; Production identity migration unverified | unchanged productively; Production verification gap explicitly routed | OPS evidence + this evidence |
| Logout | local/global FE remediation merged | unchanged; residual access-JWT window documented | PR #723 + this evidence |
| Abuse handling | fragmented tests/evidence | cross-boundary static regression contract added; runtime gaps remain explicit | new test + matrix above |

## Security conclusion

**Authentication:** repository-contract PASS, runtime/provider assurance incomplete.  
**Session:** OPEN because revocation/stale-tab/provider execution is not independently verified end-to-end.  
**MFA:** repository-contract PASS for canonical server AAL2/step-up; application-wide assurance coverage remains bounded to endpoints that invoke the server control.  
**Authorization:** OPEN due existing `S1-R2-06` capability gaps.  
**Entitlements:** OPEN until Production identity projection and action-level capability enforcement are verified.  
**Logout:** repository-contract PASS; provider access-JWT residual window remains.  
**Abuse cases:** PARTIAL / OPEN where runtime and capability-specific evidence is missing.

`GOV-CHAT-042` therefore **does not produce a blanket Security VERIFIED/CLOSED result for the complete user lifecycle**. It produces a hardened, explicit Security contract and routes the remaining evidence/remediation to the existing Primary Owners without creating parallel authority.
