# ADR-0028 — Screening SLO, empirical confidence and horizon-exact validation

## Status
Accepted for staged implementation.

## Context
CAPITAL-AI already separates canonical financial scores from operational screening evidence. Screening eligibility, provider SLA and empirical score validation exist as independent contracts, but runtime confidence was not yet observable in the Supervisor and historical score validation still compares old snapshots with the current registry price instead of a verified price near the exact validation horizon.

## Decision
1. Runtime score-confidence evidence is represented by `score-confidence-evidence/1.0.0` and is created only by an actually executed score-validation run.
2. `INSUFFICIENT_DATA` always carries `confidencePct: null`; no default confidence is permitted.
3. Confidence is observability/model-risk evidence only. It must not alter the canonical score or recommendation and must not be represented as execution probability.
4. Screening operational evidence remains separate from the score through `screening-operations/1.0.0`, `screening-sla/1.0.0` and `screening-slo-evidence/1.0.0`.
5. Future horizon-exact validation must use `horizon-validation-evidence/1.0.0`: only a verified provider observation inside an explicitly bounded target window around `snapshotDate + horizonDays` is admissible.
6. Interpolation, registry bootstrap values and synthetic price evidence are forbidden for horizon validation.
7. Persistent SLO/validation evidence may be added during production handoff, but this development change does not create or mutate Supabase/Render configuration.

## Consequences
- Supervisor can expose real validation-confidence state without fabricating a metric.
- Current score validation remains explicitly limited until provider-backed historical retrieval is wired into the horizon contract.
- Missing historical evidence reduces validation sample size instead of silently substituting a value.
- Activating any score/ranking hard gate from SLA or confidence requires a separate reviewed ADR and calibrated production evidence.

## Non-goals
- No score-weight modification.
- No trading/execution probability.
- No automatic hard-gate activation.
- No UI redesign.
