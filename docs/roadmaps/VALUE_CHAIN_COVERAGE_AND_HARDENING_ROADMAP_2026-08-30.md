# CAPITAL-AI Value-Chain Coverage and Hardening Roadmap

**Document ID:** ROADMAP-VC-COV-HARDEN-2026-08-30  
**Version:** 1.0.1  
**Status:** ACTIVE — COVERAGE MAP + GAP HARDENING ONLY  
**Date:** 2026-08-30  
**Evidence-Baseline:** `main@e53b738289f16cbf1951d12b7362dac568763735`  
**PR-Basis:** `main@677a88ca5156b51060e9204aa06b9afdcf4e47b7` (Merge #607)  
**Open PR correlation:** Nachfolger von #608. Offener PR #609 (S1-R2-02) ohne Dateiüberschneidung.  
**Owner:** CAPITAL-AI Owner  
**Document role:** `roadmap` (nicht authority)  
**Primary projection of:** ARCH-CHAIN-0001, ADR-0087, ESS-0001…ESS-0013, AUTH-GOV-DEVELOPMENT-CHAIN-STATUS  
**Does not authorize:** Merge, Deploy, Provider-Mutation, Scoring-Promotion, M10-Reaktivierung, neue ESS-/ADR-Nummern

---

## 0. Zweck und Schutzgrenzen

1. **Coverage-Map:** Jede Stufe der operativen und der Finanz-/Scoring-Kette wird einer bestehenden Roadmap oder einer dokumentierten Lücke zugeordnet.
2. **Gap-Hardening:** Nur Stufen **ohne** eigene ausführbare Roadmap erhalten Härtungspakete.

Keine zweite Wertschöpfungskette, keine zweite Scoring-Authority, kein paralleles Security-Programm.

```text
Fail-closed
- keine Neutral-Scores bei Missing Evidence
- Supervisor entscheidet nie
- Platform Director mutiert nie autonom
- package.json#version bleibt einzige Plattform-Versionsautorität
- EventMesh autorisiert kein Merge/Release
- Knowledge ist Projektion, keine Wahrheit
- Production-Deploy nur nach separatem Owner-Gate; Render Auto-Deploy AUS
```

## 1. Kanonische Ketten

Operativ (ARCH-CHAIN-0001): Agent-Client → Controlled Implementation → Documentary Engine → Supervisor → Platform Director → Version Manager → Release → Production.

Finanz (ADR-0087): UAI → Evidence → DQ-Gate → Feature Contract → ScoringModelRegistry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → Ranking → EventMesh/Traceability/Supervisor.

## 2. Coverage — operativ

| Stufe | Eigene Roadmap? | Bewertung | Handlung |
|---|---|---|---|
| 1 Agent-Client | Ja | COVERED | Verweis |
| 2 Controlled Implementation | Ja | COVERED | Verweis |
| 3 Documentary Engine | Ja (DOC) | COVERED / PARTIAL | Cross-Ref DOC |
| 4 Supervisor | Nein | GAP | VC-H-SUP |
| 5 Platform Director | Nein | GAP | VC-H-PD |
| 6 Version Manager | Nein (ESS-0004 suspended) | GAP / PARTIAL | VC-H-VM |
| 7 Release | Nein | GAP / PARTIAL | VC-H-REL |
| 8 Production | Teilweise S1 + Handoff | PARTIAL | VC-H-PROD Identität only |

## 3. Coverage — Finanzkette

| Stufe | Bewertung | Handlung |
|---|---|---|
| UAI / Evidence / Feature / Registry / Dispatcher / Executor / CanonicalScore / Ranking | COVERED durch SPT/Crypto/SC-2 | Verweis |
| Data-Quality Gate | PARTIAL | VC-H-DQ |
| EventMesh / Traceability | PARTIAL | VC-H-EM |
| Knowledge Platform | GAP | VC-H-KG |

Nicht neu: S1/#609, SEO-GM, Crypto, Commodity, M9/M10, ESS-0004, zweite Event-/Scoring-Authority.

## 5. Gap-Pakete (Inventar *-0 in diesem PR DONE)

Gemeinsame DoD: Exact-SHA, Klasse D hier, C/R nur mit Code, kein Self-Merge.

| Paket | *-0 | Nächste Klasse-C |
|---|---|---|
| VC-H-SUP | DONE | SUP-1 Finding-Lifecycle; SUP-3 Negativtests |
| VC-H-PD | DONE | PD-1 nach Owner-ACCEPT |
| VC-H-VM | DONE | VM-2 Drift-Test |
| VC-H-REL | DONE | REL-1 Evidence-Contract |
| VC-H-PROD | DONE | PROD-1 Handoff (D) |
| VC-H-DQ | DONE | DQ-1 NOT_COMPUTABLE-Tests |
| VC-H-EM | DONE | EM-1 Adapter, kein neuer Bus |
| VC-H-KG | DONE | KG-1 read-only Index |

Details stehen in `docs/roadmaps/work-packages/VC_H_INVENTORY_PACK_2026-08-30.md`.

## 7. Architektur-Einbindung in diesem PR

| Artefakt | Rolle |
|---|---|
| Diese Datei | Coverage-Map + Gap-Roadmap |
| `VC_H_INVENTORY_PACK_2026-08-30.md` | Inventar-WPs *-0 |
| `docs/governance/document-registry.json` | Insert DOC-ROADMAP-VC-COV-HARDEN-2026-08-30 + DOC-WP-VC-H-INVENTORY-2026-08-30 |
| `VC_COV_DOCUMENT_REGISTRY_ENTRY_2026-08-30.json` | Evidence-Payload |
| `ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | Portfolio-Zeile VC-COV |
| Work-Claim | Koordination |

Keine neue ADR/ESS. Keine Authority-Registry-Mutation.

## 8. Programm-Exit

Geschlossen wenn jede Stufe einen Owner hat, Gap-Pakete VERIFIED/DEFERRED/übergeben sind, keine zweite Authority entstand, Master-Index und Registry denselben Pfad nennen.

## 9. Version History

| Version | Datum | Beschreibung |
|---|---|---|
| 1.0.0 | 2026-08-30 | Erstaufnahme gegen `main@e53b738` |
| 1.0.1 | 2026-08-30 | Nachfolge-PR ersetzt #608; Registry-Insert + Inventar gebunden |
