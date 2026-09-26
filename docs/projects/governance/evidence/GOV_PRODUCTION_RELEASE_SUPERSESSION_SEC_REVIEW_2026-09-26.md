# Independent Security Development-Chain Review — Production Release Supersession

**Review:** `SEC-REVIEW-GOV-PRODUCTION-RELEASE-20260926`  
**Mode:** read-only Security assurance; `SECURITY_FOUNDATION_FIRST`  
**Baseline:** `82f50a97db513cab02e0a342c19230badb0b3ade`  
**Subject:** Production Release identity, version source and deployment chain  
**Result:** `CONDITIONAL / FAIL-CLOSED MIGRATION`

## Trust-boundary evidence observed

- main has active PR/required-check/non-fast-forward rules;
- required checks include GitGuardian, HIGH/CRITICAL hardened-image CVE gate, PR Governance and build-and-test;
- all repository tags are protected against deletion and non-fast-forward changes by an active tag ruleset;
- current direct branch-protection readback through the connected GitHub App returns HTTP 403, so this review relies on readable repository rulesets rather than claiming unavailable branch-protection evidence;
- the existing cleanup workflow uses `contents: write` + `pull-requests: read`, pinned checkout and a dry-run option;
- Production version derivation is currently coupled to the mutable dependency/package manifest and many code/test consumers.

## Security findings

### SEC-01 — Package metadata / Production identity conflation — HIGH integrity risk

`package.json` is a frequently consumed build/dependency surface. Treating it as Production identity expands the blast radius of package-oriented mutations and makes one mutable source file carry unrelated trust semantics.

**Required control:** demote it to package metadata and bind released Production identity to immutable acceptance evidence.

### SEC-02 — Immutable tag protection is suitable for final release anchoring — POSITIVE CONTROL

The current all-tag deletion/non-fast-forward ruleset materially supports an immutable final Release anchor.

**Required control:** never bypass/move an accepted final tag; verify the tag points to the accepted source SHA and manifest digest evidence.

### SEC-03 — Runtime identity must be artifact-bound — HIGH

Exact SHA alone does not prove the deployed artifact if build inputs or provider deployment identity are not bound.

**Required control:** accepted Release Manifest binds version + SHA + artifact digest + provider deployment identity/generation.

### SEC-04 — Dual authority during migration is unacceptable — HIGH

Fallback from the new Release authority to package metadata would make downgrade/confusion attacks and accidental drift harder to detect.

**Required control:** migration gate is fail-closed. Productive paths have exactly one authority; compatibility fallback may not silently reactivate package-derived Production truth.

### SEC-05 — Secrets must stay outside manifest/evidence — HIGH

A richer Release Manifest increases the temptation to store provider details.

**Required control:** store only non-secret identifiers/hashes/evidence references. Tokens, API keys, credentials and reusable authentication material remain outside repository/runtime release evidence.

### SEC-06 — Branch cleanup must preserve unmerged evidence — MEDIUM

Several historical branches still contain commits not reachable from main. Blind deletion could destroy audit/work evidence.

**Required control:** automatic deletion is limited to branches proven merged/inactive by the canonical cleanup workflow. Diverged/unmerged branches require terminal merge/close/supersession/abandonment correlation before deletion.

## Security validation chain

1. Threat-model the new Release Manifest/tag trust boundary.
2. Prove tag/ruleset immutability and exact source/artifact binding.
3. Scan productive code for package-version fallback/authority remnants.
4. Validate protected Production promotion/readback with no secret leakage.
5. Exercise rollback to a prior accepted tuple and confirm no tag/evidence rewrite.

## SEC disposition

The proposed separation reduces Production-identity coupling and is suitable for controlled migration. **Security PASS is not claimed for Production activation** until the exact OPS migration generation proves the five Security validations. Human/CODEOWNER and protected-provider gates remain unchanged.
