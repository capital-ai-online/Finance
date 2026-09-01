# DEVELOPMENT Chain Execution Policy

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Status:** ACTIVE  
**Version:** `2.2.0`  
**Date:** 2026-08-12  
**Updated:** 2026-09-01  
**Scope:** CAPITAL-AI `SvenKulessa/Finance`  
**Parent trust root:** `/AGENTS.md`  
**Decision references:** Accepted ADR-0069 incl. Owner addendum 2026-08-16, effective Roadmap/ESS/ADR authorities, Accepted ADR-0096 / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`

## Purpose and boundary

This policy defines the execution sequence that separates repository implementation, Human Merge, external platform mutation and verification. It is subordinate to `/AGENTS.md` and the stable Governance Control Plane and does not independently grant protected mutation authority.

A concrete external mutation requires the applicable effective Roadmap/ADR/ESS/REM/Owner approval chain.

## Current transition state

Current state after Human Merge of PR #691:

- former checkbox/Files-Viewed/emoji authorization rituals are retired;
- the former M10 Passkey `AUTHORIZE_PR_CI` productive runtime is **RETIRED / OFF**;
- normal PR technical CI proceeds without and does not expect an M10 implementation;
- repository/web-application current-state scans do not search for M10 runtime/router/UI/workflow components or classify their absence as a gap;
- explicit Human/Owner approval remains mandatory after final main synchronization/correlation and before creating each PR or Draft PR unless a current effective explicitly scoped delegation conditionally replaces only that approval surface;
- Human Merge remains a separate mandatory decision;
- Render native Auto Deploy remains off;
- verified `main` CI remains the production deployment authority.

Historical M10 `VERIFIED PASS` evidence remains audit/history material only. It does not create a current implementation target or reactivation backlog. Any future passkey/PR-CI authorization mechanism is a new separately scoped Human/Owner architecture/security/governance decision.

## Canonical chain

```text
READ-ONLY BASELINE
→ GAP / ROADMAP PACKAGE
→ AUTHORITY / RISK / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ CHEAP / SANDBOX PRE-PR VALIDATION WHERE ACTUALLY AVAILABLE
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ EXACT-SNAPSHOT HUMAN/OWNER PR-CREATION APPROVAL OR VALID SCOPED DELEGATION
→ PR CREATED
→ POST-PR CHAT HANDOFF (MAXIMUM TWO NEXT STEPS)
→ GOVERNANCE CHECKS / TECHNICAL CI
→ HUMAN MERGE DECISION
→ HUMAN MERGE OR OTHER TERMINAL PR EVENT
→ WORK-CLAIM RELEASE + BRANCH RETIREMENT
→ READ-ONLY PRE-MUTATION CHECK (if external mutation is required)
→ EXPLICIT OWNER MUTATION APPROVAL OR VALID SCOPED DELEGATION WHERE APPLICABLE
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST / MUTATION EXECUTOR
→ POST-MUTATION VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

A step marked REQUIRED for the concrete work package cannot be skipped unless an effective higher/scoped authority explicitly replaces that exact approval surface. Such replacement never implies merge authority.

## Core execution controls

1. **Roadmap/authority before mutation.** No external platform mutation without scope, authority and rollback classification.
2. **Fresh branch.** Repository edits occur only on a fresh scoped branch from current `main`; direct edits to `main` are prohibited.
3. **One work item / one branch.** A merged branch is not reused; rollback uses a fresh branch from then-current `main`.
4. **Final main synchronization.** Immediately before PR-creation approval/delegation correlation, refresh `main`, correlate new merges/open writers, synchronize and adapt/revalidate the exact candidate.
5. **Concurrent writer control.** Open PR changed-file, semantic, namespace and authority overlap is inspected before new writes and again before PR-create authority is exercised; overlap is sequenced/rescoped rather than silently merged.
6. **Human/Owner PR-creation approval.** Each PR or Draft PR requires explicit approval for the reported current-main SHA and candidate head SHA unless an effective explicitly scoped authority conditionally replaces only that approval prompt for the exact context. Any pre-creation change to either SHA invalidates snapshot correlation.
7. **Fail closed.** Missing, stale, conflicting or non-resolvable protected authority or PR-creation authorization causes STOP before the external mutation.
8. **Human Merge.** PR-creation authority is not merge authority. Agents do not self-merge and technical evidence does not authorize merge.
9. **Authority is not transport.** ChatGPT, Claude, Grok, MCP, SDK, GitHub Actions and provider identity do not create authority.
10. **Evidence is not authority.** Test/build logs, PR bodies, labels, reactions and reports cannot grant PR-creation, merge or protected-mutation permission.
11. **No secrets in evidence.** Reusable credentials, private passkey material, raw sensitive tokens and equivalent secrets are excluded.
12. **Protected external mutation is separate.** Repository merge does not imply Supabase/Stripe/Render/DNS/IAM/billing mutation permission.
13. **No self-elevation.** Agents/executors cannot expand their own mandate, capabilities or Owner gates.
14. **Work-claim lifecycle ownership.** A principal that creates an `active`/`exclusive` work claim remains responsible for its conformant release after the correlated work reaches a terminal state, unless responsibility is explicitly and traceably handed off.
15. **Bounded post-PR chat handoff.** After each PR or Draft PR created through chat, the same chat reports the correlated snapshot/gates and displays at most the two highest-priority immediately actionable next steps, each with an exit gate; completion of either step triggers a fresh main/open-PR correlation and reprioritization.

