# ADR-0040 — CSP Runtime Remediation and Safe Strict-Policy Rollout

## Owner-Änderung 2026-09-15 — FE-CONSENT-V3 / Variante A

**Freigabe:** „Variante A freigegeben“ im zugehörigen Owner-Chat. **Aktivierung:** erst nach Human Merge und separat autorisierter Production-Promotion; Branch-Evidence ist keine Production Acceptance.

Dieser begrenzte Änderungszusatz ersetzt mit Aktivierung ausschließlich die unten beschriebenen CookieHub-Providerbindungen und die AdSense-Ladefreigabe: Selbst gehostetes CookieConsent v3.1.0 wird Consent Source of Truth; Google Analytics bleibt im Basic Mode hinter einem gültigen Analytics-Opt-in. AdSense bleibt vollständig pausiert und alle Werbesignale bleiben `denied`, auch nach „Alle akzeptieren“. Historische CookieHub-Zustimmungen werden nicht übernommen.

Die bisher genannten CookieHub-SDK-/Initializer-/CSP-/Event-Invarianten sind danach historische Providerbindungen. An ihre Stelle treten gepinnte lokale SDK/CSS/License-Dateien, `public/cookieconsent-init.js`, `CookieConsent.validConsent()` plus `acceptedCategory('analytics')` und die auf `window` registrierten Events `cc:onConsent` / `cc:onChange`. Der gespeicherte Widerruf deaktiviert GA, löscht erreichbare GA-Cookies und lädt nach vorheriger GA-Ausführung einmal neu. Die alleinige First-Party-Bridge bleibt `public/google-analytics-consent.js`.

Keine globale Supersession: Zero Google network before opt-in, Basic Consent Mode v2, CSP-Nonce/Report-Only-Grenze, geschützte Pfade/Schutzprüfungen, IAM, Human-/CODEOWNER-Review, Produktionsfreigaben und unabhängige SEC/COMP-Assurance gelten weiter. Neue Consent-Assets werden zusätzlich geschützt. Alte Audit-Evidence wird nicht umgeschrieben. Ein zentraler anonymer Consent-Log-Dienst wird nicht behauptet; Bewertung des lokalen Nachweises bleibt ein COMP-Handoff. AMP-/SEO-Verhalten wird durch diesen Zusatz nicht erweitert.

Umsetzung und Nachweis: `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` und `docs/projects/frontend/evidence/COOKIECONSENT_V3_MIGRATION_2026-09-15.md`.

---


- **Status:** Accepted
- **Implementation status:** In progress / remediation
- **Date:** 2026-08-04
- **Version:** 0.6.0
- **Owner:** Platform Director / Security & Compliance
- **Related:** ADR-0035, ESS-0014, ADR-0009, ADR-0012, ADR-0036
- **Protected change:** Yes

## Context

After deployment of the ADR-0035 per-response nonce implementation, `capital-ai.online` could return a successful HTML response while the browser displayed only the dark application background. Render build and process startup were healthy, the custom domains and TLS certificate were verified, and the production service returned successful HTTP responses. The failure pattern was therefore consistent with a browser bootstrap failure rather than DNS or process unavailability.

ADR-0035 introduced all of the following at once:

- a nonce placeholder on every authorized script element;
- a cryptographically random nonce per response;
- `strict-dynamic` as an immediately enforced production policy;
- response-method interception for HTML nonce replacement;
- removal of HTML conditional-cache headers;
- AMP Auto Ads hooks inside the normal React/Vite SPA.

The accompanying unit test used a synthetic response object and a hand-written HTML string. It did not exercise the real chain:

```text
Vite production build
  -> dist/index.html
  -> Express static delivery / SPA fallback
  -> nonce body transformation
  -> CSP headers
  -> /assets/index-*.js availability
  -> browser application bootstrap
```

The governance guard verified that required strings existed in source files, but did not prove that the built application bundle remained executable. This created a governance inversion: the repository protected the presence of an implementation more strongly than its production behavior.

ADR-0035 already stated that its implementation remained in progress until production evidence existed. This ADR preserves the security intent while correcting the rollout and validation model.

## Decision

### 1. Three explicit production CSP modes

The server supports one of three values through the optional server-side environment variable `CSP_MODE`:

```text
baseline
report-only
strict
```

An unknown or missing value fails safely to `report-only`.

#### `baseline`

- Enforce an availability-safe production CSP.
- Explicitly allow the first-party Vite/React bundle through `script-src 'self'`.
- Keep object execution disabled and base-tag injection blocked.
- Keep CookieHub, Google Tag Manager, the AdSense loader and Stripe script origins explicitly constrained.
- Do not emit the strict report-only policy.

This mode is the emergency recovery state.

#### `report-only` — production default

- Enforce the same availability-safe baseline policy.
- Emit the ADR-0035 nonce + `strict-dynamic` target through `Content-Security-Policy-Report-Only`.
- Inject the same cryptographic nonce into the HTML and both policy variants.
- Preserve `Cache-Control: no-store` for HTML.

This mode restores application availability while collecting browser evidence for strict promotion.

#### `strict`

- Enforce the ADR-0035 nonce + `strict-dynamic` target policy.
- Do not emit a parallel report-only header.
- Permit promotion only after the gate below is satisfied.

### 2. Report-Only Promotion Gate

`CSP_MODE=strict` must not be enabled in production until all of the following evidence exists against the actual production candidate:

