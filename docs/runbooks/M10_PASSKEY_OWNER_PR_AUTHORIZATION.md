# M10 — Passkey-only Human/Owner PR Authorization Runbook

Status: CONTROLLED CUTOVER IN IMPLEMENTATION — Phases 1-6 are implemented; Phase 6 production Shadow/Negative/Recovery assurance reached `VERIFIED PASS` on 2026-08-19. PR #429 implements the Controlled-Cutover repository path. M10 is **not `COMPLETE / VERIFIED PASS`** until the Human-merged/default-branch workflow is deployed and the post-cutover exact-head CI, unapproved-DENY, replay and recovery checks below are proven in production.
Date: 2026-08-12  
Updated: 2026-08-19  
Authority: ADR-0066, ESS-0022, M10 Threat Model, DEVELOPMENT Chain Execution Policy, HUMAN_OWNER_PR_APPROVAL_POLICY, ADR-0069 Owner addendum 2026-08-16

## Goal

Use a CAPITAL-AI WebAuthn/passkey transaction bound to the exact current PR state as the **strong authorization** for expensive CI consumption (action `AUTHORIZE_PR_CI`).

**Owner decision 2026-08-16:** current-head `💪`/`okay`, Viewed-state and Owner-body-checkbox mechanisms are retired as CI authorization signals. M10 replaces the simplified pre-M10 automatic PR CI path with passkey authorization; it does not revive or layer on top of those legacy signals.

Human-only **Merge** remains mandatory and separate. An M10 CI authorization can never authorize merge.

## Prerequisite Gate

Before Controlled Cutover:

- M9 prerequisite is `COMPLETE / VERIFIED PASS`;
- M5 append-only audit remains healthy;
- simplified pre-M10 CI path (no checkbox/emoji gate) is stable;
- rollback plan is accepted;
- exact RP ID / HTTPS origin architecture is approved;
- a real Owner passkey is enrolled;
- Phase-6 Shadow, negative and recovery assurance is `VERIFIED PASS`.

As of 2026-08-19 these prerequisites are satisfied for Controlled-Cutover implementation.

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

## Phase 5 — Atomic CI Consumption — VERIFIED FOUNDATION

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

## Mandatory Negative Tests

Required matrix: wrong Owner, wrong RP/origin, UP/UV false, invalid signature, expired/replayed challenge, revoked credential, wrong repo/PR, changed base/head/file-set/diff, unavailable resolver/verifier/audit, already consumed approval, forged legacy `💪`/checkbox/label/reaction, agent self-approval and weak recovery fallback.

Controlled-Cutover additions include fork/cross-repository heads, malformed/ambiguous Git refs, forged/manual workflow dispatch, missing/wrong-audience/expired/forged GitHub Actions OIDC identity, wrong OIDC repository/ref/SHA/run/workflow claims, and duplicate workflow-gate redemption.

These tests may be satisfied by deterministic automated evidence where deliberately reproducing the failure in production would add risk without increasing assurance. Post-cutover live checks are still mandatory for the actual CI gate and replay/authorization boundary.

## Controlled Cutover — IMPLEMENTATION IN PROGRESS

### Target control flow

