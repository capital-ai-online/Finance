# CAPITAL-AI Value-Chain Coverage and Hardening Roadmap

**Document ID:** ROADMAP-VC-COV-HARDEN-2026-08-30  
**Version:** 1.0.0  
**Status:** ACTIVE — COVERAGE MAP + GAP HARDENING ONLY  
**Date:** 2026-08-30  
**Repository baseline:** `main@e53b738289f16cbf1951d12b7362dac568763735`  
**Open PR correlation:** #607 touches only `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` (no file overlap with this program)  
**Owner:** CAPITAL-AI Owner  
**Document role:** `roadmap` (nicht authority)  
**Primary projection of:** ARCH-CHAIN-0001 (`docs/architecture/AI_VALUE_CHAIN_VALIDATION.md`), ADR-0087, ESS-0001…ESS-0013, AUTH-GOV-DEVELOPMENT-CHAIN-STATUS  
**Does not authorize:** Merge, Deploy, Provider-Mutation, Scoring-Promotion, M10-Reaktivierung, neue ESS-/ADR-Nummern

---

## 0. Zweck und Schutzgrenzen

Dieses Dokument leistet zwei Dinge und sonst nichts:

1. **Coverage-Map:** Jede Stufe der operativen CAPITAL-AI-Wertschöpfungskette und der Finanz-/Scoring-Kette wird einer bestehenden Roadmap, einem Work Package oder einer dokumentierten Lücke zugeordnet.
2. **Gap-Hardening:** Nur Stufen **ohne** eigene ausführbare Roadmap erhalten hier Härtungs- und Erweiterungspakete.

Es erzeugt **keine zweite Wertschöpfungskette**, keine zweite Scoring-Authority und kein paralleles Security-Programm. Wo eine Fachroadmap existiert, bleibt sie ausführungsführend. Historische Gap-Reports (ARCH-GAP-0001) dürfen nur zitiert werden, wenn der Befund gegen `main@e53b738` noch gilt; viele ARCH-GAP-Befunde sind durch spätere PRs überholt.

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

---

## 1. Kanonische Ketten

### 1.1 Operative Kette (ARCH-CHAIN-0001 / ESS-0001 Kap. 17, Provider-Korrektur 2026-08-16)

```text
1  Agent-Client                 ChatGPT | Claude | Grok
2  Controlled Implementation    scoped Branch + Work-Claim
3  Documentary Engine           Evidence-Sidecar / Hygiene
4  Supervisor                   read-only / recommendation only
5  Platform Director            ADR-0006, keine autonome Mutation
6  Version Manager              Projektion von package.json#version
7  Release                      CI + Manifest, kein Auto-Deploy
8  Production                   separates Owner-Gate
```

### 1.2 Finanz-/Scoring-Kette (ADR-0087)

```text
UAI Identity
  → Evidence Acquisition
  → Evidence / Data-Quality Gate
  → Feature Contract
  → ScoringModelRegistry
  → ScoringDispatcher              ← einzige produktive Scoring-Authority
  → Domain Executor Adapter
  → CanonicalScoreResult
  → Ranking / Eligibility
  → EventMesh / Traceability / Supervisor
```

`fintech-value-chain-quality/1.0.0` bleibt read-only Quality-Projektion.

---

## 2. Coverage-Map — operative Kette

