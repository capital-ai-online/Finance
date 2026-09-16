# GOV Top-Layer Scope Exclusions — 2026-09-16

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Trust root:** `/AGENTS.md@current-main`  
**Baseline:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/governance-sec-authority-exception-20260916`  
**Owner scope:** Top-Layer steering applies to all canonical project folders except SEC, QM, FINTECH and COMP; implementation remains Supply-Chain- and `/AGENTS.md`-based.

## Correlated current-main facts

- `docs/projects/README.md` is the canonical project-folder mapping; it maps Security to `docs/projects/security/`, Quality Management to `docs/projects/quality-management/`, FinTech to `docs/projects/fintech/` and Compliance to `docs/projects/compliance/`.
- `docs/projects/PROJECT_VALUE_CHAIN.md` keeps `PVC-*` as organizational routing and keeps technical financial `VC-*` semantics under `SC-MD-SPT-0001` separate.
- `CAPITAL-AI-FINTECH` is Primary Owner for `PVC-12..PVC-17` and consumes the existing technical scoring/financial authorities rather than a Top-Layer-created scoring authority.
- `CAPITAL-AI-QM`, `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP` are cross-cutting assurance/constraint projects without productive PVC ownership.
- `/AGENTS.md` remains the single repository trust root; the pre-existing branch scope also materializes the Security-specific `SECURITY_FOUNDATION_FIRST` direction without transferring PVC, merge, deployment or protected-mutation authority.

## Before

`TOP_LAYER_APPLICATION_QUALITY_PROJECTION.yaml` v1.1.0 declared `scope: ALL_PROJECT_FOLDERS`. The projection was non-authorizing, but its applicability metadata did not explicitly distinguish owner domains whose local execution/assurance direction must not be driven by `USER_VISIBLE_TOP_LAYER_FIRST`.

## After

`TOP_LAYER_APPLICATION_QUALITY_PROJECTION.yaml` v1.2.0:

- resolves its project set dynamically from the canonical current-main project mapping;
- applies `USER_VISIBLE_TOP_LAYER_FIRST` to all canonical project folders except:
  - `CAPITAL-AI-SEC / docs/projects/security/`;
  - `CAPITAL-AI-QM / docs/projects/quality-management/`;
  - `CAPITAL-AI-FINTECH / docs/projects/fintech/`;
  - `CAPITAL-AI-COMP / docs/projects/compliance/`;
- keeps those four projects inside dependency, evidence and user-impact correlation where relevant;
- prohibits the Top-Layer projection from overriding their local project/Domain/assurance authority;
- binds execution and quality-gate applicability to the same exclusion set;
- records `/AGENTS.md`, canonical PVC routing and `SC-MD-SPT-0001` where the technical financial chain is affected as parent inputs rather than replacement authorities.

## Authority direction for excluded projects

| Project | Local direction preserved | Productive PVC ownership |
|---|---|---|
| `CAPITAL-AI-SEC` | Security foundation / protection need / threat / control / verification first | none |
| `CAPITAL-AI-QM` | independent Quality assurance / gates / findings / regression / verification first | none |
| `CAPITAL-AI-FINTECH` | financial Domain, scoring and decision-chain authority first; `SC-MD-SPT-0001` preserved | `PVC-12..17` |
| `CAPITAL-AI-COMP` | compliance applicability / requirement / traceability / evidence / Legal-Owner handoff first | none |

These labels describe execution/evaluation direction only. They create no new `AUTH-*`, `CTRL-*`, PVC stage, technical `VC-*` stage, registry or protected-action authority.

## Validation state

- Current-main project mapping and PVC ownership: `READ / CORRELATED`.
- Current-main SEC/QM/FINTECH/COMP project scopes: `READ / CORRELATED`.
- Existing open-PR scan at implementation start: only FE PR #1021 was observed; no Governance/Top-Layer file overlap was present.
- Branch started from and was resynchronized to `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c` before this scope extension.
- YAML content readback: `DONE` for the modified applicability/authority section.
- Dedicated repository YAML parser / hosted CI: `NOT RUN` pre-PR; no false PASS is asserted.

## Exit gate

PASS when the bounded branch contains one coherent interpretation:

1. `/AGENTS.md` remains the repository trust root;
2. canonical project/PVC and technical Supply-Chain identities are not duplicated or renumbered;
3. Top-Layer steering is applicable to canonical project folders except SEC, QM, FINTECH and COMP;
4. excluded projects retain their project-local authority direction while remaining correlatable for end-to-end impact/evidence;
5. no new merge, release, deployment, residual-risk or protected external-mutation authority is created.
