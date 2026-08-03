# ESS-0014 — Google Marketing MCP Governance

## Enterprise Specification

**Version:** 1.0.0  
**Status:** Enterprise Specification  
**Owner:** Platform Director  
**Security Authority:** CAPITAL-AI IAM / Security & Compliance  
**Related ADR:** ADR-0035  
**Related ESS:** ESS-0003, ESS-0006, ESS-0007, ESS-0011, ESS-0012, ESS-0013  
**Implementation profile:** `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md`

---

## 1. Zweck

ESS-0014 definiert die verbindliche Enterprise-Architektur für die Integration von Google-Marketing-Systemen in CAPITAL-AI. Die Spezifikation ist bewusst **modell-, host- und transportneutral**. Claude Code, Claude Desktop, Gemini, ein CAPITAL-AI-Agent oder ein anderer freigegebener MCP-Host sind Implementierungs- oder Ausführungsinstanzen, aber niemals die normative Autorität.

Die Spezifikation umfasst insbesondere:

- Google Analytics 4;
- Google Analytics Data API und Google Analytics Admin API;
- Google Analytics MCP;
- Google Ads API und Google Ads MCP;
- Google Tag Manager API;
- Google AdSense / AdSense Management API;
- Google Consent Mode v2;
- AMP-/AdSense-Auslieferung, sofern eine echte AMP-Dokumentvariante betrieben wird;
- CookieHub als Consent Source of Truth;
- Credential-, IAM-, Delegations-, Approval-, Audit- und Rollback-Governance;
- die Trennung zwischen Google-MCP-Read-Plane und mutierenden Google-API-Control-Plane-Adaptern.

Nicht Bestandteil dieses ESS sind allgemeine repositoryweite IAM-Regeln, globale Event-Namensregeln oder allgemeine Release-Regeln. Diese bleiben in den jeweils zuständigen ESS/Contracts.

---

## 2. Normative Grundsätze

1. **CookieHub bleibt Consent Source of Truth.** Google-interne Default-Consent-Konfiguration darf diese Entscheidung nicht stillschweigend überschreiben.
2. **Zero Google data before consent** bleibt für browserseitige Analytics-/Marketing-Daten die Privacy-Invariante, solange kein späteres akzeptiertes ADR ausdrücklich einen anderen Rechts-/Architekturzustand beschließt.
3. **Basic Consent Mode v2** ist der Standard für CAPITAL-AI. Advanced Consent Mode benötigt ein separates ADR mit Datenschutz-/Rechtsbewertung.
4. **Read und Write werden getrennt.** Offizielle Google-MCP-Server werden nur in dem Funktionsumfang genutzt, den Google tatsächlich bereitstellt. Mutationen erfolgen über kontrollierte CAPITAL-AI-Adapter gegen die zuständigen Google APIs.
5. **No hidden rollback.** Kein Agent, MCP-Tool, Refactoring, Drift-Reconciler, CI-Fix oder Dependency-Upgrade darf geschützte Marketing-/Consent-Sicherheitsmechanismen stillschweigend zurückbauen.
6. **Fail closed.** Ist Identität, Rolle, Service-Account-Grant, Step-up, Ressourcenzuordnung, Consent-Zustand, Approval-Artefakt oder Ziel-Fingerprint unklar, wird die Mutation abgelehnt.
7. **Least privilege.** Google OAuth Scopes, Service-Account-Capabilities und API-Operationen werden auf das kleinste erforderliche Recht begrenzt.
8. **Dry-run first.** Jede externe Mutation erstellt zuerst einen Plan/Diff. Produktionswrites sind niemals die Default-Aktion.
9. **Auditability.** Jede privilegierte Änderung erhält Actor, Principal-Typ, Zielressource, vorherigen/nachherigen Fingerprint, Approval-Referenz und Verifikationsergebnis.
10. **No secret in client.** OAuth Refresh Tokens, Client Secrets, Developer Tokens, Service-Account-Secrets und MCP-Admin-Credentials bleiben serverseitig.

---

## 3. Systemgrenzen

### 3.1 Browser Data Plane

Der Browser darf ausschließlich öffentliche IDs und consent-gesteuerte Runtime-Tags erhalten.

```text
Browser
  |
  +--> CookieHub CMP
  |      |
  |      +--> necessary
  |      +--> analytics
  |      +--> marketing
  |
  +--> GA4 / Google tag        [nur entsprechend Consent]
  +--> AdSense                [nur entsprechend Marketing-/CMP-Policy]
  +--> AMP Auto Ads           [nur auf echter AMP-Dokumentvariante]
```

### 3.2 Google MCP Read Plane

```text
Approved MCP Host
  |
  +--> Google Analytics MCP  --> read-only reporting
  +--> Google Ads MCP        --> read-only discovery/reporting
```

