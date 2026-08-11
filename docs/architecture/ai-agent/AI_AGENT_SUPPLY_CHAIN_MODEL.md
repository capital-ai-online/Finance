# AI Agent Supply Chain Model

Canonical chain:
`source SHA -> lockfile -> SBOM -> tests/build -> artifact digest -> provenance -> attestation -> deployment -> runtime identity`.

Controls: pinned GitHub Actions, minimal permissions, deterministic dependency installation, vulnerability checks, SBOM export, provenance/attestation, protected release identity, immutable rollback artifact.

Agent-generated content has no elevated trust. M6 maps the implementation to SLSA, OpenSSF and NIST SSDF.