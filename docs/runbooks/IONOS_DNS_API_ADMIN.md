# IONOS DNS API Administration

Status: **Human-operated / Owner-gated production DNS control**

## Purpose

This runbook defines the bounded IONOS DNS API path for `capital-ai.online`.

- `read`: read the live IONOS zone only.
- `plan`: read the live zone and compute an exact dry-run against `config/dns/ionos-capital-ai.desired.json`.
- `apply`: execute only the exact live plan previously reviewed and explicitly dispatched by the canonical Owner.

The API credential is stored only as the GitHub Environment secret `IONOS_DNS_API_KEY` in environment `dns-production`. It must not be committed, printed, copied into Render, or added to `finance-secrets.env`.

## Security boundary

The implementation intentionally permits writes only for these record types:

- `CAA`
- `CNAME`
- `TXT`

The following are fail-closed and cannot be changed by this path:

- `A`
- `AAAA`
- `MX`
- `NS`
- `SOA`
- `DS`
- `DNSKEY`
- IONOS Domain Guard
- DNSSEC activation/deactivation
- registrar ownership/contact state

`deleteUnmanagedRecords` is permanently `false` in schema version 1. Existing records outside the explicit desired entries are not mass-deleted or replaced.

## Required GitHub Environment hardening

Before using the workflow, configure repository environment `dns-production` as follows:

1. Secret: `IONOS_DNS_API_KEY`.
2. Deployment branches/tags: **Selected branches and tags** → allow only `main`.
3. Do not expose this environment to pull-request branches.
4. Keep environment administrators limited to the Owner/required administrators.

The workflow also refuses to run unless `github.ref == refs/heads/main`, but the Environment branch restriction is still required because it protects the secret before untrusted branch code could execute.

## Desired-state file

`config/dns/ionos-capital-ai.desired.json` is the only repository-managed desired-state input.

A DNS change therefore has two separate reviews:

1. repository change to the desired-state file through the normal PR/CI/Human-Merge lifecycle;
2. separate production DNS apply through the manual workflow after an exact read/plan review.

Current managed entries are limited to the already intended MTA-STS CNAME, TLS-RPT TXT and DMARC monitoring TXT. CAA is supported by the engine but is **not yet encoded as desired state** because the existing IONOS wildcard certificate issuer/renewal requirement must be resolved before a restrictive CAA policy is applied.

SPF, DKIM and MX are intentionally not managed by this path.

## Read-only execution

GitHub → Actions → **IONOS DNS Administration** → Run workflow on `main`:

- action: `read`
- zone: `capital-ai.online`

This calls only IONOS DNS `GET` endpoints and returns the live zone plus a SHA-256 zone fingerprint.

## Plan execution

Run again with:

- action: `plan`
- zone: `capital-ai.online`

The plan contains:

- current whole-zone fingerprint;
- exact `POST` / `PUT` / `DELETE` mutations that would be required;
- warnings where an additive record would coexist with existing values;
- `planSha256` bound to the live zone, record IDs and desired state.

No mutation occurs in `plan` mode.

## Owner-gated apply

After reviewing the exact plan, the Owner starts a new workflow run on `main` with:

- action: `apply`
- zone: `capital-ai.online`
- plan_sha256: exact `planSha256` copied from the reviewed plan
- confirmation: `APPLY capital-ai.online`

Apply is rejected unless all of the following remain true:

1. GitHub actor is exactly `SvenKulessa`;
2. ref is exactly `refs/heads/main`;
3. zone is exactly `capital-ai.online`;
4. confirmation string is exact;
5. the live IONOS zone is re-read;
6. the newly computed plan SHA-256 exactly matches the reviewed plan SHA-256.

Any intervening DNS drift changes the whole-zone fingerprint and therefore invalidates the approval. The workflow stops without mutation and requires a new `plan` review.

After each successful apply the script re-reads the IONOS zone and requires the desired-state plan to contain zero remaining mutations.

## Domain Guard and DNSSEC

Domain Guard is intentionally outside this DNS-record automation. IONOS documents Domain Guard as protecting important domain-level settings such as nameservers and DNSSEC. Do not bypass that protection with the Domains API.

For the current setup using IONOS nameservers, DNSSEC should be activated through the IONOS Domain Guard / DNS UI. If the UI control remains non-responsive, treat that as an IONOS account/UI support issue; do not fabricate DS/DNSKEY values and do not change nameservers to work around it.

## MTA-STS sequencing

`mta-sts.capital-ai.online` remains an explicit host, not a Render wildcard domain.

1. Ensure `mta-sts CNAME finance-7clq.onrender.com`.
2. Verify the custom domain and managed TLS certificate in the existing Render `Finance` service.
3. Verify HTTPS `200` for `https://mta-sts.capital-ai.online/.well-known/mta-sts.txt`.
4. Only then add/version `_mta-sts TXT "v=STSv1; id=..."` through a reviewed desired-state change and a separate Owner-gated apply.
5. Keep policy in `mode: testing` until TLS-RPT evidence is clean.

## Rollback

Rollback is another explicit desired-state change and Owner-gated apply. Never use whole-zone `PUT` or bulk deletion as a shortcut.

If a DNS change causes mail/web/TLS impact:

1. stop further DNS writes;
2. record the current IONOS zone with `read`;
3. revert the specific desired record to the last verified value in a fresh repository branch;
4. merge through normal governance;
5. run `plan` and verify only the intended rollback mutation exists;
6. Owner runs `apply` with the new exact plan fingerprint;
7. verify provider state and public DNS propagation.
