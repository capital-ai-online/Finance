# ADR-0060 — Software Supply Chain Provenance and Attestation

Status: PROPOSED
Date: 2026-08-11

## Decision
All human- and agent-authored changes share one supply-chain path: source SHA -> dependency lock -> SBOM -> build -> artifact digest -> provenance -> attestation -> deployment -> runtime identity. M6 maps controls to SLSA, OpenSSF and NIST SSDF.

Actions and dependencies must be immutable/pinned where supported. Generated SBOM and provenance are CI evidence artifacts and must bind to the exact source SHA.

## Security
Untrusted agent origin provides no trust elevation. Build isolation and evidence integrity are mandatory.

## Rollback
Release previous attested artifact; never rebuild an old release from mutable inputs.

## Verification
A runtime version must be traceable to one exact source SHA, dependency set and build evidence bundle.