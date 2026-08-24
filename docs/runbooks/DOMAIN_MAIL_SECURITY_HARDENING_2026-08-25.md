# CAPITAL-AI Domain- und Mail-Security-Hardening

**Dokumentstatus:** ACTIVE RUNBOOK / NON-AUTHORIZING EXECUTION PACKAGE  
**Datum:** 2026-08-25  
**Scope:** `capital-ai.online`  
**Repository-Baseline:** `main@63c2cd7660b11907c91327f220603d8caef21dad`  
**Produktions-Baseline:** Render `AICapital / Finance` live auf `63c2cd7660b11907c91327f220603d8caef21dad`  
**Quellbefund:** IntoDNS.ai Scan vom 2026-08-20, Score 49/100  
**Mutation State:** `PLANNED` — DNS/TLS/Domain-Mutationen bleiben Human/Owner-geschützt

## 1. Authority und Ausführungsgrenze

Dieses Runbook konkretisiert die bestehende Governance aus:

- `/AGENTS.md` (`AUTH-GOV-AGENT-TRUST-ROOT`), insbesondere Human Merge und geschützte DNS/TLS/Domain-Mutationen;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` (`AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`), insbesondere getrennte Repository-/Produktionsmutation, Pre-/Post-Verification, Rollback und Evidence;
- bestehender Render-Produktionsarchitektur mit `autoDeploy=off`.

Das Dokument selbst autorisiert **keine** DNS-, Registrar-, Mailprovider- oder TLS-Mutation. Die Mutation erfolgt erst nach Human Merge und expliziter Owner-Freigabe auf dem verifizierten Provider-Ziel. Fehlende oder widersprüchliche Providerdaten führen zu `STOP`.

## 2. Baseline und Findings

| Finding | Scan 2026-08-20 | Governance-Entscheidung | Zielzustand |
|---|---|---|---|
| DNSSEC | `DNSSEC signed=FAIL`, `validation=FAIL`, gleichzeitig RRSIG/Chain-of-Trust teilweise PASS | widersprüchliche Evidence; zuerst live verifizieren | signierte Zone + gültige DS-Delegation + externe Validation |
| Web IPv6 | AAAA fehlt | **Provider Exception** für Render; kein AAAA erzwingen | IPv4-only solange Render dies verlangt |
| DMARC | vorhanden, `p=none` | stufenweiser Enforcement-Rollout | `quarantine` → `reject` nach Telemetrie |
| CAA | fehlt | verpflichtend, aber Render-CAs vollständig erlauben | Let's Encrypt + Google Trust Services |
| Mail IPv6 | fehlt | Provider Capability / Ausnahme | kein künstlicher AAAA-Record |
| SPF | vorhanden, Syntax PASS, kein `-all` | erst Sender-Inventar + Alignment | `-all` nur nach vollständiger Verifikation |
| DKIM | Scan `N/A` | für produktive Mailstreams verifizieren | DKIM aktiv und DMARC-aligned |
| MTA-STS | fehlt | kontrollierter Testing→Enforce Rollout | MTA-STS + TLS-RPT |
| Blacklist | `not blacklisted=FAIL`, aber `no critical listings=PASS` | konkrete Liste/IP zuerst identifizieren | Ursache beseitigt / Delisting evidenziert |
| CSP | Scan FAIL | aktueller Code enthält bereits CSP; Scan ist älter als aktuelle Produktion | Live-Revalidation statt Doppelimplementierung |

## 3. Bereits vorhandene Web-Härtung

Der aktuelle produktive Quellstand setzt in `server.application.ts` bereits:

- `X-Powered-By` deaktiviert;
- explizite CORS-Allowlist für `https://capital-ai.online` und `https://www.capital-ai.online`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: SAMEORIGIN`;
- `Content-Security-Policy` mit produktivem `script-src` ohne `unsafe-inline`/`unsafe-eval`;
- `frame-ancestors`;
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in Production;
- explizite 404-Behandlung typischer Probe-/Secret-Pfade.

**Decision:** Der CSP-Finding aus dem Scan vom 2026-08-20 wird nicht durch eine zweite CSP-Implementierung „repariert“. Er bleibt bis zum externen Post-Deployment-Headercheck `REVALIDATE`. Eine Doppelimplementierung würde unterschiedliche Policy-Quellen erzeugen.

