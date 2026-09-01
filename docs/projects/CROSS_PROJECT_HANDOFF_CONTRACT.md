# CAPITAL-AI Cross-Project Handoff Contract

**Role:** project-routing contract — non-authorizing  
**Trust root:** `/AGENTS.md`  
**Control:** `CTRL-SDLC-CHAT-HANDOFF-001`  
**JIT execution exception:** `CTRL-GOV-JIT-GLOBAL-ROADMAP-001`

This contract extends the existing chat-handoff control for foreign-project routing. It does not create a second repository trust root, a second Governance Control Plane, a new independent mutation authority or a Domain Ownership transfer.

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

`FOREIGN_PROJECT_HANDOFF` is the default when analysis, planning, implementation or validation determines that the next required productive work step belongs to another canonical project or another Primary Owner.

The default referring chat MUST NOT silently implement the foreign work. It MUST:

1. report the project switch visibly;
2. name the target project;
3. name the canonical target project folder;
4. name the affected VC/PVC stage;
5. name the Primary Owner and ownership/authority/scope reason;
6. stop local foreign implementation;
7. emit the general Cross-Project-Handoff marker;
8. immediately generate a complete copyable handoff prompt.

If several Primary Owners are affected, partition the work by ownership and emit one separate handoff per target project. Foreign changes MUST NOT be bundled into one local collection branch.

## Owner-activated global-roadmap execution exception

The only exception to the default `FOREIGN_PROJECT_HANDOFF` stop is an **active and exact-scope** `GOV_GLOBAL_ROADMAP_SESSION` governed by `CTRL-GOV-JIT-GLOBAL-ROADMAP-001` and `AUTH-GOV-JIT-GLOBAL-ROADMAP-EXECUTION`.

The session must have been explicitly activated by the Human Owner from a complete manifest conforming to:

`docs/governance/control-plane/global-roadmap-execution-session.schema.json`

The target project, target folder, PVC, work item and allowed path prefix must all be present in the active manifest. Expired, revoked, invalidated, ambiguous or out-of-scope sessions do not satisfy this exception.

For an authorized switch, emit:

```text
─────────────────────────────────
GLOBAL ROADMAP CONTEXT SWITCH
─────────────────────────────────
Session: <SESSION_ID>
Roadmap: <ROADMAP_PATH>
Target Project: <TARGET_PROJECT>
Target Project Folder: <TARGET_FOLDER>
Affected PVC: <PVC-NN>
Primary Owner: <TARGET_PROJECT>
Work Item: <WORK_ITEM>
Session Scope: IN_SCOPE
Primary Ownership Transfer: NO
PR Snapshot Approval: STILL REQUIRED
Human Merge: STILL REQUIRED
Protected External Mutation: SEPARATELY GATED
─────────────────────────────────
```

Then emit:

`[GLOBAL_ROADMAP_CONTEXT_SWITCH -> <TARGET_PROJECT> | PVC-<NN>]`

Before productive target work the executor MUST still freshly correlate current `main`, `/AGENTS.md`, target project sources, open PRs, active/exclusive claims, changed-file/semantic overlap and applicable Authority/Control state.

A global-roadmap context switch is **not** a handoff and therefore does not use `REFERRED_NOT_EXECUTED` for the in-scope target work. It is also not an ownership transfer. Every work item still uses a separate target-project branch/claim/PR boundary; productive changes owned by multiple Primary Owners MUST NOT be combined into one branch or PR.

If any target element falls outside the exact manifest, immediately fall back to the normal `FOREIGN_PROJECT_HANDOFF` path below.

## Canonical project-folder resolution

A target project folder MUST NOT be guessed when a canonical project surface exists. Resolve in this order:

1. current `/AGENTS.md`;
2. canonical Project Registry / Project Execution Model;
3. `docs/projects/<project>/`;
4. relevant current roadmap;
5. this Cross-Project Handoff Contract and project-specific dependency/handoff records.

If either target owner or target folder remains unresolved, use `REQUIRES_CORRELATION`, stop local foreign implementation and do not manufacture a routing decision. An active global-roadmap session does not override this fail-closed requirement.

## Mandatory visible chat block

When `FOREIGN_PROJECT_HANDOFF` is triggered outside an active exact-scope global-roadmap session, the chat MUST emit this block before the generated prompt:

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

A handoff is a routing and context-transfer artifact only. It does not authorize:

- foreign project mutation;
- Pull Request or Draft Pull Request creation;
- Human/Owner approval;
- merge;
- deployment;
- production mutation;
- Security verification;
- Accepted Risk;
- Domain Ownership transfer.

Likewise, a `GOV_GLOBAL_ROADMAP_SESSION` authorizes only the exact temporary repository execution scope approved by the Human Owner. It does not authorize PR creation without exact-snapshot approval, merge, protected external mutation, Security verification, Accepted Risk, legal/compliance self-classification or Domain Ownership transfer.

The normal target project independently performs its fresh precheck, current-main correlation, branch governance, validation, PR-creation gate and Human Merge boundary; an active global-roadmap session performs those same target-project steps inside the session chat instead of transferring execution to another chat.