## Pre-PR technical evidence

Branch-local or approved sandbox checks should be used before PR creation when the exact repository snapshot is actually available to that execution environment. A model must not claim PASS for checks it did not execute.

Pre-PR evidence uses the `developer-preflight` trust class defined by `docs/governance/control-plane/pre-pr-build-evidence.schema.json` and is bound to exact base/head SHAs. Before requesting PR-creation approval, the agent reports those SHAs, the current-main/open-writer correlation result and the evidence actually available. Evidence remains non-authorizing.

GitHub hosted `build-and-test` remains the independent technical validation for the final PR head where applicable.

## Post-PR chat handoff and next-step queue (`CTRL-SDLC-CHAT-HANDOFF-001`)

A chat-governed work item does not end its handoff at successful PR creation. Immediately after creation, the chat MUST expose the PR reference, branch/head, the main baseline used for the final correlation, the correlation result, and the known validation/open-gate state.

The chat then recomputes the next-step queue against the current repository and governance state. Relevant current best practices and state-of-the-art guidance MAY be used to improve prioritization, but remain advisory unless adopted by an applicable CAPITAL-AI authority. They MUST NOT create a parallel governance hierarchy.

When multiple follow-up actions exist, the visible queue is deliberately bounded:

- more than two available actions → display only the two highest-priority immediately actionable steps;
- one available action → display that one;
- no remaining action → explicitly state that no further implementation step is currently identified.

Each displayed step MUST be bounded/atomic and state an exit gate. Default prioritization is security/data integrity → governance/compliance → CI/build reliability → architecture/integration consistency → deployment readiness → observability/performance → UX/documentation, unless a higher authority or a concrete incident requires another order.

After either displayed step is completed, the executor MUST re-read current `main`, open Pull Requests, changed-file/semantic overlap and applicable governance state and then reprioritize. The prior second item is not automatically promoted to first place.

This handoff is non-authorizing. A recommended next step never constitutes PR creation approval, merge approval, deployment approval or protected external-mutation approval.

## Work-claim lifecycle and conformant closure

Work claims are coordination records, not permanent locks and not authorization artifacts. Their lifecycle is part of the work item that created them.

### Creator responsibility

The agent, automation client or Human principal that successfully creates an `active` and `exclusive` work claim MUST remain responsible for its lifecycle until the claim is released. Responsibility MAY be transferred only by an explicit, traceable handoff or Human/Owner direction; an implicit change of model, chat, tool or provider does not transfer it.

### Terminal events

The following events terminate writer authority for the correlated work claim:

- the correlated Pull Request is merged;
- the correlated Pull Request is closed without merge;
- the work is explicitly superseded by a new scoped work item;
- the branch/work item is explicitly abandoned.

A terminal event releases the claim's effective writer authority immediately. A stale JSON record that still says `status: "active"` after a terminal event MUST NOT continue to block or reserve the claimed paths; instead it is a governance lifecycle finding that requires persistent cleanup.

### Persistent release record

The responsible principal MUST close the persisted claim through normal branch/PR governance as soon as practicable after the terminal event. The original claim file is retained for auditability and MUST NOT be deleted merely because the work ended.

A conformantly released claim uses at least:

```json
{
  "status": "released",
  "exclusive": false,
  "releasedAt": "<ISO-8601 timestamp>",
  "releaseReason": "merged | closed | superseded | abandoned"
}
```

