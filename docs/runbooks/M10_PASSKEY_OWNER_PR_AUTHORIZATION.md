# M10 — Passkey-only Human/Owner PR Authorization Runbook

Status: PLANNED — EXECUTION BLOCKED BY M9
Date: 2026-08-12
Authority: ADR-0066, ESS-0022, M10 Threat Model, DEVELOPMENT Chain Execution Policy

## Goal

Replace the transitional current-head `💪`/`okay` + Owner-checkbox authorization before expensive CI with a CAPITAL-AI WebAuthn/passkey transaction bound to the exact current PR state.

Human File Review and Human-only Merge remain mandatory.

## Prerequisite Gate

M10 implementation starts only when M9 is `COMPLETE / VERIFIED PASS`.

Before any cutover:

- M5 append-only audit remains healthy;
- M9 recovery/break-glass assurance is proven;
- current Owner gate remains authoritative;
- rollback plan is accepted;
- exact RP ID / HTTPS origin architecture is approved;
- Owner credential enrollment and recovery procedure is defined.

## Phase 1 — Trusted PR State Resolver

Implement server-side resolution of:

- repository `SvenKulessa/Finance`;
- PR number;
- base branch/SHA;
- exact current head SHA;
- canonical sorted changed-file set;
- canonical diff/review digest;
- action `AUTHORIZE_PR_CI`.

Do not accept agent-supplied hashes as authoritative. The trusted service recomputes context from GitHub state.

Required deterministic serialization/versioning must be documented so verification and audit reconstruct the same context.

## Phase 2 — Challenge Issuance

Server creates a cryptographically random, short-lived, single-use challenge bound to the exact authorization context.

Persist challenge metadata sufficient for:

- issue time;
- expiry;
- expected Owner;
- expected PR context digest;
- unused/consumed/revoked state.

Never store authenticator private key or biometric material.

## Phase 3 — Owner Credential Enrollment

Owner passkey enrollment is a Human/Owner identity operation.

Requirements:

- strong authenticated Owner session;
- expected RP/origin;
- user verification required;
- public credential registration only;
- credential lifecycle metadata/audit;
- explicit revocation capability;
- recovery procedure verified before passkey-only cutover.

Agents may assist with UI/code but cannot autonomously enroll, replace or revoke Owner credentials.

## Phase 4 — Assertion Verification

On approval:

1. re-resolve current PR state;
2. reject context drift;
3. verify challenge is current and unused;
4. verify expected RP ID and HTTPS origin;
5. resolve the registered Owner credential;
6. verify assertion signature;
7. require `UP=true`;
8. require `UV=true`;
9. verify credential is not revoked;
10. verify exact challenge/context/action;
11. persist immutable approval Evidence;
12. mark approval available for exactly one CI consumption.

Any failure → `DENY`; no CI request.

## Phase 5 — Atomic CI Consumption

Before requesting expensive CI:

1. re-resolve base/head/file-set/diff state again;
2. compare to approved context;
3. atomically consume approval/idempotency key;
4. persist consumption Evidence;
5. issue exactly one CI request for the approved head.

Duplicate requests → `DENY/DEDUPE` without a second expensive run.

## Phase 6 — Shadow Mode

Before legacy removal, operate M10 verifier in shadow mode while the current Owner gate remains authoritative.

For a representative set of PRs compare:

- legacy decision;
- passkey decision;
- exact context binding;
- false allow;
- false deny;
- challenge expiry/retry behavior;
- audit completeness;
- single-trigger CI behavior.

Shadow M10 must not bypass or weaken the existing gate.

## Mandatory Negative Tests

- wrong Owner credential → DENY;
- wrong RP ID → DENY;
- wrong origin → DENY;
- `UP=false` → DENY;
- `UV=false` → DENY;
- invalid signature → DENY;
- expired challenge → DENY;
- challenge/assertion replay → DENY;
- revoked credential → DENY;
- wrong repository/PR → DENY;
- changed base SHA → DENY;
- changed head SHA → DENY;
- file-set change → DENY;
- diff/review digest change → DENY;
- unavailable GitHub state resolver → DENY;
- unavailable verifier → DENY;
- unavailable durable audit → DENY;
- already consumed approval → DENY/DEDUPE;
- forged `💪` / `okay` / checkbox / comment / label / reaction → no passkey authorization;
- agent self-approval → DENY;
- weak recovery fallback → DENY.

## Recovery Drill

Before cutover prove:

1. lost/revoked credential can be recovered through the approved Human/Owner process;
2. recovery is strong-authenticated, reason-bound and audited;
3. affected outstanding challenges/approvals are invalidated;
4. a recovered/new credential can authorize a new exact PR transaction;
5. legacy weak signals do not become fallback authorization;
6. agent `MERGE` remains denied.

## Controlled Cutover

Only after shadow + negative + recovery evidence `VERIFIED PASS`:

1. freeze legacy authorization changes;
2. enable passkey approval as authoritative CI gate;
3. verify exactly one approved current-head CI run;
4. verify unapproved/legacy-only attempts do not start expensive CI;
5. keep Human File Review / Viewed;
6. keep Human Merge separate;
7. remove `💪`/`okay` and Owner-checkbox logic from CI authorization path;
8. update PR template, governance and Roadmap;
9. repeat post-cutover negative tests.

## Legacy Cleanup

After successful cutover:

- remove legacy review-text authorization parser;
- remove Owner checkbox authorization semantics;
- remove final `pull_request: edited` event as the normal expensive-CI authorization mechanism if no longer needed;
- preserve relevant Human review UI/process guidance;
- retain historical Evidence references only.

No cleanup before `VERIFIED PASS` cutover evidence.

## External Mutation Classification

Owner credential enrollment/recovery and any production authorization-service configuration may be external/security mutations and require exact classification plus separate Human approval where applicable.

Database/schema changes, if required by implementation, must be independently roadmapped rather than assumed.

## Rollback

### Before legacy removal

Disable M10 enforcement and retain/restore the still-authoritative transitional Owner gate.

### After legacy removal

Do not silently restore weaker authorization. Activate the pre-approved incident/recovery path, obtain Human/Owner approval for rollback architecture, and restore a verified safe gate through a controlled change.

## Evidence

Create `docs/evidence/m10/*` containing:

- final architecture/ESS/threat model versions;
- credential enrollment/recovery evidence without secret material;
- positive/negative WebAuthn tests;
- context drift/replay results;
- shadow decision comparison;
- immutable approval/consumption audit refs;
- single-CI proof;
- cutover proof;
- legacy cleanup proof;
- Human merge boundary proof;
- rollback/recovery proof;
- branch deletion state.

## Exit Gate

M10 is `COMPLETE / VERIFIED PASS` only when:

1. M9 prerequisite PASS;
2. PR-bound WebAuthn Owner assertion is the enforced normal CI authorization;
3. Human file review remains mandatory;
4. all negative/replay/freshness/revocation tests PASS;
5. recovery PASS;
6. immutable audit PASS;
7. one expensive CI per approved head proven;
8. legacy emoji/checkbox authorization removed;
9. Human-only Merge preserved;
10. final Evidence/Roadmap/Traceability synchronized;
11. implementation work branch deleted after Human merge.
