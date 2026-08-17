# M10 — Passkey-only Human/Owner PR Authorization Runbook

Status: IN PROGRESS — Prerequisite Gate satisfied (M9 `COMPLETE / VERIFIED PASS`,
`docs/evidence/m9/M9_CLOSURE_EVIDENCE.md`); Phases 1-2 implemented and tested, see
`docs/evidence/m10/M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md` and
`docs/evidence/m10/M10_PHASE2_CHALLENGE_ISSUANCE_2026-08-17.md`; Phases 3-6 and Controlled Cutover
outstanding  
Date: 2026-08-12  
Updated: 2026-08-17  
Authority: ADR-0066, ESS-0022, M10 Threat Model, DEVELOPMENT Chain Execution Policy, HUMAN_OWNER_PR_APPROVAL_POLICY

## Goal

Introduce CAPITAL-AI WebAuthn/passkey transaction bound to the exact current PR state as the **strong authorization** for expensive CI consumption (action `AUTHORIZE_PR_CI`) and related privileged gates.

**Owner-Entscheidung 2026-08-16:** Die transitionalen Mechanismen Current-Head-Review `💪`/`okay` und Owner-Body-Checkboxen sind **bereits retired** (vereinfachter Merge-Prozess). M10 implementiert die **nächste** starke Autorisierungsschicht, nicht die parallele Abschaffung einer noch aktiven Checkbox-Zeremonie.

Human-only **Merge** bleibt verpflichtend (Agenten mergen nicht).

## Prerequisite Gate

M10 implementation starts only when M9 is `COMPLETE / VERIFIED PASS`.

Before any cutover:

- M5 append-only audit remains healthy;
- M9 recovery/break-glass assurance is proven;
- simplified pre-M10 CI path (no checkbox/emoji gate) is documented and stable;
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

## Phase 2 — Challenge Issuance

Server creates a cryptographically random, short-lived, single-use challenge bound to the exact authorization context.

Persist challenge metadata sufficient for issue time, expiry, expected Owner, expected PR context digest, unused/consumed/revoked state.

Never store authenticator private key or biometric material.

## Phase 3 — Owner Credential Enrollment

Owner passkey enrollment is a Human/Owner identity operation (strong session, expected RP/origin, UV required, public credential only, revocation + recovery proven before cutover).

Agents may assist with UI/code but cannot autonomously enroll, replace or revoke Owner credentials.

## Phase 4 — Assertion Verification

On approval: re-resolve PR state; reject drift; verify challenge, RP ID, origin, credential, signature, UP/UV; persist immutable approval Evidence; mark single-use for CI consumption. Any failure → `DENY`.

## Phase 5 — Atomic CI Consumption

Before expensive CI: re-resolve state; compare to approved context; atomically consume approval; persist consumption Evidence; issue exactly one CI request for the approved head. Duplicate → `DENY/DEDUPE`.

## Phase 6 — Shadow Mode

Before cutover, operate M10 verifier in shadow mode while the **simplified** (no checkbox/emoji) path remains authoritative for starting CI.

Shadow M10 must not reintroduce weaker emoji/checkbox authorization.

## Mandatory Negative Tests

Include wrong Owner, wrong RP/origin, UP/UV false, invalid signature, expired/replayed challenge, revoked credential, wrong repo/PR, changed base/head/file-set/diff, unavailable resolver/verifier/audit, already consumed approval, forged legacy `💪`/checkbox/label/reaction (must not authorize), agent self-approval, weak recovery fallback.

## Controlled Cutover

Only after shadow + negative + recovery evidence `VERIFIED PASS`:

1. enable passkey approval as authoritative CI gate for `AUTHORIZE_PR_CI`;
2. verify exactly one approved current-head CI run;
3. verify unapproved attempts do not start expensive CI;
4. keep Human Merge separate;
5. ensure no residual checkbox/emoji authorization path exists in CI;
6. update PR template, governance and Roadmap if needed;
7. repeat post-cutover negative tests.

## Legacy Cleanup

Checkbox- and emoji-based CI authorization was retired on 2026-08-16. After M10 cutover:

- ensure no workflow reintroduces those parsers;
- preserve historical Evidence references only;
- retain Human merge boundary.

## Rollback

### Before M10 enforcement

Keep simplified CI path (no checkbox/emoji gate); do not silently restore weaker emoji/checkbox authorization.

### After M10 enforcement

Do not silently restore emoji/checkbox authorization. Activate pre-approved incident/recovery path and restore a verified safe gate through a controlled change.

## Exit Gate

M10 is `COMPLETE / VERIFIED PASS` only when:

1. M9 prerequisite PASS;
2. PR-bound WebAuthn Owner assertion is the enforced normal CI authorization;
3. all negative/replay/freshness/revocation tests PASS;
4. recovery PASS;
5. immutable audit PASS;
6. one expensive CI per approved head proven;
7. no checkbox/emoji authorization path remains;
8. Human-only Merge preserved;
9. Evidence/Roadmap/Traceability synchronized;
10. implementation work branch deleted after Human merge.
