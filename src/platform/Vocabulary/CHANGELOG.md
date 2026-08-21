# Changelog

## 1.5.0 — 2026-08-21

### Deutsch

- `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` als Nachfolger der phasenbasierten Vocabulary-Migrations-/Statusarchitektur eingeführt.
- Aktive Vocabulary-Referenzen von der historischen Display-ID `ADR-0046` auf `ADR-0078` korrigiert.
- VW-1: typisierten bilingualen UI Message Catalog mit stabilen Keys, Concept-Referenzen, Contexts, Versionen und Placeholder-Validierung implementiert.
- VW-2: 18 zusätzliche kanonische Concepts und read-only Wording Bindings für alle aktuellen `SC-MD-SPT-0001`-Stufen implementiert.
- VW-3: evidenzbasierten Wording Usage Index mit explizitem Message-Key-Scanner und Reverse Impact Analysis implementiert.
- VW-4: read-only Delivery Adapter für React, PDF, E-Mail, SEO und Accessibility implementiert.
- VW-5: deterministische, commitgebundene Documentary-/Knowledge-/Traceability-Projektion mit SHA-256-Checksum und expliziten Non-Authority-Flags implementiert.
- Targeted Validator `npm run vocabulary:wording:check` ergänzt.
- Keine neue Runtime-Dependency, kein GitHub-Wiki-Publish, keine UI-Massenmigration und keine Financial-/IAM-/Billing-/Production-Mutation eingeführt.

### English

- Introduced `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` as the successor to the phase-based Vocabulary migration/status architecture.
- Replaced active Vocabulary references to the historical display ID `ADR-0046` with `ADR-0078`.
- VW-1: implemented a typed bilingual UI Message Catalog with stable keys, Concept references, contexts, versions and placeholder validation.
- VW-2: implemented 18 additional canonical Concepts and read-only wording bindings for all current `SC-MD-SPT-0001` stages.
- VW-3: implemented an evidence-based Wording Usage Index with explicit Message-Key scanning and reverse-impact analysis.
- VW-4: implemented read-only delivery adapters for React, PDF, email, SEO and accessibility.
- VW-5: implemented a deterministic commit-bound Documentary/Knowledge/Traceability projection with SHA-256 checksum and explicit non-authority flags.
- Added the targeted `npm run vocabulary:wording:check` validator.
- Added no runtime dependency, Wiki publish, mass UI migration or Financial/IAM/Billing/production mutation.

## 1.0.0 — 2026-08-09

### Deutsch

- Canonical Vocabulary Registry eingefuehrt.
- Typed Concept Model nach ESS-0017-CONTRACTS angelegt.
- Deterministische Validierung fuer Concept IDs, technische Begriffe und Authorities implementiert.
- Alias- und Display-Term-Kollisionen werden blockiert.
- DE/EN-Aufloesung und Forbidden-Term-Erkennung implementiert.
- Initiale Seed-Concepts fuer Billing, Analytics und Vocabulary Governance hinzugefuegt.
- Contract-Tests hinzugefuegt.
- Keine aktiven Code-Renames und keine neuen Event-Typen.

### English

- Introduced the Canonical Vocabulary Registry.
- Added the typed concept model defined by ESS-0017-CONTRACTS.
- Added deterministic validation for concept IDs, technical terms and authority references.
- Added alias/display-term collision protection.
- Added DE/EN resolution and forbidden-term detection.
- Added initial seed concepts for billing, analytics and Vocabulary Governance.
- Added contract tests.
- No active code renames and no new event types.
