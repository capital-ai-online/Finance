# M10 — Passkey-only Human/Owner PR Authorization Runbook

Status: **COMPLETE / VERIFIED PASS** — Phases 1-6, Controlled Cutover, production deployment and the post-cutover live matrix are verified. Durable closure evidence: `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`.
Date: 2026-08-12  
Updated: 2026-08-19  
Authority: ADR-0066, ESS-0022, M10 Threat Model, DEVELOPMENT Chain Execution Policy, HUMAN_OWNER_PR_APPROVAL_POLICY, ADR-0069 Owner addendum 2026-08-16

## Goal

Use a CAPITAL-AI WebAuthn/passkey transaction bound to the exact current PR state as the **strong authorization** for expensive CI consumption (action `AUTHORIZE_PR_CI`).

**Owner decision 2026-08-16:** current-head `💪`/`okay`, Viewed-state and Owner-body-checkbox mechanisms are retired as CI authorization signals. M10 replaces the simplified pre-M10 automatic PR CI path with passkey authorization; it does not revive or layer on top of those legacy signals.

Human-only **Merge** remains mandatory and separate. An M10 CI authorization can never authorize merge.

## Prerequisite Gate — VERIFIED PASS

Before Controlled Cutover:

- M9 prerequisite is `COMPLETE / VERIFIED PASS`;
- M5 append-only audit remains healthy;
- simplified pre-M10 CI path (no checkbox/emoji gate) is stable;
- rollback plan is accepted;
- exact RP ID / HTTPS origin architecture is approved;
- a real Owner passkey is enrolled;
- Phase-6 Shadow, negative and recovery assurance is `VERIFIED PASS`.

All prerequisites were satisfied before Controlled Cutover.

## Phase 1 — Trusted PR State Resolver — VERIFIED

Server-side resolution binds:

- repository `SvenKulessa/Finance`;
- PR number;
- base branch/SHA;
- exact current head SHA;
- canonical sorted changed-file set;
- canonical diff/review digest;
- action `AUTHORIZE_PR_CI`.

Agent-supplied hashes are never authoritative. The trusted server recomputes context from GitHub state.

## Phase 2 — Challenge Issuance — VERIFIED

Server creates a cryptographically random, short-lived, single-use challenge bound to the exact authorization context and persists issue/expiry/context/lifecycle metadata.

Authenticator private keys and biometric material are never stored.

## Phase 3 — Owner Credential Enrollment — VERIFIED

Owner passkey enrollment is a Human/Owner identity operation with strong session, expected RP/origin, UV required, public credential only, and revocation/recovery controls.

A real active Owner credential exists in production. Agents may assist with UI/code but cannot autonomously enroll, replace or revoke Owner credentials.

## Phase 4 — Assertion Verification — VERIFIED

On approval: re-resolve PR state; reject drift; verify challenge, RP ID, origin, credential, signature, UP/UV; persist immutable approval Evidence; keep the result single-use for CI consumption. Any failure → `DENY`.

## Phase 5 — Atomic CI Consumption — VERIFIED

Before CI dispatch: re-resolve state; compare to approved context; resolve the current same-repository PR branch and require it still points to the approved head; atomically claim approval + exact PR head; issue exactly one dispatch attempt. Duplicate → `DENY/DEDUPE`.

A successfully accepted GitHub dispatch remains `PENDING` until the dispatched workflow redeems the high-entropy `consumptionId` through the server-side workflow gate. That gate is the only normal `PENDING -> DISPATCHED` transition and therefore the single winner before expensive CI.

Rejected or transport-ambiguous dispatch becomes terminal `FAILED_UNCERTAIN`; there is no blind automatic retry.

## Phase 6 — Shadow Mode — VERIFIED PASS

Production Shadow used the real Owner WebAuthn assertion path and exact live GitHub PR state while remaining structurally unable to consume approvals or dispatch CI.

Verified evidence includes:

- real `APPROVED_SHADOW` Owner assertions;
- closed PR fail-closed denial;
- short-lived challenge freshness/single-use/replay tests;
- deterministic changed base/head/file-set/diff denial in the Phase-4 verifier suite;
- live recovery with a fresh challenge after a PR-head change;
- durable M5 audit correlation;
- zero authoritative approvals/CI consumptions created by Shadow.

The attempted single-device live head-drift timing exercise was explicitly `INCONCLUSIVE` because the drift commit occurred after a valid assertion; it is not represented as a live negative PASS. The mandatory drift invariant is covered by deterministic verifier tests.