Die offiziellen Google Analytics- und Google Ads-MCP-Server werden als **read-only Evidence Plane** behandelt, solange Google deren dokumentierten Umfang nicht ausdrücklich erweitert.

### 3.3 CAPITAL-AI Mutation Control Plane

```text
Claude / approved MCP host
  |
  v
CAPITAL-AI Marketing Control Plane
  +-- Policy Gate
  +-- IAM Gate
  +-- Approval Gate
  +-- Dry-Run Planner
  +-- Idempotency / Drift Guard
  +-- Audit Evidence
  |
  +--> GA Admin API
  +--> GTM API
  +--> Google Ads API (nur freigegebene Write-Adapter)
  +--> AdSense Management API (nur freigegebene Operationen)
```

Der Control Plane darf niemals zu einem generischen, uneingeschränkten Google-API-Proxy werden.

---

## 4. Geschützte Integrationsinvarianten

Folgende Elemente sind `PROTECTED_MARKETING_INVARIANTS`:

- CookieHub Loader in `index.html`;
- `public/cookiehub-init.js`;
- CookieHub Consent-Kategorien und deren Google-Mapping;
- `public/google-analytics-consent.js` bzw. ein späterer gleichwertiger consent-gated Loader;
- CSP-Nonce-/Strict-CSP-Mechanismus für Google-Marketing-Skripte;
- AdSense Publisher ID und deren kontrollierte Auslieferung;
- Google Consent Mode v2 Defaults/Updates;
- TCF-/CMP-Konfiguration, sofern für EWR/UK/CH und personalisierte Anzeigen relevant;
- Google-Marketing Credential Boundary;
- OWNER-/Service-Account-Approval Gate;
- Audit-/Traceability-Nachweise;
- zukünftige MCP Policy Gate- und Approval Gate-Komponenten.

Ein technisch äquivalenter Ersatz ist zulässig, gilt aber als Architekturänderung und benötigt ADR + Evidence.

---

## 5. Protected Change / Rollback Protocol

### 5.1 Definition

Als Rollback oder protected change gilt jede Änderung, die mindestens eine der folgenden Wirkungen hat:

- Entfernen oder Deaktivieren von CookieHub;
- Rückkehr zu CSP-blockiertem Inline-Consent-Code;
- Entfernen/Abschwächen der CSP-Nonce-/Strict-CSP-Struktur;
- Laden von Analytics/Ads vor der zulässigen Consent-Stufe;
- Entfernen von Consent Mode Signalen;
- Entfernen von Audit-, Approval- oder IAM-Gates;
- Wechsel der Google Property, AdSense Publisher ID, Google Ads Customer ID oder GTM Container Identity;
- Senken des Schutzlevels einer geschützten Komponente;
- Revert eines Commits, der eine geschützte Invariante eingeführt oder repariert hat.

### 5.2 Pflicht-Nachfrage

Ein interaktiver Agent MUSS vor einem Rollback stoppen und eine explizite Bestätigung anfordern. Die Nachfrage muss die konkreten Auswirkungen nennen, mindestens:

1. Datenschutz/Consent-Auswirkung;
2. Analytics-/Messauswirkung;
3. AdSense-/Monetarisierungsauswirkung;
4. CSP-/XSS-Sicherheitsauswirkung;
5. Compliance-/Audit-/Traceability-Auswirkung;
6. mögliche Produktions-/SEO-/AMP-Auswirkung;
7. betroffene Dateien/Ressourcen und aktueller vs. geplanter Fingerprint.

Eine generische Anweisung wie `fix`, `cleanup`, `restore old implementation`, `make it work`, `revert last changes` oder `simplify CSP` ist **keine** ausreichende Rollback-Freigabe.

### 5.3 Human OWNER

Ein Human-Principal darf einen protected change nur ausführen, wenn:

- `profiles.iam_role === 'owner'` verifiziert ist;
- ein frischer TOTP Step-up vorliegt;
- eine explizite Auswirkungsbestätigung vorliegt;
- ein Dry-Run-/Diff-Artefakt erzeugt wurde;
- ein Reason/Change-Ticket angegeben ist.

`admin`, `supervisor`, `user` oder Subscription-Tiers erhalten dadurch niemals implizite Berechtigung.

### 5.4 Service Accounts

Service Accounts sind **keine Human-IAM-Rolle** und dürfen nicht als `owner` in `profiles.iam_role` modelliert werden.

Sie bilden einen getrennten Principal-Typ mit OWNER-delegierten Capabilities. Zulässige Capabilities:

- `google.marketing.read`
- `google.marketing.plan`
- `google.marketing.apply`
- `google.marketing.publish`
- `google.marketing.rollback`
- `google.marketing.credentials.rotate`

