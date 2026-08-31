# CAPITAL-AI-FINTECH — Supporting Detail Package

Status: `ACTIVE SUPPORTING / NON-AUTHORIZING`  
Canonical organizational project surface: `docs/projects/fintech/`  
Current synchronization baseline: `main@1f55340d89178fb5c1ab735242f42c263918b692`

This directory was created by the initial CAPITAL-AI-FINTECH V2 consolidation before the repository introduced the qualified `PVC-*` project-routing namespace and canonical `docs/projects/<project>/` execution model.

It remains a supporting detail/evidence package for inventories and original V2 traceability. It does not compete with the current organizational project surface.

Use these current entry points:

- `docs/projects/fintech/README.md`
- `docs/projects/fintech/ROADMAP.md`
- `docs/projects/fintech/PVC_OWNERSHIP.md`
- `docs/projects/fintech/WORK_PACKAGES.md`
- `docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md`
- `docs/projects/fintech/SECURITY_HANDOFFS.md`
- `docs/projects/fintech/VALIDATION_REPORT.md`

## Preserved technical invariants

- one productive `ScoringModelRegistry`;
- one productive `ScoringDispatcher`;
- one CanonicalScoreResult contract family;
- one target productive FINTECH Ranking authority;
- no synthetic/neutral missing-evidence fallback;
- DATA remains owner of UAI/Evidence/DQ;
- OPS remains owner of PVC-18 EventMesh/Traceability;
- Frontend remains a consumer;
- Research/challenger scoring remains non-productive until governed promotion.

The original V2 target labels `VC-12..17` are superseded **as project-routing labels** by current `PVC-12..17`. Existing technical `VC-*` stages under `SC-MD-SPT-0001` remain unchanged.

Security handoff source PR #631 is integrated at `docs/projects/fintech/SECURITY_HANDOFFS.md`. No current concrete Security finding is directly routed to FINTECH; S1-R2-06 remains a conditional child-handoff dependency only.