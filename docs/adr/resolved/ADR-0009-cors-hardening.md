# ADR-0009: CORS Hardening für Entwicklungs- und Produktionsumgebung

## Status

**Accepted**

## Implementation-Status

✅ **COMPLETE** (verifiziert 2026-07-30) — feste Produktions-Allowlist (`capital-ai.online`,
`www.capital-ai.online`), `AI_STUDIO_ORIGIN` nur außerhalb Produktion, Credentials nur für
validierte Origins, blockierte Origins werden nach `security_events` geloggt. Umgesetzt in
`server.ts`. Bewusste Abweichung vom ADR-Text: `x-orchestrator-admin-token` wurde NICHT als
erlaubter Header übernommen, da der zugehörige Legacy-Token-Mechanismus in ADR-0003.5
entfernt wurde (server/orchestrator.ts nutzt jetzt JWT via `checkAdminAccess()`).

## Datum

2026-07-14

## Verantwortlich

Capital-AI Architecture Team

## Kontext

Capital-AI verwendet eine moderne Webanwendungsarchitektur bestehend aus:

- React Frontend
- Node.js / Express Backend
- Supabase Authentication
- Stripe Billing Infrastruktur
- KI-Service Layer
- Orchestrator Architektur
- Entwicklungsumgebung mit Google AI Studio
- Produktionsumgebung unter https://capital-ai.online

Die Anwendung verarbeitet sensible Datenbereiche:

- Benutzerkonten
- Subscription Informationen
- Scoring Ergebnisse
- KI-Analysen
- Enterprise Funktionen
- interne Orchestrator Schnittstellen

Die bisherige CORS-Konfiguration erlaubt nicht ausreichend restriktiv definierte Origins.

Eine unzureichende CORS-Konfiguration kann dazu führen, dass:

- fremde Webseiten API-Anfragen initiieren können
- Benutzer-Sessions missbraucht werden
- Authentifizierungsinformationen übertragen werden
- interne API-Endpunkte unerwünscht erreichbar werden
- Manipulationsversuche gegen Backend-Funktionen erfolgen

CORS stellt zwar keine vollständige Zugriffskontrolle dar, ist aber ein wichtiger Bestandteil der Browser-basierten Sicherheitsarchitektur.

---

## Problemstellung

Die Anwendung benötigt eine klare Trennung zwischen:

1. Entwicklungsumgebung

und

2. Produktionsumgebung


Dabei müssen beide Umgebungen gegen unautorisierte Fremdzugriffe geschützt werden.

Aktuelle Risiken:

- fehlende oder unvollständige Origin-Whitelist
- Nutzung von Wildcards (`*`)
- unkontrollierte lokale Entwicklungsfreigaben
- unkontrollierte Google AI Studio Origins
- fehlende Überwachung blockierter Origins

---

## Ziel

Einführung eines zentral kontrollierten CORS Security Layers.

Der Security Layer soll:

- ausschließlich bekannte Origins akzeptieren
- unbekannte Origins blockieren
- Entwicklungs- und Produktionsumgebung getrennt behandeln
- keine Fremdmanipulation über Browser Requests ermöglichen
- zukünftige Erweiterungen kontrolliert ermöglichen


---

## Entscheidung

Capital-AI implementiert eine restriktive CORS-Allowlist Architektur.

Es werden keine Wildcards verwendet.

Nicht erlaubt:

