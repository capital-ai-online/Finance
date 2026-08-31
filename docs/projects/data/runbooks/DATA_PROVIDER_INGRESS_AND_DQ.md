# DATA Runbook — Provider Ingress & DQ

## Purpose

Operate or migrate a provider path without bypassing the canonical DATA trust boundary.

## Procedure

1. Resolve UAI identity first; do not treat catalog/provider symbols as evidence.
2. Register/resolve the provider through the approved provider matrix/registry for the capability.
3. Fetch provider output as untrusted input.
4. Apply existing Security source-policy/credential/SSRF/input controls where applicable; do not create a second Security layer inside DATA.
5. Validate provider schema, symbol/asset binding, timestamps and numeric fields.
6. Create/preserve evidence identity and correlation lineage.
7. Evaluate provenance completeness.
8. Evaluate freshness against the explicit capability/consumer max age.
9. Apply DQ status mapping from `DATA_CONTRACTS.md`.
10. Reject `FAIL`, `STALE`, `MISSING`, `NOT_COMPUTABLE` and `UNKNOWN` from numeric downstream input.
11. Emit operational health/event evidence without exposing secrets/provider payloads unnecessarily.
12. Preserve compatibility facades only when real consumers remain; never create a second ingress authority.

## Negative-path requirements

- malformed payload -> non-PASS;
- provider exception -> non-PASS;
- missing price/value -> `MISSING`/`NOT_COMPUTABLE`, never zero;
- stale source timestamp -> `STALE`;
- missing evidence/provenance -> non-PASS;
- conflicting evidence -> `FAIL`/`UNKNOWN` by explicit policy;
- unavailable provider -> explicit unavailable/missing state, no synthetic fallback;
- wrong asset/provider identity -> non-PASS;
- credential/source-policy violation -> deny/non-admissible, never fallback success;
- untrusted content cannot expand provider or agent authority.

## Security handoff interaction

For `S1-R2-11`, DATA additionally proves evidence identity/freshness behavior against immutable current identities. PR/trace/DevelopmentChain tooling changes discovered during that work are not implemented here; route them to CAPITAL-AI-OPS.

## Exit evidence

Record exact candidate SHA, contract versions, provider/matrix version, relevant unit/contract/Security test outcomes, negative tests, remaining compatibility paths and unresolved cross-project dependencies.
