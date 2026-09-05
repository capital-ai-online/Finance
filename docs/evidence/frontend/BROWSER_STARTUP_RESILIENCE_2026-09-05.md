# Frontend Browser Startup Resilience — 2026-09-05

**Project:** CAPITAL-AI-FE  
**Project folder:** `docs/projects/frontend/`  
**Primary productive PVC:** none — cross-cutting Frontend project  
**Baseline:** `main@942ec7ae86dd13eded5ef2fbefc735af81ae54cc`  
**Trust root:** `/AGENTS.md`  
**Frontend authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Availability authority:** Accepted `ADR-0040`  

## Incident finding

The production service can be healthy at the HTTP/process layer while the browser application does not become usable. This failure class is already recognized by Accepted ADR-0040: a successful Vite build, healthy Render process and HTTP 200 response do not prove that the React application bootstraps in a real browser.

The PR #736 validation path demonstrated two concrete control gaps:

1. `src/features/public/ui/LoginPage.tsx` introduced a relative import into `src/app/**`, although the canonical Frontend architecture explicitly prohibits `features -> app` dependencies. The existing architecture validator did not enforce that rule and therefore returned PASS.
2. Hosted validation executed TypeScript, the unit suite, production build, built-asset/CSP response tests and predeploy checks, but did not execute the built client in Chromium. This does not satisfy ADR-0040's existing browser-render evidence requirement.

The incident must therefore be treated as a startup-resilience and validation-drift problem, not as a reason to permanently remove the password-recovery feature.

## Frontend remediation in this branch

- Password-recovery URL ownership is moved to `src/features/public/auth/passwordRecovery.ts`.
- `LoginPage.tsx` consumes its own feature contract and no longer depends on `src/app/**`.
- `src/app/auth/sessionBootstrap.ts` consumes the feature-owned recovery state in the permitted `app -> features` direction while retaining the temporary-recovery-session bootstrap suppression.
- `scripts/automation/validateFrontendArchitecture.ts` now resolves relative imports under `src/features/**` and rejects any dependency into `src/app/**`; shared-layer checks are also resolved against `app`, `features` and legacy `components` targets.
- `tests/unit/passwordRecoveryLogin.test.ts` locks the recovery dependency boundary and recovery-session behavior.
- `scripts/automation/verifyFrontendBrowserBootstrap.ts` provides a dependency-free Chromium/Chrome smoke harness for the built `dist` bundle. It checks desktop root, desktop login and Android/mobile login scenarios and fails when the React root remains empty or only the route-loading fallback settles.

The browser harness is intentionally complementary to `tests/unit/securityResponse.production.test.ts`: the existing production-response test proves CSP/nonce/static-asset behavior, while the Chromium smoke proves executable client bootstrap. Neither substitutes for the other.

## Foreign-owner handoff required by current ownership

The remaining enforcement change belongs to **CAPITAL-AI-OPS**, canonical folder `docs/projects/operations/`, because `PVC-07 — Release Management` and `PVC-08 — Production Operations` are OPS-owned and `.github/workflows/ci.yml` controls the verified main release/deployment chain.

Frontend does **not** modify that workflow in this branch.

OPS handoff requirement, derived from Accepted ADR-0040 rather than a new Frontend policy:

- execute `npx tsx scripts/automation/verifyFrontendBrowserBootstrap.ts` after the real production build for scopes in which the client bundle is built;
- provide a trusted Chromium/Chrome executable (`CHROME_BIN` or an approved runner-provided binary);
- retain the existing `tests/unit/securityResponse.production.test.ts` CSP/nonce/static-delivery gate;
- do not allow the browser smoke to be skipped while still reporting the ADR-0040 browser-render requirement as satisfied;
- preserve exact-SHA main deployment and Human/CODEOWNER merge boundaries.

If the workflow cannot provide a trusted browser runtime, the ADR-0040 browser-render gate remains **open**, not PASS.

## Validation status

Repository-hosted validation has not yet executed for this branch because no Pull Request has been created. Local execution is not claimed from the GitHub connector environment.

Required evidence before merge readiness:

- Frontend architecture validator PASS;
- password-recovery regression tests PASS;
- TypeScript PASS;
- full required unit/test scope PASS;
- production build PASS;
- existing production-response CSP/asset test PASS;
- Chromium bootstrap smoke PASS after OPS-owned workflow wiring;
- final current-main/open-PR correlation PASS;
- Human/CODEOWNER merge decision.

## Roadmap impact

This is bounded incident remediation and enforcement hardening. It does not change product/domain semantics or the planned BB migration sequence. It strengthens the existing FE-PROJ-03 singular-architecture and FE-PROJ-05 evidence-backed UX/runtime quality gates.
