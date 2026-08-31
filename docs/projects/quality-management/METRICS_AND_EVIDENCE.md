# CAPITAL-AI-QM — Metrics and Evidence Contract

This project consumes existing normative metrics and thresholds. It does not invent them.

## Evidence record

Every QM evidence record MUST contain at least:

| Field | Meaning |
|---|---|
| Evidence ID | stable unique evidence identifier |
| Observed commit | exact 40-character Git SHA where applicable |
| Observed environment | environment/runtime identity |
| Timestamp | observation time with timezone |
| Executor | workflow/tool/human executor identity |
| Contract / Validator | canonical authority or validator reference |
| Result | `PASS`, `FAIL` or `NOT_AVAILABLE` |
| Source artifact | traceable test report/log/manifest/measurement source |
| Status | evidence lifecycle state |
| Known limitations | gaps, skips, sampling or environment constraints |
| Related QM work item | `QM-*` reference |

## Result semantics

### PASS
Only complete, positive and correctly commit-bound evidence. For execution gates this requires proof the relevant process actually ran.

### FAIL
Observed negative evidence from the authoritative test/validator/measurement source.

### NOT_AVAILABLE
Missing, skipped, incomplete, expired, unbound, wrong-commit or otherwise non-reproducible evidence.

A file existing in the repository is never sufficient proof that its test passed.

## Measurement classes

- Contract/validator conformance.
- Test execution and coverage evidence.
- Build and runtime-release-manifest evidence.
- Frontend/runtime latency and blocking attribution.
- Auth/session request and recovery behavior.
- Bundle/chunk/lazy-load regression evidence.
- Accessibility verification evidence.
- Supply-chain provenance/attestation evidence.
- Technical-debt lifecycle evidence.
- Documentation/baseline drift evidence.
- 18-stage value-chain evidence completeness.

## Performance measurements

For QM-3/QM-4 capture raw observations such as navigation timings, long tasks, request waterfalls, render milestones, JavaScript execution, resource sizes, auth bootstrap spans and route transition traces. Use an environment identity and repeatable test profile.

Separate:

- **field/RUM evidence** — real-user distributions, device/network context and percentile semantics;
- **lab/regression evidence** — deterministic environment suitable for attribution and change comparison.

Current Core Web Vitals may be recorded as advisory evidence:

| Metric | External current “good” reference | QM status |
|---|---:|---|
| LCP | `<= 2.5 s` at p75 | `NON_NORMATIVE_ADVISORY` |
| INP | `<= 200 ms` at p75 | `NON_NORMATIVE_ADVISORY` |
| CLS | `<= 0.1` at p75 | `NON_NORMATIVE_ADVISORY` |

The p75 interpretation should be segmented at least by mobile/desktop when field evidence is used, following the current Web Vitals recommendation.

These values MUST NOT become Chapter-12 gates or merge blockers unless an existing CAPITAL-AI authority explicitly adopts them. A source-roadmap Lighthouse target is likewise not automatically a Quality Contract threshold.

## Accessibility evidence

WCAG 2.2 is the current W3C Recommendation and may be used as an advisory verification taxonomy. Where Frontend/Compliance already requires WCAG 2.2 AA, QM may collect execution evidence for the relevant success criteria but does not define accessibility policy.

Evidence should distinguish automated checks from manual/assistive-technology verification; an automated score alone does not establish conformance.

## Security-quality evidence

OWASP ASVS 5.0.0 may be used to classify security-verification evidence using version-qualified requirement IDs. QM does not implement Security policy or treat an unmapped ASVS item as an automatic CAPITAL-AI gate. Findings requiring mutation are handed to Security.

## Supply-chain evidence

SLSA v1.2 may be used as an advisory provenance/attestation crosswalk for the existing source/build/release pipeline. Prefer evidence from the current GitHub/attestation/release control path. Do not create a second CI pipeline, signer or release authority for QM.

## Telemetry rules

Prefer existing application/observability instrumentation and the existing EventMesh over a parallel telemetry bus. Correlate browser/runtime traces with build/runtime identity where available. Do not log tokens, credentials or protected user data as quality evidence.

OpenTelemetry browser semantic conventions, including `browser.web_vital`, currently have upstream `Development` status. If used, the adapter/schema version must be explicit and the upstream semantic convention must remain non-normative until stable/adopted internally.

## External-reference lifecycle

External standards are versioned observations, not CAPITAL-AI authority. Every external mapping should record:

- source and version/status;
- observation date;
- whether the external source is stable/final or draft/development;
- internal authority that would be required for adoption;
- whether the mapping is `NON_NORMATIVE_ADVISORY` or already backed by an internal contract.

NIST SP 800-218 SSDF v1.1 remains the current final baseline in the Agent Trust Root. SP 800-218 Rev.1 / SSDF v1.2 is an Initial Public Draft and is monitored only until finalization or explicit internal adoption.

## Storage

Repository evidence guidance lives under `docs/projects/quality-management/evidence/`. Large or generated CI artifacts remain in their authoritative CI/artifact store and are referenced rather than copied into Git history.