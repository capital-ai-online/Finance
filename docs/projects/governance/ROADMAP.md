# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@a5026e194e243d556c91e2749da8f405e946c025`  
**Correlation date:** `2026-09-05`  
**Trust root:** `/AGENTS.md`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Status:** ACTIVE

## Navigation

```text
PVC-05 / Platform Director
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ code / tests / evidence
```

`AUTH-*`, `CTRL-*`, registries and work claims support integrity/audit only and do not replace this Human-readable sequence.

## Current-main reconciliation — 2026-09-05

Current `main@a5026e194e243d556c91e2749da8f405e946c025` includes Human-merged PR #755, which registers ADR-0007 under stable Authority ID `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007` as `historical` / non-authorizing in the canonical ADR and Authority registries. The migration preserves the historical ACCEPTED record for traceability but does not re-authorize its pre-PVC Compliance Value Chain, automated certification language, legal-sufficiency claims or cross-owner runtime assumptions.

A later PR #756 attempted additional ADR-0007 archival/path work but was closed unmerged. It is not current Authority and is not an active writer. At the start of `COMP-GAP-003` there are no open PRs against `main`.

Current Compliance mapping explicitly treats ESS-0006 as a bounded component specification and rejects its historical `ComplianceRequirementRegistry` wording as a second normative registry. Current Security and Compliance project surfaces separately establish independent assurance roles with no productive PVC ownership by virtue of being cross-cutting projects.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via Human-merged PR #755. ADR-0007 is canonical historical/non-authorizing registry state; stale legal/certification/parallel-value-chain semantics are not current Authority.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

### Active Governance finding

#### GOV-06 / COMP-GAP-003 — ESS-0006

**State:** `IN EXECUTION — BOUNDED ESS REVALIDATION`

Current facts:

- `.ai/skills/ESS-0006-Security-Compliance.md` v1.0.0 is a published component specification for `src/platform/Security` and `src/platform/Compliance`;
- its v1.0.0 body contains stale central-registry, AuditTrail/RiskRegister, event-list and collaboration assumptions plus the historical `ComplianceRequirementRegistry` concept;
- `CAPITAL-AI-SEC` currently owns cross-cutting Security requirements, findings, testing and independent verification, but no productive PVC by role;
- `CAPITAL-AI-COMP` currently owns applicability, requirements inventory, mapping, evidence-based assessment, findings and Legal Review handoff, but no productive PVC by role;
- canonical Compliance requirement/applicability sources live under `docs/compliance/CAPITAL-AI-COMP/**`; ESS-0006 must not create a second Requirement Registry;
- `src/platform/Security` and `src/platform/Compliance` are reusable/existing technical component boundaries, not a combined productive Security/Compliance runtime plane;
- ADR-0012 confirms internal Compliance scanner/report/certificate semantics are not external or legal certification.

Current bounded implementation on `agent/governance-ess-0006-semantics-20260905`:

1. revalidate the same `ESS-0006` identity as v1.1.0 rather than creating a new ESS;
2. retain `src/platform/Security` and `src/platform/Compliance` as the only directly specified technical components;
3. preserve independent SEC verification and COMP assessment;
4. remove `ComplianceRequirementRegistry`, central Audit/Risk runtime, fixed event list and implicit orchestration as current implementation requirements;
5. state explicitly that internal Evidence/Reports/Certificates do not establish regulatory, legal or external certification;
6. synchronize `.ai/registry/ess-registry.json` to the same version/scope.

**Exit Gate:** stale Security-/Compliance-Semantik von ESS-0006 ist geklärt; dieselbe ESS-Identität und die vorhandenen Komponenten bleiben erhalten; keine zweite Compliance Requirement Registry, keine zweite IAM/Audit/Risk/EventMesh-Authority und keine parallele Security-/Compliance-Runtime entsteht; SEC/COMP-Assurance und fremde produktive PVC-Ownership bleiben getrennt; exact-head Governance/Documentation checks und Human/CODEOWNER-Merge bleiben erforderlich.

### Other states

- `GOV-05` financial technical `VC-*` namespace — `OWNER DECISION REQUIRED / DEFERRED`.
- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`; independent SEC/COMP/Legal evidence remains separate.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`.

## Current priority

1. **COMP-GAP-003 / ESS-0006** — complete bounded v1.1.0 component/assurance revalidation and registry synchronization. Exit gate: semantic boundaries above satisfied on a branch synchronized with current main, exact-snapshot Human PR-create approval, hosted checks, Human/CODEOWNER merge.
2. **POST-ESS-0006 RECORRELATION** — only after Human merge, re-read current main, open PRs, Compliance return state and Governance roadmap before choosing any next GOV work item; no stale queue promotion.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- ADR-0007 remains historical/non-authorizing and cannot regain authority by reference from ESS-0006;
- ESS-0006 is a bounded component specification for existing Security and Compliance components;
- Security requirements/testing/verification remain with CAPITAL-AI-SEC;
- Compliance applicability/requirements/assessment remain with CAPITAL-AI-COMP;
- no second Requirement Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- legal applicability, regulatory status, certification and accepted-risk claims remain outside ESS-0006 authority;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.
