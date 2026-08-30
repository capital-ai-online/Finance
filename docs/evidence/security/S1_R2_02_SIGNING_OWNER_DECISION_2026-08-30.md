# S1-R2-02 — Owner Decision: Commit Signing Optional

- Date: 2026-08-30
- Repository: `SvenKulessa/Finance`
- Baseline at decision synchronization: `main@4e3de6f489989e64962225874dd7dd69400fcd95`
- Decision authority: Human/Owner
- Classification: ACTIVE GOVERNANCE DECISION

## Decision

Commit signing is not a mandatory CAPITAL-AI merge-readiness, PR-creation, CI, or protected-main control under the current Owner decision.

`required_signatures` must remain disabled unless a later explicit Human/Owner decision re-enables it. Signed commits remain allowed as optional provenance evidence but unsigned commits are not rejected solely because no verified signature exists.

## Controls that remain mandatory

The signing decision does not weaken the remaining repository governance floor:

- branch-based changes; no direct agent changes to `main`;
- Human/Owner-only merge decision;
- CODEOWNER review where required by the live ruleset;
- strict required status checks;
- non-fast-forward protection;
- required linear history;
- bypass-free ruleset posture;
- post-change provider readback and evidence binding for security/governance mutations.

## Rationale

The active ChatGPT/GitHub connector cannot use the Owner's private signing key. Requiring verified signatures for every AI-assisted commit introduces a manual re-signing step without changing the Human/Owner merge authority or the independent required-check gates. The Owner therefore explicitly removes commit signing from the mandatory control set while retaining the stronger branch, review, CI, history, and bypass controls.

## Reactivation

Commit signing may become mandatory again only through a new explicit Human/Owner decision and corresponding canonical policy, roadmap, evidence, and live-ruleset synchronization.
