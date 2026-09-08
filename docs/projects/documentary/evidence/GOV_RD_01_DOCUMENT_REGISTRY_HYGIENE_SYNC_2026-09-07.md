# GOV-RD-01 — Documentary Registry / Hygiene Correlation Evidence

**Target Project:** `CAPITAL-AI-DOC`  
**Target folder:** `docs/projects/documentary/`  
**Target PVC:** `PVC-03 — Documentary Engine`  
**Target Primary Owner:** `CAPITAL-AI-DOC`  
**Executing Project:** `CAPITAL-AI-GOV` under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`  
**Baseline:** `main@92297059722a92cf934bd85339670c623d618d1a`  
**Branch:** `agent/documentary-gov-rd-01-registry-sync-20260907`  
**State:** `IMPLEMENTED_BRANCH / VALIDATION_NOT_RUN / PR_GATE_PENDING`

## Scope

Bounded Documentary-owned dependency required by GOV-RD-01. No Governance/PVC-05 ownership is transferred.

## Corrections

- Document Registry top-level authority path now resolves to `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md` rather than the historical draft Hygiene policy.
- `DOC-GOV-AGENTS` version projection: `2.2.0` -> `2.8.1`.
- `DOC-GOV-AUTH-SUPERSESSION` version projection: `1.1.0` -> `1.2.0`.
- `DOC-ROADMAP-CAPITAL-AI-ENTERPRISE` version projection: `2.2.0` -> `2.8.2`.
- historical `DOCUMENTATION_HYGIENE_POLICY.md` is archived and its current path is an explicit non-authorizing compatibility redirect.
- `DOC-GOV-DOCUMENTATION-HYGIENE` is classified as historical/non-normative Documentary projection.
- Documentation Hygiene validator is bumped to `documentation-hygiene-validator/1.2.0` and validates the registry authority against the current Document Lifecycle policy. The old exported constant remains only as a deprecated source-compatibility alias.

## Preserved boundaries

- no new `AUTH-*`, `CTRL-*`, ADR, ESS, registry or planning plane;
- `document-registry.json` remains Documentary identity metadata, not repository authority;
- `/AGENTS.md` remains the repository trust root;
- current project Roadmaps remain the day-to-day planning surfaces;
- no M10 reactivation;
- no provider-specific instruction surface;
- no production, plugin, IAM, billing, deployment or external mutation.

## Validation truth

- main/PVC/owner/foreign-execution correlation: PASS before branch creation;
- branch created from exact current main: PASS;
- registry JSON was rewritten as structurally valid JSON through the GitHub contents API: implementation fact only, not test evidence;
- runtime/unit/build/docs-hygiene validation: **NOT RUN** in this connector-only execution environment;
- hosted CI: **NOT RUN** because no PR exists.

A later PR gate must not convert these NOT RUN states into PASS.
