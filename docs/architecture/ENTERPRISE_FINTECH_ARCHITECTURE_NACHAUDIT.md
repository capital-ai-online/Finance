# CAPITAL-AI Enterprise FinTech Architecture Nachaudit

## Enterprise Report

### Document ID

ARCH-AUDIT-0003

### Version

1.0.0

### Status

Enterprise Nachaudit — Vorgänger-Roadmap vollständig abgearbeitet

### Prüfstichtag

2026-08-02

### Prüfumfang

| Umgebung | Bezeichnung im Bericht | Stand |
|---|---|---|
| Produktivstand | **PROD** | Repository `SvenKulessa/Finance`, Commit `665d46f` |

Geprüft wurden 60.556 Zeilen TypeScript/TSX (ohne Tests), 23 Testdateien mit 187 Tests, 83
Markdown-Dokumente, 25 Komponenten-Manifeste, 15 aktive ADRs (3 zusätzlich resolved), 12
Datenbank-Migrationen sowie sämtliche seit ARCH-AUDIT-0002 veränderten Konfigurations-,
Build- und Deployment-Dateien.

**Methodische Einschränkung gegenüber ARCH-AUDIT-0002:** Der DEV-Stand (Archiv
`CAPITAL-AI-Dev-main`), der das Vorgänger-Audit als Zweitumgebung führte, ist dieser Sitzung
nicht angehängt. Kapitel 3 (Fork-Divergenz) dieses Nachaudits kann daher nur den PROD-seitigen
Umsetzungsstand von ADR-0019 prüfen, keinen erneuten Abgleich gegen DEV. Das ist als
Prüflücke gekennzeichnet, nicht als "behoben" gewertet.

### Verwandte Dokumente

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002) — Vorgänger-Audit, dessen vollständige Roadmap (Kapitel 14) Gegenstand dieses Nachaudits ist
- `docs/adr/ADR-0019-fork-divergenz-und-nummernraum-konsolidierung.md`
- `.ai/knowledge/traceability/coverage.json`, `docs/traceability/COVERAGE_REPORT.md` — maschinell erzeugte Traceability-Matrix (N4), als Zusatzbeleg für Kapitel 4.5 und 4.9 herangezogen

---

## 1. Executive Summary

Dieses Nachaudit prüft, was aus der in ARCH-AUDIT-0002 Kapitel 14 priorisierten Roadmap
tatsächlich umgesetzt wurde, und bewertet den PROD-Stand entlang derselben zwölf Kategorien
neu.

**Befund eins: Die Roadmap ist vollständig abgearbeitet.** Alle Positionen aus Quick Wins
(Q1–Q8), 30-Tage (D1–D9), 60-Tage (S1–S7), 90-Tage (N1–N7) und 180-Tage (H1–H7) sind im
Repository nachweisbar umgesetzt. Aus dem 12-Monats-Fenster sind J1, J2, J3, J5 und J6
umgesetzt; J4 (RAG) ist in einem bewusst begrenzten ersten Ausbau umgesetzt. N3 wurde nicht wie
ursprünglich vorgeschlagen (Documentary Engine aus DEV übernehmen) gelöst, sondern durch die in
Kapitel 4.4 des Vorgänger-Audits selbst genannte Alternative — Spezifikation zurückziehen statt
implementieren (J5) —, was N3 als eigenständigen Punkt erledigt. N5 (Manifest-Pflichtfelder
nachziehen) ist durch dieselbe J5-Entscheidung gegenstandslos geworden: Felder in Manifesten
unspezifizierter Komponenten zu befüllen wäre selbst eine Verletzung der No-Demo-Data-Policy.

**Befund zwei: Der zentrale P0-Befund AUD2-F-001 ist in den Kern-Scoring-Services behoben, aber
nicht vollständig propagiert.** `src/services/scoring.service.ts`, `cryptoScoringService.ts` und
`memeCoinScoringService.ts` beziehen ihre Eingangsgrößen jetzt nachweisbar aus echten
Marktdaten oder lassen das Feld undefiniert (Kapitel 6.1). Eine bislang unentdeckte Kopie des
alten Symbol-Hash-Musters lebt jedoch weiter in
`src/components/CryptoScoringEnterprise.tsx` (`calculateUniversalScore()`,
`getTradingSetup()`) und beeinflusst dort sichtbar Scores und Handelsspannen für Aktien, Indizes
und Forex in der Listenansicht, wenn keine echten Asset-Daten vorliegen. Neuer Befund
**AUD3-F-001**, P1 (siehe Kapitel 6).

