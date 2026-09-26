# OPS-GITHUB-MANAGEMENT-SETTINGS-INVENTORY-01 — Enterprise runner-group readback repair

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02  
**Supporting PVC:** PVC-08, PVC-18  
**Baseline:** `main@c1ea7b128238d51110cebbb5bfbe4d43ccab17cd`  
**Implementation branch:** `agent/operations-org-runner-groups-readback-20260927`  
**State:** `SECOND_FOLLOW_UP_ON_BRANCH / READ_ONLY / HUMAN_MERGE_REQUIRED`  
**Parent package:** `OPS_GITHUB_MANAGEMENT_SETTINGS_INVENTORY_01_2026-09-24.md`

## Trigger and observed evidence

Manual GitHub Actions run #18 of `Private GitHub Billing Read` was dispatched on `main` at CURRENT_MAIN `f961ce6c9a15a4c627b7e6a21adf840f1584b5e9`.

Independent read stages completed. The settings inventory failed at
`enterprise.actions.runner_groups.list` with:

`[GITHUB-ENTERPRISE-SETTINGS-READ] paginated Enterprise response must contain an array for groups`

The dependent zero-cost Storage Capability report also failed because the
settings evidence file was not produced. The final Evidence Completion Gate
correctly failed; this is not a successful inventory.

## Post-merge run #19 evidence

PR #1470 merged the Enterprise reader repair as `main@c1ea7b128238d51110cebbb5bfbe4d43ccab17cd`. Manual workflow run #19 then proved that Enterprise runner-group parsing succeeds. The combined Organization/Repository settings reader failed independently at `organization.actions.runner_groups.list` because its organization endpoint descriptor still expected `groups`.

The dependent redacted settings export and Storage Capability report were therefore not produced, and the final Evidence Completion Gate correctly failed with `settings-inventory=failure storage-capability=failure`. Run #19 is partial provider evidence and does not close the package.

## Root cause and bounded change

GitHub's Enterprise runner-group list response uses the JSON array property
`runner_groups`. The bounded GET-only reader expected `groups`, which caused the
parser to reject the documented response shape.

The first fix changed the Enterprise reader field from `groups` to `runner_groups`. The bounded follow-up changes the Organization reader descriptor and its existing fixture to the same documented `runner_groups` response key.

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

1. Focused combined settings client test passes with the documented Organization `runner_groups` response.
2. Exact-head Governance, CI/build-test and required Security checks pass.
3. Human/CODEOWNER merges the PR.
4. Re-run `Private GitHub Billing Read` on fresh `main`; verify the Settings
   Inventory and dependent Storage Capability steps, then read the redacted
   summary. Only that post-merge run may close this follow-up.

A successful unit test or PR check is not provider-run evidence and cannot be
reported as a successful settings inventory.
