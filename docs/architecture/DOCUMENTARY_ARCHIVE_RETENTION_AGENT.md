# Documentary Archive Retention Agent

**Status:** IMPLEMENTED ON BRANCH / EFFECTIVE AFTER HUMAN MERGE  
**Date:** 2026-08-22  
**Parent authorities:** ADR-0097 · Documentary · Agent IAM · Document Lifecycle Governance  
**Schema:** `documentary-archive-retention/1.0.0`

## Decision

Archive cleanup is implemented as a bounded capability of the existing Documentary maintenance architecture. It is **not** a second Documentary agent framework, deletion service, scheduler, queue, Governance authority or PR pipeline.

```text
Documentary inventory / references / registry
        ↓
ArchiveRetentionAgent.assess
        ↓
retain | owner-review | delete-eligible
        ↓
explicit Owner approval
        ↓
existing Agent IAM / kill switch
        ↓
agent/documentary-maintenance-* branch
        ↓
normal deletion patch + existing PR handoff
        ↓
Human/CODEOWNER merge
```

`ArchiveRetentionAgent` itself never deletes a file. `planDeletion()` returns a deterministic path plan with `mutationPerformed=false`.

## Protected history

The following classes are never automatically delete-eligible merely because they are archived:

- registered documents;
- referenced documents;
- ADR/ESS/Authority artifacts;
- Governance/Compliance/Security/Legal material;
- Evidence/Traceability records;
- non-reproducible historical snapshots.

Git history is useful fallback traceability but does not justify deleting required governance/evidence records from the working repository.

## Delete-eligible classes

Automatic eligibility is intentionally narrow and currently restricted to:

- `docs/archive/generated/**`
- `docs/archive/transient/**`

A candidate must additionally be:

- at least 90 days old;
- unregistered;
- unreferenced;
- not an authority artifact;
- not evidence/security/compliance material;
- deterministically reproducible;
- backed by an explicit canonical duplicate path.

Any uncertainty yields `retain` or `owner-review`, never delete eligibility.

## Destruction gate

Even a `delete-eligible` result requires all of:

1. explicit Owner approval;
2. inactive Agent-IAM kill switch;
3. existing `agent/documentary-maintenance-*` branch boundary;
4. ordinary Work Claim / main-correlation rules;
5. a normal repository deletion patch;
6. hosted PR validation;
7. Human/CODEOWNER merge.

No direct `main`, filesystem, production or external platform deletion capability is added.

## Value-chain relationship

Archive retention belongs to Documentary/change governance and observes the financial chain only through the existing VC-17 EventMesh/Traceability/Supervisor evidence boundary. It cannot mutate MarketData, Evidence/DQ, Scoring, Ranking, Eligibility, OrderIntent, Compliance decisions, deployment or production state.
