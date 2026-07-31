# CAPITAL-AI Enterprise FinTech Architecture Audit

## Enterprise Report

### Document ID

ARCH-AUDIT-0002

### Version

1.0.0

### Status

Enterprise Audit — Approved for Governance Review

### Prüfstichtag

2026-07-31

### Prüfumfang

| Umgebung | Bezeichnung im Bericht | Stand |
|---|---|---|
| Produktivstand | **PROD** | Repository `SvenKulessa/Finance`, Commit `3cb1771` |
| Entwicklungsstand | **DEV** | Archiv `CAPITAL-AI-Dev-main`, Dateistand 2026-07-31 09:17 UTC |

Geprüft wurden 56.752 Zeilen TypeScript/TSX (PROD), 94 Markdown-Dokumente, 25
Komponenten-Manifeste, 14 aktive ADRs, 5 Datenbank-Migrationen, sämtliche Konfigurations-,
Build- und Deployment-Dateien beider Umgebungen sowie der vollständige Dateibestand beider
Stände im Direktvergleich.

### Verwandte Dokumente

- `docs/adr/ADR-0019-fork-divergenz-und-nummernraum-konsolidierung.md` — aus diesem Audit hervorgegangene Entscheidung
- `docs/architecture/ENTERPRISE_PRODUCTION_AUDIT.md` (ARCH-AUDIT-0001) — Vorgänger-Audit
- `docs/architecture/ENTERPRISE_FINTECH_FINALIZATION_REPORT.md` (ARCH-FINALIZE-0001)
- `docs/DATENSCHUTZ_PROTOKOLL.md` — rechtliche Fassung der No-Demo-Data-Policy

---

## 1. Executive Summary

Dieses Audit hat drei Befunde ergeben, die den Charakter des Vorhabens verändern.

**Erstens: DEV und PROD sind keine zwei Stände derselben Codebasis, sondern zwei divergierte
Forks.** 130 Dateien existieren nur in DEV, 155 nur in PROD, 55 gemeinsame Dateien sind
inhaltlich verschieden; lediglich 119 sind identisch. Beide Stände haben unabhängig voneinander
ADR- und ESS-Nummern vergeben und belegen zehn ESS- und vier ADR-Nummern mit **unterschiedlichen
Entscheidungen**. Die Angabe „siehe ESS-0004" verweist je nach gelesenem Stand auf den Version
Manager oder auf die Documentary Engine. Damit ist die Traceability-Kette nicht mehr eindeutig
auflösbar und die Dokumentation verliert genau die Eigenschaft — Revisionssicherheit —, die das
Governance-Gerüst begründet. Behandelt in ADR-0019.

**Zweitens: Die Kern-Scoring-Engine bewertet Vermögenswerte auf Basis erfundener
Eingangsgrößen.** Die 23-Faktoren-Bewertung leitet Marktkapitalisierung, Liquidität, Tokenomics,
Sicherheit, Entwickleraktivität, Umsatz und Adoption nicht aus Marktdaten ab, sondern aus einem
Zeichen-Hash des Tickersymbols. Das ist keine Randfunktion, sondern der Produktivpfad. Es steht
im direkten Widerspruch zur rechtlich gefassten No-Demo-Data-Policy des eigenen
Datenschutz-Protokolls. Ausführlich in Kapitel 6.

**Drittens: Drei akute Produktionsfehler in PROD** — zwei davon Regressionen aus der
unmittelbar vorangegangenen Änderungsserie. Portfolio-Backtesting und Chart-Historie waren
vollständig funktionslos, der Server startete ohne konfigurierten KI-Schlüssel nicht, und das
Supervisor-Dashboard meldete eine nicht existierende Komponente als betriebsbereit. **Alle drei
sind im Rahmen dieses Audits behoben** (Kapitel 12).

### Gesamtbewertung

| | PROD | DEV |
|---|---|---|
| **Enterprise-Gesamtscore** | **35 / 100** | **27 / 100** |
| Reifegrad | Managed | Initial |
| Produktionsfreigabe empfohlen | Nein — mit Auflagen (Kapitel 6, 13) | Nein — nicht produktionsfähig |

Die Stärke von PROD liegt eindeutig in der Governance (70/100) und in einem belastbaren
Sicherheitskern. Die Schwäche liegt in der Betriebsreife (20/100) und darin, dass die
fachliche Kernleistung — die Bewertung von Vermögenswerten — auf synthetischen Eingangsdaten
beruht. DEV liegt in fast allen Dimensionen darunter und ist wegen der Autorisierung ohne jedes
Credential in der vorliegenden Form nicht produktionsfähig.

