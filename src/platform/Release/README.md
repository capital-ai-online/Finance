# Release

## Enterprise Component

**Status:** Development  
**Component Version:** `1.1.0`  
**Owner:** Platform Director  
**Governance:** ADR-0030 / GOV-VER-002  
**Runtime Contract:** `release-version-gate/1.0.0`

---

## Purpose

The Release component governs CAPITAL-AI platform-version advancement and release-candidate evidence.
It does not decide that a feature is ready by itself and it never creates a final Git tag.

`package.json#version` remains the single source of truth for the currently released platform version.
The Release component reads that value at execution time; this document intentionally does not pin a
separate current platform version.

A version changes only at the dedicated Release Version Gate defined by ADR-0030.

---

## Controlled Command

```bash
npm run release:version -- \
  --target=0.7.0 \
  --classification=MINOR \
  --work-packages=PR-54,PR-56 \
  --adrs=ADR-0032,ADR-0033 \
  --migrations=none \
  --risks="provider availability remains plan-dependent" \
  --rollback-boundary="Rollback to the exact prior accepted artifact" \
  --acceptance="production smoke tests,provider health evidence"
```

The command is a **dry run by default**. It validates the requested transition and all mandatory
release metadata without changing files.

Only an intentional execution with `--apply` may mutate governed version declarations:

```bash
npm run release:version -- <same arguments> --apply
```

---

## Fail-Closed Rules

The gate rejects a request when, among other conditions:

- the target is not strict `MAJOR.MINOR.PATCH` SemVer;
- the target is not greater than the current release;
- a PATCH skips more than one patch level;
- a MINOR skips a minor line or does not reset patch to zero;
- a MAJOR is not the next major `.0.0` version;
- PATCH/MINOR/MAJOR classification does not match the requested transition;
- a MINOR/MAJOR has no ADR traceability;
- a MAJOR has no dedicated GA ADR;
- work-package scope, rollback boundary, known risks or production-acceptance requirements are missing;
- `package.json` and the root `package-lock.json` version are already inconsistent;
- a governed mirror declaration cannot be synchronized;
- any mandatory post-update release check fails.

There is no best-effort or partial version bump. If an apply-stage gate fails, the version files are
restored to their pre-gate content.

---

## Governed Version Declarations

The gate synchronizes:

1. `package.json`
2. root `package-lock.json#version`
3. `package-lock.json#packages[""]#version`
4. `metadata.json`
5. `README.md`
6. `AGENTS.md`
7. `docs/code-quality/CODE_QUALITY_STANDARDS.md`
8. `docs/ceo/EXECUTIVE_SUMMARY.md`
9. `docs/API.md`
10. `index.html`

The regression test `tests/unit/platformVersionConsistency.test.ts` independently verifies the
source-of-truth relationship.

---

## Mandatory Apply Gates

After synchronization, the release command executes:

```text
npm run lint
npx vitest run tests/unit/platformVersionConsistency.test.ts
npm run build
npm run predeploy:check
```

Any non-zero result aborts the release-version operation and restores the governed version files.

The normal repository CI still runs independently after the change is committed; the local gate is
not a substitute for GitHub CI.

---

## Release Candidate Evidence

Only after all apply-stage gates pass, the command creates:

```text
docs/releases/candidates/RELEASE_CANDIDATE_<target-version>.md
```

The candidate record contains:

- source and target version;
- PATCH/MINOR/MAJOR classification;
- work-package / PR scope;
- ADR scope;
- migration scope;
- known risks;
- rollback boundary;
- production-acceptance requirements;
- version-gate evidence;
- explicit status `VERSIONED_RC_PENDING_PRODUCTION_ACCEPTANCE`;
- explicit `NOT_CREATED` final-tag state.

The exact candidate commit SHA is resolved by GitHub CI / the production acceptance record. The
candidate evidence file cannot safely embed the SHA of the same commit that contains the file,
because doing so would create an impossible self-referential commit hash.

---

## Production Acceptance and Final Tag

This component deliberately **does not** implement `git tag`.

The lifecycle boundary is:

```text
Development
  -> Integration / Scope Freeze
  -> Release Version Gate
  -> Versioned Release Candidate
  -> Production Deployment
  -> Production Acceptance
  -> immutable tag vMAJOR.MINOR.PATCH
  -> Traceability Closure
```

A failed candidate must never be tagged as the released platform version. A final tag may be created
only after the exact deployed commit has a closed production acceptance record.

Historical final tags must never be moved to different commits.

---

## Tests

- `tests/unit/releaseVersionGate.test.ts`
  - exact next PATCH/MINOR/MAJOR transitions;
  - classification mismatch rejection;
  - GA ADR requirement;
  - package-lock drift rejection;
  - synchronized update and rollback;
  - mandatory ADR / acceptance traceability.
- `tests/unit/platformVersionConsistency.test.ts`
  - strict SemVer source of truth;
  - package-lock root consistency;
  - metadata consistency;
  - governed declaration consistency.

---

## Enterprise References

- `docs/adr/resolved/ADR-0030-platform-version-release-lifecycle.md`
- `ESS-0001`
- `ESS-0001-CONTRACTS`
- `ESS-0007` — Enterprise Release Center
- `src/platform/Traceability`

The implementation does not change the application version by itself. A version increase remains a
separate, explicit release operation under ADR-0030.
