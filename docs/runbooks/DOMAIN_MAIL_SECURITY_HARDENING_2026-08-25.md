# CAPITAL-AI Domain- und Mail-Security-Hardening

**Dokumentstatus:** ACTIVE RUNBOOK / NON-AUTHORIZING EXECUTION PACKAGE  
**Datum:** 2026-08-25  
**Scope:** `capital-ai.online`  
**Repository-Sync-Baseline:** `main@b08b8e0b73e5413aeec286a3522a85448c3e3421`  
**Produktions-Baseline:** verifizierter `main`-Deploy `b08b8e0b73e5413aeec286a3522a85448c3e3421`, GitHub-Workflow `32795419244`, Render-Deploy `dep-da6egogn74is73ermnfg`  
**Quellbefund:** IntoDNS.ai Scan vom 2026-08-20, Score 49/100  
**Mutation State:** `PLANNED` — DNS/TLS/Domain-/Mailprovider-Mutationen bleiben Human/Owner-geschützt

> Die SHA-Angaben dokumentieren den korrelierten Stand dieser Prüfung. Unmittelbar vor Human Merge und erneut vor jeder externen Mutation müssen `main`, Produktion, offene PRs und Providerziel read-only neu verifiziert werden. Eine historische SHA ist Evidence, keine dauerhafte Authority.

## 1. Authority und Ausführungsgrenze

Dieses Runbook konkretisiert bestehende Authority; es erzeugt keine neue:

- `/AGENTS.md` — `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` — `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`;
- `docs/architecture/adr/ADR-0013-server-composition-root-and-modular-bootstrap.md` — aktuelle Server-Composition-Grenze;
- `docs/adr/ADR-0040-csp-runtime-remediation-safe-rollout.md` — CSP-Rollout-/Response-Grenze;
- aktuelle Render-Promotion-Architektur: Render native Auto Deploy bleibt OFF; verifizierter `main`-CI-Pfad ist Deployment-Authority.

Das Dokument selbst autorisiert **keine** DNS-, Registrar-, Mailprovider- oder TLS-Mutation. Nach Human Merge ist für einen konkreten externen Change weiterhin eine explizite Owner-Freigabe auf dem verifizierten Ziel erforderlich. Fehlende, widersprüchliche oder nicht eindeutig zuordenbare Providerdaten führen zu `STOP`.

## 2. Korrelation mit aktuellem `main`

Der Branch für PR #532 wurde am 2026-08-25 von einer veralteten Merge-Base `63c2cd7660b11907c91327f220603d8caef21dad` auf `main@b08b8e0b73e5413aeec286a3522a85448c3e3421` synchronisiert.

Korrelation nach dem Sync:

- Branch enthält den aktuellen `main` vollständig;
- Netto-Scope bleibt auf dieses Runbook und `scripts/systemadmin/domainMailSecurityGovernance.test.mjs` begrenzt;
- PR #532 ist zum Prüfzeitpunkt der einzige offene PR;
- die zuvor offenen PRs #529, #530 und #531 sind in `main` enthalten;
- keine parallele Writer-/Dateiüberschneidung für die beiden #532-Pfade ist offen;
- `main`-CI `32795419244` ist erfolgreich;
- derselbe Workflow hat den exakten SHA `b08b8e0b...` über den Render-Deploy-Hook promoted und anschließend als live und healthy verifiziert.

Diese Korrelation ist ein technischer Datenintegritätsnachweis. Sie ersetzt weder Human Merge noch die spätere Owner-Freigabe für DNS/TLS/Domain-/Mailprovider-Mutationen.

## 3. Kanonische Web-Security-Pfade

### 3.1 Runtime-Entry und Composition

Nach ADR-0013 ist die Kette:

```text
server.ts
  -> import './server.application'
server.application.ts
  -> Compatibility-Composition / Middleware-Ordering
server/logger.ts::requestContext()
  -> attachSecurityResponseContext(req, res)
server/securityResponse.ts
  -> autoritative CSP-/Nonce-Response-Grenze gemäß ADR-0040
```

