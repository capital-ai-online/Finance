# CAPITAL-AI Enterprise Production Audit

## Enterprise Report

### Document ID

ARCH-AUDIT-0001

### Version

1.0.0

### Status

Enterprise Audit — Approved for Governance Review

### Prüfstichtag

2026-07-31

### Prüfgegenstand

Produktivstand `main` bei Commit `b63a6b8`

### Prüfumfang

Code, Dokumentation, Architektur, Sicherheit

---

# Enterprise Purpose

Dieser Bericht dokumentiert einen vollständigen Enterprise-Audit der CAPITAL-AI Plattform.

Er umfasst erstmals in dieser Prüfreihe **den produktiven Anwendungscode** und nicht
ausschließlich die Governance-Dokumente.

Sämtliche Befunde beruhen auf ausgeführten Prüfungen — Build, Typprüfung, Import-Analyse,
Referenzanalyse. Es wurden keine Annahmen dokumentiert.

**Es wurde kein Code verändert.**

---

# Prüfmethodik

| Prüfung | Werkzeug | Ergebnis dokumentiert |
|---|---|---|
| Production Build | `npx vite build` | Abschnitt 5 |
| Typprüfung | `npx tsc --noEmit` | Abschnitt 5 |
| Lint | `npm run lint` | Abschnitt 5 |
| Import-Auflösung | AST-nahe Pfadanalyse über 96 Dateien | Abschnitt 5 |
| Komponentenreferenzen | Referenzzählung über gesamten Quellbaum | Abschnitt 5 |
| Sicherheits-Header | Quelltextanalyse `server.ts` | Abschnitt 8 |
| Datenbankzustand | Supabase MCP, Projekt `ryzywoktpmyhwzxmstyu` | Abschnitt 8 |

---

# Kennzahlen des Prüfgegenstands

| Größe | Wert |
|---|---|
| `server.ts` | 1.934 Zeilen |
| `server/` | 19 Dateien, 5.392 Zeilen |
| `src/` | 96 Dateien |
| React-Komponenten | 57 |
| Plattformmodule | 24 |
| ESS-Artefakte | 16 |
| ADRs | 14 |
| Produktions-Bundle | 2.656 kB (719 kB gzip) |

---

# 1. Enterprise Architecture

## 1.1 Bewertung je Schicht

| Schicht | Vollständigkeit | Architekturqualität | Skalierbarkeit | Wartbarkeit | Enterprise-Reife |
|---|---|---|---|---|---|
| Frontend | 85 | 62 | 55 | 58 | 60 |
| Backend | 80 | 55 | 45 | 40 | 48 |
| API | 75 | 58 | 50 | 45 | 52 |
| Security | 78 | 82 | 70 | 72 | **76** |
| IAM | 85 | 84 | 72 | 75 | **79** |
| Billing | 82 | 70 | 65 | 60 | 68 |
| Stripe | 85 | 78 | 75 | 70 | 77 |
| Supabase | 70 | 65 | 70 | 60 | 66 |
| AI Layer | 75 | 68 | 60 | 55 | 63 |
| ESS Layer | 98 | 95 | 90 | 88 | **93** |
| Documentary Layer | 5 | 90 | 85 | 85 | 20 |
| Supervisor Layer | 3 | 90 | 85 | 85 | 18 |
| Knowledge Layer | 0 | 92 | 88 | 85 | 15 |
| Governance Layer | 95 | 92 | 85 | 85 | **90** |

## 1.2 Befunde

**A-01 — Der Backend-Monolith ist der größte Wartbarkeitsrisikofaktor**

`server.ts` umfasst 1.934 Zeilen und verdrahtet sämtliche Router, Middleware, Security-Header
und Endpunkte in einer Datei. Zusammen mit `server/` sind das 7.326 Zeilen Backend-Code in
19 Dateien ohne Schichtentrennung.

Registriert als EXC-0002, Zielstruktur in ADR-0011 definiert.

**A-02 — Die Enterprise-Schichten existieren ausschließlich als Spezifikation**

Documentary, Supervisor und Knowledge Layer besitzen zusammen 24 Modulverzeichnisse,
16 ESS-Artefakte und 20 Contract-Kapitel — und **null Zeilen ausführbaren Code**.

Die Architekturqualität dieser Schichten ist hoch bewertet, weil die Spezifikation belastbar
ist. Die Enterprise-Reife ist niedrig, weil nichts davon läuft.

