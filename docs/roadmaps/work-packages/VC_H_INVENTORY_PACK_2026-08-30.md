# Work Package Pack — VC-H Inventar (Klasse D)

**Document ID:** WP-VC-H-INVENTORY-2026-08-30  
**Status:** INVENTORY COMPLETE / IMPLEMENTATION NOT STARTED  
**Date:** 2026-08-30  
**Evidence-Baseline:** `main@e53b738289f16cbf1951d12b7362dac568763735` (Restore #606)  
**PR-Basis:** `main@677a88ca5156b51060e9204aa06b9afdcf4e47b7` (Merge #607, nur S1-Roadmap)  
**PR:** Nachfolger von #608 auf Branch `docs/vc-cov-hardening-2026-08-30-v2`  
**Authority projection:** ROADMAP-VC-COV-HARDEN-2026-08-30  
**Class:** D  
**Does not authorize:** Runtime-Code, Merge, Deploy, Provider-Mutation, Scoring-Promotion

Dieses Paket schließt die Inventar-Stufen **PROD-0, SUP-0, VM-0, PD-0, REL-0, DQ-0, EM-0, KG-0**.  
Implementierungsstufen `*-1` und höher bleiben eigene spätere Workitems.

---

## Gemeinsame Inventar-Regeln

- Inventarbefunde gegen Evidence-Baseline `main@e53b738`. Merge #607 ändert nur `S1_SECURITY_HARDENING_ROADMAP.md`; Runtime-Befunde bleiben gültig.
- Historical Evidence (ARCH-GAP-0001, Handoff 29.08. auf `fd4c339`) erzeugt keine aktuelle Production-Authority.
- S1-R2 ist nach Merge #607 auf `main`; PR #609 härtet S1-R2-02 — dieses Paket dupliziert S1 nicht.
- `package.json#version` = `0.6.0` bleibt einzige Plattform-Versionsautorität.
- Registry-Insert für dieses Pack und die Coverage-Roadmap liegt in demselben Nachfolge-PR.

---

## PROD-0 — Production / main / Handoff-Identität

| Identität | SHA / Nachweis | Status |
|---|---|---|
| GitHub `main` zum Inventarzeitpunkt | `e53b738289f16cbf1951d12b7362dac568763735` (Merge #606) | EVIDENCE BASELINE |
| GitHub `main` dieser PR-Basis | `677a88ca5156b51060e9204aa06b9afdcf4e47b7` (Merge #607) | CURRENT PR BASE |
| Operations-Handoff 2026-08-29 | bindet Production und `main` an `fd4c33905f45332f6ae11de6b80a6a3c20576c77` | STALE vs. aktuelles main |
| S1-R2 Reassessment (#607 MERGED) | Live-Commit `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`; Restore-main `e53b738` | ADVISORY / S1-owned |
| Render Auto-Deploy | AUS (Handoff + S1) | CONFIRMED IN DOCS |
| `/healthz` vs `/readyz` | Liveness vs. fachliches Gate | IMPLEMENTIERT (Handoff §2) |
| RPO / RTO | UNVERIFIED | S1-R2-07, nicht dieses WP |
| Gemini-Drift | `render.yaml` / Secret-Manifest vs. „Gemini entfernt“ | OPEN / GOV-CLEANUP |

**Exit PROD-0:** drei Identitäten getrennt benannt; keine Secret-Werte; keine Deploy-Behauptung.

---

## SUP-0 — Supervisor-Inventar vs. ESS-0002

**Pfad:** `src/platform/Supervisor/` — README Implemented 1.3.0

| Fähigkeit | Nachweis | Bewertung |
|---|---|---|
| Task Routing | `supervisor.ts` `routeTask()` | PRESENT |
| Supervised execution / retry | `executeSupervised()` | PRESENT |
| Approved write path | `executeApprovedSupervisedAction()` | PRESENT, policy-gated |
| Agent-Provider-Observation | `agentProviderObservation.ts` | PRESENT |
| Documentary observation | `documentaryMaintenanceObservation.ts` | PRESENT, recommendation-only |
| Provider health | `providerHealth.ts` | PRESENT |
| Market integrity runtime | `marketIntegrityRuntime.ts` | PRESENT |
| Finding-Lifecycle Persistenz | README: not implemented | GAP → SUP-1 |
| Digital Twin Blocking | README: not implemented | GAP |
| Merge/Deploy/Score-Authority | vertraglich ausgeschlossen | SUP-3 Negativtests |

---

## VM-0 — Versionsquellen-Inventar

| Quelle | Rolle | Bewertung |
|---|---|---|
| `package.json#version` | einzige Plattform-Versionsautorität, `0.6.0` | CANONICAL |
| `src/platform/VersionManager/` | Compatibility / read-only Adapter | KEINE Authority |
| ESS-0004 | SUSPENDED | nicht reaktivieren |
| `platformVersionControlPlane.ts` | kontrolliertes Lesen | PRESENT |
| `clientVersion.ts` | Browser-Projektion | PRESENT |
| bump-API / `uploads/version_manager.json` | retired, fail-closed | RETIRED |
| Component-Manifeste / README-Versionen | nicht Plattformversion | DRIFT-RISIKO → VM-2 |

VM-1 ist weitgehend erfüllt; Residual ist Drift-Test (VM-2).

---

## PD-0 — Platform-Director-Contract-Inventar

**Pfad:** `src/platform/PlatformDirector/` — Development 1.2.0

| Teil | Nachweis | Bewertung |
|---|---|---|
| Decision Contracts | `Contracts/PlatformDecision.ts` | PRESENT |
| Event-Bridge nur für APPROVED Records | `Events/publishPlatformDecision.ts` | PRESENT |
| E6 Protected Decision Boundary | `Policies/ProtectedDecisionBoundary.ts` | PRESENT |
| Entscheidungsfindung / Persistenz | README: außerhalb | GAP → PD-1 |
| Autonome Approval | ausdrücklich verboten | PD-3 Negativtests |

---

## REL-0 — Release-Center-Inventar

| Teil | Nachweis | Bewertung |
|---|---|---|
| Platform Version Control Plane | `platformVersionControlPlane.ts` | PRESENT |
| Client-Version-Projektion | `clientVersion.ts` | PRESENT |
| Required CI `build-and-test` | Governance/CI | PRESENT |
| Auto-Deploy | Render AUS | CONFIRMED IN DOCS |
| Release-Evidence an productionSHA | nicht durchgängig | GAP → REL-1 |
| Deploy-Auslösung durch Release-Modul | darf nicht existieren | REL-2 |

---

## DQ-0 — Data-Quality-Gate-Inventar

| Consumer | Authority | Gate-Erwartung | Lücke |
|---|---|---|---|
| Screening / SPT | SC-MD-SPT-0001 | Missing/stale → kein Neutral-Score | zentrale Negativtests fehlen |
| Crypto P1-A | FT-CORE-CRYPTO-01 + ADR-0087 | `NOT_COMPUTABLE` | Coverage-Evidence Fachroadmap |
| Commodity SC-2 | SC-2 + ADR-0101/0102 | Challenger `scoreEligible=false` | P3-A offen |
| Architecture | `DATENQUALITAETSSCHICHT.md` | DQ ≠ Score | keine vierte Engine |

---

## EM-0 — Event-Producer-Matrix

| Stufe | Erwartetes Event | Ist | Owner |
|---|---|---|---|
| Agent-Client | `DesignProposedEvent` | nicht nachgewiesen | EM-3 / CHAIN-01 |
| Controlled Implementation | `ImplementationCompletedEvent` | nicht voll verdrahtet | DOC E-stream |
| Supervisor Observation | Observation, nicht Decision | vorhanden, Felder nicht durchgängig E3 | SUP-2 / EM-1 |
| Platform Director | `PlatformDecisionEvent` nur nach APPROVED | vorhanden | PD / E6 |
| Documentary | Impact/Maintenance-Evidence | Control Loop vorhanden | DOC |
| EventMesh | Bus / Replay | Modul + E0–E6 | kein zweiter Bus |
| `server/systemEvents.ts` | Legacy-Log | Consumer | EM-1 Adapter only |

---

## KG-0 — Knowledge-Quellen-Inventar

| Quelle | Darf Knowledge speisen? | Zustand |
|---|---|---|
| `src/platform/Knowledge/` | Zielmodul | nur README + Manifest |
| `.ai/knowledge/` | Graph-Eingang | leer / nicht Runtime-Eingang |
| Vocabulary-Registry ESS-0017 | ja, read-only | CANONICAL |
| `docs/governance/document-registry.json` | ja, approved/reviewed | ACTIVE |
| ADR-Registry | ja, approved ADRs | ACTIVE |
| Scoring / MarketData / Secrets | nein | verboten (KG-3) |

---

## Freigabe-Grenze

| WP | Status | Nächste Klasse |
|---|---|---|
| PROD-0 | INVENTORY DONE | D (PROD-1) oder S1-R2-11 |
| SUP-0 | INVENTORY DONE | C SUP-1 |
| VM-0 | INVENTORY DONE | C VM-2 |
| PD-0 | INVENTORY DONE | C PD-1 nach Owner-ACCEPT |
| REL-0 | INVENTORY DONE | C REL-1 |
| DQ-0 | INVENTORY DONE | C DQ-1 |
| EM-0 | INVENTORY DONE | C EM-1 |
| KG-0 | INVENTORY DONE | C KG-1 |

Keine Folgestufe ist in diesem PR als Runtime implementiert.