`server.application.ts` ist ausdrücklich ein **Compatibility-Composition-Modul**, keine neue Domain-Authority. `server/middleware/securityHeaders.ts` ist zwar als extrahierte Policy vorhanden, ist laut eigener Modul-Dokumentation aber noch **nicht** als aktiver Serverpfad umgeschaltet. Der Governance-Test darf es deshalb nicht als produktive Authority behandeln.

### 3.2 Aktive Header-Kontrollen

Der aktuelle Runtime-Pfad schützt unter anderem:

- `X-Powered-By` deaktiviert in `server.application.ts`;
- explizite Produktions-CORS-Allowlist in `server.application.ts`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: SAMEORIGIN`;
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` in Production;
- Probe-/Secret-Pfade werden früh mit 404 behandelt;
- CSP/Nonce wird autoritativ durch `server/securityResponse.ts` gesetzt und normalisiert.

### 3.3 CSP-Wahrheit statt Legacy-Stringprüfung

Der alte #532-Stand hatte den Legacy-CSP-String in `server.application.ts` als produktive Wahrheit geprüft und daraus abgeleitet, Production laufe ohne `unsafe-inline`/`unsafe-eval`. Diese Aussage ist auf aktuellem `main` **nicht kanonisch**.

`server/securityResponse.ts` implementiert gemäß ADR-0040 drei explizite Produktionsmodi:

- `baseline`;
- `report-only` — Default, sofern `CSP_MODE` nicht abweichend gesetzt ist;
- `strict`.

Die Policies sind nonce-basiert und setzen unter anderem `object-src 'none'`, `frame-ancestors 'self'`, CSP-Mode-/Policy-Evidence und im Report-Only-Modus zusätzlich `Content-Security-Policy-Report-Only`. Die Baseline enthält aktuell bewusst `unsafe-eval`; daher darf kein Audit-/Runbooktext behaupten, Production sei allein aufgrund des Legacy-Strings vollständig frei davon.

**Decision:** Der IntoDNS-CSP-Finding vom 2026-08-20 wird nicht durch eine zweite CSP-Implementierung repariert. Der kanonische Post-Check prüft die tatsächlich ausgelieferten Header und den `X-CSP-Mode` der Live-Response. Unterschiedliche CSP-Quellen dürfen nicht als parallele Authority fortgeschrieben werden.

## 4. Baseline und Findings

| Finding | Scan 2026-08-20 | Governance-Entscheidung | Zielzustand |
|---|---|---|---|
| DNSSEC | `DNSSEC signed=FAIL`, `validation=FAIL`, gleichzeitig RRSIG/Chain-of-Trust teilweise PASS | widersprüchliche Evidence; zuerst live verifizieren | signierte Zone + gültige DS-Delegation + externe Validation |
| Web IPv6 | AAAA fehlt | **Provider Exception** für Render; kein AAAA erzwingen | IPv4-only solange Render dies verlangt |
| DMARC | vorhanden, `p=none` | stufenweiser Enforcement-Rollout | `quarantine` → `reject` nach Telemetrie |
| CAA | fehlt | Render-CAs vollständig und minimal erlauben | Let's Encrypt + Google Trust Services; Wildcard-Issuance standardmäßig explizit gesperrt und nur bei verifiziertem Wildcard-Scope freigegeben |
| Mail IPv6 | fehlt | Provider Capability / Ausnahme | kein künstlicher AAAA-Record |
| SPF | vorhanden, Syntax PASS, kein `-all` | erst Sender-Inventar + Alignment | `-all` nur nach vollständiger Verifikation |
| DKIM | Scan `N/A` | produktive Mailstreams verifizieren | DKIM aktiv und DMARC-aligned |
| MTA-STS | fehlt | kontrollierter Testing→Enforce Rollout | MTA-STS + TLS-RPT |
| Blacklist | `not blacklisted=FAIL`, aber `no critical listings=PASS` | konkrete Liste/IP zuerst identifizieren | Ursache beseitigt / Delisting evidenziert |
| CSP | Scan FAIL | kanonische Runtime besitzt CSP; Live-Response neu messen | tatsächlichen CSP-Modus/Headers verifizieren |

## 5. Render-Provider-Invariante: kein AAAA erzwingen

