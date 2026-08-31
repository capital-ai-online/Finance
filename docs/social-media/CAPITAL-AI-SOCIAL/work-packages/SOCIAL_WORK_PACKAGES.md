# CAPITAL-AI-SOCIAL Work Packages

**Version:** 2.1.1  
**Baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Scope:** Social-domain only. No package authorizes external publication, Security verification or foreign-domain/PVC mutation.

| ID | Workstream | Scope | Current disposition | Exit evidence |
|---|---|---|---|---|
| SOC-01 | Channel Inventory | Maintain evidence-based supported/partial/unsupported channel inventory | BASELINE MAPPED | channel matrix + last verified baseline |
| SOC-02 | Provider Inventory | Map canonical provider identities/capabilities and Security boundary without duplicating adapters | BASELINE MAPPED | provider matrix + duplicate-path check + Security dependency reference |
| SOC-03 | Content Sources | Consume canonical source identity/provenance | HANDOFF-BOUND | DOC reference + traceability fields |
| SOC-04 | Content Packages | Define/implement one Social Content Package contract by extension/reuse | CONTRACT DEFINED / RUNTIME PARTIAL | package schema/tests without parallel generator |
| SOC-05 | Channel Adaptation | Apply channel text/format/link/hashtag/media/disclosure/accessibility constraints | PARTIAL | constraint tests + disclosure preservation |
| SOC-06 | Publishing Preparation | Prepare immutable provider candidate/payload without approval authority | PARTIAL | candidate hash + payload validation + preview |
| SOC-07 | Publishing Handoff | Carry candidate hash, approval reference, provider operation and evidence destination | CONTRACT DEFINED | handoff contract + stale-approval DENY evidence from owning control path |
| SOC-08 | Provider Adapters | Reuse canonical provider stack and detect duplicates/bypass | REUSE | one canonical path per operation + explicit errors + applicable Security evidence |
| SOC-09 | Publishing Evidence | Define Social publication evidence requirements and consume returned evidence | PARTIAL | post ID/URL/state/hash/approval/trace evidence |
| SOC-10 | Analytics Consumption | Consume canonical channel metrics only when evidenced | GAP | analytics source mapping + metric/time-window provenance |
| SOC-11 | Social Drift | Detect channel/provider/template/disclosure/publishing/analytics/Security-contract drift | DOCUMENTED | repeatable drift report/checks |

## Security integration common rule

CAPITAL-AI-SEC PR #631 is merged and defines Security as a cross-cutting requirements/findings/testing/verification domain with no Primary `PVC-*` ownership. `CAPITAL-AI-SOCIAL` also owns no Primary `PVC-*` stage.

The current Security Traceability Matrix contains no active finding routed to Social. Therefore SOC work packages consume the generic Security boundary but do not self-create a Security finding or PVC routing record.

If CAPITAL-AI-SEC later routes a concrete finding affecting Social-owned implementation:

- use `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml`;
- verify the supplied `project_namespace: PVC` / `project_stage: PVC-NN` against current `PROJECT_VALUE_CHAIN.md`;
- reject ambiguous/foreign ownership fail-closed;
- implement only Social-owned changes;
- execute the requested positive/negative Security tests;
- report `IMPLEMENTED` or `EVIDENCE_READY` with exact candidate/runtime evidence;
- return `[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`;
- do not set Security `VERIFIED/CLOSED` locally.

## SOC-01 — Channel Inventory

Requirements:

- derive support from repository/provider evidence only;
- do not infer credentials or entitlement;
- distinguish supported, partial and unsupported channels;
- maintain channel-specific limits only from verified sources/contracts.

## SOC-02 — Provider Inventory

Requirements:

- reference existing `server/socialMedia/` provider stack;
- identify supported operations;
- keep unknown rate-limit/analytics/scheduling capability explicitly unknown;
- no second adapter for the same provider operation;
- keep OAuth/secrets/provider Security requirements and verification external to CAPITAL-AI-SEC.

## SOC-03 — Content Sources

Social requirement only. Upstream canonical content implementation is handed off to `CAPITAL-AI-DOC`.

Required Social consumption fields: source ID, source domain, provenance and evidence reference where financial claims are present.

## SOC-04 — Content Packages

Implement the V2.1.1 package contract by extending/reusing existing generator/types. Prohibited: parallel Social generator pipeline.

## SOC-05 — Channel Adaptation

Adaptation cannot change factual meaning or silently drop required disclosures. A channel constraint conflict moves content to review instead of truncating a regulated/financial statement.

## SOC-06 — Publishing Preparation

Prepare the exact immutable candidate snapshot and provider-compatible payload. Preparation creates no approval and performs no autonomous external mutation.

Any Security finding concerning candidate integrity, input validation or authorization is consumed from CAPITAL-AI-SEC; generic Security coverage alone does not create Social implementation ownership.

## SOC-07 — Publishing Handoff

The handoff references external approval and protected execution. A stale approval after candidate content/asset/platform changes is invalid.

Security requirement/verification ownership remains CAPITAL-AI-SEC. Protected execution remains with applicable OPS/Owner authority. Social owns only its handoff contract and Social-local implementation.

## SOC-08 — Provider Adapters

Provider adapter availability means technical capability only. It is not authority. Existing provider implementation is reused; bypass and duplicate-path checks are mandatory.

Credential/OAuth Security, threat/control definition and independent Security verification remain CAPITAL-AI-SEC-owned. Provider execution authority is not inferred from adapter presence.

## SOC-09 — Publishing Evidence

Social defines/consumes the publication evidence contract. Operational persistence changes outside Social ownership are handed off where applicable.

`PUBLISHED_VERIFIED` cannot be emitted from a local request or scheduling preparation alone. Security `VERIFIED` likewise cannot be emitted by Social.

## SOC-10 — Analytics Consumption

No fabricated metrics. Preserve provider metric definition, channel, source and measurement window. If no canonical source exists, status remains `UNKNOWN`/GAP.

## SOC-11 — Social Drift

Detect:

- channel capability changes;
- provider contract/API changes;
- template/content-contract changes;
- disclosure changes;
- publishing-boundary changes;
- analytics-contract changes;
- Security-handoff/verification-contract drift.

Detection does not authorize foreign-domain remediation or Security finding closure.

## Definition of Done

The Social workstream set is complete only when supported channels/providers remain evidence-based, source/provenance is traceable, publishing preparation and external authority are separated, publication evidence is explicit, analytics values are evidence-backed, all foreign work has target-project handoffs, no duplicate provider/publishing authority exists, and any concrete Security finding routed to Social has been returned to CAPITAL-AI-SEC for independent verification.