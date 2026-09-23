# CAPITAL-AI Canonical Vocabulary & Wording

Authority: `ESS-0017` / `ESS-0017-CONTRACTS`  
Architecture decision: `ADR-0078`  
Financial parent authority: `SC-MD-SPT-0001` (read-only projection only)  
Component version: `1.8.0`  
Implementation baseline: VW-0 through VW-8

## Purpose

`src/platform/Vocabulary` is CAPITAL-AI's canonical terminology and product-wording control plane. It owns stable Concept IDs and governed DE/EN wording contracts, but no Financial Runtime, IAM, Billing, Compliance, EventMesh, Knowledge, Traceability, CI, Release, Deployment or production authority.

```text
Canonical Vocabulary Registry
 -> UI Message Catalog
 -> Delivery Adapters / Usage Index
 -> neutral Vocabulary Wording Snapshot
 -> existing Documentary D7 / Traceability
 -> generated GitHub Wiki projection
 -> controlled incremental source migration
 -> existing repository validation chain
```

The governing rule is **Projection, not Redefinition**.

## VW-0 through VW-5

- VW-0 — Supersession and authority consolidation around `ADR-0078`.
- VW-1 — typed bilingual UI Message Catalog with stable keys and fail-closed placeholder validation.
- VW-2 — read-only Concept/Message bindings for all 18 current `SC-MD-SPT-0001` stages.
- VW-3 — evidence-based Wording Usage Index and reverse impact.
- VW-4 — read-only React/PDF/E-Mail/SEO/Accessibility delivery adapters.
- VW-5 — neutral exact-commit-bound Vocabulary snapshot consumed through existing DocumentaryDocument, D7 Knowledge and DocumentaryTraceability contracts.

Every financial binding remains:

```text
financialDecisionAuthority = false
mutationAuthority = false
```

## VW-6 — GitHub Wiki

`Wiki/VocabularyWikiProjection.ts` renders deterministic managed Markdown. `renderVocabularyWiki.ts` is check-only by default. `syncVocabularyWiki.ts` accepts only an existing clean `Finance.wiki.git` checkout; mutation requires `--apply` and publication additionally requires `--push`.

The Wiki is always a human-readable projection. It is never an authority source, and this branch does not publish it externally before PR.

## VW-7 — controlled source migration

`Migration/WordingMigrationPlan.ts` tracks exact source/literal/Message-Key mappings with `automaticApplyAllowed: false`.

```text
OPEN      governed literal remains queued
MIGRATED  source references the stable Message Key
DRIFT     mapping is ambiguous/broken and blocks governance
```

The initial five governed `MarketScreener` strings now resolve through their stable Message Keys and validate as `MIGRATED`. This closes the initial VW-7 slice without claiming a repository-wide mass migration.

A browser-safe resolver is available at `Delivery/browserMessageCatalog.ts` without Node-only dependencies.

## VW-8 — continuous governance

```text
npm run vocabulary:wording:test
npm run vocabulary:governance:check
npm run vocabulary:governance:prepr
```

The checks cover Message contracts, 18-stage correlation, Documentary handoff, Wiki determinism, migration drift and VW-0…VW-8 closure metadata. The existing `test:raw` path invokes the read-only Vocabulary governance gate.

## Repository-document terminology mining

The default registry also includes `documentationDerivedConcepts`, a curated terminology projection derived from the repository-wide Markdown inventory.

The 2026-09-22 mining baseline covers:

- all 1,045 Markdown paths present on the correlated repository tree;
- all 970 Markdown documents below `docs/` at inventory level;
- all 71 repository README files at content level;
- current definition-bearing ADR, runbook, platform and project documents for every promoted concept.

Promotion is deliberately curated rather than automatic: filenames, headings and repeated wording are candidate signals only. A term is registered only when it can be defined from current repository evidence, does not collide with an existing canonical/display/alias term, and remains a terminology projection rather than a transfer of the source document's authority.

Current examples include Idempotency, Event Replay, Operational Telemetry, Edge Trust, AAL2, CSP, SBOM, Durable Inbox/Outbox, Provider Routing, Screening Eligibility, RPO/RTO, Documentation Hygiene, Semantic Freshness, Quality Gate, Technical Debt, Reconciliation and Position Sizing.

## Runtime entry points

- `index.ts` — browser-safe public catalog, registry, bindings and delivery contracts; no Node built-ins.
- `node.ts` — explicit Node-only automation, repository scanning, checksum projection and continuous-governance validation.
- `Delivery/browserMessageCatalog.ts` — narrow React/accessibility resolver for browser consumers.

Node-only consumers must import from `./node` or a direct Node-only module path. Frontend code must never import `node.ts`.

## Canonical normalization and consumer integration

`normalizeVocabularyTerm()` is the shared lexical comparison contract for Registry and read-only consumers: trim, Unicode NFKC normalization and deterministic `en-US` lowercasing. Consumers such as the Quality Skill Engine must use this contract instead of implementing their own normalization semantics.

`buildVocabularyInventory()` accepts an `IVocabularyRegistry` dependency but defaults to `createDefaultVocabularyRegistry()`. Dependency injection exists for deterministic testing and read-only adaptation; it does not create or authorize a second terminology registry.

Active Canonical/Display/Alias terms and Forbidden Terms are mutually exclusive. Registry registration fails closed on same-concept and cross-concept collisions so one normalized label cannot simultaneously resolve as active vocabulary and prohibited wording.

## Canonical access

```ts
import {
  createDefaultVocabularyRegistry,
  createDefaultUiMessageCatalog,
  normalizeVocabularyTerm,
  VocabularyService,
} from './index';

const registry = createDefaultVocabularyRegistry();
const vocabulary = new VocabularyService(registry);
const messages = createDefaultUiMessageCatalog(registry);

vocabulary.getCanonicalTerm('Abonnement'); // Subscription
normalizeVocabularyTerm('Ｓｕｂｓｃｒｉｐｔｉｏｎ'); // subscription
messages.get('screening.action.start')?.text.de; // Screening starten
```

## Boundaries

- no direct Financial Hotpath mutation dependency;
- no synthetic upgrade of `DATA_UNAVAILABLE`, DENY, partial or ineligible states;
- no autonomous Legal/Compliance approval;
- no second Event Bus, Knowledge Graph, Traceability Store or CI control plane;
- no second Vocabulary Registry authority through consumer dependency injection;
- no Wiki back-propagation;
- no blind/automatic source-string replacement;
- no automatic code rename outside the Safe Rename Gate;
- no Merge, Release, Deployment, Wiki publication or production mutation authority.