1. `GET /` returns `200`, never a nonce-mismatched `304` HTML response.
2. The built HTML contains no `__CSP_NONCE__` placeholder.
3. All authorized script elements carry the same nonce as the strict CSP header.
4. The generated `/assets/index-*.js` entry asset returns `200` with a JavaScript content type.
5. The React root renders visible content in Chromium desktop and Android/mobile viewport tests.
6. No `securitypolicyviolation` blocks a first-party application asset.
7. CookieHub renders and remains the consent source of truth.
8. Analytics remains consent-gated.
9. AdSense behavior is tested separately from core application availability.
10. Production evidence and rollback readiness are attached to the protected change.

A green TypeScript compile or Vite build alone is insufficient promotion evidence.

### 3. First-party application availability is a protected invariant

The following invariant is added alongside the existing marketing/security invariants:

> A Google Marketing or CSP change must never prevent the first-party CAPITAL-AI application bundle from bootstrapping without an explicit, tested maintenance response.

The governance guard must therefore verify both security controls and the built delivery path.

### 4. AMP Auto Ads are removed from the non-AMP SPA

ESS-0014 states that AMP Auto Ads are valid only on a separately validated AMP document. The ordinary React/Vite `index.html` is not an AMP document.

Therefore:

- the AMP extension script is removed from the SPA shell;
- the `<amp-auto-ads>` element is removed from the SPA body;
- the normal AdSense loader remains;
- any future AMP page requires a dedicated route/document, AMP validation and separate evidence.

The protected-change guard is inverted accordingly: it now rejects reintroduction of `amp-auto-ads` into the normal SPA.

### 5. Production-path integration test becomes mandatory

The Google Marketing protected workflow must build the real production bundle and then execute a test using:

```text
requestContext
  -> express.static(dist)
  -> real dist/index.html
  -> CSP/nonce transformation
  -> real /assets/*.js request
```

The test must verify:

- enforced baseline versus strict report-only headers;
- nonce equality between report-only policy and generated HTML;
- absence of the placeholder;
- no-store HTML behavior;
- no conditional `304` response for HTML;
- successful retrieval of the built Vite JavaScript asset.

### 6. CSP authority and legacy server entry point

`server/securityResponse.ts` remains the authoritative CSP response boundary during this remediation. It normalizes the enforced and report-only CSP headers so the older setter in `server.ts` cannot silently replace the selected policy.

This is a transitional compatibility decision, not the desired final composition. The repository currently has an active runtime-remediation writer on `server.ts`; this PR deliberately avoids taking over that file.

During the next coordinated server-composition reconciliation:

- remove the legacy CSP construction from `server.ts`;
- mount one explicit CSP/HTML delivery component;
- avoid maintaining two independently editable policy definitions;
- retain ADR-0040 modes and promotion evidence.

That follow-up must be performed only after the active `server.ts` writer scope is merged, closed or explicitly superseded.

### 7. Workflow supply-chain hardening

Any modified protected-marketing workflow must:

- use explicit minimum permissions;
- use immutable full commit SHAs for third-party Actions;
- set `persist-credentials: false` on checkout;
- retain concurrency cancellation;
- build before the production-path integration test.

## Security consequences

### Positive

- A nonce or strict-policy regression no longer blanks the application by default.
- The strict policy remains measurable and promotable rather than being removed.
- The first-party bundle has an explicit availability contract.
- AMP and non-AMP responsibilities are corrected.
- The real Vite/Express delivery chain becomes test evidence.
- CSP mode is visible through a non-secret response header.

### Trade-offs

- `report-only` temporarily enforces a less restrictive script policy than the ADR-0035 target.
- The baseline retains the documented `unsafe-eval` provider-compatibility trade-off.
- The existing HTML response transformation remains until the server composition is reconciled.
- Browser report-only evidence is useful only when operational collection/inspection is performed.

## Privacy and consent impact

This ADR does not authorize analytics or advertising before consent. CookieHub remains the consent source of truth, and the existing first-party consent bridge remains protected.

Removing invalid AMP hooks does not remove normal AdSense integration. It prevents a non-AMP document from pretending to support AMP Auto Ads.

## Production handoff

Merging this PR requires human/CODEOWNER review because it changes a protected CSP invariant.

No Render environment mutation is required to restore the default behavior: missing `CSP_MODE` resolves to `report-only` in code.

Future production changes follow this sequence:

```text
report-only
  -> collect and review production evidence
  -> strict candidate test
  -> explicit protected-change approval
  -> set CSP_MODE=strict
  -> post-deploy verification
```

Emergency rollback sequence:

```text
strict
  -> CSP_MODE=report-only
  -> if required CSP_MODE=baseline
  -> preserve logs/evidence
  -> remediate through a reviewed PR
```

Environment changes on Render remain a production handoff task and must not be silently performed by development automation.

## Validation / Definition of Done

This ADR is complete only when:

- unit tests cover all CSP modes and invalid-value fallback;
- the production-path test passes after a real Vite build;
- the protected invariant guard rejects AMP hooks in the SPA;
- workflow action references are immutable;
- the Draft PR records production baseline and risk evidence;
- human/CODEOWNER approval is obtained;
- the deployed application visibly boots on `capital-ai.online`;
- strict mode remains disabled until the Report-Only Promotion Gate is satisfied.

## Rollback governance

A rollback that removes nonce, consent, audit or strict-policy promotion controls is still a protected change under ADR-0035 and ESS-0014.

Switching from `strict` to `report-only` or `baseline` during an availability incident is an approved recovery mechanism defined by this ADR, but it must be logged, evidenced and followed by remediation. It is not permission to permanently abandon the strict target.

