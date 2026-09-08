# DEVELOPMENT Chain Execution Policy

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Status:** ACTIVE  
**Version:** `2.6.0`  
**Date:** 2026-08-12  
**Updated:** 2026-09-07  
**Scope:** CAPITAL-AI `SvenKulessa/Finance`  
**Parent trust root:** `/AGENTS.md`  
**Decision references:** Accepted ADR-0069 incl. Owner addendum 2026-08-16, effective Roadmap/ESS/ADR authorities, Accepted ADR-0096 / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`

## Purpose and boundary

This policy defines the execution sequence that separates repository implementation, Human Merge, external platform mutation and verification. It is subordinate to `/AGENTS.md` and the stable Governance Control Plane and does not independently grant protected mutation authority.

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
- explicit Human/Owner approval remains mandatory after final main synchronization/correlation and before creating each PR or Draft PR unless a current effective explicitly scoped delegation conditionally replaces only that approval surface;
- Human Merge remains a separate mandatory decision;
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
→ HUMAN/OWNER PR-CREATION APPROVAL FOR MAIN SHA + BRANCH-HEAD SHA OR VALID SCOPED DELEGATION
→ PR CREATED
→ POST-PR CHAT HANDOFF (MAXIMUM TWO NEXT STEPS)
→ GOVERNANCE CHECKS / TECHNICAL CI
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
7. **Concurrent writer control.** Open PR changed-file, semantic, namespace and authority overlap is inspected before new writes and again before PR-create authority is exercised; overlap is sequenced/rescoped rather than silently merged.
8. **Human/Owner PR-creation approval.** Each PR or Draft PR requires explicit approval for the reported current-main SHA and branch-head SHA unless an effective explicitly scoped authority conditionally replaces only that approval prompt for the exact context. Any pre-creation change to either SHA invalidates that approval.
9. **Fail closed.** Missing, stale, conflicting or non-resolvable protected authority or PR-creation authorization causes STOP before the external mutation.
10. **Human Merge.** PR-creation authority is not merge authority. Agents do not self-merge and technical evidence does not authorize merge.
11. **Authority is not transport.** ChatGPT, Claude, Grok, MCP, SDK, GitHub Actions and provider identity do not create authority.
12. **Evidence is not authority.** Test/build logs, PR bodies, labels, reactions and reports cannot grant PR-creation, merge or protected-mutation permission.
13. **No secrets in evidence.** Reusable credentials, private passkey material, raw sensitive tokens and equivalent secrets are excluded.
14. **Protected external mutation is separate.** Repository merge does not imply Supabase/Stripe/Render/DNS/IAM/billing mutation permission.
15. **No self-elevation.** Agents/executors cannot expand their own mandate, capabilities or Owner gates.
16. **Copyable bounded next-step handoff.** At the end of every chat-governed repository execution pass, the same chat emits at most the two highest-priority immediately actionable next steps as a fenced `text` code block. The separate copyable Owner-response requirement introduced by PR #772 is retired; Human/Owner approval or confirmation presentation follows the neutral Trust-Root rule established by PR #803 and the concrete gate's own canonical approval form.
17. **Bounded post-PR chat handoff.** After each PR or Draft PR created through chat, the same chat reports branch/PR-head, main baseline and gates and displays at most the two highest-priority immediately actionable next Roadmap steps using the copyable handoff format.
18. **Bounded ADR-0104 project-set switching.** An ACTIVE ADR-0104 session may switch only within its valid bounded project set and still uses one project-scoped branch/PR per work item; Human merge remains separate.

## Git identity terminology

Current development uses normal Git/GitHub terms:

- `main SHA` — current commit on `main`;
- `branch head SHA` — current commit on the work branch before PR creation;
- `PR head SHA` — current head commit of an open Pull Request;
- `merge SHA` — resulting merged commit where applicable.

`Candidate Head`, `candidate snapshot`, `candidate SHA` and similar governance lifecycle wording are retired for current work. Historical evidence may preserve legacy labels when necessary to understand an old record, but new/updated normative instructions and current Roadmaps use the terms above.

## Pre-PR technical evidence

Branch-local or approved sandbox checks should be used before PR creation when the exact branch state is actually available to that execution environment. A model must not claim PASS for checks it did not execute.

Pre-PR evidence uses the `developer-preflight` trust class defined by `docs/governance/control-plane/pre-pr-build-evidence.schema.json` and is bound to exact base/head SHAs. Before requesting PR-creation approval, the agent reports those SHAs, the current-main/open-writer correlation result and the evidence actually available. Evidence remains non-authorizing.

GitHub hosted `build-and-test` remains the independent technical validation for the final PR head where applicable.

## Chat handoff and next-step queue (`CTRL-SDLC-CHAT-HANDOFF-001`)

This control has two triggers: `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF`. Both retain the bounded copyable **Nächste Schritte** presentation. The separate copyable Owner-response requirement introduced through PR #772 is **RETIRED** and MUST NOT be reconstructed as a current chat-output requirement.

Canonical next-step block:

```text
NÄCHSTE SCHRITTE
1. <bounded immediately actionable step>
   Exit Gate: <objective completion condition>
