# ADR-0105 — Deterministic Autonomous Versioning

**Authority ID:** `AUTH-ADR-DETERMINISTIC-AUTONOMOUS-VERSIONING-2026-09-11`  
**Version:** `1.0.0`  
**Status:** `ACCEPTED — EFFECTIVE ONLY AFTER HUMAN/CODEOWNER MERGE`  
**Date:** `2026-09-11`  
**Decision Owner:** CAPITAL-AI Owner  
**Primary Governance Project:** `CAPITAL-AI-GOV / PVC-05 — Platform Director`  
**Affected productive owner:** `CAPITAL-AI-OPS / PVC-06 Version Management / PVC-07 Release Management`  
**Rule Contract:** `AUTH-GOV-DETERMINISTIC-VERSIONING-RULE-CONTRACT` / `docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json`  
**Supersession type:** `partial`

## 1. Decision

An authorized CAPITAL-AI agent MAY determine a platform-version change autonomously and materialize that already-determined version on its current scoped work branch when, and only when, the result is fully derivable from the currently Accepted, Human-approved, deterministic and machine-readable Versioning Rule Contract.

The Human/Owner authorizes the versioning rules. The agent executes those rules. The agent has no discretionary authority to invent a version classification or target value.

This ADR does not authorize its own PR creation, merge, release acceptance, Git tag, deployment or production mutation. It becomes effective only after Human/CODEOWNER merge under the governance already effective on `main` before this ADR.

## 2. Stable authorities and source artifacts

### Existing authorities

| Stable authority ID | Source artifact | Display ID | Version/lifecycle | Role in this decision |
|---|---|---|---|---|
| `AUTH-ESS-DOCUMENTARY-CONTRACTS` | `.ai/skills/ESS-0001-Contracts.md` | `ESS-0001-CONTRACTS` | `1.1.0 / published` | partial supersession target: AI Behaviour Rule only |
| `AUTH-ADR-PLATFORM-VERSION-RELEASE-LIFECYCLE-0030` | `docs/adr/resolved/ADR-0030-platform-version-release-lifecycle.md` | `ADR-0030` | `1.0.0 / accepted` | partial supersession target: discretionary target selection and listed no-bump semantics only |
| `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19` | `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md` | `ADR-0096` | `1.3.0 / accepted` | preserved parent authority; not superseded |
| `AUTH-GOV-SUPERSESSION-POLICY` | `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md` | `GOV-AUTH-SUPERSESSION-0001` | `1.2.0 / active` | preserved supersession policy; not superseded |

`AUTH-ADR-PLATFORM-VERSION-RELEASE-LIFECYCLE-0030` is a stable-identity backfill for the already Accepted ADR-0030 decision. It does not create a second decision or change ADR-0030 by itself.

### Replacement authority

- stable authority ID: `AUTH-ADR-DETERMINISTIC-AUTONOMOUS-VERSIONING-2026-09-11`
- source: `docs/adr/ADR-0105-deterministic-autonomous-versioning.md`
- display ID: `ADR-0105`
- version: `1.0.0`
- lifecycle: Accepted after Human/CODEOWNER merge

## 3. Exact partial supersession targets

This ADR supersedes only the following semantics.

### Target A — ESS-0001-CONTRACTS, Chapter 1 / AI Behaviour Rules

**Old semantics:** `Versionen eigenständig erhöhen` is categorically forbidden for supported AI systems.

**New semantics:** supported AI systems may not increase versions by free discretion. An authorized agent may determine and materialize a version when the exact result follows from the Accepted deterministic Versioning Rule Contract and all required evidence, scope, validation, authority and fail-closed conditions are satisfied.

### Target B — ADR-0030, Section 5 Stage C / concrete target selection

**Old semantics:** the release owner selects exactly one concrete target version.

**New semantics:** the Human/Owner approves the Versioning Rule Contract and its PATCH/MINOR/MAJOR mapping. Once effective, an authorized agent derives the concrete target version deterministically from machine-readable semantic-delta evidence. A separate discretionary Human decision for each individual target value is not required.

### Target C — ADR-0030, Section 4 / documentation, tests and internal changes

