# Changelog

## 1.8.0 — 2026-08-21

### Deutsch

- VW-6: deterministische, exact-commit-gebundene GitHub-Wiki-Projektion mit fünf verwalteten Seiten implementiert.
- Wiki-Sync standardmäßig als Dry-Run ausgelegt; `--apply` ist für lokale Mutation und zusätzlich `--push` für Veröffentlichung erforderlich.
- Wiki-Ziel wird auf ein sauberes `Finance.wiki.git`-Checkout begrenzt; Wiki bleibt explizit non-authoritative und one-way.
- VW-7: fünf reale `MarketScreener`-Wordings unverändert als governed Message-Baseline aufgenommen und einen expliziten Source/Literal/Message-Key-Migrationsplan eingeführt.
- VW-7 unterscheidet `OPEN`, `MIGRATED` und blockierendes `DRIFT`; automatische Source-Mutation bleibt deaktiviert.
- Browser-sicheren Message-Resolver ohne Node-only Imports oder zusätzliche Dependency ergänzt.
- VW-8: Wiki-, Migrations- und Closure-Validatoren in die bestehende Repository-Test-/Quality-Kette integriert.
- ESS Registry in-place auf ESS-0017 / ESS-0017-CONTRACTS `1.8.0` und `ADR-0078` synchronisiert; kein zweiter Registry-/CI-Control-Plane eingeführt.
- Keine externe Wiki-, Supabase-, Render-, Stripe-, IAM- oder Production-Mutation ausgeführt.

### English

- VW-6: implemented deterministic exact-commit-bound GitHub Wiki projection with five managed pages.
- Wiki sync defaults to dry-run; local mutation requires `--apply` and publication additionally requires `--push`.
- Wiki target is restricted to a clean `Finance.wiki.git` checkout; Wiki remains explicitly non-authoritative and one-way.
- VW-7: captured five real `MarketScreener` wordings unchanged as governed messages and introduced an explicit source/literal/message-key migration plan.
- VW-7 distinguishes `OPEN`, `MIGRATED` and blocking `DRIFT`; automatic source mutation remains disabled.
- Added a browser-safe message resolver without Node-only imports or a new dependency.
- VW-8: integrated Wiki, migration and closure validators into the existing repository test/quality chain.
- Synchronized the existing ESS Registry in place to ESS-0017 / ESS-0017-CONTRACTS `1.8.0` and `ADR-0078`; no second registry or CI control plane was introduced.
- No external Wiki, Supabase, Render, Stripe, IAM or production mutation was executed.

## 1.5.0 — 2026-08-21

### Deutsch

- `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` als Nachfolger der phasenbasierten Vocabulary-Migrations-/Statusarchitektur eingeführt.
- Aktive Vocabulary-Referenzen von der historischen Display-ID `ADR-0046` auf `ADR-0078` korrigiert.
- VW-1: typisierten bilingualen UI Message Catalog mit stabilen Keys, Concept-Referenzen, Contexts, Versionen und Placeholder-Validierung implementiert.
- VW-2: 18 zusätzliche kanonische Concepts und read-only Wording Bindings für alle aktuellen `SC-MD-SPT-0001`-Stufen implementiert.
- VW-3: evidenzbasierten Wording Usage Index mit explizitem Message-Key-Scanner und Reverse Impact Analysis implementiert.
- VW-4: read-only Delivery Adapter für React, PDF, E-Mail, SEO und Accessibility implementiert.
- VW-5: neutralen, commitgebundenen Vocabulary-Wording-Snapshot mit SHA-256-Checksum implementiert; Documentary verwendet bestehende `DocumentaryDocument`-, D7-Knowledge- und Documentary-Traceability-Contracts.
- Targeted Tests und Validatoren `npm run vocabulary:wording:test` / `npm run vocabulary:wording:check` ergänzt.
- Keine neue Runtime-Dependency und keine Financial-/IAM-/Billing-/Production-Mutation eingeführt.

### English

- Introduced `VOCABULARY-WORDING-WIKI-SUPERSESSION-0001` as the successor to the phase-based Vocabulary migration/status architecture.
- Replaced active Vocabulary references to the historical display ID `ADR-0046` with `ADR-0078`.
- VW-1: implemented a typed bilingual UI Message Catalog with stable keys, Concept references, contexts, versions and placeholder validation.
- VW-2: implemented 18 additional canonical Concepts and read-only wording bindings for all current `SC-MD-SPT-0001` stages.
- VW-3: implemented an evidence-based Wording Usage Index with explicit Message-Key scanning and reverse-impact analysis.
- VW-4: implemented read-only delivery adapters for React, PDF, email, SEO and accessibility.
- VW-5: implemented a neutral commit-bound Vocabulary wording snapshot with SHA-256 checksum; Documentary reuses existing D7/Traceability contracts.

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
