# CAPITAL-AI Vocabulary Governance Migration Roadmap

Status: Active  
Datum / Date: 2026-08-10  
Authority: ESS-0001-CONTRACTS  
Related: ESS-0012, ESS-0017, ESS-0017-CONTRACTS, ADR-0046  
CI Cost Governance: `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`

## Deutsch

### Zielbild
Naming, Wording, Dokumentation, Traceability und Governance werden als zusammenhängender, ereignisbasierter Teil der CAPITAL-AI Wertschöpfungskette betrieben. Code bleibt Englisch; Enterprise-Dokumentation wird Deutsch und Englisch geführt; menschlich sichtbare Pull-Request-Informationen werden Deutsch geführt.

### Phase 0 — Baseline und Schutz — COMPLETE
- aktuellen main-Stand, offene PRs und Production Baseline prüfen;
- bestehende ESS/ADR/Events/Knowledge/Documentary/Traceability/Validatoren inventarisieren;
- keine aktiven Renames;
- bekannte PR-Template/Validator-Abweichungen zuerst beheben.

Exit-Kriterium: Baseline dokumentiert, Scope konfliktfrei, technische Governance konsistent.

### Phase 1 — Governance Foundation — COMPLETE
- PR-Template auf deutsche sichtbare Informationen umstellen;
- PR-Validator atomar auf dieselben Überschriften/Marker aktualisieren;
- maschinenlesbare Keys stabil halten;
- Vocabulary-/Naming-Governance als eigenes Vorhaben von bestehender Documentation Governance abgrenzen.

Exit-Kriterium: PR-Governance und Vocabulary-Regeln sind deterministisch validierbar.

### Phase 1.5 — Authority- und Nummernraum-Konsolidierung — COMPLETE
- PR #142 als Dokumentationsbaseline übernehmen;
- `ESS-0012` und `ESS-0012-CONTRACTS` unverändert als Documentation Governance erhalten;
- `ESS-0017` als eigenständige Vocabulary Governance einführen und registrieren;
- `ESS-0017-CONTRACTS` als Vocabulary-spezifischen Contract-Teil einführen und registrieren;
- `ADR-0046` als Authority-/Nummernraumentscheidung verwenden;
- nächsten freien ESS-Nummernraum auf `ESS-0018` setzen;
- frühere Vocabulary-Verwendungen der bereits belegten IDs `ESS-0012`, `ADR-0044` und `ADR-0045` als Authority korrigieren;
- zulässige `ESS-0012`-Referenzen ausschließlich als Documentation-Governance-Abhängigkeit beibehalten;
- Legacy-Dokumente aus PR #142 nicht als kanonische Vocabulary-Quelle verwenden, solange sie nicht gegen aktuellen Code und Authorities revalidiert wurden.

Exit-Kriterium: Documentation Governance und Vocabulary Governance besitzen eindeutige Authorities und Cross-References. Erfüllt.

### Phase 2 — Canonical Vocabulary Registry — COMPLETE
Authority: `ESS-0017` / `ESS-0017-CONTRACTS`.

Implementiert unter `src/platform/Vocabulary/` mit typed Concepts, stabilen Concept IDs, englischen `canonicalCodeTerm`-Werten, gemeinsamen DE/EN-Bezeichnungen, Alias-/Forbidden-Term-Governance, Collision Detection, immutable Registry Snapshots, öffentlicher Registry-Schnittstelle und Contract-Tests.

Die Registry integriert sich in die bestehende Architektur und führt keinen zweiten Event Bus, Knowledge Graph oder Traceability Store ein.

Exit-Kriterium: Registry ist Single Source of Truth und besitzt Contract-Tests. Erfüllt durch Merge von PR #145 und erfolgreichen main-CI-/Deploy-Gate.

### Phase 3 — Safe Rename Gate — IN PROGRESS
Ein `validateRenameImpact`-Prozess prüft vor jedem aktiven Rename:
1. Repository references,
2. Import-/Export- und Runtime-Referenzen,
3. dynamic imports/lazy loading,
4. routes/APIs/schemas,
5. config/env references,
6. regex/naming policies,
7. filesystem casing,
8. Canonical Vocabulary Registry,
9. TypeScript/lint,
10. tests,
11. production build,
12. deployment readiness.

Klassifikation: `SAFE` / `CONDITIONAL` / `BLOCKED`.

Der Phase-3-Analyzer ist read-only: Er erzeugt Evidence und führt keine aktiven Renames aus. Zielbegriffe müssen als `approved canonicalCodeTerm` in der Vocabulary Registry registriert sein. Case-only-Renames und sensitive API/Schema/Environment/Dynamic-Import-Flächen werden fail-closed blockiert. Die technische Folgevalidierung bleibt über lint, tests, build und predeploy verpflichtend.

Kosten-/Pipeline-Grenze: Phase 3 führt keinen zusätzlichen Actions-Workflow ein. `rename:validate` läuft als lokaler/read-only Preflight; bestehende CI-Evidence wird gemäß `GITHUB_ACTIONS_BUDGET_POLICY.md` wiederverwendet. Pro PR-Head-SHA bleibt genau ein vollständiger technischer Linux-Lauf zulässig; keine duplizierte npm/Test/Build-Pipeline und keine kosmetischen Re-Runs.

