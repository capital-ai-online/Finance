# Historical Governance Artifact — Superseded Vocabulary Draft

**Historical artifact:** `ESS-0012 — Enterprise Vocabulary & Terminology Governance`  
**Lifecycle:** `SUPERSEDED / HISTORICAL / NON-AUTHORIZING`  
**Archived:** `2026-08-19`  
**Superseded by:** `ESS-0017 — Vocabulary Governance`  
**Stable authority:** `AUTH-ESS-VOCABULARY-GOVERNANCE`  
**Reason:** `ESS-0012` is canonically allocated to Documentation Governance in `.ai/registry/ess-registry.json`. This proposed vocabulary draft was never registered and its subject is now represented by ESS-0017.

This archive preserves the previous proposal for historical evidence. It must not be loaded or cited as an active ESS authority.

---

## Original proposal metadata

```yaml
skill:
  id: ESS-0012
  name: Enterprise Vocabulary & Terminology Governance
  version: 1.0.0
  status: Proposed
  owner: Platform Director
  category: Enterprise Governance
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  lifecycle: AI Native Development Lifecycle

classification:
  type: Component Specification
  contractAuthority: ESS-0001-CONTRACTS

references:
  - ESS-0001-CONTRACTS
  - ESS-0003
  - ESS-0009
  - ESS-0010
  - ESS-0011
  - ADR-0044
  - ADR-0045
```

## Original proposal summary

The proposal defined vocabulary and terminology governance for canonical terms, naming conventions, bilingual documentation, terminology change propagation, safe-rename validation and event-driven integration with Knowledge, Documentary and Traceability.

Its intended controls are now represented by the canonical `ESS-0017-Vocabulary-Governance.md`, including stable language-neutral concept IDs, English technical identifiers, DE/EN terminology mappings, explicit aliases/forbidden terms, lifecycle management and Safe Rename gating.

## Historical safe-rename requirements retained as evidence

The superseded proposal required impact analysis across:

1. static references and import/export graphs;
2. dynamic imports and lazy loading;
3. routes, APIs and schemas;
4. configuration/environment references;
5. regex and naming validators;
6. filesystem casing and Linux deployment compatibility;
7. TypeScript/lint;
8. tests;
9. production build;
10. deployment readiness.

These requirements remain useful historical design evidence but obtain current authority only from the effective Vocabulary Governance and higher governance controls.

## Historical event candidates retained as evidence

- `terminology.change.proposed`
- `terminology.change.approved`
- `terminology.updated`
- `component.rename.proposed`
- `component.rename.validated`
- `documentation.translation.required`
- `documentation.updated`
- `traceability.updated`
- `governance.validation.completed`

No event or capability is authorized merely by appearing in this archive.