Regeln:

1. Nur ein verifizierter Human OWNER mit frischem TOTP Step-up darf Grants anlegen, ändern, verlängern oder widerrufen.
2. Ein Service Account darf seine eigenen Rechte niemals ändern.
3. Ein Service Account darf Rechte niemals an andere Principals delegieren.
4. Grants sind resource-scoped, zweckgebunden und zeitlich begrenzt.
5. `google.marketing.rollback` benötigt zusätzlich ein **job-spezifisches, einmaliges OWNER Approval Artifact**; ein stehender Grant allein reicht nicht.
6. Abgelaufene, widerrufene oder uneindeutige Grants werden fail-closed behandelt.
7. Credential-Rotation darf keine Capability-Eskalation bewirken.

### 5.5 Approval Artifact

Ein protected change führt mindestens:

```text
approvalId
requestId
actorType = human | service_account
actorId
ownerGrantId?              # für Service Account
capability
targetResources[]
currentFingerprints[]
proposedFingerprints[]
impactSummary
explicitConfirmation = true
reason
issuedAt
expiresAt
usedAt?
```

Das Approval Artifact ist single-use für destructive/rollback actions.

---

## 6. IAM-Integration

Bestehende CAPITAL-AI-Bausteine werden wiederverwendet:

- `checkAdminAccess(..., OWNER_ONLY_ROLES)` für Human OWNER;
- `requireStepUp()` für kritische Owner-Aktionen;
- `logIamEvent()` / IAM Audit Logging;
- fail-closed bei nicht verfügbarem IAM-Schema.

Service-Account-Grants werden als getrennte Capability Registry implementiert und dürfen die Human-Rollentabelle nicht umgehen.

---

## 7. CSP Contract für Google Marketing

### 7.1 AdSense

AdSense wird mit **Strict CSP und pro Response zufälligem Nonce** integriert. Der Nonce wird serverseitig erzeugt, in den CSP-Header geschrieben und auf alle `<script>`-Tags der HTML-Antwort übertragen.

Kein statischer Nonce. Kein wiederverwendeter Nonce. Kein `unsafe-inline` als alleinige Lösung.

Google-kompatibler Kern:

```text
object-src 'none';
base-uri 'none';
script-src 'nonce-{REQUEST_NONCE}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:;
```

`unsafe-inline` ist in CSP3-Browsern bei vorhandenem Nonce/strict-dynamic nicht die Vertrauenswurzel; `unsafe-eval` bleibt ein dokumentierter AdSense-Kompatibilitäts-Trade-off und muss im ADR nachvollziehbar bleiben.

### 7.2 CookieHub

Mindestens:

```text
script-src: cookiehub.net cdn.cookiehub.eu
style-src: cookiehub.net cdn.cookiehub.eu
connect-src: ds.cookiehub.net consent.cookiehub.net region-eu.cookiehub.net consent-eu.cookiehub.net cookiehub.net cdn.cookiehub.eu
```

### 7.3 Analytics

GA4-/Google-Tag-Netzwerkziele werden explizit im `connect-src`/`img-src`-Kontext berücksichtigt. Die Browser-Runtime bleibt consent-gated.

### 7.4 CSP Drift

Eine CSP-Änderung, die einen geschützten Integrationspfad blockiert oder den Schutzlevel reduziert, ist ein protected change und fällt unter Abschnitt 5.

---

## 8. Consent Contract

Consent-Signale:

- `analytics_storage`
- `ad_storage`
- `ad_user_data`
- `ad_personalization`

CookieHub übersetzt die Nutzerentscheidung in die zulässigen Google-Signale. Vor Zustimmung werden Analytics-/Marketing-Tags nach dem CAPITAL-AI Basic-Mode-Prinzip nicht aktiv zur Datenerhebung genutzt.

Bei AdSense in EWR/UK/CH müssen die jeweils aktuellen Google-Publisher- und CMP-Anforderungen einschließlich eines ggf. erforderlichen IAB-TCF-Profils im Production Handoff geprüft werden.

---

## 9. AMP Contract

`amp-auto-ads` ist nur auf Dokumenten zulässig, die als AMP-Dokumente valide sind.

Die Präsenz von:

```html
<script async custom-element="amp-auto-ads" src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"></script>
```

und:

```html
<amp-auto-ads type="adsense" data-ad-client="ca-pub-1353017943074018"></amp-auto-ads>
```

macht eine React/Vite-SPA **nicht** zu einer AMP-Seite. Vor produktiver Nutzung von AMP Auto Ads ist eine eigenständige AMP-Route/-Dokumentvariante zu validieren. Normale AdSense Auto Ads bleiben davon getrennt.

---

## 10. Google MCP Federation

### 10.1 Official Read Plane

