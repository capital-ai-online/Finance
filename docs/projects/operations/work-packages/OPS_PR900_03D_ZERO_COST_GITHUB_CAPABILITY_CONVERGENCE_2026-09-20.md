# OPS-PR900-03D — Zero-Cost GitHub Capability & Settings Convergence

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02; supporting PVC-06/PVC-07/PVC-08/PVC-18  
**Trust root:** /AGENTS.md@CURRENT_MAIN  
**Owner direction:** 2026-09-20 — implement unused GitHub settings/capacity without creating additional cost  
**Initial baseline:** main@242e1847800af27ad80d4b4a693a28b9754eb25d  
**Status:** TERMINAL — 03D.1/03D.2 MERGED VIA #1173; 03D.3 MERGED VIA #1175; current follow-up moved to `OPS-GITHUB-SETTINGS-EFFECTIVE-EXPORT-01`  
**Merge authority:** HUMAN_MERGE_REQUIRED

## Purpose

Convert the existing GitHub App billing reader into a broader evidence surface for unused or underused GitHub capabilities without turning read access into mutation authority.

The package does not attempt to consume quota merely because quota exists. A capability is useful only when it improves security, evidence durability, recovery, delivery efficiency, or operations while preserving a zero-new-paid-usage boundary.

## First implementation slice

### 03D.1 Settings inventory reader

Repository implementation adds a bounded read-only GitHub App surface for:

- Organization Actions policy;
- Organization default workflow permissions;
- Organization artifact/log retention;
- Organization private-fork PR workflow settings;
- Organization self-hosted-runner policy;
- Repository metadata/settings projection;
- Repository Actions policy;
- Repository default workflow permissions;
- Repository artifact/log retention;
- Repository private-fork PR workflow settings;
- Repository custom-property inventory with values redacted;
- Repository ruleset inventory with names/bypass actors redacted.

The client uses only an Organization installation token, GET requests, a static capability allowlist, transient tokens, and no generic raw REST proxy.

Provider 403/404 results are represented as NOT_OBSERVABLE. Missing grants are not treated as a request to broaden the GitHub App.

### 03D.2 Zero-cost eligibility

A fail-closed classifier is added with these states:

- CANDIDATE_ZERO_COST;
- COST_REVIEW_REQUIRED;
- NOT_OBSERVABLE;
- NOT_INCLUDED.

CANDIDATE_ZERO_COST requires all of:

1. provider entitlement independently verified as included;
2. applicable provider setting successfully read;
3. billing net amount observed;
4. observed net amount equals zero.

Even then automatic enablement remains false. This first slice performs no paid-usage or provider-setting mutation.

### 03D.3 Evidence-storage foundation

PR #1173 merged the bounded settings inventory. The continuation slice now makes current repository storage observable without enabling storage mutations.

Implemented read-only evidence:

- repository and organization Actions cache usage;
- repository and organization cache retention limits;
- repository and organization cache storage limits;
- repository Actions artifact inventory with names and workflow identity redacted;
- existing repository and organization artifact/log retention;
- enterprise billing rows correlated with Actions artifact storage, Actions cache storage, and Packages storage.

The storage model remains purpose-bound:

- CACHE — recreatable acceleration only, maximum CAPITAL-AI retention 7 days;
- TRANSIENT_ARTIFACT — handoff/debug/downstream consumption, maximum CAPITAL-AI retention 7 days;
- EVIDENCE_ARTIFACT — verification/provenance/audit/rollback/release evidence, maximum CAPITAL-AI retention 90 days.

Current zero-cost guardrails use the verified GitHub Enterprise Cloud included allowances:

- shared Actions artifact + GitHub Packages storage: 50 GiB;
- Actions cache: 10 GiB per repository;
- internal warning at 35 GiB shared-pool usage;
- nonessential artifact freeze at 40 GiB;
- hard stop / cost review at 50 GiB or any positive observed billed storage.

The shared 50 GiB pool remains NOT_OBSERVABLE unless a current provider readback for total shared-pool usage is supplied. Repository artifact bytes alone MUST NOT be treated as the whole shared pool.

No retention, cache limit, artifact upload, package, GHCR, billing, or provider setting is changed by this slice.

## Cost boundary

No new scheduled workflow is introduced. The settings inventory is attached to the existing manually dispatched Private GitHub Billing Read workflow.

The implementation therefore does not introduce another polling loop and does not enable Codespaces, larger runners, additional GitHub security licenses, Copilot/AI credits, GitHub Models, LFS, or other metered products.

## Security boundary

- no private-key/token value is emitted;
- custom-property values are redacted;
- ruleset names and bypass actors are redacted from the inventory projection;
- no generic provider proxy exists;
- no provider permission is changed;
- no Billing/Budget/Cost Center write is performed;
- existing bounded Cost Center writer remains separate.

## Provider documentation correlation

Verified against current GitHub Enterprise Cloud documentation on 2026-09-20:

- GitHub Actions permissions endpoints support GitHub App installation tokens with Administration read for Organization/Repository settings;
- artifact/log retention has dedicated Organization and Repository GET endpoints;
- repository rulesets are readable with Metadata read;
- repository custom-property values are readable with Metadata read;
- Enterprise installations do not implicitly grant Organization/Repository access, so Organization settings use the Organization installation.

Provider documentation remains external evidence and does not create repository authority.

## Exit gates for this slice

- bounded reader has no raw proxy;
- only GET provider methods are public;
- exact Organization installation is required;
- unsupported capability/repository scope fails before provider access;
- settings output does not expose protected values;
- zero-cost classifier cannot auto-enable anything;
- positive net amount becomes COST_REVIEW_REQUIRED;
- missing entitlement/settings/billing evidence becomes NOT_OBSERVABLE;
- existing private billing workflow remains workflow_dispatch-only;
- unit/hosted validation is truthful and attached to exact PR head;
- final merge remains Human/CODEOWNER controlled.

## Deferred slices

After 03D.3 merges and real provider readback is available:

1. assess GHCR as canonical container storage under current billing evidence; current post-merge evidence has already shown a local-vs-pushed manifest digest mismatch on the publisher path, so GHCR MUST remain a separate fail-closed follow-up;
2. correlate Included-Usage alerts and metered-product hard-stop budgets;
3. optimize Cost Watch polling only if warning/blocker semantics remain reproducible;
4. produce an explicit candidate list of currently unused settings that can be enabled with zero observed paid usage;
5. only after exact shared-pool readback PASS, decide whether additional EVIDENCE_ARTIFACT uploads can be admitted below the 35 GiB warning threshold.


## Terminal convergence — 2026-09-24

- PR #1173 merged at `a9e32f27f8f9edc41dcce34e5439294667338a20`.
- PR #1175 merged at `a5d2297527a9e394ac751ac542567b6ac238d6fd`.
- Historical claims `OPS-PR900-03D-ZERO-COST-CAPABILITY-20260920` and `OPS-PR900-03D3-EVIDENCE-STORAGE-20260920` are released and non-exclusive.
- New settings/export work is not a revival of this package; it is the fresh owner-directed follow-up `OPS-GITHUB-SETTINGS-EFFECTIVE-EXPORT-01`.