## Mandatory Negative Tests — VERIFIED PASS

Required matrix: wrong Owner, wrong RP/origin, UP/UV false, invalid signature, expired/replayed challenge, revoked credential, wrong repo/PR, changed base/head/file-set/diff, unavailable resolver/verifier/audit, already consumed approval, forged legacy `💪`/checkbox/label/reaction, agent self-approval and weak recovery fallback.

Controlled-Cutover additions include fork/cross-repository heads, malformed/ambiguous Git refs, forged/manual workflow dispatch, missing/wrong-audience/expired/forged GitHub Actions OIDC identity, wrong OIDC repository/ref/SHA/run/workflow claims, and duplicate workflow-gate redemption.

These controls are satisfied by the combined deterministic and production-live evidence recorded in `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`. Deliberately reproducing unsafe forged credentials in production is not required where deterministic cryptographic boundary tests provide stronger and safer assurance.

## Controlled Cutover — VERIFIED PASS

### Enforced control flow

```text
NORMAL PR EVENT
→ dedicated cheap `m10-authorization-required` guard
→ DENY before checkout/npm/build
→ canonical required `build-and-test` context is NOT created
→ no expensive CI

OWNER IN CAPITAL-AI
→ exact open PR state resolution
→ Owner WebAuthn/passkey assertion
→ immutable approval Evidence
→ exact same-repository PR branch/head re-resolution
→ atomic one-head consumption claim
→ exactly one GitHub workflow_dispatch to that branch
→ workflow obtains short-lived GitHub Actions OIDC identity
→ workflow presents OIDC identity + single-use consumptionId to CAPITAL-AI workflow gate
→ server verifies GitHub RS256 signature + issuer/audience + exact repo/ref/SHA/run/workflow claims
→ server re-resolves current PR base/head/file-set/diff and exact same-repository branch
→ exact approval/consumption/current-state comparison
→ durable pre-finalize audit with hashed capability/OIDC-JTI correlation
→ atomic PENDING -> DISPATCHED
→ only winner proceeds to checkout/npm/test/build/docker as classified
→ canonical required `build-and-test` attaches to the approved head
→ later ordinary PR lifecycle events can only create `m10-authorization-required`, never replace `build-and-test`
→ Human Merge remains separate
```

### Credential separation

- `M10_GITHUB_TOKEN`: read-only GitHub PR resolver credential; repository `Finance`; Pull Requests read only.
- `M10_GITHUB_DISPATCH_TOKEN`: separate server-only credential scoped to repository `Finance`; GitHub Actions write only (plus GitHub-required metadata read). It is never used for trusted PR-state resolution.
- GitHub Actions OIDC: short-lived signed workload identity requested at runtime by `build-and-test`; no additional long-lived shared secret is introduced.

Do not widen the resolver token to Actions write.

### GitHub Actions OIDC workload identity

The workflow-gate MUST NOT treat the raw `workflow_dispatch` input as sufficient caller identity. `build-and-test` receives job-level `id-token: write`, which allows requesting an OIDC JWT but does not grant GitHub repository-resource write access.

Before touching the M10 durable consumption, CAPITAL-AI verifies:

- JOSE `RS256` signature against `https://token.actions.githubusercontent.com/.well-known/jwks`;
- issuer `https://token.actions.githubusercontent.com`;
- audience `https://capital-ai.online/m10-workflow-gate`;
- short `iat` / `nbf` / `exp` freshness;
- exact `repository=SvenKulessa/Finance`;
- exact `event_name=workflow_dispatch`, branch ref, approved SHA and run ID;
- exact workflow name/path/ref.

OIDC and the one-time M10 consumption are conjunctive controls: both are required. The active OIDC JWT and raw consumption capability are masked and never persisted raw in M5 audit.

### Workflow fail-closed requirements

- ordinary `pull_request` events are handled only by the dedicated `m10-pr-authorization-guard.yml` workflow, which fails before checkout and MUST NOT create the canonical `build-and-test` check context;
- `.github/workflows/ci.yml` accepts only `push` to `main` and authoritative `workflow_dispatch`; a normal PR lifecycle event has no execution path in the expensive-CI workflow;
- `workflow_dispatch` must target the same-repository PR branch whose current head equals the approved SHA;
- dispatched inputs carry consumption/approval/PR/base/head/digest/action context;
- before checkout/npm/build, the workflow obtains GitHub Actions OIDC and redeems OIDC + the single-use consumption capability at the production M10 workflow-gate endpoint;
- unknown, malformed, mismatched, replayed or already-finalized capabilities deny before expensive CI;
- invalid/missing/stale/wrong-audience/wrong-context OIDC identities deny before expensive CI;
- a manually initiated workflow rerun/dispatch without both valid workload identity and an unredeemed M10 capability cannot start expensive CI;
- the canonical required job name remains exclusively `build-and-test`, so only `main` push or a successfully authorized current-head dispatch can report that check identity;
- the historical PR #429 bootstrap is retired and MUST NOT provide an ordinary-PR expensive-CI bypass;
- main-push supply-chain/deployment jobs remain separate from PR-head CI authorization.

