# CAPITAL-AI Cross-Project Handoff Contract

**Role:** project-routing contract — non-authorizing  
**Trust root:** `/AGENTS.md`  
**Control:** `CTRL-SDLC-CHAT-HANDOFF-001`

This contract extends the existing chat-handoff control for foreign-project routing. It does not create a second repository trust root, a second Governance Control Plane, a new `AUTH-*` identity, or independent mutation authority.

## Canonical marker and namespace

Repository compatibility marker remains:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

To remove namespace ambiguity, every new project-routing handoff MUST additionally carry:

- `project_namespace: PVC`
- `project_stage: PVC-<NN>`
- `target_project`
- `target_project_folder`
- `primary_owner`
- `task`
- `reason`
- `dependency`
- `required_evidence`
- `verification_gate`
- `status`

The legacy `VC-<NN>` marker is retained for compatibility with the repository coordination contract; `project_stage` is the explicit project namespace identity. The marker MUST NOT be interpreted as a technical `SC-MD-SPT-0001` stage.

Allowed external status: `REFERRED`, `REFERRED_NOT_EXECUTED`, `DEPENDENCY`, `BLOCKED_BY`, `WAITING_FOR_EVIDENCE`.

Foreign work may not be marked `DONE`, `VERIFIED` or `CLOSED` by the referring project.

Where a technical financial stage is also relevant, add `technical_namespace` and `technical_stage` separately; never overload `PVC-*` with technical runtime semantics.

## Foreign-project trigger

`CTRL-SDLC-CHAT-HANDOFF-001` has a `FOREIGN_PROJECT_HANDOFF` trigger in addition to its existing `POST_PR_HANDOFF` trigger.

The default `FOREIGN_PROJECT_HANDOFF` path is mandatory when the next productive work step belongs to another canonical project or Primary Owner. The referring chat MUST NOT silently implement foreign work.

The only exception is an ACTIVE ADR-0104 v1.4.0 session whose immutable `AUTHORIZED_PROJECT_SET` already contains the target project. The exception replaces the STOP/separate-chat requirement only. It does not transfer ownership, expand the set, extend the session, authorize merge, allow a multi-project branch/PR or bypass fresh correlation.

For every target outside that set, and whenever membership, mapping, chat binding, slot state or time is unresolved, the full handoff remains fail-closed. The referring chat MUST:

1. report the project switch visibly;
2. name the target project;
3. name the canonical target project folder;
4. name the affected VC/PVC stage;
5. name the Primary Owner and ownership/authority/scope reason;
6. stop local foreign implementation;
7. emit the general Cross-Project-Handoff marker;
8. immediately generate a complete copyable handoff prompt.

If several Primary Owners are affected outside the authorized set, partition the work by ownership and emit one separate handoff per target project. Foreign changes MUST NOT be bundled into one local collection branch.

## In-session project switch

When the ADR-0104 exception applies, emit this block before target-project implementation:

```text
─────────────────────────────────
IN-SESSION PROJECT SWITCH
─────────────────────────────────
Authority: ADR-0104 v1.4.0 / <SLOT_ID>
Session Chat: EXACT CURRENT CHAT
Authorized Project Set Digest: <PROJECT_SET_DIGEST>
Previous Project: <CURRENT_PROJECT>
Target Project: <TARGET_PROJECT>
Target Project Folder: <TARGET_FOLDER>
Affected VC/PVC: <VC-NN / PVC-NN>
Primary Owner: <TARGET_PROJECT>
Current Main: <CURRENT_MAIN_SHA>
Session End: <SESSION_END>
Set Changed: NO
Duration Extended: NO
Branch / PR: NEW TARGET-PROJECT WORK ITEM
Status: AUTHORIZED_IN_SET / CORRELATION_REQUIRED
─────────────────────────────────
```

Before changing `ACTIVE_PROJECT_ID`, re-resolve current main, ADR version, slot/time, target membership, project/folder/owner mapping, open PRs, active writers and file/semantic/namespace overlap. Any failure produces `CORRELATION_REQUIRED` and no target implementation.