Die abweichende Selbstbewertung von DEV (76/100 Gesamtreife, dreimal 100/100
„ENTERPRISE_GOLD") wird in Kapitel 8.3 aufgelöst: Sie ist handgesetzt und widerspricht
ESS-0001-CONTRACTS Chapter 12, wonach Kennzahlen ausschließlich berechnet und niemals manuell
gesetzt werden.

---

## 2. Prüfumfang und Methodik

### 2.1 Bewertungsverfahren

Jede Kategorie erhält einen Score von 0 bis 10 und einen Reifegrad. Die Reifegrade sind an
CMMI angelehnt:

| Score | Reifegrad | Bedeutung |
|---|---|---|
| 0–1 | Initial | Nicht vorhanden oder nicht funktionsfähig |
| 2–3 | Managed | Ansatzweise vorhanden, nicht systematisch |
| 4–5 | Defined | Definiert und dokumentiert, nicht durchgängig umgesetzt |
| 6–7 | Measured | Umgesetzt und teilweise messbar |
| 8–9 | Optimized | Messbar gesteuert und kontinuierlich verbessert |
| 10 | Enterprise Ready | Vollständig, gemessen, auditierbar, betriebsbewährt |

### 2.2 Gewichtung

| Stufe | Faktor | Zuordnung |
|---|---|---|
| kritisch | 4 | Wertschöpfungskette, Compliance, Finanzscreening, Bewertungssystem, Enterprise Plattform |
| hoch | 3 | Code Engine, Governance, AI-Orchestrierung, Codequalität |
| mittel | 2 | Documentary Engine, Supervisor Layer, AI Enterprise Readiness |
| niedrig | 1 | — |

Summe der Gewichte: **38**.

### 2.3 Rechenweg Gesamtscore

```
Gesamtscore = (Σ (Kategorie-Score × Gewicht) / Σ Gewichte) × 10
```

Der vollständige Rechenweg ist in Kapitel 11.1 ausgeschrieben.

### 2.4 Belegregel

**Jede Bewertung in diesem Bericht ist auf Datei und Zeile zurückführbar.** Wo eine Aussage
nicht am Code oder an einem Dokument verifiziert werden konnte, ist sie als *nicht
verifizierbar* gekennzeichnet und geht **nicht** in die Bewertung ein. Es wurde keine Kennzahl
geschätzt und keine aus einem anderen Dokument übernommen, ohne sie gegen den Code zu prüfen.

Aussagen über die Laufzeitumgebung (Supabase-Produktivinstanz, Render-Deployment,
Stripe-Konfiguration) beruhen ausschließlich auf dem Repository-Stand. Der tatsächliche Zustand
der betriebenen Instanzen war nicht Prüfgegenstand und ist entsprechend gekennzeichnet.

---

## 3. Hauptbefund: Fork-Divergenz

### 3.1 Dateibilanz

| Kategorie | Anzahl |
|---|---|
| Nur in DEV | 130 |
| Nur in PROD | 155 |
| Gemeinsam, inhaltlich verschieden | 55 |
| Gemeinsam, identisch | 119 |

Die Divergenz betrifft die Kernmodule: `server.ts` weicht auf 750 von rund 1.900 Zeilen ab
(≈ 40 %), `server/systemEvents.ts` auf 300 Zeilen, `src/lib/assetRegistry.ts` auf 157,
`src/App.tsx` auf 155.

### 3.2 Kollisionen im ADR-Nummernraum

| ADR | PROD (verbindlich) | DEV (abweichend) |
|---|---|---|
| ADR-0010 | Erweiterung des Enterprise Standards um ESS-0001-CONTRACTS | Enterprise Traceability Matrix |
| ADR-0011 | Bestandsschutz Root-Abweichungen | Documentation Governance Validator |
| ADR-0012 | SecurityComplianceAuditor Integration | Enterprise Architecture Compliance Engine |
| ADR-0013 | Konsolidierung der ESS-Dokumentationsverantwortung | Enterprise Event Mesh |

Zusätzlich tragen drei sachlich identische Entscheidungen unterschiedliche Nummern:
Event Mesh (PROD ADR-0018 / DEV ADR-0013), Documentation Governance Validator (ADR-0014 /
ADR-0011), Traceability (ADR-0015 / ADR-0010).

### 3.3 Kollisionen im ESS-Nummernraum

Zehn Nummern bezeichnen unterschiedliche Komponenten:

| ESS | PROD | DEV |
|---|---|---|
| ESS-0002 | Supervisor Architect | Platform Governance Standard |
| ESS-0003 | Platform Director | AI Collaboration & Agent Value Chain |
| ESS-0004 | Enterprise Version Manager | Documentary Engine & Digital Twin |
| ESS-0005 | Quality Center | Knowledge Graph Architecture |
| ESS-0006 | Security & Compliance | Version Manager & Lifecycle |
| ESS-0007 | Enterprise Release Center | Master Supervisor |
| ESS-0008 | AI Agent Framework | Platform Director Architecture |
| ESS-0009 | Enterprise Knowledge Platform | Security & IAM Architecture |
| ESS-0010 | Documentary Engine | Repository Topology & Maintenance |
| ESS-0013 | Enterprise Event Mesh | Enterprise Architecture Compliance Engine |

`ESS-0014` ist in `.ai/registry/ess-registry.json` als **frei** deklariert
(`freeNumberSpaceStartsAt: "ESS-0014"`), in DEV jedoch belegt. Die Registry enthält die Regel
„Reservierte Nummern werden niemals abweichend belegt" und „Kein KI-System vergibt ESS-Nummern
eigenstaendig". DEV besitzt keine Registry — `.ai/registry/` existiert dort nicht, und eine
Suche nach `ess-registry` in `DEV/docs` und `DEV/.ai` liefert null Treffer. **DEV kennt das
Vergabeverfahren dokumentarisch nicht.**

Auch die Ablage divergiert: PROD führt ESS-Dokumente unter `.ai/skills/` und hat die Einführung
von `docs/ess/` ausdrücklich abgelehnt (`docs/adr/ADR-0013-…:152`,
`docs/architecture/ESS_RESPONSIBILITY_MATRIX.md:69`). DEV legt sie genau dort ab.

### 3.4 Technisches Merge-Hindernis: neun Case-Kollisionen

Beide Stände enthalten eine vollständige, unvereinbare Enterprise-Event-Mesh-Implementierung
unter demselben Pfad `src/platform/EventMesh/` — PROD mit 36 Dateien in PascalCase (ein Typ je
Datei), DEV mit 19 Dateien in camelCase. Neun Paare unterscheiden sich **ausschließlich in der
Groß-/Kleinschreibung**:

| PROD | DEV |
|---|---|
| `Core/EventBus.ts` | `Core/eventBus.ts` |
| `Core/EventDispatcher.ts` | `Core/eventDispatcher.ts` |
| `Core/EventPublisher.ts` | `Core/eventPublisher.ts` |
| `Core/EventRouter.ts` | `Core/eventRouter.ts` |
| `Core/EventSubscriber.ts` | `Core/eventSubscriber.ts` |
| `Registry/ConsumerRegistry.ts` | `Registry/consumerRegistry.ts` |
| `Registry/EventCatalog.ts` | `Registry/eventCatalog.ts` |
| `Registry/EventRegistry.ts` | `Registry/eventRegistry.ts` |
| `Registry/ProducerRegistry.ts` | `Registry/producerRegistry.ts` |

Auf case-insensitiven Dateisystemen (macOS-Standard, Windows) sind das jeweils derselbe Pfad.
Ein unvorbereiteter Merge überschreibt dort Dateien **ohne Konflikt und ohne Warnung**.

### 3.5 Kein Dokument unterscheidet die Umgebungen

`AGENTS.md` und `README.md` sind zwischen beiden Ständen **byteidentisch** und erwähnen weder
ESS noch ADR noch die Registry noch `src/platform/`. Ein KI-Werkzeug, das nach Konvention nur
die Root-Dokumente liest, kann die beiden Umgebungen nicht auseinanderhalten und löst
ESS-Nummern zwangsläufig falsch auf.

---

## 4. Bewertungsmatrix

Legende Priorität: **P0** sofort · **P1** 30 Tage · **P2** 90 Tage · **P3** 180 Tage +

### 4.1 Vollständigkeit der Wertschöpfungskette

| | |
|---|---|
| **Score** | PROD **4** / DEV **3** |
| **Reifegrad** | Defined / Managed |
| **Gewichtung** | kritisch |
| **Business Impact** | Sehr hoch |
| **Security Impact** | Mittel |
| **Maintainability** | Mittel |
| **Scalability** | Niedrig |
| **Enterprise Readiness** | Nicht gegeben |

**Technischer Kommentar.** Acht externe Marktdaten-Schnittstellen sind real angebunden:
CoinMarketCap (`server.ts:439`), CoinGecko (`:502`), Binance (`:559`), Kraken (`:589`),
Coinbase (`:637`), Stooq (`:712`), Alpha Vantage (`:1043`), NewsAPI (`:1212`). Eine
Fallback-Kette und ein 60-Sekunden-Cache mit Request-Coalescing (`server.ts:419-422`) sind
vorhanden. PROD hat zusätzlich echte Historiendaten über CoinGecko und Stooq eingeführt
(`src/lib/assetRegistry.ts:596`, `:622`) und liefert eine Herkunftskennzeichnung
`source: 'live' | 'simulated'` mit — DEV liefert an derselben Stelle ausschließlich
simulierte geometrische Brownsche Bewegung, unmarkiert.

Der Bruch liegt zwischen Datenerfassung und Bewertung: Die erfassten Marktdaten fließen **nicht**
in die Scoring-Engines ein (Kapitel 6). Damit ist die Kette zwar durchgängig gebaut, aber in
ihrer Mitte unterbrochen.

Es gibt **keinen Retry und keinen echten Circuit Breaker**. Der im Supervisor-Dashboard
angezeigte Circuit Breaker ist ein reines React-State-Objekt ohne Backend
(`src/components/SupervisorDashboard.tsx:130-136`).

**Empfehlung.** Scoring-Eingangsgrößen an die real erfassten Marktdaten anbinden (P0, Kapitel 6);
Retry mit exponentiellem Backoff für die Datenquellen-Kette ergänzen (P1).

**ROI** hoch · **Risiko** mittel · **Aufwand** hoch (15–25 PT)

### 4.2 Documentary Engine

| | |
|---|---|
| **Score** | PROD **3** / DEV **5** |
| **Reifegrad** | Managed / Defined |
| **Gewichtung** | mittel |
| **Business Impact** | Mittel |
| **Security Impact** | Niedrig |
| **Maintainability** | Hoch |
| **Scalability** | Mittel |

**Technischer Kommentar.** Dies ist die einzige Kategorie, in der DEV vor PROD liegt: DEV
besitzt mit `server/documentary/documentaryEngine.ts` und `server/documentary/routes.ts` eine
tatsächliche Implementierung (~1.000 LOC), PROD hat unter `src/platform/Documentary/` nur
`README.md` und `manifest.json` — **null TypeScript-Dateien** — obwohl ESS-0010 die Komponente
über 400 Zeilen spezifiziert und die Registry `implementedBy: src/platform/Documentary` führt.

PROD verfügt stattdessen über `server/documentHygiene.ts` (1.691 LOC), das Dokumente beim
Serverstart automatisch mit einem Marken-Header versieht. **Nebenbefund AUD2-F-014:** Ein
einzelner Serverstart verändert dadurch 68 versionierte Dokumente. Das macht jeden Entwicklerlauf
zu einer Quelle von 68 unbeabsichtigten Änderungen und ist mit reproduzierbaren Builds
unvereinbar.

`docs/adr/adr_history.json` — die maschinenlesbare ADR-Datenbank — endet in PROD bei ADR-0008,
obwohl ADR-0009 bis ADR-0018 als Markdown existieren. **Zehn ADRs sind der Laufzeit unbekannt**,
während sich die Datei als „Verified & Hygienically Cleaned" ausweist.

**Empfehlung.** Automatische Dokumentmutation beim Serverstart abschalten und in ein explizites
Skript überführen (P1); `adr_history.json` nachführen (P1); Documentary Engine aus DEV unter
neuer Nummernvergabe übernehmen (P2, ADR-0019 Ziffer 3).

**ROI** mittel · **Risiko** niedrig · **Aufwand** mittel (5–8 PT)

### 4.3 Code Engine

| | |
|---|---|
| **Score** | PROD **4** / DEV **4** |
| **Reifegrad** | Defined |
| **Gewichtung** | hoch |
| **Business Impact** | Mittel |
| **Security Impact** | Mittel |
| **Maintainability** | Niedrig |
| **Scalability** | Niedrig |

**Technischer Kommentar.** Die Schichtung ist erkennbar (`src/agents/`, `src/orchestrator/`,
`src/services/`, `src/routes/`, `server/`), aber nicht durchgesetzt. Es existieren ausgeprägte
God Objects: `src/components/CryptoScoringEnterprise.tsx` (2.439 Zeilen),
`src/components/Dashboard.tsx` (1.988), `server.ts` (1.900),
`server/documentHygiene.ts` (1.691), `src/components/SupervisorDashboard.tsx` (1.563).

Objektive Messwerte im Direktvergleich:

| Metrik | DEV | PROD |
|---|---|---|
| `any`-Typen | 289 | 273 |
| `console.*`-Aufrufe | 276 | 279 |
| `Math.random()` | 94 | 67 |
| Typ-/Lint-Unterdrückungen | 0 | 1 |
| `process.env`-Direktzugriffe | 17 | 11 |

Von DDD, Hexagonal Architecture oder Ports-and-Adapters ist keine Umsetzung erkennbar — es gibt
keine Domänenschicht, keine Repository-Abstraktion und keine Inversion der
Infrastrukturabhängigkeiten. Die Trennung ist technisch (Frontend/Backend/Routen), nicht
fachlich.

`src/features/{users,crypto,portfolio,settings,billing,news,stocks}/` existiert in PROD als
Zielstruktur (EXC-0002), enthält aber ausschließlich `.gitkeep`.

**Empfehlung.** God Objects entlang der Fachdomänen zerlegen, beginnend mit `server.ts` (P2);
`any`-Quote durch schrittweise Typisierung senken (P3).

**ROI** mittel · **Risiko** mittel · **Aufwand** sehr hoch (30–50 PT)

### 4.4 Supervisor Layer

| | |
|---|---|
| **Score** | PROD **2** / DEV **2** |
| **Reifegrad** | Managed |
| **Gewichtung** | mittel |
| **Business Impact** | Mittel |
| **Security Impact** | Mittel |
| **Maintainability** | Niedrig |
| **Scalability** | Niedrig |

**Technischer Kommentar.** `src/platform/Supervisor/` enthält in beiden Ständen **null
TypeScript-Dateien**. Was „Supervisor" heißt, ist ein Frontend-Dashboard
(`src/components/SupervisorDashboard.tsx`), das vier Endpunkte liest und Agenten registrieren
bzw. umschalten kann. Es enthält keine Steuerungslogik.

Ohne Entsprechung im Code sind: Task Routing, Execution Control, Retry, Recovery, Conflict
Resolution, Self Healing, Tool Selection. Eine Zustandsmaschine existiert ausschließlich für die
Dokumenten-Pipeline (`server/decisionEngine.ts:18-26`), nicht für Finanzanalysen; dort gibt es
auch den einzigen Human-Approval-Zustand (`REVIEW_REQUIRED`, `:168-176`).

DEV enthält zusätzlich eine selbst als „Simulated Fluctuation Engine" bezeichnete Routine, die
alle vier Sekunden CPU-, RAM-, Datenbank- und Kostenkennzahlen aus `Math.random()` erzeugt und
mit erfundenen Startwerten (2.410 DB-Abfragen, 4,12 € LLM-Kosten) beginnt. In PROD ist sie
entfernt, alle Ausgangswerte stehen auf `0`.

**Empfehlung.** Entweder den Supervisor als Komponente implementieren oder die Spezifikation
zurückziehen — der jetzige Zustand (Spezifikation ohne Code, Dashboard mit Supervisor-Namen)
erzeugt eine Fähigkeitserwartung, die das System nicht erfüllt (P2).

**ROI** niedrig · **Risiko** niedrig · **Aufwand** hoch (20–30 PT)

### 4.5 Governance

| | |
|---|---|
| **Score** | PROD **7** / DEV **2** |
| **Reifegrad** | Measured / Managed |
| **Gewichtung** | hoch |
| **Business Impact** | Hoch |
| **Security Impact** | Mittel |
| **Maintainability** | Hoch |
| **Scalability** | Hoch |

**Technischer Kommentar.** Dies ist die stärkste Kategorie von PROD und der größte Abstand
zwischen den Ständen. PROD verfügt über eine ESS-Registry mit 17 Einträgen und expliziten
Vergaberegeln, eine Ausnahme-Registry mit acht nachverfolgten Abweichungen (EXC-0001 bis
EXC-0008, davon drei nachweislich beseitigt), 14 aktive ADRs mit Ablagekonvention
(`docs/adr/README.md`, `resolved/`-Unterordner), 25 Komponenten-Manifeste und eine
Verantwortungsmatrix.

Die Registry-Aussagen sind belastbar: Alle 17 `document`-Pfade existieren; die drei als
`Revoked` geführten Ausnahmen sind im Dateisystem tatsächlich beseitigt. Die Registry führt
sogar offene Befunde gegen sich selbst (FND-ADR-0012-01: sieben referenzierte
`/api/compliance/*`-Endpunkte existierten nicht).

Die Grenzen: Die Manifest-Felder `description`, `adr`, `dependencies`, `knowledge`,
`interfaces`, `contracts` sind in 22 von 25 Manifesten leer; ein Feld `tests` existiert in
**keinem** Manifest der gesamten Codebasis. Der gesamte Backend-Bereich `server/` (24 Dateien)
ist über EXC-0001 pauschal aus Registry, Knowledge Graph und Digital Twin ausgenommen — die
Ausnahme beziffert 15 Dateien und ist nicht nachgeführt.

DEV besitzt keine Registry, kein Ausnahmeverfahren und vergibt Nummern abweichend (Kapitel 3).

**Empfehlung.** ADR-0019 umsetzen (erledigt); Manifest-Pflichtfelder nachziehen (P2);
EXC-0001/0002 auf den tatsächlichen Umfang aktualisieren (P1).

**ROI** hoch · **Risiko** niedrig · **Aufwand** mittel (8–12 PT)

### 4.6 Compliance

| | |
|---|---|
| **Score** | PROD **5** / DEV **3** |
| **Reifegrad** | Defined / Managed |
| **Gewichtung** | kritisch |
| **Business Impact** | Sehr hoch |
| **Security Impact** | Sehr hoch |
| **Maintainability** | Mittel |
| **Scalability** | Mittel |

**Technischer Kommentar.** PROD betreibt 21 Scanner (`server/compliance/scanners.ts`), die das
Repository zur Laufzeit real indizieren — etwa Zählung von `create table` gegen
`enable row level security` in `supabase/migrations/` (`:199-216`) oder Auflösung von
Import-Pfaden gegen das Dateisystem (`:346-369`). Bemerkenswert: Diese Scanner melden mehrere
der in diesem Audit bestätigten PROD-Lücken **selbst korrekt** (fehlendes globales
Rate-Limiting, nirgends erzwungene Step-Up-Authentifizierung).

Real geprüfte Standards im Code:

| Standard | PROD | DEV |
|---|---|---|
| OWASP | teilweise (CORS, Security-Header) | Substring-Prüfung auf `server.ts` |
| DSGVO/GDPR | teilweise (PII-in-Logs, Secret-Hygiene) | überwiegend Referenz-Strings |
| ISO 27001 | **0 Treffer im Code** | 3 Referenz-Strings, keine Control-Zuordnung |
| ISO 42001 | **0** | **0** |
| SOC 2 | **0** | **0** |
| NIS2 | **0** | **0** |

DEV besitzt zwar mehr Compliance-Code (16 Dateien, ~2.100 LOC gegen 4 Dateien, 845 LOC), doch
seine 21 Scanner arbeiten fast ausschließlich mit Substring-Suche in jeweils *einer* Datei: Der
RLS-Scanner prüft nicht Row-Level-Security, sondern ob `server/db.ts` die Zeichenketten
`subscriptions`, `user_id`, `email`, `eq(` enthält. Die Zertifizierungs-Engine erzeugt eine als
„E-Signatur" bezeichnete SHA-256-Prüfsumme ohne Schlüsselmaterial und stellt darauf ein
Zertifikat „LEVEL_3_ENTERPRISE_READY" mit BaFin-Bezug aus. Der Evidence Collector führt eine
statisch codierte Liste von sechs Dateinamen als Prüfnachweis. Sieben Compliance-Endpunkte sind
in DEV **unauthentifiziert**, inklusive aller Findings mit Dateipfaden und Risikobeschreibungen.

**Empfehlung.** ISO-27001-Controls den vorhandenen Scannern zuordnen, statt weitere Scanner zu
bauen (P2); Zertifikatssignatur auf HMAC mit verwaltetem Schlüssel umstellen, falls die
Zertifizierung übernommen wird (P2).

**ROI** hoch · **Risiko** hoch · **Aufwand** hoch (15–20 PT)

### 4.7 AI-Orchestrierung

| | |
|---|---|
| **Score** | PROD **3** / DEV **2** |
| **Reifegrad** | Managed |
| **Gewichtung** | hoch |
| **Business Impact** | Hoch |
| **Security Impact** | Mittel |
| **Maintainability** | Niedrig |
| **Scalability** | Niedrig |

**Technischer Kommentar.** Real angebunden ist **ausschließlich Google Gemini**. Claude, GPT-4o
und Grok erscheinen nur als Auswahlelemente in der Oberfläche
(`src/components/SupervisorDashboard.tsx:1060`); es gibt weder Code noch
Umgebungsvariablen für sie. PROD deklariert diese Nicht-Integration ehrlich
(`server/orchestrator.ts:46-67`: `configured: false`, `status: 'Not Integrated'`,
`latency: null`). DEV täuscht sie aktiv vor: `latency: Math.floor(130 + Math.random() * 50)`
und pauschal `status: 'Active'` für alle fünf Modelle (`server/orchestrator.ts:24-40`).

Nicht vorhanden in **beiden** Ständen, jeweils per repositoryweiter Suche verifiziert:
Prompt-Management (Prompts sind Inline-Template-Literale je Agent), Context-Management,
Model-Routing, Provider-übergreifender Fallback, LLM-Antwort-Caching, Evaluation oder Golden
Sets, Memory, RAG, Embeddings, Vektorspeicher, Tool-Registry (einziges Werkzeug ist ein inline
gesetztes `googleSearch: {}`), Token- und Kostenerfassung.

Die im Dashboard gezeigte Prompt-Historie mit Token-Zahlen und Kosten ist ein hartkodiertes
Array (`SupervisorDashboard.tsx:159-199`) — in **beiden** Ständen.

Auch die Agenten-Registry ist nicht die reale: `server/systemEvents.ts:249-253` führt vier
hartkodierte Einträge mit erfundenen Abfragezahlen (420/812/1402/154) und Leistungswerten
(„98.5 %"), die mit den tatsächlichen Agenten in `src/agents/` nichts zu tun haben.

**Empfehlung.** Prompt-Registry und Token-/Kostenerfassung einführen — beides Voraussetzung für
jede Kostensteuerung (P1); hartkodierte Agenten-Registry und Prompt-Historie durch reale Daten
ersetzen oder entfernen (P1, No-Demo-Data-Policy).

**ROI** hoch · **Risiko** mittel · **Aufwand** hoch (20–30 PT)

### 4.8 Finanzscreening

| | |
|---|---|
| **Score** | PROD **3** / DEV **3** |
| **Reifegrad** | Managed |
| **Gewichtung** | kritisch |
| **Business Impact** | Sehr hoch |
| **Security Impact** | Niedrig |
| **Maintainability** | Mittel |
| **Scalability** | Niedrig |

**Technischer Kommentar.** Die Abdeckung nach Anlageklassen ist deutlich schmaler als die
Oberfläche suggeriert:

| Klasse | Eigene Engine | Beleg |
|---|---|---|
| Crypto | ja | `src/services/cryptoScoringService.ts:62` |
| DeFi | ja | `src/services/scoring.service.ts:52` |
| Meme Coins | ja | `src/services/memeCoinScoringService.ts:20` |
| Rohstoffe | ja | `src/services/rawMaterialsScoring.ts:20` |
| Aktien | **nein** — Momentum-Heuristik | `server.ts:321-323` |
| Forex | **nein** — Momentum-Heuristik | `server.ts:321-323` |
| Indizes | **nein** — Momentum-Heuristik | `server.ts:321-323` |
| Anleihen | **nein** — statischer Registry-Wert | `src/lib/assetRegistry.ts:150-152` |
| ETFs | **existieren nicht als Typ** | `src/lib/assetRegistry.ts:7-8` |
| Stablecoins | **nur Typ-Literal, keine Logik** | `src/types/crypto.types.ts:13` |

Explainability ist vorhanden, aber regelbasiert (Text-Arrays `reasoning[]`/`alerts[]`), nicht
feature-attributionsbasiert. Confidence-Werte sind abgeleitet, nicht gemessen — etwa
`tier === 1 ? 0.95 : tier === 2 ? 0.82 : 0.60` (`src/services/classification.service.ts:67`).

**Eine Validierung der Signalqualität gegen historische Ergebnisse existiert nicht.** Kein Code
verknüpft einen Score mit realisierter Wertentwicklung. Damit sind Trefferquote und
Falsch-Positiv-Rate — die zentralen Qualitätsmaße eines Screenings — unbekannt und nicht
bezifferbar.

Entscheidend ist jedoch der Eingangsdatenbefund in Kapitel 6, der die gesamte Kategorie
relativiert.

**Empfehlung.** Siehe Kapitel 6 (P0); Anlageklassen ohne eigene Engine in der Oberfläche als
solche kennzeichnen (P1).

**ROI** sehr hoch · **Risiko** sehr hoch · **Aufwand** sehr hoch (40–60 PT)

### 4.9 Codequalität

| | |
|---|---|
| **Score** | PROD **3** / DEV **3** |
| **Reifegrad** | Managed |
| **Gewichtung** | hoch |
| **Business Impact** | Mittel |
| **Security Impact** | Hoch |
| **Maintainability** | Niedrig |
| **Scalability** | Niedrig |

**Technischer Kommentar.** Der bestimmende Befund ist die **vollständige Abwesenheit von
Tests**. `tests/` enthält in PROD acht Verzeichnisse (`unit`, `integration`, `e2e`, `contract`,
`performance`, `security`, `architecture`) mit ausschließlich `.gitkeep`-Dateien — **null
Testdateien**. In DEV ebenso. `package.json` besitzt **kein `test`-Skript**; das einzige
Qualitätstor ist `"lint": "tsc --noEmit"`. Es gibt keinen ESLint, keinen Prettier, keine
Pre-Commit-Hooks.

`.github/` existiert in **keiner** der beiden Umgebungen — es gibt keine Continuous Integration.
`scripts/{automation,validation,maintenance,deployment,migration}/` in PROD enthalten
ausschließlich `.gitkeep`.

Fehlerbehandlung: PROD besitzt prozessweite Netze (`server.ts:55-63`) und einen globalen
Express-Fehlerbehandler (`:1829-1836`); **DEV hat beides nicht** — eine unbehandelte Rejection
beendet dort den Prozess. In PROD finden sich jedoch leere `catch {}`-Blöcke an
sicherheitsrelevanten Stellen (`server/iam/authMiddleware.ts:103-105`, `:131-133`, `:244-246`,
`:304-306`, `server/stepUp.ts:38-40`), wodurch Sicherheitsereignisse unbemerkt verloren gehen
können. **React Error Boundaries existieren in keiner Umgebung** — ein Renderfehler leert die
gesamte Oberfläche.

**Empfehlung.** Testrunner einführen und die kritischen Pfade (Scoring, Auth, Billing, Quota)
abdecken (P1); CI-Pipeline mit `tsc`, Tests und Build (P1); Error Boundary in `src/App.tsx`
(P1, sehr geringer Aufwand).

**ROI** sehr hoch · **Risiko** niedrig · **Aufwand** hoch (20–30 PT)

### 4.10 Bewertungssystem

| | |
|---|---|
| **Score** | PROD **3** / DEV **3** |
| **Reifegrad** | Managed |
| **Gewichtung** | kritisch |
| **Business Impact** | Sehr hoch |
| **Security Impact** | Niedrig |
| **Maintainability** | Mittel |
| **Scalability** | Mittel |

**Technischer Kommentar.** Vier Engines sind vorhanden und zwischen den Ständen byteidentisch.
Die Gewichtungen sind bis auf eine Ausnahme **hartkodiert**:

| Engine | Gewichte | Konfigurierbar |
|---|---|---|
| Krypto Basis / DeFi | `src/config/weights.ts:1-31`, `as const` | nein |
| Krypto Enterprise (23 Faktoren) | `src/lib/cryptoScoring.ts:28-52` | nein |
| Meme Coin | inline, zusätzlich als Duplikat `src/services/memeCoinScoringService.ts:26-35` und `:115-124` | nein |
| Rohstoffe | `src/config/rawMaterialsConfig.ts` über `configVersion.weights` | **ja, versioniert** |

Die Rohstoff-Engine zeigt, wie es gemeint war: versionierte, konfigurierbare Gewichte. Die drei
anderen erreichen dieses Niveau nicht. Die Meme-Coin-Gewichte liegen doppelt im Code vor, was
ein Auseinanderlaufen strukturell begünstigt.

Es gibt keine historische Genauigkeitsmessung und keine Validierung. Confidence-Scores sind
formelhaft abgeleitet.

**Empfehlung.** Gewichte aller Engines nach dem Muster von `rawMaterialsConfig.ts`
externalisieren und versionieren (P2); Duplikat der Meme-Coin-Gewichte auflösen (P1).

**ROI** hoch · **Risiko** mittel · **Aufwand** mittel (8–12 PT)

### 4.11 Enterprise Plattform

| | |
|---|---|
| **Score** | PROD **2** / DEV **1** |
| **Reifegrad** | Managed / Initial |
| **Gewichtung** | kritisch |
| **Business Impact** | Sehr hoch |
| **Security Impact** | Hoch |
| **Maintainability** | Niedrig |
| **Scalability** | Sehr niedrig |

**Technischer Kommentar.** Dies ist die schwächste Kategorie. Nicht vorhanden in **beiden**
Ständen:

| Fähigkeit | Status |
|---|---|
| Health-Check-Endpunkt | fehlt (`/health`, `/healthz`, `/ready`, `/live` — null Treffer); `render.yaml` ohne `healthCheckPath` |
| Metrics / Prometheus / OpenTelemetry | fehlt |
| Tracing, Correlation-IDs | fehlt |
| Strukturiertes Logging | fehlt — 279 (PROD) bzw. 276 (DEV) unstrukturierte `console.*`-Aufrufe, kein Logger-Framework |
| Alerting | fehlt (der SMTP-Mailer in PROD versendet ausschließlich Abo-Bestätigungen) |
| CI/CD | fehlt — kein `.github/` |
| Deployment-Rollback, Blue-Green, Canary | fehlt |
| Backup, Disaster Recovery | fehlt (nur ein Prosa-Hinweis in einer Migration) |
| Container-Härtung | `Dockerfile` ohne `HEALTHCHECK` und ohne `USER` → Lauf als **root** |

Geschäftsdaten werden in beiden Ständen in Dateien unter `uploads/` geschrieben
(`subscriptions.json`, `pdf_credits.json`, `system_events.json`) — auf Container-Plattformen
flüchtig. In PROD ist `uploads/` in `.gitignore`, **in DEV nicht** — dort können Abo-, Credit-
und Audit-Daten versehentlich versioniert werden.

`render.yaml` führt zwölf Umgebungsvariablen; **es fehlen** `TOTP_ENCRYPTION_KEY`, `SMTP_*`,
`AI_STUDIO_ORIGIN` und die `STRIPE_PRICE_ID_*`. Ohne `TOTP_ENCRYPTION_KEY` schlägt der gesamte
Step-Up-Pfad fehl.

**Empfehlung.** Health-Check und CI sind die beiden Maßnahmen mit dem besten Verhältnis von
Aufwand zu Wirkung (P1, je 1–2 PT); `render.yaml` vervollständigen (P0, < 1 PT);
strukturiertes Logging einführen (P2).

**ROI** sehr hoch · **Risiko** niedrig · **Aufwand** mittel (10–15 PT)

### 4.12 AI Enterprise Readiness

| | |
|---|---|
| **Score** | PROD **2** / DEV **2** |
| **Reifegrad** | Managed |
| **Gewichtung** | mittel |
| **Business Impact** | Mittel |
| **Security Impact** | Mittel |
| **Maintainability** | Niedrig |
| **Scalability** | Niedrig |

**Technischer Kommentar.** Acht (PROD) bzw. zehn (DEV) Agenten folgen demselben Muster:
Prüfung auf konfigurierten Client, ein `generateContent`-Aufruf mit `responseSchema`,
`try/catch`, sonst `getFallback()` mit **hartkodierten Konstanten**
(`src/agents/cryptoRiskAgent.ts:66-79`). Zwei Orchestratoren führen je vier Agenten parallel
über `Promise.all` aus.

Nicht vorhanden: Memory, Planning, Reflection, Learning, Knowledge-Anbindung, RAG, Evaluation,
Safety-Guardrails. Autonomie beschränkt sich auf parallele Aufrufe ohne Rückkopplung. In DEV ist
`src/orchestrator/memeCoinOrchestrator.ts` von keiner Route importiert — **toter Code**.

**Empfehlung.** Evaluation gegen einen kuratierten Referenzdatensatz einführen, bevor weitere
Agenten ergänzt werden (P2).

**ROI** mittel · **Risiko** mittel · **Aufwand** hoch (25–35 PT)

---

## 5. Wertschöpfungskette im Detail

| # | Stufe | PROD | DEV | Beleg / Anmerkung |
|---|---|---|---|---|
| 1 | Idee | 🟢 | 🟢 | `README.md`, `docs/ceo/EXECUTIVE_SUMMARY.md` |
| 2 | Datenquellen | 🟢 | 🟢 | 8 Anbieter, `server.ts:439-1212` |
| 3 | Datenerfassung | 🟢 | 🟡 | Cache + Coalescing `server.ts:419-422`; DEV ohne Herkunftskennzeichnung |
| 4 | Datenqualität | 🔴 | 🔴 | Keine Validierung, keine Plausibilisierung, keine Quellen-Gütemessung |
| 5 | Transformation | 🟡 | 🟡 | Normalisierung in `assetRegistry.ts`, ohne Schema-Prüfung |
| 6 | Feature Engineering | 🔴 | 🔴 | **Ersetzt durch Symbol-Hash** — Kapitel 6 |
| 7 | AI | 🟡 | 🟡 | Nur Gemini, ohne Routing/Eval/Memory |
| 8 | Screening | 🟡 | 🟡 | 4 von 10 Anlageklassen mit eigener Engine |
| 9 | Scoring | 🔴 | 🔴 | Engines vorhanden, Eingangsgrößen synthetisch |
| 10 | Ranking | 🟡 | 🟡 | `src/services/ranking.service.ts:9-14`, Gewichte hartkodiert |
| 11 | Visualisierung | 🟢 | 🟢 | 57 Komponenten, Recharts |
| 12 | Alerting | 🔴 | 🔴 | Nur clientseitig in `localStorage` (`src/lib/alertStore.ts:44`), kein Server-Alerting |
| 13 | Backtesting | 🟢 | 🟡 | Echte Metriken; PROD mit Herkunftskennzeichnung, DEV ohne |
| 14 | Simulation | 🟡 | 🟡 | Monte-Carlo nur in PROD (`MonteCarloDetailed.tsx`) |
| 15 | Portfolio | 🟢 | 🟢 | `PortfolioBacktester.tsx`, Multi-Asset mit Forward-Fill |
| 16 | Exports | 🟢 | 🟢 | PDF über jsPDF |
| 17 | API | 🟡 | 🔴 | PROD JWT-geschützt; DEV mit `?email=`-Autorisierung |
| 18 | Benutzerverwaltung | 🟢 | 🔴 | PROD `server/iam/`; DEV ohne IAM |
| 19 | Billing | 🟢 | 🔴 | PROD tokenbasiert; DEV mit IDOR auf allen Endpunkten |
| 20 | Monitoring | 🔴 | 🔴 | Keine Health-Checks, keine Metrics, kein Tracing |
| 21 | Feedback | 🔴 | 🔴 | Kein Rückkanal Nutzer → System |
| 22 | Learning Loop | 🔴 | 🔴 | Kein Code |
| 23 | Continuous Improvement | 🔴 | 🔴 | Keine Tests, keine CI, keine Regressionssicherung |
| 24 | Governance über die Kette | 🟡 | 🔴 | PROD Registry/ADR; DEV ohne Registry |

Von 24 Stufen sind in PROD 8 grün, 7 gelb, 9 rot; in DEV 5 grün, 6 gelb, 13 rot.

---

## 6. Rechtsrisiko: Die Scoring-Eingangsgrößen sind erfunden

**Befund AUD2-F-001 — Priorität P0 — betrifft beide Umgebungen**

### 6.1 Sachverhalt

Die Funktion `generateCryptoScores()` in `src/services/scoring.service.ts:104-125` erzeugt
sämtliche Eingangsgrößen der Bewertung aus einem Zeichen-Hash des Tickersymbols:

```ts
export function generateCryptoScores(symbol: string, change24h: number): CryptoScores {
  const s = symbol.toUpperCase().trim();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const seed = (Math.abs(hash) % 100) / 100;

  let marketCap          = 50 + seed * 30;
  let liquidity          = 60 + seed * 20;
  let volumeQuality      = 70 + (seed - 0.5) * 20;
  let tokenomics         = 65 + (seed - 0.5) * 15;
  let supplyTransparency = 80 + (seed - 0.5) * 20;
  let networkActivity    = 55 + seed * 35;
  let security           = 85 + (seed - 0.5) * 10;
  let developerActivity  = 60 + seed * 30;
  let utility            = 50 + seed * 40;
  let feeGeneration      = 30 + seed * 50;
  let revenue            = 25 + seed * 40;
  let governanceStrength = 70 + (seed - 0.5) * 15;
  let adoption           = 40 + seed * 50;
  …
```

Marktkapitalisierung, Liquidität, Tokenomics, Sicherheitsbewertung, Entwickleraktivität, Umsatz
und Adoption sind damit **deterministische Funktionen der Buchstaben des Tickersymbols**. Sie
haben zu den real erfassten Marktdaten (Kapitel 4.1) keinerlei Verbindung. Nur für wenige
Blue-Chip-Symbole existieren hartkodierte Sonderwerte (`:132-207`).

Dieselbe Konstruktion findet sich in `src/services/cryptoScoringService.ts:215`
(`generateCryptoInputs`) und `src/services/memeCoinScoringService.ts:173`
(`generateMemeCoinInputs`).

### 6.2 Es ist der Produktivpfad, keine Testfunktion

| Aufrufstelle | Zweck |
|---|---|
| `server.ts:296` | Marktdaten-Anreicherung |
| `server.ts:1332`, `:1340`, `:1367`, `:1380` | Scoring-Endpunkte |
| `src/routes/cryptoRoutes.ts:22`, `:92`, `:131` | `/api/crypto/*` |
| `src/orchestrator/cryptoOrchestrator.ts:68` | Agenten-Orchestrierung |

### 6.3 Widerspruch zur eigenen rechtlichen Zusicherung

`docs/DATENSCHUTZ_PROTOKOLL.md:58`:

> Es stellt sicher, dass **keine unautorisierten IP-Adressen-Lecks** an US-amerikanische
> Drittanbieter stattfinden und sämtliche Berechnungsmodelle der gesetzlichen
> **No-Demo-Data-Policy** (Verbot von simulierten Täuschungsdaten ohne reale Historie)
> entsprechen.

`docs/DATENSCHUTZ_PROTOKOLL.md:81`:

> Um die Einhaltung der gesetzlichen **No-Demo-Data Policy** zu garantieren, bezieht das System
> ausschließlich mathematisch-reale Marktdaten […]

Beide Zusicherungen treffen für die Scoring-Eingangsgrößen nicht zu. Das Dokument ist
verbraucherseitig gerichtet und rechtlich gefasst; die Abweichung ist damit nicht nur ein
technischer Mangel, sondern eine unzutreffende Zusicherung in einem Dokument mit
Außenwirkung.

### 6.4 Risikoeinordnung

Das System gibt eine Bewertung auf einer Skala von 0 bis 100 aus, ergänzt um eine
Begründungsliste („Explainability") und einen Confidence-Wert. Für einen Nutzer ist die Ausgabe
von einer datenbasierten Analyse nicht unterscheidbar. Da die Ausgabe zur Auswahl von
Vermögenswerten dient, entsteht eine anlageberatungsähnliche Wirkung auf fabrizierter
Grundlage. Die Kombination aus (a) erfundenen Eingangsgrößen, (b) einer als Analyse
präsentierten Ausgabe und (c) einer gegenteiligen schriftlichen Zusicherung begründet ein
Haftungs- und Aufsichtsrisiko, das die rein technische Bewertung übersteigt.

### 6.5 Empfohlene Sofortmaßnahmen

Diese Maßnahmen wurden im Rahmen dieses Auftrags **bewusst nicht umgesetzt** — der Auftraggeber
hat entschieden, den Befund auszuweisen und die Umsetzung gesondert zu entscheiden.

1. **Sofort (Tage):** Die Bewertung in Oberfläche und API als nicht marktdatenbasiert
   kennzeichnen — analog zur bereits umgesetzten `source`-Kennzeichnung im Backtest
   (`src/components/BacktestEngine.tsx:178-190`). Alternativ die betroffenen Ausgaben bis zur
   Behebung deaktivieren.
2. **Kurzfristig (Wochen):** Die Zusicherungen in `docs/DATENSCHUTZ_PROTOKOLL.md` auf den
   tatsächlichen Stand bringen. Eine unzutreffende Zusicherung ist gravierender als eine
   eingeschränkte.
3. **Mittelfristig:** Die Eingangsgrößen an reale Quellen anbinden. Für Marktkapitalisierung,
   Volumen und Liquidität liegen die Daten bereits vor (CoinMarketCap, CoinGecko); für
   Entwickleraktivität, Tokenomics und Umsatz sind zusätzliche Quellen erforderlich. Faktoren
   ohne belastbare Quelle sind aus dem Modell zu entfernen, nicht zu schätzen.
4. **Begleitend:** Rückwirkende Validierung der Scores gegen realisierte Wertentwicklung, um
   Trefferquote und Falsch-Positiv-Rate erstmals zu beziffern.

---

## 7. Sicherheitsbefunde

### 7.1 DEV — nicht produktionsfähig

| ID | Befund | Beleg |
|---|---|---|
| AUD2-F-002 | Hartkodierter Administrationstoken `'aif-admin-2026'` als Vorgabewert; Vergleich nicht laufzeitkonstant | `server/orchestrator.ts:9`, `:13` |
| AUD2-F-003 | Administrationszugriff ohne Credential — Autorisierung über den vom Client gelieferten Wert `?email=` / `x-user-email` / Body | `server/systemEvents.ts:10`, `:146`, `:158`, `:189`; `server/compliance/routes.ts:13-28`; `server/versionManager.ts:12`; `server/documentHygiene.ts:20` |
| AUD2-F-004 | IDOR auf allen Billing-Endpunkten — beliebige Kundendaten und Stripe-Portal-Sitzungen über fremde Kennung abrufbar | `server/stripe.ts:249`, `:287-305`, `:304-306`, `:325-328` |
| AUD2-F-005 | Sieben Compliance-Endpunkte unauthentifiziert, inkl. Findings mit Dateipfaden | `server/compliance/routes.ts:31`, `:60`, `:74`, `:80`, `:94`, `:110`, `:138` |
| AUD2-F-006 | CORS-Wildcards per Präfix/Suffix statt Allowlist; `frame-ancestors` mit `*.run.app`/`*.google.com` auch in Produktion | `server.ts:70-80`, `:125` |
| AUD2-F-007 | Row-Level-Security auf 6 von 11 Tabellen aktiviert, aber ohne Policy; 4 weitere mit **hartkodierten E-Mail-Adressen in der Policy** statt Rollenbezug | `docs/compliance/migrations.sql` |
| AUD2-F-008 | Kein `unhandledRejection`-Netz, kein globaler Fehlerbehandler | Suche liefert 0 Treffer |
| AUD2-F-009 | `uploads/` nicht in `.gitignore` — Abo-, Credit- und Audit-Daten können versioniert werden | `.gitignore` |
| AUD2-F-010 | `apiKey: process.env.GEMINI_API_KEY \|\| 'placeholder_key'` | `server/documentary/documentaryEngine.ts:9`, `server/documentHygiene.ts:24` |

In PROD sind AUD2-F-002 bis F-010 sämtlich **nicht** vorhanden; eine Suche nach hartkodierten
Rückfallwerten für Secrets liefert dort null Treffer.

### 7.2 PROD — belastbarer Kern mit konkreten Restlücken

| ID | Befund | Beleg | Priorität |
|---|---|---|---|
| AUD2-F-011 | **Das Zugriffsprotokoll ist still wirkungslos.** Der Insert schreibt `user_id`, `reason`, `ip_address`, `user_agent`; die Migration legt diese Spalten nicht an. Der Fehler wird in einem leeren `catch` verschluckt. | `server/iam/authMiddleware.ts:121-130` gegen `supabase/migrations/20260711000000_iam.sql:30-37`; `:131-133` | P0 |
| AUD2-F-012 | `security_events`, `step_up_tokens`, `break_glass_codes`, `profiles.totp_*` werden im Code beschrieben, besitzen aber **kein `CREATE TABLE`** im Repository | `server/stepUp.ts:29`, `:74`, `:95`, `:123-126`; `server.ts:108` | P1 |
| AUD2-F-013 | `requireStepUp()` und `OWNER_ONLY_ROLES` sind implementiert, werden aber **nirgends erzwungen** — kritische Aktionen wie Versions-Rollback laufen ohne zweiten Faktor | `server/iam/authMiddleware.ts:260-284`; `server/versionManager.ts:615` | P1 |
| AUD2-F-015 | Kein globales Rate-Limiting; der vorhandene Begrenzer ist nicht mehrinstanzfähig (Kommentar dokumentiert dies) | `server/iam/rateLimiter.ts:8-13` | P2 |
| AUD2-F-016 | Datei-Upload ohne `limits`, ohne `fileFilter`; `/api/analyze-image` **ohne Authentifizierung**; MIME-Typ ungeprüft vom Client übernommen | `server.ts:222`, `server/ai.ts:8`, `:91` | P1 |
| AUD2-F-017 | `TOTP_ENCRYPTION_KEY`, `SMTP_*`, `AI_STUDIO_ORIGIN`, `STRIPE_PRICE_ID_*` fehlen in `render.yaml` — ohne den ersten schlägt der gesamte Step-Up-Pfad fehl | `render.yaml` | P0 |
| AUD2-F-018 | Container läuft als `root` (keine `USER`-Direktive), kein `HEALTHCHECK` | `Dockerfile:27-45` | P2 |
| AUD2-F-019 | Kein Helmet, kein CSRF-Schutz; CSP mit `'unsafe-inline'` und `'unsafe-eval'` | `package.json`; `server.ts:173` | P2 |
| AUD2-F-020 | Leere `catch {}`-Blöcke an sicherheitsrelevanten Stellen — Sicherheitsereignisse können unbemerkt verloren gehen | `server/iam/authMiddleware.ts:103-105`, `:244-246`, `:304-306`; `server/stepUp.ts:38-40` | P1 |

Positiv hervorzuheben: `checkAdminAccess()` ist an drei Stellen ausdrücklich fail-closed
ausgelegt (`authMiddleware.ts:181-198`, `:238-248`); Step-Up-Token werden atomar
einmalverbraucht (`:271-279`); Break-Glass-Codes werden ausschließlich gehasht gespeichert
(`server/stepUp.ts:133-135`); die Rückfallrichtung von `quota.ts` ist bewusst gewählt und
begründet (`:101-107`).

---

## 8. Entwicklungsumgebung gegen Produktion

### 8.1 Abweichungsmatrix

| Dimension | DEV | PROD | Bewertung |
|---|---|---|---|
| Paketidentität | `react-example` v0.0.0 | `capital-ai` v0.6.0 | DEV ohne Versionsidentität |
| IAM | fehlt vollständig | `server/iam/` (5 Module, 619 LOC) | **nur PROD** |
| Step-Up-Authentifizierung | fehlt | `server/stepUp.ts` (273 LOC) | **nur PROD** |
| Serverseitige Quota | fehlt | `server/quota.ts` (108 LOC) | **nur PROD** |
| E-Mail-Versand | fehlt | `server/mailer.ts` (263 LOC) | **nur PROD** |
| Datenbank-Migrationen | 1 Datei außerhalb `supabase/` | 5 Dateien in `supabase/migrations/` | **nur PROD** |
| Registry / Ausnahmeverfahren | fehlt | 2 Registries | **nur PROD** |
| Komponenten-Manifeste | 3 | 25 | **PROD** |
| Compliance-Code | 16 Dateien, ~2.100 LOC | 4 Dateien, 845 LOC | **DEV umfangreicher, PROD tiefer prüfend** |
| Documentary Engine | implementiert | nicht implementiert | **nur DEV** |
| Traceability-Code | 11 Dateien | 0 (nur Manifest) | **nur DEV** |
| Meme-Coin-Agenten | 2 Agenten + Orchestrator (toter Code) | fehlen | **nur DEV** |
| EventMesh | 19 Dateien camelCase | 36 Dateien PascalCase | **unvereinbar** |
| Herkunftskennzeichnung Daten | fehlt | `source: 'live' \| 'simulated'` | **nur PROD** |
| Prozess-Fehlernetze | fehlen | vorhanden | **nur PROD** |
| Tests | 0 | 0 | **beide** |
| CI/CD | fehlt | fehlt | **beide** |
| Health-Checks / Metrics | fehlen | fehlen | **beide** |

### 8.2 Fehlende Wertschöpfungsschritte je Umgebung

**In DEV zusätzlich fehlend:** Benutzerverwaltung, abgesichertes Billing, Quota-Durchsetzung,
Datenherkunftskennzeichnung, Governance-Registry.
**In PROD zusätzlich fehlend:** Documentary Engine als Code, Traceability als Code,
Meme-Coin-Agenten.
**In beiden fehlend:** Datenqualitätssicherung, Feature Engineering aus realen Daten,
serverseitiges Alerting, Monitoring, Feedback-Kanal, Learning Loop, Continuous Improvement.

### 8.3 Auflösung des Reifegrad-Widerspruchs

| Kennzahl | DEV meldet | PROD misst |
|---|---|---|
| Gesamtreife | 76 / 100 („Advanced Tier") | 46 / 100 |
| Governance | 100 / 100 („ENTERPRISE_GOLD") | 0 / 100 |
| Repository Health | 100 / 100 | 28 / 100 |
| Architecture Compliance | 100 / 100 über 11 Domänen | 55 / 100 |
| Event Readiness | 100 / 100 („Gold Standard") | kein Score, Status „Analyse" |

Die DEV-Werte sind nicht belastbar. Drei Belege:

1. Der DEV-Bericht bescheinigt „Repository Compliance 100/100 — All mandatory files
   (`README.md`, `CHANGELOG.md`, `metadata.json`) verified" — eine Root-`CHANGELOG.md`
   existiert in **keiner** der beiden Umgebungen.
2. Der DEV-Bericht bescheinigt „Digital Twin Compliance 100/100 — strictly synchronized",
   während ein Bericht **im selben Verzeichnis** feststellt, der Knowledge Graph sei „noch nicht
   instanziiert" und dabei auf eine Datei `KNOWLEDGE_BASE.md` verweist, die in keiner Umgebung
   existiert.
3. Der DEV-Gap-Report fordert „Component Manifests — Pflicht in allen `src/platform/*`" als
   offenen Punkt, während die Maturity-Berichte desselben Ordners 100/100 melden. Tatsächlich
   hat DEV 3 von 24 Manifesten.

Handgesetzte Reifegrade widersprechen ESS-0001-CONTRACTS Chapter 12, wonach Kennzahlen
ausschließlich berechnet und niemals manuell gesetzt werden. PROD hält sich daran: Alle
`quality.*Score`-Felder der Vollmanifeste stehen auf `null` mit ausdrücklichem Vermerk.

**Bewertung dieses Audits:** Die DEV-Selbstbewertung wird verworfen. Maßgeblich sind die in
Kapitel 11 berechneten Werte.

---

## 9. Heatmaps

Legende: 🟢 ≥ 7 · 🟡 4–6 · 🟠 2–3 · 🔴 0–1

### 9.1 Codequalität

| Aspekt | PROD | DEV |
|---|---|---|
| Komplexität (God Objects) | 🟠 | 🟠 |
| Lesbarkeit | 🟡 | 🟡 |
| Testbarkeit | 🔴 | 🔴 |
| Logging | 🟠 | 🟠 |
| Error Handling | 🟡 | 🔴 |
| Performance | 🟡 | 🟡 |
| Security | 🟡 | 🔴 |
| Dokumentation im Code | 🟢 | 🟡 |
| Best Practices | 🟠 | 🟠 |
| Enterprise Standards | 🟠 | 🔴 |

### 9.2 Architektur

| Aspekt | PROD | DEV |
|---|---|---|
| Modularität | 🟡 | 🟡 |
| DDD | 🔴 | 🔴 |
| Clean / Hexagonal | 🔴 | 🔴 |
| SOLID | 🟠 | 🟠 |
| KISS / DRY | 🟠 | 🟠 |
| Schichtentrennung | 🟡 | 🟡 |
| Plattformmodule umgesetzt | 🟠 (1 von 24) | 🟠 (4 von 24) |
| Event-Architektur | 🟡 | 🟠 |

### 9.3 AI

| Aspekt | PROD | DEV |
|---|---|---|
| Provider-Anbindung | 🟡 (nur Gemini) | 🟡 |
| Ehrlichkeit der Statusanzeige | 🟢 | 🔴 |
| Prompt-Management | 🔴 | 🔴 |
| Context-Management | 🔴 | 🔴 |
| Model-Routing / Fallback | 🔴 | 🔴 |
| RAG / Embeddings | 🔴 | 🔴 |
| Memory | 🔴 | 🔴 |
| Evaluation | 🔴 | 🔴 |
| Tool-/Agent-Registry | 🟠 | 🟠 |
| Kosten-/Token-Erfassung | 🔴 | 🔴 |

### 9.4 Governance

| Aspekt | PROD | DEV |
|---|---|---|
| Policies | 🟢 | 🟠 |
| Architecture Governance | 🟢 | 🟠 |
| Coding Standards | 🟠 | 🟠 |
| Version Governance | 🟡 | 🔴 |
| Review-Prozesse | 🟠 | 🔴 |
| AI Governance | 🟡 | 🟠 |
| Decision Records | 🟢 | 🟡 |
| Change Management | 🟡 | 🔴 |
| Auditierbarkeit | 🟡 | 🔴 |
| Nummernraum-Integrität | 🟢 | 🔴 |

### 9.5 Compliance

| Aspekt | PROD | DEV |
|---|---|---|
| OWASP | 🟡 | 🟠 |
| ISO 27001 | 🔴 | 🔴 |
| ISO 42001 | 🔴 | 🔴 |
| SOC 2 | 🔴 | 🔴 |
| DSGVO/GDPR | 🟡 | 🟠 |
| NIS2 | 🔴 | 🔴 |
| Financial Compliance | 🟠 | 🔴 |
| Audit Logs | 🟠 (wirkungslos, F-011) | 🟠 |
| Secrets | 🟢 | 🔴 |
| Encryption | 🟢 | 🔴 |
| IAM | 🟢 | 🔴 |
| Least Privilege | 🟡 | 🔴 |

### 9.6 Screening

| Aspekt | PROD | DEV |
|---|---|---|
| Datenqualität | 🔴 | 🔴 |
| Realtime | 🟡 | 🟡 |
| Scoring | 🔴 (Eingangsgrößen) | 🔴 |
| Ranking | 🟡 | 🟡 |
| Fundamentaldaten | 🟠 | 🔴 |
| Technische Analyse | 🟡 | 🟡 |
| Sentiment | 🟡 | 🟡 |
| OnChain | 🟠 | 🟠 |
| Makrodaten | 🟠 | 🟠 |
| Korrelationen | 🟡 | 🟡 |
| Signalqualität / FP-Rate | 🔴 (unbekannt) | 🔴 |
| Explainability | 🟡 | 🟡 |
| Backtesting | 🟢 | 🟡 |
| Portfolio-Integration | 🟢 | 🟢 |

### 9.7 Dokumentation

| Aspekt | PROD | DEV |
|---|---|---|
| Struktur | 🟢 | 🟡 |
| ADR | 🟢 | 🟡 |
| ESS | 🟢 | 🟡 |
| Traceability ESS→ADR→Code | 🟡 | 🟠 |
| Traceability Code→Test | 🔴 | 🔴 |
| Versionierung | 🟡 | 🟠 |
| Registry | 🟢 | 🔴 |
| Selbstkonsistenz | 🟡 | 🔴 |
| Root-Dokumente (README/AGENTS) | 🟠 | 🟠 |

### 9.8 Enterprise Readiness

| Aspekt | PROD | DEV |
|---|---|---|
| Monitoring | 🔴 | 🔴 |
| Observability | 🔴 | 🔴 |
| Health Checks | 🔴 | 🔴 |
| CI/CD | 🔴 | 🔴 |
| Tests | 🔴 | 🔴 |
| Secrets Management | 🟡 | 🔴 |
| Deployment | 🟡 | 🟡 |
| Rollback / Blue-Green / Canary | 🔴 | 🔴 |
| Disaster Recovery / Backup | 🔴 | 🔴 |
| Skalierbarkeit (Zustandshaltung) | 🟠 | 🟠 |

---

## 10. Architekturvergleich mit Referenzplattformen

Die genannten Plattformen dienen ausschließlich als **Architektur-Benchmark**. Es wird kein
Nachbau empfohlen; bewertet werden strukturelle Eigenschaften.

### 10.1 Datenqualitätsschicht

Bloomberg, FactSet, Refinitiv, S&P Capital IQ und Kaiko trennen durchgängig zwischen
Datenerfassung, **Datenqualitätssicherung** und Auslieferung. Kennzeichnend sind eine
Herkunftsangabe je Datenpunkt, Versionierung von Korrekturen und ein dokumentierter Umgang mit
Lücken.

CAPITAL-AI erfasst Daten (Stufe 2–3 der Kette ist grün), besitzt aber keine
Datenqualitätsschicht (Stufe 4 rot). Die in PROD eingeführte `source`-Kennzeichnung für
Historiendaten ist der erste Baustein in diese Richtung und methodisch richtig — sie ist
allerdings auf den Backtest-Pfad beschränkt und deckt die Bewertungseingangsgrößen nicht ab.

**Abstand:** groß. **Empfehlung:** die `source`-Kennzeichnung als durchgängiges Muster auf alle
Datenpunkte ausdehnen.

### 10.2 Explainability und Nachvollziehbarkeit

Aladdin und Glassnode weisen für jede Kennzahl die zugrundeliegenden Eingangsdaten und den
Berechnungsstand aus; ein Nutzer kann eine Zahl bis zur Quelle zurückverfolgen.

CAPITAL-AI liefert Begründungstexte, aber keine Rückverfolgbarkeit zur Quelle — und im Fall der
Scoring-Eingangsgrößen gäbe es auch keine Quelle, auf die zurückverfolgt werden könnte
(Kapitel 6). Das ist der größte einzelne Abstand im gesamten Vergleich.

**Abstand:** sehr groß.

### 10.3 Auditierbarkeit

Enterprise-Plattformen im Finanzumfeld protokollieren Zugriffe unveränderlich und
nachweisführend.

PROD hat die Architektur dafür angelegt (`audit_logs_iam`, `iam_access_log`, bewusst ohne
Policies als append-only ausgelegt), aber das Zugriffsprotokoll schreibt aufgrund des
Schema-Bruchs nicht (AUD2-F-011). Die Absicht ist vorhanden, die Wirkung nicht.

**Abstand:** mittel — mit geringem Aufwand deutlich zu verkleinern.

### 10.4 Multi-Agent-Governance

Databricks, Microsoft Fabric AI und Anthropic Claude Enterprise kennzeichnen ihre
Agentenarchitekturen durch Werkzeugregister, Modellrouting, Evaluationspfade und
Kostentransparenz.

CAPITAL-AI besitzt Agenten und Orchestratoren, aber keines dieser vier Merkmale (Kapitel 4.7).
Die als „Supervisor" bezeichnete Komponente ist ein Anzeige-Dashboard.

**Abstand:** groß.

### 10.5 Anlageklassen-Abdeckung

Koyfin, TradingView und CoinGecko decken ihre beworbenen Klassen jeweils mit klassenspezifischer
Bewertungslogik ab.

CAPITAL-AI führt zehn Klassen in der Oberfläche, besitzt aber für vier eine eigene Engine
(Kapitel 4.8). Aktien, Forex und Indizes werden über eine Momentum-Heuristik bewertet, Anleihen
über einen statischen Wert; ETFs existieren nicht als Typ.

**Abstand:** groß. **Empfehlung:** entweder die Klassen ohne Engine kennzeichnen oder das
Leistungsversprechen einschränken.

### 10.6 Zusammenfassung des Vergleichs

| Dimension | Abstand | Vordringlichkeit |
|---|---|---|
| Datenqualitätsschicht | groß | hoch |
| Explainability / Rückverfolgbarkeit | sehr groß | **sehr hoch** |
| Auditierbarkeit | mittel | hoch |
| Multi-Agent-Governance | groß | mittel |
| Anlageklassen-Abdeckung | groß | hoch |
| Governance-Dokumentation | **gering — hier liegt CAPITAL-AI über dem Erwartungswert für seine Größe** | — |

Der letzte Punkt verdient Hervorhebung: Das Governance-Gerüst von PROD (Registry,
Ausnahmeverfahren, ADR-Disziplin, Verantwortungsmatrix) ist für ein Vorhaben dieser Größe
ungewöhnlich weit entwickelt. Das Missverhältnis besteht darin, dass diesem Gerüst die
Implementierung fehlt — 23 von 24 Plattformmodulen sind leere Hüllen.

---

## 11. Enterprise Scores

### 11.1 Rechenweg Gesamtscore

| # | Kategorie | Gewicht | PROD | PROD gewichtet | DEV | DEV gewichtet |
|---|---|---|---|---|---|---|
| 1 | Wertschöpfungskette | 4 | 4 | 16 | 3 | 12 |
| 2 | Documentary Engine | 2 | 3 | 6 | 5 | 10 |
| 3 | Code Engine | 3 | 4 | 12 | 4 | 12 |
| 4 | Supervisor Layer | 2 | 2 | 4 | 2 | 4 |
| 5 | Governance | 3 | 7 | 21 | 2 | 6 |
| 6 | Compliance | 4 | 5 | 20 | 3 | 12 |
| 7 | AI-Orchestrierung | 3 | 3 | 9 | 2 | 6 |
| 8 | Finanzscreening | 4 | 3 | 12 | 3 | 12 |
| 9 | Codequalität | 3 | 3 | 9 | 3 | 9 |
| 10 | Bewertungssystem | 4 | 3 | 12 | 3 | 12 |
| 11 | Enterprise Plattform | 4 | 2 | 8 | 1 | 4 |
| 12 | AI Enterprise Readiness | 2 | 2 | 4 | 2 | 4 |
| | **Summe** | **38** | | **133** | | **103** |

```
PROD = (133 / 38) × 10 = 3,50 × 10 = 35,0  →  35 / 100
DEV  = (103 / 38) × 10 = 2,71 × 10 = 27,1  →  27 / 100
```

### 11.2 Teilscores

| Teilscore | Ableitung | PROD | DEV |
|---|---|---|---|
| **Gesamtscore** | gewichtetes Mittel (11.1) | **35** | **27** |
| Technischer Score | Mittel aus 3, 9, 11 | 30 | 27 |
| Business Score | Mittel aus 1, 8, 10 | 33 | 30 |
| AI Score | Mittel aus 4, 7, 12 | 23 | 20 |
| Compliance Score | Kategorie 6 | 50 | 30 |
| Architecture Score | Mittel aus 3, 5 | 55 | 30 |
| Production Score | Kategorie 11 | 20 | 10 |
| Documentation Score | Kategorie 2 | 30 | 50 |
| Developer Experience | Mittel aus 3, 9 abzüglich fehlender Tests/CI | 30 | 27 |
| Enterprise Readiness | Gesamtscore | 35 | 27 |
| FinTech Readiness | Mittel aus 6, 8, 10 | 37 | 30 |
| AI Maturity | Mittel aus 7, 12 | 25 | 20 |
| Governance Maturity | Kategorie 5 | 70 | 20 |

### 11.3 Einordnung gegenüber dem Vorgänger-Audit

`ENTERPRISE_MATURITY_REPORT.md` weist 46/100 aus, dieses Audit 35/100. Die Differenz ist
**nicht** auf eine Verschlechterung zurückzuführen, sondern auf drei zusätzlich erfasste
Befunde: den Eingangsdatenbefund der Scoring-Engines (Kapitel 6), die Wirkungslosigkeit des
Zugriffsprotokolls (AUD2-F-011) und die vollständige Erfassung der Betriebsreife
(Kategorie 11), die im Vorgänger-Audit nicht mit kritischem Gewicht bewertet wurde.

---

## 12. Im Rahmen dieses Audits behobene Fehler

Drei akute Produktionsfehler wurden festgestellt und unmittelbar behoben.

### 12.1 AUD2-F-021 — Portfolio-Backtesting und Chart-Historie funktionslos (P0, behoben)

**Ursache.** `/api/backtest-history` wurde in einer vorangegangenen Änderung von einem Array auf
`{ data, source }` umgestellt (`server.ts:1192`). Von drei Konsumenten wurde nur einer
angepasst. Die beiden übrigen prüften weiterhin auf ein Array und warfen dadurch **immer**:

- `src/components/PortfolioBacktester.tsx:249` — `!Array.isArray(data)` war stets wahr, wodurch
  für **jedes** Symbol „Keine Verlaufsdaten für …" ausgelöst wurde. Portfolio-Backtesting war
  vollständig funktionslos.
- `src/components/Charts.tsx:194` — `Array.isArray(data)` war stets falsch, wodurch
  „Ungültiges Datenformat empfangen." ausgelöst wurde. Die Chart-Historie lud nie.

**Behebung.** Beide Konsumenten lesen jetzt `responseBody.data` und `responseBody.source`. Die
Herkunftskennzeichnung wird in beiden Komponenten sichtbar ausgewiesen, wenn simulierte
Ersatzdaten verwendet werden — andernfalls wäre an zwei Stellen ein neuer Verstoß gegen die
No-Demo-Data-Policy entstanden.

**Bewertung.** Dieser Fehler ist der unmittelbare Beleg für den Befund aus Kapitel 4.9: Ohne
Tests und ohne CI bleibt ein Vertragsbruch zwischen API und Konsumenten unentdeckt, bis er im
Betrieb auffällt.

### 12.2 AUD2-F-022 — Serverstart ohne KI-Schlüssel unmöglich (P0, behoben)

**Ursache.** `server.ts:235-236` riefen `getGeminiInstance()` unbedingt zur Modul-Ladezeit auf,
außerhalb jedes `try/catch`. Die Funktion wirft ohne `GEMINI_API_KEY` (`server/ai.ts:16-18`).
Die unmittelbar darüberstehende defensive Ermittlung derselben Instanz (`:226-232`, korrekt in
`try/catch`) lief dadurch ins Leere.

**Behebung.** Die bereits defensiv ermittelte Instanz `ai` wird weitergereicht. Beide Router und
die dahinterliegenden Orchestratoren akzeptieren `GoogleGenAI | null` und liefern ohne Client
ihre quantitativen Rückfallwerte.

**Nachweis.** Serverstart ohne gesetzten `GEMINI_API_KEY` wurde ausgeführt und erreicht
`Server running on http://localhost:3000`.

### 12.3 AUD2-F-023 — Nicht existierende Komponente als betriebsbereit gemeldet (P0, behoben)

**Ursache.** `/api/admin/orchestrators/status` meldete `memecoin_orchestrator` mit
`status: 'CONNECTED'`, `agentsCount: 2`, `lastActive: 'Aktiv'`
(`server/systemEvents.ts:552`). Weder `src/orchestrator/memeCoinOrchestrator.ts` noch die
beiden zugehörigen Agenten existieren in PROD. `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md:58`
verwies ebenfalls auf den nicht vorhandenen Pfad.

Bei der Bereinigung wurde ein **viertes Vorkommen** entdeckt: Ein hartkodiertes Rückfall-Array
im Supervisor-Dashboard (`src/components/SupervisorDashboard.tsx:757-759`) enthielt dieselbe
Phantom-Komponente **sowie erfundene Latenzwerte** (32/15/48 ms) — genau die Werte, die in einer
vorangegangenen Bereinigung serverseitig entfernt worden waren und im Frontend überdauert hatten.

**Behebung.** Eintrag aus der Statusantwort entfernt; Dokumentationsabschnitt auf den
tatsächlichen Stand korrigiert (die Meme-Coin-Scoring-Engine existiert und wird genutzt, es gibt
jedoch keinen Orchestrator und keine Agenten); hartkodiertes Rückfall-Array durch einen leeren
Zustand ersetzt.

### 12.4 Verifikation

| Prüfung | Ergebnis |
|---|---|
| `npx tsc --noEmit` | 0 Fehler |
| `npx vite build` | erfolgreich |
| Serverstart ohne `GEMINI_API_KEY` | startet, erreicht Port 3000 |
| Restvorkommen `memecoin_orchestrator` im Code | keine (nur erläuternde Kommentare) |

---

## 13. SWOT

### Stärken

- Governance-Gerüst von PROD: zwei Registries mit durchgesetzten Vergaberegeln, nachverfolgtes
  Ausnahmeverfahren mit belegten Erledigungen, 14 ADRs mit Ablagekonvention, 25 Manifeste
- Sicherheitskern von PROD: fail-closed ausgelegte, JWT-basierte Autorisierung mit Rollenmodell,
  Step-Up-Authentifizierung mit atomarem Einmalverbrauch, gehashte Break-Glass-Codes,
  keine hartkodierten Secrets
- Acht real angebundene Marktdatenquellen mit Rückfallkette und Cache
- Die eingeführte Herkunftskennzeichnung `source: 'live' | 'simulated'` — methodisch der richtige
  Ansatz, bislang nur nicht durchgängig
- Compliance-Scanner von PROD prüfen reale Strukturen und melden eigene Lücken korrekt

### Schwächen

- Scoring-Eingangsgrößen aus Symbol-Hash (Kapitel 6) — der schwerwiegendste Einzelbefund
- Null Tests, null CI in beiden Umgebungen
- Keine Betriebsreife: keine Health-Checks, keine Metrics, kein Tracing, kein Rollback, kein Backup
- 23 von 24 Plattformmodulen in PROD sind leere Hüllen
- Zugriffsprotokoll schreibt aufgrund eines Schema-Bruchs nicht (AUD2-F-011)
- Traceability-Kette endet bei „Test" — kein Manifest führt ein `tests`-Feld

### Chancen

- Der Abstand zwischen Governance-Reife (70) und Umsetzungsreife (35) lässt sich gezielt
  verkleinern: Die Spezifikationen liegen vor, es fehlt die Implementierung
- Health-Check und CI sind mit je ein bis zwei Personentagen umsetzbar und heben die
  Betriebsreife sofort messbar
- Die Documentary-Engine- und Traceability-Implementierungen aus DEV können unter neuer
  Nummernvergabe übernommen werden und schließen zwei der größten Lücken
- Die Rohstoff-Engine ist ein funktionierendes Vorbild für konfigurierbare, versionierte
  Gewichte, das auf die anderen drei Engines übertragbar ist

### Risiken

- **Rechts- und Aufsichtsrisiko** aus der Kombination von erfundenen Eingangsgrößen,
  anlageberatungsähnlicher Ausgabe und gegenteiliger schriftlicher Zusicherung
- Ein unvorbereiteter Merge der beiden Forks zerstört auf case-insensitiven Dateisystemen
  lautlos Dateien
- Ohne Tests und CI bleibt jede weitere Änderung so ungesichert wie die drei in Kapitel 12
  behobenen Fehler
- Die Fork-Divergenz wächst mit jedem Tag paralleler Weiterentwicklung
- Geschäftsdaten in `uploads/` sind auf Container-Plattformen flüchtig

---

## 14. Priorisierte Roadmap

Aufwand in Personentagen (PT). ROI-Skala: sehr hoch / hoch / mittel / niedrig.

### 14.1 Quick Wins (< 1 Woche, je ≤ 2 PT)

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Abhängigkeiten | Betroffene Dateien |
|---|---|---|---|---|---|---|---|
| Q1 | `render.yaml` um `TOTP_ENCRYPTION_KEY`, `SMTP_*`, `AI_STUDIO_ORIGIN`, `STRIPE_PRICE_ID_*` ergänzen | hoch — Step-Up sonst funktionslos | sehr hoch | 0,5 | niedrig | — | `render.yaml` |
| Q2 | React Error Boundary in der Wurzel | hoch — verhindert Totalausfall der Oberfläche | sehr hoch | 1 | niedrig | — | `src/App.tsx` |
| Q3 | Health-Check-Endpunkt `/healthz` + `healthCheckPath` | hoch — Voraussetzung für jedes Monitoring | sehr hoch | 1 | niedrig | — | `server.ts`, `render.yaml` |
| Q4 | `USER`-Direktive und `HEALTHCHECK` im Dockerfile | mittel | hoch | 0,5 | niedrig | Q3 | `Dockerfile` |
| Q5 | `adr_history.json` auf ADR-0019 nachführen | mittel — Laufzeit kennt 10 ADRs nicht | hoch | 1 | niedrig | — | `docs/adr/adr_history.json` |
| Q6 | Duplikat der Meme-Coin-Gewichte auflösen | mittel | hoch | 0,5 | niedrig | — | `src/services/memeCoinScoringService.ts` |
| Q7 | Hartkodierte Agenten-Registry und Prompt-Historie entfernen | hoch — No-Demo-Data | hoch | 2 | niedrig | — | `server/systemEvents.ts:249`, `src/components/SupervisorDashboard.tsx:159` |
| Q8 | EXC-0001/EXC-0002 auf tatsächlichen Umfang aktualisieren | mittel | mittel | 0,5 | niedrig | — | `.ai/registry/exception-registry.json` |

**Summe Quick Wins: 7 PT.**

### 14.2 30 Tage

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Abhängigkeiten | Betroffene Module |
|---|---|---|---|---|---|---|---|
| D1 | **Kennzeichnung der Scoring-Ausgaben als nicht marktdatenbasiert** | sehr hoch — Rechtsrisiko | sehr hoch | 3 | mittel | Entscheidung Kapitel 6 | `src/components/CryptoScoringEnterprise.tsx`, `server.ts`, Scoring-Endpunkte |
| D2 | `docs/DATENSCHUTZ_PROTOKOLL.md` auf tatsächlichen Stand bringen | sehr hoch — unzutreffende Zusicherung | sehr hoch | 2 | niedrig | D1 | `docs/DATENSCHUTZ_PROTOKOLL.md` |
| D3 | Zugriffsprotokoll reparieren (Migration für fehlende Spalten) | hoch — Auditierbarkeit | sehr hoch | 2 | mittel | — | `supabase/migrations/`, `server/iam/authMiddleware.ts` |
| D4 | Fehlende Tabellen als Migration nachziehen (`security_events`, `step_up_tokens`, `break_glass_codes`, `profiles.totp_*`) | hoch | hoch | 3 | mittel | D3 | `supabase/migrations/` |
| D5 | Testrunner einführen, kritische Pfade abdecken (Scoring, Auth, Billing, Quota) | sehr hoch | sehr hoch | 8 | niedrig | — | `package.json`, `tests/unit`, `tests/integration` |
| D6 | CI-Pipeline (`tsc`, Tests, Build) | sehr hoch | sehr hoch | 2 | niedrig | D5 | `.github/workflows/` |
| D7 | Upload absichern (`limits`, `fileFilter`, Authentifizierung für `/api/analyze-image`) | hoch — Sicherheit | hoch | 2 | niedrig | — | `server.ts:222`, `server/ai.ts` |
| D8 | Leere `catch`-Blöcke an Sicherheitsstellen protokollieren statt verschlucken | hoch | hoch | 2 | niedrig | — | `server/iam/authMiddleware.ts`, `server/stepUp.ts` |
| D9 | Step-Up für Owner-Aktionen tatsächlich erzwingen | hoch | hoch | 3 | mittel | D4 | `server/versionManager.ts`, `server/iam/` |

**Summe 30 Tage: 27 PT.**

### 14.3 60 Tage

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Abhängigkeiten | Betroffene AI-Agenten / Module |
|---|---|---|---|---|---|---|---|
| S1 | Scoring-Eingangsgrößen an reale Quellen anbinden (Marktkapitalisierung, Volumen, Liquidität aus vorhandenen Anbietern) | sehr hoch | sehr hoch | 15 | hoch | D1, D5 | `src/services/scoring.service.ts`, `cryptoScoringService.ts`, `src/lib/cryptoScoring.ts` |
| S2 | Faktoren ohne belastbare Quelle aus dem Modell entfernen | sehr hoch | hoch | 5 | mittel | S1 | dieselben |
| S3 | Globales Rate-Limiting | hoch | hoch | 2 | niedrig | — | `server.ts`, `server/iam/rateLimiter.ts` |
| S4 | Strukturiertes Logging mit Correlation-IDs | hoch | hoch | 5 | niedrig | Q3 | gesamtes `server/` |
| S5 | Gewichte aller Engines nach Vorbild `rawMaterialsConfig.ts` externalisieren | hoch | hoch | 5 | niedrig | S1 | `src/config/`, alle vier Engines |
| S6 | Anlageklassen ohne eigene Engine kennzeichnen | mittel | hoch | 2 | niedrig | — | `src/lib/assetRegistry.ts`, Screener-Komponenten |
| S7 | Automatische Dokumentmutation beim Serverstart abschalten | mittel — 68 Dateien je Start | hoch | 2 | niedrig | — | `server/documentHygiene.ts`, `server.ts` |

**Summe 60 Tage: 36 PT.**

### 14.4 90 Tage

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko | Abhängigkeiten |
|---|---|---|---|---|---|---|
| N1 | Rückwirkende Validierung der Scores gegen realisierte Wertentwicklung; Trefferquote und Falsch-Positiv-Rate erstmals beziffern | sehr hoch | sehr hoch | 12 | mittel | S1, S2 |
| N2 | Prompt-Registry und Token-/Kostenerfassung | hoch | hoch | 8 | niedrig | D5 |
| N3 | Documentary Engine aus DEV übernehmen (neue Nummernvergabe nach ADR-0019) | hoch | mittel | 10 | mittel | ADR-0019 |
| N4 | Traceability-Komponente implementieren; `tests`-Feld in Manifeste einführen | hoch | mittel | 12 | mittel | D5, N3 |
| N5 | Manifest-Pflichtfelder in 22 Bestandsmanifesten nachziehen | mittel | mittel | 5 | niedrig | N4 |
| N6 | ISO-27001-Controls den vorhandenen Scannern zuordnen | hoch | mittel | 8 | niedrig | — |
| N7 | Helmet, CSRF-Schutz, CSP ohne `unsafe-inline`/`unsafe-eval` | hoch | mittel | 5 | mittel | D6 |

**Summe 90 Tage: 60 PT.**

### 14.5 180 Tage

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| H1 | Eigene Bewertungslogik für Aktien, Forex, Indizes | sehr hoch | hoch | 30 | mittel |
| H2 | Serverseitiges Alerting mit Scheduler und Zustellung | hoch | hoch | 15 | mittel |
| H3 | Zustandshaltung aus `uploads/` in die Datenbank überführen | hoch — Skalierbarkeit | hoch | 12 | hoch |
| H4 | Supervisor als Komponente implementieren oder Spezifikation zurückziehen | mittel | mittel | 25 | mittel |
| H5 | `server.ts` entlang der Fachdomänen nach `src/features/` zerlegen | mittel | mittel | 25 | hoch |
| H6 | Metrics und Tracing (OpenTelemetry) | hoch | mittel | 12 | niedrig |
| H7 | Deployment-Rollback und Backup-Verfahren | hoch | mittel | 10 | mittel |

**Summe 180 Tage: 129 PT.**

### 14.6 12 Monate

| # | Maßnahme | Business Value | ROI | Aufwand | Risiko |
|---|---|---|---|---|---|
| J1 | Datenqualitätsschicht mit Herkunft, Versionierung und Lückenbehandlung für alle Datenpunkte | sehr hoch | hoch | 40 | mittel |
| J2 | Evaluationspfad für Agenten (Referenzdatensatz, Regressionsmessung) | hoch | mittel | 25 | mittel |
| J3 | Model-Routing und providerübergreifender Rückfall | mittel | mittel | 20 | mittel |
| J4 | RAG mit Wissensanbindung | mittel | niedrig | 35 | hoch |
| J5 | Verbleibende Plattformmodule implementieren oder Spezifikationen zurückziehen | mittel | mittel | 60 | mittel |
| J6 | ISO-27001-Zertifizierungsvorbereitung | hoch | mittel | 40 | mittel |

**Summe 12 Monate: 220 PT.**

### 14.7 Priorisierung nach den drei geforderten Kriterien

**Nach Business Value:** D1 → D2 → S1 → N1 → H1 → J1
**Nach technischer Kritikalität:** Q1 → D3 → D4 → AUD2-F-011/012 → D7 → S3 → N7
**Nach Enterprise-Reifegrad:** Q3 → D5 → D6 → S4 → H6 → H7 → J6

Die drei Reihenfolgen überschneiden sich nur teilweise. Ist eine Auswahl zu treffen, empfiehlt
dieses Audit die Reihenfolge **Quick Wins vollständig → D1/D2 (Rechtsrisiko) → D5/D6 (Tests und
CI) → D3/D4 (Auditierbarkeit) → S1/S2 (Eingangsdaten)**. Begründung: Die Quick Wins sind mit
7 PT nahezu kostenlos, das Rechtsrisiko duldet keinen Aufschub, und ohne Tests und CI ist jede
nachfolgende Maßnahme so ungesichert wie die drei in Kapitel 12 behobenen Fehler.

---

## 15. Anhang: Befundregister

| ID | Befund | Umgebung | Priorität | Beleg | Status |
|---|---|---|---|---|---|
| AUD2-F-001 | Scoring-Eingangsgrößen aus Symbol-Hash statt Marktdaten | beide | P0 | `src/services/scoring.service.ts:104-125`; Produktivpfad `server.ts:296`, `:1332`, `:1340`, `:1367`, `:1380` | offen (Kapitel 6) |
| AUD2-F-002 | Hartkodierter Administrationstoken `'aif-admin-2026'` | DEV | P0 | `server/orchestrator.ts:9`, `:13` | offen (DEV) |
| AUD2-F-003 | Administrationszugriff ohne Credential (`?email=`) | DEV | P0 | `server/systemEvents.ts:10`, `:146` u. a. | offen (DEV) |
| AUD2-F-004 | IDOR auf allen Billing-Endpunkten | DEV | P0 | `server/stripe.ts:249`, `:287-305`, `:325-328` | offen (DEV) |
| AUD2-F-005 | Sieben Compliance-Endpunkte unauthentifiziert | DEV | P0 | `server/compliance/routes.ts:31`, `:60`, `:74`, `:80`, `:94`, `:110`, `:138` | offen (DEV) |
| AUD2-F-006 | CORS-Wildcards, `frame-ancestors` mit Platzhaltern in Produktion | DEV | P1 | `server.ts:70-80`, `:125` | offen (DEV) |
| AUD2-F-007 | RLS ohne Policy auf 6 von 11 Tabellen; E-Mail-Adressen in Policies | DEV | P0 | `docs/compliance/migrations.sql` | offen (DEV) |
| AUD2-F-008 | Kein Prozess-Fehlernetz, kein globaler Fehlerbehandler | DEV | P1 | 0 Treffer | offen (DEV) |
| AUD2-F-009 | `uploads/` nicht in `.gitignore` | DEV | P1 | `.gitignore` | offen (DEV) |
| AUD2-F-010 | `'placeholder_key'` als Secret-Rückfallwert | DEV | P1 | `server/documentary/documentaryEngine.ts:9`, `server/documentHygiene.ts:24` | offen (DEV) |
| AUD2-F-011 | Zugriffsprotokoll schreibt nicht (Schema-Bruch, Fehler verschluckt) | PROD | P0 | `server/iam/authMiddleware.ts:121-133` gegen `supabase/migrations/20260711000000_iam.sql:30-37` | offen |
| AUD2-F-012 | Vier Tabellen bzw. Spalten ohne DDL im Repository | PROD | P1 | `server/stepUp.ts:29`, `:74`, `:95`, `:123-126` | offen |
| AUD2-F-013 | Step-Up und `OWNER_ONLY_ROLES` nirgends erzwungen | PROD | P1 | `server/iam/authMiddleware.ts:260-284`; `server/versionManager.ts:615` | offen |
| AUD2-F-014 | Serverstart mutiert 68 versionierte Dokumente | PROD | P2 | `server/documentHygiene.ts` | offen |
| AUD2-F-015 | Kein globales Rate-Limiting; Begrenzer nicht mehrinstanzfähig | PROD | P2 | `server/iam/rateLimiter.ts:8-13` | offen |
| AUD2-F-016 | Upload ohne Grenzen und ohne Authentifizierung | PROD | P1 | `server.ts:222`, `server/ai.ts:8`, `:91` | offen |
| AUD2-F-017 | Vier Variablengruppen fehlen in `render.yaml` | PROD | P0 | `render.yaml` | offen |
| AUD2-F-018 | Container läuft als root, kein `HEALTHCHECK` | beide | P2 | `Dockerfile:27-45` | offen |
| AUD2-F-019 | Kein Helmet, kein CSRF, CSP mit `unsafe-inline`/`unsafe-eval` | beide | P2 | `package.json`; `server.ts:173` | offen |
| AUD2-F-020 | Leere `catch`-Blöcke an Sicherheitsstellen | PROD | P1 | `server/iam/authMiddleware.ts:103-105`, `:244-246`, `:304-306` | offen |
| AUD2-F-021 | Portfolio-Backtesting und Chart-Historie funktionslos | PROD | P0 | `src/components/PortfolioBacktester.tsx:249`, `src/components/Charts.tsx:194` | **behoben** |
| AUD2-F-022 | Serverstart ohne `GEMINI_API_KEY` unmöglich | PROD | P0 | `server.ts:235-236`, `server/ai.ts:16-18` | **behoben** |
| AUD2-F-023 | Nicht existierende Komponente als betriebsbereit gemeldet | PROD | P0 | `server/systemEvents.ts:552`, `src/components/SupervisorDashboard.tsx:757-759` | **behoben** |
| AUD2-F-024 | Fork-Divergenz mit 10 ESS- und 4 ADR-Kollisionen | beide | P0 | Kapitel 3 | **entschieden (ADR-0019)** |
| AUD2-F-025 | Neun Case-Kollisionen im EventMesh als Merge-Blocker | beide | P1 | Kapitel 3.4 | **dokumentiert (ADR-0019)** |
| AUD2-F-026 | Null Tests, kein `test`-Skript, keine CI | beide | P0 | `tests/` (nur `.gitkeep`), `package.json` | offen |
| AUD2-F-027 | 23 von 24 Plattformmodulen ohne Implementierung | PROD | P2 | `src/platform/*` | offen |
| AUD2-F-028 | Traceability-Kette endet bei „Test"; kein `tests`-Feld in Manifesten | beide | P2 | alle `manifest.json` | offen |
| AUD2-F-029 | `adr_history.json` kennt 10 ADRs nicht, gilt aber als „verified" | PROD | P2 | `docs/adr/adr_history.json` | offen |
| AUD2-F-030 | Handgesetzte Reifegrade in DEV widersprechen ESS-0001-CONTRACTS Chapter 12 | DEV | P2 | Kapitel 8.3 | offen (DEV) |
| AUD2-F-031 | Signalqualität und Falsch-Positiv-Rate nicht bezifferbar | beide | P1 | keine Validierung im Code | offen |
| AUD2-F-032 | Sechs Anlageklassen ohne eigene Bewertungslogik | beide | P1 | `server.ts:321-323`, `src/lib/assetRegistry.ts:150-152` | offen |
| AUD2-F-033 | `AGENTS.md`/`README.md` byteidentisch, ohne Governance-Bezug | beide | P2 | Kapitel 3.5 | offen |

**Bilanz:** 33 Befunde, davon 3 im Rahmen dieses Audits behoben, 2 durch ADR-0019 entschieden,
28 offen. Von den offenen sind 9 mit Priorität P0 eingestuft.

---

## 16. Abschließende Bewertung

CAPITAL-AI besitzt ein Governance-Gerüst, das für ein Vorhaben dieser Größe ungewöhnlich weit
entwickelt ist, und einen Sicherheitskern, der im Produktivstand handwerklich solide gebaut ist.
Beides ist ein belastbares Fundament.

Dem steht gegenüber, dass dieses Fundament weitgehend unbebaut ist: 23 von 24 spezifizierten
Plattformmodulen enthalten keinen Code, es gibt keine Tests, keine Continuous Integration und
keine Betriebsüberwachung. Die Reifegradlücke zwischen Governance (70/100) und Betriebsreife
(20/100) ist der bestimmende strukturelle Befund.

Der schwerwiegendste Einzelbefund ist jedoch fachlicher Natur: Die Kernleistung des Produkts —
die Bewertung von Vermögenswerten — beruht auf Eingangsgrößen, die aus dem Tickersymbol
errechnet werden, während ein rechtlich gefasstes Dokument das Gegenteil zusichert. Dieser
Befund ist unabhängig von allen Reifegradfragen und sollte vor jeder weiteren Ausbaumaßnahme
entschieden werden.

Für die Fork-Divergenz ist mit ADR-0019 eine Entscheidung getroffen. Die drei akuten
Produktionsfehler sind behoben und verifiziert. Die verbleibenden 28 Befunde sind in Kapitel 14
nach Business Value, technischer Kritikalität und Enterprise-Reifegrad priorisiert.

---

*Erstellt am 2026-07-31. Sämtliche Befunde sind auf Datei und Zeile zurückführbar und damit
reproduzierbar überprüfbar.*