**A-03 — Security und IAM sind die reifsten produktiven Bereiche**

`server/iam/` implementiert Auth-Middleware, Rate Limiting, Secret-Verschlüsselung und TOTP.
`server/stepUp.ts` ergänzt Step-Up-Authentifizierung. Beides durch ADR-0003.5 gedeckt und als
verifiziert markiert.

**A-04 — Bundle-Größe**

Das Produktions-Bundle liegt bei 2.656 kB (719 kB gzip) in einem einzigen Chunk. Vite meldet
die Überschreitung ausdrücklich. Kein Code-Splitting, keine `manualChunks`-Konfiguration.

---

# 2. ESS-System

## 2.1 Reifegrad je Modul

| ESS | Titel | Dokument | Cross-Refs | Registry | Implementierung | Reifegrad |
|---|---|---|---|---|---|---|
| ESS-0001 | Documentary Architect | ✓ | ✓ | ✓ | entfällt (Vision) | 95 |
| ESS-0001-CONTRACTS | Technical Contracts | ✓ | ✓ | ✓ | entfällt (Vertrag) | 96 |
| ESS-0002 | Supervisor Architect | ✓ | ✓ | ✓ | ✗ | 55 |
| ESS-0003 | Platform Director | ✓ | ✓ | ✓ | ✗ | 55 |
| ESS-0004 | Version Manager | ✓ | ✓ | ✓ | Legacy vorhanden | 58 |
| ESS-0005 | Quality Center | ✓ | ✓ | ✓ | ✗ | 50 |
| ESS-0006 | Security & Compliance | ✓ | ✓ | ✓ | Legacy vorhanden | 62 |
| ESS-0007 | Release Center | ✓ | ✓ | ✓ | Teilweise (Build) | 54 |
| ESS-0008 | AI Agent Framework | ✓ | ✓ | ✓ | Legacy vorhanden | 60 |
| ESS-0009 | Knowledge Platform | ✓ | ✓ | ✓ | ✗ | 48 |
| ESS-0010 | Documentary Engine | ✓ | ✓ | ✓ | Legacy vorhanden | 58 |
| ESS-0011 | Enterprise Traceability | ✓ | ✓ | ✓ | ✗ | 50 |
| ESS-0011-CONTRACTS | ETM Contracts | ✓ | ✓ | ✓ | ✗ | 52 |
| ESS-0012 | Documentation Governance | ✓ | ✓ | ✓ | ✗ | 50 |
| ESS-0012-CONTRACTS | Governance Contracts | ✓ | ✓ | ✓ | ✗ | 52 |
| SKILL-GOV-0001 | Governance Skill | ✓ | ✓ | entfällt | ✗ | 50 |

## 2.2 Befunde

**E-01 — Keine toten Dokumente, keine Überschneidungen**

Sämtliche 16 Artefakte besitzen Dokumentklasse, vollständige Cross-References und einen
Registry-Eintrag. Die Responsibility Matrix (`ARCH-RESP-0001`) weist jedem Dokument eine
eindeutige Verantwortung sowie unzulässige Inhalte zu.

Referenzprüfung: kein Artefakt ohne eingehende Referenz.

**E-02 — Registry vollständig**

15 von 15 Einträgen mit hinterlegtem Dokument. Kein reservierter Nummernplatz ohne Dokument
(seit ADR-0016). Freier Nummernraum ab ESS-0013.

**E-03 — Der Reifegrad ist durchgängig durch die Implementierung begrenzt**

Kein ESS-Modul erreicht über 62, ausgenommen die beiden Dokumente, die naturgemäß keine
Implementierung besitzen. Die Spezifikationsqualität liegt bei 90 bis 96, die
Implementierung bei 0 bis 40.

**Das ESS-System ist der reifste Bereich der Plattform und zugleich der am wenigsten
wirksame.**

---

# 3. ADR-Abgleich

## 3.1 ADR-Matrix

