# ADR-0104 — Timeboxed Human Owner Delegated Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Version:** `1.2.0`  
**Status:** `OWNER-DECIDED / AMENDMENT EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Date:** `2026-09-01`  
**Decision Owner:** CAPITAL-AI Human Owner  
**Delegated executor:** exactly one predeclared ChatGPT conversation/session per activation  
**Duration:** `PT8H` per successful activation  
**Expiry:** automatic; `SESSION_START + PT8H`  
**Project scope:** exactly one predeclared canonical CAPITAL-AI project and canonical `docs/projects/<project>/` folder per activation  
**Activation quota:** maximum `3` successful ADR-0104 activations over the lifetime of this stable authority  
**Mutation scope:** only Human-directed repository/provider mutations attributable to the project bound to the active session  
**Supersession type:** temporary, chat-bound, project-bound, quota-limited, self-expiring Human Owner delegation  

## 1. Human Owner decision

The CAPITAL-AI Human Owner authorizes a bounded delegated-execution mechanism under this ADR. Each activation delegates execution authority to exactly one chat for exactly one canonical project scope and for no more than eight hours.

The Human Owner remains the Human principal and does not transfer personal identity, credentials or legal personhood to the model. Actions performed by the delegated executor are attributable to the Human Owner decision plus the concrete repository/provider audit trail.

An ADR-0104 activation MUST NOT be shared across chats, copied into another conversation, transferred to another agent session or expanded to another project. A new chat or a different project requires a new valid activation and consumes another activation slot.

ADR-0104 permits at most three successful activations for the lifetime of `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`:

- `ADR-0104-S1`
- `ADR-0104-S2`
- `ADR-0104-S3`

No `S4` or later activation is authorized by this ADR. A fourth activation requires a new explicit Human Owner authority change through the normal ADR/governance lifecycle.

A successful activation consumes its ordinal permanently even if it later expires or is revoked early. An invalid or rejected activation attempt that never becomes authorizing does not consume an ordinal.

## 2. Amendment bootstrap, activation and expiry

### 2.1 Amendment bootstrap

This v1.2.0 amendment cannot authorize its own merge. Until the Pull Request introducing v1.2.0 is Human-merged into current `main`, ADR-0104 v1.1.0 remains the effective version of this stable authority.

The amendment Pull Request therefore remains subject to the authority that is valid for the chat performing that work. Where no demonstrably valid ADR-0104 session is bound to that exact chat and project, the normal exact-snapshot Human Owner PR-creation and Human merge boundaries remain controlling.

### 2.2 Preconditions for every new activation

Before a new ADR-0104 activation becomes authorizing, all of the following MUST be true:

1. ADR-0104 v1.2.0 is effective on current `main`;
2. fewer than three successful ADR-0104 activations have already occurred;
3. the Human Owner explicitly activates ADR-0104 in the exact chat that will receive the delegation;
4. that activation unambiguously names exactly one canonical CAPITAL-AI project and exactly one canonical project folder;
5. current `main` confirms that the named project/folder mapping is canonical and resolves its Primary Owner/PVC relationship where applicable;
6. the chat is not attempting to inherit, clone, transfer or reuse another chat's activation;
7. no higher authority or unresolved security/data-integrity/governance conflict prohibits activation.

The activation record MUST resolve at minimum:

```text
SESSION_ID       = ADR-0104-S<1|2|3>
CHAT_BINDING     = this exact conversation/session
PROJECT_ID       = one canonical CAPITAL-AI project
PROJECT_FOLDER   = one canonical docs/projects/<project>/ folder
SESSION_START    = auditable Human Owner activation timestamp
SESSION_END      = SESSION_START + PT8H
```

If any field is missing, ambiguous or inconsistent with current `main`, activation is `DENIED / REQUIRES_CORRELATION` and no delegated authority exists.

### 2.3 Session binding and expiry

The session is bound simultaneously to `CHAT_BINDING` and `PROJECT_FOLDER` for its entire lifetime. Neither binding may be changed in place.

A copied prompt, exported transcript, linked conversation, new chat, new agent session or other continuation surface does not inherit the activation. Moving productive work to another chat requires a new activation ordinal.

If the canonical project identity/folder becomes ambiguous, is reassigned, or can no longer be correlated during the session, protected execution stops fail-closed. The existing activation cannot be repointed to another project.

At `SESSION_END`, every temporary delegated permission and supersession edge for that session expires automatically without a follow-up PR. The session remains historical evidence but is non-authorizing after expiry.

The Human Owner may revoke the session in its bound chat before expiry. Revocation is immediate for future actions and the consumed activation ordinal is not restored.

### 2.4 Legacy v1.1.0 transition

The Human Merge of PR #678 on `2026-09-01T13:48:30Z` created the original v1.1.0 bootstrap session. That successful activation is counted as `ADR-0104-S1` for the lifetime quota.

Because v1.1.0 did not bind S1 to exactly one predeclared canonical project folder, S1 MUST NOT retain repository-wide delegated authority after this v1.2.0 amendment becomes effective. Human Merge of v1.2.0 terminates any remaining unbound v1.1.0 delegated authority immediately. S1 remains consumed, leaving at most `S2` and `S3` for future valid activations.

This transition is fail-closed and does not infer or retroactively guess a project binding for S1.

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

A different project may receive its own ADR-0104 activation only through a separate Human Owner activation in its own exact chat, and only if an unused activation ordinal remains.

## 4. Temporary supersession edges

For the active eight-hour window only, ADR-0104 is the higher Human Owner decision for the bound chat and bound project scope and temporarily replaces the following approval controls to the stated extent.

### 4.1 `CTRL-SDLC-PR-CREATE-001` — repeated exact-snapshot Owner approval

The active project-bound session is standing Human Owner authorization for creation of Pull Requests and Draft Pull Requests required by Human-directed work owned by the bound project.

The executor MUST still immediately before PR creation:

- refresh current `main` and candidate head;
- correlate open writers/path/semantic/authority overlap;
- verify that every productive changed path remains attributable to the bound project;
- synchronize when needed;
- render the current canonical PR template;
- stop on unexpected SHA drift, unresolved overlap, project-ownership ambiguity or higher-authority conflict.

A new Human approval message for each Base/Head pair is not required while the valid session remains active and project-bound.

### 4.2 `CTRL-MERGE-HUMAN-001` — repeated merge decision

The Human Owner delegates merge execution for eligible in-scope Pull Requests to the bound chat during the active window.

The executor may merge only when:

- the exact PR/head is still attributable to the bound project and active session;
- required hosted checks and required reviews/gates are satisfied or validly not applicable under current policy;
- the branch contains current `main` or is otherwise mergeable under repository policy;
- no unresolved security/data-integrity/governance blocker exists;
- session expiry/revocation has not occurred.

This delegation is not self-approval by the model; it is execution under the Human Owner decision embodied by the valid ADR-0104 activation.

### 4.3 Protected external-mutation approvals

For the active session, ADR-0104 is standing Human Owner authorization for connected-provider and production mutations required by Human-directed work owned by the bound project, including where applicable:

- Owner/Admin IAM and capability mutations;
- Supabase/database/schema/data mutations;
- Stripe billing/product/price/entitlement mutations;
- Render/service/environment/deployment mutations;
- GitHub repository/settings/workflow mutations exposed by authorized tools;
- production resource creation/update/deletion;
- DNS/TLS/domain mutations where an authorized execution provider exists;
- security-control/configuration mutations;
- destructive production-data mutations;
- rollback/restore/recovery mutations.

No additional Human approval message is required for each such mutation while the mutation is unambiguously inside the bound project scope.

Authorization does not waive technical safety prerequisites. Before a high-impact mutation the executor MUST validate target identity, expected effect, current state, project ownership, dependency/authority constraints and an appropriate rollback, restore, backup or compensating path. If the requested operation is inherently irreversible, that fact must be evident in the session audit record and the executor must fail closed on ambiguity.

### 4.4 Controls not superseded by ADR-0104 v1.2.0

ADR-0104 v1.2.0 does **not** suspend or weaken:

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
4. protection of reusable secrets and private credentials from model output/evidence;
5. target and project-ownership verification plus fail-closed behavior on unresolved security-critical ambiguity;
6. independent Security/Compliance/QM verification where a higher applicable authority requires independence as an assurance property;
7. truthful evidence: no check, test, deployment or verification may be claimed as PASS unless actually observed.

The delegated executor cannot fabricate Human identity, bypass external authentication, grant itself capabilities that the execution provider does not expose or broaden its project scope through tool availability.

## 6. Branch, PR and audit behavior during the session

The session removes repeated authorization friction inside one project; it does not remove the repository audit trail or project ownership boundaries.

Default execution remains:

```text
CURRENT MAIN + OPEN-WRITER + PROJECT-OWNER CORRELATION
→ FRESH / APPROPRIATELY SCOPED BRANCH
→ IN-PROJECT IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN/HEAD/PROJECT CORRELATION
→ PR CREATION UNDER ACTIVE ADR-0104 SESSION
→ REQUIRED HOSTED CHECKS
→ MERGE UNDER ACTIVE ADR-0104 SESSION
→ IN-PROJECT EXTERNAL MUTATIONS UNDER ACTIVE ADR-0104 SESSION
→ POST-MUTATION VERIFICATION / EVIDENCE
```

Direct writes to `main` remain prohibited unless a separate valid Human-directed governance change explicitly changes that invariant.

One branch/PR may touch multiple physical repository areas only when all productive changes belong to the same bound project and form one coherent work item. A project-bound ADR-0104 session does not authorize a cross-project implementation PR.

## 7. Security model and best-practice alignment

ADR-0104 v1.2.0 implements a Just-in-Time / Just-Enough privileged execution session with explicit scope binding:

- explicit Human Owner activation;
- exactly one chat per activation;
- exactly one canonical project per activation;
- hard `PT8H` time limit;
- maximum three successful activations over the lifetime of the authority;
- standing authorization only for Human-directed work inside the bound project;
- per-work-item current-state, owner and target correlation;
- technical validation and rollback requirements remain risk-proportionate;
- audit trail remains mandatory;
- automatic fail-closed expiry and explicit revocation are supported;
- no in-place transfer of session or project scope.

This design intentionally reduces the blast radius of v1.1.0. It is consistent with the security principles behind bounded session lifetime/session binding in NIST SP 800-63B-4 and minimum-privilege/user-context execution in OWASP LLM06:2025. Those external references are advisory engineering benchmarks and do not create repository authority.

## 8. Mandatory supersession impact package

| Required field | ADR-0104 v1.2.0 package |
|---|---|
| Stable authority IDs | replacement version of `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`; correlated sources `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` |
| Source artifacts | `/AGENTS.md` v2.2.1 owner-directed; Development Chain Execution Policy v2.1.0 active; Human Owner PR Approval Policy v3.0.0 active; current Governance Control Catalog |
| Replacement artifact | `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` v1.2.0 |
| Correlation | repeated PR-create approval, Human-only merge execution and repeated protected-mutation approval remain temporarily replaceable only inside one bound project; foreign-project routing is preserved |
| Authority comparison | source controls are tier-3 governance policy/trust-root controls; ADR-0104 is an explicit Human Owner decision / Accepted ADR tier-2 within its temporary bound scope |
| Semantic diff | v1.1 repository-wide one-chat delegation → v1.2 exactly-one-chat + exactly-one-project activation with lifetime quota `3` and no foreign-project bypass |
| Operational impact | one bound chat may create PRs, merge eligible PRs and execute connected-provider mutations for one project without repeated Owner prompts; different chats/projects need separate activations |
| Security impact | substantially reduced delegated blast radius through chat binding, project binding, lifetime quota, hard expiry, target correlation and fail-closed ownership checks |
| Regulatory impact | no external legal/contractual obligation is superseded; repository authority cannot waive external requirements |
| Evidence impact | activation ordinal, chat binding, project/folder binding, start/end, work item, SHAs, validations, mutations and rollback evidence remain traceable |
| Legacy transition | PR #678 activation counts as S1; any remaining unbound v1.1 authority terminates when v1.2 becomes effective; no project binding is inferred |
| Rollback | revoke session immediately; repository rollback via fresh branch/revert; provider rollback/restore/compensating action according to target capability |
| Owner decision | this ADR records the Human Owner restriction; v1.2.0 effectiveness requires Human Merge of the amendment PR |

## 9. Semantic before/after matrix

| Area | ADR-0104 v1.1.0 | ADR-0104 v1.2.0 active session | After session expiry |
|---|---|---|---|
| Chat scope | one bootstrap chat | exactly one predeclared chat; non-transferable | no delegation |
| Project scope | repository-wide canonical projects | exactly one predeclared canonical project/folder | baseline project routing |
| Cross-project implementation | allowed in same chat | prohibited; normal handoff applies | baseline handoff |
| Activation count | one bootstrap session model | maximum three successful lifetime activations; PR #678 = S1 | consumed ordinal remains consumed |
| PR creation | standing approval across session scope | standing approval only for bound-project work | per-PR approval restored |
| Merge | delegated for in-scope PRs | delegated only for eligible bound-project PRs | Human-only merge restored |
| Provider mutations | broad session scope | only bound-project attributable targets | separate approval restored |
| Human identity | Human Owner remains principal | Human Owner remains principal | unchanged |
| Audit / validation | required | required plus chat/project/quota evidence | required |
| External law/provider auth | controlling | controlling | controlling |

## 10. Operational impact

Positive:

- retains reduced approval ceremony for one focused project session;
- prevents a single privileged chat from roaming across the repository's project ownership model;
- prevents copied/new chats from silently inheriting delegated authority;
- caps the total number of successful ADR-0104 privilege windows at three;
- preserves current-state correlation, hosted checks, audit evidence and rollback discipline;
- authority expires automatically instead of becoming persistent agent privilege.

Trade-offs:

- cross-project roadmaps again require the canonical handoff path between project owners;
- moving work to a different chat or project consumes a new activation when one remains;
- after S3, further use requires an explicit new Human Owner governance decision;
- provider-side controls may still interrupt execution and cannot be superseded by repository policy.

## 11. Regulatory and compliance impact

ADR-0104 changes internal execution authorization and routing only. It does not change applicable law, regulated-entity status, data-protection obligations, financial-services duties, contractual commitments or external approval requirements.

Repository Owner delegation is not evidence of external regulatory approval or certification.

## 12. Evidence and audit

For each successful activation retain where applicable:

- `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`;
- `SESSION_ID` / activation ordinal (`S1`..`S3`);
- evidence binding the activation to the exact chat/session;
- canonical `PROJECT_ID` and `PROJECT_FOLDER` resolved from current `main` at activation;
- session start and computed expiry;
- Human Owner activation instruction/audit reference;
- Human-directed work-item identity;
- current-main SHA and branch/head/PR/merge SHA;
- affected PVC/VC stages where relevant;
- open-writer/project-owner correlation result;
- mutation target and mutation class;
- validation actually executed and observed result;
- pre/post state for external mutations;
- rollback, restore or compensating path;
- provider audit reference where available.

The activation ledger is monotonic: expired or revoked successful sessions remain counted. Reusable secrets, private passkey material and raw credentials must not be copied into session evidence.

## 13. Revocation and rollback

Before activation: an invalid/missing activation record has no authority and consumes no ordinal.

During activation: the Human Owner may revoke the session at any time in its bound chat. Revocation terminates future delegated actions immediately. The executor stops any not-yet-committed high-impact operation where technically possible. The consumed ordinal remains used.

Repository rollback uses the normal current-main branch/revert process. External rollback follows target-specific restore, recovery or compensating capabilities. If no safe rollback exists for a proposed mutation, the executor must surface that fact before executing and fail closed on uncertainty about target/effect.

## 14. Supersedes / preserves

Temporarily supersedes during a valid active window and only for Human-directed work owned by the bound project:

- `AUTH-GOV-AGENT-TRUST-ROOT` only for repeated PR-create approval, repeated Human merge execution and repeated protected-mutation approval boundaries addressed here;
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` only for the repeated approval boundaries addressed here;
- `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` only for repeated per-PR creation and merge approval during the active session.

