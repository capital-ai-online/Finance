# OPS-MTA-STS-HOST-ISOLATION-01

**Status:** IMPLEMENTED_ON_MAIN / RUNTIME_DEPLOYMENT_PENDING  
**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-08 — Production Operations  
**Security relationship:** cross-cutting mail-security boundary  
**Branch:** `agent/operations-mta-sts-host-isolation-20260924`  
**CURRENT_MAIN baseline:** `332861e4ae19f80c3bdc15dccf3733cdc52c265f`

## Observed state

`mta-sts.capital-ai.online` intentionally resolves to the existing Render `Finance` service. The RFC 8461 policy route already exists at `/.well-known/mta-sts.txt`, but requests to `/` fall through to the normal SPA. A human browser therefore receives the website shell and CookieConsent/Google Analytics controls on a host whose only purpose is the MTA-STS policy document.

The disabled “Notwendige Funktionen” consent control is expected behavior for the normal website, but the consent surface itself is not required on the dedicated MTA-STS hostname.

## Intended delta

Install one hostname guard before auth, SEO normalization, static assets and SPA fallback:

- `mta-sts.capital-ai.online/.well-known/mta-sts.txt`: allow GET/HEAD to continue to the existing policy router;
- the same policy path with other methods: `405 Method Not Allowed`;
- every other path on `mta-sts.capital-ai.online`: plaintext `404 Not Found`;
- all other hosts: unchanged application routing.

No DNS, Render configuration, CookieConsent logic, GA4 consent logic, credential, IAM or deployment setting is changed.

## Acceptance criteria / exit evidence

1. Focused MTA-STS tests prove host isolation and normal-host non-regression.
2. The existing policy bytes, content type and no-store behavior remain unchanged.
3. Open writer/file/semantic overlap is absent at PR creation.
4. Required exact-head Governance, build/test, GitGuardian and container/security evidence is truthful and successful before merge.
5. Human/CODEOWNER merge is required; direct self-merge is prohibited.


## Post-merge validation

- PR: `#1408`
- Exact PR head: `97885eefc4631822e2cfb6d422a437ef75d28809`
- Merge commit: `cc8398e40019459653403272749f3c6fc756f1aa`
- Fresh CURRENT_MAIN readback: `332861e4ae19f80c3bdc15dccf3733cdc52c265f`
- Merge ancestry: PASS — the #1408 merge commit is an ancestor of CURRENT_MAIN.
- Exact-head CI: PASS — Governance, Project Directive, Container Security and CI completed successfully.
- Focused MTA-STS test: PASS — `tests/unit/mtaStsPolicy.test.ts` executed 3/3 tests successfully inside the successful full suite.
- Open-writer overlap after merge: none for the MTA-STS route/composition/test/evidence files.
- Render Production observed during this validation: `fb62cf1f9313d6f3d34db60cc0561d60cd0a7c74`.
- Runtime deployment state: PENDING — the currently live Render commit predates PR #1408, so production behavior is not yet claimed as converged.
- Direct live HTTP verification from the agent tool environment was unavailable because the execution environment could not resolve the custom hostname. This is recorded as a tooling limitation, not as a production failure.

Repository implementation exit evidence is satisfied. Final runtime verification remains bound to the canonical GitHub→Render deployment/cadence path and must read back the deployed commit plus the public MTA-STS behavior after deployment.
