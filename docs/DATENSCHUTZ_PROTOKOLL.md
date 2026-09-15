# Datenschutz- und Verarbeitungstätigkeiten-Protokoll

**Projektbezeichnung:** CAPITAL-AI  
**Dokumenttyp:** technisches Verzeichnis / Accountability-Artefakt für DSGVO-relevante Verarbeitung  
**Version:** 2.0.0  
**Datenschutzhinweis-Version:** 2026-08-19  
**Stand:** 19. August 2026  
**Status:** intern dokumentiert; **keine behördliche, gerichtliche oder externe DSGVO-Zertifizierung**

> Dieses Dokument ist ein technisches Arbeits- und Nachweisartefakt. Es ersetzt weder eine externe Zertifizierung noch eine individuelle juristische Prüfung. Aussagen über AVV/DPA, Standardvertragsklauseln, Angemessenheitsbeschlüsse, Hosting-Regionen oder Subprozessoren gelten nur dann als bestätigt, wenn die zugehörige aktuelle Vendor-Evidence separat vorliegt.

## 1. Verantwortlicher

**Sven Michael Kulessa**  
Privatperson  
von Lepel Straße 3a  
27259 Freistatt  
Deutschland

E-Mail: `sven.kulessa@capital-ai.online`  
Support: `support@capital-ai.online`

`CAPITAL-AI` ist eine Projekt-/Produktbezeichnung und keine eigenständige juristische Person. Die früher im Repository verwendeten Bezeichnungen `Capital-AI GmbH` und `AIFinancial GmbH` sind für die Verantwortlichenrolle nicht maßgeblich und dürfen nicht als Betreiberidentität verwendet werden.

## 2. Governance-Grundsätze

Die technische Umsetzung orientiert sich an den folgenden Grundsätzen:

- Rechtmäßigkeit, Fairness und Transparenz,
- Zweckbindung,
- Datenminimierung,
- Richtigkeit,
- Speicherbegrenzung,
- Integrität und Vertraulichkeit,
- Rechenschaftspflicht,
- Privacy by Design / Privacy by Default,
- Least Privilege und fail-closed Sicherheitskontrollen.

Die aktuelle Privacy-Governance-Entscheidung ist in `docs/adr/ADR-0085-privacy-governance-single-source-of-truth.md` dokumentiert. Die Remediation-Roadmap liegt unter `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md`.

## 3. Verarbeitungstätigkeiten (technisches VVT)

Die nachfolgende Matrix bildet den im Repository identifizierten Kern der personenbezogenen Verarbeitung ab. Die öffentliche Datenschutzerklärung wird aus demselben fachlichen Modell in `src/privacy/privacyPolicy.ts` gespeist.

