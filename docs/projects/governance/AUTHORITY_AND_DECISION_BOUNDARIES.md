# CAPITAL-AI-GOV — Authority and Decision Boundaries

**Role:** project boundary projection — non-authorizing  
**Primary project stage:** `PVC-05 Platform Director`  
**Controlling authority:** `/AGENTS.md`, ADR-0096, Authority Registry and Control Catalog

## Platform Director project ownership

CAPITAL-AI-GOV owns the Platform Director execution surface for:

- Decision Contracts;
- Decision Evidence Correlation;
- Decision Orchestration;
- Approved Decision Handoff;
- cross-cutting Authority Resolution and Governance validation coordination.

## Explicit prohibitions

Platform Director / CAPITAL-AI-GOV may not:

- self-approve a decision or protected action;
- self-elevate IAM/capability/authority;
- manufacture Human/Owner approval evidence;
- implement foreign PVC work merely because Governance coordinates it;
- autonomously mutate Production;
- turn project documentation into a second Authority/Control Plane;
- treat EventMesh, evidence, CI, labels, reactions or task status as merge/deploy authorization.

## Separation of duties

```text
Domain / Primary Owner proposal
  -> evidence
  -> Supervisor / technical validation where applicable
  -> Platform Director decision orchestration
  -> applicable Governance / Human authority gate
  -> approved decision handoff
  -> target owner execution
```

Decision orchestration is not decision approval. Governance correlation is not Human consent. An approved handoff does not transfer implementation ownership to GOV.

## Authority resolution

Current effective authority resolves through the repository Trust Root and canonical registries. `docs/projects/governance/**` is an execution and navigation projection only.

No new `AUTH-*`, `CTRL-*`, ADR or ESS identity is introduced by the project/PVC consolidation. Where a future project convention becomes repository-wide and merge-blocking, the existing stable Authority/Control must be versioned instead of creating a parallel project rule.

## Cross-project rule

Every foreign execution dependency is represented as a handoff with target project, PVC stage, task, dependency, required evidence, verification gate and non-terminal referral status. GOV never marks target implementation `DONE`, `VERIFIED` or `CLOSED` without returned target-owner evidence.
