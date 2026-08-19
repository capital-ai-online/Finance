# Governance Control Plane — Supersession Diff & Impact

**Document ID:** `DOC-GOV-CONTROL-PLANE-IMPACT-2026-08-19`  
**Version:** `1.4.0`  
**Date:** `2026-08-19`  
**Status:** POST-MERGE RECONCILIATION EVIDENCE — sections 1–9 preserve the pre-merge review snapshot; section 10 records the landed state  
**Decision authority:** `ADR-0096` / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Original branch:** `governance/control-plane-foundation-iso42001-ssdf`

## 1. Owner-directed scope

The Owner directed that repository governance duplication and contradictory policy architecture be resolved before new features become merge-ready, including one agent trust root, centralized ADR governance, stable authority/control identities, documentation hygiene, ISO/IEC 42001 + NIST SSDF-oriented control design, archival of fully replaced governance material and temporary M10 suspension until the remaining architecture/documentary/version correlations are resolved.

## 2. Supersession / namespace matrix

| Source / previous state | Replacement / target | Stable identity treatment | Semantic impact |
|---|---|---|---|
| `AGENTS.md` plus repository-level provider instruction files | `/AGENTS.md` only | `AUTH-GOV-AGENT-TRUST-ROOT` | removes the remaining provider-specific instruction surfaces entirely; provider tooling cannot create a second repository policy source |
| ESS-0019 named a universal AI agent control plane | retained as subordinate capability/risk/audit/execution plane under `/AGENTS.md` | `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` | capability model preserved; no second trust root |
| `SKILL-GOV-0001` carried stale provider/global handoff language | documentation-only operational skill under ESS-0012 | skill identity retained | removes stale provider/global process mirror without weakening documentary validation |
| two active ADRs displayed as `ADR-0085` | ESS namespace ADR remains `ADR-0085`; privacy decision becomes `ADR-0095` | privacy keeps `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19`; old path is non-authorizing redirect | namespace repair only; privacy substance unchanged |
| vendor privacy ADR and governance draft both displayed as `ADR-0086` | vendor privacy remains `ADR-0086`; governance decision becomes `ADR-0096` | governance keeps `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`; old path is non-authorizing redirect | removes ambiguous display identity |
| PR #446 writes `ADR-0094` | `ADR-0094` remains reserved for #446; Governance uses `ADR-0095`/`ADR-0096` | #446 now declares `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19` | cross-PR namespace correlation is explicit and stable rather than another renumbering race |
| two active `.ai/skills` documents declared `ESS-0012` | Documentation Governance retains ESS-0012; vocabulary draft removed from active skills and archived; ESS-0017 remains Vocabulary Governance | stable ESS/Authority identities preserved | removes active duplicate |
| Documentary Governance could be read as global Governance implementation | cross-cutting `src/platform/Governance` plus documentation-only `src/platform/Documentary/Governance` | `AUTH-GOV-CONTROL-PLANE` | explicit separation of concerns |
| authority inferred from path/display number/prose | stable `AUTH-*` + `CTRL-*` registries | path-independent IDs | deterministic identity and less text/regex brittleness |
| fully replaced Governance Hardening roadmap and narrow supersession review remained in active governance/roadmap paths | moved to `docs/archive/governance/superseded/` | documentary identities retained as historical only | removes duplicate current-state governance sources while preserving evidence |
| old ADR links would break after namespace repair | minimal `Legacy ADR Redirect — NON-AUTHORIZING` compatibility stubs | canonical authority remains registry-resolved | preserves historical links without recreating active ADRs |
| M10 historical material could imply reactivation | M10 remains `SUSPENDED/OFF` | `CTRL-CI-M10-001` | reactivation blocked until duplicate references, Documentary boundary, README/version projection, router references and Version Manager/Release contracts are reconciled and revalidated |

## 3. Operational impact

### Agent behavior

Before: an agent could encounter repository-level policy through more than one instruction file.

After: repository-level instruction resolution starts and ends at `/AGENTS.md`. Provider configuration may configure mechanics outside this repository policy surface but cannot establish repository authority.

### Pull Requests / CI

- no new pre-PR authorization gate is introduced;
- M10 remains suspended/off;
- normal PR technical CI may run without M10 passkey authorization while the switch remains off;
- manual M10 `workflow_dispatch` remains denied while disabled;
- pre-PR sandbox/local evidence remains non-authorizing;
- hosted GitHub `build-and-test` remains the independent final-head technical check;
- Human Merge remains separate;
- open-PR ADR allocations are treated as shared-namespace writers even without file overlap.

### Deployment

No production mutation is performed by this governance branch. Current production authority remains verified `main` CI -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deployment identity verification, with Render native Auto Deploy off.

