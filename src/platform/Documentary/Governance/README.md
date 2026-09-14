# Documentation Governance Validator

**Domain:** Documentary  
**Authority:** `ESS-0012 — Documentation Governance`  
**Global governance dependency:** `src/platform/Governance` / `/AGENTS.md`  
**Version:** `1.7.0`  
**Status:** partial implementation — read-only hygiene service plus bounded GOV-DOC-001/002/003/004/005/006/007 validation; broader ESS-0012 rule suite incremental

## Purpose

The Documentation Governance Validator belongs to the Documentary domain. It validates **documentary structure and metadata** and produces findings. It does not define repository-wide authorization, agent authority, merge policy, production mutation authority or global governance precedence.

The repository-wide Governance Control Plane is `src/platform/Governance`, resolved from `/AGENTS.md`, `docs/governance/authority-registry.json` and `docs/governance/control-catalog.json`.

## Implemented services

`Services/DocumentationHygieneValidator.ts` is the canonical read-only hygiene service. It was adapted from the reusable implementation parked in PR #439 and, after the Human-merged GOV-RD-01 synchronization in PR #838, enforces:

- root Markdown allowlist (`README.md`, `AGENTS.md` only);
- document-registry schema and current lifecycle-policy authority;
- unique document IDs and paths;
- required type/owner/authority/version/language/lifecycle metadata;
- `suspended` as an explicit governance lifecycle;
- repository-relative registry target paths and target existence.

The CLI adapter is `scripts/automation/validateDocumentationHygiene.ts` and is exposed as `npm run docs:hygiene:check`.

`Validators/DocumentationValidator.ts` implements bounded semantic DocumentationValidator slices from ESS-0012-CONTRACTS:

- `GOV-DOC-003` freshness validation on current main through Human-merged PR #805;
- `GOV-DOC-006` generator-marking validation on current main through Human-merged PR #813;
- `GOV-DOC-001` document-version validation on current main through Human-merged PR #815;
- `GOV-DOC-002` explicit ESS/ADR-reference validation on current main through Human-merged PR #821;
- `GOV-DOC-004` document-class structure validation on current main through Human-merged PR #826;
- all findings remain deterministic and evidence-backed, and all collectors perform no mutation.

`Validators/GovDoc005Validator.ts` adds the bounded WP-DOC-12 `GOV-DOC-005` slice:

- `GOV-DOC-005` is `High` severity under ESS-0012-CONTRACTS Chapter 2.5;
- the collector consumes an explicit caller-supplied set of candidate Markdown paths and therefore does not introduce a second repository scanner;
- paths under `docs/` are accepted;
- Markdown outside `docs/` is accepted only when the exact normalized repository-relative path exists in the canonical Document Registry;
- a verified regular non-symlink Markdown file outside `docs/` without that exact registry exception produces a `FileReference` finding;
- missing, non-Markdown, path-escaping or otherwise unverifiable candidates do not produce speculative findings;
- the collector does not mutate the Document Registry or register exceptions;
- the collector is not wired into the hygiene CLI gate in this slice.

`Validators/GovDoc007Validator.ts` adds the bounded WP-DOC-13 `GOV-DOC-007` slice:

- `GOV-DOC-007` is `Low` severity under ESS-0012-CONTRACTS Chapter 2.5;
- the collector consumes an explicit caller-supplied set of already-extracted document-reference evidence and therefore introduces no second Markdown scanner or parser;
- external and fragment-only references are outside this bounded repository-local resolution slice;
- repository-local references resolve relative to the documented source path and accept an existing non-symlink repository target;
- repository escapes and missing local targets produce deterministic `FileReference` findings;
- unsafe source evidence is rejected fail-closed before findings are emitted;
- the collector performs no document, registry, lifecycle, version or repository mutation.

`GOV-DOC-001` and `GOV-DOC-005` are `High`; `GOV-DOC-002`, `GOV-DOC-003`, `GOV-DOC-004` and `GOV-DOC-006` are `Medium`; `GOV-DOC-007` is `Low`.

The current bounded implementation deliberately does **not** activate the remaining ESS-0012 rule families, scoring, production thresholds, event publication or Governance decision logic.

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
  -> bounded ESS-0012 DocumentationValidator rules
```

Documentation Governance consumes global stable identities; it does not own them.

## Canonical inputs

- `ESS-0012 — Documentation Governance` — Documentation-only scope under ADR-0096
- `ESS-0012-CONTRACTS`
- `docs/governance/document-registry.json`
- `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md`
- `Discovery/SemanticFreshnessAnalyzer.ts` for correlated Documentary freshness evidence
- global governance contracts from `src/platform/Governance`

`docs/governance/DOCUMENTATION_HYGIENE_POLICY.md` is retained only as a historical compatibility projection after PR #838 and is not the current lifecycle authority.

## Implementation state

The useful hygiene implementation from parked PR #439 is reused as the canonical structural/registry hygiene service. The former standalone `tests/unit/documentationHygiene.test.ts` is intentionally retired; hygiene executes as a reusable service/CLI gate instead of duplicating repository-policy logic in a test file.

WP-DOC-07 added `GOV-DOC-003` through PR #805. WP-DOC-08 added `GOV-DOC-006` through PR #813. WP-DOC-09 added `GOV-DOC-001` through PR #815. WP-DOC-10 added `GOV-DOC-002` through PR #821. WP-DOC-11 added `GOV-DOC-004` through Human-merged PR #826. WP-DOC-12 added `GOV-DOC-005` through Human-merged PR #866. WP-DOC-13 reimplements only `GOV-DOC-007` on the fresh current-main branch `agent/documentary-gov-doc-007-20260914`; targeted coverage lives in `tests/unit/documentaryGovDoc007Validator.test.ts`.

This does **not** claim that all historical 57 ESS-0012 rules are implemented. Additional semantic Documentary validators remain separate incremental work unless explicitly brought into scope.

## Decision model

This component detects and reports documentary findings. Global authority resolution and protected-action decisions remain outside Documentary and are resolved through the Governance Control Plane and Human/Owner gates.
