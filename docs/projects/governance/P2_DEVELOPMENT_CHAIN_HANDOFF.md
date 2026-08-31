# P2 — DevelopmentChain Integration Handoff

**Source project:** `CAPITAL-AI-GOV`  
**Target project:** `CAPITAL-AI-OPS`  
**Status:** `REFERRED_NOT_EXECUTED`

## [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02` with lifecycle responsibility spanning OPS-owned `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08` and `PVC-18`
- **target_project:** `CAPITAL-AI-OPS`
- **task:** Create the canonical `docs/projects/operations/` project surface and integrate the existing DevelopmentChain as the cross-project delivery lifecycle described by `docs/projects/PROJECT_EXECUTION_MODEL.md`.
- **reason:** DevelopmentChain execution coordination is operational work. GOV owns governance controls and PVC-05 but must not implement foreign OPS stages.
- **dependency:** P1 `PVC-*` namespace and project execution model; existing `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` remain unchanged.
- **required_evidence:** fresh OPS branch from then-current main; OPS work claim; current DevelopmentChain source inventory; source-to-target migration matrix; proof that M0-M10 historical evidence remains discoverable; no duplicate Release/EventMesh/Production architecture; exact candidate validation.
- **verification_gate:** OPS project validation plus repository Governance/Documentation checks, final current-main/open-writer correlation and exact-snapshot Human/Owner PR-creation gate.
- **status:** `REFERRED_NOT_EXECUTED`

## Expected target structure

```text
docs/projects/operations/
  README.md
  ROADMAP.md
  DEVELOPMENT_CHAIN.md
  PVC_OWNERSHIP.md
  WORK_PACKAGES.md
  CROSS_PROJECT_DEPENDENCIES.md
  runbooks/
  evidence/
```

## Migration requirements

1. Reuse existing DevelopmentChain authorities; do not create another AUTH/CTRL for organizational placement.
2. Use durable `DC-*` lifecycle labels instead of turning M0-M10 into permanent project stages.
3. Preserve M0-M10 artifacts according to their lifecycle classification.
4. Keep M10 Passkey PR-CI enforcement `SUSPENDED / OFF` unless separately reauthorized.
5. Keep Human/Owner PR creation, hosted CI, Human merge and protected production mutation as distinct gates.
6. Do not move runtime components solely to match the project folder.
7. Only the OPS owner may mark this handoff implemented/verified.
