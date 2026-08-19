# M10 Disabled / Render Deploy Recovery Evidence — 2026-08-19

**Status:** OWNER-AUTHORIZED OPERATIONAL EXCEPTION / PR PENDING  
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

## Incident correlation

Render's last confirmed live deployment is commit `b22327b17a23455347b19ab4ec12ed784045c0dc`, produced by the deploy-hook path after PR #437. No later Render deploy object was present during this recovery analysis even though `main` had advanced through subsequent Human merges, including the TypeScript remediation in PR #443 and the CI invariant remediation in PR #444.

The repository already contained the correct production deployment chain:

`verified main build -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deploy identity verification`

The failure boundary was therefore upstream of Render: PR validation was repeatedly blocked by M10 and related CI failures, preventing a stable reviewed path to a new verified main deployment. Render Auto-Deploy was also disabled in the live service, while `render.yaml` still declared `checksPass`, creating configuration drift and an ambiguous second deployment authority.

## TypeScript remediation correlation

The observed TypeScript `TS2339` failure in `ScoringDispatcher.ts` was already remediated and Human-merged by PR #443. The fix narrows the discriminated request union on `input.assetClass` before accessing `input.execution`. This recovery branch is based after PR #443 and deliberately does not duplicate or rewrite that fix.

PR #444 subsequently repaired two brittle unit invariants and was also merged before this branch was created. The branch therefore starts from a baseline containing both remediations.

## Semantic diff and operational impact

| Area | Before | Recovery state |
|---|---|---|
| PR CI authorization | M10 passkey consumption required for ordinary PR CI; ordinary PR events could stop before technical checks | M10 implementation retained, but `M10_CI_GATE_ENABLED=false` lets ordinary PRs enter the existing scope-classified CI path |
| Manual dispatch | M10 `workflow_dispatch` could consume an authorization | While M10 is disabled, manual dispatch is explicitly denied and cannot become a bypass |
| Human merge | Separate Human boundary | Unchanged; still separate and mandatory |
| Render auto-deploy | Live service `off`, repository Blueprint `checksPass` | Blueprint aligned to `off` |
| Production deploy authority | GitHub main CI deploy hook, but Blueprint implied a second checks-based path | Single explicit authority: verified main CI -> attestation -> exact-SHA deploy hook |
| Deployment identity | Production still reports PR #437 commit | Next successful Human-merged main pipeline is expected to deploy its exact verified SHA and post-verify it |
| Application SemVer | `0.6.0` | Unchanged; deployment revision is bound to exact commit SHA. Automatic SemVer/README projection remains separately tracked by PR #439 |
| TypeScript TS2339 | Previously blocked an authorized M10 build | Already fixed by merged PR #443 and inherited by this branch |

## Security impact

This exception weakens the PR-CI authorization ceremony from passkey-gated execution to ordinary GitHub PR-triggered CI. It does **not** weaken the production deployment boundary: deployment remains restricted to a successful `push` on `main` after build/test and supply-chain attestation. Render Auto-Deploy is explicitly disabled to prevent parallel un-attested deployments.

Historical M10 service code, database migrations, runbooks and evidence are not deleted or rewritten. Re-enabling the gate remains a reviewable one-line operational switch plus validation of the retained M10 path.

## Regulatory impact

N/A for this control-plane recovery. No customer data, billing entitlement, Stripe mutation, Supabase schema/data mutation, IAM elevation or regulatory record is changed by this branch.

## Rollback

1. Do not merge if post-PR technical checks expose a regression.
2. If the branch is merged and the CI exception must be reverted, Human-revert the merge commit or set `M10_CI_GATE_ENABLED=true` in a separately reviewed PR.
3. Keep Render Auto-Deploy `off`; do not compensate for CI failure by enabling an independent automatic deploy path.
4. If a post-merge Render deployment fails health/identity verification, retain the prior live Render revision and remediate through a fresh Human-gated branch.

## Validation plan

No cost-incurring build/test was executed before PR creation. After PR creation, the existing Class-R pipeline must validate workflow security, TypeScript, unit tests, production build/predeploy, Docker hardening/image invariants and the new CI/Render control-plane regression test. Before PR creation, this branch must be compared again with the then-current `main` and open parallel PRs.
