# Vendor Privacy Evidence Governance

## Purpose

This directory is the repository-side evidence index for processors and other third-party recipients used by CAPITAL-AI. It does **not** assert that every listed candidate is an Article 28 processor. Legal role classification remains explicit and evidence-based.

The repository stores metadata, review status, evidence hashes and non-secret technical observations. Executed DPAs, SCC annexes, TIAs containing confidential legal analysis, account invoices and other contractual originals SHOULD be retained in a restricted compliance archive rather than committed to source control. The manifest records their immutable SHA-256 digest and controlled storage location.

## Evidence layers

1. **Observed technical evidence** — runtime/API/account observations such as deployment or database region.
2. **Contractual evidence** — executed DPA/AVV, contractual region commitments, SCC modules/annexes and subprocessor terms.
3. **Transfer evidence** — third-country determination, transfer mechanism, TIA and supplementary measures where applicable.
4. **Governance evidence** — review date, owner confirmation, subprocessor-change notification and next review.

Technical observations never substitute contractual evidence. A runtime region such as `eu-west-1` or `frankfurt` may support the record, but must not be promoted to a contractual commitment without an applicable agreement or provider statement forming part of the contract.

## Status model

- `pending-owner-confirmation`: business usage or legal role still requires owner confirmation.
- `candidate`: named by the controller but actual personal-data processing is not yet evidenced.
- `integration-observed`: repository integration exists; production use still requires confirmation/evidence.
- `active-observed`: connected production infrastructure or integration is technically observed.
- `pending`: evidence is incomplete.
- `verified`: evidence fields required by the automated strict gate are complete and internally consistent.
- `not-applicable`: only after a documented reason establishes why the evidence category does not apply.

## Evidence file requirements

For an executed DPA/AVV or comparable contractual artifact, record at least:

- document/version identifier;
- execution/effective date;
- SHA-256 of the retained artifact;
- restricted evidence location/reference.

For subprocessors, record a dated snapshot or immutable evidence reference, its SHA-256 and whether change notifications are enabled.

For SCC-based transfers, the strict gate requires an approved TIA reference and review date. Do not mark a vendor `verified` solely because SCC text exists.

For processing/hosting regions, record contractual and observed values separately. Any contradiction is a strict-gate failure and must be resolved before the vendor can be marked verified.

## Automation

Run:

```bash
npm run privacy:evidence:preflight
```

This checks structure and reports incomplete evidence while allowing the controlled onboarding workflow to remain in progress.

Run:

```bash
npm run privacy:evidence:verify
```

for the strict gate. It fails while vendor roles/evidence remain unresolved, when a verified DPA lacks immutable evidence metadata, when SCC transfer evidence lacks an approved TIA, when evidence is stale, or when observed and contractual regions conflict.

The strict gate is intended to become a merge/release control after the initial inventory is completed with the controller. Until then, `preflight` is the CI-safe control that prevents malformed or falsely verified evidence.

## Secrets and personal data

Never commit OAuth client secrets, API keys, service-role keys, payment credentials or unrestricted contractual documents. Evidence references must be identifiers/paths, not secrets. Any repository-stored snapshot must be reviewed for confidential or personal data before commit.
