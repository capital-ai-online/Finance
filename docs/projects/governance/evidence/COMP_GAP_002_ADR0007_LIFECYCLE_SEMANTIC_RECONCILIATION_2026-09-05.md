# COMP-GAP-002 / ADR-0007 Lifecycle & Semantic Reconciliation — 2026-09-05

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Work item:** `GOV-CHAT-062 / COMP-GAP-002`  
**Branch:** `agent/governance-adr0007-lifecycle-semantics-v2-20260905`  
**Initial current-main baseline:** `main@948d0e56036fe9c7132f83212e21116499bb7ae8`  
**Current re-correlation baseline:** `main@9a30f5cd87c68febdebc99d13447432ed712ab71` after Human merge of Compliance PR #753  
**Decision state:** implemented on scoped branch; non-authorizing until Human/CODEOWNER merge

## Finding

Legacy `docs/adr/ADR-0007-compliance-value-chain.md` declared `ACCEPTED` but had never been migrated into the current ADR Registry or Authority Registry. Its five-stage "Compliance Value Chain" combined Data ingestion/validation, Privacy/PII, FinTech/scoring, audit/traceability, Documentary/export behavior and broad legal/certification assertions in one omnibus architecture decision.

Current repository ownership and authority no longer support that omnibus boundary. `CAPITAL-AI-COMP` is cross-cutting and owns no productive PVC merely because it assesses those concerns.

Human-merged Compliance PR #753 changed only Compliance mapping/traceability files and remained a foreign assessment consumer. Its merge does not transfer ADR lifecycle authority away from `CAPITAL-AI-GOV / PVC-05` and does not conflict with this six-file Governance scope.

## Lifecycle decision

**Decision: `ARCHIVE / HISTORICAL — NON-AUTHORIZING`.**

The decision is deliberately **not** an active migration and **not** a global supersession:

- active migration would recreate an obsolete cross-domain Compliance architecture authority;
- no single current ADR/ESS/Authority replaces the full five-stage scope, so a global `supersedes` edge would be semantically false;
- historical retention preserves the original Owner decision and audit trail while preventing its legacy legal/certification language from becoming current authority through path or age.

Stable historical identity:

`AUTH-ADR-LEGACY-COMPLIANCE-VALUE-CHAIN-0007`

## Semantic mapping to current ownership / authority

| Legacy ADR-0007 stage | Current treatment | Current ownership / authority boundary |
|---|---|---|
| Data ingestion / validation | preserve intent only; no Compliance runtime authority | `CAPITAL-AI-DATA / PVC-09..PVC-11`; applicable current Data/Evidence contracts including ADR-0032 and ADR-0041 / ESS-0016 |
| Privacy / PII masking | current privacy authority controls; legal applicability remains separate | ADR-0095; ADR-0092; ADR-0086 where applicable; Human/Legal for legal conclusions |
| deterministic calculation / sentiment | canonical scoring remains separate from Compliance | `CAPITAL-AI-FINTECH / PVC-12..PVC-17`; ADR-0087 / `SC-MD-SPT-0001` |
| audit / traceability | consume existing traceability/event evidence; no blanket "immutable" guarantee inferred | current Traceability/Event contracts, including ESS-0011 and mapped `PVC-18` ownership where applicable |
| certificates / PDF export | evidence packaging/document production, not automatic legal certification | `CAPITAL-AI-DOC / PVC-03`; current Documentary contracts including ESS-0010 / ESS-0012 and applicable ADRs |

## Repository changes

- added canonical historical artifact: `docs/adr/historical/ADR-0007-compliance-value-chain.md`;
- replaced the former active path with a non-authorizing compatibility redirect: `docs/adr/ADR-0007-compliance-value-chain.md`;
- registered ADR-0007 as `historical` in `docs/adr/registry.json` with no `supersedes` edge;
- registered the same stable identity/lifecycle/path in `docs/governance/authority-registry.json` at historical precedence tier 5;
- added `tests/unit/adr0007LifecycleSemanticReconciliation.test.ts` to enforce registry, redirect and semantic-boundary invariants.

## Foreign-owner runtime correlation

`src/components/AdminPortal.tsx` still contains presentation metadata that references display ID `ADR-0007` for Markdown, audit-log and Documentary surfaces. That productive Frontend/UI file is **not changed by this Governance work item** because Governance does not absorb foreign runtime ownership.

After this reconciliation those occurrences are compatibility references only. If a current user-facing surface presents ADR-0007 as active authority, correction belongs to the relevant current Primary Owner / Frontend project on a separate owner-scoped branch after correlation to current presentation contracts.

## Claim / legal boundary

Historical ADR-0007 phrases implying complete protection, regulator-ready evidence, legal defensibility or automatic compliance certification are preserved only as history. They do not establish present legal applicability, compliance status, certification, supervisory acceptance or reduced liability.

Current Compliance assessment continues to require current scoped evidence and, where legal interpretation is necessary, Human/Legal review.

## Reuse / architecture pre-check

No new Governance, Compliance, Privacy, Data, Scoring, Traceability, Documentary or registry architecture is introduced. The work reuses the existing ADR historical/redirect lifecycle pattern already enforced for retired ADRs and reuses current canonical owner/authority contracts instead of constructing a replacement "Compliance Value Chain" runtime.

External ADR lifecycle guidance was considered advisory only; repository authority and the final lifecycle decision derive from current `/AGENTS.md`, current registries, PVC ownership and repository-visible architecture/evidence.

## Validation contract

Pre-PR evidence must remain truthful:

- current-main / branch-head / open-PR / overlap correlation: required immediately before PR approval;
- JSON parse and registry identity consistency: to be statically checked from exact branch state;
- `tests/unit/adr0007LifecycleSemanticReconciliation.test.ts`: **NOT RUN** unless an execution surface is actually used;
- broader unit / Documentation Hygiene / Governance hosted checks: **NOT RUN pre-PR** unless explicitly executed;
- GitHub hosted checks: only after PR creation and never reported PASS before observed.

## Exit gate

COMP-GAP-002 / GOV-CHAT-062 reaches `DONE_MAIN` only after:

1. exact branch state is synchronized and correlated to then-current `main`;
2. required Human/Owner PR-create approval is obtained for the exact SHA pair and exact intended PR title;
3. the PR is created from the conforming branch/template state;
4. required hosted checks pass on the exact PR head;
5. Human/CODEOWNER merges the PR.

Until then this evidence is branch-local implementation evidence only and does not alter current-main authority.