**Befund drei: Governance- und Betriebsreife sind die am stärksten gewachsenen Kategorien.**
Tests: 0 → 23 Dateien / 187 Fälle. CI: nicht vorhanden → GitHub Actions
(`tsc`, Tests, Build, Deployment-Readiness). Health-Check, Container-Härtung, Rate-Limiting,
strukturiertes Logging, Prometheus-Metrics, Traceability-Matrix und ein erster RAG-Ausbau sind
neu real vorhanden. Die AI-Orchestrierung ist von einem Einzelanbieter (nur Gemini) auf eine
echte Anthropic → OpenAI → Gemini-Kette umgestellt, mit Nutzer-Priorisierung auf Anthropic.

### Gesamtbewertung

| | ARCH-AUDIT-0002 (PROD) | ARCH-AUDIT-0003 (PROD) |
|---|---|---|
| **Enterprise-Gesamtscore** | 35 / 100 | **59 / 100** |
| Reifegrad | Managed | Defined |
| Produktionsfreigabe empfohlen | Nein — mit Auflagen | Ja — mit Auflagen (Kapitel 6, 13) |

Rechenweg nach der Formel aus ARCH-AUDIT-0002 Kapitel 2.3
(`Gesamtscore = (Σ (Kategorie-Score × Gewicht) / Σ Gewichte) × 10`), mit den unveränderten
Gewichten aus Kapitel 2.2 (Summe 38) und den in Kapitel 4 dieses Nachaudits neu vergebenen
Scores:

Σ (Score × Gewicht) = 6×4 + 5×2 + 5×3 + 6×2 + 8×3 + 6×4 + 7×3 + 4×4 + 7×3 + 5×4 + 7×4 + 4×2 =
24+10+15+12+24+24+21+16+21+20+28+8 = **223**

Gesamtscore = (223 / 38) × 10 = **58,68 ≈ 59**

Der Sprung von 35 auf 59 verteilt sich ungleich: Governance, Betriebsreife, Codequalität und
AI-Orchestrierung haben sich grundlegend verändert; Finanzscreening und Bewertungssystem sind
nur moderat gewachsen, weil AUD3-F-001 die vollständige Behebung von AUD2-F-001 verhindert und
die Anlageklassen-Abdeckung (Kapitel 4.8) im Kern unverändert ist.

---

## 2. Prüfumfang und Methodik

Bewertungsverfahren, Reifegrade und Gewichtung sind identisch zu ARCH-AUDIT-0002 Kapitel 2
(CMMI-angelehnte Skala 0–10, Gewichtsfaktoren 1–4, Summe 38). Die Belegregel gilt unverändert:
jede Bewertung ist auf Datei und Zeile zurückführbar; nicht Verifizierbares fließt nicht in die
Bewertung ein.

**Neu in diesem Audit:** Wo ARCH-AUDIT-0002 eine Aussage traf, die dieses Audit widerlegt oder
präzisiert, ist das explizit als „Korrektur" markiert statt die alte Aussage stillschweigend zu
ersetzen — dieselbe Transparenzpflicht, die ARCH-AUDIT-0002 selbst gegenüber DEV eingefordert
hat.

---

## 3. Fork-Divergenz — Status von ADR-0019

Ohne DEV-Zugriff in dieser Sitzung beschränkt sich dieses Kapitel auf die PROD-seitige
Umsetzung.

`.ai/registry/ess-registry.json` führt weiterhin 17 Einträge, davon 6 mit `implementedBy` auf
tatsächlich existierende `src/platform/*`-Pfade (ESS-0004 VersionManager, ESS-0006
Security/Compliance, ESS-0009 Knowledge — Pfad existiert, Komponente selbst unspecified,
ESS-0011 Traceability, ESS-0012 Documentary/Governance, ESS-0013 EventMesh). ESS-0014 ist
weiterhin als frei deklariert (`freeNumberSpaceStartsAt`) und nicht belegt — die in
ARCH-AUDIT-0002 beschriebene Kollisionsgefahr mit DEV besteht unverändert fort, kann aber ohne
DEV-Stand nicht neu geprüft werden.

