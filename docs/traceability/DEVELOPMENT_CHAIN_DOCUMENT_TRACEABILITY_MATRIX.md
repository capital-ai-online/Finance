# DEVELOPMENT Chain Document Traceability Matrix

Status: PROPOSED
Date: 2026-08-19
M10 closure baseline: `main@2d8e482174e97601d4343249e50d208ccf6f6355`

## Zweck

Diese Matrix zeigt für jeden DEVELOPMENT Chain Roadmap-Punkt die normative Authority, Ausführungsdokumente, Machine Contracts, Evidence, Mutation State und das Exit Gate. Sie ergänzt die bestehende `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` um die Dokument-/Handoff-Ebene.

## Cross-cutting Controls

| Control | Authority / Artifact | Zweck |
|---|---|---|
| DEVELOPMENT Chain Execution | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | kanonische Ausführungs- und Mutationsreihenfolge |
| Branch / Clone Lifecycle | `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md` | fresh branch, Human merge, branch delete, clone/worktree cleanup |
| Responsibilities | `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md` | Owner / Dev / Prod / Executor / CI Trennung |
| PR Check Classes | `docs/governance/PR_CHECK_CLASSIFICATION.md` | D/C/R/M Validation Scope |
| Human Owner Approval | `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md` + ADR-0066/ESS-0022 | Human Merge remains separate; expensive PR CI uses exact-state Owner Passkey authorization under M10 |
| Autonomous Agent Concept Gate | `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | privileged agent prerequisites |
| Mutation Handoff | `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` | nicht autorisierende Work Order |
| Mutation Handoff Schema | `.ai/contracts/development-chain-mutation-handoff.schema.json` | machine validation |
| Generic Phase Runbook | `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md` | wiederholbarer Ablauf |
| Generic Evidence Template | `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md` | Mindest-Evidence pro Phase |

## Phase Matrix

| Phase | Execution State | Primary Authority | Execution / Risk Documents | Machine Contract / Implementation | Evidence | Mutation State | Exit Gate |
|---|---|---|---|---|---|---|---|
| M0 | COMPLETE | M0 evidence baseline | `docs/evidence/m0/*` | read-only | M0 Evidence | `NOT REQUIRED` | baseline preserved |
| M1 | COMPLETE | Git Guardrails / Owner Policy | PR governance / CODEOWNERS / protection | GitHub policy | guardrail evidence | repository governance only | protected main preserved |
| M2 | COMPLETE | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | architecture contracts | M2 Evidence | `NOT REQUIRED` | Documentation Freeze complete |
| M3 | COMPLETE | ADR-0053 + ADR-0060 | CI / PR Check Classification | `.github/workflows/ci.yml`; pre-M10 automatic expensive PR path retired by M10 | M3 Evidence + M10 closure | repository workflow | M10 exact-state gate preserved |
| M4 | COMPLETE | ADR-0058 + ESS-0018/0019 | IAM / risk / capability models | Agent IAM / PolicyGate | M4 Evidence | `NOT REQUIRED` external | negative IAM PASS |
| M5 | **VERIFIED PASS** | ADR-0056 + ADR-0059 | M5 Evidence + PR #222 corrective contract | `public.agent_audit_events`, `server/agentAudit/*` | `docs/evidence/m5/*` | schema `VERIFIED`; app runtime verification pending | real privileged audit insert PASS required before autonomous mutation reliance |
| M5A | **VERIFIED PASS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` + `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` | Native Supabase MFA/AAL2 code (direkt implementiert, `REM-M5A-REPOSITORY-001` bleibt `DRAFT`/nicht aktiviert) | `docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md` | repo `MERGED`; beide Owner-Profile mit verifiziertem nativen Faktor + `aal2`-Session read-only bestätigt | erreicht — M6 unblocked |
| M6 | **VERIFIED PASS** | ADR-0060 | `AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` | SBOM/provenance/attestation outputs implemented, `supply-chain-attestation` CI job merged (push+main only); first real push run found `actions/attest-build-provenance` blocked for user-owned private repos, fixed with cosign keyless signing (Sigstore Fulcio/Rekor); second real push run (`31834114193`) signed and, in the same run, verified the signature against the exact expected certificate identity and OIDC issuer | `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md` | `MERGED, VERIFIED ON HOSTED BUILD PATH` | source→artifact→attestation trace VERIFIED PASS — met |
| M7 | **COMPLETE / VERIFIED PASS** (2026-08-14) | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | read-only Render preflight done; provenance-gated deploy merged and confirmed on a real push; `verify-deployment-identity` CI job failed its first real run (JSON-body-only read, production identity is header-only), root cause found and fixed, second real push run confirmed it end-to-end against the live Render deploy; Owner performed a real deploy-hook rotation, independently confirmed via GitHub Actions log, Render deploy history, and verify-deployment-identity PASS; Owner performed a real Render Dashboard rollback to a prior deploy plus its roll-forward to current `main` (via merge of PR #277), both independently confirmed (GitHub Actions log, Render deploy history, verify-deployment-identity PASS); all 10 Required Negative Tests now have a concrete, automated, passing test (`docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md`) | `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`, `docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`, `docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md`, `docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md` | `MERGED, ALL REQUIRED MUTATIONS VERIFIED PASS, ALL 9 EXIT GATE CRITERIA MET (docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md "Exit Gate Closure")` | all required platform mutations VERIFIED PASS — met |
| M8 | **COMPLETE / VERIFIED PASS** (2026-08-16, all 9 Exit Gate items PASS) | ADR-0062 + ESS-0019 | Provider Profile Contract + `docs/runbooks/M8_AGENT_CUTOVER.md` | Provider Registry/Policy-Equivalence verified; live SA3B/SA4 caller wired; rollback-to-read-only verified; PR #308 binds request/trace/session correlation plus provider/model/tool attribution across authorization and outcome with tamper/missing-identity DENY tests; full repository-wide router-mount audit confirmed Exit-Gate-Punkt 4 / Cutover-Sequenz-Punkt 6 vacuously satisfied; `externalHostConfigurationVerified` for `chatgpt-github-connector` verified read-only 2026-08-16 → READY on all 6 fields; Exit-Gate-Punkt 2 closed under Owner-accepted scope decision (2026-08-16) — supported privileged providers = mutating providers with a production host (`chatgpt-github-connector` only); canonical provider set corrected 2026-08-16 (PR #365) to ChatGPT/Claude/Grok — `claude-code-cli` and `grok-xai-connector` both structurally BLOCKED, explicitly not supported privileged paths; `google-ai-studio`/`notebooklm`/`gemini` now RETIRED (DENY) | `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`; `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`; `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`; `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`; `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`; `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`; `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` | `PR #308 MERGED; POINT 7 VERIFIED PASS; POINT 4 VERIFIED PASS; POINT 2 OWNER_ACCEPTED 2026-08-16; M8 CLOSED — M9 unblocked, each drill separately Owner-authorized` | equivalent provider policy + rollback + audit correlation + bypass-route-audit + external-host-config + Exit-Gate-2 scope decision — all VERIFIED PASS |
| M9 | **COMPLETE / VERIFIED PASS** | ADR-0063 + M9 closure scope decision | `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | kill-switch / audit / recovery controls | `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md` | closure evidence verified | M10 prerequisite satisfied |
| M10 | **COMPLETE / VERIFIED PASS** | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | trusted PR resolver + WebAuthn exact-state approval + atomic CI consumption + exact-head `workflow_dispatch` + GitHub Actions OIDC + single-use workflow gate | `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`; Phase-6/Cutover evidence; closed live-assurance PR #431 | `MERGED/DEPLOYED CONTROLLED CUTOVER; LIVE EXIT MATRIX VERIFIED PASS` | passkey-only CI gate VERIFIED PASS; legacy auth absent; Human Merge separate |

## Requirement-to-Evidence Rules

### Repository change

```text
Roadmap Item
→ Authority Ref
→ Branch
→ Commit / PR Head
→ Human Review
→ Required CI
→ Human Merge
→ Merge SHA
→ Branch Deleted
```

### External platform mutation

```text
Mutation Requirement
→ Exact Target
→ Pre-Mutation Check
→ Human Mutation Approval Evidence
→ Handoff Contract ID
→ REM / IAM / Execution Host Decision
→ Authorization Audit Reference
→ Side Effect
→ Outcome Audit Reference
→ Post-Mutation Positive/Negative Verification
→ Rollback State
→ Final Mutation State
```

## Documentation Readiness vs Execution State

- **Documentation Ready** — Planungs-/Runbook-Artefakte vorhanden;
- **Execution Unblocked** — Vorgänger-Exit-Gate erfüllt;
- **Mutation Approved** — separate Owner-Mutation-Autorisierung vorhanden;
- **Verified Pass** — tatsächliche Ausführung und Verifikation abgeschlossen.

`Documentation Ready` ist weder `Mutation Approved` noch `Verified Pass`.

## M5 / SA4 verified execution trace

The M5 persistence and application writer path, the SA3B GitHub-Actions/OIDC execution host and the SA4 policy-validation pilot are recorded as **COMPLETE / VERIFIED PASS** in the canonical Systemadmin roadmap and traceability matrix.

The Development Chain therefore records:

- M5 production schema/persistence and application writer: **VERIFIED PASS**;
- SA3B execution host: **COMPLETE / VERIFIED PASS**;
- SA4 policy-validation pilot: **COMPLETE / VERIFIED PASS**;
- SA5 external production mutation: **M10 prerequisite satisfied, but no mutation authority is implied**; SA5 still requires separate accepted design/authority and explicit Human/Owner mutation approval.

## M5A Systemadmin Repository Package Trace

The bounded Systemadmin M5A repository package remains governed under:

- work package: `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md`;
- mandate: `.ai/mandates/REM-M5A-REPOSITORY-001.json`;
- authorities: ESS-0020 and ADR-0064.

M10 closure does not widen that package or any Systemadmin mandate. Production mutations remain separately gated.

## M10 closure trace

Canonical M10 chain:

```text
ADR-0066 / ESS-0022
→ Phase 1 trusted PR state
→ Phase 2 short-lived challenge
→ Phase 3 Owner credential
→ Phase 4 WebAuthn assertion verification
→ Phase 5 atomic exact-head consumption
→ Phase 6 Shadow / negatives / recovery VERIFIED PASS
→ Controlled-Cutover PR #429 Human merge + production deploy
→ Post-cutover PR #431 ordinary-event DENY
→ exact-head Owner approvals
→ one OIDC-gated CI consumption per approved head
→ duplicate/replay DENY
→ stale-state isolation
→ fresh recovery
→ durable M5 audit correlation
→ M10_CLOSURE_EVIDENCE_2026-08-19.md
→ COMPLETE / VERIFIED PASS
```

The Controlled-Cutover implementation branch is absent after Human merge. The M10 closure branch must be deleted after its Human merge according to the Branch Lifecycle Policy.

## Branch Closure Trace

Every merged repository work item needs `branchDeleted=true` or equivalent Evidence. Cloned repositories/worktrees are cleaned after required Evidence retention. Merged or superseded branches are never reused for new work.

## Mutation State Vocabulary

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

## Closure

A DEVELOPMENT Chain Roadmap item is closed only when Authority, implementation/Handoff, tests, Evidence, mutation state, Roadmap, Branch Lifecycle and Traceability are consistent and the Next Gate is explicit.

For M10, these closure conditions are satisfied by the Human-merged/deployed Controlled Cutover, the production live assurance matrix and this synchronized closure work package. Any future SA5/external mutation is a new separately authorized work package; M10 completion is a prerequisite fact, not mutation authority.
