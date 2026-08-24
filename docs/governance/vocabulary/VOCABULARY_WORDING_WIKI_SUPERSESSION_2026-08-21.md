# CAPITAL-AI Vocabulary / Wording / Wiki Supersession

**Document ID:** `DOC-GOV-VOC-WORDING-WIKI-SUPERSESSION-2026-08-21`  
**Supersession ID:** `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001`  
**Status:** EFFECTIVE ON MAIN — merged via PR #477  
**Version:** 1.5.0  
**Date:** 2026-08-21  
**Authority:** Owner chat priority 2026-08-21 + `ESS-0017` / `ESS-0017-CONTRACTS` + `GOV-AUTH-SUPERSESSION-0001`

## 1. Stable authority IDs

| Role | Stable authority / artifact | Lifecycle | Treatment |
|---|---|---|---|
| Vocabulary Governance | `AUTH-ESS-VOCABULARY-GOVERNANCE` / ESS-0017 | proposed | remains terminology authority |
| Vocabulary ADR | ADR-0078 | proposed | current display ID; ADR-0046 is historical alias |
| Supersession Policy | `AUTH-GOV-SUPERSESSION-POLICY` | active | controls supersession semantics |
| Financial Value Chain | `SC-MD-SPT-0001` | active parent authority | read-only referenced |
| Documentary | ESS-0010 | existing authority | projection consumer/handoff |
| Knowledge | ESS-0009 | existing authority | single Knowledge architecture |
| Traceability | ESS-0011 | existing authority | single Traceability architecture |
| EventMesh | ESS-0013 | existing authority | single Event infrastructure |

## 2. Source artifacts being superseded as current-state sources

The following phase/migration artifacts remain historical Evidence but ceased to be current architecture/status authorities when PR #477 was human-merged:

- `docs/architecture/VOCABULARY_GOVERNANCE_MIGRATION_ROADMAP.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_1_5_BASELINE.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_2_IMPLEMENTATION.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_3_SAFE_RENAME_GATE.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_4_BILINGUAL_DOCUMENTARY.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_5_EVENT_DRIVEN_VALUE_CHAIN.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_6_INCREMENTAL_MIGRATION.md`
- `docs/architecture/VOCABULARY_GOVERNANCE_PHASE_7_CONTINUOUS_GOVERNANCE.md`

Physical archival is intentionally deferred until reference/registry correlation proves that no active traceability path would be broken.

## 3. Replacement artifacts

Current architecture on `main` after the human merge of PR #477:

- `.ai/skills/ESS-0017-Vocabulary-Governance.md`
- `.ai/skills/ESS-0017-Contracts.md`
- `docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md`
- `src/platform/Vocabulary/*`
- VW-0 through VW-5 work-package documents.

## 4. Correlation

Old and new artifacts overlap on the same scope: CAPITAL-AI terminology, product wording, bilingual mapping, Documentary integration and naming governance.

The replacement does **not** supersede Financial Runtime, Security/IAM, Billing, Compliance, EventMesh, Knowledge, Traceability, Release or Deployment authorities.

## 5. Authority comparison

The supersession is authorized by the Owner work instruction and remains subordinate to higher accepted/active repository authorities. Recency alone is not used as a supersession rule.

`ADR-0046` is treated only as the historical display ID of the Vocabulary authority that was renumbered to `ADR-0078`; it is not a second active authority.

## 6. Semantic diff

### Before

```text
Canonical Vocabulary Registry
 -> registry-local terminology resolution
 -> phase-based migration/status documents
 -> partial Documentary/Event integration
```

There is no central governed Message Catalog, no complete 18-stage FinTech wording projection, no evidence-based Wording Usage Index and no deterministic Vocabulary-to-Documentary/Knowledge/Traceability projection.

### After VW-0 through VW-5

```text
Canonical Vocabulary Registry
        validates
UI Message Catalog
        -> React / PDF / E-Mail / SEO / Accessibility
        -> Wording Usage Index
        -> Documentary / Knowledge / Traceability Projection
        -> GitHub Wiki in VW-6 only
```

All 18 current `SC-MD-SPT-0001` stages have read-only Concept/Message bindings. Delivery and projection contracts explicitly carry no financial or mutation authority.

## 7. Operational impact

- new TypeScript contracts and read-only services under `src/platform/Vocabulary`;
- targeted validation command `npm run vocabulary:wording:check`;
- no Runtime dependency added;
- no mass replacement of existing UI strings in VW-0 through VW-5;
- no GitHub Wiki publish yet;
- no Supabase, Render, Stripe or external production mutation.

## 8. Security / data-integrity impact

The change is boundary-hardening:

- unknown Concepts/Message Keys fail closed;
- context-incompatible delivery fails closed;
- exact source commit is required for the VW-5 projection;
- `financialDecisionAuthority=false` and `mutationAuthority=false` are explicit;
- fail-closed domain states cannot be upgraded by wording;
- no secrets, credentials or privileged external mutations are introduced.

## 9. Regulatory / compliance impact

No regulatory claim is introduced. Compliance/Legal text remains governed by its parent authority; Vocabulary alone cannot approve or change such statements.

## 10. Evidence impact

Historical phase documents and Git history remain available. They are reclassified as historical/non-authorizing Evidence rather than silently rewritten or deleted.

## 11. Rollback

Before Human Merge: delete/abandon the branch.  
After Human Merge: Human-gated Git revert of the supersession/implementation slice. No external-system rollback is required because VW-0 through VW-5 perform no external platform mutation.

## 12. Owner decision

- Implementation of the supersession and VW-1 through VW-5: **AUTHORIZED by current Owner instruction**.
- Effectiveness on `main`: **EFFECTIVE — PR #477 human-merged**.
- Wiki publishing and mass UI wording migration: **NOT AUTHORIZED by this package**; they remain VW-6/VW-7.
