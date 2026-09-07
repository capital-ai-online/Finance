# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.6.2`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-07`  
**Correlation baseline:** `main@75c926f12ae514036aa508ea8faf1a82b1a91059`  
**Open PR baseline:** zero open Pull Requests at final correlation snapshot  
**Known parallel OPS writer:** `agent/operations-legacy-auth-runtime-cleanup-v8-20260907` is diverged (`1 ahead / 6 behind`) and also touches this Roadmap for bounded retired-auth wording; its changes are not imported by this work item.  
**Primary project stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`

Canonical post-PR-#828 correlation evidence: `evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md`.

## 1. Objective and ownership

CAPITAL-AI-OPS is the organizational execution/runtime project for Controlled Implementation, Supervisor, Version, Release, Production and EventMesh/Traceability. Project ownership resolves through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`; CAPITAL-AI-OPS owns PVC-02/04/06/07/08/18.

```text
PVC-02 Controlled Implementation
→ PVC-03 Documentary Engine / CAPITAL-AI-DOC
→ PVC-04 Supervisor
→ PVC-05 Platform Director / CAPITAL-AI-GOV
→ PVC-06 Version Management
→ PVC-07 Release Management
→ PVC-08 Production Operations
→ PVC-18 EventMesh / Traceability
```

## 2. Authority invariants

1. `/AGENTS.md` is the trust root.
2. Accepted ADR/active ESS authority outranks this non-authorizing Roadmap.
3. Governance owns Development lifecycle/protected decisions; OPS owns its mapped execution stages.
4. Security verification remains independent under CAPITAL-AI-SEC and creates no productive PVC ownership.
5. `package.json#version` remains platform-version authority; VersionManager is read-only compatibility.
6. Release does not imply deployment; Production/provider mutations remain separately authorized.
7. Supervisor, EventMesh and Traceability do not create protected decision authority.
8. Pull Request creation and Human/CODEOWNER merge retain their current separate gates.
9. DR-03 must reuse existing ESS-0019/IAM/capability/policy/audit/trace boundaries and must not create a second control plane.

## 3. Current workstreams

| Workstream | PVC | Current state |
|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | ACTIVE; entitlement parent inventory evidence-ready; Stripe redirect implementation complete; qs `6.16.0` remediation `IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL` via PR #828 |
| `OPS-04` Supervisor | `PVC-04` | implementation on main via PR #720; after Security PR #832 repository contract is independently `REPOSITORY_CONTRACT_VERIFIED`; exact post-deploy supervisor/restart/readiness evidence remains open |
| `OPS-06` Version Management | `PVC-06` | P1/HIGH / `BLOCKED_BY_AUTHORITY_CONFLICT`; Accepted ADR-0053 selects Node `24.18.0`, while 24.20.0 supersession remains only proposed |
| `OPS-07` Release Management | `PVC-07` | PARTIAL; release evidence contract correlation open |
| `OPS-08` Production Operations | `PVC-08` | PARTIAL; recovery harness on main via PR #776; RPO evaluator PR #802 closed unmerged, branch absent, evaluator absent from main; scheduled RPO/restore evidence remains open |
| `OPS-18` EventMesh & Traceability | `PVC-18` | PARTIAL; operational reliability/trace coverage open |

## 4. Security handoffs

| Finding | OPS stage | Current disposition |
|---|---|---|
| `S1-R2-03` Node convergence | `PVC-06` | **P1/HIGH / BLOCKED_BY_AUTHORITY_CONFLICT / NON-EXECUTABLE** |
| `S1-R2-04` fatal process | `PVC-04` + `PVC-08` evidence | **IMPLEMENTED_ON_MAIN / REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN** |
| `S1-R2-05` Stripe redirect | `PVC-02` | **IMPLEMENTED_ON_MAIN / EVIDENCE_READY / SECURITY VERIFICATION PENDING** |
| `S1-R2-06` entitlement authority | `PVC-02` parent | **PARENT EVIDENCE_READY / CHILD REMEDIATION REFERRED / SECURITY VERIFICATION PENDING** |
| `S1-R2-07` recovery / RPO / RTO | `PVC-08` | **HIGHEST EXECUTABLE LOCAL OPS SECURITY/DATA-INTEGRITY WORK** |
| `S1-R2-09` strict CSP promotion | `PVC-08` | WAITING_FOR_EVIDENCE |
| `S1-R2-10` billing isolation | `PVC-08` | WAITING_FOR_EVIDENCE |

`S1-R2-11` remains primary `CAPITAL-AI-DATA / PVC-10`.

### 4.1 qs 6.16.0 terminal result

PR #828 (`[CAPITAL-AI-OPS] [ChatGPT] qs 6.16.0 DoS-Remediation`) is merged with merge SHA `fb3fff1f3959d1c6f87d20228036366848600487`; final PR head was `cb44840771aea4f44b8a810bb0e87e613953a735`.

Current main confirms `package.json` override `qs=6.16.0`, synchronized `package-lock.json`, and `tests/unit/qsDosRegression.test.ts`. Final PR-head CI, Governance and Container Security workflows were successful. Render deployed the #828 merge and the current live later main contains the remediation.

**Disposition:** `IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL`. No qs remediation remains executable.

### 4.2 Node authority result

`.nvmrc` remains `24.18.0`. ADR-0053 remains `Accepted` and explicitly chooses Node `24.18.0` for Production, CI and local development. `NODE_TOOLCHAIN_WRITE_BOUNDARY_SUPERSESSION_2026-08-29.md` remains `PROPOSED / IMPLEMENTATION IN BRANCH` and is not effective without its Human-gated lifecycle.

