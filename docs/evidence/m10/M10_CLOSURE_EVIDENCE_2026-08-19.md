# M10 — Closure Evidence (COMPLETE / VERIFIED PASS)

Status: **COMPLETE / VERIFIED PASS**  
Date: 2026-08-19  
Closure baseline: `main@2d8e482174e97601d4343249e50d208ccf6f6355`  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`, M10 Threat Model

## 1. Purpose

This document is the durable M10 closure record. It consolidates the implemented passkey-only Owner CI-authorization chain, Phase-6 assurance, Controlled Cutover, production deployment and the post-cutover live exit matrix.

M10 authorizes only `AUTHORIZE_PR_CI`. Human Merge remains a separate Human-only action. No checkbox, Viewed state, emoji, comment, label, reaction or generic GitHub review state is a CI authorization credential.

## 2. Closure determination

All M10 Exit-Gate controls are satisfied:

| Exit control | Closure result | Evidence |
|---|---|---|
| M9 prerequisite | PASS | `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md` |
| PR-bound Owner WebAuthn assertion | PASS | Phase 4 + live authoritative PR #431 assertions |
| Short-lived/single-use challenge, RP/origin, signature, UP/UV | PASS | Phase 4 verifier + Phase 6/live evidence |
| Immutable approval evidence | PASS | authoritative PR #431 approvals persisted before CI consumption |
| Exact PR base/head/file-set/diff binding | PASS | deterministic drift tests + live stale-state isolation |
| Exactly one CI consumption per approved head | PASS | two distinct live approved heads, one consumption/dispatch each |
| GitHub Actions workload identity | PASS | exact-context OIDC verified in production workflow gate |
| Replay / duplicate fail-closed | PASS | Owner duplicate DEDUPE + manual Actions rerun DENY |
| Ordinary unapproved PR event | PASS | cheap DENY before checkout/npm/test/build/docker |
| Fresh recovery | PASS | new Owner authorization after real base/head change |
| Legacy authorization retirement | PASS | no checkbox/emoji/Viewed/reaction authorization path |
| Human-only Merge separation | PASS | passkey authorization never grants merge |
| Audit correlation | PASS | Owner begin/complete → dispatch → workflow-gate claims correlated in M5 |
| Roadmap / Runbook / Traceability sync | PASS via this closure work package | authoritative docs synchronized together |

## 3. Implemented authorization chain

```text
OPEN PR / CURRENT STATE
→ ordinary pull_request check fails cheaply before expensive work
→ CAPITAL-AI resolves trusted PR base/head/file-set/diff
→ Owner performs WebAuthn assertion for AUTHORIZE_PR_CI
→ challenge/RP/origin/credential/signature/UP/UV verified
→ immutable approval evidence persisted
→ current same-repository PR branch/head re-resolved
→ atomic exact-head consumption claim
→ one workflow_dispatch to exact PR branch
→ GitHub Actions obtains short-lived OIDC identity
→ CAPITAL-AI verifies GitHub RS256 signature + issuer/audience + repo/ref/SHA/run/workflow claims
→ PR state re-resolved immediately before workflow-gate redemption
→ one-time consumption atomically PENDING → DISPATCHED
→ only the winner proceeds to classified CI
→ successful required build-and-test attaches to approved head
→ Human Merge remains separate
```

## 4. Production post-cutover proof

Probe PR #431 was created from the then-current main and remained documentation-only.

### Initial approved head

- head: `da92c86d4aeff96dfeec65a9eada1f98cead2351`;
- ordinary CI `#1872`: expected M10 DENY at first step, all expensive steps skipped;
- authoritative Owner passkey: PASS;
- authorized workflow run `32228796660` / CI `#1873`: `workflow_dispatch`, exact approved head, workflow gate PASS, `build-and-test` SUCCESS;
- duplicate Owner authorization on the unchanged head: `DEDUPE_HEAD`; no second consumption or dispatch.

Exactly-once correlation for the initial head: **2 approvals / 1 consumption / 1 accepted dispatch / 1 successful workflow-gate claim**.

### Drift and recovery

A documentation-only change advanced the probe head. The ordinary synchronize event again failed cheaply at the first M10 step and old approval state did not authorize the new head.

During the probe, PR #430 was Human-merged and `main` advanced to `2d8e482174e97601d4343249e50d208ccf6f6355`. The probe was conflict-free synchronized to recovery head `6e448ba752daa89ac91394c2c7ebc08de5da07f8` with no M10 path conflict.

