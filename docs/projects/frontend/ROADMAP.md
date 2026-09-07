# CAPITAL-AI-FE — Project Roadmap

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Productive PVC ownership:** `[]` (`N/A`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Current-main correlation:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Detailed roadmap:** `docs/frontend/FRONTEND_ROADMAP.md`  
**Architecture authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Component inventory:** `docs/frontend/COMPONENT_INVENTORY.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the thin owner-side project execution projection required by the canonical `docs/projects/` model. It does **not** create a second Frontend roadmap, a parallel Visualization architecture, a second Server-State authority, or any Scoring/Data/Evidence/Social-Publishing/IAM/Governance authority.

Detailed Frontend migration state, visual recovery classification, Asset-Universe visualization planning, Crypto category/subclass projections, Social-render handoff, quality targets and Legacy-exit planning remain canonical in `docs/frontend/FRONTEND_ROADMAP.md` and `docs/frontend/COMPONENT_INVENTORY.md`. `docs/frontend/FRONTEND_ARCH.md` remains the singular Frontend architecture authority.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `FE-PROJ-01` | Canonical `docs/projects/frontend/` navigation exists | `README.md` + this projection reference the existing Frontend sources |
| `FE-PROJ-02` | No productive PVC ownership | no Frontend project artifact allocates a productive `PVC-*` stage |
| `FE-PROJ-03` | Frontend architecture remains singular | `docs/frontend/FRONTEND_ARCH.md` remains the architecture authority |
| `FE-PROJ-04` | Domain semantics remain owner-controlled | UI consumes scoring/data/evidence/entitlement/Governance contracts without local redefinition |
| `FE-PROJ-05` | UX quality remains evidence-backed | detailed roadmap/inventory retain measurable Visualization, Contract, Accessibility and Performance gates |
| `FE-PROJ-06` | Branding Manifest v6.2 remains singular | `docs/frontend/design-tokens.json` owns color/type roles; `docs/frontend/brandmark.json` owns brandmark geometry |
| `FE-PROJ-07` | Productive Legacy exits completely | detailed roadmap reaches zero productive `src/components` implementations and zero required Legacy compatibility consumers before BB-11 closure |
| `FE-PROJ-08` | Asset-Universe model visuals remain projections | FINTECH Registry/Dispatcher/model lifecycle are displayed without a second FE registry, dispatcher or score authority |
| `FE-PROJ-09` | Web/Social visuals share deterministic source semantics | FE presentation projection can be consumed by Social while `CAPITAL-AI-SOCIAL` retains MediaProject/render/publish ownership |

## Current roadmap truth

### Completed current-day recovery

The former Owner-directed P0 **Public Analysis Sideboard restoration is complete on current main**. Human-merged PR #825 restored the public assessment-tool Sideboard as an `src/app` composition over existing feature-owned surfaces without restoring the heavy authenticated Legacy Dashboard as the public root.

Current public recovery preserves the required distinctions:

- public or server-gated tools may execute through their current contracts;
- login-required tools remain login-required;
- explicitly disabled tools remain disabled;
- synthetic/preset/fallback values are not promoted to verified public evidence;
- no anonymous/persisted Supabase or IAM visitor session is created;
- Scoring, Ranking, Market-Data, Evidence and Entitlement authority remains outside Frontend.

The earlier Public Enterprise Scorer recovery is likewise merged and current; it remains a presentation of the same canonical Crypto Scorer implementation, not a second scorer.

### Owner-directed Visual Recovery extension

The detailed canonical roadmap/inventory now classify the following recovery targets as **Class A — CANONICALIZE_NOW**:

- **Buffett Value Check** — current implementation already consumes server authorization and verified stock-display evidence; physical Legacy migration remains.
- **Sentiment Dashboard** — new canonical dashboard over current fail-closed `crypto-sentiment-research/0.1.0`; legacy `MarketSentiment` neutral-default semantics remain Class B and are targeted for consumer supersession.
- **Momentum Dashboard** — new canonical dashboard over current fail-closed `crypto-momentum-research/0.1.0`.
- **Asset Universe Models & Orchestration** — read-only FINTECH registry/dispatcher/executor/model-lifecycle projection attached to the relevant Asset Universes.
- **Crypto Category / Subclass Workspace** — canonical Crypto categories/subcategories as tabs, with model/formula detail only where supplied by FINTECH-owned contracts.
- **Social Visualization Projection** — the same deterministic presentation snapshot may feed `MediaProjectV2` chart/scene layers; Social retains rendering/publishing ownership.

This classification is a planning/canonicalization decision, not a claim that all target components already exist or have runtime PASS evidence.

### Current execution order

Absent a newer explicit Owner priority, Frontend resumes the existing BB-2 composition sequence:

1. **BB-2E — Navigation / Drawer completion**;
2. **BB-2F — Header / Application Shell extraction**;
3. **BB-2G — Dashboard Home / MyWorkspace visual-parity cutover and composition closure**.

The expanded Visualization/Asset-Universe/Social-render program is integrated into the **existing** detailed roadmap and must not create a parallel execution roadmap. After BB-2 closure it is applied through BB-4/5/6/9 domain waves.

## Detailed modernization targets

The detailed canonical roadmap carries the measurable target gates. They are targets, not achieved-state claims:

| Dimension | Minimum closure target |
|---|---:|
| Visualization | `>= 8.5/10` |
| Server-/Data-Contract Architecture | `>= 8.5/10` |
| Accessibility | `>= 8.0/10` |
| Performance | `>= 8.5/10` |
| Productive Legacy Exit | `10.0/10` |

No score may be marked achieved without current implementation/test/evidence. Productive Legacy Exit is absolute: `10/10` requires zero productive Legacy implementations and zero required Legacy compatibility consumers.

## Asset-Universe / FINTECH visualization invariant

Current FINTECH authority remains:

```text
Validated DATA / UAI
-> Feature Contract
-> ScoringModelRegistry
-> ScoringDispatcher
-> Domain Executor Adapter
-> CanonicalScoreResult
-> Ranking / Decision Support
-> Traceability
```

Frontend may visualize this chain, registered canonical/challenger/research model metadata and supplied orchestration/workflow state. It must not introduce a second model registry, dispatcher, routing decision, score formula, promotion decision or rank authority.

The detailed roadmap records current model attachments including the canonical Crypto, Traditional, Commodity and Sovereign Benchmark models plus current Meme/DeFi and commodity challengers. `CryptoOrchestrator` must be visibly labeled Research/Enrichment only; `FinTechCore` must be visibly labeled Financial Workflow Composition rather than a second scorer.

## Crypto category/subclass invariant

Crypto tabs are derived from the then-current canonical classification contract. Current category coverage includes the repository canonical categories such as Layer 1, Layer 2, DeFi, Meme, Stablecoin, Oracle, AI/Data, Gaming, RWA and the remaining current canonical set.

The tab itself creates no category-specific scoring formula. It may display:

- canonical champion model/version;
- a dedicated FINTECH challenger/research model where one exists;
- FINTECH-supplied formula/weight/evidence requirements;
- lifecycle, `scoreEligible`, `executionEligible`, missing/not-computable and evidence state.

Currently dedicated category research challengers exist for Meme and DeFi. Other Crypto category tabs continue to use the canonical Crypto champion plus applicable supplied research context until FINTECH publishes/promotes a dedicated governed model.

## Visualization / Social reuse invariant

Renderer selection remains use-case bounded:

- Recharts: default standard financial/dashboard charts;
- D3: bounded custom geometry/interaction;
- React Flow / XYFlow: evaluate as best-fit node-edge renderer for orchestration/lineage; not installed by this documentation slice;
- Social: existing `MediaProjectV2` chart/scene layers plus ADR-0094 deterministic renderer consume the same normalized visual data/labels.

Cross-project flow:

```text
FINTECH/DATA authoritative result
-> FE visualization ViewModel / serializable presentation snapshot
   -> browser visualization
   -> CAPITAL-AI-SOCIAL MediaProjectV2
      -> deterministic image/frame/video renderer
      -> existing validation/approval/publishing boundary
```

Web and Social must preserve the same numbers, model/version, evidence/data state and applicable disclaimers. Social can animate/layout already-authoritative data but cannot invent financial semantics. `publishReady=false` and all Social authorization/publishing gates remain unchanged.

## Execution invariants

- Projection, not redefinition.
- Preserve the singular `src/app -> src/features -> src/shared` Frontend architecture.
- No new productive domain implementation under `src/components/`.
- Approved user-visible functionality is preserved through canonical app/feature consumers before Legacy removal.
- Frontend may compose and present domain outputs but cannot create local Scoring, Ranking, Market-Data, Evidence, Entitlement, IAM, Governance or Social-Publishing truth.
- Unavailable, stale, invalid, partial or not-computable financial evidence is rendered explicitly; it is never replaced by synthetic finance values, neutral/default scores, fake READY states or fabricated trend data.
- Buffett/Sentiment/Momentum Class-A status does not waive entitlement, evidence, lifecycle or research-only labels.
- Crypto category/model views are driven by canonical classification and FINTECH descriptors/contracts rather than hardcoded FE formula authority.
- Branding values remain authoritative in `docs/frontend/design-tokens.json`; versioned brandmark geometry remains authoritative in `docs/frontend/brandmark.json`.
- Deprecated `brand-cyan` remains compatibility-only until productive consumers reach zero.
- Ranking/decision-support semantics remain with `CAPITAL-AI-FINTECH`; data/evidence/provenance/freshness semantics remain with `CAPITAL-AI-DATA`.
- Merge, deployment and protected external mutations retain Human/Owner and repository gates.

## Current cross-project dependencies

| Target | Relationship / current dependency |
|---|---|
| `CAPITAL-AI-FINTECH` | productive scoring/ranking/decision-support contracts; Registry/Dispatcher/model descriptors; Crypto research models; FIN-17 backend rank/order boundary; protected Backtest/Monte-Carlo execution and Legacy scoring compatibility retirement remain owner-side concerns |
| `CAPITAL-AI-DATA` | provider input, history/snapshot evidence, provenance, freshness and DQ; Frontend must consume current validated states rather than fabricate missing fields |
| `CAPITAL-AI-GOV` | Governance/IAM/control-plane contracts consumed by Admin/Governance UI; browser visibility remains non-authorizing |
| `CAPITAL-AI-OPS` | runtime/deployment/operational and telemetry boundaries; any production observability integration remains OPS/privacy-governed |
| `CAPITAL-AI-QM` | cross-cutting UX/quality evidence and improvement findings |
| `CAPITAL-AI-SOCIAL` | owns SocialMediaEngine/MediaProject/render/publishing integration; consumes canonical design-token/brandmark contracts and may consume deterministic FE visual projections |
| `CAPITAL-AI-DOC` | Documentary branding consumers remain Documentary-owned and are not migrated by a Frontend slice |

## Supersession boundary

The Owner has explicitly permitted supersessions during execution for this modernization program. This permits Frontend-owned consumer/presentation supersession and consumption of correctly owner-approved foreign replacements; it does **not** broaden Frontend authority over foreign contracts.

Every supersession remains bound by `/AGENTS.md`: identify the exact target and replacement scope, explicit exclusions and impact, use equal-or-higher applicable authority, obtain owner-side decision for foreign-owned domain contracts, cut consumers over, remove compatibility only at zero productive consumers, and retain required historical/audit evidence.

Planned examples include superseding legacy `MarketSentiment` neutral-default consumer behavior with the canonical Sentiment Dashboard, hardcoded FE asset/model maps with registry-driven projections, obsolete Crypto taxonomy consumers with the canonical classification contract, and duplicate/recomputed Social visualization paths with the shared deterministic presentation handoff.

## Validation

For this project projection and the detailed roadmap/inventory changes, the smallest sufficient pre-PR validation is:

1. current `/AGENTS.md` and then-current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Frontend roadmap/architecture, Scoring authority, Data contract or Social publishing authority introduced;
5. detailed roadmap and inventory remain mutually consistent;
6. referenced FINTECH registry/models/orchestration, Crypto classification, Buffett evidence/entitlement and Social MediaProject/render contracts are verified against then-current repository state;
7. shared Governance-owned registries are not modified by the Frontend branch;
8. applicable documentation/architecture validators are run where locally available; unavailable checks remain truthfully `NOT RUN`;
9. branch is synchronized with current `main` before PR readiness;
10. PR creation is separately approved for the exact current main SHA and branch-head SHA.

Documentation-only project-surface work does not by itself make Runtime, browser, accessibility or performance checks PASS. Hosted repository checks after PR creation remain separate merge-readiness evidence.

## Completion condition

The Frontend modernization roadmap closes only when:

- the project projection remains thin and non-authorizing;
- the singular Frontend architecture remains `src/app -> src/features -> src/shared`;
- approved visual functionality has canonical consumers or an explicit current Owner decision to remain disabled/archived;
- Buffett/Sentiment/Momentum Class-A surfaces consume valid current contracts without local financial fabrication;
- each intended Asset Universe can project applicable FINTECH model/orchestration metadata without a second registry/dispatcher;
- Crypto category/subclass tabs derive from canonical classification and show only FINTECH-owned formula/model semantics;
- web/Social visual projections are deterministic and semantically consistent, while Social retains render/publishing authority;
- foreign Scoring/Data/Evidence/IAM/Governance/Social contracts remain owned by their Primary Owners;
- Visualization, Server/Data Contract, Accessibility and Performance exit gates have current evidence at or above their target thresholds;
- Productive Legacy Exit reaches `10/10` with zero productive `src/components` implementations, zero required Compatibility re-exports, zero productive superseded UI aliases, zero Frontend consumers of superseded API contracts and zero productive Legacy Dashboard composition;
- all final BB-11 checks required by then-current repository authority are PASS on the exact merge candidate.
