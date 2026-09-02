# CAPITAL-AI-SEC — Owner Device Authorization Stage-C Final Re-Verification

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Role:** independent Security requirements / findings / testing / verification only  
**Date:** `2026-09-02`  
**Observed current main:** `f60bc54026633749e1bf11dadc1f473e9f1ca847`  
**Original Stage-C baseline:** `7bf77f4c5f15f46ef0d551d12c9ddb572bd16883`  
**Original Stage-C evidence:** `docs/evidence/security/CAPITAL_AI_SEC_OWNER_DEVICE_AUTHORIZATION_STAGE_C_2026-09-02.md`  
**PR #704 merge:** `c2cb7911c594c05fbae192e40e4c1d3fb8d10d72`  
**PR #705 merge:** `2e5a4c23bca91032aa10b03bb573bb0801b7965d`  
**Primary re-verification finding:** `SEC-FIND-ODA-003 — Mandatory Negative Tests`  
**Final Security verdict in this evidence candidate:** `PASS`

## 1. Authority and scope correlation

This re-verification was performed from then-current `main` and re-read `/AGENTS.md` before evaluating closure. The canonical Security project resolves to `CAPITAL-AI-SEC`, folder `docs/projects/security/`, with no productive `PVC-*` ownership. Security owns the independent verification decision; productive implementation remains with the affected Primary Owner.

Reviewed current-main authority/project surfaces:

- `/AGENTS.md`;
- `docs/projects/security/README.md`;
- `docs/projects/security/ROADMAP.md`;
- `docs/projects/governance/OWNER_DEVICE_AUTHORIZATION_HANDOFF.md`;
- `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md`;
- original Stage-C Security evidence;
- PR #704 implementation/remediation metadata and hosted checks;
- PR #705 mandatory-negative-test remediation metadata and hosted checks.

No OPS, GOV, PR-body or chat statement was treated as Security closure authority. The closure below is the independent CAPITAL-AI-SEC decision based on current-main code/test evidence and exact hosted-check results.

## 2. Current-main implementation surfaces reviewed

- `server/ownerAuthorization/ownerDeviceAuthorization.ts`;
- `supabase/migrations/20260902000000_owner_device_authorization_atomic_activation.sql`;
- `tests/unit/ownerDeviceAuthorizationStageC.test.ts`;
- `tests/unit/ownerDeviceWebAuthnFailureMapping.test.ts`;
- `tests/unit/ownerDeviceWebAuthnProtocolNegative.test.ts`.

PR #705 changed only:

- `tests/unit/ownerDeviceWebAuthnFailureMapping.test.ts`;
- `tests/unit/ownerDeviceWebAuthnProtocolNegative.test.ts`.

It did not alter runtime, database, migration, authority, workflow or deployment behavior.

## 3. Prior findings and remediation state

### SEC-FIND-ODA-001 — Activation transaction not atomic / fail-closed

**Prior:** HIGH / OPEN in original Stage-C FAIL evidence.  
**Current decision:** `CLOSED`.

The current runtime calls one server-side `consume_adr0104_owner_authorization` RPC only after successful WebAuthn verification and canonical project revalidation. The PostgreSQL function locks/rechecks challenge and credential state, consumes the challenge, writes successful evidence, advances the credential counter, creates the ADR session and writes the consumption ledger in one PL/pgSQL transaction. Any exception aborts the transaction. The Stage-C suite also proves persistence/RPC failure returns `OWNER_AUTH_ATOMIC_CONSUMPTION_FAILED` and does not return ALLOW.

### SEC-FIND-ODA-002 — Post-challenge canonical project metadata not re-resolved

**Prior:** HIGH / OPEN in original Stage-C FAIL evidence.  
**Current decision:** `CLOSED`.

`verifyAdr0104Authentication()` now resolves the authorized project IDs again from current-main canonical project surfaces, recomputes the canonical digest, rejects digest/folder drift, and passes the re-resolved canonical set into the atomic consumption RPC. The Stage-C suite includes a post-challenge canonical project mutation case that fails before RPC consumption.

### SEC-FIND-ODA-004 — Audit fields overstate verification granularity

**Prior:** MEDIUM / OPEN in original Stage-C FAIL evidence.  
**Current decision:** `CLOSED`.

