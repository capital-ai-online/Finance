# ADR-0030 — Platform Version and Release Lifecycle

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** CAPITAL-AI Web Application / Production Release Lifecycle
- **Current Platform Version:** `0.6.0` (Beta)
- **Governance ID:** `GOV-VER-002`
- **Builds on:** `GOV-VER-001` / `tests/unit/platformVersionConsistency.test.ts`
- **Single Source of Truth:** `package.json#version`

## 1. Context

CAPITAL-AI currently declares platform version `0.6.0`. A prior governance correction
(`GOV-VER-001`) aligned previously conflicting declarations and established `package.json` as the
single source of truth, with `metadata.json` and user-/decision-maker-visible files required to
match it.

What remained undefined was **when** the platform is allowed to advance to the next version,
**which version component is incremented**, and **where that decision occurs in the development,
integration, production and acceptance lifecycle**.

Without a release gate, version numbers can drift from the actual production capability set:
individual features, migrations, documentation changes or acceptance records could cause an
ad-hoc bump even though no coherent platform release has been approved.

This ADR defines the release/version contract.

## 2. Decision

CAPITAL-AI uses a controlled Semantic Versioning-inspired release model:

`MAJOR.MINOR.PATCH`

While the product remains in Beta (`0.x.y`), CAPITAL-AI applies stricter internal compatibility
rules than SemVer requires. A version number represents a **released, identifiable production
platform state**, not the number of completed tasks, commits, ADRs or migrations.

The current version remains:

`0.6.0`

The successful Production SLO Persistence acceptance does **not** by itself increment the
platform version.

## 3. Version Increment Rules

### 3.1 PATCH — example `0.6.0` → `0.6.1`

Use PATCH for a production release that contains only backward-compatible corrections or
hardening and does not introduce a material new product capability or public contract.

Typical PATCH triggers:

- bug fixes
- security hardening without a new externally visible capability
- reliability/observability fixes
- performance improvements preserving existing behavior
- dependency remediation without material product behavior change
- production configuration corrections that require a traceable release artifact

A documentation-only change or the closing of an acceptance record does not require a PATCH by
itself.

### 3.2 MINOR — example `0.6.x` → `0.7.0`

Use MINOR when a release introduces at least one approved material capability or contract change.

Typical MINOR triggers:

- new end-user or Enterprise capability
- new production asset class or materially expanded screening/scoring capability
- new public/internal API contract used by production boundaries
- major orchestration, governance or platform module becoming operational
- material authentication/authorization workflow expansion
- database/schema capability that enables a new product function
- a coherent release train containing multiple accepted work packages that together represent a
  new platform capability level

The next MINOR after the current release line is `0.7.0`.

### 3.3 MAJOR — `1.0.0`

`1.0.0` is reserved for a formal General Availability decision and must not be reached merely by
accumulating features.

Minimum GA gate:

- Beta exit explicitly approved
- stable production deployment and rollback procedure
- stable identity/access and security baseline
- production observability and evidence persistence accepted
- public/product API contracts governed and versioned
- data integrity and No-Demo-Data controls enforced
- required compliance/security acceptance records closed
- release and traceability evidence reproducible
- critical production migrations validated
- no unresolved release-blocking findings

A dedicated GA ADR is required before `1.0.0`.

## 4. What Does NOT Trigger a Version Increment

The following events are lifecycle evidence, not release decisions by themselves:

- completing a single ADR
- merging a documentation-only PR
- creating an acceptance record
- completing one production database migration
- adding tests without changing released behavior
- refactoring internal code with identical externally observable behavior
- correcting stale documentation to match the already released version

These changes may be included in the next PATCH or MINOR release, but they do not independently
change the web application version.

## 5. Release Lifecycle Integration

Version advancement occurs at a dedicated **Release Gate**, not during normal feature development.

### Stage A — Development

Goal: implement and test individual work packages.

Rules:

- platform version remains the currently released version
- feature/architecture changes receive ADRs where required
- tests and documentary/traceability artifacts are updated with the work
- external production-system changes are not treated as completed merely because development code
  exists

Output: implementation-ready work packages, tests and documentation.

### Stage B — Integration / Staging

Goal: combine release candidates and resolve cross-module dependencies.

Required checks:

- build passes
- type/lint checks pass
- relevant unit/integration tests pass
- schema/API contracts are compatible
- security/compliance findings have no unresolved release blocker
- required migration/handoff documents exist
- traceability covers the candidate scope

At the end of this stage, the release scope is frozen and classified as PATCH or MINOR.

Output: **Release Candidate Scope**.

### Stage C — Release Version Gate

This is the only normal point where `package.json#version` is advanced.

The release owner selects exactly one target version based on Section 3.

Examples:

- fix-only release from `0.6.0` → `0.6.1`
- capability release from `0.6.x` → `0.7.0`

The version bump is performed in a dedicated release change/commit, not mixed invisibly into a
feature commit.

Output: **Versioned Release Candidate**.

### Stage D — Production Deployment and Acceptance

The exact versioned release candidate is deployed to production.

Required evidence is scope-dependent and can include:

- production smoke tests
- deployment health
- security/IAM checks
- database migration acceptance
- API/provider health
- SLO/observability evidence
- business-critical path checks
- rollback readiness

Production-affecting migrations receive their own acceptance record when their risk warrants it.

If a critical check fails, the release is **not accepted**. A new corrective release candidate is
created; acceptance evidence must never be falsified or retroactively rewritten.

Output: **Production Acceptance Decision**.

