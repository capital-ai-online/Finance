# Runbook — QM CI Regression Gate

## Purpose
Convert authoritative CI results into reproducible Quality evidence without creating a second CI authority.

## Authority
CI topology and required checks remain governed by ADR-0073 and ADR-0047.

## Verify
- exact commit SHA;
- workflow identity and trigger;
- complete required jobs;
- Unit, Integration, Contract, Architecture, Security, Performance and E2E results as applicable;
- build result;
- coverage artifacts;
- abort/cancel/skip states;
- runtime release manifest/finalizer where required;
- regression against the accepted baseline.

A green partial job cannot replace a failed, skipped or unexecuted required gate.

## Output
`PASS`, `FAIL` or `NOT_AVAILABLE`, with source artifact and exact-head identity.