# Phase 7 — Continuous Vocabulary Governance

Status: IMPLEMENTED IN DRAFT  
Date: 2026-08-10  
Authority: ESS-0017 / ESS-0017-CONTRACTS  
Foundation: Phase 6 / PR #155 / main `4b1fc07c70626fabfd968301f3fb6773ebf05b7c`

## Deutsch

### Ziel
Phase 7 macht Vocabulary Governance zu einer kontinuierlichen, fail-closed Repository-Funktion. Sie verbindet die bestehende Canonical Vocabulary Registry mit Repository-Validierung, CI, Documentary/Knowledge/Traceability-Evidence und Lifecycle-Ereignissen, ohne eine zweite Authority oder einen zweiten EventMesh einzuführen.

### 7.0 Continuous Repository Gate
`ContinuousGovernanceValidator` scannt governte Quell-, Konfigurations- und Dokumentationsartefakte deterministisch gegen die `forbiddenTerms` der bestehenden Registry. Phase-6-Evidence-Dateien werden als historische Migrationsnachweise explizit ausgenommen. Findings sind maschinenlesbar und blockieren im Strict Gate.

### 7.1 CI Integration Contract
`scripts/automation/validateContinuousVocabularyGovernance.ts` stellt einen dedizierten, kostengünstigen Validator bereit. Er ist für die bestehende CI vorgesehen und benötigt keinen zusätzlichen Workflow oder Runner. Die zentrale GitHub-Actions-Budgetrichtlinie bleibt bindend.

### 7.2 Lifecycle Evidence
`GovernanceLifecycleEvent` definiert einen kleinen, transportneutralen Evidence-Contract für `CONCEPT_REGISTERED` und `CONCEPT_REJECTED`. Der Contract trägt Concept-ID, canonical term, Status, Authority- und Traceability-Referenzen. Er trifft keine autonome Governance-Entscheidung und ersetzt nicht den bestehenden EventMesh.

### 7.3 Documentary / Knowledge / Traceability
Continuous Governance erzeugt keine unabhängigen semantischen Identitäten. Concept-ID und Authority-Referenzen bleiben die verbindende Identität für Documentary-, Knowledge- und Traceability-Projektionen. Dadurch können diese Consumer später an denselben Lifecycle-Contract angebunden werden, ohne Registry-Duplikation.

### 7.4 Regression Protection
Unit-Tests verifizieren Forbidden-Term-Blocking, canonical-term acceptance und immutable Lifecycle Evidence. Bestehende Phase-3/6-Rename-Gates bleiben unverändert und vorrangig für aktive Migrationen.

### 7.5 Schutzgrenzen
- keine autonome Freigabe neuer Concepts;
- keine automatische Rename-Mutation;
- keine zweite Vocabulary Registry;
- kein zweiter EventMesh;
- keine Mutation an Stripe, Supabase, Render, APIs, DB-Schemas oder ENV Keys;
- keine zusätzliche GitHub-Actions-Vollpipeline;
- Human Approval und bestehende Protected-Change-Grenzen bleiben bindend.

### Exit-Kriterien
- [x] kontinuierlicher Vocabulary-Validator implementiert;
- [x] maschinenlesbarer CI-Einstiegspunkt implementiert;
- [x] Lifecycle-Evidence-Contract implementiert;
- [x] Documentary/Knowledge/Traceability-Identitätsregeln dokumentiert;
- [x] Regressionstests implementiert;
- [ ] Draft-PR-CI erfolgreich;
- [ ] Merge und main-CI-/Docker-/Render-Gate erfolgreich.

## English
Phase 7 turns Vocabulary Governance into a continuous fail-closed repository capability. The canonical registry remains the single authority. A repository validator detects forbidden terminology, a low-cost CI entry point exposes the gate, and a transport-neutral lifecycle evidence contract carries stable concept, authority and traceability identities. No autonomous approval, automatic rename, second registry, second event mesh or external-platform mutation is introduced.
