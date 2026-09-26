# ADR-0107 — Production Release Version Authority Supersession

- **Status:** HUMAN-MERGE-GATED
- **Date:** 2026-09-26
- **Project:** `CAPITAL-AI-GOV`
- **Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`
- **Productive handoff:** `CAPITAL-AI-OPS / PVC-06 Version Management / PVC-07 Release Management / PVC-08 Production Operations`
- **Trust root:** `/AGENTS.md@CURRENT_MAIN`
- **Decision baseline:** `main@82f50a97db513cab02e0a342c19230badb0b3ade`
- **Current package metadata observed at baseline:** `package.json#version = 0.6.5`
- **Effective:** only after Human/CODEOWNER merge of the exact supersession change
- **Supersedes prospectively:** package.json-as-Production-Version authority and fixed ten-merge Production PATCH cadence in ADR-0030 / ADR-0105 projections
- **Preserves:** five-merge deployment cadence, semantic PATCH/MINOR/MAJOR classification, exact-SHA promotion, immutable final tags, Production Acceptance, rollback/evidence controls

## 1. Context

The current implementation uses `package.json#version` as the single platform-version authority and mirrors that value through lockfile, runtime, governance and presentation consumers. The current trust root also forces a PATCH materialization at every tenth post-epoch PR merge.

This couples three different concerns:

1. Node/package metadata;
2. product/release semantics;
3. immutable Production deployment identity.

The coupling increases the number of files and consumers touched for a Production version transition and makes a dependency/package manifest part of the Production identity boundary. It also makes merge count a Production-version trigger even when release impact is better classified at a Production promotion boundary.

The target is one Production Release authority without introducing a parallel version plane.

## 2. Decision

### 2.1 Package metadata is demoted from Production authority

`package.json#version` remains valid package/tooling metadata. `package-lock.json` remains its lockfile mirror where npm semantics require it.

Neither file is a released Production-version authority after this supersession is effective. They are changed only for package-level reasons, not because a repository merge ordinal reaches a cadence boundary.

### 2.2 Released Production-version authority

A released Production version exists only after the following chain is complete:

```text
latest accepted Production Release
        ↓
bounded release-impact evidence
        ↓
deterministic candidate version/classification
        ↓
exact source SHA
        ↓
immutable build artifact + digest
        ↓
protected Production promotion
        ↓
health + exact-SHA + artifact + provider deployment readback
        ↓
Production Acceptance
        ↓
immutable accepted Release Manifest
        ↓
protected final Git tag vMAJOR.MINOR.PATCH
```

The **protected final tag plus the digest-bound accepted Release Manifest** is the single released Production-version authority.

The Release Manifest must bind at minimum:

- `releaseVersion`;
- `sourceSha`;
- `artifactDigest`;
- `deploymentGeneration` or provider deployment identifier;
- release classification;
- candidate/evidence identity;
- acceptance timestamp/evidence reference;
- rollback predecessor identity.

The final tag must point to the exact accepted source commit. Existing tag deletion/non-fast-forward protection remains mandatory.

### 2.3 Candidate versioning

A candidate is not a released Production version.

Candidate selection starts from the latest accepted Production Release and the accumulated release-impact evidence for the exact candidate scope:

- **PATCH** — backward-compatible correction, Security/reliability hardening, dependency/configuration correction, or other release-relevant change without material new capability;
- **MINOR** — material backward-compatible product/API/domain capability;
- **MAJOR** — incompatible transition or explicit GA decision through its dedicated Human/Compliance/Security gates.

Every different artifact intentionally accepted into Production receives a new Production Release version. This preserves one immutable version → one accepted artifact identity.

A failed Production candidate remains failed evidence. Its candidate identity/version is not reassigned to another artifact.

### 2.4 Deployment cadence

The current five-merge Render cadence remains the normal Production promotion cadence.

At every positive `mergeOrdinal` divisible by 5:

1. re-read latest `CURRENT_MAIN`;
2. assemble the exact Release candidate;
3. derive the candidate version from the latest accepted release plus release-impact evidence;
4. build once and bind its digest;
5. execute all applicable CI/QM/Security/Compliance gates;
6. promote that exact artifact through the existing protected Render path;
7. verify health, source SHA, artifact identity and provider deployment identity;
8. accept or reject;
9. only on acceptance finalize manifest and protected tag.

