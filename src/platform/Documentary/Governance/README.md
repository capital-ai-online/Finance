# Documentation Governance Validator

**Domain:** Documentary  
**Authority:** `ESS-0012 — Documentation Governance`  
**Global governance dependency:** `src/platform/Governance` / `/AGENTS.md`  
**Version:** `1.2.0`  
**Status:** partial implementation — read-only hygiene service operational; broader ESS-0012 rule suite incremental

## Purpose

The Documentation Governance Validator belongs to the Documentary domain. It validates **documentary structure and metadata** and produces findings. It does not define repository-wide authorization, agent authority, merge policy, production mutation authority or global governance precedence.

The repository-wide Governance Control Plane is `src/platform/Governance`, resolved from `/AGENTS.md`, `docs/governance/authority-registry.json` and `docs/governance/control-catalog.json`.

## Implemented service

`Services/DocumentationHygieneValidator.ts` is the canonical read-only hygiene service. It was adapted from the reusable implementation parked in PR #439 and enforces:

- root Markdown allowlist (`README.md`, `AGENTS.md` only);
- document-registry schema and authority;
- unique document IDs and paths;
- required type/owner/authority/version/language/lifecycle metadata;
- `suspended` as an explicit governance lifecycle;
- repository-relative registry target paths and target existence.

The CLI adapter is `scripts/automation/validateDocumentationHygiene.ts` and is exposed as `npm run docs:hygiene:check`.

## Explicit non-responsibilities

Documentation Governance MUST NOT:

- define or supersede the repository-wide agent trust root;
- create a second authority registry or control catalog;
- decide Human/Owner authorization or merge eligibility;
- reinterpret an ADR/ESS lifecycle contrary to `src/platform/Governance` resolution;
- authorize production, IAM, billing, secret or external provider mutations;
- duplicate global workflow/CI/deployment policy;
- treat documentation recency alone as authority;
- mutate a document merely because validation found a defect.

## Boundary with the global Governance component

```text
src/platform/Governance
  -> stable authority/control/evidence contracts
  -> global structural governance validation
  -> authority resolution

src/platform/Documentary/Governance
  -> document hygiene service
  -> metadata and registry validation
  -> documentary consistency findings
```

Documentation Governance consumes global stable identities; it does not own them.

## Canonical inputs

- `ESS-0012 — Documentation Governance` — Documentation-only scope under ADR-0096
- `ESS-0012-CONTRACTS`
- `docs/governance/document-registry.json`
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md`
- global governance contracts from `src/platform/Governance`

## Implementation state

The useful hygiene implementation from parked PR #439 is now reused in the current Governance work package. The former standalone `tests/unit/documentationHygiene.test.ts` is intentionally retired; hygiene executes as a reusable service/CLI gate instead of duplicating repository-policy logic in a test file.

This does **not** claim that all historical 57 ESS-0012 rules are implemented. Additional semantic Documentary validators remain separate incremental work unless explicitly brought into scope.

## Decision model

This component detects and reports documentary findings. Global authority resolution and protected-action decisions remain outside Documentary and are resolved through the Governance Control Plane and Human/Owner gates.
