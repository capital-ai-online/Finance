# Runbook — QM Runtime Quality Triage

## Purpose
Reproduce runtime, authentication and frontend performance problems as independent Quality evidence, attribute them to the affected VC stage, and refer any required technical remediation to the Primary Owner.

## Flow

```text
Reproduce
 -> exact runtime identity
 -> timing/network/auth/rendering evidence
 -> dependency attribution
 -> affected VC stage
 -> Primary Owner lookup
 -> CONFIRMED finding
 -> [QUALITY_HANDOFF -> TARGET_PROJECT | VC-NN]
 -> target-project remediation
 -> EVIDENCE_READY
 -> QM verification gate
 -> VERIFIED / CLOSED
```

## Required discipline

- Separate network, server, JavaScript, rendering and auth-bootstrap delay.
- Record request duplication and causal ordering, not only total page time.
- Preserve existing Auth/Router/Public Shell/Runtime architecture.
- Reuse existing performance tests before adding Quality-specific evidence.
- Mark missing source evidence `NOT_AVAILABLE` rather than inferring a cause.
- Redact secrets, tokens and protected user data from traces.
- Assign every confirmed implementation finding to one primary `affected_vc_stage` and `target_project`.
- QM may specify required remediation and verification criteria but MUST NOT implement foreign-domain remediation.

## Output

A triage result is either:

1. `NOT_AVAILABLE` — insufficient reproducible evidence;
2. a non-remediation Quality observation; or
3. a complete finding record suitable for `QM-04` referral.

The target project owns its code/configuration change. QM owns the independent verification result.