## 4. Security impact

**Improvement:** eliminates provider-specific repository instruction mirrors, makes protected authority machine-resolvable, prevents duplicate active governance identities and requires fail-closed handling of unresolved structural/namespace conflicts.

**No privilege expansion:** no merge, Owner IAM, secret, destructive-data, billing, provider-control-plane or deployment authority is delegated.

**M10 risk treatment:** M10 implementation remains available for audit/recovery but enforcement stays disabled. Reactivation is expressly prohibited until the documented architecture/documentary/version/router correlations are resolved and a fresh Owner decision is made.

## 5. Standards impact

The ISO/IEC 42001 + NIST SSDF crosswalk is a **mapping layer**, not a second control plane. CAPITAL-AI `AUTH-*`/`CTRL-*` remain operative; the crosswalk maps external management/security outcomes to those controls and exposes gaps. External-standard revisions therefore change mapping/gap analysis first, not repository authority automatically.

Current engineering baseline: ISO/IEC 42001:2023, final NIST SP 800-218 SSDF v1.1, and final SP 800-218A. The draft SP 800-218 Rev. 1 / SSDF v1.2 is monitored as state-of-the-art input but is not silently adopted as repository authority.

No certification, regulated-entity status, high-risk classification or legal completeness is claimed from the mapping alone.

## 6. Evidence / archive impact

- superseded ESS vocabulary material remains under `docs/archive/governance/superseded/`;
- the fully replaced Governance Hardening roadmap and earlier Supersession Diff/Impact package are moved to the same archive domain;
- current ADR-0085/0086 legacy paths retain only non-authorizing redirect compatibility where link integrity requires it;
- applied migration/evidence history is not rewritten;
- branch-local temporary ADR numbers that never reached `main` are not manufactured into fake historical authorities.

## 7. Open-PR impact

### PR #439

Reusable documentation-hygiene, README projection and versioning work remains parked. It must be reconciled into the new `src/platform/Governance` ↔ `src/platform/Documentary/Governance` boundary rather than merged as a second global governance implementation.

### PR #442

Ranking work is functionally independent but writes the document registry; it remains subject to post-Governance synchronization.

### PR #446

`ADR-0094` is intentionally retained for the media-rendering decision and now carries stable Authority ID `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`. The Governance branch reserves that display ID and uses `ADR-0095`/`ADR-0096` for its own migrated decisions. The PR's prior CI evidence was bound to its previous head; its new exact head must be green before Human Merge.

If #446 merges before the Governance PR, the final mandatory main sync must convert the parallel reservation into a normal ADR registry record and revalidate namespace uniqueness.

## 8. Rollback

1. create a fresh rollback branch from then-current `main`;
2. revert the consolidated governance PR as a reviewed unit;
3. validate that restored repository files do not recreate multiple instruction surfaces or active duplicate IDs;
4. preserve ADR/ESS/archive evidence;
5. Human/Owner decides and performs the rollback merge.

No external production rollback is required for this repository governance refactor.

## 9. Owner decision record

The Owner explicitly instructed this cleanup, archive treatment, removal of Claude/Copilot repository instruction files, PR #446 correlation remediation and continued M10 suspension on 2026-08-19. Effectiveness on `main` remains contingent on Human Merge of the resulting Governance Pull Request.

## 10. Post-merge closure addendum — 2026-08-19

Sections 1–9 above are intentionally retained as the Owner-visible **pre-merge** impact package and are not rewritten to simulate a different review-time state.

Landed facts now superseding only their operational status, not their historical evidentiary value:

- Governance PR #447 was Human-merged as commit `0b904c10e46723cb80a7ba12781c3847005c4715`; its final-head Governance, CI and Google-Marketing workflows completed successfully.
- ADR-0096 therefore crossed its explicit `effective after Human Merge` gate and is now `Accepted`; the Authority/Supersession and Document Lifecycle policies are active.
- Media PR #446 subsequently Human-merged as current baseline commit `71bce3d07133e2a7d408af179c2325e6d5114d5a`.
- ADR-0094 is consequently no longer a parallel open-PR reservation. Its stable Authority ID is registered as a normal Accepted ADR/Authority entry.
- ADR-0085/0086 compatibility files remain non-authorizing redirects; no historical link is deleted and no stable Authority ID is reused.
- M10 remains `SUSPENDED/OFF`; this lifecycle reconciliation grants no new CI, merge, IAM, deployment or production-mutation capability.
- PRs #439 and #442 remain separate follow-up correlations and are not silently absorbed by this closure.

The follow-up branch `agent/governance-control-plane-postmerge-closure` changes only repository Governance/ADR metadata, the existing structural validator and its unit contract. No external state mutation is required.