Fresh Owner authorization on that reconciled state produced exactly one new consumption and GitHub run `32231008414` / CI `#1878`. Production audit recorded:

- `githubOidcVerified=true`;
- `currentPrStateReResolved=true`;
- `singleUseWorkflowGate=true`.

Run `#1878` completed successfully on the exact approved head.

Recovery-head correlation: **1 approval / 1 consumption / 1 accepted dispatch / 1 successful workflow-gate claim**.

### Actions replay boundary

The already-authorized `build-and-test` job from the recovery run was manually re-run. The new runner reached only the M10 gate; the already-finalized consumption was denied, checkout was skipped, and every downstream expensive step was skipped. No additional consumption was created.

## 5. Negative assurance coverage

Live and deterministic evidence jointly cover:

- wrong Owner / agent self-approval;
- wrong RP/origin;
- UP/UV failure;
- invalid or forged signatures;
- expired/replayed challenges;
- revoked/unknown credentials;
- wrong repository/PR;
- changed base/head/file-set/diff;
- unavailable resolver/verifier/audit;
- already-consumed approval / duplicate head;
- fork/cross-repository head and malformed Git refs;
- missing/wrong-audience/expired/forged/non-RS256 GitHub Actions OIDC;
- wrong OIDC repository/ref/SHA/run/event/workflow claims;
- duplicate workflow-gate redemption;
- forged legacy checkbox/emoji/text/label/reaction/Viewed signals;
- weak fallback attempts.

Failures remain fail-closed. Recovery does not restore legacy CI authorization.

## 6. State-of-the-art / enterprise benchmark

The final control model was rechecked on 2026-08-19 against current primary standards and platform guidance:

- **W3C WebAuthn Level 3:** randomized server-side challenge, exact challenge/origin/RP validation, UP and required UV, and replay-resistant ceremony semantics align with the implemented verifier.
- **NIST SP 800-63B-4:** WebAuthn/FIDO-style verifier-name binding provides phishing resistance; fresh nonces/challenges provide replay resistance. The M10 Owner gate uses this cryptographic model instead of manually transferable approval signals.
- **GitHub Actions OIDC:** `id-token: write` is scoped to requesting the OIDC token and does not itself grant repository write access. M10 additionally binds signed workload claims to repository/ref/SHA/run/workflow plus the independent single-use consumption capability.
- **GitHub required checks:** successful required checks must correspond to the latest PR commit SHA. M10 dispatches the exact current PR branch/head and re-resolves state again at the workflow gate.

This is consistent with enterprise least-privilege, short-lived workload identity, transaction binding, fail-closed authorization and auditable separation-of-duties patterns used for sensitive CI/CD controls.

## 7. Before / After

| Control | Before M10 | M10 closed state |
|---|---|---|
| Expensive PR CI | automatic PR-event path | Owner passkey authorization required |
| Human signal | review/merge governance only | review/merge governance only |
| Cryptographic CI authority | none | WebAuthn exact-state approval |
| CI execution identity | GitHub event context | GitHub OIDC + one-time M10 consumption |
| Replay | workflow/event semantics | atomic exactly-once head claim + gate redemption |
| Head drift | ordinary CI reruns | stale approvals cannot authorize changed state |
| Legacy checkbox/emoji | retired transitional history | no authorization role |
| Audit | generic CI evidence | immutable approval/consumption/OIDC/M5 correlation |
| Merge | Human-only | Human-only |

## 8. Residual operational obligations

`COMPLETE / VERIFIED PASS` does not authorize future production mutation by itself. Any later SA5/external-mutation work remains subject to its own accepted authority, fresh-main branch, exact Human authorization, least privilege, pre/post verification, rollback and durable audit requirements.

If M10 later becomes unhealthy, remain fail-closed and repair/revert through a fresh Human-authorized branch. Do not restore automatic expensive PR CI or any checkbox/emoji/reaction fallback.

## 9. Closure references

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/architecture/ROADMAP.md`
- `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`
- `docs/evidence/m10/M10_PHASE6_SHADOW_MODE_2026-08-19.md`
- `docs/evidence/m10/M10_CONTROLLED_CUTOVER_2026-08-19.md`
- closed assurance PR #431 / final probe evidence `M10_POST_CUTOVER_ASSURANCE_2026-08-19.md`
- Controlled-Cutover PR #429
