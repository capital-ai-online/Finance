# Architectural Decision Record (ADR-0035)
## Protected Google Marketing Integration, Strict CSP & OWNER-delegated Service Accounts

**Status:** ACCEPTED  
**Implementation-Status:** 🟡 IN PROGRESS  
**Date:** 2026-08-03  
**Version:** 0.6.0  
**Related ESS:** ESS-0014 / ESS-0014-CONTRACTS  
**Related ADR:** ADR-0003.5, ADR-0008, ADR-0009, ADR-0012, ADR-0030  

---

## Kontext

CAPITAL-AI bindet CookieHub, Google Analytics und Google AdSense in die Browser-Runtime ein. Der CookieHub-Banner war zuvor ausgefallen, weil die CSP Inline-JavaScript blockierte, während `window.cookiehub.load(...)` inline in `index.html` ausgeführt wurde. Der Fix externalisierte die Initialisierung nach `public/cookiehub-init.js`, wodurch die bestehende `script-src 'self'`-Policy wieder mit der Consent-Runtime kompatibel wurde.

Mit der zusätzlichen AdSense-Integration entsteht ein weiterer Architekturkonflikt: Google unterstützt AdSense unter CSP ausschließlich mit einer Strict-CSP-Strategie, da sich die intern genutzten AdSense-Domains ändern können. Gleichzeitig benötigt CookieHub explizite Script-/Style-/Connect-Ziele.

Zusätzlich muss verhindert werden, dass ein späterer Agent, Refactor, Drift-Reconciler oder automatisierter Rollback diesen funktionierenden Consent-/Security-Zustand stillschweigend zurückbaut.

---

## Entscheidung

### 1. Protected Marketing Invariants

CookieHub, Consent-Gates, AdSense-/Analytics-Integrationspunkte, Strict CSP, Credential Boundaries sowie IAM-/Approval-Gates werden als geschützte Integrationsinvarianten behandelt.

Ein Rückbau ist nur nach einem expliziten Protected-Change-Prozess zulässig.

### 2. Mandatory Impact Confirmation

Vor jedem Rückbau muss ein interaktiver Agent stoppen und die konkreten Auswirkungen erläutern. Die Bestätigung muss sich auf den beschriebenen Diff beziehen.

Mindestens zu benennen:

- Privacy/Consent;
- Analytics/Messung;
- AdSense/Monetarisierung;
- CSP/XSS-Sicherheit;
- Compliance/Audit/Traceability;
- Runtime/SEO/AMP;
- betroffene Ressourcen/Fingerprints.

### 3. Human Authorization

Direkte protected changes dürfen nur von einem verifizierten Human User mit:

```text
profiles.iam_role == owner
AND fresh TOTP step-up
AND explicit impact confirmation
AND dry-run diff
```

ausgeführt werden.

`admin`, `supervisor`, `user` und Subscription-Tiers erhalten keine implizite Berechtigung.

### 4. Service Accounts

Service Accounts werden nicht als zusätzliche Human-IAM-Rolle modelliert. Sie erhalten eine separate Capability Registry.

Nur Human OWNER + frischer TOTP Step-up darf Capabilities vergeben, ändern, verlängern oder widerrufen.

Ein Service Account darf seine eigenen Rechte weder erweitern noch delegieren.

Für Rollbacks gilt zusätzlich:

```text
active google.marketing.rollback capability
AND one-time job-specific OWNER approval artifact
```

Ein dauerhafter Rollback-Grant allein ist nicht ausreichend.

### 5. Strict CSP

Production HTML erhält einen kryptographisch zufälligen Nonce pro Response. Derselbe Request-Nonce wird:

- in den CSP Header;
- in alle autorisierten `<script>`-Tags der HTML-Antwort

injiziert.

AdSense-kompatibler Kern gemäß Google-Dokumentation:

```text
object-src 'none';
base-uri 'none';
script-src 'nonce-{REQUEST_NONCE}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:;
```

Die Entscheidung übernimmt `unsafe-eval` ausschließlich als dokumentierten AdSense-Kompatibilitäts-Trade-off. Die Vertrauenswurzel bleibt der zufällige Nonce + `strict-dynamic`; ein statischer oder global wiederverwendeter Nonce ist verboten.

### 6. CookieHub CSP

CookieHub erhält mindestens die aktuell dokumentierten Ziele:

```text
script-src: cookiehub.net cdn.cookiehub.eu
style-src: cookiehub.net cdn.cookiehub.eu
connect-src: ds.cookiehub.net consent.cookiehub.net region-eu.cookiehub.net consent-eu.cookiehub.net cookiehub.net cdn.cookiehub.eu
```

### 7. AMP Auto Ads

Die angeforderten `amp-auto-ads` Snippets werden im Markup hinterlegt. Sie gelten jedoch **nicht** als bestätigte AMP-Implementierung, solange das Dokument keine valide AMP-Dokumentstruktur besitzt.