Exit-Kriterium: Kein Rename kann Governance umgehen; Analyzer, Tests und technische Gates sind erfolgreich validiert, ohne die CI-Kostenrichtlinie zu verletzen.

### Phase 4 — Bilingual Documentary Integration
- kanonische Concepts mit Documentary Engine verbinden;
- DE/EN-Dokumentationsansichten aus identischen Concept-IDs ableiten;
- fehlende Übersetzungen als Events behandeln;
- ADR-/ESS-/Traceability-Referenzen sprachneutral halten;
- die in PR #142 klassifizierten Legacy-Dokumente file-by-file in kanonische DE/EN-Zielstrukturen überführen.

Exit-Kriterium: DE und EN können nicht unabhängig semantisch auseinanderlaufen.

### Phase 5 — Event-Driven Value Chain
Zielablauf:

```text
Change/Event
  -> Supervisor
  -> Impact Analysis
  -> Platform Director decision boundary
  -> Vocabulary / Knowledge / Documentary / Traceability
  -> Quality / Security / Compliance
  -> Version Manager
  -> Release validation
```

Vocabulary Events werden ausschließlich über die bestehende Enterprise Event Mesh und deren öffentliche Interfaces geführt. Event Handler müssen idempotent sein. Correlation und causation werden über die gesamte Kette propagiert.

Exit-Kriterium: Relevante Lifecycle-Ereignisse lösen deterministische Folgeaktionen aus.

### Phase 6 — Incremental Existing-Code Migration
- bestehende deutsche oder inkonsistente technische Namen inventarisieren;
- nach Blast Radius priorisieren;
- ausschließlich SAFE-Renames automatisiert vorbereiten;
- CONDITIONAL/BLOCKED als Evidence eskalieren;
- keine Big-Bang-Renaming-Migration;
- Naming-Entscheidungen nicht aus historischen 0.5.4-Dokumenten ableiten, sofern diese nicht revalidiert wurden.

Exit-Kriterium: Naming Debt wird kontrolliert reduziert, ohne Deploy- oder Dependency-Risiken zu erzeugen.

### Phase 7 — Continuous Governance
- Repository-Validator und CI terminologiebewusst machen;
- neue Concepts/Event Types automatisch registrieren und validieren;
- Documentary/Knowledge/Traceability bei Änderungen aktualisieren;
- Drift-Reports und Governance-Evidence erzeugen;
- nicht-kanonische Root-Dokumentation als Drift-Signal prüfen;
- CI-/Actions-Automation muss die zentrale 15-EUR-Budgetrichtlinie einhalten und bestehende Evidence wiederverwenden.

Exit-Kriterium: Neue Ereignisse greifen autonom über die gesamte CAPITAL-AI Wertschöpfungskette ineinander, ohne bestehende Human-Approval-Gates oder CI-Kostengrenzen zu umgehen.

## English

### Target state
Naming, wording, documentation, traceability, and governance operate as one event-driven part of the CAPITAL-AI value chain. Code remains English; enterprise documentation is maintained in German and English; human-facing pull request information is German.

### Migration sequence
0. Baseline and protection — complete.
1. Governance foundation — complete.
1.5. Authority and namespace reconciliation — complete: ESS-0012 remains Documentation Governance; ESS-0017/ESS-0017-CONTRACTS define Vocabulary Governance; ADR-0046 records the decision; the next free ESS number is ESS-0018.
2. Canonical Vocabulary Registry — complete: typed registry merged through PR #145 and validated through the main CI/deploy gate.
3. Safe Rename Gate — in progress: a read-only impact analyzer classifies proposed renames as SAFE, CONDITIONAL or BLOCKED, validates targets against the Canonical Vocabulary Registry, detects sensitive runtime surfaces and preserves mandatory lint/test/build/predeploy evidence. It adds no duplicate Actions workflow and reuses the single CI run permitted by the GitHub Actions budget policy.
4. Bilingual Documentary Integration: derive DE/EN documentation from shared concept identities and migrate PR #142 legacy content file-by-file after revalidation.
5. Event-Driven Value Chain: propagate standardized lifecycle events through the existing Enterprise Event Mesh to Supervisor, Platform Director boundaries, Vocabulary, Knowledge, Documentary, Traceability, Quality, Security, Compliance, Versioning, and Release.
6. Incremental Existing-Code Migration: migrate only evidence-classified SAFE names; avoid big-bang renames.
7. Continuous Governance: enforce terminology and lifecycle consistency through repository validation, CI, events, evidence, legacy-document drift detection and the central CI cost policy.

### Success criteria
- English-only technical naming is enforced for new code.
- DE/EN documentation stays semantically aligned.
- PR information is German while machine fields remain stable.
- Documentation Governance remains unambiguously ESS-0012.
- Vocabulary Governance is unambiguously ESS-0017.
- active renames cannot bypass impact validation.
- terminology and lifecycle events update all relevant governance components through the existing EventMesh.
- automation remains subordinate to existing human approval, protected-change boundaries and CI budget limits.