A separately authorized Security/hotfix release may occur between boundaries and does not shift the future 5/10/15… deployment boundaries.

The former independent ten-merge PATCH cadence is retired.

## 3. Production identity model

A bare version string is insufficient operational identity.

The canonical runtime identity is:

```text
ProductionIdentity =
  releaseVersion
  + sourceSha
  + artifactDigest
  + deploymentGeneration/providerDeploymentId
```

This tuple is used for Production readback, incident correlation, rollback, release evidence and dashboard projection.

## 4. Rollback

Rollback restores a previously accepted immutable Production identity tuple.

- final tags are never moved;
- accepted manifests are never rewritten;
- rolling back to a prior accepted artifact restores that prior Release identity;
- a corrected/new artifact is a new candidate and receives a new Production Release version;
- provider state without exact readback is `NOT_PROVEN`, never accepted by inference.

## 5. Transition / migration

This ADR does not self-bootstrap productive OPS code.

After Human/CODEOWNER merge, `CAPITAL-AI-OPS / PVC-06..08` must migrate the current package-version consumers, including at least:

- Release platform version control plane;
- deterministic version decision/materialization;
- Release Version Gate inputs;
- structural validators;
- artifact-version inventory classification;
- runtime Release Manifest generation/readback;
- PR/roadmap/dashboard cadence projections;
- tests and documentation that still assert `package.json#version` as Production authority.

The migration must be atomic from an authority perspective: no accepted dual-authority period.

Until the OPS migration passes exact-head validation plus independent QM and Security assurance, protected Production promotion under the new model is `MIGRATION_HELD`.

## 6. Supersession map

| Existing semantic | New disposition |
|---|---|
| `package.json#version` as released platform/Production authority | SUPERSEDED after effective merge |
| `package-lock.json` as Production version mirror | SUPERSEDED; remains npm/package mirror only |
| fixed ten-merge PATCH materialization | SUPERSEDED |
| five-merge deployment cadence | PRESERVED |
| ADR-0030 Release Acceptance | PRESERVED |
| ADR-0030 immutable final tag | PRESERVED and promoted into released-version authority chain |
| ADR-0105 semantic impact evidence | PRESERVED as candidate-classification input |
| exact-SHA Production promotion/readback | PRESERVED |
| Human/CODEOWNER merge boundary | PRESERVED |
| Security/QM/Compliance gates | PRESERVED |

## 7. Quality gates

The migration is accepted only if all five validation layers pass:

1. **Authority uniqueness** — exactly one released Production-version authority is reachable;
2. **Deterministic candidate** — same accepted predecessor + same evidence yields the same candidate classification/version;
3. **Artifact binding** — version, SHA, digest and provider deployment identity are cryptographically/readback-bound;
4. **Consumer convergence** — no productive runtime/tool/dashboard path still derives Production version from package metadata;
5. **Rollback/recovery** — exact prior accepted tuple can be selected and verified without moving a tag or rewriting evidence.

## 8. Security invariants

- Protected tags remain deletion/non-fast-forward guarded.
- No secret or credential becomes part of a Release Manifest.
- Release metadata cannot grant Deployment, IAM, Billing, DNS, database or merge authority.
- Production promotion stays exact-SHA/exact-artifact and fail-closed on missing provider readback.
- Branch/PR/ruleset protections and required Security checks remain unchanged by version-source migration.
- The migration may remove old authority paths only after proven consumer convergence; compatibility fallback to package metadata is prohibited in productive paths.

## 9. Consequences

### Positive

- package and Production lifecycle are separated;
- fewer routine mutations to package/lock metadata;
- released Production identity is immutable and audit-oriented;
- deployment and versioning converge at the same acceptance boundary;
- rollback and incident evidence use exact artifact identity rather than a mutable source file.

### Trade-offs

- Release candidate generation and accepted-manifest handling must be upgraded;
- all current package-version consumers must migrate coherently;
- failed candidates consume/retire an identity rather than silently reusing it;
- the OPS migration requires independent QM and Security evidence before release activation.

## 10. Acceptance event

This ADR is not authority while it exists only on a branch or open PR.

Acceptance occurs only if the exact supersession change is Human/CODEOWNER-merged under the then-current `/AGENTS.md`. After merge, the modified trust-root semantics govern; this ADR remains subject-matter rationale and migration design rather than a second development instruction surface.
