# CAPITAL-AI Compliance Evidence Report

**Document ID:** `DOC-COMP-EVIDENCE-REPORT-2026-08-31`  
**Role:** evidence assessment / non-authorizing  
**Version:** 1.1.0  
**Baseline:** `main@5d3360c21ee51771495aab734ba81c2bdfd3d08b`

## Evidence principle

Compliance conclusions follow this preference order:

```text
Runtime / Provider Evidence
→ Code / Configuration
→ Hosted CI Evidence
→ Registry / Control Evidence
→ Signed / Approved Documentation
→ Roadmap Claims
```

A lower-level claim does not override contradictory higher-quality current evidence. Historical evidence is retained but does not automatically establish current state.

## Evidence sources reused

| Source class | Existing source | Use in Compliance | Limitation |
|---|---|---|---|
| Agent Client / VC-01 | `docs/projects/agent-client/**` | current Primary-Owner, request/identity/capability/response/UX/security-contract evidence for VC-01 | project roadmap is non-authorizing; downstream Security/Privacy/IAM/AI evidence remains separate |
| Runtime compliance | `src/platform/Compliance/**`, persisted runs/reports where available | technical control/evidence input | internal scanner is not legal/certification audit |
| Security | S1 roadmap and `docs/evidence/security/**` | security-control and assurance evidence, including VC-01 source evidence | S1 evidence does not create parallel VC-01 ownership; confirmed client implementation gaps route to CAPITAL-AI-CLIENT |
| Privacy/vendor | `docs/compliance/privacy/**`, `docs/compliance/legal/**`, `docs/compliance/vendor-evidence/**` | GDPR/privacy/vendor applicability and evidence | contract/transfer universe incomplete; VC-01 client implementation remains CAPITAL-AI-CLIENT-owned |
| AI | AI inventory, AI literacy control, transparency contracts/evidence | role/use-case/transparency/literacy assessment input | legal role and human evidence incomplete; client implementation owner remains stage-specific |
| Governance | Authority Registry, Control Catalog, ADR/ESS registries, AGENTS | authority/control/lifecycle evidence | governance evidence is not technical execution proof |
| Development/CI | GitHub branch/PR/hosted CI evidence | branch/review/approval/build evidence | final-head hosted evidence exists only after PR |
| Documentary | document registry, lifecycle policy, Documentary evidence | record identity/lifecycle/provenance | new project registry treatment is assigned to GOV-DOC rather than executed here |
| Data/Scoring | provider/data/scoring roadmaps, ADRs and evidence packs | provenance, integrity, decision-boundary evidence | end-to-end VC assessment not complete for every stage |
| Release/Operations | release/runbooks/deployment identity/restore evidence | release, deploy, rollback, continuity assessment | measured restore evidence explicitly missing in S1-R2-07 |
| ISO 27001 SoA | `docs/compliance/ISO27001_STATEMENT_OF_APPLICABILITY.md` | dated benchmark evidence only | 2026-08-01 snapshot; not certification/current proof |

## Requirement assessment distribution

From the 36 project requirement/assessment inputs:

- `COMPLIANT`: **0** — deliberately not asserted by this consolidation without complete scoped verification;
- `PARTIALLY_COMPLIANT`: **15**;
- `NON_COMPLIANT`: **0** directly established by the consolidated requirement matrix;
- `NOT_APPLICABLE`: **5** — external standards as binding repository authority only; retained as benchmarks;
- `NOT_ASSESSED`: **11**;
- `EVIDENCE_MISSING`: **5**.

These figures are assessment states, not certification or legal-compliance percentages.

## Material evidence gaps

1. **Vendor/transfer evidence** — REQ-COMP-017: partial evidence only; handoff to Privacy/Legal/Owner.
2. **AI literacy human evidence** — REQ-COMP-021: specification exists; human evidence absent. This is organizational evidence, not VC-01 code ownership.
3. **DORA entity scope evidence** — REQ-COMP-022: legal/business scope unresolved; `NOT_ASSESSED`/Legal Review.
4. **Measured restore/continuity evidence** — REQ-COMP-032: S1-R2-07 open/unverified.
5. **Final PR/CI evidence** — REQ-COMP-005/006: intentionally absent before exact-snapshot Owner PR approval/PR creation.
6. **Current end-to-end VC evidence** — REQ-COMP-034 and REQ-COMP-033 remain incomplete across some stages.

## Evidence completeness reporting

For the consolidated matrix:

- **Evidence complete:** 0 requirements are intentionally promoted to full `COMPLIANT` by this package.
- **Evidence partial:** 15 requirements have relevant but incomplete current evidence (`PARTIALLY_COMPLIANT`).
- **Evidence missing:** 5 requirements explicitly require missing evidence.
- **Not assessed:** 11 requirements are awaiting final lifecycle evidence, legal/applicability decisions or end-to-end verification.

## Foreign evidence rule

Where the evidence must be produced by another domain, Compliance creates/maintains a `COMP-07` handoff. It does not execute the source-domain test, production mutation, security hardening, data remediation or organizational/legal act itself.

For `VC-01`, confirmed technical remediation targets `CAPITAL-AI-CLIENT`; source-domain evidence such as S1, Privacy, IAM, SEO-GM, Frontend or AI remains evidence context and does not transfer Primary Ownership.
