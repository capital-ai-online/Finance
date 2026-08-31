# Runbook — QM Roadmap Takeover and Sync

## Purpose
Transfer quality execution from a domain roadmap without transferring domain authority.

## Procedure
1. Determine current `main` and bind the observation to its exact SHA.
2. Correlate open PRs and active work claims.
3. Read the source roadmap and its governing ADR/ESS.
4. Classify the item: `DOMAIN_IMPLEMENTATION`, `QUALITY_EXECUTION`, `MIXED`, `NOT_QM`.
5. For `MIXED`, extract only the quality verification/evidence subtask.
6. Assign the canonical `QM-*` item.
7. Add exactly one mapping to `TAKEOVER_INDEX.md`.
8. Add the `QUALITY-MANAGEMENT TAKEOVER` marker to the source subtask only.
9. Change the source quality subtask state to `HANDED_OFF_TO_QM`.
10. Remove parallel operational QM status tracking.
11. Reuse existing tests, contracts, validators and telemetry.
12. Validate links and authority boundaries.

## Stop conditions
Do not take over a task if doing so would move Security, IAM, Compliance, Governance, Release, Frontend Product or Financial Runtime mutation authority into QM.