## 4. Render-Provider-Invariante: kein AAAA erzwingen

Render Custom Domains nutzen für diesen Web-Service IPv4. Ein publizierter/staler AAAA-Record kann Requests an ein nicht zuständiges IPv6-Ziel schicken.

**Control:**

- Für `capital-ai.online` und `www.capital-ai.online` **keinen AAAA-Record hinzufügen**, solange Render die Domain hostet und keine abweichende, verifizierte IPv6-Architektur freigegeben ist.
- Der IntoDNS-IPv6-Finding wird als `PROVIDER_EXCEPTION_RENDER_IPV4` dokumentiert.
- Eine zukünftige IPv6-Migration ist ein eigener Architektur-/DNS-Change mit Firewall-, Routing-, TLS- und Observability-Validation.

## 5. CAA Change Set — bereit zur Owner-Mutation

Render stellt Zertifikate über Let's Encrypt und Google Trust Services aus. Deshalb darf die CAA-Policy **nicht** nur Let's Encrypt zulassen.

Für die Zone `capital-ai.online` ist folgender vollständiger Satz vorgesehen:

```dns
@ CAA 0 issue "letsencrypt.org"
@ CAA 0 issuewild "letsencrypt.org"
@ CAA 0 issue "pki.goog; cansignhttpexchanges=yes"
@ CAA 0 issuewild "pki.goog; cansignhttpexchanges=yes"
```

### Pre-Check

1. aktuellen CAA-Satz live lesen;
2. aktuellen TLS-Issuer für Apex und `www` dokumentieren;
3. Render Custom Domain Status = verified bestätigen;
4. sicherstellen, dass keine weitere bewusst verwendete CA ausgeschlossen wird.

### Post-Check

- CAA über mindestens zwei unabhängige Resolver abfragen;
- Render-Zertifikatstatus weiterhin `issued/valid`;
- HTTPS auf Apex und `www` weiterhin erfolgreich;
- keine Certificate-Issuance-Warnung in Render.

### Rollback

Bei Zertifikats-/Renewal-Problemen den zuvor evidenzierten CAA-Satz wiederherstellen. Kein „CAA 0 issue \";\"“ als Schnellfix ohne Owner-Entscheidung.

## 6. DNSSEC Change Set — zweiphasig und fail-closed

Der Scan ist intern widersprüchlich. Deshalb ist die Reihenfolge verbindlich:

### Phase DNSSEC-A — Baseline

- autoritative Nameserver ermitteln;
- Registrar/DNS-Provider eindeutig identifizieren;
- `DNSKEY`, `DS`, `RRSIG` und Validierungsstatus extern lesen;
- aktuelle Zone/TTL und Provider-DNSSEC-Modus als Evidence sichern.

Wenn bereits eine vollständige gültige Chain of Trust existiert, wird **keine** zweite Aktivierung vorgenommen; der Scan-Finding wird als Scanner-/Timing-Fehlklassifikation behandelt.

### Phase DNSSEC-B — Aktivierung, nur falls wirklich unsigniert

1. DNSSEC beim **autoritativen DNS-Provider** aktivieren;
2. Provider-generierte DS-Daten übernehmen — keine frei erfundenen Key-Tags/Digests;
3. DS beim Parent/Registrar veröffentlichen bzw. Provider-Automation bestätigen;
4. Propagation abwarten und externe Validation durchführen;
5. erst bei `SECURE`/gültiger Chain Finding schließen.

### STOP / Rollback

- `BOGUS`, SERVFAIL oder DS/DNSKEY-Mismatch → weitere Änderungen stoppen;
- falschen DS am Parent entfernen bzw. auf den zuvor evidenzierten Zustand zurückrollen;
- DNSSEC nie durch manuell erfundene DS-/DNSKEY-Werte „reparieren“.

## 7. SPF / DKIM / DMARC — Enforcement ohne Mail-Ausfall

### 7.1 Sender-Inventar ist Gate

Vor SPF- oder DMARC-Enforcement müssen alle legitimen Absender erfasst sein, mindestens:

- primärer Mailprovider;
- Website-/Kontaktformulare;
- Transaktionsmail;
- Billing/Stripe-nahe Benachrichtigungen, soweit Domain-Absender genutzt werden;
- CRM/Newsletter;
- Support-/Ticketing;
- Monitoring/Alerting;
- sonstige SaaS-Sender.