ADR-0030 currently treats documentation-only changes, tests without released-behavior changes and internal refactors with identical externally observable behavior as non-triggering events by themselves.

For the deterministic rule contract only, the following replacement applies:

- documentation correction without a new capability -> `PATCH`;
- internal implementation change without contract extension -> `PATCH`;
- test/validation fix without a new public capability -> `PATCH`;
- an explicit machine-readable `NO_VERSION_RELEVANT_DELTA` evidence class -> `NONE`.

This is a deliberate semantic replacement. It is not inferred from document age or branch state.

### Target D — ADR-0030, Stage A/C placement of the version mutation

**Old semantics:** the platform version remains the released version throughout normal feature development and advances only at the dedicated Release Version Gate after release scope freeze.

**New semantics:** normal feature work does not casually bump the platform version. However, after the deterministic decision is complete, an authorized agent may materialize the next calculated version on the current scoped work branch using the canonical Version Management / Release mutation path. Branch materialization creates a versioned candidate state only; it is not Release Acceptance, Production Acceptance or deployment authority.

## 4. Explicit exclusions — preserved exactly

This ADR does **not** supersede or delegate:

- Human/CODEOWNER-only merge;
- the current PR-Creation Approval Envelope unless separately superseded by valid authority;
- current-main synchronization and final re-correlation;
- open-PR / active-writer, changed-file, semantic, namespace, authority and security correlation;
- Security, Compliance, test or validation gates;
- Release Acceptance or Production Acceptance;
- final Git-tag authority;
- production deployment or protected production mutations;
- IAM, secret, billing/money/entitlement, DNS/TLS or destructive-data authority;
- PVC / Primary Owner boundaries or foreign-project ownership;
- `AUTH-GOV-SUPERSESSION-POLICY` itself;
- ADR-0096 single-authority rule;
- the suspended historical ESS-0004 VersionManager state.

No automatic merge, release acceptance or deployment implication is permitted.

## 5. Single platform-version authority

`package.json#version` remains the single canonical platform-version authority.

The following remain projections or implementation paths rather than competing authorities:

- `package-lock.json` root version metadata;
- `metadata.json` and governed display/document projections;
- `src/platform/Release/**` mutation and projection services;
- `src/platform/VersionManager/**` read-only compatibility namespace;
- release candidate evidence.

A second platform-version registry or revived autonomous VersionManager is prohibited.

## 6. Deterministic Versioning Rule Contract

The canonical rule set is machine-readable and versioned independently at:

`docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json`

Classification precedence is:

`MAJOR > MINOR > PATCH > NONE`

The highest triggered severity wins.

### PATCH

- backward-compatible bug fix;
- documentation correction without new capability;
- internal implementation change without contract extension;
- test/validation fix without new public capability.

### MINOR

- new backward-compatible rule;
- new capability;
- new validator;
- new optional contract field;
- new backward-compatible API function;
- new backward-compatible event function.

### MAJOR

- removal of a public contract;
- incompatible public-contract change;
- removal of a required interface;
- incompatible event-schema change;
- incompatible API-schema change;
- semantic change with evidenced consumer breakage.

### NONE

`NONE` requires explicit machine-readable evidence that no version-relevant semantic delta exists. Missing evidence is not `NONE`; it is fail-closed.

## 7. MAJOR and existing GA release policy

The rule engine may deterministically classify a semantic delta as `MAJOR` and calculate the strict next SemVer target. That classification does not override any separately applicable current Release Policy gate.

While ADR-0030 still reserves `1.0.0` for formal GA, a calculated `MAJOR` from the `0.x` line is evidence-ready but **not materialization-eligible** unless the applicable GA/Release Policy gate is satisfied or separately superseded. This preserves the explicit requirement that Release Policy remains Human-authoritative.

## 8. Deterministic evidence and idempotency

Every decision must expose at least:

- `previousVersion`;
- `calculatedVersion`;
- `bumpType`;
- `triggeredRules`;
- `changedContracts`;
- `changedCapabilities`;
- `baseSha`;
- `branchHeadShaBeforeVersioning`;
- `resultingBranchHeadSha` once materialized;
- `ruleEngineVersion`;
- `decisionHash`;
- `timestamp`;
- `actor`;
- `client`;
- `affectedProject`;
- `affectedComponent`;
- applicable ADR, ESS and Control references.

