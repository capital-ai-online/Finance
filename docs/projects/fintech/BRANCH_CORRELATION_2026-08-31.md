# CAPITAL-AI-FINTECH — Branch Correlation — 2026-08-31

**Correlation baseline:** `main@e434fce28630fc694b9dfe471418a2ac98eda9dd`  
**PR candidate branch:** `agent/fintech-v2-security-sync-20260831`

## Search result

FinTech-name branch search returned exactly two pre-existing branches:

1. `fintech/capital-ai-fintech-consolidation-20260831` — `e32112791458902959dfc53e0fd1f6df477cc356`;
2. `fintech/capital-ai-fintech-v2-ownership-20260831` — prior V2/Security integration branch, replaced for PR readiness by the current conforming `agent/fintech-v2-security-sync-20260831` branch.

Searches for `scoring`, `ranking`, `crypto` and `agent/fintech` returned no additional FinTech project branches. Provider-name searches exposed Security-owned branches; those are evaluated separately below and are not reclassified as FINTECH work.

## Older FinTech consolidation branch

At correlation time the older consolidation branch was **10 commits ahead of its old merge base and 107 commits behind current main**. It is therefore not safe to merge wholesale.

| Older branch artifact | PR-candidate disposition |
|---|---|
| `README.md` | superseded by `docs/projects/fintech/README.md` plus bounded legacy entry |
| `ROADMAP.md` | superseded by canonical `docs/projects/fintech/ROADMAP.md` |
| baseline assessment | findings carried into current inventory/validation; old exact-main assertions remain historical only |
| consolidation evidence | replaced by current-main validation + Security handoff correlation |
| `ASSET_PROVIDER_MATRIX.md` | reusable content carried forward as `docs/projects/fintech/PROVIDER_CAPABILITY_MATRIX.md`, re-baselined to current main |
| `CROSS_ROADMAP_TRACEABILITY.md` | semantic ownership and dependencies carried into `CROSS_PROJECT_DEPENDENCIES.md`, `MIGRATION_MATRIX.md`, PVC ownership and current work packages |
| old validation report | superseded by `docs/projects/fintech/VALIDATION_REPORT.md` |
| old work packages | superseded by `docs/projects/fintech/WORK_PACKAGES.md` / FIN-12..FIN-20 |
| master-roadmap edit | not replayed: current main owns newer portfolio state and current-main-first wins |
| SPT edit | reconciled through the current branch version of `SC-MD-SPT-0001`; technical `VC-*` remains separate from organizational `PVC-*` |

### Preserved actionable findings

The correlation preserves the older branch's still-material findings rather than silently dropping them:

- one productive ScoringModelRegistry and one productive ScoringDispatcher must remain unique;
- no synthetic/neutral score fallback;
- ProviderMatrix remains a capability/evidence registry, not scoring authority;
- provider runtime availability/entitlement is not inferred from static configuration;
- provider fallback requires semantic equivalence, freshness, provenance and DQ evidence;
- direct provider paths must not bypass the DATA boundary;
- model/document/provider-version drift remains maintenance work, not authority creation;
- ranking remains a FINTECH-owned business boundary with FE as consumer.

The older branch is therefore **considered and semantically subsumed**, but is not merged as an independent writer.

## Prior V2 branch

`fintech/capital-ai-fintech-v2-ownership-20260831` supplied the V2/PVC and Security-handoff content. Because current governance requires a project-identifiable approved agent prefix for PR readiness, its content was synchronized onto a fresh current-main branch:

`agent/fintech-v2-security-sync-20260831`.

No V2 file was discarded during the replacement. The replacement branch uses current main as merge base and preserves the prior V2 branch as history/reuse evidence only.

## Provider-related Security branches

### `agent/security-provider-hardening-20260831`

At correlation this branch was fully behind current main with `ahead_by=0`; it has no independent content to import.

### `agent/security-provider-credential-guard-20260831`

This branch remains Security-owned and contains Security tooling/tests for provider credential coverage. It has no `docs/projects/fintech/**`, scoring-registry, dispatcher, ranking or FINTECH runtime changes in its branch delta and has no open PR at correlation time.

Disposition: **FOREIGN SECURITY SCOPE / CONSIDERED / NOT MERGED**. FINTECH continues to reference Security verification boundaries through `SECURITY_HANDOFFS.md`; any later Security finding affecting PVC-12..17 must arrive through the canonical handoff contract.

## Open Pull Requests and writer conclusion

At the correlation baseline there were no open Pull Requests. No active writer with a claimed `docs/projects/fintech/**` path was discovered on current main. Security/Governance writer metadata remains foreign and does not transfer PVC ownership.

## Conclusion

All discovered FinTech-named branches have been explicitly correlated. The PR candidate is the single current FINTECH writer for this work item. Older/stale branches are treated as reuse/history inputs, not parallel merge authorities.