Render Custom Domains nutzen für diesen Web-Service die dokumentierte IPv4-Konfiguration. Ein publizierter oder staler AAAA-Record kann Requests an ein nicht zuständiges IPv6-Ziel schicken.

**Control:**

- Für `capital-ai.online` und `www.capital-ai.online` **keinen AAAA-Record hinzufügen**, solange Render die Domain hostet und keine abweichende, verifizierte IPv6-Architektur freigegeben ist.
- Der IntoDNS-IPv6-Finding wird als `PROVIDER_EXCEPTION_RENDER_IPV4` dokumentiert.
- Eine zukünftige IPv6-Migration ist ein eigener Architektur-/DNS-Change mit Routing-, TLS-, Firewall- und Observability-Validation.

## 6. CAA Change Set — Owner-gated

Render dokumentiert für Custom-Domain-TLS zwei zulässige Certificate Authorities: Let's Encrypt (`letsencrypt.org`) und Google Trust Services (`pki.goog`). Nach RFC-CAA-Semantik autorisieren normale `issue`-Records ohne vorhandenen `issuewild`-Record auch Wildcard-Zertifikate. Deshalb enthält der aktuell dokumentierte Apex-/`www`-Scope zusätzlich ein explizites `issuewild ";"` als Fail-Closed-Deny für Wildcard-Issuance. Ein später verifizierter Render-Wildcard-Custom-Domain-Scope darf diesen Deny-Record nur nach read-only Verifikation und separater Owner-Freigabe durch die exakt benötigten Render-Wildcard-CAs **ersetzen**. Der Google-Parameter `cansignhttpexchanges=yes` gehört zu Signed HTTP Exchange (SXG) und wird für normales Render-TLS bewusst **nicht** gesetzt.

Vorgesehener minimaler Satz für `capital-ai.online` ohne Wildcard-Scope:

```dns
@ CAA 0 issue "letsencrypt.org"
@ CAA 0 issue "pki.goog"
@ CAA 0 issuewild ";"
```

Falls später ein verifizierter Render-Wildcard-Scope erforderlich ist, muss der Deny-Record `@ CAA 0 issuewild ";"` ersetzt werden. Zulässig sind dann exakt diese Wildcard-Rechte:

```dns
@ CAA 0 issuewild "letsencrypt.org"
@ CAA 0 issuewild "pki.goog"
```

Der Deny-Record und erlaubende `issuewild`-Records dürfen nicht gleichzeitig als Zielkonfiguration dokumentiert oder publiziert werden.

### Pre-Check

1. aktuellen CAA-Satz live lesen;
2. aktuellen TLS-Issuer für Apex und `www` dokumentieren;
3. Render Custom Domain Status = verified bestätigen;
4. verifizieren, dass keine weitere bewusst verwendete CA ausgeschlossen wird;
5. verifizieren, ob überhaupt ein Render-Wildcard-Domain-Scope existiert; ohne verifizierten Wildcard-Scope bleibt `@ CAA 0 issuewild ";"` verpflichtender Fail-Closed-Default.

### Post-Check

- CAA über mindestens zwei unabhängige Resolver lesen;
- Zertifikatstatus weiterhin gültig;
- HTTPS auf Apex und `www` erfolgreich;
- keine Certificate-Issuance-Warnung;
- ohne verifizierten Wildcard-Scope ist exakt der Wildcard-Deny `@ CAA 0 issuewild ";"` wirksam;
- bei verifiziertem Wildcard-Scope wurde der Deny-Record ersetzt und nur `letsencrypt.org`/`pki.goog` über `issuewild` freigegeben;
- keine SXG-spezifische CAA-Erweiterung ohne expliziten SXG-Scope.

### Rollback

Bei Zertifikats-/Renewal-Problemen den zuvor evidenzierten CAA-Satz wiederherstellen. Das gezielte `CAA 0 issuewild ";"` ist der dokumentierte Wildcard-Deny; ein separates pauschales `CAA 0 issue ";"` für normale Zertifikate darf nicht ohne Owner-Entscheidung eingeführt werden.

## 7. DNSSEC Change Set — zweiphasig und fail-closed

Der Scan ist intern widersprüchlich. Reihenfolge:

### DNSSEC-A — Read-only Baseline