```http
Access-Control-Allow-Origin: *

Erlaubt:
Access-Control-Allow-Origin:
https://capital-ai.online
Architekturentscheidung
1. Produktionsumgebung
Produktive erlaubte Origin:
https://capital-ai.online
https://www.capital-ai.online
Alle anderen Origins werden blockiert.
Beispiel:
Erlaubt:
https://capital-ai.online
Blockiert:
https://evil-domain.com
https://fake-capital-ai.com
2. Entwicklungsumgebung
Die Entwicklungsumgebung erlaubt ausschließlich:
Lokale Entwicklung
http://localhost:<port>
http://127.0.0.1:<port>
Beispiele:
http://localhost:3000
http://localhost:5173
Google AI Studio Entwicklung
Google AI Studio darf nur über explizite Freigabe erfolgen.
Die Freigabe erfolgt nicht hart codiert, sondern über Environment Variables.
Beispiel:
AI_STUDIO_ORIGIN=https://ai.studio
Dadurch bleibt die Produktionsumgebung frei von unnötigen Entwicklungsfreigaben.
Technische Umsetzung
Zentrale Origin Verwaltung
Die erlaubten Origins werden abhängig von der Umgebung geladen.
Beispiel:
const productionOrigins = [
"https://capital-ai.online",
"https://www.capital-ai.online"
];


const developmentOrigins = [
"http://localhost",
"http://127.0.0.1"
];
Sicherheitsregeln
Regel 1
Keine offenen Origins:
Nicht erlaubt:
"*"
Regel 2
Keine dynamische Freigabe unbekannter Domains
Nicht erlaubt:
res.setHeader(
"Access-Control-Allow-Origin",
req.headers.origin
);
ohne Prüfung.
Regel 3
Jede Origin wird geprüft
Beispiel:
if(originIsAllowed){

 allow();

}else{

 block();

}
Security Logging
Blockierte Origins werden protokolliert.
Beispiel:
[SECURITY]
Blocked CORS Origin:
https://unknown-domain.com
Diese Logs dienen:
Angriffserkennung
Security Monitoring
Audit Nachweis
Zusätzliche Header
Folgende Header werden verpflichtend gesetzt:
Methoden
GET
POST
PUT
DELETE
OPTIONS
Erlaubte Header
Content-Type
Authorization
stripe-signature
x-orchestrator-admin-token
Credentials Policy
Cookies und Authentifizierungsdaten dürfen ausschließlich an bestätigte Origins übertragen werden.
Aktiv:
Access-Control-Allow-Credentials:true
Voraussetzung:
Origin muss vorher validiert sein.
Preflight Handling
OPTIONS Requests werden geprüft.
Nur erlaubte Origins erhalten:
HTTP 200 OK
Nicht erlaubte Requests werden verworfen.
Entwicklungsrichtlinien
Entwickler dürfen:
lokale Ports verwenden
lokale API Tests durchführen
definierte Testumgebungen nutzen
Entwickler dürfen nicht:
globale CORS Freigaben einführen
Produktionsdomain erweitern ohne ADR
Access-Control-Allow-Origin:* verwenden
Produktionsrichtlinien
Änderungen an:
erlaubten Domains
CSP Regeln
Security Headern
benötigen:
Code Review
Security Prüfung
ADR Aktualisierung
Nicht gewählte Alternativen
Alternative 1
Globale Freigabe:
*
Ablehnung:
Zu hohes Risiko für:
Session Missbrauch
Cross-Site Requests
Datenzugriffe
Alternative 2
Nur Frontend-Schutz
Ablehnung:
CORS ersetzt keine Backend-Sicherheit.
Zusätzlich notwendig:
IAM
Supabase RLS
API Authorization
Rate Limiting
Audit Logging
Sicherheitsauswirkungen
Positiv
Erhöht Schutz gegen:
Cross-Origin Angriffe
API Missbrauch
Session Manipulation
unerlaubte Browser Requests
Einschränkungen
Neue Entwicklungsumgebungen müssen explizit registriert werden.
Abhängigkeiten
Diese Entscheidung betrifft:
server.ts
Express Middleware
Deployment Environment Variables
Google AI Studio Integration
Render Production Deployment
Validierung
Nach Umsetzung müssen folgende Tests durchgeführt werden:
Produktions-Test
Erlaubt:
https://capital-ai.online
Blockiert:
https://test-attacker-domain.com
Entwicklungs-Test
Erlaubt:
localhost
Blockiert:
fremde Domains
Rollback
Bei Problemen kann die vorherige Middleware-Konfiguration wiederhergestellt werden.
Ein Rollback darf nur temporär erfolgen und benötigt eine erneute Security Bewertung.
Ergebnis
Capital-AI verwendet eine kontrollierte CORS-Allowlist Architektur.
Entwicklungs- und Produktionsumgebung sind logisch getrennt und gegen unautorisierte Browser-basierte Fremdzugriffe geschützt.
Diese Architekturentscheidung ist Bestandteil der Capital-AI Security Baseline.

---

## Nachtrag 2026-08-11 — Abschaltung der Google-AI-Studio-Origin-Ausnahme (Q6)

Google AI Studio wird nicht mehr als Entwicklungsumgebung für CAPITAL-AI verwendet (siehe
`.env.example`-Historie). Die in diesem ADR beschriebene, ausschließlich außerhalb der
Produktionsumgebung wirksame `AI_STUDIO_ORIGIN`-Ausnahme (§ "Google AI Studio Entwicklung") ist
damit obsolet und wurde vollständig entfernt, inklusive aller aktiven und noch nicht verdrahteten
(ADR-0014-Dekompositions-)Duplikate der Origin-/CSP-Logik:

- `server.application.ts` — inline `isOriginAllowed()` (CORS) und `frameAncestors` (CSP) verlieren
  den `AI_STUDIO_ORIGIN`-Zweig; die Konstante entfällt vollständig.
- `server/middleware/cors.ts` — extrahierte, noch nicht aktiv verdrahtete Kopie von
  `isOriginAllowed()`, ebenso bereinigt, damit eine künftige Kompositions-Umstellung die
  Ausnahme nicht versehentlich wieder einführt.
- `server/middleware/securityHeaders.ts` — `buildFrameAncestors()`, dieselbe Bereinigung.
- `server/securityResponse.ts` — `buildDevelopmentCsp()`s `frame-ancestors` (aktiv über
  `attachSecurityResponseContext()`/`server/logger.ts` im Entwicklungsmodus wirksam).
- `.env.example`, `server/_.env.example`, `render.yaml` — `AI_STUDIO_ORIGIN`-Variable und
  zugehörige Kommentare entfernt.

Die übrige CORS-Architektur (feste Produktions-Allowlist, `localhost`/`127.0.0.1`-Ausnahme nur
außerhalb Produktion, Security-Event-Logging blockierter Origins, keine Wildcards) bleibt
unverändert bestehen und ist von diesem Nachtrag nicht betroffen. Referenz: `docs/seo/
SEO_MANAGEMENT_ROADMAP.md`, Punkt `Q6`.