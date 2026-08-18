# ADR-0086 — Vendor Privacy Evidence Governance

- **Status:** Accepted for implementation in PR #414
- **Date:** 2026-08-19
- **Owner:** Sven Michael Kulessa
- **Related:** ADR-0085, `docs/compliance/vendor-evidence/vendor-inventory.json`

## Context

Repository-level privacy controls cannot prove contracts, subprocessor commitments, international-transfer safeguards or contractual data-residency promises. Those facts change independently of source code and often exist only in provider accounts, executed legal documents or controlled compliance archives.

CAPITAL-AI also integrates infrastructure, payment, analytics and social-platform providers that may have different GDPR roles depending on the exact processing flow. Treating every external platform as an Article 28 processor before the actual role is established would create false compliance evidence.

## Decision

1. Maintain one machine-readable vendor candidate inventory in `docs/compliance/vendor-evidence/vendor-inventory.json`.
2. Keep **legal role**, **processing status**, **contractual evidence**, **technical observations** and **international-transfer evidence** separate.
3. Do not mark a provider verified merely because a public legal webpage or generic SCC text exists.
4. Keep executed confidential contracts in a restricted compliance archive; commit only immutable SHA-256 digests and controlled evidence references unless a document is explicitly approved for source-control storage.
5. For SCC-based third-country transfers, require a documented TIA and supplementary-measures assessment before strict verification can pass.
6. Keep contractual regions separate from observed runtime regions. A mismatch is a strict-gate failure.
7. Use two automation modes:
   - onboarding preflight: validates schema and prevents false/contradictory verification while reporting open evidence;
   - strict verification: fails until required business/legal evidence is complete and current.
8. Review verified evidence at least annually and additionally after material vendor, subprocessor, region, service or transfer-mechanism changes.
9. Do not create permissive RLS policies merely to suppress an advisor informational finding when a server-only table is intentionally deny-by-default through grants plus RLS.

## Candidate inventory baseline

The controller requested inventory for:

- Supabase
- Render
- Stripe
- IONOS
- Google
- YouTube
- Instagram
- TikTok
- X
- Threads
- LinkedIn
- Facebook

Each candidate remains subject to individual owner confirmation. Repository-observed integration is evidence of technical capability, not evidence that the provider currently processes production personal data or has a specific GDPR legal role.

## Security-advisor treatment

Advisor output is classified rather than blindly remediated:

- real authorization/performance defects are corrected;
- intentional deny-by-default tables are documented as accepted architecture;
- unused-index findings require an observation window and workload evidence before removal;
- paid-plan-only controls may remain unavailable when the controller explicitly accepts and documents the residual risk.

## Consequences

### Positive

- evidence is auditable and machine-checkable;
- runtime facts cannot be accidentally presented as contractual promises;
- provider-role uncertainty is explicit;
- missing SCC/TIA/subprocessor evidence becomes visible without inventing compliance;
- future procurement and enterprise due diligence can consume the same evidence registry.

### Trade-offs

- strict verification cannot become green until the controller supplies/validates account-specific legal evidence;
- external contract storage requires a controlled archive outside normal source control;
- legal-role classification for social platforms may require service-specific analysis rather than one global classification.
