# M10 Post-Cutover Assurance — 2026-08-19

Status: **LIVE EXIT MATRIX VERIFIED PASS — FINAL TRACEABILITY SYNC PENDING**  
Branch: `agent/m10-post-cutover-assurance`  
Initial baseline: `main@00be77c39ed0bf24bb6328fa941b35adf3999b7f`  
Current correlated main after PR #430 merge: `2d8e482174e97601d4343249e50d208ccf6f6355`  
Authority: ADR-0066, ESS-0022, M10 Threat Model, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Purpose

Prove the Human-merged and production-deployed M10 Controlled Cutover against a fresh real pull request. This probe is documentation-only and changes no runtime, workflow, credential, schema, billing, IAM or production configuration. Human Merge remains separate from `AUTHORIZE_PR_CI`.

This probe is not intended to merge. After the live matrix is frozen and correlated, PR #431 is closed. Durable M10 closure/traceability is performed separately from fresh `main`.

## Preflight and correlation

- Controlled-Cutover PR #429 was Human-merged to `main@00be77c39ed0bf24bb6328fa941b35adf3999b7f` and deployed to Render before probe creation.
- `M10_GITHUB_TOKEN` remained the read-only trusted PR-state resolver credential.
- `M10_GITHUB_DISPATCH_TOKEN` was separately provisioned for Actions write before cutover merge.
- Probe branch was created fresh from then-current main.
- At creation, open PR #430 had zero path overlap with this M10 evidence file.
- During assurance, PR #430 was Human-merged. Main advanced to `2d8e482174e97601d4343249e50d208ccf6f6355` and the probe branch was conflict-free synchronized by bot.
- Recovery test head after that synchronization: `6e448ba752daa89ac91394c2c7ebc08de5da07f8`.
- Pre-freeze branch correlation: `ahead=3`, `behind=0`, merge-base exact current main; functional branch difference remained only this evidence file.

## Live matrix

### PC-1 — ordinary PR event cheap DENY

**PASS — LIVE.** Initial CI `#1872` failed exactly at `M10 CI-Autorisierung vor teuren Schritten prüfen`. Checkout, classifier, npm, dependency audit, TypeScript, Unit, Production Build, CSP, predeploy, Docker and image build were skipped. Governance `#1194` passed.

### PC-2 — real authoritative Owner passkey

**PASS — LIVE.** On initial head `da92c86d4aeff96dfeec65a9eada1f98cead2351`, the authoritative Owner WebAuthn flow created immutable `m10_approval_evidence` for `AUTHORIZE_PR_CI` and exactly one matching CI consumption.

### PC-3 — exactly one authorized current-head CI

**PASS — LIVE.** GitHub run `32228796660` / CI `#1873` was a `workflow_dispatch` on exact branch/head `da92c86d...`, passed the production OIDC/workflow gate, transitioned the single consumption `PENDING -> DISPATCHED`, and completed `build-and-test` successfully. Because the probe was class D, npm/test/build/docker remained intentionally skipped after gate success.

### PC-4 — duplicate / replay at Owner authorization boundary

**PASS — LIVE.** A second Owner authorization on unchanged `da92c86d...` created a second immutable approval, but the atomic consumer returned `DEDUPE_HEAD`. That approval remained unconsumed. No second consumption, accepted dispatch or workflow-gate success was created.

Initial-head exactly-once correlation after duplicate test: **2 approvals / 1 consumption / 1 accepted dispatch / 1 workflow-gate success**.

### PC-5 — manual Actions replay / malformed gate boundary

**PASS — LIVE + DETERMINISTIC.** After successful recovery run `32231008414`, the already-authorized `build-and-test` job was manually re-run. GitHub created a real Actions runner/OIDC context, but the underlying M10 consumption was already terminal. The second job attempt failed at the first M10 authorization step and checkout plus every downstream step was skipped. No extra consumption was created.

