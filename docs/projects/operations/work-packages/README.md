# CAPITAL-AI-OPS Work-Package Subdomain

The canonical task register is `../WORK_PACKAGES.md` and the canonical execution projection is `../ROADMAP.md`.

This directory contains bounded package specifications that require more detail than the canonical register. Package documents remain non-authorizing and must not duplicate Security findings, ADR/ESS authorities or source-domain roadmaps.

Current package specifications include:

- `OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md` — merged GitHub Work-Management inventory, coordination-only taxonomy contract and the blocked sequencing contract for `OPS-PR900-03B`.
- `OPS_PR900_03C_GITHUB_API_AUTHORITY_MATRIX_2026-09-16.md` — revalidated Enterprise/Organization/Repository/Security API and connector-capability matrix, GitHub-App Reader/Controller separation and PAT-compatibility exceptions without provider mutation.
- `OPS_PR900_04A_GITHUB_APP_MCP_READER_SETUP_2026-09-16.md` — least-privileged GitHub App/MCP Reader contract, allowlisted Enterprise/Organization/Repository/Security readback capabilities, credential separation and fail-closed provider-gap readback without provider mutation.
- `OPS_PR900_04B_GITHUB_WORK_MANAGEMENT_GATEWAY_ADAPTER_2026-09-16.md` — bounded complement to the official GitHub MCP Server for canonical pilot Milestone object read/write/readback and generated navigation-only Wiki read/write/readback, with provider host/credentials held separately.
- `OPS_GITHUB_ENTERPRISE_ACTIONS_RENDER_SURFACE_2026-09-24.md` — owner-only Finance Render projection over the existing bounded Enterprise Actions settings reader, independent of ChatGPT Work/Codex execution limits.
- `OPS_GA4_RENDER_READBACK_2026-09-24.md` — owner-only Finance Render host for the pinned `analytics-mcp==0.7.0` read plane, eliminating Codex/GitHub-runner execution from productive GA4 readback.
- `OPS_PR900_07_CONTROLLED_PR_CI_AUTOFIX_RECOVERY_2026-09-16.md` — fresh-current-main deterministic recovery of the closed/unmerged PR-CI autofix design, limited to exact README projection repair with privileged-job checkout elimination and separate held GitHub-App controller boundary.

The first Security-routed OPS items are `OPS-02-SEC-06`, `OPS-06-SEC-03`, `OPS-04-SEC-04`, `OPS-02-SEC-05`, `OPS-08-SEC-07`, `OPS-08-SEC-09` and `OPS-08-SEC-10`.