Explicitly preserves:

- `CTRL-SDLC-CHAT-HANDOFF-001 / FOREIGN_PROJECT_HANDOFF` for any other project/Primary Owner;
- project-local foreign-execution restrictions;
- current-main/open-writer/project-owner correlation;
- branch/PR audit trail as the default repository execution path;
- applicable hosted validation and technical quality gates;
- secret protection;
- least-privilege/task-attribution semantics;
- fail-closed behavior on unresolved ambiguity;
- higher law/regulation/binding contract;
- provider-enforced auth/capability limits;
- independent assurance requirements where independence itself is mandatory;
- truthful post-change verification and evidence.

## 15. Definition of Done

This v1.2.0 amendment is ready for PR creation only when:

1. the existing ADR-0104 stable authority remains uniquely registered and its ADR Registry version is updated to `1.2.0`;
2. the Authority Registry projects the same `1.2.0` identity/scope;
3. the Governance Control Catalog represents single-chat/single-project binding, the three-activation lifetime quota and preserved foreign-project handoff;
4. the known `CTRL-CI-M10-001` catalog regression is not carried forward while this work item touches the Control Catalog;
5. current `main` and open Pull Requests/writers are re-correlated immediately before PR creation;
6. applicable structure/governance validation evidence is available or explicitly deferred to hosted checks according to check class;
7. the then-applicable Human/Owner PR-creation gate is satisfied for the exact final Base/Head snapshot;
8. Human Merge of the amendment PR makes v1.2.0 effective;
9. subsequent S2/S3 activations require a separate explicit Human Owner activation in the exact target chat and exactly one predeclared canonical project folder.
