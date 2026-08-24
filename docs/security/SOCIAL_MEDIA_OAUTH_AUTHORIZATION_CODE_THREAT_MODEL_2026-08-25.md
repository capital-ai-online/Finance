# Social Media OAuth Authorization Code Threat Model

**Document role:** Security specification / evidence projection (non-authorizing)  
**Status:** REVIEWED — implementation correlation  
**Date:** 2026-08-25  
**Scope:** `server/socialMedia/*`, `/api/social-media/auth/*`, `social_media_oauth_states`  
**Authorities:** ADR-0026, ADR-0027, ADR-0096, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Security controls:** `CTRL-SEC-SECRET-001`, `CTRL-SEC-LEASTPRIV-001`  
**Current M10 state:** `SUSPENDED / OFF` — this threat model does not reactivate or modify M10.

## 1. Purpose

This document models the real OAuth 2.0 Authorization Code flows used by CAPITAL-AI to connect YouTube, TikTok, Instagram, Facebook and X accounts. It records the trust boundaries, protected assets, implemented mitigations and residual risks for the current repository implementation. It creates no new authorization, production-mutation or deployment authority.

Primary security guidance used for the review:

- OAuth 2.0 Security Best Current Practice, RFC 9700 / BCP 240;
- Proof Key for Code Exchange, RFC 7636;
- OAuth 2.0 Bearer Token Usage, RFC 6750;
- OWASP OAuth 2.0 security guidance.

## 2. Trust boundaries

```text
Authenticated CAPITAL-AI browser
        |
        | GET /api/social-media/auth/url?platform=...
        v
CAPITAL-AI application server
        |
        | server-generated state + optional PKCE S256
        | exact allowlisted redirect_uri
        v
External OAuth authorization server
        |
        | authorization code + opaque state
        v
CAPITAL-AI /api/social-media/auth/callback
        |
        | atomic state consume + entitlement re-check
        | code exchange
        v
External token/resource APIs
        |
        | access/refresh/page token
        v
Server-side encrypted token storage / connected account state
```

Untrusted boundaries include request Host and forwarded headers, browser query parameters, authorization codes, state values returned over the browser redirect, all external provider responses and provider-supplied profile identifiers.

## 3. Protected assets

- OAuth authorization codes;
- `state_token` values and their user/platform binding;
- PKCE `code_verifier` values;
- OAuth client secrets;
- access, refresh and Meta Page access tokens;
- connected-account identity and entitlement binding;
- exact callback URI;
- single-use/expiry state in `social_media_oauth_states`;
- provider scopes and fixed authorization/token endpoints.

## 4. Threats and mitigations

| Threat | Attack path | Current mitigation | Verification / evidence | Residual state |
|---|---|---|---|---|
| OAuth CSRF / state fixation | attacker starts or substitutes a callback transaction | 24-byte random server state; persisted user/platform binding; callback accepts only a persisted state | `oauthExchange.ts`, `socialMediaOauthSecurity.test.ts` | Controlled |
| State replay | reuse a valid callback state | atomic `used_at` transition conditioned on `used_at IS NULL` | `consumeOAuthState()` + regression test | Controlled |
| Expired transaction reuse | delayed callback after consent window | `expires_at > now` required during atomic consume; 10-minute TTL | `consumeOAuthState()` + regression test | Controlled |
| Authorization-code injection/interception | substitute or intercept authorization code | exact persisted redirect binding; X uses RFC 7636 S256 PKCE with 256-bit verifier | `pkce.ts`, regression tests | Provider-dependent residual: PKCE is currently mandatory only where configured/supported |
| Host-header / redirect manipulation | malicious Host/X-Forwarded value changes generated callback | callback URI is canonicalized and checked against explicit production origins before state persistence or authorization URL construction | `oauthSecurity.ts`, negative tests | Controlled |
| Open redirect / callback path substitution | alter callback path/query/fragment/userinfo | exact callback path; query, fragment and userinfo rejected by redirect policy | `oauthSecurity.ts`, negative tests | Controlled |
| Bearer-token disclosure via URL | resource token appears in proxy/browser/server URL logs | Meta resource calls use `Authorization: Bearer` headers; YouTube/TikTok/X already used Bearer headers | `oauthExchange.ts`, source regression test | Controlled for resource APIs |
| Provider-response secret leakage | raw token/error response included in application error/log/UI | token-exchange failures expose only provider + HTTP status; raw provider JSON is not interpolated into thrown errors | `oauthExchange.ts`, source regression test | Controlled; provider profile exceptions remain generic application logs |
| OAuth mix-up / wrong provider binding | callback code is redeemed at a different provider | state row persists platform; provider endpoints are static repository configuration; callback derives provider from consumed state, not callback input | `oauthExchange.ts`, `oauthProviders.ts` | Residual: issuer-response binding should be adopted where provider protocols expose a compatible issuer signal |
| Stale authorization / entitlement drift | user loses Founder/Owner access between start and callback | ADR-0027 access is re-evaluated after state consumption and before token persistence | `completeOAuthCallback()` | Controlled |
| Token theft at rest | database compromise exposes provider tokens | token storage uses the existing encrypted server-side token-store contract; reusable secrets remain outside repository evidence | ADR-0026 / `tokenStore.ts` | Key-management risk remains governed by existing secret controls |
| Excessive OAuth scope | unnecessary external privileges | fixed per-provider scope lists in server-only provider configuration | `oauthProviders.ts` | Review scopes when provider products or publishing capabilities change |
| Dynamic endpoint injection / SSRF | attacker chooses authorization/token/resource endpoint | provider authorization/token endpoints are static code configuration; platform must match supported platform set | `oauthProviders.ts`, route validation | Controlled |
| Callback transaction amplification | repeated auth-start requests | existing per-IP OAuth rate limit plus state TTL/single-use handling | `socialMediaRoutes.ts`, state lifecycle | Controlled within existing rate-limit policy |