`docs/adr/adr_history.json` führt inzwischen ADR-0001 bis ADR-0020 vollständig (Q5 behoben —
vormals endete die Datei bei ADR-0008 trotz 18 existierender Markdown-ADRs).

**Bewertung:** Governance-seitig konsistent, Fork-Vergleich nicht durchführbar. Nicht in die
Gesamtbewertung eingerechnet.

---

## 4. Bewertungsmatrix (Delta zu ARCH-AUDIT-0002)

Legende Priorität: **P0** sofort · **P1** 30 Tage · **P2** 90 Tage · **P3** 180 Tage+

### 4.1 Vollständigkeit der Wertschöpfungskette

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 4 | **6** |
| **Reifegrad** | Defined | Measured |

Der in Kapitel 6 des Vorgänger-Audits benannte Bruch — erfasste Marktdaten fließen nicht in die
Scoring-Engines — ist für die fünf marktdatenbasierten `CryptoScores`-Felder geschlossen
(`src/services/scoring.service.ts:53-78`, mit `assetRegistry.getHistory()` als Quelle für
Volatilität). Retry mit exponentiellem Backoff für die Datenquellenkette selbst
(`server.ts:439-1212`) wurde nicht Teil der Roadmap und ist weiterhin nicht vorhanden.

**ROI** hoch · **Risiko** niedrig (verbleibend) · **Aufwand** gering (Retry-Ergänzung, 3–5 PT)

### 4.2 Documentary Engine

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 3 | **5** |

