# OPS-ARTIFACT-VERSION-INVENTORY-VAI03

Status: IMPLEMENTATION_IN_PROGRESS
Project: CAPITAL-AI-OPS
Primary PVC: PVC-06 Version Management
Supporting PVC: PVC-04 Supervisor, PVC-07 Release Management
Source issue: #1429
Dependency: VAI-02 / PR #1443 merged

## Goal

Bind the merged Artifact Version Inventory identity into the existing Self-Healing PR evidence generation so same-version structural drift creates a new convergence generation.

## Scope

VAI-03 only:
- extend the existing PR EvidenceGenerationIdentity with the current Production/control-plane/template/platform-cadence tuple members plus artifactVersionInventoryHash and changedArtifactDomainVersions;
- derive changed artifact-domain/version rows deterministically from base/head VAI inventories;
- bind the head inventory hash plus sorted change rows into one SHA-256 generationDigest;
- validate the new evidence fields fail-closed;
- bump only the subordinate Self-Healing evidence schema from 1.0.0 to 1.1.0.

## Authority boundary

The existing selfHealingContract remains the sole finding/action/eligibility/convergence contract.
The Release bridge is a pure evidence builder; it executes no remediation.
package.json#version remains the sole platform-version authority.
VAI-04 finding/action registration remains explicitly out of scope.

## Exit evidence

- unchanged inputs produce an identical generationDigest;
- same declared 1.8.0 with changed artifact identity produces a different generationDigest;
- changedArtifactDomainVersions is deterministic and strictly path-sorted;
- invalid artifact hash/change evidence is rejected by validateVerificationEvidence;
- no new controller, workflow, scheduler, remediation action or provider capability is introduced;
- Exact-head CI/Governance/Security evidence passes before Human/CODEOWNER merge.
