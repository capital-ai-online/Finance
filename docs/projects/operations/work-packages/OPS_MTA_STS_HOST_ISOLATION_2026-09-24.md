# OPS-MTA-STS-HOST-ISOLATION-01

**Status:** IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING  
**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-08 — Production Operations  
**Security relationship:** cross-cutting mail-security boundary  
**Branch:** `agent/operations-mta-sts-host-isolation-20260924`  
**CURRENT_MAIN baseline:** `be33bde31d9e96d8cb306086428f90036350d8ea`

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
