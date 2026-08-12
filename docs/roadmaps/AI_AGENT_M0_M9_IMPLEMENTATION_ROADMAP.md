# AI Agent M0–M10 Implementation Roadmap

> Legacy filename retained for stable references.

Status: IMPLEMENTATION PHASE
Baseline: `main@a5abc1685026651f4297a487e855683a1fa1e58e` (PR #216 merge)

## Global execution rule
Every phase that contains a platform mutation follows:

`ROADMAP/ADR → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

No later phase may start while a required mutation/test is missing, failed, inconclusive or undocumented.

Privileged autonomous/semi-autonomous agents require the Human/Owner-approved Roadmap/ESS/ADR package. Daily/recurring agents may be created without prior approval only with `READ`/`ANALYZE`, no write credentials and no branch/commit/PR/CI/deploy/mutation/merge capability.

## Human/Owner CI rule

### Current transitional rule — until M10 VERIFIED PASS
For PRs targeting `main`:

`FILES CHANGED → VIEWED → CURRENT-HEAD REVIEW (💪/okay) → OWNER CHECKBOXES LAST → ONE build-and-test`

The review itself does not start expensive CI. The final PR-body checkbox edit triggers the single normal `pull_request: edited` CI event. Any new commit invalidates the previous review.

### M10 target rule — after controlled cutover

`FILES CHANGED → VIEWED → PASSKEY/WEBAUTHN APPROVAL → ONE build-and-test`

After M10 `VERIFIED PASS`, only a valid CAPITAL-AI WebAuthn Owner assertion may authorize expensive CI. The assertion must be bound to the exact repository, PR, base SHA, head SHA, canonical changed-file-set hash, diff/review digest and action `AUTHORIZE_PR_CI`. Emoji/text reviews and PR-body Owner checkboxes then become non-authoritative legacy evidence and are removed from the CI authorization path.

Human merge remains separate and non-agentic.

## M0 — Evidence Baseline
**COMPLETE.** Read-only evidence collection.

## M1 — Git Guardrails
**COMPLETE.** Protected `main`, Human/Owner merge gate and stable required check.

## M2 / M2G — Architecture Definition and Documentation Freeze
**COMPLETE.** ESS-0019, ADR-0057..0063, trust/threat models, traceability and Documentation Freeze.

## M3 — CI Hardening
**COMPLETE.** One required `build-and-test`, scope-aware fast/full validation, Owner-before-CI gate and robust final-checkbox trigger. This remains the transitional authorization mechanism until M10 performs a controlled replacement.

## M4 — Agent IAM
**COMPLETE.** Provider-neutral principal attribution, explicit non-inheriting capabilities, canonical risk ladder, approval/step-up rules, kill switch and no agent `MERGE` capability.

Mutation state: **NOT REQUIRED** for Stripe/Supabase/Render.

## M5 — Observability / Telemetry / Audit
**COMPLETE — VERIFIED PASS.**

Production Supabase audit persistence and application integration are complete. Final application evidence:

- PR #210 final head `ffeab08c218314edd5292fbaf5ccb77413cee80e`;
- merge `e39d5370d8b1498e84952535a38a339cc200082f`;
- required CI #892 / `31559124198`: PASS;
- post-merge sync PR #211 merged at `ee65ba19f64e7e8ee2d618e16364a658dfe60e4c`.

M5 application mutation state: **NOT REQUIRED** beyond the already verified persistence mutation.

## M5A — Supabase Native TOTP MFA / AAL2 Hardening
**IN PROGRESS — READ-ONLY BASELINE COMPLETE / REMEDIATION PLAN IN REVIEW.**

Authorities:

- `.ai/skills/ESS-0020-Supabase-Native-MFA-AAL2-Hardening.md`;
- `docs/adr/ADR-0064-supabase-native-mfa-aal2-hardening.md`;
- reactivated `docs/adr/ADR-0003_5-identity-access-management.md`;
- `docs/evidence/m5a/M5A_SUPABASE_TOTP_AAL2_BASELINE.md`;
- `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`.

### M5A baseline result

Read-only production and repository inspection proves:

- native Supabase MFA factors: **0**;
- current session assurance: **2 × aal1 / 0 × aal2**;
- both Owner profiles use the historical CAPITAL-AI custom `totp_enabled=true` model;
- the current TOTP implementation stores/verifies its own encrypted secret and issues its own step-up token;
- no runtime `aal2` enforcement exists in `checkAdminAccess()`;
- privileged login factor/status lookup can fail-open;
- passkey-first login step-up can bypass the TOTP condition stated in ADR-0003.5;
- Security Advisor reports `auth_insufficient_mfa_options`;
- native Auth MFA schema already exists, therefore core Native MFA needs no new Postgres DDL.

### M5A architecture decision

Supabase Auth becomes the authoritative MFA source.

Required flow:

`primary login → native TOTP enroll/challenge/verify → Supabase aal2 → server IAM role + centralized AAL2 enforcement → optional purpose-bound single-use action step-up → privileged operation → audit`

The existing CAPITAL-AI `x-step-up-token` may remain only as defense-in-depth over AAL2. It cannot upgrade AAL1 or replace native factor verification.

### Mutation classification

| Scope | State |
|---|---|
| Repository/application implementation | **REQUIRED** |
| Native TOTP enrollment for two Owner identities | **REQUIRED / NOT YET AUTHORIZED** |
| Supabase project Auth configuration | **CONDITIONAL / NOT YET VERIFIED** |
| New Postgres DDL for Native MFA | **NOT REQUIRED** |
| Legacy custom-TOTP cleanup | **DEFERRED / SEPARATE OWNER APPROVAL** |
| Stripe | **NOT REQUIRED** |
| Render configuration | **NOT REQUIRED for M5A baseline/design** |

No production Auth mutation is performed by the baseline PR.

### Required implementation sequence

1. Human/Owner reviews and merges the M5A baseline/architecture package.
2. Create a fresh implementation branch from the resulting `main`.
3. Implement native TOTP `enroll → challenge → verify`.
4. Implement canonical server-side AAL2 verification.
5. Make privileged Owner/Admin session/factor lookup fail-closed.
6. Compose IAM role + AAL2 + purpose-bound step-up for critical actions.
7. Redesign recovery/factor-reset around native MFA without implicit unrelated passkey deletion.
8. Add positive and negative MFA/AAL2 tests.
9. Pass required CI.
10. Execute a read-only pre-mutation production check.
11. Obtain separate Human/Owner approval for native Owner factor enrollment and any exact Auth-setting mutation proven necessary.
12. Enroll/verify Owner factors one identity at a time and prove AAL2.
13. Verify AAL1/stale/error/replay/recovery negative paths.
14. Rerun Security Advisor.
15. Complete redacted Evidence and Roadmap sync.

### Required negative tests

- Owner/Admin with AAL1 → DENY;
- missing or unverified factor → DENY;
- wrong TOTP → DENY;
- invalid/expired challenge → DENY;
- stale `aal2/aal1` → DENY;
- Auth/AAL lookup failure → DENY;
- valid legacy/action token without AAL2 → DENY;
- AAL2 without required critical-action step-up → DENY;
- wrong user/purpose/replayed step-up → DENY;
- unauthorized native factor reset → DENY.

### Recovery

Legacy break-glass capability remains transitional until native recovery is proven. Recovery cannot mint AAL2 or elevate roles. Native factor removal must be Owner-controlled, audited and performed through supported Supabase Admin MFA operations. A TOTP recovery path must not implicitly delete unrelated passkeys without a separate decision.

### Plan dependency

Leaked Password Protection remains **DEFERRED — REQUIRES PRO+**. The current Supabase organization is on Free and this does not block TOTP/AAL2 completion.

### M5A exit gate

M5A becomes `COMPLETE / VERIFIED PASS` only after:

- ESS-0020 + ADR-0064 approved;
- native MFA/AAL2 code merged;
- required CI PASS;
- both Owner identities native TOTP-verified;
- AAL2 positive/negative tests PASS;
- recovery/backup PASS;
- Security Advisor rerun;
- final evidence and roadmap synchronized.

M6 remains blocked until this gate is complete.

## M6 — Supply Chain
**BLOCKED BY M5A.**

Scope: SBOM, provenance and attestations bound to source/artifact digests. No implicit external-platform mutation.

## M7 — Deployment Identity + Production Platform Mutation Gate
**BLOCKED BY M6.**

Render mutations: only approved identity/environment credential/hook changes, followed by controlled deploy, health/readiness and rollback evidence.

Stripe mutations: only explicitly named billing/webhook/credential changes with dedicated ADR/runbook and Owner approval. Unrelated billing remediation stays a separate workstream.

Supabase mutations: only explicitly required deployment/IAM boundary changes; do not opportunistically repeat M5/M5A work.

## M8 — Agent Cutover
**BLOCKED BY M7.**

Route privileged ChatGPT/Claude/future execution clients through the provider-neutral Control Plane. Read-only daily agents remain the documented exception. No agent self-authorizes merge or production mutation.

## M9 — Assurance
**BLOCKED BY M8.**

Injection, replay, exfiltration, negative authorization, kill-switch, break-glass and rollback/recovery drills with independent evidence review.

## M10 — Passkey-only Human/Owner PR Authorization
**BLOCKED BY M9 — TARGET ARCHITECTURE DEFINED.**

Authority: `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md` plus the dedicated M10 ESS/runbook/threat model that must be produced before implementation.

### Target sequence

`PR OPEN/UPDATE → OWNER FILE REVIEW → ALL FILES VIEWED → PASSKEY CHALLENGE → VERIFIED OWNER ASSERTION → ONE build-and-test → HUMAN MERGE`

### Required transaction binding

Each approval transaction binds at least:

- Owner `SvenKulessa`;
- repository `SvenKulessa/Finance`;
- PR number;
- base SHA;
- exact current head SHA;
- canonical sorted changed-file-set hash;
- canonical diff/review digest;
- action `AUTHORIZE_PR_CI`;
- challenge id / issuance / expiry / replay state.

### WebAuthn requirements

- server-generated cryptographically random challenge;
- short-lived and single-use;
- `userVerification=required`;
- expected HTTPS origin and RP ID verified;
- credential ownership and signature verified;
- `UP` and `UV` asserted;
- revoked credential denied;
- audit persistence required before CI request;
- duplicate approval/CI consumption denied or deduplicated;
- no private key, biometric or reusable credential data stored.

### Legacy authorization removal

Only after M10 positive, negative, replay, recovery and shadow-mode tests reach `VERIFIED PASS`:

- remove `💪`/`okay` from CI authorization logic;
- remove PR-body Owner checkboxes from CI authorization logic;
- retain Human file review / Viewed process;
- make the passkey assertion the sole normal Owner authorization before expensive CI.

A GitHub passkey sign-in is not, by itself, proof that the exact PR state was approved. CAPITAL-AI therefore requires its own PR-bound WebAuthn approval transaction.

### Mandatory negative tests

- wrong Owner credential → DENY;
- wrong RP ID/origin → DENY;
- `UV=false` or missing `UP` → DENY;
- expired/stale challenge → DENY;
- challenge/assertion replay → DENY;
- wrong repository/PR/base/head → DENY;
- changed file-set/diff after challenge issue → DENY;
- revoked credential → DENY;
- forged emoji/comment/review/reaction/checkbox → no authorization;
- unavailable verifier or durable audit → DENY;
- duplicate CI request for consumed approval → DENY/DEDUPE;
- agent self-approval attempt → DENY.

### Rollout

1. architecture + ESS/runbook/threat model;
2. implementation + unit/integration/security tests;
3. Owner passkey enrollment and recovery validation;
4. shadow verification while the legacy gate remains authoritative;
5. compare legacy/passkey decisions and remediate false allow/deny paths;
6. controlled passkey-only cutover;
7. remove legacy emoji/checkbox parser and update templates/policies;
8. final `VERIFIED PASS` evidence and DevelopmentChain sync.

### M10 exit gate

M10 is complete only when File Review + Passkey approval is the enforced normal PR authorization path, the old emoji/checkbox authorization no longer gates CI, exactly one expensive CI run is proven per approved head, recovery is auditable/fail-closed, and Human-only merge authority remains intact.

## Mandatory per-step update
Every completed step updates:
1. `docs/architecture/ROADMAP.md`;
2. this implementation roadmap;
3. `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`;
4. affected ADR/ESS;
5. mutation state (`NOT REQUIRED`, `PLANNED`, `HUMAN APPROVED`, `MUTATED`, `VERIFIED PASS`, `FAILED / ROLLED BACK`);
6. required test/evidence state.

No phase may skip Human/Owner review, required mutation/test gates, or preceding phase closure.