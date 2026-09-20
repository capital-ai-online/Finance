# OPS-PR900-03D — Zero-Cost GitHub Capability & Settings Convergence

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02; supporting PVC-06/PVC-07/PVC-08/PVC-18  
**Trust root:** /AGENTS.md@CURRENT_MAIN  
**Owner direction:** 2026-09-20 — implement unused GitHub settings/capacity without creating additional cost  
**Initial baseline:** main@242e1847800af27ad80d4b4a693a28b9754eb25d  
**Status:** IMPLEMENTING — 03D.1/03D.2 FIRST SLICE  
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

The new settings inventory includes artifact/log retention evidence. This is the prerequisite for later differentiating:

- CACHE;
- TRANSIENT_ARTIFACT;
- EVIDENCE_ARTIFACT.

No retention value is changed by this slice.

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

After this slice merges and real provider readback is available:

1. correlate actual Actions artifact/cache/Packages usage against included capacity;
2. materialize the CACHE / TRANSIENT_ARTIFACT / EVIDENCE_ARTIFACT retention matrix;
3. assess GHCR as canonical container storage under current billing evidence;
4. correlate Included-Usage alerts and metered-product hard-stop budgets;
5. optimize Cost Watch polling only if warning/blocker semantics remain reproducible;
6. produce an explicit candidate list of currently unused settings that can be enabled with zero observed paid usage.