The remediation adds `ceremony_verified` for the aggregate maintained-library result and deliberately stores `rp_verified`, `origin_verified`, `user_presence_verified` and `user_verification_verified` as `NULL` unless independently evidenced. This removes the prior false granularity while preserving truthful aggregate ceremony evidence.

## 4. SEC-FIND-ODA-003 — Mandatory Negative Tests

**Prior state:** `PARTIALLY_REMEDIATED / OPEN` after PR #704 because the production-path suite mocked `verifyAuthenticationResponse` and therefore did not independently prove the five concrete protocol failure states required for closure.  
**Current decision:** `CLOSED`.

PR #705 supplies two complementary evidence layers:

1. `ownerDeviceWebAuthnProtocolNegative.test.ts` invokes the real maintained `@simplewebauthn/server` verifier directly and deliberately does **not** mock `verifyAuthenticationResponse`.
2. `ownerDeviceWebAuthnFailureMapping.test.ts` exercises the productive `verifyAdr0104Authentication()` failure mapping and proves that each corresponding maintained-verifier failure is converted to fail-closed `OWNER_AUTH_WEBAUTHN_VERIFICATION_FAILED` before `consume_adr0104_owner_authorization` is called.

### 4.1 Wrong RP ID

**Result:** `PASS`.

The protocol test rewrites the authenticator-data RP-ID hash to the SHA-256 of `attacker.invalid` while the expected RP ID remains `dev.dontneeda.pw`; the maintained verifier rejects the assertion with an RP-ID error. The production-path mapping test separately injects the maintained-verifier RP-ID failure and asserts the runtime denies before RPC consumption.

### 4.2 Wrong HTTPS Origin

**Result:** `PASS`.

The protocol test rewrites `clientDataJSON.origin` to `https://attacker.invalid` while the expected origin remains `https://dev.dontneeda.pw`; the maintained verifier rejects the assertion with an origin error. The production-path mapping test separately proves the runtime denies that failure before RPC consumption.

### 4.3 UP=false

**Result:** `PASS`.

The protocol test sets the authenticator-data flags byte to `0x00`, clearing User Presence. The maintained verifier rejects the assertion because the user was not present. The production-path mapping test proves the corresponding verifier failure is fail-closed before RPC consumption.

### 4.4 UV=false

**Result:** `PASS`.

The protocol test sets authenticator flags to `0x01` (UP set, UV clear) while `requireUserVerification=true`. The maintained verifier rejects the assertion because User Verification is absent. The production runtime itself also calls the maintained verifier with `requireUserVerification: true`, and the mapping test proves the failure is denied before RPC consumption.

### 4.5 Assertion replay / signature counter

**Result:** `PASS`.

The protocol test uses the captured assertion with stored credential counter `144` while the assertion counter is non-advancing. User Verification is disabled only for this isolated protocol counter test so execution reaches the maintained replay/counter check instead of failing earlier on the fixture's UV state. The maintained verifier rejects with a counter error. The production-path mapping test separately proves the corresponding verifier counter/replay failure is denied before RPC consumption.

### 4.6 No consumption on deny

`NO_CONSUMPTION_ON_DENY = PASS`.

For all five mandatory WebAuthn verifier failure classes, `ownerDeviceWebAuthnFailureMapping.test.ts` asserts `rpc` was never called. In current runtime, the only path that invokes `consume_adr0104_owner_authorization` appears after successful `verifyAuthenticationResponse`, `verification.verified === true`, device-bound profile confirmation, current-main correlation and canonical project-set revalidation. Therefore the five denial cases cannot consume the activation challenge/session through the productive RPC path.

## 5. Maintained-verifier evidence

The decisive distinction from the prior partial remediation is that the protocol-negative suite imports and calls the repository's maintained `@simplewebauthn/server` `verifyAuthenticationResponse` directly. The five test cases mutate actual WebAuthn protocol fields/flags/counter state and assert the maintained library itself rejects those concrete states.

The production-path suite remains intentionally mocked at the library boundary because its purpose is different: prove that verifier failures are mapped to the productive fail-closed error and never reach atomic consumption. Together the two suites provide protocol-level and application-boundary evidence without custom cryptographic verification code.

## 6. Hosted workflow evidence

### PR #704 — implementation remediation head `86e0053ebc22d1ed67bf99df2b951b82cf45abeb`