Therefore `OPS-06-SEC-03` is non-executable until effective Governance/ADR authority resolves the baseline.

### 4.3 Recovery/RPO result

PR #776 provides the current-main recovery harness. PR #802 proposed a deterministic RPO evaluator but is `closed` with `merged=false`; `agent/operations-recovery-rpo-evidence-20260907` is absent and `scripts/operations/recoveryRpoEvidence.mjs` is absent from current main.

The former `IMPLEMENTED_BRANCH` projection is retired. The evaluator must be re-intaken from historical #802 evidence onto a fresh then-current-main branch. Scheduled-backup RPO evidence, isolated restore integrity/database-RTO, full-service RTO and independent Security verification remain separate gates.

## 5. Priority execution queue

1. `OPS-08-SEC-07` — **HIGHEST EXECUTABLE OPS SECURITY/DATA-INTEGRITY WORK** — re-intake the bounded deterministic RPO evaluator semantics from closed-unmerged PR #802 on a fresh current-main branch, preserve PR #776 recovery architecture, then obtain exact-head validation. Operational evidence follows separately.
2. `OPS-06-SEC-03` — **P1/HIGH / BLOCKED_BY_AUTHORITY_CONFLICT** — no Node mutation until effective Governance/ADR resolution.
3. `OPS-02-SEC-06` — **PARENT EVIDENCE_READY / RETURN-ONLY** — coordinate foreign child returns and independent Security verification.
4. `OPS-02-SEC-05` — **IMPLEMENTED_ON_MAIN / RETURN-ONLY** — no further OPS code remediation planned.
5. `OPS-08-SEC-09` — WAITING_FOR_EVIDENCE.
6. `OPS-08-SEC-10` — WAITING_FOR_EVIDENCE.
7. `OPS-07-A` — Release evidence contract correlation.
8. `OPS-18-A` — EventMesh/Traceability operational coverage.
9. `DR-03` — **QUEUED / BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE**.
10. reliability/capacity and lower-priority evidence packages.

No Security finding is marked `VERIFIED/CLOSED` by this Roadmap.

## 6. DR-03 correlation

ADR-0060 v1.1.0 remains accepted/active and ESS-0019 v1.2.0 accepted; the former Governance dependency is terminal. DR-03 is nevertheless not the current priority because executable `OPS-08-SEC-07` precedes architecture/integration under the trust-root order.

When promoted, DR-03 must implement only the smallest provider-neutral adapter execution boundary behind existing capability/policy/IAM/audit gates, with fail-closed provider errors and parity evidence. It must not enable remote skill loading, restore a retired authorization mechanism, create a second Agent Control Plane or grant Production mutation.

## 7. Terminal / historical OPS work

| Work item | Repository result | Current disposition |
|---|---|---|
| Alpha Vantage canonical secret/deployment contract | PR #642 merged | DONE_MAIN; Production mutation separate |
| Retired PR-authorization runtime | PR #691 merged | DONE_MAIN / historical only |
| Fatal Process Handling | PR #720 merged; repository contract re-verified by Security PR #832 | IMPLEMENTED_ON_MAIN / REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN |
| R-Class CI cost control | PR #721 merged | DONE_MAIN |
| User Lifecycle OPS closeout | PR #729 merged | DONE_MAIN; provider/Security residuals explicit |
| GOV-03 / DR-02B | PR #743 merged under CAPITAL-AI-GOV | FOREIGN_DEPENDENCY_TERMINAL |
| DR-03 roadmap re-correlation | PR #747 merged | DONE_MAIN |
| Recovery harness | PR #776 merged | IMPLEMENTED_ON_MAIN; operational evidence open |
| GOV-07 OPS evidence return | PR #794 merged | EVIDENCE_READY; broader external gates remain |
| RPO evaluator | PR #802 closed unmerged; branch/code absent from main | **NOT_IMPLEMENTED_ON_MAIN / FRESH_REINTAKE_REQUIRED** |
| qs 6.16.0 DoS remediation | PR #828 merged/deployed; hosted gates successful | **IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL** |

## 8. Validation / Definition of Done

- [x] current `main@75c926f12ae514036aa508ea8faf1a82b1a91059`, trust root, project/PVC mapping and open-PR baseline re-correlated;
- [x] Security PR #832 correlated with no OPS changed-file overlap and its new R2-04 verification state consumed;
- [x] known parallel OPS Roadmap writer disclosed and not silently imported;
- [x] qs #828 verified current-main/deployed/terminal;
- [x] Node authority conflict revalidated and kept fail-closed;
- [x] PR #802 verified closed unmerged; former branch and evaluator absent from current main;
- [x] `OPS-08-SEC-07` selected as highest actually executable local OPS work;
- [x] DR-03 retained behind higher-priority Security/Data-Integrity work;
- [ ] RPO evaluator re-intaken on a fresh current-main implementation branch and exact-head validated;
- [ ] scheduled RPO and restore/RTO evidence collected;
- [ ] applicable independent CAPITAL-AI-SEC verification completed;
- [ ] final main/head/open-writer correlation completed before PR creation;
- [ ] Human/CODEOWNER merge completed separately.

## 9. Protected boundaries

This Roadmap authorizes no PR creation, merge, Release transition, Node supersession, provider mutation, Production mutation or Security closure. Current `/AGENTS.md` controls remain binding.
