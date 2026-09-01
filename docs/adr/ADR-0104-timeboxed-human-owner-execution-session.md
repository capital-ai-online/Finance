# ADR-0104 — Timeboxed Human Owner Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Display ID:** `ADR-0104`  
**Version:** `1.4.0`  
**Status:** `ACCEPTED AFTER HUMAN MERGE / CANDIDATE UNTIL MERGE`  
**Date:** `2026-09-01`  
**Decision owner:** Human Owner  
**Parent trust root:** `/AGENTS.md`  
**Duration per activation:** `PT8H`  
**Slots:** `ADR-0104-S1`, `ADR-0104-S2`, `ADR-0104-S3`  
**Project-set model:** immutable predeclared set of one to three canonical projects  
**Merge boundary:** Human/CODEOWNER-only

## 1. Decision

A Human Owner may activate one AVAILABLE ADR-0104 slot for one exact chat and an immutable, predeclared `AUTHORIZED_PROJECT_SET` of one to three canonical projects for `PT8H`.

An ACTIVE slot replaces repeated approval prompts only for the approval surfaces explicitly named by this ADR. It permits Human-directed implementation work for the currently selected project when that project is a member of the activation's `AUTHORIZED_PROJECT_SET`. It does not transfer project ownership, merge authority, credentials, provider capability or technical safety responsibility.

The set is fixed at activation. A project cannot be added, substituted or inferred after activation. Changing the authorized set requires another AVAILABLE slot and a new activation. A project outside the set continues to require the normal `FOREIGN_PROJECT_HANDOFF` path.

## 1.1 Slot ledger

The canonical repository ledger after Human Merge of v1.3.1 is:

| Slot | Repository baseline | State |
|---|---|---|
| `ADR-0104-S1` | `main@c9697f433db7f91daffd9aa5b0fdf938f616ecc4` | `AVAILABLE` before its later text activation in this exact chat |
| `ADR-0104-S2` | consumed by PR #691 under effective v1.2 authority | `CONSUMED` |
| `ADR-0104-S3` | unused | `AVAILABLE` |

Slot state can additionally exist as chat-bound activation evidence without rewriting `main`. Conflicts are resolved fail-closed from exact timestamps and Human-merged authority versions.

## 1.2 Current S1 transition rule

The Human Owner textually activated `ADR-0104-S1` in this exact chat for:

- `CAPITAL-AI-GOV`;
- `docs/projects/governance/`;
- `PVC-05`;
- `SESSION_START = 2026-09-01T18:46:32Z`;
- `SESSION_END = 2026-09-02T02:46:32Z`;
- `DURATION = PT8H`;
- no device binding.

If and only if v1.4.0 is Human-merged before `SESSION_END`, the still-ACTIVE S1 authorization set is atomically expanded for the remaining original duration to exactly:

| Project ID | Canonical folder | Project stage / Primary Owner |
|---|---|---|
| `CAPITAL-AI-GOV` | `docs/projects/governance/` | `PVC-05 / CAPITAL-AI-GOV` |
| `CAPITAL-AI-OPS` | `docs/projects/operations/` | `PVC-02 / CAPITAL-AI-OPS` |

This transition:

- does not change `SESSION_START` or `SESSION_END`;
- does not reactivate an expired or consumed slot;
- does not create device binding;
- does not authorize any third project;
- does not make unmerged candidate text effective;
- does not authorize merge or auto-merge.

If Human Merge occurs at or after `SESSION_END`, the current S1 expansion is non-authorizing and S1 remains expired/consumed. Future AVAILABLE slots may still use the v1.4.0 project-set model.

## 1.3 S2 race record

PR #691 was created at `2026-09-01T15:20:24Z` under a valid S2/v1.2 activation. PR #689 merged v1.3.0 at `2026-09-01T15:22:24Z` and reset only S1. S2 therefore remains `CONSUMED`. v1.4.0 does not reset any slot.

## 1.4 Human merge remains separate

`MERGE`, auto-merge and CODEOWNER approval are excluded from this supersession. CI, reactions, labels, device evidence, slot activation and a PR-create authorization are not merge authorization.

## 2. Activation contract

### 2.1 Preconditions

Activation succeeds only when all conditions are true:

1. the requested slot is `AVAILABLE`;
2. the Human Owner gives an unambiguous activation instruction;
3. the exact chat can be bound;
4. the set contains one to three unique canonical projects;
5. every project ID, folder, stage and Primary Owner is re-resolved from current authority;
6. the initial active project is a member of the set;
7. `SESSION_END = SESSION_START + PT8H`;
8. no conflicting slot evidence exists;
9. current `main` and current ADR version are recorded.

Unresolved identity, project mapping, slot state, time or authority fails closed and does not consume the slot.

### 2.2 Activation record

An activation record contains at least:

`AUTHORITY_ID
ADR_VERSION
SLOT_ID
SLOT_PRE_STATE
CHAT_BINDING_HASH
AUTHORIZED_PROJECT_SET
PROJECT_SET_DIGEST
ACTIVE_PROJECT_ID
ACTIVE_PROJECT_FOLDER
CURRENT_MAIN_SHA
SESSION_START
SESSION_END
DURATION = PT8H
ACTIVATION_MODE
ACTIVATION_EVIDENCE_REF
`

`AUTHORIZED_PROJECT_SET` is a deterministically sorted list of canonical project records. `PROJECT_SET_DIGEST` binds the exact set and prevents later additions or substitutions.

### 2.3 Expiry and consumption

At `SESSION_END` the slot becomes `CONSUMED` without grace period. Expiry is evaluated immediately before every delegated action. A failed action does not extend the session. A consumed slot cannot be reset except by a later explicit Human-merged authority decision.

