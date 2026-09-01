# ADR-0104 — Timeboxed Human Owner Delegated Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Version:** `1.1.0`  
**Status:** `OWNER-DECIDED / EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Date:** `2026-09-01`  
**Decision Owner:** CAPITAL-AI Human Owner  
**Delegated executor:** this ChatGPT conversation / GPT-5.6 Sol / available authorized connectors and execution providers  
**Duration:** `PT8H` from the Human Merge timestamp of the Pull Request that introduces this ADR  
**Expiry:** automatic; `merge_timestamp + PT8H`  
**Project scope:** repository-wide across every canonical `docs/projects/<project>/` owner domain resolved from then-current `main`  
**Mutation scope:** repository mutations, PR creation/update, merge, deployment and connected-provider mutations required by Human-directed work during the active session  
**Supersession type:** temporary, scope-limited, self-expiring Human Owner delegation  

## 1. Human Owner decision

The CAPITAL-AI Human Owner authorizes one time-boxed delegated execution session in this chat.

The Human Owner remains the Human principal and does not transfer personal identity, credentials or legal personhood to the model. Instead, the Human Owner delegates execution authority to this chat for the active session window. Actions performed by the delegated executor are attributable to this Human Owner decision plus the concrete repository/provider audit trail.

During the active window, this chat may execute Human-directed work across all canonical project folders and PVC/VC owner domains without stopping for project-to-project handoff contracts, handoff-only Pull Requests, repeated PR-creation approvals, repeated merge approvals or repeated mutation approvals.

This is a temporary authorization delegation, not a permanent change of project ownership or repository architecture.

## 2. Bootstrap, activation and expiry

This candidate cannot authorize its own activation. Before ADR-0104 exists on current `main`, the existing controls remain authoritative.

Therefore the introducing Pull Request still requires:

1. final current-main/open-writer correlation;
2. exact-snapshot Human Owner approval to create the introducing PR;
3. required hosted validation for its check class;
4. one separate Human Merge of the introducing PR.

Activation instant:

```text
SESSION_START = Human Merge timestamp of the introducing PR
SESSION_END   = SESSION_START + PT8H
```

At `SESSION_END`, every temporary delegated permission and supersession edge in this ADR expires automatically without a follow-up PR. The ADR remains historical evidence but is non-authorizing after expiry.

The Human Owner may revoke the session in this chat before expiry. Revocation is immediate for future actions.

## 3. Session scope

The delegated executor may act only on work that is attributable to the Human Owner through at least one of these session inputs:

- a direct Human Owner instruction in this chat during the active window;
- continuation of a work item the Human Owner explicitly directed this chat to execute;
- a canonical repository roadmap/work package that the Human Owner explicitly directs this chat to continue during the session.

The executor may not invent unrelated objectives merely because broad technical permissions exist.

For every new work item, current `main`, open Pull Requests/writers, applicable project identity and relevant higher authority must still be resolved before mutation.

## 4. Temporary supersession edges

For the active eight-hour window only, ADR-0104 is the higher Owner decision for the correlated execution scope and temporarily replaces the following controls to the stated extent.

### 4.1 `CTRL-SDLC-CHAT-HANDOFF-001` — `FOREIGN_PROJECT_HANDOFF`

Temporary replacement:

- crossing canonical project/PVC owner boundaries does not require `REFERRED_NOT_EXECUTED`;
- productive implementation may continue in the same chat across project folders;
- `[CROSS_PROJECT_HANDOFF -> ...]`, target-project prompts and project-to-project Handoff Contracts are optional traceability aids, not gates;
- no Handoff Pull Request is required solely because work crosses project/PVC ownership boundaries.

The normal post-PR status report may still be emitted for transparency but is not an authorization boundary during the session.

### 4.2 `CTRL-SDLC-PR-CREATE-001` — repeated exact-snapshot Owner approval

The session itself is standing Human Owner authorization for creation of Pull Requests and Draft Pull Requests required by in-scope session work.

The executor MUST still immediately before PR creation:

- refresh current `main` and candidate head;
- correlate open writers/path/semantic/authority overlap;
- synchronize when needed;
- render the current canonical PR template;
- stop on unexpected SHA drift, unresolved overlap or a higher-authority conflict.

A new Human approval message for each Base/Head pair is not required while the session is active.

### 4.3 `CTRL-MERGE-HUMAN-001` — repeated merge decision

The Human Owner delegates merge execution for in-scope session Pull Requests to this chat during the active window.

The executor may merge only when:

- the exact PR/head is still within the active session scope;
- required hosted checks and required reviews/gates for that PR are satisfied or are validly not applicable under current policy;
- the branch contains current `main` or is otherwise mergeable under repository policy;
- no unresolved security/data-integrity/governance blocker exists;
- session expiry/revocation has not occurred.

This delegation is not self-approval by the model; it is execution under the Human Owner decision embodied by ADR-0104.

### 4.4 Protected external-mutation approvals

For the active session, ADR-0104 is standing Human Owner authorization for connected-provider and production mutations required by in-scope Human-directed work, including where applicable:

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

No additional Human approval message is required for each such mutation during the active session.

Authorization does not waive technical safety prerequisites. Before a high-impact mutation the executor MUST validate target identity, expected effect, current state, dependency/authority constraints and an appropriate rollback, restore, backup or compensating path. If the requested operation is inherently irreversible, that fact must be evident in the session audit record and the executor must fail closed on ambiguity.

### 4.5 Project-local foreign-execution prohibitions

Lower-tier project README/roadmap statements that prohibit foreign PVC execution are temporarily subordinate to ADR-0104 for execution routing. Domain contracts and technical invariants remain applicable unless specifically changed by an in-scope Human-directed work item through the normal architecture/governance process.

## 5. What the session does not bypass

Even full Human Owner delegation cannot and does not bypass constraints outside the repository authority model. The following remain mandatory:

1. applicable law, regulation, binding contractual obligations and external supervisory constraints;
2. provider-enforced authentication, authorization, MFA/passkey, confirmation or capability limits that the connected service itself requires;
3. tool/system safety constraints and capabilities of the execution surface;
4. protection of reusable secrets and private credentials from model output/evidence;
5. target verification and fail-closed behavior on unresolved security-critical ambiguity;
6. independent Security/Compliance/QM verification where a higher applicable authority requires independence as an assurance property;
7. truthful evidence: no check, test, deployment or verification may be claimed as PASS unless actually observed.

The delegated executor cannot fabricate Human identity, bypass external authentication or grant itself capabilities that the execution provider does not expose.

## 6. Branch, PR and audit behavior during the session

The session removes repeated authorization and handoff friction; it does not remove the repository audit trail.

Default execution remains:

```text
CURRENT MAIN + OPEN-WRITER CORRELATION
→ FRESH / APPROPRIATELY SCOPED BRANCH
→ IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN/HEAD CORRELATION
→ PR CREATION UNDER ADR-0104 STANDING AUTHORIZATION
→ REQUIRED HOSTED CHECKS
→ MERGE UNDER ADR-0104 STANDING AUTHORIZATION
→ EXTERNAL MUTATIONS UNDER ADR-0104 STANDING AUTHORIZATION
→ POST-MUTATION VERIFICATION / EVIDENCE
```

Direct writes to `main` remain prohibited unless a separate in-session Human-directed governance change explicitly and validly changes that invariant. Keeping branch/PR boundaries is the default because they provide auditability, independent checks and rollback history without requiring handoff-only PRs.

Multiple project folders may be touched by one branch/PR when they form one coherent work item. Unrelated work items should remain separately scoped to minimize blast radius and writer collisions.

## 7. Security model

ADR-0104 implements a Just-in-Time / Just-Enough privileged execution session:

- explicit Human Owner bootstrap;
- hard `PT8H` time limit;
- standing authorization only for Human-directed session scope;
- per-work-item current-state and target correlation;
- no repeated approval ceremony inside the active window;
- technical validation and rollback requirements remain risk-proportionate;
- audit trail remains mandatory;
- automatic fail-closed expiry and explicit revocation are supported.

The design favors one bounded privileged session over persistent broad agent authority.

## 8. Mandatory supersession impact package

| Required field | ADR-0104 package |
|---|---|
| Stable authority IDs | replacement `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`; correlated sources `AUTH-GOV-AGENT-TRUST-ROOT`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` |
| Source artifacts | `/AGENTS.md` v2.2.1 owner-directed; Development Chain Execution Policy v2.1.0 active; Human Owner PR Approval Policy v3.0.0 active; Control Catalog v1.8.0 at work-item start |
| Replacement artifact | `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` v1.1.0 |
| Correlation | foreign-project stop/handoff, repeated PR-create approval, Human-only merge execution and repeated protected-mutation approval |
| Authority comparison | source controls are tier-3 governance policy/trust-root controls; ADR-0104 is an explicit Human Owner decision / Accepted ADR tier-2 within the temporary session scope |
| Semantic diff | repeated per-boundary/per-action Owner gates → one Human-bootstrapped PT8H delegated execution session with technical gates retained |
| Operational impact | same chat may implement across projects, create PRs, merge eligible PRs and execute connected-provider mutations without repeated Owner prompts |
| Security impact | broader temporary execution capability; mitigated by hard expiry, task attribution, current-state correlation, provider auth, validation, audit and fail-closed ambiguity handling |
| Regulatory impact | no external legal/contractual obligation is superseded; repository authority cannot waive external requirements |
| Evidence impact | session start/end, work-item, target, SHAs, validations, mutations and rollback evidence remain traceable; historical artifacts remain non-authorizing after expiry |
| Rollback | revoke session immediately; repository rollback via fresh branch/revert; provider rollback/restore/compensating action according to target capability |
| Owner decision | this ADR records the Human Owner decision; effectiveness requires Human Merge of the introducing PR |

