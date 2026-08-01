# CAPITAL-AI ISO/IEC 27001:2022 Statement of Applicability

## Document ID

COMP-SOA-0001

## Bezug

ARCH-AUDIT-0002 (Enterprise FinTech Architecture Audit), Kapitel 4.6 (Compliance-Befund:
„ISO 27001: 0 Treffer im Code, keine Control-Zuordnung") und Kapitel 14.6 (12-Monats-Roadmap,
J6 „ISO-27001-Zertifizierungsvorbereitung").

## Version

1.0.0

## Status

Interne Vorbereitung — **kein Zertifizierungsnachweis**. Dieses Dokument ist die
codebasis-verifizierte Grundlage für eine spätere externe Zertifizierung, ersetzt aber weder
ein Independent Audit (siehe A.5.35 unten) noch die organisatorischen Entscheidungen, die eine
tatsächliche Zertifizierung voraussetzt.

## Prüfstichtag

2026-08-01

## Methodik

Jede der 93 Controls aus ISO/IEC 27001:2022 Anhang A wird einzeln bewertet, mit einer von vier
Kategorien:

| Symbol | Bedeutung |
|---|---|
| ✅ **Implementiert** | Reale Code-/Konfigurations-Evidenz vorhanden, mit Fundstelle. |
| ⚠️ **Teilweise** | Ein Teilaspekt ist technisch abgedeckt, der Rest fehlt oder ist nicht verifizierbar. |
| ❌ **Nicht implementiert** | Kein Code-/Konfigurations-Nachweis, obwohl technisch anwendbar. |
| ⬜ **N/A / Unternehmensangabe** | Control ist organisatorischer Natur (Personal, Verträge, physische Standorte, Managemententscheidungen) und aus dieser Codebasis grundsätzlich nicht ableitbar — **keine Schätzung, keine Erfindung**, konsistent mit der No-Demo-Data-Policy (`docs/DATENSCHUTZ_PROTOKOLL.md`). Wo die Cloud-Hosting-Architektur (Render, Supabase) ein physisches Control per Shared-Responsibility-Modell an den Anbieter delegiert, ist das vermerkt.

Wo die vorhandene Scanner-Zuordnung aus N6 (`server/compliance/scanners.ts`, Feld
`isoControls`) einen technischen Nachweis liefert, wird die jeweilige Scanner-ID referenziert.
Diese Auswertung ist eine **einmalige, manuelle Momentaufnahme** — sie aktualisiert sich nicht
automatisch mit dem Code. Eine spätere Automatisierung (z. B. ein Coverage-Report direkt aus
`scanners.ts`) ist in „Nicht Bestandteil dieses Dokuments" unten benannt.

## Zusammenfassung

| Kategorie | Anzahl | Anteil |
|---|---|---|
| ✅ Implementiert | 21 | 23 % |
| ⚠️ Teilweise | 28 | 30 % |
| ❌ Nicht implementiert | 12 | 13 % |
| ⬜ N/A / Unternehmensangabe | 32 | 34 % |
| **Gesamt** | **93** | **100 %** |

Von den **61 Controls, die aus dieser Codebasis grundsätzlich bewertbar sind** (93 abzüglich
32 rein organisatorischer/physischer bzw. anbieterverantworteter Controls), sind 21 vollständig
und 28 teilweise technisch abgedeckt (80 % mit mindestens teilweiser Evidenz) — 12 haben
keinen Nachweis.
Diese Quote ist **kein Zertifizierungsstatus**: ISO 27001 zertifiziert das
Informationssicherheits-Managementsystem (ISMS) einer Organisation, nicht eine Codebasis.
Ein SoA-Dokument mit überwiegend technischer Evidenz ist eine notwendige, aber nicht
hinreichende Voraussetzung.

---

## A.5 Organisatorische Controls (37)

| # | Control | Status | Evidenz / Begründung |
|---|---|---|---|
| A.5.1 | Policies for information security | ⚠️ | `docs/DATENSCHUTZ_PROTOKOLL.md` deckt Datenschutz ab; kein umfassendes ISMS-Policy-Set (Zugriffs-, Kryptografie-, Klassifizierungsrichtlinie als eigene Dokumente). |
| A.5.2 | Information security roles and responsibilities | ⬜ | Wer intern welche Sicherheitsverantwortung trägt (CISO, Security Owner), ist eine Organisationsentscheidung. Technische Rollen (`server/iam/types.ts`, `owner`/`admin`/`supervisor`) sind Zugriffsrollen, keine Sicherheitsverantwortlichkeiten. |
| A.5.3 | Segregation of duties | ⚠️ | IAM-Rollentrennung (`ADMIN_ZONE_ROLES`, `SUPERVISOR_ZONE_ROLES`, `OWNER_ONLY_ROLES`, `server/iam/types.ts`) trennt technische Zugriffsebenen; keine organisatorische Aufgabentrennung (z. B. Vier-Augen-Prinzip bei Deployments) dokumentiert. |
| A.5.4 | Management responsibilities | ⬜ | Unternehmensangabe. |
| A.5.5 | Contact with authorities | ⬜ | Unternehmensangabe. |
| A.5.6 | Contact with special interest groups | ⬜ | Unternehmensangabe. |
| A.5.7 | Threat intelligence | ⚠️ | GitHub Dependabot Alerts sind aktiv (siehe A.5.21/A.8.8) — das ist automatisierte Schwachstellen-, keine Bedrohungsintelligenz im engeren Sinn. Kein dedizierter Threat-Intel-Prozess. |
| A.5.8 | Information security in project management | ❌ | Kein dokumentierter Sicherheits-Gate in der Projektplanung (ADRs dokumentieren Architektur-, nicht Sicherheitsentscheidungen als Prozess). |
| A.5.9 | Inventory of information and other associated assets | ⚠️ | `.ai/registry/ess-registry.json` + Komponenten-Manifeste (`src/platform/*/manifest.json`) katalogisieren Softwarekomponenten; kein Inventar der Datenbestände selbst (welche PII in welcher Tabelle). |
| A.5.10 | Acceptable use of information and other associated assets | ⬜ | Unternehmensangabe. |
| A.5.11 | Return of assets | ⬜ | Unternehmensangabe (Offboarding-Prozess). |
| A.5.12 | Classification of information | ❌ | Kein Klassifizierungsschema (öffentlich/intern/vertraulich) im Code oder in Docs. |
| A.5.13 | Labelling of information | ❌ | Keine Kennzeichnung, folgt aus A.5.12. |
| A.5.14 | Information transfer | ⚠️ | TLS durch Render/Supabase (Plattform-Ebene); keine dokumentierte Data-Transfer-Vereinbarung (z. B. Auftragsverarbeitungsvertrag-Referenz). |
| A.5.15 | Access control | ✅ | `server/iam/authMiddleware.ts` (`checkAdminAccess`), RLS-Policies in `supabase/migrations/`. Scanner: SEC-04, DAT-01. |
| A.5.16 | Identity management | ✅ | Supabase Auth + `profiles.iam_role` (`supabase/migrations/20260711000000_iam.sql`). |
| A.5.17 | Authentication information | ✅ | TOTP-Secrets AES-256-GCM-verschlüsselt (`server/iam/secretCrypto.ts`), Passwort-Handling über Supabase Auth. Scanner: SEC-01. |
| A.5.18 | Access rights | ✅ | Rollenbasierte Rechtevergabe (`server/iam/types.ts`), Step-Up-Erzwingung für Owner-Aktionen (D9). Scanner: SEC-05. |
| A.5.19 | Information security in supplier relationships | ⚠️ | Stripe-Webhook-Signaturprüfung (SEC-03) ist die einzige technisch verifizierte Lieferantenbeziehung; kein formales Supplier-Risk-Assessment für Supabase/Gemini/Alpha Vantage/NewsAPI. |
| A.5.20 | Addressing information security within supplier agreements | ⬜ | Vertragsinhalte sind Unternehmensangabe; technische Teilmenge siehe SEC-03. |
| A.5.21 | Managing information security in the ICT supply chain | ⚠️ | GitHub Dependabot Alerts aktiv (12 bekannte Schwachstellen zum Prüfstichtag laut GitHub-Meldung bei Pushes dieser Session) — Erkennung vorhanden, dokumentierter Behebungsprozess fehlt. |
| A.5.22 | Monitoring, review and change management of supplier services | ❌ | Kein dokumentierter Review-Zyklus für Drittanbieter-Änderungen (z. B. Supabase/Stripe API-Versionswechsel). |
| A.5.23 | Information security for use of cloud services | ⚠️ | RLS (Supabase), Docker-Deployment (Render) sind technische Bausteine; kein formaler Cloud-Security-Review-Prozess. |
| A.5.24 | Information security incident management planning and preparation | ⚠️ | `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` (H7) deckt Deployment-/Datenvorfälle ab; kein breiterer Security-Incident-Response-Plan (z. B. Meldepflicht bei Datenpannen). |
| A.5.25 | Assessment and decision on information security events | ❌ | Kein formaler Triage-Prozess; `security_events`-Tabelle liefert Rohdaten, aber keinen dokumentierten Bewertungsworkflow. |
| A.5.26 | Response to information security incidents | ⚠️ | Break-Glass-Mechanismus (`break_glass_codes`, `supabase/migrations/20260731000400_security_events_stepup_totp.sql`) für Notfallzugriff vorhanden; kein allgemeiner IR-Playbook. |
| A.5.27 | Learning from information security incidents | ❌ | Kein dokumentierter Post-Incident-Review-Prozess. |
| A.5.28 | Collection of evidence | ⚠️ | `iam_access_log`, `audit_logs_iam`, `uploads/system_events.json` erfassen technische Nachweisspuren (D3); kein forensisches Verfahren für Beweissicherung. |
| A.5.29 | Information security during disruption | ⚠️ | H7-Runbook (Render-Rollback, Supabase-Backup-Verfahren). |
| A.5.30 | ICT readiness for business continuity | ⚠️ | H7-Runbook; keine dokumentierte/getestete DR-Übung. |
| A.5.31 | Legal, statutory, regulatory and contractual requirements | ⚠️ | `docs/DATENSCHUTZ_PROTOKOLL.md` (DSGVO-orientiert), No-Demo-Data-Policy. Finanzregulatorische Anforderungen (z. B. BaFin) sind NICHT durch echte Prüfung belegt — der vom Audit dokumentierte DEV-Fund (fabriziertes „BaFin"-Zertifikat, ARCH-AUDIT-0002 Kapitel 4.6) unterstreicht, dass hier keine ungeprüfte Behauptung stehen darf. |
| A.5.32 | Intellectual property rights | ⬜ | Unternehmensangabe. |
| A.5.33 | Protection of records | ✅ | Stripe als Single Source of Truth für Billing-Records (BIL-02). |
| A.5.34 | Privacy and protection of PII | ✅ | PII-in-Logs-Scanner (DAT-04), `docs/DATENSCHUTZ_PROTOKOLL.md`. Kein vollständiges DPIA-Dokument. |
| A.5.35 | Independent review of information security | ❌ | ARCH-AUDIT-0002 selbst ist eine interne, KI-gestützte Prüfung — kein unabhängiges externes Audit im Sinne der Norm. |
| A.5.36 | Compliance with policies, rules and standards for information security | ⚠️ | 21 automatisierte Scanner (`server/compliance/scanners.ts`) prüfen kontinuierlich technische Compliance-Aspekte; kein umfassendes Richtlinien-Compliance-Programm. |
| A.5.37 | Documented operating procedures | ✅ | GOV-01/02/03-Scanner (ADR-/ESS-Registry-/Governance-Abdeckung), H7-Runbook, CI-Pipeline (D6). |

## A.6 Personal-Controls (8)

| # | Control | Status | Evidenz / Begründung |
|---|---|---|---|
| A.6.1 | Screening | ⬜ | Unternehmensangabe. |
| A.6.2 | Terms and conditions of employment | ⬜ | Unternehmensangabe. |
| A.6.3 | Information security awareness, education and training | ⬜ | Unternehmensangabe. |
| A.6.4 | Disciplinary process | ⬜ | Unternehmensangabe. |
| A.6.5 | Responsibilities after termination or change of employment | ⬜ | Unternehmensangabe. |
| A.6.6 | Confidentiality or non-disclosure agreements | ⬜ | Unternehmensangabe. |
| A.6.7 | Remote working | ⚠️ | Step-Up-Authentifizierung + TOTP (D9) bilden eine technische Grundlage für sicheren Fernzugriff auf Admin-Zonen; keine dokumentierte Remote-Work-Richtlinie. |
| A.6.8 | Information security event reporting | ⚠️ | `security_events`-Tabelle + `system_events.json` bieten einen technischen Erfassungskanal; kein dokumentierter Melde**prozess** für Mitarbeitende. |

## A.7 Physische Controls (14)

Diese Anwendung läuft vollständig auf verwalteter Cloud-Infrastruktur (Render für Compute,
Supabase für Datenbank). Physische Sicherheit der Rechenzentren liegt im Shared-Responsibility-
Modell beim jeweiligen Anbieter — ein Nachweis erfordert deren eigene Zertifizierungen
(z. B. Supabase/AWS SOC 2), nicht Code in diesem Repository.

| # | Control | Status | Evidenz / Begründung |
|---|---|---|---|
| A.7.1 | Physical security perimeters | ⬜ | Anbieter-Verantwortung (Render/Supabase-Rechenzentren). |
| A.7.2 | Physical entry | ⬜ | Anbieter-Verantwortung. |
| A.7.3 | Securing offices, rooms and facilities | ⬜ | Anbieter-Verantwortung / Unternehmensangabe für eigene Büros. |
| A.7.4 | Physical security monitoring | ⬜ | Anbieter-Verantwortung. |
| A.7.5 | Protecting against physical and environmental threats | ⬜ | Anbieter-Verantwortung. |
| A.7.6 | Working in secure areas | ⬜ | Anbieter-Verantwortung / Unternehmensangabe. |
| A.7.7 | Clear desk and clear screen | ⬜ | Unternehmensangabe (Mitarbeiterverhalten). |
| A.7.8 | Equipment siting and protection | ⬜ | Anbieter-Verantwortung. |
| A.7.9 | Security of assets off-premises | ⬜ | Unternehmensangabe (z. B. Verschlüsselung von Mitarbeiter-Laptops). |
| A.7.10 | Storage media | ⬜ | Anbieter-Verantwortung (Supabase verwaltet die physischen Speichermedien). |
| A.7.11 | Supporting utilities | ⬜ | Anbieter-Verantwortung. |
| A.7.12 | Cabling security | ⬜ | Anbieter-Verantwortung. |
| A.7.13 | Equipment maintenance | ⬜ | Anbieter-Verantwortung. |
| A.7.14 | Secure disposal or re-use of equipment | ⬜ | Anbieter-Verantwortung / Unternehmensangabe. |

## A.8 Technologische Controls (34)

| # | Control | Status | Evidenz / Begründung |
|---|---|---|---|
| A.8.1 | User endpoint devices | ⬜ | Unternehmensangabe (Endgeräte-/MDM-Richtlinie), keine App-Ebene. |
| A.8.2 | Privileged access rights | ✅ | `server/iam/authMiddleware.ts`, Step-Up-Erzwingung. Scanner: SEC-04, SEC-05. |
| A.8.3 | Information access restriction | ✅ | RLS (DAT-01), Quota-Durchsetzung (DAT-02), verifizierte Identität in Billing (BIL-01). |
| A.8.4 | Access to source code | ⚠️ | GitHub-Repository-Berechtigungen liegen außerhalb dieser Codebasis (nicht durch Code verifizierbar); kein Nachweis über Branch-Protection-Konfiguration. |
| A.8.5 | Secure authentication | ✅ | TOTP (`server/iam/totp.ts`), Step-Up (D9), Supabase Auth. |
| A.8.6 | Capacity management | ✅ | Globales Rate-Limiting (S3, `server/iam/rateLimiter.ts`). Scanner: SEC-02. |
| A.8.7 | Protection against malware | ⚠️ | MIME-Type-Filter + 8 MB-Größenlimit für Uploads (D7, `server/ai.ts`); keine echte Signatur-/AV-Prüfung der Dateiinhalte. |
| A.8.8 | Management of technical vulnerabilities | ⚠️ | GitHub Dependabot Alerts aktiv (12 offene Meldungen zum Prüfstichtag); kein dokumentierter, terminierter Behebungsprozess. |
| A.8.9 | Configuration management | ✅ | Dockerfile (non-root `USER`, `HEALTHCHECK`, Q4), `render.yaml`, `npm run predeploy:check` (H7). |
| A.8.10 | Information deletion | ❌ | Keine dokumentierte Löschfrist/Retention-Policy für Nutzerdaten. |
| A.8.11 | Data masking | ❌ | Keine Maskierung sensibler Felder (z. B. in Logs oder Exporten) über die PII-Log-Prüfung (DAT-04) hinaus. |
| A.8.12 | Data leakage prevention | ✅ | PII-in-Logs (DAT-04), Secret-Hygiene (DAT-05). |
| A.8.13 | Information backup | ⚠️ | H7-Runbook dokumentiert das Supabase-Backup-Verfahren; die tatsächlich aktive Backup-Stufe ist laut Runbook selbst nicht programmatisch verifizierbar (manuelle Betreiber-Prüfung nötig). |
| A.8.14 | Redundancy of information processing facilities | ❌ | Einzelinstanz-Deployment (`render.yaml`, ein `web`-Service), kein Multi-Region-/Failover-Setup. |
| A.8.15 | Logging | ✅ | `server/logger.ts` (S4, Correlation-IDs), `iam_access_log` (D3). |
| A.8.16 | Monitoring activities | ✅ | `server/metrics.ts` (H6, Prometheus-Format), `GET /metrics`. |
| A.8.17 | Clock synchronization | ⚠️ | Serverzeit liegt bei Render/Supabase (NTP-Synchronisation Anbieter-Verantwortung); keine eigene Prüfung. |
| A.8.18 | Use of privileged utility programs | ⬜ | Nicht anwendbar — keine systemnahen Utility-Programme in dieser Anwendungsarchitektur. |
| A.8.19 | Installation of software on operational systems | ✅ | Docker-Image-basiertes, reproduzierbares Deployment statt manueller Software-Installation auf Produktivsystemen. |
| A.8.20 | Networks security | ⚠️ | CORS-Konfiguration (SEC-06), TLS über Hosting-Plattform; keine eigene Netzwerksegmentierung (Single-Service-Architektur). |
| A.8.21 | Security of network services | ⚠️ | HTTPS über Render/Supabase; kein eigenes Service-Mesh oder mTLS zwischen Komponenten (nicht anwendbar bei Monolith). |
| A.8.22 | Segregation of networks | ⬜ | Nicht anwendbar — Einzelservice-Architektur ohne interne Netzwerksegmente. |
| A.8.23 | Web filtering | ❌ | Nicht implementiert. |
| A.8.24 | Use of cryptography | ✅ | AES-256-GCM für TOTP-Secrets, SHA-256 für Token-Hashing (`server/iam/secretCrypto.ts`). |
| A.8.25 | Secure development life cycle | ✅ | CI-Pipeline (D6), Testsuite (D5), `predeploy:check` (H7). |
| A.8.26 | Application security requirements | ✅ | Stripe-Webhook-Signatur (SEC-03), CORS (SEC-06), Security-Header (SEC-07, N7). |
| A.8.27 | Secure system architecture and engineering principles | ⚠️ | ADRs dokumentieren Architekturentscheidungen; kein formales Bedrohungsmodell (Threat Model) für die Anwendung als Ganzes. |
| A.8.28 | Secure coding | ✅ | TypeScript strict mode, SEC-01 (hartkodierte Secrets), QUA-01 (TODO/FIXME/HACK-Marker). |
| A.8.29 | Security testing in development and acceptance | ⚠️ | Vitest-Unit-Testsuite (128 Fälle zum Prüfstichtag); kein dediziertes SAST-/Penetrationstest-Tooling. |
| A.8.30 | Outsourced development | ⬜ | Unternehmensangabe. |
| A.8.31 | Separation of development, test and production environments | ⚠️ | CI führt die Testsuite vor jedem Merge aus (Test-Gate); keine persistente Staging-Umgebung getrennt von Produktion (`render.yaml` definiert nur einen Service). Die im Audit dokumentierte Dev/Prod-Fork-Divergenz (ADR-0019) ist ausdrücklich KEINE Staging-Umgebung, sondern ein separater, unabhängiger Codestand. |
| A.8.32 | Change management | ✅ | Git-PR-Workflow + CI-Pipeline (D6) als Änderungskontrolle vor jedem Merge nach `main`. |
| A.8.33 | Test information | ⚠️ | No-Demo-Data-Policy verbietet synthetische Daten im Produktionscode; Testdaten in `tests/unit/` sind synthetisch, aber eindeutig als Tests gekennzeichnet und isoliert. |
| A.8.34 | Protection of information systems during audit testing | ❌ | Kein dokumentiertes Verfahren, das Produktivsysteme während eines externen Audits/Pentests absichert. |

---

## Nicht Bestandteil dieses Dokuments

- **Kein Zertifizierungsantrag.** Eine tatsächliche ISO-27001-Zertifizierung erfordert einen
  akkreditierten externen Auditor (adressiert A.5.35 selbst), ein vollständiges ISMS mit
  Management-Commitment, sowie die Schließung der 22 „Unternehmensangabe"-Lücken oben — das
  liegt außerhalb dessen, was aus einer Codebasis ableitbar ist.
- **Keine automatisierte Coverage-Berechnung.** Diese Bewertung ist eine manuelle Momentaufnahme
  zum Prüfstichtag. Eine spätere Automatisierung (z. B. ein Report-Endpunkt, der die
  `isoControls`-Felder aus `server/compliance/scanners.ts` gegen diese Liste abgleicht und eine
  Coverage-Quote live berechnet) ist ein sinnvoller, aber separater Ausbauschritt.
- **Keine Behebung der 14 „Nicht implementiert"-Lücken.** Wie beim P0-Rechtsrisiko-Kapitel des
  Hauptaudits (ARCH-AUDIT-0002) ist die Ausweisung hier bewusst von der Umsetzung getrennt.

## Verwandte Dokumente

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002), Kapitel 4.6, 14.6
- `server/compliance/scanners.ts` — technische Scanner mit `isoControls`-Zuordnung (N6)
- `docs/DATENSCHUTZ_PROTOKOLL.md` — No-Demo-Data-Policy, Grundlage für die ⬜-Kennzeichnung statt Schätzung
- `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` (H7) — Evidenz für A.5.24/29/30, A.8.13
