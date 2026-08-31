# CAPITAL-AI-QM — Metrics, Findings and Evidence Contract

**Project contract:** `CAPITAL-AI-QM-V2` v2.1  
**Workstreams:** `QM-01` through `QM-08`

QM consumes existing normative metrics, thresholds and domain evidence. It does not invent foreign-domain policy or execute foreign-domain remediation.

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
| Related QM workstream | `QM-01..QM-08` |
| Affected VC stage | `VC-01..VC-18` where applicable |
| Primary Owner | project from the canonical QM owner routing table |

## Finding record

Every confirmed QM finding MUST contain:

| Field | Rule |
|---|---|
| `finding_id` | stable unique identifier |
| `affected_vc_stage` | exactly one primary `VC-01..VC-18`; additional affected stages may be references only |
| `target_project` | Primary Owner project responsible for remediation |
| `severity` | existing authoritative severity semantics; QM does not invent a second scale |
| `evidence` | one or more reproducible evidence references |
| `required_remediation` | bounded technical outcome; implementation remains with target project |
| `verification_gate` | exact QM verification procedure/evidence required after remediation |
| `status` | lifecycle state below |

Finding lifecycle:

```text
DISCOVERED
-> TRIAGED
-> CONFIRMED
-> REFERRED
-> REMEDIATING
-> EVIDENCE_READY
-> VERIFIED
-> CLOSED
```

`REMEDIATING` is the target project's implementation state as observed by QM; it does not transfer implementation authority.

A finding that requires implementation MUST carry:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

and a canonical target roadmap/PR reference plus a chat notice.

## Result semantics

### PASS
Only complete, positive and correctly identity-bound evidence. For execution gates this requires proof the relevant process actually ran.

### FAIL
Observed negative evidence from the authoritative test/validator/measurement source.

### NOT_AVAILABLE
Missing, skipped, incomplete, expired, stale, unbound, wrong-commit or otherwise non-reproducible evidence.

A file existing in the repository is never sufficient proof that its test passed.

## Measurement classes

- Contract/validator conformance (`QM-01`, `QM-02`).
- Test execution and coverage evidence (`QM-02`, `QM-07`).
- Build and runtime-release-manifest evidence (`QM-02`, `QM-07`).
- Frontend/runtime latency and blocking attribution (`QM-03`).
- Auth/session request and recovery behavior (`QM-03`, `QM-05`).
- Bundle/chunk/lazy-load regression evidence (`QM-05`).
- Accessibility verification evidence (`QM-03`, `QM-07`).
- Supply-chain provenance/attestation evidence (`QM-07`).
- Technical-debt lifecycle evidence (`QM-06`).
- Documentation/baseline drift evidence (`QM-08`).
- 18-stage value-chain evidence completeness (`QM-03`, `QM-07`, `QM-08`).

## Performance measurements

For `QM-03`/`QM-05`, capture raw observations such as navigation timings, long tasks, request waterfalls, render milestones, JavaScript execution, resource sizes, auth bootstrap spans and route transition traces. Use an environment identity and repeatable test profile.

Separate:

- **field/RUM evidence** — real-user distributions, device/network context and percentile semantics;
- **lab/regression evidence** — deterministic environment suitable for attribution and change comparison.

Current Core Web Vitals may be recorded as advisory evidence:

| Metric | External current “good” reference | QM status |
|---|---:|---|
| LCP | `<= 2.5 s` at p75 | `NON_NORMATIVE_ADVISORY` |
| INP | `<= 200 ms` at p75 | `NON_NORMATIVE_ADVISORY` |
| CLS | `<= 0.1` at p75 | `NON_NORMATIVE_ADVISORY` |

These values MUST NOT become Chapter-12 gates or merge blockers unless an existing CAPITAL-AI authority explicitly adopts them.

## Accessibility evidence

WCAG 2.2 may be used as an advisory verification taxonomy. Where an existing Frontend/Compliance authority already requires a criterion, QM may collect execution evidence but does not define accessibility policy.

Automated checks and manual/assistive-technology verification must be distinguished; an automated score alone does not establish conformance.

## Security-quality evidence

OWASP ASVS 5.0.0 may be used to classify security-verification evidence using version-qualified requirement IDs. QM does not implement Security policy. A confirmed remediation finding is routed to the Primary Owner for its actual VC stage.

## Supply-chain evidence

SLSA v1.2 may be used as an advisory provenance/attestation crosswalk for the existing source/build/release pipeline. Do not create a second CI pipeline, signer or release authority for QM.

## Telemetry rules

Prefer existing application/observability instrumentation and the existing EventMesh over a parallel telemetry bus. Correlate browser/runtime traces with build/runtime identity where available. Do not log tokens, credentials or protected user data as quality evidence.

OpenTelemetry browser semantic conventions may be used only with explicit schema/version status where applicable; upstream development semantics are non-normative until stable/adopted internally.

## External-reference lifecycle

External standards are versioned observations, not CAPITAL-AI authority. Every external mapping should record source/version/status, observation date, stability, internal adoption authority and whether the mapping is `NON_NORMATIVE_ADVISORY`.

NIST SP 800-218 SSDF v1.1 remains the current final baseline in the Agent Trust Root; later draft revisions are monitored only until finalization or explicit internal adoption.

## Storage

Repository evidence guidance lives under `docs/projects/quality-management/evidence/`. Large/generated CI artifacts remain in their authoritative CI/artifact store and are referenced rather than copied into Git history.

## Closure invariant

A finding may transition `VERIFIED -> CLOSED` only after target-project remediation evidence exists and the declared `verification_gate` has actually executed successfully. PR/commit existence alone is never closure evidence.