## 9. Semantic before/after matrix

| Area | Before | During active ADR-0104 session | After expiry |
|---|---|---|---|
| Cross-project implementation | stop + foreign-project handoff | same chat may execute across all canonical project folders | baseline rule restored |
| Handoff-only PRs | required by routing workflow when applicable | not required | baseline rule restored |
| PR creation | per-PR exact Base/Head Owner approval | standing session approval; correlation still mandatory | per-PR approval restored |
| Merge | separate Human merge decision | delegated executor may merge eligible in-scope PRs | Human-only merge restored |
| Ordinary mutations | applicable per-action/project gates | standing session authorization | baseline restored |
| High-impact/provider mutations | separate explicit Owner approval | standing session authorization with technical safety preconditions | separate approval restored |
| Human identity | Human Owner only | Human remains principal; executor has delegated authority, not Human identity | unchanged |
| Audit / validation | required | required | required |
| External law/provider auth | controlling | controlling | controlling |

## 10. Operational impact

Positive:

- eliminates Handoff Contract / Handoff PR churn between canonical projects for eight hours;
- permits one chat to complete coherent cross-project roadmaps end-to-end;
- eliminates repeated approval prompts for PR creation, merge and provider mutations during the active session;
- preserves current-state correlation, hosted checks, audit evidence and rollback discipline;
- authority expires automatically instead of becoming persistent agent privilege.

