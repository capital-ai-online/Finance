# OPS-ARTIFACT-VERSION-INVENTORY-VAI03

Status: DONE_MAIN / TERMINAL
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


## Main completion evidence

- Human/CODEOWNER merge: PR #1445.
- Merge commit: `9fec05d184794427eea384ae069f505f4b07a1e5`; implementation head: `30d11617f1e9ba29ed42ab54c6a3fe01bea7576f`.
- Exact-head evidence before merge: CI #6485, Governance #6018, Container Security #3470, Project Directive #798 and PR #899 completed successfully.
- Fresh CURRENT_MAIN readback: `f61df72e717399e783824d0b12190f2e7f6a96fd`; the VAI-03 merge is an ancestor of this generation with `behind=0`.
- The VAI-03 work claim is released/non-exclusive by the #1429 closure slice.
- No provider, deployment or second Self-Healing authority remains in this bounded phase.
