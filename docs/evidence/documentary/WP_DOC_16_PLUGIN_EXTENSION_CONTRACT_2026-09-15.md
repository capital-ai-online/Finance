# WP-DOC-16 — Plugin Extension Contract Evidence

**Date:** 2026-09-15  
**Project / PVC:** `CAPITAL-AI-DOC / PVC-03`  
**Branch:** `agent/documentary-plugin-extension-model-20260915`  
**Correlation baseline:** `main@0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2`  
**Historical payload source:** `28a219a6c5659a47167b3e185c587c5667b2edf2`  
**State:** `EVIDENCE_READY_ON_FRESH_CURRENT_MAIN_BRANCH — PR/HUMAN-MERGE NOT PERFORMED`

## Correlation

This branch was created fresh from the stated current-main SHA after:

- terminal Human-merge readback of PR #935 (`merge commit 0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2`);
- full `/AGENTS.md@current-main` read (`AUTH-GOV-AGENT-TRUST-ROOT`, Control Plane `2.10.0`);
- canonical `CAPITAL-AI-DOC / PVC-03` mapping and Documentary Roadmap correlation;
- current open Pull Request inventory read (`0` open PRs immediately before branch creation);
- readback of `ESS-0001-CONTRACTS` Chapter 13, Accepted `ADR-0010`, and `ESS-0010`;
- verification that current main contains no `DocumentaryExtensionContract`, no `DOCUMENTARY_PLUGIN_EXTENSION_CONTRACT.md`, and no `documentaryExtensionContract.test.ts` implementation;
- recovery of the historical WP-DOC-16 four-file payload from commit `28a219a6c5659a47167b3e185c587c5667b2edf2` after the old branch ref was no longer present.

The historical payload remains evidentiary only. Current execution uses this fresh current-main branch.

## Semantic-equivalence disposition

The historical four-file payload was **materially reproduced, not redesigned**:

- `src/platform/Documentary/Plugins/DocumentaryExtensionContract.ts` — byte-identical to historical blob `0ddffbde1d4f9eda7878946f22a6153ce45fcab8`;
- `tests/unit/documentaryExtensionContract.test.ts` — byte-identical to historical blob `c4373859c437fc28ab44b87c0c7e8b6f73046635`;
- `docs/architecture/DOCUMENTARY_PLUGIN_EXTENSION_CONTRACT.md` — same bounded architecture contract with only current-baseline metadata plus an explicit clarification that `VALID_FOR_REGISTRATION_REQUEST` does not implement manual registration or bypass Chapter-13 automatic discovery/registry rules;
- this evidence file — refreshed to the current main/branch/authority state.

No fifth implementation surface, plugin registry, loader, provider, connector, MCP/OAuth layer or external integration was introduced.

## Current authority readback

### ESS-0001-CONTRACTS Chapter 13

Current Chapter 13 continues to require:

- component-specific extensions under the component `Plugins/` directory, including `src/platform/Documentary/Plugins/`;
- globally unique plugin identity in `<domain>.<type>.<name>` form;
- explicit plugin contract metadata, version, Owner, lifecycle, interfaces, events, configuration, ESS/ADR references and security classification;
- lifecycle `Discovery -> Validation -> Registration -> Initialization -> Activation -> Execution -> Deactivation -> Disposal`;
- Enterprise Registry registration before execution;
- deterministic load order and isolation from existing component internals;
- compatibility metadata and Security Review for Restricted/Critical plugins;
- no foreign-code execution, dynamic-code generation or authorization bypass;
- ADR requirement for new extension types/interfaces/load phases/configuration mechanisms.

### ADR-0010

ADR-0010 remains `Accepted` and keeps Chapter 13 as the Enterprise Plugin & Extension contract introduced by the 1.1.0 standard extension. Its zero-duplication rationale remains applicable.

### ESS-0010

ESS-0010 remains the Enterprise-approved Documentary Engine specification. It defines `Plugins/` as the Documentary component extension location, keeps `ESS-0001-CONTRACTS` above ESS-0010 in precedence, and does not transfer provider/connector/OAuth/database/business authority into Documentary.

### AGENTS.md

Current reuse/plugin-use controls require reuse of repository/native and already-authorized capabilities before custom alternatives, preserve least privilege, and prohibit connector/app installation, connection or permission mutation without separate explicit Human/Owner authorization. WP-DOC-16 introduces no such external mutation.

## Reuse result

Existing Enterprise contracts remain sufficient. The bounded custom code is only a Documentary-local descriptor validator/projection and does not create a competing extension framework.

Reused instead of duplicated:

- Chapter-13 extension type, identity, lifecycle, compatibility and security semantics;
- Enterprise Registry identity as caller-supplied read-only duplicate-detection context;
- Documentary canonical plugin path;
- current repository plugin-use/external-capability controls.

Not introduced:

- second Plugin Registry;
- second discovery or loader runtime;
- provider/connector/MCP/OAuth plane;
- external integration activation;
- network/database permission;
- foreign-code or dynamic-code execution.

## Deterministic result boundary

The contract can return only:

- `VALID_FOR_REGISTRATION_REQUEST`; or
- `BLOCKED`.

Every result retains:

```text
registryMutationPerformed = false
activationAuthorized = false
externalCapabilityAuthorized = false
```

A successful validation is not registration, activation, external permission, Platform Director approval or Security approval.

## Test coverage authored

The byte-identical unit suite covers:

1. positive Documentary-local registration-request validation;
2. duplicate plugin ID from supplied Enterprise Registry context;
3. unsafe Documentary plugin path;
4. network/database/foreign-code/dynamic-code fail-closed behavior;
5. Restricted/Critical Security Review evidence requirement;
6. mandatory ESS-0001-CONTRACTS + ESS-0010 references;
7. non-mutation/non-authorization result invariants.

## Validation truth

Fresh focused validation was executed after the current-main reproduction:

- TypeScript 5.8.3 `tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext`: `PASS` for the contract plus a type-neutral behavior harness;
- Node.js 22.16.0 type-stripped behavior smoke: `PASS`;
- valid Documentary-local descriptor: `VALID_FOR_REGISTRATION_REQUEST`;
- duplicate-ID, declared network access, Restricted-without-Security-Review and missing required ESS references: `BLOCKED`;
- every observed result preserved `registryMutationPerformed=false`, `activationAuthorized=false`, `externalCapabilityAuthorized=false`.

An initial harness-only TypeScript invocation referenced Node's global `process` without local `@types/node` and therefore was **not** counted as PASS. The harness was replaced with type-neutral throw assertions and the full focused check was rerun successfully.

Still not run / not claimed for this current branch:

- repository Vitest suite: `NOT RUN`;
- repository project-wide TypeScript compiler/configuration: `NOT RUN`;
- Documentation Hygiene: `NOT RUN`;
- hosted GitHub CI: `NOT RUN`;
- production/provider verification: `NOT APPLICABLE / NOT RUN`.

`NOT RUN` is never represented as PASS.

## Exit-gate assessment

At the post-implementation branch readback, WP-DOC-16 is `4 files / 0 behind` relative to its creation baseline and the focused validation is `PASS`. A final current-main/open-writer correlation is still required before any PR-create gate.

Even after this resync, `DONE_MAIN=false` until a separately approved PR is Human/CODEOWNER merged and then-current main is re-read.