Für jeden Sender sind Envelope-From, sichtbares `From:`, SPF-Ergebnis, DKIM-`d=` und DMARC-Alignment zu dokumentieren.

### 7.2 DKIM

**MUST:** Jeder produktive Mailstream soll DKIM signieren. Mindestens ein gültiger Selector pro aktivem Mailprovider ist live zu verifizieren. Private Keys gehören ausschließlich zum Mailprovider/Secret Store und niemals in Repository-Evidence.

### 7.3 SPF

Der bestehende SPF-Record bleibt bis zum vollständigen Sender-Inventar unverändert. Erst wenn alle legitimen Sender enthalten und Testmails erfolgreich sind, darf der Abschlussmechanismus auf `-all` gehärtet werden.

**STOP:** Mehrere SPF-Records, >10 DNS-Lookups, unbekannte Includes oder legitime Sender außerhalb des Records.

### 7.4 DMARC Phase 0 — Monitoring

Aktueller Scanstatus `p=none` ist für die Inventarisierung zulässig. Reporting wird nur aktiviert, wenn ein tatsächlich existierendes, zugriffskontrolliertes Reporting-Postfach bestätigt wurde.

Template, **nicht ohne ersetzten Platzhalter publizieren**:

```dns
_dmarc TXT "v=DMARC1; p=none; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

Gate zum nächsten Schritt:

- mindestens ein repräsentativer Reporting-Zeitraum ausgewertet;
- keine unbekannten legitimen Sender;
- alle kritischen Mailstreams bestehen SPF- oder DKIM-Alignment;
- Forwarding/Mailinglisten-Risiken bewertet.

### 7.5 DMARC Phase 1 — Quarantine

Kontrollierter Rollout, zum Beispiel:

```dns
_dmarc TXT "v=DMARC1; p=quarantine; pct=25; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

Dann nach sauberer Telemetrie `pct=50` und `pct=100`.

### 7.6 DMARC Phase 2 — Reject

Erst nach vollständig sauberem Quarantine-Rollout:

```dns
_dmarc TXT "v=DMARC1; p=reject; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

**Rollback:** Bei belegtem legitimen Mailverlust eine Stufe zurück (`reject` → `quarantine`, `quarantine` → `none`) und betroffenen Sender korrigieren. Eine Rückstufung ist ein Security-Control-Change und muss evidenziert werden.

## 8. MTA-STS + TLS-RPT

MTA-STS wird erst nach Live-Ermittlung der tatsächlich aktiven MX-Hosts konfiguriert.

### DNS Discovery

```dns
_mta-sts TXT "v=STSv1; id=<MONOTONIC_POLICY_ID>"
_smtp._tls TXT "v=TLSRPTv1; rua=mailto:<TLS_RPT_MAILBOX>"
```

### Policy Host

Die Policy muss über exakt folgenden Host via gültigem HTTPS bereitgestellt werden:

`https://mta-sts.capital-ai.online/.well-known/mta-sts.txt`

Testing-Template:

```text
version: STSv1
mode: testing
mx: <CURRENT_MX_1>
max_age: 86400
```

Bei mehreren MX-Hosts ist je passendem Muster eine `mx:`-Zeile aufzunehmen.

Nach TLS-RPT-Auswertung und erfolgreicher TLS-/Hostname-Validation:

```text
version: STSv1
mode: enforce
mx: <CURRENT_MX_1>
max_age: 604800
```

**STOP:** MTA-STS-Subdomain ohne gültiges HTTPS, nicht passende MX-Namen, Zertifikatsfehler oder TLS-RPT mit legitimen Zustellfehlern.

## 9. Blacklist-/Reputation-Finding

Der Scan meldet gleichzeitig `Mail servers not blacklisted = FAIL` und `No critical blacklist listings = PASS`. Das Finding wird deshalb nicht pauschal als Spam-Blocklist-Vorfall gewertet.

Verbindliche Untersuchung:

1. aktive MX-Hosts und deren A/AAAA-Adressen bestimmen;
2. konkrete Liste identifizieren;
3. prüfen, ob die gelistete IP dem eigenen Mailprovider zugeordnet ist;
4. bei realem Finding Root Cause bestimmen (Compromise, Shared-IP-Reputation, Fehlklassifikation, Bounce-/Spam-Verhalten);
5. erst nach Behebung Delisting beim Listenbetreiber beantragen;
6. Post-Check und Provider-Ticket/Delisting-Evidence dokumentieren.

