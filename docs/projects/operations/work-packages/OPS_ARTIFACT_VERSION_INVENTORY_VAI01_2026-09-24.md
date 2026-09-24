# OPS-ARTIFACT-VERSION-INVENTORY-VAI01

Status: IMPLEMENTATION_IN_PROGRESS
Project: CAPITAL-AI-OPS
Primary PVC: PVC-06 Version Management
Supporting PVC: PVC-04 Supervisor, PVC-07 Release Management
Source handover: GOV-TO-OPS-ARTIFACT-VERSION-INVENTORY-20260924
Source issue: #1429
Dependency: PR #1428 merged

## Goal

Build the first bounded Artifact Version Inventory slice as read-only evidence over every Git-tracked repository path.

## Scope

VAI-01 only:
- enumerate Git index stage-0 tracked paths;
- preserve the exact Git object id as the content identity;
- classify each path into exactly one approved artifact domain;
- discover strong local version/schema declarations without treating arbitrary version text as a platform version;
- calculate a deterministic content-inventory hash;
- expose unclassified/conflicting identity cases without repairing them.

Approved domains:
- PLATFORM_VERSION_AUTHORITY
- PLATFORM_VERSION_MIRROR
- SEMANTIC_CONTRACT_VERSIONED
- SCHEMA_VERSIONED
- DERIVED_CONTENT_IDENTITY
- GENERATED_OR_EPHEMERAL
- UNCLASSIFIED_REQUIRES_OWNER_REVIEW

## Authority boundary

package.json#version remains the sole platform-version authority.
package-lock.json is a platform-version mirror only.
Ordinary source, configuration and binary content uses the Git object id as identity.
Generated content remains generated/ephemeral evidence.
No blanket SemVer rewrite is permitted.

This slice does not build the producer-consumer graph, does not emit Self-Healing findings, and does not add a new VersionManager, Self-Healing controller, merge authority or provider mutation.

## Exit evidence

- 100 percent of tracked stage-0 paths receive exactly one domain classification.
- Inventory hash is stable for an unchanged Git index.
- Changing one tracked blob changes the inventory hash.
- A PR-template structural change retaining the same declared 1.8.0 version changes identity.
- Inventory generation does not mutate tracked repository bytes.
- Focused unit tests pass.
- Exact-head CI, Governance and Security evidence is required before Human/CODEOWNER merge.

## Continuation

After VAI-01 is merged and re-correlated, VAI-02 may add the producer-consumer version/fingerprint graph on top of this inventory without duplicating version authority.
