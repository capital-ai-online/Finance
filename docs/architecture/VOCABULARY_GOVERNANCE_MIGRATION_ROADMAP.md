# CAPITAL-AI Vocabulary Governance Migration Roadmap

Status: Proposed  
Datum / Date: 2026-08-09  
Authority: ESS-0001-CONTRACTS  
Related: ESS-0012, ADR-0044, ADR-0045

## Deutsch

### Zielbild
Naming, Wording, Dokumentation, Traceability und Governance werden als zusammenhängender, ereignisbasierter Teil der CAPITAL-AI Wertschöpfungskette betrieben. Code bleibt Englisch; Enterprise-Dokumentation wird Deutsch und Englisch geführt; menschlich sichtbare Pull-Request-Informationen werden Deutsch geführt.

### Phase 0 — Baseline und Schutz
- aktuellen main-Stand, offene PRs und Production Baseline prüfen;
- bestehende ESS/ADR/Events/Knowledge/Documentary/Traceability/Validatoren inventarisieren;
- keine aktiven Renames;
- bekannte PR-Template/Validator-Abweichungen zuerst beheben.

Exit-Kriterium: Baseline dokumentiert, Scope konfliktfrei, technische Governance konsistent.

### Phase 1 — Governance Foundation
- ESS-0012 einführen;
- ADR-0044 und ADR-0045 verabschieden;
- PR-Template auf deutsche sichtbare Informationen umstellen;
- PR-Validator atomar auf dieselben Überschriften/Marker aktualisieren;
- maschinenlesbare Keys stabil halten.

Exit-Kriterium: PR-Governance und Vocabulary-Regeln sind deterministisch validierbar.

### Phase 2 — Canonical Vocabulary Registry
Vorgesehene Struktur:

```text
src/platform/Vocabulary/
  Domain/
  Registry/
  Services/
  Validators/
  Events/
  Interfaces/
  Types/
```

Jeder Concept-Eintrag enthält mindestens ID, canonicalCodeTerm, displayNameDE, displayNameEN, Definition DE/EN, aliases, forbiddenTerms, category, status und Traceability-Referenzen.

Exit-Kriterium: Registry ist Single Source of Truth und besitzt Contract-Tests.

### Phase 3 — Safe Rename Gate
Ein `validateRenameImpact`-Prozess prüft vor jedem aktiven Rename:
1. Repository references,
2. Import-/Export-Graph,
3. dynamic imports/lazy loading,
4. routes/APIs/schemas,
5. config/env references,
6. regex/naming policies,
7. filesystem casing,
8. TypeScript/lint,
9. tests,
10. production build,
11. deployment readiness.

Klassifikation: SAFE / CONDITIONAL / BLOCKED.

Exit-Kriterium: Kein Rename kann Governance umgehen.

### Phase 4 — Bilingual Documentary Integration
- kanonische Concepts mit Documentary Engine verbinden;
- DE/EN-Dokumentationsansichten aus identischen Concept-IDs ableiten;
- fehlende Übersetzungen als Events behandeln;
- ADR-/ESS-/Traceability-Referenzen sprachneutral halten.

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

Event Handler müssen idempotent sein. Correlation und causation werden über die gesamte Kette propagiert.

Exit-Kriterium: Relevante Lifecycle-Ereignisse lösen deterministische Folgeaktionen aus.

### Phase 6 — Incremental Existing-Code Migration
- bestehende deutsche oder inkonsistente technische Namen inventarisieren;
- nach Blast Radius priorisieren;
- ausschließlich SAFE-Renames automatisiert vorbereiten;
- CONDITIONAL/BLOCKED als Evidence eskalieren;
- keine Big-Bang-Renaming-Migration.

Exit-Kriterium: Naming Debt wird kontrolliert reduziert, ohne Deploy- oder Dependency-Risiken zu erzeugen.

### Phase 7 — Continuous Governance
- Repository-Validator und CI terminologiebewusst machen;
- neue Concepts/Event Types automatisch registrieren und validieren;
- Documentary/Knowledge/Traceability bei Änderungen aktualisieren;
- Drift-Reports und Governance-Evidence erzeugen.

Exit-Kriterium: Neue Ereignisse greifen autonom über die gesamte CAPITAL-AI Wertschöpfungskette ineinander, ohne bestehende Human-Approval-Gates zu umgehen.

## English

### Target state
Naming, wording, documentation, traceability, and governance operate as one event-driven part of the CAPITAL-AI value chain. Code remains English; enterprise documentation is maintained in German and English; human-facing pull request information is German.

### Migration sequence
0. Baseline and protection: inventory current contracts, components, PR state, production baseline, and validators; do not rename active code.
1. Governance foundation: establish ESS-0012, ADR-0044, ADR-0045, and synchronized German PR template validation.
2. Canonical Vocabulary Registry: implement a typed registry as the single source of truth.
3. Safe Rename Gate: require dependency, regex, casing, type, test, build, and deployment-readiness evidence before renames.
4. Bilingual Documentary Integration: derive DE/EN documentation from shared concept identities.
5. Event-Driven Value Chain: propagate standardized lifecycle events through Supervisor, Platform Director boundaries, Vocabulary, Knowledge, Documentary, Traceability, Quality, Security, Compliance, Versioning, and Release.
6. Incremental Existing-Code Migration: migrate only evidence-classified SAFE names; avoid big-bang renames.
7. Continuous Governance: enforce terminology and lifecycle consistency through repository validation, CI, events, and evidence.

### Success criteria
- English-only technical naming is enforced for new code.
- DE/EN documentation stays semantically aligned.
- PR information is German while machine fields remain stable.
- active renames cannot bypass impact validation.
- terminology and lifecycle events update all relevant governance components.
- automation remains subordinate to existing human approval and protected-change boundaries.
