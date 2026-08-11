# DevelopmentChain Documentation Freeze Policy

Effective: 2026-08-11

1. The AI-Agent transformation is documentation-first.
2. M3–M9 code/config/infrastructure changes are prohibited until M2G Documentation Freeze is COMPLETE on `main`.
3. Every DevelopmentChain step must update `docs/architecture/ROADMAP.md`, the M0–M9 roadmap, traceability matrix and affected ADR/ESS status.
4. A PR that mixes unresolved architecture documentation with production mutation must be split.
5. PR #190 is superseded because it mixed decision documents with deployment implementation before M2G.
6. Documentation PRs may contain only documentation/registry metadata; no workflow/runtime/infrastructure mutation.
7. After Documentation Freeze, implementation proceeds one phase at a time with evidence and rollback gates.