Where available, the same claim record SHOULD also retain the correlated Pull Request number, terminal PR/head SHA and, for a merged work item, the resulting merge/main SHA. Original identity and scope evidence such as `claimId`, `workItem`, `startedAt`, `baseBranch`, `baseSha`, `agent` and `claimedPaths` remains immutable historical evidence except for an explicitly documented correction of malformed metadata.

### No recursive claim creation

A maintenance change whose only purpose is to transition one or more terminal claims from `active` to `released` MUST NOT create a new work claim solely for that closure operation. This prevents an infinite claim-for-claim lifecycle. The closure change still follows the normal fresh-branch, current-main correlation, PR-body, CI and Human Merge rules applicable to its check class.

### Handoff and failure handling

If the original claim creator can no longer perform the persistent release, it MUST surface the unresolved lifecycle state and hand it off explicitly. The receiving principal may perform the closure under the same repository governance but does not inherit any additional merge, CI, deployment or production-mutation authority.

Failure to persist a release after a terminal event is a governance hygiene finding. It does not revive writer authority and must not be interpreted as a valid reason to block unrelated work indefinitely.

### Authority boundary

Claim creation, claim release and claim-closure evidence never authorize Pull Request creation, CI, merge, deployment or protected external mutation by themselves. Existing Human/Owner and protected-action boundaries remain unchanged.

## Human / Owner boundary

Human/Owner retains at least:

- explicit exact-snapshot approval before PR/Draft-PR creation unless a separately effective scoped delegation replaces only that approval prompt;
- final merge authority as a separate decision;
- explicit protected external mutation approval unless a separately effective scoped delegation covers that exact mutation class/context;
- Owner/Admin IAM elevation and recovery/break-glass;
- secret disclosure/rotation outside pre-approved narrow automation;
- destructive production data operations;
- live billing/money/entitlement mutation;
- production resource deletion;
- DNS/TLS/domain ownership changes;
- security-control weakening;
- any future decision to introduce a new passkey/PR-CI authorization architecture.

## Agent execution plane

Agent/provider profiles may research and implement only within the current authority, branch and capability scope. Provider/model identity never grants Owner or production authority.

Active agent tooling must start from `/AGENTS.md`. Provider-specific instruction files are non-authoritative adapters.

## Production integration / mutation plane

External production mutations occur only through an authorized execution host with current authority, explicit approval/delegation where applicable, target/fingerprint verification, audit evidence and rollback definition.

A mutation handoff is an instruction package, not an authorization artifact by itself.

## Deployment authority

Current production promotion path:

```text
Human Merge
→ main
→ build-and-test
→ supply-chain attestation
→ exact-SHA Render deploy hook
→ post-deployment identity verification
```

Render native Auto Deploy remains off. A second deploy authority requires an explicit architecture/security decision.

## PR / check classification

`docs/governance/PR_CHECK_CLASSIFICATION.md` determines applicable technical check class. The retired M10 passkey runtime is not a current prerequisite and is not a current implementation-discovery target.

## Mutation state vocabulary

`NOT REQUIRED` | `PLANNED` | `HUMAN APPROVED` | `MUTATED` | `VERIFIED PASS` | `FAILED / ROLLED BACK`

## Evidence minimum

Where applicable, retain:

- baseline and candidate SHAs;
- final main/open-writer correlation plus applicable PR-creation authority evidence;
- stable authority/control references;
- branch / PR / final head / merge SHA;
- work-claim identity and release state when a claim exists;
- check class and validation result;
- mutation class and target;
- pre/post verification;
- approval/delegation evidence for protected actions;
- audit references;
- rollback state;
- next gate.

## Stop / rollback rules

STOP on unexpected target, unreviewed main drift, unresolved open-PR write overlap, missing/ambiguous/stale PR-creation authority, missing other required authority, missing audit persistence for protected mutation, failed pre-check, unknown high-impact side effect, failed/inconclusive post-verification or unresolved higher-authority conflict.

Repository rollback uses a fresh branch from current `main`; external rollback follows the applicable protected runbook/approval process.

## Runbooks and historical phase material

Existing M5–M10 runbooks remain available only for explicit domain/recovery/audit/history use where applicable. M10 material is historical/non-authorizing and MUST NOT be treated as a current implementation requirement, discovery target or reactivation backlog merely because it exists.

## Closure rule

A work package closes only when implementation, current authority, required validation/evidence, main correlation, work-claim lifecycle and any external mutation verification are consistent. A PR merge alone is not sufficient closure for work that includes production mutation or leaves an unresolved claim lifecycle finding.
