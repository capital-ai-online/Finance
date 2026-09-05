# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.3.0  
**Date:** 2026-09-05  
**Current-main reconciliation baseline:** `main@47ea0f5020039d3822286f76954789c2c372257c`  
**Status:** ACTIVE — CANONICAL COMPLIANCE ASSESSMENT ROADMAP / NON-AUTHORIZING  
**Primary Project Value Chain ownership:** none (`[]`)

## Vision

CAPITAL-AI soll regulatorische, vertragliche und intern verbindliche Compliance-Anforderungen nachvollziehbar, evidenzbasiert und entlang der bestehenden Eigentümerstruktur behandeln können — ohne unbelegte Compliance- oder Zertifizierungsbehauptungen und ohne parallele Governance-, Security-, Quality- oder Runtime-Architektur.

## Mission

`CAPITAL-AI-COMP` identifiziert anwendbare Anforderungen, ordnet sie bestehenden Controls, ADR/ESS und Primary Ownern zu, bewertet aktuelle Evidence auf `main`, dokumentiert Findings und Evidence-Gaps und übergibt rechtliche Entscheidungen an Human/Legal Review sowie technische Remediation an den jeweiligen Primary Owner. Compliance implementiert keine fremde technische Remediation und ersetzt keine Legal Review.

## Roadmap target

Ein `main`-verifizierter, revisionsfähiger Compliance-Status über die kanonischen Projekt-Roadmaps: Jede Compliance-relevante Aktion ist mit Quelle, Applicability, Assessment-Status, Evidence, betroffenem `PVC-*`, Primary Owner und — falls erforderlich — Owner-Routing oder Legal Review verbunden. `UNKNOWN`, `NOT_ASSESSED` und `EVIDENCE_MISSING` bleiben explizit; ein Roadmap-, PR- oder Dateieintrag allein ist niemals ein Compliance-PASS.

## Purpose

`CAPITAL-AI-COMP` assesses applicability, requirements, evidence and compliance findings. It does not own productive PVC stages and does not implement foreign technical remediation.

Human-readable routing is:

```text
Requirement / Finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Compliance reassessment
```

Machine-readable findings and historical handoff records support traceability only; they do not create a second project-routing architecture. Current project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

Historical references to withdrawn post-PVC routing overlays, including `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`, are non-current and must not be restored or used as authority.

## Current-main reconciliation — 2026-09-05

### Scope and method

This reconciliation uses the current repository model rather than the stale 2026-08-31 snapshot as status authority:

1. `/AGENTS.md` v2.7.0 and current `main` are the execution trust baseline.
2. All twelve canonical `docs/projects/*/ROADMAP.md` project roadmaps were re-read.
3. `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` is used only as derived navigation; project status remains in each canonical project roadmap.
4. Detailed/historical roadmaps such as the DSGVO and S1 Security roadmaps are evidence/context sources and do not override current project status.
5. Existing Compliance inventory, cross-roadmap matrix, handoff register and reports remain historical/current-supporting evidence where still accurate, but their `main@5d3360c2` baseline is stale and is not treated as current proof.
6. Open PRs are correlated but never treated as merged `main` evidence.
7. NIST publications/frameworks are withdrawn from the current repository Governance baseline by current `/AGENTS.md`; historical or foreign-project references are non-authorizing unless a future explicit Human/Owner decision adopts a specific source/version/scope.

### Repository-visible chat / implementation reconciliation

Arbitrary ChatGPT conversation history is not a repository authority. Repository-visible PR, claim and current-main evidence is therefore used to verify previously executed chat-governed work.

| Item | Current-main result | Compliance interpretation |
|---|---|---|
| PR #627 — CAPITAL-AI-COMP V2 consolidation | `MERGED` and Compliance package exists on current `main` | `DONE_ON_MAIN`; no certification/compliance conclusion implied |
| PR #652 — canonical `docs/projects/compliance/` surface | `MERGED`; project surface exists | `DONE_ON_MAIN` |
| former `CAPITAL-AI-COMP-PROJECT-SURFACE-2026-09-01` claim | `released`, `exclusive=false`, `activeWriter=false`, `lifecycle=archived` | `DONE_ON_MAIN`; no active COMP writer inherited from that work |
| historical dependency on `CROSS_PROJECT_HANDOFF_CONTRACT.md` | withdrawn by current `/AGENTS.md` | `SUPERSEDED_BY_CURRENT_AUTHORITY`; must not be reintroduced |
| PR #730 — DATA realtime newsfeed entitlement remediation | `MERGED` on current `main` ancestry | `IMPLEMENTED_ON_MAIN`; independent Security/Compliance verification remains separate and is not inferred from merge |
| PR #733 — Governance NIST-binding withdrawal | `MERGED` as current `main` HEAD | `DONE_ON_MAIN`; current Compliance mapping must not create NIST-derived repository requirements/findings/gates merely from historical references |

