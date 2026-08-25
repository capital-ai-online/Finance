# CAPITAL-AI — Vollständiger Architektur-Sicherheitscheck (2026-08-25)

**Status:** Evidence / Review-Ergebnis — nicht-autorisierend gemäß `AGENTS.md`; Merge-/Produktionsentscheidungen bleiben Human/Owner-gated.  
**Scope:** Auth/Session, Autorisierung, API, Supabase/RLS, Secrets/Config, CI/Supply Chain, Stripe, Frontend, KI-/Agent-Orchestrierung, Social-Media-Publishing.  
**Validierungsprinzip:** Nur code- oder pipelinebelegte Fixes werden als geschlossen markiert. Dokumentbehauptungen allein gelten nicht als Remediation-Evidence.

## Executive Summary

Der Review bestätigt robuste Kernkontrollen wie SHA-gepinnte Actions, digest-gepinnte Images, serverseitige Stripe-/IAM-Kontrollen und fail-closed Production-Secrets. Die wesentlichen Risiken lagen an Trust Boundaries und an der Differenz zwischen UI-/Dokumentbehauptung und serverseitig verifizierter Authority.

Im Follow-up dieses PRs wurden zwei zunächst zu optimistisch als behoben dokumentierte Punkte erneut geprüft:

1. **Session-Restore (#3):** vorher weiterhin fail-open, weil `mcc_user_session` vor Supabase-Revalidierung als authentifizierter UI-Zustand gerendert wurde. Das ist jetzt korrigiert: außerhalb des expliziten Local-Dev-Gates wird kein Custom-LocalStorage-Objekt als Authentifizierungsauthority restauriert; fehlende/fehlerhafte Supabase-Revalidierung leert den Zustand fail-closed.
2. **Client-IP (#7):** die erste Remediation über `app.set('trust proxy', 1)` war zu breit. Sie wurde zurückgenommen. Rate-Limit-/Request-Orchestrator-Identität verwendet nun die zentrale `getClientIp()`-Boundary: auf Render ausschließlich syntaktisch valides `CF-Connecting-IP`, ansonsten direkte Express-/Socket-Peer-IP. Rohes `X-Forwarded-For` ist keine Rate-Limit-Authority mehr.

Ein begrenzter Rest von #7 bleibt bestehen: der ältere inline CORS-Auditpfad in `server.application.ts::logBlockedOrigin()` schreibt weiterhin eine aus `X-Forwarded-For` abgeleitete IP in `security_events`. Das beeinflusst keine Auth-/Rate-Limit-Entscheidung, kann aber Audit-Provenance verfälschen und muss separat bereinigt werden.

## Befundstatus

| # | Befund | Schweregrad | Verifizierter Status |
|---|---|---:|---|
| 1 | LLM konnte Dokumentänderungen selbst autorisieren | Kritisch | **Behoben im PR** — Schreibpfad auf ReviewTicket/Human Review zurückgeführt |
| 2 | App-Session persistierte Supabase Access Token zusätzlich in eigenem LocalStorage-Objekt | Hoch | **Behoben im PR** — Token aus `UserSession`-Persistenz entfernt |
| 3 | Custom LocalStorage Session wurde ohne Server-Revalidierung vertraut | Hoch | **Behoben im Follow-up** — Supabase-first, Fehler/Fehlen fail-closed |
| 4 | `documentSanitizer` behauptete Sanitisierung ohne entsprechende Kontrolle | Hoch | **Behoben im PR** — irreführende Sicherheitssemantik entfernt/gehärtet |
| 5 | `/api/chat` anonym + Rate-Limit über forgebares XFF umgehbar | Hoch | **Behoben im PR/Follow-up** — Auth-Gate + zentrale Client-IP-Boundary |
| 6 | MFA/Login-Step-Up für normale Userpfade nicht durchgängig serverseitig enforced | Hoch | **OFFEN** — eigener AuthN/AuthZ-Scope erforderlich |
| 7 | XFF konnte Rate-Limits/Audit-Provenance beeinflussen | Medium | **Teilweise behoben** — Security-Decision-Pfade geschlossen; inline CORS-Audit-Rest offen |
| 8 | Produktions-CSP enthielt `unsafe-eval` | Medium | **Behoben im PR**, durch bestehende CSP-/Build-Checks zu validieren |
| 9 | Social-Media `mediaUrl` DNS-Rebinding-/SSRF-Risiko | Medium | **Behoben im PR** — validierter/pinned Fetch-Pfad ohne Redirect |
| 10 | Governance-CI-Ausnahme nur an frei wählbaren Branch-Namen gebunden | Medium | **Behoben im PR** — Ausnahme zusätzlich an Repository/Owner gebunden |
| 11 | `profiles` Grants nicht vollständig aus Repo-Migrationen belegbar | Medium | **OFFEN** — Live-Supabase-Grant-/RLS-Evidence erforderlich |

## 1 — KI-/Dokumentations-Schreibauthority

### Risiko
Ein LLM durfte aus eigener Klassifikation/Confidence einen automatischen Dokument-Write ableiten. Das koppelte untrusted Dokumentinhalt, Modellurteil und Mutation in einer Authority.

### Remediation
`server/documentHygiene.ts` verwendet für nicht-deterministische/inhaltliche Folgeschritte keine LLM-Selbstfreigabe mehr als Schreibauthority. Der Pfad erzeugt Review-/Vorschlags-Evidence und behält den Human-Merge-Vertrag bei.

### Verbleibende Regel
LLM-Output bleibt untrusted input. Governance-/ADR-/Security-Dokumente dürfen nicht allein durch Modell-Confidence überschrieben werden.

## 2/3 — Session Token und Session Restore

### Vorher
`UserSession` enthielt einen Access Token, und `mcc_user_session` wurde beim Mount als schneller authentifizierter UI-Zustand restauriert, bevor Supabase die aktive Session bestätigt hatte. Ein Fehler in `getSession()` konnte den Cache weiter als Auth-Zustand stehen lassen.

### Nachher
- `accessToken: session.access_token` wurde aus der App-Session-Projektion entfernt.
- `mcc_user_session` bleibt höchstens eine nach validierter Session geschriebene UI-/Display-Projektion.
- Beim Start wird außerhalb des expliziten localhost+Feature-Flag-Dev-Pfads **kein** Custom-LocalStorage-Objekt als Auth-Authority gelesen.
- `supabase.auth.getSession()` ist die Restore-Authority.
- `session === null`, fehlendes Supabase oder `getSession()`-Fehler setzen `userSession` auf `null`.
- Retry-Pfade verhalten sich ebenfalls fail-closed.

### Negative Regression-Evidence
`tests/unit/sessionCompositionSecurityBoundary.test.ts` verhindert:
- Wiederaufnahme des alten `localStorage`-Fast-Paths,
- `setUserSession(parsed)` aus Custom Cache,
- Fail-open auf Supabase-Revalidierungsfehler,
- erneute Persistenz von `session.access_token` im App-Session-Objekt.

## 5/7 — Client-IP, Rate Limiting und Proxy Trust

### Vorher
Mehrere Pfade lasen `X-Forwarded-For` direkt. Ein Client konnte damit IP-basierte Bucket-/Audit-Identität beeinflussen.

### Verworfene Erstlösung
Eine globale numerische Express-Konfiguration `app.set('trust proxy', 1)` wurde im Security-Follow-up wieder entfernt. Sie hätte mehr Forwarded-Semantik (`Host`, `Proto`, IP-Hop-Modell) vertraut als für die konkrete Rate-Limit-Aufgabe erforderlich und wäre von einer unveränderlichen Proxy-Hop-Topologie abhängig gewesen.

### Aktuelle Boundary
`src/platform/Security/rateLimiter.ts::getClientIp()`:

- akzeptiert auf Render nur `CF-Connecting-IP`, wenn `process.env.RENDER === 'true'` und der Wert eine syntaktisch valide Einzel-IP ist;
- verwendet außerhalb dieses Render-Gates eine valide direkte Express-/Socket-Peer-IP;
- verwendet **nie** rohes `X-Forwarded-For` als Rate-Limit-Identität;
- liefert bei fehlender vertrauenswürdiger IP `unknown` statt einen forgebaren Header zu übernehmen.

`src/lib/requestOrchestrator.ts` und `server/middleware/cors.ts` konsumieren die zentrale Helper-Grenze.

### Regression-Evidence
`tests/unit/rateLimiterClientIp.test.ts` prüft:
- valides Render Edge-IP-Signal,
- ignoriertes XFF,
- malformed Edge Header,
- fail-closed `unknown` bei ungültigen Quellen.

### Restbefund
`server.application.ts::logBlockedOrigin()` enthält historisch noch eine lokale XFF-Auswertung für `security_events.ip_address`. Dies beeinflusst keine Authentisierung, Autorisierung oder Rate-Limit-Bucket-Entscheidung, kann jedoch die Audit-IP eines geblockten CORS-Events verfälschen. Status von Finding #7 ist deshalb **teilweise behoben**, nicht vollständig geschlossen.

## 6 — MFA / Login Step-Up

**Status: OFFEN.**

Der Review bestätigt weiterhin, dass normale Nutzerpfade nicht allein auf einer clientseitigen React-Gate-Entscheidung beruhen dürfen. Owner-/kritische Pfade besitzen separate AAL2-Kontrollen; für reguläre authentifizierte APIs ist eine systematische serverseitige AAL-/MFA-Policy-Evidence weiterhin erforderlich.

Diese Änderung wird in diesem PR nicht nebenbei implementiert, weil sie AuthN/AuthZ-Verträge und mehrere API-Grenzen betrifft und einen eigenen Threat-Model-/Regression-Scope benötigt.

## 8 — CSP

Die Produktions-CSP wurde im PR so geändert, dass der zuvor dokumentierte `unsafe-eval`-Pfad nicht als allgemeine Produktionsausnahme erhalten bleibt. Maßgeblich sind die vorhandenen CSP-Produktionspfadtests und der Production Build des Exact PR Head.

## 9 — Social-Media SSRF / DNS Rebinding

Der Publishing-Pfad verwendet nach Preflight-Validierung einen enger kontrollierten HTTPS-Abruf und folgt Redirects nicht automatisch. Damit wird die zuvor dokumentierte Diskrepanz zwischen DNS-Prüfung und anschließend unabhängig aufgelöstem Fetch reduziert bzw. geschlossen. Negative Tests/Build auf dem Exact Head bleiben maßgeblich.

## 10 — Governance Workflow Exception

Die historische Remediation-Ausnahme wird nicht mehr nur durch einen frei wählbaren Branch-String autorisiert, sondern zusätzlich an erwartetes Repository/Owner-Kontext gebunden. Die Änderung liegt in `.github/workflows/ci.yml` und `.github/workflows/pr-governance.yml` und muss deshalb durch den trusted-main Workflow-Security-Validator geprüft werden.

## 11 — Supabase `profiles` Grants

**Status: OFFEN.**

RLS-Policy-Definitionen sind vorhanden, aber die vollständige GRANT-Historie der bestehenden Tabelle ist nicht allein aus den getrackten Migrationen beweisbar. Vor einem Abschluss ist eine read-only Produktionsprüfung von `information_schema.role_table_grants`, Policies und relevanten Rollen erforderlich. Keine Supabase-Mutation wird aus diesem Review automatisch abgeleitet.

## Weitere Korrelationen

- CORS/Security-Header-Logik existiert sowohl inline in `server.application.ts` als auch modular unter `server/middleware/cors.ts`; dies bleibt ein Drift-Risiko.
- Der In-Memory-Rate-Limiter ist nur für Single-Instance-Betrieb konsistent. Horizontale Skalierung benötigt eine gemeinsame Rate-Limit-Authority statt pro Prozess separater Buckets.
- Dev-Auto-Login bleibt nur unter exakt `localhost|127.0.0.1` plus explizitem Build-Flag zulässig und darf nicht in einen Produktions-Build projiziert werden.
- Billing-/Stripe- und Owner-Merge-Gates wurden in diesem Follow-up nicht abgeschwächt.

## Security-Abschlussstatus dieses PRs

**Geschlossen / durch Codeänderung adressiert:** #1, #2, #3, #4, #5, #8, #9, #10 sowie der Security-Decision-Anteil von #7.  
**Teilweise offen:** #7 Audit-Provenance im inline CORS-Logger.  
**Offen / separates Arbeitspaket:** #6 MFA/AAL-Enforcement, #11 Supabase Grants/RLS-Live-Evidence.

Der PR darf deshalb nicht als „alle Sicherheitsrisiken vollständig behoben“ beschrieben werden. Er ist ein Architektur-Security-Review mit konkreten Remediations und explizit fortbestehenden Gates. Die Merge-Entscheidung bleibt Human/Owner-only.

## Main-Sync-/Pipeline-Korrelation 2026-08-25

Nach dem Human-Merge von PR #533 wurde dieser Branch non-destruktiv auf `main@be4077743b7d287249d61d672486e74f6fa2fb52` synchronisiert. Der Commodity-Archive-Scope aus #533 hat keinen File-Level-Overlap mit den 23 Security-Dateien dieses PRs. Die nach dem automatischen Sync zunächst als `action_required` markierten Workflow-Runs sind kein Testfehler: der Sync-Commit wurde durch `github-actions[bot]` erzeugt, während dieser PR selbst Workflow-Dateien ändert. Dieser Evidence-Commit stellt einen owner-authentifizierten aktuellen PR-Head für die erneute Exact-Head-Validierung her. Die offenen Security-Findings #6, der Audit-Provenance-Rest von #7 und #11 bleiben ausdrücklich offen und werden durch diesen Pipeline-Schritt nicht als behoben klassifiziert.
