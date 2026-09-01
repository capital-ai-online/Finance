# ADR-0104 — Timeboxed Human Owner Delegated Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Version:** `1.3.0`  
**Status:** `OWNER-DECIDED / AMENDMENT EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Date:** `2026-09-01`  
**Decision Owner:** CAPITAL-AI Human Owner  
**Delegated executor:** exactly one predeclared ChatGPT conversation/session per activation  
**Duration:** `PT8H` per successful activation  
**Expiry:** automatic; `SESSION_START + PT8H`  
**Project scope:** exactly one predeclared canonical CAPITAL-AI project and canonical `docs/projects/<project>/` folder per activation  
**Activation slots:** `ADR-0104-S1`, `ADR-0104-S2`, `ADR-0104-S3`; after Human Merge of v1.3.0 all three slots are `AVAILABLE`  
**Merge boundary:** every Pull Request MUST be merged by the Human Owner; merge execution is never delegated by ADR-0104  
**Mutation scope:** only Human-directed repository/provider mutations attributable to the project bound to the active session, excluding Pull Request merge execution  
**Supersession type:** temporary, chat-bound, project-bound, quota-limited, self-expiring Human Owner delegation with preserved Owner-only merge

## 1. Human Owner decision

The CAPITAL-AI Human Owner authorizes a bounded delegated-execution mechanism under this ADR. Each successful activation delegates execution authority to exactly one chat for exactly one canonical project scope and for no more than eight hours.

The Human Owner remains the Human principal and does not transfer personal identity, credentials or legal personhood to the model. Actions performed by the delegated executor are attributable to the Human Owner decision plus the concrete repository/provider audit trail.

An ADR-0104 activation MUST NOT be shared across chats, copied into another conversation, transferred to another agent session or expanded to another project. A new chat or a different project requires a different `AVAILABLE` slot and a new valid activation.

ADR-0104 exposes exactly three current activation slots:

- `ADR-0104-S1`
- `ADR-0104-S2`
- `ADR-0104-S3`

No `S4` or later slot is authorized by this ADR. Additional slots require a new explicit Human Owner authority change through the normal ADR/governance lifecycle.

### 1.1 Current slot ledger

Human Merge of this v1.3.0 amendment establishes the following current slot state:

| Slot | State after v1.3.0 Human Merge | Basis |
|---|---|---|
| `ADR-0104-S1` | `AVAILABLE` | explicit one-time Human Owner reset in v1.3.0 |
| `ADR-0104-S2` | `AVAILABLE` | never consumed under the current v1.2/v1.3 slot model |
| `ADR-0104-S3` | `AVAILABLE` | never consumed under the current v1.2/v1.3 slot model |

`AVAILABLE` means eligible for a future explicit activation. It does **not** mean active, delegated or bound to any chat/project.

After v1.3.0 becomes effective, a successful activation transitions one slot from `AVAILABLE` to `ACTIVE`; expiry or revocation transitions it to `CONSUMED`. A post-v1.3 successful slot activation remains consumed after expiry/revocation and MUST NOT return to `AVAILABLE` without another explicit Human Owner ADR/governance amendment.

Invalid or rejected activation attempts that never become authorizing do not consume a slot.

### 1.2 Explicit S1 reset and historical continuity

The Human Merge of PR #678 on `2026-09-01T13:48:30Z` created the original v1.1.0 bootstrap delegation historically identified as `ADR-0104-S1`.

That historical event remains immutable audit evidence. It is not deleted, rewritten or treated as though it never occurred.

However, the Human Owner now explicitly decides that the pre-v1.3 legacy activation from PR #678 **does not consume the current v1.3 activation-slot pool**. Upon Human Merge of v1.3.0:

1. the legacy PR #678 activation remains historical and non-authorizing;
2. no legacy v1.1 repository-wide authority is revived;
3. no legacy merge delegation is revived;
4. the current slot `ADR-0104-S1` is reset to `AVAILABLE`;
5. `S2` and `S3` remain `AVAILABLE`;
6. no slot becomes `ACTIVE` merely because this amendment is merged.

This is an explicit one-time quota-state reset by the Human Owner, not an inference from historical evidence and not silent reactivation of an expired authority.

### 1.3 Non-delegable Human Owner merge boundary

Every Pull Request governed by CAPITAL-AI, including every Pull Request created or updated during an active ADR-0104 session, MUST be merged by the Human Owner.

ADR-0104 does not delegate, supersede, proxy or automate the Human Owner merge action. The delegated chat MUST NOT:

- invoke a Pull Request merge operation;
- enable or configure auto-merge for the Pull Request;
- place the Pull Request into any mechanism whose expected effect is an automatic merge without a distinct Human Owner merge action;
- treat green CI, approvals, labels, comments, reactions, elapsed time or an active ADR-0104 session as merge authorization or merge execution authority.

The delegated executor may prepare a Pull Request, correlate it, update it, observe checks, report merge readiness and recommend the next action. The actual merge remains an explicit Human Owner action for every Pull Request without exception under ADR-0104.

## 2. Amendment bootstrap, activation and expiry

### 2.1 Amendment bootstrap

This v1.3.0 amendment cannot authorize its own merge and cannot activate S1 by itself.

Until the Pull Request introducing v1.3.0 is Human-merged into current `main`, ADR-0104 v1.2.0 remains effective and S1 remains consumed under that effective version.

The amendment Pull Request remains subject to the normal Human Owner merge boundary. No ADR-0104 session can merge this amendment on behalf of the Human Owner.

Where no demonstrably valid ADR-0104 session is bound to the exact chat and project performing work, the normal exact-snapshot Human Owner PR-creation gate remains controlling.

### 2.2 Preconditions for every new activation

Before an ADR-0104 slot activation becomes authorizing, all of the following MUST be true:

1. ADR-0104 v1.3.0 is effective on current `main`;
2. the requested slot is `AVAILABLE`;
3. the Human Owner explicitly activates that exact slot in the exact chat that will receive the delegation;
4. the activation unambiguously names exactly one canonical CAPITAL-AI project and exactly one canonical project folder;
5. current `main` confirms that the named project/folder mapping is canonical and resolves its Primary Owner/PVC relationship where applicable;
6. the chat is not attempting to inherit, clone, transfer or reuse another chat's activation;
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

The session is bound simultaneously to `CHAT_BINDING` and `PROJECT_FOLDER` for its entire lifetime. Neither binding may be changed in place.

A copied prompt, exported transcript, linked conversation, new chat, new agent session or other continuation surface does not inherit the activation. Moving productive work to another chat requires another `AVAILABLE` slot.

If the canonical project identity/folder becomes ambiguous, is reassigned, or can no longer be correlated during the session, protected execution stops fail-closed. The existing activation cannot be repointed to another project.

At `SESSION_END`, every temporary delegated permission and supersession edge for that session expires automatically. The slot becomes `CONSUMED`, remains historical evidence and is non-authorizing after expiry.

The Human Owner may revoke the session in its bound chat before expiry. Revocation is immediate for future actions and also transitions the slot to `CONSUMED`.

## 3. Project-bound session scope

The delegated executor may act only on work that is both:

1. attributable to the Human Owner through a direct instruction or explicitly continued roadmap/work package in the bound chat; and
2. owned by the project identified by `PROJECT_ID` / `PROJECT_FOLDER` on then-current `main`.

The canonical project folder is the activation's ownership/routing anchor, not a simplistic filesystem allowlist. Productive runtime, tests, configuration or provider resources may physically live outside `docs/projects/<project>/`; they are in scope only when current repository authority and project mapping assign that work to the bound project.

The executor may not invent unrelated objectives merely because technical permissions exist.

For every new work item, current `main`, open Pull Requests/writers, project ownership, affected PVC/VC stages where relevant and applicable higher authority must still be resolved before mutation.

### 3.1 Foreign-project work is not covered

If the next productive step belongs to another canonical project or Primary Owner, ADR-0104 delegation does not follow it.

The executor MUST:

- stop local foreign implementation;
- apply the normal `FOREIGN_PROJECT_HANDOFF` / `CROSS_PROJECT_HANDOFF_CONTRACT` rules;
- set foreign work to the repository-defined referred state;
- avoid mutating foreign-project-owned runtime, documents or provider resources under the current session.

A different project may receive its own ADR-0104 activation only through a separate Human Owner activation in its own exact chat and only using an `AVAILABLE` slot.

## 4. Temporary supersession edges and preserved controls

For the active eight-hour window only, ADR-0104 is the higher Human Owner decision for the bound chat and bound project scope and temporarily replaces only the approval controls explicitly identified below. The Human Owner merge boundary is explicitly excluded from supersession.

### 4.1 `CTRL-SDLC-PR-CREATE-001` — repeated exact-snapshot Owner approval

The active project-bound session is standing Human Owner authorization for creation of Pull Requests and Draft Pull Requests required by Human-directed work owned by the bound project.

The executor MUST still immediately before PR creation:

- refresh current `main` and candidate head;
- correlate open writers/path/semantic/authority overlap;
- verify that every productive changed path remains attributable to the bound project;
- synchronize when needed;
- render the current canonical PR template;
- stop on unexpected SHA drift, unresolved overlap, project-ownership ambiguity or higher-authority conflict.

A new Human approval message for each Base/Head pair is not required while the valid session remains active and project-bound. This standing PR-creation authorization never extends to merge execution.

### 4.2 `CTRL-MERGE-HUMAN-001` — explicitly preserved and non-delegable

`CTRL-MERGE-HUMAN-001` is not superseded by ADR-0104 v1.3.0.

For every Pull Request:

1. required checks/reviews/gates must reach their applicable state;
2. current `main`, Pull Request head and relevant blockers must be correlated;
3. the delegated executor may report the Pull Request as technically ready when supported by observed evidence;
4. the Human Owner alone performs the merge action.

The delegated executor MUST NOT merge the Pull Request, enable auto-merge, or invoke an equivalent mechanism that causes the Pull Request to merge without a distinct Human Owner merge action.

This rule applies to ordinary in-project PRs, governance PRs, ADR-0104 activation-related PRs, rollback PRs and ADR-0104 amendment PRs.

### 4.3 Protected external-mutation approvals

For an active session, ADR-0104 is standing Human Owner authorization for connected-provider and production mutations required by Human-directed work owned by the bound project, including where applicable:

- Owner/Admin IAM and capability mutations;
- Supabase/database/schema/data mutations;
- Stripe billing/product/price/entitlement mutations;
- Render/service/environment/deployment mutations;
- GitHub repository/settings/workflow mutations exposed by authorized tools, except Pull Request merge execution and equivalent auto-merge behavior;
- production resource creation/update/deletion;
- DNS/TLS/domain mutations where an authorized execution provider exists;
- security-control/configuration mutations;
- destructive production-data mutations;
- rollback/restore/recovery mutations.

No additional Human approval message is required for each such mutation while the mutation is unambiguously inside the bound project scope, unless another applicable authority requires one. Pull Request merge remains excluded and Human Owner-only.

Authorization does not waive technical safety prerequisites. Before a high-impact mutation the executor MUST validate target identity, expected effect, current state, project ownership, dependency/authority constraints and an appropriate rollback, restore, backup or compensating path. If the requested operation is inherently irreversible, that fact must be evident in the session audit record and the executor must fail closed on ambiguity.

### 4.4 Controls not superseded by ADR-0104 v1.3.0

ADR-0104 v1.3.0 does **not** suspend or weaken:

- `CTRL-MERGE-HUMAN-001` and the requirement that every Pull Request is merged by the Human Owner;
- `CTRL-SDLC-CHAT-HANDOFF-001 / FOREIGN_PROJECT_HANDOFF` when another project/Primary Owner is required;
- project-local foreign-execution prohibitions;
- current-main/open-writer correlation;
- branch/PR audit boundaries and the default prohibition on direct writes to `main`;
- applicable hosted technical validation;
- provider authentication/capability restrictions;
- secret protection, independent assurance or truthful evidence requirements.

## 5. What the session does not bypass

Even full Human Owner delegation cannot and does not bypass constraints outside the delegated repository approval boundary. The following remain mandatory:

1. applicable law, regulation, binding contractual obligations and external supervisory constraints;
2. provider-enforced authentication, authorization, MFA/passkey, confirmation or capability limits that the connected service itself requires;
3. tool/system safety constraints and capabilities of the execution surface;
4. Human Owner-only Pull Request merge execution;
5. protection of reusable secrets and private credentials from model output/evidence;
6. target and project-ownership verification plus fail-closed behavior on unresolved security-critical ambiguity;
7. independent Security/Compliance/QM verification where a higher applicable authority requires independence as an assurance property;
8. truthful evidence: no check, test, deployment or verification may be claimed as PASS unless actually observed.

The delegated executor cannot fabricate Human identity, bypass external authentication, grant itself capabilities that the execution provider does not expose, broaden its project scope through tool availability, or convert an active session into merge authority.

## 6. Branch, PR and audit behavior during the session

The session removes repeated authorization friction inside one project; it does not remove the repository audit trail, project ownership boundaries or the Human Owner merge boundary.

Default execution remains:

```text
CURRENT MAIN + OPEN-WRITER + PROJECT-OWNER CORRELATION
→ FRESH / APPROPRIATELY SCOPED BRANCH
→ IN-PROJECT IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN/HEAD/PROJECT CORRELATION
→ PR CREATION UNDER ACTIVE ADR-0104 SESSION
→ REQUIRED HOSTED CHECKS / REVIEWS
→ MERGE-READINESS REPORT
→ HUMAN OWNER MERGE
→ IN-PROJECT EXTERNAL MUTATIONS UNDER ACTIVE ADR-0104 SESSION WHERE STILL VALID/APPLICABLE
→ POST-MUTATION VERIFICATION / EVIDENCE
```

Direct writes to `main` remain prohibited unless a separate valid Human-directed governance change explicitly changes that invariant.

One branch/PR may touch multiple physical repository areas only when all productive changes belong to the same bound project and form one coherent work item. A project-bound ADR-0104 session does not authorize a cross-project implementation PR.

## 7. Security model and best-practice alignment

ADR-0104 v1.3.0 implements a Just-in-Time / Just-Enough privileged execution session with explicit scope binding:

- explicit Human Owner activation;
- exactly one chat per activation;
- exactly one canonical project per activation;
- hard `PT8H` time limit;
- exactly three current activation slots `S1` through `S3`;
- explicit one-time S1 reset to `AVAILABLE` while retaining legacy history;
- successful post-v1.3 slot activations become `CONSUMED` after expiry/revocation;
- standing authorization only for Human-directed work inside the bound project;
- Human Owner-only merge for every Pull Request;
- per-work-item current-state, owner and target correlation;
- technical validation and rollback requirements remain risk-proportionate;
- audit trail remains mandatory;
- automatic fail-closed expiry and explicit revocation are supported;
- no in-place transfer of session or project scope.

The reset changes quota availability only. It does not broaden the scope or duration of any active session and does not reactivate historical authority.

## 8. Mandatory supersession impact package

| Required field | ADR-0104 v1.3.0 package |
|---|---|
| Stable authority IDs | replacement version of `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`; correlated sources `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` |
| Source artifacts | `/AGENTS.md` v2.2.1 owner-directed; Development Chain Execution Policy v2.1.0 active; Human Owner PR Approval Policy v3.0.0 active; current Governance Control Catalog |
| Replacement artifact | `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` v1.3.0 |
| Correlation | repeated PR-create approval and repeated protected-mutation approval remain temporarily replaceable only inside one bound project; Human Owner-only merge and foreign-project routing are preserved |
| Authority comparison | explicit Human Owner decision / Accepted ADR tier-2 within its temporary bound scope; expressly does not supersede Human Owner merge |
| Semantic diff | v1.2 `S1=CONSUMED, S2/S3=AVAILABLE` → v1.3 explicit one-time current-slot reset `S1/S2/S3=AVAILABLE`; legacy PR #678 remains historical/non-authorizing |
| Operational impact | after Human Merge, three slots are available for future explicit chat/project-bound PT8H activations; no slot is automatically activated |
| Security impact | increases remaining activation capacity by one while preserving exact chat/project binding, PT8H, fail-closed correlation, foreign-project stop and non-delegable Human merge |
| Historical continuity | PR #678 remains immutable evidence but no longer consumes the current post-v1.3 slot pool |
| Rollback | Human-reviewed governance Revert PR; no direct-main rollback |

## 9. Evidence requirements

For each future successful activation, evidence MUST record at minimum:

- `SESSION_ID` and slot transition `AVAILABLE -> ACTIVE`;
- exact chat/session binding;
- canonical project ID and project folder;
- Human Owner activation timestamp;
- session expiry timestamp;
- work item and branch/PR references;
- current-main/candidate SHA correlation where applicable;
- project/PVC/VC ownership correlation where applicable;
- provider mutation targets where applicable;
- validation and rollback/restore evidence for high-impact mutations;
- final transition to `CONSUMED` on expiry/revocation.

Historical PR #678 evidence MUST remain traceable separately from current slot availability.

## 10. Revocation and slot lifecycle

A successfully activated post-v1.3 slot may be revoked by the Human Owner at any time in its bound chat. Revocation terminates future delegated actions immediately and transitions that slot to `CONSUMED`.

Expiry has the same slot-consumption effect.

A slot cannot be transferred, repointed, recycled or reset by an agent. Any future reset from `CONSUMED` to `AVAILABLE` requires a new explicit Human Owner governance amendment effective through Human Merge.

## 11. Supersession and preserved authority

ADR-0104 v1.3.0 supersedes only the portions of the correlated repository approval controls explicitly described in this ADR and only during an `ACTIVE` slot session.

It preserves:

- `/AGENTS.md` as sole repository-wide trust root;
- branch-only execution and direct-main prohibition;
- Human Owner-only Pull Request merge;
- foreign-project handoff and project ownership boundaries;
- current-main/open-writer correlation;
- required hosted checks/reviews;
- provider authentication and capability limits;
- secrets protection and independent assurance;
- truthful evidence and fail-closed ambiguity handling;
- external law, regulation and binding contractual obligations.

## 12. Definition of Done for this amendment

This v1.3.0 amendment is effective only when all of the following are true:

1. ADR-0104 is updated to v1.3.0 with the explicit S1 `AVAILABLE` reset and legacy-history preservation;
2. ADR Registry, Authority Registry and Governance Control Catalog project the same slot semantics;
3. no new competing AUTH/CTRL/ADR/ESS identity is created;
4. current-main/open-PR/project-owner correlation is completed before PR creation;
5. required governance/documentation checks pass on the exact final PR head;
6. the Human Owner merges the amendment Pull Request;
7. after Human Merge, the slot ledger is `S1=AVAILABLE`, `S2=AVAILABLE`, `S3=AVAILABLE` and no slot is `ACTIVE` until a separate explicit Human Owner activation occurs.

Until condition 6 is satisfied, v1.2.0 remains effective and S1 remains consumed.