Every target project uses a fresh scoped branch from then-current `main` and its own PR; each project/work item uses its own branch and PR. Switching projects does not allow the preceding project claim, branch or PR to absorb target-project changes.

## Canonical project-folder resolution

A target project folder MUST NOT be guessed when a canonical project surface exists. Resolve in this order:

1. current `/AGENTS.md`;
2. canonical Project Registry / Project Execution Model;
3. `docs/projects/<project>/`;
4. relevant current roadmap;
5. this Cross-Project Handoff Contract and project-specific dependency/handoff records.

If either target owner or target folder remains unresolved, use `REQUIRES_CORRELATION`, stop local foreign implementation and do not manufacture a routing decision.

## Mandatory visible chat block

When `FOREIGN_PROJECT_HANDOFF` is triggered, the chat MUST emit this block before the generated prompt:

```text
─────────────────────────────────
PROJECT HANDOFF REQUIRED
─────────────────────────────────
Current Project: <CURRENT_PROJECT>
Current Project Folder: <CURRENT_FOLDER>
Required Project: <TARGET_PROJECT>
Target Project Folder: <TARGET_FOLDER>
Affected VC/PVC: <VC-NN / PVC-NN>
Primary Owner: <TARGET_PROJECT>
Reason: <Ownership / Authority / Scope>
Local Foreign Implementation: NOT EXECUTED
Status: REFERRED_NOT_EXECUTED
─────────────────────────────────
```

Then emit:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Where an applicable Security contract additionally requires a Security-specific marker, the chat MAY also emit:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

The Security marker is additive only. It never replaces the general Cross-Project-Handoff marker and never creates Domain Ownership, Security self-approval or implementation authority.

## Mandatory generated handoff prompt

Immediately after the visible handoff block and marker, the chat MUST generate a complete copyable prompt that allows the user to continue in the target-project chat without manually reconstructing the source context.

The generated prompt MUST contain, where applicable:

- Repository;
- Target Project;
- Target Project Folder;
- Source Project;
- Source Project Folder;
- Work Item;
- Finding / Requirement;
- affected VC/PVC stage;
- Primary Owner;
- last known `main` SHA as historical baseline only;
- explicit instruction to resolve current `main` again before execution;
- fresh `/AGENTS.md` precheck;
- open-PR correlation;
- active-writer and work-claim correlation;
- changed-file overlap;
- semantic overlap;
- Authority / Control / ADR / ESS / Document Registry correlation;
- concrete affected files, if known;
- Scope Boundaries;
- Reuse Requirements;
- concrete target implementation;
- Tests;
- Negative Tests;
- Validation;
- Exit Gate;
- Return Contract;
- PR Creation Gate;
- Human Merge Boundary.

A historical SHA transported in a handoff is evidence only and MUST NOT be treated as current-state authority. The target chat must re-read current `main` and current `/AGENTS.md` before protected work.

## Prompt-size contract

Generated handoff prompts are split automatically only when necessary.

- Maximum: **400 lines per prompt part**.
- Required content MUST NOT be removed to satisfy the limit.
- If the complete prompt is `<= 400` lines, emit one part only.
- If the complete prompt is `> 400` lines, emit sequential parts and ensure every part is `<= 400` lines.
- Do not pad a part to 400 lines.

Part labels:

- `TEIL 1 VON N`
- `TEIL 2 VON N`
- …

Every part MUST identify that it belongs to the same Cross-Project-Handoff and preserve enough source/target identity to avoid accidental cross-handoff mixing.

## Non-authorizing boundary

A full handoff is a routing and context-transfer artifact only. An ADR-0104 in-session project switch is authorizing only to the extent stated by the ACTIVE slot and never beyond its immutable project set. This boundary retains the canonical wording: It does not authorize:

- foreign project mutation;
- Pull Request or Draft Pull Request creation;
- Human/Owner approval;
- merge;
- deployment;
- production mutation;
- Security verification;
- Accepted Risk;
- Domain Ownership transfer.

The target project independently performs its fresh precheck, current-main correlation, branch governance, validation, PR-creation gate and Human Merge boundary.
