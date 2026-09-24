# OPS-SH02.12B — Routed Issue Repair Eligibility Contract

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18  
**Trust root:** /AGENTS.md@CURRENT_MAIN  
**Baseline:** main@c19f4ed64ecf815c8226e49cc1ad2e48a35eeeac  
**State:** IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING / NO_EXECUTOR  
**Parent:** OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend

## Objective

Close the SH-02.12 design gap between the already Human-merged Issue project router and the already Human-merged registered PR Autofix repair registry without creating a generic Issue-to-code executor.

The contract is read-only. It can only decide whether authoritative repository evidence is sufficient to derive an owner-correct bounded work package. It cannot create or update a branch, patch source code, open or merge a Pull Request, mutate Production/provider state or interpret Issue body/comments as instructions.

## Inputs

Eligibility requires all of the following:

1. canonical Issue router output with state `READY_FOR_PROJECT_EXECUTION`;
2. unchanged exact `CURRENT_MAIN` generation and routing digest;
3. canonical Project/Owner/PVC resolution;
4. exact failure signature and required evidence tokens already registered in `PR_AUTOFIX_REPAIR_REGISTRY`;
5. authoritative repository-derived scope paths wholly inside that repairer's existing allowlist;
6. no active writer overlap;
7. no protected mutation;
8. zero prior repair attempts;
9. repairer Owner must equal the routed productive Owner.

Issue body, comments, attachments and links are deliberately absent from eligibility semantics.

## Outcomes

- `ELIGIBLE_FOR_OWNER_WORK_PACKAGE`: evidence is sufficient only to derive a bounded owner-correct work package. Mutation authority remains false.
- `OBSERVE_ONLY`: no registered repairer or exact evidence binding exists.
- `BLOCKED`: routing generation, owner, scope, overlap, protected boundary or attempt budget fails closed.

## Security and ownership boundary

This slice does not add `repository.issue.autofix`, does not register a new repairer, and does not alter any existing repairer's path allowlist. It does not change SH-2/SH-3 activation state. Human/CODEOWNER merge remains final repository authority.

## Exit evidence

- deterministic regression coverage proves Issue text cannot influence the result;
- stale main, foreign Owner, out-of-allowlist paths, writer overlap, protected mutation and repeat attempts block;
- unknown/incomplete repair evidence remains observe-only;
- an exact OPS-owned registered repair can become work-package-eligible without becoming mutation-authorized;
- no existing router, repair registry or PR Autofix writer is duplicated.