| Verarbeitung | Betroffene/Daten | Zweck | Arbeits-Rechtsgrundlage | Empfänger / Transfer | Speicher-/Löschkriterium |
| --- | --- | --- | --- | --- | --- |
| Konto, Auth, Profil | Registrierte Nutzer; E-Mail, Name, Land, optionale Telefonnummer, Nutzer-/Rollen-ID, MFA-Metadaten | Konto- und Zugangsverwaltung, Sicherheit | Art. 6 Abs. 1 lit. b; Sicherheitsanteile ggf. lit. f | Supabase; Subprozessor-/Drittlandlage separat nachweisen | Kontodauer; danach Löschung/Anonymisierung vorbehaltlich gesetzlicher/sicherheitsbezogener Gründe |
| Abonnement/Billing | Nutzer; E-Mail, User-ID, Tarif, Stripe-IDs, Transaktionsmetadaten | Leistung, Abrechnung, Berechtigungen | Art. 6 Abs. 1 lit. b; gesetzliche Nachweise ggf. lit. c | Stripe, Supabase | Vertragsdauer; abrechnungsrelevante Daten nach anwendbarer gesetzlicher Aufbewahrung |
| Consent-/Notice-Evidence | Nutzer; Dokumentversion, Zeitstempel, Entscheidung, IP-Hash | Nachweis von Vertragsannahme, Privacy-Notice-Kenntnisnahme und optionalem Marketing | Nachweiszwecke ggf. Art. 6 Abs. 1 lit. c; Marketingverarbeitung lit. a | Supabase | solange Nachweis erforderlich; bei Löschung ggf. Einschränkung nach Rechtslage |
| Security/IAM | Nutzer/Besucher; User-ID, IP, User-Agent, Geräte-/Endpoint-/Eventdaten, Auditwerte | Missbrauchserkennung, Zugriffssicherheit, Audit | Art. 6 Abs. 1 lit. f i. V. m. Art. 32 | autorisierte Admin-/Security-Prozesse, Supabase | Security Events Standard-Maximum 180 Tage; Incident-Evidence muss vor Purge separat gesichert werden |
| Analytics/Ads | Besucher nach Opt-in; Online-Kennungen, Cookies, Nutzungs-/Geräteinformationen | optionale Reichweitenmessung; AdSense pausiert | Art. 6 Abs. 1 lit. a + § 25 TDDDG | Google Analytics; CookieConsent selbst gehostet; Drittlandbezug bei Google möglich | nach Consent-/Provider-Konfiguration; Widerruf jederzeit; lokale GA-Cookies werden soweit technisch möglich entfernt |
| Social Publishing | Nutzer mit verknüpftem Konto; Handle, Avatar, Scopes, externe IDs, verschlüsselte OAuth-Tokens, Publish-Historie | angeforderte Social-Media-Verknüpfung und Veröffentlichung | Art. 6 Abs. 1 lit. b | verbundene Plattform, Supabase; Drittland je Plattform möglich | bis Trennung/Kontolöschung; OAuth-State kurzlebig und automatisierbar bereinigt |
| E-Mail-Alerts | Abonnenten; E-Mail, Symbol, Regel, Schwellenwert, Status | angeforderte Benachrichtigungen | Art. 6 Abs. 1 lit. b | Mail-Infrastruktur, Supabase | bis Abmeldung; unbestätigte Anmeldungen nach 14 Tagen bereinigbar |
| Quota/Nutzungssteuerung | Nutzer; E-Mail, Quota-Typ, Zähler, Zeitfenster | tarifabhängige Limits/Missbrauchsschutz | Art. 6 Abs. 1 lit. b / lit. f | Supabase | nach 90 Tagen ohne Aktualisierung bereinigbar |
| Datenschutzanfragen | Nutzer; User-ID, Request-Typ, Beschreibung, Status, Fristen | Betroffenenrechte und Nachweis der Bearbeitung | Art. 6 Abs. 1 lit. c | autorisierte Datenschutz-/Supportprozesse, Supabase | abgeschlossene Anfragen maximal 3 Jahre für Accountability, danach bereinigbar |

### 3.1 Nicht personenbezogene Markt-/Scoring-Datenflüsse

Marktpreisabfragen an CoinGecko/Stooq und serverseitige AI-/News-Scoring-Aufrufe sind nicht allein deshalb DSGVO-Verarbeitung, weil ein externer API-Provider genutzt wird. Die technische Zielvorgabe lautet, keine Nutzer-PII oder Client-IP an Markt-/Scoring-Provider weiterzureichen. Änderungen an Proxy-, Telemetrie- oder Promptpfaden müssen diese Grenze erneut prüfen.

Die bekannte Produktkennzeichnung synthetischer bzw. nicht marktdatenbasierter Scores bleibt eine separate Datenqualitäts-/FinTech-Transparenzanforderung und wird nicht als DSGVO-Zertifizierungsbeweis verwendet.

## 4. Consent und Kenntnisnahme

Die Legacy-Tabelle `user_consents` bleibt aus Kompatibilitätsgründen bestehen. Seit Migration `20260819010000_privacy_governance_and_requests.sql` wird jedoch das **rechtliche/evidenzielle Wesen** getrennt klassifiziert:

| `consent_type` | `evidence_kind` | Bedeutung |
| --- | --- | --- |
| `privacy` | `acknowledgement` | Kenntnisnahme der Datenschutzhinweise; keine pauschale Rechtsgrundlage für alle Verarbeitung |
| `terms` | `contract_acceptance` | Vertrags-/AGB-Annahme |
| `marketing` | `consent` | optionale Einwilligung |

Neue Privacy-Notice-Evidence wird ab diesem Release mit Dokumentversion `2026-08-19` gespeichert. Bestehende historische Datensätze behalten ihre tatsächliche frühere Dokumentversion.

Cookie-/Analytics-Einwilligung wird davon getrennt über selbst gehostetes CookieConsent v3 und die First-Party-Consent-Bridge verwaltet. Die Auswahl liegt im Cookie `capital_ai_consent_v3` (Revision 1, maximal 182 Tage). Alte CookieHub-Entscheidungen werden nicht übernommen. `public/google-analytics-consent.js` startet mit `denied` und lädt nur GA4 nach gültigem Analytics-Opt-in. AdSense bleibt gemäß Owner-Variante A pausiert. Diese Migration implementiert keine zentrale anonyme Consent-Log-API; lokale Auswahl ist keine serverseitige Audit-Evidence.

## 5. Betroffenenrechte

### 5.1 Self-Service-Datenauszug

`GET /api/privacy/export`

- erfordert eine verifizierte Session,
- ist rate-limited,
- liefert einen JSON-Auszug direkt dem Konto zuordenbarer Standarddaten,
- exportiert bei Social-Media-Konten **keine verschlüsselten OAuth-Tokens oder Secrets**,
- setzt `Cache-Control: no-store`,
- ersetzt kein weitergehendes formelles Art.-15-Auskunftsersuchen, wenn zusätzlicher Kontext erforderlich ist.

### 5.2 Datenschutzanfragen

`POST /api/privacy/requests`

Unterstützte Typen:

- `access`,
- `rectification`,
- `erasure`,
- `restriction`,
- `objection`,
- `portability`.

Die Anfrage wird in `public.privacy_requests` mit Status und Bearbeitungsfrist gespeichert. Nutzer können ihre eigene Historie über `GET /api/privacy/requests` abrufen.

**Löschung ist bewusst kein fingierter Sofort-Button.** Vor Abschluss einer Erasure-Anfrage müssen Auth-Daten, App-Daten, Audit-/Security-Nachweise, Billing-Retention und externe Providerzustände konsistent geprüft werden. Daten, die rechtlich oder zur Rechtsverteidigung weiter aufbewahrt werden müssen, sind soweit erforderlich einzuschränken bzw. zu anonymisieren.

## 6. Technische und organisatorische Maßnahmen

### 6.1 Zugriffsschutz

- Supabase RLS auf nutzerbezogenen Tabellen,
- privilegierter Serverclient nur mit Secret/Service-Role Credential,
- kein Fallback privilegierter Serveroperationen auf anon/publishable Keys,
- MFA/Passkey und Step-up für sensible Aktionen,
- Service-Role-only Zugriff auf besonders sensible Tabellen.

### 6.2 Geheimnisse und Tokens

- OAuth-Access-/Refresh-Tokens werden verschlüsselt gespeichert,
- Authentifizierungs-/MFA-Secrets werden nicht im Klartext an reguläre Clients persistiert,
- Privacy-Export schließt Token-/Secret-Spalten aus,
- API-/Provider-Secrets gehören ausschließlich in die Server-Environment-Ebene.

### 6.3 Consent-Gating

- Google Consent Mode Defaults: denied,
- GA4 erst nach Analytics-Opt-in,
- AdSense pausiert, auch nach „Alle akzeptieren“,
- Widerruf deaktiviert GA, bereinigt First-Party-GA-Cookies soweit möglich und lädt den Dokumentkontext neu, wenn bereits Drittanbieterskripte ausgeführt wurden.

### 6.4 Retention-as-Code