Trade-offs:

- a broader temporary blast radius exists while the session is active;
- concurrency and target-correlation checks become more important;
- high-impact actions require stronger pre-mutation verification even though a repeated Owner approval prompt is not required;
- provider-side controls may still interrupt execution and cannot be superseded by repository policy.

## 11. Regulatory and compliance impact

ADR-0104 changes internal execution authorization and routing only. It does not change applicable law, regulated-entity status, data-protection obligations, financial-services duties, contractual commitments or external approval requirements.

Repository Owner delegation is not evidence of external regulatory approval or certification.

## 12. Evidence and audit

For each work item executed under the session, retain where applicable:

- `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`;
- session start and computed expiry;
- Human-directed work-item identity;
- current-main SHA and branch/head/PR/merge SHA;
- affected project folders/PVC/VC stages;
- open-writer correlation result;
- mutation target and mutation class;
- validation actually executed and observed result;
- pre/post state for external mutations;
- rollback, restore or compensating path;
- provider audit reference where available.

Reusable secrets, private passkey material and raw credentials must not be copied into session evidence.

## 13. Revocation and rollback

Before activation: close or do not merge the introducing PR.

During activation: the Human Owner may revoke the session at any time in this chat. Revocation terminates future delegated actions immediately. The executor stops any not-yet-committed high-impact operation where technically possible.

Repository rollback uses the normal current-main branch/revert process. External rollback follows target-specific restore, recovery or compensating capabilities. If no safe rollback exists for a proposed mutation, the executor must surface that fact before executing and fail closed on uncertainty about target/effect.

## 14. Supersedes / preserves

Temporarily supersedes during the active window and only for Human-directed session work:

- `AUTH-GOV-AGENT-TRUST-ROOT` for `CTRL-SDLC-CHAT-HANDOFF-001 / FOREIGN_PROJECT_HANDOFF`, repeated PR-create approval and Human-only execution boundaries addressed here;
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` for foreign-project routing, repeated mutation approval and Human-only merge execution addressed here;
- `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` for repeated per-PR creation and merge approval during the active session;
- lower-tier project-local non-foreign-execution restrictions for execution routing.

Preserves outside the delegated-approval replacement:

- current-main/open-writer correlation;
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

This supersession candidate is ready for its bootstrap PR only when:

1. ADR-0104 is uniquely reserved/registered and its reservation is terminalized;
2. its stable `AUTH-*` identity is registered;
3. temporary supersession scope is represented in the Governance Control Catalog;
4. current `main` and open Pull Requests are re-correlated immediately before PR creation;
5. applicable structure/governance validation evidence is available or explicitly deferred to hosted checks according to check class;
6. the Human Owner gives the one required exact-snapshot approval to create the bootstrap PR;
7. the bootstrap PR is Human-merged after required checks;
8. the session start/end timestamps are thereafter derived from that Human Merge and enforced for all delegated execution.