| ADR | Titel | Ablage | Implementation-Status | Codebezug nachweisbar |
|---|---|---|---|---|
| ADR-0001 | Versionsstandardisierung 0.5.4 | nur `adr_history.json` | kein Dokument | ✗ überholt (jetzt 0.6.0) |
| ADR-0002 | Firestore-Persistenz | nur `adr_history.json` | kein Dokument | ✗ **kein Firestore im Code** |
| ADR-0003 | Dokumenten-Hygiene-Engine | nur `adr_history.json` | kein Dokument | ✓ `server/documentHygiene.ts` |
| ADR-0003.5 | Owner-IAM, Passkey/2FA | `resolved/` | ✅ COMPLETE | ✓ `server/iam/` |
| ADR-0004 | Branding, Panel-Entfernung | aktiv | **kein Status** | teilweise |
| ADR-0005 | Frontend-Modul-Integration | aktiv | **kein Status** | ✗ keine Module Federation |
| ADR-0006 | Plattform-Direktor | aktiv | **kein Status** | teilweise |
| ADR-0007 | Compliance-Wertschöpfungskette | aktiv | **kein Status** | ✗ Endpunkte fehlen |
| ADR-0008 | Document-Hygiene-Lifecycle-Fix | `resolved/` | ✅ COMPLETE | ✓ |
| ADR-0009 | CORS Hardening | `resolved/` | ✅ COMPLETE | ✓ `server.ts:120-183` |
| ADR-0010 | Enterprise Standard Extension | aktiv | 🟡 IN PROGRESS | ✓ Dokumente |
| ADR-0011 | Bestandsschutz Root-Abweichungen | aktiv | 🟡 IN PROGRESS | ✓ Exception Registry |
| ADR-0012 | SecurityComplianceAuditor | aktiv | 🟡 IN PROGRESS | ⚠ **defekt, siehe C-01** |
| ADR-0013 | ESS-Konsolidierung | aktiv | ✅ COMPLETE | ✓ |
| ADR-0014 | Governance Validator | aktiv | 🟡 IN PROGRESS | ✓ Struktur |
| ADR-0015 | Traceability-Komponente | aktiv | 🟡 IN PROGRESS | ✓ Struktur |
| ADR-0016 | ESS-Komponentenspezifikationen | aktiv | ✅ COMPLETE | ✓ |

## 3.2 Befunde

**D-01 — Vier ADRs ohne Implementation-Status**

ADR-0004 bis ADR-0007 führen kein Statusfeld, obwohl `docs/adr/README.md` es verbindlich
fordert. Sie sind seit dem 10.07.2026 unverifiziert.

**D-02 — ADR-0002 ist faktisch überholt**

Der ADR entscheidet Google Firestore als primäre Cloud-Datenbank. Im gesamten Quellbaum
existiert **keine Firestore-Referenz**. Die Plattform nutzt durchgängig Supabase.

Der ADR wurde weder als `SUPERSEDED` gekennzeichnet noch zurückgezogen.

**D-03 — ADR-0005 ohne Umsetzung**

Module Federation ist in `vite.config.ts` nicht konfiguriert. Der ADR beschreibt eine
Architektur, die nicht existiert.

**D-04 — ADR-0001 durch die Realität überholt**

Der ADR pinnt die Plattformversion strikt auf 0.5.4. `package.json` und `metadata.json`
führen inzwischen 0.6.0, `AGENTS.md` weiterhin 0.5.4.

---

# 4. Dokumentationsintegrität

| Bereich | Dateien | Aktualität | Vollständigkeit | Konsistenz |
|---|---|---|---|---|
| README (Root) | 1 | mittel — nennt v0.5.4 | hoch | mittel |
| API | 1 | unbekannt | mittel | ohne ESS-Bezug |
| Architecture | 9 | **hoch** | **hoch** | **hoch** |
| ADR | 19 | mittel | mittel | siehe D-01 |
| Traceability | 7 | hoch | hoch | hoch |
| Migration | 2 | hoch | hoch | hoch |
| Compliance | **0** | — | **fehlt** | — |
| Governance | in Architecture | hoch | hoch | hoch |
| Security | 1 | unbekannt | niedrig | ohne ESS-Bezug |
| Documentary | 1 | niedrig | niedrig | veraltet (v0.5.4) |
| Knowledge | **0** | — | **fehlt** | — |
| Release | **0** | — | **fehlt** | — |
| Quality | **0** | — | **fehlt** | — |

## Befunde

**DOK-01 — Vier Dokumentationsbereiche sind leer**

`docs/compliance/`, `docs/knowledge/`, `docs/release/`, `docs/quality/` enthalten
ausschließlich `.gitkeep`. Sämtliche sind in ESS-0001-CONTRACTS Chapter 2 als Ablage
vorgesehen; `docs/quality/` ist zusätzlich der vertraglich festgelegte Ablageort für
sämtliche Governance- und Traceability-Berichte.

