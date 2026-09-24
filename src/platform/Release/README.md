# Release

## Enterprise Component

**Status:** Development  
**Component Version:** `1.2.0`  
**Owner:** `CAPITAL-AI-OPS / PVC-06 Version Management / PVC-07 Release Management`  
**Governance:** ADR-0030 + ADR-0105 + ADR-0096 / CTRL-GOV-VERSION-001 + CTRL-GOV-VERSION-002  
**Runtime Contract:** `release-version-gate/1.1.0` + `deterministic-version-materialization/1.0.0` + `platform-version-control-plane/1.0.0`

---

## Purpose

The Release component governs CAPITAL-AI platform-version advancement, read-only platform-version projection and release-candidate evidence.

`package.json#version` is the **single platform-version authority**. The Release component reads that value at execution time; this document intentionally does not pin a separate current platform version.

ADR-0105 partially supersedes the discretionary version-selection semantics of ADR-0030: when accepted deterministic Decision Evidence is used, target version and PATCH/MINOR/MAJOR classification are derived from that evidence and cannot be freely supplied. Productive mutation still runs only through this existing Release Version Gate. ADR-0096 keeps legacy VersionManager authority/state semantics suspended/non-authorizing.

---

## Authority and projection model

```text
ADR-0105 deterministic Decision Evidence
        |
        +--> deterministicVersionMaterialization.ts
                    | validates identity/rules/refs/eligibility/current branch context
                    | derives targetVersion + classification (no free choice)
                    v
package.json#version                         <- sole platform-version authority
        |
        +--> releaseVersionGate.ts           <- controlled mutation + decision binding
        +--> readmeVersionProjection.ts      <- deterministic documentation projection
        +--> platformVersionControlPlane.ts  <- read-only runtime/admin projection
        |         +--> VersionManager GET /api/admin/version (compatibility adapter)
        |
        +--> vite.config.ts
                  +--> __CAPITAL_AI_VERSION__
                            +--> Release/clientVersion.ts <- canonical browser projection
                                      +--> UI / PDF / client-visible exports
                                      +--> Branding/runtimeBrand.ts (compatibility re-export)

AGENTS.md Control Plane Version              <- independent Governance metadata
```

`AGENTS.md` is never a product-version mirror. README is never an authority. `uploads/version_manager.json` and `/api/admin/version/bump` are retired legacy paths and cannot determine or mutate the platform version.

Client code must not pin a second platform SemVer literal. Browser-visible platform-version text is projected through `src/platform/Release/clientVersion.ts`; historical/model/schema/provider contract versions remain independent version domains and must not be rewritten to the platform version merely because they are SemVer-shaped.

---

## Controlled commands

### Deterministic ADR-0105 path

```bash
npm run release:version -- \
  --decision-evidence=.quality/deterministic-version-decision.json \
  --work-packages=OPS-PR900-02 \
  --migrations=none \
  --risks="branch candidate only; production acceptance remains pending" \
  --rollback-boundary="Restore the complete governed version rollback set" \
  --acceptance="production acceptance remains pending"
```

The deterministic mode validates at minimum `calculatedVersion`, `bumpType`, `decisionHash`, `triggeredRules`, `ruleEngineVersion`, `baseSha`, `branchHeadShaBeforeVersioning`, `materialization.eligible` and applicable ADR/ESS/Control references. It also binds the decision to the current merge base, current branch head and `package.json#version` before a Release plan is built.

When `--decision-evidence` is supplied, `--target` and `--classification` are rejected. `NONE`, `NO_CHANGE_ALREADY_APPLIED` and `materialization.eligible=false` cannot mutate governed version files. Direct-main execution is denied. MAJOR remains subject to the existing GA/Release Policy gate.

### Legacy explicit path

```bash
npm run release:version -- \
  --target=0.7.0 \
  --classification=MINOR \
  --work-packages=PR-449 \
  --adrs=ADR-0030,ADR-0096 \
  --migrations=none \
  --risks=none \
  --rollback-boundary="Rollback to the exact prior accepted artifact" \
  --acceptance="production smoke tests"
```

The explicit path is retained for non-ADR-0105 Release operations. It does not override deterministic Decision Evidence: once `--decision-evidence` is used, target/classification are exclusively evidence-derived.

Both modes are **dry run by default**. Only an intentional execution with `--apply` may mutate the platform-version authority and controlled technical mirrors.

---

## Deterministic Decision → Release contract

`src/platform/Release/Services/deterministicVersionMaterialization.ts` is a bounded adapter, not a second versioning engine. It consumes the accepted machine-readable rule contract at `docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json` and validates the supplied Decision Evidence against that contract.

The adapter must fail closed when any of the following is stale, inconsistent or missing:

- strict previous/calculated SemVer;
- Decision status and `materialization.eligible` state;
- `decisionHash` format and accepted `ruleEngineVersion`;
- current `baseSha` / merge base and `branchHeadShaBeforeVersioning` / HEAD identity;
- triggered rule IDs and their highest-severity `bumpType`;
- exact next-version transition implied by the deterministic bump;
- ADR-0030 + ADR-0105, ESS-0001-CONTRACTS and CTRL-GOV-VERSION-001/002 traceability;
- mandatory DENY values for direct main, automatic merge, automatic Release Acceptance and automatic deployment.

The adapter returns either an explicit no-mutation result or constructs the `ReleaseVersionRequest` itself from the validated Decision Evidence before delegating to `buildReleaseVersionPlan`. The deterministic CLI never accepts a separately chosen target/classification, so the existing Release Gate receives only the evidence-derived pair while retaining its established transition, mirror, rollback and Release-policy checks.