### Canonical project-roadmap compliance scan

| Canonical project roadmap | Compliance-relevant current-main action | Current assessment / disposition |
|---|---|---|
| `agent-client/ROADMAP.md` | request/identity/capability/security contract remains fail-closed; physical runtime remains deferred | `MONITOR`; old generic VC-01 Compliance routing is not evidence of a current client runtime defect |
| `operations/ROADMAP.md` | Security remediation/evidence queue, especially entitlement coordination and measured recovery evidence | `OPEN`; owner remains `CAPITAL-AI-OPS` for affected OPS PVC stages; Security verification remains independent |
| `documentary/ROADMAP.md` | document lifecycle/registry consistency where Compliance evidence documents are affected | `OPEN` only where a concrete registry/lifecycle gap is proven; no foreign Documentary implementation in COMP |
| `governance/ROADMAP.md` | GOV-06 Security/Compliance governance findings; authority/control remediation only in GOV scope | `OPEN / CONTINUOUS`; unsupported legal/compliance claims remain prohibited; current NIST Governance bindings are withdrawn by `/AGENTS.md` v2.7.0 |
| `data/ROADMAP.md` | evidence identity, freshness, DQ and Security-return evidence | `ACTIVE`; PR #730 is merged implementation evidence for the realtime-newsfeed entitlement child, but Security verification is still separate |
| `fintech/ROADMAP.md` | FIN-SEC-02 / FIN-SEC-03 entitlement children; decision-support / AI-use boundaries | `OPEN`; technical work remains FINTECH-owned; legal role/use-case classification remains separate Legal Review where triggered |
| `quality-management/ROADMAP.md` | independent Quality evidence/findings only | project surface now exists, resolving the old “QM project template absent” observation; QM activation remains subject to its own proposed ADR/gates |
| `security/ROADMAP.md` | independent Security finding/evidence lifecycle | `ACTIVE`; Security can verify Security findings but does not create Compliance closure automatically |
| `frontend/ROADMAP.md` | user-facing privacy/transparency and authoritative-domain projection | `CONTINUOUS`; reassess only on material user-facing processing/transparency changes |
| `seo/ROADMAP.md` | marketing/compliance applicability, public claims, consent/provider/output evidence | `CONTINUOUS`; no current legal conclusion inferred from SEO status |
| `social-media/ROADMAP.md` | marketing/social compliance applicability and publication boundaries | `CONTINUOUS`; publication/platform authority remains separate |
| `compliance/ROADMAP.md` | applicability, mapping, findings, evidence, Legal Review handoff and owner routing | `ACTIVE`; this detailed roadmap is the canonical Compliance assessment work surface |

## Current Compliance finding delta against `main`

The rows below are the current roadmap-level disposition of previously recorded Compliance gaps. Supporting reports remain evidence snapshots and are not silently rewritten.

