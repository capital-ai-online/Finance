# ADR-0104 — Timeboxed Human Owner Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Display ID:** `ADR-0104`  
**Version:** `1.5.0`  
**Status:** `ACCEPTED`  
**Date:** `2026-09-02`  
**Decision owner:** Human Owner  
**Parent trust root:** `/AGENTS.md`  
**Duration per activation:** `PT8H`  
**Slots:** `ADR-0104-S1`, `ADR-0104-S2`, `ADR-0104-S3`  
**Project-set model:** immutable predeclared set of one to three canonical projects  
**Merge boundary:** Human/CODEOWNER-only  
**Publication rule:** this version becomes effective only after Human Merge

## 1. Decision

A Human Owner may activate one AVAILABLE ADR-0104 slot for one exact chat and an immutable, predeclared `AUTHORIZED_PROJECT_SET` of one to three canonical projects for `PT8H`.

An ACTIVE slot replaces repeated approval prompts only for the approval surfaces explicitly named by this ADR. It permits Human-directed implementation work for the currently selected project when that project is a member of the activation's `AUTHORIZED_PROJECT_SET`. It does not transfer project ownership, merge authority, credentials, provider capability or technical safety responsibility.

Project identity and ownership are resolved from the Human-readable repository model:

```text
docs/projects/PROJECT_VALUE_CHAIN.md
→ docs/projects/<project>/ROADMAP.md
→ applicable ADR
→ applicable ESS
```

No separate post-PVC routing or Cross-Project-Handoff policy contract is required for ordinary in-session project selection.

The authorized set is fixed at activation. A project cannot be added, substituted or inferred after activation. Changing the set requires another AVAILABLE slot and a new activation.

## 1.1 Slot ledger

As of 2026-09-02 after the previously recorded PT8H windows have elapsed:

| Slot | State | Note |
|---|---|---|
| `ADR-0104-S1` | `CONSUMED` | historical GOV/GOV+OPS activation window ended no later than `2026-09-02T02:46:32Z` |
| `ADR-0104-S2` | `CONSUMED` | consumed by PR #691 under effective prior authority |
| `ADR-0104-S3` | `AVAILABLE` | unused unless separate later evidence proves otherwise |

Historical activation evidence remains audit material. It does not reactivate an expired session.

## 1.2 Human merge remains separate

`MERGE`, auto-merge and CODEOWNER approval are excluded from this authority. CI, reactions, labels, device evidence, slot activation and a PR-create authorization are not merge authorization.

## 2. Activation contract

### 2.1 Preconditions

Activation succeeds only when all conditions are true:

1. the requested slot is `AVAILABLE`;
2. the Human Owner gives an unambiguous activation instruction;
3. the exact chat can be bound;
4. the set contains one to three unique canonical projects;
5. every project ID, folder, PVC stage and Primary Owner is re-resolved from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`;
6. each selected project has a readable project Roadmap or an explicit Owner decision explaining why work may proceed without one;
7. the initial active project is a member of the set;
8. `SESSION_END = SESSION_START + PT8H`;
9. no conflicting slot evidence exists;
10. current `main` and current ADR version are recorded.

Unresolved identity, project mapping, slot state, time or authority fails closed and does not consume the slot.

### 2.2 Activation record

An activation record contains at least:

```text
AUTHORITY_ID
ADR_VERSION
SLOT_ID
SLOT_PRE_STATE
CHAT_BINDING_HASH
AUTHORIZED_PROJECT_SET
PROJECT_SET_DIGEST
ACTIVE_PROJECT_ID
ACTIVE_PROJECT_FOLDER
ACTIVE_PROJECT_PVC
CURRENT_MAIN_SHA
SESSION_START
SESSION_END
DURATION = PT8H
ACTIVATION_MODE
ACTIVATION_EVIDENCE_REF
```

`AUTHORIZED_PROJECT_SET` is a deterministically sorted list of canonical project records. `PROJECT_SET_DIGEST` binds the exact set and prevents later additions or substitutions.

### 2.3 Expiry and consumption

At `SESSION_END` the slot becomes `CONSUMED` without grace period. Expiry is evaluated immediately before every delegated action. A failed action does not extend the session. A consumed slot cannot be reset except by a later explicit Human-merged authority decision.

## 3. In-session project execution

### 3.1 Project switch

Moving within the same exact chat from one member of `AUTHORIZED_PROJECT_SET` to another is permitted only after a visible project-switch record containing:

- prior and target project IDs/folders;
- target PVC and Primary Owner;
- current-main SHA;
- current ADR version and slot state;
- `PROJECT_SET_DIGEST`;
- affected target project Roadmap item;
- applicable ADR/ESS references where known;
- changed-file, semantic, namespace, open-PR and active-writer correlation;
- switch time and remaining session time.

The switch changes `ACTIVE_PROJECT_ID` and `ACTIVE_PROJECT_FOLDER`; it does not alter the authorized set or duration.

### 3.2 Branch and PR separation

Each branch and Pull Request is owned by exactly one active project/work item. Cross-project changes must not be bundled into one branch or PR. Before starting a target-project branch, the executor must close or pause the prior work item coherently, resolve current `main` again and create a fresh target-project branch.

Normal navigation for each selected project is:

```text
PVC / Primary Owner
→ project Roadmap item
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

