# SOCIAL-P3 — Publication & Analytics Evidence Contract

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P3`  
**Status:** `ACTIVE CONTRACT — SOCIAL-OWNED SEMANTICS / PERSISTENCE OWNER-ROUTED`  
**Trust root:** `/AGENTS.md@current-main`

## Purpose

This contract defines the Social-owned evidence semantics required to correlate an approved canonical content package with an observed provider publication and, only after verified publication, with real analytics observations.

It deliberately does **not** create a second publisher, analytics provider adapter, database/evidence-management subsystem or external-mutation authority.

## Canonical implementation

`server/socialMedia/publicationAnalyticsEvidence.ts`

Schemas:

- `social-publication-evidence/v1`
- `social-analytics-evidence/v1`

The implementation uses deterministic canonical fields and SHA-256-derived evidence IDs. The digest is identity evidence only; it does not replace provider evidence, approval, authorization or repository correlation.

## Publication evidence

A publication evidence record binds:

- canonical `contentPackageId` (`SOCIAL-P0` identity);
- immutable `contentIdentitySha256`;
- `approvalReference`;
- Social provider platform;
- explicit publication state: `published`, `pending` or `failed`;
- provider post identity for `published` / `pending` states;
- provider post URL when available;
- publication and observation timestamps;
- explicit asset applicability;
- immutable asset SHA-256 + asset reference when an asset is applicable;
- failure reason for failed publication attempts.

Fail-closed invariants:

1. a published record without provider-post identity is invalid;
2. a published record without publication timestamp is invalid;
3. observation cannot precede publication;
4. an applicable asset without immutable hash/reference is invalid;
5. `not_applicable` assets cannot carry invented asset identity;
6. failed publication evidence requires a failure reason and cannot carry a published timestamp;
7. provider URLs, when supplied, must use HTTPS.

## Analytics evidence

Analytics evidence is accepted only when it is anchored to `published` publication evidence with a provider-post identity.

Each observation requires:

- parent `publicationEvidenceId`;
- content-package and provider-post correlation inherited from the publication evidence;
- real source kind: `provider_api`, `provider_export` or `verified_data_pipeline`;
- exact `sourceIdentity`;
- reproducible `sourceReference`;
- canonical `metricName` and `metricUnit`;
- finite numeric `metricValue`;
- explicit measurement-window start/end;
- observation timestamp after the measurement window closes.

Synthetic/manual analytics origins are not accepted by this contract. Missing or invalid source/metric/window provenance fails closed instead of producing a synthetic success state.

## Ownership and persistence boundary

This Social work item owns **semantics, validation and acceptance tests only**.

It does not authorize or implement:

- Supabase DDL, migration-history repair or production database mutation;
- a new Evidence Management subsystem;
- durable cross-domain evidence storage;
- OAuth/credential/secret changes;
- provider publication;
- provider analytics reads;
- provider permission/scope changes;
- production deployment.

Where durable evidence management is required, the productive ownership remains with `CAPITAL-AI-DATA / PVC-10` according to the current Project Value Chain. Required production database/runtime execution remains separately controlled through the applicable `CAPITAL-AI-OPS` path.

The current production Supabase state must therefore be treated as an external dependency, not silently repaired by Social. In particular, repository migration files or schema intent are not proof that the corresponding production migration/history state is present.

## Integration rule

Future integration must extend the existing canonical Social publishing path rather than create a parallel publisher or analytics stack.

The intended sequence is:

```text
SOCIAL-P0 content package
→ hash-bound Human/Owner approval
→ existing canonical publisher
→ provider publication response
→ SOCIAL-P3 PublicationEvidence
→ real provider/verified pipeline analytics source
→ SOCIAL-P3 AnalyticsEvidence
→ owner-routed durable evidence persistence where required
```

No step in this contract grants publishing authority. Public publishing remains a separately controlled external business mutation.

## Verification

Targeted tests live at:

`tests/unit/socialPublicationAnalyticsEvidence.test.ts`

They cover deterministic identity plus negative cases for missing package/content/approval/provider-post/asset evidence, fabricated publication success, synthetic/manual analytics origin, missing metric/source provenance, invalid windows and analytics attached to non-published states.

## Exit interpretation

This contract closes the **Social-owned contract/validator/test slice** of `SOCIAL-P3` when targeted tests pass on the exact branch head.

It does **not** by itself satisfy the full P3 roadmap exit gate. Full closure additionally requires real provider publication evidence, real analytics source evidence, and the owner-correct durable Evidence Management / runtime path without synthetic values or unauthorized provider/database mutation.