### Stage E — Release Closure

Only after production acceptance:

1. the exact accepted commit is identified;
2. the final release record is closed;
3. an immutable Git tag `vMAJOR.MINOR.PATCH` is created on the accepted commit;
4. release notes/changelog are finalized;
5. traceability links version → commit → ADRs → migrations → acceptance evidence;
6. the lifecycle moves to the next development cycle.

Output: **Released Platform Version**.

## 6. Version Source-of-Truth Contract

`package.json#version` is the authoritative platform version.

The release procedure must synchronize at least:

1. `package.json`
2. root package version in `package-lock.json`
3. `packages[""]#version` in `package-lock.json`
4. `metadata.json`
5. `README.md`
6. `AGENTS.md`
7. `docs/code-quality/CODE_QUALITY_STANDARDS.md`
8. `docs/ceo/EXECUTIVE_SUMMARY.md`
9. `docs/API.md`
10. `index.html`

`tests/unit/platformVersionConsistency.test.ts` remains a mandatory regression gate and should be
extended whenever another file becomes an official platform-version declaration.

No component may invent a separate current platform version.

## 7. Required Version Bump Procedure

For every future platform version change:

### Step 1 — Determine target version

Create a release decision containing:

- current version
- target version
- PATCH/MINOR/MAJOR classification
- included work packages / PRs
- included ADRs
- included migrations
- known risks and rollback boundary

### Step 2 — Update the source of truth

Change `package.json#version` first.

For Node package metadata, use a controlled mechanism that also updates the lockfile, for example a
release automation based on:

`npm version <target> --no-git-tag-version`

The actual Git tag is deliberately created only after production acceptance.

### Step 3 — Synchronize declared versions

Update all governed mirror declarations from Section 6 to the same value.

### Step 4 — Run version governance gate

At minimum:

- `npm run lint`
- `npm test -- platformVersionConsistency` or the equivalent targeted Vitest invocation
- `npm run build`
- `npm run predeploy:check`

A version mismatch is release-blocking.

### Step 5 — Create release candidate evidence

Record:

- target version
- release commit SHA
- test/build status
- deployment scope
- migration scope
- acceptance requirements

### Step 6 — Production acceptance

Deploy and validate the exact release candidate. Do not tag failed candidates as final releases.

### Step 7 — Tag only the accepted commit

After acceptance, create:

`v<package.json version>`

The tag must point to the exact accepted production commit.

## 8. Release Artifact and Evidence Model

Every released platform version should be reconstructable through this chain:

`Platform Version`
→ `Git Tag`
→ `Accepted Commit SHA`
→ `Release/PR Scope`
→ `ADRs`
→ `Migrations / Contracts`
→ `Tests and Build Evidence`
→ `Production Acceptance Records`
→ `Traceability Matrix`

This chain is the lifecycle definition of a CAPITAL-AI release.

## 9. Rollback Rules

A rollback does not silently reuse a version number for different code.

- If production is rolled back to the exact prior accepted artifact, production returns to that
  prior tagged version.
- If a corrected artifact is required, issue a new PATCH version.
- Never move an existing final version tag to another commit.
- Never overwrite a historical acceptance record to make a failed release appear successful.

## 10. Database Migration Relationship

Database migrations and application versions are related but not identical.

A migration receives:

- its own immutable migration identifier/timestamp;
- its own production validation evidence when required;
- a reference from the release that consumes or depends on it.

A successful migration such as Screening SLO Persistence can therefore be accepted inside
`0.6.0` without automatically becoming `0.6.1` or `0.7.0`.

If a migration enables a material new product capability that is actually released to users, that
release will normally qualify as a MINOR increment.

## 11. Automation Target

Before or as part of the next platform version increment, CAPITAL-AI should provide a controlled
release-version automation that:

1. validates the requested SemVer target;
2. verifies it is greater than the current version;
3. updates `package.json` and `package-lock.json` together;
4. updates governed mirror declarations;
5. runs `platformVersionConsistency.test.ts`;
6. refuses release on mismatch;
7. produces a release-candidate evidence file;
8. does **not** create the final Git tag until production acceptance is recorded.

This automation must fail closed.

## 12. Current Decision for the Next Version

As of this ADR:

- released/current platform version: **`0.6.0`**
- Production SLO Persistence: accepted within **`0.6.0`**
- no automatic increment is performed by this ADR
- next fix-only release candidate: **`0.6.1`**
- next capability release candidate: **`0.7.0`**
- `1.0.0`: blocked until a dedicated GA decision and its acceptance gates are complete

## 13. Consequences

### Positive

- version numbers identify real production releases rather than arbitrary development milestones;
- `package.json` remains the authoritative source;
- release acceptance becomes part of version governance;
- database migrations and feature completion can be traced without causing version churn;
- tags, acceptance records and traceability form an auditable release chain;
- stale version declarations become release-blocking rather than cosmetic debt.

### Trade-offs

- a release requires explicit closure evidence;
- version changes become deliberate release operations rather than casual edits;
- failed production candidates may require a corrective release cycle before tagging.

These costs are intentional for an Enterprise FinTech production lifecycle.

## 14. Acceptance Criteria for GOV-VER-002

This ADR is considered implemented as governance when:

- `package.json` remains the platform-version source of truth;
- version increments are performed only at the Release Version Gate;
- future release records classify PATCH/MINOR/MAJOR explicitly;
- the version-consistency regression test is mandatory for release;
- final Git tags are created only for production-accepted commits;
- release traceability references acceptance evidence and migrations where applicable.