### 3.3 Project outside the authorized set

A project outside `AUTHORIZED_PROJECT_SET` is not authorized by the active ADR-0104 session. Work stops for that project until the Human Owner starts a separately valid work context or activation. This rule does not require a repository-wide Cross-Project-Handoff contract or another routing-policy overlay.

## 4. Supersession scope

**Type:** `conditional-partial`

**Activation condition:** exact slot ACTIVE; exact chat bound; immutable project set valid; active project is a set member; current time before `SESSION_END`.

### 4.1 Replaced approval surfaces while ACTIVE

1. Repeated Human prompt before PR/Draft-PR creation for a Human-directed work item of the active project. Final main/branch-head/template/open-writer correlation remains mandatory.
2. Repeated Human prompt for an eligible protected external mutation already owned and authorized by the active project. Technical safety, rollback, provider authentication and exact target verification remain mandatory.
3. A separate chat solely because work switches to another project already included in the immutable authorized set is not required.

### 4.2 Preserved controls

This ADR does not supersede:

- `CTRL-MERGE-HUMAN-001`;
- `POST_PR_HANDOFF`;
- project/PVC/Primary-Owner ownership;
- project Roadmap scope;
- applicable ADR/ESS authority;
- one-work-item/one-branch and per-project PR separation;
- direct-main prohibition;
- current-main, open-PR, active-writer and overlap correlation;
- hosted validation and security gates;
- provider authentication and capability limits;
- secret protection and least privilege;
- independent Security/Compliance assurance;
- truthful evidence;
- law, regulation or contracts.

A bare `supersedes` relation remains a registry anchor only; the effects above are exhaustive.

## 5. PR creation and protected mutations

During an ACTIVE session the executor may create a PR without another per-branch-state prompt only when the exact work/chat/project-set/current-project binding remains valid and final correlation passes. Any `main` or branch-head drift requires recorrelation; it does not require a new Human prompt unless scope, project set or protected-action class changes.

Current Git identity terms are `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. `Candidate Head`, `candidate snapshot`, `candidate SHA` and equivalent lifecycle wording are not used for current work.

Protected external mutations are eligible only when existing authority already permits delegation and the active project owns the target. Destructive, irreversible or security-weakening actions remain subject to their preserved explicit controls. The session cannot manufacture API access or bypass provider gates.

## 6. Security rationale

The bounded set follows least privilege: a session receives only named projects, only for one chat, only for `PT8H` and only through explicit project switches. Set immutability prevents privilege creep during the session. Per-project branches and audit events constrain the blast radius and preserve ownership evidence.

Fail-closed conditions include:

- project not in set;
- duplicate, empty or more-than-three-member set;
- project/folder/PVC/owner mapping drift;
- digest mismatch;
- attempt to add or substitute a project;
- active project not in set;
- expired/consumed slot;
- different chat;
- unresolved current `main` or ADR version;
- missing project-switch record;
- branch or PR spanning multiple project owners;
- merge or auto-merge attempt.

## 7. Device-bound mechanisms

Previously proposed Owner-device cutover/handoff contracts are withdrawn as repository policy surfaces under the current trust root. Remaining implementation files are technical artifacts only and do not create a mandatory device-bound authorization mechanism.

A raw device ID never becomes an authorization factor. Any future device-gated activation requires a separate current architecture/security decision and must preserve the full immutable project-set binding and Human-only merge boundary.

## 8. Audit evidence

For every activation, switch, PR creation and eligible protected mutation, retain:

- authority/version/slot;
- exact chat binding reference;
- immutable project-set digest;
- active project, folder and PVC;
- affected Roadmap item and applicable ADR/ESS where material;
- current main and branch/PR-head SHA where applicable;
- action/target/scope;
- timestamps and remaining duration;
- verifier/correlation result;
- result and failure reason;
- Human merge boundary statement.

Evidence must be truthful, minimally sensitive and non-authorizing by itself.

## 9. Rollback and revocation

The Human Owner may revoke an ACTIVE session at any time. Revocation consumes the slot and blocks further delegated actions.

A rollback of this ADR version requires a fresh governance branch and Human merge. It must not rewrite historical activation evidence.

## 10. Definition of Done

v1.5.0 is effective only after:

- ADR, Trust Root, ADR Registry, Authority Registry and Control Catalog agree;
- current project navigation resolves through Project Value Chain + project Roadmap + applicable ADR/ESS;
- current governance instructions use `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA` instead of Candidate-Head terminology;
- no withdrawn post-PVC routing/device-cutover contract is required for current execution;
- required hosted checks pass;
- Human/CODEOWNER merges the PR.

Until Human Merge of this version, the current-main accepted ADR version remains authoritative.
