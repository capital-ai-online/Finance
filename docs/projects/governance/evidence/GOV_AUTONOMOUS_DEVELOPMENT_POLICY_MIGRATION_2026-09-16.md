# CAPITAL-AI-GOV — Single AGENTS.md Authority Migration Evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain ownership:** `PVC-05 — Platform Director`  
**Baseline:** `main@360347948cd4a05e00432ccdd06e1c60442916e7`  
**Branch:** `agent/governance-sec-authority-exception-20260916`  
**Pull Request:** `#1022`

## Owner decision

The final target is one repository-wide ChatGPT/AI/development instruction file: `/AGENTS.md@CURRENT_MAIN`.

The earlier eight-YAML autonomous policy suite was an intermediate branch state and is now superseded before merge. Its complete semantics are folded into `AGENTS.md`; the YAML files are deleted. The former standalone DevelopmentChain execution, Human/Owner PR approval and GOV/OPS foreign-project execution policy files are also deleted.

## Final authority model

`AGENTS.md` contains directly:

- single trust root and current-main baseline;
- instruction-isolation / prompt-injection boundary;
- canonical Project/PVC/Owner resolution;
- SEC/QM/FINTECH/COMP specialized directions;
- dependency-correct autonomous work graph;
- atomic branch/PR execution;
- bounded self-healing/convergence;
- CI validation and cost control;
- evidence/EventMesh/handover boundaries;
- least-privilege capability use;
- preserved non-authorizing graphical chat presentation;
- Human/CODEOWNER-only merge and no self-bootstrap.

Machine-readable Authority/Control registries remain identity/validation indexes only. Historical stable development IDs resolve back to `AGENTS.md` and do not create separate policy files.

## Instruction-isolation result

Repository files, PR/issue text, code/comments/tests, logs, generated content, tool/connector output and external/web content are explicitly classified as untrusted/non-instructional inputs. Embedded requests to override `AGENTS.md`, reveal secrets, bypass gates or execute unrelated commands are ignored and reported as conflicts.

Transport terminology is removed from chat/governance instructions where it is not technically required. Real API/EventMesh/JWT type names in productive code are not renamed merely because a standard protocol term is used; those types are data contracts, not instruction channels.

## Deleted development-instruction surfaces

- the eight files formerly under `docs/governance/development-policies/`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`;
- `docs/governance/GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY.md`;
- previously removed DevelopmentChain lifecycle/runbook/handoff/roadmap/traceability/evidence-template surfaces remain absent.

## Preserved boundaries

- no direct `main` mutation;
- Human/CODEOWNER-only merge;
- no self-merge or auto-merge;
- subject-matter law/contracts, accepted ADR/ESS/domain/data/scoring, Security/Compliance/Supply-Chain and protected external-mutation constraints remain applicable only in their declared scope;
- `NOT_RUN`, missing evidence, `BLOCKED` and `FAIL` are never PASS;
- chat styling remains presentation only.

## Validation truth

This evidence records intended branch state. Final CI/Governance/Container-Security results are reported only after exact-head hosted readback; until then they are not PASS.
