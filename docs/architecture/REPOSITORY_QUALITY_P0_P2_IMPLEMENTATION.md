# Repository Quality Orchestration — P0-P2 Implementation Baseline

**Status:** IMPLEMENTATION BASELINE  
**Date:** 2026-08-20  
**Scope:** Chat priority P0-P2 — repository quality evidence contract, coordinator and adapters  
**Authorities:** ESS-0005, ADR-0096, ADR-0030, ADR-0014, ADR-0076, ADR-0046

## Goal

Create one machine-readable, read-only quality observation without creating a second rule, version or governance authority.

## Architecture

1. Global Governance defines `repository-quality-observation/1.0.0` as a neutral evidence contract.
2. Quality Center executes `RepositoryQualityCoordinator` and aggregates evidence only.
3. `scripts/automation/repositoryQualityAdapters.ts` is the composition layer for existing domain validators.
4. Existing validators remain unchanged and retain their own semantics:
   - Release Platform Version Control Plane;
   - Documentary Documentation Hygiene;
   - repository convention validator;
   - Vocabulary continuous governance validator.
5. Missing or failed adapters produce blocking `NOT_AVAILABLE` evidence; no PASS is invented.
6. The observation explicitly cannot authorize merge, release, deployment, production mutation, policy changes or privilege elevation.

## Dependency Boundary

The Quality component imports only the shared Governance contract. It does not directly depend on VersionManager, Release, Documentary or Vocabulary. Cross-domain wiring is kept in the automation composition root to avoid dependency cycles and historical compatibility coupling.

## Security / Integrity

- read-only filesystem access through existing validators only;
- no secrets, credentials, Supabase, Stripe or Render operations;
- no source mutation or auto-fix path;
- no EventMesh event synthesis;
- full 40-character Git SHA required when source-commit evidence is supplied;
- adapter exceptions fail closed.

## Validation Plan

Before PR: inspect the branch diff, run static/targeted local checks where available, synchronize against current `main`, and repeat the targeted checks. Expensive GitHub CI/build suites remain post-PR per project policy.
