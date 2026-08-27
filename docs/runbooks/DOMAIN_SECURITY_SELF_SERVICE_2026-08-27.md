# CAPITAL-AI Domain Security — kompakte Self-Service-Anleitung

**Status:** OPERATIVE COMPANION / NON-AUTHORIZING  
**Stand:** 2026-08-27  
**Scope:** `capital-ai.online`  
**Repository-Baseline der Prüfung:** `main@72333ebbc72a805ce32265f5e2ca08ec9fe30c83`  
**Kanonisches ausführliches Runbook:** `docs/runbooks/DOMAIN_MAIL_SECURITY_HARDENING_2026-08-25.md`

Dieses Dokument ist eine kompakte Bedienhilfe zum bestehenden Runbook. Es erzeugt keine neue DNS-, Registrar-, Render-, Mail- oder Supabase-Authority und autorisiert keine geschützte externe Mutation. Bei Widerspruch gelten `AGENTS.md`, die Accepted ADRs und das kanonische Domain/Mail-Runbook.

## 1. Aktueller technischer Stand

Seit dem IntoDNS-Scan vom 2026-08-20 wurde der Repository-Sicherheitsstand wesentlich gehärtet:

- CSP wird zentral durch `server/securityResponse.ts` gesetzt;
- die produktive Baseline-CSP enthält kein `unsafe-eval` mehr;
- `Content-Security-Policy`, `Content-Security-Policy-Report-Only`, `X-CSP-Policy` und `X-CSP-Mode` werden am kanonischen Response-Pfad erzeugt;
- `X-Powered-By` wird deaktiviert und HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy sind Bestandteil der Server-Härtung;
- Render bleibt für die aktuelle Custom-Domain-Architektur IPv4-only: **kein AAAA-Record erzwingen**;
- PR #554 wurde am 2026-08-27 in `main` gemergt und revertiert ausschließlich Commodity-P3-B1; die Domain-/Security-Pfade dieses Pakets überschneiden sich nicht.

Der alte IntoDNS-Score `49/100` ist deshalb nur historische Baseline und kein belastbarer aktueller Gesamtscore. DNS-/Mailprovider-Zustände müssen live neu gemessen werden.

## 2. Automatischer Read-only Check

Ohne Zugangsdaten und ohne Provider-Mutation:

```bash
node scripts/systemadmin/domainSecurityAudit.mjs
```

JSON-Evidence:

```bash
node scripts/systemadmin/domainSecurityAudit.mjs --json > domain-security-audit.json
```

Strikter Modus für Runtime-Regressionen:

```bash
node scripts/systemadmin/domainSecurityAudit.mjs --strict
```

Der Audit liest über zwei DNS-over-HTTPS-Resolver unter anderem A/AAAA/MX/TXT/CAA/DS/DNSKEY, DMARC, MTA-STS und TLS-RPT und prüft die ausgelieferten HTTPS-Security-Header. Er schreibt **nichts** bei DNS-, Registrar-, Render-, Mail- oder Supabase-Providern.

Statusbedeutung:

- `PASS` — Zielzustand im geprüften Teil nachweisbar;
- `MANUAL` — sichere Owner-Konfiguration erforderlich;
- `WARN` — Abweichung prüfen, aber nicht automatisch mutieren;
- `FAIL` — potenziell unsicherer oder inkonsistenter Zustand; weitere Mutationen stoppen, Ursache zuerst klären.

## 3. Manuelle Konfiguration — nur diese Reihenfolge

### A. CAA für Render

Vorher im Audit prüfen, ob bereits passende CAA-Records existieren und ob in Render tatsächlich **kein Wildcard-Custom-Domain-Scope** verwendet wird.

Ohne Wildcard-Scope:

```dns
@ CAA 0 issue "letsencrypt.org"
@ CAA 0 issue "pki.goog"
@ CAA 0 issuewild ";"
```

Danach erneut ausführen:

```bash
node scripts/systemadmin/domainSecurityAudit.mjs
```

Falls in Render später ein echter `*.capital-ai.online`-Wildcard-Scope verifiziert ist, den Deny-Record **ersetzen**, nicht ergänzen:

```dns
@ CAA 0 issuewild "letsencrypt.org"
@ CAA 0 issuewild "pki.goog"
```

**Nicht tun:** zusätzliche CAs erlauben, SXG-spezifische Berechtigungen hinzufügen oder Deny- und Allow-`issuewild` gleichzeitig pflegen, ohne dass dafür ein eigener verifizierter Scope existiert.

### B. DNSSEC

Nur durchführen, wenn der Audit keine bereits valide Chain of Trust bestätigt.

1. DNSSEC beim **autoritativen DNS-Provider** aktivieren.
2. Ausschließlich die dort erzeugten DS-Daten übernehmen.
3. DS beim Registrar/Parent veröffentlichen, falls der Provider dies nicht automatisch übernimmt.
4. Audit erneut ausführen.
5. Bei `SERVFAIL`, `BOGUS`, DS/DNSKEY-Mismatch oder `FAIL` sofort stoppen und den DS auf den zuvor dokumentierten Zustand zurückrollen.

**Nie:** Key-Tag, Algorithmus oder Digest frei erfinden.

### C. SPF und DKIM

Vor jeder SPF-Verschärfung alle legitimen Sender erfassen, zum Beispiel:

