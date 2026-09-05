# ADR-0060 — Software Supply Chain Provenance and Attestation

**Authority ID:** `AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060`  
**Version:** `1.1.0`  
**Status:** `ACCEPTED / ACTIVE` — Owner-directed GOV-03 lifecycle/registry/authority reconciliation; effective after Human Merge of this accepted version  
**Date:** `2026-09-05`  
**Original proposal date:** `2026-08-11`  
**Decision Owner:** CAPITAL-AI Owner  
**Primary project:** `CAPITAL-AI-GOV / PVC-05`  
**Scope:** software supply-chain provenance and attestation architecture for the existing release pipeline; no merge, deployment or production-mutation authority

## Context

The repository already contains the M6 supply-chain implementation and historical `VERIFIED PASS` evidence for the source → lockfile → SBOM → artifact → provenance/attestation chain. That implementation evidence is technical evidence only and did not itself accept this ADR.

GOV-03 reconciles the architectural lifecycle independently: this accepted version receives one stable authority identity, is registered consistently in the ADR and Authority registries, and removes the obsolete NIST-derived repository binding from the original proposal. Acceptance derives from the Human/Owner-directed decision and becomes effective only after Human Merge of this version.

## Decision

All human- and agent-authored changes that enter the controlled release path use one traceable supply-chain chain:

```text
source SHA
→ dependency lock
→ SBOM
→ build artifact digest
→ provenance
→ keyless attestation/signature
→ deployment identity
→ runtime identity
```

Generated SBOM, provenance and attestation evidence MUST bind to the exact source SHA and dependency state. Actions and dependencies MUST remain immutable/pinned where the platform and tooling support it.

The existing implementation is reused rather than duplicated. Current implementation/evidence surfaces include:

- `.github/workflows/ci.yml` — hosted supply-chain attestation/signing path;
- `scripts/automation/sourceIdentity.ts` — shared source identity resolution;
- `scripts/automation/buildSupplyChainProvenance.ts` — provenance generation;
- `scripts/security/verifySupplyChainProvenance.ts` — fail-closed chain verification;
- `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` — operational verification contract;
- `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md` — historical implementation evidence.

No second Supply-Chain, Release or Governance control plane is introduced by this decision.

## External standards and implementation references

SLSA v1.2 provenance semantics and Sigstore/cosign keyless signing are technical implementation references for the existing M6 path. They remain subordinate to CAPITAL-AI repository authority and do not create an independent governance hierarchy.

The original proposal sentence that mapped M6 controls to NIST SSDF is withdrawn from current ADR authority. Under the current `/AGENTS.md` standards baseline, NIST references in historical evidence remain non-authorizing unless a future explicit Human/Owner decision re-adopts a named source, version and scope. Historical evidence is not rewritten merely to simulate a different past state.

OpenSSF/Sigstore ecosystem material may be used as advisory technical guidance where it matches the implemented mechanism; it does not independently authorize repository controls, lifecycle changes, merge, deployment or production mutation.

## Security and integrity

Untrusted agent origin provides no trust elevation. Build isolation, exact-source binding, least privilege, evidence integrity and fail-closed verification are mandatory.

Keyless signing is bound to the hosted CI identity rather than repository-stored long-lived signing keys. Verification must constrain the expected signer/workflow identity and OIDC issuer according to the existing implementation contract.

## Authority boundary

This ADR authorizes only the architecture and integrity contract within its declared scope after Human Merge. It does not authorize:

- agent self-merge or bypass of Human/CODEOWNER merge authority;
- deployment outside the current verified `main` promotion controls;
- new provider credentials, IAM elevation or secret exposure;
- replacement of the canonical Governance, Release or registry architecture;
- treating historical implementation evidence as a substitute for an explicit lifecycle decision.

## Rollback

Release or restore a previously attested artifact/reference according to the existing release controls. Do not rebuild an old release from mutable inputs and represent it as the original attested artifact.

## Verification / Definition of Done

1. `AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060` resolves uniquely to this ADR.
2. `docs/adr/registry.json` records ADR-0060 version `1.1.0` with lifecycle `accepted`.
3. `docs/governance/authority-registry.json` records the same stable Authority ID, version, lifecycle and path.
4. The obsolete NIST SSDF binding is absent from current ADR authority while historical evidence remains intact/non-authorizing.
5. Existing M6 implementation and `VERIFIED PASS` evidence are referenced, not duplicated or rewritten as the source of acceptance.
6. Governance/registry validation passes on the exact branch/PR head.
7. Human/CODEOWNER merge remains the activation boundary for this accepted version.
