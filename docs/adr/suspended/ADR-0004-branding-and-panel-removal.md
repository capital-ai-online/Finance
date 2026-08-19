# ADR-0004 — Branding, Header und Panel-Entfernung — SUSPENDED

**Authority ID:** `AUTH-ADR-LEGACY-BRANDING-PANEL-0004`  
**Version:** `1.0.0`  
**Status:** `SUSPENDED`  
**Original Decision Date:** `2026-07-10`  
**Suspended:** `2026-08-19`  
**Suspension Authority:** `ADR-0096 / AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Original Git Blob:** `86af96a3aaa41767092c7726a4069a2b6f9b08d0`

## Suspension reason

The Accepted historical record mixed a branding/UI decision with a hard-coded current platform-version projection (`0.5.4`). That product-version statement conflicts with the current repository architecture in which `package.json#version` is the single platform-version authority and README/UI/API values are derived projections.

The complete original document remains immutable in Git history under the blob above. This suspended copy preserves the material decision context but is **non-authorizing** for current versioning, release, governance, M10 or runtime behavior.

## Historical decision scope

The original ADR documented these decisions:

1. apply the CAPITAL-AI documentary branding/header convention to the affected documentation;
2. remove the `Architecture Agent Queue` panel from the Supervisor UI;
3. display the then-current beta version in product-facing UI.

Only item 3 is in direct conflict with the current single-authority version model. The branding and panel-removal history remains useful implementation evidence but does not create a current version authority.

## Current replacement contract

- Platform-version authority: `package.json#version`.
- Deterministic repository projection: `src/platform/Release/Services/readmeVersionProjection.ts`.
- Runtime/admin projection: `src/platform/Release/Services/platformVersionControlPlane.ts` through the authenticated compatibility router.
- Governance Control Plane version: independent metadata in `AGENTS.md`; never a product-version mirror.
- Legacy `src/platform/VersionManager` bump/state/document-generator behavior: suspended and non-authorizing.

## Reactivation

This ADR must not be reactivated in place. If its branding or UI decisions need a new normative contract, create or update a current ADR against the then-current repository architecture and explicitly reference this record as historical evidence.