- autoritative Nameserver ermitteln;
- Registrar/DNS-Provider eindeutig identifizieren;
- `DNSKEY`, `DS`, `RRSIG` und externen Validierungsstatus lesen;
- Zone/TTL und Provider-DNSSEC-Modus evidenzieren.

Wenn bereits eine vollständige gültige Chain of Trust existiert, erfolgt **keine** zweite Aktivierung.

### DNSSEC-B — nur falls wirklich unsigniert

1. DNSSEC beim autoritativen DNS-Provider aktivieren;
2. Provider-generierte DS-Daten verwenden — **keine frei erfundenen Key-Tags/Digests**;
3. DS beim Parent/Registrar veröffentlichen bzw. Provider-Automation bestätigen;
4. Propagation und externe Validatoren prüfen;
5. Finding erst bei `SECURE` schließen.

### STOP / Rollback

- `BOGUS`, SERVFAIL oder DS/DNSKEY-Mismatch → STOP;
- falschen DS am Parent auf den zuvor evidenzierten Zustand zurückrollen;
- keine manuell erfundenen DS-/DNSKEY-Werte.

## 8. SPF / DKIM / DMARC — Enforcement ohne Mail-Ausfall

### 8.1 Sender-Inventar ist Gate

Vor SPF- oder DMARC-Enforcement sind mindestens zu erfassen:

- primärer Mailprovider;
- Website-/Kontaktformulare;
- Transaktionsmail;
- Billing-nahe Benachrichtigungen mit Domain-Absender;
- CRM/Newsletter;
- Support-/Ticketing;
- Monitoring/Alerting;
- sonstige SaaS-Sender.

Je Sender: Envelope-From, sichtbares `From:`, SPF-Ergebnis, DKIM-`d=` und DMARC-Alignment.

### 8.2 DKIM

Jeder produktive Mailstream soll DKIM signieren. Mindestens ein gültiger Selector pro aktivem Mailprovider ist live zu verifizieren. **Private Keys** gehören ausschließlich zum Mailprovider/Secret Store und **niemals in Repository-Evidence**.

### 8.3 SPF

Der bestehende SPF-Record bleibt bis zum vollständigen Sender-Inventar unverändert. Erst nach erfolgreicher Verifikation aller legitimen Sender darf der Abschlussmechanismus auf `-all` gehärtet werden.

**STOP:** mehrere SPF-Records, >10 DNS-Lookups, unbekannte Includes oder legitime Sender außerhalb des Records.

### 8.4 DMARC Phase 0 — Monitoring

```dns
_dmarc TXT "v=DMARC1; p=none; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

Platzhalter niemals ungeprüft publizieren. Gate zum nächsten Schritt: repräsentativer Reporting-Zeitraum, keine unbekannten legitimen Sender, kritische Mailstreams aligned, Forwarding-/Mailinglisten-Risiken bewertet.

### 8.5 DMARC Phase 1 — Quarantine

```dns
_dmarc TXT "v=DMARC1; p=quarantine; pct=25; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

Nach sauberer Telemetrie `pct=50`, danach `pct=100`.

### 8.6 DMARC Phase 2 — Reject

```dns
_dmarc TXT "v=DMARC1; p=reject; rua=mailto:<DMARC_REPORT_MAILBOX>"
```

**Rollback:** bei belegtem legitimen Mailverlust eine Stufe zurück und den betroffenen Sender korrigieren. Die Rückstufung bleibt ein evidenzpflichtiger Security-Control-Change.

## 9. MTA-STS + TLS-RPT

Erst nach Live-Ermittlung der tatsächlichen MX-Hosts:

```dns
_mta-sts TXT "v=STSv1; id=<MONOTONIC_POLICY_ID>"
_smtp._tls TXT "v=TLSRPTv1; rua=mailto:<TLS_RPT_MAILBOX>"
```

Policy-URL:

`https://mta-sts.capital-ai.online/.well-known/mta-sts.txt`

Testing:

```text
version: STSv1
mode: testing
mx: <CURRENT_MX_1>
max_age: 86400
```

Nach sauberer TLS-RPT-/Hostname-Validation:

```text
version: STSv1
mode: enforce
mx: <CURRENT_MX_1>
max_age: 604800
```

