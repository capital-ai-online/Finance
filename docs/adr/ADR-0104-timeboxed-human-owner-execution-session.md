# ADR-0104 — Timeboxed Human Owner Delegated Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Version:** `1.3.1`  
**Status:** `OWNER-DECIDED / AMENDMENT EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Date:** `2026-09-01`  
**Decision Owner:** CAPITAL-AI Human Owner  
**Delegated executor:** exactly one predeclared ChatGPT conversation/session per activation  
**Duration:** `PT8H` per successful activation  
**Expiry:** automatic; `SESSION_START + PT8H`  
**Project scope:** exactly one predeclared canonical CAPITAL-AI project and canonical `docs/projects/<project>/` folder per activation  
**Activation slots after this amendment is Human-merged:** `ADR-0104-S1=AVAILABLE`, `ADR-0104-S2=CONSUMED`, `ADR-0104-S3=AVAILABLE`  
**Merge boundary:** every Pull Request MUST be merged by the Human Owner; merge execution is never delegated by ADR-0104  
**Mutation scope:** only Human-directed repository/provider mutations attributable to the project bound to the active session, excluding Pull Request merge execution  
**Supersession type:** temporary, conditional, partial, chat-bound, project-bound, quota-limited and self-expiring Human Owner delegation

## 1. Human Owner decision

The CAPITAL-AI Human Owner authorizes a bounded delegated-execution mechanism under this ADR. Each successful activation delegates execution authority to exactly one chat for exactly one canonical project scope and for no more than eight hours.

The Human Owner remains the Human principal and does not transfer personal identity, credentials or legal personhood to the model. Actions performed by the delegated executor are attributable to the Human Owner decision plus the concrete repository/provider audit trail.

An ADR-0104 activation MUST NOT be shared across chats, copied into another conversation, transferred to another agent session or expanded to another project. A new chat or a different project requires a different `AVAILABLE` slot and a new valid activation.

ADR-0104 exposes exactly three activation slots: `ADR-0104-S1`, `ADR-0104-S2`, `ADR-0104-S3`. No `S4` or later slot is authorized. Additional slots require a new explicit Human Owner authority change through the normal ADR/governance lifecycle.

### 1.1 Current slot ledger and monotonic consumption

Human Merge of this v1.3.1 amendment establishes the following current slot state:

| Slot | State | Basis |
|---|---|---|
| `ADR-0104-S1` | `AVAILABLE` | explicit one-time Human Owner reset introduced by v1.3.0 |
| `ADR-0104-S2` | `CONSUMED` | valid v1.2 S2 activation was already used to authorize creation/execution of PR #691 before the v1.3.0 merge cutover; v1.3.0 never explicitly reset S2 |
| `ADR-0104-S3` | `AVAILABLE` | no successful activation observed |

`AVAILABLE` means eligible for a future explicit activation. It does **not** mean active, delegated or bound to any chat/project.

A successful activation transitions one slot from `AVAILABLE` to `ACTIVE`; expiry or revocation transitions it to `CONSUMED`. Slot consumption is monotonic unless a later explicit Human Owner amendment names and resets that exact slot. A version cutover MUST NOT implicitly resurrect a slot consumed by a valid activation that occurred before the cutover.

Invalid or rejected activation attempts that never become authorizing do not consume a slot.

### 1.2 Explicit S1 reset and historical continuity

The Human Merge of PR #678 on `2026-09-01T13:48:30Z` created the original v1.1.0 bootstrap delegation historically identified as `ADR-0104-S1`.

That historical event remains immutable audit evidence. The Human Owner explicitly decided in v1.3.0 that this pre-v1.3 legacy S1 activation does not consume the current v1.3 slot pool. Therefore S1 remains `AVAILABLE` after this amendment. This is a named one-time reset and MUST NOT be generalized to S2 or S3.

### 1.3 S2 / v1.3 cutover race resolution

The following observed chronology creates the S2/v1.3 race:

1. ADR-0104 v1.2.0 was still the effective authority while PR #689, the v1.3.0 amendment, remained unmerged.
2. PR #691 (`[CAPITAL-AI-OPS] M10 Passkey Runtime vollständig stilllegen`) was created at `2026-09-01T15:20:24Z` and documented `ADR-0104-S2` as its delegated PR-creation authority under the then-effective v1.2 model.
3. PR #689 Human-merged ADR-0104 v1.3.0 at `2026-09-01T15:22:24Z`, two minutes after PR #691 had already consumed the S2 authorization edge.
4. The v1.3.0 text projected S2 as `AVAILABLE` on the premise that S2 had never been consumed. That premise raced with the valid S2 activation and was false by the time v1.3.0 became effective.

Fail-closed resolution: **S2 is `CONSUMED`.** The v1.3.0 amendment contained an explicit reset only for S1. It did not contain an explicit Human Owner reset for S2. Therefore the valid pre-cutover S2 activation survives the version transition as consumption evidence and cannot be erased by the stale v1.3.0 bootstrap projection.

PR #691 remains historical execution evidence. Its later Human Merge does not extend the S2 session lifetime and does not create new authority; it only confirms that the S2-authorized work item proceeded through the mandatory Human merge boundary.

### 1.4 Non-delegable Human Owner merge boundary

Every Pull Request governed by CAPITAL-AI, including every Pull Request created or updated during an active ADR-0104 session, MUST be merged by the Human Owner.

ADR-0104 does not delegate, supersede, proxy or automate the Human Owner merge action. The delegated chat MUST NOT invoke merge, enable auto-merge or place a Pull Request into an automatic merge mechanism. Green CI, approvals, labels, comments, reactions, elapsed time or an active ADR-0104 session are never merge authority.

## 2. Amendment bootstrap, activation and expiry

### 2.1 Amendment bootstrap

This v1.3.1 amendment cannot authorize its own merge and cannot activate any slot by itself. Until the Pull Request introducing v1.3.1 is Human-merged into current `main`, ADR-0104 v1.3.0 remains the registered current version, subject to the observed S2 race evidence described above.

Where no demonstrably valid ADR-0104 session is bound to the exact chat and project performing work, the normal exact-snapshot Human Owner PR-creation gate remains controlling.

### 2.2 Preconditions for every new activation

Before an ADR-0104 slot activation becomes authorizing, all of the following MUST be true:

1. the current effective ADR-0104 version is resolved from current `main`;
2. the requested slot is `AVAILABLE` in the current ledger after applying immutable activation/consumption evidence;
3. the Human Owner explicitly activates that exact slot in the exact chat receiving the delegation;
4. the activation names exactly one canonical CAPITAL-AI project and one canonical project folder;
5. current `main` confirms the project/folder mapping and Primary Owner/PVC relationship where applicable;
6. the chat is not inheriting, cloning, transferring or reusing another chat's activation;
7. no higher authority or unresolved security/data-integrity/governance conflict prohibits activation.

The activation record MUST resolve at minimum:

```text
SESSION_ID       = ADR-0104-S<1|2|3>
SLOT_STATE       = AVAILABLE -> ACTIVE
CHAT_BINDING     = this exact conversation/session
PROJECT_ID       = one canonical CAPITAL-AI project
PROJECT_FOLDER   = one canonical docs/projects/<project>/ folder
SESSION_START    = auditable Human Owner activation timestamp
SESSION_END      = SESSION_START + PT8H
```

If any field is missing, ambiguous or inconsistent with current `main`, activation is `DENIED / REQUIRES_CORRELATION` and no delegated authority exists.

### 2.3 Session binding and expiry

The session is bound simultaneously to `CHAT_BINDING` and `PROJECT_FOLDER` for its entire lifetime. Neither binding may be changed in place. A copied prompt, exported transcript, linked conversation, new chat or new agent session does not inherit the activation.

If canonical project identity/folder becomes ambiguous or is reassigned, protected execution stops fail-closed. At `SESSION_END`, every temporary delegated permission and supersession edge expires automatically and the slot becomes `CONSUMED`. Revocation has the same effect.

## 3. Project-bound session scope

The delegated executor may act only on work that is both Human-directed in the bound chat and owned by the project identified by `PROJECT_ID` / `PROJECT_FOLDER` on then-current `main`.

The canonical project folder is the ownership/routing anchor, not a simplistic filesystem allowlist. Productive runtime, tests, configuration or provider resources may physically live outside that folder only when current repository authority maps them to the bound project.

For every new work item, current `main`, open Pull Requests/writers, project ownership, affected PVC/VC stages where relevant and applicable higher authority must still be resolved before mutation.

### 3.1 Foreign-project work is not covered

If the next productive step belongs to another canonical project or Primary Owner, ADR-0104 delegation does not follow it. The executor MUST stop local foreign implementation and apply the normal `FOREIGN_PROJECT_HANDOFF` / `CROSS_PROJECT_HANDOFF_CONTRACT` rules. Unknown target ownership is `REQUIRES_CORRELATION`; guessing is prohibited.

## 4. Scoped temporary supersession metadata

The machine-readable `supersedes` references for ADR-0104 are **relation anchors, not global replacement of the referenced authorities**. They MUST be interpreted only together with the scope below.

| Relation anchor | Superseded surface while session is `ACTIVE` | Scope/condition |
|---|---|---|
| `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` | repeated per-snapshot Human/Owner approval prompt for `CTRL-SDLC-PR-CREATE-001` | exact bound chat + exact bound project + Human-directed work + current-state correlation + before `SESSION_END` |
| `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` | repeated Human approval prompt for eligible protected repository/provider/production mutations explicitly required by the bound project work item | exact bound chat/project + target verification + rollback/restore/compensating-path requirements + before `SESSION_END` |
| `AUTH-GOV-AGENT-TRUST-ROOT` | only the repeated approval surfaces explicitly named above | no other trust-root invariant is replaced |

The relation is therefore `conditional-partial`, not `global`. A consumer MUST NOT infer that ADR-0104 supersedes an entire referenced authority merely because its stable `authorityId` appears in `supersedes` metadata.

### 4.1 Explicit exclusions from supersession

ADR-0104 never supersedes:

- `CTRL-MERGE-HUMAN-001` / Human Owner-only Pull Request merge;
- `CTRL-SDLC-CHAT-HANDOFF-001` / `FOREIGN_PROJECT_HANDOFF`;
- project ownership, Primary Owner or PVC/VC routing;
- direct-main prohibition, branch/PR audit boundaries or current-main/open-writer correlation;
- applicable hosted technical validation;
- provider-enforced authentication/capability restrictions;
- secret protection, truthful evidence, independent assurance or external legal/contractual constraints.

### 4.2 PR creation under an active session

An active project-bound session is standing Human Owner authorization for Pull Request/Draft Pull Request creation required by Human-directed work in the bound project. Immediately before creation the executor MUST refresh `main` and candidate head, correlate overlaps/authority, synchronize when needed, render the canonical PR template and stop on unexpected SHA drift or unresolved ownership/conflict.

This standing authorization never extends to merge execution.

### 4.3 Protected external mutations

During an active session, eligible repository/connected-provider/production mutations may proceed without a new Human approval message only when they are unambiguously owned by the bound project and required by the Human-directed work item. Technical safety prerequisites, target identity, expected effect, current state and rollback/restore/compensating path remain mandatory. Pull Request merge is excluded.

## 5. What the session does not bypass

Even full Human Owner delegation cannot bypass applicable law/regulation/contracts, provider authentication/MFA/passkey/capability limits, execution-surface safety constraints, Human Owner-only merge, reusable-secret protection, project/target verification, required independent assurance or truthful evidence.

## 6. Branch, PR and audit behavior during the session

Default execution remains:

```text
CURRENT MAIN + OPEN-WRITER + PROJECT-OWNER CORRELATION
→ FRESH / APPROPRIATELY SCOPED BRANCH
→ IN-PROJECT IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN/HEAD/PROJECT CORRELATION
→ PR CREATION UNDER ACTIVE ADR-0104 SESSION OR NORMAL OWNER GATE
→ REQUIRED HOSTED CHECKS / REVIEWS
→ MERGE-READINESS REPORT
→ HUMAN OWNER MERGE
→ IN-PROJECT EXTERNAL MUTATIONS WHERE AUTHORIZED
→ POST-MUTATION VERIFICATION / EVIDENCE
```

Direct writes to `main` remain prohibited unless a separate valid Human-directed governance change explicitly changes that invariant.

## 7. Security model

ADR-0104 implements Just-in-Time / Just-Enough delegated execution: explicit Human Owner activation, one chat, one canonical project, PT8H, three finite slots, monotonic slot consumption, bounded standing authorization, Human Owner-only merge, audit evidence and fail-closed expiry/revocation.

The S2 race correction reduces privilege ambiguity: a valid consumed slot cannot be resurrected by a stale version-bootstrap projection.

## 8. Mandatory supersession impact package

| Required field | ADR-0104 v1.3.1 package |
|---|---|
| Stable authority ID | `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01` unchanged |
| Correlated relation anchors | `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` |
| Supersession scope | `conditional-partial`; only repeated PR-create approval and eligible protected-mutation approval surfaces during an `ACTIVE` bound session |
| Explicit exclusions | Human merge, foreign-project handoff, ownership/routing, direct-main prohibition, correlation, validation, authentication, secrets, assurance, truthful evidence |
| Semantic diff | v1.3.0 stale projection `S1/S2/S3=AVAILABLE` → v1.3.1 race-resolved `S1=AVAILABLE, S2=CONSUMED, S3=AVAILABLE` |
| Race evidence | PR #691 created `15:20:24Z` under effective v1.2 S2 authority; PR #689 merged v1.3.0 at `15:22:24Z` |
| Security impact | prevents duplicate S2 delegation and removes global interpretation of bare `supersedes` authority IDs |
| Historical continuity | PR #678 remains the explicit S1 reset history; PR #691 remains S2 consumption/execution evidence |
| Rollback | Human-reviewed governance Revert PR; no direct-main rollback |

## 9. Evidence requirements

Each successful activation must record slot transition, exact chat/session, canonical project/folder, Human Owner activation timestamp, expiry, work/branch/PR references, current-main/candidate correlation where applicable, provider targets where applicable, validation/rollback evidence for high-impact mutations, and final transition to `CONSUMED`.

Historical PR #678 and PR #691 evidence MUST remain traceable separately from current slot availability.

## 10. Revocation and slot lifecycle

A successfully activated slot may be revoked by the Human Owner in its bound chat. Revocation or expiry terminates future delegated actions and transitions the slot to `CONSUMED`. A slot cannot be transferred, repointed, recycled or reset by an agent. Any reset requires a new explicit Human Owner governance amendment effective through Human Merge.

## 11. Supersession and preserved authority

ADR-0104 supersedes only the exact approval surfaces described in section 4 and only during an `ACTIVE` bound session. All other referenced authority semantics remain preserved.

## 12. Definition of Done for this amendment

This v1.3.1 amendment is effective only when all of the following are true:

1. ADR-0104 records the S2/v1.3 race and resolves S2 to `CONSUMED`;
2. supersession metadata is explicitly `conditional-partial` and scoped to named controls/conditions/exclusions;
3. ADR Registry, Authority Registry and Governance Control Catalog project the same S1/S2/S3 semantics and bounded supersession meaning;
4. stale Governance work claims associated with completed/obsolete work are terminalized and non-exclusive;
5. current-main/open-PR/project-owner correlation is completed before PR creation;
6. required governance/documentation checks pass on the exact final PR head;
7. the Human Owner merges the amendment Pull Request.

Until condition 7 is satisfied, the candidate is non-authorizing. The observed S2 consumption evidence remains relevant to fail-closed correlation regardless of candidate lifecycle.