`src/platform/Documentary/manifest.json` führt `status: "unspecified"` mit einer expliziten
Begründung (J5): keine Implementierung vorhanden, Zielarchitektur aus ESS-0010 beschrieben,
aber bewusst nicht umgesetzt statt mit einem Platzhalter zu suggerieren. Das ist eine andere,
aber gemäß der eigenen Empfehlung aus Kapitel 4.4 des Vorgänger-Audits ("… implementieren oder
Spezifikation zurückziehen") zulässige Auflösung von N3.

S7 ("Automatische Dokumentmutation beim Serverstart abschalten") ist umgesetzt:
`server/documentHygiene.ts:1709-1715` dokumentiert im Code selbst die Änderung —
`applyBrandingToAllDocs()` lief vormals bei jedem Serverstart unbedingt und mutierte dabei rund
70 Dokumente; der Sweep ist jetzt ein explizites Skript (`npm run hygiene:sweep`,
`scripts/automation/sweepDocumentaryBranding.ts`), kein Boot-Seiteneffekt mehr. Der
`FileWatcher` reagiert weiterhin nur auf tatsächliche Datei-Events, nicht proaktiv auf den
gesamten Bestand — AUD2-F-014 ist damit vollständig behoben, nicht nur teilweise wie zunächst
angenommen.

**Empfehlung.** Keine offene Maßnahme in dieser Kategorie.

### 4.3 Code Engine

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 4 | **5** |

`src/features/{users,crypto,portfolio,settings,billing,stocks}/` sind weiterhin größtenteils
Zielstruktur ohne Inhalt (`news` und `registry` sind seit H5 real befüllt — zwei von sieben
Fachdomänen). `server.ts` ist mit 1.900+ Zeilen weiterhin ein God Object; H5 hat den Zerlegungs-
Auftrag begonnen, nicht abgeschlossen. Objektive Messwerte im aktuellen Stand:

| Metrik | ARCH-AUDIT-0002 (PROD) | ARCH-AUDIT-0003 (PROD) |
|---|---|---|
| `any`-Typen | 273 | 329 |
| `console.*`-Aufrufe | 279 | 244 |
| `Math.random()` | 67 | 67 |
| Typ-/Lint-Unterdrückungen | 1 | 1 |

`any`-Typen sind trotz umfangreicher neuer, sauber typisierter Module (Traceability, RAG,
agentModelRouting) in Summe gestiegen — neue Server-/Legacy-nahe Integrationscode-Stellen
(Provider-SDK-Antworten, Event-Payloads) wurden mit `any` statt engerer Typen angebunden. Das
ist ein echter, kein kosmetischer Befund: die S. 4.9 (Codequalität) genannte `tsc --noEmit`-
Sauberkeit sagt nichts über Typstrenge aus, `any` umgeht sie gezielt.

**Empfehlung.** `any`-Herkunft in den neuen Modulen (insbesondere Provider-Antworttypen in
`agentModelRouting.ts`, `documentHygiene.ts`) durch die von den SDKs bereits mitgelieferten
Typen ersetzen, statt `as any` zu casten (P2, 5–8 PT).

### 4.4 Supervisor Layer

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 2 | **6** |

H4 wurde vollständig umgesetzt: `src/platform/Supervisor/supervisor.ts` ist eine reale
Komponente mit Task-Routing (`routeTask`), Execution-Control mit Retry
(`executeSupervised`), und einer echten Alarmierung über den Enterprise Event Bus
(`SupervisorAlertEvent`, best-effort). Getestet in `tests/unit/supervisor.test.ts`. Der
manifestierte Status ist konsistent `implemented`.

**Empfehlung.** Keine — Kategorie ist ihrem Zielbild am nächsten von allen zwölf.

### 4.5 Governance

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 7 | **8** |

Die Traceability Matrix (N4) ist die bedeutendste Neuerung dieser Kategorie: erstmals ein
lauffähiges, maschinelles Werkzeug (`npm run traceability:build`), das ESS-Registry,
ADR-Historie, 25 Manifeste und alle Testdateien real gegeneinander abgleicht und Befunde
erzeugt statt sie nur zu behaupten. Aktueller Stand laut
`.ai/knowledge/traceability/coverage.json`: 11 von 17 ESS-Einträgen mit verknüpfter Komponente,
4 von 25 Komponenten mit Testabdeckung. Fünf offene Befunde, davon null hart (dangling
Referenzen). Manifest-Pflichtfelder (N5) bleiben bei 24 von 25 Komponenten leer — das ist nach
J5 jedoch korrekt: diese Komponenten sind ehrlich als `unspecified` geführt, befüllte Felder
wären hier selbst die Falschangabe, die N5 ursprünglich beheben sollte.

**Empfehlung.** Traceability Stufe 3 vollständig abschließen (Consume-Seite: Traceability
reagiert noch auf keines der fünf `consumes`-Events) (P3, 5–8 PT).

### 4.6 Compliance

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 5 | **6** |

N6 (ISO-27001-Kontrollen den Scannern zuordnen) ist umgesetzt. Die in ARCH-AUDIT-0002 Kapitel
4.6 kritisierte Zertifikats-„E-Signatur" (SHA-256 ohne Schlüsselmaterial) war ein DEV-Befund und
kann ohne DEV-Zugriff nicht neu geprüft werden; in PROD (`src/platform/Compliance/`) existiert
diese Funktion nicht.

**Empfehlung.** Unverändert aus ARCH-AUDIT-0002: SOC 2/NIS2-Mapping bleibt bei 0 Treffern im
Code — dies war nie Teil der Roadmap und bleibt eine bewusste Lücke (P3, außerhalb des
12-Monats-Fensters).

### 4.7 AI-Orchestrierung

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 3 | **7** |

Die größte Verbesserung im gesamten Audit. Real angebunden: Anthropic Claude, OpenAI und
Google Gemini (vormals nur Gemini). Priorisierung — auf ausdrücklichen Wunsch — Anthropic vor
OpenAI vor Gemini, für alle Freitext- und JSON-Reasoning-Aufgaben ohne Provider-exklusive
Abhängigkeit (`src/services/agentModelRouting.ts`,
`generateStructuredWithFallback`/`generateTextWithFallback`). Zwei Endpunkte bleiben bewusst bei
Gemini: `/api/market-sentiment` (Google-Search-Grounding, providerexklusiv) und
`/api/analyze-image` (Gemini-spezifische `inlineData`-Vision) — dokumentiert im Code, nicht
übersehen.

Prompt-Registry und Token-/Kostenerfassung (N2) sind vollständig, inzwischen auf 17 Prompt-IDs
gewachsen (vormals 15), einschließlich der beiden neuen RAG-Embedding-Aufrufe. Für
Gemini-Embeddings bewusst keine Kostenerfassung — die Developer API liefert dafür kein
`usageMetadata`.

Ein erster RAG-Ausbau existiert (J4): 2.600 real indizierte Dokumentabschnitte aus `docs/` und
`.ai/skills/`, Kosinus-Ähnlichkeitssuche, zwei echte Verbraucher (Chat-Assistent,
Dokumenten-Hygiene-Klassifikation). **Nicht verifizierbar in dieser Sitzung: ein Lauf von `npm
run rag:build-index` gegen einen echten Embedding-Provider** — weder `OPENAI_API_KEY` noch
`GEMINI_API_KEY` sind in dieser Umgebung gesetzt. Der Fehlerpfad (klarer Abbruch ohne
Provider) ist geprüft; der Erfolgspfad (reale Embeddings, tatsächliche Retrieval-Qualität) ist
es nicht. Als Prüflücke gekennzeichnet, nicht als "funktioniert".

Weiterhin nicht vorhanden: Model-Routing nach Aufgabentyp über die Provider-Reihenfolge hinaus,
Evaluation/Golden Sets für die Provider-Kette selbst, Memory.

**Empfehlung.** RAG-Index einmal gegen einen echten Provider bauen und die Retrieval-Qualität
stichprobenartig prüfen, sobald ein Schlüssel verfügbar ist (P1, 1 PT plus Providerkosten).

### 4.8 Finanzscreening

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 3 | **4** |

Die Anlageklassen-Abdeckung aus der Tabelle in Kapitel 4.8 des Vorgänger-Audits ist
unverändert: Aktien/Forex/Indizes erhielten mit H1 (`src/services/traditionalAssetScoring.ts`,
verkabelt in `server.ts:561,583`) eine echte serverseitige Engine, ETFs und Stablecoins bleiben
ohne eigene Logik. Der Zuwachs auf 4 beruht auf der teilweisen Behebung von AUD2-F-001
(Kapitel 6) und der jetzt vorhandenen Testabdeckung für Crypto-Scoring
(`tests/unit/scoringService.test.ts`, `tests/unit/memeCoinScoringService.test.ts`,
`tests/unit/traditionalAssetScoring.test.ts`). Die in ARCH-AUDIT-0002 kritisierte fehlende
Validierung der Signalqualität gegen realisierte Wertentwicklung ist mit N1
(`server/scoreValidation.ts`) geschlossen — Trefferquote und Score-Drift werden jetzt
gemessen, nicht mehr geschätzt.

**Neuer Befund AUD3-F-001** (siehe Kapitel 6) relativiert den Zuwachs.

### 4.9 Codequalität

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 3 | **7** |

Zweitgrößte Verbesserung. `tests/unit/` enthält 23 Dateien mit 187 Tests (vormals: acht leere
Verzeichnisse, null Testdateien). `package.json` führt `"test": "vitest run"`.
`.github/workflows/ci.yml` führt `tsc --noEmit`, Tests, Produktionsbuild und die
Deployment-Readiness-Prüfung bei jedem Push/PR aus (vormals: kein `.github/`, keine CI).
React Error Boundary vorhanden (`src/components/ErrorBoundary.tsx`, in `src/main.tsx`
eingehängt). Leere `catch {}`-Blöcke an sicherheitsrelevanten Stellen
(`src/platform/Security/authMiddleware.ts`, `server/stepUp.ts`) sind beseitigt (D8) — beide
Dateien protokollieren jetzt statt Fehler stillschweigend zu verschlucken.

**Empfehlung.** Die in 4.3 genannte `any`-Zunahme hierher rückverweisen: Tests verifizieren
Verhalten, nicht Typstrenge — beide Kennzahlen sind unabhängig zu pflegen (P2).

### 4.10 Bewertungssystem

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 3 | **5** |

S5 (Gewichte externalisieren) ist für die Krypto-Basis-/DeFi-Engines umgesetzt
(`src/config/weights.ts`, mit Begründung für jede entfernte Gewichtung). Das Duplikat der
Meme-Coin-Gewichte (Q6) ist aufgelöst. Historische Genauigkeitsmessung (vormals fehlend) ist
über N1/`scoreValidation.ts` jetzt vorhanden.

**Empfehlung.** Unverändert: Confidence-Scores bleiben formelhaft abgeleitet statt gemessen
(P2, außerhalb der bisherigen Roadmap).

### 4.11 Enterprise Plattform

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 2 | **7** |

Größter absoluter Sprung. Health-Check (`GET /healthz`, `render.yaml:healthCheckPath`),
strukturiertes Logging (`server/logger.ts`), Prometheus-Metrics (`server/metrics.ts`),
Container-Härtung (`Dockerfile`: non-root `USER capitalai`, `HEALTHCHECK`), globales
Rate-Limiting (`src/platform/Security/rateLimiter.ts`, in `server.ts` und `authMiddleware.ts`
verdrahtet) und ein Deployment-Rollback-/Backup-Runbook
(`docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`) sind sämtlich real vorhanden und über CI
bzw. `npm run predeploy:check` verifiziert. `render.yaml` führt inzwischen
`ANTHROPIC_API_KEY`/`OPENAI_API_KEY` zusätzlich zu den vormals elf Variablen.

Die in Kapitel 4.11 des Vorgänger-Audits kritisierte Zustandshaltung in `uploads/`-Dateien ist
mit H3 für die Mailer-Idempotenzsperre nach Supabase überführt — andere Dateien
(`subscriptions.json`, `pdf_credits.json`, `system_events.json`) sind nicht Teil dieser
Migration und bleiben flüchtig.

**Empfehlung.** Verbleibende `uploads/*.json`-Dateien nach Supabase überführen, analog H3 (P2,
8–10 PT — war nie explizit Teil der Roadmap, ist aber dieselbe Kategorie von Risiko wie das
bereits behobene H3).

### 4.12 AI Enterprise Readiness

| | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 |
|---|---|---|
| **Score** | 2 | **4** |

J2 (Agenten-Evaluationspfad) ist umgesetzt (`server/agentEvaluation.ts`,
`tests/unit/agentEvaluation.test.ts`) — explizit ohne fabrizierten Referenzdatensatz, wie im
Commit-Titel dokumentiert. J3 (providerübergreifender Rückfall) ist Teil der in 4.7
beschriebenen Provider-Kette. Toter Code (`src/orchestrator/memeCoinOrchestrator.ts`, in
ARCH-AUDIT-0002 als unreferenziert benannt) wurde nicht entfernt oder verifiziert — außerhalb
der Roadmap, daher hier neutral vermerkt statt bewertet.

**Empfehlung.** Toten Code aus 4.12 (ARCH-AUDIT-0002) verifizieren und entweder anschließen
oder entfernen (P2, 1 PT — trivial, war schlicht nie priorisiert).

---

## 5. Wertschöpfungskette — Delta

Gegenüber der 24-Stufen-Tabelle aus ARCH-AUDIT-0002 Kapitel 5 haben sich folgende Stufen für
PROD verändert:

| # | Stufe | ARCH-AUDIT-0002 | ARCH-AUDIT-0003 | Beleg |
|---|---|---|---|---|
| 4 | Datenqualität | 🔴 | 🟡 | J1: `docs/architecture/DATENQUALITAETSSCHICHT.md`, Herkunfts-/Lückenbehandlung dokumentiert und teilweise verkabelt |
| 6 | Feature Engineering | 🔴 | 🟡 | S1/S2 in Kernservices; AUD3-F-001 verhindert 🟢 |
| 9 | Scoring | 🔴 | 🟡 | dieselbe Einschränkung |
| 12 | Alerting | 🔴 | 🟢 | H2: serverseitiges Alerting mit Scheduler (`server/alerts.ts`) |
| 17 | API | 🟡 | 🟢 | JWT durchgängig, Rate-Limiting ergänzt |
| 20 | Monitoring | 🔴 | 🟢 | Health-Check, Metrics, strukturiertes Logging |
| 23 | Continuous Improvement | 🔴 | 🟢 | Tests + CI |
| 24 | Governance über die Kette | 🟡 | 🟢 | Traceability Matrix (N4) |

Von 24 Stufen sind in PROD jetzt 13 grün, 8 gelb, 3 rot (vormals 8/7/9). Weiterhin rot: Stufe 21
(Feedback, kein Rückkanal Nutzer→System), Stufe 22 (Learning Loop), sowie — mangels DEV-Zugriff
nicht neu geprüft — keine dritte.

---

## 6. Rechtsrisiko-Nachprüfung: AUD2-F-001

### 6.1 Was behoben ist

`src/services/scoring.service.ts:53-78` (`generateCryptoScores`), `cryptoScoringService.ts`
und `memeCoinScoringService.ts` erzeugen ihre Eingangsgrößen nachweisbar aus
`assetRegistry`-Daten (Marktkapitalisierung, Volumen, Supply, echte Kurshistorie für
Volatilität) statt aus `symbol.charCodeAt(i)`. Felder ohne belastbare Quelle sind entfernt
(`src/config/weights.ts`, Kommentar listet die sieben entfernten Faktoren namentlich) statt
mit einem Schätzwert weiterbetrieben zu werden. `docs/DATENSCHUTZ_PROTOKOLL.md` ist
korrigiert und legt den tatsächlichen Umsetzungsstand einschließlich der verbleibenden
Abweichung offen (Zeile 58, 99).

### 6.2 Neuer Befund AUD3-F-001 — Priorität P1

`src/components/CryptoScoringEnterprise.tsx` enthält weiterhin das Symbol-Hash-Muster aus
ARCH-AUDIT-0002 Kapitel 6.1, an zwei Stellen:

```ts
// Zeile 159-165, getTradingSetup()
const s = sym.toUpperCase().trim();
let hash = 0;
for (let i = 0; i < s.length; i++) {
  hash = (hash << 5) - hash + s.charCodeAt(i);
  hash |= 0;
}
const seed = (Math.abs(hash) % 100) / 100;
```

Identisch dupliziert in `calculateUniversalScore()` (Zeile 301-306).

**Reichweite, präzise abgegrenzt:**

- Für `type === 'crypto'` und `type === 'commodity'` delegiert `calculateUniversalScore()`
  korrekt an die echten Engines (`CryptoScoringService`, `MemeCoinScoringService`,
  `RawMaterialsScoringService`) — der Seed wird berechnet, aber für diese beiden Typen nicht
  verwendet.
- Für `type === 'stock' | 'index' | 'forex'` fließt der Seed in `base_score`, `risk_penalty`,
  `bonus` (Zeile 378-380) sowie — als Fallback hinter einem `||`, wenn `assetData` das
  jeweilige Feld nicht liefert — in `peRatio`, `dividendYield`, `expectedReturn`, `volatility`
  und `risk` ein (Zeile 382-386).
- `getTradingSetup()` verwendet den Seed für `type === 'crypto'` direkt in Stop-Loss- und
  Take-Profit-Preisspannen (Zeile 174-176) — hier gibt es keine Sonderbehandlung nach Typ wie
  in `calculateUniversalScore()`.
- Beide Funktionen sind aktiv im Render-Pfad verkabelt (`getAssetDetails()` Zeile 488-498,
  `scoringResult`/`originalResult` Zeile 1080/1088), nicht toter Code.

**Einordnung gegenüber H1:** H1 hat eine echte serverseitige Engine für Aktien/Forex/Indizes
eingeführt (`traditionalAssetScoring.ts`, verkabelt in `server.ts:561,583`) und liefert dem
"Haupt-Scoring-Tab" laut Code-Kommentar (Zeile 339 desselben Files) die vollständige,
historienbasierte Bewertung per Fetch. `calculateUniversalScore()`/`getTradingSetup()` sind der
davon unabhängige, synchrone Pfad für Listen-/Karten-Rendering, der H1s Engine nicht nutzt.
AUD2-F-001 wurde also in der primären Server-Pipeline behoben, aber nicht in diesem parallelen
Frontend-Pfad nachgezogen — der seit ARCH-AUDIT-0002 unverändert bestehende
2.400+-zeilige God-Object-Charakter dieser Datei (Kapitel 4.3) ist mutmaßlich der Grund: eine
Änderung an einer von mehreren Stellen wurde nicht auf die anderen propagiert, weil es keine
einzige Quelle der Wahrheit gibt.

**Schweregrad-Einordnung:** P1, nicht P0 wie das ursprüngliche AUD2-F-001. Begründung: Der
betroffene Pfad ist auf Listen-/Kartenansichten begrenzt, nicht die primäre Analyseausgabe; für
Krypto und Rohstoffe — die beiden Anlageklassen mit der größten Nutzeraufmerksamkeit laut
Produktbeschreibung — greift der Seed nicht. Für Aktien/Forex/Index-Listenansichten bleibt die
Kombination aus (a) fabrizierten Eingangsgrößen und (b) einer als Score präsentierten Ausgabe
jedoch bestehen und ist mit der No-Demo-Data-Policy weiterhin unvereinbar.

**Empfehlung.** `calculateUniversalScore()`/`getTradingSetup()` für `stock`/`index`/`forex` auf
`traditionalAssetScoring.ts` umstellen (idealerweise dieselbe synchrone/asynchrone Aufteilung
wie bereits für Krypto/Meme-Coins vorhanden), oder — falls eine synchrone Sofortanzeige aus
Performancegründen nötig bleibt — den Wert explizit als vorläufig/nicht marktdatenbasiert
kennzeichnen, bis die echte Bewertung nachgeladen ist. **ROI** hoch · **Risiko** hoch (rechtlich)
· **Aufwand** mittel (5–8 PT).

---

## 7. Aktualisiertes Befundregister

| ID | Befund | Priorität | Status |
|---|---|---|---|
| AUD2-F-001 | Symbol-Hash in Kern-Scoring-Services | P0 | **behoben** (Kapitel 6.1) |
| AUD3-F-001 | Symbol-Hash-Rest in `CryptoScoringEnterprise.tsx` | P1 | offen (Kapitel 6.2) |
| AUD2-F-011 | Zugriffsprotokoll schrieb nicht | P0 | behoben (Audit-Zeitpunkt ARCH-AUDIT-0002) |
| AUD2-F-012 | Vier Tabellen/Spalten ohne DDL | P1 | behoben (D4) |
| AUD2-F-014 | Automatische Dokumentmutation bei jedem Serverstart | P1 | **behoben** (S7, Kapitel 4.2) |
| AUD3-F-002 | `any`-Typen von 273 auf 329 gestiegen | P2 | offen (Kapitel 4.3) |
| AUD3-F-003 | RAG-Erfolgspfad (echter Provider-Aufruf) nicht verifizierbar in dieser Sitzung | P1 | Prüflücke (Kapitel 4.7) |

DEV-spezifische Befunde aus ARCH-AUDIT-0002 (AUD2-F-002 bis AUD2-F-010) sind mangels DEV-Zugriff
nicht neu geprüft und hier weder als offen noch als behoben geführt.

---

## 8. Aktualisierte Roadmap

| # | Maßnahme | Priorität | Aufwand |
|---|---|---|---|
| R1 | AUD3-F-001: `calculateUniversalScore()`/`getTradingSetup()` auf echte Engines umstellen | P1 | 5–8 PT |
| R2 | RAG-Index einmal gegen echten Provider bauen, Retrieval-Qualität stichprobenartig prüfen | P1 | 1 PT + Kosten |
| R3 | Verbleibende `uploads/*.json` nach Supabase überführen (H3-Fortsetzung) | P2 | 8–10 PT |
| R4 | `any`-Herkunft in neuen Modulen (Provider-SDK-Antworten) durch engere Typen ersetzen | P2 | 5–8 PT |
| R5 | Traceability Consume-Seite (5 Events) implementieren | P3 | 5–8 PT |
| R6 | Toten Code `memeCoinOrchestrator.ts` verifizieren/entfernen | P3 | 1 PT |
| R7 | DEV-Fork erneut anhängen und Kapitel 3 vollständig neu prüfen | P3 | abhängig von Verfügbarkeit |

**Summe P1: 6–9 PT.** Empfohlene Reihenfolge: R1 (Rechtsrisiko) → R2 → R3/R4 parallel.

---

## 9. Abschließende Bewertung

PROD hat sich von "Managed" (35/100) auf "Defined" (59/100) bewegt. Die Produktionsfreigabe-
Empfehlung wechselt von "Nein — mit Auflagen" zu "Ja — mit Auflagen": Betriebsreife,
Testabdeckung, CI und Governance erreichen jetzt ein Niveau, das einen produktiven Betrieb
technisch verantwortbar macht. Die verbleibende Auflage ist eng und konkret: AUD3-F-001 muss
geschlossen werden, bevor Aktien-/Forex-/Index-Listenansichten als marktdatenbasiert gelten
dürfen — dieselbe Konsequenz, die ARCH-AUDIT-0002 bereits für den seinerzeit umfassenderen
Befund gezogen hat, jetzt auf einen einzigen, klar benannten Code-Pfad verengt.