### Post-closure check-orchestration correction — 2026-08-19

A production observation after M10 closure exposed a GitHub check-identity defect without invalidating the underlying WebAuthn/OIDC authorization chain: an authorized `workflow_dispatch` could complete `build-and-test` successfully on the exact head, and a later `pull_request` lifecycle event on the same head could create another job with the same `build-and-test` name and intentionally fail at the M10 pre-check. GitHub would then present the later red check under the same identity.

The corrective invariant is therefore stricter than the original cutover wording:

1. ordinary PR events and expensive CI MUST use different workflow/check identities;
2. ordinary PR events remain fail-closed before checkout/npm/build;
3. `build-and-test` is reserved for `main` push or an authoritative M10 `workflow_dispatch` only;
4. PR lifecycle events such as `ready_for_review` cannot overwrite or collide with an already-authorized `build-and-test` result on the same head;
5. the retired PR #429 bootstrap path is removed from the active CI workflow.

This is an orchestration correction, not a relaxation of M10. Passkey verification, exact-head binding, atomic single-use consumption, GitHub Actions OIDC verification and Human-only Merge remain unchanged.

### Post-merge Controlled-Cutover verification — VERIFIED PASS

Production probe PR #431 proved:

1. separate resolver and dispatcher credentials configured server-side without exposing values — PASS;
2. fresh test PR from then-current `main` — PASS;
3. ordinary PR event denied before checkout/npm/test/build/docker — PASS (`#1872`, repeated on later heads);
4. real Owner passkey authorization for exact current head — PASS;
5. exactly one authorized `build-and-test` on exact approved head with GitHub OIDC/workflow-gate verification — PASS (`32228796660` / `#1873`);
6. duplicate authorization/consumption created no second expensive run — PASS (`DEDUPE_HEAD`);
7. manual Actions rerun after consumption finalization denied before checkout — PASS;
8. changed PR state did not inherit old approval authority — PASS;
9. fresh challenge/approval on new stable head recovered correctly — PASS (`32231008414` / `#1878`);
10. Human Merge remained independent and no checkbox/emoji/label/reaction path authorized CI — PASS;
11. immutable approval, consumption, OIDC/workflow and M5 audit evidence correlated — PASS;
12. final Evidence/Roadmap/Traceability synchronized — PASS via M10 closure work package.

## Legacy Cleanup

Checkbox- and emoji-based CI authorization was retired on 2026-08-16. Controlled Cutover preserves that retirement:

- no workflow parser consumes emoji/text/Viewed/checklist/label/reaction as CI authorization;
- historical Evidence references remain historical only;
- Human merge remains separate.

## Rollback

### After M10 enforcement

Fail closed rather than silently restoring a weak authorization signal. If the authoritative path cannot safely dispatch CI, stop expensive PR CI and repair through a fresh, Human-authorized rollback/fix branch. Do not restore emoji/checkbox authorization.

Activate the pre-approved incident/recovery process and restore only a verified safe gate through controlled change. Human Merge remains separate throughout recovery.

## Exit Gate — 10/10 SATISFIED

M10 is `COMPLETE / VERIFIED PASS` because:

1. M9 prerequisite PASS — satisfied;
2. PR-bound WebAuthn Owner assertion is the enforced normal CI authorization — satisfied;
3. all negative/replay/freshness/revocation/OIDC tests PASS — satisfied;
4. recovery PASS — satisfied;
5. immutable audit PASS — satisfied;
6. one expensive CI per approved head proven — satisfied on two distinct approved heads;
7. no checkbox/emoji authorization path remains — satisfied;
8. Human-only Merge preserved — satisfied;
9. Evidence/Roadmap/Traceability synchronized — satisfied by the closure work package;
10. Controlled-Cutover implementation branch is absent after Human merge; the closure branch must likewise be deleted after Human merge.

Canonical closure evidence: `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`.