| Finding / action | Current-main evidence | Current assessment | Owner / routing | Next gate |
|---|---|---|---|---|
| `COMP-GAP-001` — QM project template absent | `docs/projects/quality-management/ROADMAP.md` now exists | `SUPERSEDED / SURFACE GAP RESOLVED` | `CAPITAL-AI-QM` remains cross-cutting; activation is separately governed | no Compliance remediation; do not infer ADR-0103 acceptance |
| `COMP-GAP-002` — ADR-0007 lifecycle / semantic ambiguity | current `docs/adr/registry.json` still has no migrated ADR-0007 record | `PARTIALLY_COMPLIANT / OPEN` | `CAPITAL-AI-GOV / PVC-05`; `[COMPLIANCE_HANDOFF -> CAPITAL-AI-GOV | VC-05]` is coordination metadata only | Governance decides clarify/migrate/supersede/archive; COMP reassesses returned evidence |
| `COMP-GAP-003` — ESS-0006 stale assumptions | `.ai/skills/ESS-0006-Security-Compliance.md` remains v1.0.0 and still contains legacy references/content assumptions | `PARTIALLY_COMPLIANT / OPEN` | `CAPITAL-AI-GOV / PVC-05`; `[COMPLIANCE_HANDOFF -> CAPITAL-AI-GOV | VC-05]` | GOV/ESS owner updates only if separately authorized; no second Requirement Registry |
| `COMP-GAP-004` — vendor / transfer evidence incomplete | historical DSGVO remediation explicitly leaves DPA/SCC/TIA/role/region evidence incomplete | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus actual provider/domain owner; target technical project is `REQUIRES_CORRELATION` per active provider | identify actual active provider, role, transfer and contractual evidence; no guessed legal conclusion |
| `COMP-GAP-005` — human AI-literacy evidence absent | control/specification exists; no current Human training/ack evidence established by this reconciliation | `EVIDENCE_MISSING` | Human/Owner; Legal Review where obligation interpretation is required | establish applicability and real organizational evidence; no fabricated completion |
| `COMP-GAP-006` — DORA entity scope unresolved | current repository evidence does not establish regulated-entity/business scope | `NOT_ASSESSED / LEGAL_REVIEW` | Human/Legal | determine applicability from actual legal entity/business/service facts |
| `COMP-GAP-007` — measured backup/restore evidence | `CAPITAL-AI-OPS` roadmap keeps `OPS-08-SEC-07` / S1-R2-07 open | `EVIDENCE_MISSING / OPEN` | `CAPITAL-AI-OPS / PVC-08`; `[COMPLIANCE_HANDOFF -> CAPITAL-AI-OPS | VC-08]` | approved RPO/RTO plus recurring off-site backup and isolated measured restore evidence; independent Security verification |
| `COMP-GAP-008` — Compliance document-registry treatment | current search does not establish persisted registry entries for the new Compliance `DOC-*` set | `PARTIALLY_COMPLIANT / OPEN` | Documentary/Governance ownership boundary must be correlated before mutation; `REQUIRES_CORRELATION` | decide whether registry entries are required and which current Primary Owner performs the change |
| S1-R2-06 DATA child — `realtime_ai_newsfeed` entitlement | PR #730 merged on current `main`; server-side verified identity/subscription gate implemented | `IMPLEMENTED_ON_MAIN / VERIFICATION_PENDING` | `CAPITAL-AI-DATA / PVC-09`; Security remains independent verifier | exact current evidence + Security return; Compliance reassessment only after evidence is available |
| S1-R2-06 FINTECH child — verified screening | FINTECH roadmap: `FIN-SEC-02` remains `REFERRED_NOT_EXECUTED / P1 HIGH` | `OPEN` | `CAPITAL-AI-FINTECH / PVC-16`; `[COMPLIANCE_HANDOFF -> CAPITAL-AI-FINTECH | VC-16]` | owner implementation/evidence, then Security verification and Compliance reassessment where applicable |
| S1-R2-06 FINTECH child — financial analysis | FINTECH roadmap: `FIN-SEC-03` remains `REFERRED_NOT_EXECUTED / P1 HIGH` | `OPEN` | `CAPITAL-AI-FINTECH / PVC-15`; `[COMPLIANCE_HANDOFF -> CAPITAL-AI-FINTECH | VC-15]` | owner implementation/evidence; FE integration only after authoritative FINTECH contract; independent verification |
| SEO / Social / Frontend transparency and marketing applicability | canonical roadmaps explicitly preserve Compliance/Legal separation | `CONTINUOUS / NOT_ASSESSED UNTIL MATERIAL CHANGE` | source-domain project + COMP assessment; Human/Legal when legal interpretation is required | trigger COMP-08 on material consent/provider/claim/output/purpose/user/market change |
| AI / scoring legal role and decision-support classification | FINTECH/scoring boundaries exist; high-risk or regulated legal role is not established by repository engineering evidence alone | `NOT_ASSESSED / LEGAL_REVIEW WHEN TRIGGERED` | Human/Legal + `CAPITAL-AI-FINTECH / PVC-17` for any technical remediation | classify actual use case, users and decision context before any legal conclusion |

## Open-PR correlation — not current-main evidence

At this reconciliation snapshot the following open PRs are semantically relevant but do not modify the Compliance roadmap file and are not treated as merged evidence:

- **PR #732 / CAPITAL-AI-DATA:** proposes a canonical validated DATA exit/evidence contract. It may improve future Compliance evidence quality after merge; no current-main completion is claimed now.
- **PR #728 / CAPITAL-AI-FINTECH:** adds research-only SEC filing evidence/feature foundations. A merge would constitute a material data-source/evidence change for `COMP-08` reassessment, but no current compliance conclusion or productive model promotion is inferred while the PR is open.

## Compliance-owned workstreams

