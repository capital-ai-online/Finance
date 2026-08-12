# CAPITAL-AI DEVELOPMENT Chain Roadmap

Status: IMPLEMENTATION ROADMAP
Status date: 2026-08-12
Current repository baseline: `main@5bd5f4d78b87a89258126d0453eaf5e4bc6b6125` (PR #232 merge)
Repository: `SvenKulessa/Finance`
Platform version: `0.6.0`
Execution baseline rule: every work item re-resolves current `main`; this header SHA is documentation context, not standing mutation authority.

## Rolle dieses Dokuments

Dieses Dokument ist der **kanonische operative Phasen- und Blockstatus** der DEVELOPMENT Chain. Historische Details bleiben in `docs/architecture/ROADMAP.md`, ADRs, ESS-Dateien, Traceability-Matrizen und Evidence-Dokumenten erhalten.

Es ersetzt keine bestehende Authority. Bei Widerspruch gilt die restriktivere Regel aus Roadmap, ADR, ESS, Human/Owner Policy, Agent IAM, REM oder plattformspezifischem Runbook.

Andere Contracts dürfen Execution Boundaries beschreiben, aber **keinen konkurrierenden Phase-/Blockstatus** führen.

## Kanonische Ausführungsregel

```text
READ-ONLY BASELINE
→ ROADMAP / GAP / ESS / ADR / RUNBOOK
→ HUMAN/OWNER AUTHORITY
→ FRESH BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ PR CHECKPOINT
→ HUMAN FILE REVIEW / REQUIRED CI
→ HUMAN MERGE
→ BRANCH DELETE
→ OPTIONAL NEXT REPOSITORY UNIT FROM NEW MAIN
→ OPTIONAL EXTERNAL PRECHECK
→ EXPLICIT OWNER MUTATION APPROVAL
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST
→ POST-VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

Authority: `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`.

## Verifizierter Systemadmin-/Mutation-Agent-Stand

### M5 / SA3B

- PR #220 implementierte den GitHub-Actions/OIDC Execution Host.
- Issue #221 / Run `31570833507`: M5-Persistenzfehler → kein Permit → kein Branch.
- PR #222 korrigierte den Application↔M5-Schema-Contract.
- Issue #223 / Run `31574111075`: OIDC → durable Authorization Evidence → BRANCH Side Effect → durable SUCCESS Outcome.
- Issue #224 / Run `31574221718`: stale-base DENY ohne Side Effect.
- erfolgreicher Probe-Branch nach Evidence-Erfassung gelöscht.

M5 und SA3B sind **COMPLETE / VERIFIED PASS**.

### SA4

PR #226 implementierte den bounded SA4 Pilot Host. Owner Issue #228 / Workflow `31579519025` erzeugte audit-bound:

`BRANCH → COMMIT → Draft PR`

Der Host erzeugte exakt `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`, Commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` und Draft PR #229. Human Review, CI, Human Merge und Branch Delete wurden anschließend verifiziert.

Closure Evidence: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

**SA4 finaler Stand: COMPLETE / VERIFIED PASS.**

Capability-Grenze: SA4 beweist einen deterministischen docs-only Work-Package-Pfad. Es beweist keinen allgemeinen Code/Test/Config Executor.

### SA4B — benötigtes Enablement für größere autonome Code-Blöcke

ADR-0069 und ESS-0021 v1.1 definieren den nächsten Systemadmin-Schritt:

**SA4B — Bounded Repository Code / Roadmap Block Executor**.

SA4B muss per Execution Unit Pfade, Capabilities, Risk, Mutation Class, Tests, Branch/Base/Head und PR-Checkpoint technisch erzwingen und mindestens zwei getrennte Repository-Units unter einem REM mit zwei Human-Merge-/Branch-Delete-Checkpoints real nachweisen.

Bis SA4B `VERIFIED PASS` ist:

- normale Human-authorized Development-PRs bleiben möglich;
- Systemadmin darf nicht als allgemeiner autonomer Code-Executor für M5A/M6/etc. behandelt werden;
- externe Production Mutations bleiben unverändert separat autorisiert.

## Phasenstatus

| Phase | Execution State | Documentation Readiness | Authority | Mutation / Test Gate | Next Gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | **COMPLETE** | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | **COMPLETE** | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture / Documentation | **COMPLETE** | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | **COMPLETE** | COMPLETE | Freeze policy | docs consistency | sequential implementation |
| M3 CI Hardening | **COMPLETE** | COMPLETE | ADR-0053/0060 + CI governance | scope-aware CI / Human gate | preserve until M10 cutover |
| M4 Agent IAM | **COMPLETE** | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Audit / Telemetry | **COMPLETE / VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5/SA3B Evidence | real privileged authorization/outcome persistence + fail-closed outage proven | preserve |
| M5A Native MFA / AAL2 | **IN PROGRESS** | baseline + runbook + autonomous-block design ready | ESS-0020 + ADR-0064 + ADR-0003.5 | normal Development path available; Systemadmin autonomous code path requires SA4B VERIFIED PASS; production enrollment requires separate Owner approval | M6 blocked until M5A VERIFIED PASS |
| M6 Supply Chain Provenance | **BLOCKED BY M5A** | RUNBOOK READY | ADR-0060 | SBOM/provenance/attestation bound to exact source/artifact | M7 after M6 VERIFIED PASS |
| M7 Deployment Identity / Platform Mutation | **BLOCKED BY M6** | RUNBOOK READY | ADR-0061 | exact target + Owner mutation approval + post-verification/rollback | M8 after required M7 mutations VERIFIED PASS |
| M8 Agent Cutover | **BLOCKED BY M7** | RUNBOOK READY | ADR-0062 + ESS-0019 | provider-neutral profiles + equivalent policy tests + rollback to read-only | M9 after cutover VERIFIED PASS |
| M9 Assurance / Incident / Break-Glass | **BLOCKED BY M8** | RUNBOOK READY | ADR-0063 | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | M10 after assurance VERIFIED PASS |
| M10 Passkey-only Owner PR Authorization | **BLOCKED BY M9** | ESS + RUNBOOK + THREAT MODEL READY | ADR-0066 + ESS-0022 | exact-state WebAuthn approval, shadow mode, replay/recovery tests, legacy gate cleanup | DevelopmentChain closure after VERIFIED PASS |

**Documentation readiness never authorizes blocked phase execution.**

## Autonomous Roadmap Block operating model

Authority:

- ADR-0069;
- ESS-0021 v1.1;
- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`;
- `.ai/contracts/development-chain-roadmap-block.schema.json`;
- `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md`.

### Block definition

Ein größerer Roadmap-Block wird in geordnete **Execution Units (EU)** zerlegt.

```text
Block
→ EU-01 → PR checkpoint → Human merge → branch delete
→ EU-02 → PR checkpoint → Human merge → branch delete
→ EU-03 → PR checkpoint → Human merge → branch delete
→ block-specific external mutation gate if required
```

Invariant:

`one EU = one branch = one PR`

Ein Owner-approved REM darf mehrere explizit benannte EU-IDs desselben Blocks enthalten. Das erspart neue PR-Creation-Prompts zwischen den Units, **nicht** Human Review/Merge.

### PR checkpoint

Review-ready PR = harter Autonomous STOP.

Der Systemadmin darf innerhalb derselben EU vor finalem Human Review CI-/Governance-Fehler scope-konform reparieren. Er darf nicht mergen oder die nächste EU beginnen.

### Resume gate

Nächste EU erst nach:

- vorherigem Human Merge;
- erfolgreicher required CI Evidence;
- Branch Delete;
- neu aufgelöstem current `main` mit vorherigem Merge;
- weiterhin gültigem REM;
- unblocked Roadmap Gate;
- no open PR overlap;
- verfügbarer M5 Audit-Persistenz;
- technisch gültigem per-EU Scope.

### Source-of-truth rule

| Information | Canonical source |
|---|---|
| Development phase/block status | this Roadmap |
| Systemadmin capability stage | `SYSTEMADMIN_AGENT_ROADMAP.md` |
| Security decision | ESS/ADR/Governance |
| per-unit technical scope | Roadmap Block Contract bound to REM |
| runtime authorization | REM + Agent IAM + trusted host |
| side-effect evidence | M5 append-only audit + GitHub evidence |
| end-to-end trace | Traceability matrices |

Der Block Contract führt keinen eigenen Status.

## Current executable DEVELOPMENT phase — M5A

M5A ist der nächste fachliche DEVELOPMENT-Chain-Implementierungspunkt.

### Goal

Replace historical application-owned TOTP assurance for privileged identities with authoritative Supabase Native MFA/AAL2 enforcement while retaining purpose-bound application step-up only as defense-in-depth.

### Zwei zulässige Repository-Ausführungspfade

**Path A — normal Development:** Human-authorized branch/implementation/PR gemäß bestehender DevelopmentChain. Dieser Pfad ist fachlich nicht durch SA4B blockiert.

**Path B — Systemadmin autonomous block:** erst zulässig nach SA4B `VERIFIED PASS`, mit dediziertem Owner-approved M5A REM und per-unit Roadmap Block Contract.

Beide Pfade enden vor externen Production Mutations an derselben Human/Owner-Grenze.

## M5A planned autonomous repository block

Block ID: `DC-M5A-NATIVE-MFA-AAL2-REPOSITORY`

Status: **PLANNED / AUTONOMOUS PATH BLOCKED BY SA4B**.

Die folgende Zerlegung ist die kanonische Roadmap-Planung. Vor Owner Approval des späteren M5A REM muss ein current-main Preflight die exakten Datei-Allowlisten pro Unit erzeugen und einfrieren. Breite `src/**`/`server/**`-Wildcards sind für den produktiven REM nicht ausreichend.

### M5A-EU1 — Native MFA enrollment/session client boundary

Objective:

- Native Supabase TOTP enroll/challenge/verify integration;
- `getAuthenticatorAssuranceLevel()`-basierte client/session decisions;
- fail-closed AAL state handling;
- legacy local TOTP no longer authoritative for successful privileged assurance.

Current architecture path candidates to resolve exactly at preflight include:

- `src/components/TotpSettings.tsx`;
- `src/components/LoginStepUpGate.tsx`;
- `src/lib/loginStepUp.ts`;
- related unit tests and narrowly required auth helpers.

Required tests include positive enrollment/challenge state plus invalid code, unverified factor, AAL1/AAL1, AAL1/AAL2 and stale AAL2/AAL1 denial behavior.

**PR checkpoint M5A-PR1:** review-ready PR → autonomous STOP → Human review/CI/merge → branch delete.

### M5A-EU2 — Canonical server AAL2 enforcement and privileged route composition

Depends on M5A-EU1 merged and branch deleted.

Objective:

- one canonical server-side `requireVerifiedAal2`-equivalent boundary;
- Bearer-token/Supabase identity verification; never trust client AAL fields;
- privileged route composition `checkAdminAccess + AAL2 + purpose-bound step-up where required`;
- Auth/AAL verification failures deny access;
- legacy/custom step-up cannot elevate AAL1.

Current path candidates include `server/stepUp.ts`, exact privileged route composition files discovered by current-main code search, narrowly required security helpers and tests.

Required negative tests include AAL1 owner/admin deny, missing/unverified factor, stale session, Auth verification error, wrong-purpose/replayed step-up and unauthorized privileged action.

**PR checkpoint M5A-PR2:** review-ready PR → autonomous STOP → Human review/CI/merge → branch delete.

### M5A-EU3 — Recovery, factor administration, integration evidence and production-handoff readiness

Depends on M5A-EU2 merged and branch deleted.

Objective:

- native-MFA-aware recovery contract;
- bounded Owner-controlled factor reset/removal server path without role elevation;
- CRITICAL audit event requirements;
- integration/negative test closure;
- production pre-mutation checklist/evidence/handoff preparation;
- no actual native Owner factor mutation.

Repository-only unit. Any test or documentation that would require exposing TOTP secret/QR/code/factor identifiers is prohibited.

**PR checkpoint M5A-PR3:** review-ready closure PR → autonomous STOP → Human review/CI/merge → branch delete.

### M5A repository block exit

After M5A-PR3 Human merge:

- repository implementation must be CI `VERIFIED PASS`;
- branch lifecycle complete;
- Roadmap/Traceability repository state synchronized;
- then and only then Stage D read-only production precheck from `M5A_SUPABASE_TOTP_AAL2_HARDENING.md` may run.

### M5A external mutation boundary

Repository block authority ends before:

- Owner Native MFA enrollment;
- any Supabase Auth configuration change;
- factor deletion/reset used as production recovery test;
- legacy TOTP/break-glass data cleanup.

Required sequence remains:

```text
repository code merged
→ read-only production precheck
→ explicit Owner production mutation approval
→ exact mutation handoff / authorized executor
→ one Owner identity at a time
→ AAL2 positive/negative/recovery verification
→ Advisor rerun
→ evidence
```

Legacy cleanup remains a later separate decision.

## M6 — Supply Chain Provenance

Runbook: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`.

Required deliverables remain deterministic dependency resolution, source SHA + lockfile digest, machine-readable SBOM, source-to-artifact provenance, verifiable attestation, artifact digest binding, pinned/least-privilege CI actions, vulnerability checks, immutable rollback reference and Evidence under `docs/evidence/m6/`.

No M6 implementation starts before M5A is `VERIFIED PASS`.

After SA4B `VERIFIED PASS`, M6 may also be decomposed into per-PR Execution Units under one M6 REM; that decomposition must be added to this canonical Roadmap before autonomous execution begins.

## M7 — Deployment Identity and Platform Mutation

Runbook: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`.

Required: exact production deploy identity, source/provenance→deployment→runtime correlation, environment-scoped Render path, credential/hook ownership/rotation/revocation, exact mutation work orders, pre/post verification and rollback. Stripe/Supabase only when separately named by Authority; DNS/TLS/IONOS remains Human/Owner-reserved absent a later stronger ADR.

Repository preparation may use the SA4B block model after prerequisite phases. External M7 mutations still require separate Owner mutation approval.

## M8 — Provider-neutral Agent Cutover

Runbook: `docs/runbooks/M8_AGENT_CUTOVER.md`.

Target:

```text
AI App / Agent
→ provider profile
→ CAPITAL-AI Control Plane
→ IAM / risk / audit / execution-host decision
→ bounded capability
```

Provider/model identity never elevates authority. Research/read-only profiles remain mutation-denied.

## M9 — Assurance

Runbook: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`.

Exit evidence covers authorization bypass, prompt/tool injection, replay/idempotency, secret/data exfiltration, audit completeness/outage, kill switch, break-glass, rollback/recovery and independent Evidence review.

## M10 — Passkey-only Human/Owner PR Authorization

Authorities:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`;
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`;
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`;
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`.

The Systemadmin must consume the then-current Human/Owner PR policy rather than hard-code a transitional checkbox/event mechanism. Human file review and Human-only merge remain mandatory after cutover.

## Mutation Executor Handoff

Canonical documents:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`;
- `.ai/contracts/development-chain-mutation-handoff.schema.json`.

A Handoff contains exact phase/item/base/target/operation/precheck/postcheck/rollback/evidence metadata but **cannot create authority**. Execution separately requires applicable Human Approval, REM/IAM/Execution Host policy and durable audit evidence.

## Branch / Clone Lifecycle

For every Execution Unit:

```text
current main → fresh scoped branch → PR → Human merge → branch delete
```

Cloned repositories, worktrees and agent workspaces never edit `main` directly. After successful merge, the Finance remote work branch is deleted and temporary workspaces are cleaned after Evidence retention. The next Unit starts again from then-current `main`.

Authority: `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`.

## Required Documentation Set per Roadmap Block

Before a larger block can be autonomously delegated, it requires:

1. canonical Roadmap block + explicit EU IDs and dependencies;
2. ESS/ADR Authority;
3. threat/risk model for new trust boundaries;
4. phase/block Runbook;
5. Roadmap Block Contract with per-EU scopes;
6. Owner-approved REM containing exactly the intended EU IDs;
7. positive + negative tests per EU;
8. rollback per EU;
9. PR checkpoint after each EU;
10. Evidence requirement→implementation→test→PR/merge→branch delete;
11. separate mutation approval/handoff for external Production writes;
12. explicit block Exit Gate and Next Gate.

## Current Next Actions

1. **SA4B is the next Systemadmin enablement gate** for general bounded code/test Roadmap-block execution.
2. **M5A remains the next DEVELOPMENT product/security phase.** It may proceed normally without waiting for SA4B.
3. If M5A is delegated as an autonomous Systemadmin block, complete SA4B first, then create a dedicated M5A REM + validated per-unit Block Contract for `M5A-EU1..EU3`.
4. M5A Native Owner MFA Production Mutation remains separately Human-approved after repository implementation and read-only precheck.
5. M6 remains blocked until M5A `VERIFIED PASS`.
