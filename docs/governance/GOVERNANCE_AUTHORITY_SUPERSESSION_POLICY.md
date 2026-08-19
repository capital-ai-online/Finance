# CAPITAL-AI Governance Authority & Supersession Policy

**Document ID:** `GOV-AUTH-SUPERSESSION-0001`  
**Authority ID:** `AUTH-GOV-SUPERSESSION-POLICY`  
**Status:** OWNER-DIRECTED — effective after Human Merge of ADR-0096  
**Version:** `1.1.0`  
**Date:** `2026-08-19`  
**Authority:** `ADR-0096` / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`; existing higher Accepted Decisions remain controlling until merge

## Purpose

Define deterministic resolution of conflicting governance artifacts without allowing document recency, model output, file location or repository write access to manufacture authority.

## Stable identity rule

Every normative governance artifact has one immutable `authorityId` registered in `docs/governance/authority-registry.json` before it becomes a blocking control.

- `authorityId` is identity.
- ADR/ESS number, title and path are mutable traceability/display metadata.
- renumbering or moving an artifact does not create a new authority when the underlying decision is unchanged;
- a historical alias must never be interpreted as a second active authority;
- stable IDs are never reused for unrelated decisions.

## Authority hierarchy

Highest to lowest unless applicable law or an explicit Owner decision defines a stricter order:

1. **Applicable law, regulation, supervisory obligation, binding contract/control obligation.**
2. **Explicit Human/Owner decision and effective Accepted ADR** within its scope.
3. **`AGENTS.md` Agent Trust Root, Accepted/Active ESS and active Governance Policy/Control Catalog** within delegated scope.
4. **Approved Roadmap, Contract, Runbook, Traceability or Control Specification** implementing higher authority.
5. **Proposed/Draft/Not-Enabled ADR, ESS, policy or roadmap.** Design input only; non-authorizing.
6. **Evidence, report, snapshot, archive and historical documentation.** Evidentiary only unless higher authority explicitly adopts it.

## Version and recency rule

### Same stable authority

When two artifacts represent the **same `authorityId`**, the newest effective semantic version takes precedence. If semantic versions are equal, the later effective date takes precedence.

A newer version must still preserve any higher binding obligation and must expose its change history.

### Different stable authorities

When artifacts carry **different `authorityId` values**, recency alone never supersedes either one.

Semantic supersession is permitted only when:

- the replacement has equal or higher authority for the correlated scope;
- an explicit `supersedes` relationship identifies the replaced authority;
- no higher authority, regulatory obligation or Accepted Decision conflicts;
- the semantic delta and impact are documented before effectiveness;
- the Owner can review the package before Human Merge.

**Newer is not, by itself, higher authority.**

## Proposed / Draft material

`PROPOSED`, `DRAFT`, `NOT ENABLED` and equivalent lifecycle states MUST NOT be used as the sole authority for:

- Merge authorization;
- production mutation;
- IAM/capability elevation;
- security-control weakening;
- billing/money/entitlement mutation;
- deletion of protected production resources;
- break-glass / recovery changes;
- semantic supersession of an effective Accepted Decision.

They may be used as implementation plans when a separate higher Owner/Accepted authority explicitly authorizes the work.

## Mandatory supersession package

Before semantic supersession, archival or a namespace repair that could change interpretation, provide an Owner-visible package containing:

| Field | Required content |
|---|---|
| Stable authority IDs | old and replacement `AUTH-*` identities |
| Source artifact | current/older path, display ID, version and lifecycle |
| Replacement artifact | proposed path/display ID/version |
| Correlation | exact rule/topic that overlaps |
| Authority comparison | hierarchy tier + lifecycle for each artifact |
| Semantic diff | old behavior → new behavior |
| Operational impact | workflow/runtime/CI/agent behavior |
| Security impact | trust boundary, privilege, fail-open/fail-closed changes |
| Regulatory impact | affected obligations/controls or `N/A` |
| Evidence impact | what remains historical and how it is labeled |
| Rollback | how to restore the last accepted state |
| Owner decision | ACCEPT / REJECT / MODIFY captured by the repository review/merge process |

Historical evidence should normally be retained and marked historical/non-normative. A path move or display-number repair that preserves the same stable authority is a traceability migration, not a semantic rewrite.

## Conflict-resolution algorithm

1. resolve `/AGENTS.md` and the stable authority registry;
2. identify all correlated artifacts and their `authorityId` values;
3. classify each by authority tier, lifecycle, version and effective date;
4. fail closed on unresolved higher-tier conflict;
5. for the same `authorityId`, choose the newest effective version/date;
6. for different authorities, require an explicit supersession edge and impact package;
7. prefer effective Accepted/Active authority over Proposed/Draft material;
8. preserve historical evidence and aliases as non-authorizing;
9. require Human Merge for repository governance changes;
10. for external mutation, apply separate protected mutation controls.

## Current PR-CI interpretation

The former PR-body checkbox / Files-Viewed / `💪` / `okay` ritual is historical and non-authorizing.

The current Owner-directed transition state after the M10 recovery is:

```text
PR OPEN / UPDATE
→ technical/governance CI without M10 Passkey gate
→ Human/Owner merge decision
→ Human Merge
```

M10 Passkey `AUTHORIZE_PR_CI` is **SUSPENDED/OFF** and does not reactivate through historical documentation. Reactivation requires a new explicit Owner decision and validated control change.

## Production deployment interpretation

Render native Auto Deploy is off. Current production authority is:

```text
Human Merge
→ main
→ build-and-test
→ supply-chain attestation
→ exact-SHA Render deploy hook
→ post-deployment identity verification
```

A second automatic Render deployment authority must not be introduced without an explicit architecture/security decision.

## Enforcement

The repository control-plane validator checks structural invariants including stable-ID uniqueness, active ADR/ESS namespace uniqueness, registry target existence and non-authoritative provider adapters.

Current implementation:

- `scripts/governance/validateGovernanceControlPlane.mjs`
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/registry.json`

Existing specialized governance validators remain valid only for their narrower domains and must not recreate a second global authority model.