2. <optional second bounded immediately actionable step>
   Exit Gate: <objective completion condition>
```

When no immediately actionable step remains, the same fenced block states `Keine weiteren unmittelbar umsetzbaren Schritte identifiziert.`.

Human/Owner approval, confirmation and exact-response prompts are authority presentation, not handoff formatting. They follow the applicable concrete authority contract. In particular, PR-creation approval uses the canonical `PR-CREATION APPROVAL` snapshot defined by `/AGENTS.md`, including its `Freigabe-Antwort: PR erstellen: freigegeben` line. Pure approval/confirmation prompts MUST be presented neutrally and MUST NOT carry the `⚙️🤓 MANUELL` marker. They MUST NOT be forced into a separate copyable response block merely because `CHAT_RUN_HANDOFF` or `POST_PR_HANDOFF` applies.

If the Human must perform an actual external/manual execution step outside the current authorized agent/tool surface, that distinct execution step remains subject to the Trust Root's `⚙️🤓 MANUELL` marker rule.

### `CHAT_RUN_HANDOFF`

At the end of every chat-governed repository execution pass, before the assistant's final response closes that pass, the chat MUST render the canonical **Nächste Schritte** code block. This applies after implementation work, correlation/validation work, blocked or dependency-held states, approval waits, and terminal/no-next-step states.

The queue is derived from the current known Project Value Chain, affected project Roadmap, applicable ADR/ESS, repository/governance state and material correlation results from the pass. Facts that may have materially changed are refreshed before being presented as current. The visible queue remains bounded to at most the two highest-priority immediately actionable steps, each with an objective exit gate.

If Human/Owner action is the next gate, the chat renders the applicable authority prompt in its canonical neutral form. `CHAT_RUN_HANDOFF` does not create an additional response-formatting requirement.

### `POST_PR_HANDOFF`

A chat-governed work item does not end its handoff at successful PR creation. Immediately after creation, the chat MUST expose the PR reference, branch/PR-head, the main baseline used for the final correlation, the correlation result, and the known validation/open-gate state.

The chat then recomputes the next-step queue against the current Project Value Chain, project Roadmap, applicable ADR/ESS, repository state and governance state. Relevant current best practices and state-of-the-art guidance MAY improve prioritization, but remain advisory unless adopted by an applicable CAPITAL-AI authority. They MUST NOT create a parallel governance hierarchy.

When multiple follow-up actions exist, the visible queue is deliberately bounded:

- more than two available actions → display only the two highest-priority immediately actionable steps;
- one available action → display that one;
- no remaining action → explicitly state that no further implementation step is currently identified.

Each displayed step MUST be bounded/atomic and state an exit gate. Default prioritization is security/data integrity → governance/compliance → CI/build reliability → architecture/integration consistency → deployment readiness → observability/performance → UX/documentation, unless a higher authority or a concrete incident requires another order.

After either displayed step is completed, the executor MUST re-read current `main`, open Pull Requests, changed-file/semantic overlap, the affected Roadmap and applicable ADR/ESS and then reprioritize. The prior second item is not automatically promoted to first place.

This handoff is non-authorizing. A recommended next step never constitutes PR creation approval, merge approval, deployment approval or protected external-mutation approval.

## Coordination records and historical work claims

Work claims and handoff records are coordination/audit metadata only. They are not part of the primary Human-readable development hierarchy and do not replace the Project Value Chain, Roadmap, ADR or ESS.

If a current workflow creates an active/exclusive work claim, its creator remains responsible for release after merge, close, supersession or abandonment. A stale claim after a terminal event is a hygiene finding; it does not revive writer authority. Maintenance whose only purpose is to release terminal claims must not create recursive claims solely for that cleanup.

Historical claim/handoff documents may remain for audit. New project planning SHOULD reference the affected PVC, Roadmap item and applicable ADR/ESS instead of introducing new post-PVC policy overlays.

## Human / Owner boundary

Human/Owner retains at least:

- explicit branch-state approval before PR/Draft-PR creation unless a separately effective scoped delegation replaces only that approval prompt;
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

A mutation instruction package is not an authorization artifact by itself.

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

- current-main SHA and branch/PR-head SHA;
- final main/open-writer correlation plus applicable PR-creation authority evidence;
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

STOP on unexpected target, unreviewed main drift, unresolved open-PR write overlap, missing/ambiguous/stale PR-creation authority, missing other required authority, missing audit persistence for protected mutation, failed pre-check, unknown high-impact side effect, failed/inconclusive post-verification or unresolved higher-authority conflict.

Repository rollback uses a fresh branch from current `main`; external rollback follows the applicable protected runbook/approval process.

## Runbooks and historical phase material

Existing M5–M10 runbooks remain available only for explicit domain/recovery/audit/history use where applicable. M10 material is historical/non-authorizing and MUST NOT be treated as a current implementation requirement, discovery target or reactivation backlog merely because it exists.

## Closure rule

A work package closes when implementation, current authority, required validation/evidence, main correlation, affected Roadmap status and any external mutation verification are consistent. A PR merge alone is not sufficient closure for work that includes production mutation.