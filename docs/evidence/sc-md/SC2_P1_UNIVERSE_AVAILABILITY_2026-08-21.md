# SC-2 P1 Universe Availability — 2026-08-21

**Authority:** `SC-MD-SPT-0001` → `SC-2_MODEL_REGISTRY_UAI` → ADR-0087  
**Branch:** `feature/fintech-orchestrator-p0-multiclass-integrity`  
**PR:** #475 (Draft; P0 + P1 continuation by explicit owner instruction)  
**Baseline at P1 start:** `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**P0 CI before P1:** PASS — TypeScript, Unit Tests, Production Build, CSP, Deployment Readiness.

## 1. Ziel

P1 verdrahtet den in P0 eingeführten `universe-sla/1.0.0`-Vertrag in die bereits vorhandene Discovery-/Evidence-Admission-/UI-Kette. Es entsteht keine neue Scoring-, Provider-, Ranking- oder Dispatcher-Authority.

Langfristiges Produktziel bleibt: mindestens 24 reale Assets je Assetklasse und je bestehender Unterkategorie verfügbar. P1 misst dieses Ziel ehrlich. Es darf das Ziel niemals durch Katalogmetadaten, synthetische Filler, Interpolation oder Demo-Daten vortäuschen.

## 2. Wiederverwendeter Ist-Pfad

`UniverseBestWorst` selektiert bereits vor P1 bis zu 24 priorisierte Katalogkandidaten je Assetklasse und führt die vorhandenen verifizierten Scoring-Pfade aus:

- Crypto → `/api/crypto/score` → UAI → Registry → Single Dispatcher → verified Crypto Executor;
- Stock/Forex/Index/Commodity/Bond → `/api/registry/assets/verified-scores` → Evidence Acquisition → Single Dispatcher → Canonical Result → Screening Governance.

P1 erhöht **nicht** die Zahl der vorgesehenen Kandidaten oder Provider-Evaluierungen. Der vorhandene 24-Kandidaten-Pfad wird lediglich um eine explizite, versionierte Availability-Auswertung ergänzt.

### Behobener Batch-Gap

Der bestehende Registry-Batch-Endpunkt akzeptiert maximal 50 Symbole pro Aufruf, während die UI bis zu 120 traditionelle Kandidaten (5 Klassen × 24) in einen Request legte. Dadurch wurden Symbole nach Position 50 serverseitig nie evaluiert und konnten das 24er-Ziel strukturell nicht erreichen.

P1 teilt traditionelle Kandidaten daher deterministisch in Batches von höchstens 50 Symbolen und verarbeitet diese **sequenziell**. Die Zahl der vorgesehenen Kandidaten bleibt unverändert; lediglich die bisher still abgeschnittene Evaluation wird vollständig ausgeführt. Sequenzielle Batches begrenzen Provider-Bursts und respektieren den bestehenden Serververtrag.

## 3. P1 Runtime Projection

`universe-availability-projection/1.0.0` ist eine read-only Projection und keine neue Authority.

Eingänge:

1. bereits entdeckte Katalogidentitäten;
2. bereits ausgeführte Runtime-Ergebnisse;
3. `READY`-Status;
4. mindestens ein realer Provider;
5. mindestens eine Evidence-ID;
6. falls vorhanden: bestehende `screeningEligibility`.

Ein Asset zählt nur als `evidenceSufficient`, wenn READY + Provider + Evidence-ID vorliegen und ein bestehendes Screening-Gate es nicht explizit ablehnt.

Die Projection führt **keine Provider-I/O** aus. Damit erzeugt der SLA-Vertrag keine zweite Discovery-/Acquisition-Schicht und keine zusätzlichen Providerkosten.

## 4. Top-Level- und Unterkategorie-SLA

- Top-Level-Ziel: 24 evidence-admitted UAI-Identitäten je `crypto`, `stock`, `forex`, `commodity`, `index`, `bond`.
- Unterkategorie-Ziel: 24 je bereits vorhandener Katalogtaxonomie.
- Kategoriequelle: vorhandenes `subtype`; falls nicht vorhanden `instrumentKind`.
- Es wird **keine neue Taxonomie** erzeugt.

Status bleiben die P0-Verträge:

- `AVAILABLE`;
- `INSUFFICIENT_REAL_UNIVERSE`;
- `PROVIDER_DEGRADED`;
- `EVIDENCE_INSUFFICIENT`.

## 5. Screening-Governance-Integration

`decorateScreeningBatchWithGovernance()` erstellt nach bestehender Eligibility-/SLA-/Operations-Auswertung zusätzlich die Universe-Projection.

Jedes Batch-Ergebnis erhält das zugehörige `universeSla` für seine Assetklasse. Score, Eligibility, Provider-SLA und SLO-Evidence bleiben unverändert; Universe Availability besitzt keinerlei Score- oder Ranking-Impact.

## 6. UI-Integration

`UniverseBestWorst` verwendet weiterhin exakt denselben 24-Kandidaten-Scope, erfasst jetzt jedoch zusätzlich:

- Provider pro Ergebnis;
- Evidence-IDs;
- bestehende Screening-Eligibility;
- Top-Level Universe SLA;
- vorhandene Unterkategorie-SLAs.

Die UI zeigt je Assetklasse `availableCount / 24` und den kanonischen SLA-Status. Für Unterkategorien wird angezeigt, wie viele bestehende Kategorien das 24er-Ziel erfüllen.

READY ohne Evidence-Lineage zählt nicht als verfügbar. Providerfehler werden sichtbar degradiert. Fehlende Assets bleiben fehlend.

### Frontend-/Server-Grenze

Die erste P1-CI-Ausführung bestand TypeScript und die vollständige Unit-Suite, identifizierte im Production Build jedoch einen Architekturgrenzfehler: der browserseitig importierte Availability-Service nutzte den `platform/Scoring`-Barrel, der auch das serverseitige `scoringFingerprint.ts` mit `node:crypto` exportiert.

Die Korrektur führt **keinen Crypto-Polyfill und keine neue Dependency** ein. `universeAvailability.ts` importiert ausschließlich die browser-sicheren Verträge `UniverseSla`, `UniversalAssetAdapter` und `contracts` direkt. Ein Regressionstest verhindert die erneute Einführung des serverseitigen Barrel-Imports in diesen Browserpfad.

## 7. Security / Integrity / Governance

- keine Secrets oder Credentials;
- keine Supabase-/Render-/Stripe-Mutation;
- keine neue externe Trust Boundary;
- keine zusätzliche Kandidatenzahl;
- keine synthetischen Assets;
- keine automatische Evidence-Promotion;
- keine Änderung an Score-Gewichten, Ranking-Schwellen oder Dispatcher-Routing;
- kein harter Produktionsblock durch Universe SLA (`hardMinimum=false` bleibt erhalten);
- keine Browser-Polyfills für serverseitige Kryptografie; Server-/Browser-Grenze bleibt explizit.

## 8. Best-Practice-Abgleich

Die Umsetzung trennt Zielwert, Laufzeitevidenz und UI-Projektion. Das entspricht dem SRE-Prinzip, SLO-Ziele aus beobachtbaren Ereignissen abzuleiten statt Sollzustände als Istzustand auszugeben. Für spätere externe Telemetrie bleiben OpenTelemetry-konforme, eindeutig benannte und sinnvoll aggregierbare Metriken der bevorzugte Pfad; P1 führt dafür noch keinen zusätzlichen Telemetrie-Stack ein.

## 9. Tests / Negative Assurance

P1 deckt mindestens ab:

- exakt 24 reale evidence-backed Assets → `AVAILABLE`;
- 23 bleiben 23 → `INSUFFICIENT_REAL_UNIVERSE`;
- `READY` ohne Provider/Evidence-ID → `EVIDENCE_INSUFFICIENT`;
- Provider-Timeout/-Unavailable → `PROVIDER_DEGRADED`;
- Unterkategorien werden unabhängig mit Ziel 24 bewertet;
- Screening-Governance liefert `universeSla`, ohne Score zu ändern;
- UI behält den vorhandenen 24-Kandidaten-Scope;
- Batch-Anfragen bleiben bei höchstens 50 Symbolen und verhindern stilles Server-Truncation;
- Browserpfad importiert nicht den serverseitigen Scoring-Barrel/`node:crypto`;
- keine Random-/Synthetic-Fill-Logik.

## 10. Offene Folgepunkte

P1 misst reale Verfügbarkeit; es garantiert nicht künstlich, dass jede Klasse/Unterkategorie sofort 24 zugelassene Assets erreicht. Reale Shortfalls müssen anschließend provider-/mapping-/evidence-spezifisch ausgewertet werden.

Ein späterer Schritt darf eine persistente Availability-Historie oder OpenTelemetry-Metriken ergänzen, aber nur durch Wiederverwendung der bestehenden Screening-/Telemetry-Authority und nach separatem Precheck. Eine Datenbank oder ein periodischer Warmup wird in P1 bewusst nicht eingeführt.

## 11. Validierungsstatus

- P0 CI vor P1: **PASS**;
- P1 statischer Architektur-/Scope-Check: **PASS**;
- erste P1-CI: **TypeScript PASS**;
- erste P1-CI: **Unit Tests PASS — 283 Testdateien bestanden, 1713 Tests bestanden, 2 Tests übersprungen**;
- erste P1-CI: **Production Build FAIL ausschließlich an Browser-/Server-Barrel-Grenze (`node:crypto`)**;
- gezielter Import-Grenzfix ohne neue Dependency: **implementiert**;
- Regressionstest gegen erneuten serverseitigen Barrel-Import: **implementiert**;
- finaler P1 TypeScript-/Unit-/Build-/CSP-/Deployment-Readiness-Lauf auf Fix-Head: **ausstehend**;
- finaler Main-/Open-PR-Sync vor Merge-Bereitschaft: **ausstehend**.
