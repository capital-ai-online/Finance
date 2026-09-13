# CAPITAL-AI Source Chat 033 — GitHub Connector Enterprise Read Capability Closure

Baseline: `main@91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
Branch: `agent/documentary-chat-workpackage-consolidation-20260913`  
Preservation owner: `CAPITAL-AI-DOC / PVC-03`  
Subject owner: `CAPITAL-AI-OPS / PVC-02`  
Cross-cutting: `CAPITAL-AI-GOV`, `CAPITAL-AI-SEC`, `CAPITAL-AI-QM`  
Role: documentary preservation only; non-authorizing.

## Source_Coverage_Register

| Source | Target | Initial classification | Result |
|---|---|---|---|
| CHAT-033 — GitHub connector read capabilities for dependencies and Enterprise settings | WP-06 — GitHub Enterprise & Developer Platform | PARTIALLY_CONTAINED | Concrete capability matrix preserved here; parent WP-06 already preserves the strategic work item |

## Human_Owner_Decisions

The source requests a read-capability assessment only. It does not authorize installation, connection, permission changes, Enterprise administration changes, runtime changes, production changes, PR creation, or merge.

## Preserved_Vision_and_Mission

Use one least-privileged GitHub observation surface wherever sufficient, distinguish repository-readable evidence from administrator-only or unsupported Enterprise state, and never infer positive state from missing access.

## Project_Assignment_Matrix

| Work | Project | Folder | PVC | Owner | Priority | Status |
|---|---|---|---|---|---|---|
| Connector dependency/Enterprise read inventory | CAPITAL-AI-OPS | `docs/projects/operations/` | PVC-02 | CAPITAL-AI-OPS | P1 | OPEN / PARTIAL EVIDENCE |
| Connector-host least-privilege assurance | CAPITAL-AI-SEC cross-cutting | `docs/projects/security/` | N/A productive PVC | CAPITAL-AI-SEC | P1 | EVIDENCE DEPENDENCY |
| External integration mutation boundary | CAPITAL-AI-GOV | `docs/projects/governance/` | PVC-05 | CAPITAL-AI-GOV | P1 | Current control consumed |
| CI/PR-class Enterprise benefits | CAPITAL-AI-QM cross-cutting | `docs/projects/quality-management/` | N/A productive PVC | CAPITAL-AI-QM | P2 | DEPENDENCY |

## Work_Package_Register

### CHAT033-WP-01 — GitHub connector read-capability matrix

Project: CAPITAL-AI-OPS  
Project folder: `docs/projects/operations/`  
Primary PVC: PVC-02  
Primary Owner: CAPITAL-AI-OPS  
Priority: P1  
Classification: PARTIALLY_CONTAINED before preservation  
Status: OPEN / inventory evidence preserved

| Capability area | Current observed connector surface | Classification |
|---|---|---|
| Repository metadata, branches, commits, PRs, issues, files | Dedicated read operations | AVAILABLE_READ |
| Dependency manifests and lockfiles | Readable as repository files; locked transitive versions are derivable | AVAILABLE_READ |
| Dependabot/Renovate configuration files | Readable when present in the repository | AVAILABLE_READ |
| Actions workflows, runs, jobs, steps, logs, artifacts | Dedicated read operations | AVAILABLE_READ |
| Combined commit/check status | Dedicated read operation | AVAILABLE_READ |
| Repository rulesets | Generic repository fetch supports ruleset reads | AVAILABLE_READ subject to connection permission |
| Branch protection | Generic fetch supports reads where permission allows; managed app administration access is not assumed | PERMISSION_DEPENDENT |
| CODEOWNERS and repository governance/security configuration files | Repository-file reads | AVAILABLE_READ |
| Dedicated dependency-graph view | No dedicated exposed operation identified in this run | CONNECTOR_MISSING / NOT_PROVEN |
| Dedicated dependency/security alert views | No dedicated exposed alert operations identified in this run | CONNECTOR_MISSING / NOT_PROVEN |
| Organization/Enterprise administration settings | Repository-centric connector surface does not prove administrator-level visibility | ADMIN_OR_CONNECTOR_GAP / NOT_PROVEN |
| Enterprise billing/licensing | No exposed read operation identified in this run | CONNECTOR_MISSING / NOT_PROVEN |

The generic repository fetch boundary supports approved repository resources including rulesets and permission-dependent branch-protection reads. It does not provide evidence that all organization/Enterprise administration surfaces are visible. Missing capability therefore remains `NOT_PROVEN`, not `DISABLED` or `PASS`.

### CHAT033-WP-02 — Enterprise read-plane assurance

Project: CAPITAL-AI-OPS  
Project folder: `docs/projects/operations/`  
Primary PVC: PVC-02  
Primary Owner: CAPITAL-AI-OPS  
Secondary owner: CAPITAL-AI-SEC for independent assurance  
Priority: P1  
Status: OPEN / NOT_PROVEN

Use the connected GitHub connector as the repository/development-chain read plane where sufficient. If material Enterprise evidence requires a broader interface, select only the smallest separately authorized read surface; do not grant blanket administrator authority to the normal agent client.

## Sequential_Process_Chains

1. `CHAT033-WP-01` inventories exposed read capability and permission caveats.
2. `CHAT033-WP-02` resolves only material remaining Enterprise evidence gaps through the smallest sufficient authorized read interface.
3. Evidence is handed to existing WP-04/WP-05/WP-06/WP-12 consumers without ownership transfer.

## Parallel_Process_Chains

After WP-01, QM may assess CI benefits, SEC may assess least-privilege assurance, and OPS may assess developer-platform observability in their existing scopes. No shared mutable provider configuration is changed by this source.

## Synchronization_Barriers

`CHAT033-BARRIER-01`: any future claim that an Enterprise setting is enabled, disabled, compliant, or least-privileged requires direct current evidence from a sufficient authorized interface. Repository inference alone is insufficient.

## Owner_Handoffs

- OPS/PVC-02 owns controlled implementation and capability inventory.
- SEC independently verifies security-relevant host/tool-grant/read-only boundaries.
- GOV owns authority semantics and any separately requested external integration mutation boundary.
- QM consumes Enterprise CI/check/storage/cost capabilities within existing Quality scope.

## Dependencies_and_Blockers

Current `/AGENTS.md`, project/PVC mapping, OPS Roadmap, ESS-0019 and the existing WP-06 parent package are hard inputs. Enterprise administrator surfaces remain blocked as evidence where the current connector is insufficient. No second connector architecture is created by this document.

## Security_Data_Integrity_Mutation_Boundaries

This source requires no application, production, provider, or administrator mutation. Read capability never implies mutation authority. External integration changes remain separately Human/Owner-authorized under the current Trust Root.

## Tests_Checks_and_Evidence

- current main: `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`;
- `/AGENTS.md` v2.10.0 fully read;
- canonical project mapping read;
- OPS, Security, and Documentary Roadmap context correlated;
- ESS-0019 v1.2.0 ACCEPTED read;
- open PR search identified PR #900 as the sole open PR at correlation time;
- PR #900 pre-write head: `9e8e84c805594a18d994a3388e55bba0b56f7099`;
- runtime/provider/admin validation: NOT_RUN; NOT_RUN is not PASS.

## Exit_Gates

Closure requires the concrete matrix, owner routing, permission caveats, non-mutation boundary, and exact post-write readback to be repository-resident. Open WP-06 implementation may remain open after this source chat is preserved.

## Closure_Register

| Source | Classification after verified readback | Unique content remaining | Decision |
|---|---|---|---|
| CHAT-033 | FULLY_CONTAINED | NONE | SAFE_TO_DELETE |

Source-local closure does not imply WP-06 completion, Enterprise-wide visibility, Security verification closure, PR #900 merge, or production readiness.