## 3. Cross-project execution

### 3.1 In-set project switch

Moving within the same exact chat from one member of `AUTHORIZED_PROJECT_SET` to another is permitted only after a visible `IN_SESSION_PROJECT_SWITCH` event that records:

- prior and target project IDs/folders;
- current-main SHA;
- current ADR version and slot state;
- `PROJECT_SET_DIGEST`;
- canonical target mapping and Primary Owner;
- changed-file, semantic, namespace, open-PR and active-writer correlation;
- switch time and remaining session time.

The switch changes `ACTIVE_PROJECT_ID` and `ACTIVE_PROJECT_FOLDER`; it does not alter the authorized set or duration.

### 3.2 Branch and PR separation

Each branch and Pull Request is owned by exactly one active project/work item. Cross-project changes must not be bundled into one branch or PR. Before starting a target-project branch, the executor must close or pause the prior work item coherently, resolve current `main` again and create a fresh target-project branch.

### 3.3 Conditional supersession of foreign-project routing

For a target inside the active immutable set, ADR-0104 conditionally replaces only these parts of `FOREIGN_PROJECT_HANDOFF`:

- mandatory STOP of local execution solely because the target belongs to another listed project;
- requirement for a separate exact chat and a separate slot solely for that listed project.

The visible project switch, current owner/folder correlation, per-project branch/PR separation, project-scoped validation, audit and return contract remain required.

For a target outside the set, for an unresolved mapping, or after expiry, `FOREIGN_PROJECT_HANDOFF` remains fully controlling with `REFERRED_NOT_EXECUTED` and a copyable target-project prompt.

## 4. Supersession scope

**Type:** `conditional-partial`

**Activation condition:** exact slot ACTIVE; exact chat bound; immutable project set valid; active project is a set member; current time before `SESSION_END`.

### 4.1 Replaced approval surfaces while ACTIVE

1. Repeated exact-snapshot Human prompt before PR/Draft-PR creation for a Human-directed work item of the active project. Final main/head/template/open-writer correlation remains mandatory.
2. Repeated Human prompt for an eligible protected external mutation already owned and authorized by the active project. Technical safety, rollback, provider authentication and exact target verification remain mandatory.
3. The STOP/separate-chat portion of `FOREIGN_PROJECT_HANDOFF` only for a verified switch to another member of the immutable set.

### 4.2 Preserved controls

This ADR does not supersede:

- `CTRL-MERGE-HUMAN-001`;
- `POST_PR_HANDOFF`;
- `FOREIGN_PROJECT_HANDOFF` for any project outside `AUTHORIZED_PROJECT_SET`;
- project/PVC/Primary-Owner ownership;
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

During an ACTIVE session the executor may create a PR without another per-snapshot prompt only when the exact work/chat/project-set/current-project binding remains valid and final correlation passes. Any `main` or head drift requires recorrelation; it does not require a new Human prompt unless the scope or set changes.

Protected external mutations are eligible only when existing authority already permits delegation and the active project owns the target. Destructive, irreversible or security-weakening actions remain subject to their preserved explicit controls. The session cannot manufacture API access or bypass provider gates.

## 6. Security rationale

The bounded set follows least privilege: a session receives only named projects, only for one chat, only for `PT8H` and only through explicit project switches. Set immutability prevents privilege creep during the session. Per-project branches and audit events constrain the blast radius and preserve ownership evidence.

Fail-closed conditions include:

- project not in set;
- duplicate, empty or more-than-three-member set;
- project/folder/owner mapping drift;
- digest mismatch;
- attempt to add or substitute a project;
- active project not in set;
- expired/consumed slot;
- different chat;
- unresolved current `main` or ADR version;
- missing project-switch event;
- branch or PR spanning multiple project owners;
- merge or auto-merge attempt.

## 7. Device-bound transition

The contract in `docs/projects/governance/OWNER_DEVICE_AUTHORIZATION_HANDOFF.md` remains `PROPOSED / NON-AUTHORIZING` until its M10-independent runtime, Security verification and Human-merged cutover exist.

Text activation remains effective under the current ADR until that later cutover. A raw device ID never becomes an authorization factor. A future device-gated activation must bind the complete immutable project set and `PROJECT_SET_DIGEST`, not merely one project or a caller-provided identifier.

## 8. Audit evidence

For every activation, switch, PR creation and eligible protected mutation, retain:

- authority/version/slot;
- exact chat binding reference;
- immutable project-set digest;
- active project and folder;
- current main and candidate head where applicable;
- action/target/scope;
- timestamps and remaining duration;
- verifier/correlation result;
- result and failure reason;
- Human merge boundary statement.

Evidence must be truthful, minimally sensitive and non-authorizing by itself.

## 9. Rollback and revocation

The Human Owner may revoke an ACTIVE session at any time. Revocation consumes the slot and blocks further delegated actions.

A rollback of v1.4.0 requires a fresh governance branch and Human merge. It must not rewrite historical activation evidence. Removing the in-set exception restores full `FOREIGN_PROJECT_HANDOFF` for subsequent actions; it cannot retroactively invalidate already completed actions.

## 10. Definition of Done

v1.4.0 is effective only after:

- ADR, Trust Root, ADR Registry, Authority Registry and Control Catalog agree;
- Cross-Project Handoff Contract defines the in-set switch;
- device-transition contract binds the project set;
- validators and tests enforce the set limit, immutability, S2 consumption and preserved merge/out-of-set boundaries;
- the exact candidate is correlated with current `main`;
- required hosted checks pass;
- Human/CODEOWNER merges the PR.

Until Human Merge, v1.3.1 remains authoritative.
