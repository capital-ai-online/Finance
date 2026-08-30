# Work Package Pack — VC-H Inventar (Klasse D)

**Document ID:** WP-VC-H-INVENTORY-2026-08-30  
**Status:** INVENTORY COMPLETE / IMPLEMENTATION NOT STARTED  
**Date:** 2026-08-30  
**Evidence-Baseline:** `main@e53b738289f16cbf1951d12b7362dac568763735` (Restore #606)  
**PR-Basis nach Sync:** `main@677a88ca5156b51060e9204aa06b9afdcf4e47b7` (Merge #607, nur S1-Roadmap)  
**PR:** #608  
**Authority projection:** ROADMAP-VC-COV-HARDEN-2026-08-30  
**Class:** D  
**Does not authorize:** Runtime-Code, Merge, Deploy, Provider-Mutation, Scoring-Promotion

Dieses Paket schließt die Inventar-Stufen **PROD-0, SUP-0, VM-0, PD-0, REL-0, DQ-0, EM-0, KG-0** in PR #608.  
Implementierungsstufen `*-1` und höher bleiben eigene spätere Workitems.

---

## Gemeinsame Inventar-Regeln

- Inventarbefunde gegen Evidence-Baseline `main@e53b738`. Merge #607 ändert nur `S1_SECURITY_HARDENING_ROADMAP.md`; Runtime-Befunde bleiben gültig.
- Historical Evidence (ARCH-GAP-0001, Handoff 29.08. auf `fd4c339`) erzeugt keine aktuelle Production-Authority.
- S1-R2 ist nach Merge #607 auf `main`; dieses Paket dupliziert S1 nicht.
- `package.json#version` = `0.6.0` bleibt einzige Plattform-Versionsautorität.
- Registry-Insert für dieses Pack und die Coverage-Roadmap liegt in derselben PR #608 (`docs/governance/document-registry.json`).

---

## PROD-0 — Production / main / Handoff-Identität

| Identität | SHA / Nachweis | Status |
|---|---|---|
| GitHub `main` zum Inventarzeitpunkt | `e53b738289f16cbf1951d12b7362dac568763735` (Merge #606) | EVIDENCE BASELINE |
| GitHub `main` dieser PR-Basis | `677a88ca5156b51060e9204aa06b9afdcf4e47b7` (Merge #607) | CURRENT PR BASE |
| Operations-Handoff 2026-08-29 | bindet Production und `main` an `fd4c33905f45332f6ae11de6b80a6a3c20576c77` | STALE vs. aktuelles main |
| S1-R2 Reassessment (#607 MERGED) | Live-Commit `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`; Restore-main `e53b738`; same-tree nach #606, unterschiedliche Commit-Identitäten | ADVISORY / S1-owned |
| Render Auto-Deploy | AUS (Handoff + S1) | CONFIRMED IN DOCS |
| `/healthz` vs `/readyz` | Liveness vs. fachliches Gate | IMPLEMENTIERT (Handoff §2) |
| RPO / RTO | UNVERIFIED | S1-R2-07, nicht dieses WP |
| Gemini-Drift | `render.yaml` / Secret-Manifest vs. „Gemini entfernt“ | OPEN / GOV-CLEANUP, nicht Runtime dieses PR |

**Nächster Code-/Ops-Schritt:** nicht hier. S1-R2-11 übernimmt content-addressed Security-Evidence. PROD-1 = Handoff-Dokument nachziehen.

**Exit PROD-0:** drei Identitäten getrennt benannt; keine Secret-Werte; keine Deploy-Behauptung.

---

## SUP-0 — Supervisor-Inventar vs. ESS-0002

**Pfad:** `src/platform/Supervisor/`  
**README-Status:** Implemented (extended 2026-08-20), Component-Version 1.3.0

| Fähigkeit | Datei / Nachweis | Bewertung |
|---|---|---|
| Task Routing | `supervisor.ts` `routeTask()` | PRESENT |
| Supervised execution / retry | `executeSupervised()` | PRESENT |
| Approved write path | `executeApprovedSupervisedAction()` | PRESENT, policy-gated |
| Agent-Provider-Observation | `agentProviderObservation.ts` ChatGPT/Claude/Grok | PRESENT |
| Documentary observation | `documentaryMaintenanceObservation.ts` | PRESENT, recommendation-only |
| Provider health | `providerHealth.ts` | PRESENT |
| Market integrity runtime | `marketIntegrityRuntime.ts` | PRESENT |
| Finding-Lifecycle Persistenz | README: not implemented | GAP → SUP-1 |
| Digital Twin Blocking | README: not implemented | GAP → später, kein Supervisor-Decide |
| Merge/Deploy/Score-Authority | vertraglich ausgeschlossen | muss SUP-3 negativ testen |

**Nächster Schritt:** SUP-1 Finding-Lifecycle als read-only Projektion (Klasse C), nicht in diesem PR.

---

## VM-0 — Versionsquellen-Inventar

| Quelle | Rolle | Bewertung |
|---|---|---|
| `package.json#version` | einzige Plattform-Versionsautorität, `0.6.0` | CANONICAL |
| `src/platform/VersionManager/` | Compatibility / read-only Adapter auf Release Control Plane | KEINE Authority |
| ESS-0004 | SUSPENDED | nicht reaktivieren |
| `src/platform/Release/Services/platformVersionControlPlane.ts` | kontrolliertes Lesen der Plattformversion | PRESENT |
| `src/platform/Release/clientVersion.ts` | Browser-Projektion `__CAPITAL_AI_VERSION__` | PRESENT |
| `uploads/version_manager.json` / bump-API | retired, fail-closed | RETIRED |
| Component-Manifeste / README-Versionen | eigene Komponentenversionen, nicht Plattformversion | DRIFT-RISIKO → VM-2 |

**Korrektur zur ersten Roadmap-Annahme:** VersionManager ist bereits Compatibility-Namespace. VM-1 ist weitgehend erfüllt; Residual ist Drift-Test Manifest/Doc vs. Plattformversion (VM-2).

---

## PD-0 — Platform-Director-Contract-Inventar

**Pfad:** `src/platform/PlatformDirector/`  
**README-Status:** Development 1.2.0

| Teil | Nachweis | Bewertung |
|---|---|---|
| Decision Contracts | `Contracts/PlatformDecision.ts` | PRESENT |
| Event-Bridge nur für APPROVED Records | `Events/publishPlatformDecision.ts` | PRESENT |
| E6 Protected Decision Boundary | `Policies/ProtectedDecisionBoundary.ts` | PRESENT |
| Entscheidungsfindung / Persistenz | README: außerhalb des Implementierungsschritts | GAP → PD-1 |
| Autonome Approval | ausdrücklich verboten | muss PD-3 negativ testen |

**Nächster Schritt:** PD-1 Decision-Request-Projektion erst nach Owner-ACCEPT dieses Inventars.

---

## REL-0 — Release-Center-Inventar

| Teil | Nachweis | Bewertung |
|---|---|---|
| Platform Version Control Plane | `src/platform/Release/Services/platformVersionControlPlane.ts` | PRESENT |
| Client-Version-Projektion | `clientVersion.ts` | PRESENT |
| Required CI `build-and-test` | Governance/CI, unabhängig vom Release-Modul | PRESENT |
| Auto-Deploy | Render AUS | CONFIRMED IN DOCS |
| Release-Evidence gebunden an productionSHA | nicht durchgängig | GAP → REL-1 |
| Deploy-Auslösung durch Release-Modul | darf nicht existieren | REL-2 Negativtests |

---

## DQ-0 — Data-Quality-Gate-Inventar

| Consumer | Führende Authority | Gate-Erwartung | Lücke |
|---|---|---|---|
| Screening / SPT | SC-MD-SPT-0001 | Missing/stale → kein Neutral-Score | zentrale Negativtests fehlen als gemeinsames Paket |
| Crypto P1-A | FT-CORE-CRYPTO-01 + ADR-0087 | `NOT_COMPUTABLE` bei Missing Evidence | reale Coverage-Evidence offen (Fachroadmap) |
| Commodity SC-2 | SC-2 + ADR-0101/0102 | Challenger `scoreEligible=false` | P3-A Beobachtungsfenster offen (Fachroadmap) |
| Architecture | `docs/architecture/DATENQUALITAETSSCHICHT.md` | DQ ≠ Score | keine eigene DQ-Engine anlegen |

**Nächster Schritt:** DQ-1 gemeinsame Negative Tests (Klasse C). Keine vierte Engine.

---

## EM-0 — Event-Producer-Matrix (Inventar)

| Stufe | Erwartetes Event (Documentary E3 / CHAIN-01) | Ist | Owner |
|---|---|---|---|
| Agent-Client | `DesignProposedEvent` | nicht als produktiver Producer nachgewiesen | CHAIN-01 ehrlich lassen (EM-3) |
| Controlled Implementation | `ImplementationCompletedEvent` | nicht voll verdrahtet | DOC E-stream |
| Supervisor Observation | Observation-Evidence, nicht Decision | vorhanden, Felder nicht durchgängig E3 | SUP-2 / EM-1 |
| Platform Director | `PlatformDecisionEvent` nur nach APPROVED | vorhanden | PD / E6 |
| Documentary | Impact/Maintenance-Evidence | Control Loop vorhanden | DOC |
| EventMesh | Bus / Replay / Versionierung | Modul + E0–E6-Dokumente | kein zweiter Bus |
| `server/systemEvents.ts` | Legacy AUTH/SUBSCRIPTION/… Log | Consumer, nicht ersetzen | EM-1 Adapter only |

**Nächster Schritt:** EM-1 Minimal-Adapter vorhandener Observation auf E3-Felder. Kein neuer Bus.

---

## KG-0 — Knowledge-Quellen-Inventar

| Quelle | Darf Knowledge speisen? | Zustand |
|---|---|---|
| `src/platform/Knowledge/` | Zielmodul | nur README + Manifest |
| `.ai/knowledge/` | vertraglicher Graph-Eingang | leer / nicht als Runtime-Eingang genutzt (CHAIN-02) |
| Vocabulary-Registry ESS-0017 | ja, read-only | CANONICAL terminology |
| `docs/governance/document-registry.json` | ja, approved/reviewed Einträge | ACTIVE; VC-COV-Einträge in PR #608 |
| ADR-Registry | ja, approved ADRs | ACTIVE |
| Scoring / MarketData / Secrets | nein | verboten (KG-3) |

**Nächster Schritt:** KG-1 read-only Index aus approved Registry-Einträgen. Keine Concept-Erzeugung.

---

## Freigabe-Grenze dieses Packs

| WP | Status nach diesem PR | Nächste Klasse |
|---|---|---|
| PROD-0 | INVENTORY DONE in PR #608 | D (PROD-1 Handoff) oder S1-R2-11 |
| SUP-0 | INVENTORY DONE in PR #608 | C SUP-1 |
| VM-0 | INVENTORY DONE in PR #608 | C VM-2 (VM-1 weitgehend erfüllt) |
| PD-0 | INVENTORY DONE in PR #608 | C PD-1 nach Owner-ACCEPT |
| REL-0 | INVENTORY DONE in PR #608 | C REL-1 |
| DQ-0 | INVENTORY DONE in PR #608 | C DQ-1 |
| EM-0 | INVENTORY DONE in PR #608 | C EM-1 |
| KG-0 | INVENTORY DONE in PR #608 | C KG-1 |

Keine dieser Folgestufen ist in PR #608 als Runtime implementiert.
