# DEVELOPMENT Chain Execution Policy

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Status:** ACTIVE  
**Version:** `2.8.0`  
**Date:** 2026-08-12  
**Updated:** 2026-09-10  
**Scope:** CAPITAL-AI `capital-ai-online/Finance`  
**Parent trust root:** `/AGENTS.md`  
**Decision references:** Accepted ADR-0069 incl. Owner addendum 2026-08-16, effective Roadmap/ESS/ADR authorities, Accepted ADR-0096 / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`

## Purpose and boundary

This policy defines the execution sequence that separates repository implementation, Human PR-create approval, Human Merge, external platform mutation and verification. It is subordinate to `/AGENTS.md` and the stable Governance Control Plane and does not independently grant protected mutation authority.

The Human-readable development model is intentionally simple:

```text
PROJECT VALUE CHAIN / PVC
→ PROJECT ROADMAP
→ APPLICABLE ADR
→ APPLICABLE ESS
→ CODE / TESTS / EVIDENCE
```

The Project Value Chain answers **who owns the work**. The project Roadmap answers **what is next and what is done**. ADRs record architecture decisions. ESS records component/capability contracts. Code, tests and evidence prove implementation. Machine-readable registries, stable IDs and validation metadata support these layers but MUST NOT become a parallel day-to-day planning hierarchy.

A concrete external mutation requires the applicable effective Roadmap/ADR/ESS/REM/Owner approval chain.

## Current transition state

Current state after Human Merge of PR #691:

- former checkbox/Files-Viewed/emoji authorization rituals are retired;
- the former M10 Passkey `AUTHORIZE_PR_CI` productive runtime is **RETIRED / OFF**;
- normal PR technical CI proceeds without and does not expect an M10 implementation;
- repository/web-application current-state scans do not search for M10 runtime/router/UI/workflow components or classify their absence as a gap;
- explicit Human/Owner PR-create approval remains mandatory after final main synchronization/correlation unless a current effective explicitly scoped delegation conditionally replaces only that approval surface;
- the separate copyable Owner-response requirement introduced by PR #772 remains **RETIRED** and is not reconstructed;
- PR-create approval is represented by a bounded Approval Envelope and the canonical PR-CREATION APPROVAL block is the single Human response surface; no additional `Freigabe-Antwort` line is emitted for that gate after this version becomes effective through Human Merge;
- approval-base and current Git SHAs remain mandatory evidence, while synchronization-only SHA drift may preserve approval only after material-equivalence proof and successful re-correlation;
- Human Merge remains a separate mandatory decision and requires final PR-head/current-main correlation before the Human decision;
- bounded Security remediation remains governed by `CTRL-SEC-BOUNDED-REMEDIATION-001`; Approval Envelope semantics do not alter that delegation or its ownership/protected-mutation boundaries;
- Render native Auto Deploy remains off;
- verified `main` CI remains the production deployment authority.

Historical M10 `VERIFIED PASS` evidence remains audit/history material only. It does not create a current implementation target or reactivation backlog. Any future passkey/PR-CI authorization mechanism is a new separately scoped Human/Owner architecture/security/governance decision.

## Canonical chain

```text
READ CURRENT MAIN + OPEN PRS
→ RESOLVE PVC / PRIMARY OWNER
→ READ PROJECT ROADMAP
→ READ APPLICABLE ADR / ESS
→ SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ CHEAP / SANDBOX PRE-PR VALIDATION WHERE ACTUALLY AVAILABLE
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ BUILD BOUNDED APPROVAL ENVELOPE + EFFECTIVE-CHANGE IDENTITY
→ HUMAN/OWNER PR-CREATION APPROVAL OR VALID SCOPED DELEGATION
→ IMMEDIATE PRE-CREATE RE-CORRELATION + ENVELOPE EVALUATION
→ PR CREATED ONLY FOR APPROVAL_STILL_VALID
→ POST-PR CHAT HANDOFF (MAXIMUM TWO ROADMAP / WORKAROUND STEPS)
→ GOVERNANCE CHECKS / TECHNICAL CI
→ FINAL PR-HEAD / CURRENT-MAIN CORRELATION
→ HUMAN MERGE DECISION
→ HUMAN MERGE OR OTHER TERMINAL PR EVENT
→ OPTIONAL COORDINATION-RECORD CLEANUP
→ READ-ONLY PRE-MUTATION CHECK (if external mutation is required)
→ EXPLICIT OWNER MUTATION APPROVAL OR VALID SCOPED DELEGATION WHERE APPLICABLE
→ AUTHORIZED EXECUTION HOST / MUTATION EXECUTOR
→ POST-MUTATION VERIFICATION
→ EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT ROADMAP ITEM
```

A step marked REQUIRED for the concrete work package cannot be skipped unless an effective higher/scoped authority explicitly replaces that exact approval surface. Such replacement never implies merge authority.

## Core execution controls

1. **Value chain and Roadmap first.** Resolve the affected PVC/Primary Owner and current project Roadmap before implementation. Do not create a second planning hierarchy.
2. **ADR/ESS when applicable.** Architecture decisions are expressed through ADR; component/capability contracts through ESS. Not every code change requires a new ADR or ESS.
3. **Roadmap/authority before mutation.** No external platform mutation without scope, authority and rollback classification.
4. **Fresh branch.** Repository edits occur only on a fresh scoped branch from current `main`; direct edits to `main` are prohibited.
5. **One work item / one branch.** A merged branch is not reused; rollback uses a fresh branch from then-current `main`.
6. **Final main synchronization.** Immediately before PR-creation approval/delegation correlation, refresh `main`, correlate new merges/open writers, synchronize and revalidate the branch state.
7. **Concurrent writer control.** Open PR changed-file, semantic, namespace and authority overlap is inspected before new writes and again immediately before PR-create authority is exercised; overlap is sequenced/rescoped rather than silently merged.
8. **Bounded Approval Envelope.** Each PR or Draft PR binds project/folder/PVC/Owner, branch, Roadmap item or explicit Owner scope, approved scope, materially relevant changed-file set, deterministic effective-change identity, intended title, approval evidence and approval-base main/head SHAs.
9. **Single embedded Owner response.** The canonical syntax-highlightable PR-CREATION APPROVAL block contains the sole `Owner-Freigabe` response line for this gate and embeds Roadmap priority/progress/assessment plus at most two Roadmap/workaround continuation items. No duplicate response block is emitted once this version is effective.
10. **Immediate pre-create evaluation.** Re-read current main/head/merge-base, recompute effective-change identity and changed files, re-correlate open writers plus semantic/namespace/authority/security overlap, and refresh stale validation. Evaluate exactly as `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` or `BLOCKED`.
11. **SHA drift is evidence, not sole semantics.** A main/head SHA change always triggers re-correlation. Synchronization-only movement may preserve approval only when the bounded approved payload remains materially equivalent and current correlation is `PASS`; material scope/payload/title/owner/project drift requires renewed approval.
12. **Fail closed.** Missing, stale, conflicting or non-resolvable authority, equivalence or PR-creation authorization causes STOP before the external mutation. `NOT RUN` is never PASS.
13. **No self-bootstrap.** A PR introducing Approval Envelope semantics obeys the PR-create rules effective on then-current `main`; candidate branch semantics cannot authorize their own PR creation.
14. **PR-only main integration.** Every merge into `main` originates from a Pull Request targeting `main`; direct main edits and merge paths that bypass the PR boundary are prohibited.
15. **Final pre-merge correlation.** Immediately before the Human merge decision, re-read then-current `main` SHA and PR-head SHA and correlate the PR against current main. If either changed since the last valid pre-merge correlation, repeat correlation before merge readiness may be asserted.
16. **Human Merge.** PR-creation authority is not merge authority. Agents do not self-merge, enable auto-merge or treat technical evidence as merge authorization.
17. **Authority is not transport.** ChatGPT, Claude, Grok, MCP, SDK, GitHub Actions and provider identity do not create authority.
18. **Evidence is not authority.** Test/build logs, PR bodies, labels, reactions, fingerprints and reports cannot grant PR-creation, merge or protected-mutation permission.
19. **No secrets in evidence.** Reusable credentials, private passkey material, raw sensitive tokens and equivalent secrets are excluded.
20. **Protected external mutation is separate.** Repository merge does not imply Supabase/Stripe/Render/DNS/IAM/billing mutation permission.
21. **No self-elevation.** Agents/executors cannot expand their own mandate, capabilities or Owner gates.
22. **Copyable end-of-pass handoff.** At the end of every chat-governed repository execution pass, the same chat emits at most the two highest-priority immediately actionable Roadmap steps. If the Roadmap supplies no executable item, use the two highest-priority evidence-backed workaround/remediation items. Generic merge, approval, hosted-CI or test boilerplate remains gate/evidence status.
23. **Consolidated PR-create handoff.** When the current gate is PR creation, the fenced `yaml` PR-CREATION APPROVAL block embeds the next-two queue and sole `Owner-Freigabe` response line; no duplicate NÄCHSTE-SCHRITTE block or second response block is emitted after this version becomes effective.
24. **Bounded post-PR chat handoff.** After each PR or Draft PR created through chat, the same chat reports branch/PR-head, main baseline and gates and displays at most the two highest-priority Roadmap/workaround steps.
25. **Bounded ADR-0104 project-set switching.** An ACTIVE ADR-0104 session may switch only within its valid bounded project set and still uses one project-scoped branch/PR per work item; Human merge remains separate.
26. **Bounded Security remediation delegation.** `CAPITAL-AI-SEC` may implement a repository change under `CTRL-SEC-BOUNDED-REMEDIATION-001` when the primary and immediate purpose is to eliminate, prevent or technically harden a confirmed Security finding and the change does not introduce product functionality, business semantics, productive PVC ownership, foreign domain authority, protected external mutation or a parallel control plane. File location alone never decides eligibility.

## Delegated Security Implementation Authority (`CTRL-SEC-BOUNDED-REMEDIATION-001`)

### Eligibility

`CAPITAL-AI-SEC` MAY implement a bounded Security remediation itself when **all** of the following are true:

1. the change directly remediates, prevents or technically hardens a confirmed Security finding, vulnerability or equivalent evidence-bound Security defect;
2. Security is the primary and immediate purpose; feature development is not the primary purpose;
3. no new business rule, product behavior, productive PVC ownership or foreign domain authority is introduced;
4. existing target-domain contracts, accepted ADR/ESS decisions and Primary Owner boundaries remain intact;
5. the change is the smallest sufficient Security remediation slice and avoids unrelated refactoring;
6. existing reusable Security components/contracts are extended before duplicate Security architecture is introduced;
7. current-main, open-PR/writer, changed-file, semantic, namespace and authority correlation is conflict-free or explicitly sequenced;
8. no protected external Production/IAM/Billing/Secret/DNS/data-deletion or equivalent mutation is required by the repository change itself.

The physical repository path is **not** an ownership or authorization boundary by itself. A vulnerable implementation may be fixed where it actually lives. Eligible locations include, without being limited to:

- `src/platform/Security/**`;
- Security validators and Security test harnesses;
- `server/**` when the vulnerable implementation is there;
- `scripts/security/**` and `scripts/automation/**`;
- `.github/workflows/**` for workflow-security hardening;
- `package.json` and lockfiles for vulnerability remediation;
- Docker/runtime Security configuration;
- Security-relevant tests and evidence instrumentation.

Eligible remediation classes include input validation/sanitization, AuthN/AuthZ hardening within already accepted IAM/policy contracts, secret-leak prevention, Security headers/CSP guardrails/safe defaults, vulnerable dependency and supply-chain remediation, semantically safe library upgrades, fail-closed guards, rate/size/resource limits against abuse or DoS, upload/parser/mail/URL/redirect/SSRF hardening, Security-negative tests, Security audit/evidence instrumentation, workflow hardening, SBOM/provenance/artifact verification controls and removal of clearly unsafe or no-longer-required Security-relevant components.

### Ownership and minimal-change invariant

Execution authority is not ownership transfer. A file changed by `CAPITAL-AI-SEC` retains its canonical long-term Domain/PVC/Primary Owner. For an eligible pure Security remediation, the execution work item uses the `CAPITAL-AI-SEC` project identity and a fresh `security`-slug branch/PR even when the changed file is physically located in another project/domain path. The affected Primary Owner/PVC and applicable domain contracts remain recorded in correlation/evidence.

If a fix requires business semantics, a new architecture decision or another owner's productive domain change beyond Security hardening, Security MUST determine that Primary Owner, implement only the cleanly separable Security portion when possible, document the remaining owner dependency and stop at the ownership boundary. No parallel implementation is created. A Security finding MUST NOT be used as a pretext for broad feature or domain refactoring.

### Explicit DENY boundary

This delegation does **not** authorize `CAPITAL-AI-SEC` to:

- create new product features or unrelated business logic;
- change business rules except to the minimum extent strictly necessary to close the Security defect without redefining domain semantics;
- claim or transfer productive PVC ownership;
- bypass a Domain ADR/ESS, Primary Owner contract or Architecture authority;
- create a parallel IAM, Policy, Audit, Release, Deployment, Governance, Security-Control or other control plane;
- independently perform protected external platform mutation, including Production, Billing/money, Entitlement, DNS, IAM-admin, Secret, destructive data or resource mutation without its separate authority;
- weaken Security gates, suppress findings or lower audit/security thresholds;
- combine the remediation with broad product/domain refactoring.

Missing or ambiguous eligibility fails closed to Owner routing rather than expanding Security authority.

### Verification separation

Security implementation and Security verification MAY both occur within `CAPITAL-AI-SEC`, but they are separate evidence/review steps. Implementation evidence alone MUST NOT transition a finding to `VERIFIED` or `CLOSED`.

Closure requires reproducible positive and negative tests bound to the remediated branch/PR or deployed identity, plus hosted/runtime evidence when applicable. The verification step MUST independently re-evaluate the original Security invariant and expected DENY/ALLOW behavior; it MUST NOT merely restate that implementation occurred. Where risk, CODEOWNERS, accepted ADR/ESS or target-owner contracts require it, Human/CODEOWNER and/or affected Primary Owner verification remains mandatory. `EVIDENCE_READY != VERIFIED` remains a hard invariant.

### P0/P1 emergency Security remediation

For confirmed `CRITICAL` or `HIGH` findings, Security MAY immediately create a fresh Security branch and implement the bounded repository fix when the remediation is technically unambiguous, existing Domain semantics are not expanded, no protected external mutation is required, and current-main/open-writer correlation is conflict-free.

This prioritization changes neither PR-creation approval nor CI, Human/CODEOWNER merge, deployment or Production gates. A simple vulnerable dependency patch does not require an artificial foreign-project branch solely because `package.json`, a lockfile or affected runtime code is organizationally associated with another productive project.

### Dependency-vulnerability reference case

For a confirmed High/Critical vulnerability in a productive npm package, an eligible Security slice may determine the actually affected dependency, research the safe minimum version, update `package.json` and `package-lock.json`, harden affected runtime configuration, add proportionate defense-in-depth and negative tests, execute available `npm audit`, TypeScript, unit, build and Security checks, and prepare the remediation for a Security PR. The change is not blocked solely because the vulnerable code or manifest is in `server/**`, `package.json` or another foreign-located path.

If that upgrade requires a business-semantic migration, changes a foreign architecture authority, or needs protected Production/IAM/Billing/Secret mutation, only the bounded Security portion remains eligible and the rest is routed to the applicable Primary Owner/authority.

## Git identity terminology

Current development uses normal Git/GitHub terms:

- `main SHA` — current commit on `main`;
- `branch head SHA` — current commit on the work branch before PR creation;
- `PR head SHA` — current head commit of an open Pull Request;
- `merge SHA` — resulting merged commit where applicable.

`Candidate Head`, `candidate snapshot`, `candidate SHA` and similar governance lifecycle wording are retired for current work. Historical evidence may preserve legacy labels when necessary to understand an old record, but new/updated normative instructions and current Roadmaps use the terms above.

## Effective-change identity and Approval Envelope

`scripts/pr/approvalEnvelope.mjs` provides a repository-local deterministic helper for effective-change identity and fail-closed Approval Envelope evaluation. It is implementation evidence for the existing PR-create control, not a second approval service or authority plane.

The identity may bind a sorted changed-file set, normalized diff digest, scope binding and title binding. It is evidence only. Fingerprint equality is not semantic safety proof; fingerprint inequality is not automatically a material change. Ownership, authority, open-writer, semantic, namespace, security and validation correlation remain mandatory.

The allowed evaluation states are:

- `APPROVAL_STILL_VALID` — bounded approved invariants and effective payload remain materially equivalent; current correlation/validation is acceptable;
- `REAPPROVAL_REQUIRED` — a material invariant or payload changed, or equivalence cannot be proven;
- `BLOCKED` — current authority/correlation/security/validation/mergeability is failed or unresolved.

## Pre-PR technical evidence

Branch-local or approved sandbox checks should be used before PR creation when the exact branch state is actually available to that execution environment. A model must not claim PASS for checks it did not execute.

Pre-PR evidence uses the `developer-preflight` trust class defined by `docs/governance/control-plane/pre-pr-build-evidence.schema.json` and remains bound to exact base/head SHAs. Before requesting PR-creation approval, the agent reports those SHAs, the current-main/open-writer correlation result and the evidence actually available. Evidence remains non-authorizing.

GitHub hosted `build-and-test` remains the independent technical validation for the final PR head where applicable. It is an evidence/merge gate, not a generic Roadmap next-step item.

## Chat handoff and next-step queue (`CTRL-SDLC-CHAT-HANDOFF-001`)

This control has two triggers: `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF`.

### Roadmap-first continuation rule

The continuation queue is derived first from the affected project's current Roadmap. If no immediately executable Roadmap item exists because the Roadmap is dependency-held, blocked or terminal, the queue may use the highest-priority evidence-backed workaround/remediation recommendations from the current correlation. The queue contains at most two items and each item states an objective exit gate.

The queue MUST NOT be filled with generic lifecycle boilerplate such as `merge the PR`, `approve the PR`, `run hosted CI` or `run tests`. Those remain visible where relevant as authority, validation or open-gate status.

For normal non-PR-create handoffs, use:

```text
NÄCHSTE SCHRITTE
1. <highest-priority Roadmap item or evidence-backed workaround>
   Exit Gate: <objective completion condition>
2. <optional second Roadmap item or workaround>
   Exit Gate: <objective completion condition>
```

When no immediately actionable Roadmap/workaround item remains, the block states `Keine weiteren unmittelbar umsetzbaren Roadmap-/Workaround-Schritte identifiziert.`.

When a non-PR-create protected continuation requires an exact Human/Owner response, that response may be rendered in its own neutral copyable code block. Pure Owner authority responses MUST NOT be labeled `⚙️🤓 MANUELL`.

### Canonical PR-create handoff

When PR creation is the current Human/Owner gate, do not emit a separate NÄCHSTE-SCHRITTE or exact-response block. `/AGENTS.md` defines one fenced `yaml` PR-CREATION APPROVAL block containing project/roadmap context, priority, approval-base/current Git evidence, effective-change identity, branch work/evidence, Roadmap progress and assessment, final correlation, exactly two Roadmap/workaround continuation items, intended PR title and the final `Owner-Freigabe` decision line.

The exact affirmative Owner response is `PR Erstellung : Freigegeben`; the negative response is `PR Erstellung : Nicht freigegeben`.

### `CHAT_RUN_HANDOFF`

At the end of every chat-governed repository execution pass, before the assistant's final response closes that pass, the chat MUST render either the normal **Nächste Schritte** block or, when the next gate is PR creation, the canonical PR-CREATION APPROVAL block.

### `POST_PR_HANDOFF`

Immediately after chat-governed PR creation, the chat exposes the PR reference, branch/PR-head, the main baseline used for final correlation, correlation result and known validation/open-gate state, then recomputes the Roadmap/workaround queue.

When multiple follow-up actions exist, display only the two highest-priority immediately actionable items. Each item MUST be bounded/atomic and state an exit gate. Default prioritization is security/data integrity → governance/compliance → CI/build reliability → architecture/integration consistency → deployment readiness → observability/performance → UX/documentation, unless higher authority or an incident requires another order.

After either displayed step is completed, re-read current `main`, open Pull Requests, changed-file/semantic overlap, the affected Roadmap and applicable ADR/ESS and reprioritize. This handoff is non-authorizing.

## Final pre-merge correlation

Every Human merge into `main` uses a Pull Request correlated against then-current `main` immediately before the Human merge decision.

The correlation records at least:

- then-current `main` SHA;
- current PR-head SHA;
- merge-base/current-main drift status;
- relevant changed-file and semantic overlap;
- namespace/authority conflicts where applicable;
- relevant concurrent open-writer state;
- required final-head validation status without converting `NOT RUN` into PASS.

A prior PR-create correlation is useful evidence but is not automatically current at merge time. If `main` or the PR head changes, final pre-merge correlation is repeated.

## Coordination records and historical work claims

Work claims and handoff records are coordination/audit metadata only. They are not part of the primary Human-readable development hierarchy and do not replace the Project Value Chain, Roadmap, ADR or ESS.

A stale claim after a terminal event is a hygiene finding; it does not revive writer authority. Historical claim/handoff documents may remain for audit.

## Human / Owner boundary

Human/Owner retains at least:

- bounded Approval Envelope approval before PR/Draft-PR creation unless a separately effective scoped delegation replaces only that approval prompt;
- final merge authority as a separate decision after final PR-head/current-main correlation;
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

Agent/provider profiles may research and implement only within the current authority, branch and capability scope. Provider/model identity never grants Owner or production authority. Active agent tooling starts from `/AGENTS.md`.

## Production integration / mutation plane

External production mutations occur only through an authorized execution host with current authority, explicit approval/delegation where applicable, target/fingerprint verification, audit evidence and rollback definition. A mutation instruction package is not an authorization artifact by itself.

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

- approval-base and current-main SHA plus branch/PR-head SHA;
- bounded Approval Envelope/effective-change identity and Human approval evidence;
- final main/open-writer correlation;
- final PR-head/current-main pre-merge correlation;
- applicable PVC/Roadmap/ADR/ESS references;
- branch / PR / final head / merge SHA;
- check class and validation result;
- mutation class and target;
- pre/post verification;
- approval/delegation evidence for protected actions;
- audit references;
- rollback state;
- next Roadmap gate.

## Stop / rollback rules

STOP on unexpected target, unresolved open-PR write overlap, missing/ambiguous PR-create authority, failed/unproven Approval Envelope equivalence, stale or missing final pre-merge PR/current-main correlation, missing other required authority, missing audit persistence for protected mutation, failed pre-check, unknown high-impact side effect, failed/inconclusive post-verification or unresolved higher-authority conflict.

Repository rollback uses a fresh branch from current `main`; external rollback follows the applicable protected runbook/approval process.

## Runbooks and historical phase material

Existing M5–M10 runbooks remain available only for explicit domain/recovery/audit/history use where applicable. M10 material is historical/non-authorizing and MUST NOT be treated as a current implementation requirement, discovery target or reactivation backlog merely because it exists.

## Closure rule

A work package closes when implementation, current authority, required validation/evidence, main correlation, affected Roadmap status and any external mutation verification are consistent. A PR merge alone is not sufficient closure for work that includes production mutation.