**DOK-02 — Versionsangaben in der Dokumentation sind uneinheitlich**

`README.md`, `docs/Documentary.md` und `AGENTS.md` nennen 0.5.4; `package.json` und
`metadata.json` führen 0.6.0.

**DOK-03 — Bestandsdokumente ohne ESS- oder ADR-Referenz**

Acht Dokumente unter `docs/` besitzen keine Enterprise-Referenz. Regel `GOV-DOC-002`.

---

# 5. Codeintegrität

## 5.1 Ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npx vite build` | ✅ erfolgreich, 3.523 Module, 20,77 s |
| `npx tsc --noEmit` | ❌ **38 Fehler** |
| `npm run lint` | ❌ **Exit-Code 2** |
| TODO / FIXME / HACK | ✅ **0 Vorkommen** |
| Hardcodierte Secrets (`sk_live`, `pk_live`) | ✅ **0 Vorkommen** |
| Gebrochene lokale Imports | ❌ **1** |
| Unbenutzte Komponenten | ⚠ 1 von 57 |

## 5.2 Befunde

### C-01 — Gebrochener Import in `SecurityComplianceAuditor.tsx` (Critical)

```ts
// src/components/SecurityComplianceAuditor.tsx:23
import { ComplianceRun, ScannerResult, Finding, RemediationPlan, ComplianceCertificate }
  from '../../server/compliance/types';
```

`server/compliance/` **existiert nicht**.

**Auswirkung**

| Ebene | Wirkung |
|---|---|
| Build | läuft durch — esbuild entfernt Typ-Importe |
| Typprüfung | **19 von 38 Fehlern (50 %) entstammen dieser Datei** |
| `npm run lint` | schlägt fehl, Exit-Code 2 |
| Laufzeit | fünf Typen sind faktisch `unknown`, jeder Feldzugriff ungeprüft |

Der Import erzeugt 18 Folgefehler der Form
`Property 'name' does not exist on type 'unknown'`.

**Bewertung**

Dies ist der schwerwiegendste Codebefund des Audits. Die einzige ausführbare
Qualitätsprüfung des Projekts — `npm run lint` — ist dauerhaft rot, und zwar zur Hälfte
wegen einer einzigen Datei.

Zusammen mit dem bereits dokumentierten `FND-ADR-0012-01` (sieben nicht existierende
`/api/compliance/*`-Endpunkte) ergibt sich: **Die Komponente aus ADR-0012 ist weder
typsicher noch funktionsfähig.**

### C-02 — `npm run lint` ist dauerhaft rot (High)

38 Typfehler verteilt auf:

| Datei | Fehler |
|---|---|
| `src/components/SecurityComplianceAuditor.tsx` | 19 |
| `server/systemEvents.ts` | 4 |
| `server/stepUp.ts` | 4 |
| `src/components/Dashboard.tsx` | 1 |
| `server/stripe.ts` | 1 |
| übrige (Folgezeilen) | 9 |

Die Fehler in `server/stepUp.ts` und `server/systemEvents.ts` sind Express-Handler, die
`Promise<Response>` statt `Promise<void>` zurückgeben — ein bekanntes Typisierungsmuster,
funktional unkritisch, aber es hält den Lint rot.

### C-03 — Rate Limiter nur an zwei Stellen aktiv (High)

`server/iam/rateLimiter.ts` exportiert `checkRateLimit`. Verwendet wird es ausschließlich in
`server/stepUp.ts` und `src/lib/requestOrchestrator.ts`.

**Es existiert keine globale Rate-Limitierung auf den `/api/*`-Endpunkten.** Weder
Authentifizierung, noch Stripe-Checkout, noch die KI-Endpunkte sind gegen Missbrauch
begrenzt.

Bei einer Plattform mit kostenpflichtigen LLM-Aufrufen ist das ein unmittelbares
Kostenrisiko.

### C-04 — Simulierte Audit-Daten im Produktivpfad (Medium)

```text
server/orchestrator.ts:100
POST /api/orchestrator/create-simulated-audit
```

Der Endpunkt erzeugt simulierte Audit-Logs und schreibt sie als JSON nach `/docs/reports`.
Aufgerufen aus `src/components/AuditLogs.tsx:218`.

`AGENTS.md` legt fest:

