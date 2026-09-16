# CAPITAL-AI-OPS Work-Package Subdomain

The canonical task register is `../WORK_PACKAGES.md` and the canonical execution projection is `../ROADMAP.md`.

This directory contains bounded package specifications that require more detail than the canonical register. Package documents remain non-authorizing and must not duplicate Security findings, ADR/ESS authorities or source-domain roadmaps.

Current package specifications include:

- `OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md` — merged GitHub Work-Management inventory, coordination-only taxonomy contract and the blocked sequencing contract for `OPS-PR900-03B`.
- `OPS_PR900_03C_GITHUB_API_AUTHORITY_MATRIX_2026-09-16.md` — revalidated Enterprise/Organization/Repository/Security API and connector-capability matrix, GitHub-App Reader/Controller separation and PAT-compatibility exceptions without provider mutation.
- `OPS_PR900_04A_GITHUB_APP_MCP_READER_SETUP_2026-09-16.md` — least-privileged GitHub App/MCP Reader contract, allowlisted Enterprise/Organization/Repository/Security readback capabilities, credential separation and fail-closed provider-gap readback without provider mutation.
- `OPS_PR900_07_CONTROLLED_PR_CI_AUTOFIX_2026-09-16.md` — exact-head Controlled PR CI Autofix contract with failure classification, deterministic/optional Copilot repair engines, trusted patch guards, privilege separation, two-attempt loop ceiling and exact-tree revalidation without merge-authority transfer.

The first Security-routed OPS items are `OPS-02-SEC-06`, `OPS-06-SEC-03`, `OPS-04-SEC-04`, `OPS-02-SEC-05`, `OPS-08-SEC-07`, `OPS-08-SEC-09` and `OPS-08-SEC-10`.