Keine bezahlten „Delisting Services“ ohne verifizierte Listung und Owner-Freigabe.

## 10. Optional / nicht merge-blockierend

- BIMI: erst nach stabiler DMARC-`p=quarantine`/`reject`-Policy und Marken-/VMC-Anforderungen bewerten.
- DANE/TLSA: nur mit stabiler DNSSEC-Chain und passender Mailserver-Ownership.
- HTTPS/SVCB: Optimierung, kein Ersatz für A/CNAME/TLS-Härtung.
- IPv6 für Mail: nur wenn Mailprovider es nativ und supportet anbietet.

## 11. Ausführungsreihenfolge

```text
1. Human Merge dieses Runbooks / CI-Evidence
2. Read-only Provider- und Live-DNS-Baseline
3. Owner-Freigabe für konkreten DNS-Zielprovider
4. CAA publizieren und verifizieren
5. DNSSEC nur bei verifiziert unsignierter Zone aktivieren und verifizieren
6. Sender-/DKIM-/SPF-/DMARC-Inventar abschließen
7. DMARC Quarantine stufenweise
8. MTA-STS/TLS-RPT Testing → Enforce
9. DMARC Reject
10. IntoDNS/independent rescan + append-only Evidence
```

CAA und DNSSEC dürfen nur in einer Reihenfolge ausgeführt werden, in der nach jedem Schritt DNS- und HTTPS-Erreichbarkeit verifiziert wird. Mail-Enforcement ist davon getrennt und darf nicht durch einen Web-DNS-Change erzwungen werden.

## 12. Acceptance Criteria

### Web / TLS

- HTTPS Apex + `www` erfolgreich;
- gültiges Zertifikat;
- CAA enthält alle von Render benötigten CAs;
- keine AAAA-Fehlroute zur Render-Domain;
- CSP/HSTS und bestehende Security Header live bestätigt.

### DNSSEC

- DNSKEY/RRSIG vorhanden;
- DS am Parent passt;
- mindestens zwei unabhängige Validatoren melden `SECURE`;
- keine SERVFAIL-/BOGUS-Antworten.

### Mail

- SPF genau einmal vorhanden und syntaktisch gültig;
- DKIM für alle produktiven Mailstreams valide;
- DMARC-Alignment stabil;
- `p=reject` erst nach erfolgreichem Stufenrollout;
- MTA-STS `enforce` erst nach erfolgreichem Testing;
- keine ungeklärte aktive Blocklist-Listung.

## 13. Evidence Minimum

Für jeden externen Change werden append-only mindestens dokumentiert:

- Zeitpunkt und ausführender Human/Owner bzw. autorisierter Executor;
- Provider/Zone/Target ohne Secrets;
- Pre-Change DNS-/TLS-/Mail-Baseline;
- freigegebener Record-/Policy-Diff;
- Post-Change Resolver-/TLS-/Mail-Validation;
- Rollbackstatus;
- resultierender Scan/Score;
- Mutation State: `HUMAN APPROVED` → `MUTATED` → `VERIFIED PASS` oder `FAILED / ROLLED BACK`.

## 14. Aktueller Closure-Status

| Control | Status 2026-08-25 |
|---|---|
| Web CSP/HSTS/Headers im aktuellen Source | `IMPLEMENTED / LIVE-REVALIDATE` |
| Render IPv6 | `PROVIDER_EXCEPTION_RENDER_IPV4` |
| CAA | `PLANNED / OWNER MUTATION REQUIRED` |
| DNSSEC | `PLANNED / LIVE BASELINE REQUIRED` |
| DKIM/SPF/DMARC | `PLANNED / SENDER INVENTORY REQUIRED` |
| MTA-STS/TLS-RPT | `PLANNED / MX + POLICY HOST REQUIRED` |
| Blacklist | `INVESTIGATE / CONCRETE LIST REQUIRED` |

Das Arbeitspaket ist erst geschlossen, wenn die geschützten externen Mutationen separat autorisiert, durchgeführt und post-verifiziert wurden. Repository-Merge allein ist kein Closure-Nachweis.