> **No Fake or Mock Data**: Under no circumstances should fake, placeholder, or simulated
> data be served to users when real-time or persistent data is expected.

Der Endpunkt ist durch `requireOrchestratorAdmin` geschützt und damit nicht öffentlich. Er
widerspricht der Direktive dennoch, sobald erzeugte Audit-Dateien von echten nicht
unterscheidbar sind.

### C-05 — Eine unbenutzte Komponente (Low)

`src/components/MonteCarloDetailed.tsx` wird nirgends referenziert.

### C-06 — `process.env` im Frontend-Modul (Low)

`src/lib/ownerUtils.ts:23` liest `process.env.NODE_ENV`. In einem Vite-Frontend ist
`import.meta.env` der korrekte Zugriff. Funktioniert durch Vite-Substitution, ist aber
inkonsistent.

Die weiteren `process.env`-Treffer in `Abonnements.tsx` und `AdrForm.tsx` liegen in
Codebeispielen innerhalb von `<pre>`-Blöcken und sind kein ausführbarer Code.

### C-07 — Bundle ohne Code-Splitting (Medium)

Ein einzelner Chunk mit 2.656 kB (719 kB gzip). Vite meldet die Überschreitung. Kein
`manualChunks`, kein dynamisches Import-Splitting.

---

# 6. Datenintegrität

| Prüfachse | Konsistent | Befund |
|---|---|---|
| Code ↔ ESS | teilweise | Enterprise-Schichten ohne Implementierung |
| Code ↔ ADR | **nein** | ADR-0002 (Firestore), ADR-0005 (Module Federation) ohne Codebezug |
| Code ↔ Dokumentation | teilweise | Versionsangaben abweichend |
| ESS ↔ ADR | ✅ ja | sämtliche ESS-Artefakte referenzieren ADRs |
| ESS ↔ Registry | ✅ ja | 15 von 15 |
| ADR ↔ Registry | teilweise | `adr_history.json` führt ADR-0009 bis 0016 nicht |
| Contracts ↔ Validatoren | **nein** | 19 Contracts ohne Validator |
| Versionierung | **nein** | drei abweichende Stände |

## Befund DI-01 — Versionsstände weiterhin uneinheitlich

| Quelle | Version |
|---|---|
| `package.json` | 0.6.0 |
| `metadata.json` | 0.6.0 |
| `AGENTS.md` | 0.5.4 |
| `server/versionManager.ts` | 0.5.4 |
| `src/platform/*/manifest.json` | 1.0.0 |

Regel `GOV-VER-001`, Severity Critical. Seit dem ersten Gap Report unverändert offen.

---

# 7. Enterprise Traceability

| Anforderung | Erfüllt | Nachweis |
|---|---|---|
| Jede ESS-Komponente auf Dokumentation rückverfolgbar | ✅ | Registry, 15 von 15 |
| Jede ADR besitzt Codebezug | ❌ | ADR-0002 und ADR-0005 ohne Bezug |
| Jede Kernfunktion dokumentiert | teilweise | Backend-Endpunkte ohne API-Doku |
| Alle Dokumente referenziert | teilweise | acht Bestandsdokumente ohne Referenz |

## Befund T-01 — Traceability ist spezifiziert, aber nicht messbar

ESS-0011 definiert die Matrix vollständig, `src/platform/Traceability/` besitzt Struktur und
Metadaten. Es existiert jedoch kein Knowledge Graph und kein Digital Twin — beide sind
Pflichtquellen.

Ein Matrixaufbau würde nach den eigenen Regeln `GOV-KG-001` und `GOV-TWIN-001` abbrechen.

**Die Traceability dieses Audits wurde vollständig manuell erhoben.**

---

# 8. Sicherheitsprüfung

## 8.1 Ergebnisse