| WP | Workstream | State | Current priority |
|---|---|---|---|
| `COMP-01` | Applicability | ACTIVE | Legal Review for DORA/AI role and provider/transfer scope |
| `COMP-02` | Requirements | ACTIVE | retain source-backed requirements; remove NIST-derived Governance requirement semantics unless separately re-adopted |
| `COMP-03` | Control Mapping | ACTIVE | re-correlate ADR-0007 / ESS-0006 and current owner mappings without creating new authority |
| `COMP-04` | Assessment / Verification | ACTIVE | re-assess returned Security/DATA/OPS/FINTECH evidence only after exact evidence exists |
| `COMP-05` | Findings | ACTIVE | keep open gaps explicit; no silent closure from merge alone |
| `COMP-06` | Evidence | ACTIVE | refresh stale 2026-08-31 supporting snapshots in later bounded COMP work if needed |
| `COMP-07` | Remediation assignment to Primary Owner | ACTIVE | route only to current Primary Owner; unresolved owner remains `REQUIRES_CORRELATION` |
| `COMP-08` | Continuous Compliance | ACTIVE | watch material provider/data/model/market/user/purpose/deployment/content changes |

## Authority boundary

Compliance consumes:

1. applicable binding obligations after competent applicability determination;
2. explicit Human/Owner decisions and effective accepted ADRs;
3. `/AGENTS.md`, Governance controls and active ESS;
4. the affected project Roadmap;
5. implementation/runtime evidence.

External standards and regulations do not become repository architecture authority merely because they are mapped here.

## Evidence model

Preferred evidence order:

1. runtime/provider evidence bound to identity/time/scope;
2. code/configuration/database policy state;
3. independent hosted CI on the exact **PR head SHA**;
4. registry/control evidence;
5. approved documentation;
6. roadmap claims.

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`.

Historical evidence remains history and is not automatic current proof.

Assessment statuses:

`COMPLIANT`, `PARTIALLY_COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_ASSESSED`, `EVIDENCE_MISSING`.

`COMPLIANT` is used only when sufficient current scoped evidence exists.

## Finding lifecycle

```text
DISCOVERED
→ TRIAGED
→ APPLICABILITY_CONFIRMED
→ GAP_CONFIRMED
→ REMEDIATION_ASSIGNED
→ IMPLEMENTED
→ EVIDENCE_READY
→ VERIFIED
→ CLOSED
```

Alternate terminal states: `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED`.

Technical remediation is performed by the Primary Owner identified through the Project Value Chain and target project Roadmap. Compliance consumes returned evidence and reassesses independently.

## Traceability

```text
Requirement Source
↔ Applicability
↔ existing AUTH / CTRL
↔ applicable ADR / ESS
↔ affected PVC / Primary Owner
↔ target project Roadmap
↔ Implementation
↔ Evidence
↔ Compliance Assessment
↔ Finding / Verification
```

Existing matrices/registers under this Compliance project remain non-authorizing projections.

## Regulatory / standards treatment

- GDPR / DSGVO: applicability based on actual personal-data scope; bounded legal interpretation.
- EU AI Act: role/use-case dependent; high-risk scope is not inferred.
- DORA: requires legal/entity-scope review where applicability is uncertain.
- ISO/IEC 42001:2023 is the current repository Governance design benchmark under `/AGENTS.md`; alignment remains non-certifying and does not establish legal applicability.
- NIST publications/frameworks/profiles/mappings are withdrawn from the current repository Governance baseline. Historical or foreign-project references are traceability/context only and must not by themselves create a repository requirement, gate, Compliance finding, remediation backlog or authority claim.
- ISO/IEC 27001, OWASP, CIS and other external standards/guidance remain benchmark/control-source input only where separately adopted or relevant to a bounded assessment; they do not create repository authority by citation alone.

No certification or complete legal-compliance claim is created by engineering alignment alone.

## Continuous Compliance

Material changes to features, AI models, data sources, providers, markets, countries, user types, processing purposes, deployment models, public claims/content or external integrations trigger reassessment through COMP-08.

Continuous Compliance reuses repository/runtime/evidence capabilities and does not create a second runtime orchestrator.

## Validation and exit criteria

Compliance work is complete for a finding only when:

- applicability is explicit;
- affected PVC / Primary Owner is identified, or unresolved ownership is explicitly `REQUIRES_CORRELATION` before technical work;
- applicable ADR/ESS/control references are known where relevant;
- evidence gaps remain explicit;
- foreign technical remediation is performed by its owner;
- independent Compliance reassessment is complete;
- Legal Review is completed by the competent Human/Legal authority where required;
- no unsupported certification/legal claim is introduced.

For this documentation-only roadmap synchronization, runtime build/lint claims are not fabricated. Repository documentation/governance checks remain required where applicable before PR readiness; hosted checks after PR creation remain authoritative for merge readiness.

PR creation for Compliance-owned repository changes still requires the current Human/Owner gate bound to `main SHA` + `branch head SHA`; merge remains Human/CODEOWNER-only.
