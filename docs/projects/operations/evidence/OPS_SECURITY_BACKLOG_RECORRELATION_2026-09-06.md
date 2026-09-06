# CAPITAL-AI-OPS Security Backlog Re-correlation — 2026-09-06

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Trust root:** `/AGENTS.md`  
**Baseline:** `main@80c30ad2aa469f4552c84f3cc40e997e4ef13ee0`  
**Branch:** `agent/operations-security-backlog-reconcile-v2-20260906`  
**Evidence role:** current-main correlation / non-authorizing

## 1. Correlation result

Current `main` was resolved before this work package and again after the intervening merge of PR #769. `/AGENTS.md`, `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the OPS project README and OPS roadmap were read from the applicable current-main baseline.

At final branch resynchronization:

- current main: `80c30ad2aa469f4552c84f3cc40e997e4ef13ee0`;
- PR #769 changed only `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`, `docs/projects/governance/ROADMAP.md` and `docs/projects/governance/TASK_REGISTER.md` and has no changed-file overlap with this OPS package;
- no current OPS pull-request writer was identified before resynchronization;
- `agent/operations-node-toolchain-24-20-20260906` is stale relative to current main and contains no Node convergence change;
- `agent/operations-qs-cve-20260905` is an older divergent dependency-remediation branch and has no changed-file overlap with this OPS documentation package;
- this package changes only `docs/projects/operations/**`.

## 2. `OPS-02-SEC-05` / S1-R2-05 — Stripe Redirect Boundary

The OPS backlog state `OPEN / REFERRED_NOT_EXECUTED` is stale relative to current repository code.

Current `main` contains:

- `server/middleware/stripeReturnUrlGuard.ts`;
- `server/routes/registerApplicationRoutes.ts` mounting `stripeReturnUrlGuard` before `stripeRouter`;
- `tests/unit/stripeReturnUrlGuard.test.ts`;
- `tests/server/applicationRouteComposition.contract.test.ts`.

The guard:

- accepts only parseable HTTP(S) return URLs;
- rejects credentials embedded in URLs;
- requires HTTPS in Production;
- reuses the existing canonical `isOriginAllowed()` policy instead of creating a second origin allowlist;
- validates Checkout `successUrl` / `cancelUrl` and Billing Portal `returnUrl` before the Stripe router receives them;
- fails closed with HTTP `400` for invalid redirect input.

The focused unit evidence rejects attacker-controlled external origins, look-alike hosts, HTTP in Production, user-info URLs, `javascript:` / `data:` schemes, malformed inputs and relative-only inputs. It also asserts that the middleware is mounted before the existing Stripe router and that no duplicate `capital-ai.online` allowlist is embedded in the guard.

Repository history attributes the implementation to commit `bcefb1b2cdf2ecc56becfa7c5c8fcd6db8cbc43f` (`fix(security): Stripe-Rücksprung-URLs an kanonische Origin-Policy binden`, 2026-08-24).

**OPS disposition:** `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`.  
**Security disposition:** unchanged; independent `CAPITAL-AI-SEC` open-redirect verification remains required. OPS does not claim `VERIFIED` or `CLOSED`.

External advisory check: the OWASP Unvalidated Redirects and Forwards guidance recommends avoiding user-controlled redirect destinations where possible and otherwise validating supplied destinations against trusted targets/allowlists. The current repository guard follows that server-side validation pattern. External guidance is advisory only and does not create repository authority.

## 3. `OPS-06-SEC-03` / S1-R2-03 — Node Control-Plane Convergence

Current repository projections conflict:

- current `.nvmrc` remains `24.18.0`;
- OPS/Security roadmap material requests convergence to Node `24.20.0`;
- `scripts/security/applyNodeToolchainSupersession.mjs` contains a deterministic `24.18.0 -> 24.20.0` transformer;
- `docs/governance/control-plane/NODE_TOOLCHAIN_WRITE_BOUNDARY_SUPERSESSION_2026-08-29.md` remains `PROPOSED / IMPLEMENTATION IN BRANCH`;
- `docs/adr/ADR-0053-node24-lts-git255-toolchain.md` remains `Status: Accepted` and explicitly selects Node `24.18.0` for Production, CI and local development.

No accepted ADR under `docs/adr/**` was found that supersedes the Node `24.18.0` decision with `24.20.0`.

Node upstream currently lists `24.20.0` as the Node 24 LTS release, but external release status is advisory and cannot override an accepted repository ADR.

Under the current trust-root precedence model, the lower-precedence roadmap request must not silently override the Accepted ADR. Direct Node mutation therefore stops at the authority boundary.

**OPS disposition:** `BLOCKED_BY_AUTHORITY_CONFLICT`.  
**Required return:** `CAPITAL-AI-GOV` must resolve the Node baseline through an applicable accepted authority/supersession before OPS can execute the deterministic convergence package. OPS does not edit the foreign Governance/ADR authority in this branch.

## 4. Priority impact

The current OPS execution projection must no longer describe:

- `OPS-02-SEC-05` as an unimplemented remediation; or
- `OPS-06-SEC-03` as the highest executable implementation while the Accepted-ADR conflict exists.

After this correlation:

1. `OPS-02-SEC-06` remains parent `EVIDENCE_READY`; foreign child remediation and Security verification remain external/open.
2. `OPS-06-SEC-03` remains P1/HIGH but is non-executable until Governance resolves the authority conflict.
3. `OPS-02-SEC-05` is `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`; only independent Security verification remains.
4. The next OPS-owned Security work that can be correlated without crossing an authority boundary is `OPS-08-SEC-07` recovery/RPO/RTO evidence and implementation planning; any provider/Production mutation remains separately gated.

## 5. Validation truth

Executed for this correlation:

- exact current-main SHA readback and resynchronization after PR #769;
- exact current `/AGENTS.md` readback;
- current project/PVC ownership readback;
- open-PR/read-only writer correlation before branch work and changed-file correlation for intervening PR #769;
- current Stripe guard/router/test source inspection;
- current Node `.nvmrc`, Accepted ADR-0053, proposed supersession and deterministic transformer inspection;
- authoritative external advisory checks for OWASP redirect guidance and Node 24 LTS release status.

Not run / not claimed:

- repository unit tests;
- build;
- hosted CI;
- Stripe provider/Test Clock E2E;
- Production redirect behavior;
- Node `24.20.0` execution or runtime verification;
- CAPITAL-AI-SEC independent verification.

No not-run check is represented as PASS.