The decision identity is conceptually:

`hash(baseSha + semanticDelta + ruleSetVersion + previousVersion)`

Timestamp, model name, LLM temperature and nondeterministic generation state are excluded from classification and decision identity.

Repeated evaluation of an already-recorded identical decision returns `NO_CHANGE_ALREADY_APPLIED` and must not create a second bump.

## 9. Fail-closed conditions

No version materialization is allowed when:

- machine-readable semantic evidence is missing;
- evidence is contradictory;
- more than one platform-version authority is presented;
- project/PVC/Owner or applicable authority is unresolved;
- the rule-set version is unknown or not Accepted;
- branch/current-main correlation is stale or conflicting;
- a Security/Compliance/Release gate required for the calculated target is unsatisfied;
- the requested effect implies merge, release acceptance or deployment.

## 10. Operational impact

After this ADR becomes effective, Governance supplies deterministic classification and decision evidence. Productive Version Management and Release mutation remain owned by `CAPITAL-AI-OPS / PVC-06 / PVC-07`.

A separate OPS implementation slice must integrate this decision contract into the existing `src/platform/Release/**` version path. It must not create a second VersionManager, second registry or parallel Release architecture.

## 11. Security impact

The change expands branch-local version materialization authority but not merge, production or provider authority. Primary risks are privilege confusion, duplicate bumps, ambiguous semantic classification and release-policy bypass.

Controls are: closed enumerated rule classes, machine-readable evidence, single-authority enforcement, deterministic hashing, idempotency, explicit protected-action DENY semantics, current-main/writer correlation and separation of branch materialization from release/deployment acceptance.

## 12. Compliance / regulatory impact

No certification, legal-sufficiency or regulatory-status claim is created. Existing Compliance applicability and assessment gates remain unchanged. If a versioned change is subject to a regulatory or contractual release condition, that condition remains independently blocking.

## 13. Evidence impact

Historical ESS-0001-CONTRACTS and ADR-0030 text is retained. This ADR does not rewrite historical evidence. Consumers resolve the named overlapping semantics through this explicit partial-supersession edge after Human Merge.

## 14. Rollback

Rollback requires a fresh scoped Governance branch from then-current `main` and Human/CODEOWNER merge. It must:

1. deactivate this autonomous deterministic versioning authority;
2. restore the previously Accepted version-decision semantics for future changes;
3. leave correctly created historical versions, tags and evidence unchanged;
4. perform no history rewrite, evidence deletion or retrospective version recalculation.

## 15. Validation

The Stage-1 Governance implementation supplies a deterministic decision engine and regression tests for:

- `NONE`, `PATCH`, `MINOR`, `MAJOR`;
- mixed impacts / highest severity wins;
- missing and contradictory evidence;
- repeated identical decision / `NO_CHANGE_ALREADY_APPLIED`;
- changed base SHA and changed rule-set version creating a new decision identity;
- duplicate platform-version authority failure;
- automatic merge, release acceptance and deployment implications denied;
- MAJOR classification remaining separately constrained by current Release/GA policy.

Stage 1 does not mutate `package.json#version`. Productive branch materialization is a separately owned OPS implementation step after this ADR is effective on `main`.

## 16. Supersession package summary

- **oldAuthorityIds:** `AUTH-ESS-DOCUMENTARY-CONTRACTS`, `AUTH-ADR-PLATFORM-VERSION-RELEASE-LIFECYCLE-0030`
- **replacementAuthorityId:** `AUTH-ADR-DETERMINISTIC-AUTONOMOUS-VERSIONING-2026-09-11`
- **type:** `partial`
- **activationCondition:** effective only after Human/CODEOWNER merge; thereafter always within the exact target scope
- **exact overlapping topic:** discretionary vs deterministic autonomous platform-version decision and branch materialization
- **exclusions:** Section 4 of this ADR
- **Owner decision:** `ACCEPT` captured in the initiating chat on 2026-09-11