Migration `20260819010000_privacy_governance_and_requests.sql` stellt `public.purge_expired_privacy_operational_data()` bereit. Die Funktion ist nur für `service_role` ausführbar und bereinigt:

- `security_events` älter als 180 Tage,
- abgelaufene Social-OAuth-States nach zusätzlichem 1-Tages-Fenster,
- Step-up-Tokens sieben Tage nach Ablauf,
- Quota-Datensätze nach 90 Tagen Inaktivität,
- unbestätigte Alerts nach 14 Tagen,
- abgeschlossene/abgelehnte Privacy Requests nach drei Jahren.

Die Funktion löscht bewusst **keine** generischen Billing-/Geschäftsunterlagen, deren Aufbewahrung von gesetzlichen oder vertraglichen Kriterien abhängt.

## 7. Provider-/Drittland-Governance

Im Code identifizierte relevante Anbieter/Provider umfassen unter anderem:

- Supabase,
- Stripe,
- Google (Analytics/AdSense und AI-Funktionen),
- CookieConsent v3 als selbst gehostete Bibliothek (kein externer CMP-Empfänger),
- vom Nutzer verbundene Social-Media-Plattformen,
- konfigurierte Mail-Infrastruktur.

Dieses Repository darf keine aktuellen AVV-/DPA-, SCC-, Angemessenheits- oder Rechenzentrumszusicherungen behaupten, wenn die zugrunde liegende Vertrags-/Provider-Evidence nicht aktuell geprüft wurde. Diese Nachweise gehören in ein getrenntes Vendor Register bzw. Compliance-Evidence-Repository.

## 8. Bekannte Restrisiken / offene Governance-Evidence

1. **Vendor-Verträge und Transfermechanismen:** außerhalb des Sourcecodes verifizieren und versionieren.
2. **Bestehende Runtime-Logs:** ältere Module können noch PII in Logmeldungen ausgeben; neue Privacy-Endpunkte tun dies nicht. Ein zentraler PII-Redaction-Layer bleibt ein eigener Hardening-Track.
3. **Vollautomatische Erasure-Orchestrierung:** bis zur transaktional getesteten Umsetzung erfolgt Löschung als kontrollierter Request-Workflow.
4. **Aufbewahrungsfristen für Geschäftsunterlagen:** anhand des tatsächlichen Geschäfts-/Steuerstatus rechtlich bestätigen.
5. **Externe Zertifizierung:** keine vorhanden bzw. im Repository nicht nachgewiesen; daher keine öffentliche Zertifizierungskennzeichnung.

## 9. Konformitätsstatus

Der zulässige Produktstatus lautet sinngemäß:

> **Datenschutzkontrollen intern dokumentiert — keine behördliche, gerichtliche oder externe DSGVO-Zertifizierung.**

Nicht zulässig ohne externe Evidence sind insbesondere Aussagen wie:

- `DSGVO VERIFIZIERT`,
- `DSGVO-zertifiziert`,
- `gerichtsfest`,
- `Zertifiziert (Art. 32)`,
- `richterlich freigegeben`,
- sonstige Formulierungen, die eine externe Prüfung oder amtliche Anerkennung suggerieren.

## 10. Änderungs- und Reviewprozess

Änderungen an personenbezogenen Datenflüssen müssen mindestens folgende Artefakte auf Korrelation prüfen:

1. `src/privacy/privacyPolicy.ts`,
2. `src/components/Datenschutz.tsx`,
3. dieses VVT/Datenschutzprotokoll,
4. Supabase-Migrationen / Retention,
5. Vendor-/Transfer-Evidence,
6. Auth-/Consent-Flows,
7. Tests für Controller-Identity und öffentliche Compliance-Claims.

Vor Merge eines Privacy-Branches ist der Branch erneut gegen den aktuellen `main` zu vergleichen. Neue Main-Änderungen an Auth, Logging, Datenbank, Billing, Social, Analytics oder Legal UI sind auf Konflikte mit diesem Datenschutzmodell zu bewerten.

