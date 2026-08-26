# CAPITAL-AI — Vollständiger Sicherheitsreport (2026-08-26)

**Status:** Evidence / Review-Ergebnis — nicht-autorisierend gemäß `AGENTS.md`; Merge- und Produktionsentscheidungen bleiben Human/Owner-gated.
**Baseline:** `main@6b5cca8a7ebf8634cebfb5457cc0b9d6bcd6f247`
**Scope:** Komponenteninventar aller zusammenhängenden Komponenten, Prüfung der durch Pull Requests erzeugten Änderungen, Auswertung der sicherheitsrelevanten Logs auf hybride Angriffsmuster, Verifikation der Honeytoken-Implementierung.
**Laufzeit:** Render `srv-d91o1o9o3t8c73edi55g` (Frankfurt) · Supabase `ryzywoktpmyhwzxmstyu` (eu-west-1)

## Executive Summary

Lieferkette und Container sind solide gehärtet: alle GitHub-Actions SHA-gepinnt, Base-Images digest-gepinnt, Non-Root-Runtime mit Healthcheck, Stripe-Signaturprüfung vor dem Body-Parsing, RLS auf allen 42 Tabellen, keine Secrets im Repository. Die produktiv wirksame CSP ist die gehärtete ADR-0040-Baseline mit `object-src 'none'`, `base-uri 'none'` und `form-action`.

Die realen Risiken liegen an drei Stellen:

1. eine **laufende Audit-Log-Flutung** als Folge von PR #541 (F-01),
2. eine **Telemetrie-Lücke**, die schichtübergreifende Angriffskorrelation unmöglich macht (F-02),
3. **dupliziertes Security-Middleware**, bei dem nur eine Kopie aktiv ist und die inaktive bereits zu einer schwächeren Richtlinie abgedriftet ist (F-03).

**Honeytoken: Es existiert keiner.** Weder im Arbeitsbaum noch in der gesamten Git-Historie gibt es eine Honeytoken-Implementierung. Siehe Abschnitt 5.

| # | Befund | Schweregrad | Status |
|---|---|---:|---|
| F-01 | Admin-Panel flutet das Sicherheits-Auditlog | Hoch | **Aktiv/laufend** |
| F-02 | HTTP-Telemetrie ohne Quell-IP — Korrelation unmöglich | Mittel | Offen |
| F-03 | Dupliziertes Security-Middleware, nur eine Kopie aktiv | Mittel | Offen |
| F-04 | Gehärtete CSP hängt an einem Monkey-Patch | Mittel | Offen (aktuell korrekt) |
| F-05 | Neun Tabellen mit RLS, aber ohne Policy | Mittel | Offen |
| F-06 | Leaked-Password-Protection deaktiviert | Mittel | Offen |
| F-07 | MFA-Step-Up nicht serverseitig durchgesetzt | Mittel | Übernommen aus Review 2026-08-25 |
| F-08 | Lücken im Probe-Schutz | Niedrig | Offen |
| F-09 | Strict-CSP dauerhaft im Report-Only-Modus | Info | Offen |

## 1 — Komponenteninventar