Deterministic regression coverage additionally denies wrong/missing OIDC audience, repository, ref, head, run, event and workflow claims; expired OIDC; forged signature; non-RS256 JOSE; consumption context mismatch; changed file-set/diff; already-finalized consumption; audit failure; malformed refs.

### PC-6 — stale approval after head/base change

**PASS — LIVE.** A documentation-only commit advanced the probe from `da92c86d...` to `b7eb7af5...`. CI `#1874` again cheap-DENYed at the first M10 step and all expensive work was skipped. The duplicate-test approval remained unconsumed and bound to old head `da92c86d...`; no consumption for the new head was created.

Subsequently PR #430 merged, advancing main to `2d8e4821...`. The probe branch reconciled to head `6e448ba7...` without M10 path conflict. Old approvals remained bound to their old base/head context and did not authorize the reconciled head.

### PC-7 — fresh authoritative recovery

**PASS — LIVE.** Fresh Owner authorization on reconciled base `2d8e482174e97601d4343249e50d208ccf6f6355` and head `6e448ba752daa89ac91394c2c7ebc08de5da07f8` created approval `4mfDfSI5AHQYktmo-NDUoQ`, exactly one matching consumption, and GitHub workflow run `32231008414` / CI `#1878`.

M5 audit recorded `githubOidcVerified=true`, `currentPrStateReResolved=true`, `singleUseWorkflowGate=true`; the consumption transitioned to `DISPATCHED` with no failure reason. Run `#1878` completed successfully on the exact approved head.

Recovery-head correlation: **1 approval / 1 consumption / 1 accepted dispatch / 1 successful workflow-gate claim**.

### PC-8 — legacy signals remain non-authoritative

**PASS — STRUCTURAL / DETERMINISTIC.** The controlled-cutover source contract asserts that `ci.yml` contains no `okay`, `💪`, reaction or Viewed authorization path. Normal PR CI authority is Passkey + immutable approval + single-use consumption + exact-context GitHub OIDC. Human Merge remains separate.

### PC-9 — audit correlation and exit assessment

**PASS FOR LIVE MATRIX.** Production audit evidence correlates Owner begin/complete, accepted dispatch, OIDC workflow-gate claim, exact repository/PR/head and run IDs for both successfully authorized heads. Exactly one successful consumption/CI chain exists per approved head. Duplicate/replay, stale-state isolation and fresh recovery are proven.

## Evidence summary

| Control | Before live probe | Verified outcome |
|---|---|---|
| Ordinary PR event | cutover only implemented | cheap DENY before checkout live proven |
| Owner passkey | authoritative runtime deployed | immutable exact-head approval live proven |
| CI dispatch | implemented | exactly one exact-head dispatch on two distinct approved heads |
| Runner identity | OIDC implemented | signed OIDC + current-state re-resolve live proven |
| Consumption | atomic foundation | one `PENDING -> DISPATCHED` winner per approved head |
| Replay | deterministic tests | Owner duplicate + Actions job rerun live DENY |
| Head/base drift | deterministic tests | stale approvals ineffective after real head/base change |
| Recovery | Phase-6 Shadow PASS | fresh authoritative recovery PASS |
| Legacy signals | retired by policy | structurally no CI authority |
| Human Merge | separate | remained separate throughout |

## Remaining closure work

The **live Post-Cutover Matrix is VERIFIED PASS**, but M10 is not yet marked `COMPLETE / VERIFIED PASS` in authoritative project documentation. A separate fresh-main closure work package must synchronize:

- M10 runbook status and exit gate;
- enterprise roadmap / M10 milestone status;
- final durable evidence / traceability references;
- document registry entries where applicable;
- final main/open-PR correlation.

No weaker checkbox/emoji/text/reaction fallback may be introduced during closure.

## Safety / rollback

This probe is documentation-only. Expected M10 approval/consumption rows are production authorization evidence, not configuration mutation. If the cutover path later fails, remain fail-closed and repair through a separate Human-authorized fresh-main branch. Do not restore legacy automatic expensive PR CI or checkbox/emoji authorization.
