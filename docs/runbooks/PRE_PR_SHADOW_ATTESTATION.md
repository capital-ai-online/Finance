# Pre-PR Shadow Attestation Runbook

**Role:** `NON_AUTHORIZING_SHADOW_EVIDENCE`  
**Instruction authority:** `NONE`  
**Repository AI/development trust root:** `/AGENTS.md@CURRENT_MAIN`

## Purpose

This runbook describes the S4 shadow contract for independently produced deterministic validation evidence. It is an operational/evidence projection only: it does **not** define AI/chat execution, task status, ownership, dependencies or continuation; it does **not** replace `build-and-test`; and it grants no Required Check, merge, deployment or production authority.

## Current state

- Trust registry: `.github/policies/pre-pr-attestation-trust.shadow.json`
- Repository subject: `capital-ai-online/Finance`
- State: `SHADOW_ONLY`
- Trusted signers: none
- Required-check authority: false
- Merge authority: false
- Task/status/ownership/dependency authority: false

The empty signer set is deliberate. An agent must not add its own key and then treat that key as independent evidence. The registry and this runbook are not task registries and cannot compete with canonical project/Roadmap task state resolved under `/AGENTS.md@CURRENT_MAIN`.

## Evidence subject

A future independent producer must sign an envelope bound to:

- `subject.repository`
- `subject.prNumber`
- `subject.baseSha`
- `subject.headSha`
- `subject.scopeClass`
- exact trusted scope flags
- Node/platform/architecture toolchain
- check IDs with `status=pass` and SHA-256 evidence digests
- `generatedAt`, `expiresAt`, `nonce`
- producer signer/run/surface identity

## Required deterministic checks

The verifier derives required check IDs from trusted scope flags:

| Scope flag | Required evidence |
|---|---|
| `integrity` | `repository_integrity` |
| `lint` | `typescript` |
| `unit` | `unit_tests` |
| `build` | `production_build`, `production_csp` |
| `audit` | `dependency_audit` |
| `predeploy` | `predeploy` |
| `docker` | `docker_hardening` |
| `docker_image` | `docker_image` |

## Verification command

The verifier can validate a future externally supplied envelope with:

```bash
EXPECTED_REPOSITORY=capital-ai-online/Finance \
EXPECTED_PR_NUMBER=<pr> \
EXPECTED_BASE_SHA=<40-char-base-sha> \
EXPECTED_HEAD_SHA=<40-char-head-sha> \
EXPECTED_SCOPE_CLASS=<D|C|R> \
node scripts/pr/shadowAttestation.mjs --verify /path/to/attestation.json
```

With the current empty signer registry this command is expected to reject all real evidence as untrusted. That is the correct S4 behavior.

## Replay rule

The same signed evidence may be reused only for the same exact Repository+PR+Base+Head subject while within TTL. It must fail when presented for another PR, Base or Head. Exact-snapshot evidence reuse is not considered a security replay because it cannot authorize a different source state.

## Signer provisioning — future protected step

Do not store a private signer key in this repository, Git history, PR body, workflow source or ordinary environment file. A future signer must be independently controlled and Owner-approved. Its public trust material may be added only through a separate protected cutover after shadow comparison and negative testing.

## Cutover prohibition

The following are prohibited during S4–S6:

- using shadow evidence to synthesize `build-and-test` PASS;
- removing `build-and-test` from Required Checks;
- adding a candidate-controlled signer;
- accepting unsigned evidence;
- weakening GitGuardian;
- modifying production Sigstore/Render exact-SHA controls for PR cost reasons;
- using this shadow surface as a second task/backlog/status/ownership/dependency authority.

## Failure handling

Any mismatch in repository, PR, Base SHA, Head SHA, scope, toolchain, required checks, timestamp, signer or signature is fail-closed. The fallback is the existing hosted validation path, never a self-issued exception.
