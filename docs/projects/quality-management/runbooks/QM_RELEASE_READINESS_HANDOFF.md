# Runbook — QM Release Readiness Handoff

## Purpose
Produce a non-authorizing Quality recommendation for the existing release/governance process.

```text
QM quality snapshot
 -> Domain owner review
 -> Governance / Security / Compliance gates
 -> Human / Owner decision
 -> Release Control Plane
```

QM may report:
- `QUALITY READY`
- `QUALITY BLOCKED`
- `QUALITY EVIDENCE INCOMPLETE`

The report covers existing Contract, Architecture, Version, Documentation, Test, Security-quality, Compliance-quality, Build, debt, regression and missing-evidence signals.

`QUALITY READY` never means merge, deploy or production authorization. QM does not trigger a merge, deployment or production apply.