# SEC-WEB-00 — Current Attack-Surface & Control Baseline

**Project:** `CAPITAL-AI-SEC`  
**Program:** `SEC-WEB-HARDENING-01`  
**Phase:** `SEC-WEB-00`  
**Status:** `BASELINE_COMPLETE / EVIDENCE_READY`  
**Priority:** `P0`  
**Baseline:** `main@67f9be45e41d78ca5d5c58f9be860d1887e4afad`  
**Date:** 2026-09-24  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Security role:** requirements, findings, Security tests and independent verification; no productive PVC ownership  
**Live status source:** `docs/architecture/ROADMAP.md`

## 1. Scope and correlation

This baseline re-correlates the public website, browser boundary, API/auth boundary, supply-chain path, runtime/container controls and deployment identity against the exact CURRENT_MAIN above. It supersedes the 2026-09-20 materialization-time observations for current status without rewriting historical evidence.

At correlation time the open writers were PR #1381 (CAPITAL-AI-OPS Self-Healing planning) and PR #1382 (CAPITAL-AI-FE Live-Roadmap UI convergence). Neither writes this Security evidence slice. PR #1382 owns `src/features/public/ui/roadmapSnapshot.ts` and related Roadmap UI tests, so this SEC slice deliberately does not modify those paths.

The immediately preceding main generation `bac6f4224cdb4f570c415c1310a264b3081756e6` was superseded by OPS PR #1380. The eight-commit delta to this baseline changed only OPS Self-Healing classification/documentation paths; it did not modify the website, auth, container, CI deployment or Security-response surfaces assessed below. Exact CURRENT_MAIN Container Security was nevertheless rerun and is used here rather than carrying forward the predecessor digest.

## 2. Current public/browser surface

### Public SPA routes

The current server public-route allowlist contains:

`/`, `/universe`, `/learning-platform`, `/vocabulary`, `/impressum`, `/agb`, `/datenschutz`, `/faq`.

The current application-only SPA routes contain:

`/login`, `/profile`, `/account/update-password`, `/dashboard`, `/media-studio`, `/roadmap`, `/glossar`, `/lexikon`, `/market-vocabulary`, `/dictionary`.

The current React router no longer exposes a productive `/universe` branch while the server/SEO public-route contract still publishes it. This remains an owner-correct FE/SEO/OPS legacy-route finding; Security does not reactivate the removed product surface.

### Browser security controls

Repository controls currently establish:

- `X-Powered-By` disabled;
- HSTS in production;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: SAMEORIGIN`;
- nonce-bearing CSP through the single `server/securityResponse.ts` response boundary;
- enforced baseline CSP with `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'self'`, `form-action`, and `upgrade-insecure-requests`;
- strict nonce/`strict-dynamic` target emitted in report-only mode by default;
- HTML responses forced `no-store` while nonce injection is active.

Current gaps remain: strict CSP is not the production default; no productive `Permissions-Policy`, COOP or CORP header was found; no CSP `report-uri`/`report-to` reporting sink was found; the active response path still emits legacy `X-XSS-Protection`.

## 3. API, input, auth and abuse boundary

Current controls include:

- production CORS permits only canonical CAPITAL-AI origins and rejects disallowed browser origins server-side;
- global CORS methods remain broad: `GET, POST, PUT, DELETE, OPTIONS`;
- the active global allowed-header set is `Content-Type, Authorization, stripe-signature`;
- Stripe webhooks are registered before JSON parsing and use raw-body signature verification;
- a global fixed-window limit of 300 requests/minute/effective client IP covers routes after the webhook boundary;
- effective client identity does not trust arbitrary forwarding headers and only accepts Cloudflare visitor identity after the Cloudflare→Render trust contract passes;
- Render declares one instance, matching the current in-memory limiter assumption;
- backend auth has separate general, credential and mail limits;
- account security has separate account/MFA/passkey/password-reset limits and avatar upload is bounded to one file / 2 MiB;
- backend auth uses PKCE/state verification and HttpOnly backend session cookies; repository tests bind PKCE, state verification and logout/session composition.

Gaps remain: route-specific method/header least privilege is not established globally; several legacy/public body handlers still use broad `express.json()`/free-form request bodies; the complete required OAuth/session negative matrix (wrong-origin, manipulated state, replay/expired callback, stale-tab/session race, logout, entitlement expiry and token-leakage cases) is not evidenced as one complete current gate.

## 4. Runtime/container and public configuration

CURRENT_MAIN declares:

- Render Docker service, Frankfurt, Starter, one instance, native Auto Deploy off and `/healthz` health check;
- pinned Node 24.20.0 Alpine image digest;
- unprivileged builder/dependency stages and final `capitalai` runtime identity;
- backend source map removed in the builder stage;
- build/development tooling removed from final runtime;
- immutable application/dependency roots with bounded writable upload/temp paths;
- direct Node PID 1;
- browser-visible build variables limited in the Dockerfile to explicit `VITE_*` inputs, while server secrets remain server-side Render variables.

A dedicated output gate proving **dist + final container + logs contain no secret-class material and that every browser-visible environment variable is explicitly allowlisted** was not found. Repository Gitleaks and server/client namespace separation are useful controls but do not by themselves satisfy F23.

## 5. Exact CURRENT_MAIN supply-chain evidence

GitHub Actions evidence for CURRENT_MAIN:

- main CI run `35957793425`: PASS — TypeScript, full test suite, production build, CSP/config readiness, Docker and provenance checks; deployment job cadence-skipped, not failed;
- Container Security run `35957793419`: PASS;
- Hardened image / HIGH+CRITICAL CVE job `107499695661`: PASS with actual image build, runtime-surface checks, SBOM generation and HIGH/CRITICAL gate;
- Signed private GHCR / exact digest job `107500154419`: PASS;
- exact source SHA: `67f9be45e41d78ca5d5c58f9be860d1887e4afad`;
- canonical registry reference: `ghcr.io/capital-ai-online/finance@sha256:a793cf5d0259d7a529213cf437a77a8f92940a45bcb85463b77223722be18306`;
- exact private pull by digest: PASS;
- Cosign signature verification: PASS;
- SLSA provenance attestation verification: PASS;
- CycloneDX SBOM attestation verification: PASS;
- immutable GHCR evidence artifact ID: `10790897202`.

This closes the historic F01/F16 digest-semantics mismatch for this exact CURRENT_MAIN generation. The registry digest is the deployment-grade immutable image identity; the workflow no longer treats an OCI archive byte digest as if it must equal the registry manifest digest.

### Remaining F15 gap

`.github/workflows/container-security.yml` prepares an exact Render-compatible GHCR digest reference and intentionally does not deploy it.

`.github/workflows/ci.yml` separately verifies the source/build manifest and then triggers the Render deploy hook with `ref=main`. It subsequently verifies the deployed source commit/health, but Render still performs its own source/Docker build rather than consuming the already scanned/signed GHCR digest above.

Therefore:

`F15 = CONFIRMED_OPEN`.

This is an artifact-chain convergence gap, not a claim that the current live service is unhealthy. The owner-correct implementation return is the already-existing OPS work:

- `OPS-07-A Release Evidence Contract / PVC-07`;
- `OPS-08-A Production Handoff & Recovery / PVC-08`.

Security must not create a second release/deploy architecture.

## 6. F01–F30 CURRENT_MAIN disposition matrix

| Finding | Current disposition | Current evidence | Owner / return | Verification gate |
|---|---|---|---|---|
| F01 | **VERIFIED_CURRENT_MAIN** | Container Security 35957793419; registry digest readback + exact private pull | OPS/PVC-07 evidence consumed by SEC | repeat on candidate generation |
| F02 | **CONFIRMED_OPEN** | production default remains CSP `report-only` | FE + OPS/PVC-08 | protected-flow browser tests + strict production readback |
| F03 | **CONFIRMED_OPEN** | Permissions-Policy/COOP/CORP absent from current response boundary | FE + OPS | exact production header tests |
| F04 | **CONFIRMED_OPEN** | one broad CSP profile; no route-minimal public profile | FE + OPS | route-origin inventory + negative resource-load tests |
| F05 | **CONFIRMED_OPEN** | global methods/headers remain broader than route need | OPS/PVC-02 | per-route method/origin/header DENY matrix |
| F06 | **PARTIAL / VERIFY** | route lazy boundaries exist, but public analysis critical-path isolation not independently proven here | FE | built-browser dependency/critical-path evidence |
| F07 | **BASELINE_MATERIALIZED** | this document binds current public/application route sets and server composition | SEC requirements; OPS/FE return | generated inventory regression + runtime correlation |
| F08 | **PARTIAL / CONFIRMED_GAPS** | auth/account inputs have limits; legacy/free-form body handlers remain | OPS + affected route owner | malformed/oversized/unexpected-field/injection negatives |
| F09 | **NOT_VERIFIED** | no consolidated forbidden DOM/code-execution gate found | FE + SEC verification | forbidden-pattern scan + reviewed exceptions |
| F10 | **PARTIAL / P0_RETURN_OPEN** | PKCE/state/HttpOnly/logout contracts exist; complete negative matrix not evidenced | OPS backend auth + CLIENT/FE dependencies | manipulated-state/origin/replay/expiry/session/logout/token negatives |
| F11 | **REPOSITORY_CONTRACT_PRESENT / RUNTIME_OPEN** | header/CSP code + tests exist | OPS/PVC-08 | external exact-production header readback |
| F12 | **CONFIRMED_CURRENT_MAIN** | `X-XSS-Protection: 1; mode=block` still emitted | FE/OPS | compatibility review; remove/retain only with documented rationale |
| F13 | **PARTIAL** | PR OSS path includes Gitleaks/OSV delta evidence | OPS + COMP | add/verify changed-dependency license + lifecycle disposition |
| F14 | **PARTIAL / STRONG_CONTROL** | pinned Actions and zizmor governance exist | OPS/PVC-02/07 | exact-current workflow audit + justified exceptions |
| F15 | **CONFIRMED_OPEN / P0** | GHCR exact digest is prepared; CI deploys Render `ref=main` source build | OPS-07-A + OPS-08-A | deployed digest equals already scanned/signed digest |
| F16 | **VERIFIED_CURRENT_MAIN** | canonical registry digest `sha256:a793cf5d0259d7a529213cf437a77a8f92940a45bcb85463b77223722be18306` + exact pull | OPS/PVC-07 evidence consumed by SEC | repeat per promoted generation |
| F17 | **PARTIAL** | source SHA, SBOM, provenance, signature and deployment-identity evidence exist but are split across workflow artifacts | OPS/PVC-08 | one correlated deploy envelope incl. deploy ID + digest + hashes |
| F18 | **REPOSITORY_CONTRACT_VERIFIED / RUNTIME_EVENT_OPEN** | `/healthz`, `/healthz/readiness`, `/readyz` separated; deploy verifier present | OPS/PVC-04/08 | exact runtime/fault transition evidence |
| F19 | **CONTRACT_PRESENT / EXECUTION_OPEN** | rollback runbooks require prior verified immutable artifact | OPS/PVC-07/08 | real bounded rollback target evidence with compatibility proof |
| F20 | **CURRENT_TOPOLOGY_BOUNDED** | limiter is process-local; Render declares one instance | OPS/PVC-08 | block scale-out until shared/edge limiter proven |
| F21 | **PARTIAL** | global + auth/account/admin rate limits exist | OPS + affected owners | mutation-specific IP/session/account/capability denial tests |
| F22 | **PARTIAL** | provider-specific budgets/circuits exist on some costly paths | OPS + FINTECH | full public costly-route inventory + budget/concurrency/timeout tests |
| F23 | **CONFIRMED_OPEN / P0-P1** | no dedicated dist/container/log secret-output gate + public-env allowlist found | OPS/PVC-02/07 + SEC verify | exact built-output/container/log scan + explicit public-env allowlist |
| F24 | **PARTIAL / VERIFY** | structured error handling exists; exhaustive disclosure-negative suite not proven | OPS | stack/provider/secret/internal-path negative tests |
| F25 | **PARTIAL** | telemetry/redaction contracts exist | OPS/PVC-18 + SEC | website Security event coverage + secret/PII redaction tests |
| F26 | **CONFIRMED_OPEN** | report-only CSP exists but no `report-uri`/`report-to` sink found | OPS + FE | sampled/deduplicated release-bound CSP violation evidence |
| F27 | **RUNTIME_OPEN** | repository/static gates are not DAST | SEC verify + OPS target | non-invasive hosted scan bound to exact deployed identity |
| F28 | **RUNTIME/PROVIDER_OPEN** | repository config cannot prove current DNS/TLS/subdomain posture | OPS/PVC-08 | TLS/DNSSEC/CAA/dangling-subdomain readback |
| F29 | **OWNER_ROUTE_ONLY / P2** | provider review/CODEOWNER enforcement is Governance-owned | GOV/PVC-05 | provider ruleset readback after authorized decision |
| F30 | **PARTIAL** | many focused Security tests exist; no single consolidated website-security suite proves F02–F29 | owner implementations + SEC/QM verify | consolidated static/unit/integration/container/runtime evidence map |

## 7. SEC-WEB-00 exit

SEC-WEB-00 is **BASELINE_COMPLETE / EVIDENCE_READY** because every P0/P1 finding now has a current disposition, exact owner/return path and explicit verification gate.

This does **not** mean SEC-WEB-HARDENING-01 is complete. The dependency graph advances only to the first unresolved P0 dependency:

1. F01 — verified for CURRENT_MAIN.
2. F16 — verified for CURRENT_MAIN.
3. **F15 — open owner return through OPS-07-A + OPS-08-A.**
4. F23 — held behind F15 in the canonical SEC sequence.
5. F10 — held behind F23.
6. Production/open-writer re-correlation — held until preceding gates return.

No production mutation, provider mutation, credential/IAM change, merge, deploy or foreign-owner implementation is performed by this Security baseline.