- Google Analytics MCP: Reporting/Data-API Read Plane.
- Google Ads MCP: aktuell Read-only für Discovery, GAQL/Reporting und Ressourcenmetadaten.

### 10.2 Write Plane

Writes erfolgen nur über explizite CAPITAL-AI Adapter gegen die zuständigen APIs. Ein read-only Google MCP darf nicht durch inoffizielle Seiteneffekte in einen Write-Pfad verwandelt werden.

### 10.3 Claude

Claude kann:

- MCP Host;
- Implementierungsagent;
- Planner;
- Reviewer;
- Evidence Generator

sein.

Claude kann **nicht**:

- OWNER-Autorisierung ersetzen;
- Step-up ersetzen;
- ein Approval Artifact selbst genehmigen;
- Service-Account-Rechte selbst erweitern;
- geschützte Invarianten ohne Nachfrage zurückbauen.

---

## 11. Tool Contract

Jedes mutierende MCP/API-Tool besitzt mindestens:

```text
dryRun: boolean = true
approvalId?: string
expectedFingerprint?: string
reason?: string
```

Destructive Tools zusätzlich:

```text
requireExplicitConfirmation: true
requiredCapability: google.marketing.rollback | google.marketing.publish
```

Fehlt ein erwarteter Fingerprint oder weicht der Live-Zustand ab, muss neu geplant werden.

---

## 12. Audit- und Evidence Contract

Pflicht-Evidence je Mutation:

- actor/principal;
- authz decision;
- Step-up/Grant/Approval Reference;
- dry-run diff;
- API request class (keine Secrets);
- before/after fingerprint;
- result;
- post-change verification;
- rollback readiness;
- Traceability Links zu ESS/ADR/Test/Change.

Secrets und vollständige OAuth Tokens sind von Evidence ausgeschlossen.

---

## 13. Tests

Mindestens:

1. OWNER ohne Step-up -> deny;
2. ADMIN/SUPERVISOR/USER -> deny protected change;
3. OWNER + Step-up, aber ohne explicit confirmation -> deny;
4. Service Account ohne Capability -> deny;
5. Service Account mit allgemeinem apply Grant, aber ohne rollback Capability -> deny rollback;
6. Service Account mit rollback Capability, aber ohne one-time OWNER approval -> deny;
7. abgelaufenes Approval -> deny;
8. Fingerprint mismatch -> deny;
9. CookieHub init bleibt unter CSP funktionsfähig;
10. AdSense Script trägt Request Nonce;
11. Nonce ändert sich pro HTML-Response;
12. CSP enthält `object-src 'none'`, `base-uri 'none'`, `strict-dynamic`;
13. Analytics bleibt vor Consent ohne Datenerhebung;
14. Rollback-Versuch erzeugt Audit Evidence.

---

## 14. Stop Conditions

Jeder Agent/Host stoppt vor Mutation, wenn:

- die Anweisung einen protected change impliziert, aber keine explizite Bestätigung enthält;
- Auswirkungen nicht benannt wurden;
- Human Actor nicht OWNER ist;
- Step-up fehlt;
- Service-Account-Grant fehlt/abgelaufen ist;
- one-time Approval für Rollback fehlt;
- Live Resource Identity nicht eindeutig ist;
- Google API-/MCP-Funktionsumfang unklar ist;
- Consent-Auswirkung nicht verifiziert werden kann.

---

## 15. Offizielle Referenzen (Stand 2026-08-03)

- Google AdSense Strict CSP: `https://support.google.com/adsense/answer/16283098`
- Google Analytics MCP: `https://developers.google.com/analytics/devguides/reporting/data/v1/mcp`
- Google Ads MCP: `https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server`
- CookieHub CSP: `https://docs.cookiehub.com/advanced/csp`

Herstellerdokumentation ist bei jeder Implementierung erneut auf Aktualität zu prüfen.

---

## 16. Definition of Done

ESS-0014 gilt als vollständig umgesetzt, wenn:

- Strict CSP mit pro-Response Nonce produktiv verifiziert ist;
- CookieHub/Analytics/AdSense ohne CSP-Verletzung gemäß Zielzustand funktionieren;
- protected change/rollback Gate als ausführbarer Control-Plane-Mechanismus existiert;
- OWNER + Step-up durchgesetzt wird;
- Service-Account Capability Registry mit OWNER-only Grant Management implementiert ist;
- one-time Approval Artifacts für Rollbacks erzwungen werden;
- Google MCP Read Plane und mutierende API Adapter getrennt sind;
- Audit/Traceability/Tests vorhanden sind;
- Produktions-Evidence vorliegt.

Bis dahin bleibt der Implementation-Status `IN PROGRESS`, auch wenn das ESS selbst `published` ist.
