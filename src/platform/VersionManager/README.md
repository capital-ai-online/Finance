# VersionManager — Compatibility Namespace

## Enterprise Component State

**Status:** Compatibility / read-only  
**Version:** `1.2.0`  
**Owner:** CAPITAL-AI  
**Governance:** ADR-0096 / CTRL-GOV-VERSION-001  
**Historical specification:** ESS-0004 — `SUSPENDED`

---

## Purpose

`src/platform/VersionManager` no longer owns platform-version state or version mutation.

The namespace remains temporarily for two narrow compatibility purposes:

1. `versionManager.ts` exposes the existing admin URL `GET /api/admin/version` as an authenticated **read-only adapter** to `src/platform/Release/Services/platformVersionControlPlane.ts`;
2. `repositoryConventionValidator.ts` remains a read-only repository-convention utility introduced under ADR-0020.

The current platform-version authority is exclusively `package.json#version`. Version transitions are implemented by the controlled Release Version Gate under ADR-0030.

---

## Client/runtime projection

Human-facing browser surfaces do not receive a second version authority. `vite.config.ts` injects `package.json#version` as `__CAPITAL_AI_VERSION__`; `src/platform/Release/clientVersion.ts` exposes the validated `CAPITAL_AI_VERSION` projection to browser code. Branding, SEO and audited runtime surfaces consume that projection rather than maintaining local platform-version literals.

The remaining Dashboard monolith is handled through a narrowly scoped build-time strangler in `vite.config.ts`. It replaces only the human-facing `Beta · Version x.y.z` label during transformation. Model, provider, schema, scoring and ADR versions remain independent version domains and are not rewritten.

`VersionManager` does not own this projection; it remains a read-only compatibility surface to the same Release authority.

---

## Retired legacy behavior

The following former VersionManager semantics are explicitly retired and non-authorizing:

- `uploads/version_manager.json` as current state/authority;
- `POST /api/admin/version/bump`;
- autonomous patch/minor/major mutation through the runtime API;
- `executeEnterpriseEventChain` as version-mutation orchestration;
- automatic CHANGELOG, release-note, ADR, architecture, compliance or other Markdown generation as a version side effect;
- VersionManager-owned Git/Docker-tag progression;
- product-version synchronization into `AGENTS.md`.

The production runtime guard still denies writes to the retired local JSON path and the former mutation URL so stale callers fail closed rather than silently reactivating legacy behavior.

---

## Read-only version adapter

`GET /api/admin/version`:

- passes through normal Express admin/supervisor authorization;
- reads `package.json#version` through the Release Platform Version Control Plane;
- optionally validates immutable runtime release-manifest evidence;
- returns `readOnly: true` and the explicit authority/contract;
- provides no mutation action.

The runtime artifact guard must not answer this GET before Express, because doing so would bypass the intended authorization middleware.

---

## Repository Convention Validator

The Naming & Repository Convention Validator remains a separate **read-only validation capability** within this compatibility namespace. It validates project identity, package/lock consistency, naming conventions, case-insensitive path collisions, legacy identities and Enterprise Exception metadata.

Commands:

- `npm run repository:validate` — strict mode for targeted repository checks;
- `npm run repository:validate:advisory` — advisory mode;
- it is not the platform-version authority and is not a deployment authorization gate.

A future cleanup may relocate this validator to a more appropriate Governance/Repository namespace, but that move is outside the current M10 prerequisite remediation scope.

---

## Current dependencies

- `src/platform/Release/Services/platformVersionControlPlane.ts`
- `src/platform/Release/clientVersion.ts`
- `src/platform/Security/authMiddleware.ts`
- `src/platform/Security/types.ts`
- Node.js `fs` / `path` for the independent repository convention validator

There is no dependency on `server/documentHygiene.ts`, `server/systemEvents.ts` or mutable version-state persistence for the version projection.

---

## Authority references

- ADR-0030 — controlled Release Version Gate
- ADR-0096 — Governance Control Plane / single platform-version authority
- ADR-0020 — repository convention validator capability
- suspended ESS-0004 — historical/non-authorizing only

This namespace cannot determine a version, approve a release, mutate documentation or reactivate M10.