## 5. Security invariants

The following conditions are merge-critical for this OAuth path:

1. production redirect origins remain explicit HTTPS allowlist entries;
2. the callback path remains exactly `/api/social-media/auth/callback`;
3. state consumption remains atomic, single-use and expiry-bound;
4. the provider is taken from persisted state rather than callback-controlled input;
5. PKCE remains S256 for every provider whose current contract requires or enables the configured PKCE path;
6. resource access tokens are not placed in request URLs;
7. raw provider token responses are not returned to the browser or copied into application error strings;
8. access is re-checked immediately before a connected account can be persisted;
9. OAuth client secrets remain server-side and follow the `finance-secrets.env` secret inventory;
10. no OAuth implementation or evidence can authorize CI, merge, deployment, billing or external production mutation.

## 6. Negative-test mapping

`tests/unit/socialMediaOauthSecurity.test.ts` covers at least:

- unknown production origin denied;
- HTTP production callback denied;
- localhost allowed only outside production;
- wrong callback path denied;
- query, fragment and URI userinfo denied;
- PKCE verifier entropy/encoding and deterministic S256 challenge;
- one-time and expiry predicates retained in OAuth state consumption;
- persisted redirect uses the canonicalized URI;
- Meta resource access-token query parameters do not regress;
- raw provider JSON is not interpolated into token-exchange errors;
- active OAuth implementation files reference current ADR-0026/ADR-0027 identities rather than the historical pre-renumbering social-media labels.

These tests are technical evidence only. They do not create authorization and must still pass through the repository's normal PR CI after PR creation.

## 7. Residual risks / follow-up boundaries

### PKCE coverage beyond X

RFC 9700 recommends PKCE as a strong authorization-code injection defense, including for confidential clients. The current provider matrix enables PKCE for X because that provider contract requires it. Expanding PKCE to other social providers must be compatibility-tested against each provider's current authorization/token contract before activation; this PR does not guess support or alter provider behavior without that evidence.

### Sender-constrained tokens / DPoP

Sender-constrained access tokens can further reduce replay value after token theft, but support is provider-specific. DPoP or equivalent mechanisms are therefore a future provider-capability evaluation, not a locally invented compatibility layer.

### Meta token endpoint transport

Meta's existing server-to-server token exchange remains on the provider-specific endpoint contract already used by ADR-0026. The security correction in this work package specifically removes bearer access tokens from **resource API URLs**, where URL logging and propagation create unnecessary disclosure risk. Full token-endpoint transport changes require provider-contract verification before modification.

### Meta Page selection

The current implementation selects the first managed Meta Page returned by the provider. This is an existing ADR-0026 product/UX follow-up and not an authentication bypass. A future explicit Page-selection flow must preserve the same user, provider, state and token-binding invariants.

## 8. Governance correlation

- ADR-0026 remains the active Social Media Direct Publishing integration decision; this document does not modify that ADR.
- ADR-0027 remains the access-restriction authority for the callback entitlement re-check.
- ADR-0096 remains the Governance Control Plane authority; this threat model is non-authorizing evidence/specification.
- `docs/architecture/ROADMAP.md` remains the current DevelopmentChain status index.
- M10 `AUTHORIZE_PR_CI` remains `SUSPENDED / OFF` and is outside this OAuth runtime scope.
- Render native Auto Deploy remains off; repository changes do not imply any Render/Supabase/provider-console credential mutation.

## 9. Rollback

This work package is repository-only. If the new redirect guard causes a verified provider compatibility regression, rollback uses a fresh branch from then-current `main` and a normal Human-reviewed revert PR. No external OAuth application registration, secret, Render, Supabase or provider-console setting is mutated by this change.