- `build-and-test` — check run `100052249601` — `success`;
- `PR Governance (Kosten / Workflow / Vorlage)` — check run `100052250409` — `success`;
- `Hardened image / HIGH+CRITICAL CVE gate` — check run `100052249405` — `success`;
- Supabase Preview — skipped because preview branches are disabled; no PASS is inferred from that skipped provider integration.

### PR #705 — mandatory-negative-test remediation head `f5dd1a7eef7ee0b6b5bdf6d3ccfa6277865d0337`

- `build-and-test` — check run `100074170613` — `success`;
- `PR Governance (Kosten / Workflow / Vorlage)` — check run `100074422658` — `success`;
- `Hardened image / HIGH+CRITICAL CVE gate` — check run `100074169716` — `success`;
- `GitGuardian Security Checks` — check run `100074159199` — `success`, "No secrets detected", two commits scanned;
- Render production deployment verification — skipped as expected for this non-deployment test-only PR.

Hosted success supports the exact merged remediation snapshots. It does not replace the independent Security reasoning above.

## 7. Regression correlation to current main

Compared PR #705 merge `2e5a4c23bca91032aa10b03bb573bb0801b7965d` to observed current main `f60bc54026633749e1bf11dadc1f473e9f1ca847`.

Current main is 14 commits ahead and 0 behind that merge. The changed-file set since PR #705 contains only Security Assessment Skill, Deep Research Skill/schema/validator and related Governance/Security evidence files. It does **not** modify:

- `server/ownerAuthorization/**`;
- `supabase/migrations/20260902000000_owner_device_authorization_atomic_activation.sql`;
- `tests/unit/ownerDeviceAuthorizationStageC.test.ts`;
- `tests/unit/ownerDeviceWebAuthnFailureMapping.test.ts`;
- `tests/unit/ownerDeviceWebAuthnProtocolNegative.test.ts`.

`REGRESSION = NONE` for the verified Owner Device Authorization surfaces between PR #705 and the observed current-main snapshot.

## 8. Finding state before / after

| Finding | Before final re-verification | Final SEC decision |
|---|---|---|
| `SEC-FIND-ODA-001` | remediated by PR #704, required SEC verification | `CLOSED` |
| `SEC-FIND-ODA-002` | remediated by PR #704, required SEC verification | `CLOSED` |
| `SEC-FIND-ODA-003` | `PARTIALLY_REMEDIATED / OPEN` | `CLOSED` |
| `SEC-FIND-ODA-004` | remediated by PR #704, required SEC verification | `CLOSED` |

No remaining Stage-C-blocking finding was identified on the correlated current-main Owner Device Authorization surfaces.

## 9. Residual risk

Residual risk remains bounded to normal implementation/operational concerns rather than an identified Stage-C blocker:

- this repository evidence verifies code/tests and exact hosted CI snapshots; applying database migrations or production cutover remains a separate protected operation and is not performed by CAPITAL-AI-SEC here;
- `OWNER_WEBAUTHN_RP_ID` and `OWNER_WEBAUTHN_ORIGIN` remain deployment configuration and must stay canonical/HTTPS at runtime;
- the Governance device-backed cutover is still separate Stage D and remains Human-merge controlled;
- Human/CODEOWNER merge and the prohibition on agent merge/auto-merge remain unchanged.

No residual item above changes this Stage-C Security verification result.

## 10. Stage-C decision

All previously blocking Owner Device Authorization Stage-C findings are closed on the observed current-main snapshot, the five mandatory WebAuthn negative cases are concretely verified against the maintained verifier, productive failure mapping proves no atomic consumption on deny, canonical project-set revalidation and atomic persistence are present, audit granularity is truthful, and no relevant regression was detected after PR #705.

`STAGE_C_SECURITY_VERIFICATION = PASS`

This statement is an independent CAPITAL-AI-SEC Security verification decision only. It is not ADR-0104 Stage D, not a Governance cutover, not production mutation authority, and not merge authorization.

## 11. Cross-project handoff gate

Because this new PASS evidence is not authoritative on current `main` until Human review and merge of its SEC evidence PR, CAPITAL-AI-SEC does **not** initiate Stage D from this candidate.

After this exact Security evidence is Human-merged and re-observed on current `main`, the next bounded action is a separate cross-project handoff to the dynamically resolved Governance owner for ADR-0104 Stage-D / cutover decision. CAPITAL-AI-SEC must not perform Stage D itself.