| Bereich | Bewertung | Nachweis |
|---|---|---|
| CORS | ✅ **stark** | feste Allowlist, keine Wildcards, Credentials nur nach Validierung, blockierte Origins werden protokolliert (`server.ts:120-140`) |
| Security Headers | ✅ **stark** | `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, CSP mit `frame-ancestors`, HSTS in Produktion |
| Stripe Webhook | ✅ **stark** | `constructEvent` mit Signaturprüfung, Raw-Body vor `express.json()` |
| Secrets | ✅ **sauber** | keine hardcodierten Live-Keys, Zugriff über `getCleanEnv` |
| IAM | ✅ **stark** | `checkAdminAccess` 21×, `requireAdmin` 16×, TOTP, Step-Up, Break-Glass |
| Audit Logging | ⚠ teilweise | `security_events`, `audit_logs_iam`, `iam_access_log` vorhanden — aber alle mit **0 Zeilen** |
| Rate Limiting | ❌ **lückenhaft** | siehe C-03 |
| Supabase Policies | ⚠ dünn | 4 RLS-Aktivierungen, 2 Policies in Migrationen; `supabase/policies/` leer |
| Environment Handling | ✅ sauber | zentrale Env-Zugriffe, `.env.example` gepflegt |

## 8.2 Befunde

### S-01 — Supabase-Migrationen sind seit dem 30.06.2026 fehlgeschlagen (Critical)

```text
Branch "main": status = MIGRATIONS_FAILED
```

**Auswirkung**

- Der CI-Check „Supabase Preview" wird bei jedem PR übersprungen — nicht wegen fehlender
  Änderungen, sondern weil aus einem fehlgeschlagenen Basisbranch keine Preview-Branches
  ableitbar sind.
- `public.user_quota` existiert nicht in der Datenbank, obwohl eine Migration dafür vorliegt.
- Die IAM-Migration `20260711000000_iam.sql` ist damit ebenfalls nicht verifiziert angewandt.

Dies ist der schwerwiegendste Infrastrukturbefund des Audits.

### S-02 — Audit-Tabellen sind leer (High)

`security_events`, `iam_access_log`, `step_up_tokens`, `break_glass_codes`,
`phone_stepup_challenges` führen jeweils **0 Zeilen**. `audit_logs_iam` führt 2 Zeilen.

Die Protokollierungsinfrastruktur existiert, wird aber offenkundig nicht befüllt. Ein Audit
Trail ohne Einträge erfüllt Chapter 11 nicht.

### S-03 — Keine globale Rate-Limitierung (High)

Siehe C-03. Besonders relevant für die Gemini-gestützten Endpunkte: Ein einzelner Nutzer
kann unbegrenzt kostenpflichtige LLM-Aufrufe auslösen.

### S-04 — Quota-Durchsetzung ausschließlich clientseitig (High)

`src/lib/dailyScreeningTracker.ts` begrenzt Screenings über `localStorage`:

```ts
localStorage.getItem('capital_ai_daily_screenings_v1')
```

Trivial umgehbar durch Inkognito-Modus, `localStorage.clear()` oder direkten API-Aufruf.
Für `monte_carlo` und `full_ai_analysis` existiert **überhaupt keine** Begrenzung.

Die serverseitige Entsprechung (`user_quota`) wurde nie angelegt — siehe S-01.

---

# 9. Enterprise Score

## 9.1 Domänenbewertung

| Domäne | Score | Einordnung |
|---|---|---|
| Enterprise Architecture | 58 | Structured |
| ESS-System | 68 | Managed |
| ADR-Governance | 62 | Managed |
| Dokumentation | 64 | Managed |
| Codeintegrität | **48** | Structured |
| Datenintegrität | 42 | Structured |
| Traceability | 40 | Defined |
| Sicherheit | **66** | Managed |
| Billing & Stripe | 72 | Managed |
| Frontend | 60 | Structured |
| Backend | 48 | Structured |
| Infrastruktur & CI | **38** | Defined |
| AI Layer | 63 | Managed |
| Automatisierung | 41 | Structured |

## 9.2 Gesamtergebnis

```text
Enterprise Score = 55 / 100
```

| Stufe | Erfüllt |
|---|---|
| Prototype | ✅ |
| MVP | ✅ |
| **Professional SaaS** | ✅ **erreicht** |
| Enterprise Ready | ❌ nicht erreicht |
| Enterprise Production | ❌ nicht erreicht |

## 9.3 Einordnung

**Die Plattform ist ein funktionierendes Professional-SaaS-Produkt mit Enterprise-Ambition
und Enterprise-Dokumentation, aber ohne Enterprise-Betriebsreife.**

Was für *Professional SaaS* spricht: funktionierender Build, Stripe-Integration mit
Signaturprüfung, belastbares IAM, saubere CORS- und Header-Konfiguration, keine
hardcodierten Secrets, keine TODOs im Code.

Was *Enterprise Ready* verhindert:

| Blocker | Befund |
|---|---|
| Qualitätsprüfung dauerhaft rot | C-01, C-02 |
| keine Tests | 0 Testdateien |
| Migrationen fehlgeschlagen | S-01 |
| Audit Trail leer | S-02 |
| keine globale Rate-Limitierung | S-03 |
| Quota clientseitig umgehbar | S-04 |
| Versionsstände widersprüchlich | DI-01 |

Kein einziger dieser Blocker liegt in der Architektur. Alle sieben sind Ausführungs- und
Betriebslücken.

---

# 10. Roadmap

## Priorität 1 — Produktionsrisiken

| Nr. | Maßnahme | Befund | Aufwand |
|---|---|---|---|
| P1-1 | Supabase-Migrationsfehler beheben, Branch-Status zurücksetzen | S-01 | mittel |
| P1-2 | Serverseitige Quota-Durchsetzung aktivieren (`user_quota` anlegen und anbinden) | S-04 | mittel |
| P1-3 | Globale Rate-Limitierung auf `/api/*`, insbesondere KI- und Auth-Endpunkte | S-03, C-03 | niedrig |
| P1-4 | `server/compliance/types.ts` bereitstellen oder Import entfernen | C-01 | **niedrig** |
| P1-5 | Audit-Logging tatsächlich befüllen | S-02 | mittel |

## Priorität 2 — Qualität und Konsistenz

| Nr. | Maßnahme | Befund | Aufwand |
|---|---|---|---|
| P2-1 | `npm run lint` auf grün bringen (38 Typfehler) | C-02 | niedrig |
| P2-2 | Versionsstände vereinheitlichen | DI-01 | niedrig |
| P2-3 | `/api/compliance/*`-Endpunkte implementieren oder Komponente deaktivieren | FND-ADR-0012-01 | hoch |
| P2-4 | Implementation-Status für ADR-0004 bis ADR-0007 ergänzen | D-01 | niedrig |
| P2-5 | ADR-0002 als `SUPERSEDED` kennzeichnen (kein Firestore im Einsatz) | D-02 | **sehr niedrig** |
| P2-6 | ADR-0005 prüfen und Status setzen | D-03 | niedrig |

## Priorität 3 — Architektur und Enterprise-Reife

| Nr. | Maßnahme | Befund | Aufwand |
|---|---|---|---|
| P3-1 | Testinfrastruktur aufbauen (Runner, Architecture Tests, Contract Tests) | Umsetzungsstufe 4 | hoch |
| P3-2 | Knowledge Graph und Digital Twin aufbauen | T-01 | hoch |
| P3-3 | Enterprise Event Bus | Umsetzungsstufe 3 | hoch |
| P3-4 | `server/`-Migration gemäß ADR-0011 | A-01, EXC-0001 | sehr hoch |
| P3-5 | Code-Splitting für das Frontend-Bundle | C-07 | mittel |

## Quick Wins

Sortiert nach Verhältnis von Wirkung zu Aufwand:

| Maßnahme | Wirkung |
|---|---|
| **`server/compliance/types.ts` anlegen** | beseitigt 19 von 38 Typfehlern in einem Schritt |
| **ADR-0002 als SUPERSEDED markieren** | schließt einen seit Monaten irreführenden ADR |
| **Globale Rate-Limitierung aktivieren** | Infrastruktur existiert bereits, nur nicht verdrahtet |
| **`MonteCarloDetailed.tsx` entfernen oder anbinden** | beseitigt toten Code |
| **Versionsangaben angleichen** | löst einen Critical-Befund mit einer Textänderung |
| **`docs/quality/` befüllen** | vertraglich festgelegter Ablageort, aktuell leer |

## Architekturverbesserungen

- Schichtentrennung im Backend statt Monolith (ADR-0011 definiert die Zielstruktur)
- Domänenlogik nach `src/features/<domain>` (GAP-009)
- Code-Splitting und Lazy Loading im Frontend
- Zentralisierte Fehlerbehandlung für Express-Handler (löst 8 Typfehler strukturell)

## Fehlende Enterprise-Komponenten

Sämtliche 24 Plattformmodule sind spezifiziert und leer. Die höchste Hebelwirkung besitzen in
dieser Reihenfolge:

1. **Knowledge Engine** (ESS-0009) — schaltet Digital Twin und Traceability frei
2. **Enterprise Event Bus** (Chapter 8) — schaltet die gesamte Wertschöpfungskette frei
3. **Quality Center** (ESS-0005) — macht sämtliche Contracts erstmals durchsetzbar

## Empfohlene neue ADRs

| ADR | Gegenstand | Begründung |
|---|---|---|
| ADR-0017 | Rückzug oder Ersetzung von ADR-0002 (Firestore) | Entscheidung ohne Codebezug |
| ADR-0018 | Serverseitige Quota-Durchsetzung | S-04, betrifft Abrechnung |
| ADR-0019 | Globale Rate-Limiting-Strategie | S-03, betrifft Kosten und Verfügbarkeit |
| ADR-0020 | Ergänzung `GOV-ESS-009` in ESS-0012-CONTRACTS | aus ADR-0016 vorgemerkt |

## Dokumentationslücken

`docs/quality/` · `docs/release/` · `docs/knowledge/` · `docs/compliance/` — alle leer

API-Dokumentation ohne Endpunktabdeckung

Acht Bestandsdokumente ohne ESS-/ADR-Referenz

`docs/Documentary.md` auf Stand 0.5.4

## Technische Schulden

| Schuld | Auswirkung | Priorität |
|---|---|---|
| 38 Typfehler | Lint dauerhaft rot | hoch |
| `server.ts` mit 1.934 Zeilen | Wartbarkeit | hoch |
| 0 Tests | keine Regressionssicherung | **kritisch** |
| Bundle 2,6 MB einzelner Chunk | Ladezeit | mittel |
| 4 ADRs ohne Status | Governance-Nachvollziehbarkeit | mittel |
| clientseitige Quota | Umsatzrisiko | hoch |

## Produktionsrisiken

| Risiko | Eintritt | Auswirkung |
|---|---|---|
| **Kostenexplosion durch unbegrenzte LLM-Aufrufe** | hoch | **kritisch** |
| **Umsatzverlust durch umgehbare Quota** | eingetreten | hoch |
| **Migrationen nicht anwendbar** | eingetreten | hoch |
| Audit Trail ohne Einträge — Nachweispflicht nicht erfüllbar | eingetreten | hoch |
| Regression unbemerkt (keine Tests) | hoch | hoch |
| Compliance-Komponente ohne Funktion | eingetreten | mittel |

---

# Zusammenfassende Bewertung

**Der Befund dieses Audits unterscheidet sich deutlich von den vorangegangenen
Governance-Berichten.**

Die vorherigen Berichte bewerteten die Enterprise-Dokumentation und kamen auf einen Score von
46 bei einem Governance Score von 0. Dieser Audit bewertet das **Produkt** und kommt auf 55
mit der Einordnung *Professional SaaS*.

Der Unterschied ist erklärbar: Die Anwendung ist funktional deutlich weiter als die
Enterprise-Governance-Schicht. Stripe funktioniert, IAM ist belastbar, die
Sicherheits-Header sind vorbildlich, es gibt keinen einzigen TODO-Kommentar und keine
hardcodierten Secrets.

**Die kritischen Befunde liegen nicht in der Architektur, sondern im Betrieb:**

Migrationen laufen seit einem Monat nicht. Der Audit Trail ist leer. Es gibt keine globale
Rate-Limitierung bei kostenpflichtigen KI-Aufrufen. Die Quota-Durchsetzung liegt im Browser
des Nutzers. Die einzige ausführbare Qualitätsprüfung ist rot — zur Hälfte wegen eines
einzigen fehlenden Typmoduls.

**Vier der sechs Quick Wins sind an einem Arbeitstag umsetzbar** und würden den Enterprise
Score spürbar anheben, ohne eine einzige Architekturentscheidung zu erfordern.

---

# Related Documents

`docs/architecture/ARCHITECTURE_GAP_REPORT.md` — ARCH-GAP-0001

`docs/architecture/ENTERPRISE_MATURITY_REPORT.md` — ARCH-MAT-0001

`docs/architecture/GOVERNANCE_MATURITY_REPORT.md` — ARCH-GOVMAT-0001

`docs/architecture/AI_VALUE_CHAIN_VALIDATION.md` — ARCH-CHAIN-0001

`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md` — ARCH-RESP-0001

ADR-0009 · ADR-0011 · ADR-0012 · ADR-0016

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Erster vollständiger Produktions-Audit über Code, Dokumentation, Architektur und Sicherheit |

---

# End of Document

ARCH-AUDIT-0001

CAPITAL-AI Enterprise Production Audit

Version 1.0.0