| Komponente | Technologie | Sicherheitsrelevante Eigenschaften |
|---|---|---|
| Frontend | React 19 SPA (Vite) | Eigener Pathname-Router; öffentliche Routen über Literal-Allowlist; unbekannte Pfade harte 404; keine Autorisierungsauthority |
| Backend | Express — `server.application.ts` | 80 KB Monolith mit inline Security-Headern, Probe-Schutz, globalem Rate-Limit, Stripe-Webhooks |
| Identität | Supabase Auth + IAM-Zonen | `checkAdminAccess()` als kanonische Authority; fail-closed bei fehlender Konfiguration, Schema, Bearer, Rate-Limit |
| Datenhaltung | Postgres 17.6 — 42 Tabellen | RLS überall aktiv; 9 Tabellen ohne Policy; kein `FORCE ROW LEVEL SECURITY` |
| Laufzeit | Render Web Service (Docker) | Frankfurt, Starter-Plan, 1 Instanz, Auto-Deploy aus, GHCR-Registry-Credential |
| Zahlung | Stripe | `constructEvent()`-Signaturprüfung auf Rohbody, vor `express.json()` und vor globalem Rate-Limit |
| Externe Daten | Alpha Vantage, Binance, CoinGecko, FMP, GoPlus, Dune | Ausgehende Abrufe; CoinGecko dauerhaft HTTP 429, Binance als Fallback |
| KI | Anthropic / OpenAI / Agent-Orchestrierung | LLM-Ausgabe gilt als untrusted input; Dokument-Schreibpfade über Review-Tickets (PR #534) |
| Publishing | Social-Media-OAuth | Authorization-Code-Flow mit `social_media_oauth_states`; Medien-Fetch ohne automatisches Redirect-Folgen |
| CI/CD | GitHub Actions | Null ungepinnte Actions; Governance-Ausnahmen an Repository/Owner gebunden |
| Container | `node:24.18.0-alpine` | Digest-gepinnt; Nutzer `capitalai`; Artefakte `root:root`; HEALTHCHECK |
| Domain/Mail | `capital-ai.online` | CAA für Let's Encrypt + Google Trust Services; Wildcard fail-closed über `issuewild ";"` |

## 2 — Befunde

### F-01 — Admin-Panel flutet das Sicherheits-Auditlog (Hoch, laufend)

PR #541 hat `/api/orchestrator/stats` und `/ping-models` korrekt hinter `requireOrchestratorAdmin` gestellt. Die Kontrolle funktioniert und ist fail-closed. Der Client wurde nicht angepasst: `src/components/OrchestratorPanel.tsx:107` pollt alle 2 Sekunden über `setInterval`, und das Intervall wird bei einer 401-Antwort **nicht gestoppt**.

`src/lib/authFetch.ts:16` verschärft das: fehlt die Session, wird der `Authorization`-Header weggelassen und der Request trotzdem abgesetzt. Jeder dieser Requests erzeugt serverseitig einen `DENIED`-Datensatz in `iam_access_log`.

Live-Evidenz (Abfrage 2026-08-26):

```
created_at                  zone                 outcome  reason           ip
2026-08-26 12:56:20.108+00  orchestrator-config  DENIED   no-bearer-token  47.64.48.251
2026-08-26 12:56:20.065+00  orchestrator-config  DENIED   no-bearer-token  47.64.48.251
2026-08-26 12:54:54.056+00  orchestrator-config  DENIED   no-bearer-token  47.64.48.251
   … ununterbrochen, gleiche IP, gleicher User-Agent
```

**Wirkung.** `iam_access_log` enthält 526 `DENIED` zu 1126 `GRANTED` — 32 % des Sicherheits-Auditlogs sind selbst erzeugtes Rauschen. Das Log wächst unbegrenzt, echte Denials gehen darin unter, und das Admin-Panel zeigt gleichzeitig keine Daten mehr.

**Empfehlung.** `authFetch()` ohne Session abbrechen statt unauthentifiziert senden; Poll-Intervall bei 401 per `clearInterval` beenden; identische Denial-Tupel serverseitig innerhalb eines Zeitfensters entprellen.

### F-02 — HTTP-Telemetrie ohne Quell-IP (Mittel)

Das `request.completed`-Event in `server/logger.ts:96` protokolliert Methode, Pfad, Statuscode und Dauer — aber weder Quell-IP noch User-Agent. Die IAM-Schicht in Supabase erfasst beides, die HTTP-Schicht auf Render nicht.

Damit fehlt der gemeinsame Schlüssel, um Scanner-Verkehr auf der HTTP-Ebene mit Denials auf der Auth-Ebene zu verbinden — genau die Verknüpfung, die eine hybride Kampagne von zwei unabhängigen Rauschquellen unterscheiden würde (Abschnitt 4).

**Empfehlung.** `ip` (über die bestehende `getClientIp()`-Boundary) und einen gekürzten oder gehashten `userAgent` ergänzen. Der bestehende Vorsatz, weder Query-Strings noch Bodies zu loggen, bleibt unberührt.

### F-03 — Dupliziertes Security-Middleware (Mittel)

Zwei Fassungen derselben Sicherheitsrichtlinien. Die aktive liegt inline in `server.application.ts`. Die ausgelagerten Module werden ausschließlich von Tests importiert:

```
server/middleware/securityHeaders.ts   → nur tests/unit/securityHeadersPolicy.test.ts
server/middleware/probeProtection.ts   → nur tests/unit/serverMiddlewareExtraction.test.ts
server/middleware/cors.ts              → nur tests/unit/serverMiddlewareExtraction.test.ts
server/middleware/globalRateLimit.ts   → kein Importeur
```

**Das Problem ist die Drift.** Die inaktive `securityHeaders.ts` erzeugt eine *schwächere* CSP als die produktiv wirksame: ohne `object-src`, ohne `base-uri`, ohne `form-action` — und mit dem ungültigen Quellausdruck `referrer` in `img-src`. Ein künftiger Cutover auf die ausgelagerten Module würde die Produktions-CSP still herabstufen und dabei wie ein reines Refactoring aussehen. Die Tests bemerken das nicht, weil sie die schwächere Fassung als Sollzustand festschreiben.

**Empfehlung.** Entweder verdrahten und die Inline-Fassung entfernen, oder die toten Module samt Tests löschen. Beide Fassungen parallel zu halten ist der Zustand, der den Fehler produziert.

### F-04 — Gehärtete CSP hängt an einem Monkey-Patch (Mittel)

`server.application.ts:240` setzt weiterhin eine veraltete ADR-0009-CSP. Wirksam wird sie nicht, weil `requestContext` — registriert in Zeile 78, also davor — über `attachSecurityResponseContext()` die Methode `res.setHeader` überschreibt und jedes Setzen von `Content-Security-Policy` durch die gehärtete ADR-0040-Baseline ersetzt.

Der aktuelle Zustand ist korrekt; eine Prüfung auf `res.writeHead`, das den Patch umgehen würde, ergab null Treffer im gesamten Server- und Frontend-Code. Die Härtung ruht damit aber auf zwei stillen Annahmen: der Registrierungsreihenfolge zweier Middleware und der Abwesenheit von `writeHead`. Eine Umsortierung würde die Produktions-CSP ohne Fehlermeldung und ohne Testbruch auf die schwächere Variante zurückfallen lassen.

**Empfehlung.** Den toten CSP-String in Zeile 240–249 ersatzlos entfernen.

*Prüfmethode:* Eine empirische Verifikation gegen die Live-Header war nicht möglich — die Netzwerkrichtlinie dieser Umgebung blockiert ausgehende Verbindungen zu `finance-7clq.onrender.com` (403 auf CONNECT). Der Befund beruht auf der Codeanalyse der Middleware-Reihenfolge.

### F-05 — Neun Tabellen mit RLS, aber ohne Policy (Mittel)

RLS ist auf allen 42 Tabellen aktiviert. Bei neun existiert keine Policy, was Zugriff über `anon` und `authenticated` effektiv verweigert und allen Zugriff auf `service_role` verlagert:

```
agent_audit_events            m10_ci_consumptions            seo_content_inventory
ai_governance_evaluations     m10_shadow_evaluations         seo_keywords
m10_approval_evidence         m10_authorization_challenges   seo_rank_snapshots
```

Fail-closed ist das richtige Verhalten. Problematisch ist, dass die Absicht nirgends festgeschrieben ist: ein leeres Policy-Set sieht identisch aus, ob beabsichtigt oder vergessen. Es fehlt zudem die zweite Verteidigungslinie, falls ein `service_role`-Key abfließt. Der Supabase-Advisor meldet alle neun.

**Empfehlung.** Je Tabelle eine explizite Deny-All- oder minimale Read-Policy, damit der Sollzustand aus den Migrationen belegbar ist. Für die Audit-Tabellen zusätzlich `FORCE ROW LEVEL SECURITY` erwägen — derzeit auf keiner Tabelle gesetzt.

### F-06 — Leaked-Password-Protection deaktiviert (Mittel)

Supabase Auth kann Passwörter beim Setzen gegen HaveIBeenPwned prüfen. Die Funktion ist abgeschaltet (Advisor-Warnung). Für eine Finanzanwendung mit Zahlungsdaten eine niedrig hängende Härtung ohne Codeänderung.

### F-07 — MFA-Step-Up nicht serverseitig durchgesetzt (Mittel, übernommen)

Befund #6 des Architektur-Reviews vom 2026-08-25 ist unverändert offen. Owner- und kritische Pfade besitzen eigene AAL2-Kontrollen, für reguläre authentifizierte APIs fehlt eine systematische serverseitige AAL-/MFA-Policy. Ebenso offen: Befund #11 — die vollständige GRANT-Historie von `profiles` ist nicht allein aus den getrackten Migrationen belegbar und erfordert eine read-only Produktionsprüfung.

Beide sind bewusst als eigener AuthN/AuthZ-Scope zurückgestellt und wurden hier nur als weiterhin offen bestätigt.

### F-08 — Lücken im Probe-Schutz (Niedrig)

Der Probe-Filter fängt PHP-, WordPress-, `.env`- und `.git`-Pfade früh mit 404 ab. Mehrere im Log beobachtete Scanner-Pfade greifen die Muster nicht und laufen durch die gesamte Middleware-Kette einschließlich Rate-Limiter:

```
/config.toml          /app/config.toml      /magento_version
/config.yaml *        /app/config.yaml      /administrator/manifests/files/joomla.xml
/config.yml  *        /core/install.php **  /admin/controller/extension/extension/ultra.php

 *  nur ohne Präfix erfasst — das Muster ist auf ^/ verankert
 ** nur über die generische \.php$-Regel, nicht als Installer-Pfad
```

Es entsteht kein Informationsabfluss — die Antwort ist in allen Fällen 404. Der Befund betrifft die Wirksamkeit gegenüber der dokumentierten Absicht.

### F-09 — Strict-CSP dauerhaft im Report-Only-Modus (Info)

`CSP_MODE` ist in `render.yaml` nicht gesetzt, wodurch der Default `report-only` greift. Die strikte Nonce- und `strict-dynamic`-Richtlinie wird ausgeliefert, aber nicht durchgesetzt; durchgesetzt wird die Baseline. Das entspricht dem ADR-0040-Rollout-Plan — die für die Promotion nach `strict` vorgesehene Produktionsevidenz steht weiterhin aus.

## 3 — Prüfung der Pull-Request-Änderungen

| PR | Gegenstand | Bewertung |
|---|---|---|
| #541 | Orchestrator Admin-Reads absichern | **Kontrolle korrekt, Client-Regression.** BFLA-Lücke serverseitig geschlossen, Deny-Pfade durch HTTP-Integrationstests belegt, Handler bei DENY nachweislich nicht ausgeführt. Client nicht mitgezogen → **F-01** |
| #539 | Commodity Asset Universe | **Echter Fix.** `...dispatch.canonical` stand hinter `symbol`/`assetId` und konnte die anfragegebundene Identität überschreiben (Cross-Asset-Response-Confusion). Spread steht jetzt davor |
| #537 | Render-CAA für Domain-Mail | **Unbedenklich, fail-closed.** Korrekt erkannt, dass `issue` ohne `issuewild` nach RFC auch Wildcards autorisiert; expliziter Deny ist die richtige Vorgabe. Reine Dokumentation |
| #542 | Versionspfade über Release Control Plane | **Kein Sicherheits-Scope** |
| #534 | Architektur-Sicherheitscheck | **Substanziell.** Session-Token aus LocalStorage entfernt, Session-Restore fail-closed, `getClientIp()` als einzige Rate-Limit-Identität, SSRF-Härtung, `unsafe-eval` entfernt. Zwei Befunde bewusst offen → **F-07** |
| #540 (offen) | Learning Platform | **Sauber.** Öffentliche Route als Literal in der Allowlist, nicht als Wildcard. Dateisystempfade nur aus serverseitigen Literalen. Tests sichern ab, dass `/learning-platform-admin` nicht mitfreigegeben wird. Soft-404-Grenze intakt |
| #538 (offen) | Vocabulary-SkillEngine | **Kein Sicherheits-Scope** im geprüften Umfang |

Nebenbefund: `OrchestratorPanel.tsx` und `rawMaterialsRoutes.ts` enden ohne abschließenden Zeilenumbruch. Kosmetisch, erzeugt aber Rauschen in künftigen Diffs.

## 4 — Logauswertung auf hybride Angriffsmuster

**Befund: Kein hybrides Angriffsmuster nachweisbar.** Die sicherheitsrelevante Aktivität zerfällt in zwei Klassen, die nachweislich nicht zusammenhängen. Für eine abschließende Aussage fehlt der Korrelationsschlüssel (F-02).

### Klasse 1 — Opportunistisches Massen-Scanning

In einer Stichprobe von 100 Warn-Level-Requests aus den Render-App-Logs waren 96 Scanner-404:

```
15×  /wp-admin/install.php
 2×  /xmlrpc.php · /wp-content/index.php · /.git/config · /.git/HEAD · /.env
 1×  Webshell-Namen:  wso.php  up.php  o.php  cc.php  rip.php  222.php
                      lock360.php  ioxi-o.php  cah.php  chosen.php  adminfuns.php
 1×  Config-Exfil:    /config.toml  /config.yaml  /config.yml  /app/config.*
 1×  CMS-Fingerprint: /magento_version  /administrator/manifests/files/joomla.xml
                      /core/install.php  /admin/controller/extension/…/ultra.php
 1×  /wp-json/gravitysmtp/v1/tests/mock-data

Statuscodes:              404 × 96   ·   401 × 4
Erfolgreiche Ausnutzung:  keine
```

Kein einziger Probe-Request wurde mit 200 beantwortet. Keine Anzeichen für Ausnutzung, keine Folgeaktivität, kein gezieltes Interesse an der tatsächlichen API-Oberfläche. Auch `/mcp` und `/sse` wurden abgefragt — ein neuerer, aber ebenfalls generischer Scanner-Trend.

### Klasse 2 — Denials auf der authentifizierten Oberfläche

Alle 526 `DENIED`-Einträge in `iam_access_log` tragen dieselbe Ursache `no-bearer-token` und verteilen sich auf nur zwei Zonen. Jede beteiligte IP hält im selben Zeitfenster auch `GRANTED`-Sitzungen als `owner`:

| IP | GRANTED | DENIED | Zeitraum | Deutung |
|---|---:|---:|---|---|
| 185.183.34.61 | 562 | 258 | 19.08. 08:34–11:41 | Owner-Sitzung |
| 212.8.248.184 | 294 | 124 | 19.08. 04:50–08:10 | Owner-Sitzung |
| 185.184.192.201 | 150 | 78 | 17.08. 02:23–03:16 | Owner-Sitzung |
| 185.98.171.239 | 100 | 43 | 19.08. 03:16–04:35 | Owner-Sitzung |
| 47.64.48.251 u. a. | 0 | 23+ | seit 25.08. 04:50 | F-01, laufend |

Die Ursache ist strukturell und harmlos: `system-events:stream` wird über EventSource konsumiert, und die Browser-API kann keinen `Authorization`-Header setzen. 480 der 526 Denials entfallen allein auf `system-events:read`. Die restlichen 23 sind F-01. Kein Denial stammt von einer IP ohne parallele legitime Owner-Sitzung.

### Einzelereignisse — geprüft und entlastet

- **2 fehlgeschlagene Step-Up-TOTP-Codes** (17.08., `185.184.192.201`). Dieselbe IP hielt Minuten zuvor eine gültige Owner-Sitzung und war danach wieder erfolgreich. Kein Brute-Force-Muster — zwei Fehlversuche über 28 Minuten, ohne Enumeration.
- **3 CORS-Blocks** (09.08.) mit Origin `https://finance-pr-138.onrender.com` — eine eigene Render-PR-Preview-Umgebung, kein fremder Origin. Die Kontrolle hat korrekt gegriffen.
- **Dauerhafte CoinGecko-429.** Upstream-Ratenbegrenzung, kein Sicherheitsereignis; Binance als Fallback.

### Warum die Aussage eine Einschränkung trägt

Ein hybrider Angriff zeichnet sich gerade dadurch aus, dass unauffälliges Scanning und Aktivität auf der authentifizierten Oberfläche vom selben Akteur ausgehen. Diese Verbindung lässt sich hier weder belegen noch widerlegen: Klasse 1 liegt in den Render-App-Logs *ohne* Quell-IP, Klasse 2 in Supabase *mit* Quell-IP. Es gibt keinen gemeinsamen Schlüssel.

Gegen einen hybriden Angriff spricht die Charakteristik: alle Klasse-2-Denials tragen genau eine Ursache, betreffen genau zwei Zonen und stammen ausschließlich von IPs mit gleichzeitiger legitimer Owner-Sitzung. Kein Credential-Stuffing, keine Zonen-Enumeration, kein Rollenwechselversuch. Das ist das Profil eines Client-Defekts, nicht das eines Gegners.

Die Einschränkung ist behebbar — F-02 umzusetzen macht die Frage in künftigen Auswertungen entscheidbar.

## 5 — Honeytoken

**Es existiert kein Honeytoken.** Die Prüfung sollte die erfolgreiche Implementierung verifizieren. Sie ergibt, dass keine Implementierung vorliegt — weder aktiv, noch unvollständig, noch in der Historie jemals begonnen.

Gesucht wurde case-insensitiv über den vollständigen Arbeitsbaum und die gesamte Git-Historie, zusätzlich nach `canary`, `decoy` und `tripwire`. Genau zwei Treffer für „Honeytoken", beide kein Sicherheitsmechanismus:

```
src/lib/assetRegistry.ts:325
   HONEY: 'Honey Token',  POLLEN: 'Pollen',  FLOWER: 'Flower Coin', …
   → Anzeigename einer Kryptowährung im Asset-Register. Kein Sicherheitsbezug.

docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md:31
   „Zusätzliche GitGuardian-Write-App/Honeytoken-Schreibrechte nicht aktivieren."
   → Eine Anweisung, die Funktion NICHT zu aktivieren.

git log --grep="honeytoken|canary|decoy|tripwire" -i   →  0 Commits
Tabelle / Spalte / Route / Alert-Pfad für Honeytoken   →  nicht vorhanden
```

### Abgrenzung: die „Honeypot"-Treffer sind etwas anderes

Eine Suche nach „honeypot" liefert rund zwanzig Treffer, darunter `GoPlusHoneypotSimulationEvidenceAdapter.ts` und ein zugehöriges Threat Model. Diese gehören zur Krypto-Betrugserkennung: sie bewerten, ob ein *Token am Markt* eine Honeypot-Falle für Käufer ist, die den Verkauf blockiert. Das ist ein Marktdaten-Feature zur Bewertung fremder Smart Contracts — kein Erkennungsmechanismus für Angreifer in der eigenen Infrastruktur. Die Begriffsähnlichkeit ist zufällig.

### Umsetzungsvorschlag

Die tragende Infrastruktur existiert bereits: die Tabelle `security_events` mit passendem Schema (`event_type`, `outcome`, `reason`, `endpoint`, `ip_address`, `user_agent`, `retention_hold_until`), die Alarmierung in `server/alerts.ts` und der Probe-Filter als natürlicher Einhängepunkt.

- **Pfad-Honeytoken.** Statt `/.env` und `/.git/config` nur mit 404 zu beantworten, zusätzlich ein `security_events`-Ereignis vom Typ `honeytoken_touched` schreiben. Antwortverhalten und Statuscode bleiben unverändert — der Angreifer bemerkt nichts. Diese Pfade werden nachweislich abgefragt und niemals von legitimen Nutzern.
- **Credential-Honeytoken.** Ein syntaktisch gültiger, funktionsloser API-Key in einem plausiblen Konfigurationskontext. Jede Verwendung beweist einen Datenabfluss und ist niemals ein False Positive.
- **Datensatz-Honeytoken.** Ein Marker-Konto in `profiles`, das keiner realen Person entspricht. Jeder Lesezugriff signalisiert unautorisierte Massenabfrage.

Wichtig: Ein Honeytoken ist nur so gut wie sein Alarmpfad. Angesichts von F-01 — 32 % des Auditlogs sind bereits selbst erzeugtes Rauschen — sollte die Signalhygiene *vor* dem Honeytoken hergestellt werden.

## 6 — Belegte Stärken

Geprüft und standhaltend; hier aufgeführt, damit sie bei künftigen Umbauten nicht versehentlich aufgegeben werden:

- **Lieferkette.** Null ungepinnte GitHub-Actions; jede `uses:`-Referenz trägt einen 40-stelligen Commit-SHA. Base-Images digest-gepinnt, in Builder und Runner identisch.
- **Container.** Non-Root-Ausführung über dedizierten `capitalai`-Nutzer, Artefakte gehören `root` und sind für den Laufzeitnutzer nicht schreibbar, HEALTHCHECK definiert.
- **Stripe.** Signaturprüfung über `constructEvent()` auf dem unveränderten Rohbody, korrekt vor `express.json()` registriert. Fehlende Signatur oder fehlendes Secret führen zu 400 statt zu stiller Verarbeitung.
- **Secret-Hygiene.** Keine `.env`-Datei im Repository; `.gitignore` schließt `.env*` mit gezielter Ausnahme für `.env.example` aus.
- **Wirksame CSP.** Die produktiv ausgelieferte Baseline enthält `object-src 'none'`, `base-uri 'none'`, `form-action 'self' https:`, `frame-ancestors 'self'` und `upgrade-insecure-requests`, mit 144-Bit-Nonce pro Response und `no-store` auf HTML.
- **Client-IP-Boundary.** `getClientIp()` akzeptiert `CF-Connecting-IP` ausschließlich unter der Render-Bedingung und nur bei syntaktisch valider Einzel-IP; rohes `X-Forwarded-For` ist an keiner Stelle mehr Rate-Limit- oder Audit-Authority.
- **Autorisierungsmodell.** Eine einzige kanonische Authority (`checkAdminAccess`) über Zonen und Rollensets, ohne parallele Token-Verifizierer oder zweite Rollenliste. Deny-Pfade durch echte HTTP-Tests belegt, inklusive Nachweis der Handler-Nichtausführung bei DENY.

## 7 — Priorisierte Maßnahmen

| # | Maßnahme | Bezug | Aufwand |
|---|---|---|---|
| 1 | Poll-Intervall bei 401 stoppen; `authFetch()` ohne Session abbrechen; Denial-Tupel serverseitig entprellen | F-01 | klein |
| 2 | `ip` und gekürzten `userAgent` in `request.completed` ergänzen | F-02 | klein |
| 3 | Toten CSP-String in `server.application.ts:240–249` entfernen | F-04 | trivial |
| 4 | Leaked-Password-Protection in Supabase Auth aktivieren | F-06 | trivial |
| 5 | Duplizierte Middleware auflösen — verdrahten oder löschen | F-03 | mittel |
| 6 | Explizite Policies für die neun policy-losen Tabellen; `FORCE RLS` für Audit-Tabellen | F-05 | mittel |
| 7 | Probe-Muster um Config- und CMS-Pfade erweitern | F-08 | klein |
| 8 | Honeytoken einführen — nach Umsetzung von Maßnahme 1 | §5 | mittel |
| 9 | Serverseitige AAL-/MFA-Policy als eigener Scope; `profiles`-GRANTs read-only verifizieren | F-07 | groß |

## Methodik und Einschränkungen

**Methodik.** Codeanalyse gegen `main@6b5cca8`; Live-Abfragen gegen Supabase `ryzywoktpmyhwzxmstyu` (ausschließlich read-only `SELECT`) und Render `srv-d91o1o9o3t8c73edi55g`; PR-Diffs über die GitHub-API.

**Einschränkungen.**

- Eine empirische Prüfung der Live-Response-Header war nicht möglich: die Netzwerkrichtlinie dieser Umgebung blockiert ausgehende Verbindungen zur Produktionsdomain (403 auf CONNECT). F-04 beruht daher auf Codeanalyse.
- Render stellt für diesen Dienst keine `request`-Logs bereit (verfügbare Typen: `app`, `build`); die HTTP-Auswertung beruht auf der anwendungseigenen `app`-Telemetrie.
- Die Logstichprobe umfasst 100 Warn-/Error-Ereignisse seit 2026-08-19.
- Keine Mutation an Supabase, Render, Stripe, Secrets oder DNS wurde vorgenommen.

Dieser Report ist Evidence im Sinne von `AGENTS.md` und nicht autorisierend.