Für die aktuelle React/Vite-SPA bleibt die normale AdSense-Integration der aktive Nicht-AMP-Pfad. Eine echte AMP-Auslieferung benötigt eine separate AMP-Route/-Dokumentvariante und Validierung.

### 8. Google Marketing MCP Separation

ESS-0014 ist die normative Architektur.

Claude wird ausschließlich als Implementierungs-/MCP-Host-Profil behandelt. Das gesonderte Dokument `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md` beschreibt die technische Umsetzung für Claude, ohne die ESS-Autorität zu ersetzen.

Offizielle read-only MCPs (Google Analytics, Google Ads) bilden die Read/Evidence Plane. Mutationen erfolgen nur über explizite CAPITAL-AI Google-API-Adapter hinter IAM, Policy, Approval und Audit.

---

## Begründung

### Warum kein einfacher Domain-Whitelist-Fix für AdSense?

Google weist darauf hin, dass die von AdSense genutzten Domains wechseln können und unterstützt deshalb Strict CSP mit Nonce. Eine statische Allowlist wäre driftanfällig und könnte Anzeigen später erneut still blockieren.

### Warum keine `owner`-Rolle für Service Accounts?

Human Identity und Machine Identity haben unterschiedliche Lebenszyklen, Credentials und Kontrollanforderungen. Eine Maschinenidentität als Human OWNER würde Auditbarkeit und Least Privilege untergraben.

### Warum one-time OWNER approval zusätzlich zum Service-Account-Grant?

Ein stehender Rollback-Grant darf nicht zu einem dauerhaft autonomen Rückbaupfad werden. Das einmalige Approval bindet den Rückbau an einen konkreten Diff, Impact und Zeitpunkt.

---

## Konsequenzen

### Positive Konsequenzen

- CookieHub-Fix kann nicht normativ still zurückgebaut werden;
- AdSense erhält eine provider-kompatible CSP-Strategie;
- Human-/Machine-Identity bleiben getrennt;
- Claude und andere Agents bleiben außerhalb der Trust Root;
- Rollbacks werden nachvollziehbar und impact-basiert;
- Google-MCP-Read-Plane kann sicher mit API-Write-Plane kombiniert werden.

### Trade-offs

- HTML muss in Produktion dynamisch ausgeliefert werden, damit ein neuer Nonce pro Response eingesetzt werden kann;
- rein statisches `sendFile(index.html)` reicht dafür nicht mehr aus;
- `unsafe-eval` bleibt als von AdSense dokumentierter Kompatibilitäts-Trade-off Bestandteil der Script Policy und muss bei Provider-Änderungen erneut bewertet werden;
- echte Service-Account-Delegation benötigt eine Capability Registry und Persistenzschicht;
- AMP Auto Ads benötigen für Wirksamkeit eine separate valide AMP-Auslieferung.

---

## Geschützte Dateien / Ressourcen (Initial Scope)

```text
index.html
public/cookiehub-init.js
public/google-analytics-consent.js
server.ts (CSP/HTML delivery)
.ai/skills/ESS-0014-*
docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md
CookieHub production configuration
Google Analytics production property/data stream
Google Tag Manager production container/version
Google AdSense publisher/site configuration
Google Ads production resources
```

---

## Rollback Procedure

Ein zulässiger Rückbau benötigt:

1. Change Classification `protected=true`;
2. Impact Disclosure;
3. explizite Bestätigung;
4. OWNER + Step-up ODER Service Account + exact capability + one-time OWNER Approval;
5. Dry-run;
6. Fingerprint Check;
7. Backup/Evidence;
8. Apply;
9. Post-change Verification;
10. Audit/Traceability Update.

Ein `git revert`, automatisierter Reconciler oder AI-Refactor ist kein Bypass.

---

## Verifikation / Definition of Done

ADR-0035 darf erst nach `docs/adr/resolved/` verschoben werden, wenn mindestens folgende Evidence vorliegt:

- production response zeigt pro Request unterschiedlichen CSP Nonce;
- alle relevanten Script-Tags tragen denselben Request Nonce;
- CookieHub Banner funktioniert ohne CSP Violation;
- AdSense Smoke Test läuft ohne CSP-bedingten Block;
- Analytics bleibt consent-gated;
- protected rollback endpoint/tool erzwingt OWNER/Step-up;
- Service-Account Grants sind OWNER-only verwaltbar;
- Rollback benötigt one-time OWNER approval;
- CI/Tests decken die Denial Matrix ab;
- Production Evidence ist dokumentiert.

Bis dahin bleibt `Implementation-Status: 🟡 IN PROGRESS`.

---

## Provider References (Stand 2026-08-03)

- Google AdSense CSP: `https://support.google.com/adsense/answer/16283098`
- CookieHub CSP: `https://docs.cookiehub.com/advanced/csp`
- Google Analytics MCP: `https://developers.google.com/analytics/devguides/reporting/data/v1/mcp`
- Google Ads MCP: `https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server`

Provider-Anforderungen sind bei jeder Änderung erneut zu prüfen.
