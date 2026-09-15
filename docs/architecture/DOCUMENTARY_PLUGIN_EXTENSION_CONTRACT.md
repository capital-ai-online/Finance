# Documentary Plugin Extension Contract

**Work package:** `WP-DOC-16`  
**Project / PVC:** `CAPITAL-AI-DOC / PVC-03`  
**Baseline:** `main@0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2`  
**Historical payload source:** `28a219a6c5659a47167b3e185c587c5667b2edf2`  
**Contract implementation:** `src/platform/Documentary/Plugins/DocumentaryExtensionContract.ts`  
**Status:** BOUNDED CONTRACT — NO PLUGIN ACTIVATION OR EXTERNAL MUTATION

## Purpose

WP-DOC-16 materializes only the Documentary-local extension validation boundary required by the existing Enterprise Plugin & Extension contracts. It does not create a Documentary plugin framework, registry, loader, execution host, provider plane or connector plane.

The implementation reuses:

- `ESS-0001-CONTRACTS` Chapter 13 as the Enterprise Plugin & Extension contract;
- `ADR-0010` as the Accepted decision that introduced Chapter 13;
- `ESS-0010` as the Documentary component specification and canonical `src/platform/Documentary/Plugins/` location;
- `/AGENTS.md` reuse and plugin-use controls for external capabilities;
- the existing Enterprise Registry as the only plugin identity/registration authority.

## Ownership boundary

Documentary owns only component-local extension metadata validation for `CAPITAL-AI-DOC / PVC-03`.

It does **not** acquire:

- Enterprise Registry runtime ownership;
- EventMesh runtime ownership (`CAPITAL-AI-OPS / PVC-18`);
- connector, MCP host, OAuth, provider or execution-host authority;
- Security Review authority;
- Platform Director approval authority;
- merge, deployment or production authority.

## Contract semantics

`DocumentaryExtensionDescriptor` projects the Chapter-13 metadata needed before an extension can even request registration:

- globally shaped plugin identity: `documentary.<type>.<name>`;
- immutable semantic version;
- Documentary owner and component-local source path;
- dependencies and public interface requirements;
- produced/consumed event declarations;
- configuration-key declarations;
- ESS/ADR references;
- security classification and, for `restricted`/`critical`, an explicit Security Review evidence reference;
- platform/interface/event compatibility versions;
- explicit network/database/foreign-code/dynamic-code declarations.

The supported type vocabulary is exactly the existing Chapter-13 extension-type vocabulary projected to lowercase identifiers. No new extension type is introduced.

## Registry reuse

The validator receives `registeredPluginIds` as **read-only context**. It can detect an already-registered ID, but it cannot create, update or delete any registry entry.

The result invariant is always:

```text
registryMutationPerformed = false
activationAuthorized = false
externalCapabilityAuthorized = false
```

A successful result is named `VALID_FOR_REGISTRATION_REQUEST`, not `REGISTERED`, `AUTHORIZED` or `ACTIVE`. The name describes eligibility for the existing registration lifecycle only; it does not implement manual registration and does not bypass Chapter-13 automatic discovery/registry rules.

Actual discovery, registry materialization and activation remain with the existing Enterprise mechanisms and applicable current authority. This contract never becomes a second registry.

## Security and external-capability boundary

The validator fails closed for:

- foreign Documentary ownership;
- unsafe or non-Documentary plugin paths;
- duplicate plugin identity in supplied Enterprise Registry context;
- missing ESS-0001-CONTRACTS or ESS-0010 references;
- malformed compatibility versions;
- execution of foreign code;
- dynamic code generation;
- Restricted/Critical classification without explicit Security Review evidence;
- declared direct database access;
- declared network access.

The last two states are deliberately blocked in this Documentary-local contract because a declaration is not authorization. A future extension requiring network/database/provider access must first obtain the separately applicable owner/security/external-mutation authority; WP-DOC-16 does not synthesize it.

## Lifecycle projection

The contract exposes the existing Chapter-13 lifecycle unchanged:

`discovery -> validation -> registration -> initialization -> activation -> execution -> deactivation -> disposal`

It does not implement any lifecycle executor. In particular, it does not perform discovery, registration, initialization, activation, execution or disposal.

## Explicit non-goals

WP-DOC-16 does not add:

- a plugin loader;
- automatic plugin discovery implementation;
- a Documentary registry;
- a provider or connector abstraction;
- MCP/OAuth integration;
- remote code loading;
- dynamic code generation;
- network/database permissions;
- a new plugin type;
- a new ADR/ESS/Authority/Control identity;
- a component, document-schema or platform version mutation.

## Acceptance criteria

WP-DOC-16 is evidence-ready when:

1. a Documentary-local descriptor can be deterministically validated;
2. duplicate Enterprise Registry identity is fail-closed from read-only registry context;
3. external-capability and unsafe-code requests do not become implicit permission;
4. Restricted/Critical extensions require explicit Security Review evidence;
5. validation performs no registry or external mutation and grants no activation;
6. unit tests cover the positive and fail-closed boundaries;
7. no parallel registry/provider/connector system is introduced.
