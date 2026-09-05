# CAPITAL-AI-GOV — External Tool / Connector Availability Boundary Evidence

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Baseline:** `main@2bd18df1a2f85bde798bc705422ea5e860baa89d`  
**Date:** 2026-09-05  
**Role:** non-authorizing implementation/correlation evidence

## Owner-directed requirement

Repository governance must remain strictly separated from external execution-host availability management.

The implemented trust-root clarification establishes all of the following:

1. repository governance MUST NOT install, uninstall, connect, disconnect, enable, disable or modify permissions of ChatGPT apps, MCP hosts, GitHub connectors or other provider execution-host integrations;
2. fail-closed handling means the affected protected repository action stops and the conflict is reported to the Human/Owner;
3. fail-closed handling MUST NOT mutate external tool availability, connector state, OAuth state, app permissions or execution-host configuration;
4. read-only repository discovery/correlation through an already connected GitHub connector remains permitted and SHOULD continue where required by `/AGENTS.md`;
5. any external connector/app availability or permission mutation requires a separate explicit Human/Owner request naming the exact integration and intended mutation;
6. repository policy, validator findings, missing capabilities or protected-action conflicts do not manufacture authorization for an execution-host mutation.

## Authority correlation

The requirement is implemented directly in `/AGENTS.md`, the sole repository-wide AI-agent trust root.

No new `AUTH-*`, `CTRL-*`, ADR, ESS, provider profile, policy overlay or execution-host control plane is introduced. The clarification reuses existing stable controls:

- `CTRL-GOV-TRUST-001` — single agent trust root and instruction surface;
- `CTRL-SEC-LEASTPRIV-001` — least privilege and fail-closed security behavior.

The existing reuse order is also clarified so discovery/evaluation of connected tools cannot be interpreted as authorization to install/connect/enable/disable/change permissions.

## Pre-check correlation

- Current main at branch creation: `2bd18df1a2f85bde798bc705422ea5e860baa89d`.
- Open PR #728: CAPITAL-AI-FINTECH Equity PIT/Filing Evidence; no Governance trust-root file overlap.
- Open PR #730: CAPITAL-AI-DATA realtime newsfeed entitlement remediation; no Governance trust-root file overlap.
- Canonical project routing confirms `CAPITAL-AI-GOV` owns `PVC-05` plus cross-cutting repository Governance.
- No external connector/app/provider availability, OAuth, permission or execution-host mutation was performed.

## Before / after

| Surface | Before | After |
|---|---|---|
| Fail-closed meaning | Repository action stop was defined generally; execution-host availability mutation was not explicitly excluded | Protected repository action stops and conflict is reported; connector/app/OAuth/host mutation is explicitly forbidden as fail-closed implementation |
| Connected GitHub discovery | Permitted by existing connector workflows, but not explicitly protected from over-broad fail-closed interpretation | Already-connected read-only discovery/correlation explicitly remains permitted and SHOULD continue when required |
| External integration changes | Protected external mutations required Owner authority, but connector availability/permission mutation was not stated as a dedicated boundary | Any install/remove/connect/disconnect/enable/disable/permission change requires a separate explicit Owner request naming integration + mutation |
| Reuse/plugin discovery | Reuse order could be read too broadly | Discovery/evaluation does not authorize integration mutation |
| Architecture | Existing trust root + control catalog | Unchanged; no second connector governance/control plane introduced |

## Validation boundary

This change is documentation/governance-only. No application runtime, dependency, workflow, database, provider, billing, deployment or production resource is modified.

PR creation remains separately gated by `CTRL-SDLC-PR-CREATE-001`: final current-main/open-PR correlation, exact branch-head reporting and explicit Human/Owner approval for that exact state are required before the create mutation.