**STOP:** ungültiges HTTPS auf der Policy-Subdomain, nicht passende MX-Namen, Zertifikatsfehler oder legitime Zustellfehler in TLS-RPT.

## 10. Blacklist-/Reputation-Finding

Der Scan meldet zugleich `Mail servers not blacklisted = FAIL` und `No critical blacklist listings = PASS`. Deshalb keine pauschale Delisting-Mutation.

1. aktive MX-Hosts und IPs bestimmen;
2. konkrete Liste identifizieren;
3. IP-Ownership/Shared-IP beim Mailprovider prüfen;
4. Root Cause bestimmen;
5. erst nach Behebung Delisting beantragen;
6. Post-Check und Provider-/Listen-Evidence sichern.

Keine bezahlten Delisting-Dienste ohne verifizierte Listung und Owner-Freigabe.

## 11. Ausführungsreihenfolge

```text
1. Human Merge des Repository-Pakets
2. Read-only Provider-/DNS-/TLS-/Mail-Baseline
3. Owner-Freigabe für konkretes Providerziel
4. CAA publizieren + verifizieren
5. DNSSEC nur bei verifiziert unsignierter Zone aktivieren + verifizieren
6. Sender-/DKIM-/SPF-/DMARC-Inventar abschließen
7. DMARC Quarantine stufenweise
8. MTA-STS/TLS-RPT Testing → Enforce
9. DMARC Reject
10. unabhängiger Rescan + append-only Evidence
```

Web-DNS- und Mail-Enforcement bleiben getrennte Mutationspakete. Nach jedem externen Schritt muss Erreichbarkeit/Integrität verifiziert werden, bevor der nächste startet.

## 12. Acceptance Criteria

### Web / TLS

- HTTPS Apex + `www` erfolgreich;
- gültiges Zertifikat;
- CAA enthält alle von Render benötigten CAs und sperrt Wildcard-Issuance ohne verifizierten Wildcard-Scope explizit über `@ CAA 0 issuewild ";"`;
- ein später verifizierter Wildcard-Scope ersetzt den Deny-Record durch exakt `letsencrypt.org`/`pki.goog` als `issuewild` und erweitert keine weiteren Rechte;
- keine SXG-Berechtigung ohne expliziten SXG-Scope;
- keine AAAA-Fehlroute;
- kanonischer CSP-/HSTS-/Security-Header-Pfad live bestätigt;
- ausgelieferter `X-CSP-Mode` dokumentiert.

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

Für jeden externen Change append-only mindestens:

- Zeitpunkt und Human/Owner bzw. autorisierter Executor;
- Provider/Zone/Target ohne Secrets;
- Pre-Change Baseline;
- freigegebener Record-/Policy-Diff;
- Post-Change Resolver-/TLS-/Mail-Validation;
- Rollbackstatus;
- resultierender Scan/Score;
- Mutation State: `HUMAN APPROVED` → `MUTATED` → `VERIFIED PASS` oder `FAILED / ROLLED BACK`.

## 14. Closure-Status

| Control | Status 2026-08-25 |
|---|---|
| PR #532 / Main-Sync | `SYNCED / 0 BEHIND` |
| Governance-/Canonical-Path-Korrelation | `CORRELATED / REMEDIATED IN PR` |
| Web CSP/HSTS/Headers | `IMPLEMENTED / LIVE-REVALIDATE` |
| Render IPv6 | `PROVIDER_EXCEPTION_RENDER_IPV4` |
| CAA | `PLANNED / OWNER MUTATION REQUIRED` |
| DNSSEC | `PLANNED / LIVE BASELINE REQUIRED` |
| DKIM/SPF/DMARC | `PLANNED / SENDER INVENTORY REQUIRED` |
| MTA-STS/TLS-RPT | `PLANNED / MX + POLICY HOST REQUIRED` |
| Blacklist | `INVESTIGATE / CONCRETE LIST REQUIRED` |

Das Arbeitspaket ist erst geschlossen, wenn Repository-Evidence und alle tatsächlich erforderlichen externen Mutationen konsistent sind. Repository-Merge allein ist für DNS/TLS/Domain-/Mail-Hardening kein Closure-Nachweis.