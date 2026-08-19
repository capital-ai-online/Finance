# M10 Phase 6 — Shadow Mode Evidence — 2026-08-19

Status: **IMPLEMENTED ON BRANCH — REAL OWNER SHADOW ASSERTION / PRODUCTION WIRING PENDING**  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`  
Branch baseline: `main@ca968b2563975df64245cb88ee45a7c04019a3a1`

## 1. Preconditions re-verified

- PR #417 / Phase 4 is Human-merged.
- PR #419 / Phase 5 is Human-merged; Phase-5 merge commit is `51cb1cdac9cb25d303f306d40c5b27b83ba954de`.
- PR #418 merged while Phase 6 was being prepared. The first Phase-6 branch was therefore not submitted. This main-sync branch was recreated from `ca968b2563975df64245cb88ee45a7c04019a3a1`, and the SC-2/Gemini secret-manifest addition was preserved while adding the M10 resolver secret key.
- Production Supabase contains one active, non-revoked Owner passkey credential for `SvenKulessa` (credential/public-key material intentionally omitted from evidence).
- Phase-5 production migration `m10_pr_ci_authorization` was applied after merge and registered by Supabase as version `20260819021420`. The repository filename is `20260819040000_m10_pr_ci_authorization.sql`; this connector-assigned version difference is recorded and is not silently rewritten.

## 2. Phase-5 production post-verification and Phase-6 preflight findings

Effective database controls were verified after the Phase-5 production migration:

- RLS enabled on `m10_authorization_challenges`, `m10_approval_evidence`, and `m10_ci_consumptions`;
- `anon` and `authenticated` have no table privileges on these Phase-5 M10 tables;
- `service_role` has only the explicitly required table privileges;
- `claim_m10_ci_consumption` and `finalize_m10_ci_dispatch` are executable by `service_role` and not by `anon`/`authenticated`;
- lifecycle/immutability triggers are installed on all three tables;
- a rollback-isolated production transaction proved `CLAIMED -> DEDUPE_HEAD`, one-time terminal dispatch finalization, and left zero synthetic rows after rollback.

Supabase Security Advisor reports `RLS enabled, no policy` as INFO for the Phase-5 M10 tables. This is intentional deny-by-default because browser roles have no grants and privileged server access is explicit. Performance Advisor identified one M10-specific missing covering index on `m10_approval_evidence.credential_id`; Phase 6 adds that index additively.

A separate production privilege preflight identified legacy Phase-3 grants on `m10_owner_credentials` and `m10_registration_challenges`: both `anon` and `authenticated` retained `REFERENCES`, `TRIGGER`, and `TRUNCATE`. These rights are unnecessary for the Owner-only server contract, and table-level `TRUNCATE` must not be treated as protected by row-level filtering. The Phase-6 migration therefore normalizes both tables with `REVOKE ALL` for browser roles and explicitly regrants only `SELECT, INSERT, UPDATE` to `service_role`. No production grant mutation is performed before Human merge of the Phase-6 PR.

## 3. WebAuthn challenge compatibility finding

`issueM10Challenge()` already creates the protocol challenge as cryptographically random base64url bytes and stores that exact value for Phase-4 `expectedChallenge` verification. During Phase-6 pre-PR review, the first Shadow options implementation was found to pass this already-encoded string through `generateAuthenticationOptions({ challenge })`.

Current SimpleWebAuthn v13 behavior treats a supplied string custom challenge as UTF-8 input and base64url-encodes it for the browser. That would have transformed the stored canonical M10 challenge and caused a real assertion to disagree with the Phase-4 `expectedChallenge` value. The implementation was corrected before PR creation: Phase 6 now builds the browser authentication-options JSON with the stored base64url challenge copied **unchanged**, while still binding RP ID, two-minute timeout, required user verification and the enrolled credential IDs. A regression test verifies byte-string identity and statically prevents reintroduction of `generateAuthenticationOptions()` in this Shadow path.

## 4. Shadow architecture

Phase 6 introduces a deliberately non-authoritative path:

`Owner session -> live GitHub PR resolver -> durable short-lived challenge -> browser WebAuthn assertion -> Phase-4 verifier -> authenticator counter CAS -> immutable m10_shadow_evaluations -> M5 audit`

It does **not** call Phase-5 consumption and does **not** dispatch GitHub Actions.

Structural separation is deliberate:

- real CI approvals live in `m10_approval_evidence` and implement the consumable Phase-5 store contract;
- Shadow PASS records live in separate `m10_shadow_evaluations` and implement only the Phase-4 write contract;
- the Shadow router has no import/reference to `consumeM10ApprovalForCi`, `githubCiDispatcher`, or `workflow_dispatch`;
- the current simplified PR CI remains authoritative until Controlled Cutover.

## 5. Implementation scope

- `supabase/migrations/20260819050000_m10_phase6_shadow_evidence.sql`
  - removes residual browser privileges from Phase-3 M10 credential/challenge tables and restores only the required service-role rights;
  - immutable Shadow Evidence table;
  - RLS + no browser grants;
  - service-role SELECT/INSERT only for Shadow Evidence;
  - additive covering index for the Phase-5 credential FK Advisor finding.
- `server/m10/shadowApprovalSupabaseStore.ts`
  - non-consumable Shadow Evidence store;
  - safe recent-evidence view without credential/challenge identifiers.
- `server/m10/shadowAuthorizationRouter.ts`
  - Owner-only status/begin/complete endpoints;
  - live GitHub PR re-resolution;
  - canonical stored WebAuthn challenge passed through unchanged;
  - required RP-ID/User Verification;
  - M5 audit before returning a usable challenge and after verification;
  - explicit `authoritativeForCi=false` / `dispatchEnabled=false` contract.
- `server/m10/credentialEnrollmentRouter.ts`
  - nests Shadow endpoints below the already-mounted M10 route, avoiding a new route-composition boundary and avoiding overlap with PR #414.
- `src/components/M10PrAuthorizationShadowPanel.tsx`
  - physical Owner browser ceremony via `startAuthentication`;
  - clear Shadow/no-CI state.
- `src/components/M10PasskeyEnrollmentPanel.tsx`
  - exposes the Phase-6 panel inside the existing Supervisor M10 tab.
- `scripts/security/secretFileManifest.ts`
  - registers `M10_GITHUB_TOKEN` as a server-only secret while preserving the Gemini key added by merged PR #418.
- targeted tests enforce the non-authoritative boundary.

## 6. Mandatory negative/recovery evidence mapping

Already covered by Phase-4/5 tests: wrong owner, wrong/stale PR state, changed base/head/file-set/diff, unknown/revoked credential, invalid signature, replay/consumed challenge, counter CAS failure, approval persistence failure, already-consumed approval, duplicate exact head, resolver/store failure, and uncertain dispatch no-retry semantics.

Phase-6-specific tests additionally prove:

- no active credential -> no Shadow authentication ceremony;
- canonical stored challenge is not transformed by a second encoder;
- Shadow store writes only to `m10_shadow_evaluations`;
- Shadow router has no Phase-5 consumption/dispatch capability;
- browser roles have no Shadow table access and Shadow evidence is append-only;
- the migration revokes residual browser privileges from the two Phase-3 M10 persistence tables.

A **real Owner WebAuthn assertion** is still mandatory before Phase 6 can be marked `VERIFIED PASS`. Unit tests cannot substitute for possession of the authenticator private key.

## 7. Production gates still open

1. Human merge of the Phase-6 PR.
2. Apply `20260819050000_m10_phase6_shadow_evidence.sql` to production and repeat Supabase security/performance verification.
3. Configure a server-only, least-privilege GitHub read credential as `M10_GITHUB_TOKEN` in Render `finance-secrets.env`; no value is stored in repository evidence.
4. Deploy merged Phase-6 code.
5. Owner opens the Supervisor M10 tab, enters an open PR and completes the physical Passkey ceremony.
6. Verify production `APPROVED_SHADOW` evidence, matching M5 audit, no matching Phase-5 CI consumption, and unchanged simplified CI authority.
7. Only after Shadow + mandatory negative + recovery evidence is `VERIFIED PASS` may a separate Controlled-Cutover branch change GitHub workflow authority.

## 8. Current verdict

**Phase 6 implementation: READY FOR PR VALIDATION.**  
**Phase 6 operational assurance: NOT YET VERIFIED PASS.**  
**Controlled Cutover: NOT AUTHORIZED BY RUNBOOK YET.**