- primärer Mailprovider;
- Website-/Kontaktformular;
- Auth-/Transaktionsmail;
- Billing/Stripe-nahe Benachrichtigungen;
- Support/CRM/Newsletter;
- Monitoring/Alerting.

Für jeden Sender SPF und DKIM-Alignment prüfen. Private DKIM-Schlüssel bleiben ausschließlich beim Provider/Secret Store.

Erst wenn genau **ein** gültiger SPF-Record alle legitimen Sender umfasst, darf der Abschlussmechanismus auf:

```text
-all
```

gehärtet werden.

**STOP:** mehrere `v=spf1`-Records, unbekannte Includes, >10 SPF-DNS-Lookups oder ein legitimer Sender außerhalb des Records.

### D. DMARC stufenweise

Nicht direkt von `p=none` auf `p=reject` springen.

Monitoring:

```dns
_dmarc TXT "v=DMARC1; p=none; rua=mailto:<DEINE_DMARC_REPORT_MAILBOX>"
```

Nach sauberem DKIM/SPF-Alignment:

```dns
_dmarc TXT "v=DMARC1; p=quarantine; pct=25; rua=mailto:<DEINE_DMARC_REPORT_MAILBOX>"
```

Danach kontrolliert:

```text
pct=50
pct=100
```

Erst nach stabiler Telemetrie:

```dns
_dmarc TXT "v=DMARC1; p=reject; rua=mailto:<DEINE_DMARC_REPORT_MAILBOX>"
```

Bei belegtem legitimen Mailverlust eine Stufe zurückrollen und den betroffenen Sender korrigieren.

### E. MTA-STS und TLS-RPT

Erst nach verifizierten produktiven MX-Namen und funktionierendem TLS.

DNS-TXT für MTA-STS:

```dns
_mta-sts TXT "v=STSv1; id=<VERSIONIERTE_ID>"
```

TLS-RPT:

```dns
_smtp._tls TXT "v=TLSRPTv1; rua=mailto:<DEINE_TLS_REPORT_MAILBOX>"
```

Policy muss unter folgender HTTPS-URL erreichbar sein:

```text
https://mta-sts.capital-ai.online/.well-known/mta-sts.txt
```

Zuerst:

```text
version: STSv1
mode: testing
mx: <VERIFIZIERTER_MX_HOST>
max_age: 86400
```

Erst nach sauberer TLS-RPT-Evidence:

```text
version: STSv1
mode: enforce
mx: <VERIFIZIERTER_MX_HOST>
max_age: 604800
```

### F. CSP `strict` erst nach Produktionsevidenz

Der aktuelle Code setzt standardmäßig die availability-safe Baseline durch und liefert die strengere ADR-0040-Policy im `report-only`-Modus. Das ist beabsichtigt.

`CSP_MODE=strict` erst setzen, wenn die Report-Only-Evidence zeigt, dass alle legitimen Frontend-/Stripe-/Consent-/Marketing-Flows mit der strikten Policy funktionieren. Danach Login, Payments, Consent, Analytics und Kernnavigation testen.

## 4. Was du aktuell ausdrücklich nicht konfigurieren solltest

- **Keinen AAAA-Record** für Apex oder `www`, solange Render die aktuelle Hosting-Authority ist und kein verifizierter IPv6-Cutover existiert.
- Kein DNSSEC-DS aus Beispielwerten oder Handrechnung.
- Kein SPF `-all`, bevor das Senderinventar vollständig ist.
- Kein DMARC `reject`, bevor DKIM/SPF-Alignment und Quarantine-Telemetrie sauber sind.
- Keine Wildcard-CAA-Freigabe ohne tatsächlich verifizierten Render-Wildcard-Scope.
- Keine zweite CSP-/Security-Header-Implementierung neben `server/securityResponse.ts`.

## 5. Kompakte Abschlusskontrolle

Nach **jedem** manuellen Provider-Schritt:

```bash
node scripts/systemadmin/domainSecurityAudit.mjs --json > domain-security-audit-after.json
```

Dann mindestens prüfen:

1. Apex und `www` bleiben per HTTPS erreichbar.
2. CSP, HSTS, X-Frame-Options, X-Content-Type-Options und Referrer-Policy bleiben vorhanden.
3. Kein unerwarteter AAAA-Record wurde erzeugt.
4. CAA erlaubt nur die tatsächlich benötigten Render-CAs und besitzt eine eindeutige Wildcard-Policy.
5. DNSSEC zeigt keine inkonsistente DS/DNSKEY-Kette.
6. SPF existiert genau einmal.
7. DMARC-Stufe entspricht der zuletzt freigegebenen Phase.
8. MTA-STS/TLS-RPT werden erst auf `enforce` gehoben, nachdem Testing sauber war.

## 6. Separater aktueller Security-Punkt außerhalb DNS/Mail

Der Full-Stack-Sicherheitsreport vom 2026-08-26 führt **Supabase Leaked-Password-Protection** weiterhin als offenen manuellen Befund. Dieser Punkt ist nicht per Repository-Code lösbar und sollte separat im Supabase-Auth-Dashboard bzw. über eine dafür ausdrücklich autorisierte Management-Konfiguration aktiviert werden, sofern der verwendete Plan die Funktion unterstützt.
