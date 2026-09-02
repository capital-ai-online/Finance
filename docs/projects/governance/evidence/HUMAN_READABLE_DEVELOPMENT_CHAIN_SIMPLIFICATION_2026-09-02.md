# CAPITAL-AI-GOV — Human-readable DevelopmentChain Simplification

**Date:** 2026-09-02  
**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Owner:** Platform Director  
**Baseline at work start:** `main@5db8062d3062e93f004cf0b75f190a9c649821f8`  
**Branch:** `agent/governance-human-readable-workflow-20260902`  
**Status:** `IMPLEMENTED ON BRANCH / HUMAN MERGE REQUIRED`

## Owner direction

The Owner requested removal of Candidate-Head-style repository governance and a return to understandable single-Owner development centered on ESS, ADR, Roadmap and the value chain.

The resulting Human-readable development model is:

```text
PROJECT VALUE CHAIN / PVC
→ PROJECT ROADMAP
→ APPLICABLE ADR
→ APPLICABLE ESS
→ CODE / TESTS / EVIDENCE
```

## Terminology change

Retired from **current Governance/Git lifecycle terminology**:

- `Candidate Head`;
- `candidate snapshot`;
- `candidate SHA`;
- `candidate_sha` evidence field;
- `accepted candidate` as a post-merge ADR/ESS state;
- `roadmap candidate` / `consolidation candidate` where the project surface is already canonical.

Current Git terms:

- `main SHA`;
- `branch head SHA`;
- `PR head SHA`;
- `merge SHA`.

This does **not** prohibit legitimate fachliche uses of “candidate”, for example ranking candidates, asset candidates, rename candidates, model challengers or a provider/endpoint that is genuinely under evaluation. The retired meaning is the parallel Governance lifecycle around a repository branch/PR state.

## Governance architecture impact

The change keeps the existing trust/registry architecture and simplifies how Humans navigate it:

- `/AGENTS.md` remains the sole repository-wide trust root;
- Project Value Chain resolves ownership;
- project Roadmap resolves current work/status;
- ADR records material architecture decisions;
- ESS records component/capability contracts;
- code/tests/evidence establish implementation truth;
- `AUTH-*`, `CTRL-*`, registries, work claims and historical handoff records remain supporting machine-readable integrity/audit metadata.

No new parallel Governance, Registry, Release, Security, Data, Scoring, Agent or runtime architecture is created.

## Version correlation

| Artifact | New resolution |
|---|---|
| `/AGENTS.md` | Control Plane `2.6.0` |
| Human Owner PR Approval Policy | `3.3.0` |
| DevelopmentChain Execution Policy | `2.4.0` |
| Control Catalog | `1.17.0` |
| Authority Registry | `1.50.0` |
| ADR Registry | `1.33.0` |
| ADR-0104 | `1.5.0 / ACCEPTED` after Human Merge of this version |
| ESS Registry | `1.7.0` |
| ESS-0019 | `1.2.0 / ACCEPTED` |
| Enterprise DevelopmentChain Index | `2.8.0` |

No new `AUTH-*`, `CTRL-*`, ADR display ID or ESS number was allocated.

## Project/Roadmap cleanup

The active Governance Roadmap was reduced to current Governance work with DR-02B explicitly next after this cleanup reaches Human Merge and current `main` is re-correlated.

Additional stale lifecycle projections were corrected:

- Documentary WP-DOC-05 is now represented as Human-merged; GitHub confirms PR #679 and later claim release through PR #700;
- DATA project surface/Roadmap is `ACTIVE — CANONICAL`, not consolidation candidate;
- Social domain/Roadmap is `ACTIVE — CANONICAL`, not roadmap candidate;
- Compliance evidence and Roadmap use exact `PR head SHA` terminology;
- historical Security handoff files are compatibility/audit indexes, not current routing policy;
- historical User-Lifecycle and M0–M10 material is explicitly non-authorizing.

## Security / production boundary

This repository package performs no:

- production deployment;
- Render/Supabase/Stripe mutation;
- database migration;
- billing or entitlement mutation;
- secret/IAM mutation;
- scoring/ranking runtime change;
- provider adapter/runtime activation.

Human/Owner PR creation and Human/CODEOWNER-only merge remain preserved. Protected external mutations remain separately governed.

## Validation claims

Connector-level structural checks can establish branch/main ancestry, changed-file scope, open-PR overlap and registry/document correlation.

Local repository commands are **not claimed PASS** unless actually executed. The execution environment used for this work previously lacked working direct GitHub DNS for local clone-based validation. Hosted repository checks must therefore provide the independent final validation after PR creation where required.

## Next Roadmap gate

After this simplification is Human-merged:

1. re-read then-current `main` and open PRs;
2. start a fresh `CAPITAL-AI-GOV / PVC-05` branch for **DR-02B — ADR-0060 Supply-Chain Authority Drift Reconciliation**;
3. only after DR-02B reaches a terminal Governance state should `CAPITAL-AI-OPS` begin DR-03 productive provider-adapter implementation.
