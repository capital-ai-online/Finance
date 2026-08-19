# ADR-0086 — Governance Authority, Supersession and Regulatory Control Mapping

**Status:** PROPOSED — requires Human/Owner review and merge  
**Implementation-Status:** 🟡 IN PROGRESS  
**Date:** 2026-08-19  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** repository governance authority, supersession, regulatory control mapping, durable AI-evaluation evidence

## Context

The repository contains strong governance mechanisms but several active documents still expose historical process rules as if they were current. In particular, the former PR-body checkbox / `Viewed` / `💪` or `okay` pre-CI ritual was retired by the 2026-08-16 Owner addendum to Accepted ADR-0069 and by current PR/DevelopmentChain policies, while older root/library/ruleset text still describes that ritual as mandatory.

A second class of ambiguity exists when `PROPOSED` ADRs are referenced in `Authority:` lists without qualification. Document recency alone must not create authority.

The 2026-08-19 review also found that AI governance evidence is recorded in an in-memory process cache. That is useful operational telemetry but is not durable audit evidence.

## Decision

### 1. Deterministic authority hierarchy

The repository adopts the hierarchy defined by `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md`.

At minimum:

1. applicable law/regulation and binding external obligations;
2. explicit Human/Owner decisions and Accepted ADRs;
3. Accepted/Active ESS and policies within their delegated scope;
4. approved roadmaps/contracts/runbooks/traceability implementing higher authority;
5. Proposed/Draft material;
6. evidence/history/archive.

Recency only resolves conflicts within the same authority tier and scope, unless a higher authority explicitly delegates a different rule.

### 2. Proposed material is non-authorizing

A `PROPOSED` or `DRAFT` ADR/ESS may be cited as design input or planned implementation, but MUST NOT be presented as the sole normative authority for a protected mutation, merge, capability elevation, or security-control change.

### 3. Supersession requires Owner-visible impact evidence

Before semantic supersession or archival, the branch/PR must expose:

- old rule;
- proposed replacement;
- authority comparison;
- affected controls/files/workflows;
- operational/security/regulatory impact;
- rollback.

Historical evidence is retained; only its current normative status changes.

### 4. Retired checkbox/emoji gate is historical only

The 2026-08-16 ADR-0069 Owner addendum is the current Accepted Decision for this scope. Checkbox/Viewed/emoji requirements may remain in historical evidence, but current root governance and machine-readable policy must label them historical/non-normative.

### 5. Regulatory applicability is explicit, not assumed

The repository maintains a dated control matrix for:

- Regulation (EU) 2024/1689 (EU AI Act);
- Regulation (EU) 2022/2554 (DORA), with applicability explicitly marked `TBD / requires legal entity & regulated-activity classification` unless established;
- ISO/IEC 42001:2023 as a voluntary AIMS benchmark;
- NIST AI RMF 1.0 and NIST AI 600-1 as voluntary risk-management benchmarks.

The matrix does not itself claim that CAPITAL-AI is a regulated financial entity or that a particular AI system is high-risk.

### 6. Durable AI evaluation evidence

Runtime AI evaluation records gain an append-only Supabase persistence path using server-held privileged credentials. The existing in-memory list remains a bounded operational cache only. Persistence failures must never be represented as persisted evidence.

Production application of the new database migration is a separate external mutation and remains subject to the DevelopmentChain mutation gate.

### 7. M10 remains Human-only where defined

This ADR does not claim M10 completion. Owner passkey enrollment, recovery validation and controlled cutover remain Human/Owner-bound actions under the M10 runbook.

## Consequences

### Positive

- agents and reviewers can resolve current authority deterministically;
- historical governance evidence is preserved without being mistaken for current policy;
- regulatory requirements and voluntary benchmarks are separated from assumptions;
- AI evaluation evidence has a durable, append-only target;
- Proposed ADRs cannot silently bootstrap protected authority.

### Negative / cost

- more explicit metadata and cross-reference maintenance;
- a new database table/migration must be applied and verified before durable AI-evaluation persistence is available in production;
- regulatory applicability still requires qualified legal/entity classification where facts are not established in-repo.

## Verification / Definition of Done

1. current root governance no longer states the retired checkbox/emoji ritual as mandatory;
2. governance library distinguishes historical and current rules;
3. machine-readable main-protection policy has explicit current-authority metadata;
4. diff/impact package exists for the semantic supersession;
5. regulatory control matrix exists with applicability state and evidence gaps;
6. append-only AI-evaluation migration + server sink + unit tests exist;
7. branch is re-compared with current `main` and open PRs before PR creation;
8. Human Merge is still required.

## Rollback

Repository changes: revert through a new branch from current `main` and Human-reviewed PR.

Database: the migration is additive. If application code is reverted, the table may remain unused. Destructive removal requires a separate approved migration after evidence-retention review.