---

## Versioned artifacts

### Authority

1. `package.json#version`

### Lockfile synchronization

2. root `package-lock.json#version`
3. `package-lock.json#packages[""]#version`

### Direct technical mirrors

4. `metadata.json`
5. `docs/code-quality/CODE_QUALITY_STANDARDS.md`
6. `docs/ceo/EXECUTIVE_SUMMARY.md`
7. `index.html`

`docs/archive/raw-materials/API.md` is a historical snapshot and is intentionally excluded from
the current Release mirror set. Current API architecture lives under `docs/architecture/api/`
without a duplicated platform-version declaration.

### Derived projections

8. `README.md`, regenerated through `npm run readme:sync`
9. `__CAPITAL_AI_VERSION__`, injected by Vite from `package.json#version`
10. `src/platform/Release/clientVersion.ts`, validated browser-safe projection consumed by UI/PDF code

`README.md` is included in the atomic rollback set but is not rewritten by generic mirror logic. `AGENTS.md` is excluded from both product-version mutation and consistency projection. Client components are consumers of the injected projection and therefore do not require direct string rewrites during a release.

---

## Fail-closed rules

The gate rejects a request when, among other conditions:

- the target is not strict `MAJOR.MINOR.PATCH` SemVer;
- the target is not greater than the current release;
- the transition skips an allowed PATCH/MINOR/MAJOR boundary;
- classification does not match the requested transition;
- deterministic Decision Evidence is stale, malformed, non-eligible or inconsistent with the requested transition;
- deterministic mode is combined with free `--target` or `--classification` input;
- required work-package, ADR, rollback, risk or production-acceptance evidence is absent;
- `package.json` and root lockfile metadata already disagree;
- a required direct mirror or README projection is absent;
- deterministic README synchronization fails;
- Documentation Hygiene or Governance Control Plane validation fails;
- TypeScript, targeted version tests, build or predeploy gates fail.

There is no best-effort or partial version bump. On apply-stage failure the gate restores the complete authority/projection rollback set.

---

## Mandatory apply gates

After changing `package.json#version` and direct technical mirrors, the controlled release path executes:

```text
npm run readme:sync
npm run lint
npx vitest run tests/unit/platformVersionConsistency.test.ts tests/unit/readmeVersionProjection.test.ts
npm run readme:check
npm run docs:hygiene:check
npm run governance:control-plane
npm run build
npm run predeploy:check
```

Hosted GitHub CI remains an independent exact-head verification and is not replaced by these local gates.

---

## Runtime/admin/client projection

`src/platform/Release/Services/platformVersionControlPlane.ts` reads `package.json#version` and, when present, validates the immutable runtime release manifest against that authority.

The compatibility endpoint remains `/api/admin/version`, but it is routed through the normal Express admin authorization middleware. The production runtime guard may reject retired writes but must not answer this authenticated GET before AuthN/AuthZ.

`vite.config.ts` reads the same authority during the build and injects `__CAPITAL_AI_VERSION__`. `src/platform/Release/clientVersion.ts` validates this value as strict SemVer and exposes it to browser code. `src/platform/Branding/runtimeBrand.ts` is only a temporary compatibility re-export so existing PDF/branding imports can be strangled toward the Release namespace without introducing a second authority.

No HTTP endpoint in `src/platform/VersionManager` may bump a version, persist local version state, generate ADR/compliance documents or execute a version event chain.

---

## Release candidate evidence and final tag

After all apply-stage gates pass, the command writes `docs/releases/candidates/RELEASE_CANDIDATE_<target-version>.md`. When ADR-0105 Decision Evidence is used, the candidate record additionally binds the deterministic materialization contract, decision hash, rule engine version, base/head identity, calculated version, bump type, triggered rules, affected project/component and ADR/ESS/Control references.

The record is evidence, not production acceptance. This component deliberately does **not** create a final Git tag. A final immutable `vMAJOR.MINOR.PATCH` tag remains prohibited until the exact deployed commit has an accepted production record.

---

## Tests

- `tests/unit/releaseVersionGate.test.ts` — transition classification, fail-closed metadata, direct mirrors, README rollback, AGENTS exclusion.
- `tests/unit/deterministicVersionMaterialization.test.ts` — accepted Rule Contract binding, no-op/idempotency, rule/reference/base/head correlation, protected DENY boundaries and delegation into the existing Release Version Gate.
- `tests/unit/platformVersionConsistency.test.ts` — `package.json` SemVer and current projection consistency; independent Governance Control Plane version contract for AGENTS.
- `tests/unit/clientPlatformVersionProjection.test.ts` — build-time client projection and audited runtime UI paths may not pin a stale platform version.
- `tests/unit/readmeVersionProjection.test.ts` — deterministic/idempotent README projection and malformed-input failure.
- `scripts/pr/runtimeArtifactImmutability.test.mjs` — retired write denial and proof that admin version GET is not intercepted before Express authorization.

---

## Enterprise references

- `docs/adr/resolved/ADR-0030-platform-version-release-lifecycle.md`
- `docs/adr/ADR-0105-deterministic-autonomous-versioning.md`
- `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md`
- `docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json`
- `ESS-0001`
- `ESS-0001-CONTRACTS`
- `ESS-0007` — Enterprise Release Center
- suspended historical `ESS-0004` under `docs/archive/governance/suspended/`
- `src/platform/Traceability`

A version increase remains a controlled Release operation. Deterministic ADR-0105 materialization removes free target/classification choice for that path; it does not authorize PR creation, merge, Release Acceptance, final tagging, deployment or any protected production/provider mutation.
