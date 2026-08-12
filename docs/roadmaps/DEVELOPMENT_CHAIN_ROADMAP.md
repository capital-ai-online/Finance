# CAPITAL-AI DEVELOPMENT Chain Roadmap

Status: IMPLEMENTATION ROADMAP
Status date: 2026-08-12
Current repository baseline: `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd` (PR #229 merge)
Current production baseline: Render deploy `dep-d9u392nlk1mc73fg1hk0` — `live` — commit `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`
Repository: `SvenKulessa/Finance`
Platform version: `0.6.0`

## Rolle dieses Dokuments

Dieses Dokument ist der operative Phasenindex der DEVELOPMENT Chain. Historische Details bleiben in `docs/architecture/ROADMAP.md`, den ADRs, ESS-Dateien, Traceability-Matrizen und Evidence-Dokumenten erhalten.

Es ersetzt keine bestehende Authority. Bei Widerspruch gilt die restriktivere Regel aus Roadmap, ADR, ESS, Human/Owner Policy, Agent IAM, REM oder plattformspezifischem Runbook.

## Kanonische Ausführungsregel

```text
READ-ONLY BASELINE
→ ROADMAP / GAP / ESS / ADR / RUNBOOK
→ HUMAN/OWNER REVIEW
→ FRESH BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ PR / HUMAN FILE REVIEW / CI
→ HUMAN MERGE
→ BRANCH DELETE
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

Der parallel aufgebaute Systemadmin-Pfad hat die früheren M5-/SA3B-Blocker inzwischen real geschlossen.

### M5 / SA3B

- PR #220 implementierte den GitHub-Actions/OIDC Execution Host.
- Issue #221 / Run `31570833507` bewies fail-closed: M5-Persistenzfehler → kein Permit → kein Branch.
- PR #222 korrigierte den Application↔M5-Schema-Contract.
- Issue #223 / Run `31574111075` bewies den positiven realen Pfad: OIDC → durable Authorization Evidence → BRANCH Side Effect → durable SUCCESS Outcome.
- Issue #224 / Run `31574221718` bewies stale-base DENY ohne Side Effect.
- `agent/sa3b-host-probe-20260812b` ist nach Evidence-Erfassung gelöscht.

Damit gelten der korrigierte privilegierte M5-Auditpfad und SA3B als **COMPLETE / VERIFIED PASS**.

### SA4

PR #226 implementierte den bounded SA4 Pilot Host. Der erste echte autonome Work-Package-Pilot lief über Owner Issue #228 / Workflow `31579519025` und erzeugte über getrennte audit-bound Permits:

```text
BRANCH → COMMIT → Draft PR
```

Der Host erzeugte exakt `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`, Commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` und Draft PR #229. PR #229 wurde anschließend ausschließlich durch den Human/Owner reviewed, final autorisiert und gemergt. Merge SHA: `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`. Main CI #966 / Run `31580214920` ist PASS; der Pilot-Branch ist gelöscht; Render deploy `dep-d9u392nlk1mc73fg1hk0` ist live.

Closure Evidence: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

**SA4 finaler Stand: COMPLETE / VERIFIED PASS.**

Wichtige Capability-Grenze: SA4 hat einen deterministischen docs-only Work-Package-Pfad mit `BRANCH`, `COMMIT` und Draft-`PR` verifiziert. Der aktuelle Pilot beweist **keinen allgemeinen Arbitrary-Code/Patch-Executor**. Ein späterer autonomer DEVELOPMENT-Codeauftrag benötigt daher weiterhin ein exaktes Owner-approved REM und einen technisch enforcebaren Execution-Pfad für die tatsächlichen Code-/Testpfade.

`MERGE`, externe Produktionsmutation, Owner-IAM/MFA/Break-Glass, Secret Disclosure, Live Billing, DNS/TLS und Security-Control-Abschwächung bleiben nicht delegiert.

## Phasenstatus

| Phase | Execution State | Documentation Readiness | Authority | Mutation / Test Gate | Next Gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | **COMPLETE** | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | **COMPLETE** | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture / Documentation | **COMPLETE** | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | **COMPLETE** | COMPLETE | Freeze policy | docs consistency | sequential implementation |
| M3 CI Hardening | **COMPLETE** | COMPLETE | ADR-0053/0060 + CI governance | scope-aware CI / Owner gate | preserve until M10 cutover |
| M4 Agent IAM | **COMPLETE** | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Audit / Telemetry | **COMPLETE / VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5/SA3B Evidence | real privileged authorization/outcome persistence proven; fail-closed outage proven | preserve; supports bounded audited automation |
| M5A Native MFA / AAL2 | **IN PROGRESS** | baseline + runbook ready | ESS-0020 + ADR-0064 + ADR-0003.5 | repo code → CI → explicit Owner production approval → native factor/AAL2/recovery/advisor verification | M6 blocked until VERIFIED PASS |
| M6 Supply Chain Provenance | **BLOCKED BY M5A** | **RUNBOOK READY** | ADR-0060 | SBOM/provenance/attestation bound to exact source/artifact | M7 after M6 VERIFIED PASS |
| M7 Deployment Identity / Platform Mutation | **BLOCKED BY M6** | **RUNBOOK READY** | ADR-0061 | exact target + Owner mutation approval + post-verification/rollback | M8 after all required M7 mutations VERIFIED PASS |
| M8 Agent Cutover | **BLOCKED BY M7** | **RUNBOOK READY** | ADR-0062 + ESS-0019 | provider-neutral profiles + equivalent policy tests + rollback to read-only | M9 after cutover VERIFIED PASS |
| M9 Assurance / Incident / Break-Glass | **BLOCKED BY M8** | **RUNBOOK READY** | ADR-0063 | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | M10 after assurance VERIFIED PASS |
| M10 Passkey-only Owner PR Authorization | **BLOCKED BY M9** | **ESS + RUNBOOK + THREAT MODEL READY** | ADR-0066 + ESS-0022 | exact-state WebAuthn approval, shadow mode, replay/recovery tests, legacy gate cleanup | DevelopmentChain closure after VERIFIED PASS |

**Documentation readiness never authorizes blocked phase execution.**

## Current executable DEVELOPMENT phase — M5A

M5A ist der nächste fachliche DEVELOPMENT-Chain-Implementierungspunkt.

### Goal

Replace the historical application-owned TOTP assurance for privileged identities with authoritative Supabase Native MFA/AAL2 enforcement while retaining purpose-bound application step-up only as defense-in-depth.

### Required sequence

1. aktuelle Authority-Metadaten von ESS-0020 / ADR-0064 gegen Human/Owner-Entscheid synchronisieren;
2. für autonome Systemadmin-Codeausführung ein dediziertes, gültiges REM + technisch begrenzten Code-Execution-Pfad nachweisen; alternativ normaler Human-authorized Development-PR-Pfad;
3. fresh implementation branch from then-current `main`;
4. native TOTP enroll/challenge/verify integration;
5. centralized server-side AAL2 gate;
6. privileged session/factor lookup fail-closed;
7. recovery/factor reset aligned with native MFA;
8. positive + negative tests;
9. repository CI `VERIFIED PASS`;
10. Human merge + branch cleanup;
11. read-only production precheck;
12. separate explicit Owner mutation approval;
13. native Owner-factor mutation one identity at a time;
14. AAL2 positive/negative/recovery verification;
15. advisor/evidence rerun;
16. Roadmap/Traceability sync.

Mutation boundary:

- repository code: `REQUIRED`;
- Owner Native MFA enrollment: `REQUIRED / NOT YET AUTHORIZED` at baseline;
- Supabase project setting: `CONDITIONAL` only if exact need is proven;
- new Postgres DDL: `NOT REQUIRED`;
- legacy custom-TOTP cleanup: `DEFERRED / SEPARATE APPROVAL`;
- Stripe/Render: `NOT REQUIRED` for M5A core implementation.

## M6 — Supply Chain Provenance

Runbook: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`.

Required deliverables remain: deterministic dependency resolution, source SHA + lockfile digest, machine-readable SBOM, source-to-artifact provenance, verifiable attestation, artifact digest binding, pinned/least-privilege CI actions, vulnerability checks, immutable rollback reference and Evidence under `docs/evidence/m6/`.

No M6 implementation starts before M5A is `VERIFIED PASS`.

## M7 — Deployment Identity and Platform Mutation

Runbook: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`.

Required: exact production deploy identity, source/provenance→deployment→runtime correlation, environment-scoped Render path, credential/hook ownership/rotation/revocation, exact mutation work orders, pre/post verification and rollback. Stripe/Supabase only when separately named by Authority; DNS/TLS/IONOS remains Human/Owner-reserved absent a later stronger ADR.

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

Legacy `💪`/`okay` and Owner checkbox authorization remain authoritative until controlled M10 cutover reaches `VERIFIED PASS`. Human file review and Human-only merge remain mandatory after cutover.

## Mutation Executor Handoff

Canonical documents:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`;
- `.ai/contracts/development-chain-mutation-handoff.schema.json`.

A Handoff contains exact phase/item/base/target/operation/precheck/postcheck/rollback/evidence metadata but **cannot create authority**. Execution separately requires the applicable Human Approval, REM/IAM/Execution Host policy and durable audit evidence.

## Branch / Clone Lifecycle

For every work item:

```text
current main → fresh scoped branch → PR → Human merge → branch delete
```

Cloned repositories, worktrees and agent workspaces never edit `main` directly. After successful merge, the Finance remote work branch is deleted and temporary workspaces are cleaned after Evidence retention. The next work item starts again from then-current `main`.

Authority: `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`.

## Required Documentation Set per Phase

Each roadmapped phase closes only when applicable classes are covered:

1. Roadmap + ESS/ADR Authority;
2. Threat/Risk model for new trust boundaries;
3. Runbook;
4. machine contract for agentic/platform Handoff where relevant;
5. positive + negative tests;
6. mutation approval/pre/post/rollback when relevant;
7. redacted append-only Evidence;
8. traceability requirement → implementation → test → evidence → state;
9. Human merge + branch deletion for repository changes;
10. explicit Next Gate.

## Current Next Action

**M5A remains the next DEVELOPMENT Chain implementation gate.** M5 and SA3B/SA4 are no longer blockers: their real positive/negative execution Evidence and branch lifecycle are complete.

Before M5A is delegated to the Systemadmin as a code-producing autonomous work package, the exact code/test scope must be covered by a dedicated Owner-approved REM and a technically enforceable execution path. SA4's docs-only deterministic pilot is evidence of the control architecture, not blanket code-write authority.

M6–M10 documentation is prepared in advance only to remove planning gaps and does not authorize blocked execution.