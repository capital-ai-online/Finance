# OPS-GITHUB-MANAGEMENT-SETTINGS-INVENTORY-01 — Enterprise runner-group readback repair

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02  
**Supporting PVC:** PVC-08, PVC-18  
**Baseline:** `main@f961ce6c9a15a4c627b7e6a21adf840f1584b5e9`  
**Implementation branch:** `operations/github-enterprise-runner-groups-20260927`  
**State:** `FOLLOW_UP_ON_BRANCH / READ_ONLY / HUMAN_MERGE_REQUIRED`  
**Parent package:** `OPS_GITHUB_MANAGEMENT_SETTINGS_INVENTORY_01_2026-09-24.md`

## Trigger and observed evidence

Manual GitHub Actions run #18 of `Private GitHub Billing Read` was dispatched on `main` at CURRENT_MAIN `f961ce6c9a15a4c627b7e6a21adf840f1584b5e9`.

Independent read stages completed. The settings inventory failed at
`enterprise.actions.runner_groups.list` with:

`[GITHUB-ENTERPRISE-SETTINGS-READ] paginated Enterprise response must contain an array for groups`

The dependent zero-cost Storage Capability report also failed because the
settings evidence file was not produced. The final Evidence Completion Gate
correctly failed; this is not a successful inventory.

## Root cause and bounded change

GitHub's Enterprise runner-group list response uses the JSON array property
`runner_groups`. The bounded GET-only reader expected `groups`, which caused the
parser to reject the documented response shape.

The fix changes only the registered pagination field from `groups` to
`runner_groups` and adds a focused assertion that the returned runner groups
are projected into the canonical inventory `items` field.

Reference: [GitHub REST API — self-hosted runner groups](https://docs.github.com/en/enterprise-cloud@latest/rest/actions/self-hosted-runner-groups).

## Security and privacy boundary

- The existing Enterprise Read PAT remains a server-side GitHub Actions secret,
  not a plaintext Actions variable.
- No token, private key, raw email, cryptographic key material, reviewer identity
  or secret value is exported.
- This work remains provider GET-only; it does not change GitHub settings, IAM,
  secrets, billing, production or deployment.
- Unavailable settings remain `NOT_OBSERVABLE`; malformed data still fails closed.

## Validation and exit gate

**Observed before fix:** Run #18's independent reads reported success, while the
final gate failed with `settings-inventory=failure` and
`storage-capability=failure`. The settings step's concrete parser error is
preserved above.

**Required before closure:**

1. Focused Enterprise client unit test passes with the documented
   `runner_groups` response and projects one row into `items`.
2. Exact-head Governance, CI/build-test and required Security checks pass.
3. Human/CODEOWNER merges the PR.
4. Re-run `Private GitHub Billing Read` on fresh `main`; verify the Settings
   Inventory and dependent Storage Capability steps, then read the redacted
   summary. Only that post-merge run may close this follow-up.

A successful unit test or PR check is not provider-run evidence and cannot be
reported as a successful settings inventory.
