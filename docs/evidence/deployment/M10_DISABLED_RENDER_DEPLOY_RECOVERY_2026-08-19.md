# M10 Disabled / Render Deploy Recovery Evidence — 2026-08-19

**Status:** OWNER-AUTHORIZED OPERATIONAL EXCEPTION / PR #445 OPEN  
**Repository:** `SvenKulessa/Finance`  
**Branch:** `fix/m10-off-render-deploy-recovery`  
**Initial base:** `main@f151cd272353bc1db92bc1e9e1029833188eee3c`  
**Production service:** Render `Finance` / `srv-d91o1o9o3t8c73edi55g`

## Owner decision and authority correlation

The Owner explicitly requested on 2026-08-19 that the M10 test/gate be disabled and that the deployment failures observed since PR #437 be remediated.

Correlated M10 design authorities are not Accepted Decisions:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md` — `PROPOSED`.
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md` — `PROPOSED — IMPLEMENTATION BLOCKED BY M9`.

The repository M10 implementation and historical evidence are therefore retained for audit and rollback, but the operational PR-CI gate is disabled by the explicit Owner-controlled workflow switch `M10_CI_GATE_ENABLED=false`. This change does not authorize merge; Human/CODEOWNER merge remains a separate boundary.

## Incident correlation and recovery timeline

At the start of this recovery analysis, Render's last confirmed live deployment was commit `b22327b17a23455347b19ab4ec12ed784045c0dc`, produced by the deploy-hook path after PR #437. At that point no later Render deploy object was present even though `main` had advanced through subsequent Human merges, including the TypeScript remediation in PR #443 and the CI invariant remediation in PR #444.

During preparation of PR #445 the external production state changed: Render subsequently accepted the existing GitHub deploy-hook path for the already-Human-merged PR #444 main commit `f151cd272353bc1db92bc1e9e1029833188eee3c`.

Confirmed Render recovery object:

- Deploy ID: `dep-da2qqqegekts73bgir20`
- Commit: `f151cd272353bc1db92bc1e9e1029833188eee3c`
- Trigger: `deploy_hook`
- Started: `2026-08-19T13:19:37Z`
- Finished: `2026-08-19T13:21:05Z`
- Status at re-verification: `live`

`main` remained exactly `f151cd272353bc1db92bc1e9e1029833188eee3c` at the same re-verification point. Therefore the historical production drift of 78 commits observed during the incident is now **0 commits** and the production deployment identity is again aligned with current `main`.

This does not make the control-plane fix obsolete. It proves that Render itself can still accept the canonical deploy hook and narrows the incident to CI/control-plane stability rather than a persistent Render platform inability to deploy.

The repository's intended production deployment chain remains:

`verified main build -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deploy identity verification`

The incident boundary was upstream of Render for the stalled interval: PR validation was repeatedly blocked by M10 and related CI failures, delaying a stable reviewed path to a new verified main deployment. Render Auto-Deploy was also disabled in the live service, while `render.yaml` still declared `checksPass`, creating configuration drift and an ambiguous second deployment authority. PR #445 removes that ambiguity by aligning the Blueprint to `off` and retaining GitHub CI as the single automatic production authority.

## TypeScript remediation correlation

The observed TypeScript `TS2339` failure in `ScoringDispatcher.ts` was already remediated and Human-merged by PR #443. The fix narrows the discriminated request union on `input.assetClass` before accessing `input.execution`. This recovery branch is based after PR #443 and deliberately does not duplicate or rewrite that fix.

PR #444 subsequently repaired two brittle unit invariants and was also merged before this branch was created. The branch therefore starts from a baseline containing both remediations. PR #444 is now also the confirmed live Render production commit.

## Semantic diff and operational impact

| Area | Incident / before | Recovery state |
|---|---|---|
| PR CI authorization | M10 passkey consumption required for ordinary PR CI; ordinary PR events could stop before technical checks | M10 implementation retained, but `M10_CI_GATE_ENABLED=false` lets ordinary PRs enter the existing scope-classified CI path |
| Manual dispatch | M10 `workflow_dispatch` could consume an authorization | While M10 is disabled, manual dispatch is explicitly denied and cannot become a bypass |
| Human merge | Separate Human boundary | Unchanged; still separate and mandatory |
| Render auto-deploy | Live service `off`, repository Blueprint `checksPass` | Blueprint aligned to `off` |
| Production deploy authority | GitHub main CI deploy hook, but Blueprint implied a second checks-based path | Single explicit authority: verified main CI -> attestation -> exact-SHA deploy hook |
| Deployment identity | Incident observation: production was stuck at PR #437 / `b22327b...`, 78 commits behind `main` | Re-verification during PR #445 preparation: Render is live on PR #444 / `f151cd2...`, exactly current `main`; drift = 0 |
| Application SemVer | `0.6.0` | Unchanged; deployment revision is bound to exact commit SHA. Automatic SemVer/README projection remains separately tracked by PR #439 |
| TypeScript TS2339 | Previously blocked an authorized M10 build | Already fixed by merged PR #443, inherited by this branch, and TypeScript/Lint passed on PR #445's first CI head |
| Unit invariants | Later brittle failures blocked CI | Already fixed by merged PR #444 and inherited by this branch |

## Security impact

This exception weakens the PR-CI authorization ceremony from passkey-gated execution to ordinary GitHub PR-triggered CI. It does **not** weaken the production deployment boundary: deployment remains restricted to a successful `push` on `main` after build/test and supply-chain attestation. Render Auto-Deploy is explicitly disabled to prevent parallel un-attested deployments.

Historical M10 service code, database migrations, runbooks and evidence are not deleted or rewritten. Re-enabling the gate remains a reviewable one-line operational switch plus validation of the retained M10 path.

## Regulatory impact

N/A for this control-plane recovery. No customer data, billing entitlement, Stripe mutation, Supabase schema/data mutation, IAM elevation or regulatory record is changed by this branch.

## Rollback

1. Do not merge if post-PR technical checks expose a regression.
2. If the branch is merged and the CI exception must be reverted, Human-revert the merge commit or set `M10_CI_GATE_ENABLED=true` in a separately reviewed PR.
3. Keep Render Auto-Deploy `off`; do not compensate for CI failure by enabling an independent automatic deploy path.
4. If a later post-merge Render deployment fails health/identity verification, retain or restore the last verified healthy Render revision and remediate through a fresh Human-gated branch.

## Validation evidence and plan

No cost-incurring build/test was executed before PR creation. After PR #445 was created, the Class-R workflow started through the ordinary `pull_request` path without passkey consumption. On the initial PR head, the M10 authorization step completed successfully in disabled-owner-override mode, repository integrity passed, `npm ci` passed, production dependency audit passed, and TypeScript/Lint passed before the evidence refresh commit was created.

The final PR head must rerun and pass the complete Class-R pipeline: governance/security, dependency audit, TypeScript, unit tests, production build/CSP/predeploy, Docker hardening/image invariants, and the CI/Render control-plane regression test. Immediately before PR creation the branch was compared to then-current `main` and open parallel PRs; it was `4 ahead / 0 behind` with exact merge-base `main@f151cd272353bc1db92bc1e9e1029833188eee3c`. The post-incident production re-verification also confirmed `main` remained on that exact SHA.