| Stufe | Eigene Roadmap? | Führendes Artefakt | Code-Stand `main@e53b738` | Bewertung | Handlung dieses Programms |
|---|---|---|---|---|---|
| 1 Agent-Client | Ja (Phasen) | `INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`, `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`, ESS-0019 | Provider-Profile ChatGPT/Claude/Grok kanonisch; Google AI Studio retired | COVERED | nur Verweis |
| 2 Controlled Implementation | Ja | `DEVELOPMENT_CHAIN_ROADMAP.md`, `AGENTS.md`, DEVELOPMENT Chain Execution Policy | Work-Claims, PR-Template 1.5.0, Human-Merge | COVERED | nur Verweis |
| 3 Documentary Engine | Ja | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` + ADR-0097 Control Loop | Engine teilweise; Maintenance-Loop vorhanden; Knowledge-Eingang lückenhaft | COVERED / PARTIAL | Lücken bleiben bei DOC; hier nur Cross-Ref |
| 4 Supervisor | **Nein** | ESS-0002 Skill + `src/platform/Supervisor/*` | Runtime: routing, supervised execution, provider observation, documentary observation, market integrity | **GAP** | **VC-H-SUP** |
| 5 Platform Director | **Nein** | ESS-0003, ADR-0006 | `Contracts/`, `Events/`, `Policies/`, README, Manifest — kein Entscheidungs-Runtime-Kern | **GAP** | **VC-H-PD** |
| 6 Version Manager | **Nein** (ESS-0004 suspended) | D0 in Documentary-Roadmap; `src/platform/VersionManager/*` | `platformVersionAuthority.ts`, `versionManager.ts`, Convention-Validator vorhanden | **GAP / PARTIAL** | **VC-H-VM** |
| 7 Release | **Nein** | ESS-0007 Skill | `clientVersion.ts` + `Services/` — Release-Center nicht vollautomatisiert | **GAP / PARTIAL** | **VC-H-REL** |
| 8 Production | Teilweise (S1 + Handoff) | `S1_SECURITY_HARDENING_ROADMAP.md` (#607), `docs/runbooks/OPERATIONS_HANDOFF_2026-08-29.md` | main nach #606 restored; Live-Commit-Identität weicht von main-SHA; Auto-Deploy AUS | PARTIAL — Security/Ops führen | **VC-H-PROD** nur Identitäts-/Handoff-Korrelation, keine zweite Security-Roadmap |

---

## 3. Coverage-Map — Finanz-/Scoring-Kette

| Stufe | Eigene Roadmap / WP? | Führendes Artefakt | Bewertung | Handlung dieses Programms |
|---|---|---|---|---|
| UAI Identity | Ja | SC-2 WP `SC-2_MODEL_REGISTRY_UAI.md`, Auth-WPs 2026-08-29, ESS-0020 | COVERED | Verweis; Auth-Statussync bleibt Fach-WP |
| Evidence Acquisition | Ja | SPT-Roadmap, FT-CORE-CRYPTO-01, SC-2 Commodity | COVERED / PARTIAL (reale Provider-Evidence offen) | keine neue Roadmap |
| Data-Quality Gate | Teilweise | `docs/architecture/DATENQUALITAETSSCHICHT.md` + SPT | Architecture ja, keine eigenständige DQ-Roadmap | **VC-H-DQ** (Fail-closed, keine Neutral-Defaults) |
| Feature Contract | Ja | SPT + Crypto P1-A Contract-Foundations (#597/#598/#600) | COVERED | Verweis |
| ScoringModelRegistry | Ja | ADR-0087, SC-2 | COVERED | Verweis |
| ScoringDispatcher | Ja | SC-2 Canonical Dispatcher Evidence | COVERED | Verweis — Authority nicht verdoppeln |
| Domain Executor | Ja | SPT / FinTechCore / Commodity Challenger | COVERED | Challenger bleiben `scoreEligible=false` |
| CanonicalScoreResult | Ja | SPT + ADR-0087 | COVERED | Verweis |
| Ranking / Eligibility | Ja | SC-7 WPs + Frontend Ranking-Projektion | COVERED | keine zweite Ranking-Berechnung |
| EventMesh | Teilweise | Documentary E0–E6, `EVENTMESH_E0_E3_*`, `EVENTMESH_E2_E5_*`, `EVENT_VALUE_CHAIN_E6_*` | Architecture + Teil-Roadmap in DOC; kein eigenes EventMesh-Programm | **VC-H-EM** nur fehlende Producer-Events aus CHAIN-01 |
| Traceability | Teilweise | ESS-0011, Documentary D5, `docs/traceability/*` | PARTIAL | in VC-H-EM / DOC belassen |
| Knowledge Platform | **Nein** | ESS-0009; `src/platform/Knowledge/` nur README+Manifest | **GAP** | **VC-H-KG** |
| Quality-Projektion | Teilweise | Quality-Center-Architektur, Skill Engine | PARTIAL, read-only | kein neues Programm; Folgearbeit bleibt Quality-owned |

---

## 4. Was ausdrücklich nicht neu aufgesetzt wird

| Thema | Grund |
|---|---|
| S1 / S1-R2 | eigene aktive Roadmap, offener PR #607 |
| SEO-GM, Frontend BB-2D, Crypto FT-*, Commodity P3-A | eigene Fachroadmaps |
| M9-Drills, SA5, M10-On, FT-7, Model-Promotion | blockiert ohne neue Owner-Anweisung |
| ESS-0004 Version Manager als neue Authority | Dokument **suspended**; Plattformversion bleibt `package.json#version` |
| Zweite EventMesh- oder Scoring-Implementierung | ADR-0087 / ESS-0013 |

---

## 5. Gap-Hardening-Pakete

Jedes Paket ist ein eigenes späteres Workitem. Dieses Dokument implementiert **keinen** Runtime-Code.

Gemeinsame DoD-Regeln:

- Exact-SHA-Evidence gegen dann-aktuelles `main`
- Positive + Negative Tests, sobald Code entsteht
- Klasse D für reine Doku, C/R nur bei nachgewiesenem Code-Scope
- Klasse M nur bei Owner-Mutation-Proposal
- Kein Self-Merge

### VC-H-SUP — Supervisor Hardening (ESS-0002)

**Ist**

- Implementiert: `supervisor.ts`, `routeTask` / `executeSupervised`, `observeAgentProviderChain`, Documentary-Observation, Provider-Health, Market-Integrity-Runtime.
- ARCH-CHAIN-0001: Kernpfad High; voller ESS-0002 Finding-Lifecycle und Digital-Twin-Blocking offen.
- Supervisor bleibt recommendation-only.

**Schwachstellen / Erweiterungen**

1. Finding-Lifecycle (open / accepted / mitigated / verified) ist nicht durchgängig persistiert.
2. Digital Twin darf den Supervisor nicht zur Entscheidungsinstanz machen; Blocking-Regeln fehlen als Testvertrag.
3. Observation-Events haben nicht durchgängig Suffix `Event`, `correlationId`, `schemaVersion` (CHAIN-01 / Documentary E3).
4. Keine eigene Roadmap → Drift zwischen Skill, README und Runtime.

**Arbeitspakete**

| ID | Inhalt | Klasse | Abhängigkeit |
|---|---|---|---|
| SUP-0 | Inventory Ist-Funktion vs. ESS-0002 Kapitel | D | keine |
| SUP-1 | Finding-Lifecycle als read-only Projektion + Tests | C | SUP-0 |
| SUP-2 | Observation-Payload an Event-Contract E3 angleichen, ohne neuen Bus | C | VC-H-EM-0 |
| SUP-3 | Negative Tests: Supervisor kann Merge/Deploy/Score nicht auslösen | C | SUP-1 |

**Exit:** Supervisor-Roadmap-Bedarf erfüllt durch dieses Paket; keine Entscheidungsautorität entstanden.

### VC-H-PD — Platform Director Hardening (ESS-0003 / ADR-0006)

**Ist**

- Verzeichnisgerüst: Contracts, Events, Policies, README, Manifest.
- Kein ausführbarer Director-Kern nachgewiesen.

**Schwachstellen / Erweiterungen**

1. Stufe 5 der operativen Kette ist vertraglich definiert, runtime aber nicht verdrahtet.
2. Risiko: Agenten behandeln Chat-Empfehlungen als Director-Freigabe.
3. Policies liegen lokal und sind nicht an Authority-Registry gebunden.

**Arbeitspakete**

| ID | Inhalt | Klasse | Abhängigkeit |
|---|---|---|---|
| PD-0 | Contract-Inventar: welche Decisions existieren, wer darf sie fällen | D | keine |
| PD-1 | Read-only Decision-Request-Projektion (Antrag, nicht Freigabe) | C | PD-0 |
| PD-2 | Binding an Owner-/Human-Gate; Director gibt nur Routing-Empfehlung | C | PD-1 |
| PD-3 | Negative Tests: keine Secret-, Deploy-, Billing- oder Score-Mutation | C | PD-2 |

**Exit:** Director ist nachvollziehbare Empfehlungsstufe, keine zweite Owner-Instanz.

### VC-H-VM — Version Manager Projection Hardening

**Ist**

- ESS-0004 Enterprise Version Manager ist **suspended**.
- Runtime: `platformVersionAuthority.ts`, `versionManager.ts`, Convention-Validator.
- Kanonische Plattformversion: `package.json#version` = `0.6.0`.
- Documentary D0 fordert Anbindung, ersetzt aber nicht `package.json`.

**Schwachstellen / Erweiterungen**

1. Historischer Vierfach-Drift (ARCH-GAP-019) ist teilweise geheilt; Residualrisiko: Manifeste/README vs. Plattformversion.
2. Rollback-Artefakte je Release sind nicht als Version-Manager-Vertrag testhaft geführt.
3. Gefahr, ESS-0004 still zu reaktivieren.

**Arbeitspakete**

| ID | Inhalt | Klasse |
|---|---|---|
| VM-0 | Quelleninventar: package.json, VersionManager, Manifeste, README, ADR-History | D |
| VM-1 | Projektionsvertrag: VersionManager liest nur `package.json#version` | C |
| VM-2 | Drift-Test: abweichende Manifest-/Doc-Versionen werden als Drift gemeldet, nicht still überschrieben | C |
| VM-3 | Keine Reaktivierung von ESS-0004 ohne Owner-ADR | D |

**Exit:** Eine Plattformversionsautorität; Version Manager bleibt Projektion.

### VC-H-REL — Release Center Hardening (ESS-0007)

**Ist**

- `src/platform/Release/clientVersion.ts` + `Services/`.
- CI/Required Check `build-and-test` existiert unabhängig.
- Kein automatisches Render-Deploy.

**Schwachstellen / Erweiterungen**

1. Release-Evidence ist nicht durchgängig an Production-SHA und `package.json#version` gebunden.
2. Client-Version vs. Plattformversion kann divergieren.
3. Release darf Production nicht implizit schalten.

**Arbeitspakete**

| ID | Inhalt | Klasse |
|---|---|---|
| REL-0 | Inventory Release-Services vs. ESS-0007 | D |
| REL-1 | Release-Evidence-Contract: version + mainSHA + (optional) productionSHA | C |
| REL-2 | Negativ: Release-Modul löst kein Deploy aus | C |
| REL-3 | Anbindung an Documentary Release-Evidence (DOC D-stream), keine zweite Pipeline | C |

**Exit:** Release erzeugt Evidence, keine Produktionsmutation.

### VC-H-PROD — Production Identity Correlation

**Ist**

- Operations-Handoff bindet einen älteren Production-SHA.
- PR #606 restored main auf verifizierten Render-Stand (`e53b738`).
- S1-R2-11 (#607) fordert content-addressed Security-Evidence — das bleibt S1-owned.
- `/healthz` = Liveness, `/readyz` = fachliches Gate.

**Schwachstellen / Erweiterungen**

1. Drei Identitäten (Live, main, Handoff) sind nicht in einem Value-Chain-Artefakt gebunden.
2. Gemini-Konfigurationsreste in Deploy-Manifesten vs. retired Provider-Set.
3. RPO/RTO bleiben UNVERIFIED — das bleibt S1-R2-07, hier nur Verweis.

**Arbeitspakete**

| ID | Inhalt | Klasse | Abgrenzung |
|---|---|---|---|
| PROD-0 | Evidence-Datei: `productionCommit` / `mainCommit` / `handoffCommit` | D | keine Secret-Werte |
| PROD-1 | Handoff-Dokument gegen aktuellen Stand korrelieren | D | S1 bleibt Security-Owner |
| PROD-2 | Gemini-Drift als Cleanup-Vorschlag, keine stille Manifest-Mutation | D | ADR-0088/0089/0090 prüfen |
| PROD-3 | Deploy weiterhin Owner-Gate; dieses Paket deployt nicht | — | hart |

**Exit:** Identitäten nachvollziehbar; keine neue Production-Authority.

### VC-H-DQ — Data-Quality Gate Hardening (Finanzkette)

**Ist**

- Architektur: `DATENQUALITAETSSCHICHT.md`.
- Ausführung verteilt auf SPT / Crypto / Commodity.
- Neutral-Default-Verbot ist gesetzt, aber nicht als eigene DQ-Roadmap testhaft zentralisiert.

**Schwachstellen / Erweiterungen**

1. DQ-Confidence darf Score nicht ersetzen.
2. Stale/Missing Evidence muss `NOT_COMPUTABLE` bleiben.
3. Challenger (Commodity, Meme/DeFi) dürfen DQ nicht als Promotion-Tür nutzen.

**Arbeitspakete**

| ID | Inhalt | Klasse |
|---|---|---|
| DQ-0 | Gate-Inventar über SPT/Crypto/Commodity | D |
| DQ-1 | Gemeinsame Negative Tests: missing/stale/partial → kein Neutral-Score | C |
| DQ-2 | Keine neue DQ-Engine; nur Contract-Tests gegen bestehende Gates | C |

**Exit:** Ein Gate-Verhalten, drei Consumer, keine vierte Engine.

### VC-H-EM — EventMesh / Traceability Producer-Lücken

**Ist**

- EventMesh-Modul und E0–E6-Dokumente existieren.
- CHAIN-01: Agent-Stufe erzeugt kein `DesignProposedEvent`; Implementation kein volles `ImplementationCompletedEvent`.
- Documentary E-stream bleibt führend für Event-Verträge.

**Schwachstellen / Erweiterungen**

1. Wertschöpfungskette ist nicht end-to-end event-getrieben.
2. Gefahr eines zweiten Busses neben `server/systemEvents.ts` / EventMesh.

**Arbeitspakete**

| ID | Inhalt | Klasse | Abgrenzung |
|---|---|---|---|
| EM-0 | Producer/Consumer-Matrix gegen E0, nur Inventar | D | DOC E0 führt |
| EM-1 | Minimal-Adapter: vorhandene Supervisor-/Documentary-Observation auf E3-Felder | C | kein neuer Bus |
| EM-2 | Traceability-Query für eine Korrelations-ID (read-only) | C | ESS-0011 |
| EM-3 | Keine DesignProposedEvent-Fiktion ohne echten Producer | D | CHAIN-01 ehrlich lassen |

**Exit:** Lücken benannt oder verdrahtet; Documentary bleibt Event-Vertragsowner.

### VC-H-KG — Knowledge Platform Foundation (ESS-0009)

**Ist**

- `src/platform/Knowledge/` enthält README + Manifest.
- `.ai/knowledge/` historisch leer bzw. nicht als Graph-Eingang genutzt (CHAIN-02).
- Documentary D6/D7 beschreiben die zulässige Projektion.

**Schwachstellen / Erweiterungen**

1. Knowledge-Graph-Eingang fehlt — Controlled Implementation arbeitet ohne vertraglichen Input.
2. Risiko einer zweiten Terminology- oder Documentary-Authority.

**Arbeitspakete**

| ID | Inhalt | Klasse |
|---|---|---|
| KG-0 | Inventar: welche Registries dürfen Knowledge speisen (Vocabulary, Document-Registry, ADR-Registry) | D |
| KG-1 | Read-only Index aus approved Registry-Einträgen, keine Concept-Erzeugung | C |
| KG-2 | Documentary D6 anbinden: nur `approved` Dokumente | C |
| KG-3 | Negativ: Knowledge schreibt keine ADRs/ESS/Scores | C |

**Exit:** Knowledge ist befüllbare Projektion; ESS-0017 bleibt Terminology-Owner.

---

## 6. Empfohlene Reihenfolge

```text
VC-H-PROD-0     Production/main/Handoff-Identität (Doku)
VC-H-SUP-0      Supervisor-Inventar
VC-H-VM-0       Versionsquellen-Inventar
VC-H-PD-0       Director-Contract-Inventar
VC-H-DQ-0       DQ-Gate-Inventar
VC-H-EM-0       Event-Producer-Matrix
VC-H-KG-0       Knowledge-Quellen-Inventar
        ↓
VC-H-SUP-1/3    Finding-Lifecycle + Negative Tests
VC-H-VM-1/2     Versionsprojektion + Drift-Tests
VC-H-DQ-1       NOT_COMPUTABLE-Tests
        ↓
VC-H-PD-1/2     Decision-Request (nach Owner-ACCEPT des Inventars)
VC-H-REL-1      Release-Evidence-Contract
VC-H-EM-1/2     Observation → Event-Felder / Trace-Query
VC-H-KG-1/2     Read-only Knowledge-Index
```

P0 bleibt S1-R2 (#607) und Operations-Handoff außerhalb dieses Programms, aber vor Runtime-Härtung der Stufen 7/8.

---

## 7. Architektur-Einbindung (verbindlich)

| Artefakt | Rolle |
|---|---|
| Diese Datei | ausführbare Gap-Roadmap + Coverage-Map |
| `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | Portfolio-Zeile `VC-COV` |
| `docs/evidence/governance/VC_COV_DOCUMENT_REGISTRY_ENTRY_2026-08-30.json` | vorgeschlagener Registry-Eintrag `DOC-ROADMAP-VC-COV-HARDEN-2026-08-30` (Insert in `document-registry.json` bei Review) |
| `.ai/work-claims/VALUE-CHAIN-COVERAGE-HARDENING-2026-08-30.json` | Koordinations-Claim |
| ARCH-CHAIN-0001 | Validierungsquelle, nicht ersetzt |
| ADR-0087 / SPT / S1 / DOC | bleiben Fachautoritäten |

Keine neue ADR-Nummer in diesem PR. Keine ESS-Nummer. Keine Authority-Registry-Mutation, solange keine neue AUTH reserviert ist.

---

## 8. Programm-Exit

Das Coverage-Programm ist geschlossen, wenn:

1. jede Kettenstufe hat genau einen führenden Ausführungsowner (diese Roadmap oder Fachroadmap);
2. VC-H-SUP/PD/VM/REL/PROD/DQ/EM/KG sind `VERIFIED`, `DEFERRED` mit Owner-Datum oder an die Fachroadmap übergeben;
3. keine zweite Scoring-, Event-, Versions- oder Merge-Authority entstanden ist;
4. Master-Index und Document-Registry denselben Pfad und dieselbe Version nennen;
5. Historical Evidence nicht als aktuelle Production-Authority zitiert wird.

---

## 9. Version History

| Version | Datum | Beschreibung |
|---|---|---|
| 1.0.0 | 2026-08-30 | Erstaufnahme Coverage-Map gegen `main@e53b738`; Gap-Pakete für Stufen ohne eigene Roadmap |