```text
NORMAL PR EVENT
→ cheap required-check DENY before checkout/npm/build
→ no expensive CI

OWNER IN CAPITAL-AI
→ exact open PR state resolution
→ Owner WebAuthn/passkey assertion
→ immutable approval Evidence
→ exact same-repository PR branch/head re-resolution
→ atomic one-head/one-approval consumption claim
→ exactly one GitHub workflow_dispatch to that branch
→ workflow obtains short-lived GitHub Actions OIDC identity
→ workflow presents OIDC identity + single-use consumptionId to CAPITAL-AI workflow gate
→ server verifies GitHub RS256 signature + issuer/audience + exact repo/ref/SHA/run/workflow claims
→ server re-resolves current PR base/head/file-set/diff and exact same-repository branch
→ exact approval/consumption/current-state comparison
→ durable pre-finalize audit with hashed capability/OIDC-JTI correlation
→ atomic PENDING -> DISPATCHED
→ only winner proceeds to checkout/npm/test/build/docker as classified
→ required `build-and-test` attaches to the approved head
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

- `pull_request` events may create the required check context but must fail before expensive steps unless they are the explicitly documented one-time Controlled-Cutover bootstrap PR #429;
- `workflow_dispatch` must target the same-repository PR branch whose current head equals the approved SHA;
- dispatched inputs must carry consumption/approval/PR/base/head/digest/action context;
- before checkout/npm/build, the workflow must obtain GitHub Actions OIDC and redeem OIDC + the single-use consumption capability at the production M10 workflow-gate endpoint;
- unknown, malformed, mismatched, replayed or already-finalized capabilities deny before expensive CI;
- invalid/missing/stale/wrong-audience/wrong-context OIDC identities deny before expensive CI;
- a manually initiated workflow dispatch without both valid workload identity and an unredeemed M10 capability must not start expensive CI;
- the required job name remains `build-and-test` so the current-head successful authorized run can satisfy branch protection;
- main-push supply-chain/deployment jobs remain separate from PR-head CI authorization.

### Post-merge Controlled-Cutover verification

Only after Human merge and production deployment:

1. confirm `M10_GITHUB_TOKEN` and the separate `M10_GITHUB_DISPATCH_TOKEN` are both configured server-side without exposing values;
2. create/open a fresh test PR from then-current `main`;
3. verify its ordinary PR event fails before checkout/npm/test/build/docker and therefore starts no expensive CI;
4. perform a real Owner passkey authorization for that exact current head;
5. verify exactly one authorized `build-and-test` runs on that head, presents a valid GitHub OIDC workload identity and passes the production workflow gate;
6. replay the same authorization/consumption and verify no second expensive run can start;
7. verify a malformed/manual dispatch cannot pass OIDC + consumption gates;
8. mutate the test PR head and verify old approval/state cannot authorize the new head;
9. recover using a fresh challenge/approval on the new stable head;
10. confirm Human Merge remains independent and no checkbox/emoji/label/reaction path authorizes CI;
11. correlate immutable approval, consumption, OIDC/workflow and M5 audit evidence;
12. synchronize final Evidence/Roadmap/Traceability, then and only then mark M10 `COMPLETE / VERIFIED PASS`.

## Legacy Cleanup

Checkbox- and emoji-based CI authorization was retired on 2026-08-16. Controlled Cutover must preserve that retirement:

- no workflow parser may consume emoji/text/Viewed/checklist/label/reaction as CI authorization;
- historical Evidence references remain historical only;
- Human merge remains separate.

## Rollback

### Before Human merge of Controlled Cutover

Do not change production. The simplified pre-M10 automatic PR CI path remains authoritative.

### After Controlled Cutover merge but before post-cutover `VERIFIED PASS`

Fail closed rather than silently restoring a weak authorization signal. If the authoritative path cannot safely dispatch CI, stop expensive PR CI and repair through a fresh, Human-authorized rollback/fix branch. Do not restore emoji/checkbox authorization.

### After M10 enforcement

Activate the pre-approved incident/recovery process and restore only a verified safe gate through controlled change. Human Merge remains separate throughout recovery.

## Exit Gate

M10 is `COMPLETE / VERIFIED PASS` only when:

1. M9 prerequisite PASS;
2. PR-bound WebAuthn Owner assertion is the enforced normal CI authorization;
3. all negative/replay/freshness/revocation/OIDC tests PASS;
4. recovery PASS;
5. immutable audit PASS;
6. one expensive CI per approved head proven;
7. no checkbox/emoji authorization path remains;
8. Human-only Merge preserved;
9. Evidence/Roadmap/Traceability synchronized;
10. implementation work branch deleted after Human merge.
