# CAPITAL-AI DEVELOPMENT Chain Roadmap

Status: IMPLEMENTATION ROADMAP
Status date: 2026-08-12
Current repository baseline: `main@6205868da833a6ee75b5301e78b0a2e6a118c411` (PR #251 merge)
Repository: `SvenKulessa/Finance`
Platform version: `0.6.0`

## Rolle dieses Dokuments

Dieses Dokument ist der operative Phasenindex der DEVELOPMENT Chain. Historische Details bleiben in `docs/architecture/ROADMAP.md`, den ADRs, ESS-Dateien und Evidence-Dokumenten erhalten.

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

## Parallel Systemadmin / Mutation-Agent Workstream

Die Systemadmin-Authority ist gegenüber der älteren DEVELOPMENT-CHAIN-Baseline fortgeschritten:

- SA3B Execution Host: **COMPLETE / VERIFIED PASS**;
- SA4 bounded autonomous repository work package: **COMPLETE / VERIFIED PASS**;
- permit-before-side-effect, positive/negative Host-Probes, M5 authorization/outcome evidence und Branch-Cleanup sind in der SA-Roadmap und Traceability dokumentiert;
- direkte ChatGPT→GitHub-Connector-Schreibvorgänge bleiben außerhalb des autonomen SA-Nachweispfads;
- SA5 externe Produktionsmutation bleibt bis M10 `VERIFIED PASS` blockiert.

Für M5A darf der verifizierte SA4-Pfad ausschließlich ein begrenztes Repository-Work-Package ausführen:

- Authority: `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md`;
- Mandat: `.ai/mandates/REM-M5A-REPOSITORY-001.json`;
- Mandatstatus bei Erstellung: `DRAFT`, damit kein Dokument seine eigene Autorität erzeugt;
- zulässig: Analyse, Branch, begrenzte Code-/Teständerungen, Commit, Draft-PR, CI-Request und redigierte Evidence;
- verboten: Supabase-Faktor-/Auth-Mutation, Secrets, Render/Stripe/IONOS, Rulesets, Merge, Owner-MFA/Break-Glass und Self-Expansion.

Aktivierung erfordert nach Merge eine exakte current-main-Bindung, Human/Owner-Akzeptanz von ESS-0020/ADR-0064 sowie einen separaten `OWNER_APPROVED`-Status mit Approval-Evidence. Produktion bleibt bis zum späteren M5A-Mutation-Gate unberührt.

## Phasenstatus

| Phase | Execution State | Documentation Readiness | Authority | Mutation / Test Gate | Next Gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | **COMPLETE** | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | **COMPLETE** | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture / Documentation | **COMPLETE** | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | **COMPLETE** | COMPLETE | Freeze policy | docs consistency | sequential implementation |
| M3 CI Hardening | **COMPLETE** | COMPLETE | ADR-0053/0060 + CI governance | scope-aware CI / Owner gate | preserve until M10 cutover |
| M4 Agent IAM | **COMPLETE** | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Audit / Telemetry | **PERSISTENCE VERIFIED / APPLICATION CORRECTIVE VERIFICATION ACTIVE** | COMPLETE | ADR-0056/0059 + M5 Evidence | PR #222 merged; corrected writer must still deploy and prove a real successful privileged audit insert | M5A repository work may continue; autonomous mutation remains blocked |
| M5A Native MFA / AAL2 | **IN PROGRESS** | baseline + runbook ready | ESS-0020 + ADR-0064 + ADR-0003.5 | repo code → CI → explicit Owner production approval → native factor/AAL2/recovery/advisor verification | M6 blocked until VERIFIED PASS |
| M6 Supply Chain Provenance | **BLOCKED BY M5A** | **RUNBOOK READY** | ADR-0060 | SBOM/provenance/attestation bound to exact source/artifact | M7 after M6 VERIFIED PASS |
| M7 Deployment Identity / Platform Mutation | **BLOCKED BY M6** | **RUNBOOK READY** | ADR-0061 | exact target + Owner mutation approval + post-verification/rollback | M8 after all required M7 mutations VERIFIED PASS |
| M8 Agent Cutover | **BLOCKED BY M7** | **RUNBOOK READY** | ADR-0062 + ESS-0019 | provider-neutral profiles + equivalent policy tests + rollback to read-only | M9 after cutover VERIFIED PASS |
| M9 Assurance / Incident / Break-Glass | **BLOCKED BY M8** | **RUNBOOK READY** | ADR-0063 | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | M10 after assurance VERIFIED PASS |
| M10 Passkey-only Owner PR Authorization | **BLOCKED BY M9** | **ESS + RUNBOOK + THREAT MODEL READY** | ADR-0066 + ESS-0022 | exact-state WebAuthn approval, shadow mode, replay/recovery tests, legacy gate cleanup | DevelopmentChain closure after VERIFIED PASS |

**Documentation readiness never authorizes blocked phase execution.**

## Current executable DEVELOPMENT phase — M5A

M5A remains the next repository-development phase. Der verifizierte SA4-Ausführungspfad darf nach Aktivierung von `REM-M5A-REPOSITORY-001` das begrenzte Repository-Code-/Test-Paket ausführen. Externe oder produktive Mutationen bleiben davon ausdrücklich ausgeschlossen; SA5 bleibt bis M10 `VERIFIED PASS` blockiert.

### Goal

Replace the historical application-owned TOTP assurance for privileged identities with authoritative Supabase Native MFA/AAL2 enforcement while retaining purpose-bound application step-up only as defense-in-depth.

### Required sequence

1. architecture/runbook accepted;
2. fresh implementation branch from then-current `main`;
3. native TOTP enroll/challenge/verify integration;
4. centralized server-side AAL2 gate;
5. privileged session/factor lookup fail-closed;
6. recovery/factor reset aligned with native MFA;
7. positive + negative tests;
8. repository CI `VERIFIED PASS`;
9. read-only production precheck;
10. separate explicit Owner mutation approval;
11. native Owner-factor mutation one identity at a time;
12. AAL2 positive/negative/recovery verification;
13. advisor/evidence rerun;
14. Roadmap/Traceability sync.

Mutation boundary:

- repository code: `REQUIRED`;
- Owner Native MFA enrollment: `REQUIRED / NOT YET AUTHORIZED` at baseline;
- Supabase project setting: `CONDITIONAL` only if exact need is proven;
- new Postgres DDL: `NOT REQUIRED`;
- Stripe/Render: `NOT REQUIRED` for M5A.

## M6 — Supply Chain Provenance

Runbook: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`.

Required deliverables:

- deterministic dependency resolution from committed lockfile;
- exact source SHA and lockfile digest;
- machine-readable SBOM;
- source-to-artifact provenance;
- signed/verifiable attestation appropriate to the available hosted build environment;
- artifact digest bound to provenance;
- pinned/least-privilege CI actions;
- vulnerability and supply-chain checks;
- immutable release/rollback reference;
- Evidence under `docs/evidence/m6/`.

No M6 implementation starts before M5A is `VERIFIED PASS`.

## M7 — Deployment Identity and Platform Mutation

Runbook: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`.

Required deliverables:

- exact production deploy identity and trust boundary;
- source/provenance → deployment → runtime identity correlation;
- environment-scoped Render deployment path;
- credential/hook ownership, rotation and revocation;
- exact mutation work order for every external change;
- pre/post health/readiness and rollback verification;
- Stripe/Supabase only when separately named by Authority;
- DNS/TLS/IONOS remains Human/Owner-reserved absent a later stronger ADR.

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

Required:

- ChatGPT, Claude and Google AI Studio transports mapped to the same semantic capability policy;
- no provider-specific direct admin path becomes canonical;
- research/read-only profiles remain mutation-denied;
- negative tests prove provider name/model cannot elevate authority;
- rollback disables mutation/cutover profile and restores read-only operation.

## M9 — Assurance

Runbook: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`.

Exit evidence must cover:

- prompt/tool injection;
- authorization bypass;
- replay/idempotency;
- secret/data exfiltration;
- audit completeness and audit outage;
- mutation kill switch;
- break-glass procedure;
- rollback/recovery drill;
- independent Evidence review;
- no unowned CRITICAL control.

## M10 — Passkey-only Human/Owner PR Authorization

Authorities:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`;
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`;
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`;
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`.

Target sequence:

```text
PR OPEN/UPDATE
→ Human file review / Viewed
→ exact PR-state resolution
→ server-generated single-use WebAuthn challenge
→ Owner passkey assertion with required user verification
→ server verifies RP/origin/credential/signature/UP/UV/state freshness
→ immutable approval evidence
→ exactly one CI request consumes approval
→ build-and-test
→ Human merge
```

Legacy `💪`/`okay` and Owner checkbox authorization remain authoritative until controlled M10 cutover reaches `VERIFIED PASS`.

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

**M5A remains the next DEVELOPMENT Chain repository implementation gate.** M6–M10 documentation is prepared in advance only to remove planning gaps.

Nächster zulässiger Auftrag: Human/Owner prüft dieses Governance-Paket, akzeptiert ESS-0020/ADR-0064 für die Repository-Implementierung und aktiviert danach `REM-M5A-REPOSITORY-001` gegen den exakten aktuellen `main`. Der Systemadministrator darf anschließend das M5A-Code-/Test-Paket über den auditierten SA4-Pfad bis zum Draft-PR ausführen. Native Supabase-Faktor-Enrollments und andere externe Mutationen bleiben ein späterer separater Human-/Owner-Gate.