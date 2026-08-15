# ADR Cross-Reference Inventory — Post Namespace Cleanup

**Document ID:** GOV-XREF-2026-08-16  
**Basis:** main after PR #345 / #348  
**Shadow-Score:** 90/100 (advisory subset; 0 duplicate active numbers in `docs/adr/`)

## 1. Renumber map (PR #345)

| Former active path under `docs/adr/` | New number |
|--------------------------------------|------------|
| `ADR-0014-phase-3-4-7-runtime-facade.md` | **ADR-0075** |
| `ADR-0020-version-manager-repository-convention-validator.md` | **ADR-0076** |
| `ADR-0044-canonical-naming-bilingual-documentation-vocabulary-governance.md` | **ADR-0077** |
| `ADR-0046-vocabulary-governance-authority-and-namespace.md` | **ADR-0078** |
| `ADR-0067-systemadmin-github-actions-execution-host.md` | **ADR-0079** |
| `ADR-0068-marketing-roadmap-executor-and-content-automation-boundary.md` | **ADR-0080** |

Canonical keepers remain: 0014 documentation-governance, 0020 multi-provider, 0044 production-runtime-immutability, 0046 modern-supabase, 0067 s1-security, 0068 first-bounded-autonomous. Decision record: **ADR-0081**.

## 2. Shadow-Validator result (post-merge)

| Metric | Value |
|--------|-------|
| Active ADRs (`docs/adr/`) | 72 |
| Resolved | 7 |
| Drafts | 2 |
| Unique active numbers | 72 |
| **Duplicate groups** | **0** |
| Errors | 0 |
| Warnings | 0 |
| Info (missing Implementation-Status) | high density (expected; pre-existing) |

## 3. Cross-reference debt

### 3.1 Parallel `ADR-0014` family under `docs/architecture/` — OPEN (Owner decision)

These files use the **ADR-0014** label for **server/market-data phase work**, while the canonical active ADR under `docs/adr/` for 0014 is **Documentation Governance Validator**:

| Path | Topic |
|------|--------|
| `docs/architecture/adr/ADR-0014-server-runtime-architecture-consolidation.md` | Server runtime consolidation |
| `docs/architecture/adr/ADR-0014-phase3-3-ai-analysis-extraction-note.md` | AI analysis extraction |
| `docs/architecture/adr/ADR-0014-phase3-4-market-data-adapters.md` | Market-data adapters |
| `docs/architecture/adr/ADR-0014-phase3-4-market-data-adapters-v2.md` | Market-data adapters v2 |
| `docs/architecture/ADR-0014-PHASE-3.4.4.md` | Crypto/Stooq stages |
| `docs/architecture/ADR-0014-PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md` | Compatibility facade |
| `docs/architecture/phase3-4-3-crypto-provider-extraction.md` | Crypto provider chain |
| Work-claims / evidence under architecture referencing “ADR-0014 Phase 3.4.x” | Phase tracking |

**Proposal:** `docs/governance/ADR_0014_ARCHITECTURE_PHASE_DISAMBIGUATION_PROPOSAL.md`

Do **not** silently rewrite historical work-claim evidence paths without Owner review.

### 3.2 Internal reference in ADR-0075 — FIXED

Reworded: parent is the market-data compatibility refresh boundary under `docs/architecture/ADR-0014-PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md`, with explicit note that `docs/adr/ADR-0014` remains Documentation Governance (ADR-0081).

### 3.3 `adr_history.json` — OPEN

Still incomplete relative to the live ADR tree (historical lag; known from maturity report). Separate maintenance PR.

## 4. Suggested next PRs (ordered)

1. ~~Score + inventory~~ — done (#348)
2. ~~ADR-0075 wording~~ — this PR
3. **Owner decision:** architecture `ADR-0014-*` phase disambiguation (see proposal)
4. **D/C:** backfill `Implementation-Status` on high-traffic active ADRs
5. Continue ESS-0012 engine work (not shadow)

## 5. Invariants

- Human/Owner-Gate and no agent self-merge unchanged.
- Shadow tools remain advisory (`exit 0` default).
- Full ESS-0012 Chapter-3 gate still **not** activated.
