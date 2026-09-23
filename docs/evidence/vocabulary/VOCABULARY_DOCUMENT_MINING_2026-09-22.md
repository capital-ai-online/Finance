# Vocabulary document mining evidence — 2026-09-22

**Baseline:** `main@d21223b520562549b41dbfc48fa277c096dec33e`  
**Owner:** Platform Director / CAPITAL-AI-GOV  
**Authority boundary:** ESS-0017 / ESS-0017-CONTRACTS / ADR-0078  
**Mode:** read-only source mining followed by curated canonical-registry additions

## Inventory coverage

The correlated repository tree contains:

- **1,045** Markdown files in total;
- **970** Markdown files below `docs/`;
- **71** files named `README.md`.

All Markdown paths were included in the terminology inventory scan. All 71 README files were read for headings and technical identifiers. Definition-bearing current ADRs, runbooks and platform/project README surfaces were then used to ground concepts selected for promotion.

Archived and historical documents remain evidence only. A historical term was not promoted solely because it appeared in archive material; current supporting material was required for a new approved concept.

## Dedupe and promotion rules

Before registration, candidate terms were compared against the current default Vocabulary sources:

- `seedConcepts`;
- `securityVerificationConcepts`;
- `pvcProjectConcepts`;
- `frontendPresentationConcepts`.

Promotion requires:

1. a stable technical meaning supported by current repository documentation;
2. a valid bilingual display/definition pair;
3. a collision-free canonical code term, display labels and aliases;
4. source traceability;
5. no transfer of runtime, Security, Compliance, FinTech, Release or other source-document authority.

## Promoted concepts

The slice adds **39** concepts:

| Group | Concepts |
|---|---|
| Event / architecture | Idempotency, Event Ordering, Event Replay, Reliability Evidence, Durable Outbox, Durable Inbox |
| Observability / platform | Observability, Operational Telemetry, Edge Trust, Product Intelligence, Rate Limiting |
| Security / IAM | Threat Model, Security Hardening, Authentication Assurance Level 2 (AAL2), Content Security Policy (CSP) |
| Supply chain / release | Software Supply-Chain Attestation, Software Bill of Materials (SBOM), Rollback, Release Candidate, Deterministic Versioning |
| Data / analytics | Provider Routing, Screening Eligibility, Reconciliation, Order Intent, Position Sizing, Portfolio Risk Evidence |
| Privacy / recovery | Privacy Retention, Retention Hold, Data Subject Access Request (DSAR), Recovery Point Objective (RPO), Recovery Time Objective (RTO) |
| Documentary / quality | Documentation Hygiene, Semantic Freshness, Archive Retention, Migration Planning, Technical Debt, Quality Gate |
| Supervisor / execution | Quarantine Work Item, Retry Safe Operation |

## Definition-bearing source examples

- `src/platform/EventMesh/README.md`
- `src/platform/Telemetry/README.md`
- `src/platform/Security/README.md`
- `src/platform/Documentary/README.md`
- `src/platform/Documentary/Governance/README.md`
- `src/platform/Quality/README.md`
- `src/platform/Release/README.md`
- `src/platform/FinTechCore/README.md`
- `src/platform/Supervisor/README.md`
- `docs/adr/ADR-0056-observability-telemetry-baseline.md`
- `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md`
- `docs/adr/ADR-0064-supabase-native-mfa-aal2-hardening.md`
- `docs/adr/ADR-0040-csp-runtime-remediation-safe-rollout.md`
- `docs/adr/ADR-0054-durable-worker-outbox-lease.md`
- `docs/adr/ADR-0045-stripe-event-ownership-durable-inbox.md`
- `docs/adr/ADR-0020-multi-provider-market-data-routing.md`
- `docs/adr/ADR-0025-verified-traditional-quotes-and-screening-eligibility.md`
- `docs/adr/ADR-0092-privacy-retention-and-lifecycle-hardening.md`
- `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`

## Exit evidence

- `documentationDerivedConcepts` contains exactly 39 approved concepts.
- `createDefaultVocabularyRegistry()` registers those concepts in the existing single registry.
- Existing frontend Vocabulary automatically receives the new entries through the same registry projection.
- Alias examples `AAL2`, `CSP`, `SBOM`, `RPO`, `RTO`, `DSAR` and `Event-Replay` resolve through the canonical registry.
- No second registry or runtime authority is introduced.
